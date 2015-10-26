#!/usr/bin/env node
/** Dicoogle query request application in Node.js
 *
 * Usage:
 * dicoogle-query [-k] [-s server_location] [-p provider_name]* QUERY
 *
 * @author Eduardo Pinho (eduardopinho@ua.pt)
 */
var dicoogleClient = require("./dicoogle-client");
var server = "localhost:8080";
var query;
var keyword = false;
var debug = false;
var forceTTY = false;
var providers = [];

for (var i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--help' || process.argv[i] === '-h') {
    console.log("Usage: dicoogle-query [OPTIONS] QUERY\n");
    console.log("Options:");
    console.log("  -k, --keyword         : perform a keyword-based query");
    console.log("  -T, --tty             : force terminal (TTY) output instead of minified JSON");
    console.log("  -p, --provider <name> : include this query provider");
    console.log("  -s, --server <url>    : set the Dicoogle server's base endpoint");
    console.log("  -D, --debug           : output additional details");
    process.exit(0);
  } else if (process.argv[i] === '--keyword' || process.argv[i] === '-k') {
    keyword = true;
  } else if (process.argv[i] === '--tty' || process.argv[i] === '-T') {
    keyword = true;
  } else if (process.argv[i] === '--debug' || process.argv[i] === '-D') {
    debug = true;
  } else if (process.argv[i] === '--provider' || process.argv[i] === '-p') {
    providers.push(process.argv[++i]);
  } else if (process.argv[i] == '--server', process.argv[i] === '-s') {
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
  console.log('Service Endpoint: ', server + '/search');
  console.log('Sending query: ', query);
}

process.stdout.on('error', function(error) {
  // ignore problem, the user must have just closed the consumer
  console.error(error);
});

var Dicoogle = dicoogleClient(server);
Dicoogle.search(query, { keyword: keyword, providers: providers }, 
  function (error, result) {
    if (error) {
      console.error(error);
    } else {
      if (process.stdout.isTTY || forceTTY) {
        console.log(result);
      } else {
        console.log(JSON.stringify(result));
      }
    }
  });
