import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import {
  Difficulty,
  Question,
  getQuestionsForPractice,
} from '../json/practice';


const { width } = Dimensions.get('window');

// ─── Colors ───────────────────────────────────────────────────────────────────
import { COLORS } from '@/src/styles/styles';
import PracticeSettingsModal from './PracticeSettingsModal';
import PracticeQuestions from './PracticeQuestions';
import PracticeResults from './PracticeResults';


// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'settings' | 'questions' | 'results';

export interface AnswerState {
  selected: string | null;
  markedForReview: boolean;
  answered: boolean;
  correct: boolean | null;
}

// ─── Slider ───────────────────────────────────────────────────────────────────
export const QuestionSlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const MIN = 5;
  const MAX = 50;
  const steps = MAX - MIN;
  const pct = (value - MIN) / steps;
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(width - 64);

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    const raw = MIN + Math.round(ratio * steps);
    onChange(raw);
  };

  const thumbLeft = pct * trackWidth;

  return (
    <View style={{ paddingHorizontal: 0, marginTop: 12 }}>
      <View
        ref={trackRef}
        style={slStyles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handlePress}
        onResponderMove={handlePress}
      >
        {/* filled */}
        <View style={[slStyles.fill, { width: `${pct * 100}%` }]} />
        {/* thumb */}
        <View style={[slStyles.thumb, { left: thumbLeft - 10 }]} />
      </View>
      <View style={slStyles.labels}>
        <Text style={slStyles.label}>5</Text>
        <Text style={slStyles.label}>50</Text>
      </View>
    </View>
  );
};

const slStyles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  thumb: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: { fontSize: 11, color: COLORS.textLight },
});

// ─── Settings Modal ───────────────────────────────────────────────────────────
// const PracticeSettingsModal = ({
//   chapterName,
//   accuracy,
//   onBegin,
//   onCancel,
// }: {
//   chapterName: string;
//   accuracy: number | null;
//   onBegin: (questions: number, difficulty: Difficulty, timer: boolean) => void;
//   onCancel: () => void;
// }) => {
//   const [questionCount, setQuestionCount] = useState(20);
//   const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
//   const [timerEnabled, setTimerEnabled] = useState(false);

//   const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

//   return (
//     <View style={settingsStyles.overlay}>
//       <View style={settingsStyles.card}>
//         {/* Title */}
//         <Text style={settingsStyles.title}>Practice: {chapterName}</Text>
//         {accuracy !== null && (
//           <Text style={settingsStyles.accuracy}>{accuracy}% accuracy</Text>
//         )}

//         <View style={settingsStyles.divider} />

//         {/* Question count */}
//         <View style={settingsStyles.row}>
//           <Text style={settingsStyles.label}>Questions</Text>
//           <Text style={settingsStyles.valueText}>{questionCount}</Text>
//         </View>
//         <QuestionSlider value={questionCount} onChange={setQuestionCount} />

//         <View style={settingsStyles.divider} />

//         {/* Difficulty */}
//         <Text style={settingsStyles.label}>Difficulty</Text>
//         <View style={settingsStyles.diffRow}>
//           {difficulties.map((d) => (
//             <TouchableOpacity
//               key={d}
//               style={[
//                 settingsStyles.diffBtn,
//                 difficulty === d && settingsStyles.diffBtnActive,
//               ]}
//               onPress={() => setDifficulty(d)}
//             >
//               <Text
//                 style={[
//                   settingsStyles.diffText,
//                   difficulty === d && settingsStyles.diffTextActive,
//                 ]}
//               >
//                 {d}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         <View style={settingsStyles.divider} />

//         {/* Timer */}
//         <TouchableOpacity
//           style={settingsStyles.timerRow}
//           onPress={() => setTimerEnabled(!timerEnabled)}
//           activeOpacity={0.8}
//         >
//           <View
//             style={[
//               settingsStyles.checkbox,
//               timerEnabled && settingsStyles.checkboxChecked,
//             ]}
//           >
//             {timerEnabled && (
//               <Ionicons name="checkmark" size={12} color={COLORS.white} />
//             )}
//           </View>
//           <View>
//             <Text style={settingsStyles.timerLabel}>Enable Timer</Text>
//             <Text style={settingsStyles.timerSub}>Track time spent on this session</Text>
//           </View>
//         </TouchableOpacity>

