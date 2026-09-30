// The four delivery measures: how often changes reach production, how long a change takes to get there,
// how many deployments cause a failure, and how long it takes to restore service. See docs/metrics.md.

import { commitTime } from './input.js';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export function quantile(values, q) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export const median = (v) => quantile(v, 0.5);

// Lead time: for each commit in a deployment, deploy time minus commit time. A commit listed in several
// deployments counts at its first one. Commits missing from the commit list are counted, not guessed.
export function leadTimes(deployments, commits) {
  const seen = new Set();
  const hours = [];
  let unknown = 0;
  for (const d of deployments) {
    if (d.failed) continue;
    for (const sha of d.commits) {
      const key = sha.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const t = commits ? commitTime(commits, sha) : undefined;
      if (t === undefined) { unknown++; continue; }
      if (t > d.at) { unknown++; continue; }
      hours.push((d.at - t) / HOUR);
    }
  }
  return { hours, unknown };
}

// A deployment counts as a change failure when it is marked failed, or when an incident names it.
export function changeFailures(deployments, incidents) {
  const named = new Set(incidents.filter((i) => i.deployment).map((i) => i.deployment));
  return deployments.filter((d) => d.failed || named.has(d.id)).map((d) => d.id);
}

export function restoreTimes(incidents) {
  return incidents.filter((i) => i.resolved !== null).map((i) => (i.resolved - i.start) / HOUR);
}

export function inWindow(items, key, from, to) {
  return items.filter((x) => x[key] >= from && x[key] < to);
}

export function summarize({ deployments, incidents = [], commits = null, from, to }) {
  const start = from ?? (deployments.length ? deployments[0].at : 0);
  const end = to ?? (deployments.length ? deployments.at(-1).at + 1 : 1);
  if (!(end > start)) throw new Error('the window is empty: until must be after since');
  const deps = inWindow(deployments, 'at', start, end);
  const incs = inWindow(incidents, 'start', start, end);
  const days = (end - start) / DAY;
  const lead = leadTimes(deps, commits);
  const failed = changeFailures(deps, incs);
  const restore = restoreTimes(incs);
  return {
    from: start,
    to: end,
    days,
    deployments: deps.length,
    deploymentsPerWeek: days > 0 ? deps.length / (days / 7) : null,
    daysWithDeployment: new Set(deps.map((d) => Math.floor(d.at / DAY))).size,
    leadTimeHours: { median: median(lead.hours), p90: quantile(lead.hours, 0.9), commits: lead.hours.length, unknown: lead.unknown },
    changeFailureRate: deps.length ? failed.length / deps.length : null,
    failedDeployments: failed,
    restoreHours: { median: median(restore), p90: quantile(restore, 0.9), resolved: restore.length, open: incs.length - restore.length },
    incidents: incs.length
  };
}

// The same summary for each week (from Monday 00:00 UTC) or month (UTC) inside the window.
export function byPeriod(input, period = 'week') {
  if (!['week', 'month'].includes(period)) throw new Error('period must be week or month');
  const all = summarize(input);
  const edges = [];
  let t = new Date(all.from);
  if (period === 'week') {
    t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
    t = new Date(t.getTime() - ((t.getUTCDay() + 6) % 7) * DAY);
  } else {
    t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  }
  while (t.getTime() < all.to) {
    const next = period === 'week' ? new Date(t.getTime() + 7 * DAY) : new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1));
    edges.push([t.getTime(), next.getTime()]);
    t = next;
  }
  return edges.map(([a, b]) => ({ period: new Date(a).toISOString().slice(0, 10), ...summarize({ ...input, from: Math.max(a, all.from), to: Math.min(b, all.to) }) }));
}
