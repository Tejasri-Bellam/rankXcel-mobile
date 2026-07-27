export type SyllabusItem = { icon: string; name: string; topics: number };
export type MockItem = { slug: string; name: string; q: number; mins: number; attempted: boolean; score?: number; badge?: string };
export type LiveItem = { slug: string; name: string; date: string; q: number; mins: number; state: 'upcoming' | 'live' | 'closed'; registered: number; published?: boolean };

export type Course = {
  slug: string;
  name: string;
  region: string;
  hasSubjects: boolean;
  emoji: string;
  color: string;
  tagline: string;
  examName: string;
  examDate: string;
  daysLeft: number;
  subjects?: SyllabusItem[];
  topics?: SyllabusItem[];
  mocks: MockItem[];
  live: LiveItem[];
  faqs: [string, string][];
  readiness: number;
  streak: number;
  xp: number;
  level: number;
  levelName: string;
};

const IIT_SUBJECTS: SyllabusItem[] = [
  { icon: '📐', name: 'Mathematics', topics: 5 },
  { icon: '🧲', name: 'Physics', topics: 5 },
  { icon: '🧪', name: 'Chemistry', topics: 3 },
];

const UKD_TOPICS: SyllabusItem[] = [
  { icon: '🚦', name: 'Rules of the Road', topics: 6 },
  { icon: '⚠️', name: 'Hazard Awareness', topics: 4 },
  { icon: '🚗', name: 'Vehicle Handling', topics: 3 },
];

export const COURSES: Record<string, Course> = {
  'iit-jee': {
    slug: 'iit-jee', name: 'IIT JEE', region: 'in', hasSubjects: true, emoji: '🧮', color: '#4f46e5',
    tagline: 'Maths · Physics · Chemistry — JEE Main + Advanced',
    examName: 'JEE Main 2027', examDate: 'Apr 2027', daysLeft: 312,
    subjects: IIT_SUBJECTS,
    mocks: [
      { slug: 'jee-main-full-1', name: 'JEE Main — Full Mock 1', q: 75, mins: 180, attempted: true, score: 0.71, badge: 'Recommended' },
      { slug: 'jee-main-full-2', name: 'JEE Main — Full Mock 2', q: 75, mins: 180, attempted: false },
      { slug: 'jee-adv-paper-1', name: 'JEE Advanced — Paper 1', q: 54, mins: 180, attempted: false, badge: 'Advanced' },
      { slug: 'maths-only-mock', name: 'Subject Mock — Mathematics', q: 30, mins: 75, attempted: true, score: 0.64 },
    ],
    live: [
      { slug: 'all-india-jee-jun', name: 'All-India JEE Grand Test', date: 'Sun 14 Jun, 7:00 PM', q: 75, mins: 180, state: 'upcoming', registered: 18420 },
      { slug: 'maths-weekly-12', name: 'Maths Weekly Ranked #12', date: 'Live now', q: 30, mins: 60, state: 'live', registered: 5210 },
      { slug: 'physics-marathon', name: 'Physics Marathon', date: 'Sat 6 Jun (closed)', q: 45, mins: 90, state: 'closed', registered: 7330, published: true },
    ],
    faqs: [
      ['Does this cover both JEE Main and Advanced?', 'Yes — the syllabus tree spans Main and Advanced, and mocks are tagged by paper so you can target either.'],
      ['How does adaptive practice work?', 'Every answer updates your strength map. Recommendations always point at your weakest sub-topics first.'],
      ['Can I take a free diagnostic?', 'Yes. New subscribers get a skippable diagnostic mock that seeds your subject-wise strengths.'],
    ],
    readiness: 0.56, streak: 12, xp: 8450, level: 7, levelName: 'Sharpshooter',
  },
  'uk-driving-theory': {
    slug: 'uk-driving-theory', name: 'Driving Licence Theory', region: 'gb', hasSubjects: false, emoji: '🚗', color: '#4f46e5',
    tagline: 'Multiple-choice theory + hazard perception',
    examName: 'Theory Test', examDate: 'booked 28 Jun', daysLeft: 25,
    topics: UKD_TOPICS,
    mocks: [
      { slug: 'dvsa-mock-1', name: 'DVSA Theory — Mock 1', q: 50, mins: 57, attempted: true, score: 0.86, badge: 'Official-style' },
      { slug: 'dvsa-mock-2', name: 'DVSA Theory — Mock 2', q: 50, mins: 57, attempted: false },
      { slug: 'signs-sprint', name: 'Road Signs Sprint', q: 20, mins: 20, attempted: false, badge: 'Quick' },
    ],
    live: [
      { slug: 'national-theory-cup', name: 'National Theory Cup', date: 'Wed 10 Jun, 6:30 PM', q: 50, mins: 57, state: 'upcoming', registered: 3120 },
      { slug: 'hazard-live', name: 'Hazard Perception Live', date: 'Live now', q: 14, mins: 30, state: 'live', registered: 980 },
    ],
    faqs: [
      ['Are questions like the real DVSA test?', 'They follow the official multiple-choice format and cover the full DVSA category, including hazard awareness.'],
      ['Is there a free option?', 'Life in the UK is free; Driving Theory includes a free diagnostic and sample topics before you subscribe.'],
      ['Will it help me pass first time?', "96% of learners who finish all topics and 3 mocks pass first time. Your readiness gauge tells you when you're ready."],
    ],
    readiness: 0.78, streak: 6, xp: 3120, level: 4, levelName: 'Confident',
  },
};