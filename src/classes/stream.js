'use strict'

var List = require('./list')
var noop = require('../utils/noop')
var inherit = require('../utils/inherit')

var EachStream
var MapStream
var FilterStream
var BufferStream
var ReduceStream
var MergeStream

module.exports = inherit(List, {
	constructor: function Stream(bufferLength) {
		// to avoid a circular dependency
		EachStream = EachStream || require('./each-stream')
		MapStream = MapStream || require('./map-stream')
		FilterStream = FilterStream || require('./filter-stream')
		BufferStream = BufferStream || require('./buffer-stream')
		ReduceStream = ReduceStream || require('./reduce-stream')
		MergeStream = MergeStream || require('./merge-stream')
		List.call(this)
		this.bufferLength = Number(bufferLength) || 0
		this.subscribers = []
	},
	onopen: noop,
	onclose: noop,
	_push: List.prototype.push,
	push: function (value) {
		var tail
		this._push(value)
		tail = this.tail
		if (this.length > this.bufferLength) {
			this.shift()
		}
		this.publish(tail)
	},
	subscription: function (item) {
		this.push(item.value)
	},
	subscribe: function (subscriber) {
		var subscribers = this.subscribers
		var hadNoSubscribers = !subscribers.length

		subscribers.push(subscriber)
		if (hadNoSubscribers) {
			this.onopen()
		}
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
	},
	publish: function (item) {
		var subscribers = this.subscribers
		var index = -1

		while (++index in subscribers) {
			subscribers[index].subscription(item)
		}
	},
	buffer: function (length) {
		return new BufferStream(this, length)
	},
	map: function (callback) {
		return new MapStream(this, callback)
	},
	forEach: function (callback) {
		return new EachStream(this, callback)
	},
	filter: function (callback) {
		return new FilterStream(this, callback)
	},
	reduce: function (callback, initialValue) {
		return new ReduceStream(this, callback, initialValue)
	},
	merge: function (stream) {
		return new MergeStream(this, stream)
	},
	pipe: function (stream) {
		this.iterate(function (item) {
			stream.subscription(item)
		})
		this.subscribe(stream)
		return stream
	},
	unpipe: function (stream) {
		this.unsubscribe(stream)
		return stream
	}
})