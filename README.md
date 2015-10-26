[![version](https://img.shields.io/npm/v/dicoogle-client.svg)](https://www.npmjs.org/package/dicoogle-client)

# dicoogle-client

This is a web service client API to [Dicoogle](http://www.dicoogle.com), the open-source PACS archive, for use in JavaScript applications.
This library is compatible with browser-based JavaScript and Node.js. A CLI application for searching medical images in Dicoogle is also included (`dicoogle-query`).

## Using the CLI client

Install this package globally (`npm install -g dicoogle-client`), then run `dicoogle-query --help` for usage instructions.

## Using the JavaScript API

In Node.js and Browserify, install "dicoogle-client" with `npm` and `require` the "dicoogle-client" module.

```JavaScript
var DicoogleClient = require("dicoogle-client");
```

When not using Browserify, simply include the "dist/dicoogle-client.min.js" file as a script, thus exposing `DicoogleClient`.

```HTML
<script src='./dist/dicoogle-client.min.js'></script>
```

Afterwards, invoke the `DicoogleClient` module with the Dicoogle server's endpoint to obtain an access object. The object may then be used multiple times.

```JavaScript
var Dicoogle = DicoogleClient("localhost:8080");

...

Dicoogle.search("(PatientName:Pinho^Eduardo)", function(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  // use result
});
```

The repository includes two examples of dicoogle-client for simple querying:

 - "dicoogle-query-cli.js" is a complete stand-alone Node.js application for querying Dicoogle. This is the source code of the `dicoogle-query` application.
 - "app.html" is a web page demonstrating simple querying.

## Further Notice

This library is compatible with versions 2.0.X of Dicoogle. This client wrapper can be updated as new services emerge.

## License

Copyright (C) 2015  Universidade de Aveiro, DETI/IEETA, Bioinformatics Group - http://bioinformatics.ua.pt/

This software is part of Dicoogle.

Dicoogle/dicoogle-client is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Dicoogle/dicoogle-client is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Dicoogle.  If not, see <http://www.gnu.org/licenses/>.

