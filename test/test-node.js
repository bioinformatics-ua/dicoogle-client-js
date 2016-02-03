var assert = require('assert');
var mocha = require('mocha');
var describe = mocha.describe;
var it = mocha.it;
var beforeEach = mocha.beforeEach;
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


describe('Dicoogle Node.js Client', function() {
  var Dicoogle;
  function initBaseURL() {
    Dicoogle = createMockedDicoogle();
    assert.strictEqual(Dicoogle.getBase(), 'http://127.0.0.1:8080');
  }
  beforeEach(initBaseURL);

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

  describe('#search() DIM, keyword based', function() {
    it("should give some results in the DIM format successfully", function(done) {
      Dicoogle.search('Modality:MR', {provider: 'lucene', dim: true, keyword: true}, function(error, outcome) {
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
    }); // TODO
  });


  function checkServiceInfo(error, data) {
    assert.equal(error, null);
    assert.strictEqual(typeof data.isRunning, 'boolean', 'isRunning must be a boolean');
    assert.strictEqual(typeof data.autostart, 'boolean', 'autostart must be a boolean');
    assert.strictEqual(data.port | 0, data.port, 'port must be an integer');
  }

  describe('#getQueryServiceStatus()', function() {
    it("should inform of DICOM QR service status with no error", function(done) {
        Dicoogle.getQueryRetrieveServiceStatus(function (error, data) {
            checkServiceInfo(error, data);
            done();
        })
    });
  });

  describe('#getQueryServiceStatus()', function() {
    it("should inform of DICOM Storage service status with no error", function(done) {
        Dicoogle.getStorageServiceStatus(function (error, data) {
            checkServiceInfo(error, data);
            done();
        })
    });
  });
});

