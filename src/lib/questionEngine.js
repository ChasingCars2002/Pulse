// Dynamic question engine.
//
// 15Five's biggest complaint is "the same five questions every week." Pulse
// instead pulls from a pool of research-backed prompts and selects a rotating
// set each week so check-ins stay generative rather than rote.
//
// Selection rules:
//   1. One "win" prompt, one "challenge" prompt, one "growth" prompt
//      (the three universal axes — momentum, friction, learning).
//   2. Within each axis, pick deterministically by ISO-week so everyone on
//      the team gets the same prompt this week (encourages comparison),
//      and so prompts don't repeat for ~6 weeks.
//   3. The pool is tagged with `themes` so an AI summarizer downstream can
//      group answers by theme without re-reading every check-in.

export const QUESTION_POOL = {
  win: [
    {
      id: "win_progress",
      prompt: "What's one piece of work you made real progress on this week?",
      themes: ["momentum", "execution"],
    },
    {
      id: "win_proud",
      prompt: "What did you do this week that you're proud of — even if it's small?",
      themes: ["pride", "motivation"],
    },
    {
      id: "win_help",
      prompt: "Who or what did you help unblock this week?",
      themes: ["teamwork", "leverage"],
    },
    {
      id: "win_customer",
      prompt: "What's one thing you learned from a customer or user this week?",
      themes: ["customer", "learning"],
    },
    {
      id: "win_craft",
      prompt: "What's one craft moment — something you made better than 'good enough'?",
      themes: ["craft", "quality"],
    },
    {
      id: "win_small",
      prompt: "What's a small win that probably won't make it into a status update?",
      themes: ["energy", "momentum"],
    },
  ],
  challenge: [
    {
      id: "chal_block",
      prompt: "What's slowing you down right now — and what would unblock it?",
      themes: ["blockers", "ops"],
    },
    {
      id: "chal_energy",
      prompt: "What drained your energy this week?",
      themes: ["energy", "morale"],
    },
    {
      id: "chal_ambig",
      prompt: "Where do you feel the most ambiguity in your work right now?",
      themes: ["clarity", "scope"],
    },
    {
      id: "chal_help",
      prompt: "Where would a teammate's help compound your week the most?",
      themes: ["teamwork", "leverage"],
    },
    {
      id: "chal_drop",
      prompt: "What's one thing on your plate you wish you could drop?",
      themes: ["focus", "prioritization"],
    },
    {
      id: "chal_risk",
      prompt: "What risk on the team isn't being talked about enough?",
      themes: ["risk", "candor"],
    },
  ],
  growth: [
    {
      id: "gro_learn",
      prompt: "What's one thing you learned this week — from anywhere?",
      themes: ["learning"],
    },
    {
      id: "gro_skill",
      prompt: "Which skill would have made your week 10% easier?",
      themes: ["learning", "leverage"],
    },
    {
      id: "gro_feedback",
      prompt: "What's the most useful piece of feedback you got recently?",
      themes: ["feedback"],
    },
    {
      id: "gro_curiosity",
      prompt: "What's a question you're sitting with right now?",
      themes: ["curiosity", "thinking"],
    },
    {
      id: "gro_role",
      prompt: "Which part of your role do you want to invest more in next month?",
      themes: ["career", "intent"],
    },
    {
      id: "gro_mentor",
      prompt: "Who at the company would you like to learn from this quarter?",
      themes: ["mentorship", "network"],
    },
  ],
};

// ISO-8601 week number *and* week-year. The week-year can differ from the
// calendar year at the boundaries (e.g. Dec 29 2025 is 2026-W01), so the
// week key must come from the year of the week's Thursday, not the date's
// own calendar year.
export function isoWeekParts(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function isoWeekNumber(date = new Date()) {
  return isoWeekParts(date).week;
}

export function currentWeekKey(date = new Date()) {
  const { year, week } = isoWeekParts(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Deterministic pick: same week => same prompt for everyone on the team.
// Each axis is offset differently so the three prompts don't always appear
// in the same combination, and the serial keeps advancing across year
// boundaries instead of snapping back with the week number.
const AXIS_OFFSETS = { win: 0, challenge: 2, growth: 4 };

export function questionsForWeek(date = new Date()) {
  const { year, week } = isoWeekParts(date);
  const serial = year * 53 + week;
  const pick = (axis) => {
    const pool = QUESTION_POOL[axis];
    return pool[(serial + AXIS_OFFSETS[axis]) % pool.length];
  };
  return {
    weekKey: currentWeekKey(date),
    win: pick("win"),
    challenge: pick("challenge"),
    growth: pick("growth"),
  };
}
