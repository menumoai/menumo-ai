import type { AppUserKind } from "../../models/profile";
import { User, Truck } from "lucide-react";

interface UserKindSelectorProps {
    value: AppUserKind;
    onChange: (kind: AppUserKind) => void;
}

export function UserKindSelector({ value, onChange }: UserKindSelectorProps) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                I want to use Menumo as
            </label>

            <div className="grid gap-2">
                <button
                    type="button"
                    onClick={() => onChange("customer")}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${value === "customer"
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                >
                    <User className="mt-0.5 h-4 w-4 text-gray-600" />

                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            Customer
                        </div>
                        <p className="text-xs text-gray-600">
                            Browse food trucks and place orders
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onChange("business_owner")}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${value === "business_owner"
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                >
                    <Truck className="mt-0.5 h-4 w-4 text-gray-600" />

                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            Food Truck Owner
                        </div>
                        <p className="text-xs text-gray-600">
                            Manage menu, orders, and operations
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
