import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.iife.js',
    format: 'iife',
    name: 'GrapesJSSymbols',
    globals: {
      backbone: 'Backbone',
      jquery: '$',
      'lit-html': 'litHtml'
    }
  },
  external: ['backbone', 'jquery', 'lit-html'],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      transformMixedEsModules: true,
      include: 'node_modules/**'
    }),
    typescript()
  ],
  context: 'window'
};
