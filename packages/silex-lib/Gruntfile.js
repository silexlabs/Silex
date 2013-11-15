/*

Inspired by https://gist.github.com/madr/7356170

Uses:

* check syntax with *lint

  $ grunt check

* check syntax with *lint, compile with google closure builder/compiler

  $ grunt deploy

* check syntax with *lint, compile with google closure builder/compiler, execute functional tests

  $ grunt test

* watch and deploy when needed

  $ grunt watch



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
      strict: {
        src: ['src/less/*.css']
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
        , dest: 'src/less/temp.less'
      }
    }
    , htmllint: {
        all: ["bin/*.html"]
    }
    , jslint: { 
      client: {
        src: [
          'src/js/*/*.js'
          , 'src/js/*.js'
        ]
        , exclude: []
      }
    }
    , less: {
      development: {
        files: {
          "bin/css/admin.css": "src/less/temp.less"
        }
      }
      , production: {
        options: {
          cleancss: true
        }
        , files: {
          "bin/css/admin.min.css": "src/less/temp.less"
        }
      }
    }
    , closureBuilder: {
      release: {
        options: {
          closureLibraryPath: 'build/closure-library/'
          , namespaces: 'silex.boot'
          , builder: 'build/closure-library/closure/bin/build/closurebuilder.py'
          , compilerFile: 'build/closure-compiler.jar'
          , output_mode: ''
          , compile: true
          , compilerOpts: {
            compilation_level: 'ADVANCED_OPTIMIZATIONS'
            , warning_level: 'QUIET'
            , externs: 'cloud-explorer/lib/app/js/cloud-explorer.js'
            , debug: false
            , use_closure_library: true
          }
        }
        , src: ['build/closure-library/', 'src/js/']
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
            files: ['src/js/**/*.js', 'src/less/*.css', 'bin/**/*.html']
            , tasks: [/*'check', */'deploy']
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
          , timeout: 3000
          , ignoreLeaks: false
          , grep: '*-test'
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
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-simple-mocha');

  grunt.registerTask('deploy', ['concat', 'less:production', 'less:development', 'closureBuilder:debug', 'closureBuilder:release', 'compress']);
  grunt.registerTask('check', ['htmllint', 'csslint', 'jslint']);
  grunt.registerTask('test', [/*'check', */'deploy', 'simplemocha']);
  
  grunt.registerTask('default', ['check', 'deploy', 'watch']);
}