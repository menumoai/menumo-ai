import { defineConfig, loadEnv } from 'vite'
import type { Connect, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { generateCompanionSuggestions } from './api/companion'

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

async function handleCompanion(
  req: Connect.IncomingMessage,
  res: Parameters<Connect.NextHandleFunction>[1],
  apiKey: string,
): Promise<void> {
  const send = (status: number, payload: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  }

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

function readJsonBody(
  req: Connect.IncomingMessage,
): Promise<{ context?: unknown; summary?: unknown } | null> {
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Third arg '' loads ALL env vars (not just VITE_-prefixed) from .env files,
  // so the server-side ANTHROPIC_API_KEY is available here without being bundled
  // into the client.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), companionDevApi(env.ANTHROPIC_API_KEY ?? '')],
  }
})
