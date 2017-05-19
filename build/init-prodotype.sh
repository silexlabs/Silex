#!/bin/sh

# we somehow have to init npm by hand?
cd node_modules/prodotype/
npm i
cd ../../
# build silex components with prodotype
mkdir -p dist/client/libs/prodotype/components
cp node_modules/prodotype/pub/prodotype.js node_modules/prodotype/pub/prodotype-logo-small.png dist/client/libs/prodotype/
