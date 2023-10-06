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

/**
 * Dicoogle Service Wrapper
 */
import Endpoints from './endpoints';
import {Socket, UserInfo} from './socket';
import {StorageService, QueryRetrieveService} from './service';
import {Tasks} from './tasks';
import {UserService} from './users';
import {andCall, andCallVoid, isDicomUUID} from './util';
import {SuperAgentRequest} from 'superagent';
import { Presets } from './presets';

// re-export interfaces from submodules
export type { DicomQuerySettings, QueryRetrieveService, RemoteStorage, ServiceChangeOutcome, ServiceConfiguration, ServiceStatus, StorageService } from './service';
export type { Tasks, TaskInfo, TaskOutcome } from './tasks';
export type { UserService, User } from './users';
export type { Presets, ExportPreset } from './presets';
export type { UserInfo } from './socket';

// private variables of the module
/**@private
 */
let socket_: Socket;

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
    /** Whether to save and index thumbnails. type: boolean */
    INDEX_THUMBNAIL: 'thumbnail',
    /** The size of generated thumbnails in pixels. type: number */
    THUMBNAIL_SIZE: 'thumbnailSize',
    /** Listen for changes in the directory for automatic indexation. type: boolean */
    WATCHER: 'watcher',
});

/** Service settings fields
 * @enum {string}
 */
const ServiceSettings = Object.freeze({
    /** The service's port. type: number (integer) */
    PORT: 'path',
    /** Whether to start the service on server launch. type: boolean */
    AUTOSTART: 'autostart',
});

/** Options for the `login` method.  */
export interface DicoogleClientOptions {
  /** The same user's token of a previous session, used only for restoring previous (but recent) sessions. */
  token?: string,
  /** Whether to use HTTPS instead of HTTP, if no scheme is specified in the url. */
  secure?: boolean,
}

/** Options for the `search` method. */
export interface SearchOptions {
  /** Force whether the query is keyword-based, defaults to automatic detection.
   * _Note:_ This field is deprecated in Dicoogle 3.
   */
  keyword?: boolean,
  /** Whether to perform an automatic query expansion. This is usually only necessary
   * for query providers without free text query support.
   * _Note:_ Available since Dicoogle 3.
   */
  expand?: boolean,
  /** An array of query provider names, or a string of a provider, defaults to the server's default query provider(s) */
  provider?: string | string[],
  /** An array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @deprecated Please use `provider` instead.
   */
  providers?: string | string[],
  /** A set of field names to be passed to the query providers when requesting the query.
   * When empty, the server will provide a default set based on a few DICOM attributes.
   */
  field?: string | string[],
  /** Activate pagination by defining the size of the page.
   * _Note:_ Available since Dicoogle 2.4.0
   */
  psize?: number,
  /** When paginating, define the offset of the page to retrieve.
   * _Note:_ Available since Dicoogle 2.4.0
   */
  offset?: number,
}

/** Options for the `searchDIM` method. */
export interface SearchDIMOptions {
  /** Force whether the query is keyword-based, defaults to automatic detection.
   * _Note:_ This field is deprecated in Dicoogle 3.
   */
  keyword?: boolean,
  /** Whether to perform an automatic query expansion. This is usually only necessary
   * for query providers without free text query support.
   * _Note:_ Available since Dicoogle 3.
   */
  expand?: boolean,
  /** An array of query provider names, or a string of a provider, defaults to the server's default query provider(s) */
  provider?: string | string[],
  /** An array of query provider names, or a string of a provider, defaults to the server's default query provider(s)
   * @deprecated Please use `provider` instead.
   */
  providers?: string | string[],
  /** A set of field names to be passed to the query providers when requesting the query.
   * When empty, the server will provide a default set based on a few DICOM attributes.
   */
  field?: string | string[],
  /** Activate pagination by defining the size of the page (in number of patients).
   * _Note:_ Available since Dicoogle 2.4.0
   */
  psize?: number,
  /** When paginating, define the offset of the page to retrieve (in number of patients). */
  offset?: number,
  /** Define the depth of retrieval based on the DIM level.
   * _Note:_ Available since Dicoogle 2.4.0
   */
  depth?: DIMLevel,
}

