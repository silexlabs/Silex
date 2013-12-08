/*

Inspired by https://gist.github.com/madr/7356170

Uses:

* fix style with google fix style (indentation etc)

  $ grunt fix

* check syntax with *lint

  $ grunt check

* check syntax with *lint, compile with google closure builder/compiler

  $ grunt deploy

* check syntax with *lint, compile with google closure builder/compiler, execute functional tests

  $ grunt test -phantomjs
  $ grunt test -firefox
  $ grunt test -chrome

* watch and deploy when needed

  $ grunt watch
  or
  $ grunt runAndWatch



The Following folder structure is required:

./
  ./bin
    index.html
    debug.html
    ./templates
      *.html
    ./bin/js
      admin.js
      admin.min.js
      admin.min.zipped.js
    ./bin/css
      admin.css
      admin.min.css
      admin.min.zipped.css
  ./src
    ./src/js
      .src/js/
      .src/js/view
      .src/js/model
      .src/js/service
  ./js
    *.js
*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
    , csslint: {
      lax: {
        src: ['src/less/*.css']
        , options: {
          important: false // useful when opening a website in Silex
            , "adjoining-classes" : false
            , "known-properties" : false
            , "box-sizing" : false
            , "box-model" : false
            , "overqualified-elements" : false
            , "fallback-colors" : false
            , "unqualified-attributes" : false
        }
      }
    }
    , compress: {
      main: {
        options: {
          mode: 'gzip'
        }
        , files: [
          {
            expand: true
            , src: ['bin/js/admin.min.js']
            , dest: ''
            , ext: '.min.zipped.js'
          }
          , {
            expand: true
            , src: ['bin/css/admin.min.css']
            , dest: ''
            , ext: '.min.zipped.css'
          }
        ]
      }
    }
    , concat: {
      dist: {
        src: ['src/less/*.css']
        , dest: 'src/less/.temp'
      }
    }
    , htmllint: {
        all: ["bin/*.html"]
    }
    , closureLint: {
      app:{
        closureLinterPath : 'build/closure-linter/closure_linter'
        , command: 'gjslint.py'
        , src: [ 'src/js/**/*.js' ]
        , options: {
          stdout: true
          , strict: true
        }
      }
    }
    , closureFixStyle: {
      app:{
        closureLinterPath : 'build/closure-linter/closure_linter'
        , command: 'fixjsstyle.py'
        , src: [ 'src/js/**/*.js' ]
        , options: {
          strict: true
          , stdout: true
        }
      }
    }
    , less: {
      development: {
        options: {
          cleancss: true
        }
        , files: {
          "bin/css/admin.min.css": "src/less/.temp"
        }
      }
      , production: {
        files: {
          "bin/css/admin.css": "src/less/.temp"
        }
      }
    }
    , closureBuilder: {
      release: {
        options: {
          closureLibraryPath: 'build/closure-library/'
          , namespaces: ['silex.boot']
          , builder: 'build/closure-library/closure/bin/build/closurebuilder.py'
          , compilerFile: 'build/closure-compiler.jar'
          , compile: true
          , compilerOpts: {
            compilation_level: 'SIMPLE_OPTIMIZATIONS'
            , warning_level: 'QUIET'
            , externs: 'cloud-explorer/lib/app/js/cloud-explorer.js'
            , debug: false
          }
        }
        , src: ['src/js/', 'build/closure-library/']
        , dest: 'bin/js/admin.min.js'
      }
      , debug: {
        options: {
          closureLibraryPath: 'build/closure-library/'
          , namespaces: 'silex.boot'
          , builder: 'build/closure-library/closure/bin/build/closurebuilder.py'
          , compilerFile: 'build/closure-compiler.jar'
          , compilerOpts: {
            compilation_level: 'SIMPLE_OPTIMIZATIONS'
            , externs: 'cloud-explorer/lib/app/js/cloud-explorer.js'
            , formatting: 'PRETTY_PRINT'
            , debug: true
            , use_closure_library: true
          }
        }
        , src: ['build/closure-library/', 'src/js/']
        , dest: 'bin/js/admin.js'
      }
    }
    , watch: {
        javascript: {
            files: ['src/js/**/*.js', 'server/**/*.js', 'src/less/*.css', 'bin/**/*.html', 'Gruntfile.js']
            //, tasks: ['check', 'deploy']
            , tasks: ['deploy', 'run']
        }
        , livereload: {
            files: ['Gruntfile.js', 'bin/js/*.js', 'bin/css/*.css', 'bin/assets/**/*.{png,jpg,jpeg,gif,webp,svg}', 'js/*.js', ]
            , options: {
                livereload: true
            }
        }
    }
    , simplemocha: {
        options: {
          globals: ['should']
          , ignoreLeaks: false
          , ui: 'bdd'
          , reporter: 'tap'
        }
        , all: { src: 'test/**/*.js' }
      }
  });

  grunt.loadNpmTasks('grunt-closure-tools');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html');
  grunt.loadNpmTasks('grunt-closure-linter');
  grunt.loadNpmTasks('grunt-simple-mocha');

  grunt.registerTask('deploy', ['concat', 'less:production', 'less:development', 'closureBuilder:debug', 'closureBuilder:release', 'compress']);
  grunt.registerTask('check', ['htmllint', 'csslint:lax', 'closureLint']);
  grunt.registerTask('test', ['check', 'deploy', 'simplemocha']);
  grunt.registerTask('fix', ['closureFixStyle']);

  grunt.registerTask('default', ['check', 'deploy']);
  grunt.registerTask('runAndWatch', 'Start Silex and watch', function () {
      grunt.task.run([
          'run',
          'watch'
      ]);
  });
  grunt.registerTask('run', 'Start Silex', function () {
      var server = require('./server/api-server.js');
  });
}