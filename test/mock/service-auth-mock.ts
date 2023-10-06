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

import dicoogleClient from '../../src/index-module';
import nock from 'nock';

let nockDone = false;

/** Use nock to intercept Dicoogle client requests.
 * @param {number} [port] the TCP port to listen to
 * @returns {object} a Dicoogle access object Dicoogle access object connected to a mock Dicoogle server.
 */
export default function createDicoogleMock(port = 8484) {
    const BASE_URL = `http://127.0.0.1:${port}`;

    // prepare Dicoogle server mock
    if (!nockDone) {
        nock.cleanAll();
        nock(BASE_URL, { // mock /login with admin account
                
                reqheaders: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                 }
            })
            .post('/login', function(data) {
                return data.username === 'admin' &&
                        typeof data.password === 'string' &&
                        data.password.length >= 3;
            })
            .twice()
            .reply(200, {
                user: 'admin',
                admin: true,
                roles: ['Healthcare', 'Research'],
                token: '9ebdff77-dffc-4904-a954-74f72ba77483'
            })
            .post('/login', function(data) {
                return data.username === 'admin' && data.password.length < 3;
            })
            .reply(403, {
                error: 'Invalid credentials'
            });
        
        nock(BASE_URL) // mock get session user information
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .get('/login')
            .query(true)
            .reply(200, {
                user: 'admin',
                admin: true,
                roles: ['Healthcare', 'Research']
            });
        nock(BASE_URL) // mock get session user information
            .matchHeader('Authorization', /.*/)
            .get('/login')
            .query(true)
            .reply(401);

        nock(BASE_URL) // mock get query providers (with required authorization)
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .get('/providers')
            .query(true)
            .reply(200, ["cbir", "lucene"]);

        nock(BASE_URL) // mock get export presets (with required authorization)
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .get(/\/presets(\/admin)?/)
            .reply(200, [{
                name: "export1",
                fields: [
                    'PatientID',
                    'PatientName',
                    'StudyInstanceUID',
                    'SOPInstanceUID',
                ]
            }]);

        nock(BASE_URL) // mock save export preset (with required authorization)
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .post('/presets/admin/export2', () => true)
            .reply(200);

        nock(BASE_URL) // mock get export presets (after save of export2)
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .get(/\/presets(\/admin)?/)
            .reply(200, [{
                name: "export1",
                fields: [
                    'PatientID',
                    'PatientName',
                    'StudyInstanceUID',
                    'SOPInstanceUID',
                ]
            }, {
                name: "export2",
                fields: [
                    'StudyInstanceUID',
                    'StudyDate',
                    'SOPInstanceUID',
                ]
            }]);

        nock(BASE_URL) // mock save export preset (no authorization)
            .post('/presets/admin/export2')
            .reply(401);

        nock(BASE_URL) // mock get export presets (no authorization)
            .get(/\/presets(\/admin)?/)
            .reply(401);

        nock(BASE_URL) // mock get providers (no token)
            .get('/providers')
            .query(true)
            .reply(401);

        nock(BASE_URL) // mock legacy behavior of POST logout (used GET in < 2.4.0)
            .post('/logout')
            .query(true)
            .reply(405);

        nock(BASE_URL) // mock legacy logout service (used GET in < 2.4.0)
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .get('/logout')
            .twice()
            .query(true)
            .reply(200);

        nock(BASE_URL) // mock latest behavior of POST logout
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .post('/logout')
            .twice()
            .query(true)
            .reply(200);


        nockDone = true;
    }

    return dicoogleClient(BASE_URL);
}
