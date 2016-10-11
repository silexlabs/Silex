##Road map

Right now, there is in the pipe [the issues marked as ```feature``` on github](https://github.com/silexlabs/Silex/issues?q=is%3Aopen+is%3Aissue+label%3Afeature+sort%3Acomments-desc). We considere their priority to be the number of ```+1``` in the comments of the issues, so __feel free to vote__. You can also [vote on bountysource](https://www.bountysource.com/teams/silexlabs/issues) and even [back the features you need with a bounty](https://www.bountysource.com/teams/silexlabs/issues).

You can also [hire one of the contributors](https://github.com/silexlabs/Silex/blob/master/docs/contributors.md) directly to develop a feature you require for your business.

### Archive of the old road map

Todo: make this roadmap issues in github

####next priorities (2014-11)

Debug, stability, code quality, ux

* page order?

Contextual tool bar like in google docs presentation

* add page
* save / open 
* undo redo
* insert (image, text...) / delete 
* edit / change content 
* up/down the dom
* ...

Responsive

* mobile/tablet/desktop modes
* show / hide elements (elements list?)
* navigation burger / group elements
* publish responsive

Seo, accessibility 

* publication into multiple html pages, but Js redirect to index.html when not a bot or screen reader
* robots.txt and sitemap.xml
* w3c validator at 100% (drop google text editor?)

Dynamic sites (to produce blogs or content websites)

* resize to content option
* vertical flow: move everything bellow the element when resizing an element which is in a container which resizes to content too
* dynamic element type: data source and template editor (markdown?)
* integration with CMSs, APIs and backends as data sources

####v2.0.0alpha4

WYSIWYG

* shortcuts (suppr, arrows, save, new, open)
* set as default page (drag drop pages and change order)

Texte

* difference entre typo dans l’editeur text et sur la scene
* (done) detecter la couleur de fond (chercher le background color ou image dans les parents)

Components

* nav bar
* vbox/hbox

File

* (done) export (cleanup html, make zip with .html, .js, .css, all media)? + host on github or other free hosts?

####v2.0.0alpha5

Edition

* copy/cut/paste
* manual z-index (bring to front/back instead of change the z-index on drop)
* undo/redo

  * Ids set on all silex elements
  * Keyframes structure with an actions array
  * Actions structure with time, element id, method to call on the controller
  * the class controller base manage the undo and redo keyframes and actions

* autosave
* multiple selection https://github.com/someshwara/MultiDraggable
* better text editor?
  http://www.webdesignerdepot.com/2008/12/20-excellent-free-rich-text-editors/
  https://github.com/mindmup/bootstrap-wysiwyg

File properties (in the settings dialog)

* title and description and keywords
* favicon

Contextual menu on the elements (menu bar under the menu like google?)

* delete
* lock/unlock position/size/in its container
* up/down (z-index)
* rotation

Properties

* shadows
* font-*
* cursor

* provide css classes

  * to prevent edit (no-resize-w, no-move, no-edit ...) - Class css pour lock w/h/x/y... Display none  de l ui
  * to animate page transitions (from-left, from-right ...)
  * to layout content: static

####v2.0.0beta1

Guarantee backward compatibility: notify users a new version is in production, offer ways to use older versions of Silex?

Continuous integration

* jshint, PhantomJS, jenkins, Selenium
* unit tests http://stackoverflow.com/questions/11520170/unit-testing-oauth-js-with-mocha
* functional tests

Automatic installation

* softaculous virtual install? vagrant?
* bower?

Architecture

* Remove handlebars.js (and use jade on the server side instead?)
* Unifile archi (cf unifile readme)

Debuging and better error handling

* use sockets instead of http requests for publication and heavy processings

Validation

* http://validator.w3.org/

Nice to have :

* publication: optimize and use soscket.io to be notified when job is done + stop a job
* multi user editing

  * save edited parts of the file only + socket.io notifications
  * OR WebRTC: http://www.youtube.com/watch?v=p2HzZkd2A40
  * possible scenario:

    * ad a unique ID to all files (update when rename, create, ...)
    * ask all clients editing the same file permission to share
    * if file is different, break the synch or update?
    * use the undo/redo actions
    * some actions will need to be validated by the server: lock an element for editing, add element, change the dom outside an element
    * relay changes to an element to all clients


* store current state on local storage (auto-save, propose to "open latest unsaved version" when opening a document)
* deeplink to opened file (https://www.silex.me/?file=/dropbox/path/to/file.html)
* indicates online/offline?
  file://localhost/Users/lexa/Dropbox/fdt-workspace/Silex/libs/closure/goog/demos/onlinehandler.html


####v2.0.x

Packaging / distribution

* cf dev-notes.md
* App.js ?
* chrome app http://developer.chrome.com/apps/about_apps.html
* arvixe like service
* add "multiple ftp" to file browser
* newsletter editor or postcard editor
* mainstream CMS page, article or theme editor
* mockup tool
* banner editor

####other features and ideas for plugins

  * SEO:
    use _escaped_fragment_ - see https://developers.google.com/webmasters/ajax-crawling/docs/specification

    Robot.txt

    .htaccess for redirections
    + pass param to redirect in js
    => /pagex serves /#!pagex (or /?redirect=pagex
    => js (if not Google bot) redirects to /#!pagex
    + href attr. set to /pagex and re-written in js to /#!pagex

    OR

    No .htaccess
    render all pages with phantomjs to /pagex.html
    Js redirects to /#!pagex

* Expot to use in haxe with cocktail

  * port silex scripts to haxe js if needed
  * remove unsupported css styles
  * close the html tags (e.g. <img /> instead of <img>)
  * create the .hx, .hxml, .nmml files to test

* widgets

* widget agenda
* widget player vidéo
* webgl (cf open gl editor http://stackoverflow.com/questions/7093354/any-free-open-source-webgl-editors)
* ajout roadmap : menus et sous menu
* https://docs.google.com/spreadsheet/ccc?key=0AhmdV6ktIMy1dE1VTVZMa3NkZjNNRmdWOGd0MzRkUXc&usp=drive_web#gid=3

* Mobile version

  * tabs in the properties toolbox: normal, mobile V, mobile H
  * mobile => bg set to 100% width, stage set to iPhone width
  * data-style-mobile-v, data-style-mobile-h complement of data-style-normal, with position and size and URL (...) data only
  * better design for the toolbox
  * view menu: iPhone, iPad, web

Feature requests to considere

* checkbox to adapt w/h to content
* save offline and wait to be online
* multi-user
* view/hide markers = preview mode?
  en mode édition les éléments importées ont un contour gris
  hide = markers visible only on roll over
  tab shortcut + in the menu
* Sélection multiple hors container / plusieurs containers
* open recent files (use goog.History)
* responsive mode
* better HTML = ré-édition par des intégrateurs

* Layout box: n accepte que des containers layout item qui ne se déplacent pas hors de la boite
Quand ine layout box est sélectionnée, dans le Menu, on peut ajouter  des layout items, mais pas dropper d éléments dans la layout box. Drag drop au sein du layout box?

