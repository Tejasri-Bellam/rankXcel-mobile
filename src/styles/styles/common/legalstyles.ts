import { StyleSheet } from 'react-native';

const PRIMARY = '#4F46E5';
const TEXT_DARK = '#0F0E2C';
const TEXT_GRAY = '#6B7280';

export const legalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },

  title: { fontSize: 26, fontWeight: '800', color: TEXT_DARK, marginBottom: 6 },
  subtitle: { fontSize: 13, color: TEXT_GRAY, marginBottom: 24, lineHeight: 19 },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  sectionBody: { fontSize: 13.5, lineHeight: 21, color: TEXT_GRAY },

  /* Tabs (kept, restyled to match marketing tab look) */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F2FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
  tabTextActive: { color: TEXT_DARK },
});