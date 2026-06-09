export const IntroJson = () => {
  return {
    slides: [
      {
        icon: 'target',
        tint: '#5B4BFF',
        title: 'Practice that adapts to you',
        sub: 'Every answer updates your strength map, so you always know exactly what to study next.',
      },
      {
        icon: 'file-document-outline',
        tint: '#14B8A6',
        title: 'Full-length, exam-pattern mocks',
        sub: 'Sit realistic timed papers, then get a question-by-question breakdown and a readiness score.',
      },
      {
        icon: 'trophy-outline',
        tint: '#FF5A3C',
        title: 'Compete & stay on streak',
        sub: 'Live ranked tests, national leaderboards, XP, streaks and badges keep you coming back.',
      },
    ] as const,

    buttons: {
      skip: 'Skip',
      next: 'Next',
      getStarted: 'Get started',
      haveAccount: 'I already have an account',
    },

    routes: {
      signup: '/auth/sign-up' as const,
      login: '/auth/login' as const,
    },
  };
};
