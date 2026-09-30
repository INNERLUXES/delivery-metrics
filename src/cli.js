// Command line: delivery-metrics --deployments d.json [--incidents i.json] [--commits c.txt]
//               [--since T] [--until T] [--by week|month] [--format text|markdown|json|csv] [--output file]

import { readFile, writeFile } from 'node:fs/promises';
import { parseDeployments, parseIncidents, parseCommits } from './input.js';
import { summarize, byPeriod } from './metrics.js';
import { toText, toMarkdown, toJson, toCsv } from './report.js';

export const USAGE = `delivery-metrics --deployments <file.json> [options]

Deployment frequency, lead time for changes, change failure rate and time to restore, from your own records.
Nothing is run and nothing is fetched: the tool reads the files you give it.

Options
  --deployments <file>   JSON list of deployments (required)
  --incidents <file>     JSON list of incidents
  --commits <file>       output of: git log --format='%H %cI'   (needed for lead time)
  --since <time>         start of the window, ISO 8601
  --until <time>         end of the window, ISO 8601 (not included)
  --by <week|month>      add one row per week or month
  --format <f>           text (default), markdown, json or csv (csv needs --by)
  --output <file>        write the report to a file
  --help                 this text

Exit codes: 0 done, 2 wrong usage or invalid input.`;

export function parseArgs(argv) {
  const o = { format: 'text' };
  const takes = new Set(['--deployments', '--incidents', '--commits', '--since', '--until', '--by', '--format', '--output']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (!takes.has(a)) throw new Error(`unknown option: ${a}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`${a} needs a value`);
    o[a.slice(2)] = argv[++i];
  }
  if (o.help) return o;
  if (!o.deployments) throw new Error('--deployments is required');
  if (!['text', 'markdown', 'json', 'csv'].includes(o.format)) throw new Error(`unknown format: ${o.format}`);
  if (o.by && !['week', 'month'].includes(o.by)) throw new Error('--by must be week or month');
  if (o.format === 'csv' && !o.by) throw new Error('csv output needs --by week or --by month');
  for (const k of ['since', 'until']) if (o[k] !== undefined && Number.isNaN(Date.parse(o[k]))) throw new Error(`--${k} must be an ISO 8601 time`);
  return o;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    throw new Error(`cannot read ${file}: ${err.message}`);
  }
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let o, input;
  try {
    o = parseArgs(argv);
    if (o.help) { stdout.write(`${USAGE}\n`); return 0; }
    const deployments = parseDeployments(await readJson(o.deployments));
    const incidents = o.incidents ? parseIncidents(await readJson(o.incidents), deployments) : [];
    let commits = null;
    if (o.commits) {
      try { commits = parseCommits(await readFile(o.commits, 'utf8')); } catch (err) { throw new Error(`${o.commits}: ${err.message}`); }
    }
    input = { deployments, incidents, commits,
      from: o.since ? Date.parse(o.since) : undefined, to: o.until ? Date.parse(o.until) : undefined };
    summarize(input);
  } catch (err) {
    stderr.write(`${err.message}\n\n${USAGE}\n`);
    return 2;
  }
  const summary = summarize(input);
  const periods = o.by ? byPeriod(input, o.by) : [];
  const text = o.format === 'json' ? toJson(summary, periods) : o.format === 'csv' ? toCsv(periods)
    : o.format === 'markdown' ? toMarkdown(summary, periods) : toText(summary, periods);
  if (o.output) await writeFile(o.output, `${text}\n`);
  else stdout.write(`${text}\n`);
  return 0;
}
