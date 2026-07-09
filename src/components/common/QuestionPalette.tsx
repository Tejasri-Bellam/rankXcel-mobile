import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { questionPaletteStyles as styles } from '@/src/styles/styles/common/questionpalettestyles';

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
              <View style={[styles.legendDot, { backgroundColor: '#DBEAFE', borderColor: '#6C63FF' }]} />
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
