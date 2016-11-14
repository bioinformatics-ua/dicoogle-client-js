/* eslint-env mocha */
var assert = require('chai').assert;
var createMockedDicoogle = require('./mock/service-auth-mock');
var UUID_REGEXP = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

describe('Dicoogle Authentication', function() {
  var Dicoogle;
  function initBaseURL() {
    Dicoogle = createMockedDicoogle();
    assert.strictEqual(Dicoogle.getBase(), 'http://127.0.0.1:8484');
  }
  beforeEach(initBaseURL);

  describe('Before Authentication', function() {
    it("#getQueryProviders() without authorization should give an error", function(done) {
      Dicoogle.getQueryProviders(function(error, providers) {
        assert(error, 'should have an error');
        assert.equal(providers, null, 'providers should be null');
        done();
      });
    });
  });

  describe('Authentication', function() {
    it("#login() as admin ; should give user name, roles, admin and session token", function(done) {
      Dicoogle.login('admin', 'itsasecret', function(error, data) {
        assert.equal(error, null, 'should give no error');
        assert.strictEqual(data.user, 'admin', 'username should be ok');
        assert.isArray(data.roles, 'roles should be provided');
        assert.isBoolean(data.admin, 'admin flag expected');
        assert.isString(data.token, 'session token expected');
        assert.match(data.token, UUID_REGEXP);
        done();
      });
    });
  });

  describe('After Authentication', function() {
    it("#isAuthenticated() -> true", function() {
        assert.strictEqual(Dicoogle.isAuthenticated(), true);
    });

    it("#getQueryProviders() with authorization ; should give an array with no error", function(done) {
      Dicoogle.getQueryProviders(function(error, providers) {
        assert.equal(error, null, 'should give no error');
        assert.isArray(providers);
        done();
      });
    });

    it("#logout() ; should give no error and clear Dicoogle credentials", function(done) {
      Dicoogle.logout(function(error) {
        assert.equal(error, null, 'should give no error');
        assert.strictEqual(Dicoogle.getToken(), null, 'internal token should be null');
        assert.strictEqual(Dicoogle.getUsername(), null, 'username should be null');
        assert.strictEqual(Dicoogle.getRoles(), null, 'roles should be null');
        done();
      });
    });

    it("#login() as admin with wrong password ; should error", function(done) {

      Dicoogle.login('admin', '', function(error) {
        assert.instanceOf(error, Error, 'should give an error');
        assert.isObject(error.response, 'should hold response object');
        done();
      });
    });
  });

  describe('Loading a previous session', function() {
    var TOKEN = '00000000-0000-0000-0000-000000000001';
    it('#setToken(string) should modify the session token', function() {
      Dicoogle.setToken(TOKEN);
      assert.strictEqual(Dicoogle.getToken(), TOKEN);
    });
  });

});

