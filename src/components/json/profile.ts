export type NotifKey =
  | 'mockResults'
  | 'weeklyTips'
  | 'mockNotif'
  | 'practiceReminders'
  | 'productUpdates';

export function ProfileJson() {
  return {
    user: {
      fullName: 'Tejasri Bellam',
      email: 'tejasri@mailinator.com',
      phone: '9876543210',
      initials: 'TB',
      role: 'Student',
      memberSince: 'April 2026',
    },

    exams: [
      { id: 1, name: 'JEE', year: '2027' },
      { id: 2, name: 'EAMCET', year: '2028' },
    ],

    examOptions: ['JEE', 'EAMCET', 'NEET', 'JEE Mains'],

    notifications: {
      mockResults: true,
      weeklyTips: false,
      mockNotif: true,
      practiceReminders: true,
      productUpdates: false,
    },

    notificationList: [
      {
        key: 'mockResults' as NotifKey,
        label: 'Mock results and analysis ready',
        channel: 'Email',
      },
      {
        key: 'weeklyTips' as NotifKey,
        label: 'Weekly study tips and performance insights',
        channel: 'Email',
      },
      {
        key: 'mockNotif' as NotifKey,
        label: 'Mock results notification',
        channel: 'In-App',
      },
      {
        key: 'practiceReminders' as NotifKey,
        label: 'Practice reminders and streaks',
        channel: 'In-App',
      },
      {
        key: 'productUpdates' as NotifKey,
        label: 'Product updates and announcements',
        channel: 'In-App',
      },
    ],
  };
}