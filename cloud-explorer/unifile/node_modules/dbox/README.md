# dbox

A Node.JS convenience wrapper around the Dropbox API. Simplifies OAuth handshake and removes HTTP ceremony.

## Installation

I always recommend you bundle your dependencies with your application. To do
this, create a `package.json` file in the root of your project with the minimum
information...

    {
      "name": "yourapplication",
      "version": "0.1.0",
      "dependencies": {
        "dbox": "0.6.1"
      }
    }

Then run the following command using npm...

    npm install

OR, if you just want to start playing with the library run...

    npm install dbox

## API Overview

`dbox` methods (where dbox is set from requiring the dbox library)...

    app                 <-- creates application object
    
`app` methods (where app is created from the above `app` call)...

    requesttoken        <-- creates request token for getting request token and authorization url
    accesstoken         <-- creates access token for creating a client object
    client              <-- creates client object with access to users dropbox account
    
`client` methods (where client is created from the above `client` call)...

    account             <-- view account
    mkdir               <-- make directory
    mv                  <-- move file or directory
    cp                  <-- copy file or directory
    rm                  <-- remove file or directory
    put                 <-- upload file
    get                 <-- download file
    metadata            <-- get file or directory information
    revisions           <-- get revision history
    restore             <-- restore previous version
    search              <-- search directory
    shares              <-- create link to view file
    media               <-- create streamable link to file
    thumbnails          <-- get thumbnail of file
    copyref             <-- create copy reference to file
    delta               <-- get list of delta entries
    stream              <-- creates readable stream
    readdir             <-- recursively reads directory

## How to Use

Creating a functional `dbox` client is a four step process.

1. create an `app` using application credentials provided by dropbox
2. obtain request token to use for generation access token
3. have user visit authorization URL to grant access to your application
4. create a client using access token that was generated earlier

### Step 1

    var dbox  = require("dbox")
    var app   = dbox.app({ "app_key": "umdez34678ck01fx", "app_secret": "tjm89017sci88o6" })
    
### Step 2

Authorization is a three step process.

a) Get a request token...

    app.requesttoken(function(status, request_token){
      console.log(request_token)
    })

b) User must visit the url to grant authorization to the client...

    https://www.dropbox.com/1/oauth/authorize?oauth_token=#{ request_token.oauth_token }

c) Generate our access token with the request token...

    app.accesstoken(request_token, function(status, access_token){
      console.log(access_token)
    })

### Step 3

    var client = app.client(access_token)

Now we have a client that gives us access to all the api functionality.

## Client Methods

### account([options,] callback)

Returns account information.

    client.account(function(status, reply){
      console.log(reply)
    })
    
output of `reply` returns...

    { 
      uid: 123456789,
      display_name: 'Brock Whitten',
      email: 'brock@sintaxi.com',
      country: 'CA',
      referral_link: 'https://www.dropbox.com/referrals/NTc0NzYwNDc5',
      quota_info: { 
        shared: 1100727791, 
        quota: 2415919104, 
        normal: 226168599
      }
    }

### mkdir(path, [options,] callback)

