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
const fs = require("fs");
const gulp = require("gulp");
const header = require("gulp-header");
const source = require("vinyl-source-stream");
const sourcemaps = require("gulp-sourcemaps");
const terser = require("gulp-terser");

var _licenseText = null;
function licenseText() {
  if (!_licenseText) {
    _licenseText = fs.readFileSync("license-header.txt", "UTF-8");
  }
  return _licenseText;
}

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
    ],
    standalone: 'DicoogleClient'
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
