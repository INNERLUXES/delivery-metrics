// Reading the three inputs: deployments, incidents and commits. Every record is checked and every problem is
// reported with its position, because a silently skipped record changes every metric.

const time = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? Date.parse(v) : NaN);

// deployments: [{ id, at, commits?: [sha...], failed?: bool }]
export function parseDeployments(list) {
  if (!Array.isArray(list)) throw new Error('deployments must be a list');
  const errors = [];
  const ids = new Set();
  const out = list.map((d, i) => {
    const where = `deployments[${i}]`;
    if (!d || typeof d !== 'object') { errors.push(`${where} must be an object`); return null; }
    const id = d.id === undefined ? String(i + 1) : String(d.id);
    if (ids.has(id)) errors.push(`${where}: id ${id} is used twice`);
    ids.add(id);
    const at = time(d.at);
    if (Number.isNaN(at)) errors.push(`${where}.at must be an ISO 8601 time`);
    if (d.failed !== undefined && typeof d.failed !== 'boolean') errors.push(`${where}.failed must be true or false`);
    if (d.commits !== undefined && (!Array.isArray(d.commits) || d.commits.some((c) => typeof c !== 'string' || !c))) {
      errors.push(`${where}.commits must be a list of commit ids`);
    }
    return { id, at, failed: d.failed === true, commits: Array.isArray(d.commits) ? d.commits.map(String) : [] };
  });
  if (errors.length) throw new Error(`invalid deployments:\n  ${errors.join('\n  ')}`);
  return out.sort((a, b) => a.at - b.at);
}

// incidents: [{ id?, start, resolved?, deployment? }] an incident without `resolved` is still open
export function parseIncidents(list, deployments = []) {
  if (!Array.isArray(list)) throw new Error('incidents must be a list');
  const known = new Set(deployments.map((d) => d.id));
  const errors = [];
  const out = list.map((x, i) => {
    const where = `incidents[${i}]`;
    if (!x || typeof x !== 'object') { errors.push(`${where} must be an object`); return null; }
    const start = time(x.start);
    if (Number.isNaN(start)) errors.push(`${where}.start must be an ISO 8601 time`);
    let resolved = null;
    if (x.resolved !== undefined && x.resolved !== null) {
      resolved = time(x.resolved);
      if (Number.isNaN(resolved)) errors.push(`${where}.resolved must be an ISO 8601 time`);
      else if (resolved < start) errors.push(`${where}: resolved is before start`);
    }
    const deployment = x.deployment === undefined || x.deployment === null ? null : String(x.deployment);
    if (deployment !== null && !known.has(deployment)) errors.push(`${where}: deployment ${deployment} is not in the deployments`);
    return { id: x.id === undefined ? String(i + 1) : String(x.id), start, resolved, deployment };
  });
  if (errors.length) throw new Error(`invalid incidents:\n  ${errors.join('\n  ')}`);
  return out.sort((a, b) => a.start - b.start);
}

// commits: the text of `git log --format='%H %cI'`, one commit per line. Returns Map sha -> time.
export function parseCommits(text) {
  const map = new Map();
  const errors = [];
  String(text).split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    const m = t.match(/^([0-9a-f]{7,64})\s+(\S+)$/i);
    if (!m || Number.isNaN(Date.parse(m[2]))) { errors.push(`line ${i + 1}: expected "<sha> <ISO time>"`); return; }
    map.set(m[1].toLowerCase(), Date.parse(m[2]));
  });
  if (errors.length) throw new Error(`invalid commit list:\n  ${errors.slice(0, 10).join('\n  ')}`);
  return map;
}

// A commit id in a deployment may be shortened; it matches the full id it starts with, if exactly one does.
export function commitTime(commits, sha) {
  const s = sha.toLowerCase();
  if (commits.has(s)) return commits.get(s);
  const hits = [...commits.keys()].filter((k) => k.startsWith(s));
  return hits.length === 1 ? commits.get(hits[0]) : undefined;
}
