import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'dist/es6/index.js',
  output: {
    file: 'dist/bundle.iife.js',
    format: 'iife',
    name: 'GrapesJSSymbols',
    globals: {
      backbone: 'Backbone'
    }
  },
  external: ['backbone'],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      transformMixedEsModules: true,
      include: 'node_modules/**'
    }),
  ],
  context: 'window'
};
