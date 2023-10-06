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
import createMockedDicoogle from './mock/service-legacy-mock.js';
import { DicoogleAccess } from '../src/index.js';

const DICOOGLE_VERSION = '2.5.4-TEST';

describe('Dicoogle Client against old Dicoogle servers (under Node.js)', function() {
  let dicoogle: DicoogleAccess;
  before(function initBaseURL() {
    dicoogle = createMockedDicoogle(8282);
    assert.strictEqual(dicoogle.getBase(), 'http://127.0.0.1:8282');
  });

  describe('#getVersion()', function() {
    it("should give Dicoogle's version with no error", async function() {
      const {version} = await dicoogle.getVersion();
      assert.strictEqual(version, DICOOGLE_VERSION);
    });
  });

  describe('User management service', () => {
    it('#list should provide the list of users', async () => {
      const users = await dicoogle.users.list();
      assert.isArray(users);
      for (const u of users) {
        assert.property(u, 'username');
      }
    });

    it('#add and #remove should add and remove users (Dicoogle v2)', async () => {
      // add a new user
      const addSuccess = await dicoogle.users.add('drze', 'verygoodsecret', false);
      assert.isTrue(addSuccess);

      // check that the user now exists
      let users;
      users = await dicoogle.users.list();
      assert.deepInclude(users, {username: 'drze'});

      // now remove the user
      const removeSuccess = await dicoogle.users.remove('drze');
      assert.isTrue(removeSuccess);

      // check the list again
      users = await dicoogle.users.list();
      assert.notDeepInclude(users, {username: 'drze'});
    });
  });

  describe('#getTransferSettings() all', function() {
    async function testTransferSettings() {
      const data = await dicoogle.getTransferSyntaxSettings();
      assert.isArray(data);
      for (let i = 0; i < data.length; i++) {
        assert.isString(data[i].uid, 'uid must be a string');
        assert.isString(data[i].sop_name, 'sop_name must be a string');
        assert.isArray(data[i].options);
        for (let j = 0; j < data[i].options.length; j++) {
          assert.isString(data[i].options[j].name);
          assert.isBoolean(data[i].options[j].value);
        }
      }
    }
    it("should give transfer syntax settings (<=2.3.1)", testTransferSettings);
  });

});

