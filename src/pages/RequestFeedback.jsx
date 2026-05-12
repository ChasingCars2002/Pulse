import React, { useState } from "react";
import { useApp, userAvatar, userName } from "../context/AppContext.jsx";
import { add, update } from "../lib/store.js";
import { postToSlack } from "../lib/slack.js";
import { Inbox, Send } from "lucide-react";

const PROMPT_TEMPLATES = [
  "What's one thing I'm doing well that I should keep doing?",
  "What's one thing I should start or stop doing?",
  "How did I do on the project we worked on together?",
  "Where do you think I'm holding back the team?",
];

export default function RequestFeedback() {
  const { currentUser, users, feedbackRequests } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);

  const [askIds, setAskIds] = useState([]);
  const [question, setQuestion] = useState(PROMPT_TEMPLATES[0]);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState({});

  const myOutgoing = feedbackRequests.filter((r) => r.fromId === currentUser?.id);
  const myIncoming = feedbackRequests.filter(
    (r) => r.toId === currentUser?.id && !r.responded
  );

  function toggle(id) {
    setAskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function send(e) {
    e.preventDefault();
    if (askIds.length === 0 || !question.trim()) return;
    setSending(true);
    for (const toId of askIds) {
      await add("feedbackRequests", {
        fromId: currentUser.id,
        toId,
        question: question.trim(),
        response: "",
        responded: false,
        createdAt: Date.now(),
      });
      await postToSlack({
        kind: "feedback",
        text: `${currentUser.name} asked ${userName(users, toId)} for feedback: "${question.slice(0, 60)}"`,
      });
    }
    setAskIds([]);
    setSending(false);
  }

  async function respond(req) {
    const text = (reply[req.id] || "").trim();
    if (!text) return;
    await update("feedbackRequests", req.id, {
      response: text,
      responded: true,
      respondedAt: Date.now(),
    });
    await postToSlack({
      kind: "feedback",
      text: `${currentUser.name} replied to a feedback request from ${userName(
        users,
        req.fromId
      )}.`,
    });
    setReply((m) => ({ ...m, [req.id]: "" }));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={send} className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-pulse-700 font-semibold">
          <Inbox size={18} />
          Ask anyone for feedback
        </div>
        <p className="muted">
          Cross-functional feedback. Ask anyone in the company — not just your
          manager.
        </p>

        <div>
          <div className="label">Question</div>
          <textarea
            className="field min-h-[80px]"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {PROMPT_TEMPLATES.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setQuestion(p)}
                className={`text-xs rounded-full border px-2 py-1 ${
                  question === p
                    ? "border-pulse-500 bg-pulse-100 text-pulse-700"
                    : "border-ink-100 text-ink-700 hover:border-pulse-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Ask</div>
          <div className="flex flex-wrap gap-2">
            {others.map((u) => {
              const selected = askIds.includes(u.id);
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                    selected
                      ? "border-pulse-500 bg-pulse-100 text-pulse-700"
                      : "border-ink-100 text-ink-700 hover:border-pulse-300"
                  }`}
                >
                  <span>{u.avatar}</span> {u.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="muted">Each person gets a Slack DM with your question.</p>
          <button
            disabled={askIds.length === 0 || !question.trim() || sending}
            className="btn-primary"
          >
            <Send size={14} /> {sending ? "Sending…" : `Send (${askIds.length})`}
          </button>
        </div>
      </form>

      {myIncoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="section-title">Requests for you</h3>
          {myIncoming.map((r) => (
            <article key={r.id} className="card p-5">
              <header className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pulse-100 flex items-center justify-center text-lg">
                  {userAvatar(users, r.fromId)}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{userName(users, r.fromId)} asked:</div>
                  <p className="text-ink-700">{r.question}</p>
                </div>
              </header>
              <textarea
                className="field mt-3 min-h-[80px]"
                placeholder="Be kind, specific, and helpful."
                value={reply[r.id] || ""}
                onChange={(e) =>
                  setReply((m) => ({ ...m, [r.id]: e.target.value }))
                }
              />
              <div className="mt-2 flex justify-end">
                <button
                  className="btn-primary"
                  onClick={() => respond(r)}
                  disabled={!(reply[r.id] || "").trim()}
                >
                  Send feedback
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="section-title">Your requests</h3>
        {myOutgoing.length === 0 && (
          <p className="muted">You haven't asked for feedback yet.</p>
        )}
        {myOutgoing.map((r) => (
          <article key={r.id} className="card p-5">
            <div className="text-sm">
              <span className="font-semibold">To {userName(users, r.toId)}:</span>{" "}
              <span className="text-ink-700">{r.question}</span>
            </div>
            {r.responded ? (
              <p className="mt-2 text-ink-900 border-l-2 border-pulse-500 pl-3">
                {r.response}
              </p>
            ) : (
              <p className="muted mt-2">Awaiting reply…</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
