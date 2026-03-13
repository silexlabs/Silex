[![Stars](https://img.shields.io/github/stars/silexlabs/Silex?colorA=2c2837&colorB=c9cbff&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/stargazers)
[![Issues](https://img.shields.io/github/issues-raw/silexlabs/Silex?colorA=2c2837&colorB=f2cdcd&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/issues)
[![License](https://img.shields.io/github/license/silexlabs/Silex?colorA=2c2837&colorB=b5e8e0&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/blob/main/LICENSE)
[![Latest commit](https://img.shields.io/github/last-commit/silexlabs/Silex/main?colorA=2c2837&colorB=ddb6f2&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/commits/main)

# Silex — The Visual Builder for Static Sites

Stick to the standards, own your tools. Visual editor, CMS integration, hosting — all in one free/libre open-source platform. No vendor lock-in. No tracking. No third-party cookies.

**[Try Silex online](https://v3.silex.me/)** | **[Download the desktop app](https://github.com/silexlabs/silex-desktop/releases/latest)** | **[Documentation](https://docs.silex.me)**

![Silex UI](https://github.com/silexlabs/www.silex.me/raw/gh-pages/assets/silex-ui.gif)

## Features

- **[GrapesJS](https://grapesjs.com/)-based visual editor** — drag-and-drop page building with built-in HTML, CSS, and JavaScript editors
- **Static HTML output** — standard, fast, secure, easy to host anywhere
- **CMS integration** — bind components to WordPress, Strapi, Squidex, or any GraphQL API via the data source plugin
- **[11ty](https://www.11ty.dev/) compatible** — generate static sites from Silex templates, deploy on [GitLab Pages](https://docs.gitlab.com/ee/user/project/pages/) with CI/CD
- **Desktop app** — installable on Windows, macOS, and Linux (built with [Tauri](https://tauri.app/))
- **Plugin system** — extend with server-side and client-side plugins in JS/TS
- **AI-ready** — built-in MCP server, local-first, designed for small local LLMs (7B+) as well as cloud models
- **SEO tools** — meta tags, Open Graph, per-page settings
- **Self-hosting** — Docker, Node.js, or one-click deploy on [CapRover](https://caprover.com/), [YunoHost](https://yunohost.org/), [Elest.io](https://elest.io/)
- **Free forever** — 100% free and open-source, maintained by the non-profit [Silex Labs](https://www.silexlabs.org/)

## Quick start

Run Silex instantly with npx (requires Node.js):

```sh
npx @silex/silex
```

Then open [http://localhost:6805](http://localhost:6805).

Or [download the desktop app](https://github.com/silexlabs/silex-desktop/releases/latest) for a standalone experience.

## AI / MCP integration

The Silex Desktop app includes a built-in [MCP](https://modelcontextprotocol.io/) server that exposes 14 tools for controlling the visual editor — create pages, add components, apply styles, bind CMS data, take screenshots, and more. Any MCP-compatible AI tool can use it.

### Connect to a running app (HTTP)

If Silex Desktop is already open (launched from your dock, shortcut, or `cargo tauri dev`), connect your AI tool to the HTTP endpoint:

```
http://localhost:6807/mcp
```

**Claude Code** — add to `.mcp.json` at project root, or run `claude mcp add --transport http silex http://localhost:6807/mcp`:

```json
{
  "mcpServers": {
    "silex": {
      "type": "http",
      "url": "http://localhost:6807/mcp"
    }
  }
}
```

**Any other MCP client** — point a Streamable HTTP transport at `http://localhost:6807/mcp`.

### Let the AI tool launch Silex (stdio)

If your AI tool manages MCP servers as child processes, configure it to launch Silex Desktop with the `--stdio` flag. The tool starts the app and communicates over stdin/stdout — no manual reconnect needed after restarts.

```json
{
  "mcpServers": {
    "silex": {
      "command": "/path/to/silex-desktop",
      "args": ["--stdio"]
    }
  }
}
```

Replace `/path/to/silex-desktop` with the actual path to the installed binary.

The `--stdio` flag enables the stdio transport alongside the HTTP one. Without it, only HTTP is active.

## Contributing

We welcome contributions of all kinds — code, documentation, bug reports, and community support.

- **[Contributing guide for developers](https://docs.silex.me/en/dev/contribute)** — license, code structure, PR process
- **[Contributing guide for non-developers](https://docs.silex.me/en/user/contribute)** — documentation, translations, community help
- **[Code of Conduct](https://docs.silex.me/en/collaborate)**
- **[Security Policy](https://docs.silex.me/en/security)**

This repository contains all Silex packages as git submodules, managed with [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/).

### Setup

```sh
git clone git@github.com:<your-handle>/Silex.git --recurse-submodules -j8
cd Silex
nvm install        # optional — uses version from .nvmrc
yarn install       # installs dependencies and builds all packages
npm start          # starts the editor
```

Open [http://localhost:6805](http://localhost:6805).

**Windows users:** The preinstall script uses bash syntax. Run `yarn install --ignore-scripts && yarn run build` instead.

### Working on a submodule

Each package in `packages/` is its own git repo (submodule). To contribute to one:

1. Fork the package repo on GitHub (e.g. `silexlabs/silex-desktop`)
2. Point your local submodule to your fork:
   ```sh
   cd packages/silex-desktop
   git remote set-url origin git@github.com:<your-username>/silex-desktop.git
   ```
3. Make changes, commit, and open a PR against the upstream package repo

### Useful commands

| Command | Description |
|---|---|
| `npm start` | Start Silex (dev mode) |
| `npm run start:debug` | Start with debug logging |
| `yarn run build` | Build all packages |
| `git submodule foreach '<cmd>'` | Run a command in every submodule |
| `npm run doc` | Regenerate the package table and code stats below |

### Releasing

Run `npm run release` for guided version bumping across packages. Run without arguments to see help and options (prepatch, preminor, patch, minor, dry-run).

The release script validates uncommitted changes, bumps versions in dependency order, pushes tags, and waits for npm publication between packages.

## Packages

> Auto generated submodules

# Silex packages

| Name | Directory | Repo | Description |
| ---- | --------- | ---- | ----------- |
| @silexlabs/sitemapgen | `packages/SitemapGen` | `git@github.com:silexlabs/SitemapGen.git` | Generate a`sitemap.xml` from a static site generator (SSG) output directory. |
| Silex Puter Plugin | `packages/silex-puter` | `git@github.com:silexlabs/silex-puter.git` | The **Silex Puter Plugin** brings Silex's professional website-building capabilities to the Puter environment, letting users create, save, and publish static websites directly in Puter. This plugin enables seamless integration, making it easier than ever to use Silex within Puter for web design and content management. |
| Silex plugins | `packages/silex-plugins` | `git@github.com:silexlabs/silex-plugins.git` | Environment agnostic (node.js, browser, commonjs, esnext...) open architecture (plugin system) inspired by 11ty.dev config |
| Silex Plugin Starter | `packages/silex-plugin-starter` | `git@github.com:silexlabs/silex-plugin-starter.git` | A good place to start writing a Silex plugin. It supports server and/or client side plugins, in Javascript and TypeScript. Check [Silex developer docs if you need help](https://docs.silex.me/en/dev) or [join the discussions in the forum](https://community.silex.me/) |
| Silex Platform by Silex Labs | `packages/silex-platform` | `git@github.com:silexlabs/silex-platform.git` | This is also a good example on how to customize Silex. And it has a Dockerfile for easy deployment. |
| Silex core library | `packages/silex-lib` | `git@github.com:silexlabs/silex-lib.git` | This repository is the core library of Silex, it is a nodejs server which serves the Silex editor and the websites created with Silex. The core library is used in the online version of Silex, in the desktop app, and in the nodejs integration. It is available as a npx cli, as a docker image, and as a npm/nodejs library. |
| Silex desktop (v2) | `packages/silex-desktop` | `git@github.com:silexlabs/silex-desktop.git` | This is the official [Silex](https://www.silex.me) desktop version, an installable application for Windows, MacOS and linux. |
| Silex Dashboard | `packages/silex-dashboard` | `git@github.com:silexlabs/silex-dashboard.git` | Here is the source code of Silex dashboard. It is a [Silex](https://www.silex.me) plugin which can be installed to manage websites you will then edit in Silex. |
| node_modules Path | `packages/node_modules-path` | `git@github.com:lexoyo/node_modules-path.git` | Get the path of the `node_modules` folder in your scripts or CLI or `package.json`. This is useful when you are building a library that can either be used as an npm dependency or directly, [see this question on SO](https://stackoverflow.com/questions/44279838/copy-assets-from-npm). |
| @silexlabs/grapesjs-version-flow | `packages/grapesjs-version-flow` | `git@github.com:silexlabs/grapesjs-version-flow.git` | A GrapesJS plugin for managing version upgrades and migrations with sequential upgrade flow and modal UI |
| Grapesjs Tailwind(WIP) | `packages/grapesjs-tailwind` | `git@github.com:silexlabs/grapesjs-tailwind.git` | [DEMO](https://codepen.io/ju99ernaut/pen/BaKGadb) |
| Symbols plugin for GrapesJS | `packages/grapesjs-symbols` | `git@github.com:silexlabs/grapesjs-symbols.git` | This plugin enables users to create symbols, which are reusable elements, in a page and accross pages |
| Grapesjs Storage Rate Limit | `packages/grapesjs-storage-rate-limit` | `git@github.com:silexlabs/grapesjs-storage-rate-limit.git` | A plugin for GrapesJS that provides rate-limited storage, allowing you to save changes immediately and then cool down for a specified period before saving again. |
| GrapesJs Notifications Plugin | `packages/grapesjs-notifications` | `git@github.com:silexlabs/grapesjs-notifications.git` | Why this plugin? GrapesJs is a powerful framework to build no-code tools and allow users to create templates using a drag-and-drop interface. However, the framework does not offer a standard way of notifying users and each plugin implements its own, which is messy and not user friendly. This plugin provides a centralized notification system that can be used by all plugins to display messages to the user. |
| Grapesjs Loading | `packages/grapesjs-loading` | `git@github.com:silexlabs/grapesjs-loading.git` | Shows a loading bar while the site is loaded or saved. By default it looks like the classic loading bar on top of the page, e.g. on github.com. |
| GrapesJS Keymap Dialog | `packages/grapesjs-keymaps-dialog` | `git@github.com:silexlabs/grapesjs-keymaps-dialog.git` | This GrapesJS plugin implements a floating UI showing the available keymaps for the editor. |
| Grapesjs Fonts | `packages/grapesjs-fonts` | `git@github.com:silexlabs/grapesjs-fonts.git` | Custom Fonts plugin for grapesjs |
| Grapesjs Filter Styles | `packages/grapesjs-filter-styles` | `git@github.com:silexlabs/grapesjs-filter-styles.git` | This plugin adds a search bar in the Style manager so that users can search for a CSS style |
| GrapesJs Data Source plugin | `packages/grapesjs-data-source` | `git@github.com:silexlabs/grapesjs-data-source.git` | This GrapesJS plugin integrates various APIs into the editor, providing powerful data-driven website building capabilities. |
| GrapesJS AI Copilot | `packages/grapesjs-ai-copilot` | `git@github.com:silexlabs/grapesjs-ai-copilot.git` | ![AI Copilot Banner](https://img.shields.io/badge/AI-Copilot-blue?style=for-the-badge) |
| GrapesJS Advanced Selector Manager | `packages/grapesjs-advanced-selector` | `git@github.com:silexlabs/grapesjs-advanced-selector.git` | An advanced selector management plugin for GrapesJS, designed for cases where the default Selector Manager falls short |
| Expression & Popin Form Components | `packages/expression-input` | `git@github.com:silexlabs/expression-input.git` | A set of reusable web components to manage expressions (chains of tokens) and form overlays.   |
| eleventy-plugin-concat | `packages/eleventy-plugin-concat` | `git@github.com:silexlabs/eleventy-plugin-concat.git` | Eleventy plugin to bundle your scripts and styles |


> Auto generated submodules

## Code stats

> Auto generated count

> Auto generated count

## Links

- [Official website](https://www.silex.me/)
- [User documentation](https://docs.silex.me/)
- [Developer documentation](https://docs.silex.me/en/dev)
- [Road map](https://roadmap.silex.me) — help define tasks and priorities
- [Community forums](https://community.silex.me)
- [Chat](https://short.silex.me/chat)
- [Newsletter (EN)](https://short.silex.me/news_en) | [(FR)](https://short.silex.me/news_fr)
- [Bug reports](https://github.com/silexlabs/Silex/issues)
- [OpenCollective](https://opencollective.com/silex) — financial contributions

## Third party dependencies

- [GrapesJS](https://grapesjs.com/) — front-end drag-and-drop framework
- [TypeScript](https://www.typescriptlang.org/) — language used across packages
- [Tauri](https://tauri.app/) — desktop app framework (Rust + WebView)
- [GLYPHICONS](http://glyphicons.com/) ([CC license](http://creativecommons.org/licenses/by/3.0/)) and [Font Awesome](http://fontawesome.io/) — icons

## Credits

Brought to you since 2009 by [Alex Hoyau](https://lexoyo.me) and [Silex contributors](https://github.com/silexlabs/Silex/graphs/contributors).

Silex is free/libre software. Users are encouraged to [join the community](https://community.silex.me/), [contribute documentation](https://docs.silex.me/), [make a financial contribution](https://opencollective.com/silex), or [report bugs](https://github.com/silexlabs/Silex/issues).
