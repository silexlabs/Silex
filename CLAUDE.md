# CLAUDE CONTEXT FILE

**IMPORTANT**: After EVERY code change, you MUST test your changes using Playwright MCP tools to verify they work correctly. This is mandatory, not optional.

Use Playwright MCP tools to inspect the DOM and verify that your changes have the expected effect. Please start by checking you have access to these tools and warn me if there is a problem.

## Playwright MCP Server
The Playwright MCP server is installed and provides browser automation tools:
- `mcp__playwright__browser_navigate` - Navigate to URLs (e.g., http://localhost:6805)
- `mcp__playwright__browser_snapshot` - Get accessibility snapshot of the page
- `mcp__playwright__browser_console_messages` - Retrieve console messages (with optional error-only filtering)
- `mcp__playwright__browser_click` - Click elements
- `mcp__playwright__browser_type` - Type into elements
- `mcp__playwright__browser_take_screenshot` - Take screenshots
- Plus 30+ other tools for form handling, navigation, etc.

**Testing Playwright connection:**
- Test Playwright when you first need to use it (after launching Silex/plugin)
- **If the Playwright MCP tools are not available/installed, you MUST install them yourself using the Bash tool: `claude mcp add playwright npx @playwright/mcp@latest`**
- Navigate to the local server (e.g., http://localhost:6805 or :8080)
- If it fails, warn the user and ask them to check the MCP server
- If it works, proceed with testing
- **IMPORTANT**: Always open the debug console to avoid cache issues

**Installation**: `claude mcp add playwright npx @playwright/mcp@latest`

**CRITICAL - DO NOT KILL PLAYWRIGHT PROCESSES:**
- NEVER run `pkill playwright` or similar commands
- The Playwright MCP server is managed by the user, not by you
- If you get "Browser is already in use" errors, ask the user for help
- If browser tools aren't working, ask the user to restart the MCP server
- Only use `mcp__playwright__browser_close` to close browser tabs, never kill processes

## Repo layout (meta-repo)
This is the Silex mono-repo. Packages are submodules and npm workspaces grouped by type:

- **GrapesJS plugins**
  - grapesjs-symbols
  - grapesjs-advanced-selector
  - grapesjs-ai-copilot
  - grapesjs-data-source
  - grapesjs-filter-styles
  - grapesjs-fonts
  - grapesjs-keymaps-dialog
  - grapesjs-loading
  - grapesjs-notifications
  - grapesjs-storage-rate-limit
  - grapesjs-tailwind
  - grapesjs-ui-suggest-classes
  - grapesjs-version-flow

- **11ty plugins**
  - SitemapGen
  - eleventy-plugin-concat

- **Base UI & utilities**
  - expression-input
  - node_modules-path

- **Silex plugins**
  - silex-dashboard

- **Silex utilities to build plugins/apps**
  - silex-plugins
  - silex-plugin-starter
  - silex-lib (⚠ main `silexlabs/silex` package on npm)

- **Silex apps**
  - silex-platform
  - silex-desktop
  - silex-puter

## Local dev setup
**IMPORTANT**: You should launch Silex or the relevant GrapesJS plugin yourself as needed for development and testing using background commands (`run_in_background: true`). Don't wait for the user to start them.

- Check the `package.json` scripts section to see what's available (`npm run dev`, `npm start`, etc.)
- Launch commands in background so you can continue working while they run

- Silex (./packages/silex-lib) → http://localhost:6805
  - Typically: `npm run dev` or `npm start` (use `run_in_background: true`)
  - Editor access: `silex.getEditor()`
  - Code changes trigger rebuild + live reload
- GrapesJS plugin standalone (e.g. ./packages/grapesjs-symbols) → http://localhost:8080
  - Typically: `npm start` or `npm run dev` (use `run_in_background: true`)
  - Editor access: `editor`
  - Code changes visible immediately at :8080
  - To test in Silex (:6805): `npm run build` in the plugin, then restart Silex, because the meta repo has all the packages linked (npm link)

## Debug workflow
1. Reproduce bug in Silex (:6805)
2. Compare with standalone plugin (:8080)
3. Use console logs to compare editor state in both (`Symbols.getAll()`, etc.)
4. If plugin works but Silex fails → problem is in integration (`silex-lib`)
5. If both fail → problem is in the plugin itself
6. Use Playwright MCP tools to inspect the DOM and verify that your changes have the expected effect:
   - `browser_snapshot` - Get DOM structure
   - `browser_console_messages` - Check for errors
   - `browser_take_screenshot` - Visual verification
