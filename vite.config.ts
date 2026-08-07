import { defineConfig, loadEnv } from 'vite'
import type { Connect, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { generateCompanionSuggestions } from './api/companion'
import { extractReceipt, isSupportedMediaType } from './api/ocr'
import {
  DEFAULT_BILLING_INTERVAL,
  isBillingInterval,
  isPlanId,
} from './src/config/plans'
import { HttpError } from './api/_firebaseAdmin'
import { resolveBaseUrl } from './api/_http'
import { createCheckoutSession } from './api/create-checkout-session'
import { createPortalSession } from './api/create-portal-session'
import { loadPlanCatalog } from './api/plans'
import { processWebhook, readRawBody } from './api/stripe-webhook'

// Dev-only shim: Vite's dev server does not run files under `api/`, so without
// this `npm run dev` would never hit the companion endpoint. This middleware
// serves `/api/companion` with the same logic the Vercel function uses, reading
// ANTHROPIC_API_KEY from the (non-VITE_) env. Production uses `api/companion.ts`.
function companionDevApi(apiKey: string): PluginOption {
  return {
    name: 'companion-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        '/api/companion',
        (req: Connect.IncomingMessage, res) => {
          void handleCompanion(req, res, apiKey)
        },
      )
    },
  }
}

// Dev-only shim for the OCR endpoint, mirroring `api/ocr.ts`.
function ocrDevApi(apiKey: string): PluginOption {
  return {
    name: 'ocr-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        '/api/ocr',
        (req: Connect.IncomingMessage, res) => {
          void handleOcr(req, res, apiKey)
        },
      )
    },
  }
}

// Dev-only shim for the public plan catalog, mirroring `api/plans.ts`.
//
// Deliberately sends no Cache-Control. Production caches this hard at the edge,
// but the point of the endpoint is that a Dashboard edit shows up without a
// deploy, and the way anyone will check that is by changing a price and
// reloading. A five-minute cache in dev would make the feature look broken.
function plansDevApi(): PluginOption {
  return {
    name: 'plans-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        '/api/plans',
        (req: Connect.IncomingMessage, res) => {
          void handlePlans(req, res)
        },
      )
    },
  }
}

async function handlePlans(
  req: Connect.IncomingMessage,
  res: Parameters<Connect.NextHandleFunction>[1],
): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    sendJson(res, 200, await loadPlanCatalog())
  } catch (error) {
    console.error('Plan catalog dev request failed', error)
    sendJson(res, 502, { error: 'Could not load plans.' })
  }
}

function sendJson(
  res: Parameters<Connect.NextHandleFunction>[1],
  status: number,
  payload: unknown,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

async function handleCompanion(
  req: Connect.IncomingMessage,
  res: Parameters<Connect.NextHandleFunction>[1],
  apiKey: string,
): Promise<void> {
  const send = (status: number, payload: unknown) => sendJson(res, status, payload)

  if (req.method !== 'POST') {
    send(405, { error: 'Method not allowed' })
    return
  }
  if (!apiKey) {
    send(503, { error: 'AI companion is not configured.' })
    return
  }

  try {
    const body = await readJsonBody(req)
    const context = typeof body?.context === 'string' ? body.context : 'default'
    const summary = body?.summary ?? null
    if (!summary) {
      send(400, { error: 'Missing analytics summary.' })
      return
    }
    const suggestions = await generateCompanionSuggestions({
      context,
      summary,
      apiKey,
    })
    send(200, { suggestions })
  } catch (error) {
    console.error('AI companion dev request failed', error)
    send(500, { error: 'Failed to generate suggestions.' })
  }
}

async function handleOcr(
  req: Connect.IncomingMessage,
  res: Parameters<Connect.NextHandleFunction>[1],
  apiKey: string,
): Promise<void> {
  const send = (status: number, payload: unknown) => sendJson(res, status, payload)

  if (req.method !== 'POST') {
    send(405, { error: 'Method not allowed' })
    return
  }
  if (!apiKey) {
    send(503, { error: 'OCR is not configured.' })
    return
  }

  try {
    const body = await readJsonBody(req)
    const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : ''
    const mediaType = body?.mediaType
    if (!imageBase64) {
      send(400, { error: 'Missing image data.' })
      return
    }
    if (!isSupportedMediaType(mediaType)) {
      send(400, { error: 'Unsupported image type.' })
      return
    }
    const receipt = await extractReceipt({ imageBase64, mediaType, apiKey })
    send(200, { receipt })
  } catch (error) {
    console.error('OCR dev request failed', error)
    send(500, { error: 'Failed to read the receipt.' })
  }
}

// Dev-only shims for the three subscription endpoints, mirroring the Vercel
// functions in `api/`. Each delegates to the same exported function the
// production handler calls, so the only thing duplicated here is request
// plumbing.
function subscriptionDevApi(): PluginOption {
  return {
    name: 'subscription-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        '/api/create-checkout-session',
        (req: Connect.IncomingMessage, res) => {
          void handleCheckout(req, res)
        },
      )
      server.middlewares.use(
        '/api/create-portal-session',
        (req: Connect.IncomingMessage, res) => {
          void handlePortal(req, res)
        },
      )
      server.middlewares.use(
        '/api/stripe-webhook',
        (req: Connect.IncomingMessage, res) => {
          void handleWebhook(req, res)
        },
      )
    },
  }
}

