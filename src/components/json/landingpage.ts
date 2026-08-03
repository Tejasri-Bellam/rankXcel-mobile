export const homeData = {
  header: {
    logoText: "RankXcel",
    loginText: "Log in",
    signupText: "Sign up",
  },

  hero: {
    badge: "India's #1 exam prep",
    titleLine1: "Crack JEE & NEET",
    titleLine2: "with daily practice",
    titleLine3: "that adapts to you.",
    description:
      "Adaptive practice, full-length mocks, and live ranked tests — built for the way India's toughest exams actually work.",
    primaryBtn: "Start Free — No Card Needed →",
    secondaryBtn: "See how it works",
    stats: [
      { value: "12L+", label: "learners" },
      { value: "4.8★", label: "avg rating" },
      { value: "2.1Cr", label: "questions solved" },
    ],
    readinessCard: {
      streakDays: 12,
      xp: "8,450",
      level: 7,
      readinessPercent: 56,
      readinessStatus: "Building",
      examName: "JEE Main",
      daysLeft: 312,
      subjects: [
        { icon: "📐", name: "Maths", percent: 58, color: "#F59E0B" },
        { icon: "🧪", name: "Physics", percent: 46, color: "#F59E0B" },
        { icon: "⚗️", name: "Chemistry", percent: 63, color: "#10B981" },
      ],
    },
  },

  popularCourses: {
    title: "Popular courses",
    viewAll: "Browse all →",
    list: [
      {
        slug: "iit-jee",
        icon: "📅",
        tag: "FREE",
        title: "IIT JEE",
        desc: "Maths, Physics & Chemistry for JEE Main + Advanced.",
        rating: 4.8,
        learners: "8.2L",
      },
      {
        slug: "neet-ug",
        icon: "🩺",
        tag: "FREE",
        title: "NEET UG",
        desc: "Biology, Physics & Chemistry, NTA pattern.",
        rating: 4.8,
        learners: "6.4L",
      },
      {
        slug: "ssc-cgl",
        icon: "📋",
        tag: "FREE",
        title: "SSC CGL",
        desc: "Quant, Reasoning, English & GK for Tier 1 & 2.",
        rating: 4.7,
        learners: "3.1L",
      },
      {
        slug: "upsc-cse",
        icon: "🏛️",
        tag: "FREE",
        title: "UPSC CSE",
        desc: "Prelims GS & CSAT with current affairs.",
        rating: 4.7,
        learners: "2.0L",
      },
    ],
  },
  howItWorks: {
    title: "How RankXcel works",
    steps: [
      // {
      //   no: 1,
      //   icon: "🎯",
      //   title: "Take a diagnostic",
      //   desc: "We map your strengths across every topic in minutes.",
      // },
      {
        no: 1,
        icon: "🔁",
        title: "Practice your weak spots",
        desc: "Adaptive questions with instant explanations, every day.",
      },
      {
        no: 2,
        icon: "📄",
        title: "Mock the real exam",
        desc: "Full-length, timed mocks that mirror the actual paper.",
      },
      {
        no: 3,
        icon: "📊",
        title: "Track your readiness",
        desc: "A live gauge tells you exactly when you're ready.",
      },
    ],
  },

  levelingCard: {
    title: "Learning that feels like leveling up.",
    desc: "Earn XP, keep your streak, climb the leaderboard, and unlock badges as you master each topic.",
    pills: [
      { icon: "⚡", label: "Daily XP" },
      { icon: "🔥", label: "Streaks" },
      { icon: "🎖️", label: "Badges" },
      { icon: "🏆", label: "Live ranks" },
    ],
  },

  testimonial: {
    stars: 5,
    quote:
      "The weak-topic recommendations alone got my Physics from 40% to 80% in six weeks. The mocks feel exactly like the real JEE.",
    initials: "RK",
    name: "Rohan Kapoor",
    sub: "AIR 2,140 · JEE Main 2026",
  },

  ctaSection: {
    title: "Start free today",
    subtitle:
      "Take a free diagnostic and see your strength map in 10 minutes. No card needed.",
    button: "Create free account →",
  },

  footer: {
    logoText: "RankXcel",
    desc: "Adaptive practice, mocks and live exams — built for learners in India.",
    columns: [
      { heading: "Product", links: ["Browse courses", "Terms"] },
      { heading: "Company", links: ["How it works", "Contact", "Privacy"] },
    ],
    copyright: "© 2026 RankXcel. All rights reserved.",
  },
};
