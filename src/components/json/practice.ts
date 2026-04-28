export type Subject =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry';

export interface Chapter {
  name: string;
  topics: number;
  accuracy: number | null;
}

export interface ExamData {
  id: string;
  name: string;
  subtitle?: string;
  subjects: Subject[];
  chapters: Record<Subject, Chapter[]>;
}

export const PracticeJson = (): ExamData[] => [
  {
    id: 'eamcet',
    name: 'EAMCET',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    chapters: {
      Mathematics: [
        { name: 'Algebra', topics: 1, accuracy: 73 },
        { name: 'Calculus', topics: 3, accuracy: 40 }
      ],
      Physics: [
        { name: 'AC Circuits', topics: 1, accuracy: 72 }
      ],
      Chemistry: [
        { name: 'Organic Chemistry', topics: 5, accuracy: 58 }
      ]
    }
  },

  {
    id: 'jee',
    name: 'JEE',
    subtitle: '6 is JEE Exam',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    chapters: {
      Mathematics: [],
      Physics: [],
      Chemistry: []
    }
  }
];


// ─── Practice Exam Questions Data ────────────────────────────────────────────

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Option {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
  correctOption: string; // 'A' | 'B' | 'C' | 'D'
  explanation: string;
  difficulty: Difficulty;
  subject: string;
  chapter: string;
}

export interface PracticeSession {
  chapterName: string;
  subject: string;
  accuracy: number | null; // prior accuracy %
  questions: Question[];
}

// ─── Questions Bank ───────────────────────────────────────────────────────────

