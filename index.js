var EventEmitter          = require('events').EventEmitter,
    inherits              = require('inherits'),
    requestAnimationFrame = require('raf'),
    cancelAnimationFrame  = require('raf').cancel,
    methods;


function returnTrue(){ return true; }

//manage FPS if < 60, else return true;
function makeThrottle(fps){
    var delay = 1000/fps;
    var lastTime = Date.now();
    var half = Math.ceil(1000 / 60) / 2;


    if( fps >= 60 ){
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

        return this;
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


/**
 * create an animitter instance,
 * @param {Object} [options]
 * @param {Number} [options.fps]
 * @param {Function} fn( deltaTime:Number, frameCount:Number, elapsedTime:Number )
 * @returns {Animitter}
 */
module.exports = exports = function createAnimitter(options, fn){

    if( arguments.length === 1 && typeof options === 'function'){
        fn = options;
        options = {};
    }

    var _instance = new Animitter( options );

    if( fn ){
        _instance.on('update', fn);
    }

    return _instance;
};



exports.Animitter = Animitter;

//helpful to inherit from when using bundled
exports.EventEmitter = EventEmitter;
//keep a global counter of all loops running, helpful to watch in dev tools
exports.running = 0;


//polyfill Date.now for real-old browsers
Date.now = Date.now || function now() {
    return new Date().getTime();
};

