// src/components/inventory/RecordMovementCard.tsx
import { useMemo, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import type { Product } from "../../models/product";
import type { InventoryEventType } from "../../models/inventoryEventType";
import { MOVEMENT_TYPES, movementMeta } from "./meta";
import { formatQty } from "./format";

const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
    "outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

const labelClass = "mb-1.5 block text-xs font-medium text-gray-600";

function toDateInputValue(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export interface RecordMovementInput {
    productId: string;
    type: InventoryEventType;
    quantityDelta: number;
    unitCost?: number;
    reason?: string;
    occurredAt: Date;
}

interface RecordMovementCardProps {
    products: Product[];
    selectedProductId: string;
    onSelectProduct: (id: string) => void;
    onRecord: (input: RecordMovementInput) => Promise<void>;
    disabled?: boolean;
}

export function RecordMovementCard({
    products,
    selectedProductId,
    onSelectProduct,
    onRecord,
    disabled,
}: RecordMovementCardProps) {
    const [type, setType] = useState<InventoryEventType>("purchase");
    const [adjustDirection, setAdjustDirection] = useState<"add" | "remove">(
        "add"
    );
    const [quantity, setQuantity] = useState("");
    const [unitCost, setUnitCost] = useState("");
    const [reason, setReason] = useState("");
    const [date, setDate] = useState(toDateInputValue(new Date()));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const meta = movementMeta(type);
    const isAdjustment = meta.direction === 0;
    const isPurchase = type === "purchase";

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === selectedProductId) ?? null,
        [products, selectedProductId]
    );

    const qtyNumber = Number(quantity);
    const sign = isAdjustment
        ? adjustDirection === "add"
            ? 1
            : -1
        : meta.direction;
    const delta = Number.isFinite(qtyNumber) ? sign * qtyNumber : 0;

    const currentStock = selectedProduct?.currentStock ?? 0;
    const projectedStock = currentStock + delta;

    const canSubmit =
        !!selectedProductId &&
        Number.isFinite(qtyNumber) &&
        qtyNumber > 0 &&
        !saving &&
        !disabled;

    async function handleSubmit() {
        if (!canSubmit || !selectedProduct) return;

        setSaving(true);
        setError(null);
        try {
            const d = new Date(date);
            d.setHours(12, 0, 0, 0);

            const parsedCost = Number(unitCost);
            await onRecord({
                productId: selectedProductId,
                type,
                quantityDelta: delta,
                unitCost:
                    isPurchase && Number.isFinite(parsedCost) && parsedCost > 0
                        ? parsedCost
                        : undefined,
                reason: reason.trim() || undefined,
                occurredAt: d,
            });

            setQuantity("");
            setUnitCost("");
            setReason("");
        } catch (caught) {
            console.error("Failed to record movement", caught);
            setError("Could not record this movement. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600" />
                <h2
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Record Stock Movement
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className={labelClass}>Product</label>
                    <select
                        className={inputClass}
                        value={selectedProductId}
                        onChange={(e) => onSelectProduct(e.target.value)}
                    >
                        <option value="">Select a product…</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                                {p.sku ? ` (${p.sku})` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Movement type</label>
                    <select
                        className={inputClass}
                        value={type}
                        onChange={(e) =>
                            setType(e.target.value as InventoryEventType)
                        }
                    >
                        {MOVEMENT_TYPES.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">{meta.description}</p>
                </div>

                <div>
                    <label className={labelClass}>
                        Quantity{" "}
                        {selectedProduct?.stockUnit
                            ? `(${selectedProduct.stockUnit})`
                            : ""}
                    </label>
                    <div className="flex gap-2">
                        {isAdjustment && (
                            <div className="flex overflow-hidden rounded-xl border border-gray-300">
                                <button
                                    type="button"
                                    onClick={() => setAdjustDirection("add")}
                                    className={`px-3 text-sm font-medium transition ${
                                        adjustDirection === "add"
                                            ? "bg-teal-50 text-teal-700"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                                    aria-pressed={adjustDirection === "add"}
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustDirection("remove")}
                                    className={`border-l border-gray-300 px-3 text-sm font-medium transition ${
                                        adjustDirection === "remove"
                                            ? "bg-red-50 text-red-700"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                                    aria-pressed={adjustDirection === "remove"}
                                >
                                    −
                                </button>
                            </div>
                        )}
                        <input
                            className={inputClass}
                            inputMode="decimal"
                            placeholder="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                </div>

                {isPurchase && (
                    <div>
                        <label className={labelClass}>Unit cost ($, optional)</label>
                        <input
                            className={inputClass}
                            inputMode="decimal"
                            placeholder="e.g. 4.50"
                            value={unitCost}
                            onChange={(e) => setUnitCost(e.target.value)}
                        />
                    </div>
                )}

                <div>
                    <label className={labelClass}>Date</label>
                    <input
                        className={inputClass}
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className={isPurchase ? "md:col-span-2" : ""}>
                    <label className={labelClass}>Note (optional)</label>
                    <input
                        className={inputClass}
                        placeholder="e.g. Restaurant Depot delivery"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {selectedProduct && Number.isFinite(qtyNumber) && qtyNumber > 0 ? (
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <span className="font-medium text-gray-900">
                            {selectedProduct.name}
                        </span>
                        <span className="text-gray-500">
                            {formatQty(currentStock, selectedProduct.stockUnit)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span
                            className={`font-semibold ${
                                projectedStock < 0
                                    ? "text-red-600"
                                    : "text-gray-900"
                            }`}
                        >
                            {formatQty(projectedStock, selectedProduct.stockUnit)}
                        </span>
                    </div>
                ) : (
                    <div className="text-sm text-gray-400">
                        Pick a product and quantity to preview the new on-hand count.
                    </div>
                )}

                <button
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {saving ? "Recording…" : "Record Movement"}
                </button>
            </div>

            {error ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            ) : null}
        </section>
    );
}
