// src/pages/InventoryPage.tsx
import { useMemo, useRef, useState } from "react";
import { Boxes } from "lucide-react";

import { useAccount } from "../account/AccountContext";
import { useInventory } from "../hooks/useInventory";
import { computeInventorySummary } from "../analysis/inventory";
import { summarizeBatchRisk } from "../analysis/shelfLife";
import { recordInventoryEvent } from "../services/inventoryEvent";
import { setProductReorderPoint } from "../services/product";
import {
    extractReceiptFromImage,
    OcrRequestError,
    type ExtractedReceipt,
} from "../services/ocrClient";
import { logReceivedInventory } from "../services/receiptIntake";
import {
    InventoryHero,
    InventoryStats,
} from "../components/inventory/InventoryStats";
import {
    RecordMovementCard,
    type RecordMovementInput,
} from "../components/inventory/RecordMovementCard";
import { StockLevelsTable } from "../components/inventory/StockLevelsTable";
import { MovementHistory } from "../components/inventory/MovementHistory";
import { ScanReceiptButton } from "../components/inventory/ScanReceiptButton";
import {
    ReceiptReviewDialog,
    type ReceiptConfirmPayload,
} from "../components/inventory/ReceiptReviewDialog";
import { ExpiringBatchesCard } from "../components/inventory/ExpiringBatchesCard";
import { formatMoney } from "../components/inventory/format";

export default function InventoryPage() {
    const { accountId, account } = useAccount();
    const { products, events, batches, loading, error, reload } =
        useInventory(accountId);

    const [selectedProductId, setSelectedProductId] = useState("");
    const formRef = useRef<HTMLDivElement>(null);

    // Receipt OCR flow state.
    const [scanning, setScanning] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [receipt, setReceipt] = useState<ExtractedReceipt | null>(null);
    const [receiptImage, setReceiptImage] = useState<File | null>(null);
    const [savingReceipt, setSavingReceipt] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionNotice, setActionNotice] = useState<string | null>(null);

    const accountName = account?.name ?? accountId ?? "your account";

    const summary = useMemo(
        () => computeInventorySummary(products),
        [products]
    );

    const batchRisk = useMemo(() => summarizeBatchRisk(batches), [batches]);

    const formProducts = useMemo(
        () =>
            products
                .filter((p) => p.isActive !== false)
                .sort((a, b) => a.name.localeCompare(b.name)),
        [products]
    );

    async function handleRecord(input: RecordMovementInput) {
        if (!accountId) return;
        await recordInventoryEvent({ accountId, ...input });
        await reload();
    }

    async function handleSetReorderPoint(
        productId: string,
        reorderPoint: number | null
    ) {
        if (!accountId) return;
        await setProductReorderPoint(accountId, productId, reorderPoint);
        await reload();
    }

    function focusProductInForm(productId: string) {
        setSelectedProductId(productId);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    async function handleScanReceipt(file: File) {
        setActionError(null);
        setActionNotice(null);
        setScanning(true);
        try {
            const extracted = await extractReceiptFromImage(file);
            if (extracted.lineItems.length === 0) {
                setActionError(
                    "No items were read from that image. Try a clearer, well-lit photo."
                );
                return;
            }
            setReceipt(extracted);
            setReceiptImage(file);
            setReviewOpen(true);
        } catch (caught) {
            console.error("Receipt OCR failed", caught);
            setActionError(
                caught instanceof OcrRequestError
                    ? caught.message
                    : "Could not read that receipt. Please try again."
            );
        } finally {
            setScanning(false);
        }
    }

    async function handleConfirmReceipt(payload: ReceiptConfirmPayload) {
        if (!accountId) return;
        setSavingReceipt(true);
        setActionError(null);
        try {
            await logReceivedInventory({ accountId, ...payload });
            setReviewOpen(false);
            setReceipt(null);
            setReceiptImage(null);
            setActionNotice(
                `Logged ${payload.lines.length} item${
                    payload.lines.length === 1 ? "" : "s"
                } to inventory.`
            );
            await reload();
        } catch (caught) {
            console.error("Failed to log received inventory", caught);
            setActionError(
                "Could not save these items. Your changes were not logged."
            );
        } finally {
            setSavingReceipt(false);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <Boxes className="h-5 w-5 text-white" />
                            </div>

                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Inventory
                            </h1>
                        </div>

                        <p className="text-gray-600">
                            Track stock and movements for{" "}
                            <span className="font-medium text-gray-900">
                                {accountName}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ScanReceiptButton
                            onSelect={handleScanReceipt}
                            loading={scanning}
                            disabled={!accountId}
                        />
                        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 text-right shadow-sm">
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                                On-hand value
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatMoney(summary.totalValue)}
                            </div>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {actionError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {actionError}
                    </div>
                ) : null}

                {actionNotice ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {actionNotice}
                    </div>
                ) : null}

                {/* Hero */}
                <InventoryHero summary={summary} accountName={accountName} />

                {/* Quick Stats */}
                <InventoryStats summary={summary} />

                {/* Expiring batches (from OCR'd receipts) */}
                <ExpiringBatchesCard summary={batchRisk} products={products} />

                {/* Record Movement */}
                <div ref={formRef} className="scroll-mt-24">
                    <RecordMovementCard
                        products={formProducts}
                        selectedProductId={selectedProductId}
                        onSelectProduct={setSelectedProductId}
                        onRecord={handleRecord}
                        disabled={!accountId}
                    />
                </div>

                {/* Stock Levels */}
                <StockLevelsTable
                    rows={summary.rows}
                    loading={loading}
                    onSelectProduct={focusProductInForm}
                    onSetReorderPoint={handleSetReorderPoint}
                />

                {/* Movement History */}
                <MovementHistory
                    events={events}
                    products={products}
                    loading={loading}
                />
            </div>

            <ReceiptReviewDialog
                open={reviewOpen}
                receipt={receipt}
                imageFile={receiptImage}
                products={products}
                saving={savingReceipt}
                onClose={() => {
                    if (savingReceipt) return;
                    setReviewOpen(false);
                    setReceipt(null);
                    setReceiptImage(null);
                }}
                onConfirm={handleConfirmReceipt}
            />
        </div>
    );
}
