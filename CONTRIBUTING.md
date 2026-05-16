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

1. Fork and clone the repository: `git clone https://github.com/<your-username>/Silex.git`
2. Follow the setup instructions in [Running from Node.js](https://docs.silex.me/en/developer/self-hosting/node/)
3. Create a branch for your changes

New to the project? Look for issues labeled [good first issue](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## Submitting changes

1. Reference the issue or discussion where your change was agreed upon
2. Keep pull requests focused — one feature or fix per PR
3. Include a clear description of what changed and how to test it
4. Make sure existing tests pass

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
