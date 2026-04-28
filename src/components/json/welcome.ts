export const WelcomeJson = () => {
  return {
    user: {
      name: 'Tejasri',
    },

    logo: {
      shortName: 'RX',
    },

    title: 'Welcome, Tejasri! 👋',

    subtitle:
      "Let's personalise your JEE Main preparation in\n3 quick steps — takes about 5 minutes.",

    steps: [
      {
        number: '1',
        title: 'Set Your Goal',
        description: 'Target exam & year',
      },
      {
        number: '2',
        title: 'Self-Assessment',
        description: 'Rate subjects & flag weak areas',
      },
      {
        number: '3',
        title: 'Diagnostic Test',
        description: '30 questions ~60 minutes',
      },
      {
        number: '4',
        title: 'Your Roadmap',
        description: 'Personalised study plan ready',
      },
    ],

    buttons: {
      getStarted: 'Get Started →',
      skip: 'Skip onboarding, go to dashboard',
    },

    routes: {
      onboarding: '../onboarding' as const,
      dashboard: '../dashboard' as const,
    },
  };
};