'use strict'

var List = require('./list')
var noop = require('../utils/noop')
var isNotFunction = require('../utils/is-not-function')
var inherit = require('../utils/inherit')
var toNaturalNumber = require('../utils/to-natural-number')

var EachStream
var MapStream
var FilterStream
var BufferStream
var ReduceStream
var MergeStream

function notFunctionError(value) {
	return new TypeError(value + ' is not a function')
}
function notStreamError(value) {
	return new TypeError(value + ' is not an instance of Streamed')
}

function isNotInstanceOfStream(value) {
	return !(value instanceof module.exports)
}

module.exports = inherit(List, {
	constructor: function Stream(size) {
		// to avoid a circular dependency
		EachStream = EachStream || require('../streams/each-stream')
		MapStream = MapStream || require('../streams/map-stream')
		FilterStream = FilterStream || require('../streams/filter-stream')
		BufferStream = BufferStream || require('../streams/buffer-stream')
		ReduceStream = ReduceStream || require('../streams/reduce-stream')
		MergeStream = MergeStream || require('../streams/merge-stream')
		List.call(this)
		this.size = toNaturalNumber(size)
		this.subscribers = []
	},
	onopen: noop,
	onclose: noop,
	_inheritedPush: List.prototype.push,
	push: function (value) {
		var tail
		var i = -1
		if (arguments.length > 1) {
			while (++i in arguments) {
				this.push(arguments[i])
			}
			return this
		}
		this._inheritedPush(value)
		tail = this.tail
		if (this.length > this.size) {
			this.shift()
		}
		this.publish(tail)
		return this
	},
	write: function (item) {
		this.push(item.value)
	},
	subscribe: function (subscriber) {
		var subscribers = this.subscribers
		var hadNoSubscribers = !subscribers.length

		subscribers.push(subscriber)
		if (hadNoSubscribers) {
			this.onopen()
		}
		return this
	},
	unsubscribe: function (subscriber) {
		var index
		var subscribers = this.subscribers
		var hasSubscriber

		if (!subscriber) {
			subscribers.length = 0
		}
		else {
			index = subscribers.indexOf(subscriber)
			hasSubscriber = index >= 0
			if (hasSubscriber) {
				subscribers.splice(index, 1)
			}
		}
		if (!subscribers.length && hasSubscriber) {
			this.onclose()
		}
		return this
	},
	publish: function (item) {
		var subscribers = this.subscribers
		var index = -1

		while (++index in subscribers) {
			subscribers[index].write(item)
		}
	},
	buffer: function (size) {
		return new BufferStream(this, size)
	},
	map: function (callback) {
		if (isNotFunction(callback)) {
			throw notFunctionError(callback)
		}
		return new MapStream(this, callback)
	},
	forEach: function (callback) {
		if (isNotFunction(callback)) {
			throw notFunctionError(callback)
		}
		return new EachStream(this, callback)
	},
	filter: function (callback) {
		if (isNotFunction(callback)) {
			throw notFunctionError(callback)
		}
		return new FilterStream(this, callback)
	},
	reduce: function (callback, initialValue) {
		if (isNotFunction(callback)) {
			throw notFunctionError(callback)
		}
		return new ReduceStream(this, callback, initialValue)
	},
	merge: function (stream) {
		if (isNotInstanceOfStream(stream)) {
			throw notStreamError(stream)
		}
		return new MergeStream(this, stream)
	},
	pipe: function (stream) {
		if (isNotInstanceOfStream(stream)) {
			throw notStreamError(stream)
		}
		this.iterate(function (item) {
			stream.write(item)
		})
		this.subscribe(stream)
		return stream
	},
	unpipe: function (stream) {
		if (isNotInstanceOfStream(stream)) {
			throw notStreamError(stream)
		}
		this.unsubscribe(stream)
		return stream
	}
})