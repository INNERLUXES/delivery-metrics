# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "delivery-metrics security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include the input files that show the problem (made-up records are best), what you expected and what happened.

## Scope

In scope:

- input that passes validation but produces a wrong measure
- input that makes the tool hang or use unbounded memory
- anything that makes the tool run a command, open a network connection, or read or write a file it was not given

Out of scope: a result that is right for the records but wrong for the team; docs/limits.md lists those cases.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
