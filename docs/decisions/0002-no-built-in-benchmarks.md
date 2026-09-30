# 2. No built-in benchmarks

## Context

Reports on software delivery publish performance bands (for example "elite" or "low" performers) with thresholds for each measure. The thresholds change from one report to the next, and they were measured on software very unlike some of the software this tool will be pointed at.

## Decision

- The tool prints the measures and their weekly or monthly rows. It does not rate them, colour them or compare them with any threshold.

## Consequences

- A reader who wants a comparison has to choose the reference and say where it came from.
- The most useful comparison, a team with its own earlier weeks, is what the `--by` rows are for.
