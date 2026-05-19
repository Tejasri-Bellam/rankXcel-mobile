// // src/components/assessments/ExamInstructions.tsx

// import React, { useState } from 'react';
// import {
//   View, Text, TouchableOpacity, ScrollView,
//   StatusBar, ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { examInstructionsStyles as styles } from '@/src/styles/sidebar/assessments/Instructions';

// interface Props {
//   item: any;
//   startLoading: boolean;
//   onStartExam: () => void;
//   onBack: () => void;
//   // Completed-state props
//   isCompleted?: boolean;
//   onViewResults?: () => void;
//   onViewSolutions?: () => void;
//   onReattempt?: () => void;
// }

// const INSTRUCTIONS = [
//   'This is a live assessment. All students take the exam within the same time window.',
//   'Your timer starts when you click "Start Assessment". You must finish within the exam duration.',
//   'You must complete the exam before the assessment window closes.',
//   'Marking scheme: +4 for correct, -1 for incorrect MCQ, 0 for unattended.',
//   'You may switch between sections at any time during the exam.',
//   'Answers are saved automatically when you click "Save & Next".',
//   'Once you submit, the exam cannot be resumed.',
//   'Switching tabs will be recorded and may be flagged.',
//   'Results and rankings will be available after the assessment window closes.',
// ];

// export default function ExamInstructions({
//   item,
//   startLoading,
//   onStartExam,
//   onBack,
//   isCompleted = false,
//   onViewResults,
//   onViewSolutions,
//   onReattempt,
// }: Props) {
//   const [accepted, setAccepted] = useState(false);

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.headerLeft} onPress={onBack}>
//           <Text style={styles.headerBackArrow}>←</Text>
//           <Text style={styles.headerTitle}>Dashboard</Text>
//         </TouchableOpacity>
//         <Text style={styles.headerHint}>(Read before starting)</Text>
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={
//           isCompleted ? styles.scrollContent : styles.scrollContentWithBtn
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Section heading */}
//         <View style={styles.instructionsHeadRow}>
//           <Text style={styles.instructionsHeadIcon}>⚠️</Text>
//           <Text style={styles.instructionsHeadText}>Assessment Instructions</Text>
//         </View>

//         {/* Numbered instruction list */}
//         {INSTRUCTIONS.map((text, index) => (
//           <View key={index} style={styles.instructionRow}>
//             <Text style={styles.instructionNumber}>{index + 1}.</Text>
//             <Text style={styles.instructionText}>{text}</Text>
//           </View>
//         ))}

//         {/* ── Completed state: action buttons ── */}
//         {isCompleted && (
//           <View style={styles.actionGroup}>
//             <TouchableOpacity style={styles.actionBtnPrimary} onPress={onViewResults}>
//               <Text style={styles.actionBtnIcon}>📊</Text>
//               <Text style={styles.actionBtnPrimaryText}>View Results</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.actionBtnOutline} onPress={onViewSolutions}>
//               <Text style={styles.actionBtnIcon}>📖</Text>
//               <Text style={styles.actionBtnOutlineText}>View Solutions</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.actionBtnOutline} onPress={onReattempt}>
//               <Text style={styles.actionBtnIcon}>🔄</Text>
//               <Text style={styles.actionBtnOutlineText}>Re-attempt Assessment</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* ── Non-completed state: checkbox ── */}
//         {!isCompleted && (
//           <TouchableOpacity
//             style={styles.checkboxRow}
//             onPress={() => setAccepted(!accepted)}
//             activeOpacity={0.7}
//           >
//             <View style={[styles.checkbox, accepted ? styles.checkboxChecked : styles.checkboxUnchecked]}>
//               {accepted && <Text style={styles.checkboxTick}>✓</Text>}
//             </View>
//             <Text style={styles.checkboxLabel}>
//               I have read and understood all the assessment instructions and I am ready to begin.
//             </Text>
//           </TouchableOpacity>
//         )}
//       </ScrollView>

//       {/* ── Bottom start button — non-completed only ── */}
//       {!isCompleted && (
//         <View style={styles.bottomBar}>
//           <TouchableOpacity
//             disabled={!accepted || startLoading}
//             onPress={onStartExam}
//             style={[styles.startBtn, accepted ? styles.startBtnEnabled : styles.startBtnDisabled]}
//           >
//             {startLoading
//               ? <ActivityIndicator color="#fff" />
//               : <Text style={styles.startBtnText}>Start Assessment</Text>}
//           </TouchableOpacity>

//           {!accepted && (
//             <Text style={styles.startBtnHint}>
//               Tick the checkbox above to enable the start button
//             </Text>
//           )}
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }