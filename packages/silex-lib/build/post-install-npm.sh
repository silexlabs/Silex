#!/bin/sh

# Retrieve the absolute paths
SCRIPT_PATH="`dirname $0`"
ROOT=$(cd $SCRIPT_PATH"/.."; pwd)

cp $ROOT/build/pre-commit $ROOT/.git/hooks/
chmod 0777 $ROOT/.git/hooks/pre-commit

