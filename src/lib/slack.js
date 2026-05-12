// Slack-first notifications. If VITE_SLACK_WEBHOOK_URL is set we POST to it;
// otherwise we log to the in-app notification feed so demos still show the
// "this would have gone to Slack" UX.

const WEBHOOK = import.meta.env.VITE_SLACK_WEBHOOK_URL;

const listeners = new Set();
const recent = [];

export function subscribeSlack(fn) {
  listeners.add(fn);
  fn(recent);
  return () => listeners.delete(fn);
}

export async function postToSlack({ kind, text }) {
  const entry = { id: Math.random().toString(36).slice(2), kind, text, at: Date.now() };
  recent.unshift(entry);
  if (recent.length > 40) recent.pop();
  for (const fn of listeners) fn([...recent]);

  if (!WEBHOOK) return { delivered: false, reason: "no-webhook" };
  try {
    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `[${kind}] ${text}` }),
    });
    return { delivered: true };
  } catch (e) {
    return { delivered: false, reason: e.message };
  }
}
