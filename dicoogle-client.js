/**
 * Dicoogle Service Wrapper
 */
var serviceRequest = require('./servicerequest');

/** @namespace */
var dicoogle = (function DicoogleModule() {

  // private variables of the module
  var url_ = '';
  
  // module
  var m = {};

  var EndPoints = {
    SEARCH: "search",
    PROVIDERS: "providers",
    DUMP: "dump",
    DIC2PNG: "dic2png",
    DICTAGS: "dictags"
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
   *   provider [ string[] ] : an array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @param callback (error, result)
   */
  m.search = function (query, options, callback) {
      if (!options) {
        options = {};
      } else if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      var prv = options.provider || options.providers;
      serviceRequest('GET', [url_, EndPoints.SEARCH], {
        query: query,
        keyword: options.keyword === true,
        provider: prv
        }, function(err, data) {
          callback(err, data ? (data.results || []) : null);
      });
  };
  
  /** dump(uid, callback)
   * Retrieve an image's meta-data (perform an information dump)
   * @param uid the SOP instance UID
   * @param callback (error, result)
   */
  m.dump = function (uid, callback) {
    serviceRequest('GET', [url_, EndPoints.DUMP], {
        uid: uid
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
    var options = { type: typeof type === 'string' ? type : 'query' }; 
    serviceRequest('GET', [url_, EndPoints.PROVIDERS], options, function(err, data) {
        callback(err, data || null);
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
  m.getIndexProviders = function(callback) {
    m.getProviders('index', callback);
  };

  /**
   * Initialize the Dicoogle access object, which can be used multiple times.
   *
   * @param {String} url the controller service's base url
   * @param {boolean} [secure = false] whether to use HTTPS instead of HTTP
   * @return a dicoogle service access object
   */
  return function(url, secure) {

    url_ = url || '';
    if (url_[url_.length-1] === '/') {
      url_ = url_.slice(-1);
    }
    if (url_.indexOf('://') === -1) {
      url_ = (secure ? 'https://' : 'http://') + url_;
    }
    
    return m;
  };
})();

module.exports = dicoogle;
