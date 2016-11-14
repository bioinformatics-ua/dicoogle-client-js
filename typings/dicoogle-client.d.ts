
declare module "dicoogle-client" {

    type password = string;

    /** Web service endpoints
     * @enum {string}
     */
    export const Endpoints : { [e: string]: string };

    export interface DicoogleClientOptions {
        token?: string
        secure?: boolean
    }

   /**
    * Initialize and provide the Dicoogle access object, which can be used multiple times.
    *
    * @param url the controller service's base url, can be null iif the endpoint is the browser context's host or the access object is already created
    * @param options a set of options regarding service access and user authentication
    * @returns a singleton dicoogle service access object
    */
    export default function dicoogleClient(url?: string, options?: DicoogleClientOptions): DicoogleAccess;

    export interface SearchOptions {
        /** Force whether the query is keyword-based, defaults to automatic detection */
        keyword?: boolean
        /** An array of query provider names, or a string of a provider, defaults to the server's default query provider(s) */
        provider?: string | string[]
        /** A set of field names to be passed to the query providers when requesting the query.
         * When empty, the server will provide a default set based on a few DICOM attributes.
         */
        field?: string | string[]
        /** Activate pagination by defining the size of the page.
         * _Note:_ Available since Dicoogle 2.4.0
         */
        psize?: number;
        /** When paginating, define the offset of the page to retrieve.
         * _Note:_ Available since Dicoogle 2.4.0
         */
        offset?: number;
        /**
         * Return the results as a DICOM Object Model tree (Patients -> Studies -> Series -> Instances), false by default
         * @deprecated use method #searchDIM instead
         */
        dim?: boolean
    }

    export interface SearchDIMOptions {
        /** Force whether the query is keyword-based, defaults to automatic detection */
        keyword?: boolean
        /** An array of query provider names, or a string of a provider, defaults to the server's default query provider(s) */
        provider?: string | string[]
        /** A set of field names to be passed to the query providers when requesting the query.
         * When empty, the server will provide a default set based on a few DICOM attributes.
         */
        field?: string | string[]
        /** Activate pagination by defining the size of the page (in number of patients).
         * _Note:_ Available since Dicoogle 2.4.0
         */
        psize?: number;
        /** When paginating, define the offset of the page to retrieve (in number of patients). */
        offset?: number;
        /** Define the depth of retrieval based on the DIM level.
         * _Note:_ Available since Dicoogle 2.4.0
         */
        depth?: DIMLevel;
    }

    export type DIMLevel = "none" | "patient" | "study" | "series" | "image";

    export interface SearchResult {
        [attribute: string]: any
        uri: string
        score?: number
    }

    export interface SearchOutcome {
        /** The list of results */
        results: SearchResult[]
        /** The time spent performing the search in the server, in milliseconds */
        elapsedTime: number
    }

    export interface SearchDIMOutcome {
        /** The list of results */
        results: SearchPatientResult[]
        /** The time spent performing the search in the server, in milliseconds */
        elapsedTime: number
    }

    export interface SearchPatientResult {
        id: string
        name: string
        gender: string
        nStudies: number
        birthdate: string
        studies: SearchStudyResult[]
    }

    export interface SearchStudyResult {
        studyDate: string
        studyDescription: string
        studyInstanceUID: string
        institutionName: string
        modalities: string | string[]
        series: SearchSeriesResult[]
    }

    export interface SearchSeriesResult {
        serieNumber: number
        serieInstanceUID: string
        serieDescription: string
        serieModality: string
        images: SearchImageResult[]
    }

    export interface SearchImageResult {
        sopInstanceUID: string
        uri: string
        rawPath: string
        filename: string
    }

    export interface DumpOutcome {
        /** The contents of the requested item */
        results: SearchResult
        /** The time spent performing the search in the server, in milliseconds */
        elapsedTime: number
    }

    export interface ServiceStatus {
        running: boolean
        autostart: boolean
        port: number
    }

    export interface LoginOutcome {
        /** The user's unique name */
        user: string
        /** The current session token */
        token: string
        /** The current user's assigned roles */
        roles: string[]
        /** Whether this user is an administrator */
        admin: boolean
    }

