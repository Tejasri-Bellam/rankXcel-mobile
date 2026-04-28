import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { examInstructionsStyles as styles } from '../../styles/sidebar/assessments/exam';
import examData from '../json/assessmentExam';

interface Props {
  onStartExam: () => void;
}

export default function ExamInstructions({ onStartExam }: Props) {
  const { exam }:any = examData;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Instructions Header */}
      <View style={styles.instructionsBar}>
        <View>
          <Text style={styles.instructionsBarTitle}>Assessment</Text>
          <Text style={styles.instructionsBarTitle}>Instructions</Text>
        </View>
        <Text style={styles.instructionsBarHint}>(Read before{'\n'}starting)</Text>
        <Text style={styles.chevronUp}>∧</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {exam.instructions.map((instruction: any, index: number) => (
          <View key={index} style={styles.instructionRow}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>{index + 1}.</Text>
            </View>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Start / Resume Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.startBtn} onPress={onStartExam}>
          <Text style={styles.startBtnText}>▶  Resume Assessment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}