// Generates a "Monthly Vibe Report" without requiring an external LLM —
// it does light NLP (keyword tagging, sentiment scoring, theme extraction)
// over check-ins from the last 30 days. The output reads like a manager
// brief so the user gets value even before plugging in an LLM.

const POSITIVE = [
  "great", "love", "excited", "shipped", "win", "proud", "unblocked",
  "energized", "clear", "momentum", "crushed", "celebrate", "good", "fun",
];
const NEGATIVE = [
  "stuck", "blocked", "frustrated", "tired", "drained", "draining", "ambiguous",
  "unclear", "stress", "stressed", "burnout", "behind", "miss", "risk",
  "concern", "concerned", "slow", "fatigue", "overwhelmed", "flaky",
  "pressure", "backing up", "backed up", "chasing", "debt",
];

const THEME_WORDS = {
  Hiring: ["hire", "hiring", "interview", "candidate", "recruit"],
  Roadmap: ["roadmap", "scope", "prioritization", "prioritize", "priorities", "planning"],
  Process: ["process", "review", "queue", "meeting", "standup", "retro"],
  Customer: ["customer", "user", "interview", "feedback", "churn"],
  Tooling: ["tool", "tooling", "ci", "build", "test", "deploy", "deploys"],
  Career: ["career", "growth", "promo", "level", "leveling"],
  Wellbeing: ["tired", "drained", "burnout", "energy", "stress"],
};

function score(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let s = 0;
  for (const w of POSITIVE) if (lower.includes(w)) s += 1;
  for (const w of NEGATIVE) if (lower.includes(w)) s -= 1;
  return s;
}

function extractThemes(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const hit = [];
  for (const [theme, words] of Object.entries(THEME_WORDS)) {
    if (words.some((w) => lower.includes(w))) hit.push(theme);
  }
  return hit;
}

export function buildVibeReport(checkIns, users, { sinceDays = 30 } = {}) {
  const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  const recent = checkIns.filter((c) => (c.createdAt || 0) >= since);

  if (recent.length === 0) {
    return {
      empty: true,
      headline: "Not enough check-ins yet to summarize.",
      body: "Once your team submits a few weekly check-ins, Pulse will roll them up here.",
    };
  }

  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  const moraleAvg =
    recent.reduce((acc, c) => acc + (c.morale || 0), 0) / recent.length;

  let textScore = 0;
  const themeCounts = {};
  const blockers = [];
  const highlights = [];

  for (const c of recent) {
    const all = [c.answers?.win, c.answers?.challenge, c.answers?.growth, c.openMic]
      .filter(Boolean)
      .join(" \n ");
    // Tone deliberately excludes the challenge answer: that prompt asks for
    // friction, so scoring it would skew every report negative. Challenges
    // feed the blockers list below instead.
    const tone = [c.answers?.win, c.answers?.growth, c.openMic]
      .filter(Boolean)
      .join(" \n ");
    textScore += score(tone);
    for (const t of extractThemes(all)) {
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    }
    const author = userById[c.userId]?.name || "Someone";
    if (c.answers?.challenge && score(c.answers.challenge) < 0) {
      blockers.push({ author, text: c.answers.challenge });
    }
    if (c.answers?.win && score(c.answers.win) > 0) {
      highlights.push({ author, text: c.answers.win });
    }
  }

  const sentiment =
    textScore > 3 ? "upbeat" : textScore < -3 ? "strained" : "steady";

  const themes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  const moraleWord =
    moraleAvg >= 4.2 ? "strong" :
    moraleAvg >= 3.5 ? "healthy" :
    moraleAvg >= 2.8 ? "mixed" : "low";

  const headline = `Team morale is ${moraleWord} (${moraleAvg.toFixed(1)}/5) with an overall ${sentiment} tone.`;

  return {
    empty: false,
    headline,
    moraleAvg,
    sentiment,
    themes,
    blockers: blockers.slice(0, 4),
    highlights: highlights.slice(0, 4),
    checkInCount: recent.length,
  };
}
