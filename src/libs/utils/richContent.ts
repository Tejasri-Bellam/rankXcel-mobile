/**
 * Parser for the question content the admin Tiptap editor produces.
 *
 * Question text, option text, assertion/reason and explanations are **HTML**,
 * not plain text, and every equation is an atomic inline custom element:
 *
 *   <math-field read-only data-latex="2\sin\theta=1" class="inline-math">2\sin\theta=1</math-field>
 *
 * The web app renders that HTML directly and lets MathLive upgrade the custom
 * element. Native has no custom elements, so we parse the markup into a node
 * tree here and let `RichContent` render it — text natively, equations through
 * KaTeX. See rankXcel-web-ui `MathExtension.ts` for the authoring contract.
 *
 * This module replaces the old `stripHtml()` helper (libs/utils/html.ts, now
 * deleted), which stripped tags with a regex and so printed the `<math-field>`
 * text content — the raw LaTeX source. It also dropped the spacing between
 * adjacent elements, which is where "the value of4\sin" came from.
 */

/** Tags we keep. Anything else is unwrapped (children kept) or dropped. */
export type RichTag =
  | 'p'
  | 'strong'
  | 'em'
  | 'u'
  | 'sub'
  | 'sup'
  | 'ul'
  | 'ol'
  | 'li'
  | 'span';

export type RichNode =
  | { kind: 'text'; text: string }
  | { kind: 'math'; latex: string }
  | { kind: 'br' }
  | { kind: 'img'; src: string; alt: string }
  | { kind: 'el'; tag: RichTag; children: RichNode[] };

export type RichDoc = {
  nodes: RichNode[];
  /** True when at least one `<math-field>` was found — selects the render path. */
  hasMath: boolean;
  /**
   * Plain-text projection: markup removed, equations replaced by their LaTeX.
   * Used for accessibility labels, height estimation and anywhere a `string` is
   * still required (AI-tutor prompts, `numberOfLines` previews).
   */
  text: string;
};

/**
 * Editor output maps onto a smaller set of renderable tags. `b`/`i`/`ins` are
 * the legacy spellings Tiptap can still emit when content is pasted in.
 */
const TAG_ALIASES: Record<string, RichTag> = {
  p: 'p',
  div: 'p',
  strong: 'strong',
  b: 'strong',
  em: 'em',
  i: 'em',
  u: 'u',
  ins: 'u',
  sub: 'sub',
  sup: 'sup',
  ul: 'ul',
  ol: 'ol',
  li: 'li',
  span: 'span',
};

/**
 * Content is admin-authored, so it is semi-trusted, not trusted: these tags are
 * dropped along with everything inside them rather than merely unwrapped.
 */
const DROP_SUBTREE = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'svg',
  'math',
]);

const VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'col']);

/** Blocks that should read as separate lines in the plain-text projection. */
const BLOCK_TAGS = new Set<RichTag>(['p', 'ul', 'ol', 'li']);

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  // Kept as U+00A0 rather than folded to a plain space: authors use it to stop
  // a unit or symbol wrapping away from the number it belongs to.
  nbsp: '\u00a0',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  times: '×',
  divide: '÷',
  deg: '°',
  plusmn: '±',
  le: '≤',
  ge: '≥',
  ne: '≠',
  rarr: '→',
  larr: '←',
  harr: '↔',
  infin: '∞',
  radic: '√',
  sum: '∑',
  prod: '∏',
  int: '∫',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  theta: 'θ',
  lambda: 'λ',
  mu: 'μ',
  pi: 'π',
  sigma: 'σ',
  phi: 'φ',
  omega: 'ω',
  Delta: 'Δ',
  Omega: 'Ω',
};

/** Decodes the entity forms the editor and pasted content produce. */
export function decodeEntities(input: string): string {
  if (!input.includes('&')) return input;
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,31});/g, (match, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

/**
 * Removes MathLive's authoring artifacts, which are valid in the editor but
 * render as visible junk (or a parse error) in KaTeX:
 *   - `\placeholder{}` marks a slot the author never filled in.
 *   - deleting a slot's contents leaves an empty `_{}` / `^{}` group behind,
 *     e.g. `\frac{11+\sqrt{15}_{}}{4}` — seen in production option text.
 */
export function cleanLatex(raw: string): string {
  let latex = raw.replace(/\\placeholder(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g, '');
  // Repeat: removing an inner group can expose a newly-empty outer one.
  for (let pass = 0; pass < 8; pass += 1) {
    const next = latex.replace(/[_^]\s*\{\s*\}/g, '');
    if (next === latex) break;
    latex = next;
  }
  return latex.trim();
}

/** Only inline/remote images the renderer can actually fetch offline-safely. */
function isSafeImageSrc(src: string): boolean {
  return /^(https?:\/\/|data:image\/)/i.test(src.trim());
}

type Attrs = Record<string, string>;

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g;

function parseAttrs(source: string): Attrs {
  const attrs: Attrs = {};
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(source)) !== null) {
    const name = match[1].toLowerCase();
    // Event handlers and javascript: sinks never survive the parse.
    if (name.startsWith('on')) continue;
    attrs[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

type Frame = { tag: RichTag | null; children: RichNode[] };

/**
 * Hand-rolled tokenizer — React Native has no DOM, and pulling in a full HTML
 * parser for the handful of tags Tiptap emits is not worth the bundle weight.
 */
export function parseRichContent(input: unknown): RichDoc {
  const html = typeof input === 'string' ? input : input == null ? '' : String(input);

  const root: Frame = { tag: null, children: [] };
  const stack: Frame[] = [root];
  let hasMath = false;

  const top = () => stack[stack.length - 1];
  const push = (node: RichNode) => top().children.push(node);

  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      appendText(top().children, html.slice(i));
      break;
    }
    if (lt > i) appendText(top().children, html.slice(i, lt));

    // Comments and doctypes carry nothing renderable.
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html.startsWith('<!', lt)) {
      const end = html.indexOf('>', lt);
      i = end === -1 ? html.length : end + 1;
      continue;
    }

    const gt = html.indexOf('>', lt);
    if (gt === -1) {
      // Unterminated tag: treat the remainder as text rather than losing it.
      appendText(top().children, html.slice(lt));
      break;
    }

    const isClosing = html[lt + 1] === '/';
    const inner = html.slice(lt + (isClosing ? 2 : 1), gt).replace(/\/$/, '');
    const nameMatch = /^([a-zA-Z][-a-zA-Z0-9:]*)/.exec(inner);
    if (!nameMatch) {
      i = gt + 1;
      continue;
    }
    const name = nameMatch[1].toLowerCase();
    const rest = inner.slice(nameMatch[1].length);

    if (isClosing) {
      // Close the nearest matching open frame; ignore strays.
      const alias = TAG_ALIASES[name];
      if (alias) {
        for (let depth = stack.length - 1; depth > 0; depth -= 1) {
          if (stack[depth].tag === alias) {
            const closed = stack.splice(depth);
            for (const frame of closed) {
              stack[stack.length - 1].children.push({
                kind: 'el',
                tag: frame.tag as RichTag,
                children: frame.children,
              });
            }
            break;
          }
        }
      }
      i = gt + 1;
      continue;
    }

    // The whole point: an atomic equation node. Its LaTeX lives in
    // `data-latex`; the text content is only a fallback for older rows.
    if (name === 'math-field') {
      const attrs = parseAttrs(rest);
      const close = html.toLowerCase().indexOf('</math-field', gt);
      const body = close === -1 ? '' : html.slice(gt + 1, close);
      const latex = cleanLatex(
        attrs['data-latex'] || decodeEntities(body.replace(/<[^>]*>/g, '')),
      );
      if (latex) {
        push({ kind: 'math', latex });
        hasMath = true;
      }
      i = close === -1 ? html.length : (html.indexOf('>', close) + 1 || html.length);
      continue;
    }

    if (DROP_SUBTREE.has(name)) {
      const closeRe = new RegExp(`</${name}\\s*>`, 'i');
      const tail = html.slice(gt + 1);
      const closeAt = tail.search(closeRe);
      i = closeAt === -1 ? html.length : gt + 1 + closeAt + tail.match(closeRe)![0].length;
      continue;
    }

    if (name === 'br') {
      push({ kind: 'br' });
      i = gt + 1;
      continue;
    }

    if (name === 'img') {
      const attrs = parseAttrs(rest);
      const src = attrs.src ?? '';
      if (isSafeImageSrc(src)) push({ kind: 'img', src: src.trim(), alt: attrs.alt ?? '' });
      i = gt + 1;
      continue;
    }

    if (VOID_TAGS.has(name)) {
      i = gt + 1;
      continue;
    }

    const alias = TAG_ALIASES[name];
    if (alias) {
      // `<li>` without a close tag is common; an open `li` yields to the next.
      if (alias === 'li' && top().tag === 'li') closeFrame(stack);
      stack.push({ tag: alias, children: [] });
    }
    // Unknown-but-harmless tags are unwrapped: their children still render.
    i = gt + 1;
  }

  // Close anything the author left open.
  while (stack.length > 1) closeFrame(stack);

  const nodes = root.children;
  return { nodes, hasMath, text: toPlainText(nodes) };
}

