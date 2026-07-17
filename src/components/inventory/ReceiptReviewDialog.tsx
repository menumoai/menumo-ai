// src/components/inventory/ReceiptReviewDialog.tsx
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import type { Product, StockUnit } from "../../models/product";
import type { PerishableCategory } from "../../models/inventoryBatch";
import type { ExtractedReceipt } from "../../services/ocrClient";
import type { ReceiptIntakeLine } from "../../services/receiptIntake";
import {
    defaultShelfLifeDays,
    computeExpiresAt,
} from "../../analysis/shelfLife";
import {
    PERISHABLE_CATEGORIES,
    PERISHABLE_CATEGORY_LABELS,
    STOCK_UNITS,
    STOCK_UNIT_LABELS,
} from "./meta";
import { formatMoney } from "./format";

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 " +
    "outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

const labelClass = "mb-1 block text-xs font-medium text-gray-600";

const NEW_PRODUCT = "__new__";

export interface ReceiptConfirmPayload {
    supplierName: string;
    transactionDate?: Date;
    totalAmount: number;
    currency?: string;
    ocrText?: string;
    imageFile?: File | null;
    lines: ReceiptIntakeLine[];
}

interface EditableRow {
    key: string;
    rawText: string;
    itemName: string;
    /** Product id, or NEW_PRODUCT to create a new one from itemName. */
    productId: string;
    quantity: string;
    unit: StockUnit;
    unitCost: string;
    category: PerishableCategory;
    shelfLifeDays: string;
    include: boolean;
}

