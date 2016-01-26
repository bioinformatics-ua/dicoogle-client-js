var DicoogleClient = require('..');
var nock = require('nock');

/** Create a Dicoogle access object connected to a mock Dicoogle server.
 */
module.exports = function createDicoogleMock() { 

    // prepare Dicoogle server mock
    var BASE_URL = "http://127.0.0.1:8080";
    var DICOOGLE_VERSION = '2.4.0-TEST';

    nock(BASE_URL) // mock /version
        .get('/ext/version')
        .reply(200, {
            version: DICOOGLE_VERSION
            });

    nock(BASE_URL) // mock /search for "Modality:MR"
        .get('/search')
        .query({
            query: 'Modality:MR',
            keyword: true
        })
        .reply(200, {
            results: [
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
            ],
            numResults: 2,
            elapsedTime: 50
        });

    nock(BASE_URL) // mock get query providers
        .get('/providers')
        .query({type: 'query'})
        .reply(200, [
        "cbir",
        "lucene"
        ]);

    nock(BASE_URL) // mock get storage providers
        .get('/providers')
        .query({type: 'storage'})
        .reply(200, [
        "file",
        "dropbox"
        ]);

    return DicoogleClient(BASE_URL);
};
