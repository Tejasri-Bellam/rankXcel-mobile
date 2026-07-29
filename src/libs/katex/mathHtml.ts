/**
 * Turns a parsed `RichDoc` into the HTML the renderer WebView displays.
 *
 * Equations are typeset **here, on the JS thread**, with `katex.renderToString`
 * — the WebView only ever receives finished markup plus a stylesheet. That
 * keeps ~280KB of KaTeX out of every WebView instance (a paper can put five of
 * them on screen at once) and lets us memoise the output per equation.
 */
import katex from 'katex';

import type { RichNode } from '../utils/richContent';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Equations repeat constantly — the same option re-renders on every selection
 * change, and swiping back to a question re-typesets it. A bounded cache keeps
 * that free without growing without limit on a 90-question paper.
 */
const MATH_CACHE = new Map<string, string>();
const MATH_CACHE_LIMIT = 512;

function renderLatex(latex: string): string {
  const cached = MATH_CACHE.get(latex);
  if (cached !== undefined) return cached;

  let html: string;
  try {
    html = katex.renderToString(latex, {
      // A malformed equation must never blank out the question: KaTeX renders
      // the offending command as red source text instead of throwing.
      throwOnError: false,
      // Math authored in this editor is always inline — it has to sit on the
      // sentence's baseline and wrap with the surrounding words.
      displayMode: false,
      // The MathML twin doubles the payload and nothing consumes it inside a
      // non-selectable WebView; the plain-text projection covers a11y.
      output: 'html',
      strict: 'ignore',
      trust: false,
    });
  } catch {
    // Belt-and-braces for the errors `throwOnError: false` does not cover
    // (unbalanced braces deep in a macro, etc.) — show the source, lose nothing.
    html = `<span class="math-src">${escapeHtml(latex)}</span>`;
  }

  if (MATH_CACHE.size >= MATH_CACHE_LIMIT) {
    MATH_CACHE.delete(MATH_CACHE.keys().next().value!);
  }
  MATH_CACHE.set(latex, html);
  return html;
}

/**
 * Serialises the sanitised node tree. Every tag here comes from the parser's
 * allow-list, and all text/attribute values are escaped, so the result cannot
 * reintroduce markup the parser rejected.
 */
export function nodesToHtml(nodes: RichNode[]): string {
  let out = '';
  for (const node of nodes) {
    switch (node.kind) {
      case 'text':
        out += escapeHtml(node.text);
        break;
      case 'math':
        // `inline-math` mirrors the web app's math-field styling so equations
        // sit centred on the text line with a hair of breathing room.
        out += `<span class="inline-math">${renderLatex(node.latex)}</span>`;
        break;
      case 'br':
        out += '<br>';
        break;
      case 'img':
        out += `<img src="${escapeHtml(node.src)}" alt="${escapeHtml(node.alt)}">`;
        break;
      case 'el':
        out += `<${node.tag}>${nodesToHtml(node.children)}</${node.tag}>`;
        break;
    }
  }
  return out;
}
