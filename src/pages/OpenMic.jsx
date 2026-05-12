import React, { useMemo, useState } from "react";
import { useApp, userAvatar, userName } from "../context/AppContext.jsx";
import { add } from "../lib/store.js";
import { MessageSquare, Send } from "lucide-react";

// Open Mic is the always-on bucket for spontaneous feedback. We also pull in
// any `openMic` notes left in this week's check-ins so nothing falls through.

export default function OpenMic() {
  const { currentUser, users, openMic, checkIns } = useApp();
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [posting, setPosting] = useState(false);

  const fromCheckIns = useMemo(
    () =>
      checkIns
        .filter((c) => c.openMic && c.openMic.trim())
        .map((c) => ({
          id: `from_${c.id}`,
          text: c.openMic,
          authorId: c.userId,
          anon: false,
          source: "check-in",
          createdAt: c.createdAt,
        })),
    [checkIns]
  );

  const combined = useMemo(() => {
    return [...openMic, ...fromCheckIns].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  }, [openMic, fromCheckIns]);

  async function post(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    await add("openMic", {
      text: text.trim(),
      authorId: anon ? null : currentUser.id,
      anon,
      source: "open-mic",
      createdAt: Date.now(),
    });
    setText("");
    setPosting(false);
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <form onSubmit={post} className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-pulse-700 font-semibold">
          <MessageSquare size={18} />
          Drop a thought
        </div>
        <p className="muted">
          Anything not tied to a weekly prompt — questions, ideas, concerns.
          Optionally anonymous.
        </p>
        <textarea
          className="field min-h-[100px]"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <label className="text-sm flex items-center gap-2 text-ink-700">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
            />
            Post anonymously
          </label>
          <button disabled={!text.trim() || posting} className="btn-primary">
            <Send size={14} /> {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {combined.map((item) => {
          const isAnon = item.anon || !item.authorId;
          return (
            <article key={item.id} className="card p-5">
              <header className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pulse-100 flex items-center justify-center text-lg">
                  {isAnon ? "🕶️" : userAvatar(users, item.authorId)}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">
                    {isAnon ? "Anonymous" : userName(users, item.authorId)}
                  </div>
                  <div className="text-xs text-ink-500">
                    {item.source === "check-in" ? "from weekly check-in · " : ""}
                    {timeAgo(item.createdAt)}
                  </div>
                </div>
              </header>
              <p className="mt-3 text-ink-900 whitespace-pre-wrap">{item.text}</p>
            </article>
          );
        })}
        {combined.length === 0 && (
          <p className="muted">No open-mic posts yet — be the first.</p>
        )}
      </div>
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
