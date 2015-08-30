This file is part of [Silex, live web creation](http://www.silex.me).


## About this folder

static.silex.me is a folder which reflects what is online on http://static.silex.me

The files there are included in the websites produced with Silex. This is needed for the following reason.

In the websites produced with Silex, we need to include scripts with an absolute URL. This is because one can click on the .html file and open it in a browser. Then the website has to appear like it does in the preview mode (view / view in a new window), the difference being that in preview mode, we have access to dropbox or any storage the user uses to store the website.

Notes:

* these scripts have a version in their URLs, so that once included in a user's website, it never changes.
* when a website is "published" (file / publish), these scripts are downloaded locally in the website's ```script/``` and ```css/``` folders so that the published websites do not depend on the static.silex.me website anymore.
