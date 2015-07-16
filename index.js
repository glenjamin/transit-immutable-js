var transit = require('transit-js');
var Immutable = require('immutable');

var reader = transit.reader('json', {
  arrayBuilder: {
    init: function() {
      return Immutable.List().asMutable();
    },
    add: function(l, v) {
      return l.push(v);
    },
    finalize: function(l) {
      return l.asImmutable();
    },
    fromArray: function(arr) {
      return Immutable.List(arr);
    }
  },
  mapBuilder: {
    init: function() {
      return Immutable.Map().asMutable();
    },
    add: function(m, k, v) {
      return m.set(k, v);
    },
    finalize: function(m) {
      return m.asImmutable();
    }
  },
  handlers: {
    cmap: function(v) {
      var m = Immutable.Map().asMutable();
      for (var i = 0; i < v.length; i += 2) {
        m = m.set(v[i], v[i + 1]);
      }
      return m.asImmutable();
    }
  }
});

var writer = transit.writer('json', {
  handlers: transit.map([
    Immutable.Map, transit.makeWriteHandler({
      tag: function() {
        return 'map';
      },
      rep: function(v) {
        return v;
      }
    }),
    Immutable.List, transit.makeWriteHandler({
      tag: function() {
        return "array";
      },
      rep: function(v) {
        return v;
      }
    }),
    Function, transit.makeWriteHandler({
      tag: function() {
        return '_';
      },
      rep: function() {
        return null;
      }
    })
  ])
});

exports.toJSON = toJSON;
function toJSON(data) {
  return writer.write(data);
}

exports.fromJSON = fromJSON;
function fromJSON(data) {
  return reader.read(data);
}