//         <View style={settingsStyles.divider} />

//         {/* Actions */}
//         <View style={settingsStyles.actions}>
//           <TouchableOpacity style={settingsStyles.cancelBtn} onPress={onCancel}>
//             <Text style={settingsStyles.cancelText}>Cancel</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={settingsStyles.beginBtn}
//             onPress={() => onBegin(questionCount, difficulty, timerEnabled)}
//           >
//             <Ionicons name="play-circle-outline" size={18} color={COLORS.white} />
//             <Text style={settingsStyles.beginText}>Begin</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };

// const settingsStyles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   card: {
//     width: '100%',
//     backgroundColor: COLORS.white,
//     borderRadius: 20,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.15,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   title: {
//     fontSize: 19,
//     fontWeight: '800',
//     color: COLORS.textDark,
//   },
//   accuracy: {
//     fontSize: 13,
//     color: COLORS.textLight,
//     marginTop: 4,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: COLORS.border,
//     marginVertical: 16,
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: COLORS.textMedium,
//   },
//   valueText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: COLORS.primary,
//   },
//   diffRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginTop: 12,
//   },
//   diffBtn: {
//     flex: 1,
//     paddingVertical: 10,
//     borderRadius: 10,
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//   },
//   diffBtnActive: {
//     backgroundColor: COLORS.primary,
//     borderColor: COLORS.primary,
//   },
//   diffText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: COLORS.textMedium,
//   },
//   diffTextActive: {
//     color: COLORS.white,
//   },
//   timerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   checkbox: {
//     width: 20,
//     height: 20,
//     borderRadius: 5,
//     borderWidth: 2,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   checkboxChecked: {
//     backgroundColor: COLORS.primary,
//     borderColor: COLORS.primary,
//   },
//   timerLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: COLORS.textDark,
//   },
//   timerSub: {
//     fontSize: 12,
//     color: COLORS.textLight,
//     marginTop: 1,
//   },
//   actions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   cancelBtn: {
//     flex: 1,
//     paddingVertical: 14,
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//   },
//   cancelText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: COLORS.textMedium,
//   },
//   beginBtn: {
//     flex: 2,
//     flexDirection: 'row',
//     gap: 8,
//     paddingVertical: 14,
//     borderRadius: 12,
//     backgroundColor: COLORS.primary,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   beginText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: COLORS.white,
//   },
// });

// ─── Progress Bar ─────────────────────────────────────────────────────────────
// const ProgressBar = ({
//   current,
//   total,
//   answers,
// }: {
//   current: number;
//   total: number;
//   answers: AnswerState[];
// }) => {
//   return (
//     <View style={pbStyles.container}>
//       {answers.map((a, i) => {
//         let bg: string = COLORS.border;
//         if (i < current) {
//           bg = a.correct === true ? COLORS.green : a.correct === false ? COLORS.red : COLORS.border;
//         } else if (i === current) {
//           bg = COLORS.primary;
//         }
//         return (
//           <View
//             key={i}
//             style={[
//               pbStyles.segment,
//               { backgroundColor: bg },
//               i === current && pbStyles.segmentActive,
//             ]}
//           />
//         );
//       })}
//     </View>
//   );
// };

// const pbStyles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     gap: 3,
//     flex: 1,
//     height: 6,
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   segment: {
//     flex: 1,
//     height: '100%',
//     borderRadius: 3,
//   },
//   segmentActive: {
//     flex: 1.5,
//   },
// });

// ─── Timer ────────────────────────────────────────────────────────────────────
// export const TimerDisplay = ({ running }: { running: boolean }) => {
//   const [seconds, setSeconds] = useState(0);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   useEffect(() => {
//     if (running) {
//       intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
//     } else {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     }
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [running]);

