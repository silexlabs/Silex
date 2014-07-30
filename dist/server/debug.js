console.log('debug here ------------');

for (idx in req.session){
  console.log(idx);
}
/* *
req.session['dropbox_authorize_url'] = undefined;
req.session['dropbox_account'] = undefined;
req.session['dropbox_request_token'] = undefined;
req.session = undefined;
/* */


/* *
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/lib/dbox.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/main.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/mimetypes.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/oauth.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/uuid.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/forever.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/vendor/cookie/index.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/vendor/cookie/jar.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/node_modules/request/tunnel.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/lib/helpers.js'] = undefined;
require.cache['/srv/data/web/vhosts/default/Silex/node_modules/unifile/node_modules/dbox/lib/oauth.js'] = undefined;
for (idx in require.cache){
  console.log(idx);
}
/* */

console.log('-- ', req.session.dropbox_request_token);
console.log('-- ', req.session.dropbox_access_token);

console.log('end here ------------');