function closeFrame(stack: Frame[]) {
  const frame = stack.pop()!;
  stack[stack.length - 1].children.push({
    kind: 'el',
    tag: frame.tag as RichTag,
    children: frame.children,
  });
}

/**
 * Appends decoded text, collapsing whitespace runs the way HTML does while
 * keeping the single space *between* nodes. Dropping that boundary space is
 * what produced "the value of4\sin" in the old strip-tags output.
 */
function appendText(children: RichNode[], raw: string) {
  if (!raw) return;
  const text = decodeEntities(raw).replace(/[\t\n\r ]+/g, ' ');
  if (!text) return;
  const last = children[children.length - 1];
  if (last?.kind === 'text') {
    // Merge, but never create a double space at the seam.
    if (last.text.endsWith(' ') && text.startsWith(' ')) {
      last.text += text.slice(1);
    } else {
      last.text += text;
    }
    return;
  }
  children.push({ kind: 'text', text });
}

function toPlainText(nodes: RichNode[]): string {
  const out: string[] = [];
  walk(nodes, out);
  return out
    .join('')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    // One break per block: this projection feeds compact previews and
    // `numberOfLines` labels, where blank lines just eat the budget.
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function walk(nodes: RichNode[], out: string[]) {
  for (const node of nodes) {
    switch (node.kind) {
      case 'text':
        out.push(node.text);
        break;
      case 'math':
        // Pad so the equation never fuses with the adjacent word.
        out.push(` ${node.latex} `);
        break;
      case 'br':
        out.push('\n');
        break;
      case 'img':
        if (node.alt) out.push(node.alt);
        break;
      case 'el':
        if (BLOCK_TAGS.has(node.tag)) out.push('\n');
        walk(node.children, out);
        if (BLOCK_TAGS.has(node.tag)) out.push('\n');
        break;
    }
  }
}

/**
 * Plain-text projection of raw question HTML.
 *
 * For the call sites that genuinely need a `string` — accessibility labels,
 * analytics, search. Anything the user *reads* must render through
 * `<RichContent>` instead, or its equations show up as LaTeX source.
 */
export function richPlainText(input: unknown): string {
  return parseRichContent(input).text;
}

/** True when the value has any renderable content at all (text, math or image). */
export function hasRichContent(input: unknown): boolean {
  const doc = parseRichContent(input);
  return doc.hasMath || doc.text.length > 0 || containsImage(doc.nodes);
}

function containsImage(nodes: RichNode[]): boolean {
  return nodes.some((node) =>
    node.kind === 'img' ? true : node.kind === 'el' ? containsImage(node.children) : false,
  );
}
