
var URL = require('url');
var http = require('http');
var https = require('https');

function makeUrl(uri, qs) {
  // create full query string
  let end_url;
  if (Array.isArray(uri)) {
    end_url = uri.join('/');
  } else {
    end_url = uri;
  }

  let qstring;
  if (!qs) {
    qstring = '';
  } if (typeof qs === 'string') {
    qstring = '?' + qs;
  } else {
    var qparams = [];
    for (let pname in qs) {
      if (Array.isArray(qs[pname])) {
        for (let j = 0; j < qs[pname].length; j++) {
          qparams.push(pname + '=' + encodeURIComponent(qs[pname][j]));
        }
      } else if (qs[pname]) {
        qparams.push(pname + '=' + encodeURIComponent(qs[pname]));
      } else if (qs[pname] === null) {
        qparams.push(pname);
      }
    }
    qstring = '?' + qparams.join('&');
  }
  return end_url + qstring;
}

/**
  * send a REST request to the service
  *
  * @param {string} method the http method ('GET','POST','PUT' or 'DELETE')
  * @param {string|string[]} uri the request URI as a string or array of URI resources
  * @param {string|object} [qs] the query string parameters
  * @param {function(error,outcome)} callback the callback function
  * @param {string} [token] the sessions' authentication token
  * @param {string} [mimeType] the MIME type
  */
export default function service_request(method, uri, qs, callback, token, mimeType) {
  if (typeof qs === 'function' && !callback) {
    callback = qs;
    qs = {};
  }

  let end_url = makeUrl(uri, qs);
  let options = URL.parse(end_url);
  options.method = method;
  options.headers = {}
  if (token !== null)
  {
    options.headers = {
        'Authorization': token
        };
  }
  if (mimeType)
  {
      options.headers['Content-Type'] = mimeType;
      options.headers['Content-Length'] = JSON.stringify(qs).length;
      if (mimeType === 'application/x-www-form-urlencoded'){
          options.form = qs;
      }
  }
  let req = (options.protocol === 'https:' ? https : http).request(options, function(res) {
    let error = null;
    if (res.statusCode !== 200) {
      error = {
        code: 'SERVER-' + res.statusCode,
        message: res.statusMessage
      };
    }

    // accumulate chunks and convert to JSON in the end.
    // raw usage of http module, no external libraries.
    res.setEncoding('utf8');
    let acc_data = '';
    res.on('data', function(chunk) {
      acc_data += chunk;
    });
    res.on('end', function() {
      let type = res.headers['content-type'];
      let mime = type || "";
      if (mime.indexOf(";") !== -1) {
        mime = mime.split(";")[0];
      }
      let result;
      if (mime === 'application/json') {
        result = JSON.parse(acc_data);
      } else if (mime.startsWith('text')) {
        result = acc_data;
      } else {
        result = { type, text: acc_data };
      }
      callback(error, result);
    });
  });
  req.on('error', function (exception) {
    callback({code: 'EXCEPT', exception});
  });
  if (mimeType === 'application/x-www-form-urlencoded') {
    req.write(qs);
  }
  req.end();
}
