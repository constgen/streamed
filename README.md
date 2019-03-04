# Streamed

[![Build Status](https://travis-ci.org/constgen/streamed.svg?branch=master)](https://travis-ci.org/constgen/streamed)

**Streamed** is an array-like stream. It has methods that are similar to Array ones. In many cases it can be used as a replacement of arrays but with additional reactive features. "Reactive" means you can define a chain ones and stream will process already collected data and future coming data in the same way.

## Importing

`streamed` can be installed from NPM

```bash
❯ npm install --save streamed
```

Then you can import it using ES syntax

```js
import Streamed from 'streamed' 
```

or using CommonJS 

```js
var Streamed = require('streamed')
```

Also it can be imported with the regular `<script>` tag. This will expose the `Streamed` variable to the global scope

```html
<script src="../node_modules/streamed/dist/streamed.js"></script>
<script>
   console.log(Streamed)
</script>
```

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

Passes the next value to a stream. If no argument is provided nothing is pushed. Returns a current stream. May have infinite amount of arguments which values will be respectively pushed to the stream.

```js
var stream = new Streamed()

stream.push('a')
stream.push('b')
stream.push('c')
// or
stream.push('a', 'b', 'c')
```

### .forEach(callback:Function)

Similarly to array, `callback` function is called on every item pushed. Only one argument is passed with an item value because streamed items has no indexes. Returns a new stream with the same values. So it can be chained after.

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

Inherits the size of the stream which it is attached to.

### .map(callback:Function)

Similarly to array, `callback` function is called on every item pushed. Only one argument is passed with an item value because streamed items has no indexes. Returns a new stream with values returned from a `callback`. So it can be chained after.

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

Inherits the size of the stream which it is attached to.

### .filter(callback:Function)

Similarly to array, `callback` function is called on every item pushed. Only one argument is passed with an item value because streamed items has no indexes. Returns a new stream with values filtered with a `callback`. So it can be chained after.

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

Inherits the size of the stream which it is attached to.

### .buffer(size:Number)

Creates a new stream from the existing one but with the given size. All values will be pushed without changes but buffered with the necessary limit. Returns a new stream.

```js
var stream = new Streamed() // 0 size
var numbers = stream
   .filter(isNumber)
   .buffer(3) // set necessary size

stream.push(1, '2', 3, 4, 5, '6')

stream.forEach(console.log) // logs:
numbers.forEach(console.log) // logs: 3, 4, 5
```

This method is convenient if you want to change the size of an existing stream producing a new one or if you want to keep some amount of last values in a memory if the original stream size is 0.

### .reduce(callback:Function, initialValue)

Similarly to array, `callback` function is called on every item pushed. Only one argument is passed with an item value because streamed items has no indexes. Returns a new stream with values returned from a `callback`. So it can be chained after.

```js
var numbers = new Streamed()
var sums = numbers
   .reduce(add)
   .forEach(function(value){
      console.log(value)
   })

function add(valueA, valueB) {
   return valueA + valueB
}

// we need to push items to `numbers` so they can flow to `sums`
numbers.push(1, 2, 3, 4, 5, 6, 7, 8)
```

_Output:_

```txt
1
3
6
10
15
21
28
36
```

The size of the result stream is **always reduced to 0**

There also an initial value can be passed as a second argument. It will be used as a first argument in the first call of the callback.

```js
var numbers = new Streamed(4)
var sums = numbers
   .reduce(add)
   .forEach(function(value){
      console.log(value)
   })

numbers.push(1, 2, 3, 4, 5, 6, 7, 8)

```

_Output:_

```txt
1
3
6
10
14
18
22
26
```

Reducing has an optimization for every of 3 types of streams: unlimited, limited and infinite. If the stream has a size, only the necessary amount of data will be computed, e.g.:

```js
var sums = numbers
   .reduce(add, 10) // pass 10 as an initial value
   .forEach(function(value){
      console.log(value)
   })

numbers.push(1, 2, 3, 4, 5, 6, 7, 8)

```

_Output:_

```txt
11
13
16
20
25
31
38
46
```

Keep in mind that if the size of the stream is 1 and there is no initial value the callback will be not applied at all to any of values.

### .merge(stream:Streamed)

Joins values passed to both streams to a single new stream. Returns a new stream.

```js
var streamA = new Streamed()
var streamB = new Streamed()
var streamTogether = streamA.merge(streamB)

streamTogether.forEach(console.log)

streamA.push(1)
streamB.push(2)
streamA.push(3)
```

_Output:_

```txt
1
2
3
```

This is not a sequenced stream. So there is no difference between `streamA.merge(streamB)` and `streamB.merge(streamA)`. The data is pushed as it arrives.

Since this method returns a new stream it may be merged with another one. For example you can merge several streams streamTogether

```js
streamA.merge(streamB).merge(streamC).merge(streamD)
```

The size of the new stream is equal to the sum of the sizes of 2 origin streams. It will completely buffer the values buffered in the both origin streams. E.g.:

```js
var streamA = new Streamed(2)
var streamB = new Streamed(3)
var streamTogether = streamA.merge(streamA)

console.log(streamTogether.size) // 5
```

### .pipe(stream:Streamed)

Forwards values from existing stream to another instance of a stream creating a connection between 2 streams. Returns the instance that is passed to the argument.

```js
var streamA = new Streamed()
var streamB = new Streamed()

streamA.pipe(streamB)
streamB.forEach(console.log)
streamA.push('a', 'b', 'c')
```

_Output:_

```text
a
b
c
```

### .unpipe(stream:Streamed)

Destroys the connection between "piped" streams. Returns the instance that is passed to the argument.

```js
var streamA = new Streamed()
var streamB = new Streamed()

streamA.pipe(streamB)
streamB.forEach(console.log)
streamA.push('a')
streamA.unpipe(streamB)
streamA.push('b', 'c')
```

_Output:_

```text
a
```

### .unsubscribe()

Removes all piped and chained streams. Call this if you want to stop to handle values in a stream and would like to destroy it. Returns the same stream.

```js
var stream = new Streamed()
function getType(value){
   return typeof value
}

stream.map(getType) // attach mapped stream
stream.unsubscribe() // destroy mapped stream and any other handlers
stream = undefined // delete reference
```

## Lazy evaluation

By default the stream computation is lazy and the data will start to flow thru chain if there is a side effect in form of one of two:

- `.forEach()` at the end
- `.pipe()` at the end

For example, console logs in this code will not be shown until `forEach()` is not attached

```js
var values = new Streamed(Infinity)
var processedValues = values.filter(function(value){
   console.log('filter', value)
   return value > 3
}).map(function(value){
   console.log('map', value)
   return value + 10
})

values.push(1, 2, 3, 4, 5)
```

This will not output anything as callbacks will not be even called. But as soon as we attach `forEach()` or pipe it to another stream, e.g.:

```js
processedValues.forEach(function(value){
   console.log('forEach', value)
})
```

it will output

```txt
filter 1
filter 2
filter 3
filter 4
map 4
forEach 14
filter 5
map 5
forEach 15
```

Looking at logs you may notice that data flows from top to down instead of left to right how it happens in regular Arrays.

We also have used `new Streamed(Infinity)` to not lose the data later. If you will not set the size and will not process the data in a moment when it is pushed it will be lost. Some time it is expected but some time it is not. You can manage it passing the necessary size limit in the first argument of the `Streamed` class.

### Cold and hot streams

If you are familiar with terminology of _hot_ and _cold_ streams it may be more clear to you if we say that

- all `Streamed` instances with undefined size are _cold_ streams by default
- all `Streamed` instances with the size greater than 0 are _hot_ streams by default
- `pipe()` and `forEach()` methods return _hot_ streams
- `map()`, `filter()`, `reduce()`, `merge()`, `buffer()`, `unpipe()` return _cold_ streams

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

<!-- 
Состояние flowing или paused, Flow Control -->

<!-- ### Readable and Writable streams -->