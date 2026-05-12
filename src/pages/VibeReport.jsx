import React, { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { buildVibeReport } from "../lib/vibeReport.js";
import { Sparkles, TrendingDown, TrendingUp, Hash } from "lucide-react";

export default function VibeReport() {
  const { checkIns, users } = useApp();
  const report = useMemo(
    () => buildVibeReport(checkIns, users),
    [checkIns, users]
  );

  if (report.empty) {
    return (
      <div className="card p-8 text-center max-w-xl mx-auto">
        <Sparkles size={28} className="mx-auto text-pulse-600" />
        <h2 className="mt-2 text-xl font-bold">{report.headline}</h2>
        <p className="muted mt-2">{report.body}</p>
      </div>
    );
  }

  const moralePct = Math.round((report.moraleAvg / 5) * 100);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="card p-6">
        <div className="flex items-center gap-2 text-pulse-700 text-sm font-semibold">
          <Sparkles size={16} />
          Monthly Vibe Report · auto-generated
        </div>
        <h2 className="mt-3 text-2xl font-bold leading-snug">{report.headline}</h2>
        <p className="muted mt-2">
          Based on {report.checkInCount} check-ins from the last 30 days. Pulse
          extracted themes, blockers, and highlights so you don't have to read
          every entry.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-ink-500">Morale</div>
          <div className="text-4xl font-bold mt-2">{report.moraleAvg.toFixed(1)}<span className="text-ink-300 text-lg">/5</span></div>
          <div className="h-2 rounded-full bg-pulse-100 overflow-hidden mt-3">
            <div className="h-full bg-pulse-500" style={{ width: `${moralePct}%` }} />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-ink-500">Tone</div>
          <div className="text-2xl font-bold mt-2 capitalize">{report.sentiment}</div>
          <p className="muted mt-1">Across answers in the period.</p>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-ink-500">Top themes</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.themes.map((t) => (
              <span key={t} className="chip">
                <Hash size={12} /> {t}
              </span>
            ))}
            {report.themes.length === 0 && (
              <span className="muted">No strong themes detected.</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ReportList
          title="Highlights"
          icon={TrendingUp}
          accent="text-emerald-600"
          items={report.highlights}
          empty="No standout wins called out yet."
        />
        <ReportList
          title="Blockers & friction"
          icon={TrendingDown}
          accent="text-rose-600"
          items={report.blockers}
          empty="No major blockers surfaced."
        />
      </div>
    </div>
  );
}

function ReportList({ title, icon: Icon, accent, items, empty }) {
  return (
    <div className="card p-5">
      <h3 className={`section-title flex items-center gap-2 ${accent}`}>
        <Icon size={18} /> {title}
      </h3>
      <ul className="space-y-3 mt-3">
        {items.map((b, i) => (
          <li key={i} className="text-sm">
            <div className="font-semibold text-ink-900">{b.author}</div>
            <p className="text-ink-700 mt-0.5">{b.text}</p>
          </li>
        ))}
        {items.length === 0 && <li className="muted">{empty}</li>}
      </ul>
    </div>
  );
}
