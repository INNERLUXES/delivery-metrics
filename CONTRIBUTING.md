# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

## Changing a measure

1. Write the new rule in docs/metrics.md first.
2. Add a test worked out by hand, with the arithmetic in a comment, next to the ones in test/metrics.test.js.
3. A measure with nothing to measure stays null; it never becomes zero.
4. If the example output changes, regenerate the example with `node examples/make-example.mjs` and commit the files it writes.

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the files it is given and writes only when `--output` is given. It runs no command and opens no network connection.
- No benchmark or rating is built in.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
