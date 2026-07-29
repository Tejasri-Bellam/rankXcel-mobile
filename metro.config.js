// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// KaTeX ships its glyphs as .woff2, which Metro does not treat as an asset by
// default. Registering the extension bundles assets/katex/*.woff2 into the app
// binary so katexAssets.ts can install them on first launch — math must render
// with no network access (airplane mode).
config.resolver.assetExts.push('woff2');

module.exports = config;
