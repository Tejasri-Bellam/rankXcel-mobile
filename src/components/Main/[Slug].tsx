import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { marketingStyles as s } from '@/src/styles/styles/marketing/shared';
import { CATALOG } from '../json/catalog';
import { COURSES } from '../json/courses';
import PageHeader from './PageHeader';
import MarketingFooter from './Footer';

type Tab = 'syllabus' | 'included' | 'faqs';

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [tab, setTab] = useState<Tab>('syllabus');
  const [openFaq, setOpenFaq] = useState(0);

  const catalogCourse = slug ? CATALOG[slug] : undefined;
  const course = slug ? COURSES[slug] : undefined;

  if (!catalogCourse) {
    return (
      <ScrollView style={s.page}>
        <PageHeader />
        <View style={s.section}>
          <Text style={s.h1}>Course not found</Text>
        </View>
        <MarketingFooter />
      </ScrollView>
    );
  }

  const mockCount = course?.mocks?.length;
  const subjectList = course?.subjects || course?.topics;

  const whatsIncluded = [
    { icon: 'grid-outline', title: 'Full adaptive syllabus', desc: 'Every topic & sub-topic, with a live strength map.' },
    { icon: 'refresh-outline', title: 'Unlimited practice', desc: 'Instant feedback and explanations on every question.' },
    { icon: 'document-text-outline', title: mockCount ? `${mockCount} full-length mocks` : 'Multiple full-length mocks', desc: 'Timed mocks mirroring the real paper.' },
    { icon: 'radio-outline', title: 'Live exams', desc: 'Time-windowed ranked tests with percentile & leaderboard.' },
    { icon: 'bar-chart-outline', title: 'Performance analytics', desc: 'Readiness gauge, trends and weakest-first recommendations.' },
    { icon: 'flash-outline', title: 'XP, streaks & badges', desc: 'Stay motivated with daily goals and rewards.' },
  ];

  const priceChecklist = [
    'Full adaptive syllabus',
    'Unlimited practice',
    mockCount ? `${mockCount} full-length mocks` : 'Multiple full-length mocks',
    'Scheduled ranked exams',
    'Performance analytics',
  ];

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      <PageHeader
        breadcrumb={[
            { label: 'Courses', onPress: () => router.push('/courses') },
            { label: catalogCourse.name },
        ]}
        />

      <View style={[s.courseHeroBand, { backgroundColor: `${catalogCourse.color}0F` }]}>
        <View style={s.courseHeroRow}>
          <View style={[s.courseHeroIconBox, { backgroundColor: `${catalogCourse.color}22` }]}>
            <Text style={s.courseHeroIconText}>{catalogCourse.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.courseHeroTitle}>{catalogCourse.name}</Text>
            <Text style={s.courseHeroTagline}>{course?.tagline || catalogCourse.blurb}</Text>
          </View>
        </View>
        <View style={s.courseHeroMetaRow}>
          <Text style={s.courseHeroMetaText}>★ {catalogCourse.rating} rating</Text>
          <Text style={s.courseHeroMetaText}>👤 {catalogCourse.learners} learners</Text>
          {subjectList && <Text style={s.courseHeroMetaText}>☰ {subjectList.length} subjects</Text>}
        </View>
      </View>

      <View style={s.section}>
        {/* Tabs */}
        <View style={s.tabRow}>
          {(['syllabus', 'included', 'faqs'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[s.tabItem, tab === t && s.tabItemActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'syllabus' ? 'Syllabus' : t === 'included' ? "What's included" : 'FAQs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Syllabus */}
        {tab === 'syllabus' && (
          <View>
            {subjectList ? (
              <>
                {subjectList.map((subj) => (
                  <View style={s.syllabusRow} key={subj.name}>
                    <Text style={s.syllabusIcon}>{subj.icon}</Text>
                    <Text style={s.syllabusName}>{subj.name}</Text>
                    <Text style={s.syllabusTopics}>{subj.topics} topics</Text>
                  </View>
                ))}
                <View style={s.sampleBanner}>
                  <Ionicons name="eye-outline" size={16} color="#4F46E5" />
                  <Text style={s.sampleBannerText}>Try a few sample questions free before you subscribe.</Text>
                </View>
              </>
            ) : (
              <View style={s.previewFallback}>
                <View style={s.previewFallbackIconWrap}>
                  <Ionicons name="book-outline" size={26} color="#4F46E5" />
                </View>
                <Text style={s.previewFallbackTitle}>Syllabus preview</Text>
                <Text style={s.previewFallbackDesc}>{catalogCourse.blurb}</Text>
              </View>
            )}
          </View>
        )}

        {/* What's included */}
        {tab === 'included' && (
          <View>
            {whatsIncluded.map((item) => (
              <View style={s.includedRow} key={item.title}>
                <View style={s.includedIconWrap}>
                  <Ionicons name={item.icon as any} size={18} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.includedTitle}>{item.title}</Text>
                  <Text style={s.includedDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* FAQs */}
        {tab === 'faqs' && (
          <View>
            {course?.faqs ? (
              course.faqs.map(([q, a], i) => (
                <TouchableOpacity
                  key={q}
                  style={s.faqCard}
                  onPress={() => setOpenFaq(openFaq === i ? -1 : i)}
                  activeOpacity={0.8}
                >
                  <View style={s.faqQuestionRow}>
                    <Text style={s.faqQuestion}>{q}</Text>
                    <Ionicons name={openFaq === i ? 'chevron-down' : 'chevron-forward'} size={16} color="#9CA3AF" />
                  </View>
                  {openFaq === i && <Text style={s.faqAnswer}>{a}</Text>}
                </TouchableOpacity>
              ))
            ) : (
              <View style={s.faqCard}>
                <View style={s.faqQuestionRow}>
                  <Text style={s.faqQuestion}>More info coming soon</Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </View>
                <Text style={s.faqAnswer}>Full details for this course are being finalised.</Text>
              </View>
            )}
          </View>
        )}

        {/* Price card */}
        <View style={s.priceCard}>
          <Text style={s.launchOfferText}>Launch offer · cancel anytime</Text>
          {priceChecklist.map((item) => (
            <View style={s.priceCheckRow} key={item}>
              <Ionicons name="checkmark" size={16} color="#16A34A" />
              <Text style={s.priceCheckText}>{item}</Text>
            </View>
          ))}
          <TouchableOpacity style={s.subscribeBtn} onPress={() => router.push('/auth/sign-up')}>
            <Text style={s.subscribeBtnText}>Subscribe →</Text>
          </TouchableOpacity>
        </View>
        

        <View style={s.freeDiagnosticNote}>
          <Ionicons name="eye-outline" size={16} color="#4F46E5" />
          <Text style={s.freeDiagnosticNoteText}>Free diagnostic & sample questions before you pay.</Text>
        </View>
      </View>

      <MarketingFooter />
    </ScrollView>
  );
}