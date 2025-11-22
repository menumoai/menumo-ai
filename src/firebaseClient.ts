// src/firebaseClient.ts
// Initializes Firebase + Firestore for the Menumo AI app.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ------------------------------------------------------
//  IMPORTANT
// Replace the firebaseConfig object below with the config
// you got from Firebase Console -> Project Settings -> Web App
// ------------------------------------------------------

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
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

// (optional) for later usage:
// import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
// import { collection, doc, setDoc, getDoc } from "firebase/firestore";

