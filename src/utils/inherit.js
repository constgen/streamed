'use strict'

module.exports = function(From, declaration){
	var Constructor = declaration.constructor
	var prototype = Object.create(From.prototype)
	var member

	Constructor.prototype = prototype
	for (member in declaration) {
		prototype[member] = declaration[member]
	}

	return Constructor
}