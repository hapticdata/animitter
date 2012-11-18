var env, isArray, inherits;
//find which environment we are in
if( typeof require === 'function' ){
	env = (typeof define === 'function' && define.amd) ? 'requirejs' : 'node';
} else {
	env = "browser";
}

isArray = Array.isArray || function(a){
	return a.toString() == '[object Array]';
};
//same as Node.js' inherits
inherits = function(ctor, superCtor) {
	ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
};
exports.env = env;
exports.isArray = isArray;
exports.inherits = inherits;