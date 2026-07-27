import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { marketingStyles as s } from '@/src/styles/styles/marketing/shared';
import PageHeader from './PageHeader';
import { CATALOG } from '../json/catalog';
import MarketingFooter from './Footer';

export default function CoursesScreen() {
  const [query, setQuery] = useState('');
  const courses = Object.values(CATALOG).filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

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

        <View style={s.courseListGrid}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.slug}
              style={s.courseListCard}
              onPress={() => router.push(`/courses/${course.slug}`)}
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
                <Text style={s.courseListPriceFree}>FREE</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <MarketingFooter />
    </ScrollView>
  );
}