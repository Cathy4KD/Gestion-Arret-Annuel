export default {
  plugins: {
    'postcss-import': {},
    'autoprefixer': {},
    'cssnano': {
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        minifyFontValues: { removeQuotes: false },
        reduceIdents: false,
        zindex: false
      }]
    }
  }
};
