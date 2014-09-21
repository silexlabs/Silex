all:
	npm install
	node_modules/grunt-cli/bin/grunt install

tests:
	node_modules/grunt-cli/bin/grunt test -phantomjs
	node_modules/grunt-cli/bin/grunt test -chrome
	node_modules/grunt-cli/bin/grunt test -firefox

test:
	node_modules/grunt-cli/bin/grunt test -phantomjs

precommit:
	node_modules/grunt-cli/bin/grunt test -phantomjs

