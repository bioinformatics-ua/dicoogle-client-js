var DicoogleClient = require('..');
var nock = require('nock');

/** Use nock to intercept Dicoogle client requests.
 * @returns {object} a Dicoogle access object Dicoogle access object connected to a mock Dicoogle server.
 */
module.exports = function createDicoogleMock() {
    // prepare Dicoogle server mock
    var BASE_URL = "http://127.0.0.1:8080";
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

    nock(BASE_URL) // mock /version
        .get('/ext/version')
        .reply(200, {
            version: DICOOGLE_VERSION
            });

    nock(BASE_URL) // mock /search for "Modality:MR" on specific provider
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
        });

    nock(BASE_URL) // mock /search for "Esquina" (keyword's default is false)
        .get('/search')
        .query({
            query: 'Esquina'
        })
        .reply(200, {
            results: SEARCH_RESULTS,
            numResults: SEARCH_RESULTS.length,
            elapsedTime: 50
        });

    nock(BASE_URL) // mock /search for "Esquina"
        .get('/search')
        .query({
            query: 'Esquina',
            keyword: false
        })
        .reply(200, {
            results: SEARCH_RESULTS,
            numResults: SEARCH_RESULTS.length,
            elapsedTime: 50
        });

    nock(BASE_URL) // mock get query providers
        .get('/providers')
        .query({type: 'query'})
        .reply(200, ["cbir", "lucene"]);

    nock(BASE_URL) // mock get storage providers
        .get('/providers')
        .query({type: 'storage'})
        .reply(200, ["file", "dropbox"]);

    nock(BASE_URL) // mock index on specific provider
        .post('/management/tasks/index')
        .query({uri: /[a-z0-9\-\/]+/, plugin: /.*/})
        .reply(200);

    nock(BASE_URL) // mock unindex
        .post('/management/tasks/unindex')
        .query({uri: /[a-z0-9\-\/]+/})
        .reply(200);

    nock(BASE_URL) // mock unindex
        .post('/management/tasks/unindex')
        .query({uri: /[a-z0-9\-\/]+/, provider: /.*/})
        .reply(200);

    nock(BASE_URL) // mock dump
        .get('/dump')
        .query({uid: '1.2.3.4.5.6.7777777.4444.1'})
        .reply(200, {
            results: SEARCH_RESULTS[0],
            elapsedTime: 80
        });

    nock(BASE_URL) // mock QR service status
        .get('/management/dicom/query')
        .reply(200, {
          isRunning: true,
          port: 1045,
          autostart: false
        });

    nock(BASE_URL) // mock storage service status
        .get('/management/dicom/storage')
        .reply(200, {
          isRunning: true,
          port: 6666,
          autostart: false
        });

    nock(BASE_URL)
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

    return DicoogleClient(BASE_URL);
};
