// src/components/inventory/StockLevelsTable.tsx
import { useState } from "react";
import { Boxes, Pencil, PackagePlus } from "lucide-react";
import type { ProductStockRow } from "../../analysis/inventory";
import { StatusBadge } from "./StatusBadge";
import { formatMoney, formatQty, formatQtyValue } from "./format";

interface StockLevelsTableProps {
    rows: ProductStockRow[];
    loading: boolean;
    onSelectProduct: (productId: string) => void;
    onSetReorderPoint: (
        productId: string,
        reorderPoint: number | null
    ) => Promise<void>;
}

function ReorderPointCell({
    row,
    onSetReorderPoint,
}: {
    row: ProductStockRow;
    onSetReorderPoint: (
        productId: string,
        reorderPoint: number | null
    ) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState("");
    const [saving, setSaving] = useState(false);

    function startEditing() {
        setValue(row.reorderPoint != null ? String(row.reorderPoint) : "");
        setEditing(true);
    }

    async function commit() {
        const trimmed = value.trim();
        const parsed = Number(trimmed);
        const next =
            trimmed === "" || !Number.isFinite(parsed) || parsed < 0
                ? null
                : parsed;

        // Nothing changed — just close the editor.
        if (next === (row.reorderPoint ?? null)) {
            setEditing(false);
            return;
        }

        setSaving(true);
        try {
            await onSetReorderPoint(row.product.id, next);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    if (editing) {
        return (
            <input
                autoFocus
                className="w-24 rounded-lg border border-teal-400 bg-white px-2 py-1 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-teal-500"
                inputMode="decimal"
                placeholder="none"
                value={value}
                disabled={saving}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") void commit();
                    if (e.key === "Escape") setEditing(false);
                }}
            />
        );
    }

    return (
        <button
            type="button"
            onClick={startEditing}
            className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-gray-700 transition hover:bg-gray-100"
            title="Set low-stock threshold"
        >
            {row.reorderPoint != null ? (
                formatQty(row.reorderPoint, row.product.stockUnit)
            ) : (
                <span className="text-gray-400">Set threshold</span>
            )}
            <Pencil className="h-3 w-3 text-gray-300 transition group-hover:text-gray-500" />
        </button>
    );
}

export function StockLevelsTable({
    rows,
    loading,
    onSelectProduct,
    onSetReorderPoint,
}: StockLevelsTableProps) {
    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-teal-600" />
                    <h2
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Stock Levels
                    </h2>
                </div>
                <div className="text-sm text-gray-500">
                    {loading ? "Loading…" : `${rows.length} items`}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Product
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                On Hand
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Reorder At
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Value
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => (
                            <tr
                                key={row.product.id}
                                className={`transition-colors hover:bg-gray-50 ${
                                    row.status === "out"
                                        ? "bg-red-50/40"
                                        : row.status === "low"
                                          ? "bg-amber-50/40"
                                          : ""
                                }`}
                            >
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">
                                        {row.product.name}
                                    </div>
                                    {row.product.category ? (
                                        <div className="text-xs text-gray-500">
                                            {row.product.category}
                                        </div>
                                    ) : null}
                                </td>

                                <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-gray-900">
                                    {formatQtyValue(row.currentStock)}
                                    <span className="ml-1 text-xs font-normal text-gray-500">
                                        {row.product.stockUnit ?? "each"}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <ReorderPointCell
                                        row={row}
                                        onSetReorderPoint={onSetReorderPoint}
                                    />
                                </td>

                                <td className="px-4 py-3">
                                    <StatusBadge status={row.status} />
                                </td>

                                <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700">
                                    {formatMoney(row.value)}
                                </td>

                                <td className="px-4 py-3 text-right">
                                    <button
                                        className="inline-flex items-center justify-center rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-50"
                                        onClick={() =>
                                            onSelectProduct(row.product.id)
                                        }
                                    >
                                        <PackagePlus className="mr-1 h-3.5 w-3.5" />
                                        Record
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {!loading && rows.length === 0 ? (
                            <tr>
                                <td
                                    className="px-4 py-10 text-center text-sm text-gray-500"
                                    colSpan={6}
                                >
                                    No tracked products yet. Record a purchase or
                                    set a reorder point to start tracking stock.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
