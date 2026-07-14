import { StyleSheet } from 'react-native';

export const requestMockStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', flex: 1, paddingRight: 12 },
  closeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 6, lineHeight: 17 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
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
    paddingVertical: 9,
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
  segmentText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  segmentTextActive: { color: '#1A1A2E', fontWeight: '700' },

  emptySubjects: { fontSize: 13, color: '#9CA3AF', marginVertical: 8 },

  // Subjects — label row with "Select all" + capsule chips
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectHeaderLabel: { marginBottom: 10, flex: 1 },
  selectAllText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  subjectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  subjectChipActive: { borderColor: '#6366F1', backgroundColor: '#6366F1' },
  subjectText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  subjectTextActive: { color: '#fff' },

  // Option chip rows (questions / difficulty / time)
  chipRow: { flexDirection: 'row', gap: 8 },
  optChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optChipActive: { borderColor: '#6366F1', backgroundColor: '#EEF0FF' },
  optChipText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  optChipTextActive: { color: '#4338CA' },
  // Edit (pencil) chip — toggles the custom count input.
  editChip: {
    width: 44,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    paddingVertical: 10,
    fontSize: 14,
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
    marginTop: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoBoxText: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },

  // Inline validation error shown directly below the field it belongs to.
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16,
    marginTop: 6,
  },
  // Form-level error (non-field / generation errors) shown above the submit button.
  formError: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  formErrorText: { fontSize: 12.5, color: '#B91C1C', lineHeight: 18 },

  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  generateText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
