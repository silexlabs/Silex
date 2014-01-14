all:
	npm install
	grunt install
	grunt releaseDeploy

tests:
	grunt test -phantomjs
	grunt test -chrome
	grunt test -firefox

test:
	grunt test -phantomjs

precommit:
	grunt test -phantomjs

