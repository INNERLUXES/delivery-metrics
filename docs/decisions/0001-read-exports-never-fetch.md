# 1. Read exported files, never fetch

## Context

Delivery data lives in several systems: the Git host, the pipeline, the incident tool. A tool that fetches from each needs a token for each, a client for each API, and network access wherever it runs. It also ties the result to one vendor's idea of a deployment or an incident.

## Decision

- The tool reads three plain files: deployments, incidents and the output of `git log`. It runs no command and makes no request.
- The file formats are small and documented in docs/inputs.md, so any system can produce them with a short script.

## Consequences

- There is a step before the tool: exporting the records. docs/inputs.md says where each one usually comes from.
- The same numbers can be produced for a supplier's work and for your own team's, from the same kind of export, without giving the tool access to either system.
