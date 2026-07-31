import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { marketingStyles as s } from '@/src/styles/styles/marketing/shared';
import { CATALOG } from '../json/catalog';
import { COURSES } from '../json/courses';
import PageHeader from './PageHeader';
import MarketingFooter from './Footer';
import { CmsFeaturedExam, getCmsFeaturedExamService } from '@/src/libs/services/cms';

type Tab = 'syllabus' | 'included' | 'faqs';

export default function CourseDetailScreen() {
  // The route is /courses/{id}: a CMS exam id for API-backed courses, or one of
  // the static catalogue slugs ("iit-jee") for the fallback content.
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('syllabus');
  const [openFaq, setOpenFaq] = useState(0);

  const isNumericId = !!id && /^\d+$/.test(String(id));
  // Static catalogue entry, keyed by slug — only for the non-numeric route.
  const catalogCourse = !isNumericId && id ? CATALOG[id] : undefined;
  const course = !isNumericId && id ? COURSES[id] : undefined;

  const [cmsExam, setCmsExam] = useState<CmsFeaturedExam | null>(null);
  const [loading, setLoading] = useState(isNumericId);

  useEffect(() => {
    if (!isNumericId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await getCmsFeaturedExamService(id);
        if (active && res?.data) setCmsExam(res.data);
      } catch {
        // Non-fatal — the static catalogue below still renders.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isNumericId]);

  if (loading && !catalogCourse) {
    return (
      <ScrollView style={s.page}>
        <PageHeader />
        <View style={[s.section, { alignItems: 'center', paddingVertical: 60 }]}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </ScrollView>
    );
  }

  if (!catalogCourse && !cmsExam) {
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

  // CMS wins wherever it has the field; the static catalogue fills the rest
  // (accent colour, emoji, rating/learners — none of which the API carries).
  const cmsSubjects = (cmsExam?.subjects ?? []).filter(
    (subject) => subject?.display_subject !== false,
  );
  const title = cmsExam?.name ?? catalogCourse?.name ?? '';
  const tagline =
    cmsExam?.description?.trim() || course?.tagline || catalogCourse?.blurb || '';
  const accent = catalogCourse?.color ?? '#4F46E5';
  const emoji = catalogCourse?.emoji ?? '📘';

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
            { label: title },
        ]}
        />

      <View style={[s.courseHeroBand, { backgroundColor: `${accent}0F` }]}>
        <View style={s.courseHeroRow}>
          <View style={[s.courseHeroIconBox, { backgroundColor: `${accent}22` }]}>
            <Text style={s.courseHeroIconText}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.courseHeroTitle}>{title}</Text>
            {!!tagline && <Text style={s.courseHeroTagline}>{tagline}</Text>}
          </View>
        </View>
        <View style={s.courseHeroMetaRow}>
          {cmsExam ? (
            <>
              {cmsExam.total_duration_minutes != null && (
                <Text style={s.courseHeroMetaText}>
                  ⏱ {cmsExam.total_duration_minutes} min
                </Text>
              )}
              {cmsExam.total_marks != null && (
                <Text style={s.courseHeroMetaText}>🎯 {cmsExam.total_marks} marks</Text>
              )}
              {cmsSubjects.length > 0 && (
                <Text style={s.courseHeroMetaText}>☰ {cmsSubjects.length} subjects</Text>
              )}
            </>
          ) : (
            <>
              <Text style={s.courseHeroMetaText}>★ {catalogCourse?.rating} rating</Text>
              <Text style={s.courseHeroMetaText}>👤 {catalogCourse?.learners} learners</Text>
              {subjectList && (
                <Text style={s.courseHeroMetaText}>☰ {subjectList.length} subjects</Text>
              )}
            </>
          )}
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
            {cmsSubjects.length > 0 ? (
              <>
                {cmsSubjects.map((subject) => (
                  <View style={s.syllabusRow} key={subject.id}>
                    <Text style={s.syllabusIcon}>📘</Text>
                    <Text style={s.syllabusName}>{subject.name}</Text>
                    <Text style={s.syllabusTopics}>
                      {subject.topics?.length ?? 0} topics
                      {subject.questions_count != null
                        ? ` · ${subject.questions_count} Qs`
                        : ''}
                    </Text>
                  </View>
                ))}
                <View style={s.sampleBanner}>
                  <Ionicons name="eye-outline" size={16} color="#4F46E5" />
                  <Text style={s.sampleBannerText}>Try a few sample questions free before you subscribe.</Text>
                </View>
              </>
            ) : subjectList ? (
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
                <Text style={s.previewFallbackDesc}>{tagline}</Text>
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