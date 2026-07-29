/**
 * The static page every `RichContent` WebView loads.
 *
 * It is written to disk once (see `katexAssets.ts`) and loaded by `file://`
 * URI so the KaTeX_*.woff2 files sitting beside it resolve as ordinary
 * same-directory requests. That matters twice over: the WebView's own resource
 * cache then serves the fonts to every later instance, and nothing is ever
 * fetched from a network — math renders in airplane mode.
 *
 * Content is *not* baked into this file. Each instance injects a payload
 * (`window.__RC__`) before load and can post further payloads afterwards, so
 * swiping between questions reuses the loaded page instead of reloading it.
 */
import { KATEX_CSS } from './katexCss';

/** Bump when the page or base styles change so installed copies are refreshed. */
export const RENDERER_VERSION = 2;

/**
 * Mirrors rankXcel-web-ui `globals.css` (`.tiptap-preview` + `math-field.inline-math`)
 * so a question reads identically on both clients.
 */
const BASE_CSS = `
html,body{margin:0;padding:0;background:transparent;}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  color:#1A1A2E;font-size:15px;line-height:1.45;
  overflow:hidden;
  overflow-wrap:anywhere;word-break:break-word;
  -webkit-user-select:none;user-select:none;
  -webkit-touch-callout:none;
  -webkit-tap-highlight-color:transparent;
  -webkit-text-size-adjust:100%;text-size-adjust:100%;
}
#root{display:block;}
p{margin:0 0 6px}
p:last-child{margin-bottom:0}
strong{font-weight:700}
em{font-style:italic}
u{text-decoration:underline}
sub{vertical-align:sub;font-size:.75em}
sup{vertical-align:super;font-size:.75em}
ul{list-style-type:disc;padding-left:1.25em;margin:0 0 6px}
ol{list-style-type:decimal;padding-left:1.25em;margin:0 0 6px}
li{margin-bottom:2px}
img{max-width:100%;height:auto}
/* Equations must flow *inside* the sentence, so inline-math and KaTeX's own
   wrappers are forced inline. KaTeX defaults katex-html to display:block,
   which would otherwise push every equation onto a line of its own.
   The horizontal padding is what separates an equation from the word beside it:
   the source HTML genuinely has no space in "the value of" + the math-field, so
   the pre-fix rendering read "of4\\sin". Slightly wider than the web app's .1em
   because there is no MathLive shadow-root padding here. */
.inline-math{display:inline;padding:0 .15em}
.inline-math .katex-html{display:inline}
/* KaTeX's stock 1.21em reads oversized beside React Native body text. */
.inline-math .katex{display:inline;font-size:1.08em}
/* Fallback when an expression is too broken even for throwOnError:false. */
.math-src{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.92em}
`;

const PAGE_SCRIPT = `
(function () {
  var root = document.getElementById('root');
  var lastHeight = -1;

  function post(message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  // The host View has no intrinsic height, so the page reports its own and
  // React Native sizes the WebView to it. Reported on every change: web fonts
  // and images settle asynchronously and both change the layout.
  function measure() {
    var height = Math.ceil(root.getBoundingClientRect().height);
    if (height > 0 && height !== lastHeight) {
      lastHeight = height;
      post({ type: 'height', height: height });
    }
  }

  function apply(payload) {
    if (!payload) return;
    var style = document.body.style;
    if (payload.color) style.color = payload.color;
    if (payload.fontSize) style.fontSize = payload.fontSize + 'px';
    if (payload.lineHeight) style.lineHeight = String(payload.lineHeight);
    if (payload.fontWeight) style.fontWeight = String(payload.fontWeight);
    if (payload.textAlign) style.textAlign = payload.textAlign;
    if (typeof payload.html === 'string') root.innerHTML = payload.html;
    lastHeight = -1;
    measure();
  }

  function onMessage(event) {
    try { apply(JSON.parse(event.data)); } catch (error) { /* ignore malformed payloads */ }
  }
  // Android delivers postMessage on document, iOS on window.
  document.addEventListener('message', onMessage);
  window.addEventListener('message', onMessage);

  if (window.ResizeObserver) new ResizeObserver(measure).observe(root);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(function () {});

  // Injected by the host before this document ran, so the first paint already
  // has content — no empty flash while a message round-trips.
  if (window.__RC__) apply(window.__RC__);
  window.__rcReady = true;
})();
`;

export const RENDERER_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<style>${KATEX_CSS}</style>
<style>${BASE_CSS}</style>
</head>
<body><div id="root"></div>
<script>${PAGE_SCRIPT}</script>
</body>
</html>`;
