import Endpoints from './endpoints';

/** @typedef {Object} ServiceConfiguration
 * @param {?boolean} running
 * @param {?boolean} autostart
 * @param {?number} port
 */

/** @typedef {Object} RemoteStorage
 * @param {string} aetitle
 * @param {string} ip
 * @param {number} port
 * @param {?string} description
 * @param {?boolean} public
 */

class BaseService {

  constructor(socket, endpoint) {
    /** @private */
    this._socket = socket;
    /** @private */
    this._endpoint = endpoint;
  }

  /**
   * Obtain information about the DICOM Storage service.
   * @param {function(error: Error, conf:ServiceConfiguration)} callback the callback function
   */
  getStatus(callback) {
    this._socket.request('GET', this._endpoint)
        .type('application/json')
        .end(function(err, resp) {
          callback(err, err ? null : resp.body);
        });
  }

  /**
   * Define the base configurations of the DICOM Storage service.
   * @param {ServiceConfiguration} config a set of properties to configure (currently `running`, `autostart` and/or `port`)
   * @param {function(error: Error)} callback the callback function
   */
  configure(config, callback) {
    const {running, autostart, port} = config;
    this._socket.request('POST', this._endpoint)
      .query({running, autostart, port})
      .end(callback);
  }

  /**
   * Start the DICOM Storage service.
   * @param {function(error: Error)} callback the callback function
   */
  start(callback) {
    this._socket.request('POST', this._endpoint)
        .query({ running: true })
        .end(callback);
  }

  /**
   * Stop the DICOM Storage service.
   * @param {function(error: Error)} callback the callback function
   */
  stop(callback) {
    this._socket.request('POST', this._endpoint)
        .query({ running: false })
        .end(callback);
  }

}

export class StorageService extends BaseService {
    constructor(socket) {
        super(socket, Endpoints.STORAGE_SERVICE);
    }

    /** Retrieve a list of the currently registered remote storage servers.
     * @param {function(error: Error, storages: RemoteStorage[])} callback the callback function
     */
    getRemoteServers(callback) {
      this._socket.request('GET', Endpoints.DICOM_STORAGE_SETTINGS)
          .end(function(err, resp) {
            if (err) {
              callback(err);
              return;
            }
            callback(err, resp.body.map((store) => ({
              aetitle: store.AETitle,
              ip: store.ipAddrs,
              port: store.port,
              description: store.description,
              public: store.isPublic
            })));
          });
    }

    /** Add a remote storage server.
     * @param {RemoteStorage} store the remote storage information object
     * @param {function(error: Error)} callback the callback function
     */
    addRemoteServer(store, callback) {
      const {aetitle, ip, port, description} = store;
      this._socket.request('POST', Endpoints.DICOM_STORAGE_SETTINGS)
          .query({
            type: "add",
            aetitle, ip, port, description,
            public: store.public
          })
          .end(callback);
    }

    /** Remove a remote storage server. On success, the second callback argument will be
     * `true` if and only if the remote storage existed before the call.
     * @param {string|RemoteStorage} store the storage's AE title or the storage object.
     * @param {function(error: Error, removed: boolean)} callback the callback function
     */
    removeRemoteServer(store, callback) {
      const qs = {type: 'remove'};
      if (typeof store === 'string') {
        qs.aetitle = store;
      } else {
        const {aetitle, ip, port, description} = store;
        qs.aetitle = aetitle;
        qs.ip = ip;
        qs.port = port;
        qs.description = description;
        qs.public = store.public;
      }
      this._socket.request('POST', Endpoints.DICOM_STORAGE_SETTINGS)
          .query(qs)
          .end(function(err, resp) {
            if (err) {
              callback(err);
              return;
            }
            callback(null, resp.body.removed);
          });
    }
}

export class QueryRetrieveService extends BaseService {
    constructor(socket) {
        super(socket, Endpoints.QR_SERVICE);
    }

    /** Get all of the current DICOM Query-Retrieve settings.
     * @param {function(error: Error, outcome: DicomQuerySettings)} callback the callback function
     */
    getDicomQuerySettings(callback) {
        this._socket.request('GET', Endpoints.DICOM_QUERY_SETTINGS)
          .end(function(err, resp) {
            if (err) {
              callback(err);
              return;
            }
            callback(null, resp.body);
          });
    }

    /** Set a group of DICOM Query/Retrieve settings. The given object should contain valid field-value pairs.
     * @param {DicomQuerySettings} fields a dictionary containing the fields and values as key-value pairs.
     * @param {function(error: Error)} callback the callback function
     */
    setDicomQuerySettings(fields, callback) {
      this._socket.request('POST', Endpoints.DICOM_QUERY_SETTINGS)
          .query(fields)
          .end(callback);
    }
}
