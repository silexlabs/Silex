#Silex, the html5 editor

##About Silex

Silex is a free and open source software that allows to create Flash and Html websites directly in the browser without writing code. Defined as a CMS (Content Management System) it is used to assemble multimedia content and publish it.

More info on Silex Labs website
http://www.silexlabs.org/silex/

Silex is used to assemble multimedia content and publish it online and on the desktop. You are able to produce websites quickly, and directly in the browser. Silex is maintained by Silex Labs, non profit organization based in Paris.

GPL license 
http://www.silexlabs.org/silex/silex-licensing/

##Roadmap

Current version: v2.0.0alpha2
http://demos.silexlabs.org/silex-v2-alpha2/

###dev notes / encours

cloud explorer
* design
* detection des pages callback (google_auth et twitter.com)
* garder le token quand on est déja connecté?
* find contributors
	Alertes pour liens vers ink
	Alternatives.to
	Poster des messages qui disent
	"on a aussi ce besoin, on s y est mis venez nous aider c est OS
	js client : aidez ns avec l ihm
	Js server : ajoutez des services"

com
* envoi a EO de MS (contact lex)?
* Alternatives.to
* revoir tous les sites qui parlent de silex
* landing page sur silex.io
* redirection html5-editor.org 

refactoring
* pane avec la meme interface : get/setComponent seulement et passer le logger?
* suppr jquery quand pas utile, seulement dans stage


###v2.0.0alpha3

http://demos.silexlabs.org/silex-v2-alpha3/

functionnal
* img non visible pendant 1er loading (apre ajout)
* advanced mode

Properties 
* z-index
* shadows
* border property file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/build/closure-library/closure/goog/demos/roundedpanel.html
  * border width
  * border color
* corners
  * corner radius
  * corners: All,Top,Bottom,Left,Right,Top Left,Top Right,Bottom Left,Bottom Right,
* font-*
* cursor
* scroll?
* ajout max/min width/height, pour rendre bottom/right utile


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

Nice to have :
* file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/onlinehandler.html
* file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/fpsdisplay.html

###v2.0.x

Packaging / distribution
* App.js ?
* arvixe like service & ftp dans unifile
* newsletter editor
* wp, drupal, joomla page editor
* mockup tool




