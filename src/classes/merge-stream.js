'use strict'

var Stream = require('./stream')
var inherit = require('../utils/inherit')

module.exports = inherit(Stream, {
	constructor: function MergeStream(originA, originB) {
		var length = originA.bufferLength + originB.bufferLength

		this.originA = originA
		this.originB = originB
		Stream.call(this, length)
	},
	onopen: function () {
		var stream = this
		function handleItem(item) {
			stream.subscription(item)
		}
		this.originA.iterate(handleItem)
		this.originB.iterate(handleItem)
		this.originA.subscribe(this)
		this.originB.subscribe(this)
	},
	onclose:function () {
		this.originA.unsubscribe(this)
		this.originB.unsubscribe(this)
	},
	subscription: function (item) {
		this.push(item.value)
	}
})