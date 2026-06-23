import { StyleSheet } from 'react-native';

export const navigatorStyles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  errorIcon: { fontSize: 36, marginBottom: 16 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' },
  errorText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  retryBtn: { backgroundColor: '#3B7DF8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
  backText: { color: '#9CA3AF', fontSize: 14 },
});
