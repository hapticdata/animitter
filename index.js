var EventEmitter          = require('events').EventEmitter,
    inherits              = require('inherits'),
    raf                   = require('raf'),
    methods;



function returnTrue(){ return true; }

//manage FPS if < 60, else return true;
function makeThrottle(fps){
    var delay = 1000/fps;
    var lastTime = Date.now();
    var half = Math.ceil(1000 / maxFPS) / 2;


    if( !(fps>0) || fps >= maxFPS ){
        return returnTrue;
    }

    return function(){
        //if a custom fps is requested
        var now = Date.now();
        //is this frame within 8.5ms of the target?
        //if so then next frame is gonna be too late
        if(now - lastTime < delay - half){
            return false;
        }
        lastTime = now;
        return true;
    };
}


function Animitter( opts ){
    opts = opts || {};

    this.__delay = opts.delay || 0;

    /** @expose */
    this.fixedDelta = !!opts.fixedDelta;

    /** @expose */
    this.frameCount = 0;
    /** @expose */
    this.deltaTime = 0;
    /** @expose */
    this.elapsedTime = 0;

    /** @private */
    this.__running = false;
    /** @private */
    this.__completed = false;

    this.setFPS(opts.fps || Infinity);
}

inherits(Animitter, EventEmitter);

function onStart(scope){
    var now = Date.now();
    var rAFID;
    //dont let a second animation start on the same object
    //use *.on('update',fn)* instead
    if(scope.__running){
        return scope;
    }

    exports.running += 1;
    scope.__running = true;
    scope.__lastTime = scope.__lastTime || now;
    scope.deltaTime = now - scope.__lastTime;
    scope.elapsedTime += scope.deltaTime;

    //emit **start** once at the beginning
    scope.emit('start', scope.deltaTime, 0, scope.frameCount);


    var drawFrame = function(){
        if(scope.__isReadyForUpdate()){
            scope.update();
        }
        if(scope.__running){
            rAFID = requestAnimationFrame(drawFrame);
        } else {
            cancelAnimationFrame(rAFID);
        }
    };

    drawFrame();

    return scope;
}

