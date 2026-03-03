// scripts/ensure-yarn.js
const ua = (process.env.npm_config_user_agent || '').toLowerCase();
const execPath = (process.env.npm_execpath || '').toLowerCase();

// Reliable enough across Yarn/Corepack on Windows/Linux/macOS
const isYarn = ua.includes('yarn/') || execPath.includes('yarn');

if (!isYarn) {
  console.error(
    "ERROR: Please use `yarn install`, not `npm install`.\n" +
    "Before you do `yarn install`, delete:\n" +
    "  - node_modules\n" +
    "  - packages/**/node_modules\n"
  );
  process.exit(1);
}