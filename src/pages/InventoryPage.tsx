// src/pages/InventoryPage.tsx
import { useMemo, useRef, useState } from "react";
import { Boxes } from "lucide-react";

import { useAccount } from "../account/AccountContext";
import { useInventory } from "../hooks/useInventory";
import { computeInventorySummary } from "../analysis/inventory";
import { recordInventoryEvent } from "../services/inventoryEvent";
import { setProductReorderPoint } from "../services/product";
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
import { formatMoney } from "../components/inventory/format";

export default function InventoryPage() {
    const { accountId, account } = useAccount();
    const { products, events, loading, error, reload } = useInventory(accountId);

    const [selectedProductId, setSelectedProductId] = useState("");
    const formRef = useRef<HTMLDivElement>(null);

    const accountName = account?.name ?? accountId ?? "your account";

    const summary = useMemo(
        () => computeInventorySummary(products),
        [products]
    );

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

                    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 text-right shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                            On-hand value
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatMoney(summary.totalValue)}
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {/* Hero */}
                <InventoryHero summary={summary} accountName={accountName} />

                {/* Quick Stats */}
                <InventoryStats summary={summary} />

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
        </div>
    );
}
