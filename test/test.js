/* eslint-env mocha */
var chai = require('chai');
chai.use(require('chai-immutable'));
var expect = chai.expect;
var Immutable = require('immutable');

var transit = require('../');

describe('transit', function() {
  Immutable.Map({

    "Immutable Maps": Immutable.Map({"abc": "def"}),

    "Immutable Maps with numeric keys": Immutable.Map().set(1, 2),

    "Immutable Maps in Maps": Immutable.Map()
      .set(1, Immutable.Map([['X', 'Y'], ['A', 'B']]))
      .set(2, Immutable.Map({a: 1, b: 2, c: 3})),

    "Immutable Lists": Immutable.List.of(1, 2, 3, 4, 5),

    "Long Immutable Lists": Immutable.Range(0, 100).toList(),

    "Immutable Lists in Maps": Immutable.Map().set(
      Immutable.List.of(1, 2),
      Immutable.List.of(1, 2, 3, 4, 5)
    ),

  }).forEach(function(data, desc) {
    it('should round-trip ' + desc, function() {
      var roundTrip = transit.fromJSON(transit.toJSON(data));
      expect(roundTrip).to.be.an('object');
      expect(roundTrip).to.equal(data);
      expect(roundTrip).to.be.an.instanceOf(data.constructor);
    });
  });

  it('should convert JS arrays to Lists', function() {
    // well, ideally it shouldn't, but this doesn't seem very doable
    var result = transit.fromJSON(transit.toJSON([1, 2, 3]));
    expect(result).to.equal(Immutable.List.of(1, 2, 3));
  });

  it('should convert JS objects to Maps', function() {
    // well, ideally it shouldn't, but this doesn't seem very doable
    var result = transit.fromJSON(transit.toJSON({a: 1, b: "c"}));
    expect(result).to.equal(Immutable.Map([["a", 1], ["b", "c"]]));
  });

  it('should ignore functions', function() {
    var input = Immutable.Map({ a: function abc(){} });
    var result = transit.fromJSON(transit.toJSON(input));
    expect(result.get('a')).to.eql(null);
  });
});
