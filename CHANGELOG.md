# Changes

## 1.0.0

First release.

- Deployment frequency, lead time for changes (median and 90th percentile), change failure rate and time to restore.
- Inputs: a JSON list of deployments, a JSON list of incidents, and the output of `git log --format='%H %cI'`.
- A window with `--since` and `--until`, and rows per week or month with `--by`.
- Reports as text, Markdown, JSON and CSV.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
