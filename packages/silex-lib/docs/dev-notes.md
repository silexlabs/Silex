## Silex next steps, TOC

a mettre sous forme d'issues et de propositions?

  - ?? documenter les #!page-* VS #anchor-name
  - fix more bugs
      => suppr edition scripts from dist/client/

    + deconnection de dropbox
    + videos and html box
      x => https://github.com/silexlabs/Silex/issues/156#issuecomment-88950690
      x => remove iframes when not paged
      + Html box: Do not execute scripts
    + ? rename silex-style => silex-user-styles
    + ? file / new => chose a template from templates.silex.me
    + no !important in front-end.css?
    + see known bugs
  - better "tiling" in the property editor?
        -moz-columns: 2 auto; sur .main-container
        take .style-container out of main-container
  - merge `build` branch, cf notes below
  - merge `context-menu` branch
  - site silex a finir
  - ?? bug des URLs https://github.com/silexlabs/Silex/issues/264#issuecomment-108923532
    => save/publish = parse all nodes and create html string
  - better containers (UI), see bellow
  - Finish Mobile
  - release food template + startup template, call for testers and contributors (templates, issues)
  - full ES6 and no more goog.*
  - Monitoring of nodejs app
  - Hosting:
    see hosting branch with persona,
    or add gdrive which allows to host websites
    and update unifile api like http://cloud-elements.com/developer/full-api-documentation/
  - better publication settings panel https://github.com/silexlabs/Silex/issues/35
  - all the feature requests https://github.com/silexlabs/Silex/labels/feature
  - ?Page thumbnails
  - ?Silex + backnode
  - ? Silex + jekyll

## dev

gandi: restart instantly: have 2 node servers and 1 master http://stackoverflow.com/questions/8933982/how-to-gracefully-restart-a-nodejs-server

better code quaity
  https://codeclimate.com/github/silexlabs/Silex/code?q=rating%3AF

## better containers (UI)

* cf https://github.com/silexlabs/Silex/issues/214#issuecomment-103393134
* No more container smaller than content + Min height instead of height, because of BN
* new concept of bg container: les bg containers sont comme le main container, ils peuvent servir a faire des pages a hauteur variable, et fonctionnent comme les containers actuels
* nouveau comportement du container "normal" (non bg)
    - quand on select un element, on select le groupe (container et elements)
    - double click sur un container => edit ses éléments (griser le reste => zindex élevé sur le container et z index un peu moins élevé pour le grisé)
    - sortir un élément du container = le drag et laisser dehors pendant un instant
    - mettre un élément dans le container = le drag et laisser dessus pendant un instant
* menu :
    - insert > add bg container
    - insert > add container
    - edit > group in a container

old notes: containers may be smaller than their content
    + resize container should not move the elements inside it (currently, resize from the top, moves the elements)


## ways to publish a silex website

* with github pages, with rsync http://octopress.org/docs/deploying/
* toile libre
* arvixe
* OVH
* https://getforge.com/

## templates & sites to do

* site silex
  * !! bug image partagee sur fb et g+
  * docs : mettre ss forme d issues
    * remarques leo:
        * Mettre des "souligné" ou couleur sur les 'hover' des liens Github.
        * LIVE-WEB-CREATION: contenu peut etre long ou pas assez direct pour le 1er paragraphe, Peut etre mieux de mettre qq chose comme: Changé, modifié et créé instantanément. Conception facile, résultat immédiat ?? avec des bold sur les mots vraiment important? enfin a voir...
    * static sites articles:
        * https://getforge.com/static
        * http://idratherbewriting.com/2015/02/27/static-site-generators-start-to-displace-online-cmss/
    * prendre en compte l'analyse https://desktop.opquast.com/fr/ (par exemple langue de la page dans le HTML)
    * les icons etc de léo sur www.silexlabs.org ?
    * features
        - Drag drop html elements
        - CSS with real time preview
        - Page system
        Templates and widgets


* http://www.wix.com/website-template/view/html/751?utm_campaign=ct_general&experiment_id=wixblog_pt_post
* http://www.wix.com/demone2/city-bakery

## other ideas

open template
    Ca me semble judicieux de faire démarrer un nouvelle utilisateur sur un template pour qu'il est des repères et "touche" réellement silex.

