/* eslint-env node */
var assert = require('assert');
var mocha = require('mocha');
var describe = mocha.describe;
var it = mocha.it;
var beforeEach = mocha.beforeEach;
var createMockedDicoogle = require('./mock/service-auth-mock');

var UUID_REGEXP = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

describe('Dicoogle Authentication', function() {
  var Dicoogle;
  function initBaseURL() {
    Dicoogle = createMockedDicoogle();
    assert.strictEqual(Dicoogle.getBase(), 'http://127.0.0.1:8484');
  }
  beforeEach(initBaseURL);

  describe('#getQueryProviders() without authorization', function() {
    it("should give an error", function(done) {
      Dicoogle.getQueryProviders(function(error, providers) {
        assert(error, 'should have an error');
        assert.equal(providers, null, 'providers should be null');
        done();
      });
    });
  });

  describe('#login() as admin', function() {
    it("should give user name, roles, admin and session token", function(done) {
      Dicoogle.login('admin', 'itsasecret', function(error, data) {
        assert.equal(error, null, 'should give no error, got: ' + error);
        assert.strictEqual(data.user, 'admin', 'username should be ok');
        assert(data.roles instanceof Array, 'roles should be provided');
        assert.strictEqual(typeof data.admin, 'boolean', 'admin flag expected');
        assert.strictEqual(typeof data.token, 'string', 'session token expected');
        assert(data.token.match(UUID_REGEXP))
        done();
      });
    });
  });

  describe('#getQueryProviders() with authorization', function() {
    it("should give an array with no error", function(done) {
      Dicoogle.getQueryProviders(function(error, providers) {
        assert.equal(error, null, 'should give no error, got: ' + error);
        assert(providers instanceof Array);
        done();
      });
    });
  });

  describe('#logout()', function() {
    it("should give no error and clear Dicoogle credentials", function(done) {
      Dicoogle.logout(function(error) {
        assert.equal(error, null, 'should give no error');
        assert.strictEqual(Dicoogle.getToken(), null, 'internal token should be null');
        assert.strictEqual(Dicoogle.getUsername(), null, 'username should be null');
        assert.strictEqual(Dicoogle.getRoles(), null, 'roles should be null');
        done();
      });
    });
  });

});

