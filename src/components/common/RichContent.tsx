/**
 * The one renderer for question content — question text, option text,
 * assertion/reason and explanations.
 *
 * Those fields are Tiptap-authored **HTML**, and every equation in them is a
 * `<math-field data-latex="...">` custom element (see `richContent.ts`). This
 * component parses that markup and renders it two ways:
 *
 *   - **No equations** (the common case): a native `<Text>` tree. No WebView is
 *     mounted at all, so lists of 90 questions stay as cheap as before.
 *   - **Equations present**: one WebView per block, showing KaTeX markup that
 *     was typeset on the JS thread. HTML flow gives us what native text cannot —
 *     inline math that sits on the sentence's baseline and wraps with the words
 *     around it.
 *
 * Everything renders from on-device assets, so math is correct in airplane mode.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { useKatexAssets } from '@/src/libs/katex/katexAssets';
import { KATEX_CSS } from '@/src/libs/katex/katexCss';
import { nodesToHtml } from '@/src/libs/katex/mathHtml';
import { parseRichContent, type RichDoc, type RichNode } from '@/src/libs/utils/richContent';

type Props = {
  /** Raw HTML from the API. */
  html?: string | null;
  /** Font size, colour, weight and alignment are read from here and mirrored
   *  into the WebView, so both render paths match their surroundings. */
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** Native path only — for truncated previews. */
  numberOfLines?: number;
};

const DEFAULT_FONT_SIZE = 15;
const DEFAULT_COLOR = '#1A1A2E';
const DEFAULT_LINE_HEIGHT_RATIO = 1.45;

export default function RichContent({ html, style, containerStyle, numberOfLines }: Props) {
  const doc = useRichDoc(html);
  const flat = useMemo(() => StyleSheet.flatten(style) ?? {}, [style]);

  if (!doc.hasMath) {
    if (!doc.nodes.length) return null;
    return (
      <NativeRich doc={doc} style={style} containerStyle={containerStyle} numberOfLines={numberOfLines} />
    );
  }

  return <MathRich doc={doc} flatStyle={flat} containerStyle={containerStyle} />;
}

/**
 * Parsing is pure and the same HTML re-renders constantly (every option
 * re-renders when the selection changes), so results are shared process-wide
 * rather than per component instance.
 */
const DOC_CACHE = new Map<string, RichDoc>();
const DOC_CACHE_LIMIT = 400;

function useRichDoc(html?: string | null): RichDoc {
  return useMemo(() => {
    const key = typeof html === 'string' ? html : '';
    const cached = DOC_CACHE.get(key);
    if (cached) return cached;
    const doc = parseRichContent(key);
    if (DOC_CACHE.size >= DOC_CACHE_LIMIT) DOC_CACHE.delete(DOC_CACHE.keys().next().value!);
    DOC_CACHE.set(key, doc);
    return doc;
  }, [html]);
}

/* ── Native path ──────────────────────────────────────────────────────── */

type Block = { key: string; bullet?: string; nodes: RichNode[] };

/** Splits the tree into paragraph/list-item blocks of inline content. */
function toBlocks(nodes: RichNode[]): Block[] {
  const blocks: Block[] = [];
  let inline: RichNode[] = [];

  const flushInline = () => {
    if (inline.length) {
      blocks.push({ key: `b${blocks.length}`, nodes: inline });
      inline = [];
    }
  };

  for (const node of nodes) {
    if (node.kind === 'el' && node.tag === 'p') {
      flushInline();
      if (node.children.length) blocks.push({ key: `b${blocks.length}`, nodes: node.children });
    } else if (node.kind === 'el' && (node.tag === 'ul' || node.tag === 'ol')) {
      flushInline();
      let index = 0;
      for (const item of node.children) {
        if (item.kind !== 'el' || item.tag !== 'li') continue;
        index += 1;
        blocks.push({
          key: `b${blocks.length}`,
          bullet: node.tag === 'ol' ? `${index}. ` : '•  ',
          nodes: item.children,
        });
      }
    } else {
      inline.push(node);
    }
  }
  flushInline();
  return blocks;
}

function NativeRich({
  doc,
  style,
  containerStyle,
  numberOfLines,
}: {
  doc: RichDoc;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  numberOfLines?: number;
}) {
  const blocks = useMemo(() => toBlocks(doc.nodes), [doc]);

  if (blocks.length === 1 && !blocks[0].bullet) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {renderInline(blocks[0].nodes, 'n')}
      </Text>
    );
  }

  return (
    <View style={containerStyle}>
      {blocks.map((block, index) => (
        <Text
          key={block.key}
          style={[style, index > 0 && styles.blockGap]}
          numberOfLines={numberOfLines}
        >
          {block.bullet}
          {renderInline(block.nodes, block.key)}
        </Text>
      ))}
    </View>
  );
}

