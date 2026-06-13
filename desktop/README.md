# Silex Desktop

Desktop application for [Silex](https://www.silex.me), the free/libre no-code website builder. Built with [Tauri](https://tauri.app/) v2 and the `silex-server` Rust crate.

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (for the Tauri CLI)
- System dependencies for Tauri: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Development

```bash
cd packages/silex-desktop
npm install
npm run dev
```

The server reads configuration from environment variables. Create a `.env` file in `src-tauri/` for local development:

```
SILEX_DASHBOARD_PATH=../../silex_silex-dashboard-2026/public
SILEX_STATIC_ROUTES=/:../../silex-lib/dist/client
```

## Build

```bash
npm run build
```

This produces platform-specific installers in `src-tauri/target/release/bundle/`.

## Architecture

The app embeds `silex-server` as a library. On startup it:

1. Starts the HTTP server on `localhost:6805` (API + static files)
2. Opens a WebView pointing to `/` (dashboard)
3. Starts an MCP server on port `6807` for AI-assisted editing

The dashboard shows the user's websites. Clicking a site navigates to `/?id=<website_id>` which loads the GrapesJS editor.

### Key files

| Path | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Tauri app entry, server startup, window management |
| `src-tauri/src/mcp.rs` | MCP server, eval_js bridge, prompt |
| `src-tauri/scripts/desktop-bridge.js` | JS injected into the WebView (Tauri <-> editor bridge) |

## Support

- [Silex issues](https://github.com/silexlabs/Silex/issues)
- [Silex documentation](https://github.com/silexlabs/Silex/wiki)
