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
   pnpm install
   pnpm build && pnpm start   # editor at http://localhost:6805
   ```
   See [README → Dev setup](README.md#dev-setup) for more.
2. Create a branch for your changes (`feat/...` or `fix/...`).

New to the project? Look for issues labeled [good first issue](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

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
- `main` is deployed continuously to **canary** ([canary.silex.me](https://canary.silex.me)) for preview; **production** ships only when you tag, so nothing reaches production until you tag it.

Production releases are driven by git tags, in **two independent channels** (a server release never ships a desktop update, and vice-versa):

- **`v*`** (e.g. `v3.8.1`) — server/web: publishes the `silexlabs/silex-platform` Docker image and deploys to CapRover production ([v3.silex.me](https://v3.silex.me)).
- **`desktop-v*`** (e.g. `desktop-v1.2.0`) — desktop: builds the Tauri apps (macOS/Windows/Linux) and publishes the GitHub release with auto-updater metadata.

Releases are cut by maintainers by tagging `main`.

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
