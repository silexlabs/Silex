#Silex, the html5 editor

##About Silex

Silex is a free and open source software that allows to create Flash and Html websites directly in the browser without writing code. Defined as a CMS (Content Management System) it is used to assemble multimedia content and publish it.

More info on Silex Labs website
http://www.silexlabs.org/silex/

Silex is used to assemble multimedia content and publish it online and on the desktop. You are able to produce websites quickly, and directly in the browser. Silex is maintained by Silex Labs, non profit organization based in Paris.

GPL license 
http://www.silexlabs.org/silex/silex-licensing/

##Distribution/packages

This is how Silex will be distributed

* Hosted free
  No install, just go to http://silex.io/latest/ and do design
  Edit HTML pages in your drobbox, gdrive...  Your site is visible only by people with whom you share it. 
  Tech note: host cloud explorer @silexlabs (silex.html on SL dedicated server and nodejs on heroku)
* Hosted pro
  No install, purchase a hosting plan @arvixe, and go to http://arvixe.silex.io/latest/ and do design
  Edit your site from an online location. Your site accessible to everyone 24/7. 
  Paid, no setup, no need to know anything about hosting.
  Tech note: PHP file explorer hosted @arvixe, silex.html on SL dedicated server (use arvixe.silex.io ??)
* Hosted anywhere
  Purchase a stadard shared hosting, and use Scriptaculous automatic install to install Silex in a folder.
  You can manage multiple separated sites with different instances of Silex to edit the site. 
  Tech note: silex.html and PHP file explorer hosted by the user's hosting company
* Hosted by you, front and back
  Offer Silex "Hosted free" version to your users, on your domain name. 
  Your users go to your URL and use Silex from there to edit their files from their cloud services.
  Tech note: node server, silex in the unifile server

##Roadmap

Current version: v2.0.0alpha2
http://demos.silexlabs.org/silex-v2-alpha2/

###v2.0.0alpha3

http://demos.silexlabs.org/silex-v2-alpha3/

Properties 

* shadows
* font-*
* cursor
* scroll?


###v2.0.0alpha4

WYSIWYG

* shortcuts (suppr, arrows, save, new, open)
* UI sounds? 
* set as default page

Texte

* difference entre typo dans l’editeur text et sur la scene
* detecter la couleur de fond (chercher le background color ou image dans les parents)

Components

* media (image, audio, video)
* nav bar

File

* group images on the same drive as the html page? 
* export (cleanup html, make zip with .html, .js, .css, all media)?

###v2.0.0alpha5

Edition 

* copy/cut/paste
* undo/redo
* autosave
* multiple selection
* better text editor? 
  http://www.webdesignerdepot.com/2008/12/20-excellent-free-rich-text-editors/
  http://mindmup.github.io/bootstrap-wysiwyg/

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

Debuging

Validation

* http://validator.w3.org/

Nice to have :

* file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/onlinehandler.html
* file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/fpsdisplay.html

###v2.0.x

Packaging / distribution

* App.js ?
* arvixe like service
* add "multiple ftp" to file browser
* newsletter editor or postcard editor
* mainstream CMS page, article or theme editor
* mockup tool
* banner editor

