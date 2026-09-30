# Threat model

The tool reads files exported from delivery systems and prints numbers that may be used to judge a team or a supplier. The main risk is a wrong number that looks right. This page lists what could go wrong and what the tool does about it.

| Threat | Response |
|---|---|
| A malformed record is skipped silently and every measure shifts | Every record is checked; the run stops and lists each bad record by its position. |
| An incident names a deployment that does not exist | Refused with the incident's position and the unknown id. |
| A commit dated after its deployment produces a negative lead time | Such commits are left out and counted as "without a commit time"; the count is in the report. |
| A short commit id matches two commits and picks the wrong time | An ambiguous short id matches nothing and is counted as unknown. |
| An empty window reports zero failures and looks perfect | Measures with nothing to measure are printed as "-" and stored as null, never as zero. |
| The example data is edited by hand to show a nicer result | A repository check regenerates the example and fails if the files differ. |
| The tool runs git or fetches data with someone's credentials | It runs nothing and opens no network connection. It reads the files it is given and writes only with `--output`. |

## Outside this model

- Whether the records are complete and honest. docs/limits.md lists the common ways they are not.
- A modified copy of the tool. Install from a release and check the attestation and checksums.
