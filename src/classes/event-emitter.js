'use strict'

function EventEmitter() {
	this.callbacks = []
}

EventEmitter.prototype = {
	constructor: EventEmitter,

	subscribe: function (callback) {
		if (!callback) return
		this.callbacks.push(callback)
	},

	unsubscribe: function (callback) {
		var index
		var callbacks = this.callbacks

		if (!callback) {
			callbacks.length = 0
		}
		else {
			index = callbacks.indexOf(callback)
			if (index >= 0) {
				callbacks.splice(index, 1)
			}
		}
	},

	emit: function (event) {
		var index = -1
		var callbacks = this.callbacks
		var callback

		while (++index in callbacks) {
			callback = callbacks[index]
			if ('handleEvent' in callback) {
				callback.handleEvent(event)
			}
			else {
				callback(event)
			}
		}
	}
}

module.exports = EventEmitter