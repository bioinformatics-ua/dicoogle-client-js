/**
 * Dicoogle Service Wrapper
 */
import Endpoints from './endpoints';
import Socket from './socket';
import {StorageService, QueryRetrieveService} from './service';
import Tasks from './tasks';

// private variables of the module
/**@private
 * @define {Socket}
 */
var socket_;

/** @constructor */
function DicoogleAccess() {}

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
   * @param {string|string[]} [field] - a set of field names to be passed to the query providers when requesting the query.
   * When empty, the server will provide a default set based on a few DICOM attributes.
   * @param {number} [psize] Activate pagination by defining the size of the page. _Note:_ Available since Dicoogle 2.4.0
   * @param {number} [offset] When paginating, define the offset of the page to retrieve. _Note:_ Available since Dicoogle 2.4.0
   * @deprecated please use searchDIM instead
   * @param {boolean} [dim] - return the results as a DICOM Object Model tree (Patients -> Studies -> Series -> Instances), false by default
   */

  /** @typedef {Object} SearchDIMOptions
   * @param {boolean} [keyword] - force whether the query is keyword-based, defaults to automatic detection
   * @param {string|string[]} [provider] - an array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @param {string|string[]} [field] - a set of field names to be passed to the query providers when requesting the query.
   * When empty, the server will provide a default set based on a few DICOM attributes.
   * @param {number} [psize] - Activate pagination by defining the size of the page (in number of patients). _Note:_ Available since Dicoogle 2.4.0
   * @param {number} [offset] - When paginating, define the offset of the page to retrieve (in number of patients). _Note:_ Available since Dicoogle 2.4.0
   * @param {string} [depth] - Define the depth of retrieval based on the DIM level. _Note:_ Available since Dicoogle 2.4.0
   * @deprecated use method searchDIM instead
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
  DicoogleAccess.prototype.search = function Dicoogle_search(query, options = {}, callback) {
      if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      const provider = options.provider || options.providers;
      const keyword = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      const {field, psize, offset} = options;
      serviceRequest('GET', Endpoints.SEARCH, {
          query,
          keyword,
          field,
          provider,
          psize,
          offset
        }, callback);
  };

  /**
   * Perform a text query with DIM-formatted outcome.
   * @param {string} query text query
   * @param {SearchOptions} [options] a hash of options related to the search
   * @param {function(error:any, outcome:SearchDIMOutcome)} callback the callback function providing the outcome
   */
  DicoogleAccess.prototype.searchDIM = function Dicoogle_search(query, options = {}, callback) {
      if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
      }
      const provider = options.provider || options.providers;
      const keyword = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      const {psize, offset, depth} = options;
      serviceRequest('GET', Endpoints.SEARCH_DIM, {
          query,
          keyword,
          provider,
          psize,
          offset,
          depth
        }, callback);
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
    serviceRequest('GET', Endpoints.DUMP, {
        uid, provider
      }, callback);
  };

  /**
   * Retrieve a list of provider plugins
   * @param {string} [type] the type of provider ("query", "index", ...) - defaults to "query"
   * @param {function(error:any, result:string[])} callback the callback function
   */
  DicoogleAccess.prototype.getProviders = function Dicoogle_getProviders(type = 'query', callback) {
    if (typeof type === 'function' && !callback) {
      callback = type;
      type = 'query';
    }
    serviceRequest('GET', Endpoints.PROVIDERS, { type }, callback);
  };

  /**
   * Retrieve a list of query provider plugins
   * @param {function(error:any, result:string[])} callback the callback function
   */
  DicoogleAccess.prototype.getQueryProviders = function Dicoogle_getQueryProviders(callback) {
    this.getProviders(callback);
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
    serviceRequest('POST', Endpoints.INDEX, {
      uri,
      plugin: provider
    }, callback);
  };

  /** Retrieve the Dicoogle server's log text.
   * @param {function(error:any, text:string)} callback the callback function
   */
  DicoogleAccess.prototype.getRawLog = function Dicoogle_getRawLog(callback) {
    serviceRequest('GET', Endpoints.LOGGER, {}, callback, 'text/plain');
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
    serviceRequest('POST', Endpoints.UNINDEX, {
      uri,
      provider
    }, callback);
  };

  /** Request that the file at the given URI is permanently removed. The operation, unlike index(), is not recursive.
   * Indices will not be updated, hence the files should be unindexed manually if so is intended.
   * @param {string|string[]} uri a URI or array of URIs representing the files to be removed
   * @param {function(error:any)} callback the function to call on completion
   */
  DicoogleAccess.prototype.remove = function Dicoogle_remove(uri, callback) {
    serviceRequest('POST', Endpoints.REMOVE, {
      uri
    }, callback);
  };

  /** Retrieve the running Dicoogle version.
   * @param {function(error:any, {version:string})} callback the callback function
   */
  DicoogleAccess.prototype.getVersion = function Dicoogle_getVersion(callback) {
    serviceRequest('GET', Endpoints.VERSION, {}, callback);
  };

  /** Retrieve information about currently installed web UI plugins.
   * @param {string} slotId the identifiers of slots to contemplate
   * @param {function(error:any,plugins:WebUIPlugin[])} callback the callback function
   */
  DicoogleAccess.prototype.getWebUIPlugins = function Dicoogle_getWebUIPlugins(slotId, callback) {
    serviceRequest('GET', Endpoints.WEBUI, slotId ? {'slot-id': slotId} : {}, (error, outcome) => {
        if (error) {
            callback(error);
            return;
        }
        if (!outcome || !outcome.plugins) {
            callback(new Error("invalid output from server"));
            return;
        }
        const {plugins} = outcome;
        callback(null, plugins.map(p => {
            p.slotId = p['slot-id'] || p.dicoogle['slot-id'];
            p.moduleFile = p['module-file'] || p.dicoogle['module-file'];
            if (!p.caption) {
                p.caption = p.dicoogle.caption;
            }
            if (!p.roles) {
                p.roles = p.dicoogle.roles;
            }
            return p;
        }));
    });
  };

  /**
   * Retrieve the authentication token. This token is ephemeral and may expire after some time.
   * This method is synchronous.
   * @returns {string} the user's current authentication token
   */
  DicoogleAccess.prototype.getToken = function Dicoogle_getToken() {
    return socket_.getToken();
  };

  /**
   * Assign the module's session token, used only for restoring previous (but recent) sessions.
   * This method is synchronous.
   * @param {string} token the same user's token of a previous session
   */
  DicoogleAccess.prototype.setToken = function Dicoogle_setToken(token) {
    if (typeof token === 'string') {
        socket_.setToken(token);
    }
  };

  /**
   * Check whether the user is authenticated to the server. Authenticated clients will hold an
   * authentication token.
   * @returns {boolean} whether the user is authenticated or not.
   */
  DicoogleAccess.prototype.isAuthenticated = function Dicoogle_isAuthenticated() {
    return socket_.hasToken();
  };

  /**
   * Get the user name of the currently authenticated user.
   * @returns {string} the unique user name
   */
  DicoogleAccess.prototype.getUsername = function Dicoogle_getUsername() {
    return socket_.getUsername();
  };

  /**
   * Get the names of the roles assigned to this user.
   * @returns {string[]} an array of role names, null if the user is not authenticated
   */
  DicoogleAccess.prototype.getRoles = function Dicoogle_getRoles() {
    return socket_.getRoles();
  };

  /**
   * Manually log in to Dicoogle using the given credentials.
   * @param {string} username the unique user name for the client
   * @param {password} password the user's password for authentication
   * @param {function(error:any, {token:string, user:string, roles:string[], admin:boolean})} [callback] the callback function,
   *        providing the authentication token and other information
   */
  DicoogleAccess.prototype.login = function Dicoogle_login(username, password, callback) {
    socket_.login(username, password, callback);
  };

  /**
   * Log out from the server.
   * @param {function(error:any)} [callback] the callback function
   */
  DicoogleAccess.prototype.logout = function Dicoogle_logout(callback) {
    socket_.logout(callback);
  };

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
    const url = [Endpoints.INDEXER_SETTINGS];
    let all = true;
    if (typeof field === 'string') {
        all = false;
        url.push(encodeURIComponent(field));
        /* istanbul ignore next */
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
    socket_.request('GET', url).end(function (err, res) {
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
   * @param {object|string} fields either a dictionary of settings or the name of a particular field to set
   * @param {string} [value] the value to assign to the field, required if `fields` is a string
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.setIndexerSettings = function Dicoogle_setIndexerSettings(fields, value, callback) {
    if (typeof fields === 'string') {
        const field = fields;
        fields = {};
        fields[field] = value;
    } else {
        callback = value;
    }
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production') {
        const values = Object.keys(IndexerSettings).map(k => IndexerSettings[k]);
        for (const field in fields) {
            if (values.indexOf(field) === -1) {
                /* eslint-disable no-console */
                console.error(`Warning: Attempting to set unrecognized indexer setting '${field}'.`);
                /* eslint-enable no-console */
            }
        }
    }
    serviceRequest('POST', Endpoints.INDEXER_SETTINGS, fields, callback);
  };

  /** Get the list of current transfer syntax settings available.
   * @param {function(error:any, outcome:TransferSyntax[])} callback the callback function
   */
  DicoogleAccess.prototype.getTransferSyntaxSettings = function Dicoogle_getTransferSyntaxSettings(callback) {
    socket_.request('GET', Endpoints.TRANSFER_SETTINGS)
        .end(function (err, res) {
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
      serviceRequest('POST', Endpoints.TRANSFER_SETTINGS, {uid, option, value}, callback);
  }

  /** Retrieve the AE title of the Dicoogle archive.
   * @param {function(error:any, aetitle:string)} callback the callback function
   */
  DicoogleAccess.prototype.getAETitle = function Dicoogle_getAETitle(callback) {
      serviceRequest('GET', Endpoints.DICOM_AETITLE_SETTINGS, {}, function(err, outcome) {
        if (err) {
            callback(err);
            return;
        }
        const ae = outcome && outcome.aetitle;
        if (!ae) {
            callback(new Error("Missing server content"));
        } else {
            callback(null, ae);
        }
      });
  };

  /** Redefine the AE title of the Dicoogle archive.
   * @param {string} aetitle a valid AE title for the PACS archive
   * @param {function(error:any)} callback the callback function
   */
  DicoogleAccess.prototype.setAETitle = function Dicoogle_setAETitle(aetitle, callback) {
      serviceRequest('PUT', Endpoints.DICOM_AETITLE_SETTINGS, { aetitle }, callback);
  };

  /**
   * Perform a generic request to Dicoogle's services. Users of this method can invoke any REST
   * service exposed by Dicoogle, including those from plugins. The resulting object is the start
   * of a SuperAgent request.
   *
   * @param {?string} method the kind of HTTP method to make, defaults to "GET"
   * @param {string|string[]} uri a URI or array of resource sequences to the service, relative
   *                          to Dicoogle's base URL. There should be no leading slash ('/').
   * @param {object} [options] an object of options to be passed as query strings
   * @returns {SuperAgent} a superagent request object
   */
  DicoogleAccess.prototype.request = function Dicoogle_request(method = 'GET', uri) {
      return socket_.request(method, uri);
  };

  /** Obtain the base URL of all Dicoogle services.
   * This method is synchronous.
   * @returns {string} the currently configured base endpoint of Dicoogle
   */
  DicoogleAccess.prototype.getBase = function Dicoogle_getBase() {
    return socket_.getBase();
  }

  /** @private Adapter to legacy service request API.
   * Send a REST request to the service
   *
   * @param {string} method the http method ('GET','POST','PUT' or 'DELETE')
   * @param {string|string[]} uri the request URI as a string or array of URI resources
   * @param {string|object} qs the query string parameters
   * @param {function(error:any, outcome:any)} callback the callback function
   * @param {string} [mimeType] the MIME type, application/json by default
   */
  function serviceRequest(method, uri, qs, callback, mimeType = 'application/json') {
      const asText = mimeType ? mimeType.split('/')[0] === 'text' : false;
      let req = socket_.request(method, uri).query(qs);
      if (mimeType) {
        req = req.type(mimeType);
      }
      req.end(function (err, res) {
          if (err) {
              callback(err);
              return;
          }
          callback(null, res ? (asText ? res.text : res.body) : null);
      });
  }

// singleton module */
var m = new DicoogleAccess();

/** Object type for containing Dicoogle client options.
 * @typedef {Object} DicoogleClientOptions
 *
 * @property {string} [token] - The same user's token of a previous token, used only for restoring previous (but recent) sessions.
 * @property {boolean} [secure] - Whether to use HTTPS instead of HTTP, if no scheme is specified in the url.
 */

/**
 * Initialize the Dicoogle access object, which can be used multiple times.
 *
 * @param {string} [url] the controller service's base url, can be null iif the endpoint is the browser context's host or the access object is already created
 * @param {DicoogleClientOptions} options a set of options regarding service access and user authentication
 * @returns {Object} a singleton dicoogle service access object
 */
export default function dicoogleClient(url, options = {}) {
    if (socket_ && (!url || url === socket_.getBase())) {
        return m;
    }

    if (url && url !== '') {
        if (url.indexOf('://') === -1) {
            url = (options.secure ? 'https://' : 'http://') + url;
        }
    }

    socket_ = new Socket(url, options.token);
    if (typeof options.token === 'string') {
        socket_.setToken(options.token);
    }

    m.tasks = new Tasks(socket_);
    m.storage = new StorageService(socket_);
    m.queryRetrieve = new QueryRetrieveService(socket_);

    return m;
}
