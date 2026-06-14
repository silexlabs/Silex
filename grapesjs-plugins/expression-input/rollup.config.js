import summary from 'rollup-plugin-summary'
import terser from '@rollup/plugin-terser'
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: './dist/index.js', // Single entry point that imports all dependencies
  output: [
    {
      file: './dist/bundle.iife.js', // IIFE for browsers
      format: 'iife',
      name: 'ExpressionInputBundle',
      sourcemap: true,
    },
    {
      file: './dist/bundle.esm.js', // ESM for frontend frameworks
      format: 'esm',
      sourcemap: true,
    }
  ],
  onwarn(warning) {
    if (warning.code !== 'THIS_IS_UNDEFINED') {
      console.error(`(!) ${warning.message}`)
    }
  },
  plugins: [
    resolve({ browser: true }),
    terser({
      ecma: 2017,
      module: true,
      warnings: true,
      mangle: {
        properties: {
          regex: /^__/,
        },
      },
    }),
    summary(),
  ],
}
