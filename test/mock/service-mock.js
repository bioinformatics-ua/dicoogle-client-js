var dicoogleClient = require('../..');
var nock = require('nock');
var nockDone = false;
var URL = require('url');
var qs = require('querystring');

/** Use nock to intercept Dicoogle client requests.
 * @returns {object} a Dicoogle access object Dicoogle access object connected to a mock Dicoogle server.
 */
module.exports = function createDicoogleMock() {
    var BASE_URL = "http://127.0.0.1:8080";
    if (!nockDone) {
        // prepare Dicoogle server mock
        var DICOOGLE_VERSION = '2.4.0-TEST';

        var SEARCH_RESULTS = [
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

        var SEARCH_RESULTS_DIM = [
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

        var INDEXER_SETTINGS = {
            path: '/opt/data',
            zip: false,
            effort: '100',
            thumbnail: true,
            thumbnailSize: '128',
            watcher: false
        };
        /* eslint-disable */
        var TRANSFER_SETTINGS = [{"uid":"1.2.840.10008.5.1.4.1.1.1","sop_name":"ComputedRadiographyImageStorage","options":[{"name":"ImplicitVRLittleEndian","value":true},{"name":"ExplicitVRLittleEndian","value":true},{"name":"DeflatedExplicitVRLittleEndian","value":false},{"name":"ExplicitVRBigEndian","value":false},{"name":"JPEGLossless","value":false},{"name":"JPEGLSLossless","value":true},{"name":"JPEGLosslessNonHierarchical14","value":false},{"name":"JPEG2000LosslessOnly","value":false},{"name":"JPEGBaseline1","value":true},{"name":"JPEGExtended24","value":false},{"name":"JPEGLSLossyNearLossless","value":false},{"name":"JPEG2000","value":false},{"name":"RLELossless","value":false},{"name":"MPEG2","value":false}]},{"uid":"1.2.840.10008.5.1.4.1.1.1.1","sop_name":"DigitalXRayImageStorageForPresentation","options":[{"name":"ImplicitVRLittleEndian","value":true},{"name":"ExplicitVRLittleEndian","value":true},{"name":"DeflatedExplicitVRLittleEndian","value":false},{"name":"ExplicitVRBigEndian","value":false},{"name":"JPEGLossless","value":false},{"name":"JPEGLSLossless","value":true},{"name":"JPEGLosslessNonHierarchical14","value":false},{"name":"JPEG2000LosslessOnly","value":false},{"name":"JPEGBaseline1","value":true},{"name":"JPEGExtended24","value":false},{"name":"JPEGLSLossyNearLossless","value":false},{"name":"JPEG2000","value":false},{"name":"RLELossless","value":false},{"name":"MPEG2","value":false}]}];
        /* eslint-enable */

        var AETitle = 'TESTSRV';

        nock(BASE_URL)
            // mock /version
            .get('/ext/version')
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
            // mock get query providers
            .get('/providers')
            .query({ type: 'query' })
            .reply(200, ["cbir", "lucene"])

            // mock get storage providers
            .get('/providers')
            .query({ type: 'storage' })
            .reply(200, ["file", "dropbox"])

            // mock index on specific provider
            .post('/management/tasks/index')
            .query({ uri: /[a-z0-9\-\/]+/, plugin: /.*/ })
            .reply(200)

            // mock unindex
            .post('/management/tasks/unindex')
            .query({ uri: /[a-z0-9\-\/]+/ })
            .reply(200)

            // mock unindex (with provider)
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

            // mock QR service status
            .get('/management/dicom/query')
            .reply(200, {
                isRunning: true,
                port: 1045,
                autostart: false
            })

            // mock storage service status
            .get('/management/dicom/storage')
            .reply(200, {
                isRunning: true,
                port: 6666,
                autostart: false
            })

        // mock indexer settings

        nock(BASE_URL).get('/management/settings/index')
            .once().reply(200, JSON.stringify(INDEXER_SETTINGS)); // in Dicoogle 2.3.1
        nock(BASE_URL).get('/management/settings/index')
            .reply(200, INDEXER_SETTINGS);                       // with patched Dicoogle
        // getters
        nock(BASE_URL)
            .get('/management/settings/index/path')
            .reply(200, INDEXER_SETTINGS.path)
            .get('/management/settings/index/zip')
            .reply(200, INDEXER_SETTINGS.zip)
            .get('/management/settings/index/effort')
            .reply(200, INDEXER_SETTINGS.effort)
            .get('/management/settings/index/thumbnail')
            .reply(200, INDEXER_SETTINGS.thumbnail)
            .get('/management/settings/index/thumbnailSize')
            .reply(200, '128')
            .get('/management/settings/index/watcher')
            .reply(200, INDEXER_SETTINGS.watcher)

            // mock indexer settings setters
            .post('/management/settings/index/path')
            .query({ path: /.*/ })
            .reply(200)
            .post('/management/settings/index/zip')
            .query({ zip: /(|true|false)/i })
            .reply(200)
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
            .reply(200, {
                results: [
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
                ],
                count: 0
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
                var qstring = URL.parse(this.req.path).query;
                AETitle = qs.parse(qstring).aetitle.trim();
                return 'success';
            });

        nockDone = true;
    }

    return dicoogleClient(BASE_URL);
};
