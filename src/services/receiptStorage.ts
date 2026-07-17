// src/services/receiptStorage.ts
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseClient";

/**
 * Persist the original receipt/invoice image so the owner can re-view it later.
 * Stored under `accounts/{accountId}/receipts/{transactionId}` (keyed by the
 * supplier-transaction id, so a receipt maps 1:1 to its transaction). Returns a
 * download URL to save on the transaction's `receiptImageUrl`.
 */
export async function uploadReceiptImage(
    accountId: string,
    transactionId: string,
    file: File
): Promise<string> {
    const ref = storageRef(
        storage,
        `accounts/${accountId}/receipts/${transactionId}`
    );
    await uploadBytes(ref, file, { contentType: file.type });
    return getDownloadURL(ref);
}
