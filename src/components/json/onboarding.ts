export const OnboardingJson = () => {
  return {
    logo: {
      shortName: 'RX',
      name: 'RankXcel',
    },
    steps: [
      { id: 1, label: 'Goals' },
      { id: 2, label: 'Assessment' },
      { id: 3, label: 'Diagnostic' },
      { id: 4, label: 'Complete' },
    ],

    goal: {
      title: 'Set Your Goal',
      subtitle:
        "Tell us what you're aiming for — we'll tailor everything to your target.",
      labels: { exam: 'Target Exam', year: 'Target Year' },
      placeholders: { exam: 'Search or select an exam...' },
      years: [2026, 2027],
      nextBtn: 'Next: Assessment',
    },

    assessment: {
      title: 'Self-Assessment',
      subtitle:
        'Rate your current preparation in each subject so we can find your weak spots.',
      ratePerSubject: 'Rate your level per subject',
      markWeakChapters: 'Mark weak chapters',
      noChapters: 'No chapters available',
      ratingLabels: [
        'Tap a star to rate',
        'Struggling',
        'Weak',
        'Average',
        'Good',
        'Strong',
      ],
      ratingHelp: (subject: string) =>
        `Tap a star to rate your ${subject} level`,
      dailyHoursLabel: 'Daily Study Hours',
      dailyHoursValue: (h: number) => `${h} hrs / day`,
      ticks: ['1h', '4h', '8h', '12h'],
      backBtn: 'Back',
      nextBtn: 'Next: Diagnostic Test',
      ratingRequired: 'Please rate all subjects before continuing',
    },

    diagnostic: {
      title: 'Take a Diagnostic Test',
      subtitle: 'Help us understand your current baseline — no pressure, no marks!',
      cardTitle: (examName: string) => `${examName} Diagnostic Test`,
      cardDesc:
        "A short, balanced test across your selected subjects. We'll analyse your responses to pinpoint exactly where you need the most work.",
      highlightTitle: (count: number) => `${count} Subjects`,
      highlightDesc: (subjects: string[]) => subjects.join(', '),
      whatYouGet: "What you'll get after the diagnostic:",
      bullets: [
        'Personalised weak chapter identification across your subjects',
        'Subject-wise baseline accuracy scores',
        'A first-week study plan tuned to your gaps',
        'An estimated rank band for your current level',
      ],
      info:
        'Full diagnostic test is coming soon. For now you can continue with your self-assessment and take a mock test later to refine your plan.',
      warning:
        "Without the diagnostic we'll rely on your self-assessment alone, which may result in slightly less accurate recommendations until you take a full mock.",
      backBtn: 'Back',
      nextBtn: 'Continue',
    },

    complete: {
      titleFor: (name: string) =>
        name ? `You're all set, ${name}!` : `You're all set!`,
      subtitle: 'Your preparation profile is ready based on your self-assessment.',
      heading: 'YOUR PREPARATION PROFILE',
      targetLabel: 'Target',
      priorityLabel: 'Priority Focus',
      dailyLabel: 'Daily Study Target',
      dailyValue: (h: number) => `${h} hours per day`,
      noPriority: 'All subjects',
      dashboardBtn: 'Go to My Dashboard',
      exploreBtn: 'Explore Mock Library',
    },
  };
};
 