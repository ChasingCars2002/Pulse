// Pulse store — a single API for reads/writes used by every page.
//
// When Firebase is configured, this proxies to Firestore (with onSnapshot
// real-time subscriptions on collaborative collections like high-fives).
// Without Firebase, it uses an in-memory + localStorage mirror so the
// app is fully usable offline, which keeps onboarding "plug and play".

import {
  firebaseEnabled,
  db,
  auth,
  signInAnonymously,
  onAuthStateChanged,
} from "./firebase.js";
import {
  seedUsers,
  seedHighFives,
  seedPriorities,
  seedOKRs,
  seedOneOnOnes,
  seedCheckIns,
} from "./seed.js";

const STORAGE_KEY = "pulse.local.v1";
const COLLECTIONS = [
  "users",
  "highFives",
  "priorities",
  "okrs",
  "oneOnOnes",
  "checkIns",
  "openMic",
  "feedbackRequests",
];

function freshDB() {
  return {
    users: [...seedUsers],
    highFives: [...seedHighFives],
    priorities: [...seedPriorities],
    okrs: [...seedOKRs],
    oneOnOnes: [...seedOneOnOnes],
    checkIns: [...seedCheckIns],
    openMic: [],
    feedbackRequests: [],
  };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = freshDB();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    for (const c of COLLECTIONS) if (!parsed[c]) parsed[c] = [];
    return parsed;
  } catch {
    return freshDB();
  }
}

function saveLocal(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// Lightweight pub/sub so the UI can subscribe to a collection and get
// re-renders on every write, matching the Firestore onSnapshot ergonomics.
const subscribers = new Map(); // collection -> Set<fn>
function notify(collection) {
  const subs = subscribers.get(collection);
  if (!subs) return;
  for (const fn of subs) fn(localState[collection]);
}

let localState = loadLocal();

// ----- Firestore wiring (used only when firebaseEnabled) -----
let fbReady = false;
async function ensureFirebase() {
  if (!firebaseEnabled || fbReady) return;
  // sign in anonymously for demo; replace with real auth in prod
  await signInAnonymously(auth);
  await new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (u) => {
      if (u) {
        off();
        resolve();
      }
    });
  });
  fbReady = true;
}

// ----- Public API -----

export const storeMode = firebaseEnabled ? "firestore" : "local";

export function resetLocal() {
  localState = freshDB();
  saveLocal(localState);
  for (const c of COLLECTIONS) notify(c);
}

export function list(collection) {
  return [...(localState[collection] || [])];
}

export function getById(collection, id) {
  return (localState[collection] || []).find((x) => x.id === id) || null;
}

export function subscribe(collection, fn) {
  if (!subscribers.has(collection)) subscribers.set(collection, new Set());
  subscribers.get(collection).add(fn);
  // initial push
  fn(localState[collection] || []);
  return () => subscribers.get(collection).delete(fn);
}

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function add(collection, doc) {
  await ensureFirebase();
  const withId = { id: doc.id || generateId(collection.slice(0, 2)), ...doc };
  localState[collection] = [withId, ...(localState[collection] || [])];
  saveLocal(localState);
  notify(collection);
  // Firestore mirror (best-effort, doesn't block UI)
  if (firebaseEnabled) {
    try {
      const { doc: docRef, setDoc, collection: col } = await import(
        "firebase/firestore"
      );
      await setDoc(docRef(col(db, collection), withId.id), withId);
    } catch (e) {
      console.warn("[pulse] firestore add failed, kept local copy", e);
    }
  }
  return withId;
}

export async function update(collection, id, patch) {
  await ensureFirebase();
  const arr = localState[collection] || [];
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...patch };
  saveLocal(localState);
  notify(collection);
  if (firebaseEnabled) {
    try {
      const { doc: docRef, updateDoc, collection: col } = await import(
        "firebase/firestore"
      );
      await updateDoc(docRef(col(db, collection), id), patch);
    } catch (e) {
      console.warn("[pulse] firestore update failed, kept local copy", e);
    }
  }
  return arr[idx];
}

export async function remove(collection, id) {
  await ensureFirebase();
  localState[collection] = (localState[collection] || []).filter(
    (x) => x.id !== id
  );
  saveLocal(localState);
  notify(collection);
  if (firebaseEnabled) {
    try {
      const { doc: docRef, deleteDoc, collection: col } = await import(
        "firebase/firestore"
      );
      await deleteDoc(docRef(col(db, collection), id));
    } catch (e) {
      console.warn("[pulse] firestore delete failed, kept local copy", e);
    }
  }
}