/** Options for the `issueExport` method. */
export interface ExportOptions {
  /** Force whether the query is keyword-based, defaults to automatic detection */
  keyword?: boolean,
  /** An array of query provider names, or a string of a provider, defaults to the server's default query provider(s) */
  provider?: string | string[],
}

/** The level of DICOM information requested in a search,
 * from requesting only the number of records (`none`)
 * to requesting all information down to the images (`image`).
 */
export type DIMLevel = "none" | "patient" | "study" | "series" | "image";

/** An entry in the list of search results. */
export interface SearchResult {
  /** A dictionary of DICOM fields of this item,
   * indexed by DICOM tag keyword such as `SOPInstanceUID` and `Modality`.
   * 
   * Which fields are present depends on the list of requested fields.
   */
  fields: {
    [attribute: string]: string,
  },
  /** The unique URI which identifies the item in storage. */
  uri: string,
  score?: number,
}

export interface SearchOutcome {
  /** The list of results */
  results: SearchResult[],
  /** The time spent performing the search in the server, in milliseconds */
  elapsedTime: number,
}

export interface SearchDIMOutcome {
  /** The list of results */
  results: SearchPatientResult[],
  /** The time spent performing the search in the server, in milliseconds */
  elapsedTime: number,
}

export interface SearchPatientResult {
  id: string,
  name: string,
  gender: string,
  nStudies: number,
  birthdate: string,
  studies: SearchStudyResult[],
}

export interface SearchStudyResult {
  studyDate: string,
  studyDescription: string,
  studyInstanceUID: string,
  institutionName: string,
  modalities: string | string[],
  series: SearchSeriesResult[],
}

export interface SearchSeriesResult {
  serieNumber: number,
  serieInstanceUID: string,
  serieDescription: string,
  serieModality: string,
  images: SearchImageResult[],
}

export interface SearchImageResult {
  sopInstanceUID: string,
  uri: string,
  rawPath: string,
  filename: string,
}

export interface DumpOutcome {
  /** The contents of the requested item */
  results: SearchResult,
  /** The time spent performing the search in the server, in milliseconds */
  elapsedTime: number,
}

export interface LoginOutcome extends UserInfo {
  /** The current session token */
  token: string,
}

/** Indexer settings fields
 */
export interface IndexerSettings {
  /** The path to the directory to watch. */
  path?: string,
  /** Whether to index zip files. */
  zip?: boolean,
  /** The percentage of indexing effort (from 0 to 100). */
  effort?: number,
  /** Whether to index thumbnails. */
  thumbnail?: boolean,
  /** The size of generated thumbnails in pixels. */
  thumbnailSize?: number,
  /** Listen for changes in the directory for automatic indexing. */
  watcher?: boolean,
}

export interface TransferSyntax {
  uid: string,
  sop_name: string,
  options: TransferOption[],
}

export interface TransferOption {
  name: string,
  value: boolean,
}

/** Abridged information about a web UI plugin. */
export interface WebUIPlugin {
  name: string,
  version: string,
  description?: string,
  slotId: string,
  moduleFile?: string,
  caption?: string,
  roles?: string[],
  settings?: any,
}

/** 
 * An object describing a plugin installed in Dicoogle.
 */
export type PluginInfo = StoragePluginInfo | QueryPluginInfo | IndexPluginInfo | ServletPluginInfo;

/** 
 * A string identifying the specific type of plugin
 * which can be installed in Dicoogle.
 * It does not account for plugin sets or dead plugins.
 */
export type PluginType = "query" | "index" | "storage" | "servlet";

/** 
 * A string identifying the type of plugin to request via `getPlugins`.
 * It accounts for plugin types that exist in Dicoogle,
 * as well as plugin sets and dead plugins.
 */
export type PluginInfoType = PluginType | "set" | "dead";

export interface CommonPluginInfo {
  name: string,
  type: string,
  enabled: boolean,
}

export interface StoragePluginInfo extends CommonPluginInfo {
  type: "storage",
  scheme: string,
  default: null | boolean,
}

export interface QueryPluginInfo extends CommonPluginInfo {
  type: "query",
  dim: null | boolean,
}

