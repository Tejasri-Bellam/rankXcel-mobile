import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { homeData } from '../json/home';
import { homeStyles } from '@/src/styles/styles/home/homescreenstyles';


const HomeScreen = () => {
  const router = useRouter();

  return (
    <View style={homeStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={homeStyles.header}>
          <View style={homeStyles.logoRow}>
            <View style={homeStyles.logoIcon}>
              <Text style={homeStyles.logoIconText}>RX</Text>
            </View>
            <Text style={homeStyles.logo}>RankXcel</Text>
          </View>
          <View style={homeStyles.headerButtons}>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={homeStyles.loginBtn}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={homeStyles.signupFreeBtn}
              onPress={() => router.push('/auth/sign-up')}
            >
              <Text style={homeStyles.signupFreeText}>Sign Up Free</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={homeStyles.heroSection}>
          <View style={homeStyles.badge}>
            <Text style={homeStyles.badgeText}>
              {homeData.hero.badge}
            </Text>
          </View>
          <Text style={homeStyles.mainTitle}>
            {homeData.hero.title1}
          </Text>
          <Text style={homeStyles.highlightTitle}>
            {homeData.hero.title2}
          </Text>
          <Text style={homeStyles.description}>
            {homeData.hero.description}
          </Text>

          <TouchableOpacity
            style={homeStyles.startBtn}
            onPress={() => router.push('/auth/sign-up')}
          >
            <Text style={homeStyles.startBtnText}>Start Free — No Card Needed →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={homeStyles.outlineLoginBtn}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={homeStyles.outlineLoginText}>Log In</Text>
          </TouchableOpacity>

          {/* Features Grid */}
          <View style={homeStyles.featuresGrid}>
            <View style={homeStyles.featureRow}>
              <View style={homeStyles.featureItem}>
                <Text style={homeStyles.checkmark}>✓</Text>
                <Text style={homeStyles.featureText}>NTA-accurate interface</Text>
              </View>
              <View style={homeStyles.featureItem}>
                <Text style={homeStyles.checkmark}>✓</Text>
                <Text style={homeStyles.featureText}>Dual-verified solutions</Text>
              </View>
            </View>
            <View style={homeStyles.featureRow}>
              <View style={homeStyles.featureItem}>
                <Text style={homeStyles.checkmark}>✓</Text>
                <Text style={homeStyles.featureText}>No credit card required</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section — 2×2 grid */}
        <View style={homeStyles.statsSection}>
          <View style={homeStyles.statsRow}>
            <View style={homeStyles.statCard}>
              <Text style={homeStyles.statNumber}>50,000+</Text>
              <Text style={homeStyles.statLabel}>JEE Aspirants</Text>
            </View>
            <View style={homeStyles.statCard}>
              <Text style={homeStyles.statNumber}>10,000+</Text>
              <Text style={homeStyles.statLabel}>Verified Questions</Text>
            </View>
          </View>
          <View style={homeStyles.statsRow}>
            <View style={homeStyles.statCard}>
              <Text style={homeStyles.statNumber}>99.4%</Text>
              <Text style={homeStyles.statLabel}>Solution Accuracy</Text>
            </View>
            <View style={homeStyles.statCard}>
              <Text style={homeStyles.statNumber}>2.3×</Text>
              <Text style={homeStyles.statLabel}>Avg Score Improvement</Text>
            </View>
          </View>
        </View>

        {/* How It Works Section */}
        <View style={homeStyles.howItWorksSection}>
          <Text style={homeStyles.sectionTitle}>How It Works</Text>
          <Text style={homeStyles.sectionSubtitle}>
            A closed-loop improvement cycle designed to convert mock performance into rank gain.
          </Text>

          {/* Step 01 */}
          <View style={homeStyles.stepCard}>
            <View style={homeStyles.stepHeader}>
              <View style={homeStyles.stepPill}>
                <Text style={homeStyles.stepPillText}>01</Text>
              </View>
              <Text style={homeStyles.stepIcon}>📋</Text>
            </View>
            <Text style={homeStyles.stepTitle}>Take a Full-Length Mock</Text>
            <Text style={homeStyles.stepDescription}>
              Simulate the real JEE Main experience with NTA-accurate interface, timing, and negative marking. No shortcuts.
            </Text>
          </View>

          {/* Step 02 */}
          <View style={homeStyles.stepCard}>
            <View style={homeStyles.stepHeader}>
              <View style={homeStyles.stepPill}>
                <Text style={homeStyles.stepPillText}>02</Text>
              </View>
              <Text style={homeStyles.stepIcon}>🤖</Text>
            </View>
            <Text style={homeStyles.stepTitle}>Get AI-Powered Diagnosis</Text>
            <Text style={homeStyles.stepDescription}>
              Every wrong answer is classified — Concept Error, Formula Misuse, Calculation Slip, or Time Pressure. Know exactly why you lost marks.
            </Text>
          </View>

          {/* Step 03 */}
          <View style={homeStyles.stepCard}>
            <View style={homeStyles.stepHeader}>
              <View style={homeStyles.stepPill}>
                <Text style={homeStyles.stepPillText}>03</Text>
              </View>
              <Text style={homeStyles.stepIcon}>📈</Text>
            </View>
            <Text style={homeStyles.stepTitle}>Close the Gap. Earn the Rank.</Text>
            <Text style={homeStyles.stepDescription}>
              Targeted retest sets, spaced repetition, and personalized study plans turn your weak areas into score gains.
            </Text>
          </View>
        </View>

        {/* Features / Built for aspirants Section */}
        <View style={homeStyles.featuresSection}>
          <Text style={homeStyles.sectionTitle}>Built for aspirants who want more than a rank list</Text>
          <Text style={homeStyles.sectionSubtitle}>
            Every feature is designed around one question: what would actually move your score?
          </Text>

          {/* Feature Card 1 — Precision Mistake Analysis */}
          <View style={homeStyles.featureCard}>
            <View style={homeStyles.featureIconWrap}>
              <Text style={homeStyles.featureCardIcon}>🎯</Text>
            </View>
            <Text style={homeStyles.featureCardTitle}>Precision Mistake Analysis</Text>
            <Text style={homeStyles.featureCardDesc}>
              {`Not just "wrong answer" — the AI tells you if it was a concept gap, a formula error, or a calculation mistake, and shows you exactly where your reasoning diverged.`}
            </Text>
            <View style={homeStyles.checklist}>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Error type classification</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Cross-mock pattern detection</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Step-by-step divergence view</Text>
              </View>
            </View>
          </View>

          {/* Feature Card 2 — Dual-Verified AI Solutions */}
          <View style={homeStyles.featureCard}>
            <View style={homeStyles.featureIconWrap}>
              <Text style={homeStyles.featureCardIcon}>🛡️</Text>
            </View>
            <Text style={homeStyles.featureCardTitle}>Dual-Verified AI Solutions</Text>
            <Text style={homeStyles.featureCardDesc}>
              {`Every solution passes two checks: a CAS (Computer Algebra System) verification and an independent AI pass. The "Dual Verified" badge means you can trust it.`}
            </Text>
            <View style={homeStyles.checklist}>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>CAS mathematical verification</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Independent LLM re-solve</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Flag any solution for expert review</Text>
              </View>
            </View>
          </View>

          {/* Feature Card 3 — Weak Area Intelligence */}
          <View style={homeStyles.featureCard}>
            <View style={homeStyles.featureIconWrap}>
              <Text style={homeStyles.featureCardIcon}>📊</Text>
            </View>
            <Text style={homeStyles.featureCardTitle}>Weak Area Intelligence</Text>
            <Text style={homeStyles.featureCardDesc}>
              A topic mastery heatmap shows every chapter color-coded by accuracy. Drill into sub-topics, see your error rate, and get an AI-ranked list of highest-ROI improvements.
            </Text>
            <View style={homeStyles.checklist}>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Sub-topic granularity</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Improvement velocity tracking</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Spaced retest scheduling</Text>
              </View>
            </View>
          </View>

          {/* Feature Card 4 — Exam Strategy Engine */}
          <View style={homeStyles.featureCard}>
            <View style={homeStyles.featureIconWrap}>
              <Text style={homeStyles.featureCardIcon}>⚡</Text>
            </View>
            <Text style={homeStyles.featureCardTitle}>Exam Strategy Engine</Text>
            <Text style={homeStyles.featureCardDesc}>
              Two students with identical knowledge can score 30+ marks apart based purely on strategy. The Strategy Intelligence module optimizes your attempt order and time allocation.
            </Text>
            <View style={homeStyles.checklist}>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Attempt order optimizer</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Section time allocation trainer</Text>
              </View>
              <View style={homeStyles.checklistItem}>
                <Text style={homeStyles.checkmarkGreen}>✓</Text>
                <Text style={homeStyles.checklistText}>Time-drain question identification</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Testimonials Section — 3 separate cards */}
        <View style={homeStyles.testimonialSection}>
          <Text style={homeStyles.sectionTitle}>Aspirants who trusted the data</Text>
          <Text style={homeStyles.sectionSubtitle}>Real results from real JEE prep.</Text>

          <View style={homeStyles.testimonialCard}>
            <Text style={homeStyles.stars}>★★★★★</Text>
            <Text style={homeStyles.testimonialText}>
              {`"The mistake analysis is like having a JEE topper coach who watches every single question you attempt. My Rotational Mechanics accuracy went from 28% to 71% in 3 weeks."`}
            </Text>
            <Text style={homeStyles.testimonialAuthorName}>Arjun M.</Text>
            <Text style={homeStyles.testimonialAuthorSub}>AIR 2847 | JEE Main Jan 2025</Text>
          </View>

          <View style={homeStyles.testimonialCard}>
            <Text style={homeStyles.stars}>★★★★★</Text>
            <Text style={homeStyles.testimonialText}>
              {`"I had done 60+ mocks on other platforms. RankXcel was the first one that told me I have a specific formula misuse pattern in Electrochemistry — not just 'you're weak in Chemistry'."`}
            </Text>
            <Text style={homeStyles.testimonialAuthorName}>Kavya S.</Text>
            <Text style={homeStyles.testimonialAuthorSub}>99.2 percentile | Drop Year Student</Text>
          </View>

          <View style={homeStyles.testimonialCard}>
            <Text style={homeStyles.stars}>★★★★★</Text>
            <Text style={homeStyles.testimonialText}>
              {`"The dual-verified solutions are the real differentiator. I stopped second-guessing the answers I was studying from. That trust alone saved me hours."`}
            </Text>
            <Text style={homeStyles.testimonialAuthorName}>Rohan I.</Text>
            <Text style={homeStyles.testimonialAuthorSub}>JEE Main + BITSAT aspirant</Text>
          </View>
        </View>

        {/* CTA Section — dark navy background */}
        <View style={homeStyles.ctaSection}>
          <Text style={homeStyles.ctaTitle}>Ready to stop guessing and start improving?</Text>
          <Text style={homeStyles.ctaSubtitle}>
            Join 50,000+ aspirants who replaced random mock attempts with data-driven rank improvement.
          </Text>

          <TouchableOpacity
            style={homeStyles.createAccountBtn}
            onPress={() => router.push('/auth/sign-up')}
          >
            <Text style={homeStyles.createAccountText}>Create Free Account →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={homeStyles.alreadyAccountText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={homeStyles.footer}>
          <View style={homeStyles.footerLogoRow}>
            <View style={homeStyles.footerLogoIcon}>
              <Text style={homeStyles.footerLogoIconText}>RX</Text>
            </View>
            <Text style={homeStyles.footerLogo}>RankXcel</Text>
          </View>
          <Text style={homeStyles.footerDescription}>
            Excel Beyond Limits. Earn the Rank. A high-performance JEE exam intelligence platform.
          </Text>

          <View style={homeStyles.footerLinks}>
            <View style={homeStyles.footerColumn}>
              <Text style={homeStyles.footerHeading}>Product</Text>
              <Text style={homeStyles.footerLink}>Features</Text>
              <Text style={homeStyles.footerLink}>Pricing</Text>
              <Text style={homeStyles.footerLink}>How It Works</Text>
            </View>
            <View style={homeStyles.footerColumn}>
              <Text style={homeStyles.footerHeading}>Legal</Text>
              <Text style={homeStyles.footerLink}>Privacy Policy</Text>
              <Text style={homeStyles.footerLink}>Terms of Service</Text>
            </View>
            <View style={homeStyles.footerColumn}>
              <Text style={homeStyles.footerHeading}>Account</Text>
              <Text style={homeStyles.footerLink}>Sign Up</Text>
              <Text style={homeStyles.footerLink}>Log In</Text>
            </View>
          </View>

          <Text style={homeStyles.copyright}>© 2026 RankXcel. All rights reserved. Built for JEE aspirants.</Text>
        </View>

      </ScrollView>
    </View>
  );
};

export default HomeScreen;