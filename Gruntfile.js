module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  var cfg = {
    app: 'frontend',
    build: 'build',
    dist: 'dist'
  };

  grunt.initConfig({
    cvars: cfg,
    bower: {
      setup: {
        options: {
          install: true,
          copy: false
        }
      }
    },
    clean: {
      options: {
        force: true
      },
      build: ['<%= cvars.build %>'],
      dist: ['<%= cvars.dist %>']
    },
    copy: {
      setup: {
        files: [{
          cwd: 'bower_components',
          expand: true,
          flatten: true,
          dest: '<%= cvars.app %>/vendor/scripts/',
          src: [
            'angular/angular.js',
            'angular-animate/angular-animate.js',
            'angular-aria/angular-aria.js',
            'angular-material/angular-material.js',
            'requirejs/requirejs.js'
          ]
        }, {
          cwd: 'bower_components',
          expand: true,
          flatten: true,
          dest: '<%= cvars.app %>/vendor/styles/',
          src: [
            'angular-material/angular-material.css',
            'roboto-fontface/css/roboto-fontface.css'
          ]
        }, {
          cwd: 'bower_components',
          expand: true,
          flatten: true,
          dest: '<%= cvars.app %>/vendor/fonts/',
          src: [
            'roboto-fontface/fonts/Roboto*.woff2'
          ]
        }]
      },
      build: {
        files: [{
          cwd: './',
          expand: true,
          dest: '<%= cvars.build %>/',
          src: [
            'package.json',
            'LICENSE',
            'README.md',
            'backend/**',
            'frontend/**'
          ]
        }]
      }
    },

    electron: {
      dist: {
        options: {
          platform: 'all',
          arch: 'all',
          version: '0.30.2',
          name: 'WordpressDesktopBackup',
          dir: '<%= cvars.build %>',
          out: '<%= cvars.dist %>'
        }
      }
    }
  });

  grunt.registerTask('setup', [
    'bower:setup',
    'copy:setup'
  ]);

  grunt.registerTask('npmInstall', 'Run npm install with production flag',
    function() {
      var exec = require('child_process').exec;
      var cb = this.async();
      exec('npm install --production', {
        cwd: cfg.build
      }, function(err, stdout, stderr) {
        console.log(err, stdout, stderr);
        cb();
      });
    });

  grunt.registerTask('build', [
    'clean:build',
    'copy:build',
    'npmInstall'
  ]);

  grunt.registerTask('dist', [
    'clean:dist',
    'build',
    'electron:dist'
  ]);
};
