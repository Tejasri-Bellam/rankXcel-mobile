import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { marketingStyles as s } from '@/src/styles/styles/marketing/shared';
import PageHeader from './PageHeader';
import MarketingFooter from './Footer';
import { HOW_IT_WORKS } from '../json/howitworks';

export default function HowItWorksScreen() {
  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      <PageHeader />
      <View style={s.section}>
        <Text style={s.h1}>{HOW_IT_WORKS.title}</Text>
        <Text style={s.h1Subtitle}>{HOW_IT_WORKS.subtitle}</Text>

        <View style={s.stepsGrid}>
          {HOW_IT_WORKS.steps.map((step) => (
            <View style={s.stepCard} key={step.no}>
              <View style={s.stepIconWrap}>
                <MaterialCommunityIcons name={step.icon as any} size={22} color="#FFFFFF" />
              </View>
              <Text style={s.stepTitle}>{step.no} · {step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.primaryBtnFull} onPress={() => router.push('/courses/index')}>
          <Text style={s.primaryBtnFullText}>Browse courses →</Text>
        </TouchableOpacity>
      </View>
      <MarketingFooter />
    </ScrollView>
  );
}