# Silex Desktop

Desktop application for [Silex](https://www.silex.me), the free/libre no-code website builder. Built with [Tauri](https://tauri.app/) v2 and the `silex-server` Rust crate.

## Prerequisites

- **System libraries** (GTK, WebKitGTK, a C toolchain…) — follow [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/), which lists the exact packages for Linux (Debian, Fedora, Arch, openSUSE, Alpine, Gentoo, NixOS), macOS and Windows. We deliberately don't copy those lists here: they drift. **Install them first** — without them the Rust build stops early on `gdk-sys` with a `pkg-config` error, which looks like a code problem but isn't.
- **Rust** — via [rustup](https://rustup.rs/). The version is pinned by `rust-toolchain.toml` at the repo root; rustup picks it up on its own, don't install a toolchain by hand.
- **Node.js** — the version in `.nvmrc` at the repo root (`nvm use`).
- **pnpm** — the version pinned in the root `package.json` (`packageManager` field); `corepack enable` is enough.
- **Submodules** — clone with `--recurse-submodules` (or run `git submodule update --init`). The server embeds `silex-dashboard-2026/public` at compile time and won't build without it.

## Development

The app embeds the editor frontend built by the JS side, so build that first, from the **repo root**:

```bash
pnpm install
pnpm run build     # produces dist/client, embedded into the Rust server
```

Then run the app:

```bash
cd desktop
pnpm run dev       # = tauri dev
```

The server reads configuration from environment variables. Create a `.env` file in `src-tauri/` for local development:

```
SILEX_DASHBOARD_PATH=../../dashboards/silex-dashboard-2026/public
SILEX_STATIC_ROUTES=/:../../dist/client
```

## Build

```bash
cd desktop
pnpm run build     # = tauri build
```

This produces platform-specific installers in `src-tauri/target/release/bundle/`.

Bundling on Linux needs `patchelf` on top of the Tauri prerequisites (for the AppImage target).

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
