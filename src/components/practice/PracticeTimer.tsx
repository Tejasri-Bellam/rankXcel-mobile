import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, } from "react-native";


export default function PracticeTimer() {

const TimerDisplay = ({ running }: { running: boolean }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);


  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

    return (
        <View className="bg-white rounded-lg shadow-md p-6 mb-6">
            <View style={timerStyles.container}>
                <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
                <Text style={timerStyles.text}>{mm}:{ss}</Text>
            </View>
        </View>
    );
}
}
const timerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

