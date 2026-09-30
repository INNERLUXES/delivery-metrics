# Secure defaults

| Setting | Default | Why |
|---|---|---|
| Bad records | Stop and list every one | A skipped record changes every measure without anyone noticing. |
| Missing measures | Printed as "-", stored as null | Zero failures in an empty window would read as a perfect score. |
| Window | First to last deployment in the file | Nothing outside the records is assumed. |
| Commits without a time | Left out and counted | Guessing a commit time would invent a lead time. |
| Benchmarks | None | Published bands change; the tool does not rate a team. |
| Git and network | Never run, never used | The tool can run on an export in a locked-down environment. |
| Output | Terminal | Nothing is written to disk unless `--output` is given. |
