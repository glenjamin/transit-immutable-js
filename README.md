# transit-immutable-js

[Transit](https://github.com/cognitect/transit-js) serialisation for [Immutable.js](https://facebook.github.io/immutable-js/).

Transit is a serialisation format which builds on top of JSON to provide a richer set of types. It is extensible, which makes it a good choice for easily providing serialisation and deserialisation capabilities for Immutable's types.

[![npm version](https://img.shields.io/npm/v/transit-immutable-js.svg)](https://www.npmjs.com/package/transit-immutable-js) [![Build Status](https://img.shields.io/travis/glenjamin/transit-immutable-js/master.svg)](https://travis-ci.org/glenjamin/transit-immutable-js) [![Coverage Status](https://coveralls.io/repos/glenjamin/transit-immutable-js/badge.svg?branch=master)](https://coveralls.io/r/glenjamin/transit-immutable-js?branch=master) ![MIT Licensed](https://img.shields.io/npm/l/transit-immutable-js.svg)

## Install

```sh
npm install transit-immutable-js
```

You must also be using `immutable` for this to be any use.

I have chosen to apply very broad npm peerDependencies for simplicity, please check that the versions you have pulled in actually work.

## Usage

```js
var transit = require('transit-immutable-js');
var Immutable = require('immutable');

var m = Immutable.Map({with: "Some", data: "In"});

var str = transit.toJSON(m);

console.log(str)
// ["~#cmap",["with","Some","data","In"]]

var m2 = transit.fromJSON(str);

console.log(Immutable.is(m, m2));
// true
```

This library also manages to preserve objects which are a mixture of plain javascript and Immutable.

```js
var obj = {
  iMap: Immutable.Map().set(Immutable.List.of(1, 2, 3), "123"),
  iList: Immutable.List.of("a", "b", "c"),
  array: [ "javascript", 4, "lyfe" ]
}

console.log(transit.fromJSON(transit.toJSON(obj)));
// { iMap: Map { [1,2,3]: "123" },
//  iList: List [ "a", "b", "c" ],
//  array: [ 'javascript', 4, 'lyfe' ] }
```

## API

### `transit.toJSON(object) => string`

Convert an immutable object into a JSON representation

### `transit.fromJSON(string) => object`

Convert a JSON representation back into an immutable object

> The `withXXX` methods can be combined as desired.

### `transit.withFilter(function) => transit`

Create a modified version of the transit API that deeply applies the provided filter function to all immutable collections before serialising. Can be used to exclude entries.

### `transit.withRecords(Array recordClasses, missingRecordHandler = null) => transit`

Creates a modified version of the transit API with support for serializing/deserializing [Record](https://facebook.github.io/immutable-js/docs/#/) objects. If a Record is included in an object to be serialized without the proper handler, on encoding it will be encoded as an `Immutable.Map`.

`missingRecordHandler` is called when a record-name is not found and can be used to handle the missing record manually. If no handler is given, the deserialisation process will throw an error. It accepts 2 parameters: `name` and `value` and the return value will be used instead of the missing record.

## Example `Record` Usage:

```js
var FooRecord = Immutable.Record({
  a: 1,
  b: 2,
}, 'foo');

var data = new FooRecord();

var recordTransit = transit.withRecords([FooRecord]);
var encodedJSON = recordTransit.toJSON(data);
```

## Example missing `Record` Usage:

```js
var BarRecord = Immutable.Record({
  c: '1',
  d: '2'
}, 'bar');

var FooRecord = Immutable.Record({
  a: 1,
  b: 2,
}, 'foo');

var data = new FooRecord({a: 3, b: 4});

var recordTransitFoo = transit.withRecords([FooRecord]);
var encodedJSON = recordTransitFoo.toJSON(data);

var recordTransitEmpty = transit.withRecords([], function (name, value) {
  switch (name) {
    case 'foo':
      return new BarRecord({c: value.a, d: value.b});
    default:
      return null;
  }
});

var decodedResult = recordTransitEmpty.fromJSON(encodedJSON); // returns new BarRecord({c: 3, d: 4})
```