export interface IndexPluginInfo extends CommonPluginInfo {
  type: "index",
  dim: null | boolean,
}

export interface ServletPluginInfo extends CommonPluginInfo {
  type: "servlet",
  endpoints?: null | string[],
}

export interface DeadPluginInfo {
  name: string,
  cause: {
    class: string,
    message: string,
  }
}

/** Response to plugin information. */
export interface PluginsResponse {
  plugins: PluginInfo[],
  sets: string[],
  dead: DeadPluginInfo[],
}

type password = string;

/** Client and main entrypoint to the Dicoogle web API.
 * 
 * Obtain an instance of this type by calling the default export 
 * or the export named `dicoogleClient`.
 */
export class DicoogleAccess {

  /** @private singleton module, do not use */
  static __MODULE__ = new DicoogleAccess();

  /**
   * @private Please use the `dicoogleClient` function
   */
  constructor() {
    // do nothing
  }

  public Endpoints = Endpoints;
  public IndexerSettings = IndexerSettings;
  public ServiceSettings = ServiceSettings;

  /** Task namespace */
  public tasks: Tasks;
  /** Storage service namespace */
  public storage: StorageService;
  /** Query/Retrieve service namespace */
  public queryRetrieve: QueryRetrieveService;
  /** users service namespace */
  public users: UserService;
  /** Export presets namespace */
  public presets: Presets;

  /**
   * Perform a text query.
   * @param query text query
   * @param callback the callback function providing the outcome
   */
  search(query: string, callback?: (error: any, outcome: SearchOutcome) => void): Promise<SearchOutcome>;

  /**
   * Perform a text query.
   * @param query text query
   * @param options a set of options related to the search
   * @param callback the callback function providing the outcome
   */
  search(query: string, options: SearchOptions, callback?: (error: any, outcome: SearchOutcome) => void): Promise<SearchOutcome>;

  search(query: string, arg1: SearchOptions | ((error: any, outcome: SearchOutcome) => void) = {}, arg2?: (error: any, outcome: SearchOutcome) => void): Promise<SearchOutcome> {
      let callback, options;
      if (!arg2 && (typeof arg1 === 'function' || arg1 === undefined)) {
        callback = arg1;
        options = {};
      } else {
        callback = arg2;
        options = arg1;
      }
      const provider = options.provider || options.providers;
      const keyword = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      const {field, psize, offset} = options;
      return andCall(this.request('GET', Endpoints.SEARCH)
        .query({
          query,
          keyword,
          field,
          provider,
          psize,
          offset
        }).then(res => res.body), callback);
  }

  /**
   * Perform a text query with DIM-formatted outcome.
   * @param query text query
   * @param callback the callback function providing the outcome
   */
  searchDIM(query: string, callback?: (error: Error | null, outcome?: SearchDIMOutcome) => void): Promise<SearchDIMOutcome>;
  /**
   * Perform a text query with DIM-formatted outcome.
   * @param query text query
   * @param options a hash of options related to the search
   * @param callback the callback function providing the outcome
   */
  searchDIM(query: string, options: SearchDIMOptions, callback?: (error: Error | null, outcome?: SearchDIMOutcome) => void): Promise<SearchDIMOutcome>;

  searchDIM(query: string, options?, callback?) {
      if (!callback && (typeof options === 'function' || options === undefined)) {
        callback = options;
        options = {};
      }
      const provider = options.provider || options.providers;
      const keyword = typeof options.keyword === 'boolean' ? options.keyword : !!query.match(/[^\s\\]:\S/);
      const {psize, offset, depth} = options;
      return andCall(this.request(Endpoints.SEARCH_DIM)
        .query({
          query,
          keyword,
          provider,
          psize,
          offset,
          depth
        }).then(res => res.body), callback);
  }

