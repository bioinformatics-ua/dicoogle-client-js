/* eslint-env mocha */
var assert = require('assert');
var createMockedDicoogle = require('./mock/service-mock');

var DICOOGLE_VERSION = '2.4.0-TEST';

function assertSameContent(a, b) {
  var diff1 = a.filter(function(x) { return b.indexOf(x) < 0 });
  var diff2 = b.filter(function(x) { return a.indexOf(x) < 0 });
  assert.deepStrictEqual(diff1, [], 'array contents should be the same');
  assert.deepStrictEqual(diff2, [], 'array contents should be the same');
}

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
      Dicoogle.getVersion(function(error, version) {
        assert.equal(error, null);
        assert.deepStrictEqual(version, {version: DICOOGLE_VERSION});
        done();
      });
    });
  });

  describe('#getQueryProviders()', function() {
    it("should give 'lucene' and 'cbir' with no error", function(done) {
      Dicoogle.getQueryProviders(function(error, providers) {
        assert.equal(error, null);
        assertSameContent(providers, ['lucene', 'cbir']);
        done();
      });
    });
  });

  describe('#getStorageProviders()', function() {
    it("should give 'file' and 'dropbox' with no error", function(done) {
      Dicoogle.getStorageProviders(function(error, providers) {
        assert.equal(error, null);
        assertSameContent(providers, ['file', 'dropbox']);
        done();
      });
    });
  });

  describe('#search() keyword based', function() {
    it("should auto-detect a keyword-based query and give some MR results with no error", function(done) {
      Dicoogle.search('Modality:MR', {provider: 'lucene'}, function(error, outcome) {
        assert.equal(error, null);
        assert('results' in outcome, 'outcome has results');
        assert(outcome.results instanceof Array, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            assert.equal(typeof outcome.results[i], 'object', 'all results must be objects');
            assert.equal(typeof outcome.results[i].fields, 'object', 'all results must have a fields object');
            assert.equal(outcome.results[i].fields.Modality, 'MR', 'all results must be MR');
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
        assert('results' in outcome, 'outcome has results');
        assert(outcome.results instanceof Array, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            var patient = outcome.results[i];
            assert.strictEqual(typeof patient, 'object', 'all patients must be objects');
            assert(patient.studies instanceof Array, 'all patients must have a studies array');
            for (var j = 0; j < patient.studies.length; j++) {
                var study = patient.studies[i];
                assert.strictEqual(typeof study, 'object', 'all studies must be objects');
                assertDicomUUID(study.studyInstanceUID);
                assert(study.series instanceof Array, 'all studies must have a series array');
            }
            // no need to go deeper
        }
        assert(typeof outcome.elapsedTime, 'number', 'outcome has the elapsed time');
        done();
      });
    });
  });

  describe('#search() free text', function() {
    it("should auto-detect a free text query and give some results with no error", function(done) {
      Dicoogle.search('Esquina', function(error, outcome) {
        assert.equal(error, null);
        assert('results' in outcome, 'outcome has results');
        assert(outcome.results instanceof Array, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            assert.strictEqual(typeof outcome.results[i], 'object', 'all results must be objects');
            assert.strictEqual(typeof outcome.results[i].fields, 'object', 'all results must have a fields object');
            assertDicomUUID(outcome.results[i].fields.SOPInstanceUID);
        }
        assert.strictEqual(typeof outcome.elapsedTime, 'number', 'outcome has the elapsed time');
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
        assert('results' in outcome, 'outcome has results');
        assert.strictEqual(typeof outcome.results, 'object', 'results must be an object');
        assert.strictEqual(typeof outcome.results.fields, 'object', 'must have a fields object');
        assert.strictEqual(typeof outcome.elapsedTime, 'number', 'outcome has the elapsed time');
        done();
      });
    });
  });

  describe('#getRunningTasks()', function() {
    it("should give a list of task information with no error", function(done) {
        Dicoogle.getRunningTasks(function(error, outcome) {
          assert.equal(error, null);
          assert('tasks' in outcome, 'outcome has tasks');
          var tasks = outcome.tasks;
          assert(tasks instanceof Array, 'tasks must be an array');
          for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            assert.strictEqual(typeof task, 'object', 'task must be an object');
            assert.strictEqual(typeof task.taskUid, 'string', 'taskUid must be a string');
            assert.strictEqual(typeof task.taskName, 'string', 'taskName must be a string');
            assert.strictEqual(typeof task.taskProgress, 'number', 'taskProgress must be a number');
            assert(!('complete' in task) || typeof task.complete === 'boolean', 'complete must be a boolean');
            if (task.complete) {
              assert.strictEqual(typeof task.elapsedTime, 'number', 'elapsedTime must be a number');
              assert.strictEqual(typeof task.nIndexed, 'number', 'nIndexed must be a number');
              assert.strictEqual(typeof task.nErrors, 'number', 'nErrors must be a number');
            }
          }
          assert.strictEqual(typeof outcome.count, 'number', 'outcome has count');
          done();
        });
    });
  });

  function checkServiceInfo(error, data) {
    assert.equal(error, null);
    assert.strictEqual(typeof data.isRunning, 'boolean', 'isRunning must be a boolean');
    assert.strictEqual(typeof data.autostart, 'boolean', 'autostart must be a boolean');
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
                assert.strictEqual(typeof data, 'object');
                assert.strictEqual(typeof data.path, 'string', 'path must be a string');
                assert.strictEqual(typeof data.effort, 'number', 'effort must be a number');
                assert.strictEqual(typeof data.watcher, 'boolean', 'watcher must be a boolean');
                assert.strictEqual(typeof data.thumbnail, 'boolean', 'thumbnail must be a boolean');
                assert.strictEqual(typeof data.zip, 'boolean', 'zip must be a boolean');
                assert.strictEqual(typeof data.thumbnailSize, 'number', 'thumbnailSize must be a string');
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
            assert.strictEqual(typeof data, 'number');
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
            assert.strictEqual(typeof data, 'number');
            done();
        });
    });
    it("should give zip, no error", function(done) {
        Dicoogle.getIndexerSettings(Dicoogle.IndexerSettings.ZIP, function (error, data) {
            assert.equal(error, null);
            assert.strictEqual(typeof data, 'boolean');
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
                assert(data instanceof Array);
                for (var i = 0; i < data.length; i++) {
                    assert.strictEqual(typeof data[i].uid, 'string', 'uid must be a string');
                    assert.strictEqual(typeof data[i].sop_name, 'string', 'sop_name must be a string');
                    assert(data[i].options instanceof Array);
                    for (var j = 0; j < data[i].options.length; j++) {
                        assert.strictEqual(typeof data[i].options[j].name, 'string');
                        assert.strictEqual(typeof data[i].options[j].value, 'boolean');
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
                assert.strictEqual(typeof aetitle, 'string');
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

