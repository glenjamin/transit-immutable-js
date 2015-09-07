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

    "Sets": Immutable.Set.of(1, 2, 3, 3),

    "OrderedSets": Immutable.OrderedSet.of(1, 4, 3, 3),

    "Ordered Maps": Immutable.OrderedMap()
      .set(2, 'a')
      .set(3, 'b')
      .set(1, 'c')

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
  describe('.withFilter(predicate)', function(){
    var filter = transit.withFilter(function(val, key) {
      return key[0] !== '_';
    });
    it('can ignore Map entries', function() {
      var input = Immutable.Map({
        a: 'foo', _b: 'bar', c: Immutable.Map({d: 'deep', _e: 'hide'})
      });
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.get('a')).to.eql('foo');
      expect(result.get('_b')).to.eql(undefined);
      expect(result.getIn(['c', 'd'])).to.eql('deep');
      expect(result.getIn(['c', '_e'])).to.eql(undefined);
    });

    it('can ignore OrderedMap entries', function() {
      var input = Immutable.OrderedMap()
        .set('a', 'baz').set('_b', 'bar')
        .set('c', Immutable.OrderedMap({d: 'deep', _e: 'hide'}));
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.get('a')).to.eql('baz');
      expect(result.get('_b')).to.eql(undefined);
      expect(result.getIn(['c', 'd'])).to.eql('deep');
      expect(result.getIn(['c', '_e'])).to.eql(undefined);
    });

    it('can ignore Set entries', function() {
      var input = Immutable.Set.of(1, 2, 3, 3, 'a');
      filter = transit.withFilter(function(val) {
        return typeof val === 'number';
      });
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.includes('a')).to.eql(false);
    });

    it('can ignore OrderedSet entries', function() {
      var input = Immutable.Set.of(1, 2, 3, 3, 'a');
      filter = transit.withFilter(function(val) {
        return typeof val === 'number';
      });
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.includes('a')).to.eql(false);
    });

    it('can ignore List entries', function() {
      var input = Immutable.List.of(1, 2, 3, 3, 'a');
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.includes('a')).to.eql(false);
    });
  });
});
