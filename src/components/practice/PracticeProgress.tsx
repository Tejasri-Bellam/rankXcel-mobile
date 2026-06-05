import React from "react";
import { StyleSheet, View } from "react-native";
import { AnswerState } from "./PracticeExamFlow";

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

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 3,
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    height: "100%",
    borderRadius: 2,
  },
  segmentActive: {
    flex: 1.4,
  },
});