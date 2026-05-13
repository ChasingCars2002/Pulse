import React from "react";
import { useApp } from "../context/AppContext.jsx";
import { resetLocal, storeMode } from "../lib/store.js";
import { Database, RefreshCw, Slack } from "lucide-react";

export default function Settings() {
  const { currentUser } = useApp();
  const slackConfigured = Boolean(import.meta.env.VITE_SLACK_WEBHOOK_URL);

  return (
    <div className="space-y-5 max-w-2xl">
      <section className="card p-6">
        <h2 className="section-title flex items-center gap-2">
          <Database size={18} className="text-pulse-600" />
          Storage
        </h2>
        <p className="muted mt-1">
          Pulse runs against Firebase Firestore when configured, and falls back
          to in-browser localStorage so the app is fully usable offline.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">Current mode</div>
            <div className="text-ink-500">
              {storeMode === "firestore"
                ? "Connected to Firestore"
                : "Local-only (no Firebase env vars detected)"}
            </div>
          </div>
          <span className="chip capitalize">{storeMode}</span>
        </div>
        {storeMode !== "firestore" && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Reset all local Pulse data (check-ins, high-fives, 1-on-1s, priorities) back to the demo seed?"
                )
              ) {
                resetLocal();
              }
            }}
            className="btn-secondary mt-4"
          >
            <RefreshCw size={14} /> Reset demo data
          </button>
        )}
      </section>

      <section className="card p-6">
        <h2 className="section-title flex items-center gap-2">
          <Slack size={18} className="text-pulse-600" />
          Slack notifications
        </h2>
        <p className="muted mt-1">
          Configure <code>VITE_SLACK_WEBHOOK_URL</code> in your <code>.env</code>{" "}
          file to send check-in reminders, high-fives, and feedback alerts to
          your channel.
        </p>
        <div className="mt-4 text-sm">
          {slackConfigured ? (
            <span className="chip">Webhook configured</span>
          ) : (
            <span className="chip !bg-amber-100 !text-amber-700">
              Webhook not configured — events appear in the in-app feed only
            </span>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="section-title">Profile</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-pulse-100 flex items-center justify-center text-3xl">
            {currentUser?.avatar}
          </div>
          <div>
            <div className="font-semibold">{currentUser?.name}</div>
            <div className="text-sm text-ink-500">{currentUser?.role}</div>
          </div>
        </div>
        <p className="muted mt-4">
          Multi-user auth is wired through Firebase Authentication when enabled.
          This demo signs you in anonymously.
        </p>
      </section>
    </div>
  );
}
