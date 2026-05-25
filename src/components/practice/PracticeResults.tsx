import { StyleSheet, View, Text, Animated, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS } from "../../styles/styles";
import { useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AnswerState } from "./PracticeExamFlow";


export default function PracticeResults({
  chapterName,
  answers,
  totalSeconds,
  submitting = false,
  onTryAgain,
  onBackToHub,
}: {
  chapterName: string;
  answers: AnswerState[];
  totalSeconds: number;
  submitting?: boolean;
  onTryAgain: () => void;
  onBackToHub: () => void;
}) {
   const correct = answers.filter((a) => a.correct === true).length;
   const wrong = answers.filter((a) => a.correct === false).length;
   const skipped = answers.filter((a) => a.correct === null).length;
   const total = answers.length;
   const score = correct * 4 - wrong * 1;
   const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
 
   const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
   const ss = String(totalSeconds % 60).padStart(2, '0');
 
   const scaleAnim = useRef(new Animated.Value(0.8)).current;
   const opacityAnim = useRef(new Animated.Value(0)).current;
 
   useEffect(() => {
     Animated.parallel([
       Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80 }),
       Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
     ]).start();
   }, []);
  return (
    <View style={resStyles.overlay}>
         <Animated.View style={[resStyles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
           {/* Banner */}
           <View style={resStyles.banner}>
             <TouchableOpacity style={resStyles.closeBtn} onPress={onBackToHub}>
               <Ionicons name="close" size={18} color={COLORS.white} />
             </TouchableOpacity>
             <Text style={resStyles.bannerTitle}>Practice Complete - {chapterName}</Text>
             <Text style={resStyles.scoreLarge}>{score > 0 ? `+${score}` : score}</Text>
             <Text style={resStyles.timeTaken}>marks - {mm}:{ss} taken</Text>
           </View>
   
           {/* Stats */}
           <View style={resStyles.statsRow}>
             <View style={resStyles.statItem}>
               <View style={[resStyles.statIcon, { backgroundColor: COLORS.greenLight }]}>
                 <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
               </View>
               <Text style={resStyles.statValue}>{correct}</Text>
               <Text style={resStyles.statLabel}>Correct</Text>
             </View>
             <View style={resStyles.statDivider} />
             <View style={resStyles.statItem}>
               <View style={[resStyles.statIcon, { backgroundColor: COLORS.redLight }]}>
                 <Ionicons name="close-circle" size={22} color={COLORS.red} />
               </View>
               <Text style={resStyles.statValue}>{wrong}</Text>
               <Text style={resStyles.statLabel}>Wrong</Text>
             </View>
             <View style={resStyles.statDivider} />
             <View style={resStyles.statItem}>
               <View style={[resStyles.statIcon, { backgroundColor: COLORS.orangeLight }]}>
                 <MaterialCommunityIcons name="skip-next-circle-outline" size={22} color={COLORS.orange} />
               </View>
               <Text style={resStyles.statValue}>{skipped}</Text>
               <Text style={resStyles.statLabel}>Skipped</Text>
             </View>
           </View>
   
           {/* Accuracy bar */}
           <View style={resStyles.accuracySection}>
             <View style={resStyles.accRow}>
               <Text style={resStyles.accLabel}>Accuracy</Text>
               <Text style={[resStyles.accValue, { color: accuracy >= 65 ? COLORS.green : accuracy >= 40 ? COLORS.orange : COLORS.red }]}>
                 {accuracy}%
               </Text>
             </View>
             <View style={resStyles.accTrack}>
               <View style={[resStyles.accFill, {
                 width: `${accuracy}%`,
                 backgroundColor: accuracy >= 65 ? COLORS.green : accuracy >= 40 ? COLORS.orange : COLORS.red,
               }]} />
             </View>
           </View>
   
           {submitting && (
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 10 }}>
               <ActivityIndicator size="small" color={COLORS.primary} />
               <Text style={{ fontSize: 12, color: COLORS.textLight }}>Submitting your session...</Text>
             </View>
           )}

           {/* Actions */}
           <View style={resStyles.actions}>
             <TouchableOpacity style={resStyles.hubBtn} onPress={onBackToHub} disabled={submitting}>
               <Text style={resStyles.hubText}>Back to Hub</Text>
             </TouchableOpacity>
             <TouchableOpacity style={resStyles.tryBtn} onPress={onTryAgain} disabled={submitting}>
               <Ionicons name="refresh" size={16} color={COLORS.white} />
               <Text style={resStyles.tryText}>Try Again</Text>
             </TouchableOpacity>
           </View>
           </Animated.View>
       </View>
     );
}

const resStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  banner: {
    backgroundColor: COLORS.red,
    padding: 24,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.9,
  },
  scoreLarge: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 60,
  },
  timeTaken: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  accuracySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  accRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  accValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  accTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  accFill: {
    height: '100%',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  hubBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  hubText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMedium,
  },
  tryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});