function toDateInputValue(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse a "YYYY-MM-DD" value as LOCAL midnight. `new Date("YYYY-MM-DD")` parses
 * as UTC, which then shifts back a day when read/written with local getters and
 * setters (getDate, setHours, toLocaleDateString) in negative-UTC timezones -
 * off by one for US users. Building the Date from local parts keeps the picked
 * day stable through the whole seed -> preview -> save round trip.
 */
function parseDateInput(value: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!m) return null;
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function parseReceiptDate(iso: string): Date {
    return parseDateInput(iso) ?? new Date();
}

function normalizeUnit(unit: string): StockUnit {
    return (STOCK_UNITS as string[]).includes(unit)
        ? (unit as StockUnit)
        : "each";
}

/** Case-insensitive best-effort match of an extracted name to a product. */
function matchProductId(itemName: string, products: Product[]): string {
    const name = itemName.trim().toLowerCase();
    if (!name) return NEW_PRODUCT;
    const exact = products.find((p) => p.name.trim().toLowerCase() === name);
    if (exact) return exact.id;
    const partial = products.find((p) => {
        const pn = p.name.trim().toLowerCase();
        return pn.includes(name) || name.includes(pn);
    });
    return partial ? partial.id : NEW_PRODUCT;
}

function buildRows(receipt: ExtractedReceipt, products: Product[]): EditableRow[] {
    return receipt.lineItems.map((item, index) => {
        const category = item.suggestedCategory;
        return {
            key: `${index}-${item.rawText}`,
            rawText: item.rawText,
            itemName: item.itemName || item.rawText,
            productId: matchProductId(item.itemName, products),
            quantity: item.quantity > 0 ? String(item.quantity) : "",
            unit: normalizeUnit(item.unit),
            unitCost: item.unitCost > 0 ? String(item.unitCost) : "",
            category,
            shelfLifeDays: String(defaultShelfLifeDays(category)),
            include: true,
        };
    });
}

function buildOcrText(receipt: ExtractedReceipt): string {
    const header = [
        receipt.supplierName ? `Supplier: ${receipt.supplierName}` : "",
        receipt.transactionDate ? `Date: ${receipt.transactionDate}` : "",
    ].filter(Boolean);
    const lines = receipt.lineItems.map((l) => l.rawText).filter(Boolean);
    const footer = receipt.totalAmount ? [`Total: ${receipt.totalAmount}`] : [];
    return [...header, ...lines, ...footer].join("\n");
}

interface ReceiptReviewDialogProps {
    open: boolean;
    receipt: ExtractedReceipt | null;
    imageFile: File | null;
    products: Product[];
    saving: boolean;
    onClose: () => void;
    onConfirm: (payload: ReceiptConfirmPayload) => void;
}

export function ReceiptReviewDialog({
    open,
    receipt,
    imageFile,
    products,
    saving,
    onClose,
    onConfirm,
}: ReceiptReviewDialogProps) {
    const [initedFor, setInitedFor] = useState<ExtractedReceipt | null>(null);
    const [supplierName, setSupplierName] = useState("");
    const [dateStr, setDateStr] = useState(toDateInputValue(new Date()));
    const [rows, setRows] = useState<EditableRow[]>([]);

    // Seed the editable form whenever a new receipt arrives. Done during render
    // (React's recommended "adjust state on prop change" pattern) rather than in
    // an effect, so a fresh scan resets the form without an extra render pass or
    // clobbering the owner's edits on unrelated re-renders.
    if (receipt && receipt !== initedFor) {
        setInitedFor(receipt);
        setSupplierName(receipt.supplierName);
        setDateStr(toDateInputValue(parseReceiptDate(receipt.transactionDate)));
        setRows(buildRows(receipt, products));
    }

    // Close on Escape while the dialog is open.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !saving) onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, saving, onClose]);

    const sortedProducts = useMemo(
        () =>
            [...products]
                .filter((p) => p.isActive !== false)
                .sort((a, b) => a.name.localeCompare(b.name)),
        [products]
    );

    const baseDate = useMemo(
        () => parseDateInput(dateStr) ?? new Date(),
        [dateStr]
    );

    function updateRow(key: string, patch: Partial<EditableRow>) {
        setRows((prev) =>
            prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
        );
    }

    // When the category changes, reset shelf life to the new category default.
    function changeCategory(key: string, category: PerishableCategory) {
        updateRow(key, {
            category,
            shelfLifeDays: String(defaultShelfLifeDays(category)),
        });
    }

    const includedRows = rows.filter(
        (r) => r.include && Number(r.quantity) > 0 && r.itemName.trim()
    );
    const canConfirm = !saving && includedRows.length > 0;

    function handleConfirm() {
        if (!canConfirm || !receipt) return;

        const transactionDate = new Date(baseDate);
        transactionDate.setHours(12, 0, 0, 0);

        const lines: ReceiptIntakeLine[] = includedRows.map((r) => {
            const quantity = Number(r.quantity);
            const unitCostNum = Number(r.unitCost);
            const unitCost =
                Number.isFinite(unitCostNum) && unitCostNum > 0
                    ? unitCostNum
                    : undefined;
            const daysNum = Number(r.shelfLifeDays);
            const shelfLifeDays =
                Number.isFinite(daysNum) && daysNum > 0
                    ? daysNum
                    : defaultShelfLifeDays(r.category);

            return {
                product:
                    r.productId && r.productId !== NEW_PRODUCT
                        ? { kind: "existing", productId: r.productId }
                        : {
                              kind: "new",
                              name: r.itemName.trim(),
                              stockUnit: r.unit,
                              cost: unitCost,
                          },
                quantity,
                unit: STOCK_UNIT_LABELS[r.unit],
                unitCost,
                perishableCategory: r.category,
                shelfLifeDays,
            };
        });

        onConfirm({
            supplierName: supplierName.trim(),
            transactionDate,
            totalAmount: receipt.totalAmount,
            currency: receipt.currency,
            ocrText: buildOcrText(receipt),
            imageFile,
            lines,
        });
    }

    if (!open || !receipt) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Review receipt"
        >
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !saving && onClose()}
            />

            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2
                            className="text-lg font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Review received stock
                        </h2>
                        <p className="text-sm text-gray-500">
                            {receipt.lineItems.length} item
                            {receipt.lineItems.length === 1 ? "" : "s"} read from your
                            receipt. Check them, then log to inventory.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => !saving && onClose()}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Supplier</label>
                            <input
                                className={inputClass}
                                value={supplierName}
                                placeholder="e.g. Restaurant Depot"
                                onChange={(e) => setSupplierName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Log date</label>
                            <input
                                className={inputClass}
                                type="date"
                                value={dateStr}
                                onChange={(e) => setDateStr(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {rows.map((row) => {
                            const days = Number(row.shelfLifeDays);
                            const expiry =
                                Number.isFinite(days) && days > 0
                                    ? computeExpiresAt(baseDate, days)
                                    : null;
                            return (
                                <div
                                    key={row.key}
                                    className={`rounded-xl border p-3 transition ${
                                        row.include
                                            ? "border-gray-200 bg-white"
                                            : "border-gray-100 bg-gray-50 opacity-60"
                                    }`}
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <label className="flex items-center gap-2 text-xs text-gray-500">
                                            <input
                                                type="checkbox"
                                                checked={row.include}
                                                onChange={(e) =>
                                                    updateRow(row.key, {
                                                        include: e.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                            />
                                            <span className="truncate">
                                                {row.rawText || "Line item"}
                                            </span>
                                        </label>
                                        {expiry ? (
                                            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                                                Expires{" "}
                                                {expiry.toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                        <div className="col-span-2">
                                            <label className={labelClass}>Product</label>
                                            <select
                                                className={inputClass}
                                                value={row.productId}
                                                onChange={(e) =>
                                                    updateRow(row.key, {
                                                        productId: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value={NEW_PRODUCT}>
                                                    + New: {row.itemName || "unnamed"}
                                                </option>
                                                {sortedProducts.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Quantity</label>
                                            <input
                                                className={inputClass}
                                                inputMode="decimal"
                                                placeholder="0"
                                                value={row.quantity}
                                                onChange={(e) =>
                                                    updateRow(row.key, {
                                                        quantity: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className={labelClass}>Unit</label>
                                            <select
                                                className={inputClass}
                                                value={row.unit}
                                                onChange={(e) =>
                                                    updateRow(row.key, {
                                                        unit: e.target.value as StockUnit,
                                                    })
                                                }
                                            >
                                                {STOCK_UNITS.map((u) => (
                                                    <option key={u} value={u}>
                                                        {STOCK_UNIT_LABELS[u]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className={labelClass}>
                                                Unit cost ($)
                                            </label>
                                            <input
                                                className={inputClass}
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                value={row.unitCost}
                                                onChange={(e) =>
                                                    updateRow(row.key, {
                                                        unitCost: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className={labelClass}>Category</label>
                                            <select
                                                className={inputClass}
                                                value={row.category}
                                                onChange={(e) =>
                                                    changeCategory(
                                                        row.key,
                                                        e.target.value as PerishableCategory
                                                    )
                                                }
                                            >
                                                {PERISHABLE_CATEGORIES.map((c) => (
                                                    <option key={c} value={c}>
                                                        {PERISHABLE_CATEGORY_LABELS[c]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className={labelClass}>
                                                Shelf life (days)
                                            </label>
                                            <input
                                                className={inputClass}
                                                inputMode="numeric"
                                                value={row.shelfLifeDays}
                                                onChange={(e) =>
                                                    updateRow(row.key, {
                                                        shelfLifeDays: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
                    <div className="text-sm text-gray-500">
                        {includedRows.length} of {rows.length} item
                        {rows.length === 1 ? "" : "s"} · receipt total{" "}
                        <span className="font-medium text-gray-900">
                            {formatMoney(receipt.totalAmount)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => !saving && onClose()}
                            disabled={saving}
                            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!canConfirm}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            {saving ? "Logging…" : "Log to inventory"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
