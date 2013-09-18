	
#dev notes

##encours


cloud explorer

* design
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

com silex

* landing page

  * comme sur http://etherpad.org/ proposer download ou une liste de "public instances"? et aussi le "contribute" qui est bien, et le workflow avec github, le site etc.
  * etudier la com de http://korben.info/bluegriffon-un-excellent-editeur-html-wysiwyg-libre.html

* envoi a EO de MS (contact lex)?
* Alternatives.to
* revoir tous les sites qui parlent de silex
* landing page sur silex.io
* redirection html5-editor.org 

Silex

* edit HTML: seulement sur un nouveau type de composant : HTML element (qui n'est pas container)
* ajout d'éléments sur la page en cours : seulement si aucun parent n'est un "calque"
* ajout max/min width/height, pour rendre bottom/right utile
* afficher l'email du gars logué (demander a thomas)


Bugs

* url restent absolues, parfois avec "'", parfois sans, parfois avec &quot;
* url service local bug
  getAbsolutePath :
  ../api/v1.0/www/exec/get/2012-04-19%2018.28.13.jpg
  ../api/v1.0/www/exec/get/tmp.html
  retourne : api/v1.0/www/exec/api/v1.0/www/exec/get/2012-04-19%2018.28.13.jpg
  => bug url des images pour service local, ouvre une page, insert image, rouvre la page
  
* save knobs dans la page html
* il y a des images en ligne pour la palette, les mettre en local
* ?? import image => relative instead of absolute
* bg properties: manque background-size?

##Usability tests

Plan:

* silex fait des sites vitrine 
* cloud based (en ligne, sauve sur dropbox ou gd)
* manque les plugins, thèmes, export pour hébergement 
* probablement pas mal d'autres trucs, et des bugs

Targets

* Anto
* Françoise 
* Moly
* Ewa
* Woodoo
* Camcrock
* Pol
* Justin


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