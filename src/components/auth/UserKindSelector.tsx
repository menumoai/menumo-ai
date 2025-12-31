// src/components/auth/UserKindSelector.tsx
import type { AppUserKind } from "../../models/profile";

interface UserKindSelectorProps {
    value: AppUserKind;
    onChange: (kind: AppUserKind) => void;
}

export function UserKindSelector({ value, onChange }: UserKindSelectorProps) {
    return (
        <fieldset className="mt-2 rounded-md border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                I want to use Menumo as
            </legend>
            <div className="mt-1 flex flex-col gap-1">
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="userKind"
                        value="customer"
                        checked={value === "customer"}
                        onChange={() => onChange("customer")}
                        className="h-3 w-3 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 dark:text-slate-200">
                        Customer – browse food trucks and place orders
                    </span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="userKind"
                        value="business_owner"
                        checked={value === "business_owner"}
                        onChange={() => onChange("business_owner")}
                        className="h-3 w-3 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 dark:text-slate-200">
                        Food truck owner – manage my truck’s menu and orders
                    </span>
                </label>
            </div>
        </fieldset>
    );
}
