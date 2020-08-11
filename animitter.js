// Animitter 4.0.2-beta
// Build: 2020-8-7
// by Kyle Phillips - http://haptic-data.com
// Available under MIT License
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.animitter = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = require("eventemitter3");
exports.EventEmitter = EventEmitter;
var raf = require("raf");
//the same as off window unless polyfilled or in node
var defaultRAFObject = {
    requestAnimationFrame: raf,
    cancelAnimationFrame: raf.cancel
};
function returnTrue() { return true; }
//manage FPS if < 60, else return true;
function makeThrottle(fps) {
    var delay = 1000 / fps;
    var lastTime = Date.now();
    if (fps <= 0 || fps === Infinity) {
        return returnTrue;
    }
    //if an fps throttle has been set then we'll assume
    //it natively runs at 60fps,
    var half = Math.ceil(1000 / 60) / 2;
    return function () {
        //if a custom fps is requested
        var now = Date.now();
        //is this frame within 8.5ms of the target?
        //if so then next frame is gonna be too late
        if (now - lastTime < delay - half) {
            return false;
        }
        lastTime = now;
        return true;
    };
}
//type AnimitterEventTypes = 'complete' | 'start' | 'stop' | 'update';
/**
 * Animitter provides event-based loops for the browser and node,
 * using `requestAnimationFrame`
 * @param {Object} [opts]
 * @param {Number} [opts.fps=Infinity] the framerate requested, defaults to as fast as it can (60fps on window)
 * @param {Number} [opts.delay=0] milliseconds delay between invoking `start` and initializing the loop
 * @param {Object} [opts.requestAnimationFrameObject=global] the object on which to find `requestAnimationFrame` and `cancelAnimationFrame` methods
 * @param {Boolean} [opts.fixedDelta=false] if true, timestamps will pretend to be executed at fixed intervals always
 * @constructor
 */
