/**
 * Dicoogle Service Wrapper
 */

/** @namespace */
var dicoogle = (function dicoogle_module() {

  // private variables of the module
  var url_ = "http://localhost:8080";
  
  // module
  var m =  {};

  var EndPoints = {
    SEARCH: "search",
    PROVIDERS: "providers",
    DUMP: "dump"
//    IMAGESEARCH: "imageSearch",
//    DIC2PNG: "dic2png",
//    DICTAGS: "dictags",
//    PLUGINS: "plugin",
//    INDEX: "indexer",
//    DIM: "dim",
//    FILE: "file",
//    TAGS: "tags",
//    IMAGE: "image",
//    ENUMFIELD: "enumField",
//    WADO: "wado",
//    EXAMTIME: "examTime"
  };
  
  m.Endpoints = EndPoints;
  
  /** search(query[, options], callback)
   * Perform a text query.
   * @param query text query
   * @param options a hash of options (none are required):
   *   keyword [ boolean ] : whether the query is keyword-based, false by default
   *   provider [ string[] ] : an array of query provider names, or a string of a provider, defaults to the server's default query provider
   * @param callback (error, result)
   */
  m.search = function (query, options, callback) {
      if (!options) {
        options = {};
      } else if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      service_request('GET', EndPoints.SEARCH, {
        query: query,
        keyword: options.keyword===true,
        providers: options.providers
        }, function(err, data) {
          callback(err, data ? data.results : null);
      });
  };
  
  /** dump(uid, callback)
   * Retrieve an image's meta-data (perform an information dump)
   * @param uid the SOP instance UID
   * @param callback (error, result)
   */
  m.dump = function (uid, callback) {
    service_request('GET', EndPoints.DUMP, {
        uid : uid
      }, function(err, data) {
        callback(err, data ? data.results : null);
    });
  };
  
  /** getProviders([type, ]callback)
   * Retrieve a list of provider plugins
   * @param type the type of provider ("query", "index", ...) - defaults to "query"
   * @param callback (error, result)
   */
  m.getProviders = function(type, callback) {
    var options = { type : typeof type === 'string' ? type : 'query' }; 
    service_request('GET', EndPoints.PROVIDERS, options, function(err, data) {
        callback(err, data ? data : null);
    });
  };

  /** getQueryProviders(callback)
   * Retrieve a list of query provider plugins
   * @param callback (error, result)
   */
  m.getQueryProviders = function(callback) {
    m.getProviders('query', callback);
  };

  /** getIndexProviders(callback)
   * Retrieve a list of index provider plugins
   * @param callback (error, result)
   */
  m.getQueryProviders = function(callback) {
    m.getProviders('index', callback);
  };

//---------------------private methods--------------------------

  function isArray(it) {
    var ostring = Object.prototype.toString;
    return ostring.call(it) === '[object Array]';
  }
  
  function parseUrl(uri, qs) {
    // create full query string
    var end_url = url_;
    if (isArray(qs[uri])) {
      end_url += uri.join('/');
    } else {
      end_url += uri;
    }
    
    var qstring;
    if (!qs) {
      qstring = '';
    } if (typeof qs === 'string') {
      qstring = '?' + qs;
    } else {
      var qparams = [];
      for (var pname in qs) {
        if (isArray(qs[pname])) {
          for (var j = 0 ; j < qs[pname].length ; j++) {
            qparams.push(pname + '=' + encodeURIComponent(qs[pname][j]));
          }
        } else if (qs[pname]) {
          qparams.push(pname + '=' + encodeURIComponent(qs[pname]));
        } else if (qs[name] === null) {
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
   * @param {string} uri the request URI
   * @param {string|hash} qs the query string parameters
   * @param {Function(error,outcome)} callback
   */
  var service_request = function(method, uri, qs, callback) {
  var end_url = parseUrl(uri, qs);
  var options = require('url').parse(end_url);
  options.method = method;
  var req = require('http').request(options, function(res) {
    if (res.statusCode !== 200) {
      callback({code: "SERVER-"+res.statusCode,
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
  
  /**
   * Initialize a new Dicoogle access object, which can be used multiple times.
   *
   * @param {String} url the controller service's base url
   * @return a dicoogle service access object
   */
  return function(url) {

    url_ = url || "http://localhost:8080/";
    if (url_[url_.length-1] !== '/')
      url_ += '/';
    if (url_.indexOf('://') === -1) {
      url_ = 'http://' + url_;
    }
    
    return m;
  };
})();

module.exports = dicoogle;
