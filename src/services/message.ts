// src/services/message.ts
import {
    collection,
    setDoc,
    addDoc,
    getDocs,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { Message } from "../models/message";

const messagesCol = (accountId: string) =>
    collection(db, "accounts", accountId, "messages");

export async function createMessage(params: {
    accountId: string;
    userId?: string;
    customerId?: string;
    direction: Message["direction"];
    channel: Message["channel"];
    purpose: Message["purpose"];
    body: string;
    templateKey?: string;
}) {
    const {
        accountId,
        userId,
        customerId,
        direction,
        channel,
        purpose,
        body,
        templateKey,
    } = params;

    const ref = await addDoc(messagesCol(accountId), {
        accountId,
        userId: userId ?? null,
        customerId: customerId ?? null,
        direction,
        channel,
        purpose,
        body,
        templateKey: templateKey ?? null,
        status: "queued",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    await setDoc(ref, { id: ref.id }, { merge: true });
    return ref.id;
}

export async function listMessages(
    accountId: string
): Promise<Message[]> {
    const q = query(messagesCol(accountId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Message);
}