translate silex
  https://developer.mozilla.org/en-US/Firefox_OS/Developing_Gaia/Localizing_Firefox_OS
  http://pootle.locamotion.org/
  https://github.com/guhelski/gaia/commit/6bac3faacf24fad32167d1be02fac277d76c4b3e

bigtext plugin
http://www.zachleat.com/web/bigtext-makes-text-big/

use errohandler in nodejs like this
https://github.com/fzaninotto/uptime/blob/master/app/api/app.js
+ parent like this
  if (!module.parent) {

contrib: portage lib js base32 en as3
CI / QA
* deploy with codeship: find a way to restart gandi instance

Communication inside silex
* local storage to count the number of save => display a tool tip like in responsize, below help menu
* subscribe to NL
* say hi in the issues
* give 5 min of your time
* the people behind Silex
* vote for the next thing to do in Silex

## other branches

`docker` branch
* ?? permet de dev sur silex (different image indiehosters)
* utiliser indiehosters mais avec le build de l'image et fichiers silex locaux?

`build` branch
* verifier que `npm install --production` fonctionne (doit builder sans les devDependencies)
  https://github.com/silexlabs/Silex/issues/287
* avoir 2 modes de build, dev / prod, plus de .min.* ni de debug.html
* deploy with codeship or travis
  sftp xxxx@sftp.dc0.gpaas.net
  + pass ?
  cd vhosts/default/
  put -r .../* Silex/

page thumbnails
* cf screenshot "page thumbnails.png"
* cf branche page-thumbnails
* cf https://github.com/cburgmer/rasterizeHTML.js/
* finish dev:
  * find why it makes silex bug
  * do not re-render the page list at each redraw
* use an iframe instead? take the whole contentDocument.innerHTML (with the opened page css etc.)

mobile branch to do
  silex responsive => regarder dev notes de responsize
  resize with viewport
  ?new item in view menu: reset mobile style
    => is it when switch off the "allow mobile" setting?
  manage font offset?
  rename "publish settings" section to "advanced" or something?
  a button "hide from mobile version"
  guide to customize the menu + propose several "themes" (get styles from http://slicknav.com/)

  bugs
    * pages bugs
    * add margin between elements => add property?
    * reorder the dom the first time?
        + ?reorder the element when is inserted or change container
    * ?not possible to add elements in the mobile mode
    * prevent-drag in mobile mode
    * resize background => do not double like un non mobile mode
    * fix containers may be smaller than their content
    * ?prevent mediaquery when editor window is too small

enable less in the css editor? http://stackoverflow.com/questions/9746756/parse-less-client-side

context-menu branch

  * on/off states
    * invert icons => white version
    * on/off styles in context-menu.less
    * set on/off styles on the buttons
  * credit icons: http://glyphicons.com/

## known bugs

* settings panel + browse + select => close settings panel
* optim déplacement
* select multiple elements => add css class names should still be possible without removing all the non shared classes
* padding or margin on a silex element make it buggy when resized or moved
* rename works but displays an error in CE
* error of network while uploading freezes CE

* remove grunt and use npm

* add padding to an element => wysiwyg resize bug
      this is because of goog.style.getStyle in stage::followElementSize

* opacity should go 100% on roll over
* when playing with panel width, the body size stay stuck
* no need to have a cron task, the limit is 30 days => just reboot
* scroll in text editor
* when there is a link on an element, the cursor is hand instead of move
* open js editor, then esc, then shortcuts do not work
* sometimes: background-image: url('../../../..//sites-silex/silex-templates/templates/stratup/assets/see2.jpeg')
* save as screw up images (save as in ..)
* slow mouse move => wrong drag / resize
* advanced / simplified mode should be displayed clearly
* Uncaught Error: cannot call methods on pageable prior to initialization; attempted to call method 'option'
* silex should display an error when unifile does (e.g. file deleted)
* internal links option "scroll to top"
* tab / shift tab to browse the elements
* [pagename]-opened should be added by pageable plugin
* undo/redo should store the parent and restore the innerHTML only for the parent

make a widget "lightbox and galery plugin" from the "stratup template"

in silex, change the session key (connect.sid might be used elsewhere)

unifile bugs
* update unifile version and unifile-server.js in responsize and bn
* cookies and sessions??
* login to dropbox, disable internet connexion, refresh => "loading..." and no way to logout or stop, on the server "Fatal error: Cannot read property 'contents' of null"
* "/api/v1.0/" works but not "/api/1.0/"
* session secret should be generated and stored in an env var or file (generated only if the file does not exist)

* brice: Je viens de refaire le test : après iactivité de 5-10min, je clic sur le fond, il repasse devant le bloc texte... voir cv-template-avé-html-box.html

* open website and have to select a page

* undo do not put back the scroll

* custom fonts do not work starting at Arial black

* issues gh

document keyboard shortcuts
* move with arrows
* shift while drag or resize

______


news letter silex v2

* templatic et templates.silex.me
* gandi hosting
* roadmap
* contribute

use https://github.com/foreverjs/forever-monitor to monitor and reboot silex

case a coché "editable in backnbode" + menu tools  "edit in backnode"

tag name dropdown list

readme install ubuntu
* grunt & node
    mieux que les autres liens: comment installer node: http://oskarhane.com/create-a-nodejs-docker-io-image/
	http://stackoverflow.com/questions/15444020/cannot-find-module-findup-sync-when-trying-to-run-grunt
	http://askubuntu.com/questions/235655/node-js-conflicts-sbin-node-vs-usr-bin-node
	sudo ln -s /usr/bin/nodejs /usr/bin/node
* java
* access rights Fatal error: EACCES, permission denied 'dist/server/sessions'

inspiré par wix
* plus de main container: seulement indiquer la largeur du site => faire une option "full width"? pouvoir droper en dehors de la zone centrée
* va poser des probemes dans le cas du mobile: ?pas de containers qui se superposent / se contiennent, seulement un composant shape qui ne contient rien mais se superpose?
* les containers doivent etre en mode layout?
* pas de z auto, seulement un bring to back/front


resize container further than stage should make stage bigger
rename files with CE when there is "-"

ajouter l info de "element sélectionné et ses parents" facon dev tools => dans propriétés (selection: ...)

tablets and phones: make it work or display message
Check screen size and warn if too small

isDirty

copy paste: really copy HTML, paste html, text, image

pretty HTML
remove inline styles (contentElement)

remove static.silex.me (move it to dist/client?)

ajout tests
* pas de path absolute apres save et publish

serverside:
* do not catch uncaught exception, let crash and restart http://shapeshed.com/uncaught-exceptions-in-node/
* remove console logs for production
* remove pass from logs, and the "aaa" log



______


enhancement
* confirm when closing website with modifications
* .paged-hidden => position instead of display none
* lock / unlock as a workaround of drop in wrong containers
* remove the condition to prevent background to be visible only on certain pages => variable height pages
* up/down arrows to move elements in the dom
* uniformiser cleanup de publish et model.element.unprepareHtmlForEdit

CE/unifile
* ftp delete message: { [Error: Could not delete: Is a directory] code: 550 }
* unifile with password in logs
* CE et rename item, Path '/fdt-workspace/silex-templates/templates/clean-square/assets/silexlabs-format-video-1920-1080.png' not found
  + l'image disparait parfois (si il y a un "-") => a la racine de dropbox

next widgets
* slide show with silex pages http://markdalgleish.com/projects/bespoke.js/
+ faire un widget pour photo à 100% de largeur qui décale le container principal, comme sur le site http://www.transientfestival.com/ (un bout de jquery)

legal Silex

    http://usa.autodesk.com/adsk/servlet/index?siteID=123112&id=17752585
    Conditions dutilisation | WIX http://www.wix.com/about/terms-of-use
    http://www.weebly.com/terms-of-service/index.php?lang=fr#

undo redo bugs
* apparition / disparition d'une page video
* copy paste
* move multiple select

template photo
* issue pour diaporama flickr
* http://www.ericryananderson.com/
* http://larajade.co.uk/
* http://www.coreyfishes.com/koken/albums/wolf-tide/
* wall flickr https://www.flickr.com/photos/lexoyo/sets/72157623063548014/

* lazy load images http://www.appelsiini.net/projects/lazyload
* widget lightbox ou http://defunkt.io/facebox/
https://jaukia.github.io/zoomooz/
http://christianv.github.io/jquery-lifestream/example.html
http://slippry.com/
http://www.pixijs.com/examples/

* load testing
  http://gatling.io/

silexize = silex mobile version

* cf script et css dans lexoyo.me et silex.me
* manque pour que ca soit fonctionnel
    * remplacer le menu par un hamburger en fonction de la taille
    * supprimer des éléments en fonction de la taille (et ajouter?)
    * déplacer dans le dom des éléments
    * taille des fonts relative a la taille

help
* add links in editors css, js, html
  faire les issues - see docs/*.mdown
  update les liens dans property-tool.jade et property-tool.jade

undo redo

articles blog
* les widgets
* les templates
* reprendre des news de flashmoto ou wix

? proposer polusieurs instances sur site silex (heroku, gandi, preprod) + graphs des dispos

ft
* fix publish
  !! execution scripts dans htmlbox pendant edition
* ajout actions à client https://github.com/Camme/webdriverjs
* use debug.html to have source map?
* finish insertAndSave.js (add compare to latest.html)
* finish openAndPublish.js (compare)
* create bc-1.0.html, bc-1.1.html, bc-1.2.html, latest.html and backwardCompat.js (open+save+compare)
* do the insertAndSave test with dropbox and ftp => pass a config file with login, pass, path


# en cours

## Non code

widgets de "Live preview for WordPress Theme #50457"
* carousel cherry-plugin
* device.js pour détecter quand mobile ou non
* parallaxe cherry.parallax


issues

* https://github.com/silexlabs/unifile/issues/14
* update https://waffle.io/silexlabs/silex et issues
* ajouter help wanted "publier tuto-publication-by-iris" + éléments d'iris (+ ajout label "tuto"?)

* a mettre dans les issues Silex :
    publication d'images : collision si tout dans assets
    scroll auto de draggable foire quand pas de .background

* ajout readme install silex on windows : Python version, it doesn't work with 3.x (I tried with 3.3 and 3.4), With 2.7 everything goes perfectly
  + comprendre cette dépendance

* ajout graphs dans site silex ou dans status.silex.me
  Instances running
  https://manage.statuspage.io/pages/lnlrtpjzsg2q/integrations
  https://rpm.newrelic.com/accounts/568017/applications/4028608_h4278400/instances
  ou utiliser
  https://github.com/disqus/overseer
  http://www.stashboard.org/

* tests dans ie ?? http://xdissent.github.io/ievms/
* ajout readme gcc pour branche avec build CE
  install gcc on macos: https://developer.apple.com/downloads/index.action?=Command%20Line%20Tools%20%28OS%20X%20Mavericks%29
  install compass: [sudo] gem update --system && [sudo] gem install compass

ajout issue help wanted

    > I suppose that the use of a broad band internet connection and dropbox at certain times of the day can cause problems with file transfer. Would local installation of Silex be a good idea? Its another thing to do but is there any opinion about how it might improve operation. I am presuming other users do not see this problem as we do.

    I am working on a virtual machine with Silex preinstalled. I need this for the developers to get started easily but it could be useful to the users with bad internet connection. But it will be a bit of a hack...

    The best solution would be to make a desktop app out of Silex, with one of these tools
    https://github.com/rogerwang/node-webkit
    https://github.com/creationix/topcube
    http://appjs.com/


tests

* faire une template
* tests sous ff

gérer hiteck : leur demander un stagiaire

## debug

fin pixlr: bug online seulement: silex.utils.Dom.refreshImage(img)


bug unifile :
* update npm versions
* session sqlight connect-sqlite3
* logout https://github.com/silexlabs/unifile/issues/14

bugs silex
* pas de tag html dans les editable.html ???
* insert > view file browser

bug CE
* drop image ne fonctionne plus

backward compat : suppr viewport?

bug des urls avec plein de ///// (view in new window par exple, ou publish settings)

bugs trouves sur ff
* images && url
  ../../../../../../..//Users/lexoyo/Dropbox/fdt-workspace/silex-templates/templates/online-service/
* insert element ne tient pas compte de scroll
* ?? je n'arrive pas à reproduire https://github.com/silexlabs/Silex/issues/107
* https://github.com/silexlabs/Silex/issues/103

site silex bug ie8 et ie9 (lists)

* ? bug image 404 then choose a good one => bug

* bug ctrl+s in text editor
* remplacer tous les display: none par des .silex-hiden-element
* ? retirer de front-end.css les color etc (ca conflict avec des themes potentiels)


## TO DO AFTER

tip of the day from github issues
    + créer des issues pour ca :
    * outage with dropbox API
    * Whant to know who is behind Silex, and why?
    * Edit images with pixlr

?? css editor repliable sur le coté?

unifile : test upload with a real file

Truc de ouf : un outil pour importer un photoshop et connaitre l'équivalant css de chaque element
https://projectparfait.adobe.com/

Un editeur de pages HTML (et de code avec preview), en ligne et qui se branche sur dropbox, ftp etc
https://codeanywhere.com/editor/

* ajout feature requests
    w3c valid
    => convert font tags
        in front-end.css add .text-element span{color: rgb(68, 68, 68); font-size: x-large;}
        <font> and </font> to <span class="normal" style="" />
        in style="" add the font-size (value/3 + "em")
        and add color:


* ajout feature requests
    par brigite:
    Donc, dans la liste des améliorations qui faciliteraient les choses, quand tu auras le temps :
    Un niveau au moins d'undo,
    les flèches pour déplacer les objets,
    le verrouillage des blocs dont on est content et qu'on ne veut plus déplacer par hasard !
    le moyen de placer devant derrière les blocs sans avoir à les déplacer ailleurs pour les ramener devant au bon endroit,
    la possibilité de maîtriser le placement du texte dans sa box (interlignage, ligne de base… Si tu regardes la page classique puis la suivante, le bloc texte est placé au même endroit, même réglages sauf la couleur, of course, et pourtant, l'un est ligné en haut du pavé, l'autre en bas…)

* ajout tag ga pour liens du menu (help)
* ajout feature req
  http://www.kompozer.net/labs.php
* refacto en utilisant le reactive programming
  http://engineering.silk.co/post/80056130804/reactive-programming-in-javascript
  or use knockout http://knockoutjs.com/
* publish templates
  steph
  pol
* publish markdown widget
* split silex site from silex
  * http://editor.silex.me/
      => heroku
  * silex.me => github
  * redirect /silex vers app.silex.me
  * google anal différent sur le site que sur l'app?
  * page status.silex.me?
* heroku Error Page => ??
* status page? and for third party instances?
  https://github.com/ferlores/npm-status-www
  https://www.statuscake.com/
  https://status.io/

* undo/redo
* jshint the code, and grunt check, grunt fix
* optim
  * profiling
  * dirty redraw views
  * store currentPage etc. instead of using jquery and the dom to get it?
* optim unifile
  http://blog.nodejs.org/2012/04/25/profiling-node-js/
  https://nodetime.com/apps
* tests with ff and IE

* window / document / body / head
  * Workspace::getWindow()  Workspace::getDocument, Workspace::getBody et Workspace::getHead
  * On passe window aux vues

* idées archi pour un vrai MVC

  Deplacer vers Controller les listen clicks
  Déplacer dans les models les traitements qui sont dans les ctrl

  Créer un KeyBoardController
  PageableCtrl
  EditableCtrl

  Accès au dom de partout

  Modèles ont ref vers modèles
  Pareil pour contrôleurs
  Views n'ont accès à rien qu'au dom

* idees archi générales
  Passer la config en param à App puis au reste
  getSelection et neededFonts, de model.Body => view.Stage
  initEvents de stage => controller
* ne jamais passer aux vues la liste des pages ou la page en cours, on utilise window.jquery().pageable
* readme: ajout de Fork before clone
* verif pourquoi mauvaise dispo de silex
  rate silex after 1sr save (concept bug ux), propose to submit template or showcase after publish
  https://devcenter.heroku.com/articles/dynos
  + Ajouter compétences heroku et aws sur linkedin
* new version of CE
* publish and getHtml with nodes instead of string replace
* publish: fails with URLs in the custom silex css tag?
* pageable as a jquery method instead of a jqueryui plugin
  http://learn.jquery.com/plugins/basic-plugin-creation/
* can not select stage + something, nor container + content?
* régler les warnings de closure compil, les traiter comme des erreurs?
* creation template with http:// => export remplece par //
* uniformiser les views::redraw
* static.silex.io et static.silex.me
  => faire pointer sur www.silex.me/static.silex.me ?
  => ou au moins garder la même arbo que dans le repo? pourvoir syncro entre ftp et repo

* repo trop gros (cleanup)
* controller-base bien trop gros
* dialog-background should have a count of opened dialogs? => no more settings-background
* plus de string, que des constantes
* pourquoi this.model.body.setEditable utilisé dans le controller et dans le model
* no more controller-base, put methods on other controllers
* UI redraw in all model.Element methods
* check if it is stage/body? Element::addToPage removeFromPage addLink ...
* toutes les modifs faites dans controllers doivent passer par model
* model.workspace.openTextEditor
* rename onXXX of the views
* rename controllers: dialogsController (text, image select, ...), copy/paste, ...
* element class should represent an element of the dom? rename Component?
* uniform qos / tracking, and replace old save.success in menucontroller
* check all variable declaration with default value or "= null;"
* rename "PaneBase::getCommonProperty" => "getCommonValue"
* all changes made in ControllerBase should be made through models (do not use silex.utils.PageablePlugin directly)
* comments like "@fileoverview A controller listens to a view element,"
* suppr jquery de silex, (juste dans l'iframe)
  cf pageable: use jquery only to access the pageable-plugin, not when google closure could be used
* supprimer jquery-ui-* => gain de 500Ko => refaire pageable
* refaire editable.js en google closure? https://code.google.com/p/closure-library/wiki/DragDrop
* insert image => erreur de chargement image => confirmation "voulez vous effacer l'image?"
* roadmap and change log
* ? remove custom fonts *

refacto =
a view holds a reference to the controllers so that it can order changes on the models
a controller holds a reference to the models so that it can change them
a model holds a reference to the views so that it can update them
the main iframe holds the data manipulated by the model
the jquery plugins are used by the model?



templates
  faire un repo des ttemplates silex, avec branche gh-pages
  Best Places to Sell Web Templates and Designs
  http://www.incomesensor.com/best-places-to-sell-web-templates-and-designs/
  widget pour lister les templates
  https://developer.github.com/v3/repos/contents/
  sell
    http://www.webdesignerdepot.com/2008/12/10-places-to-sell-templates/

update silex com
  http://www.framasoft.net/article5154.html
  ? badge https://www.gittip.com/on/github/silexlabs/


hbbtv editor, functionalities http://tum-iptv.aw.atosorigin.com/firehbbtv/
= silex + explanations / notify user / user guide at start
explain these:
* Handle CSS3 directional focus navigation when the nav-up, nav-right, nav-down and nav-left CSS
* object tag for broadcast, cf "<object>" in https://github.com/mitxp/HbbTV-Testsuite/blob/master/base.php
* application/oipfConfiguration et application/oipfApplicationManager in object tag?
+ widgets ?
* hbbtv source http://fmtvp.github.io/tal/jsdoc/symbols/src/antie_static_script_devices_broadcastsource_hbbtvsource.js.html




publier
- widget helloasso.com à publier (api key?)
- widget parallaxe
- templates
    minimal grey
    parallaxe
    Inaug-SB
    NO FAKE
    lexoyo.me
    megacorp
    html5-editor.org
- samples
    animate
    api
    hover
    menu tip top

bugs
- Bugs ie

  click main container
  SCRIPT5022: rgba(255, 255, 255, 1) is not a valid color string
  File: admin.min.js, Line: 1140, Column: 763

  internet explorer 11

  pas de selecteur de couleur
  ni link

- utiliser selection de dossiers de CE
- paneau publication : arvixe automatic install of Silex on the server
- copy paste multiple ??
- delete multiple => ask x times for confirmation
- https://codeclimate.com/github/silexlabs/Silex
?- sometimes resize also moves
   => sous windows?
?- publication dans rep avec des "." ??
   => sous windows?
- anchors
- cf github issues

distribute templates
- http://www.webdesignerdepot.com/2008/12/10-places-to-sell-templates/

docs to do
* Styles silex
  * Texts, h1, P, ...
  * Élément types
  * Élément content
* Docs css
* Inclure css externe
* Libs css
* Silex css experts, yannick camille

feature request:
- anchors
- favicon
- floating menu widget
  http://outyear.co.uk/smint/
  http://avathemes.com/WP/Hexic/
- script et style externes
  In CSS editor : external CSS (URL or browse)
  Js editor: external script
  réunir les 2 en 1 paneau avec onglets
- Manque silex pour layouts
  Lock (drag, resize)
  Lock children (drag, resize)
  Lock drag out / drop in ??
  Move selection up / down (Dom)

  Layout: remove position in CSS
  Resize to content: remove height in CSS
  Change order: use move up / down

should not be commited?!
https://github.com/silexlabs/Silex/search?l=python

in-browser editors
http://stackoverflow.com/questions/2282833/free-open-source-in-browser-image-editors
http://code.google.com/p/svg-edit/
https://www.google.fr/?gws_rd=cr&ei=VGj5UpHFGqXmywPxh4GIAg#q=open+source+%22in+browser%22+editor
https://www.google.fr/?gws_rd=cr&ei=fmH5UtyyOIzHsgbh8IGQCw#q=open+source+cloud+based+editor

RT collaboration
http://stackoverflow.com/questions/10149861/does-operational-transformation-work-on-structured-documents-such-as-html-if-sim
http://sharejs.org/
http://operational-transformation.github.io/ot-for-javascript.html

salle de cours partagée
http://bigbluebutton.org/


##Silex pending tasks

###en cours

#dev notes

goog.fx.Dragger instead of editable?
send an email after first user connexion? in unifile
props intéressantes à exposer dans wysiwyg Silex
  http://www.w3.org/TR/2011/REC-CSS2-20110607/visufx.html
  http://www.w3.org/TR/2011/REC-CSS2-20110607/ui.html
  http://www.w3.org/TR/2011/REC-CSS2-20110607/colors.html
  http://www.w3.org/TR/2011/REC-CSS2-20110607/text.html
  http://www.w3.org/TR/2011/REC-CSS2-20110607/fonts.html

Behance, Comme dans adobe Cloud, publier site dans behance
  http://www.behance.net/dev
  Showcase and discover the latest work from top online portfolios by creative professionals across industries.

next refacto
* attachElement in body?
* copy/paste (stage.getElementClone then body.attachElement(doClone))
* setClassName dans model.element, pas dans helper.Style

* services, use http://docs.closure-library.googlecode.com/git/class_goog_ds_JsonDataSource.html

publish dialog: add links to
* http://validator.w3.org/check?uri=http%3A%2F%2Fwww.silex.me
* http://developers.google.com/speed/pagespeed/insights/?url=http%3A%2F%2Fsilex-v2.kissr.com%2F
* http://www.brokenlinkcheck.com/
* http://www.criticue.com/

envoi mail beta testers silex

How good is your website?
https://plus.google.com/u/0/+PolGoasdou%C3%A9/posts/aZast8CsUsH?cfem=1
  http://validator.w3.org/check?uri=http%3A%2F%2Fsilex-v2.kissr.com
  http://developers.google.com/speed/pagespeed/insights/?url=http%3A%2F%2Fsilex-v2.kissr.com%2F
  http://www.brokenlinkcheck.com/
  http://www.digbacklink.com/ or http://www.iwebtool.com/backlink_checker or http://www.backlinkwatch.com/
Cloud explorer
* select folder
* refresh button
* errors reporting (at least 503 from dropbox)
* drop files from OS file browser: wrong mouse cursor
* path (fil d'ariane)




##cloud explorer

* find contributors

  * Alertes pour liens vers ink
  * Alternatives.to
  * Poster des messages qui disent
  * "on a aussi ce besoin, on s y est mis venez nous aider c est OS
  * js client : aidez ns avec l ihm
  * Js server : ajoutez des services

com ce

* parler de unifile/CE comme ils parlent de l'api et du client sur https://github.com/ether/etherpad-lite


##com silex

* landing page

  * comme sur http://etherpad.org/ proposer download ou une liste de "public instances"? et aussi le "contribute" qui est bien, et le workflow avec github, le site etc.
  * etudier la com de http://korben.info/bluegriffon-un-excellent-editeur-html-wysiwyg-libre.html
  * inspirations:

    * http://www.pansnap.co.uk/
    * http://bathyscaphe.sourceforge.jp/
    * https://everhour.com/#individual (a utiliser pour tracker le temps)
    * http://dribbble.com/adamgedney/tags/landing
    * http://dribbble.com/shots/965728-FREE-Icon-Backgrounds (Pour lexoyo.me? Attention lisence)


* envoi a EO de MS (contact lex)?
* Alternatives.to wikipedia readme
* revoir tous les sites qui parlent de silex
* landing page sur silex.io
* redirection html5-editor.org


##Silex v2 remarques

> inserer une image: il faudrait mettre un logo silex ou silex labs dans le pack, pas juste un acces drop box ou gdrive. Je n'ai pas de compte dropbox, et il se passe rien quand je clique gdrive. Je ne peux donc pas tester l'insertion d'image

Le principe c'est que tout est sur dropbox ou gdrive, ca n'a pas vraiment de sens de faire sans... On pourrait ajouter un champs de saisie pour une url externe par contre. Ca suffirait pour que les gens puissent tester?

?? mettre un logo silex par defaut sur la scene?

> l'edition du html container est toujours rapeux. Ca serait bien que la taille s'adapte automatiquement, je ne sais pas si c faisable. Aussi le deplacer c aussi foireux. Bon c ptet pas la priorité là

Tu parles du container de background?
Ca définit la taille de ton site, c'est important... Je ne suis pas sur de comprendre, quelle a été ton impression?

> je peux pas sauvegarder! je suis sous chrome pourtant .Quand je veux sauvegarder, c'est le cloud explorer qui s'ouvre, et je peux toujours rien y faire

Ah c'est intéressant. Tu peux me dire à quoi tu t'attendais stp, j'ai trop la tete dans le guidon pour m'en rendre compte?

Et en effet, il n'y a rien sans cloud dans silex v2...


> bon je viens de voir le rapport de bug sur le bloquage des popups :-)
> j'ai refait la manip, j'ai authorisé l'appli, maintenant je n'arrive pas plus loin que close this window please, and proceed to login

Ben à il faut fermer la fenetre et attendre
Ca devrait t'afficher tes dossiers

------------------------------

bon j'ai réussi à afficher les fichiers. du coup j'ai sauvegardé. ensuite j'ai voulu faire edit>rename page, j'ai perdu ma page, qui n'apparait d'ailleurs plus dans mon gdrive.

Le coup du cloud mérite une explication, sinon on comprend rien. Je te proposerai bien que presque au tout début tu proposes un wizard qui permette d'importer une page de démo (pas vide!) dans ton cloud, ainsi qu'une image déjà embeddée dans la page et dans le cloud. Et qu'une fois que l'importation s'est bien passée te donne l'url permettant de consulter le site, parce que ça non plus c'est pas évident.

Je te cache pas que là je suis un peu perdu, pourtant silex j'ai bien pratiqué... Avant de faire plus de debug mets qqun de ta cible devant le logiciel et regarde le faire, ça te permettra de voir tout plein de choses que je peux difficilement t'expliquer par mail. Si ca c'est pas possible je peux te faire une session partage d'écran par skype, mais ça sera moins bien.

Pour le point précis de proposer d'utiliser une url: moi ça m'aide, mais je ne pense pas que ça aide ta cible...

et pour "l'edition du html container", je parle de insert > container

Ariel



••••••••••••••••••••••• POINT FORT ••••••••••••••••

- Espace de travail bien pensé.
- Sensation d'utilisation agréable et réactif.
- La publication (exportation) est agréable à utiliser.



••••••••••••••••••••••• ERGONOMIE •••••••••••••••••••••••••


- Ajouter peut être un "nom/titre" visible sur la scène sur les container

- Pas de Copier/Coller

- Menu rapide avec des pictos … serai un plus ?

- Pouvoir modifier la dimension des fenêtres de l'espace de travail … serai un plus ?

- Ajout d'un avatar avec le silex serveur peut rendre le compte d'un utilisateur plus personnel) et d'une certaine façon s'approprier plus intimement Silex ??



••••••••••••••••••••••• SUGJESTION + ••••••••••••••••

- Des Plugins Element & container (ex: SlideShow, bouton à plusieurs état, et des chose plus complexe: menu déroulant, bouton image+fond+texte, ...)

- Pourquoi pas une scène dédier à la création du footer qui se "colle" à chaque bas de page (je sais pas si c'est possible et utile ?)

- Pas de rotation des éléments en mode Normal

- Ajout de Web-font sur le texte-edit, il y a quelques webfont sur le texte-edit mais ne fonctionne pas.

- Cadenat & Hide-show icône sur les éléments … serai un plus ?

- La publication directement sur le FTP.
