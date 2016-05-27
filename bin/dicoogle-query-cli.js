#!/usr/bin/env node
/*eslint-env node*/
/*eslint-disable no-console */

/** Dicoogle query request application in Node.js
 *
 * Usage:
 * dicoogle-query [-k] [-s server_location] [-p provider_name]* QUERY
 *
 * @author Eduardo Pinho (eduardopinho@ua.pt)
 */
var dicoogleClient = require("../lib");
var util = require('util');
var server = "http://localhost:8080";
var query;
var keyword = undefined;
var debug = false;
var forceTTY = false;
var providers = [];

var USER = process.env.DICOOGLE_USER;
var PASSWORD = process.env.DICOOGLE_PASSWORD;

for (var i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--help' || process.argv[i] === '-h') {
    console.log("Usage: dicoogle-query [OPTIONS] QUERY");
    console.log("Description: search for images in Dicoogle using text queries\n");
    console.log("Options:");
    console.log("  -h, --help            : show this help");
    console.log("  -k, --keyword         : forcefully perform a keyword-based query");
    console.log("  -F, --free-text       : forcefully perform a free text query");
    console.log("  -T, --tty             : force terminal (TTY) output instead of minified JSON");
    console.log("  -p, --provider <name> : include this query provider");
    console.log("  -s, --server <url>    : set the Dicoogle server's base endpoint");
    console.log("  -D, --debug           : output additional details");
    console.log("Environment variables:");
    console.log("  DICOOGLE_USER         : the client's user name");
    console.log("  DICOOGLE_PASSWORD     : the user's password for authentication");
    process.exit(0);
  } else if (process.argv[i] === '--keyword' || process.argv[i] === '-k') {
    keyword = true;
  } else if (process.argv[i] === '--free-text' || process.argv[i] === '-F') {
    keyword = false;
  } else if (process.argv[i] === '--tty' || process.argv[i] === '-T') {
    forceTTY = true;
  } else if (process.argv[i] === '--debug' || process.argv[i] === '-D') {
    debug = true;
  } else if (process.argv[i] === '--provider' || process.argv[i] === '-p') {
    providers.push(process.argv[++i]);
  } else if (process.argv[i] == '--server' || process.argv[i] === '-s') {
    server = process.argv[++i];
  } else {
    query = process.argv[i];
  }
}

if (!query) {
  console.log("Usage: dicoogle-query [OPTIONS] QUERY");
  console.log("Run 'dicoogle-query --help' for more details");
  process.exit(-1);
}

if (debug) {
  console.error('Dicoogle Base Endpoint: ', server);
  if (USER) {
    console.error('Logging in as ' + USER + ' ...');
  }
}

process.stdout.on('error', function() {
  // ignore problem, the user must have just closed the consumer
});

var Dicoogle = dicoogleClient(server);

if (USER && PASSWORD) {
  Dicoogle.login(USER, PASSWORD, function(err, out) {
    if (err) {
        console.error('Failed to log in:', err);
        return;
    }
    if (debug) {
      console.error('Logged in as ' + out.user + (out.admin ? ' (admin)' : ''));
      console.error('Session token:', out.token);
      console.error('Roles:', out.roles);
    }
    doSearch();
  });
} else {
  doSearch();
}

function doSearch() {
  if (debug) {
    console.error('Sending query: ', query);
  }
  Dicoogle.search(query, { keyword: keyword, providers: providers },
    function (error, outcome) {
      if (error) {
        console.error(error);
      } else {
        var result = outcome.results || [];
        if (process.stdout.isTTY || forceTTY) {
          console.log(util.inspect(result, {colors: true, depth: 2}));
        } else {
          console.log(JSON.stringify(result));
        }
      }
    });
}
