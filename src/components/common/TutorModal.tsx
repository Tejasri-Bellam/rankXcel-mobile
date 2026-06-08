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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { stripHtml } from "@/src/libs/utils/html";

export interface TutorPayload {
  question_id?: number | string;
  message: string;
}

interface TutorSource {
  pdf: string;
  page?: number;
}

interface ChatMessage {
  role: "user" | "tutor";
  text: string;
  sources?: TutorSource[];
  isGrounded?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  questionId?: number | string;
  questionText?: string;
  // Calls the tutor endpoint and returns the raw response.
  ask: (payload: TutorPayload) => Promise<any>;
}

interface TutorReply {
  text: string;
  sources: TutorSource[];
  isGrounded?: boolean;
}

// Tutor response shape: { content, sources: [{ pdf, page }], is_grounded }.
// Kept tolerant of the older field names in case the backend varies.
const parseTutorReply = (res: any): TutorReply => {
  const body =
    res && typeof res === "object" && "data" in res ? (res as any).data : res;

  if (body == null) return { text: "", sources: [] };
  if (typeof body === "string") return { text: body, sources: [] };

  const text =
    body.content ??
    body.response ??
    body.message ??
    body.answer ??
    body.reply ??
    body.text ??
    body.explanation ??
    "";

  const sourcesRaw = Array.isArray(body.sources) ? body.sources : [];
  const seen = new Set<string>();
  const sources: TutorSource[] = [];
  sourcesRaw.forEach((s: any) => {
    const pdf = s?.pdf ?? s?.file ?? s?.source;
    if (!pdf) return;
    const page = s?.page;
    const key = `${pdf}#${page ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    sources.push({ pdf: String(pdf), page: page != null ? Number(page) : undefined });
  });

  return {
    text: typeof text === "string" ? text : "",
    sources,
    isGrounded: typeof body.is_grounded === "boolean" ? body.is_grounded : undefined,
  };
};

// "Units_Measurements_and_Motion_www.jeebooks.in.pdf" → "Units Measurements and Motion"
const prettyPdfName = (pdf: string): string =>
  pdf
    .replace(/\.pdf$/i, "")
    .replace(/_www\.[^_]+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

const QUICK_PROMPTS = [
  "Explain this question step by step",
  "Why is my answer wrong?",
  "Give me a hint",
];

export default function TutorModal({
  visible,
  onClose,
  questionId,
  questionText,
  ask,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Reset the conversation each time the modal is opened for a question.
  useEffect(() => {
    if (visible) {
      setMessages([]);
      setInput("");
      setLoading(false);
    }
  }, [visible, questionId]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setLoading(true);
    try {
      // Spec expects a numeric question_id (e.g. 42); coerce when numeric.
      const qid =
        questionId != null && Number.isFinite(Number(questionId))
          ? Number(questionId)
          : questionId;
      const res = await ask({ question_id: qid, message });
      const reply = parseTutorReply(res);
      setMessages((prev) => [
        ...prev,
        {
          role: "tutor",
          text:
            reply.text || "Sorry, I couldn't generate a response. Please try again.",
          sources: reply.sources,
          isGrounded: reply.isGrounded,
        },
      ]);
    } catch (err: any) {
      // Surface the real error so failures are diagnosable instead of generic.
      console.log("TUTOR ERROR:", JSON.stringify(err, null, 2));
      const detail =
        err?.errors?.nonFieldErrors?.[0] ??
        err?.body?.detail ??
        err?.message ??
        "Something went wrong reaching the tutor. Please try again.";
      const status = err?.status ? ` (status ${err.status})` : "";
      setMessages((prev) => [
        ...prev,
        { role: "tutor", text: `${detail}${status}` },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="sparkles" size={16} color="#3B7DF8" />
            <Text style={styles.headerTitle}>AI Tutor</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {!!questionText && (
              <View style={styles.questionCard}>
                <Text style={styles.questionLabel}>QUESTION</Text>
                <Text style={styles.questionText}>{stripHtml(questionText)}</Text>
              </View>
            )}

            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Ask the tutor anything about this question.
                </Text>
                <View style={styles.quickWrap}>
                  {QUICK_PROMPTS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={styles.quickChip}
                      onPress={() => send(p)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.quickChipText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {messages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  m.role === "user" ? styles.bubbleUser : styles.bubbleTutor,
                ]}
              >
                <Text style={m.role === "user" ? styles.bubbleUserText : styles.bubbleTutorText}>
                  {m.text}
                </Text>

                {m.role === "tutor" && !!m.sources?.length && (
                  <View style={styles.sourcesBox}>
                    <Text style={styles.sourcesLabel}>SOURCES</Text>
                    {m.sources.map((s, si) => (
                      <View key={si} style={styles.sourceRow}>
                        <Ionicons name="document-text-outline" size={12} color="#6B7280" />
                        <Text style={styles.sourceText} numberOfLines={1}>
                          {prettyPdfName(s.pdf)}
                          {s.page != null ? ` · p.${s.page}` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {m.role === "tutor" && m.isGrounded === false && (
                  <Text style={styles.notGroundedNote}>
                    Not based on course material — verify independently.
                  </Text>
                )}
              </View>
            ))}

            {loading && (
              <View style={[styles.bubble, styles.bubbleTutor]}>
                <ActivityIndicator size="small" color="#3B7DF8" />
              </View>
            )}
          </ScrollView>

          {/* Composer */}
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question…"
              placeholderTextColor="#9CA3AF"
              multiline
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => send(input)}
              disabled={!input.trim() || loading}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EEEFF5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAF0",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A2E" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    marginBottom: 6,
  },
  questionText: { fontSize: 14, color: "#1A1A2E", lineHeight: 20 },
  emptyState: { paddingVertical: 12, gap: 12 },
  emptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  quickWrap: { gap: 8 },
  quickChip: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickChipText: { fontSize: 13, color: "#3B7DF8", fontWeight: "600" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#3B7DF8",
    borderBottomRightRadius: 4,
  },
  bubbleTutor: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  bubbleUserText: { fontSize: 14, color: "#fff", lineHeight: 20 },
  bubbleTutorText: { fontSize: 14, color: "#1A1A2E", lineHeight: 20 },
  sourcesBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
    gap: 4,
  },
  sourcesLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    marginBottom: 2,
  },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  sourceText: { fontSize: 11, color: "#6B7280", flex: 1 },
  notGroundedNote: {
    marginTop: 8,
    fontSize: 11,
    fontStyle: "italic",
    color: "#B45309",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EAEAF0",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    backgroundColor: "#F1F2F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1A1A2E",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B7DF8",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#BFD3F5" },
});
