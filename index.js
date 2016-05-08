var transit = require('transit-js');
var Immutable = require('immutable');

function recordName(record) {
  /* eslint no-underscore-dangle: 0 */
  return record._name || record.constructor.name || 'Record';
}

function createReader(recordMap, missingRecordHandler) {
  return transit.reader('json', {
    mapBuilder: {
      init: function() {
        return {};
      },
      add: function(m, k, v) {
        m[k] = v;
        return m;
      },
      finalize: function(m) {
        return m;
      }
    },
    handlers: {
      iM: function(v) {
        var m = Immutable.Map().asMutable();
        for (var i = 0; i < v.length; i += 2) {
          m = m.set(v[i], v[i + 1]);
        }
        return m.asImmutable();
      },
      iOM: function(v) {
        var m = Immutable.OrderedMap().asMutable();
        for (var i = 0; i < v.length; i += 2) {
          m = m.set(v[i], v[i + 1]);
        }
        return m.asImmutable();
      },
      iL: function(v) {
        return Immutable.List(v);
      },
      iS: function(v) {
        return Immutable.Set(v);
      },
      iOS: function(v) {
        return Immutable.OrderedSet(v);
      },
      iR: function(v) {
        var RecordType = recordMap[v.n];
        if (!RecordType) {
          return missingRecordHandler(v.n, v.v);
        }

        return new RecordType(v.v);
      }
    }
  });

}

function createWriter(recordMap, predicate) {
  function mapSerializer(m) {
    var i = 0;
    if (predicate) {
      m = m.filter(predicate);
    }
    var a = new Array(2 * m.size);
    m.forEach(function(v, k) {
      a[i++] = k;
      a[i++] = v;
    });
    return a;
  }

  var handlers = transit.map([
    Immutable.Map, transit.makeWriteHandler({
      tag: function() {
        return 'iM';
      },
      rep: mapSerializer
    }),
    Immutable.OrderedMap, transit.makeWriteHandler({
      tag: function() {
        return 'iOM';
      },
      rep: mapSerializer
    }),
    Immutable.List, transit.makeWriteHandler({
      tag: function() {
        return "iL";
      },
      rep: function(v) {
        if (predicate) {
          v = v.filter(predicate);
        }
        return v.toArray();
      }
    }),
    Immutable.Set, transit.makeWriteHandler({
      tag: function() {
        return "iS";
      },
      rep: function(v) {
        if (predicate) {
          v = v.filter(predicate);
        }
        return v.toArray();
      }
    }),
    Immutable.OrderedSet, transit.makeWriteHandler({
      tag: function() {
        return "iOS";
      },
      rep: function(v) {
        if (predicate) {
          v = v.filter(predicate);
        }
        return v.toArray();
      }
    }),
    Function, transit.makeWriteHandler({
      tag: function() {
        return '_';
      },
      rep: function() {
        return null;
      }
    }),
    "default", transit.makeWriteHandler({
      tag: function() {
        return 'iM';
      },
      rep: function(m) {
        if (!('toMap' in m)) {
          var e = "Error serializing unrecognized object " + m.toString();
          throw new Error(e);
        }
        return mapSerializer(m.toMap());
      }
    })
  ]);

  Object.keys(recordMap).forEach(function(name) {
    handlers.set(recordMap[name], makeRecordHandler(name, predicate));
  });

  return transit.writer('json', {
    handlers: handlers
  });
}

function makeRecordHandler(name) {
  return transit.makeWriteHandler({
    tag: function() {
      return 'iR';
    },
    rep: function(m) {
      return {
        n: name,
        v: m.toObject()
      };
    }
  });
}

function buildRecordMap(recordClasses) {
  var recordMap = {};

  recordClasses.forEach(function(RecordType) {
    var rec = new RecordType({});
    var recName = recordName(rec);

    if (!recName || recName === 'Record') {
      throw new Error('Cannot (de)serialize Record() without a name');
    }

    if (recordMap[recName]) {
      throw new Error('There\'s already a constructor for a Record named ' +
                      recName);
    }
    recordMap[recName] = RecordType;
  });

  return recordMap;
}

function defaultMissingRecordHandler(recName) {
  var msg = 'Tried to deserialize Record type named `' + recName + '`, ' +
            'but no type with that name was passed to withRecords()';
  throw new Error(msg);
}

function createInstance(options) {
  var records = options.records || {};
  var filter = options.filter || false;
  var missingRecordFn = options.missingRecordHandler
                          || defaultMissingRecordHandler;

  var reader = createReader(records, missingRecordFn);
  var writer = createWriter(records, filter);

  return {
    toJSON: function toJSON(data) {
      return writer.write(data);
    },
    fromJSON: function fromJSON(json) {
      return reader.read(json);
    },
    withFilter: function(predicate) {
      return createInstance({
        records: records,
        filter: predicate,
        missingRecordHandler: missingRecordFn
      });
    },
    withRecords: function(recordClasses, missingRecordHandler) {
      var recordMap = buildRecordMap(recordClasses);
      return createInstance({
        records: recordMap,
        filter: filter,
        missingRecordHandler: missingRecordHandler
      });
    }
  };
}

module.exports = createInstance({});
