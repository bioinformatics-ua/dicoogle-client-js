/* eslint-env node */
var DicoogleClient = require('../..');
var nock = require('nock');
var nockDone = false;
var qs = require('querystring');

/** Use nock to intercept Dicoogle client requests.
 * @returns {object} a Dicoogle access object Dicoogle access object connected to a mock Dicoogle server.
 */
module.exports = function createDicoogleMock() {
    var BASE_URL = "http://127.0.0.1:8484";
    if (!nockDone) {
        // prepare Dicoogle server mock
        nock(BASE_URL, { // mock /login with admin account
                reqheaders: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                 }
            })
            .post('/login', function(data) {
                var parsedData = qs.parse(data);
                return parsedData.username === 'admin' &&
                        typeof parsedData.password === 'string' &&
                        parsedData.password.length >= 3;
            })
            .reply(200, {
                user: 'admin',
                admin: true,
                roles: ['Healthcare', 'Research'],
                token: '9ebdff77-dffc-4904-a954-74f72ba77483'
            });

        nock(BASE_URL) // mock get query providers (with required authorization)
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .get('/providers')
            .query(true)
            .reply(200, ["cbir", "lucene"]);

        nock(BASE_URL) // mock get providers (no token)
            .get('/providers')
            .query(true)
            .reply(401);

        nock(BASE_URL) // mock logout
            .matchHeader('Authorization', '9ebdff77-dffc-4904-a954-74f72ba77483')
            .post('/logout')
            .query(true)
            .reply(200);

        nockDone = true;
    }

    return DicoogleClient(BASE_URL);
};
