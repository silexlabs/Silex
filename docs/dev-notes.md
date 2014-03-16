commit / push CE & unifile

pour v2 site simon
- formulaire de contact
- footer
- partage
- diaporama

bugs
?- sometimes resize also moves
- il y a un truc etonnant dans l'interface dans les valeurs de positions j'ai des 370.000154187888
- publication dans rep avec des "." ??
- cf github issues
- getBoundingBox devrait utiliser goog et prendre en compte les css
- publish: dowload static.silex.me/* to local

tests to do
- tests/App.js qui lance les tests sans reouvrir de fenetre ou relacer sélénium, et passe a chaque test la variable webdrlver et driver

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
props intéressantes à exposer en wysiwyg?
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

BUGS
* text fields overflow?? check that text is normal, not h1?
* https://github.com/silexlabs/Silex/issues/
* services, use http://docs.closure-library.googlecode.com/git/class_goog_ds_JsonDataSource.html

publish dialog: add links to
* http://validator.w3.org/check?uri=http%3A%2F%2Fsilex-v2.kissr.com
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




