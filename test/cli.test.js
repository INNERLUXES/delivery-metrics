import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, main } from '../src/cli.js';
import { deployments, incidents, commitsText } from './fixtures.js';

const EXAMPLES = join(fileURLToPath(import.meta.url), '..', '..', 'examples');

function sink() {
  let data = '';
  return { write(s) { data += s; }, get text() { return data; } };
}

async function files(t) {
  const dir = await mkdtemp(join(tmpdir(), 'dm-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'd.json'), JSON.stringify(deployments()));
  await writeFile(join(dir, 'i.json'), JSON.stringify(incidents()));
  await writeFile(join(dir, 'c.txt'), commitsText());
  return dir;
}

test('parseArgs', () => {
  const o = parseArgs(['--deployments', 'd.json', '--by', 'week', '--format', 'csv']);
  assert.equal(o.deployments, 'd.json');
  assert.throws(() => parseArgs([]), /--deployments is required/);
  assert.throws(() => parseArgs(['--deployments', 'd', '--format', 'xml']), /unknown format/);
  assert.throws(() => parseArgs(['--deployments', 'd', '--format', 'csv']), /needs --by/);
  assert.throws(() => parseArgs(['--deployments', 'd', '--by', 'day']), /week or month/);
  assert.throws(() => parseArgs(['--deployments', 'd', '--since', 'soon']), /ISO 8601/);
  assert.throws(() => parseArgs(['--deployments']), /needs a value/);
  assert.throws(() => parseArgs(['--nope', 'x']), /unknown option/);
  assert.equal(parseArgs(['--help']).help, true);
});

test('help', async () => {
  const out = sink();
  assert.equal(await main(['--help'], { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /Nothing is run and nothing is fetched/);
});

test('full run with a weekly table', async (t) => {
  const dir = await files(t);
  const out = sink();
  const code = await main(['--deployments', join(dir, 'd.json'), '--incidents', join(dir, 'i.json'), '--commits', join(dir, 'c.txt'), '--by', 'week'], { stdout: out, stderr: sink() });
  assert.equal(code, 0);
  assert.match(out.text, /Change failure rate\s+50\.0%/);
  assert.match(out.text, /2025-03-03/);
});

test('window options and csv to a file', async (t) => {
  const dir = await files(t);
  const target = join(dir, 'out.csv');
  const code = await main(['--deployments', join(dir, 'd.json'), '--since', '2025-03-01T00:00:00Z', '--until', '2025-03-15T00:00:00Z', '--by', 'week', '--format', 'csv', '--output', target], { stdout: sink(), stderr: sink() });
  assert.equal(code, 0);
  assert.match(await readFile(target, 'utf8'), /^period,deployments/);
});

test('bad input exits 2 with the reason', async (t) => {
  const dir = await files(t);
  await writeFile(join(dir, 'bad.json'), '[{"at":"never"}]');
  const err = sink();
  assert.equal(await main(['--deployments', join(dir, 'bad.json')], { stdout: sink(), stderr: err }), 2);
  assert.match(err.text, /deployments\[0\]\.at/);
  const err2 = sink();
  await writeFile(join(dir, 'c2.txt'), 'garbage');
  assert.equal(await main(['--deployments', join(dir, 'd.json'), '--commits', join(dir, 'c2.txt')], { stdout: sink(), stderr: err2 }), 2);
  assert.match(err2.text, /line 1/);
  const err3 = sink();
  assert.equal(await main(['--deployments', join(dir, 'missing.json')], { stdout: sink(), stderr: err3 }), 2);
  assert.match(err3.text, /cannot read/);
});

test('the example data runs', async () => {
  const out = sink();
  const code = await main(['--deployments', join(EXAMPLES, 'deployments.json'), '--incidents', join(EXAMPLES, 'incidents.json'),
    '--commits', join(EXAMPLES, 'commits.txt'), '--by', 'week'], { stdout: out, stderr: sink() });
  assert.equal(code, 0);
  assert.match(out.text, /Lead time for changes/);
});
