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
const assert = require('chai').assert;
const isDicomUUID = require('../lib/util').isDicomUUID;

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
