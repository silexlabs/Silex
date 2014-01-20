
Refaire un tour sur les Articles atelier
Refaire un tour sur newsletter (1 seule case par ligne, intro explicite) puis envoi newsletter
Donner contenu newletter liste silex
- changelog
- ateliers
- passed events

##Silex

###en cours

#dev notes

BUGS




bugs
link to github issues in help
https://github.com/silexlabs/Silex/issues/
* set viewport size to background?
* setClassName dans model.element, pas dans helper.Style
* move static.silex.io to dist/
- services, use http://docs.closure-library.googlecode.com/git/class_goog_ds_JsonDataSource.html

How good is your website?
https://plus.google.com/u/0/+PolGoasdou%C3%A9/posts/aZast8CsUsH?cfem=1


Cloud explorer
* select folder
* refresh button
* errors reporting (at least 503 from dropbox)
* drop files from OS file browser: wrong mouse cursor
* path (fil d'ariane)



####Silex LP

share buttons
http://www.creativesorcerers.com/tutorials/social-sharing-button-using-css3/

github widget
http://mkla.bz/gh-issues-widget/
https://github.com/chrismear/github-issues-widget

these tests would have avoid me to push bugs in production:
https://docs.google.com/spreadsheet/ccc?key=0AhmdV6ktIMy1dGdONzVXSzFWZWdxbTVQamJlMFhVQ2c#gid=0


##Notes

Usability tests
https://docs.google.com/document/d/1PVGgSq8XTFSHrqOtLx8B5cY7l9HnDO74mhGhODZLZyY/edit#

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




