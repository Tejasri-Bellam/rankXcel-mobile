import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toastStyles as styles } from '@/src/styles/styles/common/toaststyles';

export type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
};

// Small state container so screens can fire toasts imperatively:
//   const { toast, showToast, hideToast } = useToast();
//   showToast('Logged in successfully', 'success');
//   <Toast {...toast} onHide={hideToast} />
export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') =>
      setToast({ visible: true, message, type }),
    []
  );

  const hideToast = useCallback(
    () => setToast((prev) => ({ ...prev, visible: false })),
    []
  );

  return { toast, showToast, hideToast };
};

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

const CONFIG: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  success: { bg: '#16A34A', icon: 'checkmark-circle' },
  error: { bg: '#DC2626', icon: 'alert-circle' },
  info: { bg: '#2F8AF4', icon: 'information-circle' },
};

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss: fade out, then let the parent flip `visible` to false.
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -24,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, duration);

    return () => clearTimeout(timer);
    // Re-run when a new toast is shown (message change retriggers the timer).
  }, [visible, message, type, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  const cfg = CONFIG[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.toast, { backgroundColor: cfg.bg }]}>
        <Ionicons
          name={cfg.icon}
          size={20}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Text style={styles.text} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