    export interface TaskInfo {
        /** the UUID of the task */
        taskUid: string
        /** a human readable task name */
        taskName: string
        /** a number between 0 and 1 representing the task's progress; any negative number means that no prediction is available */
        taskProgress: number
        /** whether the task is complete, assume not if not provided */
        complete?: boolean
        /** only if complete; the time elapsed while the task was running, in milliseconds */
        elapsedTime?: number
        /** only if complete; the number of files successfully indexed */
        nIndexed?: number
        /** only if complete; the number of indexation errors */
        nErrors?: number
    }

    /** Indexer settings fields
     */
    export interface IndexerSettings {
        /** The path to the directory to watch. */
        path?: string
        /** Whether to index zip files. */
        zip?: boolean
        /** The percentage of indexation effort (from 0 to 100). */
        effort?: number
        /** Whether to index thumbnails. */
        thumbnail?: boolean
        /** The size of generated thumbnails in pixels. */
        thumbnailSize?: number
        /** Listen for changes in the directory for automatic indexation. */
        watcher?: boolean
    }

    /** DICOM Query/Retrieve settings fields
     */
    export interface DicomQuerySettings {
        acceptTimeout?: number
        connectionTimeout?: number
        idleTimeout?: number
        maxAssociations?: number
        maxPduReceive?: number
        maxPduSend?: number
        responseTimeout?: number
    }

    export interface TransferSyntax {
        uid: string
        sop_name: string
        options: TransferOption[]
    }

    export interface TransferOption {
        name: string
        value: boolean
    }

    /** Abridged information about a web UI plugin. */
    export interface WebUIPlugin {
        name: string
        version: string
        description?: string
        slotId: string
        moduleFile?: string
        caption?: string
        roles?: string[]
        settings?: any
    }

    export interface DicoogleAccess {

        /**
         * Perform a text query.
         * @param query the text query
         * @param callback the callback function providing the outcome
         */
        search(query: string, callback: (error: Error, outcome: SearchOutcome) => any);
        /**
         * Perform a text query.
         * @param query the text query
         * @param options a hash of options related to the search
         * @param callback the callback function providing the outcome
         */
        search(query: string, options: SearchOptions, callback: (error: Error, outcome: SearchOutcome) => any);

        /**
         * Perform a text query with DIM-formatted outcome.
         * @param query the text query
         * @param callback the callback function providing the outcome
         */
        searchDIM(query: string, callback: (error: Error, outcome: SearchDIMOutcome) => any);
        /**
         * Perform a text query with DIM-formatted outcome.
         * @param query the text query
         * @param options a hash of options related to the search
         * @param callback the callback function providing the outcome
         */
        searchDIM(query: string, options: SearchDIMOptions, callback: (error: Error, outcome: SearchDIMOutcome) => any);

        /**
         * Retrieve an image's meta-data (perform an information dump)
         * @param uid the SOP instance UID
         * @param callback the callback function
         */
        dump(uid: string, callback: (error: Error, outcome: SearchOutcome) => any);
        /**
         * Retrieve an image's meta-data (perform an information dump)
         * @param uid the SOP instance UID
         * @param provider a list of provider plugins
         * @param callback the callback function
         */
        dump(uid: string, provider: string | string[], callback: (error: Error, outcome: SearchOutcome) => any);

        /**
         * Retrieve a list of provider plugins
         * @param type the type of provider ("query", "index", ...) - defaults to "query"
         * @param callback the callback function
         */
        getProviders(type: string, callback: (error: Error, outcome: string[]) => any);
        /**
         * Retrieve a list of query provider plugins
         * @param callback the callback function
         */
        getProviders(callback: (error: Error, outcome: string[]) => any);

        /**
         * Retrieve a list of query provider plugins
         * @param callback the callback function
         */
        getQueryProviders(callback: (error: Error, outcome: string[]) => any);

        /**
         * Retrieve a list of index provider plugins
         * @param callback the callback function
         */
        getIndexProviders(callback: (error: Error, outcome: string[]) => any);

        /**
         * Retrieve a list of storage provider plugins
         * @param callback the callback function
         */
        getStorageProviders(callback: (error: Error, outcome: string[]) => any);

        /**
         * Obtain information about the DICOM Storage service.
         * @param callback the callback function
         */
        getStorageServiceStatus(callback: (error: Error, outcome: ServiceStatus) => any);

