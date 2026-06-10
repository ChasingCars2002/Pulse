import React, { useEffect, useState } from "react";
import { useApp, userName } from "../context/AppContext.jsx";
import { add, update, remove } from "../lib/store.js";
import { fetchGithubIssues, fetchJiraIssues } from "../lib/integrations.js";
import { currentWeekKey } from "../lib/questionEngine.js";
import { Target, Plus, Trash2, Github, Link2 } from "lucide-react";

const STATUS_LABEL = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};
const STATUS_COLOR = {
  todo: "bg-ink-100 text-ink-700",
  in_progress: "bg-pulse-100 text-pulse-700",
  done: "bg-emerald-100 text-emerald-700",
};

export default function OKRs() {
  const { currentUser, users, okrs, priorities } = useApp();
  const week = currentWeekKey();
  const mine = priorities.filter(
    (p) => p.userId === currentUser?.id && p.week === week
  );

  const [newTitle, setNewTitle] = useState("");
  const [newOkr, setNewOkr] = useState(okrs[0]?.id || "");
  const [imports, setImports] = useState([]);
  const [importsOpen, setImportsOpen] = useState(false);

  const importedRefs = new Set(mine.map((p) => p.sourceRef).filter(Boolean));

  useEffect(() => {
    if (!importsOpen) return;
    Promise.all([fetchGithubIssues(), fetchJiraIssues()]).then(([g, j]) =>
      setImports([...g, ...j])
    );
  }, [importsOpen]);

  async function addPriority(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await add("priorities", {
      userId: currentUser.id,
      title: newTitle.trim(),
      status: "todo",
      okrId: newOkr || null,
      source: null,
      week,
    });
    setNewTitle("");
  }

  async function importItem(item) {
    if (importedRefs.has(item.ref)) return;
    await add("priorities", {
      userId: currentUser.id,
      title: item.title,
      status: "todo",
      okrId: newOkr || null,
      source: item.source,
      sourceRef: item.ref,
      week,
    });
  }

  async function cycleStatus(p) {
    const next =
      p.status === "todo" ? "in_progress" : p.status === "in_progress" ? "done" : "todo";
    await update("priorities", p.id, { status: next });
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Target size={18} className="text-pulse-600" />
          Company objectives
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {okrs.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="text-xs text-ink-500 uppercase tracking-wide">
                Owner · {userName(users, o.owner)}
              </div>
              <p className="mt-2 font-semibold leading-snug">{o.title}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-ink-500">Progress</span>
                <span className="font-medium">{Math.round(o.progress * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(o.progress * 100)}
                onChange={(e) =>
                  update("okrs", o.id, { progress: Number(e.target.value) / 100 })
                }
                className="w-full mt-2 accent-pulse-600"
                aria-label={`Update progress for ${o.title}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">My weekly priorities</h2>
          <button onClick={() => setImportsOpen((v) => !v)} className="btn-secondary">
            <Github size={14} /> Import from GitHub/Jira
          </button>
        </div>

        {importsOpen && (
          <div className="rounded-lg border border-dashed border-pulse-300 p-4 mb-4 bg-pulse-50/50">
            <p className="muted mb-3">Click an item to pull it in as a priority.</p>
            <ul className="space-y-2">
              {imports.map((i) => {
                const imported = importedRefs.has(i.ref);
                return (
                  <li key={i.id}>
                    <button
                      onClick={() => importItem(i)}
                      disabled={imported}
                      className="w-full text-left rounded-lg bg-white border border-ink-100 px-3 py-2 hover:border-pulse-400 flex items-center gap-3 disabled:opacity-50 disabled:hover:border-ink-100"
                    >
                      <span className="text-xs font-mono text-ink-500 shrink-0">{i.ref}</span>
                      <span className="text-sm">{i.title}</span>
                      {imported ? (
                        <span className="ml-auto chip shrink-0">Added</span>
                      ) : (
                        <Link2 size={14} className="ml-auto text-ink-300" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <ul className="space-y-2">
          {mine.map((p) => (
            <li key={p.id} className="flex items-center gap-3 border border-ink-100 rounded-lg px-3 py-2 bg-white">
              <button
                onClick={() => cycleStatus(p)}
                className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status]}`}
                title="Click to advance status"
              >
                {STATUS_LABEL[p.status]}
              </button>
              <div className="flex-1">
                <p className="text-sm">{p.title}</p>
                <div className="text-xs text-ink-500 flex items-center gap-2">
                  {p.source && (
                    <span className="font-mono">
                      {p.source}:{p.sourceRef}
                    </span>
                  )}
                  {p.okrId && okrs.some((o) => o.id === p.okrId) && (
                    <span>→ {truncate(okrs.find((o) => o.id === p.okrId).title, 40)}</span>
                  )}
                </div>
              </div>
              <button
                className="text-ink-300 hover:text-rose-500"
                onClick={() => remove("priorities", p.id)}
                aria-label="Delete priority"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {mine.length === 0 && (
            <li className="muted">
              No priorities yet for this week. Add one below or import from GitHub/Jira.
            </li>
          )}
        </ul>

        <form onSubmit={addPriority} className="mt-4 flex gap-2">
          <input
            className="field"
            placeholder="Add a priority for this week…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <select
            className="field !w-auto"
            value={newOkr}
            onChange={(e) => setNewOkr(e.target.value)}
          >
            <option value="">No objective</option>
            {okrs.map((o) => (
              <option key={o.id} value={o.id}>
                {truncate(o.title, 36)}
              </option>
            ))}
          </select>
          <button className="btn-primary" disabled={!newTitle.trim()}>
            <Plus size={14} /> Add
          </button>
        </form>
      </section>
    </div>
  );
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
