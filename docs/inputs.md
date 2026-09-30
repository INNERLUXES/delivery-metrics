# Inputs

Three files. Only the deployments are required.

## deployments.json

```json
[
  { "id": "deploy-41", "at": "2025-06-02T17:00:00Z", "commits": ["3f2a91c", "b77e0d4"] },
  { "id": "deploy-42", "at": "2025-06-03T17:00:00Z", "commits": ["c01d9e2"], "failed": true }
]
```

| Field | Required | Meaning |
|---|---|---|
| `id` | no | Any unique text. Defaults to the position in the list |
| `at` | yes | When the deployment reached production, ISO 8601 |
| `commits` | no | The commits that went out with it. Needed for lead time |
| `failed` | no | `true` when the deployment itself failed or had to be rolled back |

Where to get it: most pipelines can write one line per production deployment. In GitHub Actions, the Deployments API lists deployments with their commit; in GitLab, the environments page and its API do the same. The commits of a deployment are those between the previous deployment's commit and this one (`git log --format=%H previous..current`).

## incidents.json

```json
[
  { "id": "INC-7", "start": "2025-06-03T18:10:00Z", "resolved": "2025-06-03T21:00:00Z", "deployment": "deploy-42" }
]
```

| Field | Required | Meaning |
|---|---|---|
| `start` | yes | When the service was degraded or down |
| `resolved` | no | When it was restored. Leave out while the incident is open |
| `deployment` | no | The deployment that caused it, by `id`. Counts it as a change failure |

Where to get it: an export from your incident or on-call tool, or the status page history.

## commits.txt

The plain output of:

```
git log --format='%H %cI'
```

One commit per line: the full id, a space, the commit time. The tool reads the file; it does not run git.
