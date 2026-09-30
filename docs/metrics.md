# How each measure is worked out

The four measures are the ones the DORA research programme uses to describe software delivery: two for speed and two for stability. This tool computes them from your records and nothing else. It does not rate the result or compare it with anyone's benchmarks; those change between reports, and a number means most when it is compared with your own earlier numbers.

## Window

By default the window runs from the first deployment in the file to the last one. `--since` and `--until` set it explicitly; `--until` is not included. Deployments and incidents are counted when they start inside the window.

## Deployment frequency

```
deployments         = deployments in the window, failed ones included
deployments a week  = deployments / (window in days / 7)
days with a deploy  = distinct UTC days with at least one deployment
```

## Lead time for changes

For every commit listed in a deployment:

```
lead time = time of the first successful deployment that lists the commit − commit time
```

- A failed deployment does not end the lead time; the commit counts at the next successful deployment that lists it.
- A commit listed in two successful deployments counts once, at the first.
- A commit that is missing from the commit list, or whose time is after the deployment, is counted as "without a commit time" and left out. The report shows how many.
- Commit ids may be shortened; a short id matches the full id it starts with, if exactly one does.

The report gives the median and the 90th percentile (linear interpolation between the two nearest values).

## Change failure rate

```
change failure rate = deployments that failed / deployments
```

A deployment failed when it is marked `"failed": true`, or when an incident names it in `deployment`.

## Time to restore

```
time to restore = incident resolved − incident start
```

For resolved incidents only; open incidents are counted and shown, not guessed. Median and 90th percentile, as for lead time.

## Weekly and monthly rows

`--by week` splits the window into weeks starting Monday 00:00 UTC, `--by month` into calendar months in UTC. The first and last rows are cut to the window. Each row is computed exactly like the whole, so a commit whose deployment falls in a row counts in that row.
