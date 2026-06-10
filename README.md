# Pulse

A modern, lightweight performance-management platform — the streamlined successor to 15Five.
Pulse focuses on a tight feedback loop for small-to-mid-sized teams: weekly check-ins, peer
recognition, 1-on-1s, and OKRs, with AI-driven question rotation that kills survey fatigue.

## Features

**Carbon copies of what works**

- **Weekly Check-In** — a 3-question survey covering wins, challenges, and growth, plus a morale slider.
- **High-Fives** — peer-to-peer recognition feed with @-mentions, values, and emoji reactions.
- **1-on-1 Agendas** — shared workspace for managers and reports: talking points, notes, action
  items, plus a "Check-in prep" card surfacing the other person's latest weekly check-in so
  neither side walks in cold.
- **OKR Tracking** — company objectives with editable progress + a personal weekly-priorities
  list linked to them (priorities are keyed to the ISO week, so the list resets every Monday).

**Pulse enhancements (what 15Five users complain about)**

- **Dynamic Question Engine** — prompts rotate weekly from a pool of research-backed questions
  (see [`src/lib/questionEngine.js`](src/lib/questionEngine.js)) so check-ins stay generative.
- **Open Mic** — a persistent, always-on bucket for thoughts that aren't tied to a weekly prompt,
  with anonymous posting and roll-up of `openMic` answers from check-ins.
- **Lightweight architecture** — zero-config: the app boots straight to a working demo with seeded
  data. Firebase is opt-in via env vars; without it, everything persists to `localStorage`.

**Nice-to-haves shipped**

- **GitHub / Jira import** — pull open issues into your weekly priorities (mock connectors today,
  wired so real OAuth flows can drop in).
- **AI Monthly Vibe Report** — auto-summarized morale, sentiment, themes, blockers, and highlights
  across the last 30 days of check-ins (rules-based today; pluggable to an LLM).
- **Cross-functional feedback** — ask anyone in the company for feedback, with templated prompts.
- **Slack-first notifications** — high-fives, check-in submissions, and feedback requests post to
  Slack via a configurable webhook (and show in an in-app feed regardless).

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS, React Router, lucide-react icons
- **Backend:** Firebase (Firestore + Auth) — optional, with a `localStorage` fallback store
- **Notifications:** Slack incoming webhook

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The app runs immediately against a seeded local store.

### Enabling Firebase (real-time multi-user)

```bash
cp .env.example .env
# Fill in VITE_FIREBASE_* with your project values
npm run dev
```

When Firebase env vars are present, Pulse subscribes to Firestore snapshots for live updates on
the High-Five feed and other collaborative surfaces, and signs users in anonymously for the demo.
On first connect against an empty project, Pulse seeds the remote collections from the local demo
data so the workspace starts alive. Replace
`signInAnonymously` in [`src/lib/store.js`](src/lib/store.js) with your real auth flow for prod.

### Enabling Slack

Set `VITE_SLACK_WEBHOOK_URL` to a Slack incoming webhook. Without it, events still appear in the
in-app Slack activity feed in the sidebar.

## Project layout

```
src/
  components/Shell.jsx        # app frame: sidebar, top bar, Slack panel
  context/AppContext.jsx      # one-stop provider for all collections
  lib/
    firebase.js               # initialization + feature detection
    store.js                  # unified add/update/remove/subscribe API
    seed.js                   # demo data so first-run is alive
    questionEngine.js         # weekly prompt rotation
    vibeReport.js             # rules-based summary for the Monthly Vibe Report
    slack.js                  # webhook + in-app feed
    integrations.js           # GitHub/Jira mock connectors
  pages/
    Dashboard.jsx CheckIn.jsx HighFives.jsx OneOnOnes.jsx OKRs.jsx
    OpenMic.jsx VibeReport.jsx RequestFeedback.jsx Settings.jsx
```

## Design principles

1. **Plug and play** — the app must be useful in 0 seconds, configurable in 5 minutes.
2. **No survey fatigue** — every weekly prompt is different; the same prompt never appears for
   ~6 weeks within a single axis.
3. **Async-friendly defaults** — every recognition, feedback request, and check-in pings Slack;
   nothing requires a meeting.
4. **AI as glue, not gatekeeper** — summarization (Vibe Report) and question rotation are
   "AI-shaped" features that work without any external LLM, and degrade gracefully.
