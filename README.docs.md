[![npm version](https://badge.fury.io/js/dicoogle-client.svg)](https://badge.fury.io/js/dicoogle-client)

`dicoogle-client` is a client API to the web services provided by [Dicoogle](https://www.dicoogle.com), the open-source PACS archive, for use in JavaScript applications.

This library is compatible with Dicoogle versions 2 and 3.

## Top-level API

Documentation was built from our TypeScript definitions, and should be automatically considered by the TypeScript compiler (version 5+).

- [`dicoogleClient`] is a function for retrieving a Dicoogle access object.
- [`DicoogleAccess`] is a singleton comprising all methods for interacting with the Dicoogle instance. Enter the [`DicoogleAccess`] documentation page for a list of all methods and namespaces within.

[`dicoogleClient`]: functions/dicoogleClient.html
[`DicoogleAccess`]: classes/DicoogleAccess.html

## Installing

### Node.js

Install `dicoogle-client` with `npm` and
import the _default_ export or the named export `dicoogleClient`.
This works both in JavaScript and in TypeScript.

```javascript
import dicoogleClient from 'dicoogle-client';
```

When not using ECMAScript modules (e.g. using CommonJS),
use `require` to fetch the `default` or `dicoogleClient` export.

```javascript
const { dicoogleClient } = require('dicoogle-client');
```

### On a Browser with Bundling

Install and use `dicoogle-client` like in Node.js.
The library includes a few uses of `process.env.NODE_ENV`,
which will need to be replaced in a browser environment.
See an example of this using webpack [here](https://webpack.js.org/plugins/environment-plugin/#root).

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

 - "bin/dicoogle-query-cli.js" is a complete stand-alone Node.js application for querying Dicoogle.
  This is the source code of the `dicoogle-query` executable.
