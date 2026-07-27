import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { homeData } from '../json/landingpage';
import { homeStyles } from '@/src/styles/styles/home/landingpage';
import Footer from './Footer';

export default function LandingPage() {
  const router = useRouter();
  const { header, hero, popularCourses, howItWorks, levelingCard, testimonial, ctaSection } = homeData;

  return (
    <View style={homeStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={homeStyles.header}>
          <View style={homeStyles.logoRow}>
            <View style={homeStyles.logoIcon}>
              <Text style={homeStyles.logoIconText}>⚡</Text>
            </View>
            <Text style={homeStyles.logoText}>{header.logoText}</Text>
          </View>
          <View style={homeStyles.headerRight}>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={homeStyles.loginText}>{header.loginText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={homeStyles.signupBtn} onPress={() => router.push('/auth/sign-up')}>
              <Text style={homeStyles.signupText}>{header.signupText}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={homeStyles.heroSection}>
          <View style={homeStyles.badge}>
            <Text style={homeStyles.badgeText}>✦ {hero.badge}</Text>
          </View>

          <Text style={homeStyles.heroTitle}>
            {hero.titleLine1}{'\n'}{hero.titleLine2}{'\n'}{hero.titleLine3}
          </Text>
          <Text style={homeStyles.heroDescription}>{hero.description}</Text>

          <TouchableOpacity style={homeStyles.primaryBtn} onPress={() => router.push('/auth/sign-up')}>
            <Text style={homeStyles.primaryBtnText}>{hero.primaryBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={homeStyles.outlineBtn} onPress={() => router.push('/how-it-works')}>
            <Text style={homeStyles.outlineBtnText}>{hero.secondaryBtn}</Text>
          </TouchableOpacity>

          {/* Stats row */}
          <View style={homeStyles.heroStatsRow}>
            {hero.stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <View style={homeStyles.heroStatItem}>
                  <Text style={homeStyles.heroStatValue}>{stat.value}</Text>
                  <Text style={homeStyles.heroStatLabel}>{stat.label}</Text>
                </View>
                {i < hero.stats.length - 1 && <View style={homeStyles.heroStatDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Readiness card */}
          <View style={homeStyles.readinessCard}>
            <View style={homeStyles.readinessPillsRow}>
              <View style={homeStyles.readinessPill}>
                <Text style={homeStyles.readinessPillText}>🔥 {hero.readinessCard.streakDays}-day streak</Text>
              </View>
              <View style={homeStyles.readinessPill}>
                <Text style={homeStyles.readinessPillText}>⚡ {hero.readinessCard.xp} XP</Text>
              </View>
              <View style={homeStyles.readinessPill}>
                <Text style={homeStyles.readinessPillText}>🎖️ Lvl {hero.readinessCard.level}</Text>
              </View>
            </View>

            <View style={homeStyles.readinessTopRow}>
              <View style={homeStyles.readinessRing}>
                <Text style={homeStyles.readinessRingText}>{hero.readinessCard.readinessPercent}%</Text>
              </View>
              <View>
                <Text style={homeStyles.readinessLabel}>EXAM READINESS</Text>
                <Text style={homeStyles.readinessStatus}>{hero.readinessCard.readinessStatus}</Text>
                <Text style={homeStyles.readinessSub}>
                  {hero.readinessCard.examName} · {hero.readinessCard.daysLeft} days left
                </Text>
              </View>
            </View>

            {hero.readinessCard.subjects.map((subj) => (
              <View style={homeStyles.subjectRow} key={subj.name}>
                <View style={homeStyles.subjectHeaderRow}>
                  <View style={homeStyles.subjectNameRow}>
                    <Text>{subj.icon}</Text>
                    <Text style={homeStyles.subjectName}>{subj.name}</Text>
                  </View>
                  <Text style={[homeStyles.subjectPercent, { color: subj.color }]}>{subj.percent}%</Text>
                </View>
                <View style={homeStyles.subjectTrack}>
                  <View style={[homeStyles.subjectFill, { width: `${subj.percent}%`, backgroundColor: subj.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Popular courses */}
        <View style={homeStyles.sectionWrap}>
          <View style={homeStyles.sectionHeaderRow}>
            <Text style={homeStyles.sectionTitleLeft}>{popularCourses.title}</Text>
            <TouchableOpacity onPress={() => router.push('/courses')}>
              <Text style={homeStyles.sectionViewAll}>{popularCourses.viewAll}</Text>
            </TouchableOpacity>
          </View>
          <View style={homeStyles.courseGrid}>
            {popularCourses.list.map((course) => (
              <TouchableOpacity
                style={homeStyles.courseCard}
                key={course.title}
                onPress={() => router.push({ pathname: '/courses/[slug]', params: { slug: course.slug } })}
              >
                <View style={homeStyles.courseCardTopRow}>
                  <View style={homeStyles.courseIconBox}>
                    <Text style={homeStyles.courseIcon}>{course.icon}</Text>
                  </View>
                  <View style={homeStyles.courseTag}>
                    <Text style={homeStyles.courseTagText}>{course.tag}</Text>
                  </View>
                </View>
                <Text style={homeStyles.courseTitle}>{course.title}</Text>
                <Text style={homeStyles.courseDesc}>{course.desc}</Text>
                <View style={homeStyles.courseMetaRow}>
                  <Text style={homeStyles.courseMetaText}>★ {course.rating}</Text>
                  <Text style={homeStyles.courseMetaText}>👤 {course.learners}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={homeStyles.sectionWrap}>
          <Text style={[homeStyles.sectionTitleLeft, { marginBottom: 18 }]}>{howItWorks.title}</Text>
          <View style={homeStyles.howGrid}>
            {howItWorks.steps.map((step) => (
              <View style={homeStyles.howCard} key={step.no}>
                <View style={homeStyles.howIconWrap}>
                  <Text style={homeStyles.howIcon}>{step.icon}</Text>
                  <View style={homeStyles.howBadge}>
                    <Text style={homeStyles.howBadgeText}>{step.no}</Text>
                  </View>
                </View>
                <Text style={homeStyles.howTitle}>{step.title}</Text>
                <Text style={homeStyles.howDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>

          {/* Leveling card */}
          <View style={homeStyles.levelingCard}>
            <Text style={homeStyles.levelingTitle}>{levelingCard.title}</Text>
            <Text style={homeStyles.levelingDesc}>{levelingCard.desc}</Text>
            <View style={homeStyles.levelingPillsRow}>
              {levelingCard.pills.map((pill) => (
                <View style={homeStyles.levelingPill} key={pill.label}>
                  <Text>{pill.icon}</Text>
                  <Text style={homeStyles.levelingPillText}>{pill.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Testimonial */}
          <View style={homeStyles.testimonialCard}>
            <Text style={homeStyles.testimonialStars}>{'★'.repeat(testimonial.stars)}</Text>
            <Text style={homeStyles.testimonialQuote}>"{testimonial.quote}"</Text>
            <View style={homeStyles.testimonialAuthorRow}>
              <View style={homeStyles.testimonialAvatar}>
                <Text style={homeStyles.testimonialAvatarText}>{testimonial.initials}</Text>
              </View>
              <View>
                <Text style={homeStyles.testimonialName}>{testimonial.name}</Text>
                <Text style={homeStyles.testimonialSub}>{testimonial.sub}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={homeStyles.ctaSection}>
          <Text style={homeStyles.ctaTitle}>{ctaSection.title}</Text>
          <Text style={homeStyles.ctaSubtitle}>{ctaSection.subtitle}</Text>
          <TouchableOpacity style={homeStyles.ctaButton} onPress={() => router.push('/auth/sign-up')}>
            <Text style={homeStyles.ctaButtonText}>{ctaSection.button}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Footer />

      </ScrollView>
    </View>
  );
}