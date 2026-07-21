import { StyleSheet } from 'react-native';

export const legalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF1FB',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginTop: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 22,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    paddingHorizontal: 22,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    paddingHorizontal: 22,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#DCE6F4',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    marginHorizontal: 22,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
  },

  scroll: {
    flex: 1,
    marginTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
});