  /**
   * Retrieve an image's meta-data (perform an information dump)
   * @param uid the SOP instance UID
   * @param callback the callback function
   */
  dump(uid: string, callback?: (error: any, outcome?: DumpOutcome) => void): Promise<DumpOutcome>;
  /**
   * Retrieve an image's meta-data (perform an information dump)
   * @param uid the SOP instance UID
   * @param provider a list of provider plugins
   * @param callback the callback function
   */
  dump(uid: string, provider: string | string[], callback?: (error: any, outcome?: DumpOutcome) => void): Promise<DumpOutcome>;
  dump(uid: string, arg1: string | string[] | ((error: any, outcome?: DumpOutcome) => void), arg2?: (error: any, outcome?: DumpOutcome) => void) {
    let callback, provider;
    if (typeof arg1 === 'function' && !arg2 || arg1 === undefined) {
      callback = arg1;
      provider = undefined;
    } else {
      callback = arg2;
      provider = arg1;
    }
    return andCall(
      this.request('GET', Endpoints.DUMP).query({
        uid, provider
      }).then(res => res.body), callback);
  }

  /** Request a CSV file of the results.
   * @param query the query to perform
   * @param fields - a set of field names to be passed to the query providers when requesting
   * the query. The same fields will be provided in the resulting CSV file, in the given order.
   * @param options additional options
   * @param callback the callback function providing the UID of the file
   */
  issueExport(query: string, fields: string | string[], callback?: (error: any, uid?: string) => void): Promise<string>;
  issueExport(query: string, fields: string | string[], options: ExportOptions, callback?: (error: any, uid?: string) => void): Promise<string>;
  issueExport(query: string, fields: string | string[], options?, callback?): Promise<string> {
    if (typeof options === 'function' && !callback) {
      callback = options;
      options = {};
    }
    options = options ?? {};
    fields = [].concat(fields);
    const qs: any = {
      query, fields: JSON.stringify(fields)
    };
    if (typeof options.keyword === 'boolean') {
      qs.keyword = options.keyword;
    }
    if (options.provider) {
      qs.providers = options.provider;
    }
    return andCall(
      socket_.post(Endpoints.EXPORT)
        .query(qs)
        .then((resp) => {
          const outcome = JSON.parse(resp.text);
          if (!outcome || typeof outcome.uid !== 'string') {
            return Promise.reject(new Error("invalid output from server"));
          }
          return outcome.uid;
      }), callback);
  }

  /**
   * Retrieve a list of query provider plugins
   * @param callback the callback function
   */
  getProviders(callback?: (error: any, result?: string[]) => void): Promise<string[]>;

  /**
   * Retrieve a list of provider plugins
   * @param type the type of provider ("query", "index", ...) - defaults to "query"
   * @param callback the callback function
   */
  getProviders(type: string, callback?: (error: any, result?: string[]) => void): Promise<string[]>;

  getProviders(arg0: string | ((error:any, result?: string[]) => void), arg1?: (error:any, result?: string[]) => void) {
    let type, callback;
    if (typeof arg0 === 'function' && !arg1) {
      type = 'query';
      callback = arg0;
    } else {
      type = arg0;
      callback = arg1;
    }
    return andCall(this.request(Endpoints.PROVIDERS)
      .query({ type })
      .then(res => res.body), callback);
  }

  /**
   * Retrieve a list of query provider plugins
   * @param callback the callback function
   */
  getQueryProviders(callback?: (error: any, result?: string[]) => void): Promise<string[]> {
    return this.getProviders('query', callback);
  }

  /**
   * Retrieve a list of index provider plugins
   * @param callback the callback function
   */
  getIndexProviders(callback?: (error: any, result?: string[]) => void): Promise<string[]> {
    return this.getProviders('index', callback);
  }

  /** Retrieve a list of storage interface plugins
   * @param callback the callback function
   */
  getStorageProviders(callback?: (error: any, result?: string[]) => void): Promise<string[]> {
    return this.getProviders('storage', callback);
  }

  /**
   * Request a new indexing task over a given URI. The operation is recursive, indexing anything in the URI's endpoint.
   * @param uri a URI or array of URIs representing the root resource of the files to be indexed
   * @param callback the function to call when the task is successfully issued
   */
  index(uri: string | string[], callback?: (error: any) => void): Promise<void>;