const INLINE_STYLES: Record<string, TextStyle> = {
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
  // React Native `Text` has no vertical-align, so sub/sup are approximated by
  // size alone. Anything that needs true positioning is authored as math.
  sub: { fontSize: 11 },
  sup: { fontSize: 11 },
};

function renderInline(nodes: RichNode[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  nodes.forEach((node, index) => {
    const key = `${keyPrefix}.${index}`;
    switch (node.kind) {
      case 'text':
        out.push(node.text);
        break;
      case 'br':
        out.push('\n');
        break;
      case 'math':
        // Unreachable on this path: `hasMath` routes to the WebView renderer.
        // Never fall back to printing the LaTeX source.
        break;
      case 'img':
        out.push(<Image key={key} source={{ uri: node.src }} style={styles.inlineImage} />);
        break;
      case 'el':
        out.push(
          <Text key={key} style={INLINE_STYLES[node.tag]}>
            {renderInline(node.children, key)}
          </Text>,
        );
        break;
    }
  });
  return out;
}

/* ── Math path ────────────────────────────────────────────────────────── */

type Payload = {
  html: string;
  color: string;
  fontSize: number;
  lineHeight: number;
  fontWeight?: string;
  textAlign?: string;
};

function MathRich({
  doc,
  flatStyle,
  containerStyle,
}: {
  doc: RichDoc;
  flatStyle: TextStyle;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const assets = useKatexAssets();
  const fontSize = typeof flatStyle.fontSize === 'number' ? flatStyle.fontSize : DEFAULT_FONT_SIZE;
  const color = typeof flatStyle.color === 'string' ? flatStyle.color : DEFAULT_COLOR;

  const payload = useMemo<Payload>(
    () => ({
      html: nodesToHtml(doc.nodes),
      color,
      fontSize,
      // React Native line heights are absolute; CSS wants a ratio.
      lineHeight:
        typeof flatStyle.lineHeight === 'number' && flatStyle.lineHeight > 0
          ? flatStyle.lineHeight / fontSize
          : DEFAULT_LINE_HEIGHT_RATIO,
      fontWeight: flatStyle.fontWeight != null ? String(flatStyle.fontWeight) : undefined,
      textAlign: typeof flatStyle.textAlign === 'string' ? flatStyle.textAlign : undefined,
    }),
    [doc, color, fontSize, flatStyle.lineHeight, flatStyle.fontWeight, flatStyle.textAlign],
  );

  if (Platform.OS === 'web') return <WebRich payload={payload} containerStyle={containerStyle} />;

  // Until the fonts and renderer page are on disk there is nothing safe to
  // show: printing the plain-text projection would expose the LaTeX source
  // this component exists to hide. The install is warmed at app start, so in
  // practice this is a single frame on first launch only.
  if (!assets) return <View style={[{ height: estimateHeight(doc, fontSize) }, containerStyle]} />;

  return (
    <MathWebView
      payload={payload}
      rendererUri={assets.rendererUri}
      baseDirUri={assets.baseDirUri}
      initialHeight={estimateHeight(doc, fontSize)}
      containerStyle={containerStyle}
      accessibilityLabel={doc.text}
    />
  );
}

/**
 * Height before the page reports its own, so the surrounding layout does not
 * visibly jump on first paint. Deliberately rough — it is replaced within a
 * frame or two by the measured value.
 */
function estimateHeight(doc: RichDoc, fontSize: number): number {
  const charsPerLine = Math.max(18, Math.round(320 / (fontSize * 0.52)));
  const lines = Math.max(1, Math.ceil(doc.text.length / charsPerLine));
  return Math.round(lines * fontSize * DEFAULT_LINE_HEIGHT_RATIO) + 4;
}

function MathWebView({
  payload,
  rendererUri,
  baseDirUri,
  initialHeight,
  containerStyle,
  accessibilityLabel,
}: {
  payload: Payload;
  rendererUri: string;
  baseDirUri: string;
  initialHeight: number;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}) {
  const [height, setHeight] = useState(initialHeight);
  const webRef = useRef<WebView>(null);
  const loadedRef = useRef(false);

  const payloadJson = useMemo(() => JSON.stringify(payload), [payload]);
  const latestRef = useRef(payloadJson);
  latestRef.current = payloadJson;

  // Content changes (swiping to the next question, re-styling a selected
  // option) push a new payload into the *loaded* page instead of reloading it.
  useEffect(() => {
    if (loadedRef.current) webRef.current?.postMessage(payloadJson);
  }, [payloadJson]);

  const onLoadEnd = useCallback(() => {
    loadedRef.current = true;
    // The payload may have changed while the page was loading.
    webRef.current?.postMessage(latestRef.current);
  }, []);

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message?.type === 'height' && typeof message.height === 'number') {
        setHeight(Math.max(1, Math.ceil(message.height)));
      }
    } catch {
      // Ignore anything that is not our height message.
    }
  }, []);

  // Injected before the page's own script runs, so the very first paint already
  // has content — no empty flash while a message round-trips. Deliberately the
  // payload as of mount; later changes go through postMessage above, and a
  // reload (Android process recycle) is repaired by onLoadEnd.
  const mountPayloadRef = useRef(payloadJson);
  const injectedBefore = `window.__RC__=${toJsLiteral(mountPayloadRef.current)};true;`;

  return (
    <View style={[{ height }, containerStyle]} accessible accessibilityLabel={accessibilityLabel}>
      <WebView
        ref={webRef}
        source={{ uri: rendererUri }}
        // WKWebView needs explicit read access to the directory holding the
        // KaTeX_*.woff2 files that renderer.html links to.
        allowFileAccess
        allowFileAccessFromFileURLs
        allowingReadAccessToURL={baseDirUri}
        originWhitelist={['file://', 'about:']}
        injectedJavaScriptBeforeContentLoaded={injectedBefore}
        onLoadEnd={onLoadEnd}
        onMessage={onMessage}
        // Display-only: the page must not scroll, zoom, or offer selection.
        scrollEnabled={false}
        nestedScrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        scalesPageToFit={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        bounces={false}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        // Transparent so the option/question card behind it shows through, in
        // either colour scheme. The page's own background is transparent too.
        style={styles.webview}
        containerStyle={styles.webviewContainer}
        androidLayerType="hardware"
        javaScriptEnabled
        domStorageEnabled={false}
        cacheEnabled
        // The wrapper carries the plain-text label; without this TalkBack would
        // also walk the page and read the markup a second time.
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        // Question HTML is admin-authored and already sanitised, but the page
        // itself has no reason to ever navigate off the local renderer.
        onShouldStartLoadWithRequest={(request) =>
          request.url.startsWith('file://') || request.url.startsWith('about:')
        }
      />
      {/* Sits above the native WebView so Android delivers touches to the
          enclosing Pressable rather than letting the web page swallow them.
          `pointerEvents="none"` alone does not stop a native WebView. */}
      <View style={StyleSheet.absoluteFill} />
    </View>
  );
}

