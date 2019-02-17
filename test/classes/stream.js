'use strict'

var Stream = require('../../src/classes/stream')
var List = require('../../src/classes/list')

var spyOn = jest.spyOn

describe('Stream', function () {
	var stream
	var callback1
	var callback2
	var callback3
	var value1
	var value2
	var value3

	beforeEach(function () {
		spyOn(Stream.prototype, 'onopen')
		spyOn(Stream.prototype, 'onclose')
		stream = new Stream()
		callback1 = jest.fn(function (value) {
			return value * 2
		})
		callback2 = jest.fn(function (value) {
			return value > 2
		})
		callback3 = jest.fn(function (valueA, valueB) {
			return valueA + valueB
		})
		value1 = 'a'
		value2 = 'b'
		value3 = 'c'
	})

	afterEach(function () {
		callback1.mockReset()
		callback1.mockRestore()
		callback2.mockReset()
		callback2.mockRestore()
		callback3.mockReset()
		callback3.mockRestore()
		Stream.prototype.onopen.mockReset()
		Stream.prototype.onclose.mockReset()
	})

	it('returns a correct instance', function () {
		expect(stream).toBeInstanceOf(Stream)
	})

	it('correctly inherits', function () {
		expect(stream).toBeInstanceOf(List)
	})

	describe('initialization', function () {
		it('has no buffer by default', function () {
			expect(stream.bufferLength).toEqual(0)
		})
		it('is lazy by default', function () {
			expect(stream.onopen).not.toHaveBeenCalled()
			expect(stream.onclose).not.toHaveBeenCalled()
		})
		it('can be performed with a predefined length', function () {
			var length = 5
			stream = new Stream(length)
			expect(stream.bufferLength).toEqual(length)
		})
		it('can be performed with an invalid length', function () {
			stream = new Stream(null)
			expect(stream.bufferLength).toEqual(0)
		})
		it('can be performed with a negative length', function () {
			stream = new Stream(-5)
			expect(stream.bufferLength).toEqual(0)
		})
		it('can be performed with an Infinite length', function () {
			stream = new Stream(Infinity)
			expect(stream.bufferLength).toBe(Infinity)
		})
	})

	describe('subscription', function () {
		it('opens lazy streams', function () {
			stream.subscribe({})
			expect(stream.onopen).toHaveBeenCalled()
		})
		it('opens lazy streams ones', function () {
			stream.subscribe({})
			stream.subscribe({})
			stream.subscribe({})
			expect(stream.onopen).toHaveBeenCalledTimes(1)
		})
	})

	describe('unsubscription', function () {
		it('closes lazy streams', function () {
			var subscriber = {}
			stream.subscribe(subscriber)
			stream.unsubscribe(subscriber)
			expect(stream.onclose).toHaveBeenCalled()
		})
		it('closes lazy streams ones', function () {
			var subscriber = {}
			stream.subscribe(subscriber)
			stream.unsubscribe(subscriber)
			stream.unsubscribe(subscriber)
			expect(stream.onclose).toHaveBeenCalledTimes(1)
		})
		it('doesn\'t close not open streams', function () {
			var subscriber = {}
			stream.unsubscribe(subscriber)
			expect(stream.onopen).not.toHaveBeenCalled()
		})
	})

	describe('publishing', function () {
		beforeEach(function () {
			stream.subscribe({ subscription: callback1 })
			stream.subscribe({ subscription: callback2 })
			stream.subscribe({ subscription: callback3 })
		})

		it('calls subscribers', function () {
			stream.publish()
			expect(callback1).toHaveBeenCalledTimes(1)
			expect(callback2).toHaveBeenCalledTimes(1)
			expect(callback3).toHaveBeenCalledTimes(1)
		})
		it('calls subscribers with items', function () {
			var calls = expect.arrayContaining([
				[expect.objectContaining({
					value: value1
				})],
				[expect.objectContaining({
					value: value2
				})],
				[expect.objectContaining({
					value: value3
				})]
			])

			stream.publish({ value: value1 })
			stream.publish({ value: value2 })
			stream.publish({ value: value3 })
			expect(callback1.mock.calls).toEqual(calls)
			expect(callback2.mock.calls).toEqual(calls)
			expect(callback3.mock.calls).toEqual(calls)
		})
		it('performed on pushing', function () {
			stream.push()
			stream.push()
			stream.push()
			stream.push()
			expect(callback1).toHaveBeenCalledTimes(4)
			expect(callback2).toHaveBeenCalledTimes(4)
			expect(callback3).toHaveBeenCalledTimes(4)
		})
		it('performed on pushing with a value', function () {
			var item = expect.objectContaining({
				value: value1
			})
			stream.push(value1)
			expect(callback1).toHaveBeenLastCalledWith(item)
			expect(callback2).toHaveBeenLastCalledWith(item)
			expect(callback3).toHaveBeenLastCalledWith(item)
		})
		it('performed on pushing multiple values', function () {
			var calls = expect.arrayContaining([
				[expect.objectContaining({
					value: value1
				})],
				[expect.objectContaining({
					value: value2
				})],
				[expect.objectContaining({
					value: value3
				})]
			])
			stream.push(value1, value2, value3)
			expect(callback1.mock.calls).toEqual(calls)
			expect(callback2.mock.calls).toEqual(calls)
			expect(callback3.mock.calls).toEqual(calls)
		})
	})

	describe('`forEach` method', function () {
		var eachStream
		beforeEach(function () {
			eachStream = stream.forEach(callback1)
		})
		it('returns a stream instance', function () {
			expect(eachStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(eachStream).not.toEqual(stream)
		})
		it('is not lazy', function () {
			stream.push()
			expect(callback1).toHaveBeenCalled()
		})
		it('recieves stream data', function () {
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			expect(callback1.mock.calls).toEqual([[value1], [value2], [value3]])
		})
		it('doesn\'t modify data', function () {
			stream = new Stream(Infinity)
			eachStream = stream.forEach(callback1)
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			expect(eachStream.head.value).toEqual(value1)
			expect(eachStream.head.next.value).toEqual(value2)
			expect(eachStream.head.next.next.value).toEqual(value3)
		})
		it('performed when has buffered data', function () {
			stream = new Stream(Infinity)
			stream.push()
			stream.forEach(callback2)
			expect(callback2).toHaveBeenCalled()
		})
		it('inherits a length', function () {
			stream = new Stream(3)
			eachStream = stream.forEach(callback2)
			expect(eachStream.bufferLength).toEqual(3)
		})
		it('callback is iterated only ones', function () {
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			callback1.mockClear()
			stream.forEach(callback2)
			expect(callback1).not.toHaveBeenCalled()
		})
		it('throws error if invalid callback passed', function () {
			expect(function () {
				stream.forEach({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`buffer` method', function () {
		var limitedStream
		beforeEach(function () {
			limitedStream = stream.buffer(2)
		})
		it('returns a stream instance', function () {
			expect(limitedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(limitedStream).not.toEqual(stream)
		})
		it('is lazy', function () {
			stream.push(value1)
			expect(limitedStream.head).toBeNull()
		})
		it('doesn\'t modify data', function () {
			limitedStream.subscribe(new Stream())
			stream.push(1)
			stream.push(2)
			stream.push(3)
			expect(limitedStream.head.value).toEqual(2)
			expect(limitedStream.head.next.value).toEqual(3)
			expect(limitedStream.head.next.next).toBeNull()
		})
		it('limits a length', function () {
			limitedStream.subscribe(new Stream())
			stream.push(1)
			stream.push(2)
			stream.push(3)
			expect(limitedStream.length).toEqual(2)
		})
	})

	describe('`map` method', function () {
		var mappedStream
		beforeEach(function () {
			mappedStream = stream.map(callback1)
		})
		it('returns a stream instance', function () {
			expect(mappedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(mappedStream).not.toEqual(stream)
		})
		it('is lazy', function () {
			stream.push()
			expect(callback1).not.toHaveBeenCalled()
		})
		it('recieves stream data', function () {
			mappedStream.subscribe(new Stream())
			stream.push(1)
			stream.push(2)
			stream.push(3)
			expect(callback1.mock.calls).toEqual([[1], [2], [3]])
		})
		it('transforms values', function () {
			stream = new Stream(Infinity)
			mappedStream = stream.map(callback1)
			mappedStream.subscribe(new Stream())
			stream.push(1)
			stream.push(2)
			stream.push(3)
			expect(mappedStream.head.value).toEqual(2)
			expect(mappedStream.head.next.value).toEqual(4)
			expect(mappedStream.head.next.next.value).toEqual(6)
		})
		it('performed when has buffered data', function () {
			stream = new Stream(Infinity)
			stream.push()
			stream.map(callback2).subscribe(new Stream())
			expect(callback2).toHaveBeenCalled()
		})
		it('inherits a length', function () {
			stream = new Stream(3)
			mappedStream = stream.map(callback2)
			expect(mappedStream.bufferLength).toEqual(3)
		})
		it('callback is iterated only ones', function () {
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			callback1.mockClear()
			stream.map(callback2).subscribe(new Stream())
			expect(callback1).not.toHaveBeenCalled()
		})
		it('throws error if invalid callback passed', function () {
			expect(function () {
				stream.map({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`filter` method', function () {
		var filteredStream
		beforeEach(function () {
			filteredStream = stream.filter(callback2)
		})
		it('returns a stream instance', function () {
			expect(filteredStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(filteredStream).not.toEqual(stream)
		})
		it('is lazy', function () {
			stream.push()
			expect(callback2).not.toHaveBeenCalled()
		})
		it('recieves stream data', function () {
			filteredStream.subscribe(new Stream())
			stream.push(1)
			stream.push(2)
			stream.push(3)
			expect(callback2.mock.calls).toEqual([[1], [2], [3]])
		})
		it('filters values', function () {
			stream = new Stream(Infinity)
			filteredStream = stream.filter(callback2)
			filteredStream.subscribe(new Stream())
			stream.push(1)
			stream.push(2)
			stream.push(3)
			stream.push(4)
			expect(filteredStream.head.value).toEqual(3)
			expect(filteredStream.head.next.value).toEqual(4)
		})
		it('performed when has buffered data', function () {
			stream = new Stream(Infinity)
			stream.push()
			stream.filter(callback2).subscribe(new Stream())
			expect(callback2).toHaveBeenCalled()
		})
		it('inherits a length', function () {
			stream = new Stream(3)
			filteredStream = stream.filter(callback2)
			expect(filteredStream.bufferLength).toEqual(3)
		})
		it('callback is iterated only ones', function () {
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			callback2.mockClear()
			stream.filter(callback3).subscribe(new Stream())
			expect(callback2).not.toHaveBeenCalled()
		})
		it('throws error if invalid callback passed', function () {
			expect(function () {
				stream.filter({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`reduce` method', function () {
		var reducedStream
		beforeEach(function () {
			reducedStream = stream.reduce(callback2)
		})
		it('returns a stream instance', function () {
			expect(reducedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(reducedStream).not.toEqual(stream)
		})
		it('is lazy', function () {
			stream.push()
			expect(callback2).not.toHaveBeenCalled()
		})

		describe('without an initial value', function () {
			beforeEach(function () {
				reducedStream = stream.buffer(4).reduce(callback3)
			})
			it('recieves stream data', function () {
				reducedStream.subscribe(new Stream())
				stream.push(1)
				stream.push(2)
				stream.push(3)
				stream.push(4)
				expect(callback3.mock.calls).toEqual([[1, 2], [1, 2], [3, 3], [1, 2], [3, 3], [6, 4]])
			})
			it('reduces values', function () {
				reducedStream = reducedStream.buffer(3)
				reducedStream.subscribe(new Stream())
				stream.push(1)
				stream.push(2)
				stream.push(3)
				stream.push(4)
				expect(reducedStream.head.value).toEqual(3)
				expect(reducedStream.head.next.value).toEqual(6)
				expect(reducedStream.head.next.next.value).toEqual(10)
			})
			it('is not performed on a 1 item length streams', function () {
				stream = new Stream(1)
				stream.push(1)
				stream.reduce(callback3).subscribe(new Stream())
				stream.push(2)
				expect(callback3).not.toHaveBeenCalled()
			})
			it('performed when has buffered data longer or equal then 2', function () {
				stream = new Stream(2)
				stream.push(1)
				stream.push(2)
				stream.reduce(callback3).subscribe(new Stream())
				expect(callback3).toHaveBeenCalled()
			})
			it('resets a length', function () {
				stream = new Stream(3)
				reducedStream = stream.reduce(callback3)
				expect(reducedStream.bufferLength).toEqual(0)
			})
			it('callback is iterated only ones', function () {
				stream.push(value1)
				stream.push(value2)
				stream.push(value3)
				callback3.mockClear()
				stream.reduce(callback1).subscribe(new Stream())
				expect(callback3).not.toHaveBeenCalled()
			})
			it('callback is iterated only ones', function () {
				stream.push(value1)
				stream.push(value2)
				stream.push(value3)
				callback3.mockClear()
				stream.reduce(callback1)
				expect(callback3).not.toHaveBeenCalled()
			})
		})

		describe('with an initial value', function () {
			beforeEach(function () {
				reducedStream = stream.buffer(4).reduce(callback3, 100)
			})
			it('recieves stream data', function () {
				reducedStream.subscribe(new Stream())
				stream.push(1)
				stream.push(2)
				stream.push(3)
				stream.push(4)
				expect(callback3.mock.calls).toEqual([[100, 1], [100, 1], [101, 2], [100, 1], [101, 2], [103, 3], [100, 1], [101, 2], [103, 3], [106, 4]])
			})
			it('reduces values', function () {
				reducedStream = reducedStream.buffer(3)
				reducedStream.subscribe(new Stream())
				stream.push(1)
				stream.push(2)
				stream.push(3)
				expect(reducedStream.head.value).toEqual(101)
				expect(reducedStream.head.next.value).toEqual(103)
				expect(reducedStream.head.next.next.value).toEqual(106)
			})
			it('is performed on a 1 item length streams', function () {
				stream = new Stream(1)
				stream.push(1)
				stream.reduce(callback3, 100).subscribe(new Stream())
				expect(callback3).toHaveBeenCalled()
			})
			it('resets a length', function () {
				stream = new Stream(3)
				reducedStream = stream.reduce(callback3, 100)
				expect(reducedStream.bufferLength).toEqual(0)
			})
			it('callback is iterated only ones', function () {
				stream.push(value1)
				stream.push(value2)
				stream.push(value3)
				callback3.mockClear()
				stream.reduce(callback1, 200).subscribe(new Stream())
				expect(callback3).not.toHaveBeenCalled()
			})
			it('callback is iterated only ones', function () {
				stream.push(value1)
				stream.push(value2)
				stream.push(value3)
				callback3.mockClear()
				stream.reduce(callback1, 200)
				expect(callback3).not.toHaveBeenCalled()
			})
		})

		it('throws error if invalid callback passed', function () {
			expect(function () {
				stream.reduce({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`merge` method', function () {
		var mergedStream
		var additionalStream
		beforeEach(function () {
			stream = new Stream(3)
			additionalStream = new Stream(3)
			mergedStream = stream.merge(additionalStream)
		})
		it('returns a stream instance', function () {
			expect(mergedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(mergedStream).not.toEqual(stream)
			expect(mergedStream).not.toEqual(additionalStream)
		})
		it('is lazy', function () {
			stream.push()
			additionalStream.push()
			expect(mergedStream.head).toBeNull()
		})
		it('recieves stream data from a base stream', function () {
			mergedStream.forEach(callback1)
			stream.push(1)
			stream.push(2)
			stream.push(3)
			expect(callback1.mock.calls).toEqual([[1], [2], [3]])
		})
		it('recieves stream data from an additional stream', function () {
			mergedStream.forEach(callback1)
			additionalStream.push(1)
			additionalStream.push(2)
			additionalStream.push(3)
			expect(callback1.mock.calls).toEqual([[1], [2], [3]])
		})
		it('recieves stream data from both streams', function () {
			mergedStream.forEach(callback1)
			stream.push(1)
			additionalStream.push(2)
			stream.push(3)
			expect(callback1.mock.calls).toEqual([[1], [2], [3]])
		})
		it('merges sequence items', function () {
			mergedStream.forEach(callback1)
			stream.push(1)
			additionalStream.push(2)
			stream.push(3)
			additionalStream.push(4)
			expect(mergedStream.head.value).toEqual(1)
			expect(mergedStream.head.next.value).toEqual(2)
			expect(mergedStream.head.next.next.value).toEqual(3)
			expect(mergedStream.head.next.next.next.value).toEqual(4)
		})
		it('performed when has buffered data', function () {
			additionalStream.push(value2)
			stream.push(value1)
			mergedStream = stream.merge(additionalStream)
			mergedStream.forEach(callback1)
			expect(mergedStream.head.value).toEqual(value1)
			expect(mergedStream.head.next.value).toEqual(value2)
		})
		it('sums lengths', function () {
			expect(mergedStream.bufferLength).toEqual(6)
		})
		it('throws error if invalid stream passed', function () {
			expect(function () {
				stream.merge({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('piping', function () {
		var writableStream
		var pipedStream
		beforeEach(function () {
			stream = new Stream(3)
			writableStream = new Stream(3)
			writableStream.forEach(callback1)
			pipedStream = stream.pipe(writableStream)
		})

		it('returns a destination stream', function () {
			expect(pipedStream).toBe(writableStream)
		})

		it('passes stream data', function () {
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			expect(writableStream.head).not.toBeNull()
			expect(writableStream.tail).not.toBeNull()
			expect(writableStream.head.value).toEqual(value1)
			expect(writableStream.head.next.value).toEqual(value2)
			expect(writableStream.head.next.next.value).toEqual(value3)
			expect(callback1.mock.calls).toEqual([[value1], [value2], [value3]])
		})

		it('doesn\'t modify data', function () {
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			expect(writableStream.head.value).toBe(value1)
			expect(writableStream.head.next.value).toBe(value2)
			expect(writableStream.head.next.next.value).toBe(value3)
		})

		it('performed when has buffered data', function () {
			stream.push(value1)
			stream.push(value2)
			writableStream = new Stream()
			writableStream.forEach(callback2)
			stream.pipe(writableStream)
			expect(callback2.mock.calls).toEqual([[value1], [value2]])
		})

		it('can be canceled', function () {
			stream.unpipe(writableStream)
			stream.push(1)
			expect(callback1).not.toHaveBeenCalled()
		})
		it('throws error if invalid stream piped', function () {
			expect(function () {
				stream.pipe({})
			}).toThrow(expect.any(TypeError))
		})
		it('throws error if invalid stream unpiped', function () {
			expect(function () {
				stream.unpipe({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('chain', function () {
		it('is lazy when has no side effect', function () {
			stream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
			stream.push(1)
			stream.push(2)
			stream.push(3)
			stream.push(4)

			expect(callback1).not.toHaveBeenCalled()
			expect(callback2).not.toHaveBeenCalled()
			expect(callback3).not.toHaveBeenCalled()
		})
		it('is iterated when has side effect', function () {
			stream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
				.forEach(function () { })
			stream.push(1)
			stream.push(2)
			stream.push(3)
			stream.push(4)
			expect(callback1).toHaveBeenCalled()
			expect(callback2).toHaveBeenCalled()
			expect(callback3).toHaveBeenCalled()
		})
		it('is not open when lazy', function () {
			stream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)

			expect(stream.onopen).not.toHaveBeenCalled()
		})
		it('is open when not lazy', function () {
			stream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
				.forEach(function () { })

			expect(stream.onopen).toHaveBeenCalled()
		})
		it('is closed when side effect is unsubscribed', function () {
			var chainStream = stream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)

			var eachStream = chainStream.forEach(function () { })

			chainStream.unsubscribe(eachStream)

			expect(stream.onclose).toHaveBeenCalled()
		})
		it('is open when piped', function () {
			var chainStream = stream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
			var childStream = new Stream()

			chainStream.pipe(childStream)

			expect(stream.onopen).toHaveBeenCalled()
		})
		it('is closed when unpiped', function () {
			var chainStream = stream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
			var childStream = new Stream()

			chainStream.pipe(childStream)
			chainStream.unpipe(childStream)

			expect(stream.onclose).toHaveBeenCalled()
		})
		it('iteration is transduced', function () {
			var calls = []
			stream = new Stream(3)
			stream
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is transduced on buffered data', function () {
			var calls = []
			stream = new Stream(3)
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			stream
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is not transduced on hot streams and on buffered data', function () {
			var calls = []
			stream = new Stream(3)
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			stream
				.forEach(function () { calls.push(1) })
				.forEach(function () { calls.push(2) })
				.forEach(function () { calls.push(3) })

			expect(calls).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3])
		})
		it('iteration is transduced before piped data', function () {
			var calls = []
			stream = new Stream(3)
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			stream
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.map(function () { calls.push(3) })
				.pipe(new Stream())

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is transduced after piped data', function () {
			var calls = []
			stream = new Stream(3)
			stream
				.pipe(new Stream())
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is transduced after boofered piped data', function () {
			var calls = []
			stream = new Stream(3)
			stream.push(value1)
			stream.push(value2)
			stream.push(value3)
			stream
				.pipe(new Stream(2))
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })

			expect(calls).toEqual([1, 2, 3, 1, 2, 3])
		})
	})
})