//   const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
//   const ss = String(seconds % 60).padStart(2, '0');

//   return (
//     <View style={timerStyles.container}>
//       <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
//       <Text style={timerStyles.text}>{mm}:{ss}</Text>
//     </View>
//   );
// };

// const timerStyles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     backgroundColor: COLORS.primaryLight,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 20,
//   },
//   text: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: COLORS.primary,
//   },
// });


// ─── Question Screen ──────────────────────────────────────────────────────────
// const PracticeQuestionScreen = ({
//   questions,
//   chapterName,
//   timerEnabled,
//   onEnd,
// }: {
//   questions: Question[];
//   chapterName: string;
//   timerEnabled: boolean;
//   onEnd: (answers: AnswerState[], totalSeconds: number) => void;
// }) => {
//   const [currentIdx, setCurrentIdx] = useState(0);
//   const [answers, setAnswers] = useState<AnswerState[]>(
//     questions.map(() => ({
//       selected: null,
//       markedForReview: false,
//       answered: false,
//       correct: null,
//     }))
//   );
//   const [totalSeconds, setTotalSeconds] = useState(0);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const fadeAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     if (timerEnabled) {
//       intervalRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
//     }
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [timerEnabled]);

//   const current = answers[currentIdx];
//   const question = questions[currentIdx];
//   const isLast = currentIdx === questions.length - 1;

//   const handleSelectOption = (optId: string) => {
//     if (current.answered) return;
//     setAnswers((prev) => {
//       const next = [...prev];
//       next[currentIdx] = { ...next[currentIdx], selected: optId };
//       return next;
//     });
//   };

//   const handleSaveNext = () => {
//     if (!current.answered && current.selected) {
//       // Grade the answer
//       const isCorrect = current.selected === question.correctOption;
//       setAnswers((prev) => {
//         const next = [...prev];
//         next[currentIdx] = {
//           ...next[currentIdx],
//           answered: true,
//           correct: isCorrect,
//         };
//         return next;
//       });
//       return; // show result for this question first
//     }

//     // Already answered – navigate
//     if (!isLast) {
//       navigateTo(currentIdx + 1);
//     } else {
//       // End practice
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       onEnd(answers, totalSeconds);
//     }
//   };

//   const handleNextQuestion = () => {
//     if (!isLast) {
//       navigateTo(currentIdx + 1);
//     } else {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       onEnd(answers, totalSeconds);
//     }
//   };

//   const navigateTo = (idx: number) => {
//     Animated.sequence([
//       Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
//       Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
//     ]).start();
//     setCurrentIdx(idx);
//   };

//   const handleMarkReview = () => {
//     setAnswers((prev) => {
//       const next = [...prev];
//       next[currentIdx] = {
//         ...next[currentIdx],
//         markedForReview: !next[currentIdx].markedForReview,
//       };
//       return next;
//     });
//   };

//   const handleClear = () => {
//     if (current.answered) return;
//     setAnswers((prev) => {
//       const next = [...prev];
//       next[currentIdx] = { ...next[currentIdx], selected: null };
//       return next;
//     });
//   };

//   const handleEndPractice = () => {
//     if (intervalRef.current) clearInterval(intervalRef.current);
//     onEnd(answers, totalSeconds);
//   };

//   const optionStyle = (optId: string) => {
//     if (!current.answered) {
//       return [
//         qStyles.optionRow,
//         current.selected === optId && qStyles.optionSelected,
//       ];
//     }
//     if (optId === question.correctOption) return [qStyles.optionRow, qStyles.optionCorrect];
//     if (optId === current.selected && optId !== question.correctOption)
//       return [qStyles.optionRow, qStyles.optionWrong];
//     return [qStyles.optionRow, qStyles.optionDimmed];
//   };

//   const optionTextStyle = (optId: string) => {
//     if (!current.answered) {
//       return [qStyles.optionText, current.selected === optId && qStyles.optionTextSelected];
//     }
//     if (optId === question.correctOption) return [qStyles.optionText, qStyles.optionTextCorrect];
//     if (optId === current.selected) return [qStyles.optionText, qStyles.optionTextWrong];
//     return [qStyles.optionText, qStyles.optionTextDimmed];
//   };

