/**
 * Dicoogle Service Wrapper
 */
import serviceRequest from './servicerequest';

/** @namespace */
const dicoogle = (function DicoogleModule() {

  // private variables of the module
  var url_ = null;
  var username_ = null;
  var token_ = null;

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
   *   - {boolean} keyword: force whether the query is keyword-based. Defaults to automatic detection.
   *   - {string|string[]} [provider] : an array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @param {function(error, {results:object[], elapsedTime:number})} callback the callback function providing the outcome
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
        }, callback);
  };

  /** dump(uid, callback)
   * Retrieve an image's meta-data (perform an information dump)
   * @param {string} uid the SOP instance UID
   * @param {function(error, outcome:{results:object, elapsedTime:number})} callback the callback function
   */
  m.dump = function Dicoogle_dump(uid, callback) {
    serviceRequest('GET', [url_, Endpoints.DUMP], {
        uid
      }, callback);
  };

  /** getProviders([type, ]callback)
   * Retrieve a list of provider plugins
   * @param {string} [type] the type of provider ("query", "index", ...) - defaults to "query"
   * @param {function(error, result:string)} callback the callback function
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
   * @param {function(error, result:string[])} callback the callback function
   */
  m.getQueryProviders = function Dicoogle_getQueryProviders(callback) {
    m.getProviders('query', callback);
  };

  /** getIndexProviders(callback)
   * Retrieve a list of index provider plugins
   * @param {function(error, result:string[])} callback the callback function
   */
  m.getIndexProviders = function Dicoogle_getIndexProviders(callback) {
    m.getProviders('index', callback);
  };

  /** getStorageProviders(callback)
   * Retrieve a list of storage interface plugins
   * @param {function(error, result:string[])} callback the callback function
   */
  m.getStorageProviders = function Dicoogle_getStorageProviders(callback) {
    m.getProviders('storage', callback);
  };

  /** getStorageServiceStatus(callback)
   * Obtain information about the DICOM Storage service.
   * @param {function(error, {running, autostart, port})} callback the callback function
   */
  m.getStorageServiceStatus = function Dicoogle_getStorageServiceStatus(callback) {
    serviceRequest('GET', [url_, Endpoints.STORAGE_SERVICE], function(err, data) {
        callback(err, data || null);
    });
  };

  /** getQueryRetrieveServiceStatus(callback)
   * Obtain information about the DICOM Query Retrieve service.
   * @param {function(error, {running, autostart, port})} callback the callback function
   */
  m.getQueryRetrieveServiceStatus = function Dicoogle_getQueryRetrieveServiceStatus(callback) {
    serviceRequest('GET', [url_, Endpoints.QR_SERVICE], function(err, data) {
        callback(err, data || null);
    });
  };

  /** @typedef {Object} TaskInfo
   * @property {string} taskUid - the UUID of the task
   * @property {string} taskName - a human readable task name
   * @property {number} taskProgress - a number between 0 and 1 representing the task's progress; any negative number means no prediction is available
   * @property {boolean} [complete] - whether the task is complete
   * @property {number} [elapsedTime] - only if complete; the time elapsed while the task was running
   * @property {number} [nIndexed] - the number of files successfully indexed
   * @property {number} [nErrors] - only if complete; the number of indexation errors
   */

  /** getRunningTasks(callback)
   * Obtain information about Dicoogle's running (or terminated) tasks.
   * @param {function(error, {tasks:TaskInfo[], count:number})} callback the callback function
   */
  m.getRunningTasks = function Dicoogle_getRunningTasks(callback) {
    serviceRequest('GET', [url_, Endpoints.RUNNING_TASKS], function(err, data) {
        callback(err, data ? {
            tasks: data.results,
            count: data.count
        } : null);
    });
  };

  /** index(uri, [provider,] callback)
   * Request a new indexation task over a given URI. The operation is recursive, indexing anything in the URI's endpoint.
   * @param {string|string[]} uri a URI or array of URIs representing the root resource of the files to be indexed
   * @param {string|string[]} [provider] a provider or array of provider names in which the indexation will carry out, all by default
   * @param {function(error)} callback the function to call when the task is successfully issued
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

  /** unindex(uri, [provider,] callback)
   * Request that the file at the given URI is unindexed. The operation, unlike index(), is not recursive.
   * @param {string|string[]} uri a URI or array of URIs representing the files to be unindexed
   * @param {string|string[]} [provider] a provider or array of provider names in which the unindexation will carry out, all by default
   * @param {function(error)} callback the function to call on completion
   */
  m.unindex = function Dicoogle_unindex(uri, provider, callback) {
    if (typeof provider === 'function' && !callback) {
      callback = provider;
      provider = undefined;
    }
    serviceRequest('POST', [url_, Endpoints.UNINDEX], {
      uri,
      provider
    }, callback);
  };

  /** remove(uri, callback)
   * Request that the file at the given URI is permanently removed. The operation, unlike index(), is not recursive.
   * Indices will not be updated, hence the files should be unindexed manually if so is intended.
   * @param {string|string[]} uri a URI or array of URIs representing the files to be removed
   * @param {function(error)} callback the function to call on completion
   */
  m.remove = function Dicoogle_remove(uri, callback) {
    serviceRequest('POST', [url_, Endpoints.REMOVE], {
      uri
    }, callback);
  };

  /** getVersion(callback)
   * Retrieve the running Dicoogle version.
   * Indices will not be updated, hence the files should be unindexed manually if so is intended.
   * @param {function(error, {version:string})} callback the callback function
   */
  m.getVersion = function Dicoogle_getVersion(callback) {
    serviceRequest('GET', [url_, Endpoints.VERSION], callback);
  };

  /** getToken()
   * Retrieve the authentication token. This token is ephemeral and may expire after some time.
   * This method is synchronous.
   * @returns {string} the user's current authentication token
   */
  m.getToken = function Dicoogle_getToken() {
    return token_;
  };

  /** setToken(token)
   * Assing the module's session token, used only for restoring previous (but recent) sessions.
   * This method is synchronous.
   * @param {string} token the same user's token of a previous token
   */
  m.setToken = function Dicoogle_setToken(token) {
    if (typeof token === 'string') {
        token_ = token;
    }
  };

  /** isAuthenticated()
   * Check whether the user is authenticated to the server. Authenticated clients will hold an
   * authentication token.
   * @returns {boolean} whether the user is authenticated to not.
   */
  m.isAuthenticated = function Dicoogle_isAuthenticated() {
    return token_ !== null;
  };

  /** getUsername()
   * Get the user name of the currently authenticated user.
   * @returns {string} the unique user name
   */
  m.getUsername = function Dicoogle_getUsername() {
    return username_;
  };

  /** login(username, password, callback)
   * Manually log in to Dicoogle using the given credentials.
   * @param {string} username the unique user name for the client
   * @param {password} password the user's password for authentication
   * @param {function(error, {token:string, user:string})} [callback] the callback function, returns the authentication token
   */
  m.login = function Dicoogle_login(username, password, callback) {

    function changedCallback(error, data) {
        if (error) {
            if (typeof callback === 'function') {
                callback(error);
            }
            return;
        }
        token_ = data.token;
        username_ = data.user;
        if (typeof callback === 'function') {
            callback(null, data);
        }
    }

    serviceRequest('POST', [url_, Endpoints.LOGIN], false, changedCallback, null, 'application/x-www-form-urlencoded', {username, password});
  };

  /** logout(callback)
   * Log out from the server.
   * @param {function(error)} callback the callback function
   */
  m.logout = function Dicoogle_logout(callback) {
    serviceRequest('GET', [url_, Endpoints.LOGOUT], false, callback, token_);
  };


  /** request(method, uri[, options], callback)
   * Perform a generic request to Dicoogle's services. Users of this method can invoke any REST
   * service exposed by Dicoogle, including those from plugins.
   * @param {?string} method the kind of HTTP method to make, defaults to "GET"
   * @param {string|string[]} uri a URI or array of resource sequences to the service, relative to Dicoogle's base URL
   * @param {object} [options] an object of options to be passed as query strings
   * @param {function(error, result)} callback the callback function
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
      serviceRequest(method, path, options, callback, token_);
  };

  /** Obtain the base URL of all Dicoogle services.
   * This method is synchronous.
   * @returns {string} the currently configured base endpoint of Dicoogle
   */
  m.getBase = function Dicoogle_getBase() {
    return url_;
  }

  /** Object type for containing Dicoogle client options.
   * @typedef {Object} DicoogleClientOptions
   *
   * @property {string} user - The client's user name.
   * @property {password} password - The user's password for authentication.
   * @property {string} [token] - The same user's token of a previous token, used only for restoring previous (but recent) sessions.
   * @property {boolean} [secure] - Whether to use HTTPS instead of HTTP, if no scheme is specified in the url.
   */

  /**
   * Initialize the Dicoogle access object, which can be used multiple times.
   *
   * @param {String} [url] the controller service's base url, can be null iif the endpoint is the browser context's host or the access object is already created
   * @param {DicoogleClientOptions} options a set of options regarding service access and user authentication
   * @returns {Object} a singleton dicoogle service access object
   */
  return function(url, options = {}) {
    url_ = url || url_;
    if (typeof url_ !== 'string') {
      if (typeof window === 'object') {
        url_ = window.location.protocol + "//" + window.location.host;
      } else {
        throw "Missing URL to Dicoogle services";
      }
    }

    const {user, password, secure} = options;

    if (url_[url_.length - 1] === '/') {
      url_ = url_.slice(-1);
    }
    if (url_ !== '') {
      if (url_.indexOf('://') === -1) {
        url_ = (secure ? 'https://' : 'http://') + url_;
      }
    }

    if (typeof user === 'string' && password) {
        m.login(user, password)
    }

    return m;
  };
})();

module.exports = dicoogle;