Creates directory at specified location.

    client.mkdir("foo", options, function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    {
      "size": "0 bytes",
      "rev": "1f477dd351f",
      "thumb_exists": false,
      "bytes": 0,
      "modified": "Wed, 10 Aug 2011 18:21:30 +0000",
      "path": "/foo",
      "is_dir": true,
      "icon": "folder",
      "root": "sandbox",
      "revision": 5023410
    }

### mv(from\_path, to\_path, [options,] callback)

Moves file or directory to a new location.

    client.mv("foo", "bar", function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    {
      "size": "0 bytes",
      "rev": "irt77dd3728",
      "thumb_exists": false,
      "bytes": 0,
      "modified": "Wed, 10 Aug 2011 18:21:30 +0000",
      "path": "/bar",
      "is_dir": true,
      "icon": "folder",
      "root": "sandbox",
      "revision": 5023410
    }

### cp(from\_path, to\_path, [options,] callback)

Copies a file or directory to a new location.

    client.cp("bar", "baz", function(status, reply){
      console.log(reply)
    })
    
    {
      "size": "0 bytes",
      "rev": "irt77dd3728",
      "thumb_exists": false,
      "bytes": 0,
      "modified": "Wed, 10 Aug 2011 18:21:30 +0000",
      "path": "/baz",
      "is_dir": true,
      "icon": "folder",
      "root": "sandbox",
      "revision": 5023410
    }

### rm(path, [options,] callback)

Removes a file or directory.

    client.rm("README.txt", function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    {
      "size": "0 bytes",
      "is_deleted": true,
      "bytes": 0,
      "thumb_exists": false,
      "rev": "1f33043551f",
      "modified": "Wed, 10 Aug 2011 18:21:30 +0000",
      "path": "/README.txt",
      "is_dir": false,
      "icon": "page_white_text",
      "root": "sandbox",
      "mime_type": "text/plain",
      "revision": 492341
    }
    
### put(path, data, [options,] callback)

Creates or modifies a file with given data. `data` may be a string or a buffer.

    client.put("foo/hello.txt", "here is some text", function(status, reply){
      console.log(reply)
    })
    
output of `reply` returns...
    
    {
      "size": "225.4KB",
      "rev": "35e97029684fe",
      "thumb_exists": false,
      "bytes": 230783,
      "modified": "Tue, 19 Jul 2011 21:55:38 +0000",
      "path": "/foo/hello.txt",
      "is_dir": false,
      "icon": "page_white_text",
      "root": "sandbox",
      "mime_type": "text/plain",
      "revision": 220823
    }

### get(path, [options,] callback)

Pulls down file (available as a buffer) with its metadata.

    client.get("foo/hello.txt", function(status, reply, metadata){
      console.log(reply.toString(), metadata)
    })

output of `reply.toString()` returns...
   
    here is some text

output of `metadata` returns...

    {
      "revision": 11,
      "rev": "b07a93bb3",
      "thumb_exists": false,
      "bytes": 17,
      "modified": "Sat, 12 May 2012 19:31:08 +0000",
      "client_mtime": "Sat, 12 May 2012 19:30:52 +0000",
      "path": "/foo/hello.txt",
      "is_dir": false,
      "icon": "page_white_text",
       "root": "app_folder",
       "mime_type": "text/plain",
      "size": "17 bytes"
    }

### metadata(path, [options,] callback)

Retrieves file or directory  metadata.

    // available options...
    var options = {
      file_limit         : 10000,              // optional
      hash               : ...,                // optional
      list               : true,               // optional
      include_deleted    : false,              // optional
      rev                : 7,                  // optional
      locale:            : "en",               // optional
      root:              : "sandbox"           // optional
    }

    client.metadata("Getting_Started.pdf", options, function(status, reply){
      console.log(reply)
    })

output of `reply` returns...
   
    {
      "size": "225.4KB",
      "rev": "35e97029684fe",
      "thumb_exists": false,
      "bytes": 230783,
      "modified": "Tue, 19 Jul 2011 21:55:38 +0000",
      "path": "/Getting_Started.pdf",
      "is_dir": false,
      "icon": "page_white_acrobat",
      "root": "sandbox",
      "mime_type": "application/pdf",
      "revision": 220823
    }

### revisions(path, [options,] callback)

Obtains metadata for the previous revisions of a file.

    // available options...
    var options = {
      rev_limit          : 10,                 // optional
      locale:            : "en"                // optional
    }

    client.revisions("foo/hello.txt", options, function(status, reply){
      console.log(reply)
    })

output of `reply` returns...
  
    [
      {
        "is_deleted": true,
        "revision": 4,
        "rev": "40000000d",
        "thumb_exists": false,
        "bytes": 0,
        "modified": "Wed, 20 Jul 2011 22:41:09 +0000",
        "path": "foo/hello.txt",
        "is_dir": false,
        "icon": "page_white",
        "root": "sandbox",
        "mime_type": "text/plain",
        "size": "0 bytes"
      },
      {
        "revision": 1,
        "rev": "10000000d",
        "thumb_exists": false,
        "bytes": 3,
        "modified": "Wed, 20 Jul 2011 22:40:43 +0000",
        "path": "foo/hello.txt",
        "is_dir": false,
        "icon": "page_white",
        "root": "sandbox",
        "mime_type": "text/plain",
        "size": "3 bytes"
      }
    ]

### restore(path, rev, [options,] callback)

Restores a file path to a previous revision.

    client.revisions("foo/hello.txt", 4, function(status, reply){
      console.log(reply)
    })
    
output of `reply` returns...

    {
      "is_deleted": true,
      "revision": 4,
      "rev": "40000000d",
      "thumb_exists": false,
      "bytes": 0,
      "modified": "Wed, 20 Jul 2011 22:41:09 +0000",
      "path": "/foo/hello.txt",
      "is_dir": false,
      "icon": "page_white",
      "root": "sandbox",
      "mime_type": "text/plain",
      "size": "0 bytes"
    }
    
### search(path, query, [options,] callback)

Returns metadata for all files and directories that match the search query.

    var options = {
      file_limit         : 10000,              // optional
      include_deleted    : false,              // optional
      locale:            : "en"                // optional
    }

    client.search("foo", "hello", options, function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    [
      {
        "size": "0 bytes",
        "rev": "35c1f029684fe",
        "thumb_exists": false,
        "bytes": 0,
        "modified": "Mon, 18 Jul 2011 20:13:43 +0000",
        "path": "/foo/hello.txt",
        "is_dir": false,
        "icon": "page_white_text",
        "root": "sandbox",
        "mime_type": "text/plain",
        "revision": 220191
      }
    ]

### shares(path, [options,] callback)

Creates and/or returns a shareable link to a file or directory.

    client.shares("foo/hello.txt", options, function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    {
      "url": "http://db.tt/APqhX1",
      "expires": "Sat, 17 Aug 2011 02:34:33 +0000"
    }

### media(path, [options,] callback)

Creates and/or returns a shareable link to a file or directory. This endpoint
is similar to /shares but content is streamable.

    client.media("foo/hello.txt", function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    {
      "url": "http://www.dropbox.com/s/m/a2mbDa2",
      "expires": "Thu, 16 Sep 2011 01:01:25 +0000"
    }

### thumbnails(path, [options,] callback)

Gets a thumbnail for an image.

    client.thumbnails("foo/koala.jpg", function(status, reply, metadata){
      console.log(metadata);

      require('fs').writeFile('koala_small.jpg', reply, function () {
        console.log('Thumbnail saved!');
      });
    })


output of `reply` is a buffer which should be sent to a new image file.

output of `metadata` returns...

    {
      "revision": 13,
      "rev": "d07a93bb3",
      "thumb_exists": true,
      "bytes": 780831,
      "modified": "Sat, 12 May 2012 19:48:59 +0000",
      "client_mtime": "Tue, 14 Jul 2009 05:32:31 +0000",
      "path": "/foo/koala.jpg",
      "is_dir": false,
      "icon": "page_white_picture",
      "root": "app_folder",
      "mime_type": "image/jpeg",
      "size": "762.5 KB"
    } 

### cpref(path, [options,] callback)

    client.cpref("song.mp3", function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    {
      expires: 'Thu, 03 Apr 2042 22:33:49 +0000',
      copy_ref: 'ALGf72Jrc3A0ZTh5MzA4Mg'
    }
    
### delta([options,] callback)

    client.delta(function(status, reply){
      console.log(reply)
    })

output of `reply` returns...

    {
      reset: true,
      cursor: 'AkMCE0f1CsMA7tobhXR1vwEZaM1KjFqTNjxgWITCks6oeJxjKBL2Z2Co0WOp_rSOgYHxJwMQAAAyKwSY',
      has_more: false,
      entries: [
        [ '/foo', [Object] ],
        [ '/bar', [Object] ]
      ]
    }
    
### readdir(path, callback)

Get an array of paths for all files and directories found in the given path. The method calls recursively to dropbox so it can take a long time to evaluate.
    
    client.readdir('/', function(status, reply){
        console.log(reply)
    })

Output of `readdir` returns...
    
    ['/','/foo','/bar']

## License

Copyright 2011 Chloi Inc.
All rights reserved.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
