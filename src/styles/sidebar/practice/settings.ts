import { StyleSheet } from "react-native";
import { COLORS } from "../../styles";

export const settingsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  accuracy: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  diffBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  diffTextActive: {
    color: COLORS.white,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  timerOptional: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  timerInput: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    fontSize: 14,
    color: COLORS.textDark,
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.red,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  beginBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});