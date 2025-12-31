import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { listProducts } from "../services/product";
import { createCustomer } from "../services/customer";
import { createOrderWithLineItems } from "../services/order";
import type { Product } from "../models/product";
import { useAccount } from "../account/AccountContext";

import { CustomerMenuTable } from "../components/orders/CustomerMenuTable";
import { CustomerDetailsSection } from "../components/orders/CustomerDetailsSection";

import { buildInitialOrderState } from "../orders/orderInit";
import { buildOrderItems } from "../orders/orderItemBuilder";
import { toggleOption } from "../orders/toggleOption";
import { resolveAccountId } from "../orders/resolveAccountId";

// Ideally these types live in ../orders/orderTypes now (shared by staff + customer)
import type { QuantityMap, SelectedOptionsMap } from "../orders/orderTypes";

export function CustomerOrderFormPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({});

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();
    const urlAccountId = searchParams.get("account");

    const { accountId: contextAccountId, loading: accountLoading } = useAccount();

    const accountId = useMemo(
        () => resolveAccountId(urlAccountId, contextAccountId),
        [urlAccountId, contextAccountId]
    );

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

                setStatus("Menu loaded ✅");
            } catch (err) {
                console.error(err);
                setStatus("Error loading menu");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [accountId]);

    // Loading / no-account states
    if (!urlAccountId && accountLoading) {
        return (
            <div className="mx-auto max-w-xl px-4 py-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    Place an Order
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Loading food truck information…
                </p>
            </div>
        );
    }

    if (!accountId) {
        return (
            <div className="mx-auto max-w-xl px-4 py-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    Place an Order
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    This order page needs to be tied to a specific food truck account.
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Please open this page using the link provided by the food truck, or log in
                    as the truck owner to preview your order form.
                </p>
            </div>
        );
    }

    const handleQuantityChange = (productId: string, value: string) => {
        setQuantities((prev) => ({ ...prev, [productId]: value }));
    };

    const handleToggleOption = (
        productId: string,
        groupId: string,
        optionId: string,
        multiSelect: boolean
    ) => {
        // if your helper is pure:
        setSelectedOptions((prev) =>
            toggleOption(prev, productId, groupId, optionId, multiSelect)
        );

        // if your helper is a setter-wrapper, use:
        // toggleOption(setSelectedOptions, productId, groupId, optionId, multiSelect);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (loading) return; // prevent double submits

        setStatus("");
        setLoading(true);

        try {
            const items = buildOrderItems(products, quantities, selectedOptions);

            if (items.length === 0) {
                setStatus("Please select at least one item.");
                setLoading(false);
                return;
            }

            let customerId: string | undefined;
            if (customerName || customerPhone) {
                customerId = await createCustomer({
                    accountId,
                    name: customerName || undefined,
                    phone: customerPhone || undefined,
                    marketingOptIn: false,
                });
            }

            const orderId = await createOrderWithLineItems({
                accountId,
                customerId,
                items,
                channel: "web_form",
            });

            setStatus(`Thank you! Your order was placed. (id: ${orderId})`);

            // reset order state
            const { quantities: qReset, selectedOptions: oReset } = buildInitialOrderState(products);
            setQuantities(qReset);
            setSelectedOptions(oReset);

            setCustomerName("");
            setCustomerPhone("");
        } catch (err) {
            console.error(err);
            setStatus("Error placing order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    Place Your Order
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Choose your items and enter your contact info so we can confirm your order.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
                <CustomerDetailsSection
                    customerName={customerName}
                    customerPhone={customerPhone}
                    onNameChange={setCustomerName}
                    onPhoneChange={setCustomerPhone}
                />

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Menu
                    </h2>

                    <CustomerMenuTable
                        products={products}
                        loading={loading}
                        quantities={quantities}
                        selectedOptions={selectedOptions}
                        onQuantityChange={handleQuantityChange}
                        onToggleOption={handleToggleOption}
                    />
                </section>

                <div className="flex flex-col items-start gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                        type="submit"
                        disabled={loading || products.length === 0}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Placing order..." : "Place Order"}
                    </button>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Status:</span> {status}
                    </p>
                </div>
            </form>
        </div>
    );
}
