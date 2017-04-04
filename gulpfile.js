'use strict';

const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const coveralls = require('gulp-coveralls');
const eslint = require('gulp-eslint');
const fs = require('fs');
const gulp = require('gulp');
const header = require('gulp-header');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
const rm = require('gulp-rm');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const tsProject = ts.createProject("tsconfig.json");
const uglify = require('gulp-uglify');

var _licenseText = null;
function licenseText() {
  if (!_licenseText) {
    _licenseText = fs.readFileSync('license-header.txt', 'UTF-8');
  }
  return _licenseText;
}

gulp.task('lint', function () {
  return gulp.src(['src/*.js', 'test/*.js', 'test/mock/*.js', 'bin/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('main', ['lint'], function () {
   return tsProject.src()
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(tsProject())
        .pipe(sourcemaps.write('./'))        
        .pipe(gulp.dest("lib"));
});

gulp.task('bundle', ['lint', 'main'], function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './lib/index.js',
    debug: false,
    transform: [
        ['envify', {
            _: 'purge',
            NODE_ENV: 'production'
        }]
    ]
  });

  return b.bundle()
    .pipe(source('dicoogle-client.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(header(licenseText()))
    .pipe(gulp.dest('dist'));
});

gulp.task('test', ['main'], () => {
    return gulp
        .src([
            'test/**/test-*.js'
        ])
        .pipe(mocha({
            bail: true,
            timeout: 50000
        }));
});

gulp.task('pre-cover', ['main'], () => {
    return gulp.src(['lib/**/*.js'])
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire());
});

gulp.task('cover', ['pre-cover'], function () {
    return gulp.src(['test/**/test-*.js'])
        .pipe(mocha({
            bail: true,
            timeout: 50000
        }))
        // Creating the reports after tests ran
        .pipe(istanbul.writeReports({
            reporters: [ 'json' ]
        }))
        .pipe(istanbul.enforceThresholds({
          thresholds: {
            global: {
              statements: 80,
              lines: 70,
              functions: -10
            }
          }
        })).on('end', remapCoverageFiles);
});

gulp.task('coveralls', [], () => {
    return gulp.src('coverage/lcov.info')
        .pipe(coveralls());
});

function remapCoverageFiles() {
    return gulp.src('./coverage/coverage-final.json')
      .pipe(remapIstanbul({
          basePath: 'src',
          reports: {
              //'html': './coverage/lcov-report',
              'text': null,
              'text-summary': null,
              'lcovonly': './coverage/lcov.info'
          },
          fail: true
      }))
      .pipe(gulp.dest('./coverage'));
}

gulp.task('clean', function() {
  return gulp.src(['dist/*', 'lib/*'], { read: false })
    .pipe( rm() );
});

gulp.task('default', ['main', 'bundle']);
