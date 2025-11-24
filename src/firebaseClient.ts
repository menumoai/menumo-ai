// src/firebaseClient.ts
// Initializes Firebase + Firestore for the Menumo AI app.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ------------------------------------------------------
// Load variables from .env.local via Vite's import.meta.env
// ------------------------------------------------------
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // optional
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,    // optional if you use RTDB
};

// ------------------------------------------------------
// Initialize Firebase
// ------------------------------------------------------
const app = initializeApp(firebaseConfig);

// ------------------------------------------------------
// Expose Firestore & Auth
// ------------------------------------------------------
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
