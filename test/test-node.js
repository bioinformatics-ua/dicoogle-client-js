var assert = require('assert');
var mocha = require('mocha');
var describe = mocha.describe;
var it = mocha.it;
var Dicoogle = require('./service-mock')();

var DICOOGLE_VERSION = '2.4.0-TEST';

function assertSameContent(a, b) {
  var diff1 = a.filter(function(x) { return b.indexOf(x) < 0 });
  var diff2 = b.filter(function(x) { return a.indexOf(x) < 0 });
  assert.deepStrictEqual(diff1, [], 'array contents should be the same');
  assert.deepStrictEqual(diff2, [], 'array contents should be the same');
}

describe('Dicoogle Node.js Client', function() {

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
    it("should give some MR results with no error", function(done) {
      Dicoogle.search('Modality:MR', {keyword: true}, function(error, outcome) {
        assert.equal(error, null);
        assert('results' in outcome, 'outcome has results');
        assert(outcome.results instanceof Array, 'results must be an array');
        for (var i = 0; i < outcome.results.length; i++) {
            assert.equal(typeof outcome.results[i], 'object', 'all results must be objects');
            assert.equal(typeof outcome.results[i].fields, 'object', 'all results must have a fields object');
            assert.equal(typeof outcome.results[i].fields.Modality, 'MR', 'all results must be MR');
        }
        done();
      });
    });
  });

  describe('#search() free text', function() {
    it("should give some results with no error"); // TODO
  });
  
  describe('#dump()', function() {
    it("should give one result with no error"); // TODO
  });

  describe('#getRunningTasks()', function() {
    it("should give a list of task information with no error"); // TODO
  });
  
});

