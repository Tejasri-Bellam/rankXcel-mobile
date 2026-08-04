import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
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
  // Stay on screen until the parent hides it (or replaces the message) instead
  // of auto-dismissing after `duration`. For conditions the user can't act
  // away from — e.g. "no internet connection", which should hold until the
  // connection is actually back.
  persistent?: boolean;
  // Distance from the top of the parent view. Screens with their own header
  // (the exam runners) push it down so a long-lived toast doesn't cover it.
  topOffset?: number;
  // Render a close (✕) button so the user can get a held-open toast out of the
  // way. Pairs with `persistent` — an auto-dismissing toast rarely needs one.
  dismissible?: boolean;
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
  persistent = false,
  topOffset,
  dismissible = false,
  onHide,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  // Fade out, then let the parent flip `visible` to false. Shared by the
  // auto-dismiss timer and the close button so both leave the same way.
  const animateOut = useCallback(() => {
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
  }, [onHide, opacity, translateY]);

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

    // Held open by the caller — no auto-dismiss. It goes away when the parent
    // hides it, or morphs in place when the parent shows a different message.
    if (persistent) return;

    // Auto-dismiss.
    const timer = setTimeout(animateOut, duration);

    return () => clearTimeout(timer);
    // Re-run when a new toast is shown (message change retriggers the timer),
    // and when `persistent` flips — that's how a held-open toast is released.
  }, [visible, message, type, duration, persistent, animateOut, opacity, translateY]);

  if (!visible) return null;

  const cfg = CONFIG[type];

  return (
    <Animated.View
      // "box-none" lets the close button take taps while everything else in the
      // toast still passes them through to the screen underneath.
      pointerEvents={dismissible ? 'box-none' : 'none'}
      style={[
        styles.container,
        topOffset != null && { top: topOffset },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View
        pointerEvents={dismissible ? 'box-none' : 'none'}
        style={[styles.toast, { backgroundColor: cfg.bg }]}
      >
        <Ionicons
          name={cfg.icon}
          size={20}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Text style={styles.text} numberOfLines={3}>
          {message}
        </Text>
        {dismissible && (
          <TouchableOpacity
            onPress={animateOut}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss message"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