        /**
         * Start the DICOM Storage service.
         * @param callback the callback function
         */
        startStorageService(callback: (error: Error) => any);

        /**
         * Stop the DICOM Storage service.
         * @param callback the callback function
         */
        stopStorageService(callback: (error: Error) => any);

        /**
         * Obtain information about the DICOM Query/Retrieve service.
         * @param callback the callback function
         */
        getQueryRetrieveServiceStatus(callback: (error: Error, outcome: ServiceStatus) => any);

        /**
         * Start the DICOM Query/Retrieve service.
         * @param callback the callback function
         */
        startQueryRetrieveService(callback: (error: Error) => any);

        /**
         * Stop the DICOM Query/Retrieve service.
         * @param callback the callback function
         */
        stopQueryRetrieveService(callback: (error: Error) => any);

        /**
         * Manually log in to Dicoogle using the given credentials.
         * @param username the unique user name for the client
         * @param password the user's password for authentication
         * @param callback the callback function,
         *        providing the authentication token and other information
         */
        login(username: string, password: password, callback?: (error: Error, outcome: LoginOutcome) => any);

        /**
         * Log out from the server.
         * @param callback the callback function
         */
        logout(callback?: (error: Error) => any);

        /**
         * Perform a generic request to Dicoogle's services. Users of this method can
         * invoke any REST service exposed by Dicoogle, including those from plugins.
         * @param method the kind of HTTP method to make, defaults to "GET"
         * @param uri a URI or array of resource sequences to the service, relative
         *            to Dicoogle's base URL. There should be no leading slash ('/').
         * @param callback the callback function
         */
        request(method: string, uri: string | string[], callback: (error: Error, outcome: any) => any);

        /**
         * Perform a generic request to Dicoogle's services. Users of this method can
         * invoke any REST service exposed by Dicoogle, including those from plugins.
         * @param method the kind of HTTP method to make, defaults to "GET"
         * @param uri a URI or array of resource sequences to the service, relative
         *            to Dicoogle's base URL. There should be no leading slash ('/').
         * @param options an object of options to be passed as query strings
         * @param callback the callback function
         */
        request(method: string, uri: string | string[], options: { [attribute: string]: any }, callback: (error: Error, outcome: any) => any);

        /**
         * Request a new indexation task over a given URI. The operation is recursive,
         * indexing anything in the URI's endpoint. The callback will be called after
         * the task is created, not when it is complete.
         * @param uri a URI or array of URIs representing the root resource of the files to be indexed
         * @param callback the function to call when the task is successfully issued
         */
        index(uri: string, callback: (error: Error) => any);
        /**
         * Request a new indexation task over a given URI. The operation is recursive,
         * indexing anything in the URI's endpoint. The callback will be called after
         * the task is created, not when it is complete.
         * @param uri a URI or array of URIs representing the root resource of the files to be indexed
         * @param provider a provider or array of provider names in which the indexation will carry out, all by default
         * @param callback the function to call when the task is successfully issued
         */
        index(uri: string, provider: string | string[], callback: (error: Error) => any);

        /**
         * Request that the file at the given URI is unindexed in all indexers. The operation, unlike index(), is not recursive and will not unindex sub-entries.
         * @param uri a URI or array of URIs representing the files to be unindexed
         * @param callback the function to call on completion
         */
        unindex(uri: string, callback: (error: Error) => any);
        /**
         * Request that the file at the given URI is unindexed to a specific set of indexers. The operation, unlike index(), is not recursive and will not unindex sub-entries.
         * @param uri a URI or array of URIs representing the files to be unindexed
         * @param provider a provider or array of provider names in which the unindexation will carry out, all by default
         * @param callback the function to call on completion
         */
        unindex(uri: string, provider: string | string[], callback: (error: Error) => any);

        /** Request that the file at the given URI is permanently removed. The operation, unlike index(), is not recursive.
         * Indices will not be updated, hence the files should be unindexed manually if so is intended.
         * @param uri a URI or array of URIs representing the files to be removed
         * @param  callback the function to call on completion
         */
        remove(uri: string, callback: (error: Error) => any);

