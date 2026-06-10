// Pulse store — a single API for reads/writes used by every page.
//
// When Firebase is configured, this proxies to Firestore (with onSnapshot
// real-time subscriptions on collaborative collections like high-fives).
// Without Firebase, it uses an in-memory + localStorage mirror so the
// app is fully usable offline, which keeps onboarding "plug and play".

import { firebaseEnabled, getFirebase } from "./firebase.js";
import { currentWeekKey } from "./questionEngine.js";
import {
  seedUsers,
  seedHighFives,
  seedPriorities,
  seedOKRs,
  seedOneOnOnes,
  seedCheckIns,
  seedFeedbackRequests,
} from "./seed.js";

// Bump the version suffix when changing seed shape so existing users
// pick up the new demo state automatically.
const STORAGE_KEY = "pulse.local.v2";
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
    feedbackRequests: [...seedFeedbackRequests],
  };
}

function loadLocal() {
  try {
    // Clear pre-v2 keys so old demo data doesn't linger.
    localStorage.removeItem("pulse.local.v1");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = freshDB();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    for (const c of COLLECTIONS) if (!parsed[c]) parsed[c] = [];
    // Migrate priorities written before week keys were real ISO weeks
    // (an old build stored the literal string "current").
    for (const p of parsed.priorities) {
      if (p.week === "current") p.week = currentWeekKey();
    }
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
async function ensureFirebase() {
  if (!firebaseEnabled) return null;
  return getFirebase();
}

// ----- Public API -----

export const storeMode = firebaseEnabled ? "firestore" : "local";

export function resetLocal() {
  localState = freshDB();
  saveLocal(localState);
  try {
    // Drop any in-progress check-in draft too, or it would "restore"
    // into the freshly reset form.
    localStorage.removeItem("pulse.checkin.draft");
  } catch {
    // ignore
  }
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
  attachRemote(collection);
  return () => subscribers.get(collection).delete(fn);
}

// Realtime read path. The first subscriber to a collection attaches a
// Firestore onSnapshot listener that mirrors remote changes into local
// state (and localStorage) and re-notifies — this is what makes the
// High-Five feed and 1-on-1 workspaces live across browsers. If the
// remote collection is empty on first connect (a fresh Firebase project),
// it is seeded once from the local data so the demo starts alive.
const remoteAttached = new Set();

function attachRemote(collection) {
  if (!firebaseEnabled || remoteAttached.has(collection)) return;
  remoteAttached.add(collection);
  ensureFirebase()
    .then((fb) => {
      if (!fb) return;
      const { collection: col, onSnapshot, doc: docRef, setDoc } = fb.firestoreMod;
      const ref = col(fb.db, collection);
      let seededRemote = false;
      onSnapshot(
        ref,
        (snap) => {
          if (snap.empty) {
            if (!seededRemote) {
              seededRemote = true;
              for (const d of localState[collection] || []) {
                setDoc(docRef(ref, d.id), d).catch((e) =>
                  console.warn("[pulse] firestore seed failed", e)
                );
              }
            }
            return;
          }
          const docs = snap.docs.map((d) => d.data());
          docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          localState[collection] = docs;
          saveLocal(localState);
          notify(collection);
        },
        (e) => console.warn(`[pulse] firestore subscribe failed (${collection})`, e)
      );
    })
    .catch((e) => console.warn("[pulse] firebase init failed", e));
}

const ID_PREFIXES = {
  users: "u",
  highFives: "hf",
  priorities: "p",
  okrs: "okr",
  oneOnOnes: "oo",
  checkIns: "ci",
  openMic: "om",
  feedbackRequests: "fr",
};

function generateId(collection) {
  const prefix = ID_PREFIXES[collection] || collection.slice(0, 2);
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function add(collection, doc) {
  const withId = { ...doc, id: doc.id || generateId(collection) };
  localState[collection] = [withId, ...(localState[collection] || [])];
  saveLocal(localState);
  notify(collection);
  // Firestore mirror is best-effort and never blocks the optimistic UI update.
  if (firebaseEnabled) {
    ensureFirebase()
      .then(async (fb) => {
        if (!fb) return;
        const { doc: docRef, setDoc, collection: col } = fb.firestoreMod;
        await setDoc(docRef(col(fb.db, collection), withId.id), withId);
      })
      .catch((e) => console.warn("[pulse] firestore add failed", e));
  }
  return withId;
}

export async function update(collection, id, patch) {
  const arr = localState[collection] || [];
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  // Replace the array (not just the element) — subscribers are React
  // setState calls, which bail out if handed the same reference.
  const next = [...arr];
  next[idx] = { ...arr[idx], ...patch };
  localState[collection] = next;
  saveLocal(localState);
  notify(collection);
  if (firebaseEnabled) {
    ensureFirebase()
      .then(async (fb) => {
        if (!fb) return;
        const { doc: docRef, updateDoc, collection: col } = fb.firestoreMod;
        await updateDoc(docRef(col(fb.db, collection), id), patch);
      })
      .catch((e) => console.warn("[pulse] firestore update failed", e));
  }
  return next[idx];
}

export async function remove(collection, id) {
  localState[collection] = (localState[collection] || []).filter(
    (x) => x.id !== id
  );
  saveLocal(localState);
  notify(collection);
  if (firebaseEnabled) {
    ensureFirebase()
      .then(async (fb) => {
        if (!fb) return;
        const { doc: docRef, deleteDoc, collection: col } = fb.firestoreMod;
        await deleteDoc(docRef(col(fb.db, collection), id));
      })
      .catch((e) => console.warn("[pulse] firestore delete failed", e));
  }
}
