import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type PaletteStatus = 'answered' | 'marked' | 'not_answered';

export interface PaletteItem {
  /** Stable key for the cell (usually the question id). */
  key: string;
  status: PaletteStatus;
  isCurrent: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Flat list of questions in display order. Index is passed back to onJump. */
  items: PaletteItem[];
  answeredCount: number;
  totalCount: number;
  onJump: (index: number) => void;
  onSubmit: () => void;
  /** Safe-area bottom inset so the sheet clears the home indicator. */
  insetsBottom?: number;
}

/**
 * Shared "Questions" bottom sheet used by both the mock and assessment exam
 * screens. Shows every question as a cell coloured by its status
 * (answered / marked / skipped) plus a jump-to action and a submit button.
 */
export default function QuestionPalette({
  visible,
  onClose,
  items,
  answeredCount,
  totalCount,
  onJump,
  onSubmit,
  insetsBottom = 0,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { paddingBottom: 20 + insetsBottom }]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Questions</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View style={styles.grid}>
              {items.map((item, idx) => {
                const answered = item.status === 'answered';
                const marked = item.status === 'marked';
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.cell,
                      answered && styles.cellAnswered,
                      marked && styles.cellMarked,
                      item.isCurrent && styles.cellCurrent,
                    ]}
                    onPress={() => onJump(idx)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        answered && styles.cellTextAnswered,
                        marked && styles.cellTextMarked,
                        item.isCurrent && styles.cellTextCurrent,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                    {marked && (
                      <Ionicons
                        name="bookmark"
                        size={11}
                        color="#F59E0B"
                        style={styles.cellMark}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#DBEAFE', borderColor: '#3B7DF8' }]} />
              <Text style={styles.legendText}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Marked</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} activeOpacity={0.85}>
            <Text style={styles.submitText}>
              Submit ({answeredCount}/{totalCount})
            </Text>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  cellTextAnswered: { color: '#3B7DF8' },
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
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 16,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
