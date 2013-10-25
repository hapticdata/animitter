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

//##Animitter object
//###Extends: [events.EventEmitter](./events.html)
// *animation.Animitter*
/** @expose */
var Animitter = function( opts ){
	opts = opts || {};
	/** @expose */
	this.frameCount = 0;
	/** @private */
	this.__animating = false;
	/** @private */
	this.__completed = false;
	/** @private */
	this.__async = (opts.async === true);
    /** @private */
    this.__fps = opts.fps || 60;
};

var methods = {
	//####myAnimation.complete()
	//stops the animation and emits *'complete'*
	complete: function(){
		this.__animating = false;
		this.__completed = true;
		this.stop();
		this.emit('complete', this, this.frameCount);
		return this;
	},
    getFPS: function(){
        return this.__fps;
    },
    getFrameCount: function(){
        return this.frameCount;
    },
    isAnimating: function(){
        return this.__animating;
    },
    isCompleted: function(){
        return this.__completed;
    },
    isAsync: function(){
        return this.__async;
    },
	//####myAnimation.start(function(){})
	//start the animation
	//optional **callback** will be attached to .on('update',fn)
	start: function( callback ){
		var self = this,
            enoughTimeElapsed,
            step,
            nextFrame,
            drawFrame;
		//dont let a second animation start on the same object
		//use *.on('update',fn)* instead
		if(this.__animating){
			return this;
		}
		//emit **start** once at the beginning
		this.emit('start', this, this.frameCount);
		exports.running += 1;
		this.__animating = true;

		step = function(){
			self.frameCount++;
			if( self.__async ){
				self.emit('update', self, self.frameCount, function(){
					self.__animating = true;
					drawFrame();
				}, self);
				return false;
			} else {
				self.emit('update', self, self.frameCount);
				return true;
			}
		};

		if(callback !== undefined){
			this.on('update', callback);
		}


        //manage FPS if < 60, else return true;
        enoughTimeElapsed = (function(){
            var lastTime = Date.now();
            return (self.__fps < 60) ? function(){
                //if a custom fps is requested
                var now = Date.now();
                if( now - lastTime < (1000/self.__fps) ){
                    return false;
                }
                lastTime = now;
                return true;
            } : function(){ return true; };
        })();

        //continue the rAF loop, not necessarily calling the user's function
        nextFrame = (function(){
            var rAFID;
            return function(){
                if(self.__animating){
                    rAFID = root.requestAnimationFrame(drawFrame);
                } else {
                    root.cancelAnimationFrame(rAFID);
                }
            };
        })();

		drawFrame = function(){
            if(!enoughTimeElapsed()){
                nextFrame();
                return;
            }
			if( step() ){
                nextFrame();
			}
		};

		drawFrame();

		return this;
	},
	//####myAnimation.stop()
	//stops the animation but does not mark as completed
	stop: function(){
		this.__animating = false;
		exports.running -= 1;
		this.emit('stop', this, this.frameCount);
		return this;
	}
};

inherits(Animitter, EventEmitter);
for(var method in methods){
	Animitter.prototype[method] = methods[method];
}

//####anim(function(){}).start();
//creates an animitter but does not start it
//**alternately:** anim({ async: true }, function( next ){ next(); })
/** @expose */
module.exports = exports = function( opts, fn ){
	if( arguments.length === 1){
		fn = opts;
		opts = {};
	}
	var _instance = new Animitter( opts );
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
	return exports.start( opts, fn );
};
//####anim.start( function(){} )
//creates a new animitter and auto-starts it
//this is the most direct way to use it but will result in missing
//at least one *.on('update',fn)* applied after
/** @expose */
exports.start = function( opts, fn ){
	if( arguments.length === 1 ){
		fn = opts;
		opts = {};
	}
	var _instance = new Animitter(opts);
	return _instance.start(fn);
};
/** @expose */
exports.Animitter = Animitter;
/** @expose */
exports.EventEmitter = EventEmitter;

if( typeof define === 'function' && define.amd){
	define(function(){ return exports; });
} else if( typeof window === 'object' ){
	window.animitter = exports;
}
