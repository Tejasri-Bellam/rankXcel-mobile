import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const welcomeStyles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#1A1150',
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A1150',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },

  // Logo
  logoContainer: {
    marginBottom: 28,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#2D2080',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Welcome
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#A89FD6',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },

  // Cards Grid
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 36,
    gap: 12,
  },
  card: {
    width: (width - 48 - 12) / 2,
    backgroundColor: '#2D2080',
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#3D30A0',
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4C3DCE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: 12,
    color: '#9B8FCC',
    lineHeight: 16,
  },

  // Get Started Button
  getStartedButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1150',
    letterSpacing: 0.3,
  },

  // Skip
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#8A7FC0',
    textDecorationLine: 'underline',
  },
});
