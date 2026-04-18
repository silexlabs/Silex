# AGENTS.md

Guidance for contributors using AI-assisted coding tools (Claude Code, Cursor, opencode, Copilot, etc.).

## Tech Stack

- **Frontend**: TypeScript, GrapesJS (visual editor framework), 11ty (static site generation)
- **Desktop**: Rust, Tauri v2
- **Build**: Yarn workspaces mono-repo, git submodules in `packages/`

When you change a package, rebuild it, then rebuild any packages that depend on it.

See [DEVELOPMENT.md](DEVELOPMENT.md) for build commands, debug cycle, and submodule workflow.

## When designing websites in Silex (using the editor)

These rules apply when your AI tool controls the Silex visual editor (e.g. via MCP):

- **CSS**: BEM class naming. Style via `CssComposer.addRules()`. No inline styles, no CSS Grid (use Flexbox).
- **GrapesJS API**: Never modify DOM directly. Use the component/style APIs.
- **Pages**: Homepage must be named `index`. Internal links start with `./`.
- **Symbols**: Use Symbols for shared header/footer across pages.
- **Responsiveness**: Use DeviceManager breakpoints, never resize the browser window.

Silex Desktop exposes MCP tools for controlling the editor. See the [silex-desktop README](packages/silex-desktop/README.md) for connection setup.

## When writing code for Silex (editing source)

- Prefer small, focused changes.
- Run `npm run build` for affected packages and verify no regressions before delivering.
- Do not commit, push, or modify git history unless explicitly asked.

See [Contribute](https://docs-66e101.gitlab.io/fr/designer/contribute/) for the full contributor guide.
