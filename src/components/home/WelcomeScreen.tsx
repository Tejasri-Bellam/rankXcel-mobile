import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { WelcomeJson } from '../json/welcome';
import { welcomeStyles } from '@/src/styles/styles/home/welcomescreenstyles';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const data = WelcomeJson();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(100,
        cardAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, []);

   const steps = data.steps;

  return (
    <View style={welcomeStyles.container}>
      {/* Background gradient effect */}
      <View style={welcomeStyles.bgGradient} />

      <Animated.View
        style={[
          welcomeStyles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo Icon */}
        <View style={welcomeStyles.logoContainer}>
          <View style={welcomeStyles.logoBox}>
            <Text style={welcomeStyles.logoText}>{data.logo.shortName}</Text>
          </View>
        </View>

        {/* Welcome Text */}
        <Text style={welcomeStyles.welcomeTitle}>{data.title}</Text>
        <Text style={welcomeStyles.welcomeSubtitle}>
          {data.subtitle}
        </Text>

        {/* Step Cards Grid */}
        <View style={welcomeStyles.cardsGrid}>
          {steps.map((step, index) => (
            <Animated.View
              key={index}
              style={[
                welcomeStyles.card,
                { opacity: cardAnims[index] },
              ]}
            >
              <View style={welcomeStyles.stepNumberBadge}>
                <Text style={welcomeStyles.stepNumber}>{step.number}</Text>
              </View>
              <Text style={welcomeStyles.cardTitle}>{step.title}</Text>
              <Text style={welcomeStyles.cardDescription}>{step.description}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={welcomeStyles.getStartedButton}
          onPress={() => router.push(data.routes.onboarding as any)}
          activeOpacity={0.9}
        >
          <Text style={welcomeStyles.getStartedText}>
          {data.buttons.getStarted}
        </Text>
        </TouchableOpacity>

        {/* Skip Link */}
        <TouchableOpacity
          style={welcomeStyles.skipButton}
          onPress={() => router.push(data.routes.dashboard as any)}
        >
          <Text style={welcomeStyles.skipText}>
            {data.buttons.skip}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default WelcomeScreen;
