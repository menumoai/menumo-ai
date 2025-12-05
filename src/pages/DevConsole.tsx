// src/pages/DevConsole.tsx
import { useState } from "react";
import { useAccount } from "../account/AccountContext";

import { createBusinessAccount, getBusinessAccount } from "../services/accounts";
import { createAccountUser, listAccountUsers } from "../services/users";
import { createProduct, listProducts } from "../services/product";
import { createOrderWithLineItems, listOrders } from "../services/order";
import { createCustomer, listCustomers } from "../services/customer";
import { createLocation, createPublicTruckLocation } from "../services/location";
import type { Product } from "../models/product";
import type { Order } from "../models/order";
import type { AccountUser } from "../models/user";
import type { Customer } from "../models/customer";

export function DevConsole() {
    const [status, setStatus] = useState("idle");
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<AccountUser[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const { accountId, loading: accountLoading } = useAccount();

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
                No account selected.
            </p>
        );
    }

    const handleSeedAccountAndOwner = async () => {
        setStatus("Seeding account + owner...");

        try {
            await createBusinessAccount({
                id: accountId,
                name: "Demo Taco Truck",
                legalName: "Demo Taco Truck LLC",
                email: "owner@demotacotruck.com",
                phone: "555-1234",
            });

            await createAccountUser({
                accountId,
                id: "owner-1",
                email: "owner@demotacotruck.com",
                firstName: "Alex",
                lastName: "Owner",
                phone: "555-1234",
            });

            const account = await getBusinessAccount(accountId);
            const accountUsers = await listAccountUsers(accountId);

            console.log("✅ Account:", account);
            console.log("✅ Users:", accountUsers);

            setUsers(accountUsers);
            setStatus("Account + owner seeded successfully ✅");
        } catch (err) {
            console.error("❌ Error seeding account + owner:", err);
            setStatus("Error seeding account + owner – see console");
        }
    };
    const handleSeedLocation = async () => {
        setStatus("Seeding demo location...");

        try {
            // Demo coordinates – replace with whatever makes sense
            // Example: Baton Rouge-ish
            const locationName = "Demo Taco Truck – LSU Corner";

            const locationId = await createLocation({
                accountId,
                name: locationName,
                description: "Our main truck location for the demo.",
                address1: "123 College Dr",
                city: "Baton Rouge",
                state: "LA",
                postalCode: "70808",
                country: "US",
                latitude: 30.41,
                longitude: -91.18,
                isTruckLocation: true,
            });

            await createPublicTruckLocation({
                accountId,
                id: locationId, // 👈 keep same ID for easy joining
                name: locationName,
                description: "Our main truck location for the demo.",
                address1: "123 College Dr",
                city: "Baton Rouge",
                state: "LA",
                postalCode: "70808",
                country: "US",
                latitude: 30.41,
                longitude: -91.18,
                isTruckLocation: true,
            });

            setStatus(
                `Location + public truck seeded successfully ✅ (id: ${locationId})`
            );
        } catch (err) {
            console.error("❌ Error seeding location:", err);
            setStatus("Error seeding location – see console");
        }
    };

    const handleSeedProducts = async () => {
        setStatus("Seeding demo products...");

        try {
            await createProduct({
                accountId,
                name: "Birria Taco",
                description: "Slow-cooked beef birria with consommé",
                category: "tacos",
                price: 5.5,
                cost: 2.0,
                menuType: "food",
                stockUnit: "each",
                currentStock: 200,
                prepTimeSeconds: 120,
            });

            await createProduct({
                accountId,
                name: "Street Corn Elote",
                description: "Grilled corn with cotija, mayo, lime, chili",
                category: "sides",
                price: 4.0,
                cost: 1.2,
                menuType: "food",
                stockUnit: "each",
                currentStock: 100,
                prepTimeSeconds: 90,
            });

            const prods = await listProducts(accountId);
            console.log("✅ Products:", prods);
            setProducts(prods);
            setStatus("Products seeded successfully ✅");
        } catch (err) {
            console.error("❌ Error seeding products:", err);
            setStatus("Error seeding products – see console");
        }
    };

    const handleSeedCustomer = async () => {
        setStatus("Seeding demo customer...");

        try {
            const customerId = await createCustomer({
                accountId,
                name: "First Demo Customer",
                phone: "+15555550123",
                marketingOptIn: true,
            });

            const updatedCustomers = await listCustomers(accountId);
            console.log("✅ Customers:", updatedCustomers);
            setCustomers(updatedCustomers);
            setStatus(`Customer seeded successfully ✅ (id: ${customerId})`);
        } catch (err) {
            console.error("❌ Error seeding customer:", err);
            setStatus("Error seeding customer – see console");
        }
    };

    const handleCreateDemoOrder = async () => {
        setStatus("Creating demo order...");

        try {
            const prods =
                products.length > 0 ? products : await listProducts(accountId);
            if (prods.length === 0) {
                setStatus("No products found – seed products first");
                return;
            }

            const product = prods[0];

            const orderId = await createOrderWithLineItems({
                accountId,
                items: [
                    {
                        productId: product.id,
                        quantity: 2,
                        unitPrice: product.price,
                    },
                ],
            });

            console.log("✅ Created order with ID:", orderId);

            const updatedOrders = await listOrders(accountId);
            setOrders(updatedOrders);
            setStatus(`Order created successfully ✅ (id: ${orderId})`);
        } catch (err) {
            console.error("❌ Error creating order:", err);
            setStatus("Error creating order – see console");
        }
    };

    const handleLoadProducts = async () => {
        setStatus("Loading products...");
        try {
            const prods = await listProducts(accountId);
            setProducts(prods);
            setStatus("Products loaded ✅");
        } catch (err) {
            console.error("❌ Error loading products:", err);
            setStatus("Error loading products – see console");
        }
    };

    const handleLoadOrders = async () => {
        setStatus("Loading orders...");
        try {
            const ords = await listOrders(accountId);
            setOrders(ords);
            setStatus("Orders loaded ✅");
        } catch (err) {
            console.error("❌ Error loading orders:", err);
            setStatus("Error loading orders – see console");
        }
    };

    const handleLoadCustomers = async () => {
        setStatus("Loading customers...");
        try {
            const custs = await listCustomers(accountId);
            setCustomers(custs);
            setStatus("Customers loaded ✅");
        } catch (err) {
            console.error("❌ Error loading customers:", err);
            setStatus("Error loading customers – see console");
        }
    };

    const buttonBase =
        "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium " +
        "text-slate-800 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700 hover:shadow " +
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-indigo-400 dark:hover:text-indigo-300";

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            <header className="mb-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Menumo AI – Dev Console
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Account:{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                        {accountId}
                    </code>
                </p>
            </header>

            {/* Actions */}
            <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                <button onClick={handleSeedAccountAndOwner} className={buttonBase}>
                    Seed Account + Owner
                </button>
                <button onClick={handleSeedProducts} className={buttonBase}>
                    Seed Demo Products
                </button>
                <button onClick={handleSeedCustomer} className={buttonBase}>
                    Seed Demo Customer
                </button>
                <button onClick={handleCreateDemoOrder} className={buttonBase}>
                    Create Demo Order
                </button>
                <button onClick={handleLoadProducts} className={buttonBase}>
                    Load Products
                </button>
                <button onClick={handleLoadCustomers} className={buttonBase}>
                    Load Customers
                </button>
                <button onClick={handleLoadOrders} className={buttonBase}>
                    Load Orders
                </button>
                <button onClick={handleSeedLocation} className={buttonBase}>
                    Seed Demo Location
                </button>
            </div>

            {/* Status */}
            <p className="mb-6 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                    <span className="font-semibold">Status:</span> {status}
                </span>
            </p>

            <div className="space-y-6">
                {/* Users */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Users ({users.length})
                    </h2>
                    {users.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            No users loaded yet.
                        </p>
                    ) : (
                        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            {users.map((u) => (
                                <li key={u.id}>
                                    <span className="font-medium">
                                        {u.firstName} {u.lastName}
                                    </span>{" "}
                                    — {u.email}{" "}
                                    {u.role && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            ({u.role})
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Customers */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Customers ({customers.length})
                    </h2>
                    {customers.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            No customers loaded yet.
                        </p>
                    ) : (
                        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            {customers.map((c) => (
                                <li key={c.id}>
                                    <span className="font-medium">
                                        {c.name ?? "Unnamed"}
                                    </span>{" "}
                                    — {c.phone ?? "no phone"}{" "}
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {c.marketingOptIn ? "(opted in)" : "(no marketing)"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Products */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Products ({products.length})
                    </h2>
                    {products.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            No products loaded yet.
                        </p>
                    ) : (
                        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            {products.map((p) => (
                                <li key={p.id}>
                                    <span className="font-semibold">{p.name}</span> — $
                                    {p.price.toFixed(2)}{" "}
                                    {!p.isActive && (
                                        <span className="text-xs text-amber-600 dark:text-amber-400">
                                            (inactive)
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Orders */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Orders ({orders.length})
                    </h2>
                    {orders.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            No orders loaded yet.
                        </p>
                    ) : (
                        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            {orders.map((o) => (
                                <li key={o.id}>
                                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 mr-1">
                                        {o.id}
                                    </span>
                                    <span>
                                        status:{" "}
                                        <span className="font-medium capitalize">{o.status}</span>,
                                        {"  "}total:{" "}
                                        <span className="font-semibold">
                                            ${o.totalAmount.toFixed(2)}
                                        </span>{" "}
                                        via {o.channel}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
