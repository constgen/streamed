'use strict'

function ListItem(value, next) {
	this.value = value
	this.next = next || null
}

function List() {
	this.head = null
	this.tail = null
	this.length = 0
}

List.prototype = {
	constructor: List,

	push: function (value) {
		var item = new ListItem(value)
		if (this.tail) {
			this.tail.next = item
		}
		else {
			this.head = item
		}
		this.tail = item
		this.length += 1
		return this.length
	},
	shift: function () {
		var head = this.head
		var tail = this.tail

		if (head) {
			if (head === tail) {
				this.tail = null
			}
			this.head = this.head.next
			this.length -= 1
		}
		return head ? head.value : undefined
	},
	iterate: function (callback) {
		var item = this.head
		while (item) {
			callback(item)
			item = item.next
		}
	}
}

module.exports = List