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

const dicoogleClient = require('../../src');
const nock = require('nock');
const URL = require('url');
const qs = require('querystring');

function validateURI(uri) {
    if (typeof uri !== 'string') {
        return false;
    }
    return /^(file:)?[.-\w/%?&=]+$/.test(uri);
}

/** Use nock to intercept Dicoogle client requests.
 * @param {number} [port] the TCP port to listen to
 * @returns {object} a Dicoogle access object Dicoogle access object connected to a mock Dicoogle server.
 */
module.exports = function createDicoogleMock(port = 8080) {
    const BASE_URL = `http://127.0.0.1:${port}`;
    
        // prepare Dicoogle server mock
        const DICOOGLE_VERSION = '2.4.1-TEST';

        const SEARCH_RESULTS = [
            {
                uri: 'file:/opt/dataset/file1',
                fields: {
                    "Modality": "MR",
                    "StudyInstanceUID": "1.2.3.4.5.6.7777777",
                    "PatientName": "Esquina^Ze",
                    "SeriesInstanceUID": "1.2.3.4.5.6.7777777.4444",
                    "StudyID": "000",
                    "PatientSex": "M",
                    "PatientID": "12345",
                    "SeriesNumber": "1.0",
                    "SOPInstanceUID": "1.2.3.4.5.6.7777777.4444.1"
                }
            },
            {
                uri: 'file:/opt/dataset/file2',
                fields: {
                    "Modality": "MR",
                    "StudyInstanceUID": "1.2.3.4.5.6.7777777",
                    "PatientName": "Esquina^Ze",
                    "SeriesInstanceUID": "1.2.3.4.5.6.7777777.4444",
                    "StudyID": "000",
                    "PatientSex": "M",
                    "PatientID": "12345",
                    "SeriesNumber": "1.0",
                    "SOPInstanceUID": "1.2.3.4.5.6.7777777.4444.2"
                }
            }
        ];

        const SEARCH_RESULTS_DIM = [
            {
                id: "12345",
                name: "Esquina^Ze",
                gender: "M",
                nStudies: 1,
                studies: [{
                    studyInstanceUID: "1.2.3.4.5.6.7777777",
                    studyDescription: "",
                    institutionName: "",
                    modalities: "MR",
                    series: [{
                        serieInstanceUID: "1.2.3.4.5.6.7777777.4444",
                        serieDescription: "",
                        serieModality: "CR",
                        images: [{
                            uri: 'file:/opt/dataset/file1',
                            "sopInstanceUID": "1.2.3.4.5.6.7777777.4444.1"
                        }, {
                                uri: 'file:/opt/dataset/file2',
                                "sopInstanceUID": "1.2.3.4.5.6.7777777.4444.2"
                            }]
                    }]
                }]
            }
        ];

        const INDEXER_SETTINGS = {
            path: '/opt/data',
            zip: false,
            effort: '100',
            thumbnail: true,
            thumbnailSize: '128',
            watcher: false
        };
        const REMOTE_STORAGES = [{
            AETitle: 'TEST_SERVER_1',
            ipAddrs: '10.0.0.44',
            description: "A test server",
            isPublic: false,
            port: 6460
        }, {
            AETitle: 'TEST_SERVER_2',
            ipAddrs: '10.0.0.45',
            port: 6460,
            description: "Another test server",
            isPublic: true
        }];
        /* eslint-disable */
        const TRANSFER_SETTINGS = [{"uid":"1.2.840.10008.5.1.4.1.1.1","sop_name":"ComputedRadiographyImageStorage","options":[{"name":"ImplicitVRLittleEndian","value":true},{"name":"ExplicitVRLittleEndian","value":true},{"name":"DeflatedExplicitVRLittleEndian","value":false},{"name":"ExplicitVRBigEndian","value":false},{"name":"JPEGLossless","value":false},{"name":"JPEGLSLossless","value":true},{"name":"JPEGLosslessNonHierarchical14","value":false},{"name":"JPEG2000LosslessOnly","value":false},{"name":"JPEGBaseline1","value":true},{"name":"JPEGExtended24","value":false},{"name":"JPEGLSLossyNearLossless","value":false},{"name":"JPEG2000","value":false},{"name":"RLELossless","value":false},{"name":"MPEG2","value":false}]},{"uid":"1.2.840.10008.5.1.4.1.1.1.1","sop_name":"DigitalXRayImageStorageForPresentation","options":[{"name":"ImplicitVRLittleEndian","value":true},{"name":"ExplicitVRLittleEndian","value":true},{"name":"DeflatedExplicitVRLittleEndian","value":false},{"name":"ExplicitVRBigEndian","value":false},{"name":"JPEGLossless","value":false},{"name":"JPEGLSLossless","value":true},{"name":"JPEGLosslessNonHierarchical14","value":false},{"name":"JPEG2000LosslessOnly","value":false},{"name":"JPEGBaseline1","value":true},{"name":"JPEGExtended24","value":false},{"name":"JPEGLSLossyNearLossless","value":false},{"name":"JPEG2000","value":false},{"name":"RLELossless","value":false},{"name":"MPEG2","value":false}]}];
        const WEBUI_PLUGINS = [
            {"name":"dicoogle-enhance-plugin","version":"0.1.0","description":"Enhance your medical images!","dicoogle":{"slot-id":"result-options","caption":"Enhance","module-file":"module.js","roles":[]}},
            {"name":"dicoogle-extra-ui","version":"1.0.0","description":"Extra UI for Dicoogle","dicoogle":{"caption":"Extras","slot-id":"menu","module-file":"module.js"}},
            {"name":"dicoogle-react-todo","version":"0.1.0","description":"A TODO list for Dicoogle","dicoogle":{"caption":"TODO list","slot-id":"menu","module-file":"module.js","roles":["Healthcare"]}},
            {"name":"dicoogle-demo-plugin","version":"0.1.0","dicoogle":{"slot-id":"menu","caption":"Web Plugin Sample","module-file":"module.js"}}
            ];
        /* eslint-enable */

        const LOGGER_TEXT = `2016-05-24T15:05:42,872 | Creating plugin controller
2016-05-24T15:05:46,383 | Loaded web plugins
2016-05-24T15:05:46,445 | Loaded Local Plugins
2016-05-24T15:05:51,858 | Initializing services
2016-05-24T15:05:51,859 | Finished initializing rest interfaces
2016-05-24T15:05:51,859 | Initializing jetty interface
2016-05-24T15:05:51,888 | Starting Web Services in port 9001
2016-05-24T15:05:52,808 | Plugins initialized`;

        let AETitle = 'TESTSRV';
        let Storage = {
            running: true,
            autostart: false,
            port: 6666
        };
        let QR = {
            running: true,
            autostart: false,
            port: 1045
        };
        let TaskClosed = false;
        let TaskStopped = false;
        let Zip = false;
        const RunningTasks = [
            {
                taskUid: "1063922f-1823-4e43-8241-c84c1721a6c1",
                taskName: "[cbir]index file:/opt/some-dataset/42",
                taskProgress: 0.2
            },
            {
                taskUid: "f1b6588d-92c2-458c-8c77-e30d8706b662",
                taskName: "[lucene]index file:/opt/some-other-dataset/42",
                taskProgress: 1,
                complete: true,
                elapsedTime: 44440,
                nIndexed: 213,
                nErrors: 3
            }
        ];

        nock.cleanAll();

            // mock get running tasks
        nock(BASE_URL).get('/index/task')
            .times(3)
            .reply(200, function() {
                const tasks = [];
                if (!TaskStopped) {
                    tasks.push(RunningTasks[0]);
                }
                if (!TaskClosed) {
                    tasks.push(RunningTasks[1]);
                }
                return {
                    results: tasks,
                    count: TaskStopped ? 0 : 1
                }
            })
            // mock close a running task
        nock(BASE_URL).post('/index/task')
            .query({
                uid: 'f1b6588d-92c2-458c-8c77-e30d8706b662',
                action: 'delete',
                type: 'close'
            })
            .twice()
            .reply(function() {
                if (!TaskClosed) {
                    TaskClosed = true;
                    return [200, 'success'];
                }
                return [400, 'no such task!'];
            })
            // mock stop a running task
        nock(BASE_URL).post('/index/task')
            .query({
                uid: '1063922f-1823-4e43-8241-c84c1721a6c1',
                action: 'delete',
                type: 'stop'
            })
            .twice()
            .reply(function() {
                if (!TaskStopped) {
                    TaskStopped = true;
                    return [200, 'success'];
                }
                return [400, 'no such task!'];
            });

        nock(BASE_URL)
            // mock /version
            .get('/ext/version')
            .times(4)
            .reply(200, {
                version: DICOOGLE_VERSION
            })

            // mock /logger
            .get('/logger')
            .reply(200, LOGGER_TEXT)

            // mock /search for "Modality:MR" on specific provider
            .get('/search')
            .twice()
            .query({
                query: 'Modality:MR',
                provider: 'lucene',
                keyword: true
            })
            .reply(200, {
                results: SEARCH_RESULTS,
                numResults: SEARCH_RESULTS.length,
                elapsedTime: 50
            })

            // mock /search for "Esquina" (keyword's default is false)
            .get('/search')
            .query({
                query: 'Esquina'
            })
            .reply(200, {
                results: SEARCH_RESULTS,
                numResults: SEARCH_RESULTS.length,
                elapsedTime: 50
            })

            // mock /search for "Esquina"
            .get('/search')
            .query({
                query: 'Esquina',
                keyword: false
            })
            .reply(200, {
                results: SEARCH_RESULTS,
                numResults: SEARCH_RESULTS.length,
                elapsedTime: 50
            })

            // mock /searchDIM for "Modality:MR" on specific provider
            .get('/searchDIM')
            .query({
                query: 'Modality:MR',
                provider: 'lucene',
                keyword: true
            })
            .reply(200, {
                results: SEARCH_RESULTS_DIM,
                numResults: SEARCH_RESULTS_DIM.length,
                elapsedTime: 50
            })
            // mock /searchDIM for "Modality:MR", no more options
            .get('/searchDIM')
            .query({
                query: 'Modality:MR',
                keyword: true
            })
            .reply(200, {
                results: SEARCH_RESULTS_DIM,
                numResults: SEARCH_RESULTS_DIM.length,
                elapsedTime: 36
            })
            // mock get query or index providers
            .get('/providers')
            .times(3)
            .query(function(qs) {
                return !('type' in qs)
                  || qs.type === 'query'
                  || qs.type === 'index';
            })
            .reply(200, ["lucene", "cbir"])

            // mock get storage providers
            .get('/providers')
            .query({ type: 'storage' })
            .reply(200, ["file", "dropbox"])

            // mock index on specific provider
            .post('/management/tasks/index')
            .query(({ uri, plugin }) => {
                return validateURI(uri) && /\w+/.test(plugin);
            })
            .reply(200)

            // mock index on all providers
            .post('/management/tasks/index')
            .query(({ uri }) => validateURI(uri))
            .reply(200)

            // mock unindex on all providers (via query string)
            .post('/management/tasks/unindex')
            .query(({ uri }) => validateURI(uri))
            .reply(200)

            // mock unindex on all providers (via form data)
            .post('/management/tasks/unindex', ({ uri: uris }) => {
                return uris.length > 0 && uris.every(validateURI);
            })
            .reply(200)

            // mock unindex on specific provider (via query string)
            .post('/management/tasks/unindex')
            .query(({ uri, plugin }) => {
                return validateURI(uri) && /\w+/.test(plugin);
            })
            .reply(200)

            // mock unindex on specific provider (via form data)
            .post('/management/tasks/unindex', ({ uri: uris }) => {
                return uris.length > 0 && uris.every(validateURI);
            })
            .query({ provider: /\w+/ })
            .reply(200)
        
            // mock remove (via query string)
            .post('/management/tasks/remove')
            .query(({ uri }) => validateURI(uri))
            .reply(200)

            // mock remove (via form data)
            .post('/management/tasks/remove', ({ uri: uris }) => {
                return uris.length > 0 && uris.every(validateURI);
            })
            .reply(200)

            // mock dump
            .get('/dump')
            .query({ uid: '1.2.3.4.5.6.7777777.4444.1' })
            .reply(200, {
                results: SEARCH_RESULTS[0],
                elapsedTime: 80
            })

            // mock issue export
            .post('/exportFile')
            .query({
                query: 'Modality:MR',
                fields: JSON.stringify(['Modality', 'PatientName']),
                keyword: true
            })
            .reply(200, JSON.stringify({ // legacy behaviour, must pass
                uid: "111111-132456-1234567"
            }))
            .post('/exportFile')
            .query({
                query: 'Modality:MR',
                fields: JSON.stringify(['Modality', 'PatientName'])
            })
            .reply(200, {
                uid: "123456-132456-1234567"
            })
            .post('/exportFile')
            .query({ query: 'Modality:MR', fields: "[\"SOPInstanceUID\"]" })
            .reply(200, {
                uid: "654321-654321-7654321"
            })

            //mock webui
            .get('/webui')
            .twice()
            .query({'slot-id': 'menu'})
            .reply(200, {
                plugins: WEBUI_PLUGINS.filter(p => p.dicoogle['slot-id'] === 'menu')
            })
            .get('/webui')
            .reply(200, {plugins: WEBUI_PLUGINS});

            // mock QR service
        nock(BASE_URL)
            .get('/management/dicom/query').times(4)
            .reply(200, function() {
                return QR;
            })
            .post('/management/dicom/query')
            .query({ running: 'false' })
            .reply(200, function() {
                QR.running = false;
                return "success";
            })
            .post('/management/dicom/query')
            .query({ running: true })
            .reply(200, function() {
                QR.running = true;
                return "success";
            });

        nock(BASE_URL)
            .post('/management/dicom/query')
            .query({})
            .reply(400, {
                error: "Incomplete configurations"
            })
            .post('/management/dicom/query')
            .query({
                autostart: true,
                port: 7777
            })
            .reply(200, function() {
                QR.autostart = true;
                QR.port = 7777;
                return "success";
            })


        nock(BASE_URL)
            // mock storage service
            .get('/management/dicom/storage').times(4)
            .reply(200, function() {
                return Storage;
            })
            .post('/management/dicom/storage')
            .query({ running: false })
            .reply(200, function() {
                Storage.running = false;
                return "success";
            })
            .post('/management/dicom/storage')
            .query({ running: true })
            .reply(200, function() {
                Storage.running = true;
                return "success";
            })
            .post('/management/dicom/storage')
            .query({ autostart: true, port: 7777 })
            .reply(200, function() {
                Storage.autostart = true;
                Storage.port = 7777;
                return "success";
            });

        // mock storage servers
        nock(BASE_URL).get('/management/settings/storage/dicom')
            .reply(200, REMOTE_STORAGES);

        // adding a server (without public property)
        nock(BASE_URL).post('/management/settings/storage/dicom')
            .query({
                type: 'add',
                aetitle: /[A-Z0-9_ ]+/,
                ip: /.+/,
                port: /[0-9]+/,
                description: /.*/
            })
            .reply(200, { added: true });
        // first response should have 3 servers
        nock(BASE_URL).get('/management/settings/storage/dicom')
            .reply(200, REMOTE_STORAGES.concat({
                AETitle: 'A_NEW_STORAGE',
                ipAddrs: '10.0.0.144',
                port: 6646,
                description: '',
                isPublic: false
            }))
        // adding a server (with public property)
        nock(BASE_URL).post('/management/settings/storage/dicom')
            .query({
                type: 'add',
                aetitle: /[A-Z0-9_ ]+/,
                ip: /.+/,
                port: /[0-9]+/,
                description: /.*/,
                public: 'true'
            })
            .reply(200, { added: true });
        // second response should have 4 servers
        nock(BASE_URL).get('/management/settings/storage/dicom')
        .reply(200, REMOTE_STORAGES.concat([{
            AETitle: 'A_NEW_STORAGE',
            ipAddrs: '10.0.0.144',
            port: 6646,
            description: '',
            isPublic: false
        }, {
            AETitle: 'ONE_MORE_SERV',
            ipAddrs: '10.0.0.145',
            port: 6666,
            description: 'our public store',
            isPublic: true
        }]));

        // adding with not enough info
        nock(BASE_URL).post('/management/settings/storage/dicom')
        .query(q => {
            return q.type === 'add' && (!q.aetitle || !q.ip || !q.port || !q.description);
        })
        .reply(500, {error: 'Parameters missing'});

        // removing by whole object
        nock(BASE_URL).post('/management/settings/storage/dicom')
            .query({
                type: 'remove',
                aetitle: /[A-Z0-9_ ]+/,
                ip: /.*/,
                port: /\d+/
            })
            .reply(200, { removed: true });
        nock(BASE_URL).get('/management/settings/storage/dicom')
            .reply(200, REMOTE_STORAGES)

            // removing by some other aetitle
            .post('/management/settings/storage/dicom')
            .query({
                type: 'remove',
                aetitle: /[A-Z0-9_ ]+/
            })
            .reply(200, { removed: false })
            .get('/management/settings/storage/dicom')
            .reply(200, REMOTE_STORAGES);

        // mock indexer settings
        nock(BASE_URL).get('/management/settings/index')
            .once().reply(200, () => JSON.stringify(INDEXER_SETTINGS)); // in Dicoogle 2.3.1
        nock(BASE_URL).get('/management/settings/index')
            .reply(200, () => INDEXER_SETTINGS); // with patched Dicoogle
        // getters
        nock(BASE_URL)
            .get('/management/settings/index/path')
            .reply(200, () => INDEXER_SETTINGS.path)
            .get('/management/settings/index/zip')
            .thrice()
            .reply(200, () => Zip)
            .get('/management/settings/index/effort')
            .reply(200, () => INDEXER_SETTINGS.effort)
            .get('/management/settings/index/thumbnail')
            .reply(200, () => INDEXER_SETTINGS.thumbnail)
            .get('/management/settings/index/thumbnailSize')
            .reply(200, () => INDEXER_SETTINGS.thumbnailSize)
            .get('/management/settings/index/watcher')
            .reply(200, () => INDEXER_SETTINGS.watcher)

            // mock indexer settings setters
            .post('/management/settings/index')
            .query(true)
            .twice()
            .reply((uri) => {
                const qs = URL.parse(uri, true).query;
                if ('zip' in qs) {
                    Zip = !(qs.zip === 'false');
                }
                return [200, {}];
            })
            .post('/management/settings/index/path')
            .query({ path: /.*/ })
            .reply(200, {})
            .post('/management/settings/index/zip')
            .query({ zip: /.*/ })
            .twice()
            .reply(function(uri) {
                const qs = URL.parse(uri, true).query;
                if ('zip' in qs) {
                    Zip = !(qs.zip === 'false');
                }
                return [200, {}];
            })
            .post('/management/settings/index/effort')
            .query({ effort: /\d+(\.\d+)?/ })
            .reply(200)
            .post('/management/settings/index/thumbnail')
            .query({ saveThumbnail: /(|true|false)/i })
            .reply(200)
            .post('/management/settings/index/thumbnailSize')
            .query({ thumbnailSize: /\d+/ })
            .reply(200)
            .post('/management/settings/index/watcher')
            .query({ watcher: /(|true|false)/i })
            .reply(200);

        nock(BASE_URL).get('/management/settings/transfer')
            .once().reply(200, JSON.stringify(TRANSFER_SETTINGS)) // in Dicoogle 2.3.1
            .get('/management/settings/transfer')
            .reply(200, TRANSFER_SETTINGS); // with patched Dicoogle

        nock(BASE_URL).post('/management/settings/transfer')
            .query({uid: /(\d\.?)+/, option: /\S*/, value: true})
            .reply(200)

        nock(BASE_URL)
            .get('/management/settings/dicom').twice()
            .reply(200, function() {
                // AETitle must be resolved on request, hence the function
                return { aetitle: AETitle};
            });

        nock(BASE_URL)
            .get('/management/settings/dicom/query')
            .reply(200, {
                "acceptTimeout": 60,
                "connectionTimeout": 60,
                "idleTimeout": 60,
                "maxAssociations": 20,
                "maxPduReceive": 16364,
                "maxPduSend": 16364,
                "responseTimeout": 0
            })
            .post('/management/settings/dicom/query')
            .query(true)
            .reply(200, {});

        nock(BASE_URL)
            .put('/management/settings/dicom')
            .query({ aetitle: /[A-Z0-9_ ]+/ })
            .reply(200, function() {
                // apply side-effect
                const qstring = URL.parse(this.req.path).query;
                AETitle = String(qs.parse(qstring).aetitle).trim();
                return 'success';
            });
        
        nock(BASE_URL)
            .get('/user')
            .reply(200, {users: [
                { username: "dicoogle" },
                { username: "other" }
            ]})
            .put('/user')
            .query(({username, password, admin}) => {
                return username === 'drze' &&
                    typeof password === 'string' &&
                    password.length > 0 &&
                    (admin === undefined || admin === 'true' || admin === 'false');
            })
            .reply(200, {success: true})
            .get('/user')
            .reply(200, {users: [
                { username: "dicoogle" },
                { username: "drze" },
                { username: "other" }
            ]})
            .delete('/user')
            .query({username: 'drze'})
            .reply(200, {success: true})
            .get('/user')
            .reply(200, {users: [
                { username: "dicoogle" },
                { username: "other" }
            ]});

    return dicoogleClient(BASE_URL);
};
