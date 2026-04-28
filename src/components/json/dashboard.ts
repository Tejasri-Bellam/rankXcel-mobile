// src/json/dashboardData.ts

const dashboardData = {
  user: {
    name: "Tejasri",
    exams: [
      { id: 1, name: "EAMCET", active: true },
      { id: 2, name: "JEE", active: false },
      { id: 3, name: "JEE Mains", active: false },
      { id: 4, name: "JEE2", active: false }
    ]
  },

  stats: [
    {
      id: 1,
      icon: "file-document-outline",
      iconType: "MaterialCommunityIcons",
      value: "12",
      label: "Mocks Taken",
      delta: "+3 this week",
      color: "#6C63FF",
      bg: "#EEF0FF"
    },
    {
      id: 2,
      icon: "target",
      iconType: "MaterialCommunityIcons",
      value: "94.3%ile",
      label: "Best Percentile",
      delta: "↑ 2.1 from last",
      color: "#22C55E",
      bg: "#DCFCE7"
    },
    {
      id: 3,
      icon: "trending-up",
      iconType: "Ionicons",
      value: "68.2%",
      label: "Avg Accuracy",
      delta: "+1.3% from last",
      color: "#F97316",
      bg: "#FFF0E6"
    },
    {
      id: 4,
      icon: "chart-bar",
      iconType: "MaterialCommunityIcons",
      value: "~12,000",
      label: "Rank Band",
      delta: "Improving ↑",
      color: "#6C63FF",
      bg: "#F3F0FF"
    }
  ],

  todayFocus: {
    title: "Rotational Motion",
    subject: "Physics",
    questions: 20,
    issue: "Accuracy dropped 12% in your last 2 mocks",
    duration: "~45 min"
  },

  continueTest: {
    title: "JEE Main 2023 — Paper 1",
    subtitle: "Last section: Mathematics · 2 hours ago",
    progress: 52,
    attempted: "47 of 90 questions attempted"
  },

  streak: {
    current: 7,
    best: 14,
    days: [
      { day: "M", completed: true },
      { day: "T", completed: true },
      { day: "W", completed: true },
      { day: "T", completed: false },
      { day: "F", completed: true },
      { day: "S", completed: false },
      { day: "S", completed: false }
    ]
  },

  performance: [
    { label: "Jan 15", value: 187 },
    { label: "Jan 22", value: 203 },
    { label: "Jan 29", value: 176 },
    { label: "Feb 5", value: 219 },
    { label: "Feb 12", value: 241 }
  ],

  subjects: [
    {
      id: 1,
      name: "Physics",
      percent: 71,
      level: "Strong",
      icon: "⚡",
      color: "#6C63FF"
    },
    {
      id: 2,
      name: "Chemistry",
      percent: 58,
      level: "Average",
      icon: "🧪",
      color: "#22C55E"
    },
    {
      id: 3,
      name: "Mathematics",
      percent: 63,
      level: "Average",
      icon: "📐",
      color: "#FBBF24"
    }
  ],

  weakChapters: [
    {
      id: 1,
      rank: 1,
      name: "Electrochemistry",
      subject: "Chemistry",
      percent: 34,
      attempts: 8,
      color: "#EF4444"
    },
    {
      id: 2,
      rank: 2,
      name: "Rotational Motion",
      subject: "Physics",
      percent: 41,
      attempts: 11,
      color: "#F97316"
    },
    {
      id: 3,
      rank: 3,
      name: "Conic Sections",
      subject: "Mathematics",
      percent: 38,
      attempts: 6,
      color: "#EF4444"
    }
  ],

  upcomingMocks: [
    {
      id: 1,
      name: "JEE Main 2024 — Paper 2",
      when: "Tomorrow",
      difficulty: "Hard",
      color: "#EF4444"
    },
    {
      id: 2,
      name: "JEE Main 2022 — Paper 1",
      when: "in 3 days",
      difficulty: "Medium",
      color: "#F97316"
    },
    {
      id: 3,
      name: "JEE Main 2021 — Paper 2",
      when: "in 7 days",
      difficulty: "Medium",
      color: "#F97316"
    }
  ]
};

export default dashboardData;