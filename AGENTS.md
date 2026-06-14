# AGENTS.md

Guidance for contributors using AI-assisted coding tools (Claude Code, Cursor, opencode, Copilot, etc.).

## Tech Stack

- **Frontend**: TypeScript, GrapesJS (visual editor framework), 11ty (static site generation)
- **Desktop**: Rust, Tauri v2
- **Build**: single-package monorepo (no Yarn workspaces). One `package.json`, one build. Code is split by role: `editor/` (browser), `server/` (Node.js), `common/` (shared), `plugins/` (GrapesJS plugins, compiled from source), `server-rust/` + `desktop/` (Rust/Tauri, a Cargo workspace).

Cross-folder imports use path aliases (`~/common`, `~/editor`, `~/server`, `~/plugins`) — no `../../`. `pnpm build` builds the whole JS side in one pass (no per-package rebuilds).

See [README.md → Development](README.md#development) for the layout, build commands and release flow.

## When designing websites in Silex (using the editor)

These rules apply when your AI tool controls the Silex visual editor (e.g. via MCP):

- **CSS**: BEM class naming. Style via `CssComposer.addRules()`. No inline styles, no CSS Grid (use Flexbox).
- **GrapesJS API**: Never modify DOM directly. Use the component/style APIs.
- **Pages**: Homepage must be named `index`. Internal links start with `./`.
- **Symbols**: Use Symbols for shared header/footer across pages.
- **Responsiveness**: Use DeviceManager breakpoints, never resize the browser window.

Silex Desktop exposes MCP tools for controlling the editor. Connect your AI tool to the MCP server at `http://localhost:6807/mcp` — e.g. `claude mcp add --transport http silex http://localhost:6807/mcp`, or the equivalent for Cursor/OpenCode/Goose. Your MCP client config (e.g. `.mcp.json`) is per-developer and git-ignored — don't commit it. See the [desktop README](desktop/README.md) for details.

## When writing code for Silex (editing source)

- Prefer small, focused changes.
- Run `pnpm run build`, `pnpm lint`, `pnpm test` when applicable before any commit.
- Include screenshots to any PR, please prove to me that you have done proper testing.

See [Contribute](https://docs-66e101.gitlab.io/fr/designer/contribute/) for the full contributor guide.
