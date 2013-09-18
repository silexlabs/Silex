/**
 * other config files to considere (if they exist)
 */
exports.otherConfFiles = [
]

// overide default config
/**
 * www service config (the local server)
 */
exports.www = 
{
	root : "../../../../../www"
}
// add to default config
/**
 * static folders
 */
exports.staticFolders = [
	// silex main site
	{
		path: "../../../../www/"
	},
	// silex editor
	{
		name: "/silex",
		path: "../../../../client/"
	},
	// debug silex
	{
		name: "/src",
		path: "../../../../src/"
	},
	{
		name: "/build",
		path: "../../../../build/"
	}
];

