import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    PanResponder,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    addTargetExamService,
    getExamSubjectsService,
    getExamsListService,
    getMeService,
    getSubjectChaptersService,
} from '@/src/libs/services/profile';
import { onboardingStyles as s } from '@/src/styles/onboardingStyles';
import { COLORS } from '@/src/styles/styles';
import { OnboardingJson } from '../json/onboarding';

type ExamOption = { id: number; name: string };
type SubjectRow = { id: number; name: string; code: string };
type ChapterRow = { id: number; name: string };

const RATING_COLORS: Record<number, { bg: string; fg: string }> = {
    1: { bg: COLORS.redLight, fg: COLORS.red },
    2: { bg: COLORS.orangeLight, fg: COLORS.orange },
    3: { bg: COLORS.yellowLight, fg: '#A16207' },
    4: { bg: COLORS.primaryLight, fg: COLORS.primary },
    5: { bg: COLORS.greenLight, fg: COLORS.green },
};

const OnboardingFlow = () => {
    const data = OnboardingJson();
    const [step, setStep] = useState(1);

    // user
    const [userName, setUserName] = useState('');

    // Step 1: Goal
    const [exams, setExams] = useState<ExamOption[]>([]);
    const [selectedExam, setSelectedExam] = useState<ExamOption | null>(null);
    const [examDropdownOpen, setExamDropdownOpen] = useState(false);
    const [loadingExams, setLoadingExams] = useState(true);
    const [targetYear, setTargetYear] = useState<number | null>(null);
    const [submittingGoal, setSubmittingGoal] = useState(false);

    // Step 2: Self-Assessment
    const [subjects, setSubjects] = useState<SubjectRow[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
    const [chaptersBySubject, setChaptersBySubject] = useState<
        Record<number, ChapterRow[]>
    >({});
    const [chaptersLoading, setChaptersLoading] = useState<Record<number, boolean>>(
        {}
    );
    const [weakChapters, setWeakChapters] = useState<Record<number, number[]>>({});
    const [dailyHours, setDailyHours] = useState(4);

    // Load exam list and user name on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await getExamsListService();
                const raw: any = res?.data;
                const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
                setExams(list.map((it: any) => ({ id: it.id, name: it.name })));
            } catch (err) {
                console.log('Failed to load exams', err);
            } finally {
                setLoadingExams(false);
            }
        })();
        (async () => {
            try {
                const res: any = await getMeService();
                const name: string = res?.data?.name || '';
                if (name) setUserName(name.split(' ')[0]);
            } catch { }
        })();
    }, []);

    const loadSubjects = async (examId: number) => {
        setLoadingSubjects(true);
        try {
            const res = await getExamSubjectsService(examId);
            const raw: any = res?.data;
            const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
            const mapped: SubjectRow[] = list
                .map((it: any) => ({
                    id: it.subject?.id ?? it.id,
                    name: it.subject?.name ?? it.name ?? '',
                    code: it.subject?.code ?? it.code ?? '',
                }))
                .filter((sub) => sub.id);
            setSubjects(mapped);
        } catch (err) {
            console.log('Failed to load subjects', err);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const toggleSubjectChapters = async (subjectId: number) => {
        if (expandedSubject === subjectId) {
            setExpandedSubject(null);
            return;
        }
        setExpandedSubject(subjectId);
        if (chaptersBySubject[subjectId]) return;
        setChaptersLoading((m) => ({ ...m, [subjectId]: true }));
        try {
            const res = await getSubjectChaptersService(subjectId);
            const raw: any = res?.data;
            const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
            const mapped: ChapterRow[] = list.map((c: any) => ({
                id: c.id,
                name: c.name,
            }));
            setChaptersBySubject((prev) => ({ ...prev, [subjectId]: mapped }));
        } catch (err) {
            console.log('Failed to load chapters', err);
        } finally {
            setChaptersLoading((m) => ({ ...m, [subjectId]: false }));
        }
    };

    const toggleWeakChapter = (subjectId: number, chapterId: number) => {
        setWeakChapters((prev) => {
            const current = prev[subjectId] || [];
            const next = current.includes(chapterId)
                ? current.filter((id) => id !== chapterId)
                : [...current, chapterId];
            return { ...prev, [subjectId]: next };
        });
    };

    // Goal submit
    const handleGoalNext = async () => {
        if (!selectedExam || !targetYear) {
            Alert.alert('Required', 'Please select an exam and target year.');
            return;
        }
        setSubmittingGoal(true);
        try {
            const res = await addTargetExamService({
                exam: selectedExam.id,
                target_year: targetYear,
            });
            if (res.status === 200 || res.status === 201) {
                await loadSubjects(selectedExam.id);
                setStep(2);
                return;
            }
            Alert.alert('Error', 'Could not save your goal. Please try again.');
        } catch (error: any) {
            const apiErrors = error?.errors || {};
            const body = error?.body || {};
            const message =
                apiErrors.nonFieldErrors?.[0] ||
                apiErrors.exam?.[0] ||
                apiErrors.target_year?.[0] ||
                Object.values(apiErrors).flat()[0] ||
                (typeof body.detail === 'string' ? body.detail : null) ||
                'Failed to save target exam';

            if (
                String(message).toLowerCase().includes('already') ||
                error?.status === 409
            ) {
                await loadSubjects(selectedExam.id);
                setStep(2);
                return;
            }
            Alert.alert('Error', String(message));
        } finally {
            setSubmittingGoal(false);
        }
    };

    const allSubjectsRated =
        subjects.length > 0 && subjects.every((sub) => ratings[sub.id] > 0);

    const goToDashboard = () => {
        router.replace('/dashboard');
    };

    // Priority focus = subject with lowest rating
    const priorityFocusSubject = (() => {
        if (!subjects.length) return null;
        let lowest: SubjectRow | null = null;
        let lowestRating = Infinity;
        for (const sub of subjects) {
            const r = ratings[sub.id];
            if (r && r < lowestRating) {
                lowestRating = r;
                lowest = sub;
            }
        }
        return lowest;
    })();

    // ============= Complete step (full purple) =============
    if (step === 4) {
        return (
            <SafeAreaView style={s.completeContainer}>
                <ScrollView contentContainerStyle={s.completeContent}>
                    <View style={s.successCircleOuter}>
                        <View style={s.successCircle}>
                            <Ionicons name="checkmark" size={42} color={COLORS.white} />
                        </View>
                    </View>
                    <Text style={s.completeTitle}>
                        {data.complete.titleFor(userName)}
                    </Text>
                    <Text style={s.completeSubtitle}>{data.complete.subtitle}</Text>

                    <View style={s.summaryCard}>
                        <Text style={s.summaryHeading}>{data.complete.heading}</Text>

                        <View style={s.summaryRow}>
                            <View style={s.summaryIcon}>
                                <Ionicons name="locate-outline" size={18} color="#A89FD6" />
                            </View>
                            <View>
                                <Text style={s.summaryLabel}>{data.complete.targetLabel}</Text>
                                <Text style={s.summaryValue}>
                                    {selectedExam?.name || '—'} {targetYear || ''}
                                </Text>
                            </View>
                        </View>

                        <View style={s.summaryRow}>
                            <View style={s.summaryIcon}>
                                <Ionicons name="flash-outline" size={18} color="#A89FD6" />
                            </View>
                            <View>
                                <Text style={s.summaryLabel}>
                                    {data.complete.priorityLabel}
                                </Text>
                                <Text style={s.summaryValue}>
                                    {priorityFocusSubject?.name || data.complete.noPriority}
                                </Text>
                            </View>
                        </View>

                        <View style={[s.summaryRow, s.summaryRowLast]}>
                            <View style={s.summaryIcon}>
                                <Ionicons name="book-outline" size={18} color="#A89FD6" />
                            </View>
                            <View>
                                <Text style={s.summaryLabel}>{data.complete.dailyLabel}</Text>
                                <Text style={s.summaryValue}>
                                    {data.complete.dailyValue(dailyHours)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={s.goDashboardBtn}
                        onPress={goToDashboard}
                        activeOpacity={0.85}
                    >
                        <Text style={s.goDashboardText}>
                            {data.complete.dashboardBtn} →
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={s.exploreBtn}
                        onPress={goToDashboard}
                        activeOpacity={0.85}
                    >
                        <Text style={s.exploreBtnText}>{data.complete.exploreBtn}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Header + stepper for steps 1-3
    const renderHeader = () => (
        <>
            <View style={s.header}>
                <View style={s.logoRow}>
                    <View style={s.logoBadge}>
                        <Text style={s.logoBadgeText}>{data.logo.shortName}</Text>
                    </View>
                    <Text style={s.logoText}>{data.logo.name}</Text>
                </View>
                <Text style={s.stepIndicator}>{`Step ${step} of 3`}</Text>
            </View>

            <View style={s.stepsRow}>
                {data.steps.map((stp, idx) => {
                    const done = stp.id < step;
                    const active = stp.id === step;
                    return (
                        <React.Fragment key={stp.id}>
                            <View style={s.stepItem}>
                                <View
                                    style={[
                                        s.stepCircle,
                                        (active || done) && s.stepCircleActive,
                                    ]}
                                >
                                    {done ? (
                                        <Ionicons name="checkmark" size={18} color={COLORS.white} />
                                    ) : (
                                        <Text
                                            style={[
                                                s.stepCircleText,
                                                active && s.stepCircleTextActive,
                                            ]}
                                        >
                                            {stp.id}
                                        </Text>
                                    )}
                                </View>
                                <Text
                                    style={[s.stepLabel, active && s.stepLabelActive]}
                                >
                                    {stp.label}
                                </Text>
                            </View>
                            {idx < data.steps.length - 1 && (
                                <View
                                    style={[
                                        s.stepConnector,
                                        stp.id < step && s.stepConnectorActive,
                                    ]}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
        </>
    );

    // ============= Step 1: Goal =============
    if (step === 1) {
        const canSubmit =
            Boolean(selectedExam && targetYear) && !submittingGoal;

        return (
            <SafeAreaView style={s.safeArea} edges={['top']}>
                <ScrollView
                    contentContainerStyle={s.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {renderHeader()}
                    <View style={s.body}>
                        <Text style={s.title}>{data.goal.title}</Text>
                        <Text style={s.subtitle}>{data.goal.subtitle}</Text>

                        <View style={s.inputGroup}>
                            <Text style={s.label}>{data.goal.labels.exam}</Text>
                            <TouchableOpacity
                                style={s.dropdown}
                                onPress={() => setExamDropdownOpen((v) => !v)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="search-outline"
                                    size={16}
                                    color={COLORS.textLight}
                                    style={{ marginRight: 10 }}
                                />
                                <Text
                                    style={[
                                        s.dropdownText,
                                        !selectedExam && s.dropdownPlaceholder,
                                    ]}
                                >
                                    {selectedExam?.name || data.goal.placeholders.exam}
                                </Text>
                                <Ionicons
                                    name={examDropdownOpen ? 'chevron-up' : 'chevron-down'}
                                    size={16}
                                    color={COLORS.textLight}
                                />
                            </TouchableOpacity>

                            {examDropdownOpen && (
                                <View style={s.optionsList}>
                                    {loadingExams ? (
                                        <View style={s.optionEmpty}>
                                            <ActivityIndicator color={COLORS.primary} />
                                        </View>
                                    ) : exams.length === 0 ? (
                                        <View style={s.optionEmpty}>
                                            <Text style={s.optionEmptyText}>No exams available</Text>
                                        </View>
                                    ) : (
                                        <ScrollView nestedScrollEnabled>
                                            {exams.map((opt) => (
                                                <TouchableOpacity
                                                    key={opt.id}
                                                    style={s.optionRow}
                                                    onPress={() => {
                                                        setSelectedExam(opt);
                                                        setExamDropdownOpen(false);
                                                    }}
                                                >
                                                    <Text style={s.optionText}>{opt.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>

                        <View style={s.inputGroup}>
                            <Text style={s.label}>{data.goal.labels.year}</Text>
                            <View style={s.yearRow}>
                                {data.goal.years.map((year) => {
                                    const selected = targetYear === year;
                                    return (
                                        <TouchableOpacity
                                            key={year}
                                            style={[s.yearPill, selected && s.yearPillSelected]}
                                            onPress={() => setTargetYear(year)}
                                            activeOpacity={0.85}
                                        >
                                            <Text
                                                style={[
                                                    s.yearPillText,
                                                    selected && s.yearPillTextSelected,
                                                ]}
                                            >
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[s.primaryBtn, !canSubmit && s.primaryBtnDisabled]}
                            onPress={handleGoalNext}
                            disabled={!canSubmit}
                            activeOpacity={0.85}
                        >
                            {submittingGoal ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <Text style={s.primaryBtnText}>{data.goal.nextBtn}</Text>
                                    <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ============= Step 2: Self-Assessment =============
    if (step === 2) {
        return (
            <SafeAreaView style={s.safeArea} edges={['top']}>
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {renderHeader()}
                    <View style={s.body}>
                        <Text style={s.title}>{data.assessment.title}</Text>
                        <Text style={s.subtitle}>{data.assessment.subtitle}</Text>

                        <Text style={s.sectionLabel}>
                            {data.assessment.ratePerSubject}
                        </Text>

                        {loadingSubjects ? (
                            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : subjects.length === 0 ? (
                            <Text style={s.chaptersEmpty}>No subjects available</Text>
                        ) : (
                            subjects.map((sub) => {
                                const rating = ratings[sub.id] || 0;
                                const palette = rating
                                    ? RATING_COLORS[rating]
                                    : { bg: COLORS.grayBg, fg: COLORS.textLight };
                                const expanded = expandedSubject === sub.id;
                                const chapters = chaptersBySubject[sub.id] || [];
                                const loadingCh = chaptersLoading[sub.id];
                                return (
                                    <View key={sub.id} style={s.subjectCard}>
                                        <View style={s.subjectHeader}>
                                            <View style={s.subjectAvatar}>
                                                <Text style={s.subjectAvatarText}>
                                                    {sub.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={s.subjectName}>{sub.name}</Text>
                                            {rating > 0 && (
                                                <View
                                                    style={[s.ratingBadge, { backgroundColor: palette.bg }]}
                                                >
                                                    <Text
                                                        style={[
                                                            s.ratingBadgeText,
                                                            { color: palette.fg },
                                                        ]}
                                                    >
                                                        {data.assessment.ratingLabels[rating]}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={s.starRow}>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <TouchableOpacity
                                                        key={n}
                                                        style={s.starBtn}
                                                        onPress={() =>
                                                            setRatings((p) => ({ ...p, [sub.id]: n }))
                                                        }
                                                    >
                                                        <Ionicons
                                                            name={n <= rating ? 'star' : 'star-outline'}
                                                            size={18}
                                                            color={n <= rating ? COLORS.yellow : COLORS.border}
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {rating === 0 && (
                                            <Text style={s.ratingHelp}>
                                                {data.assessment.ratingHelp(sub.name)}
                                            </Text>
                                        )}

                                        <TouchableOpacity
                                            style={s.weakChaptersToggle}
                                            onPress={() => toggleSubjectChapters(sub.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={s.weakChaptersToggleText}>
                                                {data.assessment.markWeakChapters}
                                            </Text>
                                            <Ionicons
                                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color={COLORS.textLight}
                                            />
                                        </TouchableOpacity>

                                        {expanded && (
                                            <>
                                                {loadingCh ? (
                                                    <ActivityIndicator
                                                        color={COLORS.primary}
                                                        style={{ marginVertical: 14 }}
                                                    />
                                                ) : chapters.length === 0 ? (
                                                    <Text style={s.chaptersEmpty}>
                                                        {data.assessment.noChapters}
                                                    </Text>
                                                ) : (
                                                    <View style={s.chaptersGrid}>
                                                        {chapters.map((ch) => {
                                                            const checked = (
                                                                weakChapters[sub.id] || []
                                                            ).includes(ch.id);
                                                            return (
                                                                <TouchableOpacity
                                                                    key={ch.id}
                                                                    style={s.chapterCell}
                                                                    onPress={() =>
                                                                        toggleWeakChapter(sub.id, ch.id)
                                                                    }
                                                                    activeOpacity={0.7}
                                                                >
                                                                    <View
                                                                        style={[
                                                                            s.chapterCheckbox,
                                                                            checked && s.chapterCheckboxChecked,
                                                                        ]}
                                                                    >
                                                                        {checked && (
                                                                            <Ionicons
                                                                                name="checkmark"
                                                                                size={12}
                                                                                color={COLORS.white}
                                                                            />
                                                                        )}
                                                                    </View>
                                                                    <Text
                                                                        style={s.chapterLabel}
                                                                        numberOfLines={2}
                                                                    >
                                                                        {ch.name}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                )}
                                            </>
                                        )}
                                    </View>
                                );
                            })
                        )}

                        <View style={s.sliderBlock}>
                            <View style={s.sliderHeader}>
                                <Text style={s.sliderLabel}>
                                    {data.assessment.dailyHoursLabel}
                                </Text>
                                <Text style={s.sliderValue}>
                                    {data.assessment.dailyHoursValue(dailyHours)}
                                </Text>
                            </View>
                            <HoursSlider value={dailyHours} onChange={setDailyHours} />
                            <View style={s.sliderTicksRow}>
                                {data.assessment.ticks.map((t) => (
                                    <Text key={t} style={s.sliderTick}>
                                        {t}
                                    </Text>
                                ))}
                            </View>
                        </View>

                        <View style={s.actionsRow}>
                            <TouchableOpacity
                                style={s.backBtn}
                                onPress={() => setStep(1)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={16}
                                    color={COLORS.textDark}
                                />
                                <Text style={s.backBtnText}>{data.assessment.backBtn}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.primaryBtn, !allSubjectsRated && s.primaryBtnDisabled]}
                                onPress={() => setStep(3)}
                                disabled={!allSubjectsRated}
                                activeOpacity={0.85}
                            >
                                <Text style={s.primaryBtnText}>{data.assessment.nextBtn}</Text>
                                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>

                        {!allSubjectsRated && subjects.length > 0 && (
                            <Text style={s.hintBelowBtn}>
                                {data.assessment.ratingRequired}
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ============= Step 3: Diagnostic =============
    return (
        <SafeAreaView style={s.safeArea} edges={['top']}>
            <ScrollView
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
            >
                {renderHeader()}
                <View style={s.body}>
                    <Text style={s.title}>{data.diagnostic.title}</Text>
                    <Text style={s.subtitle}>{data.diagnostic.subtitle}</Text>

                    <View style={s.diagnosticCard}>
                        <View style={s.diagnosticHeader}>
                            <View style={s.diagnosticIconWrap}>
                                <Ionicons name="bar-chart" size={20} color={COLORS.white} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.diagnosticTitle}>
                                    {data.diagnostic.cardTitle(selectedExam?.name || 'Exam')}
                                </Text>
                                <Text style={s.diagnosticDesc}>{data.diagnostic.cardDesc}</Text>
                            </View>
                        </View>

                        <View style={s.diagnosticHighlight}>
                            <View style={s.diagnosticHighlightIcon}>
                                <Ionicons name="layers-outline" size={16} color={COLORS.white} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.diagnosticHighlightTitle}>
                                    {data.diagnostic.highlightTitle(subjects.length)}
                                </Text>
                                <Text style={s.diagnosticHighlightDesc}>
                                    {data.diagnostic.highlightDesc(subjects.map((x) => x.name))}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={s.whatYouGetTitle}>{data.diagnostic.whatYouGet}</Text>
                    {data.diagnostic.bullets.map((b) => (
                        <View key={b} style={s.bulletRow}>
                            <View style={s.bulletDot}>
                                <Ionicons name="chevron-forward" size={10} color={COLORS.primary} />
                            </View>
                            <Text style={s.bulletText}>{b}</Text>
                        </View>
                    ))}

                    <View style={s.infoBox}>
                        <Ionicons
                            name="sparkles-outline"
                            size={16}
                            color={COLORS.primary}
                            style={s.infoBoxIcon}
                        />
                        <Text style={s.infoBoxText}>{data.diagnostic.info}</Text>
                    </View>

                    <View style={s.warningBox}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={16}
                            color="#92400E"
                            style={s.infoBoxIcon}
                        />
                        <Text style={s.warningBoxText}>{data.diagnostic.warning}</Text>
                    </View>

                    <View style={s.actionsRow}>
                        <TouchableOpacity
                            style={s.backBtn}
                            onPress={() => setStep(2)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={16} color={COLORS.textDark} />
                            <Text style={s.backBtnText}>{data.diagnostic.backBtn}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.primaryBtn}
                            onPress={() => setStep(4)}
                            activeOpacity={0.85}
                        >
                            <Text style={s.primaryBtnText}>{data.diagnostic.nextBtn}</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Custom horizontal slider (1h..12h)
const HoursSlider: React.FC<{
    value: number;
    onChange: (n: number) => void;
}> = ({ value, onChange }) => {
    const trackWidthRef = useRef(0);
    const updateFromX = (x: number) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const clamped = Math.max(0, Math.min(1, x / w));
        const hours = Math.round(1 + clamped * 11);
        if (hours !== value) onChange(hours);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => updateFromX(evt.nativeEvent.locationX),
            onPanResponderMove: (evt) => updateFromX(evt.nativeEvent.locationX),
        })
    ).current;

    const fraction = (value - 1) / 11;

    return (
        <View
            style={s.sliderTrack}
            onLayout={(e) => {
                trackWidthRef.current = e.nativeEvent.layout.width;
            }}
            {...panResponder.panHandlers}
        >
            <View style={[s.sliderFill, { width: `${fraction * 100}%` }]} />
            <View style={[s.sliderThumb, { left: `${fraction * 100}%` }]} />
        </View>
    );
};

export default OnboardingFlow;