// Firebase initialization with graceful fallback.
//
// Pulse uses Firestore for realtime updates when configured via env vars,
// but the SDK is loaded *lazily* on first use so the initial bundle and
// first paint never depend on it. Without env vars the app falls back to
// a localStorage-backed store and Firebase is never imported.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

let initPromise = null;

export function getFirebase() {
  if (!firebaseEnabled) return Promise.resolve(null);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const [{ initializeApp }, authMod, firestoreMod] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(config);
    const auth = authMod.getAuth(app);
    const db = firestoreMod.getFirestore(app);
    try {
      await authMod.signInAnonymously(auth);
    } catch (e) {
      console.warn("[pulse] anonymous sign-in failed:", e?.message || e);
    }
    return { app, auth, db, authMod, firestoreMod };
  })();
  return initPromise;
}
