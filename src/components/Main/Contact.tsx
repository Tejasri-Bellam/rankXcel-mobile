import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { legalStyles as styles } from '@/src/styles/styles/common/legalstyles';
import PageHeader from './PageHeader';
import MarketingFooter from './Footer';
import { sendContactMessageService } from '@/src/libs/services/contact';
import { resolveDetectedCountry } from '@/src/libs/services/countries';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // The country isn't asked for — it's detected via GET /v1/get_country/ and
  // matched against the countries master, and only its id is submitted.
  const countryIdRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resolved = await resolveDetectedCountry();
        if (active && resolved) countryIdRef.current = resolved.id;
      } catch {
        // Non-fatal — the message still sends without a country.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email';
    if (!phone.trim()) next.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.trim())) next.phone = 'Enter a valid 10 digit mobile number';
    if (!message.trim()) next.message = 'Message is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      // Detection on mount may still be in flight (or have failed) — try once
      // more here so a fast submit still carries the country.
      if (countryIdRef.current == null) {
        try {
          const resolved = await resolveDetectedCountry();
          if (resolved) countryIdRef.current = resolved.id;
        } catch {
          // Ignore — send without it.
        }
      }
      await sendContactMessageService({
        name: name.trim(),
        email: email.trim(),
        // The API stores the full number with the dial code; the input holds
        // only the bare 10 digits.
        phone: `+91${phone.trim()}`,
        ...(countryIdRef.current != null ? { country: countryIdRef.current } : {}),
        message: message.trim(),
      });
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setErrors({});
      // Back to the landing page once the message is away — replace so Back
      // doesn't drop the user onto the form they just submitted.
      Alert.alert('Message sent', "We'll get back to you soon.", [
        { text: 'OK', onPress: () => router.replace('/onboarding') },
      ]);
    } catch {
      Alert.alert('Something went wrong', 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = (hasError?: string) => ({
    borderWidth: 1,
    borderColor: hasError ? '#FCA5A5' : '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#0F0E2C',
  });

  const labelStyle = { fontSize: 12, fontWeight: '700' as const, color: '#374151', marginBottom: 6 };
  const errorStyle = { fontSize: 11, color: '#DC2626', marginTop: 4, marginBottom: 12 };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <PageHeader />

      <View style={styles.content}>
        <Text style={styles.title}>Get in touch</Text>

        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <Text style={labelStyle}>Name</Text>
          <TextInput
            style={fieldStyle(errors.name)}
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />
          {errors.name ? <Text style={errorStyle}>{errors.name}</Text> : null}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={labelStyle}>Email</Text>
          <TextInput
            style={fieldStyle(errors.email)}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email ? <Text style={errorStyle}>{errors.email}</Text> : null}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={labelStyle}>Phone number</Text>
          <View style={[fieldStyle(errors.phone), { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginRight: 8 }}>+91</Text>
            <TextInput
              style={{ flex: 1, fontSize: 14, color: '#0F0E2C', paddingVertical: 14 }}
              placeholder="9876543210"
              placeholderTextColor="#9CA3AF"
              value={phone}
              // The input holds the bare 10 digits; the +91 dial code is a
              // static prefix and is re-attached on submit (same as signup).
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          {errors.phone ? <Text style={errorStyle}>{errors.phone}</Text> : null}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={labelStyle}>Message</Text>
          <TextInput
            style={[fieldStyle(errors.message), { minHeight: 110, textAlignVertical: 'top' }]}
            placeholder="How can we help you?"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          {errors.message ? <Text style={errorStyle}>{errors.message}</Text> : null}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: submitting ? '#A5A0F0' : '#4F46E5',
            paddingVertical: 15,
            borderRadius: 12,
            alignItems: 'center',
            // Breathing room before the marketing footer below.
            marginBottom: 28,
          }}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Send message</Text>
          )}
        </TouchableOpacity>
      </View>

      <MarketingFooter />
    </ScrollView>
  );
}