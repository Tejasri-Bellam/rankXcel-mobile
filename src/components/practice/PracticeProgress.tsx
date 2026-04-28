import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { AnswerState } from "./PracticeExamFlow";

export default function PracticeProgress({
    current,
    total,
    answers,
  }: {
    current: number;
    total: number;
    answers: AnswerState[];
  }){
    return (
      <View style={ppStyles.container}>
        {answers.map((a, i) => {
          let bg: string = COLORS.border;
          if (i < current) {
            bg = a.correct === true ? COLORS.green : a.correct === false ? COLORS.red : COLORS.border;
          } else if (i === current) {
            bg = COLORS.primary;
          }
          return (
            <View
              key={i}
              style={[
                ppStyles.segment,
                { backgroundColor: bg },
                i === current && ppStyles.segmentActive,
              ]}
            />
          );
        })}
      </View>
    );
  };

const ppStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 3,
  },
  segmentActive: {
    flex: 1.5,
  },
});