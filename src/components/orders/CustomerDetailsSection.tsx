// src/components/orders/CustomerDetailsSection.tsx
import type { FC } from "react";

interface CustomerDetailsSectionProps {
    customerName: string;
    customerPhone: string;
    onNameChange: (value: string) => void;
    onPhoneChange: (value: string) => void;
}

export const CustomerDetailsSection: FC<CustomerDetailsSectionProps> = ({
    customerName,
    customerPhone,
    onNameChange,
    onPhoneChange,
}) => {
    return (
        <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Your details
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Name (optional)
                    </label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                        placeholder="Your name"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Phone (optional)
                    </label>
                    <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                        placeholder="555-123-4567"
                    />
                </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Your details help us contact you about your order. You can also leave
                this blank if you’re ordering in person.
            </p>
        </section>
    );
};
