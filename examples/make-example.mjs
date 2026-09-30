// Writes the example files: four weeks of made-up delivery history for one small product team.
// Run: node examples/make-example.mjs   The history is invented; it only shows the shape of the inputs.

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const dir = join(fileURLToPath(import.meta.url), '..');
const H = 3600 * 1000;
const start = Date.parse('2025-06-02T00:00:00Z'); // a Monday
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const sha = (n) => createHash('sha1').update(`example-commit-${n}`).digest('hex');

const commits = [];
const deployments = [];
let pending = [];
let n = 0;
for (let day = 0; day < 28; day++) {
  if (day % 7 >= 5) continue; // weekdays only
  const dayStart = start + day * 24 * H;
  // commits during the working day, 09:00 to 16:00
  const count = 1 + Math.floor(rand() * 4);
  for (let k = 0; k < count; k++) {
    const id = sha(++n);
    commits.push(`${id} ${new Date(dayStart + (9 + Math.floor(rand() * 7)) * H).toISOString()}`);
    pending.push(id.slice(0, 10));
  }
  // most days end with a deployment at 17:00 of everything waiting
  if (rand() < 0.7) {
    const failed = rand() < 0.12;
    deployments.push({ id: `deploy-${deployments.length + 1}`, at: new Date(dayStart + 17 * H).toISOString(), commits: pending, ...(failed ? { failed: true } : {}) });
    if (!failed) pending = [];
  }
}
const at = (i, h) => new Date(Date.parse(deployments[i].at) + h * H).toISOString();
const incidents = [
  { id: 'inc-1', start: at(3, 1), resolved: at(3, 4), deployment: deployments[3].id },
  { id: 'inc-2', start: at(9, 2), resolved: at(9, 20) }
];

await writeFile(join(dir, 'deployments.json'), `${JSON.stringify(deployments, null, 2)}\n`);
await writeFile(join(dir, 'incidents.json'), `${JSON.stringify(incidents, null, 2)}\n`);
await writeFile(join(dir, 'commits.txt'), `${commits.join('\n')}\n`);
console.log(`${deployments.length} deployments, ${commits.length} commits, ${incidents.length} incidents`);
