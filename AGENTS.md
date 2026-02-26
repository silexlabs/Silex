# AGENTS.md

Instructions for AI agents contributing to this repository.

in order to run silex, and change its code
* this repo is a meta repo with packages in ./packages
* when changed a package needs to be rebuilt then rebuild the packages that depend on it
* some packages are yarn workspaces, the others are rust projects

in order to test your changes, you can run the package you changed or build it and run silex itself (web version or desktop with mcp)

## MCP Connection

Silex Desktop exposes MCP tools for controlling the visual editor. Two transports are available (HTTP and stdio); both serve the same tool set from the same Rust server (see `packages/silex-desktop`).

### Using Silex (HTTP) — for agents designing websites

When an agent is *using* Silex to build websites, connect over HTTP. The endpoint is always active while Silex Desktop is running: `http://localhost:6807/mcp`

**Claude Code** (`.mcp.json` or project settings):
```json
{
  "mcpServers": {
    "silex": { "url": "http://localhost:6807/mcp" }
  }
}
```

**opencode** (`opencode.json`):
```json
{
  "mcp": {
    "silex": {
      "type": "remote",
      "url": "http://localhost:6807/mcp",
      "enabled": true
    }
  }
}
```

### Developing Silex (stdio) — for agents contributing code

When an agent is *developing* Silex itself (editing source, rebuilding, testing), use the stdio transport. The MCP client spawns the Silex process directly, so it can auto-restart it after a rebuild (client-dependent — Claude Code does this automatically).

**Claude Code** (`.mcp.json` or project settings):
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

**opencode** (`opencode.json`):
```json
{
  "mcp": {
    "silex": {
      "type": "local",
      "command": ["/path/to/silex-desktop", "--stdio"],
      "enabled": true
    }
  }
}
```

## Development Workflow

### Building and testing

This is a Yarn workspaces mono-repo with git submodules in `packages/`.

```sh
yarn                     # install all workspace deps
yarn run build           # build all packages
```

For individual packages:

```sh
cd packages/silex-lib && npm run dev    # Silex web at :6805
cd packages/grapesjs-* && npm run dev   # plugin standalone at :8080
```

For the desktop app (Rust + Tauri):

```sh
cd packages/silex-desktop && cargo tauri dev
```

### Debug cycle

1. Reproduce in the running app (`:6805` for web, desktop app for Tauri).
2. If it involves a GrapesJS plugin, also test standalone at `:8080`.
3. Use temporary `console.log` for instrumentation; remove before committing.
4. After changing a plugin, run `npm run build` in that plugin directory, then restart Silex.

## Coding Conventions

When using Silex, agents are expected to respect this

- **CSS**: BEM class naming. Style via `CssComposer.addRules()`. No inline styles, no CSS Grid (use Flexbox).
- **GrapesJS API**: Never modify DOM directly. Use the GrapesJS component/style APIs.
- **Pages**: Homepage must be named `index`. Internal links start with `./`.
- **Symbols**: Use Symbols for shared header/footer across pages.
- **Responsiveness**: Use DeviceManager breakpoints, never resize the browser window.

## Commit Guidelines

- Do not commit, push, or modify git history unless explicitly asked.
- Prefer small, focused changes.
- Run `npm run build` for affected packages and verify no regressions before delivering.
