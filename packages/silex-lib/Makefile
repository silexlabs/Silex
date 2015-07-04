all:
	npm install --unsafe-perm # --unsafe-perm is to avoid loosing write access for postinstall script (which results in not building Silex at all)
	node_modules/grunt-cli/bin/grunt install

tests:
	node_modules/grunt-cli/bin/grunt test -phantomjs
	node_modules/grunt-cli/bin/grunt test -chrome
	node_modules/grunt-cli/bin/grunt test -firefox

test:
	node_modules/grunt-cli/bin/grunt test -phantomjs

precommit:
	echo 'About to commit your changes. Did you run the functional tests? Please do: \
		`$ node_modules/grunt-cli/bin/grunt test -phantomjs`'
