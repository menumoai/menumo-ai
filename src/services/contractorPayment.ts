// src/services/contractorPayment.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type {
    ContractorPayment,
    CreateContractorPaymentInput,
} from "../models/contractorPayment";

const contractorPaymentsCol = (accountId: string) =>
    collection(db, "accounts", accountId, "contractorPayments");

export async function createContractorPayment(
    input: CreateContractorPaymentInput,
): Promise<string> {
    const ref = await addDoc(contractorPaymentsCol(input.accountId), {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Mirror the doc id onto the document, matching createOrderWithLineItems.
    await setDoc(ref, { id: ref.id }, { merge: true });
    return ref.id;
}

export async function listContractorPayments(
    accountId: string,
): Promise<ContractorPayment[]> {
    const snap = await getDocs(query(contractorPaymentsCol(accountId)));
    return snap.docs.map((d) => ({ ...(d.data() as ContractorPayment), id: d.id }));
}

export async function deleteContractorPayment(
    accountId: string,
    paymentId: string,
): Promise<void> {
    await deleteDoc(doc(contractorPaymentsCol(accountId), paymentId));
}
