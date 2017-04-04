/* eslint-env mocha */
const assert = require('chai').assert;
const Socket = require('../lib/socket');

describe('Dicoogle Client socket (under Node.js)', function() {

    it("Empty URL fails", function() {
      assert.throws(() => {
          new Socket();
      });
    });

});
