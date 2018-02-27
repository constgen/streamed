'use strict'

var Stream = require('./stream')
var inherit = require('../utils/inherit')

module.exports = inherit(Stream, {
	constructor: function BufferStream(origin, length) {
		this.origin = origin
		Stream.call(this, length)
	},
	onopen: function(){
		var stream = this
		this.origin.iterate(function (item) {
			stream.subscription(item)
		})
		this.origin.subscribe(this)
	},
	onclose: function(){
		this.origin.unsubscribe(this)
	},
	subscription: function (item) {
		this.push(item.value)
	}
})