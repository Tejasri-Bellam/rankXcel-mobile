// src/json/AnalyticsJson.ts

export function analyticsdata() {
  return {
    scoreData: [
      { label: 'Jan 15', value: 187 },
      { label: 'Jan 22', value: 203 },
      { label: 'Jan 29', value: 176 },
      { label: 'Feb 5', value: 219 },
      { label: 'Feb 12', value: 241 },
      { label: 'Feb 19', value: 228 },
    ],

    accuracyData: [
      { label: 'Phy', value: 71 },
      { label: 'Chem', value: 58 },
      { label: 'Math', value: 63 },
    ],

    timeData: [
      { label: 'Mon', value: 45 },
      { label: 'Tue', value: 90 },
      { label: 'Wed', value: 60 },
      { label: 'Thu', value: 30 },
      { label: 'Fri', value: 75 },
      { label: 'Sat', value: 120 },
      { label: 'Sun', value: 50 },
    ],

    subjectSplit: [
      { label: 'Physics', pct: 36, color: '#6C63FF' },
      { label: 'Chemistry', pct: 32, color: '#22C55E' },
      { label: 'Math', pct: 32, color: '#FBBF24' },
    ],

    weakChapters: [
      {
        rank: 1,
        name: 'Electrochemistry',
        subject: 'Chemistry',
        pct: 34,
        color: '#EF4444',
        subjectBg: '#DCFCE7',
        subjectText: '#22C55E',
      },
      {
        rank: 2,
        name: 'Rotational Motion',
        subject: 'Physics',
        pct: 41,
        color: '#F97316',
        subjectBg: '#EEF0FF',
        subjectText: '#6C63FF',
      },
      {
        rank: 3,
        name: 'Conic Sections',
        subject: 'Math',
        pct: 38,
        color: '#EF4444',
        subjectBg: '#FFF0E6',
        subjectText: '#F97316',
      },
      {
        rank: 4,
        name: 'Ionic Equilibrium',
        subject: 'Chemistry',
        pct: 45,
        color: '#F97316',
        subjectBg: '#DCFCE7',
        subjectText: '#22C55E',
      },
    ],

    mockHistory: [
      {
        name: 'JEE Main 2024 — P2',
        date: 'Feb 12',
        score: 241,
        rank: 11200,
        pct: '94.3%ile',
        up: true,
      },
      {
        name: 'JEE Main 2023 — P1',
        date: 'Feb 5',
        score: 219,
        rank: 13400,
        pct: '92.1%ile',
        up: true,
      },
      {
        name: 'JEE Main 2022 — P2',
        date: 'Jan 29',
        score: 176,
        rank: 18200,
        pct: '87.6%ile',
        up: false,
      },
      {
        name: 'JEE Main 2022 — P1',
        date: 'Jan 22',
        score: 203,
        rank: 14800,
        pct: '91.4%ile',
        up: true,
      },
    ],

    rankProgression: [
      { date: 'Feb 12', rank: '~11,200', delta: '↑ 2,200', up: true },
      { date: 'Feb 5', rank: '~13,400', delta: '↑ 4,800', up: true },
      { date: 'Jan 29', rank: '~18,200', delta: '↓ 3,400', up: false },
      { date: 'Jan 22', rank: '~14,800', delta: '↑ 1,200', up: true },
    ],
  };
}