export const COLORS = {
  primary: '#6C63FF',
  primaryLight: '#EEF0FF',
  background: '#F7F8FC',
  white: '#FFFFFF',
  textDark: '#1A1A2E',
  textMedium: '#4A4A6A',
  textLight: '#9898B0',
  green: '#22C55E',
  greenLight: '#DCFCE7',
  orange: '#F97316',
  orangeLight: '#FFF0E6',
  red: '#EF4444',
  redLight: '#FEE2E2',
  yellow: '#FBBF24',
  yellowLight: '#FEF9C3',
  border: '#E8E8F0',
  streakBg: '#FFF7ED',
  cardShadow: 'rgba(108, 99, 255, 0.08)',
  redBorder: '#FECACA',
  inputBg: '#F7F8FC',
  greenBg: '#F0FDF4',
  orangeBg: '#FFF7ED',
  gray: '#6B7280',
  grayBg: '#F3F4F6',
  redBg: '#FEF2F2',


} as const;

/**
 * Standard color scale for percentage / accuracy values across the app.
 *   0–29  -> red
 *   30–39 -> orange
 *   40–59 -> yellow
 *   60–100 -> green
 * Values are clamped, so null/undefined falls back to red.
 */
export const getScoreColor = (pct: number | null | undefined): string => {
  if (pct == null) return COLORS.red;
  if (pct < 30) return COLORS.red;
  if (pct < 40) return COLORS.orange;
  if (pct < 60) return COLORS.yellow;
  return COLORS.green;
};

/**
 * Light background variant matching {@link getScoreColor}, for badges/pills.
 */
export const getScoreBgColor = (pct: number | null | undefined): string => {
  if (pct == null) return COLORS.redLight;
  if (pct < 30) return COLORS.redLight;
  if (pct < 40) return COLORS.orangeLight;
  if (pct < 60) return COLORS.yellowLight;
  return COLORS.greenLight;
};