//   const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
//   const ss = String(totalSeconds % 60).padStart(2, '0');
//   const timeLabel = `${mm}:${ss}`;

//   return (
//     <SafeAreaView style={qStyles.safeArea}>
//       {/* Header */}
//       <View style={qStyles.header}>
//         <View style={qStyles.headerLeft}>
//           <Text style={qStyles.practiceMode}>Practice Mode</Text>
//           <Text style={qStyles.chapterLabel} numberOfLines={1}>
//             {chapterName.substring(0, 12)}...
//           </Text>
//         </View>

//         <View style={qStyles.headerCenter}>
//           <ProgressBar
//             current={currentIdx}
//             total={questions.length}
//             answers={answers}
//           />
//           <Text style={qStyles.progressText}>
//             {currentIdx + 1}/{questions.length}
//           </Text>
//         </View>

//         <TouchableOpacity style={qStyles.endBtn} onPress={handleEndPractice}>
//           <Text style={qStyles.endBtnText}>End Practice</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={qStyles.scroll}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={qStyles.scrollContent}
//       >
//         {/* Meta row */}
//         <View style={qStyles.metaRow}>
//           <View style={qStyles.qNumBadge}>
//             <Text style={qStyles.qNumText}>
//               Q {currentIdx + 1} of {questions.length}
//             </Text>
//           </View>
//           <View style={qStyles.typeBadge}>
//             <Text style={qStyles.typeText}>Single Correct</Text>
//           </View>
//           <View style={qStyles.marksBadge}>
//             <Text style={qStyles.marksGreen}>+4 marks</Text>
//           </View>
//           <View style={qStyles.marksBadge}>
//             <Text style={qStyles.marksRed}>-1 marks</Text>
//           </View>
//           {timerEnabled && (
//             <TimerDisplay running={!current.answered} />
//           )}
//         </View>

//         {/* Question */}
//         <Animated.View style={{ opacity: fadeAnim }}>
//           <Text style={qStyles.questionText}>{question.text}</Text>

//           {/* Options */}
//           <View style={qStyles.optionsList}>
//             {question.options.map((opt: any) => (
//               <TouchableOpacity
//                 key={opt.id}
//                 style={optionStyle(opt.id)}
//                 onPress={() => handleSelectOption(opt.id)}
//                 activeOpacity={current.answered ? 1 : 0.7}
//               >
//                 <View style={[
//                   qStyles.optionBubble,
//                   current.selected === opt.id && !current.answered && qStyles.optionBubbleSelected,
//                   current.answered && opt.id === question.correctOption && qStyles.optionBubbleCorrect,
//                   current.answered && opt.id === current.selected && opt.id !== question.correctOption && qStyles.optionBubbleWrong,
//                 ]}>
//                   <Text style={[
//                     qStyles.optionBubbleText,
//                     (current.selected === opt.id && !current.answered) || (current.answered && (opt.id === question.correctOption || opt.id === current.selected))
//                       ? { color: COLORS.white }
//                       : {},
//                   ]}>
//                     {opt.id}
//                   </Text>
//                 </View>
//                 <Text style={optionTextStyle(opt.id)}>{opt.text}</Text>
//                 {current.answered && opt.id === question.correctOption && (
//                   <Ionicons name="checkmark-circle" size={18} color={COLORS.green} style={{ marginLeft: 'auto' }} />
//                 )}
//                 {current.answered && opt.id === current.selected && opt.id !== question.correctOption && (
//                   <Ionicons name="close-circle" size={18} color={COLORS.red} style={{ marginLeft: 'auto' }} />
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Feedback */}
//           {current.answered && (
//             <View style={[
//               qStyles.feedbackBox,
//               current.correct ? qStyles.feedbackCorrect : qStyles.feedbackWrong,
//             ]}>
//               <View style={qStyles.feedbackHeader}>
//                 <Ionicons
//                   name={current.correct ? 'checkmark-circle' : 'close-circle'}
//                   size={20}
//                   color={current.correct ? COLORS.green : COLORS.red}
//                 />
//                 <Text style={[
//                   qStyles.feedbackTitle,
//                   { color: current.correct ? COLORS.green : COLORS.red },
//                 ]}>
//                   {current.correct ? 'Correct!' : 'Incorrect'}
//                 </Text>
//               </View>
//               {!current.correct && (
//                 <View style={qStyles.answerRow}>
//                   <Text style={qStyles.yourAnswer}>
//                     Your answer:{' '}
//                     <Text style={{ color: COLORS.red, fontWeight: '700' }}>
//                       ({current.selected}) {question.options.find((o: any) => o.id === current.selected)?.text}
//                     </Text>
//                   </Text>
//                   <Text style={qStyles.correctAnswer}>
//                     Correct answer:{' '}
//                     <Text style={{ color: COLORS.green, fontWeight: '700' }}>
//                       ({question.correctOption}) {question.options.find((o: any) => o.id === question.correctOption)?.text}
//                     </Text>
//                   </Text>
//                 </View>
//               )}
//               {/* Explanation */}
//               <View style={qStyles.explanationBox}>
//                 <View style={qStyles.explanationHeader}>
//                   <Ionicons name="bulb-outline" size={16} color={COLORS.orange} />
//                   <Text style={qStyles.explanationTitle}>Explanation</Text>
//                 </View>
//                 <Text style={qStyles.explanationText}>{question.explanation}</Text>
//               </View>
//             </View>
//           )}
//         </Animated.View>
//       </ScrollView>

