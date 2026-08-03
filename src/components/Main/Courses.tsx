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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CmsFeaturedExam,
  filterExamsByCountry,
  getCmsFeaturedExamsWithDetails,
} from '@/src/libs/services/cms';
import { resolveDetectedCountry } from '@/src/libs/services/countries';

export default function CoursesScreen() {
  const [query, setQuery] = useState('');
  // Exams from the CMS, each enriched with its detail so the list can be scoped
  // to a country. Empty (API down / nothing published) → the static catalogue
  // is rendered instead.
  const [exams, setExams] = useState<CmsFeaturedExam[]>([]);
  // The country this catalogue is for: the region saved by the country picker,
  // else the detected one.
  const [country, setCountry] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedId, savedRegion] = await Promise.all([
          AsyncStorage.getItem('regionCountryId'),
          AsyncStorage.getItem('region'),
        ]);
        const saved = savedRegion ? JSON.parse(savedRegion) : null;
        const picked = savedId
          ? { id: savedId, name: saved?.name ?? '' }
          : await resolveDetectedCountry().catch(() => null);
        if (active && picked) setCountry(picked);

        const list = await getCmsFeaturedExamsWithDetails();
        if (active) setExams(list);
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
  const countryExams = filterExamsByCountry(exams, country?.id);
  const cmsCourses = countryExams.filter((e) =>
    (e?.name ?? '').toLowerCase().includes(needle),
  );
  const staticCourses = Object.values(CATALOG).filter((c) =>
    c.name.toLowerCase().includes(needle),
  );
  const useCms = countryExams.length > 0;
  // The CMS has exams, just none for this country — say so rather than falling
  // back to the static (India) catalogue.
  const noCoursesForCountry = exams.length > 0 && countryExams.length === 0;

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      <PageHeader />
      <View style={s.section}>
        <Text style={s.h1}>
          {country?.name ? `Courses in ${country.name}` : 'Courses'}
        </Text>
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
        ) : noCoursesForCountry ? (
          <Text style={s.h1Subtitle}>
            No courses for {country?.name} yet. They&apos;ll show up here once
            they&apos;re published.
          </Text>
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
