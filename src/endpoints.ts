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

/** Web service endpoints
 * @enum {string}
 */
const Endpoints = Object.freeze({
    SEARCH: "search",
    SEARCH_DIM: "searchDIM",
    PROVIDERS: "providers",
    DUMP: "dump",
    EXPORT: "exportFile",
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
