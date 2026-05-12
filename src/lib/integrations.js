// Mock connectors for "Project Management Integration". In a real deployment
// these would call the GitHub / Jira APIs with an OAuth token. For the demo,
// we return a curated set of "open assigned to me" items so the user can
// drag them into Weekly Priorities — the actual UX that matters.

export function fetchGithubIssues() {
  return Promise.resolve([
    {
      id: "gh_142",
      source: "github",
      ref: "pulse#142",
      title: "[CheckIn v2] Persist draft answers locally",
      url: "https://github.com/example/pulse/issues/142",
    },
    {
      id: "gh_151",
      source: "github",
      ref: "pulse#151",
      title: "Flaky test in <HighFiveFeed /> realtime subscription",
      url: "https://github.com/example/pulse/issues/151",
    },
    {
      id: "gh_158",
      source: "github",
      ref: "pulse#158",
      title: "Polish Vibe Report typography on mobile",
      url: "https://github.com/example/pulse/issues/158",
    },
  ]);
}

export function fetchJiraIssues() {
  return Promise.resolve([
    {
      id: "j_HR_88",
      source: "jira",
      ref: "HR-88",
      title: "Draft Q3 hiring plan & headcount asks",
      url: "https://example.atlassian.net/browse/HR-88",
    },
    {
      id: "j_GROW_22",
      source: "jira",
      ref: "GROW-22",
      title: "Activation experiment: shorter onboarding",
      url: "https://example.atlassian.net/browse/GROW-22",
    },
  ]);
}
