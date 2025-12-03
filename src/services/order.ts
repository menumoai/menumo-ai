// src/services/order.ts
import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { Order, OrderLineItem } from "../models/order";

const ordersCol = (accountId: string) =>
    collection(db, "accounts", accountId, "orders");

const lineItemsCol = (accountId: string, orderId: string) =>
    collection(db, "accounts", accountId, "orders", orderId, "lineItems");

// Create order + line items in one go
export async function createOrderWithLineItems(params: {
    accountId: string;
    customerId?: string;
    channel?: Order["channel"];
    items: { productId: string; quantity: number; unitPrice: number; specialInstructions?: string }[];
}) {
    const {
        accountId,
        customerId,
        channel = "web_form",
        items,
    } = params;

    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );

    const orderRef = await addDoc(ordersCol(accountId), {
        id: "", // we’ll override with ref.id using merge
        accountId,
        customerId: customerId ?? null,
        channel,
        status: "pending",
        placedAt: serverTimestamp(),
        subtotalAmount: subtotal,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: subtotal,
        paymentStatus: "unpaid",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Set id field to match Firestore ID
    await setDoc(
        orderRef,
        { id: orderRef.id },
        { merge: true }
    );

    const itemsCol = lineItemsCol(accountId, orderRef.id);

    for (const item of items) {
        const ref = doc(itemsCol);
        const lineSubtotal = item.quantity * item.unitPrice;

        await setDoc(ref, {
            id: ref.id,
            accountId,
            orderId: orderRef.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineSubtotal,
            status: "pending",
            specialInstructions: item.specialInstructions ?? null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }

    return orderRef.id;
}


export async function listOrders(accountId: string): Promise<Order[]> {
    const q = query(ordersCol(accountId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Order);
}


export async function getOrder(accountId: string, orderId: string): Promise<Order | null> {
    const orderRef = doc(db, "accounts", accountId, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return null;
    return {
        id: snap.id,
        ...(snap.data() as Order),
    };
}

export async function listOrderLineItems(
    accountId: string,
    orderId: string
): Promise<OrderLineItem[]> {
    const itemsCol = collection(db, "accounts", accountId, "orders", orderId, "lineItems");
    const snap = await getDocs(itemsCol);
    return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as OrderLineItem),
    }));
}

type OrderStatus = Order["status"];

export async function updateOrderStatus(
    accountId: string,
    orderId: string,
    newStatus: OrderStatus
): Promise<void> {
    const orderRef = doc(db, "accounts", accountId, "orders", orderId);

    const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
    };

    // Set relevant timestamp fields when we hit a milestone
    if (newStatus === "accepted") {
        updates.acceptedAt = serverTimestamp();
    } else if (newStatus === "preparing") {
        // only set if not already set (optional)
        updates.acceptedAt = serverTimestamp();
    } else if (newStatus === "ready") {
        updates.readyAt = serverTimestamp();
    } else if (newStatus === "completed") {
        updates.completedAt = serverTimestamp();
    } else if (newStatus === "canceled") {
        updates.canceledAt = serverTimestamp();
    }

    await updateDoc(orderRef, updates);
}
