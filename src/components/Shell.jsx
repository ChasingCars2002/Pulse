import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Hand,
  Users,
  Target,
  MessageSquare,
  Sparkles,
  Inbox,
  Settings as SettingsIcon,
  Slack,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/check-in", label: "Weekly Check-In", icon: ClipboardCheck },
  { to: "/high-fives", label: "High-Fives", icon: Hand },
  { to: "/one-on-ones", label: "1-on-1s", icon: Users },
  { to: "/okrs", label: "OKRs & Priorities", icon: Target },
  { to: "/open-mic", label: "Open Mic", icon: MessageSquare },
  { to: "/vibe-report", label: "Vibe Report", icon: Sparkles },
  { to: "/request-feedback", label: "Request Feedback", icon: Inbox },
];

export default function Shell() {
  const { currentUser, storeMode, slackFeed } = useApp();
  const location = useLocation();
  const currentLabel =
    NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ||
    "Pulse";

  return (
    <div className="h-full grid grid-cols-[260px_1fr] bg-pulse-50">
      <aside className="border-r border-ink-100 bg-white flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2">
          <Logo />
          <span className="font-bold text-lg tracking-tight">Pulse</span>
          <span className="ml-auto chip">{storeMode === "firestore" ? "live" : "demo"}</span>
        </div>

        <nav className="px-3 flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <SlackPanel feed={slackFeed} />

        <NavLink to="/settings" className="px-5 py-4 border-t border-ink-100 flex items-center gap-3 hover:bg-pulse-50">
          <div className="w-9 h-9 rounded-full bg-pulse-100 flex items-center justify-center text-lg">
            {currentUser?.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{currentUser?.name}</div>
            <div className="text-xs text-ink-500 truncate">{currentUser?.role}</div>
          </div>
          <SettingsIcon size={16} className="ml-auto text-ink-300" />
        </NavLink>
      </aside>

      <main className="overflow-y-auto">
        <header className="sticky top-0 z-10 bg-pulse-50/80 backdrop-blur border-b border-ink-100">
          <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">{currentLabel}</h1>
            <div className="text-sm text-ink-500">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Logo() {
  return (
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pulse-500 to-pulse-700 flex items-center justify-center text-white">
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17 L11 17 L13 11 L17 22 L19 16 L22 16" />
        <circle cx="24" cy="16" r="1.6" fill="currentColor" />
      </svg>
    </div>
  );
}

function SlackPanel({ feed }) {
  const top = feed.slice(0, 3);
  return (
    <div className="mx-3 mb-3 mt-2 rounded-xl2 border border-ink-100 bg-pulse-50/50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
        <Slack size={14} />
        Slack activity
      </div>
      {top.length === 0 ? (
        <p className="mt-2 text-xs text-ink-500">
          No Slack pings yet. Send a High-Five or submit a check-in to see them here.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {top.map((n) => (
            <li key={n.id} className="text-xs text-ink-700 leading-snug">
              <span className="font-medium text-pulse-700">{n.kind}</span>{" "}
              <span className="text-ink-500">{n.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