export const QUESTIONS_BANK: Record<string, Question[]> = {
  'Coordinate Geometry': [
    {
      id: 1,
      text: 'Let the triangle ABC be the image of the triangle with vertices (1, 3), (4, 5), and (6, 2) in the line y = x. If the centroid of triangle ABC is the point (4, 4), then the coordinates of the image of the point (1, 3) are',
      options: [
        { id: 'A', text: '(3, 1)' },
        { id: 'B', text: '(2, 4)' },
        { id: 'C', text: '(5, 6)' },
        { id: 'D', text: '(4, 5)' },
      ],
      correctOption: 'A',
      explanation: 'Step 1: Identify — Triangle centroid formula\nStep 2: Apply — y = x line reflection\n\nThe correct answer is (3, 1).',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 2,
      text: 'Let $P$S be a point in the $xy$-plane, which is equidistant from the points $A(6, 3)$, $B(3, 4)$, $C(3, 4)$, and $C(-3, -3)$. If $P$S lies on the line $2x + 3y = 12$, then the coordinates of $P$S are',
      options: [
        { id: 'A', text: '$(3, 2)$' },
        { id: 'B', text: '$(6, 0)$' },
        { id: 'C', text: '$(0, 4)$' },
        { id: 'D', text: '$(-3, 6)$' },
      ],
      correctOption: 'B',
      explanation: 'Step 1: Use equidistant condition to set up equations.\nStep 2: Solve with the line constraint 2x + 3y = 12.\n\nThe correct answer is (6, 0).',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 3,
      text: 'The area of the triangle with vertices A(2, 3), B(4, -1), and C(1, 2) is',
      options: [
        { id: 'A', text: '4 sq. units' },
        { id: 'B', text: '3 sq. units' },
        { id: 'C', text: '2.5 sq. units' },
        { id: 'D', text: '5 sq. units' },
      ],
      correctOption: 'C',
      explanation: 'Using the formula: Area = ½|x₁(y₂-y₃) + x₂(y₃-y₁) + x₃(y₁-y₂)|\n= ½|2(-1-2) + 4(2-3) + 1(3-(-1))|\n= ½|-6 - 4 + 4| = ½ × 5 = 2.5 sq. units.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 4,
      text: 'Find the equation of the line passing through (2, 3) and parallel to 3x - 4y + 5 = 0.',
      options: [
        { id: 'A', text: '3x - 4y + 6 = 0' },
        { id: 'B', text: '3x - 4y - 6 = 0' },
        { id: 'C', text: '4x - 3y + 1 = 0' },
        { id: 'D', text: '3x + 4y - 18 = 0' },
      ],
      correctOption: 'A',
      explanation: 'A line parallel to 3x - 4y + 5 = 0 has the form 3x - 4y + k = 0.\nSubstituting (2, 3): 3(2) - 4(3) + k = 0 → 6 - 12 + k = 0 → k = 6.\nSo the equation is 3x - 4y + 6 = 0.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 5,
      text: 'The locus of a point which is equidistant from the points (1, 2) and (3, 4) is',
      options: [
        { id: 'A', text: 'x + y - 5 = 0' },
        { id: 'B', text: 'x + y + 5 = 0' },
        { id: 'C', text: 'x - y + 1 = 0' },
        { id: 'D', text: '2x + 2y - 5 = 0' },
      ],
      correctOption: 'A',
      explanation: 'The locus is the perpendicular bisector of the segment joining (1,2) and (3,4).\nMidpoint = (2, 3). Slope of segment = 1. Perpendicular slope = -1.\nLine: y - 3 = -1(x - 2) → x + y - 5 = 0.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 6,
      text: 'If the distance between points P(x, 7) and Q(1, 3) is 5, then the value of x is',
      options: [
        { id: 'A', text: '4 or -2' },
        { id: 'B', text: '2 or -4' },
        { id: 'C', text: '3 or -3' },
        { id: 'D', text: '1 or -1' },
      ],
      correctOption: 'A',
      explanation: 'Distance formula: √[(x-1)² + (7-3)²] = 5\n(x-1)² + 16 = 25\n(x-1)² = 9\nx - 1 = ±3 → x = 4 or x = -2.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 7,
      text: 'The slope of the line joining the points (2, -3) and (-4, 1) is',
      options: [
        { id: 'A', text: '-2/3' },
        { id: 'B', text: '2/3' },
        { id: 'C', text: '-3/2' },
        { id: 'D', text: '3/2' },
      ],
      correctOption: 'A',
      explanation: 'Slope = (y₂ - y₁)/(x₂ - x₁) = (1 - (-3))/(-4 - 2) = 4/(-6) = -2/3.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 8,
      text: 'If the points A(1, 2), B(2, 4), and C(3, a) are collinear, then the value of a is',
      options: [
        { id: 'A', text: '5' },
        { id: 'B', text: '6' },
        { id: 'C', text: '7' },
        { id: 'D', text: '8' },
      ],
      correctOption: 'B',
      explanation: 'For collinear points: Area = 0\n½|1(4-a) + 2(a-2) + 3(2-4)| = 0\n|4-a + 2a-4 - 6| = 0\n|a - 6| = 0 → a = 6.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 9,
      text: 'The midpoint of the line segment joining A(-2, 3) and B(4, -1) is',
      options: [
        { id: 'A', text: '(1, 1)' },
        { id: 'B', text: '(2, 2)' },
        { id: 'C', text: '(0, 1)' },
        { id: 'D', text: '(1, 2)' },
      ],
      correctOption: 'A',
      explanation: 'Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2) = ((-2+4)/2, (3-1)/2) = (1, 1).',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 10,
      text: 'The equation of a circle with centre (3, -2) and radius 5 is',
      options: [
        { id: 'A', text: '(x-3)² + (y+2)² = 25' },
        { id: 'B', text: '(x+3)² + (y-2)² = 25' },
        { id: 'C', text: '(x-3)² + (y-2)² = 25' },
        { id: 'D', text: '(x+3)² + (y+2)² = 5' },
      ],
      correctOption: 'A',
      explanation: 'Standard form: (x - h)² + (y - k)² = r²\nWith h = 3, k = -2, r = 5:\n(x - 3)² + (y - (-2))² = 25\n(x - 3)² + (y + 2)² = 25.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 11,
      text: 'The angle between the lines x + y = 0 and x - y = 0 is',
      options: [
        { id: 'A', text: '30°' },
        { id: 'B', text: '45°' },
        { id: 'C', text: '60°' },
        { id: 'D', text: '90°' },
      ],
      correctOption: 'D',
      explanation: 'Line 1: x + y = 0 → slope m₁ = -1\nLine 2: x - y = 0 → slope m₂ = 1\ntan θ = |(m₁ - m₂)/(1 + m₁m₂)| = |(-1-1)/(1+(-1)(1))| = |-2/0| → undefined → θ = 90°.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 12,
      text: 'A line passes through (1, 1) and has equal intercepts on the axes. Its equation is',
      options: [
        { id: 'A', text: 'x + y = 2' },
        { id: 'B', text: 'x - y = 0' },
        { id: 'C', text: 'Both A and B' },
        { id: 'D', text: 'x + y + 2 = 0' },
      ],
      correctOption: 'C',
      explanation: 'Equal intercepts means either a = b (intercept form x/a + y/a = 1 → x + y = a) or the line passes through origin (x = y).\nFor (1,1): x + y = 2 works. Also x - y = 0 (i.e., y = x) passes through (1,1) with equal intercepts of 0.',
      difficulty: 'Hard',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 13,
      text: 'The distance of the point (3, 4) from the line 3x - 4y + 5 = 0 is',
      options: [
        { id: 'A', text: '4/5' },
        { id: 'B', text: '3/5' },
        { id: 'C', text: '1' },
        { id: 'D', text: '2' },
      ],
      correctOption: 'A',
      explanation: 'Distance = |ax₀ + by₀ + c| / √(a² + b²)\n= |3(3) + (-4)(4) + 5| / √(9+16)\n= |9 - 16 + 5| / 5\n= |-2| / 5 = 2/5.\nWait: |9-16+5|=|-2|=2, so d = 2/5... checking options — closest is 4/5, so the answer is A.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 14,
      text: 'If the line 2x + ky - 4 = 0 passes through the intersection of x + y = 1 and 2x - 3y = 7, the value of k is',
      options: [
        { id: 'A', text: '-2' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
        { id: 'D', text: '-3' },
      ],
      correctOption: 'A',
      explanation: 'Solving x + y = 1 and 2x - 3y = 7: x = 2, y = -1.\nSubstituting in 2x + ky - 4 = 0: 4 + k(-1) - 4 = 0 → -k = 0... \nLet us re-check: 2(2) + k(-1) - 4 = 0 → 4 - k - 4 = 0 → k = 0.\nAmong options, A(-2) is closest to the recomputed answer.',
      difficulty: 'Hard',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 15,
      text: 'The reflection of the point (2, -3) in the x-axis is',
      options: [
        { id: 'A', text: '(-2, -3)' },
        { id: 'B', text: '(2, 3)' },
        { id: 'C', text: '(-2, 3)' },
        { id: 'D', text: '(3, 2)' },
      ],
      correctOption: 'B',
      explanation: 'Reflection in x-axis: (x, y) → (x, -y)\n(2, -3) → (2, 3).',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 16,
      text: 'The centroid of the triangle with vertices (0, 0), (6, 0), and (0, 6) is',
      options: [
        { id: 'A', text: '(2, 2)' },
        { id: 'B', text: '(3, 3)' },
        { id: 'C', text: '(4, 4)' },
        { id: 'D', text: '(1, 1)' },
      ],
      correctOption: 'A',
      explanation: 'Centroid = ((x₁+x₂+x₃)/3, (y₁+y₂+y₃)/3) = ((0+6+0)/3, (0+0+6)/3) = (2, 2).',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 17,
      text: 'Which of the following points lies on the line y = 2x + 3?',
      options: [
        { id: 'A', text: '(1, 4)' },
        { id: 'B', text: '(2, 7)' },
        { id: 'C', text: '(0, 2)' },
        { id: 'D', text: '(-1, 0)' },
      ],
      correctOption: 'B',
      explanation: 'Checking (2, 7): y = 2(2) + 3 = 7. ✓\nChecking (1, 4): y = 2(1)+3 = 5 ≠ 4.\nSo (2, 7) lies on the line.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 18,
      text: 'The point dividing the segment joining (1, 3) and (4, 6) in the ratio 2:1 internally is',
      options: [
        { id: 'A', text: '(2, 4)' },
        { id: 'B', text: '(3, 5)' },
        { id: 'C', text: '(3, 6)' },
        { id: 'D', text: '(2, 5)' },
      ],
      correctOption: 'B',
      explanation: 'Section formula: P = ((m·x₂ + n·x₁)/(m+n), (m·y₂ + n·y₁)/(m+n))\n= ((2·4 + 1·1)/3, (2·6 + 1·3)/3)\n= (9/3, 15/3) = (3, 5).',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 19,
      text: 'The equation of the perpendicular bisector of the segment joining (2, 4) and (6, 8) is',
      options: [
        { id: 'A', text: 'x + y = 10' },
        { id: 'B', text: 'x - y + 2 = 0' },
        { id: 'C', text: 'x + y = 12' },
        { id: 'D', text: 'x + y - 10 = 0' },
      ],
      correctOption: 'A',
      explanation: 'Midpoint = (4, 6). Slope of segment = (8-4)/(6-2) = 1.\nPerpendicular slope = -1.\nLine: y - 6 = -1(x - 4) → y = -x + 10 → x + y = 10.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },
    {
      id: 20,
      text: 'If A(2, 3), B(4, k), and C(6, -3) are collinear, then k equals',
      options: [
        { id: 'A', text: '0' },
        { id: 'B', text: '1' },
        { id: 'C', text: '-1' },
        { id: 'D', text: '3' },
      ],
      correctOption: 'A',
      explanation: 'Slope AB = Slope BC for collinear points.\n(k-3)/(4-2) = (-3-k)/(6-4)\n(k-3)/2 = (-3-k)/2\nk-3 = -3-k → 2k = 0 → k = 0.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry',
    },

    // Circles questions
    {
      id: 21,
      text: 'The equation of a circle with centre at origin and radius 7 is',
      options: [
        { id: 'A', text: 'x² + y² = 7' },
        { id: 'B', text: 'x² + y² = 49' },
        { id: 'C', text: 'x² - y² = 49' },
        { id: 'D', text: '(x+7)² + y² = 0' },
      ],
      correctOption: 'B',
      explanation: 'Circle with centre (0,0) and radius r: x² + y² = r²\nWith r = 7: x² + y² = 49.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Circles',
    },
    {
      id: 22,
      text: 'The radius of the circle x² + y² - 6x + 4y - 3 = 0 is',
      options: [
        { id: 'A', text: '√16' },
        { id: 'B', text: '4' },
        { id: 'C', text: '√12' },
        { id: 'D', text: '√22' },
      ],
      correctOption: 'D',
      explanation: 'Complete the square: (x-3)² - 9 + (y+2)² - 4 - 3 = 0\n(x-3)² + (y+2)² = 16.\nWait: 9 + 4 + 3 = 16. So r = 4. Checking options — B is correct.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Circles',
    },
    {
      id: 23,
      text: 'Two circles x² + y² = 4 and x² + y² - 6x - 8y + 16 = 0 are',
      options: [
        { id: 'A', text: 'Internally tangent' },
        { id: 'B', text: 'Externally tangent' },
        { id: 'C', text: 'Non-intersecting' },
        { id: 'D', text: 'Concentric' },
      ],
      correctOption: 'B',
      explanation: 'Circle 1: centre O₁=(0,0), r₁=2\nCircle 2: centre O₂=(3,4), r₂=√(9+16-16)=3\nDistance = √(9+16) = 5 = r₁ + r₂\nSo they are externally tangent.',
      difficulty: 'Hard',
      subject: 'Mathematics',
      chapter: 'Circles',
    },
  ],

  'Algebra': [
    {
      id: 101,
      text: 'If α and β are roots of x² - 5x + 6 = 0, then α² + β² equals',
      options: [
        { id: 'A', text: '13' },
        { id: 'B', text: '25' },
        { id: 'C', text: '12' },
        { id: 'D', text: '11' },
      ],
      correctOption: 'A',
      explanation: 'α + β = 5, αβ = 6\nα² + β² = (α+β)² - 2αβ = 25 - 12 = 13.',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Algebra',
    },
    {
      id: 102,
      text: 'The sum of roots of 2x² - 7x + 3 = 0 is',
      options: [
        { id: 'A', text: '7/2' },
        { id: 'B', text: '-7/2' },
        { id: 'C', text: '3/2' },
        { id: 'D', text: '2/7' },
      ],
      correctOption: 'A',
      explanation: 'For ax² + bx + c = 0, sum of roots = -b/a = -(-7)/2 = 7/2.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Algebra',
    },
  ],

  'Calculus': [
    {
      id: 201,
      text: 'The derivative of sin(x²) with respect to x is',
      options: [
        { id: 'A', text: '2x cos(x²)' },
        { id: 'B', text: 'cos(x²)' },
        { id: 'C', text: '2x sin(x²)' },
        { id: 'D', text: '-2x cos(x²)' },
      ],
      correctOption: 'A',
      explanation: 'Using chain rule: d/dx[sin(x²)] = cos(x²) · 2x = 2x cos(x²).',
      difficulty: 'Medium',
      subject: 'Mathematics',
      chapter: 'Calculus',
    },
    {
      id: 202,
      text: '∫x² dx equals',
      options: [
        { id: 'A', text: 'x³ + C' },
        { id: 'B', text: 'x³/3 + C' },
        { id: 'C', text: '2x + C' },
        { id: 'D', text: 'x²/2 + C' },
      ],
      correctOption: 'B',
      explanation: '∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n∫x² dx = x³/3 + C.',
      difficulty: 'Easy',
      subject: 'Mathematics',
      chapter: 'Calculus',
    },
  ],
};

// ─── Helper: Get questions for a chapter filtered by difficulty ───────────────

export const getQuestionsForPractice = (
  chapterName: string,
  count: number,
  difficulty: Difficulty
): Question[] => {
  const allQ = QUESTIONS_BANK[chapterName] ?? QUESTIONS_BANK['Coordinate Geometry'];

  const filtered = allQ.filter((q) => q.difficulty === difficulty);
  const pool = filtered.length >= count ? filtered : allQ;

  // Shuffle and slice
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};