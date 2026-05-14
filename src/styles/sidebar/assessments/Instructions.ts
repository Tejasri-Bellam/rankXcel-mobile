import { StyleSheet } from 'react-native';

const ACCENT = '#6C5CE7';
const PRIMARY = '#1A1A2E';
const BORDER = '#EFEFEF';
const GRAY = '#9898B0';
const ORANGE = '#F97316';

export const examInstructionsStyles = StyleSheet.create({

  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackArrow: {
    fontSize: 18,
    color: PRIMARY,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY,
  },
  headerHint: {
    fontSize: 11,
    color: ORANGE,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  scrollContentWithBtn: {
    padding: 16,
    paddingBottom: 120,
  },

  // Instructions heading row
  instructionsHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  instructionsHeadIcon: {
    fontSize: 18,
  },
  instructionsHeadText: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    flex: 1,
  },

  // Instruction list item
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    color: '#4F46E5',
    width: 22,
    fontWeight: '700',
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    color: '#3A3A5A',
    lineHeight: 22,
    fontSize: 14,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: ACCENT,
  },
  checkboxUnchecked: {
    backgroundColor: '#fff',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    color: '#555',
    lineHeight: 22,
    fontSize: 14,
  },

  // Completed action buttons
  actionGroup: {
    marginTop: 8,
    gap: 10,
  },
  actionBtnPrimary: {
    backgroundColor: '#5B3DF5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnOutline: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  actionBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  actionBtnOutlineText: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 15,
  },

  // Bottom start button bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#fff',
  },
  startBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnEnabled: {
    backgroundColor: '#5B3DF5',
  },
  startBtnDisabled: {
    backgroundColor: '#D6D6E8',
  },
  startBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  startBtnHint: {
    textAlign: 'center',
    marginTop: 8,
    color: GRAY,
    fontSize: 12,
  },
});