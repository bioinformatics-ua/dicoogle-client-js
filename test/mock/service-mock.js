const dicoogleClient = require('../../src');
const nock = require('nock');
const URL = require('url');
const qs = require('querystring');

let nockDone = false;

/** Use nock to intercept Dicoogle client requests.
 * @returns {object} a Dicoogle access object Dicoogle access object connected to a mock Dicoogle server.
 */
module.exports = function createDicoogleMock() {
    const BASE_URL = "http://127.0.0.1:8080";
    if (!nockDone) {
        // prepare Dicoogle server mock
        const DICOOGLE_VERSION = '2.4.0-TEST';

        const SEARCH_RESULTS = [
            {
                uri: '/opt/dataset/file1',
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
                uri: '/opt/dataset/file2',
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
                            uri: '/opt/dataset/file1',
                            "sopInstanceUID": "1.2.3.4.5.6.7777777.4444.1"
                        }, {
                                uri: '/opt/dataset/file2',
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
        /* eslint-disable */
        const TRANSFER_SETTINGS = [{"uid":"1.2.840.10008.5.1.4.1.1.1","sop_name":"ComputedRadiographyImageStorage","options":[{"name":"ImplicitVRLittleEndian","value":true},{"name":"ExplicitVRLittleEndian","value":true},{"name":"DeflatedExplicitVRLittleEndian","value":false},{"name":"ExplicitVRBigEndian","value":false},{"name":"JPEGLossless","value":false},{"name":"JPEGLSLossless","value":true},{"name":"JPEGLosslessNonHierarchical14","value":false},{"name":"JPEG2000LosslessOnly","value":false},{"name":"JPEGBaseline1","value":true},{"name":"JPEGExtended24","value":false},{"name":"JPEGLSLossyNearLossless","value":false},{"name":"JPEG2000","value":false},{"name":"RLELossless","value":false},{"name":"MPEG2","value":false}]},{"uid":"1.2.840.10008.5.1.4.1.1.1.1","sop_name":"DigitalXRayImageStorageForPresentation","options":[{"name":"ImplicitVRLittleEndian","value":true},{"name":"ExplicitVRLittleEndian","value":true},{"name":"DeflatedExplicitVRLittleEndian","value":false},{"name":"ExplicitVRBigEndian","value":false},{"name":"JPEGLossless","value":false},{"name":"JPEGLSLossless","value":true},{"name":"JPEGLosslessNonHierarchical14","value":false},{"name":"JPEG2000LosslessOnly","value":false},{"name":"JPEGBaseline1","value":true},{"name":"JPEGExtended24","value":false},{"name":"JPEGLSLossyNearLossless","value":false},{"name":"JPEG2000","value":false},{"name":"RLELossless","value":false},{"name":"MPEG2","value":false}]}];
        /* eslint-enable */

        let AETitle = 'TESTSRV';
        let QRRunning = true;
        let StorageRunning = true;
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

        nock(BASE_URL)
            // mock /version
            .get('/ext/version')
            .times(4)
            .reply(200, {
                version: DICOOGLE_VERSION
            })

            // mock /search for "Modality:MR" on specific provider
            .get('/search')
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
            .query({ uri: /[a-z0-9\-\/]+/, plugin: /.*/ })
            .reply(200)

            // mock index on all providers
            .post('/management/tasks/index')
            .query({ uri: /[a-z0-9\-\/]+/ })
            .reply(200)

            // mock unindex on all providers
            .post('/management/tasks/unindex')
            .query({ uri: /[a-z0-9\-\/]+/ })
            .reply(200)

            // mock unindex on specific provider
            .post('/management/tasks/unindex')
            .query({ uri: /[a-z0-9\-\/]+/, provider: /.*/ })
            .reply(200)

            // mock remove
            .post('/management/tasks/remove')
            .query({ uri: /[a-z0-9\-\/]+/ })
            .reply(200)

            // mock dump
            .get('/dump')
            .query({ uid: '1.2.3.4.5.6.7777777.4444.1' })
            .reply(200, {
                results: SEARCH_RESULTS[0],
                elapsedTime: 80
            })

            // mock QR service
            .get('/management/dicom/query').times(3)
            .reply(200, function() {
                return {
                    isRunning: QRRunning,
                    port: 1045,
                    autostart: false
                };
            })
            .post('/management/dicom/query')
            .query({ running: false })
            .reply(200, function() {
                QRRunning = false;
                return "success";
            })
            .post('/management/dicom/query')
            .query({ running: true })
            .reply(200, function() {
                QRRunning = true;
                return "success";
            })

            // mock storage service
            .get('/management/dicom/storage').times(3)
            .reply(200, function() {
                return {
                    isRunning: StorageRunning,
                    port: 6666,
                    autostart: false
                };
            })
            .post('/management/dicom/storage')
            .query({ running: false })
            .reply(200, function() {
                StorageRunning = false;
                return "success";
            })
            .post('/management/dicom/storage')
            .query({ running: true })
            .reply(200, function() {
                StorageRunning = true;
                return "success";
            })

        // mock indexer settings
        nock(BASE_URL).get('/management/settings/index')
            .once().reply(200, () => JSON.stringify(INDEXER_SETTINGS)); // in Dicoogle 2.3.1
        nock(BASE_URL).get('/management/settings/index')
            .reply(200, () => INDEXER_SETTINGS);               // with patched Dicoogle
        // getters
        nock(BASE_URL)
            .get('/management/settings/index/path')
            .reply(200, () => INDEXER_SETTINGS.path)
            .get('/management/settings/index/zip')
            .twice()
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
            .post('/management/settings/index/path')
            .query({ path: /.*/ })
            .reply(200)
            .post('/management/settings/index/zip')
            .query({ zip: 'true' })
            .reply(function() {
                Zip = true;
                return [200, {}];
            })
            .post('/management/settings/index/zip')
            .query({ zip: 'false' })
            .reply(function() {
                Zip = false;
                return [200, {}];
            })
            .post('/management/settings/index/effort')
            .query({ effort: /\d+(\.\d+)?/ })
            .reply(200)
            .post('/management/settings/index/thumbnail')
            .query({ thumbnail: /(|true|false)/i })
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
            .reply(200, TRANSFER_SETTINGS);                       // with patched Dicoogle

        nock(BASE_URL).post('/management/settings/transfer')
            .query({uid: /(\d\.?)+/, option: /\S*/, value: true})
            .reply(200)

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
            });

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
            });

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
            .get('/management/settings/dicom').twice()
            .reply(200, function() {
                // AETitle must be resolved on request, hence the function
                return { aetitle: AETitle};
            });

        nock(BASE_URL)
            .put('/management/settings/dicom')
            .query({ aetitle: / *\S+ */ })
            .reply(200, function() {
                // apply side-effect
                const qstring = URL.parse(this.req.path).query;
                AETitle = qs.parse(qstring).aetitle.trim();
                return 'success';
            });

        nockDone = true;
    }

    return dicoogleClient(BASE_URL);
};
