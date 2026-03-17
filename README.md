[![Stars](https://img.shields.io/github/stars/silexlabs/Silex?colorA=2c2837&colorB=c9cbff&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/stargazers)
[![Issues](https://img.shields.io/github/issues-raw/silexlabs/Silex?colorA=2c2837&colorB=f2cdcd&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/issues)
[![License](https://img.shields.io/github/license/silexlabs/Silex?colorA=2c2837&colorB=b5e8e0&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/blob/main/LICENSE)
[![Latest commit](https://img.shields.io/github/last-commit/silexlabs/Silex/main?colorA=2c2837&colorB=ddb6f2&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/commits/main)

# The visual builder for static sites.

Stick to the standards, own your tools — this should be the norm.

Visual editor, CMS integration, hosting included — all in one free/libre and open-source platform.

**[Try Silex online](https://v3.silex.me/)** | **[Documentation](https://docs.silex.me)** | **[Desktop app — coming soon](https://roadmap.silex.me/posts/3/silex-desktop)**

![Silex UI](https://github.com/silexlabs/www.silex.me/raw/gh-pages/assets/silex-ui.gif)

## Who is Silex for?

- **Web agencies** — replace hand-coded HTML/CSS with a visual workflow. Design in Silex, deploy static files, done. Scale client work without scaling your team.
- **WordPress developers** — build custom frontends visually, pull content from WP via GraphQL. Keep WordPress as your CMS, ditch the theme layer.
- **Freelance webdesigners** — create client sites without writing code. Silex exposes HTML and CSS concepts to you, nothing more. Export standard HTML, host anywhere.
- **No-code developers** — go beyond Wix/Squarespace. Full CSS control, no vendor lock-in, design with dynamic data that your clients can edit.

> _"The only open source alternative to Webflow."_ — _"The most powerful and graphically precise website builder that I have experienced."_

## Features

- **[GrapesJS](https://grapesjs.com/)-based visual editor** — drag-and-drop page building with HTML, CSS, and JS editors
- **Static HTML output** — fast, secure, easy to host anywhere
- **CMS integration** — bind components to WordPress, Strapi, Squidex, or any GraphQL API
- **[11ty](https://www.11ty.dev/) compatible** — generate static sites from Silex templates, deploy with CI/CD
- **Desktop app (coming soon)** — work offline, no account needed, AI-ready with built-in [MCP server](#ai--vibe-coding). Built with [Tauri](https://tauri.app/) for Windows, macOS, Linux. [Follow progress](https://roadmap.silex.me/posts/3/silex-desktop).
- **Plugin system** — extend with server and client plugins in JS/TS
- **SEO tools** — meta tags, Open Graph, per-page settings
- **Self-hosting** — Docker, Node.js, or one-click deploy on [CapRover](https://caprover.com/), [YunoHost](https://yunohost.org/), [Elest.io](https://elest.io/)
- **Free forever** — 100% free/libre, maintained by the non-profit [Silex Labs](https://www.silexlabs.org/)

## Quick start

```sh
npx @silex/silex
```

Then open [http://localhost:6805](http://localhost:6805).

## Contributing

Silex is a small project maintained by a handful of contributors. We'd love your help — whether it's fixing a bug, improving the docs, or just reporting issues.

- **[Contributing guide](https://docs.silex.me/en/dev/contribute)** — how to get started
- **[Community forums](https://community.silex.me)** — ask questions, share ideas
- **[Chat](https://short.silex.me/chat)** — quick help
- **[Bug reports](https://github.com/silexlabs/Silex/issues)**

### Dev setup

This repo contains all Silex packages as git submodules, managed with [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/).

```sh
git clone git@github.com:<your-handle>/Silex.git --recurse-submodules -j8
cd Silex
nvm install        # optional — uses version from .nvmrc
yarn install       # installs dependencies and builds all packages
npm start          # starts the editor at http://localhost:6805
```

**Windows users:** Run `yarn install --ignore-scripts && yarn run build` instead.

### Working on a submodule

Each package in `packages/` is its own git repo. To contribute:

1. Fork the package repo (e.g. `silexlabs/silex-desktop`)
2. Point your local submodule to your fork:
   ```sh
   cd packages/silex-desktop
   git remote set-url origin git@github.com:<your-username>/silex-desktop.git
   ```
3. Make changes, commit, and open a PR against the upstream repo

### Useful commands

| Command | Description |
|---|---|
| `npm start` | Start Silex (dev mode) |
| `npm run start:debug` | Start with debug logging |
| `yarn run build` | Build all packages |
| `git submodule foreach '<cmd>'` | Run a command in every submodule |

### Releasing

Run `npm run release` for guided version bumping across packages. Run without arguments to see help and options (prepatch, preminor, patch, minor, dry-run).

## Packages

### Core

| Package | Description |
| ------- | ----------- |
| [silex-lib](https://github.com/silexlabs/silex-lib) | Core library — Node.js server, editor, npx CLI, Docker image |
| [silex-server](https://github.com/silexlabs/silex-server) | Rust server — local file storage (OAuth connectors coming) |
| [silex-desktop](https://github.com/silexlabs/silex-desktop) | Desktop app (Tauri v2, coming soon) — offline, no account, built-in MCP |
| [silex-plugins](https://github.com/silexlabs/silex-plugins) | Plugin system, environment agnostic, inspired by 11ty config |
| [silex-plugin-starter](https://github.com/silexlabs/silex-plugin-starter) | Starter template for writing Silex plugins (JS/TS) |
| [silex-dashboard](https://github.com/silexlabs/silex-dashboard) | Dashboard plugin for managing websites |
| [silex-dashboard-2026](https://gitlab.com/silexlabs/silex_silex-dashboard-2026) | Next-gen dashboard (WIP) |
| [silex-platform](https://github.com/silexlabs/silex-platform) | Silex Labs hosted platform, ready-to-deploy with Docker/CapRover |

### GrapesJS plugins

| Package | Description |
| ------- | ----------- |
| [grapesjs-data-source](https://github.com/silexlabs/grapesjs-data-source) | Integrate APIs (WordPress, Strapi, GraphQL) into the editor |
| [grapesjs-symbols](https://github.com/silexlabs/grapesjs-symbols) | Reusable elements (symbols) within and across pages |
| [grapesjs-fonts](https://github.com/silexlabs/grapesjs-fonts) | Custom fonts management |
| [grapesjs-advanced-selector](https://github.com/silexlabs/grapesjs-advanced-selector) | Advanced CSS selector management |
| [grapesjs-css-variables](https://github.com/silexlabs/grapesjs-css-variables) | Define and use CSS custom properties (`--var`) |
| [grapesjs-filter-styles](https://github.com/silexlabs/grapesjs-filter-styles) | Search bar in the Style Manager |
| [grapesjs-notifications](https://github.com/silexlabs/grapesjs-notifications) | Centralized notification system for plugins |
| [grapesjs-loading](https://github.com/silexlabs/grapesjs-loading) | Loading bar during site load/save |
| [grapesjs-keymaps-dialog](https://github.com/silexlabs/grapesjs-keymaps-dialog) | Floating UI showing keyboard shortcuts |
| [grapesjs-storage-rate-limit](https://github.com/silexlabs/grapesjs-storage-rate-limit) | Rate-limited auto-save |
| [grapesjs-version-flow](https://github.com/silexlabs/grapesjs-version-flow) | Version upgrades and migrations with changelog UI |
| [grapesjs-ai-capabilities](https://github.com/silexlabs/grapesjs-ai-capabilities) | Discovery/metadata layer for AI agents and MCP servers |

### Utilities

| Package | Description |
| ------- | ----------- |
| [expression-input](https://github.com/silexlabs/expression-input) | Web components for expression editing and form overlays |
| [eleventy-plugin-concat](https://github.com/silexlabs/eleventy-plugin-concat) | 11ty plugin and CLI to bundle scripts and styles |
| [SitemapGen](https://github.com/silexlabs/SitemapGen) | Generate `sitemap.xml` from SSG output |
| [node_modules-path](https://github.com/lexoyo/node_modules-path) | Get the `node_modules` path in scripts and CLI |

## AI / Vibe coding

> Design websites with AI — open, local, yours. [Learn more](https://www.silex.me/ai/)

The upcoming Silex Desktop app will let you create and transform sites through prompts: describe what you want, see it built live, refine the design in real time, publish clean HTML/CSS anywhere.

Silex uses [MCP](https://modelcontextprotocol.io/) (Model Context Protocol), an open standard — so you choose your AI. Run a local model with [Ollama](https://ollama.com/) for full privacy, or use any MCP-compatible tool: [OpenCode](https://opencode.ai/), [Goose](https://block.github.io/goose/), Claude Code, etc. The MCP server is optimized for small local models (7B+).

See the [vibe coding roadmap](https://roadmap.silex.me/posts/65/vibe-coding-with-silex-desktop) for what's coming (prompt library, examples cookbook, best practices guide — contributions welcome).

### MCP setup (for developers)

Once Silex Desktop is running, connect your AI tool to:

```
http://localhost:6807/mcp
```

**[OpenCode](https://opencode.ai/)** — add an MCP server in your [config file](https://opencode.ai/docs/configuration#mcp-servers) with URL `http://localhost:6807/mcp`.

**[Goose](https://block.github.io/goose/)** — add a remote server in your [profile config](https://block.github.io/goose/docs/getting-started/using-extensions#remote-extensions) with endpoint `http://localhost:6807/mcp`.

**Claude Code** — `claude mcp add --transport http silex http://localhost:6807/mcp`

**Any other MCP client** — use a Streamable HTTP transport pointed at the same URL.

## Links

- [Official website](https://www.silex.me/)
- [User documentation](https://docs.silex.me/)
- [Developer documentation](https://docs.silex.me/en/dev)
- [Road map](https://roadmap.silex.me) — help define tasks and priorities
- [Community forums](https://community.silex.me)
- [Newsletter (EN)](https://short.silex.me/news_en) | [(FR)](https://short.silex.me/news_fr)
- [OpenCollective](https://opencollective.com/silex) — financial contributions

## Third party dependencies

- [GrapesJS](https://grapesjs.com/) — front-end drag-and-drop framework
- [TypeScript](https://www.typescriptlang.org/) — language used across packages
- [Tauri](https://tauri.app/) — desktop app framework (Rust + WebView)

## Credits

Brought to you since 2009 by [Alex Hoyau](https://lexoyo.me) and [Silex contributors](https://github.com/silexlabs/Silex/graphs/contributors).

Silex is free/libre software. [Join the community](https://community.silex.me/), [contribute](https://docs.silex.me/en/dev/contribute), [donate](https://opencollective.com/silex), or [report bugs](https://github.com/silexlabs/Silex/issues).
