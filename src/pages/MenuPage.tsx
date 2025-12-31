// src/pages/MenuPage.tsx
import { useState, type FormEvent } from "react";
import { useAccount } from "../account/AccountContext";
import { createProduct } from "../services/product";
import { useMenuProducts } from "../hooks/useMenuProducts";

import { AddProductForm, type AddProductFormValues } from "../components/menu/AddProductForm";
import { ProductList } from "../components/menu/ProductList";

const emptyForm: AddProductFormValues = {
    name: "",
    price: "",
    category: "",
    description: "",
};

export function MenuPage() {
    const { accountId, loading: accountLoading, account } = useAccount();

    // NOTE: your hook currently returns setProducts/setStatus etc.
    // If you want `reload`, add it (I’ll show below)
    const { products, loading, status, setStatus, reload } = useMenuProducts(accountId ?? null);

    const [saving, setSaving] = useState(false);
    const [formValues, setFormValues] = useState<AddProductFormValues>(emptyForm);

    if (accountLoading) {
        return <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">Loading account...</p>;
    }
    if (!accountId) {
        return <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">No account selected.</p>;
    }

    const handleCreateProduct = async (values: AddProductFormValues) => {
        if (!values.name.trim() || !values.price.trim()) {
            setStatus("Name and price are required");
            return;
        }

        const priceNumber = parseFloat(values.price);
        if (Number.isNaN(priceNumber)) {
            setStatus("Price must be a number");
            return;
        }

        setSaving(true);
        setStatus("");

        try {
            await createProduct({
                accountId,
                name: values.name.trim(),
                price: priceNumber, //  FIXED (number)
                category: values.category.trim() || undefined,
                description: values.description.trim() || undefined,
                menuType: "food",
                stockUnit: "each",
                isActive: true,
            });

            setFormValues(emptyForm); //  reset the controlled form
            setStatus("Created product ");
            await reload(); //  refresh list
        } catch (err) {
            console.error(err);
            setStatus("Error creating product");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void handleCreateProduct(formValues); //  bridge event -> values
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Menu</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Managing products for{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                        {account?.name ?? accountId}
                    </span>
                </p>
            </header>

            <AddProductForm
                values={formValues}
                onChange={setFormValues}
                onSubmit={handleSubmit}
                loading={saving}
            />

            <ProductList products={products} loading={loading} />

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Status:</span> {status || "—"}
            </p>
        </div>
    );
}
