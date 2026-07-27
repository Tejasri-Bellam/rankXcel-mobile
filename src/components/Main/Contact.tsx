import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { legalStyles as styles } from '@/src/styles/styles/common/legalstyles';
import PageHeader from './PageHeader';
import MarketingFooter from './Footer';

const CONTACT_ROWS = [
  { label: 'Email', value: 'help@rankxcel.app' },
  { label: 'Support hours', value: 'Mon–Sat, 9am–8pm' },
  { label: 'Region', value: 'India' },
];

export default function ContactScreen() {
  const [message, setMessage] = useState('');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <PageHeader />

      <View style={styles.content}>
        <Text style={styles.title}>Get in touch</Text>

        <View style={{ marginBottom: 24 }}>
          {CONTACT_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderBottomWidth: i < CONTACT_ROWS.length - 1 ? 1 : 0,
                borderBottomColor: '#EEF0F5',
              }}
            >
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{row.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F0E2C' }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            color: '#0F0E2C',
            minHeight: 110,
            textAlignVertical: 'top',
            marginBottom: 16,
          }}
          placeholder="How can we help?"
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <TouchableOpacity
          style={{ backgroundColor: '#4F46E5', paddingVertical: 15, borderRadius: 12, alignItems: 'center' }}
          onPress={() => { /* wire to your send-message API */ }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Send message</Text>
        </TouchableOpacity>
      </View>

      <MarketingFooter />
    </ScrollView>
  );
}