import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { legalStyles as styles } from '@/src/styles/styles/common/legalstyles';
import PageHeader from './PageHeader';
import MarketingFooter from './Footer';
import { sendContactMessageService } from '@/src/libs/services/contact';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(''); // TODO: swap for your country picker component; sending as numeric id
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; country?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email';
    if (!phone.trim()) next.phone = 'Phone number is required';
    if (!country.trim() || isNaN(Number(country))) next.country = 'Country is required';
    if (!message.trim()) next.message = 'Message is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await sendContactMessageService({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: Number(country),
        message: message.trim(),
      });
      setName('');
      setEmail('');
      setPhone('');
      setCountry('');
      setMessage('');
      setErrors({});
      Alert.alert('Message sent', "We'll get back to you soon.");
    } catch (e) {
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
          <TextInput
            style={fieldStyle(errors.phone)}
            placeholder="e.g. 9990001111"
            placeholderTextColor="#9CA3AF"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          {errors.phone ? <Text style={errorStyle}>{errors.phone}</Text> : null}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={labelStyle}>Country</Text>
          <TextInput
            style={fieldStyle(errors.country)}
            placeholder="India"
            placeholderTextColor="#9CA3AF"
            value={country}
            onChangeText={setCountry}
            keyboardType="number-pad"
          />
          {errors.country ? <Text style={errorStyle}>{errors.country}</Text> : null}
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