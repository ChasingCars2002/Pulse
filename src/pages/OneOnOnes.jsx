import React, { useState } from "react";
import { useApp, userName } from "../context/AppContext.jsx";
import { add, update } from "../lib/store.js";
import { Users, Plus, CheckCircle2, Circle, Calendar } from "lucide-react";

export default function OneOnOnes() {
  const { currentUser, users, oneOnOnes } = useApp();
  // Show 1-on-1s where the current user is manager or report.
  const mine = oneOnOnes.filter(
    (o) => o.managerId === currentUser?.id || o.reportId === currentUser?.id
  );

  const [activeId, setActiveId] = useState(mine[0]?.id || null);
  const active = mine.find((o) => o.id === activeId) || mine[0];

  async function createNew() {
    const reportCandidate = users.find((u) => u.manager === currentUser?.id);
    const managerCandidate = users.find((u) => u.id === currentUser?.manager);
    const partner = reportCandidate || managerCandidate;
    if (!partner) return;
    const isManager = Boolean(reportCandidate);
    const doc = await add("oneOnOnes", {
      managerId: isManager ? currentUser.id : partner.id,
      reportId: isManager ? partner.id : currentUser.id,
      scheduledFor: Date.now() + 7 * 24 * 60 * 60 * 1000,
      agenda: [],
      notes: "",
      actions: [],
    });
    setActiveId(doc.id);
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
      <aside className="space-y-2">
        <button onClick={createNew} className="btn-secondary w-full">
          <Plus size={14} /> New 1-on-1
        </button>
        <ul className="space-y-1.5 mt-3">
          {mine.map((o) => {
            const other =
              o.managerId === currentUser?.id ? o.reportId : o.managerId;
            const isActive = active?.id === o.id;
            return (
              <li key={o.id}>
                <button
                  onClick={() => setActiveId(o.id)}
                  className={`w-full text-left rounded-lg p-3 border transition ${
                    isActive
                      ? "border-pulse-500 bg-white shadow-card"
                      : "border-transparent hover:bg-white"
                  }`}
                >
                  <div className="text-sm font-semibold">{userName(users, other)}</div>
                  <div className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} />
                    {new Date(o.scheduledFor).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </button>
              </li>
            );
          })}
          {mine.length === 0 && (
            <li className="muted px-1">No 1-on-1s yet. Create one to get started.</li>
          )}
        </ul>
      </aside>

      {active ? <OneOnOnePane key={active.id} meeting={active} /> : (
        <div className="card p-8 text-center">
          <Users className="mx-auto text-pulse-600" />
          <p className="mt-2 muted">Create a 1-on-1 to start a shared agenda.</p>
        </div>
      )}
    </div>
  );
}

function OneOnOnePane({ meeting }) {
  const { currentUser, users } = useApp();
  const other =
    meeting.managerId === currentUser?.id ? meeting.reportId : meeting.managerId;

  const [newAgenda, setNewAgenda] = useState("");
  const [newAction, setNewAction] = useState("");
  const [notes, setNotes] = useState(meeting.notes || "");

  async function addAgenda(e) {
    e.preventDefault();
    if (!newAgenda.trim()) return;
    const next = [
      ...meeting.agenda,
      {
        id: Math.random().toString(36).slice(2, 9),
        text: newAgenda.trim(),
        from: currentUser.id,
        done: false,
      },
    ];
    await update("oneOnOnes", meeting.id, { agenda: next });
    setNewAgenda("");
  }

  async function toggleAgenda(id) {
    const next = meeting.agenda.map((a) =>
      a.id === id ? { ...a, done: !a.done } : a
    );
    await update("oneOnOnes", meeting.id, { agenda: next });
  }

  async function addAction(e) {
    e.preventDefault();
    if (!newAction.trim()) return;
    const next = [
      ...meeting.actions,
      {
        id: Math.random().toString(36).slice(2, 9),
        text: newAction.trim(),
        owner: currentUser.id,
        done: false,
      },
    ];
    await update("oneOnOnes", meeting.id, { actions: next });
    setNewAction("");
  }

  async function toggleAction(id) {
    const next = meeting.actions.map((a) =>
      a.id === id ? { ...a, done: !a.done } : a
    );
    await update("oneOnOnes", meeting.id, { actions: next });
  }

  async function saveNotes() {
    await update("oneOnOnes", meeting.id, { notes });
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-500 uppercase tracking-wide">1-on-1 with</div>
            <h2 className="text-xl font-bold mt-1">{userName(users, other)}</h2>
          </div>
          <div className="text-sm text-ink-500 text-right">
            <div>
              {new Date(meeting.scheduledFor).toLocaleString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            <div className="text-xs">Shared workspace · saves as you type</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-3">Agenda</h3>
        <ul className="space-y-2">
          {meeting.agenda.map((a) => (
            <li key={a.id} className="flex items-start gap-2">
              <button onClick={() => toggleAgenda(a.id)} className="mt-0.5">
                {a.done ? (
                  <CheckCircle2 size={18} className="text-pulse-600" />
                ) : (
                  <Circle size={18} className="text-ink-300" />
                )}
              </button>
              <div className="flex-1">
                <p className={`text-sm ${a.done ? "line-through text-ink-300" : ""}`}>
                  {a.text}
                </p>
                <div className="text-xs text-ink-500">
                  added by {userName(users, a.from)}
                </div>
              </div>
            </li>
          ))}
          {meeting.agenda.length === 0 && (
            <li className="muted">No agenda items yet — add one below.</li>
          )}
        </ul>
        <form onSubmit={addAgenda} className="mt-4 flex gap-2">
          <input
            className="field"
            value={newAgenda}
            placeholder="Add a talking point…"
            onChange={(e) => setNewAgenda(e.target.value)}
          />
          <button className="btn-primary" disabled={!newAgenda.trim()}>
            Add
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-3">Shared notes</h3>
        <textarea
          className="field min-h-[140px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Capture decisions, context, follow-ups…"
        />
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-3">Action items</h3>
        <ul className="space-y-2">
          {meeting.actions.map((a) => (
            <li key={a.id} className="flex items-start gap-2">
              <button onClick={() => toggleAction(a.id)} className="mt-0.5">
                {a.done ? (
                  <CheckCircle2 size={18} className="text-pulse-600" />
                ) : (
                  <Circle size={18} className="text-ink-300" />
                )}
              </button>
              <div className="flex-1">
                <p className={`text-sm ${a.done ? "line-through text-ink-300" : ""}`}>
                  {a.text}
                </p>
                <div className="text-xs text-ink-500">owner: {userName(users, a.owner)}</div>
              </div>
            </li>
          ))}
          {meeting.actions.length === 0 && (
            <li className="muted">No actions captured yet.</li>
          )}
        </ul>
        <form onSubmit={addAction} className="mt-4 flex gap-2">
          <input
            className="field"
            value={newAction}
            placeholder="Add a follow-up…"
            onChange={(e) => setNewAction(e.target.value)}
          />
          <button className="btn-primary" disabled={!newAction.trim()}>
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
