import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { legalStyles as styles } from '@/src/styles/styles/common/legalstyles';
import { BRAND } from '@/src/libs/constants';

type LegalTab = 'terms' | 'privacy';

const TERMS_SECTIONS = [
  {
    heading: '1. Acceptance of terms',
    body: `By creating an account or using ${BRAND}, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.`,
  },
  {
    heading: '2. Who can use RankXcel',
    body: 'RankXcel is intended for students preparing for competitive exams such as JEE and NEET. You must provide accurate information when creating your account and keep your login credentials secure.',
  },
  {
    heading: '3. Your content and conduct',
    body: 'You agree to use the app only for personal exam preparation. You may not attempt to copy, redistribute, or reverse-engineer any question bank, mock test, or other content made available through the app.',
  },
  {
    heading: '4. Subscriptions and payments',
    body: 'Certain features, mock tests, or live assessments may require a paid plan. Prices, renewal terms, and refund conditions will be shown to you before you complete a purchase.',
  },
  {
    heading: '5. Account suspension',
    body: 'We may suspend or terminate accounts that violate these terms, attempt to cheat during assessments, or misuse the platform in ways that affect other students.',
  },
  {
    heading: '6. Changes to these terms',
    body: 'We may update these Terms of Service from time to time. Continued use of the app after changes take effect constitutes acceptance of the revised terms.',
  },
  {
    heading: '7. Contact us',
    body: 'If you have questions about these terms, please reach out to us through the support option in your profile settings.',
  },
];

const PRIVACY_SECTIONS = [
  {
    heading: '1. Information we collect',
    body: 'We collect the information you provide when creating an account (such as your name, email, and mobile number), along with your practice activity, mock test attempts, and performance analytics as you use the app.',
  },
  {
    heading: '2. How we use your information',
    body: 'Your data is used to personalize your practice recommendations, track your exam readiness, show your analytics and progress, and improve the overall RankXcel experience.',
  },
  {
    heading: '3. Sign-in with Google or Apple',
    body: 'If you sign in using Google or Apple, we receive only the basic profile information (such as name and email) needed to create and secure your account. We never receive your Google or Apple password.',
  },
  {
    heading: '4. Data sharing',
    body: 'We do not sell your personal data. We may share limited data with service providers who help us operate the app (such as hosting or analytics providers), under confidentiality obligations.',
  },
  {
    heading: '5. Data retention',
    body: 'We retain your account and performance data for as long as your account is active, or as needed to provide the service. You may request deletion of your account and associated data at any time.',
  },
  {
    heading: '6. Your choices',
    body: 'You can review and update your profile information from the app at any time, and can manage notification preferences from your settings.',
  },
  {
    heading: '7. Changes to this policy',
    body: 'We may update this Privacy Policy periodically. We will notify you of material changes through the app.',
  },
  {
    heading: '8. Contact us',
    body: 'For any privacy-related questions or requests, please reach out through the support option in your profile settings.',
  },
];

export default function LegalScreen() {
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<LegalTab>(
    initialTab === 'privacy' ? 'privacy' : 'terms'
  );

  const sections = tab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color="#2F8AF4" />
        </TouchableOpacity>
      </View>

      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <Ionicons name="flash" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.brandText}>{BRAND}</Text>
      </View>

      <Text style={styles.title}>
        {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
      </Text>
      <Text style={styles.subtitle}>Last updated: July 2026</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'terms' && styles.tabActive]}
          onPress={() => setTab('terms')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'terms' && styles.tabTextActive]}>
            Terms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'privacy' && styles.tabActive]}
          onPress={() => setTab('privacy')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'privacy' && styles.tabTextActive]}>
            Privacy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.heading}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}