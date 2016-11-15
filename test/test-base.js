/* eslint-env mocha */
var assert = require('chai').assert;
var createMockedDicoogle = require('./mock/service-mock');

var DICOOGLE_VERSION = '2.4.1-TEST';

function assertDicomUUID(uid) {
    assert.strictEqual(typeof uid, 'string', "UUID must be a string");
    assert(uid.match(/(\d+\.?)*/), "'" + uid + "' must be a valid DICOM UUID");
}

function createCheckVersion(done) {
    return function(error, outcome) {
        assert.equal(error, null);
        assert.propertyVal(outcome, 'version', DICOOGLE_VERSION);
        done();
    };
}

describe('Dicoogle Client (under Node.js)', function() {
  var Dicoogle;
  beforeEach(function initBaseURL() {
    Dicoogle = createMockedDicoogle();
    assert.strictEqual(Dicoogle.getBase(), 'http://127.0.0.1:8080');
  });

  describe('#getVersion()', function() {
    it("should give Dicoogle's version with no error", function(done) {
      Dicoogle.getVersion(createCheckVersion(done));
    });
  });

  describe('Get Log', function() {
    it("#getRawLog() should provide log text with no error", function(done) {
      Dicoogle.getRawLog((error, text) => {
        assert.equal(error, null);
        assert.isString(text);
        done();
      });
    });
  });

  describe('Get Query Providers', function() {
    describe('using #getQueryProviders()', function() {
      it("should give 'lucene' and 'cbir' with no error", function(done) {
        Dicoogle.getQueryProviders(function(error, providers) {
          assert.equal(error, null);
          assert.sameMembers(providers, ['lucene', 'cbir']);
          done();
        });
      });
    });
    describe('using #getProviders(function)', function() {
      it("should give 'lucene' and 'cbir' with no error", function(done) {
        Dicoogle.getProviders(function(error, providers) {
          assert.equal(error, null);
          assert.sameMembers(providers, ['lucene', 'cbir']);
          done();
        });
      });
    });
  });

  describe('Get Index Providers', function() {
    it("#getIndexProviders()", function(done) {
      Dicoogle.getIndexProviders(function(error, providers) {
        assert.equal(error, null);
        assert.sameMembers(providers, ['lucene', 'cbir']);
        done();
      });
    });
  });

  describe('Get Storage Providers', function() {
    it("#getStorageProviders()", function(done) {
      Dicoogle.getStorageProviders(function(error, providers) {
        assert.equal(error, null);
        assert.sameMembers(providers, ['file', 'dropbox']);
        done();
      });
    });
  });

  describe('Tasks', function() {

    it("tasks#list() before changes", function(done) {
      Dicoogle.tasks.list(function(error, outcome) {
        assert.equal(error, null);
        assert.isNumber(outcome.count);
        assert.isArray(outcome.tasks);
        assert.strictEqual(outcome.tasks.length, 2);
        assert(outcome.count <= outcome.tasks.length);
        for (var i = 0; i < outcome.tasks.length; i++) {
            var task = outcome.tasks[i];
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
        done();
      });
    });

    it("tasks#close() should successfully clear the task", function(done) {
        Dicoogle.tasks.close('f1b6588d-92c2-458c-8c77-e30d8706b662', function(error) {
            assert.equal(error, null);
            Dicoogle.tasks.list(function(error, outcome) {
                assert.equal(error, null);
                assert.isArray(outcome.tasks);
                assert.strictEqual(outcome.tasks.length, 1);
                assert.strictEqual(outcome.count, 1);
                var task = outcome.tasks[0];
                assert.isObject(task);
                assert.isString(task.taskUid);
                assert.notEqual(task.taskUid, 'f1b6588d-92c2-458c-8c77-e30d8706b662');
                done();
            });
        });
    });

    it("tasks#stop() should successfully clear the task", function(done) {
        Dicoogle.tasks.stop('1063922f-1823-4e43-8241-c84c1721a6c1', function(error) {
            assert.equal(error, null);
            Dicoogle.tasks.list(function(error, outcome) {
                assert.equal(error, null);
                assert.deepEqual(outcome.tasks, []);
                assert.strictEqual(outcome.count, 0);
                done();
            });
        });
      });
  });

  describe('#search() keyword based', function() {
    function handleOutcome(error, outcome) {
        assert.equal(error, null);
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

    it("takes a keyword-based query and gives results successfully", function(done) {
      Dicoogle.search('Modality:MR', {provider: 'lucene', keyword: true}, function(error, outcome) {
        handleOutcome(error, outcome);
        done();
      });
    });

    it("auto-detects a keyword-based query and gives results successfully", function(done) {
      Dicoogle.search('Modality:MR', {provider: 'lucene'}, function(error, outcome) {
        handleOutcome(error, outcome);
        done();
      });
    });
  });

  describe('#searchDIM()', function() {

    function handleResponse(error, outcome) {
        assert.equal(error, null);
        assert.property(outcome, 'results', 'outcome has results');
        assert.isArray(outcome.results, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            var patient = outcome.results[i];
            assert.isObject(patient, 'all patients must be objects');
            assert.isArray(patient.studies, 'all patients must have a studies array');
            for (var j = 0; j < patient.studies.length; j++) {
                var study = patient.studies[i];
                assert.isObject(study, 'all studies must be objects');
                assertDicomUUID(study.studyInstanceUID);
                assert.isArray(study.series, 'all studies must have a series array');
            }
            // no need to go deeper
        }
        assert.isNumber(outcome.elapsedTime, 'outcome has the elapsed time');
    }

    it("with options, gives results successfully", function(done) {
      Dicoogle.searchDIM('Modality:MR', {provider: 'lucene', keyword: true}, function(error, outcome) {
        handleResponse(error, outcome);
        done();
      });
    });

    it("without options, gives results successfully", function(done) {
      Dicoogle.searchDIM('Modality:MR', function(error, outcome) {
        handleResponse(error, outcome);
        done();
      });
    });
  });

  describe('#search() free text', function() {
    it("should auto-detect a free text query and give some results with no error", function(done) {
      Dicoogle.search('Esquina', function(error, outcome) {
        assert.equal(error, null);
        assert.property(outcome, 'results', 'outcome has results');
        assert.isArray(outcome.results, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            assert.isObject(outcome.results[i], 'all results must be objects');
            assert.isObject(outcome.results[i].fields, 'all results must have a fields object');
            assertDicomUUID(outcome.results[i].fields.SOPInstanceUID);
        }
        assert.isNumber(outcome.elapsedTime, 'outcome has the elapsed time');
        done();
      });
    });
  });

  describe('Index', function() {
    describe('#index() on one provider', function() {
        it("should say ok with no error", function (done) {
            Dicoogle.index('/opt/another-dataset', 'lucene', function(error) {
                assert.equal(error, null);
                done();
            });
        });
    });

    describe('#index() on all providers', function() {
        it("should say ok with no error", function (done) {
            Dicoogle.index('/opt/another-dataset', function(error) {
                assert.equal(error, null);
                done();
            });
        });
    });
  });

  describe('Unindex', function() {
    describe('#unindex() on one provider', function() {
        it("should say ok with no error", function (done) {
            Dicoogle.unindex('/opt/another-dataset/1_1.dcm', 'lucene', function(error) {
                assert.equal(error, null);
                done();
            });
        });
    });

    describe('#unindex() on all providers', function() {
        it("should say ok with no error", function (done) {
            Dicoogle.unindex('/opt/another-dataset/1_1.dcm', function(error) {
                assert.equal(error, null);
                done();
            });
        });
    });
  });

  describe('#remove() a file', function() {
    it("should say ok with no error", function (done) {
        Dicoogle.remove('/opt/another-dataset/1_1.dcm', function(error) {
            assert.equal(error, null);
            done();
        });
    });
  });

  describe('#dump()', function() {
    it("should give one result with no error", function(done) {
      Dicoogle.dump('1.2.3.4.5.6.7777777.4444.1', function(error, outcome) {
        assert.equal(error, null);
        assert.property(outcome, 'results', 'outcome has results');
        assert.isObject(outcome.results, 'results must be an object');
        assert.isObject(outcome.results.fields, 'must have a fields object');
        assert.isNumber(outcome.elapsedTime, 'outcome has the elapsed time');
        done();
      });
    });
  });

  describe('Web UI Plugins', function() {
      it("#getWebUIPlugins(); should give all plugins", function(done) {
        Dicoogle.getWebUIPlugins(null, function (error, plugins) {
          assert.equal(error, null);
          assert.isArray(plugins, 'plugins is an array');
          assert(plugins.length > 0, 'list of web UI plugins not empty');
          for (const p of plugins) {
              assert.isObject(p, 'plugin is an object');
              assert.isString(p.name, 'plugin name ok');
              assert.isString(p.version, 'plugin version ok');
              assert.isString(p.slotId, 'plugin slot-id ok');
          }
          done();
        });
      });
      it("#getWebUIPlugins(menu); should give all menu plugins", function(done) {
        Dicoogle.getWebUIPlugins('menu', function (error, plugins) {
          assert.equal(error, null);
          assert.isArray(plugins, 'plugins is an array');
          assert(plugins.length > 0, 'list of web UI plugins not empty');
          for (const p of plugins) {
              assert.isObject(p, 'plugin is an object');
              assert.isString(p.name, 'plugin name ok');
              assert.isString(p.version, 'plugin version ok');
              assert.isString(p.slotId, 'plugin slot-id ok');
          }
          done();
        });
      });
  });


  function checkServiceInfo(error, data) {
    assert.equal(error, null);
    assert.isBoolean(data.running, 'running must be a boolean');
    assert.isBoolean(data.autostart, 'autostart must be a boolean');
    assert.strictEqual(data.port | 0, data.port, 'port must be an integer');
  }

  describe('Query/Retrieve service', function() {
    describe('queryRetrieve#getStatus()', function() {
        it("should inform of DICOM QR service status with no error", function(done) {
            Dicoogle.queryRetrieve.getStatus(function (error, data) {
                checkServiceInfo(error, data);
                done();
            });
        });
    });
    describe('queryRetrieve#stop()', function() {
        it("should give no error", function(done) {
            Dicoogle.queryRetrieve.stop(function (error) {
                assert.equal(error, null);
                done();
            });
        });
        it("and running = false", function(done) {
            Dicoogle.queryRetrieve.getStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.running, false);
                done();
            });
        });
    });
    describe('#queryRetrieve.start()', function() {
        it("should give no error", function(done) {
            Dicoogle.queryRetrieve.start(function (error) {
                assert.equal(error, null);
                done();
            })
        });
        it("and running = true", function(done) {
            Dicoogle.queryRetrieve.getStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.running, true);
                done();
            })
        });
    });
    describe('queryRetrieve#configure()', function() {
        it("should give no error", function(done) {
            Dicoogle.queryRetrieve.configure({
                autostart: true,
                port: 7777
            }, function (error) {
                assert.equal(error, null);
                done();
            });
        });
        it("and {autostart, port} changes", function(done) {
            Dicoogle.queryRetrieve.getStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.autostart, true);
                assert.strictEqual(data.port, 7777);
                done();
            })
        });
    });
  });

  describe('Storage service', function() {
    describe('#storage.getStatus()', function() {
        it("should inform of DICOM Storage service status with no error", function(done) {
            Dicoogle.storage.getStatus(function (error, data) {
                checkServiceInfo(error, data);
                done();
            })
        });
    });
    describe('storage#stop()', function() {
        it("should give no error", function(done) {
            Dicoogle.storage.stop(function (error) {
                assert.equal(error, null);
                done();
            })
        });
        it("and running = false", function(done) {
            Dicoogle.storage.getStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.running, false);
                done();
            })
        });
    });
    describe('storage#start()', function() {
        it("should give no error", function(done) {
            Dicoogle.storage.start(function (error) {
                assert.equal(error, null);
                done();
            });
        });
        it("and running = true", function(done) {
            Dicoogle.storage.getStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.running, true);
                done();
            })
        });
    });

    describe('storage#configure()', function() {
        it("should give no error", function(done) {
            Dicoogle.storage.configure({
                autostart: true,
                port: 7777
            }, function (error) {
                assert.equal(error, null);
                done();
            });
        });
        it("and {autostart, port} changes", function(done) {
            Dicoogle.storage.getStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.autostart, true);
                assert.strictEqual(data.port, 7777);
                done();
            })
        });
    });
  });

  describe('#getTransferSettings() all', function() {
    function testTransferSettings(done) {
            Dicoogle.getTransferSyntaxSettings(function (error, data) {
                assert.equal(error, null);
                assert.isArray(data);
                for (var i = 0; i < data.length; i++) {
                    assert.isString(data[i].uid, 'uid must be a string');
                    assert.isString(data[i].sop_name, 'sop_name must be a string');
                    assert.isArray(data[i].options);
                    for (var j = 0; j < data[i].options.length; j++) {
                        assert.isString(data[i].options[j].name);
                        assert.isBoolean(data[i].options[j].value);
                    }
                }
                done();
            });
    }
    it("should give transfer syntax settings (2.3.1)", testTransferSettings);
    it("should give transfer syntax settings (patched)", testTransferSettings);
  });

  describe('#setTransferSyntaxOption() an option', function() {
    it("should say ok with no error", function(done) {
        Dicoogle.setTransferSyntaxOption('1.2.840.10008.5.1.4.1.1.1', 'ExplicitVRBigEndian', true, function (error) {
            assert.equal(error, null);
            done();
        });
    });
  });

  describe('Indexer Settings', function() {
      describe('Get Indexer Settings', function() {
          it("#getIndexerSettings(); should give all settings", function(done) {
            Dicoogle.getIndexerSettings(function (error, data) {
                assert.equal(error, null);
                assert.deepEqual(data, {
                path: '/opt/data',
                zip: false,
                effort: 100,
                thumbnail: true,
                thumbnailSize: 128,
                watcher: false
                });
                done();
              });
          });

          function createTest(name, value) {
            return function(done) {
                Dicoogle.getIndexerSettings(name, function (error, data) {
                    assert.equal(error, null);
                    assert.strictEqual(data, value);
                    done();
                });
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
          it("#setIndexerSettings('zip', true) should work ok", function(done) {
            Dicoogle.setIndexerSettings(Dicoogle.IndexerSettings.ZIP, true, function (error) {
              assert.equal(error, null);
              Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.ZIP, function (error, out) {
                assert.equal(error, null);
                assert.strictEqual(out, true);
                done();
              });
            });
          });
          it("#setIndexerSettings({'zip': false}) should work ok", function(done) {
            const newSettings = {};
            newSettings[Dicoogle.IndexerSettings.ZIP] = false;
            Dicoogle.setIndexerSettings(newSettings, function (error) {
              assert.equal(error, null);
              Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.ZIP, function (error, out) {
                assert.equal(error, null);
                assert.strictEqual(out, false);
                done();
              });
            });
          });
      });
  });

  describe('AE Title', function() {
    var title;
    describe('#getAETitle()', function() {
        it("should give a valid AE title", function(done) {
            Dicoogle.getAETitle(function(error, aetitle) {
                assert.equal(error, null);
                assert.isString(aetitle);
                title = aetitle;
                done();
            });
        });
    });
    describe('#setAETitle()', function() {
        it("should give no error", function(done) {
            title = title.split('').reverse().join('');
            Dicoogle.setAETitle(title, function(error) {
                assert.equal(error, null);
                done();
            });
        });
        it("and #getAETitle should give the AE title previously set", function(done) {
            Dicoogle.getAETitle(function(error, aetitle) {
                assert.equal(error, null);
                assert.strictEqual(aetitle, title);
                done();
            });
        });
    });
  });

  describe('DICOM Query/Retrieve Settings', function() {
      describe('Get DICOM Query Settings', function() {
          it("#getDicomQuerySettings(); should give all settings", function(done) {
            Dicoogle.getDicomQuerySettings(function (error, data) {
                assert.equal(error, null);
                assert.isObject(data);
                for (const field in data) {
                    assert.isNumber(data[field]);
                }
                done();
              });
          });
      });
      describe('Get DICOM Query Settings', function() {
          it("#setDicomQuerySettings({responseTimeout: 1000}); should work ok", function(done) {
              Dicoogle.setDicomQuerySettings({responseTimeout: 1000}, function(error) {
                  assert.equal(error, null);
                  done();
              });
          });
      });
  });

  describe('Dicoogle generic request', function() {
      describe("Get Dicoogle version", function() {
          it("#request('GET', 'ext/version') should give Dicoogle's version with no error", function(done) {
              Dicoogle.request('GET', 'ext/version').end(function(err, response) {
                  assert.equal(err, null);
                  assert.isObject(response.body);
                  assert.propertyVal(response.body, 'version', DICOOGLE_VERSION);
                  done();
              });
          });
          it("#request('GET', ['ext', 'version']) should give Dicoogle's version with no error", function(done) {
              Dicoogle.request('GET', ['ext', 'version']).end(function(err, response) {
                  assert.equal(err, null);
                  assert.isObject(response.body);
                  assert.propertyVal(response.body, 'version', DICOOGLE_VERSION);
                  done();
              });
          });
      });
  });

});

