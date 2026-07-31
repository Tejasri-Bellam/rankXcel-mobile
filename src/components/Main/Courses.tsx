import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { marketingStyles as s } from '@/src/styles/styles/marketing/shared';
import PageHeader from './PageHeader';
import { CATALOG } from '../json/catalog';
import MarketingFooter from './Footer';
import {
  CmsExamRef,
  cmsListFrom,
  getCmsFeaturedExamsService,
} from '@/src/libs/services/cms';

export default function CoursesScreen() {
  const [query, setQuery] = useState('');
  // Exams from the CMS. Empty (API down / nothing published) → the static
  // catalogue is rendered instead.
  const [exams, setExams] = useState<CmsExamRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getCmsFeaturedExamsService();
        if (active) setExams(cmsListFrom<CmsExamRef>(res?.data));
      } catch {
        // Non-fatal — fall through to the static catalogue.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const cmsCourses = exams.filter((e) =>
    (e?.name ?? '').toLowerCase().includes(needle),
  );
  const staticCourses = Object.values(CATALOG).filter((c) =>
    c.name.toLowerCase().includes(needle),
  );
  const useCms = exams.length > 0;

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      <PageHeader />
      <View style={s.section}>
        <Text style={s.h1}>Courses in India</Text>
        <Text style={s.h1Subtitle}>Pick an exam to see its syllabus, samples & pricing.</Text>

        <View style={s.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={s.searchInput}
            placeholder="Search exams..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : useCms ? (
          <View style={s.courseListGrid}>
            {cmsCourses.map((exam) => (
              <TouchableOpacity
                key={String(exam.id)}
                style={s.courseListCard}
                onPress={() =>
                  router.push({
                    pathname: '/courses/[id]',
                    params: { id: String(exam.id) },
                  })
                }
              >
                <View style={s.courseListTopRow}>
                  <View style={[s.courseListIconBox, { backgroundColor: '#4F46E51A' }]}>
                    <Text style={s.courseListIcon}>📘</Text>
                  </View>
                  <View style={s.courseFreeTag}>
                    <Text style={s.courseFreeTagText}>FREE</Text>
                  </View>
                </View>
                <Text style={s.courseListTitle}>{exam.name}</Text>
                {/* No blurb/rating/learners on this endpoint — the code stands
                    in rather than inventing numbers. */}
                <Text style={s.courseListDesc}>{exam.code?.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
            {cmsCourses.length === 0 && (
              <Text style={s.h1Subtitle}>No exams match “{query.trim()}”.</Text>
            )}
          </View>
        ) : (
          <View style={s.courseListGrid}>
            {staticCourses.map((course) => (
              <TouchableOpacity
                key={course.slug}
                style={s.courseListCard}
                // Static cards keep their slug — the detail screen treats a
                // non-numeric route param as a catalogue key.
                onPress={() =>
                  router.push({ pathname: '/courses/[id]', params: { id: course.slug } })
                }
              >
                <View style={s.courseListTopRow}>
                  <View style={[s.courseListIconBox, { backgroundColor: `${course.color}1A` }]}>
                    <Text style={s.courseListIcon}>{course.emoji}</Text>
                  </View>
                  <View style={s.courseFreeTag}>
                    <Text style={s.courseFreeTagText}>FREE</Text>
                  </View>
                </View>
                <Text style={s.courseListTitle}>{course.name}</Text>
                <Text style={s.courseListDesc}>{course.blurb}</Text>
                <View style={s.courseListMetaRow}>
                  <Text style={s.courseListMetaText}>★ {course.rating}</Text>
                  <Text style={s.courseListMetaText}>👤 {course.learners}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <MarketingFooter />
    </ScrollView>
  );
}