function sendHttpError(
  res: Parameters<Connect.NextHandleFunction>[1],
  error: unknown,
  fallback: string,
) {
  if (error instanceof HttpError) {
    sendJson(res, error.status, { error: error.message })
    return
  }
  console.error(fallback, error)
  sendJson(res, 500, { error: fallback })
}

async function handleCheckout(
  req: Connect.IncomingMessage,
  res: Parameters<Connect.NextHandleFunction>[1],
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const body = (await readJsonBody(req)) ?? {}
    const accountId = typeof body.accountId === 'string' ? body.accountId : ''
    const planId: unknown = body.planId
    const rawInterval: unknown = body.interval

    if (!isPlanId(planId)) {
      sendJson(res, 400, { error: 'Unknown plan.' })
      return
    }

    // Mirrors api/create-checkout-session.ts exactly. The two handlers exist so
    // dev and production behave the same; a laxer check here would mean an
    // interval bug that only ever shows up after deploy.
    if (rawInterval !== undefined && !isBillingInterval(rawInterval)) {
      sendJson(res, 400, { error: 'Unknown billing interval.' })
      return
    }

    const url = await createCheckoutSession({
      authorization: req.headers.authorization,
      accountId,
      planId,
      interval: rawInterval ?? DEFAULT_BILLING_INTERVAL,
      baseUrl: resolveBaseUrl(req.headers.origin),
    })
    sendJson(res, 200, { url })
  } catch (error) {
    sendHttpError(res, error, 'Could not start checkout.')
  }
}

async function handlePortal(
  req: Connect.IncomingMessage,
  res: Parameters<Connect.NextHandleFunction>[1],
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const body = (await readJsonBody(req)) ?? {}
    const url = await createPortalSession({
      authorization: req.headers.authorization,
      accountId: typeof body.accountId === 'string' ? body.accountId : '',
      baseUrl: resolveBaseUrl(req.headers.origin),
    })
    sendJson(res, 200, { url })
  } catch (error) {
    sendHttpError(res, error, 'Could not open billing settings.')
  }
}

// Reads the body as raw bytes rather than JSON. Stripe signs the exact payload,
// so parsing it first - as the other two shims do - would break every signature.
async function handleWebhook(
  req: Connect.IncomingMessage,
  res: Parameters<Connect.NextHandleFunction>[1],
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const signature = req.headers['stripe-signature']
  const result = await processWebhook(
    await readRawBody(req),
    typeof signature === 'string' ? signature : undefined,
    process.env.STRIPE_WEBHOOK_SECRET,
  )
  sendJson(res, result.status, result.body)
}

function readJsonBody(
  req: Connect.IncomingMessage,
): Promise<Record<string, unknown> | null> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null)
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

/**
 * The `api/` modules read their secrets from `process.env` directly so the same
 * code runs unchanged on Vercel. `loadEnv` reads .env files without touching
 * `process.env`, so dev needs this bridge. Existing shell values win, which
 * keeps `stripe listen`'s exported webhook secret authoritative over a stale
 * one in .env.local.
 */
function applyServerEnv(env: Record<string, string>) {
  const serverKeys = [
    'STRIPE_SECRET_KEY',
    // Optional read-only key for the public catalog endpoint. See
    // getCatalogStripe in api/_stripe.ts.
    'STRIPE_CATALOG_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FIREBASE_SERVICE_ACCOUNT',
    'FIREBASE_PROJECT_ID',
    // Read by _firebaseAdmin as the project fallback when running on
    // Application Default Credentials, which carry no project of their own.
    'VITE_FIREBASE_PROJECT_ID',
    'APP_URL',
  ]
  for (const key of serverKeys) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key]
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Third arg '' loads ALL env vars (not just VITE_-prefixed) from .env files,
  // so the server-side ANTHROPIC_API_KEY is available here without being bundled
  // into the client.
  const env = loadEnv(mode, process.cwd(), '')
  applyServerEnv(env)

  return {
    plugins: [
      react(),
      companionDevApi(env.ANTHROPIC_API_KEY ?? ''),
      ocrDevApi(env.ANTHROPIC_API_KEY ?? ''),
      subscriptionDevApi(),
      plansDevApi(),
    ],
  }
})
