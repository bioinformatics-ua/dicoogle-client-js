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
import createMockedDicoogle from './mock/service-mock';
const dicoogleClient = require('../src');

const DICOOGLE_VERSION = '2.4.1-TEST';

function assertDicomUUID(uid) {
  assert.strictEqual(typeof uid, 'string', "UUID must be a string");
  assert(uid.match(/^\d(\.\d+)*$/) !== null, "'" + uid + "' must be a valid DICOM UUID");
}

describe('Dicoogle Client, Promise API (under Node.js)', function() {
  /** @type {ReturnType<dicoogleClient>} */
  let dicoogle;
  before(function initBaseURL() {
    dicoogle = createMockedDicoogle(8181);
    assert.strictEqual(dicoogle.getBase(), 'http://127.0.0.1:8181');
  });


  describe('#getVersion()', function() {
    it("should give Dicoogle's version with no error", async function() {
      let {version} = await dicoogle.getVersion();
      assert.strictEqual(version, DICOOGLE_VERSION);
    });
  });

  describe('Get Log', function() {
    it("#getRawLog() should provide log text with no error", async function() {
      let text = await dicoogle.getRawLog();
      assert.isString(text);
    });
  });

  describe('Get Query Providers', function() {
    describe('using #getQueryProviders()', function() {
      it("should give 'lucene' and 'cbir' with no error", async function() {
        let providers = await dicoogle.getQueryProviders();
        assert.sameMembers(providers, ['lucene', 'cbir']);
      });
    });
    describe('using #getProviders(function)', function() {
      it("should give 'lucene' and 'cbir' with no error", async function() {
        let providers = await dicoogle.getProviders();
        assert.sameMembers(providers, ['lucene', 'cbir']);
      });
    });
  });

  describe('Get Index Providers', function() {
    it("#getIndexProviders()", async function() {
      let providers = await dicoogle.getIndexProviders();
      assert.sameMembers(providers, ['lucene', 'cbir']);
    });
  });

  describe('Get Storage Providers', function() {
    it("#getStorageProviders()", async function() {
      let providers = await dicoogle.getStorageProviders();
      assert.sameMembers(providers, ['file', 'dropbox']);
    });
  });

  describe('Tasks', function() {

    it("tasks#list() before changes", async function() {
      let outcome = await dicoogle.tasks.list();
      assert.isNumber(outcome.count);
      assert.isArray(outcome.tasks);
      assert.strictEqual(outcome.tasks.length, 2);
      assert(outcome.count <= outcome.tasks.length);
      for (let i = 0; i < outcome.tasks.length; i++) {
        let task = outcome.tasks[i];
        assert.isObject(task);
        assert.isString(task.taskUid);
        assert.isString(task.taskName);
        assert.isNumber(task.taskProgress);
        assert(!('complete' in task)
          || typeof task.complete === 'boolean');
        if (task.complete) {
          assert.isNumber(task.elapsedTime);
          assert.isNumber(task.nIndexed);
          assert.isNumber(task.nErrors);
        }
      }
    });

    it("tasks#close() should successfully clear the task", async function() {
      await dicoogle.tasks.close('f1b6588d-92c2-458c-8c77-e30d8706b662');

      let outcome = await dicoogle.tasks.list();
      assert.isArray(outcome.tasks);
      assert.strictEqual(outcome.tasks.length, 1);
      assert.strictEqual(outcome.count, 1);
      let task = outcome.tasks[0];
      assert.isObject(task);
      assert.isString(task.taskUid);
      assert.notEqual(task.taskUid, 'f1b6588d-92c2-458c-8c77-e30d8706b662');
    });

    it("tasks#stop() should successfully clear the task", async function() {
      await dicoogle.tasks.stop('1063922f-1823-4e43-8241-c84c1721a6c1');
      let outcome = await dicoogle.tasks.list();
      assert.deepEqual(outcome.tasks, []);
      assert.strictEqual(outcome.count, 0);
    });
  });

  describe('#search() keyword based', function() {
    function handleOutcome(outcome) {
        assert.property(outcome, 'results', 'outcome has results');
        assert.isArray(outcome.results, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            assert.isObject(outcome.results[i], 'all results must be objects');
            assert.isObject(outcome.results[i].fields, 'all results must have a fields object');
            assert.strictEqual(outcome.results[i].fields.Modality, 'MR', 'all results must be MR');
            assertDicomUUID(outcome.results[i].fields.SOPInstanceUID);
        }
        assert.isNumber(outcome.elapsedTime, 'outcome has the elapsed time');
    }

    it("takes a keyword-based query and gives results successfully", async function() {
      let outcome = await dicoogle.search('Modality:MR', {provider: 'lucene', keyword: true});
      handleOutcome(outcome);
    });

    it("auto-detects a keyword-based query and gives results successfully", async function() {
      let outcome = await dicoogle.search('Modality:MR', {provider: 'lucene'});
      handleOutcome(outcome);
    });
  });

  describe('#searchDIM()', function() {

    function handleResponse(outcome) {
        assert.property(outcome, 'results', 'outcome has results');
        assert.isArray(outcome.results, 'results must be an array');
        for (let i = 0; i < outcome.results.length; i++) {
            let patient = outcome.results[i];
            assert.isObject(patient, 'all patients must be objects');
            assert.isArray(patient.studies, 'all patients must have a studies array');
            for (let j = 0; j < patient.studies.length; j++) {
                let study = patient.studies[i];
                assert.isObject(study, 'all studies must be objects');
                assertDicomUUID(study.studyInstanceUID);
                assert.isArray(study.series, 'all studies must have a series array');
            }
            // no need to go deeper
        }
        assert.isNumber(outcome.elapsedTime, 'outcome has the elapsed time');
    }

    it("with options, gives results successfully", async function() {
      let outcome = await dicoogle.searchDIM('Modality:MR', {provider: 'lucene', keyword: true});
      handleResponse(outcome);
    });

    it("without options, gives results successfully", async function() {
      let outcome = await dicoogle.searchDIM('Modality:MR');
      handleResponse(outcome);
    });
  });

  describe('#search() free text', function() {
    it("should auto-detect a free text query and give some results with no error", async function() {
      let outcome = await dicoogle.search('Esquina');
      assert.property(outcome, 'results', 'outcome has results');
      assert.isArray(outcome.results, 'results must be an array');
      for (let i = 0; i < outcome.results.length; i++) {
          assert.isObject(outcome.results[i], 'all results must be objects');
          assert.isObject(outcome.results[i].fields, 'all results must have a fields object');
          assertDicomUUID(outcome.results[i].fields.SOPInstanceUID);
      }
      assert.isNumber(outcome.elapsedTime, 'outcome has the elapsed time');
    });
  });

  describe('Index', function() {
    describe('#index() on one provider', function() {
      it("should say ok with no error", async function() {
        await dicoogle.index('/opt/another-dataset', 'lucene');
      });
    });

    describe('#index() on all providers', function() {
      it("should say ok with no error", async function() {
        await dicoogle.index('file:/opt/another-dataset');
      });
    });
  });

  describe('Unindex', function() {
    describe('#unindex() on one provider', function() {
      it("should say ok with no error", async function() {
        await dicoogle.unindex('file:/opt/another-dataset/1_1.dcm', 'lucene');
      });
    });

    describe('#unindex() on all providers', function() {
      it("should say ok with no error", async function() {
        await dicoogle.unindex('file:/opt/another-dataset/1_1.dcm');
      });
    });

    describe('#unindex() multiple URIs', function() {
      it("should say ok with no error", async function() {
        await dicoogle.unindex([
          'file:/opt/another-dataset/1_1.dcm',
          'file:/opt/another-dataset/1_2.dcm',
        ]);
      });
    });
  });

  describe("Remove", function() {
    describe('#remove() a file', function() {
      it("should say ok with no error", async function() {
        await dicoogle.remove('file:/opt/another-dataset/1_1.dcm');
      });
    });
    describe('#remove() multiple files', function() {
      it("should say ok with no error", async function() {
        await dicoogle.remove([
          'file:/opt/another-dataset/1_1.dcm',
          'file:/opt/another-dataset/1_2.dcm',
          'file:/opt/another-dataset/1_3.dcm',
        ]);
      });
    });
  });

  describe('#dump()', function() {
    it("should give one result with no error", async function() {
      let outcome = await dicoogle.dump('1.2.3.4.5.6.7777777.4444.1');
      assert.property(outcome, 'results', 'outcome has results');
      assert.isObject(outcome.results, 'results must be an object');
      assert.isObject(outcome.results.fields, 'must have a fields object');
      assert.isNumber(outcome.elapsedTime, 'outcome has the elapsed time');
    });
  });

  describe('#issueExport()', function() {
    it("array of fields + options - should give a UID", async function() {
      let uid = await dicoogle.issueExport('Modality:MR', ['Modality', 'PatientName'], {keyword: true});
      assert.isString(uid, 'uid must be a string');
    });
    it("array of fields - should give a UID", async function() {
      let uid = await dicoogle.issueExport('Modality:MR', ['Modality', 'PatientName']);
      assert.isString(uid, 'uid must be a string');
    });
    it("one field - should give a UID", async function() {
      let uid = await dicoogle.issueExport('Modality:MR', 'SOPInstanceUID');
      assert.isString(uid, 'uid must be a string');
    });
  });

  describe('presets#fieldList()', function() {
    it("should return an array", async function() {
      let fields = await dicoogle.presets.fieldList();
      assert.isArray(fields, 'fields must be an array');
      for (const field of fields) {
        assert.isString(field, 'field must be a string');
      }
    });
  });

  describe('Web UI Plugins', function() {
      it("#getWebUIPlugins(); should give all plugins", async function() {
        let plugins = await dicoogle.getWebUIPlugins(null);
        assert.isArray(plugins, 'plugins is an array');
        assert(plugins.length > 0, 'list of web UI plugins not empty');
        for (const p of plugins) {
          assert.isObject(p, 'plugin is an object');
          assert.isString(p.name, 'plugin name ok');
          assert.isString(p.version, 'plugin version ok');
          assert.isString(p.slotId, 'plugin slot-id ok');
        }
      });
      it("#getWebUIPlugins(menu); should give all menu plugins", async function() {
        let plugins = await dicoogle.getWebUIPlugins('menu');
        assert.isArray(plugins, 'plugins is an array');
        assert(plugins.length > 0, 'list of web UI plugins not empty');
        for (const p of plugins) {
          assert.isObject(p, 'plugin is an object');
          assert.isString(p.name, 'plugin name ok');
          assert.isString(p.version, 'plugin version ok');
          assert.isString(p.slotId, 'plugin slot-id ok');
        }
      });
  });

  describe('Plugin info', function() {
    it("#getPlugins(); should give all plugin information", async function() {
      let resp = await dicoogle.getPlugins();
      assert.isObject(resp, 'resp is an object');
      assert.isArray(resp.plugins, 'resp.plugins is an array');
      assert.isArray(resp.sets, 'resp.sets is an array');
      assert.isArray(resp.dead, 'resp.dead is an array');
      let {plugins, sets, dead} = resp;
      assert(plugins.length > 0, 'list of plugins not empty');
      for (const p of plugins) {
          assert.isObject(p, 'plugin is an object');
          assert.isString(p.name, 'plugin name ok');
          assert.isString(p.type, 'plugin type ok');
      }
      for (const s of sets) {
        assert.isString(s, 'set is a string');
      }
      for (const d of dead) {
        assert.isObject(d, 'dead plugin is an object');
        assert.isString(d.name, 'dead plugin name ok');
        assert.isObject(d.cause, 'dead plugin cause is an object');
        assert.isString(d.cause.class, 'dead plugin cause.class is a string');
        assert.isString(d.cause.message, 'dead plugin cause is a string');
      }
    });

    it("#getPlugins(type); should give plugin information only of that type", async function() {
      let resp = await dicoogle.getPlugins('index');
      assert.isObject(resp, 'resp is an object');
      assert.isArray(resp.plugins, 'resp.plugins is an array');
      let {plugins} = resp;
      assert(plugins.length > 0, 'list of plugins not empty');
      for (const p of plugins) {
          assert.isObject(p, 'plugin is an object');
          assert.isString(p.name, 'plugin name ok');
          assert.equal(p.type, 'index', 'plugin type matches requested type');
      }
    });

    it("#enablePlugin(name); should enable the plugin", async function() {
      await dicoogle.enablePlugin('index', 'cbir');
    });

    it("#disablePlugin(name); should disable the plugin", async function() {
      await dicoogle.disablePlugin('index', 'cbir');
    });
  });

  function checkServiceInfo(data) {
    assert.isBoolean(data.isRunning, 'isRunning must be a boolean');
    assert.isBoolean(data.autostart, 'autostart must be a boolean');
    assert.strictEqual(data.port | 0, data.port, 'port must be an integer');
  }

  describe('Query/Retrieve service', function() {
    describe('queryRetrieve#getStatus()', function() {
      it("should inform of DICOM QR service status with no error", async function() {
        let data = await dicoogle.queryRetrieve.getStatus();
        checkServiceInfo(data);
      });
    });
    describe('queryRetrieve#stop()', function() {
      it("should give no error", async function() {
        await dicoogle.queryRetrieve.stop();
      });
      it("and isRunning = false", async function() {
        let data = await dicoogle.queryRetrieve.getStatus();
        assert.strictEqual(data.isRunning, false);
      });
    });
    describe('#queryRetrieve.start()', function() {
        it("should give no error", async function() {
          await dicoogle.queryRetrieve.start();
        });
        it("and isRunning = true", async function() {
          let data = await dicoogle.queryRetrieve.getStatus();
          assert.strictEqual(data.isRunning, true);
        });
    });
    describe('queryRetrieve#configure()', function() {
        it("should give no error", async function() {
          await dicoogle.queryRetrieve.configure({
            autostart: true,
            port: 7777
          });
        });
        it("and {autostart, port} changes", async function() {
          let data = await dicoogle.queryRetrieve.getStatus();
          assert.strictEqual(data.autostart, true);
          assert.strictEqual(data.port, 7777);
        });
    });

    describe('Settings', function() {
      describe('Get', function() {
        it("queryRetrieve#getDicomQuerySettings(); should give all settings", async function() {
          let data = await dicoogle.queryRetrieve.getDicomQuerySettings();
          for (const field in data) {
              assert.isNumber(data[field]);
          }
        });
      });
      describe('Set', function() {
        it("queryRetrieve#setDicomQuerySettings({responseTimeout: 1000}); should work ok", async function() {
          await dicoogle.queryRetrieve.setDicomQuerySettings({responseTimeout: 1000});
        });
      });
    });
  });

  describe('User management service', () => {
    it('#list should provide the list of users', async () => {
      let users = await dicoogle.users.list();
      assert.isArray(users);
      for (const u of users) {
        assert.property(u, 'username');
      }
    });

    it('#add and #remove should add and remove users', async () => {
      // add a new user
      let addSuccess = await dicoogle.users.add('drze', 'verygoodsecret', false);
      assert.isTrue(addSuccess);

      // check that the user now exists
      let users;
      users = await dicoogle.users.list();
      assert.deepInclude(users, {username: 'drze'});

      // now remove the user
      let removeSuccess = await dicoogle.users.remove('drze');
      assert.isTrue(removeSuccess);

      // check the list again
      users = await dicoogle.users.list();
      assert.notDeepInclude(users, {username: 'drze'});
    });
  });

  describe('Storage service', function() {
    describe('#storage.getStatus()', function() {
      it("should inform of DICOM Storage service status with no error", async function() {
        let data = await dicoogle.storage.getStatus();
        checkServiceInfo(data);
      });
    });
    describe('storage#stop()', function() {
      it("should give no error", async function() {
        await dicoogle.storage.stop();
      });
      it("and isRunning = false", async function() {
        let data = await dicoogle.storage.getStatus();
        assert.strictEqual(data.isRunning, false);
      });
    });
    describe('storage#start()', function() {
      it("should give no error", async function() {
        await dicoogle.storage.start();
      });
      it("and isRunning = true", async function() {
        let data = await dicoogle.storage.getStatus();
        assert.strictEqual(data.isRunning, true);
      });
    });

    describe('storage#configure()', function() {
      it("should give no error", async function() {
        let outcome = await dicoogle.storage.configure({
          autostart: true,
          port: 7777
        });
        assert.strictEqual(outcome.success, true);
        assert.strictEqual(outcome.autostart, true);
        assert.strictEqual(outcome.port, 7777);
      });
      it("and {autostart, port} changes", async function() {
        let data = await dicoogle.storage.getStatus();
        assert.strictEqual(data.autostart, true);
        assert.strictEqual(data.port, 7777);
      });
    });

    describe('Remote Storage Servers', function() {
      it("storage#getRemoteServers(); should give a list", async function() {
        let remotes = await dicoogle.storage.getRemoteServers();
        assert.isArray(remotes);
        for (const s of remotes) {
          assert.isObject(s);
          assert.isString(s.aetitle);
          assert.isString(s.ip);
          assert.isNumber(s.port);
          assert('description' in s || typeof s.description === 'string');
          assert('public' in s || typeof s.public === 'boolean');
        }
      });

      describe('Add', function() {
        it("storage#addRemoteServer(); increases list to 3 stores", async function() {
          await dicoogle.storage.addRemoteServer({
            aetitle: 'A_NEW_STORAGE',
            ip: '10.0.0.144',
            port: 6646
          });
          let remotes = await dicoogle.storage.getRemoteServers();
          assert.strictEqual(remotes.length, 3);
        });
        it("storage#addRemoteServer(); increases list to 4 stores", async function() {
          await dicoogle.storage.addRemoteServer({
            aetitle: 'ONE_MORE_SERV',
            ip: '10.0.0.145',
            port: 6666,
            description: 'our public store',
            public: true
          });
          let remotes = await dicoogle.storage.getRemoteServers();
          assert.strictEqual(remotes.length, 4);
        });
      });

      describe('Remove', function() {
        it("storage#removeRemoteServer(store); reduces the list back to 2", async function() {
          let removed = await dicoogle.storage.removeRemoteServer({
            aetitle: 'A_NEW_STORAGE',
            ip: '10.0.0.144',
            port: 6646
          });
          assert(removed);
          let remotes = await dicoogle.storage.getRemoteServers();
          assert.strictEqual(remotes.length, 2);
        });
        it("storage#removeRemoteServer(aetitle); should work", async function() {
          let removed = await dicoogle.storage.removeRemoteServer('STORAGE_NO_WAY');
          assert.isFalse(removed);
        });
      });
    });
  });

  describe('#getTransferSettings() all', function() {
    async function testTransferSettings() {
      let data = await dicoogle.getTransferSyntaxSettings();
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
    it("should give transfer syntax settings (2.3.1)", testTransferSettings);
    it("should give transfer syntax settings (patched)", testTransferSettings);
  });

  describe('#setTransferSyntaxOption() an option', function() {
    it("should say ok with no error", async function() {
      await dicoogle.setTransferSyntaxOption('1.2.840.10008.5.1.4.1.1.1', 'ExplicitVRBigEndian', true);
    });
  });

  describe('Indexer Settings', function() {
    describe('Get Indexer Settings', function() {
      it("#getIndexerSettings(); should give all settings", async function() {
        let data = await dicoogle.getIndexerSettings();
        assert.deepEqual(data, {
          path: '/opt/data',
          zip: false,
          effort: 100,
          thumbnail: true,
          thumbnailSize: 128,
          watcher: false
        });
      });

      function createTest(name, value) {
        return async () => {
          let data = await dicoogle.getIndexerSettings(name);
          assert.strictEqual(data, value);
        };
      }

      it("#getIndexerSettings('path')", createTest('path', '/opt/data'));
      it("#getIndexerSettings('zip')", createTest('zip', false));
      it("#getIndexerSettings('effort')", createTest('effort', 100));
      it("#getIndexerSettings('thumbnail')", createTest('thumbnail', true));
      it("#getIndexerSettings('thumbnailSize')", createTest('thumbnailSize', 128));
      it("#getIndexerSettings('watcher')", createTest('watcher', false));
    });

    describe('Set Indexer Settings', function() {
      it("#setIndexerSettings('zip', true) should work ok", async function() {
        await dicoogle.setIndexerSettings(dicoogle.IndexerSettings.ZIP, true);
        let out = await dicoogle.getIndexerSettings(dicoogle.IndexerSettings.ZIP);
        assert.strictEqual(out, true);
      });
      it("#setIndexerSettings({'zip': false}) should work ok", async function() {
        const newSettings = {};
        newSettings[dicoogle.IndexerSettings.ZIP] = false;
        await dicoogle.setIndexerSettings(newSettings);
        let out = await dicoogle.getIndexerSettings(dicoogle.IndexerSettings.ZIP);
        assert.strictEqual(out, false);
      });
    });
  });

  describe('AE Title', function() {
    let title;
    describe('#getAETitle()', function() {
      it("should give a valid AE title", async function() {
        let aetitle = await dicoogle.getAETitle();
        assert.isString(aetitle);
        title = aetitle;
      });
    });
    describe('#setAETitle()', function() {
      it("should give no error", async function() {
        title = title.split('').reverse().join('');
        await dicoogle.setAETitle(title);
      });
      it("and #getAETitle should give the AE title previously set", async function() {
        let aetitle = await dicoogle.getAETitle();
        assert.strictEqual(aetitle, title);
      });
    });
  });

  describe('Dicoogle generic request', function() {
    describe("Get Dicoogle version", function() {
      it("#request('GET', 'ext/version') should give Dicoogle's version with no error", async function() {
        let response = await dicoogle.request('GET', 'ext/version');
        assert.isObject(response.body);
        assert.propertyVal(response.body, 'version', DICOOGLE_VERSION);
      });
      it("#request('GET', ['ext', 'version']) should give Dicoogle's version with no error", async function() {
        let response = await dicoogle.request('GET', ['ext', 'version']);
        assert.isObject(response.body);
        assert.propertyVal(response.body, 'version', DICOOGLE_VERSION);
      });
    });
  });

  describe('Dicoogle is a singleton', function() {
    it('Calling dicoogleClient() after initializing should work', async function() {
      const D = dicoogleClient();

      let data = await D.getVersion();
      assert.isObject(data);
      assert.propertyVal(data, 'version', DICOOGLE_VERSION);
    });
  });
});

