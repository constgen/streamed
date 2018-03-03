'use strict'

var Stream = require('../classes/stream')
var inherit = require('../utils/inherit')

module.exports = inherit(Stream, {
	constructor: function ReduceStream(origin, callback, initialValue) {
		this.callback = callback
		this.initialValue = initialValue
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
	subscription: function () {
		var empty = {}
		var accumulator = (this.initialValue === undefined) ? empty : this.initialValue
		var item

		item = this.origin.head
		while (item) {
			if (accumulator !== empty) {
				accumulator = this.callback(accumulator, item.value)
			}
			else {
				accumulator = item.value
			}
			item = item.next
		}
		this.push(accumulator)
	}
})