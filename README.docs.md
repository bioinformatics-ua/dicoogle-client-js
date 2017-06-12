[![npm version](https://badge.fury.io/js/dicoogle-client.svg)](https://badge.fury.io/js/dicoogle-client)

`dicoogle-client` is a client API to the web services provided by [Dicoogle](http://www.dicoogle.com), the open-source PACS archive, for use in JavaScript applications.

## Top-level API

Documentation was built from our TypeScript definitions, and should be automatically considered by the TypeScript compiler (version 2+).

- [`DicoogleClient`](modules/_types_index_d.dicoogleclient.html) is a function for retrieving a Dicoogle access object.
- [`DicoogleAccess`](interfaces/_types_index_d_.dicoogleclient.dicoogleaccess.html) is a singleton comprising all methods for interacting with the Dicoogle instance. Enter the [`DicoogleAccess`](interfaces/_types_index_d_.dicoogleclient.dicoogleaccess.html) documentation page for a list of all methods and namespaces within.

## Installing

### In Node.js or CommonJS

In Node.js, or when using a CommonJS compatible bundler (such as Browserify or webpack), install "dicoogle-client" with `npm` and `require` the "dicoogle-client" module.

```javascript
const DicoogleClient = require('dicoogle-client');
```

When using TypeScript:

```typescript
import DicoogleClient = require('dicoogle-client');
```

### On the browser, no module system

When _not_ using Node.js or a bundler, simply include the "dist/dicoogle-client.min.js" file as a script, thus exposing `DicoogleClient` as a global.

```HTML
<script src='/path/to/my/libs/dicoogle-client.min.js'></script>
```

### In ES2015

This is a CommonJS module, and not compatible with ES2015 modules.
When using ES2015 modules or TypeScript with ES2015, you should import the default function using `require`, or include an interoperable require mechanism, such as using [Babel](https://babeljs.io/).

## Basic Usage

Once `DicoogleClient` is fetched, invoke it as a function with the Dicoogle server's endpoint to obtain an access object. The object is a singleton that can be used multiple times.
Calling the module function again will change the Dicoogle base URL of that object, or retain the address if no argument is passed.

```JavaScript
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

## Examples

The repository includes two examples of dicoogle-client for simple querying:

 - "bin/dicoogle-query-cli.js" is a complete stand-alone Node.js application for querying Dicoogle. This is the source code of the `dicoogle-query` executable.
 - "example/app.html" is a web page demonstrating simple querying.
