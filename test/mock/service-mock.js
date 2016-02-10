/* eslint-env node */
var DicoogleClient = require('../..');
var nock = require('nock');

var nockDone = false;

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
            .query({type: 'query'})
            .reply(200, ["cbir", "lucene"])

         // mock get storage providers
            .get('/providers')
            .query({type: 'storage'})
            .reply(200, ["file", "dropbox"])

        // mock index on specific provider
            .post('/management/tasks/index')
            .query({uri: /[a-z0-9\-\/]+/, plugin: /.*/})
            .reply(200)

        // mock unindex
            .post('/management/tasks/unindex')
            .query({uri: /[a-z0-9\-\/]+/})
            .reply(200)

        // mock unindex (with provider)
            .post('/management/tasks/unindex')
            .query({uri: /[a-z0-9\-\/]+/, provider: /.*/})
            .reply(200)

        // mock remove
            .post('/management/tasks/remove')
            .query({uri: /[a-z0-9\-\/]+/})
            .reply(200)

        // mock dump
            .get('/dump')
            .query({uid: '1.2.3.4.5.6.7777777.4444.1'})
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

        // mock get running tasks
            .get('/index/task')
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
        nockDone = true;
    }

    return DicoogleClient(BASE_URL);
};
