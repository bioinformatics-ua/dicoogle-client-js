/*
 * Copyright (C) 2017  Universidade de Aveiro, DETI/IEETA, Bioinformatics Group - http://bioinformatics.ua.pt/
 *
 * This file is part of Dicoogle/dicoogle-client-js.
 *
 * Dicoogle/dicoogle-client-js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Dicoogle/dicoogle-client-js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Dicoogle.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const browserify = require("browserify");
const buffer = require("vinyl-buffer");
const eslint = require("gulp-eslint");
const fs = require("fs");
const gulp = require("gulp");
const header = require("gulp-header");
const rm = require("gulp-rm");
const source = require("vinyl-source-stream");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const terser = require("gulp-terser");

var _licenseText = null;
function licenseText() {
  if (!_licenseText) {
    _licenseText = fs.readFileSync("license-header.txt", "UTF-8");
  }
  return _licenseText;
}

function lint() {
  return gulp
    .src(["src/*.js", "test/*.js", "test/mock/*.js", "bin/*.js"])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}
exports.lint = lint;

function main() {
  return tsProject
    .src()
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(tsProject())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("lib"));
}
exports.main = main;

function bundle() {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: "./lib/index.js",
    debug: false,
    transform: [
      [
        "envify",
        {
          _: "purge",
          NODE_ENV: "production"
        }
      ]
    ]
  });
  return b
    .bundle()
    .pipe(source("dicoogle-client.min.js"))
    .pipe(buffer())
    .pipe(terser())
    .pipe(header(licenseText()))
    .pipe(gulp.dest("dist"));
}
exports.bundle = bundle;

function clean() {
  return gulp.src(["dist/*", "lib/*", "coverage/**", ".nyc_output/**", "docs/**"], { read: false }).pipe(rm());
}
exports.clean = clean;

exports.default = gulp.series(lint, main);
gulp.task("default", exports.default);
