var root = typeof window === 'object' ? this : {};
var inherits = typeof utils !== 'undefined' && utils.inherits ? utils.inherits : require('util').inherits;
var EventEmitter = typeof events !== 'undefined' && events.EventEmitter ? events.EventEmitter : require('events').EventEmitter;

// [Polyfill]([Erik Moller polyfill](http://paulirish.com/2011/requestanimationframe-for-smart-animating/) for requestAnimationFrame and cancelAnimationFrame
(function(){
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !root.requestAnimationFrame; ++x) {
		root.requestAnimationFrame = root[vendors[x]+'RequestAnimationFrame'];
		root.cancelAnimationFrame = root[vendors[x]+'CancelAnimationFrame'] || root[vendors[x]+'CancelRequestAnimationFrame'];
	}
 
	if (!root.requestAnimationFrame)
		root.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
 
	if (!root.cancelAnimationFrame)
		root.cancelAnimationFrame = function(id) {
			clearTimeout(id);
	};
}());

//##Animator object
//###Extends: [events.EventEmitter](./events.html)
// *animation.Animator*
// has the following properties:
//
// *	**frameCount** *{Number}* current frame # in animation, increases every *'update'*
// *	**animating** *{Boolean}* true if currently running
// *	**completed** *{Boolean}* true if **complete()** has been called
/** @expose */
var Animator = function( opts ){
	opts = opts || {};
	/** @expose */
	this.frameCount = 0;
	/** @expose */
	this.animating = false;
	/** @expose */
	this.completed = false;
	/** @expose */
	this.async = (opts.async === true);
};

var methods = {
	//####myAnimation.complete()
	//stops the animation and emits *'complete'*
	complete: function(){
		this.animating = false;
		this.completed = true;
		this.stop();
		this.emit('complete', this);
		return this;
	},
	//same as .on('complete',fn)
	onComplete: function(fn){
		if(!fn)return;
		this.on('complete',fn);
		return this;
	},
	//same as .on('update',fn)
	onUpdate: function(fn){
		if(!fn)return;
		this.on('update',fn);
		return this;
	},
	//same as .on('stop',fn)
	onStop: function(fn){
		if(!fn)return;
		this.on('stop',fn);
		return this;
	},
	//####myAnimation.start(function(){})
	//start the animation
	//optional **callback** will be attached to .on('update',fn)
	start: function( callback ){
		//dont let a second animation start on the same object
		//use *.on('update',fn)* instead
		if(this.animating){
			return this;
		}
		//emit **start** once at the beginning
		this.emit('start', this);
		exports.running += 1;
		this.animating = true;

		var self = this;
		var step = function(){
			self.frameCount++;
			if( self.async ){
				self.emit('update', function(){
					self.animating = true;
					drawFrame();
				}, self);
				return false;
			} else {
				self.emit('update', self);
				return true;
			}
		};

		if(callback !== undefined){
			this.on('update', callback);
		}
		
		var	drawFrame = function(){
			if( step() ){
				if(self.animating){
					self.request = root.requestAnimationFrame(drawFrame);
				} else {
					root.cancelAnimationFrame(self.request);
				}
			}
		};
		drawFrame();

		return this;
	},
	//####myAnimation.stop()
	//stops the animation but does not mark as completed
	stop: function(){
		this.animating = false;
		exports.running -= 1;
		this.emit('stop', this);
		return this;
	}
};

inherits(Animator, EventEmitter);
for(var method in methods){
	Animator.prototype[method] = methods[method];
}

//####anim(function(){}).start();
//creates an animator but does not start it
//**alternately:** anim({ async: true }, function( next ){ next(); })
/** @expose */
module.exports = exports = function( opts, fn ){
	if( arguments.length === 1){
		fn = opts;
		opts = {};
	}
	var _instance = new Animator( opts );
	if( fn ) _instance.on('update', fn);
	return _instance;
};
//log how many animations are running
/** @expose */
exports.running = 0;
//####anim.async(function( next ){ next(); });
//creates an asynchronous animation where the next frame is queued
//once next(); is invoked
/** @expose */
exports.async = function( opts, fn ){
	if( arguments.length === 1){
		fn = opts;
		opts = {};
	}
	opts.async = true;
	return exports.create( opts, fn );
};
//####anim.create( function(){} )
//creates a new animator and auto-starts it
//this is the most direct way to use it but will result in missing
//at least one *.on('update',fn)* applied after
/** @expose */
exports.create = function( opts, fn ){
	if( arguments.length === 1 ){
		fn = opts;
		opts = {};
	}
	var _instance = new Animator(opts);
	return _instance.start(fn);
};
//####anim.defer( function(){} ).start()
//creates a new animator without calling start
//this allows you to attach events without missing any frames
/** @expose */
exports.defer = exports;
/** @expose */
exports.Animator = Animator;
/** @expose */
exports.EventEmitter = EventEmitter;