import React from "react";
import { Link } from "react-router-dom";
import { useApp, userName, userAvatar } from "../context/AppContext.jsx";
import { currentWeekKey, questionsForWeek } from "../lib/questionEngine.js";
import { Sparkles, Hand, Target, ClipboardCheck, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { currentUser, checkIns, highFives, priorities, okrs, users } = useApp();
  const week = currentWeekKey();
  const myCheckIn = checkIns.find(
    (c) => c.userId === currentUser?.id && c.week === week
  );
  const q = questionsForWeek();
  const myPriorities = priorities.filter(
    (p) => p.userId === currentUser?.id && p.week === week
  );
  const teamCheckIns = checkIns.filter((c) => c.week === week);
  const weeklyHighFives = highFives.filter(
    (hf) => hf.createdAt && currentWeekKey(new Date(hf.createdAt)) === week
  );
  const recentHighFives = [...highFives]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="card p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-pulse-100 flex items-center justify-center text-3xl">
          {currentUser?.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Hey {currentUser?.name.split(" ")[0]} 👋
          </h2>
          <p className="muted mt-1">
            {myCheckIn
              ? "Your check-in is in for this week. Nice."
              : "You haven't checked in this week. It takes about 3 minutes."}
          </p>
        </div>
        {!myCheckIn && (
          <Link to="/check-in" className="btn-primary">
            <ClipboardCheck size={16} />
            Start check-in
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={ClipboardCheck}
          label="Team check-ins this week"
          value={`${teamCheckIns.length} / ${users.length}`}
          to="/check-in"
        />
        <StatCard
          icon={Hand}
          label="High-fives this week"
          value={weeklyHighFives.length}
          to="/high-fives"
        />
        <StatCard
          icon={Target}
          label="My priorities"
          value={`${myPriorities.filter((p) => p.status === "done").length} / ${myPriorities.length}`}
          to="/okrs"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title flex items-center gap-2">
              <Sparkles size={18} className="text-pulse-600" />
              This week's prompt
            </div>
            <span className="chip">Rotates weekly</span>
          </div>
          <p className="text-ink-900 leading-relaxed">"{q.win.prompt}"</p>
          <p className="muted mt-2">
            Two more prompts unlock when you start your check-in.
          </p>
          <Link to="/check-in" className="btn-primary mt-4">
            Answer now <ArrowRight size={14} />
          </Link>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title flex items-center gap-2">
              <Hand size={18} className="text-pulse-600" />
              Recent recognition
            </div>
            <Link to="/high-fives" className="text-sm text-pulse-700 hover:underline">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {recentHighFives.map((hf) => (
              <li key={hf.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-pulse-100 flex items-center justify-center text-lg shrink-0">
                  {userAvatar(users, hf.fromId)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm">
                    <span className="font-semibold">{userName(users, hf.fromId)}</span>
                    <span className="text-ink-500"> → </span>
                    <span className="font-semibold">
                      {hf.toIds.map((id) => userName(users, id)).join(", ")}
                    </span>
                  </div>
                  <p className="text-sm text-ink-700 truncate">{hf.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title flex items-center gap-2">
            <Target size={18} className="text-pulse-600" />
            Company OKRs
          </div>
          <Link to="/okrs" className="text-sm text-pulse-700 hover:underline">
            Open dashboard
          </Link>
        </div>
        <ul className="space-y-3">
          {okrs.map((o) => (
            <li key={o.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{o.title}</span>
                <span className="text-ink-500">{Math.round(o.progress * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-pulse-100 overflow-hidden">
                <div
                  className="h-full bg-pulse-500"
                  style={{ width: `${o.progress * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="card p-5 hover:border-pulse-300 transition">
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-pulse-600" />
        <ArrowRight size={14} className="text-ink-300" />
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-ink-500 mt-1">{label}</div>
    </Link>
  );
}
