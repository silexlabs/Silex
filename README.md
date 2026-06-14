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

Cross-folder imports use path aliases (`~/common`, `~/editor`, `~/server`, `~/grapesjs-plugins`) — no `../../`. The Rust crates (`server-rust/`, `desktop/`) form a separate [Cargo workspace](https://doc.rust-lang.org/cargo/reference/workspaces.html).

Issues and pull requests all live in **this single repository**. A single branch can change several areas at once (e.g. the editor and one of its plugins).

#### Workspaces (the `grapesjs-plugins/`)

We use a [pnpm workspace](https://pnpm.io/workspaces) (`pnpm-workspace.yaml`) **only** for the plugins under `grapesjs-plugins/*` — to install, lint, test and **publish them as independent packages**. Two things to understand:

- **The Silex app build does *not* use the workspace.** The editor compiles each plugin's *source* directly, resolved through webpack aliases + tsconfig `paths` (see `webpack.config.js`) — not through `node_modules` linking. So building/running Silex never depends on the plugins being installed as packages. The app's own install stays lean (`pnpm install --filter @silexlabs/silex`, as in `server/deploy/Dockerfile`).
- **The plugins are versioned and released independently.** We deliberately do **not** use the `workspace:` protocol between them — a Silex release does not force a plugin release, and vice-versa. The **only** exception is `@silexlabs/expression-input`, a small internal lib used by `grapesjs-advanced-selector` and `grapesjs-data-source`: it is linked locally (`"@silexlabs/expression-input": "workspace:*"`) so those plugins always build and test against its current source.

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

**2026** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/e37630f00ab55ded290a6194ba6f10514ff9d58a), [Ola Mohamed](https://github.com/silexlabs/Silex/commit/d48941d14f4e4e61530a47cd9e83746cbc64e280), [Syed Ishmum Ahnaf](https://github.com/silexlabs/Silex/commit/b1f1fd5aa7afdf048a7981838eae1222022ddea3), [Safal2004](https://github.com/silexlabs/Silex/commit/1a0dcb59bc28fc480dc5cc3927e43e1b083c3a01), [Wassim Triki](https://github.com/silexlabs/Silex/commit/ad0d0c27b41fe0813dcfc81ec74993899bd04bd6)

**2025** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/4f3dbd2bbfa189d6d6ef0062a7abe9f42e08497f), [ceubri](https://github.com/silexlabs/Silex/commit/b52dbc16b98e101a6cba59b0c9951bd2302bb008), [Mazen Kamal](https://github.com/silexlabs/Silex/commit/17b6769949773c00eae073c6ca8b9978ecdad3a9), [Piotr Golebiewski](https://github.com/silexlabs/Silex/commit/857b49eeefb2026df5beffe902383903956053c6), [oliviermgx](https://github.com/silexlabs/Silex/commit/5ec66e5d0c4f20f98a1a8b1f58f162fc5838882e)

**2024** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/f363c73328a726dc8e699d9a75e5c75b2651c4b5), [oliviermgx](https://github.com/silexlabs/Silex/commit/6a55b1ddc9f7191d7db3e39a56184bfe1f26f43f), [JeremyZXi](https://github.com/silexlabs/Silex/commit/5c08b50e10c4a5aab012f07c53187c758d338c6d), [SuperDelphi](https://github.com/silexlabs/Silex/commit/77832471c46bde4aad944f9bae79a45a4e21cd75)

**2023** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/1d52146f38186e0c265bb438662e04ce3acca120), [Eskeminha](https://github.com/silexlabs/Silex/commit/387313bbcf212026e27908a4e85682e45ea839ae), [Ari Karageorgos](https://github.com/silexlabs/Silex/commit/eadfce5e0ab89a3e4cc1fa763666020ab0ae114a)

**2022** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/5a71922f6e1acfceb822685a17822ddc0c4d9f9e), [Khaled Bentoumi](https://github.com/silexlabs/Silex/commit/2f3b5ced749e770f6a20b80c54ea9a1f2c4d493d)

**2021** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/c438c6f69fbc3ac63c838a1609b5b6d9a6640f66)

**2020** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/bf45d1f896b59705401e6607edf4f78c0315e55b)

