'use strict'

var Stream = require('./stream')
var inherit = require('../utils/inherit')

module.exports = inherit(Stream, {
	constructor: function MapStream(origin, callback) {
		var length = origin.bufferLength

		this.callback = callback
		this.origin = origin
		Stream.call(this, length)
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
		var result = this.callback(item.value)
		this.push(result)
	}
})