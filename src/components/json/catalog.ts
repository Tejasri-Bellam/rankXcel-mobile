export type CatalogCourse = {
  slug: string;
  name: string;
  region: string;
  emoji: string;
  color: string;
  tag: string;
  period: string;
  learners: string;
  rating: number;
  free: boolean;
  blurb: string;
};

export const CATALOG: Record<string, CatalogCourse> = {
  'iit-jee': { slug: 'iit-jee', name: 'IIT JEE', region: 'in', emoji: '🧮', color: '#4f46e5', tag: 'Engineering entrance', period: 'year', learners: '8.2L', rating: 4.8, free: false, blurb: 'Maths, Physics & Chemistry for JEE Main + Advanced.' },
  'neet-ug': { slug: 'neet-ug', name: 'NEET UG', region: 'in', emoji: '🩺', color: '#16b877', tag: 'Medical entrance', period: 'year', learners: '6.4L', rating: 4.8, free: false, blurb: 'Biology, Physics & Chemistry, NTA pattern.' },
  'ssc-cgl': { slug: 'ssc-cgl', name: 'SSC CGL', region: 'in', emoji: '📋', color: '#f7a823', tag: 'Government jobs', period: 'year', learners: '3.1L', rating: 4.7, free: false, blurb: 'Quant, Reasoning, English & GK for Tier 1 & 2.' },
  'upsc-cse': { slug: 'upsc-cse', name: 'UPSC CSE', region: 'in', emoji: '🏛️', color: '#ff5a3c', tag: 'Civil services', period: 'year', learners: '2.0L', rating: 4.7, free: false, blurb: 'Prelims GS & CSAT with current affairs.' },
  'uk-driving-theory': { slug: 'uk-driving-theory', name: 'Driving Licence Theory', region: 'gb', emoji: '🚗', color: '#4f46e5', tag: 'DVSA theory test', period: 'year', learners: '210k', rating: 4.9, free: false, blurb: 'Multiple-choice + hazard perception, official-style.' },
  'ielts-academic': { slug: 'ielts-academic', name: 'IELTS Academic', region: 'gb', emoji: '🎓', color: '#14b8a6', tag: 'English proficiency', period: 'year', learners: '120k', rating: 4.8, free: false, blurb: 'Listening, Reading, Writing & Speaking practice.' },
  'life-in-the-uk': { slug: 'life-in-the-uk', name: 'Life in the UK', region: 'gb', emoji: '👑', color: '#f7a823', tag: 'Citizenship test', period: 'year', learners: '95k', rating: 4.9, free: true, blurb: 'All 24 chapters, official handbook coverage.' },
};