import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { stripHtml } from "@/src/libs/utils/html";
import { tutorModalStyles as styles } from "@/src/styles/styles/common/tutormodalstyles";

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

// Conversation-based tutor flow (mock review). When provided, the modal opens a
// conversation, loads its history, then sends each message as a follow-up.
// All three calls return the raw API response — the modal does the parsing.
export interface ConversationApi {
  // POST then GET the question conversation; returns the raw GET response that
  // carries the conversation id (the modal extracts it).
  open: () => Promise<any>;
  // GET /conversations/{id}/follow-up-messages/ — prior chat history.
  loadHistory: (conversationId: string) => Promise<any>;
  // POST /conversations/{id}/follow-up-messages/ — send a message, get a reply.
  send: (conversationId: string, message: string) => Promise<any>;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  questionId?: number | string;
  questionText?: string;
  // Single-shot tutor endpoint (assessments). Returns the raw response.
  ask?: (payload: TutorPayload) => Promise<any>;
  // Conversation-based tutor (mock review). Takes precedence over `ask`.
  conversation?: ConversationApi;
}

interface TutorReply {
  text: string;
  sources: TutorSource[];
  isGrounded?: boolean;
}

// Tutor reply shapes seen from the backend:
//   • conversation follow-up: { content: { question, response }, ... }
//   • single-shot tutor:      { content: "...", sources, is_grounded }
// Kept tolerant of the older field names in case the backend varies.
const parseTutorReply = (res: any): TutorReply => {
  const body =
    res && typeof res === "object" && "data" in res ? (res as any).data : res;

  if (body == null) return { text: "", sources: [] };
  if (typeof body === "string") return { text: body, sources: [] };

  // `content` may be a plain string or a { question, response } object.
  const content = body.content;
  const contentObj = content && typeof content === "object" ? content : null;

  const text =
    (typeof content === "string" ? content : undefined) ??
    contentObj?.response ??
    contentObj?.answer ??
    contentObj?.text ??
    body.response ??
    body.message ??
    body.answer ??
    body.reply ??
    body.text ??
    body.explanation ??
    "";

  const sourcesRaw = Array.isArray(body.sources)
    ? body.sources
    : Array.isArray(contentObj?.sources)
    ? contentObj.sources
    : [];
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

  const isGrounded =
    typeof body.is_grounded === "boolean"
      ? body.is_grounded
      : typeof contentObj?.is_grounded === "boolean"
      ? contentObj.is_grounded
      : undefined;

  return {
    text: typeof text === "string" ? text : "",
    sources,
    isGrounded,
  };
};

// Pull a conversation id out of either the POST (start) or GET (retrieve)
// response. Tolerant of where the id lives since the spec omits the schema.
const extractConversationId = (res: any): string | null => {
  const body = res && typeof res === "object" && "data" in res ? res.data : res;
  if (body == null) return null;
  if (typeof body === "string") return body;
  const id =
    body.conversation_id ??
    body.conversationId ??
    body.id ??
    body.conversation?.id ??
    body.conversation?.conversation_id ??
    null;
  return id != null ? String(id) : null;
};

// Normalize the follow-up-messages history into chat bubbles. Handles both a
// role-tagged list and rows that pair a user message with the tutor's reply.
const parseHistoryMessages = (res: any): ChatMessage[] => {
  const body = res && typeof res === "object" && "data" in res ? res.data : res;
  const list: any[] = Array.isArray(body)
    ? body
    : body?.results ?? body?.messages ?? body?.follow_up_messages ?? [];
  const out: ChatMessage[] = [];
  list.forEach((item: any) => {
    if (!item) return;
    const role = item.role ?? item.sender ?? (item.is_user ? "user" : undefined);
    if (role) {
      const text = item.content ?? item.message ?? item.text ?? item.answer ?? "";
      const isUser = role === "user" || role === "student";
      const reply = isUser ? null : parseTutorReply(item);
      out.push({
        role: isUser ? "user" : "tutor",
        text: typeof text === "string" && text ? text : reply?.text ?? "",
        sources: reply?.sources,
        isGrounded: reply?.isGrounded,
      });
      return;
    }
    // Paired row: a user question alongside the tutor's answer. The follow-up
    // endpoint nests both under `content`: { question, response }.
    const content =
      item.content && typeof item.content === "object" ? item.content : null;
    const userText =
      content?.question ??
      item.message ??
      item.question ??
      item.user_message ??
      item.prompt;
    if (typeof userText === "string" && userText.trim())
      out.push({ role: "user", text: userText });
    const reply = parseTutorReply(item);
    if (reply.text)
      out.push({
        role: "tutor",
        text: reply.text,
        sources: reply.sources,
        isGrounded: reply.isGrounded,
      });
  });
  return out;
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
  conversation,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Conversation mode: id of the active conversation, and whether we're still
  // starting it / loading its history.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Reset on open, then (in conversation mode) start the conversation and load
  // its history. Plain `ask` mode just starts from a blank chat each time.
  useEffect(() => {
    if (!visible) return;
    setMessages([]);
    setInput("");
    setLoading(false);
    setConversationId(null);

    if (!conversation) {
      setInitializing(false);
      return;
    }

    let cancelled = false;
    setInitializing(true);
    (async () => {
      try {
        const opened = await conversation.open();
        if (cancelled) return;
        const cid = extractConversationId(opened);
        setConversationId(cid);
        if (cid) {
          const history = await conversation.loadHistory(cid);
          if (cancelled) return;
          setMessages(parseHistoryMessages(history));
        }
      } catch (err) {
        console.log("TUTOR INIT ERROR:", JSON.stringify(err, null, 2));
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, questionId, conversation]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading || initializing) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setLoading(true);
    try {
      let res: any;
      if (conversation) {
        // Ensure we have a conversation id even if init hadn't resolved one.
        let cid = conversationId;
        if (!cid) {
          cid = extractConversationId(await conversation.open());
          setConversationId(cid);
        }
        if (!cid) throw new Error("Couldn't start the tutor conversation.");
        res = await conversation.send(cid, message);
      } else if (ask) {
        // Spec expects a numeric question_id (e.g. 42); coerce when numeric.
        const qid =
          questionId != null && Number.isFinite(Number(questionId))
            ? Number(questionId)
            : questionId;
        res = await ask({ question_id: qid, message });
      } else {
        throw new Error("Tutor is unavailable.");
      }
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

            {initializing && (
              <View style={styles.initRow}>
                <ActivityIndicator size="small" color="#3B7DF8" />
                <Text style={styles.emptyText}>Loading conversation…</Text>
              </View>
            )}

            {!initializing && messages.length === 0 && (
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
              style={[
                styles.sendBtn,
                (!input.trim() || loading || initializing) && styles.sendBtnDisabled,
              ]}
              onPress={() => send(input)}
              disabled={!input.trim() || loading || initializing}
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
