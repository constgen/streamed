'use strict'

var Stream = require('../classes/stream')
var inherit = require('../utils/inherit')

module.exports = inherit(Stream, {
	constructor: function BufferStream(origin, length) {
		this.origin = origin
		Stream.call(this, length)
	},
	onopen: function(){
		var stream = this
		this.origin.iterate(function (item) {
			stream.write(item)
		})
		this.origin.subscribe(this)
	},
	onclose: function(){
		this.origin.unsubscribe(this)
	},
	write: function (item) {
		this.push(item.value)
	}
})