#!/usr/bin/env node
// This script executes a command in each submodule
// It supports replacing `{{branch}}` with the branch name
// In most cases you will want to use `npm run exec` instead of running this script directly
// Or `git submodule foreach --recursive 'echo "Running command in $name"'`
const fs = require('fs');
const { spawnSync } = require('child_process');

// Get the command from the command-line arguments
const command = process.argv[2];

// Ensure a command is provided
if (!command) {
  console.error('Please provide a command to execute.');
  process.exit(1);
}

// Get repos paths and branch from .gitmodules
const gitmodules = fs.readFileSync('.gitmodules', 'utf8');
const repos = gitmodules.match(/\[submodule "(.*)"\]/g).map(repo => repo.match(/\[submodule "(.*)"\]/)[1]);
const branches = gitmodules.match(/branch = (.*)/g).map(branch => branch.match(/branch = (.*)/)[1]);

repos.forEach((repo, index) => {
  const branch = branches[index];
  try {
    // Display a separator and message
    // Display `file` in a box
    console.log(`┌${'─'.repeat(repo.length + 2)}┐`);
    console.log(`│ ${repo} │ `);
    console.log(`└${'─'.repeat(repo.length + 2)}┘`);

    // Substitute branch in command
    const replaced = command.replace(/{{branch}}/g, branch);
    console.log('\x1b[90m%s\x1b[0m', `Executing command \`${replaced}\``);

    // Change directory and execute the command
    process.chdir(`${__dirname}/../${repo}`);
    const result = spawnSync(replaced, { shell: true, stdio: 'inherit' });
    console.log('\n');
    if(result.status !== 0) {
      // Red error
      console.error('\x1b[31m%s\x1b[0m', `Error executing command:`, result.error, '\n\n');
    }
  } catch (error) {
    console.error(`Error executing command in ${repo}:`, error);
  }
});