//       {/* Bottom Bar */}
//       <View style={qStyles.bottomBar}>
//         {/* Mark for Review / Clear */}
//         <View style={qStyles.bottomActions}>
//           <TouchableOpacity
//             style={[
//               qStyles.reviewBtn,
//               current.markedForReview && qStyles.reviewBtnActive,
//             ]}
//             onPress={handleMarkReview}
//           >
//             <MaterialCommunityIcons
//               name="bookmark-outline"
//               size={16}
//               color={current.markedForReview ? COLORS.primary : COLORS.textLight}
//             />
//             <Text style={[
//               qStyles.reviewText,
//               current.markedForReview && qStyles.reviewTextActive,
//             ]}>
//               Mark for Review
//             </Text>
//           </TouchableOpacity>

//           {current.answered ? (
//             <Text style={qStyles.answeredBadge}>Answered</Text>
//           ) : current.selected ? (
//             <TouchableOpacity style={qStyles.clearBtn} onPress={handleClear}>
//               <Ionicons name="trash-outline" size={14} color={COLORS.red} />
//               <Text style={qStyles.clearText}>Clear</Text>
//             </TouchableOpacity>
//           ) : (
//             <Text style={qStyles.notVisitedText}>Not Visited</Text>
//           )}
//         </View>

//         {/* Navigation */}
//         <View style={qStyles.navRow}>
//           <TouchableOpacity
//             style={[qStyles.navBtn, currentIdx === 0 && qStyles.navBtnDisabled]}
//             onPress={() => currentIdx > 0 && navigateTo(currentIdx - 1)}
//             disabled={currentIdx === 0}
//           >
//             <Ionicons name="chevron-back" size={16} color={currentIdx === 0 ? COLORS.border : COLORS.textMedium} />
//             <Text style={[qStyles.navBtnText, currentIdx === 0 && { color: COLORS.border }]}>Prev</Text>
//           </TouchableOpacity>

