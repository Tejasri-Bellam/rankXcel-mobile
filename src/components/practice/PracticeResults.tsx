import { StyleSheet, View, Text, Animated, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS } from "../../styles/styles";
import { useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AnswerState } from "./PracticeExamFlow";
import React from "react";
import { resStyles } from "@/src/styles/sidebar/practice/results";


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
