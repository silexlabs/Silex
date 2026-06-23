[![Stars](https://img.shields.io/github/stars/silexlabs/Silex?colorA=2c2837&colorB=c9cbff&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/stargazers)
[![Issues](https://img.shields.io/github/issues-raw/silexlabs/Silex?colorA=2c2837&colorB=f2cdcd&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/issues)
[![License](https://img.shields.io/github/license/silexlabs/Silex?colorA=2c2837&colorB=b5e8e0&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/blob/main/LICENSE)
[![Good first issues](https://img.shields.io/github/issues/silexlabs/Silex/good%20first%20issue?colorA=2c2837&colorB=a6e3a1&style=for-the-badge&logo=starship&label=good%20first%20issues)](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

# Silex — the visual builder for static sites

The web belongs to everyone. Silex is a free/libre visual website builder — no lock-in, no subscription, no tracking. Design visually, export clean HTML/CSS, host anywhere.

**[Try Silex online](https://v3.silex.me/)** | **[Documentation](https://docs.silex.me)** | **[Desktop app — coming soon](https://roadmap.silex.me/posts/3/silex-desktop)** | **[Manifesto](https://www.silex.me/manifesto/)**

![Silex UI](https://www.silex.me/img/HJKUdOfC5N-2400.webp)

## Why Silex?

Most no-code tools lock you in: proprietary formats, forced hosting, subscriptions. Silex is different.

- **Your data is yours** — standard HTML/CSS output, export everything, host anywhere, leave anytime
- **Real web skills** — everything you learn in Silex (HTML, CSS, JAMstack) is transferable knowledge
- **Community-owned** — maintained by [Silex Labs](https://www.silexlabs.org/), a non-profit recognized as being of general interest. No investors, no exit strategy, [transparent finances](https://opencollective.com/silex)
- **Free forever** — always free software (AGPL), all features included, no premium tier

> _"The only open source alternative to Webflow."_ — _"The most powerful and graphically precise website builder that I have experienced."_

## Who is Silex for?

- **Web agencies** — visual workflow, static output, scale client work without scaling your team
- **WordPress developers** — visual frontend, content from WP via GraphQL, ditch the theme layer
- **Freelance webdesigners** — create client sites without code, export standard HTML, host anywhere
- **No-code developers** — go beyond Wix/Squarespace with full CSS control and no vendor lock-in

## Features

- **[GrapesJS](https://github.com/GrapesJS/grapesjs)-based visual editor** — drag-and-drop page building with HTML, CSS, and JS editors
- **Static HTML output** — fast, secure, easy to host anywhere
- **CMS integration** — bind components to WordPress, Strapi, Squidex, or any GraphQL API
- **[11ty](https://www.11ty.dev/) compatible** — generate static sites from Silex templates, deploy with CI/CD
- **Desktop app (coming soon)** — work offline, no account needed, AI-ready with built-in [MCP server](#ai--vibe-coding). Built with [Tauri](https://tauri.app/) for Windows, macOS, Linux. [Follow progress](https://roadmap.silex.me/posts/3/silex-desktop).
- **Plugin system** — extend with server and client plugins in JS/TS
- **SEO tools** — meta tags, Open Graph, per-page settings
- **Self-hosting** — Docker, Node.js, or one-click deploy on [CapRover](https://caprover.com/)

## Quick start

**Use it online** — **[v3.silex.me](https://v3.silex.me/)** (free, requires a GitLab account for storage)

**Desktop app (alpha)** — [download for Windows, macOS or Linux](https://github.com/silexlabs/Silex/releases/latest). Work offline, no account needed.

## Contribute

```sh
git clone --recurse-submodules https://github.com/silexlabs/Silex.git
cd Silex
pnpm install && pnpm build && pnpm start
```

Then open [http://localhost:6805](http://localhost:6805). For Docker and production setups, see the [self-hosting guide](https://docs.silex.me).

Useful links to get you contributing fast:

- **[Good first issues](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)** — start here
- **[Contributing guide](./CONTRIBUTING.md)** — coding standards, PR process, discuss-first rule
- **[Community forums](https://community.silex.me)** — ask questions, share ideas
- **[Chat](https://short.silex.me/chat)** — quick help
- **[Bug reports](https://github.com/silexlabs/Silex/issues)**
- **[AI-assisted coding](AGENTS.md)** — setup guide for Claude Code, Cursor, opencode, etc.

See the [Development](#development) section below for build and release workflow.

## Development

### How the repo is organized

This is a **monorepo**. The **Silex app itself is a single package** (one `package.json`, one build) — the editor, server and common code are *not* split into separate packages. The code is split by role:

| Folder | What it is |
|---|---|
| `editor/` | the GrapesJS-based visual editor (browser); built with webpack |
| `server/` | the Node.js server, storage/hosting connectors and `server/deploy/` (SaaS / CapRover) |
| `common/` | shared contracts and types, plus the plugin-config system |
| `grapesjs-plugins/` | the first-party GrapesJS plugins — **independently publishable** packages (see *Workspaces* below) whose source the editor build compiles directly |
| `server-rust/` | the Rust server library |
| `desktop/` | the [Tauri](https://tauri.app/) desktop app (embeds `server-rust/` + the editor frontend) |
| `silex-dashboard/`, `silex-dashboard-2026/` | the multi-site SaaS dashboards — **git submodules** (see *Submodules* below) |

Cross-folder imports use path aliases (`~/common`, `~/editor`, `~/server`) — no `../../`. The first-party plugins are imported by package name (`@silexlabs/grapesjs-*`), resolved to their source via webpack aliases (see *Workspaces* below). The Rust crates (`server-rust/`, `desktop/`) form a separate [Cargo workspace](https://doc.rust-lang.org/cargo/reference/workspaces.html).

Issues and pull requests all live in **this single repository**. A single branch can change several areas at once (e.g. the editor and one of its plugins).

#### Workspaces (the `grapesjs-plugins/`)

We use a [pnpm workspace](https://pnpm.io/workspaces) (`pnpm-workspace.yaml`) **only** for the plugins under `grapesjs-plugins/*` — to install, lint, test and **publish them as independent packages**. Two things to understand:

- The Silex app build does *not* use the workspace. The editor compiles each plugin's *source* directly, resolved through webpack aliases + tsconfig `paths` (see `webpack.config.js`) — not through `node_modules` linking. So building/running Silex never depends on the plugins being installed as packages. The app's own install stays lean (`pnpm install --filter @silexlabs/silex`, as in `Dockerfile`).
- The plugins are versioned and released independently. We deliberately do **not** use the `workspace:` protocol between them — a Silex release does not force a plugin release, and vice-versa. The **only** exception is `@silexlabs/expression-input`, a small internal lib used by `grapesjs-advanced-selector` and `grapesjs-data-source`: it is linked locally (`"@silexlabs/expression-input": "workspace:*"`) so those plugins always build and test against its current source.

Per-plugin tasks (each plugin keeps its own `package.json`, build, lint and test):

```sh
pnpm test:plugins     # run each plugin's own test
pnpm lint:plugins     # run each plugin's own lint
pnpm build:plugins    # build each plugin (for publishing)
# or target one:  pnpm --filter @silexlabs/grapesjs-symbols run test
```

> The plugins come from separate repos and still have heterogeneous toolchains (some scripts call `yarn`, some use `web-test-runner`). Normalizing them to pnpm and getting every plugin green is ongoing — contributions welcome.

#### Submodules (the dashboards)

`silex-dashboard/` and `silex-dashboard-2026/` are **git submodules** — they are *content* (multi-site dashboards built with Silex), not core code, so they live in their own repos and are pinned here. Clone with submodules:

```sh
git clone --recurse-submodules git@github.com:silexlabs/Silex.git
# already cloned? pull them in with:
git submodule update --init --recursive
```

The SaaS server serves the pre-built dashboard from `silex-dashboard/_site` (see `server/deploy/server-plugins/dashboard.js`). You don't need the submodules to develop the editor — only to run the full multi-site SaaS.

Day-to-day work happens on `main` — PRs target this branch. Deployments are driven by git tags: prerelease tags (e.g. `v3.7.0-1`) deploy to [canary.silex.me](https://canary.silex.me) and produce desktop test builds; stable tags (e.g. `v3.7.0`) deploy to [v3.silex.me](https://v3.silex.me) and publish desktop downloads.

### Dev setup

```sh
git clone --recurse-submodules git@github.com:silexlabs/Silex.git
cd Silex
nvm install        # optional — uses version from .nvmrc
pnpm install       # install dependencies
pnpm build         # build the editor + server
pnpm start         # start the editor at http://localhost:6805
```

For the Rust side: `cargo check` (or `cargo build`) at the repo root builds `server-rust/` and `desktop/`.

### Working on the code

1. Fork `silexlabs/Silex` on GitHub and add your fork as a remote:
   ```sh
   git remote add fork git@github.com:<your-username>/Silex.git
   ```
2. Create a branch, edit the code (anywhere under `editor/`, `server/`, `common/`, `grapesjs-plugins/`, `server-rust/`, `desktop/`), commit and push to your fork:
   ```sh
   git checkout -b my-fix
   # ... make changes ...
   git commit -m "fix: description of the fix"
   git push fork my-fix
   ```
3. Open a PR from your fork against `silexlabs/Silex`

Before pushing: `pnpm lint` and `pnpm test` (and `cargo test -p silex-server` for the Rust server) — these run in CI on every PR.

### Releasing

Releases are driven by git tags. Push a tag matching `v*` and CI (`.github/workflows/`) builds the desktop apps (macOS, Windows, Linux), publishes a GitHub release with the auto-updater metadata, and deploys the server to CapRover (canary on `main`, production on a stable tag).

## AI / Vibe coding

> Design websites with AI — open, local, yours. [Learn more](https://www.silex.me/ai/)

The upcoming Silex Desktop app will let you create and transform sites through prompts: describe what you want, see it built live, refine the design in real time, publish clean HTML/CSS anywhere.

Silex uses [MCP](https://modelcontextprotocol.io/) (Model Context Protocol), an open standard — so you choose your AI. Run a local model with [Ollama](https://ollama.com/) for full privacy, or use any MCP-compatible tool: [OpenCode](https://opencode.ai/), [Goose](https://goose-docs.ai/), Claude Code, etc. The MCP server is optimized for small local models (7B+).

See the [vibe coding roadmap](https://roadmap.silex.me/posts/65/vibe-coding-with-silex-desktop) for what's coming (prompt library, examples cookbook, best practices guide — contributions welcome).

### MCP setup (for developers)

Once Silex Desktop is running, connect your AI tool to:

```
http://localhost:6807/mcp
```

**[OpenCode](https://opencode.ai/)** — add an MCP server in your [config file](https://opencode.ai/docs/mcp-servers) with URL `http://localhost:6807/mcp`.

**[Goose](https://goose-docs.ai/)** — add a remote server in your [profile config](https://goose-docs.ai/docs/getting-started/using-extensions#remote-extensions-over-streamable-http) with endpoint `http://localhost:6807/mcp`.

**Claude Code** — `claude mcp add --transport http silex http://localhost:6807/mcp`

**Any other MCP client** — use a Streamable HTTP transport pointed at the same URL.

## Contributors

Silex is the work of contributors from all over the world. This project is maintained by [Alex Hoyau](https://lexoyo.me) and owned by the non-profit [Silex Labs](https://www.silexlabs.org/)

<!-- Auto generated contributors -->

**2026** — [Alex Hoyau](https://github.com/lexoyo), [Ola Mohamed](https://github.com/ola-a11y), [Syed Ishmum Ahnaf](https://github.com/SyedIshmumAhnaf), [Safal2004](https://github.com/Safal2004), [Wassim Triki](https://github.com/wassim-triki)

**2025** — [Alex Hoyau](https://github.com/lexoyo), [ceubri](https://github.com/ceubri), [Mazen Kamal](https://github.com/Mazen050), Piotr Golebiewski, [oliviermgx](https://github.com/oliviermgx)

**2024** — [Alex Hoyau](https://github.com/lexoyo), [oliviermgx](https://github.com/oliviermgx), [JeremyZXi](https://github.com/JeremyZXi), [SuperDelphi](https://github.com/SuperDelphi)

**2023** — [Alex Hoyau](https://github.com/lexoyo), [Eskeminha](https://github.com/Eskeminha), [Ari Karageorgos](https://github.com/arisk)

**2022** — [Alex Hoyau](https://github.com/lexoyo), [Khaled Bentoumi](https://github.com/BentoumiTech)

**2021** — [Alex Hoyau](https://github.com/lexoyo)

**2020** — [Alex Hoyau](https://github.com/lexoyo)

**2019** — [Alex Hoyau](https://github.com/lexoyo)

**2018** — [Alex Hoyau](https://github.com/lexoyo), [Jean-Baptiste Richardet](https://github.com/JbIPS), [jotakar](https://github.com/jotakar), [swakarm](https://github.com/swakarm)

**2017** — [Alex Hoyau](https://github.com/lexoyo), [Jean-Baptiste Richardet](https://github.com/JbIPS), [Jenn Parker](https://github.com/jennparker), [Rapenne Solène](https://github.com/rapenne-s), [tariqbenezza](https://github.com/tariqbenezza), [singchan](https://github.com/singchan)

**2016** — [Alex Hoyau](https://github.com/lexoyo), [singchan](https://github.com/singchan), [Pierre Ozoux](https://github.com/pierreozoux)

**2015** — [Alex Hoyau](https://github.com/lexoyo), [singchan](https://github.com/singchan), [Christophe](https://github.com/ondrejec), [Pierre Ozoux](https://github.com/pierreozoux), [René Föhring](https://github.com/rrrene), [christian-bromann](https://github.com/christian-bromann)

**2014** — [Alex Hoyau](https://github.com/lexoyo), [Camille Gérard-Hirne](https://github.com/camcrock), [neocorp64](https://github.com/NeoCorp), Michele Martone, [peoslaap](https://github.com/peoslaap)

**2013** — [Alex Hoyau](https://github.com/lexoyo), Yann Le Scouarnec, TheCause, yanhick, Thomas Fetiveau



<!-- Auto generated contributors -->

## Links

- [Official website](https://www.silex.me/)
- [Manifesto](https://www.silex.me/manifesto/) — our values and commitments
- [User documentation](https://docs.silex.me/)
- [Developer documentation](https://docs.silex.me/en/dev)
- [Road map](https://roadmap.silex.me) — help define tasks and priorities
- [Community forums](https://community.silex.me)
- [Newsletter (EN)](https://short.silex.me/news_en) | [(FR)](https://short.silex.me/news_fr)
- [OpenCollective](https://opencollective.com/silex) — financial contributions

## Built on

Silex stands on the shoulders of these open-source projects and their communities:

- [GrapesJS](https://github.com/GrapesJS/grapesjs) — front-end drag-and-drop framework
- [11ty (Eleventy)](https://www.11ty.dev/) — static site generator used for CMS integration
- [Tauri](https://tauri.app/) — desktop app framework (Rust + WebView)
- [TypeScript](https://www.typescriptlang.org/) — language used across packages

## Credits

Brought to you since 2009 by [Alex Hoyau](https://lexoyo.me) and the Silex community.

Silex is free/libre software. [Join the community](https://community.silex.me/), [contribute](./CONTRIBUTING.md), [donate](https://opencollective.com/silex), or [report bugs](https://github.com/silexlabs/Silex/issues).
