'use strict'

var Stream = require('../classes/stream')
var inherit = require('../utils/inherit')

module.exports = inherit(Stream, {
	constructor: function EachStream(origin, callback) {
		var stream = this
		var length = origin.bufferLength

		Stream.call(stream, length)
		this.callback = callback
		origin.iterate(function (item) {
			stream.subscription(item)
		})
		origin.subscribe(this)
	},
	subscription: function (item) {
		this.callback(item.value)
		this.push(item.value)
	}
})