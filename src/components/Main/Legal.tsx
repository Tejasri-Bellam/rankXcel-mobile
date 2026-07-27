import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { legalStyles as styles } from '@/src/styles/styles/common/legalstyles';
import PageHeader from './PageHeader';
import MarketingFooter from './Footer';

type LegalTab = 'terms' | 'privacy';

const TERMS_SECTIONS = [
  { heading: '1. Your account', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
  { heading: '2. Subscriptions', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
  { heading: '3. Acceptable use', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
  { heading: '4. Liability', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
];

const PRIVACY_SECTIONS = [
  { heading: '1. Data we collect', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
  { heading: '2. How we use it', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
  { heading: '3. Your choices', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
  { heading: '4. Contact', body: 'Summary text describing this section would appear here. Each region adheres to its local regulations.' },
];

export default function LegalScreen() {
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<LegalTab>(initialTab === 'privacy' ? 'privacy' : 'terms');

  const sections = tab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <PageHeader />

      <View style={styles.content}>
        <Text style={styles.title}>{tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</Text>
        <Text style={styles.subtitle}>Last updated June 2026. This is placeholder legal copy for the prototype.</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, tab === 'terms' && styles.tabActive]} onPress={() => setTab('terms')}>
            <Text style={[styles.tabText, tab === 'terms' && styles.tabTextActive]}>Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'privacy' && styles.tabActive]} onPress={() => setTab('privacy')}>
            <Text style={[styles.tabText, tab === 'privacy' && styles.tabTextActive]}>Privacy</Text>
          </TouchableOpacity>
        </View>

        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.heading}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </View>

      <MarketingFooter />
    </ScrollView>
  );
}