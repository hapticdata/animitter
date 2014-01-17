// Animitter 0.4.0
// Build: 2014-01-17
// by [Kyle Phillips](http://haptic-data.com)
// Available under [MIT License](http://github.com/hapticdata/animitter/blob/master/LICENSE)
// Env: Browser + Node


(function(){
if( typeof define === 'function' && define.amd ){
    define(function(){ return createAnimitter(this, inherits, EventEmitter); });
} else if( typeof require === 'function' ){
    module.exports = createAnimitter(this, require('util').inherits, require('events').EventEmitter);
} else {
    this.animitter = createAnimitter(this, inherits, EventEmitter);
}


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

Array.isArray = Array.isArray || function(a){
        return a.toString() == '[object Array]';
};

function createAnimitter( root, inherits, EventEmitter ){
    var exports;
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
            this.emit('complete', this.frameCount);
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
        next: function(){
            this.frameCount++;
            this.emit('update', this.frameCount);
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
            this.emit('start', this.frameCount);
            exports.running += 1;
            this.__animating = true;

            step = function(){
                self.frameCount++;
                if( self.__async ){
                    self.emit('update', self.frameCount, function(){
                        self.__animating = true;
                        drawFrame();
                    });
                    return false;
                } else {
                    self.emit('update', self.frameCount);
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
            this.emit('stop', this.frameCount);
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
    exports = function( opts, fn ){
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
    return exports;
}


//This is the Node.js [EventEmitter](https://github.com/joyent/node/blob/master/lib/events.js)
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
	if (!this._events) this._events = {};
	this._maxListeners = n;
};

/** @expose */
EventEmitter.prototype.emit = function() {
	var type = arguments[0], l, args, i;
	// If there is no 'error' event listener then throw.
	if (type === 'error') {
		if (!this._events || !this._events.error ||
				(Array.isArray(this._events.error) && !this._events.error.length))
		{
			if (arguments[1] instanceof Error) {
				throw arguments[1]; // Unhandled 'error' event
			} else {
				throw new Error("Uncaught, unspecified 'error' event.");
			}
		}
	}

	if (!this._events) return false;
	var handler = this._events[type];
	if (!handler) return false;

	if (typeof handler == 'function') {
		switch (arguments.length) {
			// fast cases
			case 1:
				handler.call(this);
				break;
			case 2:
				handler.call(this, arguments[1]);
				break;
			case 3:
				handler.call(this, arguments[1], arguments[2]);
				break;
			// slower
			default:
				l = arguments.length;
				args = new Array(l - 1);
				for (i = 1; i < l; i++) args[i - 1] = arguments[i];
				handler.apply(this, args);
		}
		return true;

	} else if (Array.isArray(handler)) {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; i++) args[i - 1] = arguments[i];

		var listeners = handler.slice();
		for (i = 0, l = listeners.length; i < l; i++) {
			listeners[i].apply(this, args);
		}
		return true;

	} else {
		return false;
	}
};
/** @expose */
EventEmitter.prototype.addListener = function(type, listener) {
	if ('function' !== typeof listener) {
		throw new Error('addListener only takes instances of Function');
	}

	if (!this._events) this._events = {};

	// To avoid recursion in the case that type == "newListeners"! Before
	// adding it to the listeners, first emit "newListeners".
	this.emit('newListener', type, typeof listener.listener === 'function' ?
						listener.listener : listener);

	if (!this._events[type]) {
		// Optimize the case of one listener. Don't need the extra array object.
		this._events[type] = listener;
	} else if (Array.isArray(this._events[type])) {

		// If we've already got an array, just append.
		this._events[type].push(listener);

	} else {
		// Adding the second element, need to change to array.
		this._events[type] = [this._events[type], listener];

	}

	// Check for listener leak
	if (Array.isArray(this._events[type]) && !this._events[type].warned) {
		var m;
		if (this._maxListeners !== undefined) {
			m = this._maxListeners;
		} else {
			m = defaultMaxListeners;
		}

		if (m && m > 0 && this._events[type].length > m) {
			this._events[type].warned = true;
			console.error('(node) warning: possible EventEmitter memory ' +
										'leak detected. %d listeners added. ' +
										'Use emitter.setMaxListeners() to increase limit.',
										this._events[type].length);
			console.trace();
		}
	}

	return this;
};
/** @expose **/
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
/** @expose **/
EventEmitter.prototype.once = function(type, listener) {
	if ('function' !== typeof listener) {
		throw new Error('.once only takes instances of Function');
	}

	var self = this;
	function g() {
		self.removeListener(type, g);
		listener.apply(this, arguments);
	}

	g.listener = listener;
	self.on(type, g);

	return this;
};
/** @expose */
EventEmitter.prototype.removeListener = function(type, listener) {
	if ('function' !== typeof listener) {
		throw new Error('removeListener only takes instances of Function');
	}

	// does not use listeners(), so no side effect of creating _events[type]
	if (!this._events || !this._events[type]) return this;

	var list = this._events[type];

	if (Array.isArray(list)) {
		var position = -1;
		for (var i = 0, length = list.length; i < length; i++) {
			if (list[i] === listener ||
					(list[i].listener && list[i].listener === listener))
			{
				position = i;
				break;
			}
		}

		if (position < 0) return this;
		list.splice(position, 1);
		if (list.length === 0)
			delete this._events[type];
	} else if (list === listener || (list.listener && list.listener === listener)) {
		delete this._events[type];
	}

	return this;
};
/** @expose */
EventEmitter.prototype.removeAllListeners = function(type) {
	if (arguments.length === 0) {
		this._events = {};
		return this;
	}

	// does not use listeners(), so no side effect of creating _events[type]
	if (type && this._events && this._events[type]) this._events[type] = null;
	return this;
};
/** @expose */
EventEmitter.prototype.listeners = function(type) {
	if (!this._events) this._events = {};
	if (!this._events[type]) this._events[type] = [];
	if (!Array.isArray(this._events[type])) {
		this._events[type] = [this._events[type]];
	}
	return this._events[type];
};

function inherits(ctor, superCtor) {
	ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
}

})();