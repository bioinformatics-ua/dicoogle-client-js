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
    LOGGER: "logger",
    LOGIN: "login",
    LOGOUT: "logout",
    WEBUI: "webui"
});

export default Endpoints;
