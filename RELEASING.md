# Releasing Silex

This file is for the maintainer. To contribute, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Branches and releases

We use a trunk-based model: `main` is the single, always-releasable branch.

- `main` is protected: no direct pushes. All work lands via PR.
- Use short-lived branches (`feat/...`, `fix/...`) and open a PR against `main`.
- PRs are squash-merged. The squash title must follow [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): description`), because it drives the changelog.
- Nothing auto-deploys from `main`. Deployments and releases are driven by git tags, so untested `main` never reaches production. Server (web) and desktop ship together from the same tag.

Two kinds of tags:

- **Prerelease tags** (e.g. `v3.9.0-canary.1`, `-alpha`, `-beta`): deploy to **canary** ([canary.silex.me](https://canary.silex.me)) for testing, publish a GitHub *prerelease* of the desktop apps, publish the versioned `silexlabs/silex-platform` Docker image (also tagged `:canary`, never `:latest`), and publish `@silexlabs/silex` to npm under the `canary` dist-tag. Nothing reaches production, and prerelease builds are never offered to stable users by the auto-updater.
- **Stable tags** (e.g. `v3.9.0`): deploy the server to CapRover **production** ([v3.silex.me](https://v3.silex.me)), publish the `silexlabs/silex-platform` Docker image (versioned + `:latest`), publish `@silexlabs/silex` to npm as `latest`, and publish the stable desktop release (macOS/Windows/Linux) with auto-updater metadata.

In both cases the desktop GitHub release is created as a **draft**. A maintainer reviews and publishes it (the SaaS/Docker deploys are immediate). To test a build, cut a prerelease tag (it lands on canary). To release, cut a stable tag once canary is validated. Releases are cut by maintainers by tagging `main`.

## Hotfixes

To patch a release without shipping everything currently on `main`:

1. Branch from the last stable tag: `git checkout -b hotfix/v3.8.1 v3.8.0`
2. Apply the fix and tag the patch (`v3.8.1`). The tag triggers the deploy.
3. Forward-port the same fix to `main` so it is not lost in the next release.

A maintenance branch (e.g. `v3-maintenance`) is created on demand only when an older line must be supported while `main` moves ahead.
