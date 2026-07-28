# Silex Desktop

Desktop application for [Silex](https://www.silex.me), the free/libre no-code website builder. Built with [Tauri](https://tauri.app/) v2 and the `silex-server` Rust crate.

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (for the Tauri CLI)
- System dependencies for Tauri: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Development

```bash
cd desktop
npm install
npm run dev
```

The editor and the dashboard are compiled into the binary, so build them before running the app
(`pnpm run build:client` at the root of the repo).

Set `SILEX_DATA_PATH` to keep the websites of your development runs away from the ones of the
installed app.

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