  /**
   * Request a new indexation task over a given URI. The operation is recursive, indexing anything in the URI's endpoint.
   * @param uri a URI or array of URIs representing the root resource of the files to be indexed
   * @param provider a provider or array of provider names in which the indexation will carry out, all by default
   * @param callback the function to call when the task is successfully issued
   */
  index(uri: string | string[], provider: string | string[], callback?: (error: any) => void): Promise<void>;
  index(uri: string | string[], provider: string | string[] | ((error: any) => void), callback?: (error: any) => void) {
    if (typeof provider === 'function' && !callback) {
      callback = provider;
      provider = undefined;
    }
    return andCallVoid(this.request('POST', Endpoints.INDEX).query({
      uri,
      plugin: provider
    }), callback);
  }

  /** Retrieve the Dicoogle server's log text.
   * @param callback the callback function
   */
  getRawLog(callback?: (error: any, text?: string) => void): Promise<string> {
    return andCall(
      this.request(Endpoints.LOGGER)
        .type('text/plain')
        .then(res => res.text), callback);
  }

  /**
   * Request that the file at the given URI is unindexed. The operation, unlike index(), is not recursive.
   * @param uri a URI or array of URIs representing the files to be unindexed
   * @param callback the function to call on completion
   */
  unindex(uri: string | string[], callback?: (error: any) => void): Promise<void>;
  /**
   * Request that the file at the given URI is unindexed. The operation, unlike index(), is not recursive.
   * @param uri a URI or array of URIs representing the files to be unindexed
   * @param provider a provider or array of provider names in which the unindexation will carry out, all by default
   * @param callback the function to call on completion
   */
  unindex(uri: string | string[], provider: string | string[], callback?: (error: any) => void): Promise<void>;
  unindex(uri: string | string[], provider?: string | string[] | ((error: any) => void), callback?: (error: any) => void) {
    if (typeof provider === 'function' && !callback) {
      callback = provider;
      provider = undefined;
    }

    if (Array.isArray(uri) && uri.length > 1) {
      // send URIs as form data to prevent URI from being too long
      const body = uri.map(uri => 'uri=' + encodeURIComponent(uri)).join('&');

      return andCallVoid(this.request('POST', Endpoints.UNINDEX)
        .type('form')
        .query({provider})
        .send(body), callback);
    } else {
      return andCallVoid(this.request('POST', Endpoints.UNINDEX)
        .query({
          uri,
          provider
        }), callback);
    }
  }

  /** Request that the file at the given URI is permanently removed. The operation, unlike index(), is not recursive.
   * Indices will not be updated, hence the files should be unindexed manually if so is intended.
   * @param uri a URI or array of URIs representing the files to be removed
   * @param callback the function to call on completion
   */
  remove(uri: string | string[], callback?: (error: any) => void): Promise<void> {
    if (Array.isArray(uri) && uri.length > 1) {
      // send URIs as form data to prevent URI from being too long
      return andCallVoid(this.request('POST', Endpoints.REMOVE)
        .type('form')
        .send(uri.map(uri => 'uri=' + encodeURIComponent(uri)).join('&')), callback);
    } else {
      return andCallVoid(this.request('POST', Endpoints.REMOVE)
        .query({
          uri
        }), callback);
    }
  }

  /** Retrieve the running Dicoogle version.
   * @param callback the callback function
   */
  getVersion(callback?: (error: any, outcome: {version: string}) => void): Promise<{version: string}> {
    return andCall(this.request(Endpoints.VERSION).then(res => res.body), callback);
  }

  /** Retrieve information about currently installed web UI plugins.
   * @param slotId the identifiers of slots to contemplate,
   *        retrieve all kinds if empty or null
   * @param callback the callback function
   */
  getWebUIPlugins(slotId?: string | null, callback?: (error: any, plugins?: WebUIPlugin[]) => void): Promise<WebUIPlugin[]> {
    return andCall(this.request(Endpoints.WEBUI)
      .query(slotId ? {'slot-id': slotId} : {})
      .then((res) => {
        const outcome = res.body;
        if (!outcome || !outcome.plugins) {
          return Promise.reject(new Error("invalid output from server"));
        }
        const {plugins} = outcome;
        return plugins.map(p => {
          p.slotId = p['slot-id'] || p.dicoogle['slot-id'];
          p.moduleFile = p['module-file'] || p.dicoogle['module-file'];
          if (!p.caption) {
            p.caption = p.dicoogle.caption;
          }
          if (!p.roles) {
            p.roles = p.dicoogle.roles;
          }
          return p;
        });
    }), callback);
  }

