# Contributing to Silex

Thanks for your interest in contributing to Silex! This guide covers code contributions. For other ways to help (templates, documentation, testing, tutorials, financial support), see the [full contribute page](https://docs.silex.me/en/designer/contribute/).

## Discuss before coding

**Please talk to us before you start writing code.** This avoids duplicate work, ensures your approach fits the project direction, and saves everyone time.

Pick whichever channel suits you:

- [Community forum](https://short.silex.me/community_en) — best for feature proposals and design discussions
- [Community chat](https://short.silex.me/chat) — good for quick questions and real-time feedback
- [GitHub Issues](https://github.com/silexlabs/Silex/issues) — best for bug reports and targeted fixes

Describe what you want to change and why. Wait for feedback from a maintainer before opening a pull request.

## Getting started

1. Fork and clone the repository (with submodules):
   ```sh
   git clone --recurse-submodules https://github.com/<your-username>/Silex.git
   cd Silex
   nvm install        # optional — uses the version from .nvmrc
   pnpm install       # install dependencies
   pnpm build         # build the editor + server
   pnpm start         # start the editor at http://localhost:6805
   ```
   For the Rust side: `cargo check` (or `cargo build`) at the repo root builds `server-rust/` and `desktop/`.
2. Create a branch for your changes (`feat/...` or `fix/...`).

New to the project? Look for issues labeled [good first issue](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## How the repo is organized

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

### Workspaces (the `grapesjs-plugins/`)

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

### Submodules (the dashboards)

`silex-dashboard/` and `silex-dashboard-2026/` are **git submodules** — they are *content* (multi-site dashboards built with Silex), not core code, so they live in their own repos and are pinned here. Clone with submodules:

```sh
git clone --recurse-submodules https://github.com/silexlabs/Silex.git
# already cloned? pull them in with:
git submodule update --init --recursive
```

The SaaS server serves the pre-built dashboard from `silex-dashboard/_site` (see `server/deploy/server-plugins/dashboard.js`). You don't need the submodules to develop the editor — only to run the full multi-site SaaS.

## Submitting changes

1. Reference the issue or discussion where your change was agreed upon.
2. Keep pull requests focused — one feature or fix per PR.
3. **Test before opening the PR, and include a screenshot of that test** in the description.
4. Run the checks that match what you changed (CI runs all of them on the PR):
   - **App** (`editor/`, `server/`, `common/`): `pnpm build`, `pnpm lint`, `pnpm test`.
   - **A plugin** (`grapesjs-plugins/*`): `pnpm build:plugins`, `pnpm lint:plugins`, `pnpm test:plugins` — or scope to one: `pnpm --filter @silexlabs/grapesjs-<name> run test`.
   - **Rust** (`server-rust/`, `desktop/`): `cargo check -p silex-server` and `cargo test -p silex-server`.

   There is no pre-commit hook — CI on the PR is the gate, so run the relevant checks yourself before pushing.
5. The PR is **squash-merged**, so its **title** must follow [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): description`) — it becomes the changelog entry.

## Branches and releases

We use a trunk-based model: `main` is the single, always-releasable branch.

- `main` is protected — no direct pushes. All work lands via PR.
- Use short-lived branches (`feat/...`, `fix/...`) and open a PR against `main`.
- PRs are **squash-merged**; the squash title must follow [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): description`), since it drives the changelog.
- Nothing auto-deploys from `main`. Deployments and releases are driven by git tags, so untested `main` never reaches production. Server (web) and desktop ship together from the same tag.

Two kinds of tags:

- **Prerelease tags** (e.g. `v3.9.0-canary.1`, `-alpha`, `-beta`) — deploy to **canary** ([canary.silex.me](https://canary.silex.me)) for testing, publish a GitHub *prerelease* of the desktop apps, and publish the versioned `silexlabs/silex-platform` Docker image (also tagged `:canary`, never `:latest`). Nothing reaches production, and prerelease builds are never offered to stable users by the auto-updater.
- **Stable tags** (e.g. `v3.9.0`) — deploy the server to CapRover **production** ([v3.silex.me](https://v3.silex.me)), publish the `silexlabs/silex-platform` Docker image (versioned + `:latest`), and publish the stable desktop release (macOS/Windows/Linux) with auto-updater metadata.

In both cases the desktop GitHub release is created as a **draft** — a maintainer reviews and publishes it (the SaaS/Docker deploys are immediate). To test a build, cut a prerelease tag (it lands on canary); to release, cut a stable tag once canary is validated. Releases are cut by maintainers by tagging `main`.

### Hotfixes

To patch a release without shipping everything currently on `main`:

1. Branch from the last stable tag: `git checkout -b hotfix/v3.8.1 v3.8.0`
2. Apply the fix and tag the patch (`v3.8.1`) — the tag triggers the deploy.
3. Forward-port the same fix to `main` so it isn't lost in the next release.

A maintenance branch (e.g. `v3-maintenance`) is created on demand only when an older line must be supported while `main` moves ahead.

## Coding standards

- Use [BEM](https://getbem.com/) class naming for CSS
- Style via [GrapesJS](https://grapesjs.com/) CssComposer — no inline styles
- Use Flexbox for layout (not CSS Grid)
- Internal links must be relative and start with `./`

## Extending Silex with plugins

If your change can work as a plugin rather than a core modification, that's preferred. See [Creating plugins](https://docs.silex.me/en/developer/plugins/creating/) for how to build and publish Silex plugins.

## Getting help

- [Community chat](https://short.silex.me/chat)
- [Community forum](https://short.silex.me/community_en)
- [GitHub Issues](https://github.com/silexlabs/Silex/issues)
- [Roadmap](https://roadmap.silex.me) — see what's planned and vote on features
