'use strict'

module.exports = function(value){
	value = Number(value) || 0
	value = Math.floor(value)
	value = (value < 0) ? 0 : value
	return value
}