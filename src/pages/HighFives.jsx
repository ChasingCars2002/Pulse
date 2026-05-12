import React, { useMemo, useState } from "react";
import { useApp, userAvatar, userName } from "../context/AppContext.jsx";
import { add, update } from "../lib/store.js";
import { postToSlack } from "../lib/slack.js";
import { seedRecognitionValues } from "../lib/seed.js";
import { Hand, Send } from "lucide-react";

const REACTIONS = ["🎉", "🙌", "🚀", "💜", "🔥", "👏"];

export default function HighFives() {
  const { currentUser, users, highFives } = useApp();
  const others = users.filter((u) => u.id !== currentUser?.id);

  const [message, setMessage] = useState("");
  const [toIds, setToIds] = useState([]);
  const [value, setValue] = useState(seedRecognitionValues[0]);
  const [posting, setPosting] = useState(false);

  const sorted = useMemo(
    () => [...highFives].sort((a, b) => b.createdAt - a.createdAt),
    [highFives]
  );

  function toggleRecipient(id) {
    setToIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!message.trim() || toIds.length === 0) return;
    setPosting(true);
    const recipients = toIds.map((id) => userName(users, id)).join(", ");
    await add("highFives", {
      fromId: currentUser.id,
      toIds,
      message,
      value,
      createdAt: Date.now(),
      reactions: {},
    });
    await postToSlack({
      kind: "high-five",
      text: `${currentUser.name} → ${recipients} (${value}): "${message.slice(0, 80)}"`,
    });
    setMessage("");
    setToIds([]);
    setPosting(false);
  }

  async function react(hf, emoji) {
    const next = { ...(hf.reactions || {}) };
    const list = next[emoji] || [];
    next[emoji] = list.includes(currentUser.id)
      ? list.filter((x) => x !== currentUser.id)
      : [...list, currentUser.id];
    if (next[emoji].length === 0) delete next[emoji];
    await update("highFives", hf.id, { reactions: next });
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-4">
        <form onSubmit={handlePost} className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-pulse-700 font-semibold">
            <Hand size={18} />
            Send a High-Five
          </div>
          <textarea
            className="field min-h-[88px]"
            placeholder="What did they do that's worth celebrating? @ mention with the chips below."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div>
            <div className="label">To</div>
            <div className="flex flex-wrap gap-2">
              {others.map((u) => {
                const selected = toIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleRecipient(u.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
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
          <div>
            <div className="label">Value</div>
            <div className="flex flex-wrap gap-2">
              {seedRecognitionValues.map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setValue(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    value === v
                      ? "border-pulse-500 bg-pulse-100 text-pulse-700"
                      : "border-ink-100 text-ink-700 hover:border-pulse-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="muted">Recipients will be notified in Slack.</p>
            <button
              disabled={!message.trim() || toIds.length === 0 || posting}
              className="btn-primary"
            >
              <Send size={14} />
              {posting ? "Sending…" : "Send"}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {sorted.map((hf) => (
            <article key={hf.id} className="card p-5">
              <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pulse-100 flex items-center justify-center text-xl">
                  {userAvatar(users, hf.fromId)}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-semibold">{userName(users, hf.fromId)}</span>
                    <span className="text-ink-500"> celebrated </span>
                    <span className="font-semibold">
                      {hf.toIds.map((id) => userName(users, id)).join(", ")}
                    </span>
                  </div>
                  <div className="text-xs text-ink-500">
                    {timeAgo(hf.createdAt)} · {hf.value}
                  </div>
                </div>
              </header>
              <p className="mt-3 text-ink-900">{hf.message}</p>
              <div className="mt-3 flex items-center gap-1">
                {REACTIONS.map((emoji) => {
                  const count = (hf.reactions || {})[emoji]?.length || 0;
                  const mine = (hf.reactions || {})[emoji]?.includes(currentUser?.id);
                  return (
                    <button
                      key={emoji}
                      onClick={() => react(hf, emoji)}
                      className={`text-sm rounded-full px-2 py-1 transition ${
                        count > 0
                          ? mine
                            ? "bg-pulse-100 text-pulse-700"
                            : "bg-ink-100/60 text-ink-700"
                          : "text-ink-500 hover:bg-pulse-100"
                      }`}
                    >
                      {emoji} {count > 0 ? count : ""}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="card p-5 sticky top-24">
        <h3 className="section-title">Top recognized values</h3>
        <p className="muted mt-1 mb-4">This is how your team shows what matters.</p>
        <ValueLeaderboard highFives={highFives} />
      </aside>
    </div>
  );
}

function ValueLeaderboard({ highFives }) {
  const counts = {};
  for (const hf of highFives) counts[hf.value] = (counts[hf.value] || 0) + 1;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...Object.values(counts));
  return (
    <ul className="space-y-3">
      {ranked.map(([v, n]) => (
        <li key={v}>
          <div className="flex justify-between text-sm">
            <span className="font-medium">{v}</span>
            <span className="text-ink-500">{n}</span>
          </div>
          <div className="h-1.5 rounded-full bg-pulse-100 overflow-hidden mt-1">
            <div className="h-full bg-pulse-500" style={{ width: `${(n / max) * 100}%` }} />
          </div>
        </li>
      ))}
      {ranked.length === 0 && (
        <li className="muted">No high-fives yet — go celebrate someone.</li>
      )}
    </ul>
  );
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
