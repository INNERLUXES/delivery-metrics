// A small history whose measures can be worked out by hand.
//   commit a  08:00 on day 1   -> deployment d1 10:00 day 1   lead 2 h
//   commit b  10:00 on day 2   -> deployment d2 10:00 day 3   lead 24 h
//   commit c  04:00 on day 3   -> deployment d2 10:00 day 3   lead 6 h
//   commit dd 09:00 on day 8   -> deployment d3 10:00 day 8 FAILED, then d4 12:00 day 8   lead 3 h (first successful)
//   incident i1 names d2, 11:00 to 13:00 on day 3 (2 h); incident i2 on day 10 is still open.

export const deployments = () => [
  { id: 'd1', at: '2025-03-03T10:00:00Z', commits: ['aaaaaaa1'] },
  { id: 'd2', at: '2025-03-05T10:00:00Z', commits: ['bbbbbbb2', 'ccccccc3'] },
  { id: 'd3', at: '2025-03-10T10:00:00Z', commits: ['ddddddd4'], failed: true },
  { id: 'd4', at: '2025-03-10T12:00:00Z', commits: ['ddddddd4'] }
];

export const incidents = () => [
  { id: 'i1', start: '2025-03-05T11:00:00Z', resolved: '2025-03-05T13:00:00Z', deployment: 'd2' },
  { id: 'i2', start: '2025-03-12T00:00:00Z' }
];

export const commitsText = () => [
  'aaaaaaa1000000000000000000000000000000aa 2025-03-03T08:00:00Z',
  'bbbbbbb2000000000000000000000000000000bb 2025-03-04T10:00:00Z',
  'ccccccc3000000000000000000000000000000cc 2025-03-05T04:00:00Z',
  'ddddddd4000000000000000000000000000000dd 2025-03-10T09:00:00Z'
].join('\n');