**2019** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/5964d0c46a120522aaae5ff0a1830aadb4c7a921)

**2018** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/92f62a9d0ba016c01ede2309022fa7628d0118d3), [Jean-Baptiste Richardet](https://github.com/silexlabs/Silex/commit/3b81dfad359ec73cc196c3612fbec1fcd9562a33), [jotakar](https://github.com/silexlabs/Silex/commit/859d24a6c53f202f661c44bf9f0d89cf820df13d), [swakarm](https://github.com/silexlabs/Silex/commit/7a4d6979de9f685086a9aa3f561e780019d31868)

**2017** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/2a4835116055dcb8251e24063360ded641c357f1), [Jean-Baptiste Richardet](https://github.com/silexlabs/Silex/commit/3108529302a6afdfdb6d348eba7e3aebfea1272c), [Jenn Parker](https://github.com/silexlabs/Silex/commit/fc129b8ccec4e3bb09b7d33fbd42f1fe72462fcc), [Rapenne Solène](https://github.com/silexlabs/Silex/commit/4e91fb89cab3d6b3ff9d6ab525b795b0a9ea5699), [tariqbenezza](https://github.com/silexlabs/Silex/commit/52e0bb1ff3e36e5d788f120a606f3c626658fc60), [singchan](https://github.com/silexlabs/Silex/commit/34a9cc9537738843ee0a7fc4de4ead9c5d153877)

**2016** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/99b57279fdd73448770fb13cad21877d8afa710b), [singchan](https://github.com/silexlabs/Silex/commit/2794c835bf819d34978dba68f66d15e7ca401344), [Pierre Ozoux](https://github.com/silexlabs/Silex/commit/80bcbeea30114c7d4de1fb1398712a191ea5027f)

**2015** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/fdba661185c530ffc1f6e86a3616dcd663003475), [singchan](https://github.com/silexlabs/Silex/commit/c9edb6fb4be71b6b8cc5b6a62217fa54501be2a0), [Christophe](https://github.com/silexlabs/Silex/commit/945108e1b15fa62085cc17d6774610cb2198382e), [Pierre Ozoux](https://github.com/silexlabs/Silex/commit/94ba6133c3d6b71b5ef926129684a3143c6d4aea), [René Föhring](https://github.com/silexlabs/Silex/commit/856ed96545887721d91c242ff7469cb991351b0f), [christian-bromann](https://github.com/silexlabs/Silex/commit/a700472aea2c2872be98d8c27624809d403a5cbf)

**2014** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/997c77eeb0eea7a7c51b0995eb68ffd47787b54b), [Camille Gérard-Hirne](https://github.com/silexlabs/Silex/commit/004cb78c1d22d7c98a813db1c248b37dcaadc59a), [neocorp64](https://github.com/silexlabs/Silex/commit/7826c144740512054fb4da780416101a9b865aad), [Michele Martone](https://github.com/silexlabs/Silex/commit/afb6f843ec5798e6bae8c6927ff48da5cd7abb84), [peoslaap](https://github.com/silexlabs/Silex/commit/78af56973f05537c1a087791d8985523875e9d15)

**2013** — [Alex Hoyau](https://github.com/silexlabs/Silex/commit/4b794ed0c92477c818e634ec93c92a21a532a861), [Yann Le Scouarnec](https://github.com/silexlabs/Silex/commit/061734c0ad044ed819530b6667805e76e2f7585a), [TheCause](https://github.com/silexlabs/Silex/commit/a9dc6da9cbef495e7c89ae15e1d9c8fc1496804c), [yanhick](https://github.com/silexlabs/Silex/commit/b24de1f9cfcfd0378aa018940ebb540b00a4a8d0), [Thomas Fetiveau](https://github.com/silexlabs/Silex/commit/c39b1045e0ee33c9d164f956081a8fa71fed4264)



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