  /** Obtain a detailed description of all plugins installed.
   * 
   * **Note:** Requires Dicoogle 3.
   * 
   * @param callback the callback function
   */
  getPlugins(callback?: (error: any, response?: PluginsResponse) => void): Promise<PluginsResponse>;

  /** Obtain a detailed description of plugins of the given type or category.
   * 
   * **Note:** Requires Dicoogle 3.
   * 
   * @param type the type of plugins or information to include in the response
   * @param callback the callback function
   */
  getPlugins(type: PluginInfoType, callback?: (error: any, response?: Partial<PluginsResponse>) => void): Promise<Partial<PluginsResponse>>;

  getPlugins(type: PluginInfoType | ((error: any, response?: PluginsResponse | Partial<PluginsResponse>) => void), callback?: (error: any, response?: PluginsResponse | Partial<PluginsResponse>) => void): Promise<PluginsResponse | Partial<PluginsResponse>> {

    let req: SuperAgentRequest;
    if (typeof type === 'string') {

      req = this.request([Endpoints.PLUGINS, type]);
    } else {
      if (typeof type === 'function' && !callback) {
        callback = type;
      }
  
      req = this.request(Endpoints.PLUGINS);
    }

    return andCall(req.then(res => res.body), callback);
  }

  /** Enable a plugin.
   * 
   * **Note:** Requires Dicoogle 3.
   * 
   * @param type the type of plugin
   * @param name the name of the plugin
   * @param callback the callback function
   */
  enablePlugin(type: PluginType, name: string, callback?: (error?: Error) => void): Promise<void> {
    return andCall(this.request('POST', [Endpoints.PLUGINS, type, name, 'enable'])
      .then((_) => { /* discard response */ }), callback);
  }

  /** Disable a plugin.
   * 
   * **Note:** Requires Dicoogle 3.
   * 
   * @param type the type of plugin
   * @param name the name of the plugin
   * @param callback the callback function
   */
  disablePlugin(type: PluginType, name: string, callback?: (error?: Error) => void): Promise<void> {
    return andCall(this.request('POST', [Endpoints.PLUGINS, type, name, 'disable'])
      .then((_) => { /* discard response */ }), callback);
  }

  /**
   * [EXPERTS] Retrieve the authentication token. This token is ephemeral and may expire after some time.
   * This method is synchronous.
   * Use it only when you know what you are doing.
   * @returns the user's current authentication token, null if the user is not authenticated
   */
  getToken(): string | null {
    return socket_.getToken();
  }

  /**
   * [EXPERTS] Assign the module's session token internally. This method is synchronous.
   * Use it only when you know what you are doing. When restoring a previous (but still
   * living) session, please prefer {@link restoreSession} instead.
   * 
   * @param token the same user's token of a previous session
   */
  setToken(token: string) {
    if (typeof token === 'string') {
      socket_.setToken(token);
    }
  }

  /**
   * [EXPERTS] Clear this object's user session information. This method is synchronous.
   * Use it only when you know what you are doing.
   */
  reset() {
    socket_.reset();
  }

  /**
   * Check whether the user is authenticated to the server. Authenticated clients will hold an
   * authentication token.
   * @returns whether the user is authenticated or not.
   */
  isAuthenticated(): boolean {
    return socket_.hasToken();
  }

  /**
   * Get the user name of the currently authenticated user.
   * @returns {string} the unique user name, null if the use is not authenticated
   */
  getUsername(): string | null {
    return socket_.getUsername();
  }

  /**
   * Get the names of the roles assigned to this user.
   * @returns an array of role names, null if the user is not authenticated
   */
  getRoles(): string[] | null {
    return socket_.getRoles();
  }
  
  /**
   * Manually log in to Dicoogle using the given credentials.
   * @param username the unique user name for the client
   * @param password the user's password for authentication
   * @param callback the callback function providing the authentication token and user information
   */
  login(username: string, password: password, callback?: (error:any, outcome?: LoginOutcome) => void): Promise<LoginOutcome> {
    return andCall(socket_.login(username, password), callback);
  }

