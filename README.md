## About this meta repo

This is a meta repository for Silex website builder

It includes all projects needed for Silex development as git submodules. This is the repo you need to contribute to Silex as many of the projects are dependencies of each other, so we can iterate in all at the same time and benefit from using [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) or [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

There is no issue on this repo, please use the individual project's issues

## Included repositories in this meta repo

| Name | Folder | Website | Description | Repo | npm | Docs | License |
|------|--------|---------|------|------|------|------|------|
| CloudExplorer | `/packages/cloud-explorer/` | [Website](https://cloud-explorer.org/) | A free customizable file browser and a self hosted node.js API server. | [Github repo](https://github.com/silexlabs/CloudExplorer2) | [npm package](https://www.npmjs.com/package/cloud-explorer) | [docs](https://github.com/silexlabs/CloudExplorer2) | |
| Prodotype | `/packages/prodotype` | [Website](http://projects.silexlabs.org/Prodotype/) | Create components and the UI to edit them out of html templates and yaml files. | [Github repo](https://github.com/silexlabs/Prodotype) | [npm package](https://www.npmjs.com/package/prodotype) | [docs](http://projects.silexlabs.org/Prodotype/) | |
| Responsize | `/packages/responsize/` | [Website](http://responsize.org/) | Display websites on different screen sizes in the browser. Useful to visualize how a website looks on desktop while browsing on mobile, or on big screen while browsing on a laptop. | [Github repo](https://github.com/silexlabs/responsize) | [npm package](https://www.npmjs.com/package/responsize) | [docs](https://github.com/silexlabs/responsize) | GPL |
| Silex templates | `/packages/silex-templates/` and `/packages/silex-blank-templates/` | [Website](https://www.silex.me/templates/) | The community templates available on [Silex Dashboard](https://github.com/silexlabs/Silex/wiki/Editor-UI#dashboard). | [Github repo](https://github.com/silexlabs/silex-templates) | [npm package](https://www.npmjs.com/package/silex-templates) | [docs](https://github.com/silexlabs/Silex/wiki/Create-templates-for-Silex) | CC |
| Silex website builder | `/packages/Silex` | [Website](https://www.silex.me) | The hackable website builder for designers. | [Github repo](https://github.com/silexlabs/Silex) | [npm package](https://www.npmjs.com/package/silex-website-builder) | [docs](https://github.com/silexlabs/Silex/wiki) | GPL and MPL |
| editor.silex.me | `/packages/editor.silex.me` | [Website](https://editor.silex.me) | Free public Silex instance hosted by Silex Labs foundation. | [Github repo](https://github.com/silexlabs/editor.silex.me) | - | [docs](https://github.com/silexlabs/Silex/wiki) | GPL |
| Silex desktop | `/packages/silex-desktop` | [Website](https://github.com/silexlabs/silex-desktop/releases/latest) | Silex desktop version, an installable application for Windows, MacOS and linux. | [Github repo](https://github.com/silexlabs/silex-desktop) | - | [docs](https://github.com/silexlabs/Silex/wiki) | GPL |
| Unifile and unifile-* | `/packages/unifile*` | [Website](http://projects.silexlabs.org/unifile/) | Nodejs library to access cloud storage services with a common API. | [Github repo](https://github.com/silexlabs/unifile) | [npm package](https://www.npmjs.com/package/unifile) | [docs](http://projects.silexlabs.org/unifile/) | MIT |
| eleventy-plugin-directus | `/packages/eleventy-plugin-directus` | - | Expose Directus collections as global data in 11ty | https://github.com/silexlabs/eleventy-plugin-directus | [npm package]() | https://github.com/silexlabs/eleventy-plugin-directus | MIT |
| eleventy-plugin-directus | `/packages/eleventy-plugin-directus` | - | Expose Directus collections as global data in 11ty | https://github.com/silexlabs/eleventy-plugin-directus | [npm package](https://www.npmjs.com/package/@silexlabs/eleventy-plugin-directus) | https://github.com/silexlabs/eleventy-plugin-directus | MIT |
| `@silexlabs/grapesjs-fonts` | `/packages/grapesjs-fonts` | - | Custom Fonts plugin for grapesjs | [npm package](https://www.npmjs.com/package/@silexlabs/grapesjs-fonts) | [Github repo](https://github.com/silexlabs/grapesjs-fonts#readme) | MIT |
| grapesjs-symbols | `/packages/grapesjs-symbols` | - |  | [npm package](https://www.npmjs.com/package/@silexlabs/grapesjs-symbols) | [Github repo](https://github.com/silexlabs/grapesjs-symbols#readme) | MIT |
| grapesjs-ui-suggest-classes | `/packages/grapesjs-ui-suggest-classes` | - |  | [npm package](https://www.npmjs.com/package/@silexlabs/grapesjs-ui-suggest-classes) | [Github repo](https://github.com/silexlabs/grapesjs-ui-suggest-classes#readme) | MIT |
| grapesjs-directus-storage | `/packages/grapesjs-directus-storage` | - |  | [npm package](https://www.npmjs.com/package/@silexlabs/grapesjs-directus-storage) | [Github repo](https://github.com/silexlabs/grapesjs-directus-storage#readme) | MIT |

## Instruction

To contribute to Silex you need to clone this repo with its submodules, make sure you use the required nodejs version (nvm) and install its dependencies (yarn or npm):

```
$ git clone git@github.com:silexlabs/silex-meta.git --recurse-submodules -j8
$ cd silex-meta
$ nvm use
$ npm install OR yarn install
$ npm start OR yarn start
```

Useful commands

* Start Silex: `npm start` (or use `npm run start:debug`)
* Release a package (which is in packages/$PACKAGE_NAME) and bump version of a library and all its dependents: `scripts/release-version packages/$PACKAGE_NAME $VERSION`, then you probably want to `git push --follow-tags` the changed packages
* Add a project: `git submodules add $PACKAGE_GIT_URL packages/$PACKAGE_NAME`

## Third party dependencies

* [Typescript](https://www.typescriptlang.org/) is used to build Silex
* [Ace](http://ace.c9.io/), an excellent code editor in javascript
* jquery is included in the sites generated by Silex
* [GLYPHICONS library of icons and symbols](http://glyphicons.com/) ([CC license](http://creativecommons.org/licenses/by/3.0/)) and [fontawesome icons](http://fontawesome.io/)

## Size of Silex code base

This includes all the packages of this repo.

[Cloc's report](https://github.com/AlDanial/cloc) in mar. 2021:

```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                     149           9652          10733          54582
JSON                            55              3              0          52723
TypeScript                     178           2591           4713          21524
HTML                           114          16988            380          16689
CSS                             57           2142           1098          14399
SCSS                            57            881            415           5444
SVG                             17              0              0           4810
LESS                            36            172            203           4039
YAML                            38             18             46           2607
EJS                             28             40              9           1627
JSX                             14            160            109           1406
Markdown                        42            472              0           1067
Pug                             17             54             36            938
Dockerfile                       1              3              3              9
Properties                       1              1              0              1
-------------------------------------------------------------------------------
SUM:                           804          33177          17745         181865
-------------------------------------------------------------------------------
```

[Cloc's report](https://github.com/AlDanial/cloc) in feb 2023:

```
$ cloc packages                                                                      
     515 text files.
     345 unique files.                                          
     697 files ignored.

github.com/AlDanial/cloc v 1.92  T=1.00 s (345.0 files/s, 212776.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JSON                            22              1              0         119875
JavaScript                      62           7190           7805          38240
TypeScript                     142           2035           4067          17106
CSS                             21            594            715           5761
YAML                            23             53             39           2914
LESS                            21            138            159           2234
Markdown                        15            413              0            932
Pug                             14             49             30            899
EJS                              7             35              4            798
HTML                             3             56             12            495
SVG                             13              0              0             96
Dockerfile                       2              9              9             13
-------------------------------------------------------------------------------
SUM:                           345          10573          12840         189363
-------------------------------------------------------------------------------
```
