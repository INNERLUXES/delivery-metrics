import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeployments, parseIncidents, parseCommits, commitTime } from '../src/input.js';
import { deployments, incidents, commitsText } from './fixtures.js';

test('deployments are read, defaulted and sorted by time', () => {
  const list = [...deployments()].reverse();
  const d = parseDeployments(list);
  assert.deepEqual(d.map((x) => x.id), ['d1', 'd2', 'd3', 'd4']);
  assert.equal(d[2].failed, true);
  assert.equal(d[0].failed, false);
  assert.deepEqual(parseDeployments([{ at: '2025-01-01T00:00:00Z' }])[0], { id: '1', at: Date.parse('2025-01-01T00:00:00Z'), failed: false, commits: [] });
});

test('every bad deployment is reported with its position', () => {
  assert.throws(() => parseDeployments({}), /must be a list/);
  assert.throws(() => parseDeployments([{ id: 'x', at: 'yesterday' }, { id: 'x', at: '2025-01-01T00:00:00Z', failed: 'no' }]),
    (e) => /deployments\[0\]\.at/.test(e.message) && /id x is used twice/.test(e.message) && /failed must be true or false/.test(e.message));
  assert.throws(() => parseDeployments([{ at: '2025-01-01T00:00:00Z', commits: 'abc' }]), /commits must be a list/);
});

test('incidents: open ones are kept, bad links and times are refused', () => {
  const d = parseDeployments(deployments());
  const i = parseIncidents(incidents(), d);
  assert.equal(i[1].resolved, null);
  assert.equal(i[0].deployment, 'd2');
  assert.throws(() => parseIncidents([{ start: '2025-01-02T00:00:00Z', resolved: '2025-01-01T00:00:00Z' }]), /resolved is before start/);
  assert.throws(() => parseIncidents([{ start: '2025-01-02T00:00:00Z', deployment: 'zz' }], d), /deployment zz is not in the deployments/);
  assert.throws(() => parseIncidents([{ start: 'soon' }]), /start must be an ISO 8601 time/);
});

test('commit list from git log, with short ids resolved', () => {
  const c = parseCommits(commitsText() + '\n\n');
  assert.equal(c.size, 4);
  assert.equal(commitTime(c, 'AAAAAAA1'), Date.parse('2025-03-03T08:00:00Z'));
  assert.equal(commitTime(c, 'zzz'), undefined);
  const dup = parseCommits('abcdef1000 2025-01-01T00:00:00Z\nabcdef2000 2025-01-02T00:00:00Z');
  assert.equal(commitTime(dup, 'abcdef'), undefined);
  assert.throws(() => parseCommits('not a commit line'), /line 1/);
});
