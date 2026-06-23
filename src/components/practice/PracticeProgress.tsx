import React from "react";
import { View } from "react-native";
import { AnswerState } from "./PracticeExamFlow";
import { practiceProgressStyles as styles } from "@/src/styles/styles/practice/practiceprogressstyles";

interface Props {
  current: number;
  total: number;
  answers: AnswerState[];
}

export default function PracticeProgress({ current, total, answers }: Props) {
  return (
    <View style={styles.container}>
      {answers.map((a, i) => {
        let bg = "#E5E7EB";
        if (i === current) {
          bg = "#3B7DF8";
        } else if (i < current) {
          if (a.correct === true) bg = "#22C55E";
          else if (a.correct === false) bg = "#EF4444";
        }
        return (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: bg },
              i === current && styles.segmentActive,
            ]}
          />
        );
      })}
    </View>
  );
}