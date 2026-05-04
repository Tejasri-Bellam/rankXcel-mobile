export function assessmentExam() {
  return [
    {
      "exam": {
        "id": "exam_mains_2026",
        "name": "Mains 2026",
        "tag": "JEE",
        "status": "live",
        "duration_minutes": 60,
    "total_questions": 30,
    "attempts": 1,
    "exam_status": "In Progress",
    "schedule": {
      "window_start": "13 Apr 2026, 4:38 pm",
      "window_end": "13 Apr 2026, 5:38 pm",
      "exam_duration": "1 hr"
    },
    "window_closes_in": "0h 0m",
    "instructions": [
      "This is a live assessment. All students take the exam within the same time window.",
      "Your timer starts when you click \"Start Assessment\". You must finish within the exam duration.",
      "You must complete the exam before the assessment window closes.",
      "Marking scheme: +4 for correct, -1 for incorrect MCQ, 0 for unattempted.",
      "You may switch between sections at any time during the exam.",
      "Answers are saved automatically when you click \"Save & Next\" or switch questions.",
      "Once you submit, the exam cannot be resumed or modified.",
      "Switching tabs will be recorded and may be flagged.",
      "Results and rankings will be available after the assessment window closes."
    ],
    "sections": [
      {
        "id": "mathematics",
        "name": "Mathematics",
        "total_questions": 5,
        "marks_per_correct": 4,
        "marks_per_incorrect": -1,
        "questions": [
          {
            "id": "math_q1",
            "number": 1,
            "type": "Multi Correct",
            "marks_correct": 4,
            "marks_incorrect": -3,
            "text": "If cos(B) = 4/5 and B is in the first quadrant, which of the following are true? (Select all that apply)\n(A) sin(B) = 3/5\n(B) tan(B) = 3/4\n(C) sec(B) = 5/4\n(D) cot(B) = 4/3",
            "options": [
              { "id": "A", "text": "sin(B) = 2/5" },
              { "id": "B", "text": "sec(B) = 5/4" },
              { "id": "C", "text": "tan(B) = 3/4" },
              { "id": "D", "text": "cot(B) = 4/3" }
            ],
            "correct_answers": ["B", "C", "D"]
          },
          {
            "id": "math_q2",
            "number": 2,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -5,
            "text": "What is the derivative of the function f(x) = 3x^2 with respect to x?",
            "options": [
              { "id": "A", "text": "5x^2" },
              { "id": "B", "text": "9x" },
              { "id": "C", "text": "2x" },
              { "id": "D", "text": "6x" }
            ],
            "correct_answers": ["D"]
          },
          {
            "id": "math_q3",
            "number": 3,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "The value of ∫(0 to π) sin(x) dx is:",
            "options": [
              { "id": "A", "text": "0" },
              { "id": "B", "text": "1" },
              { "id": "C", "text": "2" },
              { "id": "D", "text": "-1" }
            ],
            "correct_answers": ["C"]
          },
          {
            "id": "math_q4",
            "number": 4,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "If A = [[1, 2], [3, 4]], then det(A) is:",
            "options": [
              { "id": "A", "text": "10" },
              { "id": "B", "text": "-2" },
              { "id": "C", "text": "2" },
              { "id": "D", "text": "-10" }
            ],
            "correct_answers": ["B"]
          },
          {
            "id": "math_q5",
            "number": 5,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "The sum of the first 10 natural numbers is:",
            "options": [
              { "id": "A", "text": "45" },
              { "id": "B", "text": "50" },
              { "id": "C", "text": "55" },
              { "id": "D", "text": "60" }
            ],
            "correct_answers": ["C"]
          }
        ]
      },
      {
        "id": "physics",
        "name": "Physics",
        "total_questions": 5,
        "marks_per_correct": 4,
        "marks_per_incorrect": -1,
        "questions": [
          {
            "id": "phy_q1",
            "number": 1,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "A parallel plate capacitor with plate area 0.1 m^2 and plate separation 0.01 m is connected to a 100 V battery. A dielectric slab of dielectric constant 5 and thickness 0.005 m is inserted between the plates. Calculate the new capacitance of the capacitor.",
            "options": [
              { "id": "A", "text": "2.0 × 10^-10 F" },
              { "id": "B", "text": "1.77 × 10^-10 F" },
              { "id": "C", "text": "4.425 × 10^-10 F" },
              { "id": "D", "text": "8.85 × 10^-10 F" }
            ],
            "correct_answers": ["C"]
          },
          {
            "id": "phy_q2",
            "number": 2,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "A body of mass 2 kg is thrown vertically upward with an initial velocity of 20 m/s. What is the maximum height reached? (g = 10 m/s²)",
            "options": [
              { "id": "A", "text": "10 m" },
              { "id": "B", "text": "20 m" },
              { "id": "C", "text": "30 m" },
              { "id": "D", "text": "40 m" }
            ],
            "correct_answers": ["B"]
          },
          {
            "id": "phy_q3",
            "number": 3,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "The work done by a force F = 5N through a displacement of 10 m at an angle of 60° to the direction of force is:",
            "options": [
              { "id": "A", "text": "25 J" },
              { "id": "B", "text": "50 J" },
              { "id": "C", "text": "43.3 J" },
              { "id": "D", "text": "86.6 J" }
            ],
            "correct_answers": ["A"]
          },
          {
            "id": "phy_q4",
            "number": 4,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "The wavelength of light in vacuum is 600 nm. If it enters a medium of refractive index 1.5, the wavelength in the medium is:",
            "options": [
              { "id": "A", "text": "900 nm" },
              { "id": "B", "text": "400 nm" },
              { "id": "C", "text": "600 nm" },
              { "id": "D", "text": "300 nm" }
            ],
            "correct_answers": ["B"]
          },
          {
            "id": "phy_q5",
            "number": 5,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "Ohm's law states that the current through a conductor is proportional to the voltage across it. If V = 12V and R = 4Ω, what is I?",
            "options": [
              { "id": "A", "text": "2 A" },
              { "id": "B", "text": "3 A" },
              { "id": "C", "text": "4 A" },
              { "id": "D", "text": "6 A" }
            ],
            "correct_answers": ["B"]
          }
        ]
      },
      {
        "id": "chemistry",
        "name": "Chemistry",
        "total_questions": 3,
        "marks_per_correct": 4,
        "marks_per_incorrect": -1,
        "questions": [
          {
            "id": "chem_q1",
            "number": 1,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "Consider the following reaction: 2CrO4^2- + 2H^+ → Cr2O7^2- + H2O. If the equilibrium constant for the reaction is K, and the concentration of CrO4^2- is doubled while keeping the concentration of H^+ constant, what will be the effect on the equilibrium concentration of Cr2O7^2-?",
            "options": [
              { "id": "A", "text": "The concentration of Cr2O7^2- will remain unchanged." },
              { "id": "B", "text": "The concentration of Cr2O7^2- will increase only if the concentration of H^+ is also increased." },
              { "id": "C", "text": "The concentration of Cr2O7^2- will increase." },
              { "id": "D", "text": "The concentration of Cr2O7^2- will decrease." }
            ],
            "correct_answers": ["C"]
          },
          {
            "id": "chem_q2",
            "number": 2,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "Which of the following has the highest first ionization energy?",
            "options": [
              { "id": "A", "text": "Na" },
              { "id": "B", "text": "Mg" },
              { "id": "C", "text": "Al" },
              { "id": "D", "text": "Si" }
            ],
            "correct_answers": ["B"]
          },
          {
            "id": "chem_q3",
            "number": 3,
            "type": "Single Correct",
            "marks_correct": 4,
            "marks_incorrect": -1,
            "text": "The hybridization of carbon in CO2 is:",
            "options": [
              { "id": "A", "text": "sp3" },
              { "id": "B", "text": "sp2" },
              { "id": "C", "text": "sp" },
              { "id": "D", "text": "sp3d" }
            ],
            "correct_answers": ["C"]
          }
        ]
      }
    ]
  }
},
{
  "result": {
    "date": "27 Apr 2026",
    "score": 5,
    "total": 140,
    "percentage": 3.57,
    "correct": 0,
    "wrong": 5,
    "skipped": 30,
    "accuracy": 0,
    "time_taken_seconds": 16,
    "attempted": 5,
    "total_questions": 35,
    "subject_performance": [
      {
        "subject": "Mathematics",
        "score": "2/60",
        "accuracy": 0,
        "color": "#6C5CE7"
      },
      {
        "subject": "Physics",
        "score": "3/60",
        "accuracy": 0,
        "color": "#00B4D8"
      },
      {
        "subject": "Chemistry",
        "score": "0/44",
        "accuracy": 0,
        "color": "#F97316"
      }
    ]
  }
}
  ]
}

