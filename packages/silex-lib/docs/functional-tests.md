##Silex QA

###links

[What is software QA?](http://en.wikipedia.org/wiki/Software_quality_assurance)

Links for Silex QA

* [QA testers wanted on sourceforge](http://sourceforge.net/p/forge/helpwanted/testers/thread/5ce1f0af/)
* [looking for a QA lead](https://github.com/silexlabs/Silex/issues/38)
* [help wanted]()
* [discussion "functional tests to do"](https://github.com/silexlabs/Silex/issues/36)
* [discussion "stress tests to do"](https://github.com/silexlabs/Silex/issues/39)

###getting started

Please start by these first steps and come back to me
* [learn how to use Silex online](http://www.silex.me)
* [install basic software and get started with selenium webdriver](http://webdriver.io/)
* [install Silex, instructions are here](https://github.com/silexlabs/Silex)
* [take a look at Silex tests](https://github.com/silexlabs/Silex/tree/master/test/functional)

###tests to do

open, close button, escape key:

* file browser (see file-explorer.js test)
* text editor, html editor
* js editor, css editor (change content and check the head of the website)
* settings dialog
* website title, error alert, delete confirm

edit content

* insert elements (html, text, text, container)
* change with dummy content and check it has the expected content
* move, resize
* drag / drop to change container
* change properties from the tool box
* copy / paste / insert with scroll

pages

* open
* create, delete, rename
* delete with elements, delete with elements only on the deleted page

create, insert, delete, save, load (see old files tests)

* insert elements (html, text, text, container)
* delete some elements
* save with file explorer (www service) and check the saved HTML file
* load the HTML file and check it has the elements

images

* uplad an image from dist/client/assets/
* add the image on stage
* test add a non existing image and check it displays an error and do not leave an element on the stage

QA - google analytics is used to track users actions in Silex and detect anomalies

* for all the actions tested, add test that they are tracked
* test that errors are tracked

backward compatibility

* load old sites
* save with new URLs
