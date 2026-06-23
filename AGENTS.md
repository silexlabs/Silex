# AGENTS.md

Guidance for contributors using AI-assisted coding tools (Claude Code, Cursor, opencode, Copilot, etc.).

## Tech Stack

- **Frontend**: TypeScript, GrapesJS (visual editor framework), 11ty (static site generation)
- **Desktop**: Rust, Tauri v2
- **Build**: a monorepo built as a **single package** — one `package.json`, one build. Code is split by role: `editor/` (browser), `server/` (Node.js), `common/` (shared), `grapesjs-plugins/` (first-party GrapesJS plugins, compiled from source), `server-rust/` + `desktop/` (Rust/Tauri, a Cargo workspace). A pnpm workspace covers **only** `grapesjs-plugins/*` (so they publish independently) — the app build itself does not use it.

Cross-folder imports use path aliases (`~/common`, `~/editor`, `~/server`) — never `../../`. The first-party plugins are imported by their **package name** (`@silexlabs/grapesjs-*`), which the build resolves to their **source** via webpack aliases (`webpack.config.js`) — not installed from npm. `pnpm build` builds the whole JS side in one pass.

See [README.md → Development](README.md#development) for the layout, and [CONTRIBUTING.md](CONTRIBUTING.md) for the branch / PR / release flow.

## Run it locally

```sh
git clone --recurse-submodules https://github.com/silexlabs/Silex.git
cd Silex
pnpm install
pnpm build && pnpm start      # editor at http://localhost:6805
# during development, with watch + auto-reload:
pnpm run dev
```

## When writing code for Silex (editing source)

- Prefer small, focused changes. If a change can be a plugin, make it a plugin.
- **Test your change before opening a PR, and put a screenshot of that test in the PR** — show it works, don't just claim it.
- Run `pnpm build`, `pnpm lint` and `pnpm test` before committing. CI runs the same checks and a red CI will not be merged.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/), one line (`type(scope): description`, lowercase). Do **not** add AI attribution — no `Co-Authored-By`, no "Generated with…".
- PRs target `main`. Discuss non-trivial changes first (see CONTRIBUTING.md).

## When designing websites in Silex (using the editor)

These rules apply when your AI tool controls the Silex visual editor (e.g. via MCP):

- **CSS**: BEM class naming. Style via `CssComposer.addRules()`. No inline styles, no CSS Grid (use Flexbox).
- **GrapesJS API**: Never modify DOM directly. Use the component/style APIs.
- **Pages**: Homepage must be named `index`. Internal links start with `./`.
- **Symbols**: Use Symbols for shared header/footer across pages.
- **Responsiveness**: Use DeviceManager breakpoints, never resize the browser window.

Silex Desktop exposes MCP tools for controlling the editor. Connect your AI tool to the MCP server at `http://localhost:6807/mcp` — e.g. `claude mcp add --transport http silex http://localhost:6807/mcp`, or the equivalent for Cursor/OpenCode/Goose. Your MCP client config (e.g. `.mcp.json`) is per-developer and git-ignored — don't commit it. See the [desktop README](desktop/README.md) for details.