methods = {
    //EventEmitter Aliases
    off     : EventEmitter.prototype.removeListener,
    trigger : EventEmitter.prototype.emit,

    /**
     * stops the animation and marks it as completed
     * @emit Animitter#complete
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
     * @emit Animitter#stop
     * @returns {Animitter}
     */
    dispose: function(){
        this.stop();
        this.removeAllListeners();
        return this;
    },

    /**
     * get milliseconds between the last 2 updates
     *
     * @return {Number}
     */
    getDeltaTime: function(){
        return this.deltaTime;
    },

    /**
     * get the total milliseconds that the animation has ran.
     * This is the cumlative value of the deltaTime between frames
     *
     * @return {Number}
     */
    getElapsedTime: function(){
        return this.elapsedTime;
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
    isRunning: function(){
        return this.__running;
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
     * @emit Animitter#reset
     * @return {Animitter}
     */
    reset: function(){
        this.stop();
        this.__completed = false;
        this.__lastTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;

        this.emit('reset', 0, 0, this.frameCount);
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
     * @emit Animitter#start
     * @return {Animitter}
     */
    start: function(){
        var self = this;
        if(this.__delay){
            setTimeout(function(){
                onStart(self);
            }, this.__delay);
        } else {
            onStart(this);
        }
        return this;
    },

    /**
     * stops the animation loop, does not mark as completed
     *
     * @emit Animitter#stop
     * @return {Animitter}
     */
    stop: function(){
        if( this.__running ){
            this.__running = false;
            exports.running -= 1;
            this.emit('stop', this.deltaTime, this.elapsedTime, this.frameCount);
        }
        return this;
    },

    /**
     * update the animation loop once
     *
     * @emit Animitter#update
     * @return {Animitter}
     */
    update: function(){
        this.frameCount++;
        /** @private */
        var now = Date.now();
        this.__lastTime = this.__lastTime || now;
        this.deltaTime = (this.fixedDelta || exports.globalFixedDelta) ? 1000/this.__fps : now - this.__lastTime;
        this.elapsedTime += this.deltaTime;
        this.__lastTime = now;

        this.emit('update', this.deltaTime, this.elapsedTime, this.frameCount);
        return this;
    }



};



for(var method in methods){
    Animitter.prototype[method] = methods[method];
}


/**
 * create an animitter instance,
 * @param {Object} [options]
 * @param {Number} [options.fps]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
function createAnimitter(options, fn){

    if( arguments.length === 1 && typeof options === 'function'){
        fn = options;
        options = {};
    }

    var _instance = new Animitter( options );

    if( fn ){
        _instance.on('update', fn);
    }

    return _instance;
}

module.exports = exports = createAnimitter;

/**
 * create an animitter instance,
 * where the scope is bound in all functions
 * @param {Object} [options]
 * @param {Number} [options.fps]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
exports.bound = function(options, fn){

    var loop = createAnimitter(options, fn),
        functionKeys = functions(Animitter.prototype),
        hasBind = !!Function.prototype.bind,
        fnKey;

    for(var i=0; i<functionKeys.length; i++){
        fnKey = functionKeys[i];
        loop[fnKey] = hasBind ? loop[fnKey].bind(loop) : bindPolyfill(loop[fnKey], loop);
    }

    return loop;
};


/**
 * the `requestAnimationFrame` to use, defaults to 'raf'
 * for `window.requestAnimationFrame` or `setTimeout` polyfill
 * available for override for use-cases such as `VRDisplay#requestAnimationFrame`
 * @type {Function}
 */
var requestAnimationFrame = raf;

/**
 * if changing `animitter.requestAnimationFrame` you should also provide a matching
 * `cancelAnimationFrame`
 * @type {Function}
 */
var cancelAnimationFrame = raf.cancel;


/**
 * the maximum framerate the set `requestAnimationFrame` is capable of, used for throttling
 * @type {Number}
 */
var maxFPS = 60;



/**
 * set animitter to use a different `requestAnimationFrame` and `cancelAnimationFrame` function
 * than the default. Example uses would be to use `VRDisplay#requestAnimationFrame` or using `setTimeout` instead
 * @param {Function} request the `requestAnimationFrame` equivalent function
 * @param {Function} cancel the `cancelAnimationFrame` equivalent function
 * @param {Number} [fps=60] the maximum frames per second this `requestAnimationFrame` is capable of
 */
exports.setAnimationFrame = function(request, cancel, fps){
    if(arguments.length === 1 && typeof request === 'object'){
        fps = request.fps;
        cancel = request.cancelAnimationFrame;
        request = request.requestAnimationFrame;
    }
    if(typeof request !== 'function' || typeof cancel !== 'function'){
        throw new Error('invalid parameters, provide a `requestAnimationFrame` as well as a `cancelAnimationFrame` function');
    }

    requestAnimationFrame = request;
    cancelAnimationFrame = cancel;
    maxFPS = fps || 60;
};

exports.getAnimationFrame = function(){
    return {
        requestAnimationFrame: requestAnimationFrame,
        cancelAnimationFrame: cancelAnimationFrame,
        fps: maxFPS
    };
};

exports.Animitter = Animitter;

/**
 * if true, all `Animitter` instances will behave as if `options.fixedDelta = true`
 */
exports.globalFixedDelta = false;

//helpful to inherit from when using bundled
exports.EventEmitter = EventEmitter;
//keep a global counter of all loops running, helpful to watch in dev tools
exports.running = 0;

function bindPolyfill(fn, scope){
    return function(){
        return fn.apply(scope, arguments);
    };
}

function functions(obj){
    var keys = Object.keys(obj);
    var arr = [];
    for(var i=0; i<keys.length; i++){
        if(typeof obj[keys[i]] === 'function'){
            arr.push(keys[i]);
        }
    }
    return arr;
}



//polyfill Date.now for real-old browsers
Date.now = Date.now || function now() {
    return new Date().getTime();
};
