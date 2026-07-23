// src/components/common/FlagQuestionModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  QuestionReportIssueType,
  reportQuestionService,
} from "@/src/libs/services/questionReports";

export interface FlagChoiceOption {
  id: string;
  label: string;
  text: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  questionId: number | string | undefined;
  questionNumber?: number;
  // Pass the current question's options (only needed for choice-based
  // questions; omit/empty for NUMERICAL questions).
  choices?: FlagChoiceOption[];
  onSubmitted?: () => void;
}

const ISSUE_TYPES: { value: QuestionReportIssueType; label: string }[] = [
  { value: "QUESTION_TEXT", label: "Issue with question text" },
  { value: "CHOICE", label: "Issue with an answer choice" },
  { value: "CORRECT_ANSWER", label: "Incorrect answer" },
  { value: "IMAGE", label: "Image issue" },
  { value: "OTHER", label: "Other" },
];

const MAX_DESC = 500;

export default function FlagQuestionModal({
  visible,
  onClose,
  questionId,
  questionNumber,
  choices,
  onSubmitted,
}: Props) {
  const [issueType, setIssueType] = useState<QuestionReportIssueType | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const reset = () => {
    setIssueType(null);
    setSelectedChoiceId(null);
    setDescription("");
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  useEffect(() => {
    if (visible) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
    }, [visible]);

  const isChoiceIssue = issueType === "CHOICE";
  const isOtherIssue = issueType === "OTHER";
  const descRequired = isOtherIssue;

  const isValid =
    !!issueType &&
    (!isChoiceIssue || !!selectedChoiceId) &&
    (!descRequired || description.trim().length > 0);

  const handleSubmit = async () => {
    if (!isValid || submitting || !issueType || questionId == null) return;
    try {
      setSubmitting(true);
      const payload: QuestionReportPayloadWithOptionalChoice = {
        issue_type: issueType,
        description: description.trim() || undefined,
      };
      if (isChoiceIssue && selectedChoiceId) {
        payload.choice = Number(selectedChoiceId);
      }
      await reportQuestionService(questionId, payload);
      reset();
      onSubmitted?.();
      onClose();
    } catch (e) {
      console.log("FLAG QUESTION ERROR:", e);
      setSubmitting(false);
    }
  };

  return (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.flagBadge}>
              <Ionicons name="flag" size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                Flag Question{questionNumber ? ` ${questionNumber}` : ""}
              </Text>
              <Text style={styles.subtitle}>
                Tell us what&apos;s wrong — our team will review it.
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>WHAT&apos;S THE ISSUE?</Text>
          <View style={{ gap: 8, marginBottom: 6 }}>
            {ISSUE_TYPES.map((opt) => {
              const selected = issueType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.radioRow, selected && styles.radioRowSelected]}
                  onPress={() => {
                    setIssueType(opt.value);
                    if (opt.value !== "CHOICE") setSelectedChoiceId(null);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.radioText, selected && styles.radioTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isChoiceIssue && (
            <View style={{ marginTop: 10, marginBottom: 6 }}>
              <Text style={styles.sectionLabel}>
                WHICH CHOICE? <Text style={styles.requiredText}>(required)</Text>
              </Text>
              <View style={{ gap: 8 }}>
                {(choices ?? []).map((c) => {
                  const selected = selectedChoiceId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.choiceRow, selected && styles.choiceRowSelected]}
                      onPress={() => setSelectedChoiceId(c.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.choiceLetter, selected && styles.choiceLetterSelected]}>
                        <Text style={[styles.choiceLetterText, selected && styles.choiceLetterTextSelected]}>
                          {c.label}
                        </Text>
                      </View>
                      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]} numberOfLines={2}>
                        {c.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionLabel}>
              ADDITIONAL DETAILS{" "}
              <Text style={descRequired ? styles.requiredText : styles.optionalText}>
                {descRequired ? "(required)" : "(optional)"}
              </Text>
            </Text>
            <TextInput
              style={styles.textarea}
              placeholder="Describe the issue briefly..."
              placeholderTextColor="#B0B3BD"
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, MAX_DESC))}
              multiline
              numberOfLines={4}
              maxLength={MAX_DESC}
              textAlignVertical="top"
              // Scroll the textarea (and the footer below it) up above the
              // keyboard once it gains focus — otherwise it's the last thing
              // in the ScrollView and the keyboard covers it and the footer.
              onFocus={() =>
                setTimeout(
                  () => scrollRef.current?.scrollToEnd({ animated: true }),
                  150,
                )
              }
            />
            <Text style={styles.charCount}>
              {description.length}/{MAX_DESC}
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            disabled={submitting}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="flag" size={14} color={isValid ? "#fff" : "#9CA3AF"} />
                <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
                  Submit Flag
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
}

// Local type alias so `choice` can be added conditionally without `any`.
type QuestionReportPayloadWithOptionalChoice = {
  issue_type: QuestionReportIssueType;
  description?: string;
  choice?: number;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 300,
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingTop: 18,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F5",
  },
  headerLeft: { flexDirection: "row", flex: 1, gap: 10 },
  flagBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "800", color: "#1A1A2E" },
  subtitle: { fontSize: 11.5, color: "#9CA3AF", marginTop: 2, lineHeight: 15 },
  closeBtn: { padding: 2 },
  body: { paddingHorizontal: 18, paddingTop: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  requiredText: { color: "#EF4444", fontWeight: "700" },
  optionalText: { color: "#B0B3BD", fontWeight: "600" },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  radioRowSelected: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: "#F59E0B" },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#F59E0B" },
  radioText: { fontSize: 13.5, fontWeight: "600", color: "#4B5563" },
  radioTextSelected: { color: "#B45309" },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  choiceRowSelected: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  choiceLetter: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  choiceLetterSelected: { borderColor: "#F59E0B", backgroundColor: "#F59E0B" },
  choiceLetterText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  choiceLetterTextSelected: { color: "#fff" },
  choiceText: { flex: 1, fontSize: 13, fontWeight: "500", color: "#374151" },
  choiceTextSelected: { color: "#B45309", fontWeight: "600" },
  textarea: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 13.5,
    color: "#1A1A2E",
    backgroundColor: "#fff",
  },
  charCount: { fontSize: 10.5, color: "#B0B3BD", textAlign: "right", marginTop: 4 },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F2F5",
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  cancelText: { fontSize: 13.5, fontWeight: "700", color: "#4B5563" },
  submitBtn: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#F59E0B",
  },
  submitBtnDisabled: { backgroundColor: "#F3F4F6" },
  submitText: { fontSize: 13.5, fontWeight: "700", color: "#fff" },
  submitTextDisabled: { color: "#9CA3AF" },
});