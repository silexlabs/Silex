#Silex, live web creation.

##About Silex

Silex, is a free and open source website buidler in the cloud. Create websites directly in the browser without writing code. And it is suitable for professional designers to produce great websites without constraints. Silex is also known as the HTML5 editor.

Brought to you by Silex Labs team, promoting free software.

Current version: v2.0.0alpha3

* http://www.silex.me/

More info on Silex Labs website

* http://www.silexlabs.org/silex/

Questions and answers

* http://graphicdesign.stackexchange.com/questions/tagged/silex

Discussions

* Facebook http://www.facebook.com/silexlabs
* Twitter https://twitter.com/silexlabs
* Google plus https://plus.google.com/communities/107373636457908189681

News and tutorials

* blog http://www.silexlabs.org/category/the-blog/blog-silex/
* subscribe by email http://eepurl.com/F48q5

GPL license

* http://www.silexlabs.org/silex/silex-licensing/

Main contributors

* Alex lexoyo Hoyau @lexoyo
* Thomas zabojad Fetiveau http://www.tokom.fr/
* Pol superwup Goasdoué @superwup
* Nicolas "silex" Masson @NicoSilex‎

##Installation on your local computer (developers only)

Developers you can clone this repository and start the serveur (unifile), the back end of Silex, with nodejs. See instructions bellow.

### on linux or macos

Prerequisite :

* [node.js](http://nodejs.org/) installed
* NPM installed (https://npmjs.org/)

Clone this repository, and do not forget the sub modules (cloud-explorer and unifile)

Install node modules: npm install

Start the server: node cloud-explorer/unifile/lib/app.js"

And open http://localhost:5000/ in a browser

### Local installation on Windows

> instructions provided by Régis RIGAUD :)

Prerequisite :

* [node.js](http://nodejs.org/) installed
* Git Client installed (http://windows.github.com/)
* NPM installed (https://npmjs.org/)

Installation of Silex:

* Launch the "Git Shell"
* Create a complete clone of Silex Project : git clone --recursive https://github.com/silexlabs/Silex.git
* Go to Silex's Directory.
* install depedencies  : npm install

Start Silex :

* Launch Silex from a command prompt ( Silex's Directory) : node cloud-explorer\unifile\lib\app.js
* Open your favorite browser on http://localhost:6805/silex/ and ENJOY !!!

##Distribution/packages

You can use Silex online on www.silex.me or locally or on your server.

This is how Silex is distributed:

* Hosted free
  No install, just go to http://www.silex.me/ and do design
  Edit HTML pages in your drobbox, gdrive...  Your site is visible only by people with whom you share it.
  Tech note: host cloud explorer @silexlabs (silex.html on SL dedicated server and nodejs on heroku)
* Hosted pro
  Comming soon
  Purchase a hosting plan, go to http://www.silex.pro/ and do design
  You edit your site from an online location. Your site accessible to everyone 24/7.
  Paid, no setup, no need to know anything about hosting.
  Tech note: PHP file explorer hosted @arvixe, silex.html on SL dedicated server (use arvixe.silex.me ??)
* Hosted anywhere
  Purchase a stadard shared hosting, and use Scriptaculous automatic install to install Silex in a folder.
  You can manage multiple separated sites with different instances of Silex to edit the site.
  Tech note: silex.html and PHP file explorer hosted by the user's hosting company
* Hosted by you, front and back
  Download Silex and host it with its nodejs server.
  Offer Silex "Hosted free" version to your users, on your domain name.
  Your users go to your URL and use Silex from there to edit their files from their cloud services.
  Tech note: node server, silex in the unifile server

##dependencies

* unifile https://github.com/silexlabs/unifile
  wich uses nodejs and the modules: express, dbox, express, googleapis, logger, node-oauth, oauth, path
* cloud explorer https://github.com/silexlabs/cloud-explorer
  which uses angular.js
* ace http://ace.c9.me/
* google closure library and compiler
* jquery and jquery UI
* handlebars.js

##Development

To install Silex, client and server on your local computer, follow the instructions bellow.

###install node and npm
https://gist.github.com/isaacs/579814

###install foreman
http://blog.daviddollar.org/2011/05/06/introducing-foreman.html

###get silex and start the server
cd /home/
git clone git@bitbucket.org:lexoyo/silex.git
cd silex/server/
./start-server.sh

##Road map

###v2.0.0alpha4

WYSIWYG

* shortcuts (suppr, arrows, save, new, open)
* set as default page (drag drop pages and change order)
* analytics to analyse the use of the editor

Properties

* UI sounds?
* shadows
* font-*
* cursor
* scroll?

Texte

* difference entre typo dans l’editeur text et sur la scene
* detecter la couleur de fond (chercher le background color ou image dans les parents)

Components

* media (image, audio, video)
* nav bar

File

* group images on the same drive as the html page?
* export (cleanup html, make zip with .html, .js, .css, all media)? + host on github or other free hosts?

###v2.0.0alpha5

Edition

* copy/cut/paste
* undo/redo
* autosave
* multiple selection https://github.com/someshwara/MultiDraggable
* better text editor?
  http://www.webdesignerdepot.com/2008/12/20-excellent-free-rich-text-editors/
  http://mindmup.github.me/bootstrap-wysiwyg/

File properties

* background
* title and description and keywords
* favicon

Contextual menu on the elements (menu bar under the menu like google?)

* delete
* lock/unlock
* up/down (z-index)
* rotation

###v2.0.0beta1

Continuous integration

* jshint, PhantomJS, jenkins, Selenium
* unit tests http://stackoverflow.com/questions/11520170/unit-testing-oauth-js-with-mocha
* functional tests
* integration http://about.travis-ci.org/docs/user/languages/javascript-with-nodejs/


Profesionnal installation

* bower?

Unifile archi

* Should be a nodejs module
* Silex ande CE would use it as a middleware
* No more strange system for config in unifle?

unifile archi, tests and readme

* https://npmjs.org/package/social-cms-backend
* tests http://stackoverflow.com/questions/11520170/unit-testing-oauth-js-with-mocha
* http://decodize.com/javascript/build-nodejs-npm-installation-package-scratch/

Debuging

Validation

* http://validator.w3.org/

Nice to have :

* file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/onlinehandler.html
* file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/fpsdisplay.html

###v2.0.x

Packaging / distribution

* App.js ?
* chrome app http://developer.chrome.com/apps/about_apps.html
* arvixe like service
* add "multiple ftp" to file browser
* newsletter editor or postcard editor
* mainstream CMS page, article or theme editor
* mockup tool
* banner editor


###other features and ideas for plugins

* edit local website

  * http://devcenter.kinvey.com/nodejs/guides/users
  * http://stackoverflow.com/questions/11534412/any-good-user-management-framework-for-node-js
  * http://usercake.com/docs.php#3
  * http://labs.bittorrent.com/experiments/sync/technology.htm

* edit ftp

  * http://www.goodsync.com/how-to-sync/ftp
  * https://github.com/FTPbox

* analytics

  * google, yahoo, piwik
  * track links http://www.seosite.co.uk/outgoing-links-on-google-analytics


* mobile optimized version of Silex editor

* sites dynamiques ou administrables
Google mbaas
Ou un cms backend only

