'use strict'

var List = require('../../src/classes/list')

describe('List', function () {
	var list
	var callback1
	var callback2
	var callback3
	var value1
	var value2
	var value3

	beforeEach(function () {
		list = new List()
		callback1 = jest.fn()
		callback2 = jest.fn()
		callback3 = jest.fn()
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
	})

	it('returns a correct instance', function () {
		expect(list).toBeInstanceOf(List)
	})

	describe('pushing can be performed on', function () {
		it('empty list', function () {
			list.push(value1)
			expect(list.head).toBe(list.tail)
			expect(list.tail.value).toEqual(value1)
		})
		it('full list', function () {
			list.push(value1)
			list.push(value2)
			list.push(value3)
			expect(list.head).not.toBe(list.tail)
			expect(list.head.value).toEqual(value1)
			expect(list.tail.value).toEqual(value3)
		})
	})

	describe('shifting', function () {
		it('can\'t be performed on empty list', function () {
			var value = list.shift()
			expect(value).toBeUndefined()
		})
		it('can be performed on full list', function () {
			list.push(value1)
			list.push(value2)
			list.push(value3)
			list.shift()
			expect(list.head.value).toEqual(value2)
		})
		it('returns a leading value', function () {
			var value
			list.push(value1)
			list.push(value2)
			list.push(value3)
			value = list.shift()
			expect(value).toEqual(value1)
		})
		it('makes head and tail equal when 1 item left', function () {
			list.push(value1)
			list.push(value2)
			list.shift()
			expect(list.head).toBe(list.tail)
			expect(list.head).not.toBeNull()
		})
		it('can remove the last item', function () {
			list.push(value1)
			list.shift()
			expect(list.head).toBeNull()
			expect(list.head).toBe(list.tail)
		})
	})

	describe('length', function () {
		it('is correct on creation', function () {
			expect(list.length).toEqual(0)
		})

		it('is correct on pushing', function () {
			list.push(value1)
			list.push(value2)
			list.push(value3)
			expect(list.length).toEqual(3)
		})

		it('is correct on shifting', function () {
			list.push(value1)
			list.push(value2)
			list.push(value3)
			list.shift()
			list.shift()
			expect(list.length).toEqual(1)
		})

		it('is correct on shifting when empty', function () {
			list.shift()
			list.shift()
			list.shift()
			expect(list.length).toEqual(0)
		})
	})

	describe('iteration', function () {
		it('doesn\'t call a callback when empty', function () {
			list.iterate(callback1)
			expect(callback1).not.toHaveBeenCalled()
		})
		it('calls a callback on every item', function () {
			list.push(value1)
			list.push(value2)
			list.push(value3)
			list.iterate(callback1)
			expect(callback1).toHaveBeenCalledTimes(3)
		})
		it('calls a callback with items as a value', function () {
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
			list.push(value1)
			list.push(value2)
			list.push(value3)
			list.iterate(callback1)
			expect(callback1.mock.calls).toEqual(calls)
		})
	})
})