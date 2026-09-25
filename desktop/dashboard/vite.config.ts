import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath } from 'node:url'

const silex = 'http://localhost:6805'

// Built pages only: Vite in development injects styles and opens a websocket.
// Images are https: a website's image can be any address the user gave.
// ipc: and http://ipc.localhost are the Tauri bridge (Linux and macOS, Windows),
// Sentry and GlitchTip the telemetry the desktop bridge loads once the user agreed.
const csp = [
  "default-src 'none'",
  "script-src 'self' https://browser.sentry-cdn.com",
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
  build: {
    assetsDir: '_dashboard',
    license: true,
    rollupOptions: {
      // The client config of the editor, loaded from the same server as the dashboard
      input: { index: 'index.html', silex: 'src/client-plugins/silex.ts' },
      output: {
        entryFileNames: (entry) => (entry.name === 'silex' ? 'silex.js' : '_dashboard/[name]-[hash].js'),
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
      '/eval-callback': silex,
    },
  },
})
