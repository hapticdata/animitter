// requestAnimationFrame and cancelAnimationFrame polyfill
// [Polyfill by Erik Moller](http://paulirish.com/2011/requestanimationframe-for-smart-animating/)
(function(){
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !this.requestAnimationFrame; ++x) {
		this.requestAnimationFrame = this[vendors[x]+'RequestAnimationFrame'];
		this.cancelAnimationFrame = this[vendors[x]+'CancelAnimationFrame'] || this[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!this.requestAnimationFrame)
		this.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!this.cancelAnimationFrame)
		this.cancelAnimationFrame = function(id) {
			clearTimeout(id);
        };
}());
