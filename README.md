[![npm version](https://badge.fury.io/js/dicoogle-client.svg)](https://badge.fury.io/js/dicoogle-client) [![Build Status](https://travis-ci.org/bioinformatics-ua/dicoogle-client-js.svg?branch=master)](https://travis-ci.org/bioinformatics-ua/dicoogle-client-js)

# dicoogle-client

This is a web service client API to [Dicoogle](http://www.dicoogle.com), the open-source PACS archive, for use in JavaScript applications.
This library is compatible with browser-based JavaScript and Node.js. A CLI application for searching medical images in Dicoogle is also included (`dicoogle-query`).

### Using the JavaScript API

In Node.js and Browserify, install "dicoogle-client" with `npm` and `require` the "dicoogle-client" module.

```JavaScript
var DicoogleClient = require("dicoogle-client");
```

When not using Browserify, simply include the "dist/dicoogle-client.min.js" file as a script, thus exposing `DicoogleClient`.

```HTML
<script src='/path/to/my/libs/dicoogle-client.min.js'></script>
```

Afterwards, invoke the `DicoogleClient` module with the Dicoogle server's endpoint to obtain an access object. The object is a singleton that can be used multiple times.
Calling the module function again will change the Dicoogle base URL of that object, or retain the address if no argument is passed.

```JavaScript
var Dicoogle = DicoogleClient("localhost:8080", {
  user: 'dicoogle',
  password: 'd1c00g1e'
});

...

Dicoogle.search("(PatientName:Pinho^Eduardo)", 'lucene', function(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  // use result
});
```

At the moment, the documentation of the API can be read directly in the src/dicoogle-client.js source file's documented functions.
A clearer documentation may become available in the future.

The repository includes two examples of dicoogle-client for simple querying:

 - "bin/dicoogle-query-cli.js" is a complete stand-alone Node.js application for querying Dicoogle. This is the source code of the `dicoogle-query` executable.
 - "example/app.html" is a web page demonstrating simple querying.

### Using the CLI client

Install this package globally (`npm install -g dicoogle-client`), then use `dicoogle-query`.

**Usage:** `dicoogle-query [OPTIONS] QUERY`

**Options:**

 - `-h`, `--help` : show this help
 - `-k`, `--keyword` : forcefully perform a keyword-based query
 - `-F`, `--free-text` : forcefully perform a free text query
 - `-T`, `--tty` : force terminal (TTY) output instead of minified JSON
 - `-p`, `--provider <name>` : include this query provider
 - `-s`, `--server <url>` : set the Dicoogle server's base endpoint
 - `-D`, `--debug` : output additional information

**Environment variables:**

 - `DICOOGLE_USERNAME` : The client's unique user name.
 - `DICOOGLE_PASSWORD` : The user's password.

**Example:** `dicoogle-query -p lucene -s "http://demo.dicoogle.com" "Modality:MR"`

### Further Notice

This library is compatible with versions of Dicoogle in the range `>=2.0.0 <2.4.0`. This client wrapper can be updated as new services emerge.

### License

Copyright (C) 2016  Universidade de Aveiro, DETI/IEETA, Bioinformatics Group - http://bioinformatics.ua.pt/

This software is part of Dicoogle.

Dicoogle/dicoogle-client-js is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Dicoogle/dicoogle-client-js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Dicoogle.  If not, see <http://www.gnu.org/licenses/>.

