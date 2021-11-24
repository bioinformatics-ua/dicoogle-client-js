[![npm version](https://badge.fury.io/js/dicoogle-client.svg)](https://badge.fury.io/js/dicoogle-client) [![Build Status](https://travis-ci.org/bioinformatics-ua/dicoogle-client-js.svg?branch=master)](https://travis-ci.org/bioinformatics-ua/dicoogle-client-js) [![Coverage Status](https://coveralls.io/repos/github/bioinformatics-ua/dicoogle-client-js/badge.svg?branch=master)](https://coveralls.io/github/bioinformatics-ua/dicoogle-client-js?branch=master)

# Dicoogle Client

This is a web service client API to [Dicoogle](http://www.dicoogle.com), the open-source PACS archive, for use in JavaScript applications.
This library is compatible with browser-based JavaScript and Node.js. A CLI application for searching medical images in Dicoogle is also included (`dicoogle-query`).

## Using the JavaScript API

The full API is documented [here](https://bioinformatics-ua.github.io/dicoogle-client-js).
Documentation was built from our Typescript definitions, which are also available.

### Quick Start

```javascript
const DicoogleClient = require("dicoogle-client");

// obtain a dicoogle access object
const Dicoogle = DicoogleClient("localhost:8080");

// if required, login to the system before using
Dicoogle.login('admin', 'mysecretpassword', function(error, outcome) {
  if (error) {
    console.error(error);
    return;
  }

  // Ok! Start using Dicoogle!
  Dicoogle.search("PatientName:Pinho^Eduardo", {provider: 'lucene'}, (error, outcome) => {
    if (error) {
      console.error(error);
      return;
    }
    // use outcome
    const {elapsedTime, results} = outcome;
    // ...
  });
});
```

## Using the CLI client

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

## Further Notice

This library is compatible with versions of Dicoogle in the range `>=2.0.0 <3.1.0`, and may be updated as future versions of Dicoogle are released.

## License

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

