#!/bin/sh

function lintit () {
  OUTPUT=$(npm run lint:js)
  if [[ "$OUTPUT" == *"problems"* ]]; then
    echo "ERROR: Check eslint hints, run \`npm run lint:js\`"
    exit 1 # reject
  fi
  echo "Linter succeded"
  exit 0
}
lintit
