/**
 * Dicoogle Service Wrapper
 */
import serviceRequest from './servicerequest';

/** @namespace */
var dicoogle = (function DicoogleModule() {

  // private variables of the module
  var url_ = null;
  var username = null;
  var token = null;
  
  // module
  var m = {};

  const Endpoints = Object.freeze({
    SEARCH: "search",
    PROVIDERS: "providers",
    DUMP: "dump",
    DIC2PNG: "dic2png",
    DICTAGS: "dictags",
    QR_SERVICE: "management/dicom/query",
    STORAGE_SERVICE: "management/dicom/storage",
    INDEX: "management/tasks/index",
    UNINDEX: "management/tasks/unindex",
    REMOVE: "management/tasks/remove",
    RUNNING_TASKS: "index/task",
    VERSION: "ext/version",
    LOGIN: 'login',
    LOGOUT: 'logout'
  });
  
  m.Endpoints = Endpoints;
  
  /** search(query[, options], callback)
   * Perform a text query.
   * @param {string} query text query
   * @param {object} [options] a hash of options (none are required):
   *   {[boolean]} keyword : force whether the query is keyword-based. Defaults to automatic detection.
   *   {[string[]]} provider : an array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @param {function(error, {object[]}result)} callback
   */
  m.search = function Dicoogle_search(query, options, callback) {
      if (!options) {
        options = {};
      } else if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      let provider = options.provider || options.providers;
      let keyword = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      serviceRequest('GET', [url_, Endpoints.SEARCH], {
        query: query,
        keyword,
        provider
        }, function(err, data) {
          callback(err, data ? (data.results || []) : null);
      });
  };
  
  /** dump(uid, callback)
   * Retrieve an image's meta-data (perform an information dump)
   * @param {string} uid the SOP instance UID
   * @param {function(error, result)} callback
   */
  m.dump = function Dicoogle_dump(uid, callback) {
    serviceRequest('GET', [url_, Endpoints.DUMP], {
        uid
      }, function(err, data) {
        callback(err, data ? data.results : null);
    });
  };
  
  /** getProviders([type, ]callback)
   * Retrieve a list of provider plugins
   * @param {string} [type] the type of provider ("query", "index", ...) - defaults to "query"
   * @param callback (error, {string[]}result)
   */
  m.getProviders = function Dicoogle_getProviders(type, callback) {
    if (typeof type === 'function' && !callback) {
      callback = type;
      type = 'query';
    }
    let options = { type: typeof type === 'string' ? type : 'query' }; 
    serviceRequest('GET', [url_, Endpoints.PROVIDERS], options, (err, data) => {
        callback(err, data || null);
    });
  };

  /** getQueryProviders(callback)
   * Retrieve a list of query provider plugins
   * @param {function(error, {string[]}result)} callback
   */
  m.getQueryProviders = function Dicoogle_getQueryProviders(callback) {
    m.getProviders('query', callback);
  };

  /** getIndexProviders(callback)
   * Retrieve a list of index provider plugins
   * @param {function(error, {string[]}result)} callback
   */
  m.getIndexProviders = function Dicoogle_getIndexProviders(callback) {
    m.getProviders('index', callback);
  };

  /** getStorageProviders(callback)
   * Retrieve a list of storage interface plugins
   * @param {function(error, {string[]}result)} callback
   */
  m.getStorageProviders = function Dicoogle_getStorageProviders(callback) {
    m.getProviders('storage', callback);
  };
  
  /** getStorageServiceStatus(callback)
   * Obtain information about the DICOM Storage service.
   * @param {function(error, {running, autostart, port})} callback
   */
  m.getStorageServiceStatus = function Dicoogle_getStorageServiceStatus(callback) {
    serviceRequest('GET', [url_, Endpoints.STORAGE_SERVICE], function(err, data) {
        callback(err, data || null);
    });
  };

  /** getQueryRetrieveServiceStatus(callback)
   * Obtain information about the DICOM Query Retrieve service.
   * @param {function(error, {running, autostart, port})} callback
   */
  m.getQueryRetrieveServiceStatus = function Dicoogle_getQueryRetrieveServiceStatus(callback) {
    serviceRequest('GET', [url_, Endpoints.QR_SERVICE], function(err, data) {
        callback(err, data || null);
    });
  };

  /** getRunningTasks(callback)
   * Obtain information about Dicoogle's running (or terminated) tasks.
   * @param {function(error, {taskUid, taskName, taskProgress, [complete], [elapsedTime], [nIndexed], [nErrors]}[])} callback
   */
  m.getRunningTasks = function Dicoogle_getRunningTasks(callback) {
    serviceRequest('GET', [url_, Endpoints.RUNNING_TASKS], function(err, data) {
        callback(err, data || null);
    });
  };

  /** index(uri, [provider,] callback)
   * Request a new indexation task over a given URI. The operation is recursive, indexing anything in the URI's endpoint.
   * @param {string|string[]} uri a URI or array of URIs representing the root resource of the files to be indexed
   * @param {string|string[]} [provider] a provider or array of provider names in which the indexation will carry out, all by default
   * @param {function(error)} callback
   */
  m.index = function Dicoogle_index(uri, provider, callback) {
    if (typeof provider === 'function' && !callback) {
      callback = provider;
      provider = undefined;
    }
    serviceRequest('POST', [url_, Endpoints.INDEX], {
      uri,
      plugin: provider
    }, callback);
  };

  /** unindex(uri, callback)
   * Request that the file at the given URI is unindexed. The operation, unlike index(), is not recursive.
   * @param {string|string[]} uri a URI or array of URIs representing the files to be unindexed
   * @param {string|string[]} provider a provider or array of provider names in which the unindexation will carry out, all by default
   * @param {function(error)} callback
   */
  m.unindex = function Dicoogle_unindex(uri, provider, callback) {
    serviceRequest('POST', [url_, Endpoints.UNINDEX], {
      uri,
      provider
    }, callback);
  };

  /** remove(uri, callback)
   * Request that the file at the given URI is permanently removed. The operation, unlike index(), is not recursive.
   * Indices will not be updated, hence the files should be unindexed manually if so is intended.
   * @param {string|string[]} uri a URI or array of URIs representing the files to be removed
   * @param {function(error)} callback
   */
  m.remove = function Dicoogle_remove(uri, callback) {
    serviceRequest('POST', [url_, Endpoints.REMOVE], {
      uri
    }, callback);
  };

  /** getVersion(callback)
   * Retrieve the running Dicoogle version.
   * Indices will not be updated, hence the files should be unindexed manually if so is intended.
   * @param {function(error, { {string}version })} callback
   */
  m.getVersion = function Dicoogle_getVersion(callback) {
    serviceRequest('GET', [url_, Endpoints.VERSION], callback);
  };


  /** login(callback)
   * Login.
   * @param {string} username an username that should be used in Login
   * @param {password} password to authentication 
   * @param {function(error, { {string}result })} callback
   */
  m.login = function Dicoogle_login(username, password, callback) {
    serviceRequest('GET', [url_, Endpoints.LOGIN], callback);
  };

    /** logout(callback)
   * Logout.
   * @param {function(error, { {string}result })} callback
   */
  m.logout = function Dicoogle_logout(callback) {
    serviceRequest('GET', [url_, Endpoints.LOGOUT], callback);
  };


  /** request(method, uri[, options], callback)
   * Perform a generic request to Dicoogle's services. Users of this method can invoke any REST
   * service exposed by Dicoogle, including those from plugins.
   * @param {?string} method the kind of HTTP method to make, defaults to "GET" 
   * @param {string|string[]} uri a URI or array of resource sequences to the service, relative to Dicoogle's base URL 
   * @param {object} [options] an object of options to be passed as query strings
   * @param {function(error, result)} callback
   */
  m.request = function Dicoogle_request(method, uri, options, callback) {
      method = method || 'GET';
      if (!options) {
        options = {};
      } else if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      let path;
      if (typeof uri === 'string') {
        path = [url_, uri];
      } else {
        path = [url_].concat(uri);
      }
      serviceRequest(method, path, options, callback);
  };
  
  /** Obtain the base URL of all Dicoogle services.
   * @returns {string} the currently configured base endpoint of Dicoogle
   */
  m.getBase = function Dicoogle_getBase() {
    return url_;
  }

  /**
   * Initialize the Dicoogle access object, which can be used multiple times.
   *
   * @param {String} [url] the controller service's base url, can be null iif the endpoint is the browser context's host or an access object was previously created
   * @deprecated @param {boolean} [secure] whether to use HTTPS instead of HTTP, if no scheme is specified in the url
   * @return a singleton dicoogle service access object
   */
  return function(url, secure, user, password) {
    url_ = url || url_;
    if (typeof url_ !== 'string') {
      if (typeof window === 'object') {
        url_ = window.location.protocol + "//" + window.location.host;
      } else {
        throw "Missing URL to Dicoogle services";
      }
    }
    
    if (url_[url_.length-1] === '/') {
      url_ = url_.slice(-1);
    }
    if (url_ !== '') {
      if (url_.indexOf('://') === -1) {
        url_ = (secure ? 'https://' : 'http://') + url_;
      }
    }
    
    if (user!==undefined && password!==undefined)
    {
        m.login(url_, user, password, function(data)
        {
            token = data.token;
            username = user;
        });
    }
    
    return m;
  };
})();

module.exports = dicoogle;
