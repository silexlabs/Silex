# Contributing to Silex

Thanks for your interest in contributing to Silex! This guide covers code contributions. For other ways to help (templates, documentation, testing, tutorials, financial support), see the [full contribute page](https://docs.silex.me/designer/contribute/).

## Discuss before coding

**Please talk to me before you start writing code.** This avoids duplicate work, ensures your approach fits the project direction, and saves everyone time.

Pick whichever channel suits you:

- [Community forum](https://short.silex.me/community_en): best for feature proposals and design discussions
- [Community chat](https://short.silex.me/chat): good for quick questions and real-time feedback
- [GitHub Issues](https://github.com/silexlabs/Silex/issues): best for bug reports and targeted fixes
- [Roadmap](https://roadmap.silex.me): see what is planned and vote on features

Describe what you want to change and why. Wait for my answer before you open a pull request.

## AI tools and testing by hand

I maintain Silex alone. I cannot run every pull request myself, so I need to trust the person who sends it. This trust comes from two things: you test your change by hand, and you understand your code.

You can use AI tools, and you do not need to tell me. The rules are the same for everyone, including good first issues:

- **You know how to use Silex.** If you do not, learn it first: [docs.silex.me](https://docs.silex.me/).
- **You test your change by hand, like a real user.** Open Silex in a browser. Click. Type the values in the forms yourself. Try several cases, including unusual values (empty, zero, text where a number is expected, a very large number).
- **A script is not a test by hand.** An editor driven by Playwright, an AI agent or a headless browser does not count, even with screenshots. Values set in code do not count either.
- **You add a screenshot of your test to the PR** when the change is visible.
- **You understand your code.** If you cannot explain a line, do not send it.
- **You answer review comments yourself.** Do not let an AI agent post for you.

If a pull request does not follow these rules, I close it without review.

## Getting started

1. Fork and clone the repository (with submodules):
   ```sh
   git clone --recurse-submodules https://github.com/<your-username>/Silex.git
   cd Silex
   nvm install        # optional: uses the Node version from .nvmrc
   pnpm install       # install dependencies
   pnpm build         # build the editor + server
   pnpm start         # start the editor at http://localhost:6805
   ```
   Already cloned without submodules? Run `git submodule update --init --recursive`.

   For the desktop app and the Rust side (`server-rust/`, `desktop/`), see [desktop/README.md](desktop/README.md).
2. Create a branch for your changes (`feat/...` or `fix/...`).

New to the project? Look for issues labeled [good first issue](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## How the repo is organized

This is a **monorepo**. The Silex app itself is a single package: one `package.json`, one build. The editor, the server and the common code are not separate packages. The code is split by role:

| Folder | What it is |
|---|---|
| `editor/` | the GrapesJS-based visual editor (browser); built with webpack |
| `server/` | the Node.js server, storage/hosting connectors and `server/deploy/` (SaaS / CapRover) |
| `common/` | shared contracts and types, plus the plugin-config system |
| `grapesjs-plugins/` | the first-party GrapesJS plugins (see *Workspaces* below) |
| `server-rust/` | the Rust server library |
| `desktop/` | the [Tauri](https://tauri.app/) desktop app (embeds `server-rust/`, the editor frontend and its own dashboard, `desktop/dashboard/`) |
| `silex-dashboard/` | the multi-site SaaS dashboard, a git submodule. You need it only to run the full SaaS, not to work on the editor. |

To import from another folder, use the path aliases `~/common`, `~/editor` and `~/server`. Do not use `../../`. Import a first-party plugin by its package name (`@silexlabs/grapesjs-*`). The Rust crates (`server-rust/`, `desktop/`) form a separate [Cargo workspace](https://doc.rust-lang.org/cargo/reference/workspaces.html).

Issues and pull requests for all these folders go to this repository.

### Workspaces (the plugins and the desktop app)

The plugins (`grapesjs-plugins/*`), the desktop app (`desktop`) and its dashboard (`desktop/dashboard`) are in a [pnpm workspace](https://pnpm.io/workspaces). Each plugin is a separate npm package, with its own version and release. The Silex build does not use these packages: it compiles the plugin source directly (see `webpack.config.js`). So you can change a plugin and the editor in the same branch.

Per-plugin tasks (each plugin keeps its own `package.json`, build, lint and test):

```sh
pnpm test:plugins     # run each plugin's own test
pnpm lint:plugins     # run each plugin's own lint
pnpm build:plugins    # build each plugin (for publishing)
# or target one:  pnpm --filter @silexlabs/grapesjs-symbols run test
```

> Some plugins still call `yarn` or use `web-test-runner`, and some plugin tests do not pass yet. Help to fix this is welcome.

## Submitting changes

1. Reference the issue or discussion where your change was agreed upon.
2. Keep pull requests focused: one feature or fix per PR.
3. Test your change by hand and add a screenshot, as described in [AI tools and testing by hand](#ai-tools-and-testing-by-hand).
4. Run the checks that match what you changed (CI runs all of them on the PR):
   - **App** (`editor/`, `server/`, `common/`): `pnpm build`, `pnpm lint`, `pnpm test`.
   - **A plugin** (`grapesjs-plugins/*`): `pnpm build:plugins`, `pnpm lint:plugins`, `pnpm test:plugins`. Or scope to one: `pnpm --filter @silexlabs/grapesjs-<name> run test`.
   - **Rust** (`server-rust/`, `desktop/`): first `pnpm build:desktop`, then `./scripts/ci-rust.sh`. The script runs the same checks as CI, in the same order, and says where CI would fail.
   - **Desktop dashboard** (`desktop/dashboard/`): `pnpm build:desktop`, then `pnpm --filter @silexlabs/silex-desktop-dashboard run lint`.

   There is no pre-commit hook. CI checks the PR, so run these checks yourself before you push.
5. Open the PR against `main`. Nobody can push to `main` directly.
6. The PR is **squash-merged**. Its **title** becomes the changelog entry, so it must follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.

How releases work: [RELEASING.md](RELEASING.md).

## Code style

`pnpm lint` (ESLint) checks the TypeScript code. `./scripts/ci-rust.sh` checks the Rust code (`cargo fmt`, `cargo clippy`). For the rest, follow the style of the code around your change.

## Extending Silex with plugins

If your change can work as a plugin rather than a core modification, that's preferred. See [Creating plugins](https://docs.silex.me/developer/plugins/creating/) for how to build and publish Silex plugins.
