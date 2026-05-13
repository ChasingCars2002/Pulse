import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { questionsForWeek, currentWeekKey } from "../lib/questionEngine.js";
import { add, update } from "../lib/store.js";
import { postToSlack } from "../lib/slack.js";
import { Sparkles, CheckCircle2, RefreshCw } from "lucide-react";

const MORALE_LABELS = ["Rough", "Low", "Okay", "Good", "Great"];
const DRAFT_KEY = "pulse.checkin.draft";

export default function CheckIn() {
  const { currentUser, checkIns } = useApp();
  const week = currentWeekKey();
  const questions = useMemo(() => questionsForWeek(), []);

  const existing = checkIns.find(
    (c) => c.userId === currentUser?.id && c.week === week
  );

  const [morale, setMorale] = useState(existing?.morale || 4);
  const [win, setWin] = useState(existing?.answers?.win || "");
  const [challenge, setChallenge] = useState(existing?.answers?.challenge || "");
  const [growth, setGrowth] = useState(existing?.answers?.growth || "");
  const [openMic, setOpenMic] = useState(existing?.openMic || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(existing));

  const canSubmit =
    [win, challenge, growth].some((s) => s.trim().length > 0);

  // Local-draft persistence so users don't lose answers on refresh.
  useEffect(() => {
    if (submitted) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw && !existing) {
      try {
        const d = JSON.parse(raw);
        if (d.week === week) {
          setMorale(d.morale ?? 4);
          setWin(d.win ?? "");
          setChallenge(d.challenge ?? "");
          setGrowth(d.growth ?? "");
          setOpenMic(d.openMic ?? "");
        }
      } catch {}
    }
  }, [existing, submitted, week]);

  useEffect(() => {
    if (submitted) return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ week, morale, win, challenge, growth, openMic })
    );
  }, [morale, win, challenge, growth, openMic, submitted, week]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const payload = {
      userId: currentUser.id,
      week,
      morale,
      answers: { win, challenge, growth },
      openMic,
      createdAt: Date.now(),
    };
    if (existing) {
      await update("checkIns", existing.id, payload);
    } else {
      await add("checkIns", payload);
    }
    await postToSlack({
      kind: "check-in",
      text: `${currentUser.name} submitted this week's check-in (morale ${morale}/5).`,
    });
    localStorage.removeItem(DRAFT_KEY);
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card p-8 text-center max-w-xl mx-auto">
        <CheckCircle2 size={40} className="mx-auto text-pulse-600" />
        <h2 className="mt-3 text-2xl font-bold">You're checked in for {week}.</h2>
        <p className="muted mt-2">
          Your manager will see your answers in their next 1-on-1 prep. Slack has
          been pinged.
        </p>
        <button
          className="btn-secondary mt-5"
          onClick={() => setSubmitted(false)}
        >
          <RefreshCw size={14} />
          Edit my check-in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="card p-5">
        <div className="flex items-center gap-2 text-pulse-700 text-sm font-semibold">
          <Sparkles size={16} />
          Dynamic prompts · {week}
        </div>
        <p className="muted mt-1">
          Pulse rotates prompts each week so check-ins stay generative instead of rote.
        </p>
      </div>

      <div className="card p-6">
        <label className="label">Morale check</label>
        <p className="muted mb-4">How's the week going overall?</p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setMorale(n)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                morale === n
                  ? "border-pulse-500 bg-pulse-100 text-pulse-700"
                  : "border-ink-100 text-ink-700 hover:border-pulse-300"
              }`}
            >
              <div className="text-2xl mb-1">{["😞", "😕", "😐", "🙂", "😄"][n - 1]}</div>
              {MORALE_LABELS[n - 1]}
            </button>
          ))}
        </div>
      </div>

      <PromptCard
        axis="Win"
        prompt={questions.win.prompt}
        themes={questions.win.themes}
        value={win}
        onChange={setWin}
      />
      <PromptCard
        axis="Challenge"
        prompt={questions.challenge.prompt}
        themes={questions.challenge.themes}
        value={challenge}
        onChange={setChallenge}
      />
      <PromptCard
        axis="Growth"
        prompt={questions.growth.prompt}
        themes={questions.growth.themes}
        value={growth}
        onChange={setGrowth}
      />

      <div className="card p-6">
        <label className="label">Open mic</label>
        <p className="muted mb-3">
          Anything not tied to the prompts above? Drop it here — it goes to the
          team's Open Mic board.
        </p>
        <textarea
          className="field min-h-[88px]"
          placeholder="Optional. Spontaneous thoughts, questions, ideas…"
          value={openMic}
          onChange={(e) => setOpenMic(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="muted">Draft saved automatically.</p>
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="btn-primary"
          title={canSubmit ? "" : "Fill in at least one prompt to submit."}
        >
          {submitting ? "Submitting…" : "Submit check-in"}
        </button>
      </div>
    </form>
  );
}

function PromptCard({ axis, prompt, themes, value, onChange }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <label className="label !mb-0">{axis}</label>
        <div className="flex flex-wrap gap-1">
          {themes.map((t) => (
            <span key={t} className="chip !bg-ink-100 !text-ink-700">
              {t}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-ink-900 font-medium">{prompt}</p>
      <textarea
        className="field mt-3 min-h-[120px]"
        placeholder="Type your answer…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