var Animitter = /** @class */ (function (_super) {
    __extends(Animitter, _super);
    function Animitter(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this) || this;
        /**
         * if true, events will always increment deltaTime and elapsedTime by
         * exactly the correct milliseconds for set frames per second.
         * This is useful if recording frames or doing something asynchronous but
         * you want animation interval to remain constant
         */
        _this.fixedDelta = false;
        /**
         * how many frames have elapsed
         */
        _this.frameCount = 0;
        /**
         * the amount of time in milliseconds since the last 'update' event
         */
        _this.deltaTime = 0;
        /**
         * the amount of time in milliseconds that has elapsed total while running
         */
        _this.elapsedTime = 0;
        _this.__completed = false;
        _this.__delay = 0;
        _this.__fps = Infinity;
        _this.__isReadyForUpdate = returnTrue;
        _this.__lastTime = 0;
        _this.__requestAnimationFrameObject = defaultRAFObject;
        _this.__running = false;
        (typeof opts.delay === 'number') && (_this.__delay = opts.delay);
        (typeof opts.fixedDelta !== 'undefined') && (_this.fixedDelta = !!opts.fixedDelta);
        _this.setFPS(opts.fps || Infinity);
        _this.setRequestAnimationFrameObject(opts.requestAnimationFrameObject || defaultRAFObject);
        return _this;
    }
    /**
     * stops the animation and marks it as completed.
     * This will trigger a 'complete' event and prevent it from being started
     * without first calling reset().
     * @emit Animitter#complete
     * @returns {Animitter}
     */
    Animitter.prototype.complete = function () {
        this.__completed = true;
        this.stop();
        this.emit('complete', this.deltaTime, this.elapsedTime, this.frameCount);
        return this;
    };
    /**
     * stops the animation and removes all listeners
     * @emit Animitter#stop
     * @returns {Animitter}
     */
    Animitter.prototype.dispose = function () {
        this.stop();
        this.removeAllListeners();
        return this;
    };
    /**
     * get milliseconds between the last 2 updates
     *
     * @return {Number}
     */
    Animitter.prototype.getDeltaTime = function () {
        return this.deltaTime;
    };
    /**
     * get the total milliseconds that the animation has ran.
     * This is the cumlative value of the deltaTime between frames
     *
     * @return {Number}
     */
    Animitter.prototype.getElapsedTime = function () {
        return this.elapsedTime;
    };
    /**
     * get the instances frames per second as calculated by the last delta
     *
     * @return {Number}
     */
    Animitter.prototype.getFPS = function () {
        return this.deltaTime > 0 ? 1000 / this.deltaTime : 0;
    };
    /**
     * get the explicit FPS limit set via `Animitter#setFPS(fps)` or
     * via the initial `options.fps` property
     *
     * @returns {Number} either as set or Infinity
     */
    Animitter.prototype.getFPSLimit = function () {
        return this.__fps;
    };
    /**
     * get the number of frames that have occurred
     *
     * @return {Number}
     */
    Animitter.prototype.getFrameCount = function () {
        return this.frameCount;
    };
    /**
     * get the object providing `requestAnimationFrame`
     * and `cancelAnimationFrame` methods
     * @return {Object}
     */
    Animitter.prototype.getRequestAnimationFrameObject = function () {
        return this.__requestAnimationFrameObject;
    };
    /**
     * is the animation marked as completed
     *
     * @return {boolean}
     */
    Animitter.prototype.isCompleted = function () {
        return this.__completed;
    };
    /**
     * is the animation loop active
     *
     * @return {boolean}
     */
    Animitter.prototype.isRunning = function () {
        return this.__running;
    };
    Animitter.prototype.on = function (eventType, listenerFn, context) {
        _super.prototype.on.call(this, eventType, listenerFn, context);
        return this;
    };
    Animitter.prototype.once = function (eventType, listenerFn, context) {
        _super.prototype.once.call(this, eventType, listenerFn, context);
        return this;
    };
    Animitter.prototype.onComplete = function (listenerFn, context) {
        return this.on('complete', listenerFn, context);
    };
    Animitter.prototype.onReset = function (listenerFn, context) {
        return this.on('reset', listenerFn, context);
    };
    Animitter.prototype.onStart = function (listenerFn, context) {
        return this.on('start', listenerFn, context);
    };
    Animitter.prototype.onStop = function (listenerFn, context) {
        return this.on('stop', listenerFn, context);
    };
    Animitter.prototype.onUpdate = function (listenerFn, context) {
        return this.on('update', listenerFn, context);
    };
    /**
     * reset the animation loop, marks as incomplete,
     * leaves listeners intact
     *
     * @emit Animitter#reset
     */
    Animitter.prototype.reset = function () {
        this.stop();
        this.__completed = false;
        this.__lastTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;
        this.emit('reset', 0, 0, this.frameCount);
        return this;
    };
    /**
     * set the framerate for the animation loop
     *
     * @param {Number} fps
     * @return {Animitter}
     */
    Animitter.prototype.setFPS = function (fps) {
        this.__fps = fps;
        this.__isReadyForUpdate = makeThrottle(fps);
        return this;
    };
    /**
     * set the object that will provide `requestAnimationFrame`
     * and `cancelAnimationFrame` methods to this instance
     * @param {Object} object
     * @return {Animitter}
     */
    Animitter.prototype.setRequestAnimationFrameObject = function (object) {
        if (typeof object.requestAnimationFrame !== 'function' || typeof object.cancelAnimationFrame !== 'function') {
            throw new Error("Invalid object provide to `setRequestAnimationFrameObject`");
        }
        this.__requestAnimationFrameObject = object;
        return this;
    };
    /**
     * start an animation loop
     * @emit Animitter#start
     * @return {Animitter}
     */
    Animitter.prototype.start = function () {
        var _this = this;
        var onStart = function () {
            var rAFID;
            //dont let a second animation start on the same object
            //use *.on('update',fn)* instead
            if (_this.__running) {
                return _this;
            }
            Animitter.instancesRunning += 1;
            _this.__running = true;
            _this.__lastTime = Date.now();
            _this.deltaTime = 0;
            //emit **start** once at the beginning
            _this.emit('start', _this.deltaTime, 0, _this.frameCount);
            var lastRAFObject = _this.__requestAnimationFrameObject;
            var drawFrame = function () {
                var raf = _this.getRequestAnimationFrameObject();
                if (lastRAFObject !== raf) {
                    //if the requestAnimationFrameObject switched in-between,
                    //then re-request with the new one to ensure proper update execution context
                    //i.e. VRDisplay#submitFrame() may only be requested through VRDisplay#requestAnimationFrame(drawFrame)
                    lastRAFObject = raf;
                    raf.requestAnimationFrame(drawFrame);
                    return;
                }
                if (_this.__isReadyForUpdate()) {
                    _this.update();
                }
                if (_this.__running) {
                    rAFID = raf.requestAnimationFrame(drawFrame);
                }
                else {
                    raf.cancelAnimationFrame(rAFID);
                }
            };
            _this.getRequestAnimationFrameObject().requestAnimationFrame(drawFrame);
            return _this;
        };
        if (this.__delay) {
            setTimeout(onStart, this.__delay);
        }
        else {
            onStart();
        }
        return this;
    };
    /**
     * stops the animation loop, does not mark as completed
     *
     * @emit Animitter#stop
     * @return {Animitter}
     */
    Animitter.prototype.stop = function () {
        if (this.__running) {
            this.__running = false;
            Animitter.instancesRunning -= 1;
            this.emit('stop', this.deltaTime, this.elapsedTime, this.frameCount);
        }
        return this;
    };
    /**
     * update the animation loop once
     *
     * @emit Animitter#update
     * @return {Animitter}
     */
    Animitter.prototype.update = function () {
        this.frameCount++;
        /** @private */
        var now = Date.now();
        this.__lastTime = this.__lastTime || now;
        this.deltaTime = (this.fixedDelta || Animitter.globalFixedDelta) ? 1000 / Math.min(60, this.__fps) : now - this.__lastTime;
        this.elapsedTime += this.deltaTime;
        this.__lastTime = now;
        this.emit('update', this.deltaTime, this.elapsedTime, this.frameCount);
        return this;
    };
    /**
     * keep a global counter of all loops running, helpful to watch in dev tools
     */
    Animitter.instancesRunning = 0;
    /**
     * if true, all `Animitter` instances will behave as if `options.fixedDelta = true`
     */
    Animitter.globalFixedDelta = false;
    return Animitter;
}(EventEmitter));
exports.Animitter = Animitter;
var isFunction = function (o) { return o && typeof o === 'function'; };
/**
 * create an animitter instance,
 * @param {Object} [options]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
function createAnimitter(options, fn) {
    if (arguments.length === 1 && isFunction(options)) {
        fn = options;
        options = {};
    }
    var _instance = new Animitter(options);
    if (fn) {
        _instance.on('update', fn);
    }
    return _instance;
}
exports.default = createAnimitter;
/**
 * create an animitter instance,
 * where the scope is bound in all functions
 * @param {Object} [options]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
function bound(options, fn) {
    var loop = createAnimitter(options, fn);
    var functionKeys = functions(Animitter.prototype);
    var hasBind = !!Function.prototype.bind;
    var fnKey;
    for (var i = 0; i < functionKeys.length; i++) {
        fnKey = functionKeys[i];
        loop[fnKey] = hasBind ? loop[fnKey].bind(loop) : bind(loop[fnKey], loop);
    }
    return loop;
}
exports.bound = bound;
;
exports.instancesRunning = function () { return Animitter.instancesRunning; };
exports.globalFixedDelta = function () { return Animitter.globalFixedDelta; };
//helpful to inherit from when using bundled
//export { EventEmitter };
function bind(fn, scope) {
    if (typeof fn.bind === 'function') {
        return fn.bind(scope);
    }
    return function () {
        return fn.apply(scope, arguments);
    };
}
function functions(obj) {
    var keys = Object.keys(obj);
    var arr = [];
    for (var i = 0; i < keys.length; i++) {
        if (typeof obj[keys[i]] === 'function') {
            arr.push(keys[i]);
        }
    }
    return arr;
}
//polyfill Date.now for real-old browsers
Date.now = Date.now || function now() {
    return new Date().getTime();
};
/**
 * this is semi-hacky way of making animitter work as before both in js and ts
 * import animitter from 'animitter';
 * const animitter = require('animitter');
 */
// declare var module: any;
// (module).exports = createAnimitter;

},{"eventemitter3":2,"raf":4}],2:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(global, fn)
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":5}],5:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

}).call(this,require('_process'))
},{"_process":3}]},{},[1])(1)
});
