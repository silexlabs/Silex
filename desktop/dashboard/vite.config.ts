import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath } from 'node:url'

const silex = 'http://localhost:6805'
const repository = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url))

// Built pages only: Vite in development injects styles and opens a websocket.
// Images are https: a website's image can be any address the user gave.
// ipc: and http://ipc.localhost are the Tauri bridge (Linux and macOS, Windows),
// GlitchTip the telemetry the desktop bridge sends to once the user agreed.
const csp = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data: https:",
  "connect-src 'self' ipc: http://ipc.localhost https://trace.lexoyo.me",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join('; ')

export default defineConfig({
  plugins: [
    {
      name: 'content-security-policy',
      apply: 'build',
      transformIndexHtml: () => [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
      ],
    },
    vue({ features: { optionsAPI: false } }),
    VueI18n({
      include: fileURLToPath(new URL('./src/locales/**', import.meta.url)),
      runtimeOnly: true,
      compositionOnly: true,
      dropMessageCompiler: true,
    }),
  ],
  resolve: {
    alias: {
      '~/common': repository('common'),
      '~/editor': repository('editor'),
      '~/public': repository('public'),
    },
  },
  build: {
    assetsDir: '_dashboard',
    // The webviews of Tauri: WebView2 on Windows, WebKit on macOS and Linux, older than the browsers Vite aims at by default
    target: ['chrome105', 'safari13'],
    rolldownOptions: {
      // The client config of the editor, loaded from the same server as the dashboard,
      // and the telemetry the desktop bridge loads in both
      input: { index: 'index.html', silex: 'src/client-plugins/silex.ts', telemetry: 'src/telemetry.ts' },
      output: {
        // Asked for by these names
        entryFileNames: (entry) =>
          ({ silex: 'silex.js', telemetry: '_dashboard/telemetry.js' })[entry.name] ?? '_dashboard/[name]-[hash].js',
      },
      // The editor calls what silex.js exports
      preserveEntrySignatures: 'exports-only',
    },
  },
  server: {
    strictPort: true,
    proxy: {
      '^/\\?(.*&)?id=': silex,
      '/api': silex,
      '/js': silex,
      '/css': silex,
      '/webfonts': silex,
      '/assets': silex,
      '/silex.js': silex,
      '/_dashboard/telemetry.js': silex,
      '/eval-callback': silex,
    },
  },
})
