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

/* eslint-env mocha */
import {assert} from 'chai';
import createMockedDicoogle from './mock/service-auth-mock';
const UUID_REGEXP = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

describe('Dicoogle Authentication', function() {
  let Dicoogle;
  function initBaseURL() {
    Dicoogle = createMockedDicoogle();
    assert.strictEqual(Dicoogle.getBase(), 'http://127.0.0.1:8484');
  }
  beforeEach(initBaseURL);

  describe('Without Authentication', function() {
    it("#getQueryProviders() without authorization should give an error", function(done) {
      Dicoogle.getQueryProviders(function(error, providers) {
        assert(error, 'should have an error');
        assert.equal(providers, null, 'providers should be null');
        done();
      });
    });
  });

  describe('With Authentication', function() {
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

    it("presets#get() should give you a list of presets", function(done) {
      assert.isTrue(Dicoogle.isAuthenticated());
      Dicoogle.presets.get(function(error, presets) {
        assert.equal(error, null, 'should give no error');
        assert.isArray(presets);
        assert.equal(presets.length, 1);
        done();
      });
    });

    it("presets#save() should add a new preset to that list", function(done) {
      assert.isTrue(Dicoogle.isAuthenticated());
      Dicoogle.presets.save('admin', 'export2', [
        'StudyInstanceUID',
        'StudyDate',
        'SOPInstanceUID',
      ], function(error) {
        assert.equal(error, null, 'should give no error');

        // check that the new preset is there
        Dicoogle.presets.get('admin', function(error, presets) {
          assert.equal(error, null, 'should give no error');
          assert.isArray(presets);
          assert.equal(presets.length, 2);
          done();
        });
      });
    });

    it("Legacy #logout() ; should give no error and clear Dicoogle credentials", function(done) {
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
    const TOKEN = '00000000-0000-0000-0000-000000000001';
    it('#setToken(string) should modify the session token', function() {
      Dicoogle.setToken(TOKEN);
      assert.strictEqual(Dicoogle.getToken(), TOKEN);
    });
  });

  describe('Stable Authentication', function() {
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

    it("clear and restore previous session ; should give user name, admin and roles", function(done) {
        const token = Dicoogle.getToken();
        Dicoogle.reset();

        Dicoogle.restoreSession(token, function(error, data) {
          assert.equal(error, null, 'should give no error');
          assert.strictEqual(data.user, 'admin', 'username should be ok');
          assert.isArray(data.roles, 'roles should be provided');
          assert.isBoolean(data.admin, 'admin flag expected');
          done();
        });
    });

    it("Stable #logout() ; should give no error and clear Dicoogle credentials", function(done) {
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

