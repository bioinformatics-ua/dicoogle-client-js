import Endpoints from './endpoints';

/** @typedef {Object} ServiceConfiguration
 * @param {?boolean} running
 * @param {?boolean} autostart
 * @param {?number} port
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
   * @param {function(error:any, conf:ServiceConfiguration)} callback the callback function
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
   * @param {function(error:any)} callback the callback function
   */
  configure(config, callback) {
    const {running, autostart, port} = config;
    this._socket.request('POST', this._endpoint)
      .query({running, autostart, port})
      .end(function(err, data) {
        callback(err, err ? null : data);
      });
  }

  /**
   * Start the DICOM Storage service.
   * @param {function(error:any)} callback the callback function
   */
  start(callback) {
    this._socket.request('POST', this._endpoint)
        .query({ running: true })
        .end(callback);
  }

  /**
   * Stop the DICOM Storage service.
   * @param {function(error:any)} callback the callback function
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
}

export class QueryRetrieveService extends BaseService {
    constructor(socket) {
        super(socket, Endpoints.QR_SERVICE);
    }
}
