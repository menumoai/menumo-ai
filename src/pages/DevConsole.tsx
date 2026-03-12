// src/pages/DevConsole.tsx
import { useState } from "react";
import {
    TerminalSquare,
    Database,
    Package,
    ShoppingCart,
    Users,
    Receipt,
    MapPin,
    UserRound,
} from "lucide-react";

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

function sectionCardClass() {
    return "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm";
}

function actionButtonClass() {
    return (
        "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium " +
        "text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-teal-300 hover:text-teal-700"
    );
}

export function DevConsole() {
    const [status, setStatus] = useState("idle");
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<AccountUser[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const { accountId, loading: accountLoading, account } = useAccount();

    if (accountLoading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                Loading account...
            </p>
        );
    }

    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
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

            const accountData = await getBusinessAccount(accountId);
            const accountUsers = await listAccountUsers(accountId);

            console.log("✅ Account:", accountData);
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
                id: locationId,
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

            setStatus(`Location + public truck seeded successfully ✅ (id: ${locationId})`);
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
            const prods = products.length > 0 ? products : await listProducts(accountId);
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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <TerminalSquare className="h-5 w-5 text-white" />
                            </div>

                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Dev Console
                            </h1>
                        </div>

                        <p className="text-gray-600">
                            Seed and inspect demo data for{" "}
                            <span className="font-medium text-gray-900">
                                {account?.name ?? accountId}
                            </span>
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                            Account
                        </div>
                        <div className="mt-1 font-mono text-sm text-gray-900">
                            {accountId}
                        </div>
                    </div>
                </div>

                {/* Hero */}
                <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                            <Database className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold">
                                Development Tools Snapshot
                            </h3>
                            <p className="mb-4 text-teal-50">
                                Seed account data, load records, and generate realistic demo
                                flows for products, customers, locations, and orders.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <UserRound className="mr-1 inline h-4 w-4" />
                                    {users.length} Users
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Users className="mr-1 inline h-4 w-4" />
                                    {customers.length} Customers
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Package className="mr-1 inline h-4 w-4" />
                                    {products.length} Products
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <ShoppingCart className="mr-1 inline h-4 w-4" />
                                    {orders.length} Orders
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <section className={sectionCardClass()}>
                    <div className="mb-4">
                        <h2
                            className="text-lg font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Console Actions
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Seed test data and load current records into the console.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <button onClick={handleSeedAccountAndOwner} className={actionButtonClass()}>
                            Seed Account + Owner
                        </button>
                        <button onClick={handleSeedProducts} className={actionButtonClass()}>
                            Seed Demo Products
                        </button>
                        <button onClick={handleSeedCustomer} className={actionButtonClass()}>
                            Seed Demo Customer
                        </button>
                        <button onClick={handleCreateDemoOrder} className={actionButtonClass()}>
                            Create Demo Order
                        </button>
                        <button onClick={handleLoadProducts} className={actionButtonClass()}>
                            Load Products
                        </button>
                        <button onClick={handleLoadCustomers} className={actionButtonClass()}>
                            Load Customers
                        </button>
                        <button onClick={handleLoadOrders} className={actionButtonClass()}>
                            Load Orders
                        </button>
                        <button onClick={handleSeedLocation} className={actionButtonClass()}>
                            Seed Demo Location
                        </button>
                    </div>
                </section>

                {/* Status */}
                <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>
                        <span className="font-semibold">Status:</span> {status}
                    </span>
                </div>

                {/* Data sections */}
                <div className="grid gap-6 xl:grid-cols-2">
                    <section className={sectionCardClass()}>
                        <div className="mb-3 flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-teal-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Users ({users.length})
                            </h2>
                        </div>

                        {users.length === 0 ? (
                            <p className="text-sm text-gray-500">No users loaded yet.</p>
                        ) : (
                            <ul className="space-y-2 text-sm text-gray-700">
                                {users.map((u) => (
                                    <li key={u.id} className="rounded-xl bg-gray-50 px-3 py-2">
                                        <span className="font-medium text-gray-900">
                                            {u.firstName} {u.lastName}
                                        </span>{" "}
                                        — {u.email}{" "}
                                        {u.role && (
                                            <span className="text-xs text-gray-500">({u.role})</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className={sectionCardClass()}>
                        <div className="mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Customers ({customers.length})
                            </h2>
                        </div>

                        {customers.length === 0 ? (
                            <p className="text-sm text-gray-500">No customers loaded yet.</p>
                        ) : (
                            <ul className="space-y-2 text-sm text-gray-700">
                                {customers.map((c) => (
                                    <li key={c.id} className="rounded-xl bg-gray-50 px-3 py-2">
                                        <span className="font-medium text-gray-900">
                                            {c.name ?? "Unnamed"}
                                        </span>{" "}
                                        — {c.phone ?? "no phone"}{" "}
                                        <span className="text-xs text-gray-500">
                                            {c.marketingOptIn ? "(opted in)" : "(no marketing)"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className={sectionCardClass()}>
                        <div className="mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Products ({products.length})
                            </h2>
                        </div>

                        {products.length === 0 ? (
                            <p className="text-sm text-gray-500">No products loaded yet.</p>
                        ) : (
                            <ul className="space-y-2 text-sm text-gray-700">
                                {products.map((p) => (
                                    <li key={p.id} className="rounded-xl bg-gray-50 px-3 py-2">
                                        <span className="font-semibold text-gray-900">{p.name}</span>{" "}
                                        — ${p.price.toFixed(2)}{" "}
                                        {!p.isActive && (
                                            <span className="text-xs text-amber-600">(inactive)</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className={sectionCardClass()}>
                        <div className="mb-3 flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-amber-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Orders ({orders.length})
                            </h2>
                        </div>

                        {orders.length === 0 ? (
                            <p className="text-sm text-gray-500">No orders loaded yet.</p>
                        ) : (
                            <ul className="space-y-2 text-sm text-gray-700">
                                {orders.map((o) => (
                                    <li key={o.id} className="rounded-xl bg-gray-50 px-3 py-2">
                                        <span className="mr-1 rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-800">
                                            {o.id}
                                        </span>
                                        <span>
                                            status:{" "}
                                            <span className="font-medium capitalize">{o.status}</span>,
                                            {" "}total:{" "}
                                            <span className="font-semibold text-gray-900">
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

                <section className={sectionCardClass()}>
                    <div className="mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-rose-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Notes
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600">
                        This console is now visually aligned with the rest of the app, but the
                        workflows remain the same. The next logical upgrade would be adding
                        grouped seed actions, destructive action warnings, and richer data
                        previews.
                    </p>
                </section>
            </div>
        </div>
    );
}
