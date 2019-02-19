'use strict'

var Stream = require('../../src/classes/stream')
var List = require('../../src/classes/list')

var spyOn = jest.spyOn

describe('Stream', function () {
	var unlimitedStream
	var limitedStream
	var infiniteStream
	var callback1
	var callback2
	var callback3
	var value1
	var value2
	var value3

	beforeEach(function () {
		spyOn(Stream.prototype, 'onopen')
		spyOn(Stream.prototype, 'onclose')
		unlimitedStream = new Stream()
		limitedStream = new Stream(3)
		infiniteStream = new Stream(Infinity)
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
		expect(unlimitedStream).toBeInstanceOf(Stream)
	})

	it('correctly inherits', function () {
		expect(unlimitedStream).toBeInstanceOf(List)
	})

	describe('initialization', function () {
		it('has no buffer by default', function () {
			expect(unlimitedStream.size).toEqual(0)
		})
		it('is lazy by default', function () {
			expect(unlimitedStream.onopen).not.toHaveBeenCalled()
			expect(unlimitedStream.onclose).not.toHaveBeenCalled()
		})
		it('can be performed with a predefined size', function () {
			var size = 5
			var stream = new Stream(size)
			expect(stream.size).toEqual(size)
		})
		it('can be performed with an invalid size', function () {
			var stream = new Stream(null)
			expect(stream.size).toEqual(0)
		})
		it('can be performed with a negative size', function () {
			var stream = new Stream(-5)
			expect(stream.size).toEqual(0)
		})
		it('can be performed with an Infinite size', function () {
			expect(infiniteStream.size).toBe(Infinity)
		})
	})

	describe('subscription', function () {
		it('opens lazy streams', function () {
			unlimitedStream.subscribe({})
			expect(unlimitedStream.onopen).toHaveBeenCalled()
		})
		it('opens lazy streams ones', function () {
			unlimitedStream.subscribe({})
			unlimitedStream.subscribe({})
			unlimitedStream.subscribe({})
			expect(unlimitedStream.onopen).toHaveBeenCalledTimes(1)
		})
	})

	describe('unsubscription', function () {
		it('closes lazy streams', function () {
			var subscriber = {}
			unlimitedStream.subscribe(subscriber)
			unlimitedStream.unsubscribe(subscriber)
			expect(unlimitedStream.onclose).toHaveBeenCalled()
		})
		it('closes lazy streams ones', function () {
			var subscriber = {}
			unlimitedStream.subscribe(subscriber)
			unlimitedStream.unsubscribe(subscriber)
			unlimitedStream.unsubscribe(subscriber)
			expect(unlimitedStream.onclose).toHaveBeenCalledTimes(1)
		})
		it('doesn\'t close not open streams', function () {
			var subscriber = {}
			unlimitedStream.unsubscribe(subscriber)
			expect(unlimitedStream.onopen).not.toHaveBeenCalled()
		})
	})

	describe('publishing', function () {
		beforeEach(function () {
			unlimitedStream.subscribe({ write: callback1 })
			unlimitedStream.subscribe({ write: callback2 })
			unlimitedStream.subscribe({ write: callback3 })
		})

		it('calls subscribers', function () {
			unlimitedStream.publish()
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

			unlimitedStream.publish({ value: value1 })
			unlimitedStream.publish({ value: value2 })
			unlimitedStream.publish({ value: value3 })
			expect(callback1.mock.calls).toEqual(calls)
			expect(callback2.mock.calls).toEqual(calls)
			expect(callback3.mock.calls).toEqual(calls)
		})
		it('is performed on pushing', function () {
			unlimitedStream.push()
			unlimitedStream.push()
			unlimitedStream.push()
			unlimitedStream.push()
			expect(callback1).toHaveBeenCalledTimes(4)
			expect(callback2).toHaveBeenCalledTimes(4)
			expect(callback3).toHaveBeenCalledTimes(4)
		})
		it('is performed on pushing with a value', function () {
			var item = expect.objectContaining({
				value: value1
			})
			unlimitedStream.push(value1)
			expect(callback1).toHaveBeenLastCalledWith(item)
			expect(callback2).toHaveBeenLastCalledWith(item)
			expect(callback3).toHaveBeenLastCalledWith(item)
		})
		it('is performedperformed on pushing multiple values', function () {
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
			unlimitedStream.push(value1, value2, value3)
			expect(callback1.mock.calls).toEqual(calls)
			expect(callback2.mock.calls).toEqual(calls)
			expect(callback3.mock.calls).toEqual(calls)
		})
	})

	describe('`forEach` method', function () {
		var eachStream
		beforeEach(function () {
			eachStream = unlimitedStream.forEach(callback1)
		})
		it('returns a stream instance', function () {
			expect(eachStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(eachStream).not.toEqual(unlimitedStream)
		})
		it('is not lazy', function () {
			unlimitedStream.push()
			expect(callback1).toHaveBeenCalled()
		})
		it('recieves stream data', function () {
			unlimitedStream.push(value1)
			unlimitedStream.push(value2)
			unlimitedStream.push(value3)
			expect(callback1.mock.calls).toEqual([[value1], [value2], [value3]])
		})
		it('doesn\'t modify data', function () {
			eachStream = infiniteStream.forEach(callback1)
			infiniteStream.push(value1)
			infiniteStream.push(value2)
			infiniteStream.push(value3)
			expect(eachStream.head.value).toEqual(value1)
			expect(eachStream.head.next.value).toEqual(value2)
			expect(eachStream.head.next.next.value).toEqual(value3)
		})
		it('is performed when has buffered data', function () {
			infiniteStream.push()
			infiniteStream.forEach(callback2)
			expect(callback2).toHaveBeenCalled()
		})
		it('inherits the max length', function () {
			eachStream = limitedStream.forEach(callback2)
			expect(eachStream.size).toEqual(limitedStream.size)
		})
		it('callback is iterated only ones', function () {
			unlimitedStream.push(value1)
			unlimitedStream.push(value2)
			unlimitedStream.push(value3)
			callback1.mockClear()
			unlimitedStream.forEach(callback2)
			expect(callback1).not.toHaveBeenCalled()
		})
		it('throws an error if invalid callback passed', function () {
			expect(function () {
				unlimitedStream.forEach({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`buffer` method', function () {
		var bufferedStream
		beforeEach(function () {
			bufferedStream = unlimitedStream.buffer(2)
		})
		it('returns a stream instance', function () {
			expect(bufferedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(bufferedStream).not.toEqual(unlimitedStream)
		})
		it('is lazy', function () {
			unlimitedStream.push(value1)
			expect(bufferedStream.head).toBeNull()
		})
		it('doesn\'t modify data', function () {
			bufferedStream.subscribe(new Stream())
			unlimitedStream.push(1)
			unlimitedStream.push(2)
			unlimitedStream.push(3)
			expect(bufferedStream.head.value).toEqual(2)
			expect(bufferedStream.head.next.value).toEqual(3)
			expect(bufferedStream.head.next.next).toBeNull()
		})
		it('limits the length', function () {
			bufferedStream.subscribe(new Stream())
			unlimitedStream.push(1)
			unlimitedStream.push(2)
			unlimitedStream.push(3)
			expect(bufferedStream.length).toEqual(2)
		})
	})

	describe('`map` method', function () {
		var mappedStream
		beforeEach(function () {
			mappedStream = unlimitedStream.map(callback1)
		})
		it('returns a stream instance', function () {
			expect(mappedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(mappedStream).not.toEqual(unlimitedStream)
		})
		it('is lazy', function () {
			unlimitedStream.push()
			expect(callback1).not.toHaveBeenCalled()
		})
		it('recieves stream data', function () {
			mappedStream.subscribe(new Stream())
			unlimitedStream.push(1)
			unlimitedStream.push(2)
			unlimitedStream.push(3)
			expect(callback1.mock.calls).toEqual([[1], [2], [3]])
		})
		it('transforms values', function () {
			mappedStream = infiniteStream.map(callback1)
			mappedStream.subscribe(new Stream())
			infiniteStream.push(1)
			infiniteStream.push(2)
			infiniteStream.push(3)
			expect(mappedStream.head.value).toEqual(2)
			expect(mappedStream.head.next.value).toEqual(4)
			expect(mappedStream.head.next.next.value).toEqual(6)
		})
		it('is performed when has buffered data', function () {
			infiniteStream.push()
			infiniteStream.map(callback2).subscribe(new Stream())
			expect(callback2).toHaveBeenCalled()
		})
		it('inherits the max length', function () {
			mappedStream = limitedStream.map(callback2)
			expect(mappedStream.size).toEqual(limitedStream.size)
		})
		it('callback is iterated only ones', function () {
			unlimitedStream.push(value1)
			unlimitedStream.push(value2)
			unlimitedStream.push(value3)
			callback1.mockClear()
			unlimitedStream.map(callback2).subscribe(new Stream())
			expect(callback1).not.toHaveBeenCalled()
		})
		it('throws an error if invalid callback passed', function () {
			expect(function () {
				unlimitedStream.map({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`filter` method', function () {
		var filteredStream
		beforeEach(function () {
			filteredStream = unlimitedStream.filter(callback2)
		})
		it('returns a stream instance', function () {
			expect(filteredStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(filteredStream).not.toEqual(unlimitedStream)
		})
		it('is lazy', function () {
			unlimitedStream.push()
			expect(callback2).not.toHaveBeenCalled()
		})
		it('recieves stream data', function () {
			filteredStream.subscribe(new Stream())
			unlimitedStream.push(1)
			unlimitedStream.push(2)
			unlimitedStream.push(3)
			expect(callback2.mock.calls).toEqual([[1], [2], [3]])
		})
		it('filters values', function () {
			filteredStream = infiniteStream.filter(callback2)
			filteredStream.subscribe(new Stream())
			infiniteStream.push(1)
			infiniteStream.push(2)
			infiniteStream.push(3)
			infiniteStream.push(4)
			expect(filteredStream.head.value).toEqual(3)
			expect(filteredStream.head.next.value).toEqual(4)
		})
		it('is performed when has buffered data', function () {
			infiniteStream.push()
			infiniteStream.filter(callback2).subscribe(new Stream())
			expect(callback2).toHaveBeenCalled()
		})
		it('inherits the max length', function () {
			filteredStream = limitedStream.filter(callback2)
			expect(filteredStream.size).toEqual(limitedStream.size)
		})
		it('callback is iterated only ones', function () {
			unlimitedStream.push(value1)
			unlimitedStream.push(value2)
			unlimitedStream.push(value3)
			callback2.mockClear()
			unlimitedStream.filter(callback3).subscribe(new Stream())
			expect(callback2).not.toHaveBeenCalled()
		})
		it('throws an error if invalid callback passed', function () {
			expect(function () {
				unlimitedStream.filter({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`reduce` method', function () {
		var reducedStream
		beforeEach(function () {
			reducedStream = unlimitedStream.reduce(callback2)
		})
		it('returns a stream instance', function () {
			expect(reducedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(reducedStream).not.toEqual(unlimitedStream)
		})
		it('is lazy', function () {
			unlimitedStream.push()
			expect(callback2).not.toHaveBeenCalled()
		})

		describe('with unlimited length', function () {
			describe('without an initial value', function () {
				beforeEach(function () {
					reducedStream = unlimitedStream.reduce(callback3)
				})
				it('recieves stream data', function () {
					reducedStream.subscribe(new Stream())
					unlimitedStream.push(1)
					unlimitedStream.push(2)
					unlimitedStream.push(3)
					unlimitedStream.push(4)
					expect(callback3.mock.calls).toEqual([[1, 2], [3, 3], [6, 4]])
				})
				it('reduces values', function () {
					reducedStream = reducedStream.buffer(3)
					reducedStream.subscribe(new Stream())
					unlimitedStream.push(1)
					unlimitedStream.push(2)
					unlimitedStream.push(3)
					unlimitedStream.push(4)
					expect(reducedStream.head.value).toEqual(3)
					expect(reducedStream.head.next.value).toEqual(6)
					expect(reducedStream.head.next.next.value).toEqual(10)
				})
				it('resets the max length', function () {
					expect(reducedStream.size).toEqual(0)
				})
				it('callback is iterated only ones', function () {
					reducedStream.subscribe(new Stream())
					unlimitedStream.push(value1)
					unlimitedStream.push(value2)
					unlimitedStream.push(value3)
					callback3.mockClear()
					unlimitedStream.reduce(callback1).subscribe(new Stream())
					expect(callback3).not.toHaveBeenCalled()
				})
			})

			describe('with an initial value', function () {
				beforeEach(function () {
					reducedStream = unlimitedStream.reduce(callback3, 100)
				})
				it('recieves stream data', function () {
					reducedStream.subscribe(new Stream())
					unlimitedStream.push(1)
					unlimitedStream.push(2)
					unlimitedStream.push(3)
					unlimitedStream.push(4)
					expect(callback3.mock.calls).toEqual([
						[100, 1],
						[101, 2],
						[103, 3],
						[106, 4]
					])
				})
				it('reduces values', function () {
					reducedStream = reducedStream.buffer(3)
					reducedStream.subscribe(new Stream())
					unlimitedStream.push(1)
					unlimitedStream.push(2)
					unlimitedStream.push(3)
					expect(reducedStream.head.value).toEqual(101)
					expect(reducedStream.head.next.value).toEqual(103)
					expect(reducedStream.head.next.next.value).toEqual(106)
				})
				it('resets the max length', function () {
					expect(reducedStream.size).toEqual(0)
				})
				it('callback is iterated only ones', function () {
					reducedStream.subscribe(new Stream())
					unlimitedStream.push(value1)
					unlimitedStream.push(value2)
					unlimitedStream.push(value3)
					callback3.mockClear()
					unlimitedStream.reduce(callback1, 200).subscribe(new Stream())
					expect(callback3).not.toHaveBeenCalled()
				})
			})
		})

		describe('with infinite length', function () {
			describe('without an initial value', function () {
				beforeEach(function () {
					reducedStream = infiniteStream.reduce(callback3)
				})
				it('recieves stream data', function () {
					reducedStream.subscribe(new Stream())
					infiniteStream.push(1)
					infiniteStream.push(2)
					infiniteStream.push(3)
					infiniteStream.push(4)
					expect(callback3.mock.calls).toEqual([[1, 2], [3, 3], [6, 4]])
				})
				it('reduces values', function () {
					reducedStream = reducedStream.buffer(3)
					reducedStream.subscribe(new Stream())
					infiniteStream.push(1)
					infiniteStream.push(2)
					infiniteStream.push(3)
					infiniteStream.push(4)
					expect(reducedStream.head.value).toEqual(3)
					expect(reducedStream.head.next.value).toEqual(6)
					expect(reducedStream.head.next.next.value).toEqual(10)
				})
				it('resets the max length', function () {
					expect(reducedStream.size).toEqual(0)
				})
				it('callback is iterated only ones', function () {
					reducedStream.subscribe(new Stream())
					infiniteStream.push(value1)
					infiniteStream.push(value2)
					infiniteStream.push(value3)
					callback3.mockClear()
					infiniteStream.reduce(callback1).subscribe(new Stream())
					expect(callback3).not.toHaveBeenCalled()
				})
			})

			describe('with an initial value', function () {
				beforeEach(function () {
					reducedStream = infiniteStream.reduce(callback3, 100)
				})
				it('recieves stream data', function () {
					reducedStream.subscribe(new Stream())
					infiniteStream.push(1)
					infiniteStream.push(2)
					infiniteStream.push(3)
					infiniteStream.push(4)
					expect(callback3.mock.calls).toEqual([
						[100, 1],
						[101, 2],
						[103, 3],
						[106, 4]
					])
				})
				it('reduces values', function () {
					reducedStream = reducedStream.buffer(3)
					reducedStream.subscribe(new Stream())
					infiniteStream.push(1)
					infiniteStream.push(2)
					infiniteStream.push(3)
					expect(reducedStream.head.value).toEqual(101)
					expect(reducedStream.head.next.value).toEqual(103)
					expect(reducedStream.head.next.next.value).toEqual(106)
				})
				it('resets the max length', function () {
					expect(reducedStream.size).toEqual(0)
				})
				it('callback is iterated only ones', function () {
					reducedStream.subscribe(new Stream())
					infiniteStream.push(value1)
					infiniteStream.push(value2)
					infiniteStream.push(value3)
					callback3.mockClear()
					infiniteStream.reduce(callback1, 200).subscribe(new Stream())
					expect(callback3).not.toHaveBeenCalled()
				})
			})
		})

		describe('with limited length', function () {
			describe('without an initial value', function () {
				beforeEach(function () {
					reducedStream = limitedStream.reduce(callback3)
				})
				it('recieves stream data', function () {
					reducedStream.subscribe(new Stream())
					limitedStream.push(1)
					limitedStream.push(2)
					limitedStream.push(3)
					limitedStream.push(4)
					expect(callback3.mock.calls).toEqual([
						[1, 2],
						[1, 2],
						[3, 3],
						[2, 3],
						[5, 4]
					])
				})
				it('reduces values', function () {
					reducedStream = reducedStream.buffer(3)
					reducedStream.subscribe(new Stream())
					limitedStream.push(1)
					limitedStream.push(2)
					limitedStream.push(3)
					limitedStream.push(4)
					expect(reducedStream.head.value).toEqual(3)
					expect(reducedStream.head.next.value).toEqual(6)
					expect(reducedStream.head.next.next.value).toEqual(9)
				})
				it('is not performed on an 1 item size streams', function () {
					var stream = new Stream(1)
					stream.push(1)
					stream.reduce(callback3).subscribe(new Stream())
					stream.push(2)
					expect(callback3).not.toHaveBeenCalled()
				})
				it('performed when has buffered data longer or equal then 2', function () {
					var stream = new Stream(2)
					stream.push(1)
					stream.push(2)
					stream.reduce(callback3).subscribe(new Stream())
					expect(callback3).toHaveBeenCalled()
				})
				it('resets the max length', function () {
					reducedStream = limitedStream.reduce(callback3)
					expect(reducedStream.size).toEqual(0)
				})
				it('callback is iterated only ones', function () {
					reducedStream.subscribe(new Stream())
					limitedStream.push(value1)
					limitedStream.push(value2)
					limitedStream.push(value3)
					callback3.mockClear()
					limitedStream.reduce(callback1).subscribe(new Stream())
					expect(callback3).not.toHaveBeenCalled()
				})
			})

			describe('with an initial value', function () {
				beforeEach(function () {
					reducedStream = limitedStream.reduce(callback3, 100)
				})
				it('recieves stream data', function () {
					reducedStream.subscribe(new Stream())
					limitedStream.push(1)
					limitedStream.push(2)
					limitedStream.push(3)
					limitedStream.push(4)
					expect(callback3.mock.calls).toEqual([
						[100, 1],
						[100, 1],
						[101, 2],
						[100, 1],
						[101, 2],
						[103, 3],
						[100, 2],
						[102, 3],
						[105, 4]
					])
				})
				it('reduces values', function () {
					reducedStream = reducedStream.buffer(3)
					reducedStream.subscribe(new Stream())
					limitedStream.push(1)
					limitedStream.push(2)
					limitedStream.push(3)
					expect(reducedStream.head.value).toEqual(101)
					expect(reducedStream.head.next.value).toEqual(103)
					expect(reducedStream.head.next.next.value).toEqual(106)
				})
				it('is performed on an 1 item size streams', function () {
					var stream = new Stream(1)
					stream.push(1)
					stream.reduce(callback3, 100).subscribe(new Stream())
					expect(callback3).toHaveBeenCalled()
				})
				it('resets the max length', function () {
					reducedStream = limitedStream.reduce(callback3, 100)
					expect(reducedStream.size).toEqual(0)
				})
				it('callback is iterated only ones', function () {
					reducedStream.subscribe(new Stream())
					limitedStream.push(value1)
					limitedStream.push(value2)
					limitedStream.push(value3)
					callback3.mockClear()
					limitedStream.reduce(callback1, 200).subscribe(new Stream())
					expect(callback3).not.toHaveBeenCalled()
				})
			})
		})

		it('throws an error if invalid callback passed', function () {
			expect(function () {
				unlimitedStream.reduce({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('`merge` method', function () {
		var mergedStream
		var additionalStream
		beforeEach(function () {
			additionalStream = new Stream(3)
			mergedStream = limitedStream.merge(additionalStream)
		})
		it('returns a stream instance', function () {
			expect(mergedStream).toBeInstanceOf(Stream)
		})
		it('returns a new stream', function () {
			expect(mergedStream).not.toEqual(limitedStream)
			expect(mergedStream).not.toEqual(additionalStream)
		})
		it('is lazy', function () {
			limitedStream.push()
			additionalStream.push()
			expect(mergedStream.head).toBeNull()
		})
		it('recieves stream data from a base stream', function () {
			mergedStream.forEach(callback1)
			limitedStream.push(1)
			limitedStream.push(2)
			limitedStream.push(3)
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
			limitedStream.push(1)
			additionalStream.push(2)
			limitedStream.push(3)
			expect(callback1.mock.calls).toEqual([[1], [2], [3]])
		})
		it('merges sequence items', function () {
			mergedStream.forEach(callback1)
			limitedStream.push(1)
			additionalStream.push(2)
			limitedStream.push(3)
			additionalStream.push(4)
			expect(mergedStream.head.value).toEqual(1)
			expect(mergedStream.head.next.value).toEqual(2)
			expect(mergedStream.head.next.next.value).toEqual(3)
			expect(mergedStream.head.next.next.next.value).toEqual(4)
		})
		it('is performed when has buffered data', function () {
			additionalStream.push(value2)
			limitedStream.push(value1)
			mergedStream = limitedStream.merge(additionalStream)
			mergedStream.forEach(callback1)
			expect(mergedStream.head.value).toEqual(value1)
			expect(mergedStream.head.next.value).toEqual(value2)
		})
		it('sums max lengths', function () {
			expect(mergedStream.size).toEqual(limitedStream.size + additionalStream.size)
		})
		it('throws an error if invalid stream passed', function () {
			expect(function () {
				limitedStream.merge({})
			}).toThrow(expect.any(TypeError))
		})
		xit('merged with itself', function(){

		})
	})

	describe('piping', function () {
		var writableStream
		var pipedStream
		beforeEach(function () {
			writableStream = new Stream(3)
			writableStream.forEach(callback1)
			pipedStream = limitedStream.pipe(writableStream)
		})

		it('returns a destination stream', function () {
			expect(pipedStream).toBe(writableStream)
		})

		it('passes stream data', function () {
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)
			expect(writableStream.head).not.toBeNull()
			expect(writableStream.tail).not.toBeNull()
			expect(writableStream.head.value).toEqual(value1)
			expect(writableStream.head.next.value).toEqual(value2)
			expect(writableStream.head.next.next.value).toEqual(value3)
			expect(callback1.mock.calls).toEqual([[value1], [value2], [value3]])
		})

		it('doesn\'t modify data', function () {
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)
			expect(writableStream.head.value).toBe(value1)
			expect(writableStream.head.next.value).toBe(value2)
			expect(writableStream.head.next.next.value).toBe(value3)
		})

		it('is performed when has buffered data', function () {
			limitedStream.push(value1)
			limitedStream.push(value2)
			writableStream = new Stream()
			writableStream.forEach(callback2)
			limitedStream.pipe(writableStream)
			expect(callback2.mock.calls).toEqual([[value1], [value2]])
		})

		it('can be canceled', function () {
			limitedStream.unpipe(writableStream)
			limitedStream.push(1)
			expect(callback1).not.toHaveBeenCalled()
		})
		it('throws an error if invalid stream piped', function () {
			expect(function () {
				limitedStream.pipe({})
			}).toThrow(expect.any(TypeError))
		})
		it('throws an error if invalid stream unpiped', function () {
			expect(function () {
				limitedStream.unpipe({})
			}).toThrow(expect.any(TypeError))
		})
	})

	describe('chain', function () {
		it('is lazy when has no side effect', function () {
			unlimitedStream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
			unlimitedStream.push(1)
			unlimitedStream.push(2)
			unlimitedStream.push(3)
			unlimitedStream.push(4)

			expect(callback1).not.toHaveBeenCalled()
			expect(callback2).not.toHaveBeenCalled()
			expect(callback3).not.toHaveBeenCalled()
		})
		it('is iterated when has side effect', function () {
			unlimitedStream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
				.forEach(function () { })
			unlimitedStream.push(1)
			unlimitedStream.push(2)
			unlimitedStream.push(3)
			unlimitedStream.push(4)
			expect(callback1).toHaveBeenCalled()
			expect(callback2).toHaveBeenCalled()
			expect(callback3).toHaveBeenCalled()
		})
		it('is not open when lazy', function () {
			unlimitedStream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)

			expect(unlimitedStream.onopen).not.toHaveBeenCalled()
		})
		it('is open when not lazy', function () {
			unlimitedStream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
				.forEach(function () { })

			expect(unlimitedStream.onopen).toHaveBeenCalled()
		})
		it('is closed when side effect is unsubscribed', function () {
			var chainStream = unlimitedStream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)

			var eachStream = chainStream.forEach(function () { })

			chainStream.unsubscribe(eachStream)

			expect(unlimitedStream.onclose).toHaveBeenCalled()
		})
		it('is open when piped', function () {
			var chainStream = unlimitedStream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
			var childStream = new Stream()

			chainStream.pipe(childStream)

			expect(unlimitedStream.onopen).toHaveBeenCalled()
		})
		it('is closed when unpiped', function () {
			var chainStream = unlimitedStream
				.buffer(10)
				.merge(new Stream())
				.map(callback1)
				.filter(callback2)
				.reduce(callback3)
			var childStream = new Stream()

			chainStream.pipe(childStream)
			chainStream.unpipe(childStream)

			expect(unlimitedStream.onclose).toHaveBeenCalled()
		})
		it('iteration is transduced', function () {
			var calls = []
			limitedStream
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is transduced on buffered data', function () {
			var calls = []
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)
			limitedStream
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is not transduced on hot streams and on buffered data', function () {
			var calls = []
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)
			limitedStream
				.forEach(function () { calls.push(1) })
				.forEach(function () { calls.push(2) })
				.forEach(function () { calls.push(3) })

			expect(calls).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3])
		})
		it('iteration is transduced before piped data', function () {
			var calls = []
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)
			limitedStream
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.map(function () { calls.push(3) })
				.pipe(new Stream())

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is transduced after piped data', function () {
			var calls = []
			limitedStream
				.pipe(new Stream())
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)

			expect(calls).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3])
		})
		it('iteration is transduced after boofered piped data', function () {
			var calls = []
			limitedStream.push(value1)
			limitedStream.push(value2)
			limitedStream.push(value3)
			limitedStream
				.pipe(new Stream(2))
				.map(function () { calls.push(1) })
				.filter(function () { calls.push(2); return true })
				.forEach(function () { calls.push(3) })

			expect(calls).toEqual([1, 2, 3, 1, 2, 3])
		})
	})
})