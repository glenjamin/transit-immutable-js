/* eslint-env mocha */
var chai = require('chai');
chai.use(require('chai-immutable'));
var expect = chai.expect;
var Immutable = require('immutable');

var transit = require('../');

var samples = Immutable.Map({

  "Immutable": Immutable.Map({

    "Maps": Immutable.Map({"abc": "def"}),

    "Maps with numeric keys": Immutable.Map().set(1, 2),

    "Maps in Maps": Immutable.Map()
      .set(1, Immutable.Map([['X', 'Y'], ['A', 'B']]))
      .set(2, Immutable.Map({a: 1, b: 2, c: 3})),

    "Lists": Immutable.List.of(1, 2, 3, 4, 5),

    "Long Lists": Immutable.Range(0, 100).toList(),

    "Lists in Maps": Immutable.Map().set(
      Immutable.List.of(1, 2),
      Immutable.List.of(1, 2, 3, 4, 5)
    ),

  }),

  JS: Immutable.Map({

    "array": [1, 2, 3, 4, 5],

    "array of arrays": [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9, 10]
    ],

    "array of immutables": [
      Immutable.Map({1: 2}),
      Immutable.List.of(1, 2, 3)
    ],

    "object": {
      a: 1,
      b: 2
    },

    "object of immutables": {
      a: Immutable.Map({1: 2}),
      b: Immutable.Map({3: 4})
    }

  })

});

describe('transit', function() {
  samples.get('Immutable').forEach(function(data, desc) {
    describe(desc + " - " + data.inspect(), function() {
      it('should encode to JSON', function() {
        var json = transit.toJSON(data);
        expect(json).to.be.a('string');
        expect(JSON.parse(json)).to.not.eql(null);
      });
      it('should round-trip', function() {
        var roundTrip = transit.fromJSON(transit.toJSON(data));
        expect(roundTrip).to.be.an('object');
        expect(roundTrip).to.equal(data);
        expect(roundTrip).to.be.an.instanceOf(data.constructor);
      });
    });
  });

  samples.get('JS').forEach(function(data, desc) {
    describe(desc + " - " + JSON.stringify(data), function() {
      it('should encode to JSON', function() {
        var json = transit.toJSON(data);
        expect(json).to.be.a('string');
        expect(JSON.parse(json)).to.not.eql(null);
      });
      it('should round-trip', function() {
        var roundTrip = transit.fromJSON(transit.toJSON(data));
        expect(roundTrip).to.eql(data);
      });
    });
  });

  it('should ignore functions', function() {
    var input = Immutable.Map({ a: function abc(){} });
    var result = transit.fromJSON(transit.toJSON(input));
    expect(result.get('a')).to.eql(null);
  });
});
