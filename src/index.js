/**
 * Dicoogle Service Wrapper
 */
import request from 'superagent';

// private variables of the module
/**@private
 * @define {string?} */
var url_ = null;
/**@private
 * @define {string?} */
var username_ = null;
/**@private
 * @define {string?} */
var token_ = null;
/**@private
 * @define {string[]?} */
var roles_ = null;

/** @constructor */
function DicoogleAccess() {}

/** Web service endpoints
 * @enum {string}
 */
const Endpoints = Object.freeze({
    SEARCH: "search",
    SEARCH_DIM: "searchDIM",
    PROVIDERS: "providers",
    DUMP: "dump",
    DIC2PNG: "dic2png",
    DICTAGS: "dictags",
    QR_SERVICE: "management/dicom/query",
    STORAGE_SERVICE: "management/dicom/storage",
    INDEXER_SETTINGS: "management/settings/index",
    TRANSFER_SETTINGS: "management/settings/transfer",
    DICOM_QUERY_SETTINGS: "management/settings/dicom/query",
    DICOM_STORAGE_SETTINGS: "management/settings/storage/dicom",
    DICOM_AETITLE_SETTINGS: "management/settings/dicom",
    INDEX: "management/tasks/index",
    UNINDEX: "management/tasks/unindex",
    REMOVE: "management/tasks/remove",
    TASKS: "index/task",
    VERSION: "ext/version",
    LOGIN: 'login',
    LOGOUT: 'logout'
});
DicoogleAccess.prototype.Endpoints = Endpoints;

/** Indexer settings fields
 * @enum {string}
 */
const IndexerSettings = Object.freeze({
    /** The path to the directory to watch. type: string */
    PATH: 'path',
    /** Whether to index zip files. type: boolean */
    ZIP: 'zip',
    /** The percentage of indexation effort (from 0 to 100). type: number */
    EFFORT: 'effort',
    /** Whether to index thumbnails. type: boolean */
    INDEX_THUMBNAIL: 'thumbnail',
    /** The size of generated thumbnails in pixels. type: number */
    THUMBNAIL_SIZE: 'thumbnailSize',
    /** Listen for changes in the directory for automatic indexation. type: boolean */
    WATCHER: 'watcher'
});
DicoogleAccess.prototype.IndexerSettings = IndexerSettings;

/** Service settings fields
 * @enum {string}
 */
