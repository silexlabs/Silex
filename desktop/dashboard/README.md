# @silexlabs/silex-desktop-dashboard

The home screen of Silex Desktop: websites, templates, integrations and settings. A Vue 3 app,
built with Vite and embedded in the desktop binary.

## Develop

Once, from the repo root: `pnpm install`, `pnpm run build` (the editor, in `dist/client`), then
`pnpm build` in this folder. The app needs both folders to compile, even with Vite. For Rust and
the system libraries, see [the desktop README](../README.md#prerequisites).

Then run each line in its own terminal:

```bash
pnpm dev                                                          # Vite on localhost:5173
SILEX_DASHBOARD_URL=http://localhost:5173/ pnpm --dir .. run dev   # the app opens Vite
```

Vite sends `/api` and the editor to the app on port 6805. Stop anything else on that port
(`pnpm start` at the root, an installed Silex Desktop): in this mode the app stops instead of
taking another port.

`localhost:5173` also opens in a browser, but test in the app window: only it has the Tauri bridge.

## Build

```bash
pnpm build   # type check, then build to dist/
pnpm lint    # ESLint and Stylelint
```

Run `pnpm templates` to refresh the template list from silex.me before a release, then commit
`src/templates.json`.
Run `pnpm run licenses` too, to refresh the licenses of the packages the app includes (offline, from
`node_modules` and the Cargo registry), then commit `src/licenses.json`.

## Conventions

- Websites go through the `/api/website` routes, desktop-only features through Tauri commands.
- Texts go through `t()`, with the English sentence as key, in `src/locales/`.
- Styles use the editor's tokens (`src/styles/tokens.css`) and BEM class names.
- Menus use [Reka UI](https://reka-ui.com/), dialogs the native `<dialog>`.
- The built page has a Content Security Policy, in `vite.config.ts`: a new origin (script, image,
  request) goes there too, or the app window blocks it.
- Add dependencies with `pnpm add` here, then `pnpm install` at the root, without `--filter` (a
  filtered install rewrites unrelated lines of `pnpm-lock.yaml`).

See [the desktop README](../README.md) to build the app, and [CONTRIBUTING.md](../../CONTRIBUTING.md)
for pull requests.
