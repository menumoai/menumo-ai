// src/components/inventory/StatusBadge.tsx
import type { StockStatus } from "../../analysis/inventory";
import { STATUS_META } from "./meta";

export function StatusBadge({ status }: { status: StockStatus }) {
    const meta = STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.pill}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}
