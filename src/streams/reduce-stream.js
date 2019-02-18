'use strict'

var Stream = require('../classes/stream')
var inherit = require('../utils/inherit')
var empty = {}

module.exports = inherit(Stream, {
	constructor: function ReduceStream(origin, callback, initialValue) {
		this.callback = callback
		this.value = (initialValue === undefined) ? empty : initialValue
		this.origin = origin
		Stream.call(this)
	},
	onopen: function () {
		var stream = this
		this.origin.iterate(function (item) {
			stream.subscription(item)
		})
		this.origin.subscribe(this)
	},
	onclose: function () {
		this.origin.unsubscribe(this)
	},
	subscription: function (item) {
		var accumulator = this.value

		// optimization for unlimited stream
		if (!this.origin.size || this.origin.size === Infinity) {
			if (accumulator === empty) {
				accumulator = item.value
			}
			else {
				accumulator = this.callback(accumulator, item.value)
			}
			this.value = accumulator
			this.push(accumulator)
		}
		else {
			item = this.origin.head
			while (item) {
				if (accumulator === empty) {
					accumulator = item.value
				}
				else {
					accumulator = this.callback(accumulator, item.value)
				}
				item = item.next
			}
			this.push(accumulator)
		}
	}
})