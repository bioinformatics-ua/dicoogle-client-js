/* eslint-env mocha */
var assert = require('chai').assert;
var createMockedDicoogle = require('./mock/service-mock');

var DICOOGLE_VERSION = '2.4.0-TEST';

function assertDicomUUID(uid) {
    assert.strictEqual(typeof uid, 'string', "UUID must be a string");
    assert(uid.match(/(\d+\.?)*/), "'" + uid + "' must be a valid DICOM UUID");
}

describe('Dicoogle Client (under Node.js)', function() {
  var Dicoogle;
  beforeEach(function initBaseURL() {
    Dicoogle = createMockedDicoogle();
    assert.strictEqual(Dicoogle.getBase(), 'http://127.0.0.1:8080');
  });

  describe('#getVersion()', function() {
    it("should give Dicoogle's version with no error", function(done) {
      Dicoogle.getVersion(function(error, outcome) {
        assert.equal(error, null);
        assert.propertyVal(outcome, 'version', DICOOGLE_VERSION);
        done();
      });
    });
  });

  describe('#getQueryProviders()', function() {
    it("should give 'lucene' and 'cbir' with no error", function(done) {
      Dicoogle.getQueryProviders(function(error, providers) {
        assert.equal(error, null);
        assert.sameMembers(providers, ['lucene', 'cbir']);
        done();
      });
    });
  });

  describe('#getStorageProviders()', function() {
    it("should give 'file' and 'dropbox' with no error", function(done) {
      Dicoogle.getStorageProviders(function(error, providers) {
        assert.equal(error, null);
        assert.sameMembers(providers, ['file', 'dropbox']);
        done();
      });
    });
  });

  describe('#search() keyword based', function() {
    it("should auto-detect a keyword-based query and give some MR results with no error", function(done) {
      Dicoogle.search('Modality:MR', {provider: 'lucene'}, function(error, outcome) {
        assert.equal(error, null);
        assert.property(outcome, 'results', 'outcome has results');
        assert.isArray(outcome.results, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            assert.isObject(outcome.results[i], 'all results must be objects');
            assert.isObject(outcome.results[i].fields, 'all results must have a fields object');
            assert.strictEqual(outcome.results[i].fields.Modality, 'MR', 'all results must be MR');
            assertDicomUUID(outcome.results[i].fields.SOPInstanceUID);
        }
        assert(typeof outcome.elapsedTime, 'number', 'outcome has the elapsed time');
        done();
      });
    });
  });

  describe('#searchDIM() keyword based', function() {
    it("should give some results in the DIM format successfully", function(done) {
      Dicoogle.searchDIM('Modality:MR', {provider: 'lucene', keyword: true}, function(error, outcome) {
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

  describe('#index() on one provider', function() {
    it("should say ok with no error", function (done) {
        Dicoogle.index('/opt/another-dataset', 'lucene', function(error) {
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

  describe('#getRunningTasks()', function() {
    it("should give a list of task information with no error", function(done) {
        Dicoogle.getRunningTasks(function(error, outcome) {
          assert.equal(error, null);
          assert.property(outcome, 'tasks', 'outcome has tasks');
          var tasks = outcome.tasks;
          assert.isArray(tasks, 'tasks must be an array');
          for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            assert.isObject(task, 'task must be an object');
            assert.isString(task.taskUid, 'taskUid must be a string');
            assert.isString(task.taskName, 'taskName must be a string');
            assert.isNumber(task.taskProgress, 'taskProgress must be a number');
            assert(!('complete' in task) || typeof task.complete === 'boolean', 'complete must be a boolean');
            if (task.complete) {
              assert.isNumber(task.elapsedTime, 'elapsedTime must be a number');
              assert.isNumber(task.nIndexed, 'nIndexed must be a number');
              assert.isNumber(task.nErrors, 'nErrors must be a number');
            }
          }
          assert.isNumber(outcome.count, 'outcome has count');
          done();
        });
    });
  });

  function checkServiceInfo(error, data) {
    assert.equal(error, null);
    assert.isBoolean(data.isRunning, 'isRunning must be a boolean');
    assert.isBoolean(data.autostart, 'autostart must be a boolean');
    assert.strictEqual(data.port | 0, data.port, 'port must be an integer');
  }

  describe('Query/Retrieve service', function() {
    describe('#getQueryRetrieveServiceStatus()', function() {
        it("should inform of DICOM QR service status with no error", function(done) {
            Dicoogle.getQueryRetrieveServiceStatus(function (error, data) {
                checkServiceInfo(error, data);
                done();
            })
        });
    });
    describe('#stopQueryRetrieveService()', function() {
        it("should give no error", function(done) {
            Dicoogle.stopQueryRetrieveService(function (error) {
                assert.equal(error, null);
                done();
            })
        });
        it("and running = false", function(done) {
            Dicoogle.getQueryRetrieveServiceStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.isRunning, false);
                done();
            })
        });
    });
    describe('#startQueryRetrieveService()', function() {
        it("should give no error", function(done) {
            Dicoogle.startQueryRetrieveService(function (error) {
                assert.equal(error, null);
                done();
            })
        });
        it("and running = true", function(done) {
            Dicoogle.getQueryRetrieveServiceStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.isRunning, true);
                done();
            })
        });
    });
  });

  describe('Storage service', function() {
    describe('#getStorageServiceStatus()', function() {
        it("should inform of DICOM Storage service status with no error", function(done) {
            Dicoogle.getStorageServiceStatus(function (error, data) {
                checkServiceInfo(error, data);
                done();
            })
        });
    });
    describe('#stopQueryService()', function() {
        it("should give no error", function(done) {
            Dicoogle.stopStorageService(function (error) {
                assert.equal(error, null);
                done();
            })
        });
        it("and running = false", function(done) {
            Dicoogle.getStorageServiceStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.isRunning, false);
                done();
            })
        });
    });
    describe('#startStorageService()', function() {
        it("should give no error", function(done) {
            Dicoogle.startStorageService(function (error) {
                assert.equal(error, null);
                done();
            });
        });
        it("and running = true", function(done) {
            Dicoogle.getStorageServiceStatus(function (error, data) {
                assert.equal(error, null);
                assert.strictEqual(data.isRunning, true);
                done();
            })
        });
    });
  });

  describe('#getIndexerSettings() all', function() {
    function testIndexerSettings(done) {
            Dicoogle.getIndexerSettings(function (error, data) {
                assert.equal(error, null);
                assert.isObject(data);
                assert.isString(data.path, 'path must be a string');
                assert.isNumber(data.effort, 'effort must be a number');
                assert.isBoolean(data.watcher, 'watcher must be a boolean');
                assert.isBoolean(data.thumbnail, 'thumbnail must be a boolean');
                assert.isBoolean(data.zip, 'zip must be a boolean');
                assert.isNumber(data.thumbnailSize, 'thumbnailSize must be a string');
                done();
            });
    }
    it("give indexer settings with no error (2.3.1)", testIndexerSettings);
    it("give indexer settings with no error (patched)", testIndexerSettings);
  });

  describe('#getIndexerSettings() one by one', function() {
    it("should give path, no error", function(done) {
        Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.PATH, function (error, data) {
            assert.equal(error, null);
            assert.strictEqual(data, '/opt/data', 'outcome must be path "/opt/data"');
            done();
        });
    });
    it("should give effort, no error", function(done) {
        Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.EFFORT, function (error, data) {
            assert.equal(error, null);
            assert.isNumber(data);
            done();
        });
    });
    it("should give watcher = false, no error", function(done) {
        Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.WATCHER, function (error, data) {
            assert.equal(error, null);
            assert.strictEqual(data, false);
            done();
        });
    });
    it("should give thumbnail = true, no error", function(done) {
        Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.INDEX_THUMBNAIL, function (error, data) {
            assert.equal(error, null);
            assert.strictEqual(data, true);
            done();
        });
    });
    it("should give thumbnailSize, no error", function(done) {
        Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.THUMBNAIL_SIZE, function (error, data) {
            assert.equal(error, null);
            assert.isNumber(data);
            done();
        });
    });
    it("should give zip, no error", function(done) {
        Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.ZIP, function (error, data) {
            assert.equal(error, null);
            assert.isBoolean(data);
            done();
        });
    });
  });

  describe('#setIndexerSettings() path only', function() {
    it("should say ok with no error", function(done) {
        Dicoogle.setIndexerSettings(Dicoogle.IndexerSettings.PATH, '/opt/somewhere/else', function (error) {
            assert.equal(error, null);
            done();
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
    it("give transfer syntax settings with no error (2.3.1)", testTransferSettings);
    it("give transfer syntax settings with no error (patched)", testTransferSettings);
  });

  describe('#setTransferSyntaxOption() an option', function() {
    it("should say ok with no error", function(done) {
        Dicoogle.setTransferSyntaxOption('1.2.840.10008.5.1.4.1.1.1', 'ExplicitVRBigEndian', true, function (error) {
            assert.equal(error, null);
            done();
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
});

