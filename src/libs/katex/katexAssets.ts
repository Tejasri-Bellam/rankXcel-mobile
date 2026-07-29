/**
 * Installs the KaTeX renderer page and its glyph fonts onto the device.
 *
 * Everything ships inside the app binary (`assets/katex/*.woff2`, bundled by
 * Metro via the `woff2` assetExt registered in metro.config.js) and is copied
 * into one directory on first launch. `RichContent` then loads
 * `renderer.html` from that directory by `file://` URI, which:
 *
 *   - resolves the stylesheet's `url(KaTeX_Main-Regular.woff2)` references as
 *     same-directory requests, so **nothing touches the network** — the whole
 *     point, since students sit exams offline / in airplane mode;
 *   - lets the platform WebView cache each font once and reuse it across every
 *     WebView instance, instead of re-decoding inline base64 per instance.
 */
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { KATEX_VERSION } from './katexCss';
import { RENDERER_HTML, RENDERER_VERSION } from './rendererHtml';

// Static `require`s: Metro resolves asset paths at build time, so these cannot
// be generated from a loop. Regenerate with scripts/generate-katex-css.js.
/* eslint-disable @typescript-eslint/no-require-imports */
const FONT_MODULES = [
  require('../../../assets/katex/KaTeX_AMS-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Caligraphic-Bold.woff2'),
  require('../../../assets/katex/KaTeX_Caligraphic-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Fraktur-Bold.woff2'),
  require('../../../assets/katex/KaTeX_Fraktur-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Main-BoldItalic.woff2'),
  require('../../../assets/katex/KaTeX_Main-Bold.woff2'),
  require('../../../assets/katex/KaTeX_Main-Italic.woff2'),
  require('../../../assets/katex/KaTeX_Main-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Math-BoldItalic.woff2'),
  require('../../../assets/katex/KaTeX_Math-Italic.woff2'),
  require('../../../assets/katex/KaTeX_SansSerif-Bold.woff2'),
  require('../../../assets/katex/KaTeX_SansSerif-Italic.woff2'),
  require('../../../assets/katex/KaTeX_SansSerif-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Script-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Size1-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Size2-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Size3-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Size4-Regular.woff2'),
  require('../../../assets/katex/KaTeX_Typewriter-Regular.woff2'),
];
/* eslint-enable @typescript-eslint/no-require-imports */

const DIR_PREFIX = 'katex-';
const DIR_NAME = `${DIR_PREFIX}${KATEX_VERSION}-r${RENDERER_VERSION}`;

export type KatexAssets = {
  /** `file://` URI of renderer.html. */
  rendererUri: string;
  /** Directory WKWebView must be granted read access to (fonts live here). */
  baseDirUri: string;
};

let installation: Promise<KatexAssets> | null = null;
let installed: KatexAssets | null = null;

/**
 * Idempotent, memoised for the app session. Safe to call from every
 * `RichContent` mount — only the first does any work.
 *
 * Warmed from the root layout so the assets are already on disk by the time a
 * question screen opens.
 */
export function installKatexAssets(): Promise<KatexAssets> {
  if (!installation) {
    installation = install()
      .then((assets) => {
        installed = assets;
        return assets;
      })
      .catch((error) => {
        // Let a later mount retry rather than wedging math off for the session.
        installation = null;
        throw error;
      });
  }
  return installation;
}

async function install(): Promise<KatexAssets> {
  const dir = new Directory(Paths.document, DIR_NAME);
  const renderer = new File(dir, 'renderer.html');

  // renderer.html is written last, so its presence means a complete install.
  if (renderer.exists) return { rendererUri: renderer.uri, baseDirUri: dir.uri };

  if (!dir.exists) dir.create({ intermediates: true, overwrite: false });

  const assets = await Asset.loadAsync(FONT_MODULES);
  for (const asset of assets) {
    const name = asset.type ? `${asset.name}.${asset.type}` : asset.name;
    const dest = new File(dir, name);
    if (dest.exists) continue;
    const source = asset.localUri ?? asset.uri;
    if (!source) continue;
    new File(source).copy(dest);
  }

  renderer.create({ intermediates: true, overwrite: true });
  renderer.write(RENDERER_HTML);

  removeStaleInstalls();
  return { rendererUri: renderer.uri, baseDirUri: dir.uri };
}

/** Drops directories left behind by a previous katex/renderer version. */
function removeStaleInstalls() {
  try {
    for (const entry of new Directory(Paths.document).list()) {
      if (entry instanceof Directory && entry.name.startsWith(DIR_PREFIX) && entry.name !== DIR_NAME) {
        entry.delete();
      }
    }
  } catch {
    // Housekeeping only — a stale directory costs ~300KB, never correctness.
  }
}

/**
 * Resolves the installed assets, re-rendering the caller once they are ready.
 * Until then callers show the plain-text projection, exactly like the web app
 * does before MathLive finishes loading.
 */
export function useKatexAssets(): KatexAssets | null {
  // Already installed earlier in the session: start ready, so nothing flashes
  // between the first paint and the effect running.
  const [assets, setAssets] = useState<KatexAssets | null>(installed);

  useEffect(() => {
    if (Platform.OS === 'web' || assets) return;
    let active = true;
    installKatexAssets()
      .then((resolved) => {
        if (active) setAssets(resolved);
      })
      .catch(() => {
        // Leaves the block blank rather than exposing raw LaTeX; a later mount
        // retries the install.
      });
    return () => {
      active = false;
    };
  }, [assets]);

  return assets;
}
