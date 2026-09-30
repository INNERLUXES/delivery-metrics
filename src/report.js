// Output as text, Markdown, JSON or CSV. Missing measures print as "-" rather than as zero.

const dash = (v, f) => (v === null || v === undefined ? '-' : f(v));
const hours = (h) => (h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} days`);
const pct = (r) => `${(r * 100).toFixed(1)}%`;
const day = (ms) => new Date(ms).toISOString().slice(0, 10);

export function lines(s) {
  return [
    ['Window', `${day(s.from)} to ${day(s.to - 1)} (${s.days.toFixed(1)} days)`],
    ['Deployments', `${s.deployments} (${dash(s.deploymentsPerWeek, (v) => v.toFixed(1))} a week, on ${s.daysWithDeployment} days)`],
    ['Lead time for changes', `median ${dash(s.leadTimeHours.median, hours)}, 90th percentile ${dash(s.leadTimeHours.p90, hours)} (${s.leadTimeHours.commits} commits${s.leadTimeHours.unknown ? `, ${s.leadTimeHours.unknown} without a commit time` : ''})`],
    ['Change failure rate', `${dash(s.changeFailureRate, pct)} (${s.failedDeployments.length} of ${s.deployments} deployments)`],
    ['Time to restore', `median ${dash(s.restoreHours.median, hours)}, 90th percentile ${dash(s.restoreHours.p90, hours)} (${s.restoreHours.resolved} resolved${s.restoreHours.open ? `, ${s.restoreHours.open} still open` : ''})`]
  ];
}

export function toText(summary, periods = []) {
  const out = lines(summary).map(([k, v]) => `${k.padEnd(22)} ${v}`);
  if (periods.length) {
    out.push('', `${'Period'.padEnd(12)}${'Deploys'.padStart(8)}${'Lead time (median)'.padStart(20)}${'Failure rate'.padStart(14)}${'Restore (median)'.padStart(18)}`);
    for (const p of periods) {
      out.push(`${p.period.padEnd(12)}${String(p.deployments).padStart(8)}${dash(p.leadTimeHours.median, hours).padStart(20)}${dash(p.changeFailureRate, pct).padStart(14)}${dash(p.restoreHours.median, hours).padStart(18)}`);
    }
  }
  return out.join('\n');
}

export function toMarkdown(summary, periods = []) {
  const out = ['## Delivery metrics', '', '| Measure | Value |', '|---|---|', ...lines(summary).map(([k, v]) => `| ${k} | ${v} |`)];
  if (periods.length) {
    out.push('', '| Period | Deployments | Lead time (median) | Change failure rate | Time to restore (median) |', '|---|---:|---:|---:|---:|');
    for (const p of periods) out.push(`| ${p.period} | ${p.deployments} | ${dash(p.leadTimeHours.median, hours)} | ${dash(p.changeFailureRate, pct)} | ${dash(p.restoreHours.median, hours)} |`);
  }
  return out.join('\n');
}

export function toJson(summary, periods = []) {
  return JSON.stringify({ summary, periods }, null, 2);
}

export function toCsv(periods) {
  const head = 'period,deployments,lead_time_median_hours,lead_time_p90_hours,change_failure_rate,restore_median_hours,incidents';
  const n = (v) => (v === null || v === undefined ? '' : Math.round(v * 1000) / 1000);
  return [head, ...periods.map((p) => [p.period, p.deployments, n(p.leadTimeHours.median), n(p.leadTimeHours.p90), n(p.changeFailureRate), n(p.restoreHours.median), p.incidents].join(','))].join('\n');
}
