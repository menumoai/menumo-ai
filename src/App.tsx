import { useState } from "react";

import { createBusinessAccount, getBusinessAccount } from "./services/accounts";
import { createAccountUser, listAccountUsers } from "./services/users";
import { createProduct, listProducts } from "./services/product";
import {
  createOrderWithLineItems,
  listOrders,
} from "./services/order";
import { createCustomer, listCustomers } from "./services/customer";

import type { Product } from "./models/product";
import type { Order } from "./models/order";
import type { AccountUser } from "./models/user";
import type { Customer } from "./models/customer";

// Use a fixed demo account for now
const ACCOUNT_ID = "demo-truck";
const OWNER_ID = "owner-1";

function App() {
  const [status, setStatus] = useState("idle");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // 1) Seed account + owner user
  const handleSeedAccountAndOwner = async () => {
    setStatus("Seeding account + owner...");

    try {
      // Create /accounts/demo-truck
      await createBusinessAccount({
        id: ACCOUNT_ID,
        name: "Demo Taco Truck",
        legalName: "Demo Taco Truck LLC",
        email: "owner@demotacotruck.com",
        phone: "555-1234",
      });

      // Create /accounts/demo-truck/users/owner-1
      await createAccountUser({
        accountId: ACCOUNT_ID,
        id: OWNER_ID,
        email: "owner@demotacotruck.com",
        firstName: "Alex",
        lastName: "Owner",
        phone: "555-1234",
      });

      const account = await getBusinessAccount(ACCOUNT_ID);
      const accountUsers = await listAccountUsers(ACCOUNT_ID);

      console.log("✅ Account:", account);
      console.log("✅ Users:", accountUsers);

      setUsers(accountUsers);
      setStatus("Account + owner seeded successfully ✅");
    } catch (err) {
      console.error("❌ Error seeding account + owner:", err);
      setStatus("Error seeding account + owner – see console");
    }
  };

  // 2) Seed a couple of products
  const handleSeedProducts = async () => {
    setStatus("Seeding demo products...");

    try {
      await createProduct({
        accountId: ACCOUNT_ID,
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
        accountId: ACCOUNT_ID,
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

      const prods = await listProducts(ACCOUNT_ID);
      console.log("✅ Products:", prods);
      setProducts(prods);
      setStatus("Products seeded successfully ✅");
    } catch (err) {
      console.error("❌ Error seeding products:", err);
      setStatus("Error seeding products – see console");
    }
  };

  // 3) Seed a demo customer
  const handleSeedCustomer = async () => {
    setStatus("Seeding demo customer...");

    try {
      const customerId = await createCustomer({
        accountId: ACCOUNT_ID,
        name: "First Demo Customer",
        phone: "+15555550123",
        marketingOptIn: true,
      });

      const updatedCustomers = await listCustomers(ACCOUNT_ID);
      console.log("✅ Customers:", updatedCustomers);
      setCustomers(updatedCustomers);
      setStatus(`Customer seeded successfully ✅ (id: ${customerId})`);
    } catch (err) {
      console.error("❌ Error seeding customer:", err);
      setStatus("Error seeding customer – see console");
    }
  };

  // 4) Create an order from existing products
  const handleCreateDemoOrder = async () => {
    setStatus("Creating demo order...");

    try {
      // use the first product(s) we find
      const prods = products.length > 0 ? products : await listProducts(ACCOUNT_ID);
      if (prods.length === 0) {
        setStatus("No products found – seed products first");
        return;
      }

      const product = prods[0];

      // simple: 2x first product
      const orderId = await createOrderWithLineItems({
        accountId: ACCOUNT_ID,
        items: [
          {
            productId: product.id,
            quantity: 2,
            unitPrice: product.price,
          },
        ],
      });

      console.log("✅ Created order with ID:", orderId);

      const updatedOrders = await listOrders(ACCOUNT_ID);
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
      const prods = await listProducts(ACCOUNT_ID);
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
      const ords = await listOrders(ACCOUNT_ID);
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
      const custs = await listCustomers(ACCOUNT_ID);
      setCustomers(custs);
      setStatus("Customers loaded ✅");
    } catch (err) {
      console.error("❌ Error loading customers:", err);
      setStatus("Error loading customers – see console");
    }
  };

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Menumo AI – Dev Console</h1>
      <p style={{ marginBottom: "1rem", color: "#555" }}>
        Account: <code>{ACCOUNT_ID}</code>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <button onClick={handleSeedAccountAndOwner}>Seed Account + Owner</button>
        <button onClick={handleSeedProducts}>Seed Demo Products</button>
        <button onClick={handleSeedCustomer}>Seed Demo Customer</button>
        <button onClick={handleCreateDemoOrder}>Create Demo Order</button>
        <button onClick={handleLoadProducts}>Load Products</button>
        <button onClick={handleLoadCustomers}>Load Customers</button>
        <button onClick={handleLoadOrders}>Load Orders</button>
      </div>

      <p>
        <strong>Status:</strong> {status}
      </p>

      <hr style={{ margin: "1.5rem 0" }} />

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Users ({users.length})</h2>
        {users.length === 0 ? (
          <p style={{ color: "#777" }}>No users loaded yet.</p>
        ) : (
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                {u.firstName} {u.lastName} — {u.email} ({u.role})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Customers ({customers.length})</h2>
        {customers.length === 0 ? (
          <p style={{ color: "#777" }}>No customers loaded yet.</p>
        ) : (
          <ul>
            {customers.map((c) => (
              <li key={c.id}>
                {c.name ?? "Unnamed"} — {c.phone ?? "no phone"}{" "}
                {c.marketingOptIn ? "(opted in)" : "(no marketing)"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Products ({products.length})</h2>
        {products.length === 0 ? (
          <p style={{ color: "#777" }}>No products loaded yet.</p>
        ) : (
          <ul>
            {products.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong> — ${p.price.toFixed(2)}{" "}
                {p.isActive ? "" : "(inactive)"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p style={{ color: "#777" }}>No orders loaded yet.</p>
        ) : (
          <ul>
            {orders.map((o) => (
              <li key={o.id}>
                <strong>{o.id}</strong> — status: {o.status}, total: $
                {o.totalAmount.toFixed(2)} via {o.channel}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
