#!/bin/sh
# This script is used for CI, when the deployment is not straightforward as with heroku.
# It is called by the CI deployment server, e.g. from `circle.yml`.
# See this article about deployment http://the.webapp.cat/2015/07/Deploy-to-Gandi-Simple-Hosting.html
#
# Params:
# * $1 is the ssh host to deploy to, e.g. abcd@efg.com
# * $2 is either "prod" or "preprod", which is the domain name where to call the "reload route"
#
# Useful environement variables:
# * `SILEX_RELOAD_ROUTE`: the path to call to reboot the nodejs server

ls -al dist/client/js/
zip -r silex.zip dist/ node_modules/ static/
echo 'put silex.zip' | sftp -o "StrictHostKeyChecking no" "$1":vhosts/default
echo "wget --secure-protocol=TLSv1 $2/$SILEX_RELOAD_ROUTE"
wget "$2/$SILEX_RELOAD_ROUTE"
