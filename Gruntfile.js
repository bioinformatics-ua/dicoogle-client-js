module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      gruntfile: ['Gruntfile.js'],
      browser: {
        src: ['dicoogle-client.js', 'servicerequest-browser.js'],
        options: {
          configFile: '.eslintrc.browser'
        }
      },
      node: {
        src: ['dicoogle-client.js', 'dicoogle-query-cli.js', 'servicerequest.js'],
        options: {
          configFile: '.eslintrc.node'
        }
      }
    },
    browserify: {
      standalone: {
        src: [ './<%= pkg.name %>.js' ],
        dest: './build/<%= pkg.name %>.js',
        options: {
          browserifyOptions: {
            standalone: 'DicoogleClient'
          }
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= grunt.file.read("license-header.txt") %>'
      },
      minimize: {
        options: {
          compress: true,
          preserveComments: false,
          mangle: true
        },
        src: './build/<%= pkg.name %>.js',
        dest: './dist/<%= pkg.name %>.min.js'
      }
    }
  });

  // Load plugin tasks.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-eslint');
  
  // Default task(s).
  grunt.registerTask('default', [
    'eslint',
    'browserify',
    'uglify:minimize']);

};
