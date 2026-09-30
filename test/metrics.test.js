import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeployments, parseIncidents, parseCommits } from '../src/input.js';
import { quantile, median, leadTimes, changeFailures, restoreTimes, summarize, byPeriod } from '../src/metrics.js';
import { deployments, incidents, commitsText } from './fixtures.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

function input() {
  const d = parseDeployments(deployments());
  return { deployments: d, incidents: parseIncidents(incidents(), d), commits: parseCommits(commitsText()) };
}

test('quantiles by linear interpolation', () => {
  assert.equal(median([2, 3, 6, 24]), 4.5);
  close(quantile([2, 3, 6, 24], 0.9), 18.6);
  assert.equal(quantile([], 0.5), null);
  assert.equal(median([7]), 7);
});

test('lead time counts each commit at its first successful deployment', () => {
  const x = input();
  const l = leadTimes(x.deployments, x.commits);
  assert.deepEqual(l.hours, [2, 24, 6, 3]);
  assert.equal(l.unknown, 0);
});

test('commits without a time, or dated after the deployment, are counted as unknown', () => {
  const d = parseDeployments([{ id: 'x', at: '2025-01-01T00:00:00Z', commits: ['aaaaaaa1', 'eeeeeee9'] }]);
  const l = leadTimes(d, parseCommits(commitsText()));
  assert.deepEqual(l.hours, []);
  assert.equal(l.unknown, 2);
  assert.equal(leadTimes(d, null).unknown, 2);
});

test('change failures: marked failed, or named by an incident', () => {
  const x = input();
  assert.deepEqual(changeFailures(x.deployments, x.incidents).sort(), ['d2', 'd3']);
});

test('restore times of resolved incidents only', () => {
  assert.deepEqual(restoreTimes(input().incidents), [2]);
});

test('summary worked by hand', () => {
  const s = summarize(input());
  assert.equal(s.deployments, 4);
  close(s.days, 7 + 2 / 24 + 1 / 86400000);
  close(s.deploymentsPerWeek, 4 / (s.days / 7));
  assert.equal(s.daysWithDeployment, 3);
  assert.equal(s.leadTimeHours.median, 4.5);
  close(s.leadTimeHours.p90, 18.6);
  assert.equal(s.changeFailureRate, 0.5);
  assert.equal(s.restoreHours.median, 2);
  assert.equal(s.incidents, 1, 'the open incident after the last deployment is outside the default window');
  assert.equal(s.restoreHours.open, 0);
});

test('an explicit window takes in the open incident', () => {
  const s = summarize({ ...input(), from: Date.parse('2025-03-01T00:00:00Z'), to: Date.parse('2025-03-15T00:00:00Z') });
  assert.equal(s.days, 14);
  assert.equal(s.deploymentsPerWeek, 2);
  assert.equal(s.restoreHours.open, 1);
  assert.throws(() => summarize({ ...input(), from: 10, to: 10 }), /window is empty/);
});

test('an empty window reports missing measures as null, not zero', () => {
  const s = summarize({ ...input(), from: Date.parse('2024-01-01T00:00:00Z'), to: Date.parse('2024-01-08T00:00:00Z') });
  assert.equal(s.deployments, 0);
  assert.equal(s.changeFailureRate, null);
  assert.equal(s.leadTimeHours.median, null);
});

test('weekly rows start on Monday and add up to the whole', () => {
  const rows = byPeriod(input(), 'week');
  assert.deepEqual(rows.map((r) => r.period), ['2025-03-03', '2025-03-10']);
  assert.deepEqual(rows.map((r) => r.deployments), [2, 2]);
  assert.equal(rows[1].changeFailureRate, 0.5);
  const months = byPeriod({ ...input(), from: Date.parse('2025-02-20T00:00:00Z'), to: Date.parse('2025-03-20T00:00:00Z') }, 'month');
  assert.deepEqual(months.map((r) => r.period), ['2025-02-01', '2025-03-01']);
  assert.throws(() => byPeriod(input(), 'day'), /week or month/);
});
