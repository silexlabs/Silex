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
* adds a #/index-debug-no-compil.html
* choose the extension??
* design

add 
* set as default page
* img non visible pendant 1er loading (apre ajout)

refactoring
* replace *.style.* by goog.style.setStyle
* suppr jquery quand pas utile
* renommer boot.js en app.js
* utiliser 'use strict';
* externs : text editor?? file picker dialog
* view : editors?
* reactiver les urls relatives?

functionnal
* Lock (double click to unlock?)
* Urls relatives (absolues pendant édition)
* url de l'image selectionnee
* image en bg (scale pas repeat)
* Ombres et bordures, 
* Zindex
* Double click to edit
* group images on the same drive as the html page?

###v2.0.0alpha3

http://demos.silexlabs.org/silex-v2-alpha3/

Software architecture
* split view in several files
* interfaces for jquery plugins, so that there is jquery only there

Text editor
* use goog.editor

Properties 
* background color property
* border property file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/roundedpanel
* position and size, centered V/H? .html
* font
* z-index
* cursor


###v2.0.0alpha4

Texte
* entrer en editing en double cliquant sur le bloc texte
* difference entre typo dans l’editeur text et sur la scene
* liens internes / externes : dans le proprietes

Wysiwyg
* selected state 
* resize handle visible only when selected
* grid? snap?

page
* ré-éditer le nom des pages

Insert components
* media (image, audio, video)
* nav bar

File
* save
* save as

Resize : caler a gauche quand fenetre trop petite 

###v2.0.0alpha5

Edition 
* delete elements
* copy/cut/paste
* undo/redo
* autosave
* multiple selection

File properties 
* background 
* title and description and keywords 
* favicon

Contextual menu on the elements
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
