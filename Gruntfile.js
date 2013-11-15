/*

Inspired by https://gist.github.com/madr/7356170

Uses:

  $ grunt deploy
  $ grunt test
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

  var srcFiles = [];
/*
  grunt.file.recurse('src/js', function (abspath, rootdir, subdir, filename) {
    console.log(abspath, rootdir, subdir, filename);
    srcFiles.push(abspath);
  });
  grunt.file.recurse('build/closure-library/closure/', function (abspath, rootdir, subdir, filename) {
    console.log(abspath, rootdir, subdir, filename);
    srcFiles.push(abspath);
  });
  grunt.file.recurse('build/closure-library/third_party/closure/goog/mochikit/async/', function (abspath, rootdir, subdir, filename) {
    console.log(abspath, rootdir, subdir, filename);
    srcFiles.push(abspath);
  });
*/
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    csslint: {
      strict: {
        src: ['src/less/*.css']
      }
    },
    compress: {
      main: {
        options: {
          mode: 'gzip'
        },
        files: [
          {
            expand: true,
            src: ['bin/js/admin.min.js'],
            dest: '',
            ext: '.min.zipped.js'
          },
          {
            expand: true,
            src: ['bin/css/admin.min.css'],
            dest: '',
            ext: '.min.zipped.css'
          }
        ]
      }
    },
    concat: {
/*
      dist: {
        src: ['src/js/model/*.js', 'src/js/view/*.js', 'src/js/view/properties-tool/*.js', 'src/js/service/*.js', 'src/js/*.js'],
        dest: 'bin/js/admin.js',
      },
*/
      dist: {
        src: ['src/less/*.css'],
        dest: 'src/less/temp.less',
      },
    },
    htmllint: {
        all: ["bin/*.html"]
    },
    jslint: { 
      client: {
        src: [
          'src/js/*/*.js',
          'src/js/*.js'
        ],
        exclude: [],
      }
    },
    less: {
      development: {
        files: {
          "bin/css/admin.css": "src/less/temp.less"
        }
      },
      production: {
        options: {
          cleancss: true
        },
        files: {
          "bin/css/admin.min.css": "src/less/temp.less"
        }
      }
    },
    closureBuilder: {
      release: {
        options: {
          closureLibraryPath: 'build/closure-library/'
          //, inputs: 'src/js/boot.js'
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
        //, src: ['build/closure-library/closure/**/*.js', 'build/closure-library/third_party/closure/goog/mochikit/async/*.js', 'src/**/*.js']
        , src: ['build/closure-library/', 'src/js/']
        , dest: 'bin/js/admin.min.js'
      },
      debug: {
        options: {
          closureLibraryPath: 'build/closure-library/'
          //, inputs: 'src/js/boot.js'
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
        //, src: ['build/closure-library/closure/**/*.js', 'build/closure-library/third_party/closure/goog/mochikit/async/*.js', 'src/**/*.js']
        , src: ['build/closure-library/', 'src/js/']
        , dest: 'bin/js/admin.js'
      },
    },
    watch: {
        javascript: {
            files: ['src/js/**/*.js', 'src/less/*.css']
            , tasks: ['deploy', 'test']
        }
        , livereload: {
            files: ['Gruntfile.js', 'bin/js/*.js', 'bin/css/*.css', 'bin/assets/**/*.{png,jpg,jpeg,gif,webp,svg}', 'js/*.js', ]
            , options: {
                livereload: true
            }
        }
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
  
  grunt.registerTask('deploy', ['concat', 'less:production', 'less:development', 'closureBuilder:debug', 'closureBuilder:release', 'compress']);
  grunt.registerTask('test', ['htmllint', 'csslint', 'jslint']);  grunt.registerTask('default', ['test', 'deploy', 'watch']);
}