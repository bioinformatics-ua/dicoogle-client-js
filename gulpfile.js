'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var eslint = require('gulp-eslint');
var rm = require('gulp-rm');
var babel = require('gulp-babel');
var header = require('gulp-header');
var fs = require('fs');

var _licenseText = null;
function licenseText() {
  if (!_licenseText) {
    _licenseText = fs.readFileSync('license-header.txt', 'UTF-8');
  }
  return _licenseText;
}

gulp.task('lint:bin', function () {
  return gulp.src('bin/*.js')
    .pipe(eslint({
      configFile: ".eslintrc.node"
    }))
    .pipe(eslint.format());
});

gulp.task('lint:browser', function () {
  return gulp.src('src/servicerequest-browser.js')
    .pipe(eslint({
      configFile: ".eslintrc.browser"
    }))
    .pipe(eslint.format());
});

gulp.task('lint:node', function () {
  return gulp.src('src/servicerequest.js')
    .pipe(eslint({
      configFile: ".eslintrc.node"
    }))
    .pipe(eslint.format());
});

gulp.task('lint', ['lint:browser', 'lint:node', 'lint:bin'], function () {
  return gulp.src('src/dicoogle-client.js')
    .pipe(eslint({
      configFile: ".eslintrc"
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('main', ['lint'], function () {
  return gulp.src('src/*.js')
    .pipe(babel({ presets: ['es2015'], plugins: ['add-module-exports'] }))
    .pipe(header(licenseText()))
    .pipe(gulp.dest('lib'));
});

gulp.task('bundle', ['lint', 'main'], function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './lib/dicoogle-client.js',
    debug: false
  });

  return b.bundle()
    .pipe(source('dicoogle-client.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(header(licenseText()))
    .pipe(gulp.dest('dist'));
});

gulp.task( 'clean', function() {
  return gulp.src(['dist/*', 'lib/*'], { read: false })
    .pipe( rm() );
});

gulp.task('default', ['main', 'bundle']);
