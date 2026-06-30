import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IntroJson } from '../json/intro';
import { INTRO, introStyles as s } from '@/src/styles/styles/onboarding/introcarouselstyles';

const tap = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) =>
  Haptics.impactAsync(style).catch(() => {});

export default function IntroCarousel() {
  const data = IntroJson();
  const slides = data.slides;
  const last = slides.length - 1;

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const goToAuth = (route: string, strong = false) => {
    tap(strong ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const settle = (n: number) => {
    const v = Math.max(0, Math.min(last, n));
    setIndex(v);
    scrollRef.current?.scrollTo({ x: v * INTRO.width, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = Math.round(e.nativeEvent.contentOffset.x / INTRO.width);
    if (v !== index) setIndex(v);
  };

  return (
    <SafeAreaView style={s.container} edges={[]}>
      {/* Skip */}
      <View style={s.topBar}>
        <Pressable
          style={s.skipBtn}
          hitSlop={8}
          onPress={() => goToAuth(data.routes.signup)}
        >
          <Text style={s.skipText}>{data.buttons.skip}</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {slides.map((slide, k) => (
          <View key={k} style={s.slide}>
            <View
              style={[
                s.iconTile,
                { backgroundColor: slide.tint, shadowColor: slide.tint },
              ]}
            >
              <View style={s.iconTileSheen} />
              <MaterialCommunityIcons
                name={slide.icon as any}
                size={300}
                color="#FFFFFF"
                style={s.iconTileGlow}
              />
              <MaterialCommunityIcons
                name={slide.icon as any}
                size={76}
                color="#FFFFFF"
              />
            </View>
            <Text style={s.title}>{slide.title}</Text>
            <Text style={s.sub}>{slide.sub}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {/* Dots */}
        <View style={s.dots}>
          {slides.map((_, k) => (
            <Pressable
              key={k}
              hitSlop={8}
              onPress={() => {
                tap();
                settle(k);
              }}
            >
              <View
                style={[
                  s.dot,
                  {
                    width: k === index ? 24 : 8,
                    backgroundColor: k === index ? INTRO.accent : INTRO.line2,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Primary action */}
        <Pressable
          style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.9 }]}
          onPress={() => {
            if (index < last) {
              tap();
              settle(index + 1);
            } else {
              goToAuth(data.routes.signup, true);
            }
          }}
        >
          <Text style={s.primaryBtnText}>
            {index < last ? data.buttons.next : data.buttons.getStarted}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={INTRO.white} />
        </Pressable>

        {/* Login link */}
        <Pressable
          style={s.haveAccountBtn}
          onPress={() => goToAuth(data.routes.login)}
        >
          <Text style={s.haveAccountText}>{data.buttons.haveAccount}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};