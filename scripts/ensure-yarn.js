const ua = (process.env.npm_config_user_agent || "").toLowerCase();
const execPath = (process.env.npm_execpath || "").toLowerCase();

const isYarn = ua.includes("yarn/") || execPath.includes("yarn");

if (!isYarn) {
  const used = ua || execPath || "unknown";
  console.error(
    "ERROR: Please use `yarn install` (not npm/pnpm).\n" +
      `Detected: ${used}\n` +
      "Before you do `yarn install`, delete:\n" +
      "  - node_modules\n" +
      "  - packages/**/node_modules\n"
  );
  process.exit(1);
}
