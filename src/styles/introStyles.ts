import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

// Theme tokens mirrored from the MockExams design (light theme)
export const INTRO = {
  width,
  bg: '#EEF0FB',
  ink: '#16142E',
  ink2: '#56546F',
  ink3: '#807E95',
  accent: '#5B4BFF',
  line2: '#D9DBEC',
  white: '#FFFFFF',
};

export const introStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: INTRO.bg,
  },

  // Top bar (Skip)
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  skipBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  skipText: {
    color: INTRO.ink3,
    fontWeight: '700',
    fontSize: 15,
  },

  // Carousel
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  iconTile: {
    width: 168,
    height: 168,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    // colored elevation set inline per-slide tint
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  iconTileGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    opacity: 0.16,
  },
  iconTileSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: INTRO.ink,
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  sub: {
    color: INTRO.ink2,
    fontSize: 15.5,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },

  // Footer
  footer: {
    paddingHorizontal: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginBottom: 26,
  },
  dot: {
    height: 8,
    borderRadius: 99,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 99,
    backgroundColor: INTRO.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: INTRO.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  primaryBtnText: {
    color: INTRO.white,
    fontSize: 17,
    fontWeight: '700',
  },
  haveAccountBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  haveAccountText: {
    color: INTRO.ink2,
    fontWeight: '700',
    fontSize: 14.5,
  },
});
