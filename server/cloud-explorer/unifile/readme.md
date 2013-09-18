#Short story

##Dropbox

Connect to your dropbox 
* http://unifile.silexlabs.org/v1.0/dropbox/connect/
* open the url given by the previous call
* http://unifile.silexlabs.org/v1.0/dropbox/login/

Get your account info and logout
* http://unifile.silexlabs.org/v1.0/dropbox/account/
* http://unifile.silexlabs.org/v1.0/dropbox/logout/

Execute commands
* list a directory: http://unifile.silexlabs.org/v1.0/dropbox/exec/ls/path/to/folder/
* remove a file or directory: http://unifile.silexlabs.org/v1.0/dropbox/exec/rm/path/to/folder-or-file/
* create a directory: http://unifile.silexlabs.org/v1.0/dropbox/exec/mkdir/path/to/folder/
* copy a file or directory: http://unifile.silexlabs.org/v1.0/dropbox/exec/cp/path/to/src/:/path/to/dst/
* move (rename) a file or directory: http://unifile.silexlabs.org/v1.0/dropbox/exec/mv/path/to/src/:/path/to/dst/
* access a file: http://unifile.silexlabs.org/v1.0/dropbox/exec/get/path/to/file.txt
* write data to a file: http://unifile.silexlabs.org/v1.0/dropbox/exec/put/path/to/file.txt:hello world!

##Google drive

Connect to your drive 
* http://unifile.silexlabs.org/v1.0/gdrive/connect/
* open the url given by the previous call
* http://unifile.silexlabs.org/v1.0/gdrive/login/

Get your account info and logout
* http://unifile.silexlabs.org/v1.0/gdrive/account/
* http://unifile.silexlabs.org/v1.0/gdrive/logout/

Execute commands: simply replace dropbox by gdrive in the above examples


#Use locally or host your own server

Install and run the node.js server or host the server online

Create an app on google drive and dropbox

Edit the config file lib/config.js

#Developer guide

Here is how to contribute

##Add a service

The services in unifile are cloud storage services, e.g. Dropbox and google drive. 

Each service is a Node.js class implementing a given set of functions, e.g. ls, rm, cp...

If you wish to add a service, 

* add your .js file in lib/services/ (duplicate the lib/services/dropbox.js file in order to have all the required methods)
* edit core/router.js to make your service reachable
* if you use an external node.js library, add the dependency in package.json 

Here is a list of services which could be useful

* github
* Box, SkyDrive, RapidShare, CloudMine, FilesAnywhere, RapidShare
* SugarSync
* Amazon S3, FTP and WebDav


to do

* 2 fichiers de conf pour ne pas commiter les secrets
* debug get/put/cat
* ajout "next_url" pour indiquer quoi faire ensuite
* pagination for ls commands
* security: make the "allowCrossDomain" function look for the api key and det if the domain is allowed
* best practices for the api
  http://www.startupcto.com/backend-tech/building-an-api-best-practices
* mimic unix commands : /v1.0/gdrive/exec/?cmd="cd /example1/test/ ; cp img1.jpg img2.jpg ; ls"
* make a Terminal in javascript to test the services
* add a new service : an example of social network, like facebook, g+ or twitter?