  /**
   * Restore a living Dicoogle session identified by the given token.
   * @param token the same user's token of a previous session
   * @param callback the callback function providing user information
   */
  restoreSession(token: string, callback?: (error: any, outcome?: UserInfo) => void): Promise<UserInfo> {
    return andCall(socket_.restore(token), callback);
  }

  /**
   * Log out from the server.
   * @param callback the callback function
   */
  logout(callback?: (error: any) => void): Promise<void> {
    return andCall(socket_.logout(), callback);
  }

  /** Get the current Indexer settings. Unless a specific field is mentioned, all
   * indexer settings will be provided. The type of the given outcome depends on
   * whether a particular field was chosen or all of them were requested.
   * @param {string} [field] a particular field to retrieve
   * @param {function(error:any, outcome:any)} callback the callback function
   */
  getIndexerSettings(callback?: (error: any, outcome?: IndexerSettings) => void): Promise<IndexerSettings>;
  getIndexerSettings<T>(field: string, callback?: (error: any, outcome?: T) => void): Promise<T>;
  getIndexerSettings(field: string | ((error: any, outcome?: IndexerSettings) => void), callback?: (error: any, outcome?: any) => void) {
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

    return andCall(socket_.get(url).then((res) => {
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
        return out;
    }), callback);
  }

  /** Set a portions of the Indexer settings.
   * @param fields a dictionary of settings and their respective values
   * @param callback the callback function
   */
  setIndexerSettings(fields: {[fieldName: string]: any}, callback?: (error: any) => void): Promise<void>;

  /** Set a particular Indexer setting. A valid field and value is required.
   * @param fieldName either a dictionary of settings or the name of a particular field to set
   * @param value the value to assign to the field, required the first argument is a string
   * @param callback the callback function
   */
  setIndexerSettings(fieldName: string, value: any, callback?: (error: any) => void): Promise<void>;

  setIndexerSettings(fields, value, callback?): Promise<void> {
    if (typeof fields === 'string') {
        const field = fields === 'thumbnail' ? 'saveThumbnail' : fields;
        fields = {};
        fields[field] = value;
    } else {
        fields.saveThumbnail = fields.saveThumbnail || fields.thumbnail;
        callback = value;
    }
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production') {
        const values = Object.keys(IndexerSettings).map(k => IndexerSettings[k]);
        values.push('saveThumbnail')
        for (const field in fields) {
            if (values.indexOf(field) === -1) {
                /* eslint-disable no-console */
                console.error(`Warning: Attempting to set unrecognized indexer setting '${field}'.`);
                /* eslint-enable no-console */
            }
        }
    }

