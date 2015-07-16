var transit = require('transit-js');
var Immutable = require('immutable');

var reader = transit.reader('json', {
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
    iList: function(v) {
      return Immutable.List(v);
    },
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
        return 'cmap';
      },
      rep: function(m) {
        var i = 0, a = new Array(m.size);
        m.forEach(function(v, k) {
          a[i++] = k;
          a[i++] = v;
        });
        return a;
      }
    }),
    Immutable.List, transit.makeWriteHandler({
      tag: function() {
        return "iList";
      },
      rep: function(v) {
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
