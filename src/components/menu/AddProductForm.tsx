// src/components/menu/AddProductForm.tsx
import React, { useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import {
    validateProductForm,
    type ProductFieldErrors,
} from "./productFormValidation";

export type AddProductFormValues = {
    name: string;
    price: string;
    cost: string;
    category: string;
    description: string;
};

const INPUT_BASE =
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400";
const INPUT_OK =
    "border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500";
const INPUT_BAD =
    "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500";

function RequiredMark() {
    return (
        <span className="text-red-500" aria-hidden="true">
            {" "}
            *
        </span>
    );
}

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null;
    return (
        <p id={id} className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {message}
        </p>
    );
}

export function AddProductForm(props: {
    values: AddProductFormValues;
    onChange: (next: AddProductFormValues) => void;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
    onCancel?: () => void;
    loading: boolean;
    mode?: "create" | "edit";
}) {
    const { values, onChange, onSubmit, onCancel, loading, mode = "create" } = props;
    const isEditMode = mode === "edit";

    // Errors are only shown once a field has been left, or once submit has been
    // attempted. Nobody wants a form that turns red the moment it opens.
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [attempted, setAttempted] = useState(false);

    const errors: ProductFieldErrors = validateProductForm(values);
    const hasErrors = Object.keys(errors).length > 0;
    const show = (field: keyof AddProductFormValues) =>
        (attempted || touched[field]) && errors[field] ? errors[field] : undefined;

    const markTouched = (field: keyof AddProductFormValues) =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const inputClass = (field: keyof AddProductFormValues) =>
        `${INPUT_BASE} ${show(field) ? INPUT_BAD : INPUT_OK}`;

    // The button stays clickable on purpose. With two required fields, a
    // disabled button cannot say *which* one is missing; submitting reveals
    // every problem at once, right next to the field that caused it.
    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        setAttempted(true);
        if (hasErrors) {
            e.preventDefault();
            return;
        }
        onSubmit(e);
    };

    return (
        <section>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5">
                    <h2
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        {isEditMode ? "Edit Product" : "Add Product"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {isEditMode
                            ? "Update the menu item details and save the changes."
                            : "Quickly add items to your truck’s menu. You can edit or extend this later."}{" "}
                        Fields marked <span className="text-red-500">*</span> are
                        required.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="grid max-w-2xl gap-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <label htmlFor="product-name" className="block text-xs font-medium text-gray-600">
                                Name<RequiredMark />
                            </label>
                            <input
                                id="product-name"
                                type="text"
                                placeholder="Birria Taco"
                                required
                                aria-required="true"
                                aria-invalid={Boolean(show("name"))}
                                aria-describedby={show("name") ? "product-name-error" : undefined}
                                value={values.name}
                                onBlur={() => markTouched("name")}
                                onChange={(e) => onChange({ ...values, name: e.target.value })}
                                className={inputClass("name")}
                            />
                            <FieldError id="product-name-error" message={show("name")} />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="product-price" className="block text-xs font-medium text-gray-600">
                                Price<RequiredMark />
                            </label>
                            <input
                                id="product-price"
                                type="text"
                                inputMode="decimal"
                                placeholder="5.50"
                                required
                                aria-required="true"
                                aria-invalid={Boolean(show("price"))}
                                aria-describedby={show("price") ? "product-price-error" : undefined}
                                value={values.price}
                                onBlur={() => markTouched("price")}
                                onChange={(e) => onChange({ ...values, price: e.target.value })}
                                className={inputClass("price")}
                            />
                            <FieldError id="product-price-error" message={show("price")} />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="product-cost" className="block text-xs font-medium text-gray-600">
                                Cost (optional)
                            </label>
                            <input
                                id="product-cost"
                                type="text"
                                inputMode="decimal"
                                placeholder="2.10"
                                aria-invalid={Boolean(show("cost"))}
                                aria-describedby={show("cost") ? "product-cost-error" : undefined}
                                value={values.cost}
                                onBlur={() => markTouched("cost")}
                                onChange={(e) => onChange({ ...values, cost: e.target.value })}
                                className={inputClass("cost")}
                            />
                            <FieldError id="product-cost-error" message={show("cost")} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-600">
                            Category
                        </label>
                        <input
                            type="text"
                            placeholder="Tacos, Burritos, Drinks..."
                            value={values.category}
                            onChange={(e) => onChange({ ...values, category: e.target.value })}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-600">
                            Description
                        </label>
                        <textarea
                            placeholder="Short description for customers"
                            value={values.description}
                            onChange={(e) =>
                                onChange({ ...values, description: e.target.value })
                            }
                            className="min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {loading
                                ? "Saving..."
                                : isEditMode
                                    ? "Save Changes"
                                    : "Create Product"}
                        </button>

                        {/* Sits beside the button, where the click happened.
                            The page-level status line is at the very bottom,
                            past the whole product list, so a message there is
                            invisible to someone looking at this form. */}
                        {attempted && hasErrors && (
                            <p
                                role="alert"
                                className="flex items-center gap-1.5 text-sm text-red-600"
                            >
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                Fix the highlighted{" "}
                                {Object.keys(errors).length === 1
                                    ? "field"
                                    : "fields"}{" "}
                                above.
                            </p>
                        )}

                        {isEditMode && onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}
