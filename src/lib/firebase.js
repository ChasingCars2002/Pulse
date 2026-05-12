// Firebase initialization with graceful fallback.
//
// Pulse uses Firestore for realtime updates on the High-Five feed and other
// collaborative surfaces. To enable Firebase, copy `.env.example` to `.env`
// and fill in the VITE_FIREBASE_* values. Without those values the app runs
// against a local in-memory + localStorage store, which is great for demos
// and offline development.

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

let app = null;
let auth = null;
let db = null;

if (firebaseEnabled) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db, signInAnonymously, onAuthStateChanged };
