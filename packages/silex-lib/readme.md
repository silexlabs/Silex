[![license: GPL](https://img.shields.io/badge/license-GPL-green.svg)](http://www.silexlabs.org/silex/silex-licensing/)
[![Build Status](https://circleci.com/gh/silexlabs/Silex.svg?style=svg)](https://circleci.com/gh/silexlabs/Silex)
[![status of silex.me instance](https://monitoshi.lexoyo.me/badge/1525963562293-6552)](https://editor.silex.me)

## About Silex, live web creation.

Silex, is a free and open source website builder in the cloud. Create websites directly in the browser without writing code. And it is suitable for professional designers to produce great websites without constraints. Silex is also known as the HTML5 editor.

![Silex UI](https://github.com/silexlabs/www.silex.me/raw/gh-pages/assets/silex-ui.gif)

Brought to you by Silex Labs team, promoting free software.

Links
* [Silex official website](http://www.silex.me/)
* [Documentation wiki](https://github.com/silexlabs/Silex/wiki)
* [questions and answers, bug report, feature requests](http://www.silexlabs.org/silex/)
* [Silex license is GPL](http://www.silexlabs.org/silex/silex-licensing/)
* [Road map](https://github.com/silexlabs/Silex/blob/master/docs/roadmap.md) and [change log](https://github.com/silexlabs/Silex/blob/master/docs/change-log.md)

News and tutorials

* See Silex wiki, there is a tutorials section
* [Silex blog](http://www.silexlabs.org/category/the-blog/blog-silex/)
* [subscribe by email](http://eepurl.com/F48q5)

Contact us and let people know about Silex

* [Facebook](http://www.facebook.com/silexlabs)
* [Twitter](https://twitter.com/silexlabs)
* [Contributors list](https://github.com/silexlabs/Silex/graphs/contributors)

## Host an instance of Silex on a server or run Silex on your computer

If you plan to host Silex for your clients, your users or the community, this section is for you.

See this [help section about installing Silex on a server or on your computer, about environment variables, see how to run it with docker or build it from source, etc.](https://github.com/silexlabs/Silex/wiki/How-to-Host-An-Instance-of-Silex)

Please note that there is also an effort to make Silex a desktop software (in opposition to online app), you can [test the offline version of Silex from here](https://github.com/silexlabs/Silex/releases)

## Size of the project's code base

As of june 2017, around 100.000 lines of code. See [github API count (includes blank lines and comments I guess)](https://api.github.com/repos/silexlabs/Silex/languages):

```
JavaScript: 856643,
CSS: 82702,
HTML: 53727,
Shell: 1532
```

[cb372's report](http://line-count.herokuapp.com/silexlabs/Silex):

<table id="results" class="table table-striped">
<tbody>
    <tr>
        <th>File Type</th>
        <th>Files</th>
        <th>Lines of Code</th>
        <th>Total lines</th>
    </tr>
    <tr>
        <td>JavaScript</td>
        <td>422</td>
        <td>138797</td>
        <td>183644</td>
    </tr>
    <tr>
        <td>Json</td>
        <td>3</td>
        <td>146</td>
        <td>146</td>
    </tr>
    <tr>
        <td>Text</td>
        <td>12</td>
        <td>0</td>
        <td>1047</td>
    </tr>
    <tr>
        <td>Shell</td>
        <td>4</td>
        <td>24</td>
        <td>47</td>
    </tr>
    <tr>
        <td>Stylesheets</td>
        <td>90</td>
        <td>17777</td>
        <td>21504</td>
    </tr>
    <tr>
        <td>Html</td>
        <td>7</td>
        <td>545</td>
        <td>726</td>
    </tr>
</tbody>
</table>


[Cloc's report](https://github.com/AlDanial/cloc):

```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                     404           9616          14937          50841
CSS                             75           1580           1652          11394
LESS                            20            141             87           1768
Markdown                        10            334              0            657
YAML                            14              3              1            581
HTML                             7            177             22            527
JSON                             3              0              0            146
Bourne Shell                     4              6             13             28
-------------------------------------------------------------------------------
SUM:                           541          12030          16712          66869
-------------------------------------------------------------------------------
```

## dependencies

These are the upstream projects we use in Silex

* [unifile](https://github.com/silexlabs/unifile), a nodejs library which provides a unified access to cloud services
* [Cloud explorer](http://cloud-explorer.org), a file manager for the cloud services. It is a front end javascript app which connects to a unifile server
* [Prodotype](https://github.com/silexlabs/Prodotype), Build components and generate a UI to make them editable in your app
* [Stage]() is the component which handles all the drag and drop actions
* [Ace](http://ace.c9.io/), an excellent code editor in javascript
* [Typescript]() is used to build Silex
* jquery is included in the sites generated by Silex
* [GLYPHICONS library of icons and symbols](http://glyphicons.com/) ([CC license](http://creativecommons.org/licenses/by/3.0/)) and [fontawesome icons](http://fontawesome.io/)



### Prodotype in Silex

* components
  data: prodotypeData.components.elementId = {}
  render: element.innerHTML
  ui: property component
  examples: slideshow, form, share bar
* styles
  data: prodotypeData.styles.elementId = {}
  render: head.innerHTML
  ui: property style
  examples: text style, shadows, text special effects
* behaviors
  data: prodotypeData.behaviors.elementId = {}
  render: element.className / attributes, dependency.js
  ui: property component
  examples: anim show, anim hover, resize to content, always visible / static, anchor
* apps
  data: prodotypeData.apps = []
  render: head.innerHTML
  ui: settings app
  examples: analytics,
* fonts
  data: prodotypeData.fonts = []
  render: head.innerHTML
  ui: settings fonts
  examples: google fonts, open fonts



todo
* git mv src/components => src/prodotype/components
* create prodotype/styles
  * new tab in properties
  * text.ejs and text.yml
  * next iteration: themes, apply theme, save as theme...
* create prodotype/behaviors
* create prodotype/fonts, prodotype/apps
