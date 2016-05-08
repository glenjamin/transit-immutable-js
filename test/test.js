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

// This is a hack because records and maps are considered equivalent by
// immutable.
// https://github.com/astorije/chai-immutable/issues/37
function expectImmutableEqual(r1, r2) {
  expect(r1).to.eql(r2);
  expect(r1.toString()).to.eql(r2.toString());
}
function expectNotImmutableEqual(r1, r2) {
  try {
    expectImmutableEqual(r1, r2);
  } catch (ex) {
    return true;
  }
  throw new chai.AssertionError('Expected ' + r1 + ' to differ from ' + r2);
}

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
        expectImmutableEqual(roundTrip, data);
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
        expectImmutableEqual(roundTrip, data);
      });
    });
  });

  it('should ignore functions', function() {
    var input = Immutable.Map({ a: function abc(){} });
    var result = transit.fromJSON(transit.toJSON(input));
    expect(result.get('a')).to.eql(null);
  });

  describe('Records', function() {
    var FooRecord = Immutable.Record({
      a: 1,
      b: 2,
    }, 'foo');

    var BarRecord = Immutable.Record({
      c: '1',
      d: '2'
    }, 'bar');

    var NamelessRecord = Immutable.Record({});

    var ClassyBase = Immutable.Record({name: 'lindsey'}, 'ClassyRecord');
    function ClassyRecord(values) { ClassyBase.call(this, values); }
    ClassyRecord.prototype = Object.create(ClassyBase.prototype);
    ClassyRecord.prototype.constructor = ClassyRecord;

    var recordTransit = transit.withRecords([FooRecord, BarRecord]);

    it('should ensure maps and records compare differently', function() {
      expectNotImmutableEqual(new FooRecord(), Immutable.Map({a: 1, b: 2}));
    });

    it('should round-trip simple records', function() {
      var data = Immutable.Map({
        myFoo: new FooRecord(),
        myBar: new BarRecord()
      });

      var roundTrip = recordTransit.fromJSON(recordTransit.toJSON(data));
      expectImmutableEqual(data, roundTrip);

      expect(roundTrip.get('myFoo').a).to.eql(1);
      expect(roundTrip.get('myFoo').b).to.eql(2);

      expect(roundTrip.get('myBar').c).to.eql('1');
      expect(roundTrip.get('myBar').d).to.eql('2');
    });

    it('should round-trip complex nested records', function() {
      var data = Immutable.Map({
        foo: new FooRecord({
          b: Immutable.List.of(BarRecord(), BarRecord({c: 22}))
        }),
        bar: new BarRecord()
      });

      var roundTrip = recordTransit.fromJSON(recordTransit.toJSON(data));
      expectImmutableEqual(data, roundTrip);
    });

    it('should serialize unspecified Record as a Map', function() {
      var data = Immutable.Map({
        myFoo: new FooRecord(),
        myBar: new BarRecord()
      });

      var oneRecordTransit = transit.withRecords([FooRecord]);
      var roundTripOneRecord = oneRecordTransit.fromJSON(
                                oneRecordTransit.toJSON(data));

      expectImmutableEqual(roundTripOneRecord, Immutable.fromJS({
        myFoo: new FooRecord(),
        myBar: {c: '1', d: '2'}
      }));

      var roundTripWithoutRecords = transit.fromJSON(transit.toJSON(data));

      expectImmutableEqual(roundTripWithoutRecords, Immutable.fromJS({
        myFoo: {a: 1, b: 2},
        myBar: {c: '1', d: '2'}
      }));
    });

    it('should roundtrip ES6-class-style records', function() {
      var data = new ClassyRecord({name: 'jon'});

      var classyTransit = transit.withRecords([ClassyRecord]);
      var roundTrip = classyTransit.fromJSON(classyTransit.toJSON(data));

      expectImmutableEqual(data, roundTrip);
    });

    it('throws an error when it is passed a record with no name', function() {
      expect(function() {
        transit.withRecords([NamelessRecord]);
      }).to.throw();
    });

    it('throws an error when it reads an unknown record type', function() {
      var input = new FooRecord();

      var json = recordTransit.toJSON(input);

      var emptyRecordTransit = transit.withRecords([]);

      expect(function() {
        emptyRecordTransit.fromJSON(json);
      }).to.throw();
    });

    it('throws an error if two records have the same name', function() {
      var R1 = Immutable.Record({}, 'R1');
      var R1_2 = Immutable.Record({}, 'R1');

      expect(function() {
        transit.withRecords([R1, R1_2]);
      }).to.throw();
    });

    it('should not throw an error with custom error-handler', function() {
      var input = new FooRecord();

      var json = recordTransit.toJSON(input);

      var emptyRecordTransit = transit.withRecords([], function() {
        return null;
      });

      expect(function() {
        emptyRecordTransit.fromJSON(json);
      }).to.not.throw();
    });

    it('should deserializing a FooRecord to BarRecord', function() {
      var input = new FooRecord({a: '3', b: '4'});

      var json = recordTransit.toJSON(input);

      var emptyRecordTransit = transit.withRecords([], function(n, v) {
        switch (n) {
        case 'foo':
          return new BarRecord({c: v.a, d: v.b});
        default:
          return null;
        }
      });
      var result = emptyRecordTransit.fromJSON(json);

      expect(result).to.be.an.instanceof(BarRecord);
      expect(result.c).to.eql('3');
      expect(result.d).to.eql('4');
    });
  });

  describe('.withFilter(predicate)', function(){
    var filterFunction = function(val, key) {
      return key[0] !== '_';
    };
    var filter = transit.withFilter(filterFunction);

    it('can ignore Map entries', function() {
      var input = Immutable.Map({
        a: 'foo', _b: 'bar', c: Immutable.Map({d: 'deep', _e: 'hide'})
      });
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.get('a')).to.eql('foo');
      expect(result.get('_b')).to.eql(undefined);
      expect(result.size).to.eql(2);
      expect(result.getIn(['c', 'd'])).to.eql('deep');
      expect(result.getIn(['c', '_e'])).to.eql(undefined);
      expect(result.getIn(['c']).size).to.eql(1);
    });

    it('can ignore OrderedMap entries', function() {
      var input = Immutable.OrderedMap()
        .set('a', 'baz').set('_b', 'bar')
        .set('c', Immutable.OrderedMap({d: 'deep', _e: 'hide'}));
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.get('a')).to.eql('baz');
      expect(result.get('_b')).to.eql(undefined);
      expect(result.size).to.eql(2);
      expect(result.getIn(['c', 'd'])).to.eql('deep');
      expect(result.getIn(['c', '_e'])).to.eql(undefined);
      expect(result.getIn(['c']).size).to.eql(1);
    });

    it('can ignore Set entries', function() {
      var input = Immutable.OrderedSet.of(1, 2, 3, 3, 'a');
      filter = transit.withFilter(function(val) {
        return typeof val === 'number';
      });
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.includes('a')).to.eql(false);
      expect(result.size).to.eql(3);
    });

    it('can ignore OrderedSet entries', function() {
      var input = Immutable.Set.of(1, 2, 3, 3, 'a');
      filter = transit.withFilter(function(val) {
        return typeof val === 'number';
      });
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.includes('a')).to.eql(false);
      expect(result.size).to.eql(3);
    });

    it('can ignore List entries', function() {
      var input = Immutable.List.of(1, 2, 3, 3, 'a');
      var result = filter.fromJSON(filter.toJSON(input));
      expect(result.includes('a')).to.eql(false);
      expect(result.size).to.eql(4);
    });

    it('can ignore Maps nested in Records', function() {
      var MyRecord = Immutable.Record({
        a: null,
        _b: 'bar'
      }, 'myRecord');

      var input = new MyRecord({a: Immutable.Map({_c: 1, d: 2}), _b: 'baz' });
      var recordFilter = transit
                          .withRecords([MyRecord])
                          .withFilter(filterFunction);

      var result = recordFilter.fromJSON(recordFilter.toJSON(input));

      expect(result.getIn(['a', 'd'])).to.eql(2);
      expect(result.getIn(['a', '_c'])).to.eql(undefined);
      expect(result.get('a').size).to.eql(1);
      expect(result.get('_b')).to.eql('baz');
    });

    it('should use missing-record-handler combined with filter', function() {
      var FooRecord = Immutable.Record({
        a: 1,
        b: 2,
      }, 'foo');

      var BarRecord = Immutable.Record({
        c: '1',
        d: '2'
      }, 'bar');

      var input = new Immutable.Map({
        _bar: new BarRecord(),
        foo: new FooRecord({
          a: 3,
          b: 4
        })
      });

      var missingRecordHandler = function(n, v) {
        switch (n) {
        case 'foo':
          return new BarRecord({c: v.a, d: v.b});
        default:
          return null;
        }
      };

      var recordFilter = transit
                          .withRecords([FooRecord, BarRecord])
                          .withFilter(filterFunction);
      var json = recordFilter.toJSON(input);
      recordFilter = transit
                      .withRecords([BarRecord], missingRecordHandler)
                      .withFilter(filterFunction);

      var result = recordFilter.fromJSON(json);

      expect(result.get('foo').c).to.eql(3);
      expect(result.get('foo').d).to.eql(4);
      expect(result.get('_bar')).to.eql(undefined);
    });

  });

  describe('Unknown Input', function() {
    it('fails when an unrecognized object is passed', function() {
      var MyObject = function() {};
      var MyObjectInstance = new MyObject();

      expect(function() {
        transit.toJSON(MyObjectInstance);
      }).to.throw();
    });
  });

});
