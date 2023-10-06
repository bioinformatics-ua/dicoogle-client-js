[![npm version](https://badge.fury.io/js/dicoogle-client.svg)](https://badge.fury.io/js/dicoogle-client)

`dicoogle-client` is a client API to the web services provided by [Dicoogle](https://www.dicoogle.com), the open-source PACS archive, for use in JavaScript applications.

This library is compatible with Dicoogle versions 2 and 3.

## Top-level API

Documentation was built from our TypeScript definitions, and should be automatically considered by the TypeScript compiler (version 4+).

- [`dicoogleClient`] is a function for retrieving a Dicoogle access object.
- [`DicoogleAccess`] is a singleton comprising all methods for interacting with the Dicoogle instance. Enter the [`DicoogleAccess`] documentation page for a list of all methods and namespaces within.

[`dicoogleClient`]: functions/dicoogleClient.html
[`DicoogleAccess`]: classes/DicoogleAccess.html

## Installing

### Node.js or Browser with bundling

Install "dicoogle-client" with `npm` and
import the _default_ export or the named export `dicoogleClient`
from the _"dicoogle-client"_ module.
This works both in JavaScript and in TypeScript.

```javascript
import dicoogleClient from 'dicoogle-client';
```

When not using ECMAScript modules (CommonJS environment),
you need to use an interoperability layer such as [Babel](https://babeljs.io).
Otherwise, the module can be imported manually:

```javascript
import('dicoogle-client')
  .then(m => {
    const dicoogleClient = m.default;
  });
```

### On the browser, no module system

When _not_ using Node.js or any bundling system,
you can build the distributable bundle by running:

```sh
npm run build
```

Then include the "dist/dicoogle-client.min.js" file as a script,
thus exposing the `DicoogleClient` module as a global variable.

```html
<script src='path/to/my/libs/dicoogle-client.min.js'></script>
```

## Basic Usage

Once `dicoogleClient` is fetched, invoke it as a function with the Dicoogle server's endpoint to obtain an access object. The object is a singleton that can be used multiple times.
Calling the module function again will change the Dicoogle base URL of that object, or retain the address if no argument is passed.

This object provides a Promise-based API.
You can write the following code inside an async function:

```javascript
const dicoogle = dicoogleClient("localhost:8080");

// if required, login to the system before using
await dicoogle.login('admin', 'mysecretpassword');

// Ok! Start using Dicoogle!
let {elapsedTime, results} = await dicoogle.search("PatientName:Pinho^Eduardo", {provider: 'lucene'});

// use outcome
const {elapsedTime, results} = outcome;
for (const r of result) {
  console.log(`> ${r.uri}`);
}
```

Alternatively, the same methods work when passing a callback as the last parameter.

```javascript
const dicoogle = dicoogleClient("localhost:8080");

// if required, login to the system before using
dicoogle.login('admin', 'mysecretpassword', function(error, outcome) {
  if (error) {
    console.error(error);
    return;
  }

  // Ok! Start using Dicoogle!
  dicoogle.search("PatientName:Pinho^Eduardo", {provider: 'lucene'}, (error, outcome) => {
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
