##Silex

###en cours

#dev notes

BUGS

get travis selenium tests to work: http://about.travis-ci.org/docs/user/gui-and-headless-browsers/
selenium in npm https://npmjs.org/package/selenium-webdriver

bugs

* Invalid CSS selector pseudoclass warnings at runtime
* retro compat: texts were in containers?
* focus stays on text fields when click on stage
* open a non-silex site => warn
* esc = deselect
* focus on css and js editors when open
* lorem ipsum do not send change event
* ancres html?
* file::isDirty => message to prevent quit
* notifications?
* ?? New site => BG size depends on the stage size

> texte :
> - pas de justification
> - pas de possibilité de désactiver la couleur choisie, ex. surlignage (sauf en cliquant sur remise à remove formatting)

* background-size dans les combo box du bg editor

* test shortcuts on windows
* tab devrait passer de X à Y puis hauteur / largeur (on manipule la résolution puis la position)
* les champs proposant les valeurs X Y - Hauteur - largeur, ne sont pas assez large
* Quand on édite les valeurs X et Y <retour> cela ouvre le browser de fichier

Cloud explorer
* select folder
* refresh button
* errors reporting (at least 503 from dropbox)
* path (fil d'ariane)

Explain this in a readme

  View = html Dom read only
  Model = html Dom write only
  Controller = behavior of the view
  Utils = reusable


- feature: padding
- feature: component Name and CSS class

- services, use http://docs.closure-library.googlecode.com/git/class_goog_ds_JsonDataSource.html
- feature: new states: active, mobile
- use goog.dom.ViewportSizeMonitor
- SplitPane pour les boites a outil? goog.ui.Zippy?

* feature: goog.debug.FpsDisplay and goog.events.OnlineHandler
* Loader sur images - en mode admin seulement? Gif en background des images + min-width/height
* ?qos, système de logs/bug report http://jserrlog.appspot.com/



####Container layout

* none(abs), horizontal, vertical
  => then enable padding
  => use goog.fx.DragListGroup + goog.fx.DragScrollSupport
  in addition to jquery draggable
OR
* type (Vbox, hbox, tilebox...)
 + scroll / adapt to content
 + v/h align
 + Datasource

Style in Silex
- In the text editor, styles
- style editor = Loren ipsum text and google closure editor
  + select the style to edit
  + hover/Normal/press
- default styles: normal, title1/2/3/4, quote, code...
- todo in the future: add/remove custom styles

bugs
- selection de folder dans CE

####2nd step of publish

* ? publish super lent => plusieurs opérations en parallele
* add links to sync DB folder with an FTP FTPBox and http://alternativeto.net/software/ftpbox/
* missing in CE: choose a folder in CE
* publish settings = choose a folder in CE
* publish in the file menu => check that CE is logged in and do the export to clean html
* missing in CE: check logged in and relogin

####Containers evolution

Il faut créer des "containers spécialisés", avec une propriété "layout" qui permettent d'aligner son contenu :
* horizontal
* vertical
* tile (les images passent à la ligne quand il n'y a plus la place)

Autres possibilités
* on ajoute les settings au container actuel, qui serait par défaut layout:absolute
* on fait plusieurs autres containers, chacun pour un comportement
  * absolute container (l'actuel)
  * vertical container
  * horizontal container
  * tile container

Et aussi

* fixed container (ne scroll pas)
* always visible container (quand on scroll, il se déplace tant qu'il n'est pas au bord, mais il reste toujours visible)

Bugs

* set viewport size to background?
* bg properties: manque background-size? scalemode?


####funcitonal tests to do

these tests would have avoid me to push bugs in production:
https://docs.google.com/spreadsheet/ccc?key=0AhmdV6ktIMy1dGdONzVXSzFWZWdxbTVQamJlMFhVQ2c#gid=0


##Notes

Usability tests
https://docs.google.com/document/d/1PVGgSq8XTFSHrqOtLx8B5cY7l9HnDO74mhGhODZLZyY/edit#

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

Stress tests

* https://github.com/ether/etherpad-lite/tree/develop/bin/loadTesting

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


* Idée anims css pour Silex LP

  Scroll -> tout se “casse” au fur et a mesure
  Macaron se décroche
  Titres s’éteignent et deviennent n&b
  Images moisissent
  Tout en bas, un verre posé, avec mention “all this is ... unbreakable”. Le verre est une vidéo. Un gars bourré passe, le remplis et le casse, puis le repose au même endroit cassée.
  Le bg autour de la vidéo évolue avec la vidéo et le “un” de unbreakable s’éteint

  This is all breakable ... try it on mobile
  Site responsive et multilingue


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


##Readme

for wikipedia

About
- what
- how (techno, third party, silex labs for community/communication)
- who (contributors for tests, core, CE)
- for whom (designers, nonprofits, webmasters)
- where and when
- why (learn, teach, sell website, showcase skills, meet great people to work with or hire)

Contribute docs and design
- cf doc nuit charrette

Contribute - develop or fix bugs
- install (vagrant+virtualbox, virtualbox, manually)
- edit code (sublime, shared folder with vagrant, auto compile etc.)
- fork (optional, install git on github and update remote with git, change code, commit, push, pull request)

Contribute - add functional tests
- install silex
- install grunt and mocha and web drivers
- run tests
- write tests