//           {current.answered ? (
//             <TouchableOpacity style={qStyles.nextQuestionBtn} onPress={handleNextQuestion}>
//               <Text style={qStyles.nextQuestionText}>
//                 {isLast ? 'Finish' : 'Next Question'}
//               </Text>
//               <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity
//               style={[qStyles.saveNextBtn, !current.selected && qStyles.saveNextBtnDisabled]}
//               onPress={handleSaveNext}
//               disabled={!current.selected}
//             >
//               <MaterialCommunityIcons name="content-save-outline" size={16} color={COLORS.white} />
//               <Text style={qStyles.saveNextText}>
//                 {isLast && current.answered ? 'Finish' : 'Save & Next'}
//               </Text>
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity
//             style={[qStyles.navBtn, isLast && qStyles.navBtnDisabled]}
//             onPress={() => !isLast && navigateTo(currentIdx + 1)}
//             disabled={isLast}
//           >
//             <Text style={[qStyles.navBtnText, isLast && { color: COLORS.border }]}>Next</Text>
//             <Ionicons name="chevron-forward" size={16} color={isLast ? COLORS.border : COLORS.textMedium} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const qStyles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: COLORS.background },
//   scroll: { flex: 1 },
//   scrollContent: { padding: 16, paddingBottom: 32 },

//   // Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     backgroundColor: COLORS.white,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//     gap: 10,
//   },
//   headerLeft: { minWidth: 70 },
//   practiceMode: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5 },
//   chapterLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
//   headerCenter: { flex: 1, gap: 4 },
//   progressText: { fontSize: 11, color: COLORS.textLight, textAlign: 'center' },
//   endBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//     borderRadius: 8,
//     backgroundColor: COLORS.red,
//   },
//   endBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white },

//   // Meta
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//     gap: 6,
//     marginBottom: 16,
//   },
//   qNumBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     backgroundColor: COLORS.white,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   qNumText: { fontSize: 12, fontWeight: '600', color: COLORS.textMedium },
//   typeBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     backgroundColor: COLORS.primaryLight,
//     borderRadius: 8,
//   },
//   typeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
//   marksBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     backgroundColor: COLORS.white,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   marksGreen: { fontSize: 12, fontWeight: '700', color: COLORS.green },
//   marksRed: { fontSize: 12, fontWeight: '700', color: COLORS.red },

//   // Question
//   questionText: {
//     fontSize: 15,
//     color: COLORS.textDark,
//     lineHeight: 24,
//     fontWeight: '500',
//     marginBottom: 20,
//   },

//   // Options
//   optionsList: { gap: 10 },
//   optionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: 14,
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//   },
//   optionSelected: {
//     borderColor: COLORS.primary,
//     backgroundColor: COLORS.primaryLight,
//   },
//   optionCorrect: {
//     borderColor: COLORS.green,
//     backgroundColor: COLORS.greenLight,
//   },
//   optionWrong: {
//     borderColor: COLORS.red,
//     backgroundColor: COLORS.redLight,
//   },
//   optionDimmed: {
//     opacity: 0.5,
//   },
//   optionBubble: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: COLORS.white,
//   },
//   optionBubbleSelected: {
//     backgroundColor: COLORS.primary,
//     borderColor: COLORS.primary,
//   },
//   optionBubbleCorrect: {
//     backgroundColor: COLORS.green,
//     borderColor: COLORS.green,
//   },
//   optionBubbleWrong: {
//     backgroundColor: COLORS.red,
//     borderColor: COLORS.red,
//   },
//   optionBubbleText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: COLORS.textMedium,
//   },
//   optionText: {
//     flex: 1,
//     fontSize: 14,
//     color: COLORS.textDark,
//     fontWeight: '500',
//   },
//   optionTextSelected: { color: COLORS.primary, fontWeight: '600' },
//   optionTextCorrect: { color: COLORS.green, fontWeight: '600' },
//   optionTextWrong: { color: COLORS.red, fontWeight: '600' },
//   optionTextDimmed: { color: COLORS.textLight },

