# Streamed

[![Build Status](https://travis-ci.org/constgen/streamed.svg?branch=master)](https://travis-ci.org/constgen/streamed)

**Streamed** is an array-like stream. It has methods that are similar to Array ones. In many cases it can be used as a replacement of arrays but with additional reactive features. "Reactive" means you can define a chain ones and stream will process collected data and future data as it arrives in the same way.

## Importing

## Basic usage

Streams are reactive and can handle values pushed before and after callbacks attached.

```js
var stream = new Streamed(Infinity)
stream.push(1, 2, 3)
stream.forEach(console.log)
stream.push(4, 5, 6)
```

outputs:

```txt
1
2
3
4
5
6
```

### Stream size

The first and the only argument of the `Streamed` class is its size (like in Array). It defines how much data will be buffered:

- `new Streamed(Infinity)`: Infinite size. All data will be stored in the stream instance
- `new Streamed({Number})`: Only last items of a given number will be saved. Old items will be destroyed.
- `new Streamed()`: No items will be buffered. Any data will be passed down to the stream but will not be stored in the instance.

Examples:

**Infinite:**

```js
var stream = new Streamed(Infinity)
stream.push(1, 2, 3, 4, 5, 6)
stream.forEach(console.log) // logs: 1, 2, 3, 4, 5, 6
```

**Limited:**

```js
var stream = new Streamed(4)
stream.push(1, 2, 3, 4, 5, 6)
stream.forEach(console.log) // logs: 3, 4, 5, 6
```

**Empty:**

```js
var stream = new Streamed()
stream.push(1, 2, 3, 4, 5, 6)
stream.forEach(console.log) // no logs. But will log if something is pushed later
```

Every option above is suitable for different cases. Typically you would like the last pushed value to be buffered. So you can create 1-size stream. Handlers attached any time in the future will handle only the last most relevant value. This makes a stream to act like an observable. See the example of tracking of a geo-position:

```js
var geoPositions = new Streamed(1)
geoPositions.push({long: 10.5788457, lat: 36.76867834})
geoPositions.push({long: 11.323122, lat: 34.4564656})
geoPositions.push({long: 12.7879993, lat: 35.778993})

geoPositions.forEach(console.log) //logs: {long: 12.7879993, lat: 35.778993} - only the latest position, because earlier are obsolete
```

## Chain methods

### .push(value:Any)

Passes the next value to a stream. If no argument is provided nothing is pushed. Returns a current stream.

### .forEach(callback:Function)

Similarly to array `callback` function is called on every item pushed. Only one argument is passed with an item value because streamed items has no indexes. Returns a new stream with the same values. So it can be chained after.

```js
var stream = new Streamed()
var iterationStream = stream
   .forEach(function(value){
      console.info(value)
   })
   .forEach(function(value){
      console.log(value)
   })
```

### .map(callback:Function)

Similarly to array `callback` function is called on every item pushed. Only one argument is passed with an item value because streamed items has no indexes. Returns a new stream with values returned from a `callback`. So it can be chained after.

```js
var stream = new Streamed()
var types = stream
   .map(getType)
   .map(toUpperCase)

function getType(value){
   return typeof value
}
function toUpperCase (value){
   return value.toUpperCase()
}

types.forEach(function(value){
   console.log(value)
})

// we need to push items to `stream` so they can flow to `types`
stream.push(1, 'str', undefined, {})
```

_Output:_

```txt
NUMBER
STRING
UNDEFINED
OBJECT
```

### .filter(callback:Function)

Similarly to array `callback` function is called on every item pushed. Only one argument is passed with an item value because streamed items has no indexes. Returns a new stream with values filtered with a `callback`. So it can be chained after.

```js
var stream = new Streamed()
var positiveNumbers = stream
   .filter(isNumber)
   .filter(isPositive)

function isNumber(value){
   return typeof value === 'number'
}
function isPositive (value){
   return value > 0
}

positiveNumbers.forEach(function(value){
   console.log(value)
})

// we need to push items to `stream` so they can flow to `positiveNumbers`
stream.push(-1, 0, 'str', undefined, {}, 10, Infinity)
```

_Output:_

```js
10
Infinity
```

### .buffer(size:Number)

### .reduce(callback:Function, initialValue)

### .merge(stream:Streamed)

### .pipe(stream:Streamed)

### .unpipe(stream:Streamed)

### .unsubscribe()

Removes all piped and chained streams. Call this if you want to stop to handle values in a stream and would like to destroy it.

```js
var stream = new Streamed()
function getType(value){
   return typeof value
}

stream.map(getType) // attach mapped stream
stream.unsubscribe() // destroy mapped stream and any other handlers
stream = undefined // delete reference
```

## Inheritance

Inheritance usually is used to provide a custom stream source. This may be UI input events, global events, server-sent events, etc. This example shows how to create a custom stream class of mouse moves in a browser:

```js
class MouseMoves extends Streamed {
   constructor (size) {
      super(size)
      window.addEventListener('mousemove', this, false)
   }
   handleEvent (event) {
      this.push(event)
   }
}


var mouseMoves = new MouseMoves(1)
mouseMoves.forEach(console.log)
```

## Lazy evaluation

## Cold and hot streams

Состояние flowing или paused, Flow Control

## Readable and Writable streams