        /**
         * Obtain information about Dicoogle's running (or terminated) tasks.
         * @param callback the callback function
         */
        getRunningTasks(callback: (error: Error, outcome: { tasks: TaskInfo[], count: number }) => any);

        /**
         * Close a terminated task from the list of tasks.
         * @param uid the task's unique ID
         * @param callback the callback function
         */
        closeTask(uid: string, callback: (error: Error) => any);

        /**
         * Request that a task is stopped.
         * @param uid the task's unique ID
         * @param callback the callback function
         */
        stopTask(uid: string, callback: (error: Error) => any);

        /** Retrieve the running Dicoogle version.
         * @param {function(error:any, {version:string})} callback the callback function
         */
        getVersion(callback: (error: Error, outcome: { version: string }) => any);

        /** Retrieve the Dicoogle server's log text.
         * @param callback the callback function
         */
        getRawLog(callback: (error: Error, text: string) => any);

        /** Get all of the current Indexer settings.
         * @param callback the callback function
         */
        getIndexerSettings(callback: (error: Error, outcome: IndexerSettings) => any);

        /** Set a particular Indexer setting. A valid field and value pair is required.
         * @param field a particular field to set
         * @param value the value to assign to the field
         * @param callback the callback function
         */
        setIndexerSettings(field: string, value: any, callback: (error: Error) => any);

        /** Set a group of indexer settings. The given object should contain valid field-value pairs.
         * @param fields a dictionary containing the fields and values as key-value pairs.
         * @param callback the callback function
         */
        setIndexerSettings(fields: IndexerSettings, callback: (error: Error) => any);

        /** Get the list of current transfer syntax settings available.
         * @param callback the callback function
         */
        getTransferSyntaxSettings(callback: (error: Error, outcome: TransferSyntax[]) => any);

        /** Set (or reset) an option of a particular transfer syntax.
         * @param uid the unique identifier of the transfer syntax
         * @param option the name of the option to modify
         * @param value whether to set (true) or reset (false) the option
         * @param callback the callback function
         */
        setTransferSyntaxOption(uid: string, option: string, value: boolean, callback: (error: Error) => any);

        /** Retrieve the AE title of the Dicoogle archive.
         * @param callback the callback function
         */
        getAETitle(callback: (error: Error, aetitle: string) => any);

        /** Redefine the AE title of the Dicoogle archive.
         * @param aetitle a valid AE title for the PACS archive
         * @param callback the callback function
         */
        setAETitle(aetitle: string, callback: (error: Error) => any);

        /** Get all of the current DICOM Query-Retrieve settings.
         * @param callback the callback function
         */
        getDicomQuerySettings(callback: (error: Error, outcome: DicomQuerySettings) => any);

        /** Set a group of DICOM Query/Retrieve settings. The given object should contain valid field-value pairs.
         * @param fields a dictionary containing the fields and values as key-value pairs.
         * @param callback the callback function
         */
        setDicomQuerySettings(fields: DicomQuerySettings, callback: (error: Error) => any);

        /** Retrieve information about currently installed web UI plugins.
         * @param slotId the identifiers of slots to contemplate
         * @param callback the callback function
         */
        getWebUIPlugins(slotId: string|string[], callback: (error: Error, plugins: WebUIPlugin[]) => any);

        /** Obtain the base URL of all Dicoogle services.
         * This method is synchronous.
         * @returns the currently configured base endpoint of Dicoogle
         */
        getBase(): string;

        /**
         * Get the user name of the currently authenticated user.
         * @returns the unique user name
         */
        getUsername(): string;

        /**
         * Get the names of the roles assigned to this user.
         * @returns an array of role names, null if the user is not authenticated
         */
        getRoles(): string[];

        /**
         * Retrieve the authentication token. This token is ephemeral and may expire after some time.
         * This method is synchronous.
         * @returns the user's current authentication token
         */
        getToken(): string;

        /**
         * Check whether the user is authenticated to the server. Authenticated clients will hold an
         * authentication token.
         * @returns whether the user is authenticated or not.
         */
        isAuthenticated(): boolean;

        /**
         * Assign the module's session token, used only for restoring previous (but recent) sessions.
         * This method is synchronous.
         * @param token the same user's token of a previous session
         */
        setToken(token: string);
    }
}