const examData = {
  exam: {
    id: "exam_mains_2026",
    name: "Mains 2026",
    tag: "JEE",
    status: "live",
    duration_minutes: 60,
    total_questions: 30,
    attempts: 1,
    exam_status: "In Progress",
    schedule: {
      window_start: "13 Apr 2026, 4:38 pm",
      window_end: "13 Apr 2026, 5:38 pm",
      exam_duration: "1 hr",
    },
    sections: [
      {
        id: "mathematics",
        name: "Mathematics",
        questions: [
          {
            id: "math_q1",
            marks_correct: 4,
            marks_incorrect: -3,
            correct_answers: ["B", "C", "D"],
          },
          {
            id: "math_q2",
            marks_correct: 4,
            marks_incorrect: -5,
            correct_answers: ["D"],
          },
        ],
      },
      {
        id: "physics",
        name: "Physics",
        questions: [
          {
            id: "phy_q1",
            marks_correct: 4,
            marks_incorrect: -1,
            correct_answers: ["C"],
          },
        ],
      },
      {
        id: "chemistry",
        name: "Chemistry",
        questions: [
          {
            id: "chem_q1",
            marks_correct: 4,
            marks_incorrect: -1,
            correct_answers: ["C"],
          },
        ],
      },
    ],
  },

  result: {
    date: "27 Apr 2026",
    subject_performance: [
      { subject: "Mathematics", color: "#6C5CE7" },
      { subject: "Physics", color: "#00B4D8" },
      { subject: "Chemistry", color: "#F97316" },
    ],
  },
};

export default examData;