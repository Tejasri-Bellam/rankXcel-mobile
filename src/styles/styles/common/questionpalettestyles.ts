import { StyleSheet } from 'react-native';

export const questionPaletteStyles = StyleSheet.create({
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
    maxHeight: '78%',
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
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  cell: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEF0F4',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cellAnswered: { backgroundColor: '#DBEAFE', borderColor: '#BBD5FF' },
  cellMarked: { backgroundColor: '#FEF3C7', borderColor: '#FCE19A' },
  // Only override the border for the current cell so the status background
  // (answered/marked) still shows through.
  cellCurrent: { borderColor: '#1A1A2E', borderWidth: 2 },

  cellText: { fontSize: 16, fontWeight: '700', color: '#6B7280' },
  cellTextAnswered: { color: '#6C63FF' },
  cellTextMarked: { color: '#B45309' },
  cellTextCurrent: { color: '#1A1A2E' },
  cellMark: { position: 'absolute', top: 5, right: 5 },

  legend: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4, borderWidth: 1.5 },
  legendText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 16,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
