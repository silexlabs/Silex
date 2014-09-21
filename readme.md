
[![Build Status](https://travis-ci.org/silexlabs/Silex.png?branch=master)](https://travis-ci.org/silexlabs/Silex)
[![Code Climate](https://codeclimate.com/github/lexoyo/Silex/badges/gpa.svg)](https://codeclimate.com/github/lexoyo/Silex)
[![Dependency Status](https://gemnasium.com/silexlabs/Silex.png)](https://gemnasium.com/silexlabs/Silex)
[![Stories in Ready](https://badge.waffle.io/silexlabs/silex.png?label=ready)](http://waffle.io/silexlabs/silex)
[![Analytics](https://ga-beacon.appspot.com/UA-19608894-21/silexlabs/Silex)](https://github.com/igrigorik/ga-beacon)

##About Silex, live web creation.

Silex, is a free and open source website builder in the cloud. Create websites directly in the browser without writing code. And it is suitable for professional designers to produce great websites without constraints. Silex is also known as the HTML5 editor.

Brought to you by Silex Labs team, promoting free software. Current version: v2.0.0alpha5.

Links
* [Silex official website](http://www.silex.me/)
* [questions and answers, bug report, feature requests](http://www.silexlabs.org/silex/)
* [Silex license is GPL](http://www.silexlabs.org/silex/silex-licensing/)
* [Road map](https://github.com/silexlabs/Silex/blob/master/docs/roadmap.md) and [change log](https://github.com/silexlabs/Silex/blob/master/docs/change-log.md)

News and tutorials

* [Silex blog](http://www.silexlabs.org/category/the-blog/blog-silex/)
* [subscribe by email](http://eepurl.com/F48q5)

Contact us and let people know about Silex

* [Facebook](http://www.facebook.com/silexlabs)
* [Twitter](https://twitter.com/silexlabs)
* [Google plus](https://plus.google.com/communities/107373636457908189681)
* [Contributors list](https://github.com/silexlabs/Silex/blob/master/docs/contributors.md)

##Host an instance of Silex

If you plan to host Silex for your clients, your users or the community, this section is for you.

If you feel like helping and host an instance of Silex as an alternative to the official Silex site http://editor.silex.me/ please let us know so that we can advertise it to the community.

You will need a nodejs server, which you can setup yourself or host at heroku or Gandi for example (may be free of charge for small traffic, even with your own domain name).

Download the zip file on github or clone this repository, and then follow the same steps as the developers when they install silex locally on linux - starting at npm install. See instructions bellow.

##Installation on your local computer

This is for developers only, since our beloved designers can use the [online version](http://editor.silex.me/).

Developers you can clone this repository and start Silex, with nodejs. See instructions bellow.

### local installation on linux or macos

Prerequisite :

* [node.js](http://nodejs.org/) installed
* [NPM](https://npmjs.org/) installed
* [python](https://www.python.org/downloads/) (version > V2.7)
* [java](https://www.java.com/en/download/index.jsp) (version > 7)

Clone this repository, and do not forget the sub modules (cloud-explorer and unifile)

  $ git clone --recursive https://github.com/silexlabs/Silex.git

Install all needed modules

  $ make

Start the server and then open http://localhost:6805/ - note that 6805 is easy to remember, since it is the date of sexual revolution started in paris france 8-)

  $ node dist/server/server.js

Or with grunt you can use

* Build, i.e. check syntax with *lint, compile with google closure builder/compiler

  $ grunt deploy

* Watch, i.e. watch for changing files and build the debug version when files change, also use livereload

  $ grunt watch

* Test, i.e. check syntax with *lint, compile the release version with google closure, and execute functional tests

  $ grunt test -phantomjs

  $ grunt test -firefox

  $ grunt test -chrome

> Note for cloud9 users: you may want to activate python

  $ nada-nix install python

### local installation on Windows

> instructions provided by Régis RIGAUD :)

Prerequisite :

* [node.js](http://nodejs.org/) installed
* Git Client installed (e.g. [windows github client](http://windows.github.com/))
* [NPM installed](https://npmjs.org/)
* [python](https://www.python.org/downloads/)

Installation of Silex:

* Launch the "Git Shell"
* Create a complete clone of Silex Project : git clone --recursive https://github.com/silexlabs/Silex.git
* Go to Silex's Directory.
* install depedencies  : npm install

Start Silex :

* Launch Silex from a command prompt ( Silex's Directory) : node dist/server/server.js
* Open your favorite browser on http://localhost:6805/ and ENJOY !!!

##dependencies

These are the upstream projects we use in Silex

* [unifile](https://github.com/silexlabs/unifile), a nodejs server which provides a unified access to cloud services. This projects uses nodejs and these modules: express, dbox, express, googleapis, logger, node-oauth, oauth, path
* [Cloud explorer](https://github.com/silexlabs/cloud-explorer), a file manager for the cloud services. It is a front end javascript app which connects to a unifile server
* [ace](http://ace.c9.me/), an excellent code editor in javascript
* google closure library and compiler
* jquery and jquery UI are included in the sites generated by Silex