/**
 * The payload is spliced into injected JavaScript source, where U+2028/U+2029
 * are line terminators even though JSON permits them raw.
 */
function toJsLiteral(json: string): string {
  return JSON.stringify(json).replace(/[\u2028\u2029]/g, (c) => (c === '\u2028' ? '\\u2028' : '\\u2029'));
}

/* ── Web path ─────────────────────────────────────────────────────────── */

let webStyleInjected = false;

/**
 * `expo start --web` renders through react-native-web, where the DOM is right
 * there — no WebView needed. Fonts come from the same bundled assets.
 */
function WebRich({ payload, containerStyle }: { payload: Payload; containerStyle?: StyleProp<ViewStyle> }) {
  useEffect(() => {
    if (webStyleInjected || typeof document === 'undefined') return;
    webStyleInjected = true;
    const style = document.createElement('style');
    // Mirrors BASE_CSS in rendererHtml.ts — keep the two in step.
    style.textContent =
      `${KATEX_CSS}\n` +
      '.rc-inline .inline-math{display:inline;padding:0 .15em}' +
      '.rc-inline .inline-math .katex-html{display:inline}' +
      '.rc-inline .inline-math .katex{display:inline;font-size:1.08em}';
    document.head.appendChild(style);
  }, []);

  return (
    <View style={containerStyle}>
      {React.createElement('div', {
        className: 'rc-inline',
        style: {
          color: payload.color,
          fontSize: payload.fontSize,
          lineHeight: payload.lineHeight,
          fontWeight: payload.fontWeight,
          textAlign: payload.textAlign,
          overflowWrap: 'anywhere',
        },
        dangerouslySetInnerHTML: { __html: payload.html },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    opacity: 0.99, // Android: forces a transparent-capable surface for the WebView.
  },
  webviewContainer: {
    backgroundColor: 'transparent',
  },
  blockGap: {
    marginTop: 4,
  },
  inlineImage: {
    width: 18,
    height: 18,
  },
});
