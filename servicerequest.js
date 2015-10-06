
var URL = require('url');

function makeUrl(uri, qs) {
  // create full query string
  var end_url;
  if (Array.isArray(uri)) {
    end_url = uri.join('/');
  } else {
    end_url = uri;
  }
  
  var qstring;
  if (!qs) {
    qstring = '';
  } if (typeof qs === 'string') {
    qstring = '?' + qs;
  } else {
    var qparams = [];
    for (var pname in qs) {
      if (Array.isArray(qs[pname])) {
        for (var j = 0; j < qs[pname].length; j++) {
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
  * @param {string|object} qs the query string parameters
  * @param {function(error,outcome)} callback
  */
module.exports = function service_request(method, uri, qs, callback) {
  var end_url = makeUrl(uri, qs);
  var options = URL.parse(end_url);
  options.method = method;
  var req = require('http').request(options, function(res) {
    if (res.statusCode !== 200) {
      callback({code: 'SERVER-' + res.statusCode,
                message: res.statusMessage}, null);
      req.abort();
      return;
    }
    // accumulate chunks and convert to JSON in the end.
    // raw usage of http module, no external libraries.
    res.setEncoding('utf8');
    var acc_data = '';
    res.on('data', function(chunk) {
      acc_data += chunk;
    });
    res.on('end', function() {
      var type = res.headers['content-type'];
      var mime = type;
      if (mime.indexOf(";") !== -1) {
        mime = mime.split(";")[0];
      }
      var result;
      if (mime === 'application/json') {
        result = JSON.parse(acc_data);
        callback(null, result);
      } else {
        result = {type: type, text: acc_data};
        callback(null, result);
      }
    });
  });
  req.on('error', function (exception) {
    callback({code: 'EXCEPT', exception: exception});
  });
  req.end();
};
