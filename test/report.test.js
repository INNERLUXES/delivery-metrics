import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeployments, parseIncidents, parseCommits } from '../src/input.js';
import { summarize, byPeriod } from '../src/metrics.js';
import { toText, toMarkdown, toJson, toCsv } from '../src/report.js';
import { deployments, incidents, commitsText } from './fixtures.js';

function input() {
  const d = parseDeployments(deployments());
  return { deployments: d, incidents: parseIncidents(incidents(), d), commits: parseCommits(commitsText()) };
}

test('text report names the four measures', () => {
  const t = toText(summarize(input()));
  assert.match(t, /Deployments\s+4 \(4\.0 a week, on 3 days\)/);
  assert.match(t, /Lead time for changes\s+median 4\.5 h, 90th percentile 18\.6 h \(4 commits\)/);
  assert.match(t, /Change failure rate\s+50\.0% \(2 of 4 deployments\)/);
  assert.match(t, /Time to restore\s+median 2\.0 h/);
});

test('missing measures print as a dash, long times in days', () => {
  const x = input();
  const empty = summarize({ ...x, from: Date.parse('2024-01-01T00:00:00Z'), to: Date.parse('2024-01-08T00:00:00Z') });
  assert.match(toText(empty), /Change failure rate\s+- \(0 of 0/);
  const slow = parseDeployments([{ id: 's', at: '2025-03-10T08:00:00Z', commits: ['aaaaaaa1'] }]);
  assert.match(toText(summarize({ deployments: slow, commits: x.commits, from: Date.parse('2025-03-01T00:00:00Z'), to: Date.parse('2025-03-11T00:00:00Z') })), /median 7\.0 days/);
});

test('weekly table in text and markdown', () => {
  const x = input();
  const rows = byPeriod(x, 'week');
  assert.match(toText(summarize(x), rows), /2025-03-10\s+2/);
  const md = toMarkdown(summarize(x), rows);
  assert.match(md, /^## Delivery metrics/);
  assert.match(md, /\| 2025-03-03 \| 2 \| /);
});

test('json and csv', () => {
  const x = input();
  const rows = byPeriod(x, 'week');
  assert.equal(JSON.parse(toJson(summarize(x), rows)).periods.length, 2);
  const csv = toCsv(rows).split('\n');
  assert.equal(csv.length, 3);
  assert.match(csv[0], /^period,deployments,lead_time_median_hours/);
  assert.equal(csv[2].split(',')[4], '0.5');
});