    return andCallVoid(this.request('POST', Endpoints.INDEXER_SETTINGS)
      .query(fields), callback);
  }

  /** Get the list of current transfer syntax settings available.
   * @param callback the callback function
   */
  getTransferSyntaxSettings(callback?: (error: any, outcome?: TransferSyntax[]) => void): Promise<TransferSyntax[]> {
    return andCall(socket_.get(Endpoints.TRANSFER_SETTINGS)
        .then((res) => {
          // parsing the contents as JSON manually because
          // old Dicoogle versions would not indicate the content type  
          return JSON.parse(res.text);
        }), callback);
  }

  /** Set (or reset) an option of a particular transfer syntax.
   * @param uid the unique identifier of the transfer syntax
   * @param option the name of the option to modify
   * @param value whether to set (true) or reset (false) the option
   * @param callback the callback function
   */
  setTransferSyntaxOption(uid: string, option: string, value: boolean, callback?: (error: any) => void): Promise<void> {
      return andCallVoid(
        this.request('POST', Endpoints.TRANSFER_SETTINGS)
          .query({uid, option, value}), callback);
  }

  /** Retrieve the AE title of the Dicoogle archive.
   * @param callback the callback function
   */
  getAETitle(callback?: (error: any, aetitle?: string) => void): Promise<string> {
      return andCall(this.request(Endpoints.DICOM_AETITLE_SETTINGS)
        .then((res) => {
          const outcome = res.body;
          const ae = outcome && outcome.aetitle;
          if (!ae) {
            return Promise.reject(new Error("Missing server content"));
          }
          return ae;
        }), callback);
  }

  /** Redefine the AE title of the Dicoogle archive.
   * @param aetitle a valid AE title for the PACS archive
   * @param callback the callback function
   */
  setAETitle(aetitle: string, callback?: (error: any) => void): Promise<void> {
    return andCallVoid(
      this.request('PUT', Endpoints.DICOM_AETITLE_SETTINGS)
        .query({ aetitle }
      ), callback);
  }

  /**
   * Perform a generic GET request to Dicoogle's services. Users of this method can invoke any REST
   * service exposed by Dicoogle, including those from plugins. The resulting object is the start
   * of a SuperAgent request.
   *
   * @param uri a URI or array of resource sequences to the service, relative
   *            to Dicoogle's base URL. There should be no leading slash ('/').
   * @returns a superagent request object
   */
  request(uri: string | string[]): SuperAgentRequest;

  /**
   * Perform a generic request to Dicoogle's services. Users of this method can invoke any REST
   * service exposed by Dicoogle, including those from plugins. The resulting object is the start
   * of a SuperAgent request.
   *
   * @param method the kind of HTTP method to make, defaults to "GET"
   * @param uri a URI or array of resource sequences to the service, relative
   *            to Dicoogle's base URL. There should be no leading slash ('/').
   * @returns a superagent request object
   */
  request(method: string, uri: string | string[]): SuperAgentRequest;

  request(method, uri?: string | string[]) {
    if (!uri) {
      uri = method;
      method = 'GET';
    }
    return socket_.request(method, uri);
  }

  /** Obtain the base URL of all Dicoogle services.
   * This method is synchronous.
   * @returns {string} the currently configured base endpoint of Dicoogle
   */
  getBase(): string {
    return socket_.getBase();
  }

  /** Obtain a URL pointing to an item's thumbnail.
   * This function is synchronous.
   * 
   * @param id a SOPInstanceUID or URI of the item
   * @param frame the frame number, if applicable
   * @returns the full URL to the thumbnail
   */
  getThumbnailUrl(id: string, frame?: number): string {
    let qs = isDicomUUID(id) ? `SOPInstanceUID=${id}` : `uri=${id}`;
    if (typeof frame === 'number') {
        qs += '&frame=' + frame
    }
    return `${socket_.getBase()}/dic2png?thumbnail=true&${qs}`;
  }

  /** Obtain a URL pointing to an item's quick preview of the image.
   * This function is synchronous.
   * 
   * @param id a SOPInstanceUID or URI of the item
   * @param frame the frame number, if applicable
   * @returns the full URL to the preview
   */
  getPreviewUrl(id: string, frame?: number): string {
    let qs = isDicomUUID(id) ? `SOPInstanceUID=${id}` : `uri=${id}`;
    if (typeof frame === 'number') {
        qs += '&frame=' + frame
    }
    return `${socket_.getBase()}/dic2png?${qs}`;
  }
}

/** @private singleton module */
const m: DicoogleAccess = DicoogleAccess.__MODULE__;

/**
 * Initialize the Dicoogle access object, which can be used multiple times.
 *
 * @param url the controller service's base url, can be null iif the endpoint is the browser context's host or the access object is already created
 * @param options a set of options regarding service access and user authentication
 * @returns a singleton dicoogle service access object
 */
export function dicoogleClient(url?: string, options: DicoogleClientOptions = {}): DicoogleAccess {
    if (socket_ && (!url || url === socket_.getBase())) {
        return m;
    }

    if (url && url !== '') {
        if (url.indexOf('://') === -1) {
            url = (options.secure ? 'https://' : 'http://') + url;
        }
    }

    socket_ = new Socket(url);
    if (typeof options.token === 'string') {
        socket_.setToken(options.token);
    }

    m.tasks = new Tasks(socket_);
    m.storage = new StorageService(socket_);
    m.queryRetrieve = new QueryRetrieveService(socket_);
    m.users = new UserService(socket_);
    m.presets = new Presets(socket_);

    return m;
}
export default dicoogleClient;
