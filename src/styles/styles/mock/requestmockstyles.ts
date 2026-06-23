import { StyleSheet } from 'react-native';

export const requestMockStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', flex: 1, paddingRight: 12 },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 8, lineHeight: 19 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },

  // Segmented scope control
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F6',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  segmentTextActive: { color: '#1A1A2E', fontWeight: '700' },

  // Subject chips
  subjectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop:10 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  subjectChipActive: { borderColor: '#6366F1', backgroundColor: '#EEF0FF' },
  subjectEmoji: { fontSize: 8 },
  subjectText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  subjectTextActive: { color: '#4338CA' },
  emptySubjects: { fontSize: 13, color: '#9CA3AF', marginVertical: 8 },

  // Option chip rows (questions / difficulty / time)
  chipRow: { flexDirection: 'row', gap: 10 },
  optChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optChipActive: { borderColor: '#6366F1', backgroundColor: '#EEF0FF' },
  optChipText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  optChipTextActive: { color: '#4338CA' },

  // Custom count input + stepper
  customCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingLeft: 14,
    paddingRight: 6,
  },
  customCountInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  stepper: { justifyContent: 'center' },
  stepBtn: {
    width: 28,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Auto time-limit info box (full syllabus)
  infoBox: {
    marginTop: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoBoxText: { fontSize: 13, color: '#9CA3AF', lineHeight: 19 },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 17,
    marginTop: 28,
  },
  generateText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
