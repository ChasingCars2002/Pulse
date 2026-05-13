// Demo seed data so Pulse feels alive on first run.

import { currentWeekKey } from "./questionEngine.js";

const week = currentWeekKey();

export const seedUsers = [
  { id: "u_you", name: "You (Demo)", role: "Product Engineer", manager: "u_dana", avatar: "🦊" },
  { id: "u_dana", name: "Dana Wu", role: "Engineering Manager", manager: null, avatar: "🐼" },
  { id: "u_marco", name: "Marco Silva", role: "Designer", manager: "u_dana", avatar: "🦉" },
  { id: "u_priya", name: "Priya Anand", role: "PM", manager: "u_dana", avatar: "🦔" },
  { id: "u_jess", name: "Jess Park", role: "Data Engineer", manager: "u_dana", avatar: "🦦" },
];

const daysAgo = (n) => Date.now() - n * 24 * 60 * 60 * 1000;

export const seedHighFives = [
  {
    id: "hf_1",
    fromId: "u_marco",
    toIds: ["u_you"],
    message:
      "Massive thanks to @You for unblocking the checkout flow this week — the new validation logic is so much cleaner.",
    value: "Craft",
    createdAt: daysAgo(1),
    reactions: { "🎉": ["u_dana", "u_priya"], "🙌": ["u_jess"] },
  },
  {
    id: "hf_2",
    fromId: "u_priya",
    toIds: ["u_jess", "u_marco"],
    message:
      "@Jess and @Marco crushed the dashboards review — the new sentiment chart made our exec readout so much sharper.",
    value: "Teamwork",
    createdAt: daysAgo(2),
    reactions: { "🚀": ["u_dana"] },
  },
  {
    id: "hf_3",
    fromId: "u_dana",
    toIds: ["u_priya"],
    message:
      "@Priya thanks for owning the customer interviews this sprint — it changed how we're scoping Q3.",
    value: "Customer Obsession",
    createdAt: daysAgo(4),
    reactions: { "💜": ["u_you", "u_marco"] },
  },
];

export const seedPriorities = [
  {
    id: "p_1",
    userId: "u_you",
    title: "Ship the new check-in v2 flow",
    status: "in_progress",
    okrId: "okr_1",
    source: "github",
    sourceRef: "pulse#142",
    week,
  },
  {
    id: "p_2",
    userId: "u_you",
    title: "Pair with Marco on onboarding empty states",
    status: "todo",
    okrId: "okr_2",
    source: null,
    week,
  },
  {
    id: "p_3",
    userId: "u_you",
    title: "Draft Q3 hiring plan",
    status: "done",
    okrId: "okr_3",
    source: "jira",
    sourceRef: "HR-88",
    week,
  },
];

export const seedOKRs = [
  {
    id: "okr_1",
    title: "Reduce weekly check-in completion friction",
    owner: "u_dana",
    progress: 0.62,
    company: true,
  },
  {
    id: "okr_2",
    title: "Lift first-week activation from 41% → 65%",
    owner: "u_priya",
    progress: 0.45,
    company: true,
  },
  {
    id: "okr_3",
    title: "Hire 2 senior engineers by end of Q3",
    owner: "u_dana",
    progress: 0.5,
    company: true,
  },
];

export const seedOneOnOnes = [
  {
    id: "oo_1",
    managerId: "u_dana",
    reportId: "u_you",
    scheduledFor: daysAgo(-2),
    agenda: [
      { id: "a1", text: "Career growth — what would 'level up' look like next quarter?", from: "u_dana", done: false },
      { id: "a2", text: "Walkthrough of the check-in v2 rollout plan", from: "u_you", done: false },
      { id: "a3", text: "Feedback on last week's retro facilitation", from: "u_you", done: false },
    ],
    notes: "",
    actions: [
      { id: "ac1", text: "Dana to share leveling rubric", owner: "u_dana", done: false },
      { id: "ac2", text: "You to draft promo case 1-pager", owner: "u_you", done: false },
    ],
  },
];

export const seedCheckIns = [
  {
    id: "ci_1",
    userId: "u_marco",
    week,
    morale: 4,
    answers: {
      win: "Shipped the new empty-state illustrations. They look great on mobile.",
      challenge: "Design review queue is backing up — need to triage.",
      growth: "Reading 'Articulating Design Decisions' — chapter 4 was eye-opening.",
    },
    openMic: "",
    createdAt: daysAgo(1),
  },
  {
    id: "ci_2",
    userId: "u_priya",
    week,
    morale: 3,
    answers: {
      win: "Closed two churn-risk accounts after deep-dive interviews.",
      challenge: "Roadmap pressure from sales is making it hard to protect discovery time.",
      growth: "Want to pair more with engineering on tradeoff conversations.",
    },
    openMic: "Should we revisit the prioritization framework? It feels stale.",
    createdAt: daysAgo(2),
  },
  {
    id: "ci_3",
    userId: "u_jess",
    week,
    morale: 4,
    answers: {
      win: "Migrated the events pipeline to the new schema — 30% smaller payloads.",
      challenge: "Still chasing a flaky test on the realtime feed. Energy-draining.",
      growth: "Learned a lot pairing with Marco on the dashboards.",
    },
    openMic: "",
    createdAt: daysAgo(3),
  },
];

export const seedFeedbackRequests = [
  {
    id: "fr_1",
    fromId: "u_dana",
    toId: "u_you",
    question:
      "What's one thing I'm doing well that I should keep doing — and one thing I should change?",
    response: "",
    responded: false,
    createdAt: daysAgo(1),
  },
];

export const seedRecognitionValues = [
  "Craft",
  "Teamwork",
  "Customer Obsession",
  "Ownership",
  "Curiosity",
  "Kindness",
];
