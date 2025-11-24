// src/firebaseClient.ts
// Initializes Firebase + Firestore for the Menumo AI app.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ------------------------------------------------------
//  IMPORTANT
// Replace the firebaseConfig object below with the config
// you got from Firebase Console -> Project Settings -> Web App
// ------------------------------------------------------
const firebaseConfig = {

    apiKey: "AIzaSyCe66Jbxm-XZ70Gy1TOm-35mCCHtuZdr_c",

    authDomain: "menumo-ai.firebaseapp.com",

    databaseURL: "https://menumo-ai-default-rtdb.firebaseio.com",

    projectId: "menumo-ai",

    storageBucket: "menumo-ai.firebasestorage.app",

    messagingSenderId: "714494244092",

    appId: "1:714494244092:web:499a2e3ce60abb5fc19379",

    measurementId: "G-HK8L423NSN"

};

// ------------------------------------------------------
// Initialize Firebase App
// ------------------------------------------------------

const app = initializeApp(firebaseConfig);

// ------------------------------------------------------
// Export Firestore + Auth instances
// ------------------------------------------------------

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// (optional) for later usage:
// import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
// import { collection, doc, setDoc, getDoc } from "firebase/firestore";

