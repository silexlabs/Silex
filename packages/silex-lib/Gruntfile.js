/*

Inspired by https://gist.github.com/madr/7356170

Uses:

* check syntax with *lint, compile with google closure builder/compiler

  $ grunt deploy

* watch and deploy when needed

  $ grunt watch

* check syntax with *lint, compile with google closure builder/compiler, execute functional tests

  $ grunt test -phantomjs
  $ grunt test -firefox
  $ grunt test -chrome

* fix style with google fix style (indentation etc)

  $ grunt fix

* check syntax with *lint

  $ grunt check

*/
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-closure-tools');
  grunt.loadNpmTasks('grunt-append-sourcemapping');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html');
  grunt.loadNpmTasks('grunt-closure-linter');
  grunt.loadNpmTasks('grunt-simple-mocha');
  //grunt.loadNpmTasks('grunt-contrib-jade');

grunt.task.renameTask('watch', 'doWatch')

  grunt.registerTask('deploy', ['concat', 'less:production', 'less:development', 'closureBuilder:debug', 'closureBuilder:release', 'append-sourcemapping']);
  grunt.registerTask('debugDeploy', ['concat', 'less:development', 'closureBuilder:debug', 'append-sourcemapping']);
  grunt.registerTask('check', ['htmllint', 'csslint:lax', 'closureLint']);
  grunt.registerTask('test', ['check', 'deploy', 'simplemocha']);
  grunt.registerTask('fix', ['closureFixStyle']);

  grunt.registerTask('default', ['check', 'deploy']);

  grunt.registerTask('watch', 'Start Silex', function () {
    grunt.task.run([
        'run',
        'doWatch'
    ]);
  });
  grunt.registerTask('run', 'Start Silex', function () {
      var server = require('./server/api-server.js');
      console.log('Start Silex', server);
  });

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
    , csslint: {
      lax: {
        src: ['src/css/*.css']
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
    , concat: {
      dist: {
        src: ['src/css/*.css']
        , dest: 'src/css/.temp'
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
          "bin/css/admin.min.css": "src/css/.temp"
        }
      }
      , production: {
        files: {
          "bin/css/admin.css": "src/css/.temp"
        }
      }
    }
    , closureBuilder: {
      release: {
        options: {
          closureLibraryPath: 'submodules/closure-library'
          , namespaces: ['silex.boot']
          , builder: 'submodules/closure-library/closure/bin/build/closurebuilder.py'
          , compilerFile: 'build/closure-compiler.jar'
          , compile: true
          , compilerOpts: {
            compilation_level: 'SIMPLE_OPTIMIZATIONS'
            , warning_level: 'QUIET'
            , externs: 'submodules/cloud-explorer/lib/app/js/cloud-explorer.js'
            , debug: false
            , create_source_map: 'bin/js/admin.min.js.map'
            , source_map_format: 'V3'
          }
        }
        , src: ['src/js/', 'submodules/closure-library/']
        , dest: 'bin/js/admin.min.js'
      }
      , debug: {
        options: {
          closureLibraryPath: 'submodules/closure-library'
          , namespaces: 'silex.boot'
          , builder: 'submodules/closure-library/closure/bin/build/closurebuilder.py'
          , compilerFile: 'build/closure-compiler.jar'
          , compile: true // disable if needed?
          , compilerOpts: {
            compilation_level: 'SIMPLE_OPTIMIZATIONS'
            , externs: 'submodules/cloud-explorer/lib/app/js/cloud-explorer.js'
            , formatting: 'PRETTY_PRINT'
            , debug: true
//            , use_closure_library: true // disable if compiled
            , create_source_map: 'bin/js/admin.js.map'
            , source_map_format: 'V3'
          }
        }
        , src: ['submodules/closure-library/', 'src/js/']
        , dest: 'bin/js/admin.js'
      }
    }
    , "append-sourcemapping": {
        main: {
            files: {
                "bin/js/admin.js": "admin.js.map"
            }
        }
    }
    , doWatch: {
        options: {
          livereload: true
          , atBegin: true
        }
        , all: {
            files: ['src/js/**/*.js', 'server/**/*.js', 'src/css/*.css', 'src/css/*.less', 'src/html/*.jade', 'bin/**/*.html', 'Gruntfile.js']
            , tasks: ['debugDeploy', 'run']
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
}