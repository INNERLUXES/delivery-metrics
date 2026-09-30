# delivery-metrics

Deployment frequency, lead time for changes, change failure rate and time to restore, computed from your own records: a list of deployments, a list of incidents, and the output of `git log`.

These are the four measures the DORA research programme uses to describe software delivery, two for speed and two for stability. The tool computes them, shows them week by week or month by month, and stops there: it does not rate your team against anyone's benchmark.

Plain JavaScript, no dependencies. It reads the files you give it; it runs no command and fetches nothing.

```
npm test
```

```
# tests 23
# pass 23
# fail 0
```

## Try it

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/delivery-metrics.git
cd delivery-metrics
npm run example
```

```
Window                 2025-06-02 to 2025-06-27 (25.0 days)
Deployments            15 (4.2 a week, on 15 days)
Lead time for changes  median 5.0 h, 90th percentile 30.0 h (43 commits)
Change failure rate    13.3% (2 of 15 deployments)
Time to restore        median 10.5 h, 90th percentile 16.5 h (2 resolved)

Period       Deploys  Lead time (median)  Failure rate  Restore (median)
2025-06-02         4               4.0 h         25.0%             3.0 h
2025-06-09         4               5.0 h          0.0%                 -
2025-06-16         4               5.0 h          0.0%            18.0 h
2025-06-23         3              32.0 h         33.3%                 -
```

The example history in `examples/` is invented by `examples/make-example.mjs` to show the shape of the inputs.

## Your own data

```
git log --format='%H %cI' > commits.txt
delivery-metrics --deployments deployments.json --incidents incidents.json --commits commits.txt --by week
```

```json
[
  { "id": "deploy-41", "at": "2025-06-02T17:00:00Z", "commits": ["3f2a91c", "b77e0d4"] },
  { "id": "deploy-42", "at": "2025-06-03T17:00:00Z", "commits": ["c01d9e2"], "failed": true }
]
```

[docs/inputs.md](docs/inputs.md) describes the three files and where each usually comes from. [docs/metrics.md](docs/metrics.md) gives the exact rule for each measure.

## Options

| Option | What it does |
|---|---|
| `--deployments <file>` | JSON list of deployments (required) |
| `--incidents <file>` | JSON list of incidents |
| `--commits <file>` | Output of `git log --format='%H %cI'`, needed for lead time |
| `--since`, `--until` | The window, ISO 8601; `--until` is not included |
| `--by week\|month` | One row per week (from Monday, UTC) or month |
| `--format text\|markdown\|json\|csv` | CSV needs `--by` |
| `--output <file>` | Write the report to a file |

Exit codes: 0 done, 2 wrong usage or invalid input.

## Rules that keep the numbers honest

- Every record is checked. A bad one stops the run with its position, instead of being skipped.
- A measure with nothing to measure prints as "-", never as zero, so an empty week does not look perfect.
- A commit without a known time, or dated after its deployment, is counted and reported, not guessed.
- A failed deployment does not end a lead time; the commit counts at the next successful deployment.
- No benchmark is built in. [docs/limits.md](docs/limits.md) says what the numbers leave out.

## As a library

```js
import { parseDeployments, parseIncidents, parseCommits, summarize, byPeriod } from './src/index.js';

const deployments = parseDeployments(deploymentList);
const summary = summarize({ deployments, incidents: parseIncidents(incidentList, deployments), commits: parseCommits(gitLogText) });
console.log(summary.leadTimeHours.median, summary.changeFailureRate);
```

## How this repository is kept

- No runtime dependencies, a committed lock file, `npm ci` in the pipeline.
- Tests on Linux, Windows and macOS with Node 22 and 24, CodeQL, and repository checks for syntax, exports, credentials, leftovers, and example data that matches its generator.
- Every workflow sets its token permissions and pins every action to a full commit hash; Dependabot keeps them current.
- The pipeline checks the repository against NIST SP 800-218 with [ssdf-repo-check](https://github.com/INNERLUXES/ssdf-repo-check).
- Releases come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
- [SECURITY.md](SECURITY.md), [threat model](docs/threat-model.md), [secure defaults](docs/secure-defaults.md), [design decisions](docs/decisions).

## Related

Built by the team behind the [software development services at INNERLUXES](https://innerluxes.dev/software-development/services).

## License

MIT
