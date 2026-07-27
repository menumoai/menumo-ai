import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { listProducts } from "../services/product";
import { createOrderWithLineItems } from "../services/order";
import type { Product } from "../models/product";
import { useAccount } from "../account/AccountContext";
import { accountLabel } from "../account/accountLabel";

import { PageHeader } from "../layout/PageHeader";
import { CreateOrderTable } from "../components/orders/CreateOrderTable";

import { buildInitialOrderState } from "../orders/orderInit";
import { buildOrderItems } from "../orders/orderItemBuilder";
import { toggleOption } from "../orders/toggleOption";

// recommend these shared types live in ../orders/orderTypes
import type { QuantityMap, SelectedOptionsMap } from "../orders/orderTypes";

export function CreateOrderPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({});
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { accountId, account, loading: accountLoading } = useAccount();

    useEffect(() => {
        if (!accountId) return;

        const load = async () => {
            setLoading(true);
            setStatus("");
            try {
                const prods = await listProducts(accountId);
                setProducts(prods);

                const { quantities: qInit, selectedOptions: oInit } = buildInitialOrderState(prods);
                setQuantities(qInit);
                setSelectedOptions(oInit);

                setStatus("Products loaded ✅");
            } catch (err) {
                console.error("Error loading products", err);
                setStatus("Error loading products");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [accountId]);

    // Derived from the same builder the submit handler uses, so the button's
    // enabled state and what actually gets saved can never disagree.
    const orderItems = useMemo(
        () => buildOrderItems(products, quantities, selectedOptions),
        [products, quantities, selectedOptions],
    );
    const hasQuantity = orderItems.length > 0;

    const handleQuantityChange = (productId: string, value: string) => {
        setQuantities((prev) => ({ ...prev, [productId]: value }));
    };

    const handleToggleOption = (
        productId: string,
        groupId: string,
        optionId: string,
        multiSelect: boolean
    ) => {
        // if toggleOption is PURE:
        setSelectedOptions((prev) => toggleOption(prev, productId, groupId, optionId, multiSelect));

        // if toggleOption is SETTER-WRAPPER:
        // toggleOption(setSelectedOptions, productId, groupId, optionId, multiSelect);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!accountId || loading) return;

        setStatus("");
        setLoading(true);

        try {
            // The button is disabled without items, so this only trips if the
            // form is submitted some other way (Enter key, autofill, tooling).
            if (orderItems.length === 0) {
                setStatus("Enter a quantity for at least one item.");
                setLoading(false);
                return;
            }

            const orderId = await createOrderWithLineItems({
                accountId,
                items: orderItems,
                channel: "in_person",
            });

            setStatus(`Order created ✅ (id: ${orderId})`);

            // reset order state
            const { quantities: qReset, selectedOptions: oReset } = buildInitialOrderState(products);
            setQuantities(qReset);
            setSelectedOptions(oReset);

            setTimeout(() => navigate("/orders"), 800);
        } catch (err) {
            console.error("Error creating order", err);
            setStatus("Error creating order");
        } finally {
            setLoading(false);
        }
    };

    if (accountLoading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                Loading account...
            </p>
        );
    }

    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                No account.
            </p>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <PageHeader
                title="Create Order"
                subtitle={
                    <>
                        For {accountLabel(account)}
                    </>
                }
            />

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {loading && products.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">Loading products...</p>
                ) : products.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No products yet. Go to the{" "}
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Menu</span>{" "}
                        page and add some first.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <CreateOrderTable
                            products={products}
                            quantities={quantities}
                            selectedOptions={selectedOptions}
                            onQuantityChange={handleQuantityChange}
                            onToggleOption={handleToggleOption}
                        />

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="submit"
                                disabled={loading || !hasQuantity}
                                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-indigo-600"
                            >
                                {loading ? "Creating..." : "Create Order"}
                            </button>

                            {/* A disabled button with no stated reason reads as
                                a broken page, so always say what is missing. */}
                            {!hasQuantity && !loading && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Enter a quantity for at least one item.
                                </p>
                            )}
                            {hasQuantity && !loading && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {orderItems.length}{" "}
                                    {orderItems.length === 1 ? "item" : "items"} ·{" "}
                                    {orderItems.reduce((n, i) => n + i.quantity, 0)} total
                                </p>
                            )}
                        </div>
                    </form>
                )}

                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Status:</span> {status}
                </p>
            </div>
        </div>
    );
}
