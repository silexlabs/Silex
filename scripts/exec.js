#!/usr/bin/env node
const fs = require('fs');
const { spawnSync } = require('child_process');

// Get the command from the command-line arguments
const command = process.argv[2];

// Ensure a command is provided
if (!command) {
  console.error('Please provide a command to execute.');
  process.exit(1);
}

// Define the directory
const directory = __dirname + '/../packages';

// Read the contents of the directory
fs.readdir(directory, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Iterate through each item in the directory
  files.forEach(file => {
    // Construct the full path
    const fullPath = `${directory}/${file}`;

    // Check if it's a directory
    if (fs.statSync(fullPath).isDirectory()) {
      try {
        // Display a separator and message
        console.log('_'.repeat(100), `\ncd ${fullPath} && ${command}\n\n`);
        // Change directory and execute the command
        process.chdir(fullPath);
        const result = spawnSync(command, { shell: true, stdio: 'inherit' });
        console.log(result.status === 0 ? 'Success' : 'Error');
      } catch (error) {
        console.error(`Error executing command in ${fullPath}:`, error);
      }
    }
  });
});
