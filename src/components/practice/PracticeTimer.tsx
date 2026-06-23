import { COLORS } from "@/src/styles/styles";
import { practiceTimerStyles as timerStyles } from "@/src/styles/styles/practice/practicetimerstyles";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import { View, Text } from "react-native";


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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={timerStyles.container}>
                <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
                <Text style={timerStyles.text}>{mm}:{ss}</Text>
            </View>
        </View>
    );
}
}

