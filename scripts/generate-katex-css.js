#!/usr/bin/env node
/**
 * Regenerates src/libs/katex/katexCss.ts and refreshes assets/katex/*.woff2
 * from the installed `katex` package. Run after bumping the katex dependency:
 *
 *   node scripts/generate-katex-css.js
 *
 * The stylesheet is inlined into renderer.html rather than shipped as a
 * separate file, so its `url(fonts/KaTeX_X.woff2)` references are rewritten to
 * bare filenames that resolve against the directory katexAssets.ts installs.
 * Only woff2 is kept — every WebView we target supports it.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const katexDist = path.join(root, 'node_modules', 'katex', 'dist');
const assetDir = path.join(root, 'assets', 'katex');

const version = require(path.join(root, 'node_modules', 'katex', 'package.json')).version;

let css = fs.readFileSync(path.join(katexDist, 'katex.min.css'), 'utf8');
css = css.replace(
  /src:[^;}]*?url\(fonts\/(KaTeX_[A-Za-z0-9-]+)\.woff2\) format\("woff2"\)[^;}]*/g,
  (_match, family) => `src:url(${family}.woff2) format("woff2")`,
);
if (css.includes('fonts/')) {
  throw new Error('katex.min.css still references fonts/ — the rewrite missed a rule');
}

fs.mkdirSync(assetDir, { recursive: true });
for (const file of fs.readdirSync(assetDir)) {
  if (file.endsWith('.woff2')) fs.unlinkSync(path.join(assetDir, file));
}
const fonts = fs
  .readdirSync(path.join(katexDist, 'fonts'))
  .filter((f) => f.endsWith('.woff2'));
for (const font of fonts) {
  fs.copyFileSync(path.join(katexDist, 'fonts', font), path.join(assetDir, font));
}

const out = `// Generated from node_modules/katex/dist/katex.min.css (katex ${version}).
// Font URLs are rewritten to bare woff2 filenames because the stylesheet is
// inlined into renderer.html, which sits in the same on-disk directory as the
// KaTeX_*.woff2 files installed by katexAssets.ts. Regenerate with:
//   node scripts/generate-katex-css.js
export const KATEX_VERSION = ${JSON.stringify(version)};

export const KATEX_CSS = ${JSON.stringify(css)};
`;

fs.mkdirSync(path.join(root, 'src', 'libs', 'katex'), { recursive: true });
fs.writeFileSync(path.join(root, 'src', 'libs', 'katex', 'katexCss.ts'), out);

console.log(`katex ${version}: ${fonts.length} fonts -> assets/katex, ${css.length}B css -> src/libs/katex/katexCss.ts`);
