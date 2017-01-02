const dicoogleClient = require('../../src');
const nock = require('nock');
const qs = require('querystring');

let nockDone = false;

/** Use nock to intercept Dicoogle client requests.
 * @returns {object} a Dicoogle access object Dicoogle access object connected to a mock Dicoogle server.
 */
module.exports = function createDicoogleMock() {
    const BASE_URL = "http://127.0.0.1:8484";
    if (!nockDone) {
        // prepare Dicoogle server mock
        nock(BASE_URL, { // mock /login with admin account
                reqheaders: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                 }
            })
            .post('/login', function(data) {
                const parsedData = qs.parse(data);
                return parsedData.username === 'admin' &&
                        typeof parsedData.password === 'string' &&
                        parsedData.password.length >= 3;
            })
            .twice()
            .reply(200, {
                user: 'admin',
                admin: true,
                roles: ['Healthcare', 'Research'],
                token: '9ebdff77-dffc-4904-a954-74f72ba77483'
            })
            .post('/login', function(data) {
                const parsedData = qs.parse(data);
                return parsedData.username === 'admin' && parsedData.password.length < 3;
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
            .matchHeader('Authorization', null)
            .get('/login')
            .query(true)
            .reply(401);

        nock(BASE_URL) // mock get query providers (with required authorization)
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .get('/providers')
            .query(true)
            .reply(200, ["cbir", "lucene"]);

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
};
