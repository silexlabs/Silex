[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/silexlabs-silex-badge.png)](https://mseep.ai/app/silexlabs-silex)

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

- **[GrapesJS](https://grapesjs.com/)-based visual editor** — drag-and-drop page building with HTML, CSS, and JS editors
- **Static HTML output** — fast, secure, easy to host anywhere
- **CMS integration** — bind components to WordPress, Strapi, Squidex, or any GraphQL API
- **[11ty](https://www.11ty.dev/) compatible** — generate static sites from Silex templates, deploy with CI/CD
- **Desktop app (coming soon)** — work offline, no account needed, AI-ready with built-in [MCP server](#ai--vibe-coding). Built with [Tauri](https://tauri.app/) for Windows, macOS, Linux. [Follow progress](https://roadmap.silex.me/posts/3/silex-desktop).
- **Plugin system** — extend with server and client plugins in JS/TS
- **SEO tools** — meta tags, Open Graph, per-page settings
- **Self-hosting** — Docker, Node.js, or one-click deploy on [CapRover](https://caprover.com/), [YunoHost](https://yunohost.org/), [Elest.io](https://elest.io/)

## Quick start

**Use it online** — **[v3.silex.me](https://v3.silex.me/)** (free, requires a GitLab account for storage)

**Desktop app (alpha)** — [download for Windows, macOS or Linux](https://github.com/silexlabs/Silex/releases/latest). Work offline, no account needed.

**Run with Node.js:**

```sh
npx @silexlabs/silex
```

Then open [http://localhost:6805](http://localhost:6805).

## Contributing

Silex has been built by contributors from around the world since 2009. Today, over 1,000 people use it every week, and 23,000+ accounts have been created. It's a small, friendly community — you'll get noticed, your PRs get reviewed, and your work has real impact.

- **[Good first issues](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)** — start here
- **[Contributing guide](https://docs.silex.me/en/dev/contribute)** — how to get started
- **[Community forums](https://community.silex.me)** — ask questions, share ideas
- **[Chat](https://short.silex.me/chat)** — quick help
- **[Bug reports](https://github.com/silexlabs/Silex/issues)**

### How the repo is organized

This is a **meta repo** — it doesn't contain much code itself. Instead, it pulls together all Silex packages as [git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) in the `packages/` directory. Dependencies are managed with [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/).

Each package (e.g. `silex-lib`, `grapesjs-fonts`) is its **own git repository** with its own issues, PRs and releases. You can contribute to a single package without touching the rest.

### Dev setup

```sh
git clone git@github.com:silexlabs/Silex.git --recurse-submodules -j8
cd Silex
nvm install        # optional — uses version from .nvmrc
yarn install       # installs dependencies and builds all packages
npm start          # starts the editor at http://localhost:6805
```

**Windows users:** Run `yarn install --ignore-scripts && yarn run build` instead.

### Contributing to a package

1. Fork the package repo on GitHub (e.g. `silexlabs/silex-lib`)
2. Add your fork as a remote:
   ```sh
   cd packages/silex-lib
   git remote add fork git@github.com:<your-username>/silex-lib.git
   ```
3. Create a branch, make changes, push to your fork:
   ```sh
   git checkout -b my-fix
   # ... make changes ...
   git commit -m "fix: description of the fix"
   git push fork my-fix
   ```
4. Open a PR from your fork against the upstream repo (`silexlabs/silex-lib`)

### Releasing

Run `npm run release` for guided version bumping across packages. Run without arguments to see help and options (prepatch, preminor, patch, minor, dry-run).

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

## Packages

<details>
<summary>This project is made up of 24 packages — click to expand</summary>

<!-- Auto generated submodules -->

| Package | Description |
| ------- | ----------- |
| [@silexlabs/sitemapgen](https://github.com/silexlabs/SitemapGen) | Generate a`sitemap.xml` from a static site generator (SSG) output directory. |
| [Silex Server (Rust)](https://github.com/silexlabs/silex-server) | A Rust implementation of the Silex website builder server, providing storage and hosting connectors for website manag... |
| [Silex plugins](https://github.com/silexlabs/silex-plugins) | Environment-agnostic plugin system for Silex, inspired by 11ty config. |
| [Silex Plugin Starter](https://github.com/silexlabs/silex-plugin-starter) | Starter template for writing Silex plugins. |
| [Silex Platform by Silex Labs](https://github.com/silexlabs/silex-platform) | Ready-to-deploy Silex instance maintained by Silex Labs. |
| [Silex core library](https://github.com/silexlabs/silex-lib) | Core library of Silex — Node.js server, visual editor, npx CLI and Docker image. |
| [Silex Desktop](https://github.com/silexlabs/silex-desktop) | Desktop application for Silex, the free/libre no-code website builder. |
| [Silex Dashboard](https://github.com/silexlabs/silex-dashboard) | Dashboard plugin for managing websites in Silex. |
| [Silex Dashboard 2026](https://gitlab.com/silexlabs/silex_silex-dashboard-2026) | Next-generation dashboard for Silex, replacing the legacy Vue.js dashboard. |
| [node_modules Path](https://github.com/lexoyo/node_modules-path) | Get the path of the `node_modules` folder in your scripts or CLI or `package.json`. |
| [@silexlabs/grapesjs-version-flow](https://github.com/silexlabs/grapesjs-version-flow) | A GrapesJS plugin for managing version upgrades and migrations with sequential upgrade flow and modal UI |
| [Symbols plugin for GrapesJS](https://github.com/silexlabs/grapesjs-symbols) | This plugin enables users to create symbols, which are reusable elements, in a page and accross pages |
| [Grapesjs Storage Rate Limit](https://github.com/silexlabs/grapesjs-storage-rate-limit) | A plugin for GrapesJS that provides rate-limited storage, allowing you to save changes immediately and then cool down... |
| [GrapesJs Notifications Plugin](https://github.com/silexlabs/grapesjs-notifications) | Centralized notification system for GrapesJS plugins. |
| [Grapesjs Loading](https://github.com/silexlabs/grapesjs-loading) | Shows a loading bar while the site is loaded or saved. |
| [GrapesJS Keymap Dialog](https://github.com/silexlabs/grapesjs-keymaps-dialog) | This GrapesJS plugin implements a floating UI showing the available keymaps for the editor. |
| [Grapesjs Fonts](https://github.com/silexlabs/grapesjs-fonts) | Custom Fonts plugin for grapesjs |
| [Grapesjs Filter Styles](https://github.com/silexlabs/grapesjs-filter-styles) | This plugin adds a search bar in the Style manager so that users can search for a CSS style |
| [GrapesJs Data Source plugin](https://github.com/silexlabs/grapesjs-data-source) | This GrapesJS plugin integrates various APIs into the editor, providing powerful data-driven website building capabil... |
| [GrapesJS CSS Variables](https://github.com/silexlabs/grapesjs-css-variables) | Define and manage CSS custom properties in GrapesJs editors, e.g. `--primary`. |
| [GrapesJS AI Capabilities](https://github.com/silexlabs/grapesjs-ai-capabilities) | Discovery and metadata layer for GrapesJS commands. |
| [GrapesJS Advanced Selector Manager](https://github.com/silexlabs/grapesjs-advanced-selector) | An advanced selector management plugin for GrapesJS, designed for cases where the default Selector Manager falls short |
| [Expression & Popin Form Components](https://github.com/silexlabs/expression-input) | A set of reusable web components to manage expressions (chains of tokens) and form overlays. |
| [eleventy-plugin-concat](https://github.com/silexlabs/eleventy-plugin-concat) | Eleventy plugin to bundle your scripts and styles. |


<!-- Auto generated submodules -->

</details>

## Contributors

Silex is made up of many packages (git submodules), each with its own contributors. This project is maintained by [Alex Hoyau](https://lexoyo.me) and owned by the non-profit [Silex Labs](https://www.silexlabs.org/)

<!-- Auto generated contributors -->

**2026** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/b5138ce5cd191daf20e1250db91dda33480b78ee), [Safal2004](https://github.com/silexlabs/silex-dashboard/commit/ee9f1a86bd95afaced7180bb9dc5e45d39ca8bc3), [Wassim Triki](https://github.com/silexlabs/Silex/commit/ad0d0c27b41fe0813dcfc81ec74993899bd04bd6)

**2025** — [Alex Hoyau](https://github.com/silexlabs/eleventy-plugin-concat/commit/3a76523aedcc559cb8cb4352d6e7650c128aa03a), [ceubri](https://gitlab.com/silexlabs/silex_silex-dashboard-2026/commit/b2ec28ff587000d7db6a75defed7e818f1dc0db3), [Mazen Kamal](https://github.com/silexlabs/silex-lib/commit/fa7a7af1d1c60ff9e8106c0ba857faba78bb67fd), [Piotr Golebiewski](https://github.com/silexlabs/grapesjs-fonts/commit/56411dccbc37eccf187eb0567fbb9c198b56c6a6), [oliviermgx](https://github.com/silexlabs/Silex/commit/5ec66e5d0c4f20f98a1a8b1f58f162fc5838882e)

**2024** — [Alex Hoyau](https://github.com/silexlabs/silex-platform/commit/41132b3ab316916da1a843dcb0163b1b0c09e431), [oliviermgx](https://github.com/silexlabs/silex-lib/commit/c03c796a5536b391b1101e06665ed90a049d0093), [JeremyZXi](https://github.com/silexlabs/silex-lib/commit/0c1fe22d56b8493b0273eb0a78ee49e55343c259), [SuperDelphi](https://github.com/silexlabs/silex-lib/commit/44f2023803f34761772c881ee58a5487bc9ea32b)

**2023** — [Alex Hoyau](https://github.com/silexlabs/grapesjs-data-source/commit/f3ead04500606620a7da4f81b596efd245b4a664), [Eskeminha](https://github.com/silexlabs/grapesjs-fonts/commit/29876050c7de637519f538aa6c130fc2d2147d31), [Ari Karageorgos](https://github.com/silexlabs/grapesjs-fonts/commit/e6e69d5ee24f2cbd9e2ea72845038a3f64fcc51a)

**2022** — [Alex Hoyau](https://github.com/silexlabs/grapesjs-symbols/commit/497c2b5d34a1fecb4a137ddd296a92b0536be631), [Makara Sok](https://github.com/lexoyo/node_modules-path/commit/530e94c4d360a3b5f4c9538338162a283ac398af), [Khaled Bentoumi](https://github.com/silexlabs/grapesjs-symbols/commit/915fa0511497817f9af35c12aa96ce22c6290a40)

**2021** — [Alex Hoyau](https://github.com/silexlabs/silex-platform/commit/d042a580a03ad7cb744fe714317d4631b5767ed7)

**2020** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/fb7eebca0281032810053ac83b6e89130b636a0c), [Fredrik Söderquist](https://github.com/lexoyo/node_modules-path/commit/038aa91510fedff09ff47038ad12e6ad604020eb)

**2019** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/ac23a53308bc8bb22d40cc933ebf945d89356991)

**2018** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/e1a3bb271c3b57745390099e84b693df702c1f82), [Jean-Baptiste Richardet](https://github.com/silexlabs/silex-lib/commit/bfc91263712d68001845c3a81c90693648a00c79), [jotakar](https://github.com/silexlabs/silex-lib/commit/2eb4a718403e1d49417093ab7975abce2df0aa50), [swakarm](https://github.com/silexlabs/silex-lib/commit/f28e75392f34930c12227139b3cd958b195c51af)

**2017** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/c81f28becb569768bcdebc45830530c316c67c69), [Jean-Baptiste Richardet](https://github.com/silexlabs/silex-lib/commit/3108529302a6afdfdb6d348eba7e3aebfea1272c), [Jenn Parker](https://github.com/silexlabs/silex-lib/commit/fc129b8ccec4e3bb09b7d33fbd42f1fe72462fcc), [Rapenne Solène](https://github.com/silexlabs/silex-lib/commit/4e91fb89cab3d6b3ff9d6ab525b795b0a9ea5699), [tariqbenezza](https://github.com/silexlabs/silex-lib/commit/52e0bb1ff3e36e5d788f120a606f3c626658fc60), [singchan](https://github.com/silexlabs/silex-lib/commit/34a9cc9537738843ee0a7fc4de4ead9c5d153877)

**2016** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/99b57279fdd73448770fb13cad21877d8afa710b), [singchan](https://github.com/silexlabs/silex-lib/commit/2794c835bf819d34978dba68f66d15e7ca401344), [Pierre Ozoux](https://github.com/silexlabs/silex-lib/commit/80bcbeea30114c7d4de1fb1398712a191ea5027f)

**2015** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/fdba661185c530ffc1f6e86a3616dcd663003475), [singchan](https://github.com/silexlabs/silex-lib/commit/c9edb6fb4be71b6b8cc5b6a62217fa54501be2a0), [Christophe](https://github.com/silexlabs/silex-lib/commit/945108e1b15fa62085cc17d6774610cb2198382e), [Pierre Ozoux](https://github.com/silexlabs/silex-lib/commit/94ba6133c3d6b71b5ef926129684a3143c6d4aea), [René Föhring](https://github.com/silexlabs/silex-lib/commit/856ed96545887721d91c242ff7469cb991351b0f), [christian-bromann](https://github.com/silexlabs/silex-lib/commit/a700472aea2c2872be98d8c27624809d403a5cbf)

**2014** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/997c77eeb0eea7a7c51b0995eb68ffd47787b54b), [Camille Gérard-Hirne](https://github.com/silexlabs/silex-lib/commit/004cb78c1d22d7c98a813db1c248b37dcaadc59a), [neocorp64](https://github.com/silexlabs/silex-lib/commit/7826c144740512054fb4da780416101a9b865aad), [Michele Martone](https://github.com/silexlabs/silex-lib/commit/afb6f843ec5798e6bae8c6927ff48da5cd7abb84), [peoslaap](https://github.com/silexlabs/silex-lib/commit/78af56973f05537c1a087791d8985523875e9d15)

**2013** — [Alex Hoyau](https://github.com/silexlabs/silex-lib/commit/4b794ed0c92477c818e634ec93c92a21a532a861), [Yann Le Scouarnec](https://github.com/silexlabs/silex-lib/commit/061734c0ad044ed819530b6667805e76e2f7585a), [TheCause](https://github.com/silexlabs/silex-lib/commit/a9dc6da9cbef495e7c89ae15e1d9c8fc1496804c), [yanhick](https://github.com/silexlabs/silex-lib/commit/b24de1f9cfcfd0378aa018940ebb540b00a4a8d0), [Thomas Fetiveau](https://github.com/silexlabs/silex-lib/commit/c39b1045e0ee33c9d164f956081a8fa71fed4264)



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

- [GrapesJS](https://grapesjs.com/) — front-end drag-and-drop framework
- [11ty (Eleventy)](https://www.11ty.dev/) — static site generator used for CMS integration
- [Tauri](https://tauri.app/) — desktop app framework (Rust + WebView)
- [TypeScript](https://www.typescriptlang.org/) — language used across packages

## Credits

Brought to you since 2009 by [Alex Hoyau](https://lexoyo.me) and the Silex community.

Silex is free/libre software. [Join the community](https://community.silex.me/), [contribute](https://docs.silex.me/en/dev/contribute), [donate](https://opencollective.com/silex), or [report bugs](https://github.com/silexlabs/Silex/issues).
