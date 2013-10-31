#!/bin/sh

# Retrieve the absolute paths
SCRIPT_PATH="`dirname $0`"
ROOT=$(cd $SCRIPT_PATH"/.."; pwd)

OPTIM_FLAG=""

if [ "$1" == "release" ]; then
    OPTIM_FLAG="ADVANCED_OPTIMIZATIONS"
else
    if [ "$1" == "debug" ]; then
        OPTIM_FLAG="SIMPLE_OPTIMIZATIONS"
    else
        echo "Build error, wrong params, param 1 is expected to be \"release\" or \"debug\""
        exit 1
    fi
fi

# build with closure builder
$ROOT/build/closure-library/closure/bin/build/closurebuilder.py \
  --root="$ROOT/build/closure-library/" \
  --root="$ROOT/src/" \
  --namespace="silex.boot" \
  --output_mode=compiled \
  --compiler_jar="$ROOT/build/closure-compiler.jar" \
  --compiler_flags=--compilation_level=$OPTIM_FLAG \
  --compiler_flags=--externs="$ROOT/cloud-explorer/lib/app/js/cloud-explorer.js" \
  --compiler_flags=--js_output_file="$ROOT/bin/js/admin.js"

