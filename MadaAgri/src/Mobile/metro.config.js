const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Faster transforms with Hermes
config.transformer.minifierConfig = {
  keep_classnames: false,
  keep_fnames: false,
  mangle: {
    toplevel: true,
    safari10: true,
  },
};

// Optimize resolver for faster module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Enable Hermes-specific optimizations
config.transformer.hermesParser = true;

module.exports = config;
