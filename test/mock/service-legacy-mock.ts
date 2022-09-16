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
export default function createDicoogleMock(port = 8282): ReturnType<typeof dicoogleClient> {
    const BASE_URL = `http://127.0.0.1:${port}`;
    
        // prepare Dicoogle server mock
        const DICOOGLE_VERSION = '2.5.4-TEST';

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

        nock.cleanAll();

        nock(BASE_URL)
            // mock /version
            .get('/ext/version')
            .times(4)
            .reply(200, {
                version: DICOOGLE_VERSION
            });

        // mock indexer settings
        nock(BASE_URL).get('/management/settings/index')
            .once().reply(200, () => JSON.stringify(INDEXER_SETTINGS)); // in Dicoogle 2.3.1

        nock(BASE_URL).get('/management/settings/transfer')
            .once().reply(200, JSON.stringify(TRANSFER_SETTINGS)); // in Dicoogle 2.3.1
        
        nock(BASE_URL)
            .get('/user')
            .reply(200, {users: [
                { username: "dicoogle" },
                { username: "other" }
            ]})
            .post('/user')
            .query(true)
            .reply(405)
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
            .delete('/user/drze')
            .reply(200, {success: true})
            .get('/user')
            .reply(200, {users: [
                { username: "dicoogle" },
                { username: "other" }
            ]});

    return dicoogleClient(BASE_URL);
};