//   // Feedback
//   feedbackBox: {
//     marginTop: 20,
//     borderRadius: 14,
//     padding: 16,
//     borderWidth: 1.5,
//   },
//   feedbackCorrect: {
//     backgroundColor: COLORS.greenLight,
//     borderColor: COLORS.green,
//   },
//   feedbackWrong: {
//     backgroundColor: COLORS.redLight,
//     borderColor: COLORS.red,
//   },
//   feedbackHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     marginBottom: 10,
//   },
//   feedbackTitle: {
//     fontSize: 16,
//     fontWeight: '800',
//   },
//   answerRow: { gap: 4, marginBottom: 12 },
//   yourAnswer: { fontSize: 13, color: COLORS.textMedium },
//   correctAnswer: { fontSize: 13, color: COLORS.textMedium },
//   explanationBox: {
//     backgroundColor: 'rgba(255,255,255,0.6)',
//     borderRadius: 10,
//     padding: 12,
//     gap: 6,
//   },
//   explanationHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   explanationTitle: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: COLORS.orange,
//   },
//   explanationText: {
//     fontSize: 13,
//     color: COLORS.textMedium,
//     lineHeight: 20,
//   },

//   // Bottom bar
//   bottomBar: {
//     backgroundColor: COLORS.white,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//     paddingHorizontal: 14,
//     paddingTop: 12,
//     paddingBottom: Platform.OS === 'ios' ? 8 : 14,
//     gap: 10,
//   },
//   bottomActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   reviewBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     backgroundColor: COLORS.white,
//   },
//   reviewBtnActive: {
//     borderColor: COLORS.primary,
//     backgroundColor: COLORS.primaryLight,
//   },
//   reviewText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
//   reviewTextActive: { color: COLORS.primary },
//   clearBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: COLORS.redLight,
//     backgroundColor: COLORS.redLight,
//   },
//   clearText: { fontSize: 13, fontWeight: '600', color: COLORS.red },
//   answeredBadge: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: COLORS.green,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     backgroundColor: COLORS.greenLight,
//     borderRadius: 8,
//   },
//   notVisitedText: {
//     fontSize: 13,
//     color: COLORS.textLight,
//   },
//   navRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: 8,
//   },
//   navBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 10,
//     paddingVertical: 10,
//   },
//   navBtnDisabled: { opacity: 0.4 },
//   navBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMedium },
//   saveNextBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     backgroundColor: COLORS.primary,
//     borderRadius: 12,
//     paddingVertical: 12,
//   },
//   saveNextBtnDisabled: {
//     backgroundColor: COLORS.border,
//   },
//   saveNextText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
//   nextQuestionBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     backgroundColor: COLORS.green,
//     borderRadius: 12,
//     paddingVertical: 12,
//   },
//   nextQuestionText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
// });



// ─── Main Export: PracticeExamFlow ────────────────────────────────────────────
interface PracticeExamFlowProps {
  visible: boolean;
  chapterName: string;
  subject: string;
  accuracy: number | null;
  onClose: () => void;
}

export const PracticeExamFlow = ({
  visible,
  chapterName,
  subject,
  accuracy,
  onClose,
}: PracticeExamFlowProps) => {
  const [screen, setScreen] = useState<Screen>('settings');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [finalAnswers, setFinalAnswers] = useState<AnswerState[]>([]);
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) setScreen('settings');
  }, [visible]);

  const handleBegin = (count: number, difficulty: Difficulty, timer: boolean) => {
    const qs = getQuestionsForPractice(chapterName, count, difficulty);
    setQuestions(qs);
    setTimerEnabled(timer);
    setScreen('questions');
  };

  const handleEnd = (answers: AnswerState[], seconds: number) => {
    setFinalAnswers(answers);
    setFinalSeconds(seconds);
    setScreen('results');
  };

  const handleTryAgain = () => {
    setScreen('settings');
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      {screen === 'settings' && (
        <PracticeSettingsModal
          chapterName={chapterName}
          accuracy={accuracy}
          onBegin={handleBegin}
          onCancel={onClose}
        />
      )}
      {screen === 'questions' && questions.length > 0 && (
        <PracticeQuestions
          questions={questions}
          chapterName={chapterName}
          timerEnabled={timerEnabled}
          onEnd={handleEnd}
        />
      )}
      {screen === 'results' && (
        <PracticeResults
          chapterName={chapterName}
          answers={finalAnswers}
          totalSeconds={finalSeconds}
          onTryAgain={handleTryAgain}
          onBackToHub={onClose}
        />
      )}
    </Modal>
  );
};

export default PracticeExamFlow;