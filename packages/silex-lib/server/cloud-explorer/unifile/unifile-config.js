/**
 * route name for unifile api
 */
exports.apiRoot = "/api";
/**
 * other config files to considere (if they exist)
 */
exports.otherConfFiles = [
	"../../../unifile-config.js"
]
/**
 * static folders
 */
exports.staticFolders = [
	// assets
	{
		name: "/unifile-assets",
		path: "../unifile-assets/"
	}
];
/**
 * www service config (the local server)
 */
exports.www = 
{
	root : "../../www",
	auth_form_route: "/api/v1.0/www-auth",
	auth_form_submit_route: "/api/v1.0/www-auth-submit",
	auth_form_warning: "<p style='color: red; '>WARNING: YOUR LOGIN/PASS IS SET TO ADMIN/ADMIN, CHANGE THIS IN unifile-config.js</p>",
	auth_form_html: "<form action='/api/v1.0/www-auth-submit' method='post'>\
	    <div>\
	        <label>Username:</label>\
	        <input type='text' name='username'/>\
	    </div>\
	    <div>\
	        <label>Password:</label>\
	        <input type='password' name='password'/>\
	    </div>\
	    <div>\
	        <input type='submit' value='Log In'/>\
	    </div>\
	</form>",
	users: {
		"admin": "admin"
	}
}
/**
 * dropbox app config
 */
exports.dropbox = 
{
	root : "dropbox",
	app_key : "ngk5t8312eo4agh",
	app_secret : "7uxqr625pct7zbl"
}

/**
 * gdrive app config
 * the app must be decalred 
 * and have a callback url set to [node server url]/v1.0/gdrive/auth_callback/
 */
exports.gdrive = 
{
	auth_uri : "https://accounts.google.com/o/oauth2/auth",
	client_secret : "8H5OatS9dhhnKlDL5pnVZ0Kr",
	token_uri : "https://accounts.google.com/o/oauth2/token",
	client_email : "1092494939602-js3q389sjqn9hql42g1o9mktpb4fcan3@developer.gserviceaccount.com","redirect_uris":["http://unifile.silexlabs.org/api/v1.0/gdrive/auth_callback/"],
	client_x509_cert_url : "https://www.googleapis.com/robot/v1/metadata/x509/1092494939602-js3q389sjqn9hql42g1o9mktpb4fcan3@developer.gserviceaccount.com",
	client_id : "1092494939602-js3q389sjqn9hql42g1o9mktpb4fcan3.apps.googleusercontent.com",
	auth_provider_x509_cert_url : "https://www.googleapis.com/oauth2/v1/certs",
	javascript_origins : ["https://projects.silexlabs.org/"],
	client_id : "1092494939602-js3q389sjqn9hql42g1o9mktpb4fcan3.apps.googleusercontent.com",

	app_scope:"https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile", // see https://developers.google.com/drive/scopes
	app_access_type:"online",
	auth_url_callback: "/api/v1.0/gdrive/auth_callback/", // path which we expect when the user comes back to our app after authorizing on google server
};

/**
 * available routes on this server
 */
exports.routes = {
	"api/":{
		"v1.0/":{
			"services/":{
				"list/":{}
			},
			"www/":{
				"connect/":{},
				"login/":{},
				"logout/":{},
				"account/":{},
				"exec/":{
					"ls/":{},
					"rm/":{},
					"mkdir/":{},
					"cp/":{},
					"mv/":{},
					"get/":{},
					"put/":{}
				}
			},
			"dropbox/":{
				"connect/":{},
				"login/":{},
				"logout/":{},
				"account/":{},
				"exec/":{
					"ls/":{},
					"rm/":{},
					"mkdir/":{},
					"cp/":{},
					"mv/":{},
					"get/":{},
					"put/":{}
				}
			},
			"gdrive/":{
				"connect/":{},
				"login/":{},
				"logout/":{},
				"account/":{},
				"exec/":{
					"ls/":{},
					"rm/":{},
					"mkdir/":{},
					"cp/":{},
					"mv/":{},
					"get/":{},
					"put/":{}
				}
			}
		}
	}
};
