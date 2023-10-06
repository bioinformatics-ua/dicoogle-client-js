// Test that dicoogle-client can be used as a CommonJS module
const {assert} = require('chai');

describe('dicoogle-client CommonJS module', () => {

    it('can be imported as a CommonJS module using require', () => {
        const dicoogleClient = require('..');
        assert.isFunction(dicoogleClient);
        let dicoogle = dicoogleClient('http://localhost:8080');
        assert(dicoogle);
        assert.strictEqual(dicoogle.getBase(), 'http://localhost:8080');
    });

});
