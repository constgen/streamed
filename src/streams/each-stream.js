'use strict'

var Stream = require('../classes/stream')
var inherit = require('../utils/inherit')

module.exports = inherit(Stream, {
	constructor: function EachStream(origin, callback) {
		var stream = this
		var size = origin.size

		Stream.call(stream, size)
		this.callback = callback
		origin.iterate(function (item) {
			stream.write(item)
		})
		origin.subscribe(this)
	},
	write: function (item) {
		this.callback(item.value)
		this.push(item.value)
	}
})