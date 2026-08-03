import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { homeData } from '../json/landingpage';
import { homeStyles } from '@/src/styles/styles/home/landingpage';
import Footer from './Footer';
import {
  CmsExamRef,
  CmsFeaturedExam,
  CmsHomePage,
  cmsListFrom,
  filterExamsByCountry,
  getCmsFeaturedExamService,
  getCmsFeaturedExamsService,
  getCmsHomePagesService,
  pickHomePageForCountry,
} from '@/src/libs/services/cms';
import { resolveDetectedCountry } from '@/src/libs/services/countries';
import BrandLogo from '../common/BrandLogo';
import CountrySelect from '../common/CountrySelect';

// Real counts read better grouped ("1,979") than in the static "2.1Cr" style.
const formatStat = (n: number): string => n.toLocaleString('en-IN');

export default function LandingPage() {
  const router = useRouter();
  const { header, hero, popularCourses, howItWorks, levelingCard, testimonial, ctaSection } = homeData;

  // CMS content. Everything here is optional — each section falls back to the
  // static copy in json/landingpage.ts when the API has nothing for us.
  // `pages` holds every country's home page; the one shown follows the country
  // picked in the header. null = still loading.
  const [pages, setPages] = useState<CmsHomePage[] | null>(null);
  const [featuredExam, setFeaturedExam] = useState<CmsFeaturedExam | null>(null);
  // Popular courses. The list endpoint only returns id/name/code, so each row
  // is enriched with its detail (subjects + question counts) for the card.
  const [cmsExams, setCmsExams] = useState<CmsFeaturedExam[]>([]);
  // The country the page is scoped to: detected on first load, then whatever
  // the header picker reports.
  const [country, setCountry] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [detectedCountryId, setDetectedCountryId] = useState<
    number | string | null
  >(null);

  useEffect(() => {
    let active = true;
    (async () => {
      // The home page is country-scoped, so detect the country first; the exam
      // list doesn't depend on it, so both requests go out together.
      const [countryRes, pagesRes, examsRes] = await Promise.allSettled([
        resolveDetectedCountry(),
        getCmsHomePagesService(),
        getCmsFeaturedExamsService(),
      ]);
      if (!active) return;

      if (examsRes.status === 'fulfilled') {
        const refs = cmsListFrom<CmsExamRef>(examsRes.value?.data);
        setCmsExams(refs);
        // Then fill in each card's subjects/question count. Cards render from
        // the bare list meanwhile, so a slow (or failed) detail call just
        // leaves those lines off rather than holding up the section.
        const details = await Promise.allSettled(
          refs.map((e) => getCmsFeaturedExamService(e.id)),
        );
        if (active) {
          setCmsExams(
            refs.map((ref, i) => {
              const r = details[i];
              return r.status === 'fulfilled' && r.value?.data ? r.value.data : ref;
            }),
          );
        }
      }

      // Seeds the picker when the visitor has no saved region yet.
      if (countryRes.status === 'fulfilled' && countryRes.value?.id != null) {
        setDetectedCountryId(countryRes.value.id);
      }

      setPages(
        pagesRes.status === 'fulfilled'
          ? cmsListFrom<CmsHomePage>(pagesRes.value?.data)
          : [],
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  // The home page for the selected country. Once a country is known the match
  // is strict — a country the CMS has nothing for shows the empty state rather
  // than another country's content. With no country at all (detection failed
  // and the picker hasn't resolved) fall back to the first page.
  const homePage = useMemo<CmsHomePage | null>(() => {
    if (!pages) return null;
    if (country == null) return pickHomePageForCountry(pages, null);
    return (
      pages.find((p) => String(p?.country?.id) === String(country.id)) ?? null
    );
  }, [pages, country]);

  // Nothing published for the country the visitor picked.
  const noContent = pages != null && country != null && homePage == null;

  // Featured exam follows the selected country's home page.
  useEffect(() => {
    const examId = homePage?.featured_exam?.id;
    if (examId == null) {
      setFeaturedExam(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const detail = await getCmsFeaturedExamService(examId);
        if (active && detail?.data) setFeaturedExam(detail.data);
      } catch {
        // Non-fatal — the hero still renders without the exam block.
      }
    })();
    return () => {
      active = false;
    };
  }, [homePage?.featured_exam?.id]);

  // Hero copy: CMS when present, otherwise the static three-line headline.
  const heroTitle = homePage?.title?.trim() || null;
  const heroDescription = homePage?.description?.trim() || hero.description;
  const examSubjects = (featuredExam?.subjects ?? []).filter(
    (s) => s?.display_subject !== false,
  );
  // Hero stats: the CMS's real platform totals where it sends them, falling
  // back to the static headline figures for anything it doesn't (the rating).
  const heroStats = hero.stats.map((stat) => {
    if (stat.label === 'learners' && homePage?.users_count != null) {
      return { ...stat, value: formatStat(homePage.users_count) };
    }
    if (stat.label === 'questions solved' && homePage?.questions_count != null) {
      return { value: formatStat(homePage.questions_count), label: 'questions' };
    }
    return stat;
  });
  // Popular courses are country-scoped too. The list endpoint isn't, so filter
  // on the country each enriched detail carries. Rows whose detail hasn't landed
  // (or failed) have no country yet and stay visible rather than blinking out.
  const countryExams = useMemo(
    () => filterExamsByCountry(cmsExams, country?.id),
    [cmsExams, country],
  );
  // CMS exams when this country has any, else the static cards. When the CMS
  // has exams but none here, say so instead of falling back to another
  // country's static list.
  const useCmsCourses = countryExams.length > 0;
  const noCoursesForCountry = cmsExams.length > 0 && countryExams.length === 0;

  return (
    <View style={homeStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={homeStyles.header}>
          <BrandLogo />
          <View style={homeStyles.headerRight}>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={homeStyles.loginText}>{header.loginText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={homeStyles.signupBtn} onPress={() => router.push('/auth/sign-up')}>
              <Text style={homeStyles.signupText}>{header.signupText}</Text>
            </TouchableOpacity>
            {/* Picks which country's content this page shows. */}
            <CountrySelect
              style={homeStyles.headerCountryChip}
              preferredCountryId={detectedCountryId}
              onChange={(c) => setCountry({ id: c.id, name: c.name })}
            />
          </View>
        </View>

        {/* Hero */}
        <View style={homeStyles.heroSection}>
          {noContent ? (
            // The CMS has nothing published for the picked country. The sign-up
            // CTAs below still stand — it's the country's content that's missing.
            <View style={homeStyles.noContentCard}>
              <Text style={homeStyles.noContentTitle}>
                No content for {country?.name} yet
              </Text>
              <Text style={homeStyles.noContentText}>
                We haven&apos;t published exam content for this region. Pick
                another country from the header to see what&apos;s available.
              </Text>
            </View>
          ) : (
            <>
              <View style={homeStyles.badge}>
                <Text style={homeStyles.badgeText}>✦ {hero.badge}</Text>
              </View>

              <Text style={homeStyles.heroTitle}>
                {heroTitle ?? (
                  <>
                    {hero.titleLine1}{'\n'}{hero.titleLine2}{'\n'}{hero.titleLine3}
                  </>
                )}
              </Text>
              <Text style={homeStyles.heroDescription}>{heroDescription}</Text>
            </>
          )}

          <TouchableOpacity style={homeStyles.primaryBtn} onPress={() => router.push('/auth/sign-up')}>
            <Text style={homeStyles.primaryBtnText}>{hero.primaryBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={homeStyles.outlineBtn} onPress={() => router.push('/how-it-works')}>
            <Text style={homeStyles.outlineBtnText}>{hero.secondaryBtn}</Text>
          </TouchableOpacity>

          {!noContent && (
          <>
          {/* Stats row */}
          <View style={homeStyles.heroStatsRow}>
            {heroStats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <View style={homeStyles.heroStatItem}>
                  <Text style={homeStyles.heroStatValue}>{stat.value}</Text>
                  <Text style={homeStyles.heroStatLabel}>{stat.label}</Text>
                </View>
                {i < heroStats.length - 1 && <View style={homeStyles.heroStatDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* The CMS featured exam takes this slot; the static readiness card
              is the fallback when the CMS has no exam for this country. */}
          {featuredExam ? (
            <TouchableOpacity
              style={homeStyles.readinessCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/courses/[id]',
                  params: { id: String(featuredExam.id) },
                })
              }
            >
              <Text style={homeStyles.readinessLabel}>FEATURED EXAM</Text>
              <Text style={homeStyles.featuredName}>{featuredExam.name}</Text>
              {!!featuredExam.description?.trim() && (
                <Text style={homeStyles.featuredDesc}>{featuredExam.description}</Text>
              )}

              <View style={homeStyles.featuredMetaRow}>
                {featuredExam.total_duration_minutes != null && (
                  <View style={homeStyles.featuredMetaChip}>
                    <Text style={homeStyles.featuredMetaText}>
                      ⏱ {featuredExam.total_duration_minutes} min
                    </Text>
                  </View>
                )}
                {featuredExam.total_marks != null && (
                  <View style={homeStyles.featuredMetaChip}>
                    <Text style={homeStyles.featuredMetaText}>
                      🎯 {featuredExam.total_marks} marks
                    </Text>
                  </View>
                )}
                {examSubjects.length > 0 && (
                  <View style={homeStyles.featuredMetaChip}>
                    <Text style={homeStyles.featuredMetaText}>
                      📚 {examSubjects.length} subjects
                    </Text>
                  </View>
                )}
              </View>

              {examSubjects.map((subject) => (
                <View key={subject.id} style={homeStyles.featuredSubjectRow}>
                  <Text style={homeStyles.featuredSubjectName}>{subject.name}</Text>
                  <Text style={homeStyles.featuredSubjectMeta}>
                    {subject.topics?.length ?? 0} topics
                    {subject.questions_count != null
                      ? ` · ${subject.questions_count} Qs`
                      : ''}
                  </Text>
                </View>
              ))}
            </TouchableOpacity>
          ) : (
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
          )}
          </>
          )}
        </View>

        {/* Popular courses */}
        <View style={homeStyles.sectionWrap}>
          <View style={homeStyles.sectionHeaderRow}>
            <Text style={homeStyles.sectionTitleLeft}>{popularCourses.title}</Text>
            {!noCoursesForCountry && (
              <TouchableOpacity onPress={() => router.push('/courses')}>
                <Text style={homeStyles.sectionViewAll}>{popularCourses.viewAll}</Text>
              </TouchableOpacity>
            )}
          </View>
          {noCoursesForCountry ? (
            <View style={homeStyles.noContentCard}>
              <Text style={homeStyles.noContentTitle}>
                No courses for {country?.name} yet
              </Text>
              <Text style={homeStyles.noContentText}>
                Courses for this region will show up here once they&apos;re
                published.
              </Text>
            </View>
          ) : useCmsCourses ? (
            // One card per row: icon + Featured pill, name, subject names, then
            // a footer with the subject/question counts and the price.
            <View>
              {countryExams.map((exam) => {
                const subjects = (exam.subjects ?? []).filter(
                  (subject) => subject?.display_subject !== false,
                );
                const questionCount = subjects.reduce(
                  (total, subject) => total + (subject.questions_count ?? 0),
                  0,
                );
                return (
                  <TouchableOpacity
                    style={homeStyles.examCard}
                    key={String(exam.id)}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/courses/[id]',
                        params: { id: String(exam.id) },
                      })
                    }
                  >
                    <View style={homeStyles.examCardTopRow}>
                      <View style={homeStyles.courseIconBox}>
                        <Text style={homeStyles.courseIcon}>🎯</Text>
                      </View>
                      <View style={homeStyles.examFeaturedPill}>
                        <Text style={homeStyles.examFeaturedText}>✨ Featured</Text>
                      </View>
                    </View>

                    <Text style={homeStyles.examCardTitle}>{exam.name}</Text>
                    {subjects.length > 0 && (
                      <Text style={homeStyles.examCardSubjects} numberOfLines={2}>
                        {subjects.map((subject) => subject.name).join(' · ')}
                      </Text>
                    )}

                    <View style={homeStyles.examCardDivider} />

                    <View style={homeStyles.examCardFooter}>
                      {subjects.length > 0 && (
                        <Text style={homeStyles.examCardMeta}>
                          📖 {subjects.length}{' '}
                          {subjects.length === 1 ? 'subject' : 'subjects'}
                        </Text>
                      )}
                      {questionCount > 0 && (
                        <Text style={homeStyles.examCardMeta}>
                          ✓ {questionCount} questions
                        </Text>
                      )}
                      <Text style={homeStyles.examCardFree}>FREE</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
          <View style={homeStyles.courseGrid}>
            {popularCourses.list.map((course) => (
              <TouchableOpacity
                style={homeStyles.courseCard}
                key={course.title}
                // Static cards keep their slug — the detail screen treats a
                // non-numeric route param as a catalogue key.
                onPress={() => router.push({ pathname: '/courses/[id]', params: { id: course.slug } })}
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
          )}
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
          {/* <Text style={homeStyles.ctaSubtitle}>{ctaSection.subtitle}</Text> */}
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