const ServiceSettings = Object.freeze({
    /** The service's port. type: number (integer) */
    PORT: 'path',
    /** Whether to start the service on server launch. type: boolean */
    AUTOSTART: 'autostart'
});
DicoogleAccess.prototype.ServiceSettings = ServiceSettings;

  /** @typedef {Object} SearchOptions
   * @param {boolean} [keyword] - force whether the query is keyword-based, defaults to automatic detection
   * @param {string|string[]} [provider] - an array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @deprecated please use searchDIM instead
   * @param {boolean} [dim] - return the results as a DICOM Object Model tree (Patients -> Studies -> Series -> Instances), false by default
   */

  /** @typedef {Object} SearchOutcome
   * @param {object[]} results - The list of results
   * @param {number} elapsedTime - The time spent performing the search in the server, in milliseconds
   */

  /** @typedef {Object} SearchDIMOutcome
   * @param {SearchStudyResult[]} results - The list of results
   * @param {number} elapsedTime - The time spent performing the search in the server, in milliseconds
   */

  /** @typedef {Object} SearchStudyResult
   * @param {string} studyDate
   * @param {string} studyDescription
   * @param {string} studyInstanceUID
   * @param {string} institutionName
   * @param {string|string[]} modalities
   * @param {SearchSeriesResult[]} series
   */

  /** @typedef {Object} SearchSeriesResult
   * @param {number} serieNumber
   * @param {string} serieInstanceUID
   * @param {string} serieDescription
   * @param {string} serieModality
   * @param {SearchImageResult[]} images
   */

  /** @typedef {Object} SearchImageResult
   * @param {string} sopInstanceUID
   * @param {string} uri
   * @param {string} rawPath
   * @param {string} filename
   */

  /**
   * Perform a text query.
   * @param {string} query text query
   * @param {SearchOptions} [options] a hash of options related to the search
   * @param {function(error:any, outcome:SearchOutcome)} callback the callback function providing the outcome
   */
  DicoogleAccess.prototype.search = function Dicoogle_search(query, options, callback) {
      if (!options) {
        options = {};
      } else if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      let endpoint = Endpoints.SEARCH;
      if (options.dim) {
          endpoint = Endpoints.SEARCH_DIM;
          if (process.end.NODE_ENV !== 'production') {
              /*eslint-disable no-console */
              console.error("Warning: 'dim' flag in method search is deprecated! Please use searchDIM instead.");
              /*eslint-enable no-console */
          }
      }
      let provider = options.provider || options.providers;
      let keyword = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      serviceRequest('GET', [url_, endpoint], {
          query,
          keyword,
          provider
        }, callback, token_);
  };

  /**
   * Perform a text query with DIM-formatted outcome.
   * @param {string} query text query
   * @param {SearchOptions} [options] a hash of options related to the search
   * @param {function(error:any, outcome:SearchDIMOutcome)} callback the callback function providing the outcome
   */
  DicoogleAccess.prototype.searchDIM = function Dicoogle_search(query, options, callback) {
      if (!options) {
        options = {};
      } else if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      let provider = options.provider || options.providers;
      let keyword = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      serviceRequest('GET', [url_, Endpoints.SEARCH_DIM], {
          query,
          keyword,
          provider
        }, callback, token_);
  };

  /**
   * Retrieve an image's meta-data (perform an information dump)
   * @param {string} uid the SOP instance UID
   * @param {string|string[]} [provider] a list of provider plugins
   * @param {function(error:any, {results:object, elapsedTime:number})} callback the callback function
   */
  DicoogleAccess.prototype.dump = function Dicoogle_dump(uid, provider, callback) {
    if (typeof provider === 'function' && !callback) {
        callback = provider;
        provider = undefined;
    }
    serviceRequest('GET', [url_, Endpoints.DUMP], {
        uid, provider
      }, callback, token_);
  };

  /**
   * Retrieve a list of provider plugins
   * @param {string} [type] the type of provider ("query", "index", ...) - defaults to "query"
   * @param {function(error:any, result:string[])} callback the callback function
   */
  DicoogleAccess.prototype.getProviders = function Dicoogle_getProviders(type, callback) {
    if (typeof type === 'function' && !callback) {
      callback = type;
      type = 'query';
    }
    let options = { type: typeof type === 'string' ? type : 'query' };
    serviceRequest('GET', [url_, Endpoints.PROVIDERS], options, (err, data) => {
        callback(err, err ? null : data);
    }, token_);
  };

  /**
   * Retrieve a list of query provider plugins
   * @param {function(error:any, result:string[])} callback the callback function
   */
  DicoogleAccess.prototype.getQueryProviders = function Dicoogle_getQueryProviders(callback) {
    this.getProviders('query', callback);
  };

  /**
   * Retrieve a list of index provider plugins
   * @param {function(error:any, result:string[])} callback the callback function
   */
  DicoogleAccess.prototype.getIndexProviders = function Dicoogle_getIndexProviders(callback) {
    this.getProviders('index', callback);
  };

  /** Retrieve a list of storage interface plugins
   * @param {function(error:any, result:string[])} callback the callback function
   */
  DicoogleAccess.prototype.getStorageProviders = function Dicoogle_getStorageProviders(callback) {
    this.getProviders('storage', callback);
  };

  /**
   * Obtain information about the DICOM Storage service.
   * @param {function(error:any, {running:boolean, autostart:boolean, port:number})} callback the callback function
   */
  DicoogleAccess.prototype.getStorageServiceStatus = function Dicoogle_getStorageServiceStatus(callback) {
    serviceRequest('GET', [url_, Endpoints.STORAGE_SERVICE], {}, function(err, data) {
        callback(err, err ? null : data);
    }, token_);
  };

  /**
   * Obtain information about the DICOM Query/Retrieve service.
   * @param {function(error:any, {running:boolean, autostart:boolean, port:number})} callback the callback function
   */
  DicoogleAccess.prototype.getQueryRetrieveServiceStatus = function Dicoogle_getQueryRetrieveServiceStatus(callback) {
    serviceRequest('GET', [url_, Endpoints.QR_SERVICE], {}, function(err, data) {
        callback(err, err ? null : data);
    }, token_);
  };

  /** @typedef {Object} TaskInfo
   * @property {string} taskUid - the UUID of the task
   * @property {string} taskName - a human readable task name
   * @property {number} taskProgress - a number between 0 and 1 representing the task's progress; any negative number means no prediction is available
   * @property {boolean} [complete] - whether the task is complete, assume not if not available
   * @property {number} [elapsedTime] - only if complete; the time elapsed while the task was running
   * @property {number} [nIndexed] - the number of files successfully indexed
   * @property {number} [nErrors] - only if complete; the number of indexation errors
   */

  /**
   * Obtain information about Dicoogle's running (or terminated) tasks.
   * @param {function(error:any, {tasks:TaskInfo[], count:number})} callback the callback function
   */
  DicoogleAccess.prototype.getRunningTasks = function Dicoogle_getRunningTasks(callback) {
    serviceRequest('GET', [url_, Endpoints.TASKS], {}, function(err, data) {
        callback(err, data ? {
            tasks: data.results,
            count: data.count
        } : null);
    }, token_);
  };

  /**
   * Close a terminated task from the list of tasks.
   * @param {string} uid the task's unique ID
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.closeTask = function Dicoogle_closeTask(uid, callback) {
    serviceRequest('POST', [url_, Endpoints.TASKS], {
          uid,
          action: 'delete',
          type: 'close'
        }, callback, token_);
  };

  /**
   * Request that a task is stopped.
   * @param {string} uid the task's unique ID
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.stopTask = function Dicoogle_stopTask(uid, callback) {
    serviceRequest('POST', [url_, Endpoints.TASKS], {
          uid,
          action: 'delete',
          type: 'stop'
        }, callback, token_);
  };

  /**
   * Request a new indexation task over a given URI. The operation is recursive, indexing anything in the URI's endpoint.
   * @param {string|string[]} uri a URI or array of URIs representing the root resource of the files to be indexed
   * @param {string|string[]} [provider] a provider or array of provider names in which the indexation will carry out, all by default
   * @param {function(error:any)} callback the function to call when the task is successfully issued
   */
  DicoogleAccess.prototype.index = function Dicoogle_index(uri, provider, callback) {
    if (typeof provider === 'function' && !callback) {
      callback = provider;
      provider = undefined;
    }
    serviceRequest('POST', [url_, Endpoints.INDEX], {
      uri,
      plugin: provider
    }, callback, token_);
  };

  /**
   * Request that the file at the given URI is unindexed. The operation, unlike index(), is not recursive.
   * @param {string|string[]} uri a URI or array of URIs representing the files to be unindexed
   * @param {string|string[]} [provider] a provider or array of provider names in which the unindexation will carry out, all by default
   * @param {function(error:any)} callback the function to call on completion
   */
  DicoogleAccess.prototype.unindex = function Dicoogle_unindex(uri, provider, callback) {
    if (typeof provider === 'function' && !callback) {
      callback = provider;
      provider = undefined;
    }
    serviceRequest('POST', [url_, Endpoints.UNINDEX], {
      uri,
      provider
    }, callback, token_);
  };

  /** Request that the file at the given URI is permanently removed. The operation, unlike index(), is not recursive.
   * Indices will not be updated, hence the files should be unindexed manually if so is intended.
   * @param {string|string[]} uri a URI or array of URIs representing the files to be removed
   * @param {function(error:any)} callback the function to call on completion
   */
  DicoogleAccess.prototype.remove = function Dicoogle_remove(uri, callback) {
    serviceRequest('POST', [url_, Endpoints.REMOVE], {
      uri
    }, callback, token_);
  };

  /** Retrieve the running Dicoogle version.
   * @param {function(error:any, {version:string})} callback the callback function
   */
  DicoogleAccess.prototype.getVersion = function Dicoogle_getVersion(callback) {
    serviceRequest('GET', [url_, Endpoints.VERSION], {}, callback, token_);
  };

  /**
   * Retrieve the authentication token. This token is ephemeral and may expire after some time.
   * This method is synchronous.
   * @returns {string} the user's current authentication token
   */
  DicoogleAccess.prototype.getToken = function Dicoogle_getToken() {
    return token_;
  };

  /**
   * Assign the module's session token, used only for restoring previous (but recent) sessions.
   * This method is synchronous.
   * @param {string} token the same user's token of a previous session
   */
  DicoogleAccess.prototype.setToken = function Dicoogle_setToken(token) {
    if (typeof token === 'string') {
        token_ = token;
    }
  };

  /**
   * Check whether the user is authenticated to the server. Authenticated clients will hold an
   * authentication token.
   * @returns {boolean} whether the user is authenticated or not.
   */
  DicoogleAccess.prototype.isAuthenticated = function Dicoogle_isAuthenticated() {
    return token_ !== null;
  };

  /**
   * Get the user name of the currently authenticated user.
   * @returns {string} the unique user name
   */
  DicoogleAccess.prototype.getUsername = function Dicoogle_getUsername() {
    return username_;
  };

  /**
   * Get the names of the roles assigned to this user.
   * @returns {string[]} an array of role names, null if the user is not authenticated
   */
  DicoogleAccess.prototype.getRoles = function Dicoogle_getRoles() {
    return roles_ ? [].concat(roles_) : null;
  };

  /**
   * Manually log in to Dicoogle using the given credentials.
   * @param {string} username the unique user name for the client
   * @param {password} password the user's password for authentication
   * @param {function(error:any, {token:string, user:string, roles:string[], admin:boolean})} [callback] the callback function,
   *        providing the authentication token and other information
   */
  DicoogleAccess.prototype.login = function Dicoogle_login(username, password, callback) {

    function changedCallback(error, data) {
        if (error) {
            if (typeof callback === 'function') {
                callback(error);
            }
            return;
        }
        token_ = data.token;
        username_ = data.user;
        roles_ = data.roles;
        if (typeof callback === 'function') {
            callback(null, data);
        }
    }

    serviceRequest('POST', [url_, Endpoints.LOGIN], {}, changedCallback, null,
            'application/x-www-form-urlencoded', {username, password});
  };

  /**
   * Log out from the server.
   * @param {function(error:any)} [callback] the callback function
   */
  DicoogleAccess.prototype.logout = function Dicoogle_logout(callback) {
    serviceRequest('POST', [url_, Endpoints.LOGOUT], {}, function(error) {
        if (error) {
            if (error.status === 405) {
                Dicoogle_logout_fallback(callback);
            } else {
                if (callback) callback(error);
            }
        } else {
            username_ = null;
            token_ = null;
            roles_ = null;
            if (callback) callback(null);
        }
    }, token_);
  };

  /** This is a fallback implementation of logout that uses GET instead of POST,
   * as in the latest stable version of Dicoogle.
   * @private
   * @param {function(error:any)} callback the callback function
   */
  function Dicoogle_logout_fallback(callback) {
    serviceRequest('GET', [url_, Endpoints.LOGOUT], {}, function(error) {
        if (!error) {
            username_ = null;
            token_ = null;
            roles_ = null;
        }
        if (callback) callback(error);
    }, token_);
  }


  /** Get the current Indexer settings. Unless a specific field is mentioned, all
   * indexer settings will be provided. The type of the given outcome depends on
   * whether a particular field was chosen or all of them were requested.
   * @param {string} [field] a particular field to retrieve
   * @param {function(error:any, outcome:any)} callback the callback function
   */
  DicoogleAccess.prototype.getIndexerSettings = function Dicoogle_getIndexerSettings(field, callback) {
    if (typeof field === 'function' && !callback) {
      callback = field;
      field = undefined;
    }
    const url = [url_, Endpoints.INDEXER_SETTINGS];
    let all = true;
    if (typeof field === 'string') {
        all = false;
        url.push(encodeURIComponent(field));
        if (process.env.NODE_ENV !== 'production') {
            /* eslint-disable no-console */
            const values = Object.keys(IndexerSettings).map(k => IndexerSettings[k]); // values()
            if (values.indexOf(field) === -1) {
                console.error(`Warning: Attempting to get unrecognized indexer setting '${field}'.`);
            }
            /* eslint-enable no-console */
        }
    }
    // do not use the wrapper, or else we'll lose the output
    let req = request.get(url.join('/'));
    if (token_) {
        req = req.set('Authorization', token_);
    }
    req.end(function (err, res) {
        if (err) {
            callback(err);
            return;
        }
        let out;
        if (all) {
            if (Object.getOwnPropertyNames(res.body).length === 0) {
                out = JSON.parse(res.text);
            } else {
                out = res.body;
            }
            if ('effort' in out) out.effort = +out.effort;
            if ('thumbnailSize' in out) out.thumbnailSize = +out.thumbnailSize;
        } else {
            out = res.text;
            if (field === 'effort' || field === 'thumbnailSize') {
                out = +out;
            }
            if (field === 'watcher' || field === 'thumbnail' || field === 'zip') {
                out = (out === 'true');
            }
        }
        callback(null, out);
    });
  };

  /** Set a particular Indexer setting. A valid field and value is required.
   * @param {string} field a particular field to set
   * @param {string} value the value to assign to the field
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.setIndexerSettings = function Dicoogle_setIndexerSettings(field, value, callback) {
    if (process.env.NODE_ENV !== 'production') {
        const values = Object.keys(IndexerSettings).map(k => IndexerSettings[k]);
        if (values.indexOf(field) === -1) {
            /* eslint-disable no-console */
            console.error(`Warning: Attempting to set unrecognized indexer setting '${field}'.`);
            /* eslint-enable no-console */
        }
    }
    const type = encodeURIComponent(field);
    const url = [url_, Endpoints.INDEXER_SETTINGS, type];
    const qs = {};
    qs[type] = value;
    serviceRequest('POST', url, qs, callback, token_);
  };

  /** Get the list of current transfer syntax settings available.
   * @param {function(error:any, outcome:TransferSyntax[])} callback the callback function
   */
  DicoogleAccess.prototype.getTransferSyntaxSettings = function Dicoogle_getTransferSyntaxSettings(callback) {
    const url = [url_, Endpoints.TRANSFER_SETTINGS]
    let req = request.get(url.join('/'));
    if (token_) {
        req = req.set('Authorization', token_);
    }
    req.end(function (err, res) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, JSON.parse(res.text));
    });
  }

  /** Set (or reset) an option of a particular transfer syntax.
   * @param {string} uid the unique identifier of the transfer syntax
   * @param {string} option the name of the option to modify
   * @param {boolean} value whether to set (true) or reset (false) the option
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.setTransferSyntaxOption = function Dicoogle_setTransferSyntaxOption(uid, option, value, callback) {
      serviceRequest('POST', [url_, Endpoints.TRANSFER_SETTINGS], {uid, option, value}, callback, token_);
  }

  /** Retrieve the AE title of the Dicoogle archive.
   * @param {function(error:any, aetitle:string)} callback the callback function
   */
  DicoogleAccess.prototype.getAETitle = function Dicoogle_getAETitle(callback) {
      serviceRequest('GET', [url_, Endpoints.DICOM_AETITLE_SETTINGS], {}, function(err, outcome) {
        if (err) {
            callback(err);
        } else {
            callback(null, outcome.aetitle);
        }
      }, token_);
  };

  /** Redefine the AE title of the Dicoogle archive.
   * @param {string} aetitle a valid AE title for the PACS archive
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.setAETitle = function Dicoogle_setAETitle(aetitle, callback) {
      serviceRequest('PUT', [url_, Endpoints.DICOM_AETITLE_SETTINGS], { aetitle }, function(err, outcome) {
        if (err) {
            callback(err);
        } else {
            callback(null, outcome.aetitle);
        }
      }, token_);
  };

  /**
   * Start the DICOM Storage service.
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.startStorageService = function Dicoogle_startStorageService(callback) {
    serviceRequest('POST', [url_, Endpoints.STORAGE_SERVICE], { running: true }, callback, token_);
  };

  /**
   * Stop the DICOM Storage service.
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.stopStorageService = function Dicoogle_stopStorageService(callback) {
    serviceRequest('POST', [url_, Endpoints.STORAGE_SERVICE], { running: false }, callback, token_);
  };

  /**
   * Start the DICOM Query/Retrieve service.
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.startQueryRetrieveService = function Dicoogle_startQueryRetrieveService(callback) {
    serviceRequest('POST', [url_, Endpoints.QR_SERVICE], { running: true }, callback, token_);
  };

  /**
   * Stop the DICOM Query/Retrieve service.
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.stopQueryRetrieveService = function Dicoogle_stopQueryRetrieveService(callback) {
    serviceRequest('POST', [url_, Endpoints.QR_SERVICE], { running: false }, callback, token_);
  };

  /**
   * Perform a generic request to Dicoogle's services. Users of this method can invoke any REST
   * service exposed by Dicoogle, including those from plugins.
   * @param {?string} method the kind of HTTP method to make, defaults to "GET"
   * @param {string|string[]} uri a URI or array of resource sequences to the service, relative to Dicoogle's base URL
   * @param {object} [options] an object of options to be passed as query strings
   * @param {function(error:any, result)} callback the callback function
   */
  DicoogleAccess.prototype.request = function Dicoogle_request(method, uri, options, callback) {
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
  DicoogleAccess.prototype.getBase = function Dicoogle_getBase() {
    return url_;
  }

  /** Adapter to legacy service request API.
   * Send a REST request to the service
   *
   * @param {string} method the http method ('GET','POST','PUT' or 'DELETE')
   * @param {string|string[]} uri the request URI as a string or array of URI resources
   * @param {string|object} qs the query string parameters
   * @param {function(error:any, outcome:any)} callback the callback function
   * @param {string} [token] the sessions' authentication token
   * @param {string} [mimeType] the MIME type, application/json by default
   * @param {Object} [formData] the form data
   */
  function serviceRequest(method, uri, qs, callback, token, mimeType, formData) {
      mimeType = mimeType || (formData && 'application/json');
      if (uri instanceof Array) {
        uri = uri.join('/');
      }
      let req = request(method, uri)
        .query(qs);
      if (token) {
          req = req.set('Authorization', token);
      }
      if (mimeType) {
        req = req.type(mimeType);
      }
      if (formData) {
          req = req.send(formData);
      }
      req.end(function (err, res) {
          if (err) {
              callback(err);
              return;
          }
          callback(null, res ? (res.body || res.text) : null);
      });
  }

// singleton module */
var m = new DicoogleAccess();

/** Object type for containing Dicoogle client options.
 * @typedef {Object} DicoogleClientOptions
 *
 * @deprecated @property {string} user - The client's user name.
 * @deprecated @property {password} password - The user's password for authentication.
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
export default function dicoogleClient(url, options = {}) {
    if (typeof url === 'string') {
        if (url !== url_) {
            // new address, discard user info
            username_ = null;
            token_ = null;
            roles_ = null;
            url_ = url;
        }
    }
    if (typeof url_ !== 'string') {
      if (typeof window === 'object') {
        /* eslint-disable no-undef */
        url_ = window.location.protocol + "//" + window.location.host;
        /* eslint-enable no-undef */
      } else {
        throw new Error("Missing URL to Dicoogle services");
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
        if (process.env.NODE_ENV !== 'production') {
            /*eslint-disable no-console */
            console.error('Warning: Use of Dicoogle client options for logging in is deprecated! Please use DicoogleAccess#login(user, password) instead.');
            /*eslint-enable no-console */
        }
        m.login(user, password);
    }

    return m;
}
