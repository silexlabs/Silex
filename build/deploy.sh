#!/bin/sh

ls -al dist/client/js/
zip -r silex.zip dist/ node_modules/
echo 'put silex.zip' | sftp -o "StrictHostKeyChecking no" "$1":vhosts/default
echo "wget http://preprod.silex.me/$SILEX_RELOAD_ROUTE"
wget "http://preprod.silex.me/$SILEX_RELOAD_ROUTE"
