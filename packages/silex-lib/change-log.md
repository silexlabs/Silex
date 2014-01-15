# change logs

This is where you will find the recent changes made to Silex, and available on http://www.silex.me/

## Jan 2014

bug fixes

* CSS/UI display bugs
* text editor background color should be the same as the text field bg color
* body size in front end (when the viewport is smaller than the site)
* text links formatting is blue with underline
* scroll combo box and backgroundAttachment style
* better QOS/user actions tracking
* remove focus from UI text fields when you click on the stage (used to cause many strange behaviors in editors and to interact with shortcuts)

features

* added js editor and css editor
* added inline style editor (css of the selected element in apolo mode)
* added css class name of the selected element (apolo mode)
* added predefined styles in the text editor (Title, quotes...)
* better silex.me temporary landing page
* basics of backward compatibility management
* basics for page transitions and
* images background transparent by default
* text field overflow (when text is too long, scroll bars appear)
* added code to make silex a chrome app https://chrome.google.com/webstore/detail/silex-live-web-creation/pjapkdalpbohjofmdibkcgkkhohakcje?hl=en


code

* more functional tests
* build on heroku and travis, so the compiled js and css files are not versioned anymore

## Dec 2013

bug fixes

* file extension validator
* use Silex in local while offline
* add comp, take scroll into account
* text editor in ff
* publication for URLs with non ascii chars

features

* keyboard shortcuts
* changed size of new website
* lorem ipsum button in text editor
* user does "publish" when there is no publication path set => warning before opening settings pannel
* google fonts in the text editor - contribution of Yannick Dominguez

code

* code refactoring
* cleanup repo
* source mapping
* better grunt file
* added make file...

