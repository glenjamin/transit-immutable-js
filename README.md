# transit-immutable-js

Transit serialisation for Immutable.js

[![npm version](https://img.shields.io/npm/v/transit-immutable-js.svg)](https://www.npmjs.com/package/transit-immutable-js) [![Build Status](https://img.shields.io/travis/glenjamin/transit-immutable-js/master.svg)](https://travis-ci.org/glenjamin/transit-immutable-js) [![Coverage Status](https://coveralls.io/repos/glenjamin/transit-immutable-js/badge.svg?branch=master)](https://coveralls.io/r/glenjamin/transit-immutable-js?branch=master) ![MIT Licensed](https://img.shields.io/npm/l/transit-immutable-js.svg)

## Install

```sh
npm install transit-immutable-js
```

You must also be using `immutable` for this to be any use.

I have chosen to apply very broad npm peerDependencies for simplicity, please check that the versions you have pulled in actually work.

## Usage

```js
var transit = require('./');
var Immutable = require('immutable');

var m = Immutable.Map({with: "Some", data: "In"});

var str = transit.toJSON(m);

console.log(str)
// ["^ ","with","Some","data","In"]

var m2 = transit.fromJSON(str);

console.log(Immutable.is(m, m2));
// true
```

## API

### `transit.fromJSON(object) => string`

Convert an immutable object into a JSON representation

### `transit.toJSON(string) => object`

Convert a JSON representation back into an immutable object
