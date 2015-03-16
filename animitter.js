(function(e){if("function"==typeof bootstrap)bootstrap("animitter",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeAnimitter=e}else"undefined"!=typeof window?window.animitter=e():global.animitter=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
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
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
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

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":1}],3:[function(require,module,exports){
var EventEmitter          = require('events').EventEmitter,
    inherits              = require('inherits'),
    requestAnimationFrame = require('request-animation').requestAnimationFrame,
    cancelAnimationFrame  = require('request-animation').cancelAnimationFrame,
    methods;


//polyfill Date.now for real-old browsers
Date.now = Date.now || function now() {
    return new Date().getTime();
};


function returnTrue(){ return true; }

//manage FPS if < 60, else return true;
function makeThrottle(fps){
    var delay = 1000/fps;
    var lastTime = Date.now();


    if( fps >= 60 ){
        return returnTrue;
    }

    return function(){
        //if a custom fps is requested
        var now = Date.now();
        if( now - lastTime < delay ){
            return false;
        }
        lastTime = now;
        return true;
    };
}


function Animitter( opts ){
    opts = opts || {};

    /** @expose */
    this.frameCount = 0;
    /** @expose */
    this.deltaTime = 0;

    /** @private */
    this.__animating = false;
    /** @private */
    this.__completed = false;

    this.setFPS(opts.fps || 60);
}

inherits(Animitter, EventEmitter);

methods = {
    //EventEmitter Aliases
    off     : EventEmitter.prototype.removeListener,
    trigger : EventEmitter.prototype.emit,

    /**
     * stops the animation and marks it as completed
     * @event Animitter#complete
     * @returns {Animitter}
     */
    complete: function(){
        this.stop();
        this.__completed = true;
        this.emit('complete', this.frameCount, this.deltaTime);
        return this;
    },

    /**
     * stops the animation and removes all listeners
     * @event Animitter#stop
     * @returns {Animitter}
     */
    dispose: function(){
        this.stop();
        this.removeAllListeners();
        this.__isReadyForUpdate = null;
        return this;
    },

    /**
     * get time since between last 2 frames
     *
     * @return {Number}
     */
    getDeltaTime: function(){
        return this.deltaTime;
    },

    /**
     * get the total time elapsed since it started
     *
     * @return {Number}
     */
    getElapsedTime: function(){
        //total elapsed time between start() and the last frame
        //if hasn't started or was reset, its 0
        return !!this.__startTime ? this.__lastTime - this.__startTime : 0;
    },

    /**
     * get the instances frames per second
     *
     * @return {Number}
     */
    getFPS: function(){
        return this.__fps;
    },


    /**
     * get the number of frames that have occurred
     *
     * @return {Number}
     */
    getFrameCount: function(){
        return this.frameCount;
    },

    /**
     * is the animation loop active
     *
     * @return {boolean}
     */
    isAnimating: function(){
        return this.__animating;
    },

    /**
     * is the animation marked as completed
     *
     * @return {boolean}
     */
    isCompleted: function(){
        return this.__completed;
    },

    /**
     * reset the animation loop, marks as incomplete,
     * leaves listeners intact
     *
     * @event Animitter#reset
     * @return {Animitter}
     */
    reset: function(){
        this.stop();
        this.__completed = false;
        this.__startTime = null;
        this.frameCount = 0;

        this.emit('reset', this.frameCount);
        return this;
    },

    /**
     * set the framerate for the animation loop
     *
     * @param {Number} fps
     * @return {Animitter}
     */
    setFPS: function(fps){
        this.__fps = fps;
        this.__isReadyForUpdate = makeThrottle(fps);
        return this;
    },

    /**
     * start an animation loop
     * @event Animitter#start
     * @return {Animitter}
     */
    start: function(){
        var self = this;
        var now = Date.now();
        var rAFID;
        //dont let a second animation start on the same object
        //use *.on('update',fn)* instead
        if(this.__animating){
            return this;
        }

        exports.running += 1;
        this.__animating = true;
        this.deltaTime = now - this.__lastTime;
        this.__startTime = this.__lastTime = now;

        //emit **start** once at the beginning
        this.emit('start', this.deltaTime, 0, this.frameCount);


        var drawFrame = function(){
            if(self.__isReadyForUpdate()){
                self.update();
            }
            if(self.__animating){
                rAFID = requestAnimationFrame(drawFrame);
            } else {
                cancelAnimationFrame(rAFID);
            }
        };

        drawFrame();

    },

    /**
     * stops the animation loop, does not mark as completed
     *
     * @event Animitter#stop
     * @return {Animitter}
     */
    stop: function(){
        if( this.__animating ){
            this.__animating = false;
            exports.running -= 1;
            var elapsedTime = this.getElapsedTime();
            this.emit('stop', this.deltaTime, elapsedTime, this.frameCount);
        }
        return this;
    },

    /**
     * update the animation loop once
     *
     * @event Animitter#update
     * @return {Animitter}
     */
    update: function(){
        this.frameCount++;
        /** @private */
        this.__lastTime = this.__lastTime || Date.now();
        var now = Date.now();
        this.deltaTime = now - this.__lastTime;
        this.__lastTime = now;

        var elapsedTime = this.getElapsedTime();
        this.emit('update', this.deltaTime, elapsedTime, this.frameCount);
        return this;
    }



};



for(var method in methods){
    Animitter.prototype[method] = methods[method];
}


function createAnimitter(opts, fn){
    if( arguments.length === 1 && typeof opts === 'function'){
        fn = opts;
        opts = {};
    }

    var _instance = new Animitter( opts );

    if( fn ){
        _instance.on('update', fn);
    }

    return _instance;
}


module.exports = exports = createAnimitter;

exports.Animitter = Animitter;
exports.EventEmitter = EventEmitter;

exports.running = 0;

},{"events":2,"request-animation":4,"inherits":5}],4:[function(require,module,exports){
(function(){// requestAnimationFrame and cancelAnimationFrame polyfill
// [Polyfill by Erik Moller](http://paulirish.com/2011/requestanimationframe-for-smart-animating/)

var lastTime = 0;
var vendors = ['ms', 'moz', 'webkit', 'o'];

var global = typeof window !== 'undefined' ? window : this;

for(var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x) {
    global.requestAnimationFrame = global[vendors[x]+'RequestAnimationFrame'];
    global.cancelAnimationFrame = global[vendors[x]+'CancelAnimationFrame'] || global[vendors[x]+'CancelRequestAnimationFrame'];
}

if (!global.requestAnimationFrame){
    global.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
}

if (!global.cancelAnimationFrame){
    global.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}

exports.requestAnimationFrame = global.requestAnimationFrame;
exports.cancelAnimationFrame = global.cancelAnimationFrame;

})()
},{}],5:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}]},{},[3])(3)
});
;