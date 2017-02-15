/* eslint-env mocha */
const assert = require('chai').assert;
const isDicomUUID = require('../src/util').isDicomUUID;

describe('Utils: #isDicomUUID()', function() {

    it("checks UUIDs ok", function() {
        assert(isDicomUUID("1.2.3.4.567"));
        assert(isDicomUUID("000.000.00000.000.000.00.00.00.00"));
        assert.isFalse(isDicomUUID("0...00"));
        assert.isFalse(isDicomUUID("...1242"));
        assert.isFalse(isDicomUUID("file:/opt/data/123"));
        assert.isFalse(isDicomUUID("1:/2/3/4"));
    });

});
