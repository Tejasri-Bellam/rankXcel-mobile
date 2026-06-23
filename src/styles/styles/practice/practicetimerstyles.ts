import { StyleSheet } from 'react-native';
import { COLORS } from '@/src/styles/styles';

export const practiceTimerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
