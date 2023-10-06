/*
 * Copyright (C) 2017  Universidade de Aveiro, DETI/IEETA, Bioinformatics Group - http://bioinformatics.ua.pt/
 *
 * This file is part of Dicoogle/dicoogle-client-js.
 *
 * Dicoogle/dicoogle-client-js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Dicoogle/dicoogle-client-js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Dicoogle.  If not, see <http://www.gnu.org/licenses/>.
 */

import Endpoints from './endpoints.js';
import {Socket} from './socket.js';
import {andCall, andCallVoid} from './util.js';

/** Configuration object for a DICOM service. */
export interface ServiceConfiguration {
  /** whether to enable or disable the service */
  running?: boolean,
  /** whether the service should start automatically */
  autostart?: boolean,
  /** the TCP port that the service should listen to */
  port?: number,
}

/** Full status of the DICOM service. */
export interface ServiceStatus {
  /** whether the service is currently running */
  isRunning: boolean,
  /** whether the service starts automatically */
  autostart: boolean,
  /** the TCP port that the service listens to */
  port: number,
}

/** A DICOM service change outcome object,
 * obtained when changing one or more properties of a service.
 * 
 * If successful, the properties changed will be replicated in this object.
 */
export interface ServiceChangeOutcome extends ServiceConfiguration {
  /** whether the DICOM service update was successful */
  success: boolean,
}

export interface RemoteStorage {
  /// {string} aetitle
  aetitle: string,
  /// {string} ip
  ip: string,
  /// {number} port
  port: number,
  /// {?string} description
  description?: string,
  /// {?boolean} public
  public?: boolean,
}

export interface DicomQuerySettings {
  [key: string]: any,
}

/** @private */
class BaseService {

  protected _socket: Socket;
  protected _endpoint: string;

  constructor(socket: Socket, endpoint: string) {
    this._socket = socket;
    this._endpoint = endpoint;
  }

  /**
   * Obtain information about this DICOM service.
   * @param callback the callback function
   */
  getStatus(callback?: (error: Error | null, conf?: ServiceStatus) => void): Promise<ServiceStatus> {
    return andCall(this._socket.get(this._endpoint)
      .type('application/json')
      .then((resp) => resp.body), callback);
  }

  /**
   * Define the base configurations of this service.
   * @param config a set of properties to configure
   * @param callback the callback function
   */
  configure(config: ServiceConfiguration, callback?: (error: Error | null, outcome: ServiceChangeOutcome | undefined) => void): Promise<ServiceChangeOutcome> {
    const {running, autostart, port} = config;
    return andCall(this._socket.post(this._endpoint)
      .query({running, autostart, port})
      .then((resp) => resp.body), callback);
  }

  /**
   * Start the DICOM service.
   * @param callback the callback function
   */
  start(callback?: (error: Error | null) => void): Promise<void> {
    return andCallVoid(this._socket.post(this._endpoint)
        .query({ running: true }), callback);
  }

  /**
   * Stop the DICOM service.
   * @param callback the callback function
   */
  stop(callback?: (error: Error | null) => void): Promise<void> {
    return andCallVoid(this._socket.post(this._endpoint)
      .query({ running: false }), callback);
  }

}

export class StorageService extends BaseService {
    /** @private */
    constructor(socket: Socket) {
        super(socket, Endpoints.STORAGE_SERVICE);
    }

    /** Retrieve a list of the currently registered remote storage servers.
     * @param callback the callback function
     */
    getRemoteServers(callback?: (error: Error, storages?: RemoteStorage[]) => void): Promise<RemoteStorage[]> {
      return andCall(this._socket.get(Endpoints.DICOM_STORAGE_SETTINGS)
        .then((resp) => {
          return resp.body.map((store) => ({
            aetitle: store.AETitle,
            ip: store.ipAddrs,
            port: store.port,
            description: store.description,
            public: store.isPublic
          }));
        }), callback);
    }

    /** Add a remote storage server.
     * @param store the remote storage information object
     * @param callback the callback function
     */
    addRemoteServer(store: RemoteStorage, callback?: (error: Error | null) => void): Promise<void> {
      const {aetitle, ip, port, description} = store;
      return andCallVoid(this._socket.post(Endpoints.DICOM_STORAGE_SETTINGS)
        .query({
          type: "add",
          aetitle, ip, port, description: description || '',
          public: store.public
        }), callback);
    }

    /** Remove a remote storage server. On success, the second callback argument will be
     * `true` if and only if the remote storage existed before the call.
     * @param store the storage's AE title or the storage object.
     * @param callback the callback function
     */
    removeRemoteServer(store: string | RemoteStorage, callback?: (error: Error | null, removed?: boolean) => void): Promise<void> {
      let qs;
      if (typeof store === 'string') {
        qs = {type: 'remove', aetitle: store};
      } else {
        const {aetitle, ip, port, description} = store;
        qs = {
          type: 'remove',
          aetitle,
          ip,
          port,
          description,
          public: store.public,
        };
      }
      return andCall(this._socket.post(Endpoints.DICOM_STORAGE_SETTINGS)
        .query(qs)
        .then((resp) => resp.body.removed), callback);
    }
}

export class QueryRetrieveService extends BaseService {
    /** @private */
    constructor(socket) {
        super(socket, Endpoints.QR_SERVICE);
    }

    /** Get all of the current DICOM Query-Retrieve settings.
     * @param callback the callback function
     */
    getDicomQuerySettings(callback?: (error: Error | null, outcome?: DicomQuerySettings) => void): Promise<DicomQuerySettings> {
      return andCall(this._socket.get(Endpoints.DICOM_QUERY_SETTINGS)
        .then((resp) => resp.body), callback);
    }

    /** Set a group of DICOM Query/Retrieve settings. The given object should contain valid field-value pairs.
     * @param fields a dictionary containing the fields and values as key-value pairs.
     * @param callback the callback function
     */
    setDicomQuerySettings(fields: DicomQuerySettings, callback?: (error: Error | null) => void): Promise<void> {
      return andCallVoid(this._socket.post(Endpoints.DICOM_QUERY_SETTINGS)
        .query(fields), callback);
    }
}
