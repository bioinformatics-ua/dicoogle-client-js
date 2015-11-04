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

  var Endpoints = {
    SEARCH: "search",
    PROVIDERS: "providers",
    DUMP: "dump",
    DIC2PNG: "dic2png",
    DICTAGS: "dictags",
    MANAGEMENT: "management"
  };
  
  m.Endpoints = Endpoints;
  
  /** search(query[, options], callback)
   * Perform a text query.
   * @param {string} query text query
   * @param {object} [options] a hash of options (none are required):
   *   {[boolean]} keyword : force whether the query is keyword-based. Defaults to automatic detection.
   *   {[string[]]} provider : an array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @param {function(error, result)} callback
   */
  m.search = function(query, options, callback) {
      if (!options) {
        options = {};
      } else if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      var prv = options.provider || options.providers;
      var kw = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      serviceRequest('GET', [url_, Endpoints.SEARCH], {
        query: query,
        keyword: kw,
        provider: prv
        }, function(err, data) {
          callback(err, data ? (data.results || []) : null);
      });
  };
  
  /** dump(uid, callback)
   * Retrieve an image's meta-data (perform an information dump)
   * @param {string} uid the SOP instance UID
   * @param {function(error, result)} callback
   */
  m.dump = function(uid, callback) {
    serviceRequest('GET', [url_, Endpoints.DUMP], {
        uid: uid
      }, function(err, data) {
        callback(err, data ? data.results : null);
    });
  };
  
  /** getProviders([type, ]callback)
   * Retrieve a list of provider plugins
   * @param {string} [type] the type of provider ("query", "index", ...) - defaults to "query"
   * @param callback (error, result)
   */
  m.getProviders = function(type, callback) {
    if (typeof type === 'function' && !callback) {
      callback = type;
      type = 'query';
    }
    var options = { type: typeof type === 'string' ? type : 'query' }; 
    serviceRequest('GET', [url_, Endpoints.PROVIDERS], options, function(err, data) {
        callback(err, data || null);
    });
  };

  /** getQueryProviders(callback)
   * Retrieve a list of query provider plugins
   * @param callback (error, {string[]}result)
   */
  m.getQueryProviders = function(callback) {
    m.getProviders('query', callback);
  };

  /** getIndexProviders(callback)
   * Retrieve a list of index provider plugins
   * @param callback (error, {string[]}result)
   */
  m.getIndexProviders = function(callback) {
    m.getProviders('index', callback);
  };
  
  /** getStorageServiceStatus(callback)
   * Obtain information about the DICOM Storage service.
   * @param {function(error, object{running, autostart, port})} callback
   */
  m.getStorageServiceStatus = function(callback) {
    serviceRequest('GET', [url_, Endpoints.MANAGEMENT, "dicom", "storage"], function(err, data) {
        callback(err, data || null);
    });
  };

  /** getQueryRetrieveServiceStatus(callback)
   * Obtain information about the DICOM Query Retrieve service.
   * @param {function(error, object{running, autostart, port})} callback
   */
  m.getQueryRetrieveServiceStatus = function(callback) {
    serviceRequest('GET', [url_, Endpoints.MANAGEMENT, "dicom", "query"], function(err, data) {
        callback(err, data || null);
    });
  };

  /**
   * Initialize the Dicoogle access object, which can be used multiple times.
   *
   * @param {String} url the controller service's base url
   * @param {boolean} [secure] whether to use HTTPS instead of HTTP, if no scheme is specified in the url
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
