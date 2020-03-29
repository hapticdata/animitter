import * as EventEmitter from 'eventemitter3';
import * as raf from 'raf';


export { EventEmitter };

interface RAFObject {
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    cancelAnimationFrame: ( id: number) => void;
}

interface AnimitterOptions {
    delay?: number;
    fixedDelta?: boolean;
    fps?: number;
    requestAnimationFrameObject?: RAFObject
}

type UpdateListener = (deltaTime: number, elapsedTime: number, frameCount: number) => any;

//   interface AnimitterEventEmitter {
//     on<K extends keyof BuiltInEvents>(deltaTime: number, elapsedTime: number, frameCount: number): void;
//     // and so on for each method
//   }

//the same as off window unless polyfilled or in node
const defaultRAFObject: RAFObject = {
    requestAnimationFrame: raf,
    cancelAnimationFrame: raf.cancel
};

type Predicate = () => boolean;

function returnTrue(){ return true; }

//manage FPS if < 60, else return true;
function makeThrottle(fps: number): Predicate {
    var delay = 1000/fps;
    var lastTime = Date.now();


    if( fps<=0 || fps === Infinity ){
        return returnTrue;
    }

    //if an fps throttle has been set then we'll assume
    //it natively runs at 60fps,
    var half = Math.ceil(1000 / 60) / 2;

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

interface AnimitterEvents {
    on: {
        (eventType: 'complete' | 'start' | 'stop' | 'update', listenerFn: UpdateListener, context?: any): Animitter;
        (eventType: string, listenerFn: (...args: any[]) => void, context?: any): Animitter;
    }
}

interface AnimitterEventTypes {
    complete: string;
    reset: string;
    start: string;
    stop: string;
    update: string;
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

 export class Animitter extends EventEmitter {

    /**
     * keep a global counter of all loops running, helpful to watch in dev tools
     */
    public static instancesRunning: number = 0;

    /**
     * if true, all `Animitter` instances will behave as if `options.fixedDelta = true`
     */
    public static globalFixedDelta: boolean = false;

    /**
     * if true, events will always increment deltaTime and elapsedTime by
     * exactly the correct milliseconds for set frames per second.
     * This is useful if recording frames or doing something asynchronous but
     * you want animation interval to remain constant
     */
    public fixedDelta: boolean = false;

    /**
     * how many frames have elapsed
     */
    public frameCount: number = 0;

    /**
     * the amount of time in milliseconds since the last 'update' event
     */
    public deltaTime: number = 0;

    /**
     * the amount of time in milliseconds that has elapsed total while running
     */
    public elapsedTime: number = 0;

    private __completed: boolean = false;
    private __delay: number = 0;
    private __fps: number = Infinity;
    private __isReadyForUpdate: Predicate = returnTrue;
    private __lastTime: number = 0;
    private __requestAnimationFrameObject: RAFObject = defaultRAFObject;
    private __running: boolean = false;

    constructor(opts: AnimitterOptions = {}){
        super();

        (typeof opts.delay === 'number') && (this.__delay = opts.delay);
        (typeof opts.fixedDelta !== 'undefined') && (this.fixedDelta = !!opts.fixedDelta);

        this.setFPS(opts.fps || Infinity);
        this.setRequestAnimationFrameObject(opts.requestAnimationFrameObject || defaultRAFObject);
    }

    /**
     * stops the animation and marks it as completed.
     * This will trigger a 'complete' event and prevent it from being started
     * without first calling reset().
     * @emit Animitter#complete
     * @returns {Animitter}
     */
    complete() {
        this.__completed = true;
        this.stop();
        this.emit('complete', this.deltaTime, this.elapsedTime, this.frameCount);
        return this;
    }

    /**
     * stops the animation and removes all listeners
     * @emit Animitter#stop
     * @returns {Animitter}
     */
    dispose() {
        this.stop();
        this.removeAllListeners();
        return this;
    }

    /**
     * get milliseconds between the last 2 updates
     *
     * @return {Number}
     */
    getDeltaTime() {
        return this.deltaTime;
    }

    /**
     * get the total milliseconds that the animation has ran.
     * This is the cumlative value of the deltaTime between frames
     *
     * @return {Number}
     */
    getElapsedTime() {
        return this.elapsedTime;
    }

    /**
     * get the instances frames per second as calculated by the last delta
     *
     * @return {Number}
     */
    getFPS() {
        return this.deltaTime > 0 ? 1000 / this.deltaTime : 0;
    }

    /**
     * get the explicit FPS limit set via `Animitter#setFPS(fps)` or
     * via the initial `options.fps` property
     *
     * @returns {Number} either as set or Infinity
     */
    getFPSLimit() {
        return this.__fps;
    }

    /**
     * get the number of frames that have occurred
     *
     * @return {Number}
     */
    getFrameCount() {
        return this.frameCount;
    }


    /**
     * get the object providing `requestAnimationFrame`
     * and `cancelAnimationFrame` methods
     * @return {Object}
     */
    getRequestAnimationFrameObject() {
        return this.__requestAnimationFrameObject;
    }

    /**
     * is the animation marked as completed
     *
     * @return {boolean}
     */
    isCompleted() {
        return this.__completed;
    }

    /**
     * is the animation loop active
     *
     * @return {boolean}
     */
    isRunning() {
        return this.__running;
    }

    public on<T extends string & keyof AnimitterEventTypes>(eventType: T, listenerFn: UpdateListener, context?: any): this;
    public on(eventType: string, listenerFn: (...args: any[]) => void, context?: any): this;
    public on(eventType: any, listenerFn: (...args: any[]) => void, context?: any): this {
        super.on(eventType, listenerFn, context);
        return this;
    }
    public once<T extends string & keyof AnimitterEventTypes>(eventType: T, listenerFn: UpdateListener, context?: any): this;
    public once(eventType: string, listenerFn: (...args: any[]) => void, context?: any): this;
    public once(eventType: any, listenerFn: (...args: any[]) => void, context?: any): this {
        super.once(eventType, listenerFn, context);
        return this;
    }

    public onComplete(listenerFn: UpdateListener, context?: any) {
        return this.on('complete', listenerFn, context);
    }

    public onReset(listenerFn: UpdateListener, context?: any) {
        return this.on('reset', listenerFn, context);
    }

    public onStart(listenerFn: UpdateListener, context?: any) {
        return this.on('start', listenerFn, context);
    }

    public onStop(listenerFn: UpdateListener, context?: any) {
        return this.on('stop', listenerFn, context);
    }

    public onUpdate(listenerFn: UpdateListener, context?: any) {
        return this.on('update', listenerFn, context);
    }

    /**
     * reset the animation loop, marks as incomplete,
     * leaves listeners intact
     *
     * @emit Animitter#reset
     */
    reset() {
        this.stop();
        this.__completed = false;
        this.__lastTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;

        this.emit('reset', 0, 0, this.frameCount);
        return this;
    }

    /**
     * set the framerate for the animation loop
     *
     * @param {Number} fps
     * @return {Animitter}
     */
    setFPS(fps: number) {
        this.__fps = fps;
        this.__isReadyForUpdate = makeThrottle(fps);
        return this;
    }

    /**
     * set the object that will provide `requestAnimationFrame`
     * and `cancelAnimationFrame` methods to this instance
     * @param {Object} object
     * @return {Animitter}
     */
    setRequestAnimationFrameObject(object: RAFObject) {
        if(typeof object.requestAnimationFrame !== 'function' || typeof object.cancelAnimationFrame !== 'function'){
            throw new Error("Invalid object provide to `setRequestAnimationFrameObject`");
        }
        this.__requestAnimationFrameObject = object;
        return this;
    }

    /**
     * start an animation loop
     * @emit Animitter#start
     * @return {Animitter}
     */
    start() {

        const onStart = () =>{
            let rAFID: number;
            //dont let a second animation start on the same object
            //use *.on('update',fn)* instead
            if(this.__running){
                return this;
            }

            Animitter.instancesRunning += 1;
            this.__running = true;
            this.__lastTime = Date.now();
            this.deltaTime = 0;

            //emit **start** once at the beginning
            this.emit('start', this.deltaTime, 0, this.frameCount);

            let lastRAFObject = this.__requestAnimationFrameObject;

            const drawFrame = () => {
                const raf = this.getRequestAnimationFrameObject();
                if(lastRAFObject !== raf) {
                    //if the requestAnimationFrameObject switched in-between,
                    //then re-request with the new one to ensure proper update execution context
                    //i.e. VRDisplay#submitFrame() may only be requested through VRDisplay#requestAnimationFrame(drawFrame)
                    lastRAFObject = raf;
                    raf.requestAnimationFrame(drawFrame);
                    return;
                }
                if(this.__isReadyForUpdate()){
                    this.update();
                }
                if(this.__running){
                    rAFID = raf.requestAnimationFrame(drawFrame);
                } else {
                    raf.cancelAnimationFrame(rAFID);
                }
            };

            this.getRequestAnimationFrameObject().requestAnimationFrame(drawFrame);

            return this;
        }

        if(this.__delay){
            setTimeout(onStart, this.__delay);
        } else {
            onStart();
        }
        return this;
    }

    /**
     * stops the animation loop, does not mark as completed
     *
     * @emit Animitter#stop
     * @return {Animitter}
     */
    stop() {
        if( this.__running ){
            this.__running = false;
            Animitter.instancesRunning -= 1;
            this.emit('stop', this.deltaTime, this.elapsedTime, this.frameCount);
        }
        return this;
    }

    /**
     * update the animation loop once
     *
     * @emit Animitter#update
     * @return {Animitter}
     */
    update() {
        this.frameCount++;
        /** @private */
        var now = Date.now();
        this.__lastTime = this.__lastTime || now;
        this.deltaTime = (this.fixedDelta || Animitter.globalFixedDelta) ? 1000/Math.min(60, this.__fps) : now - this.__lastTime;
        this.elapsedTime += this.deltaTime;
        this.__lastTime = now;

        this.emit('update', this.deltaTime, this.elapsedTime, this.frameCount);
        return this;
    }
}


const isFunction = (o?: any): o is Function => o && typeof o === 'function';

/**
 * create an animitter instance,
 * @param {Object} [options]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
export default function createAnimitter(options?: AnimitterOptions | UpdateListener, fn?: UpdateListener){

    if( arguments.length === 1 && isFunction(options)){
        fn = options;
        options = {};
    }

    const _instance = new Animitter( options as AnimitterOptions );

    if( fn ){
        _instance.on('update', fn);
    }

    return _instance;
}


/**
 * create an animitter instance,
 * where the scope is bound in all functions
 * @param {Object} [options]
 * @param {Function} fn( deltaTime:Number, elapsedTime:Number, frameCount:Number )
 * @returns {Animitter}
 */
export function bound(options?: AnimitterOptions | UpdateListener, fn?: UpdateListener){

    const loop = createAnimitter(options, fn) as any;
    const functionKeys = functions(Animitter.prototype);
    const hasBind = !!Function.prototype.bind;

    let fnKey: string;

    for(var i=0; i<functionKeys.length; i++){
        fnKey = functionKeys[i];
        loop[fnKey] = hasBind ? loop[fnKey].bind(loop) : bind(loop[fnKey], loop);
    }

    return loop as Animitter;
};


createAnimitter.Animitter = Animitter;
createAnimitter.bound = bound;
createAnimitter.EventEmitter = EventEmitter;

Object.defineProperty(createAnimitter, 'running', {
    get: function() {
        return Animitter.instancesRunning;
    }
});

Object.defineProperty(createAnimitter, 'globalFixedDelta', {
    get: function() {
        return Animitter.globalFixedDelta;
    },
    set: function(v: boolean) {
        Animitter.globalFixedDelta = v;
    }
});


//helpful to inherit from when using bundled
//export { EventEmitter };

function bind(fn: Function, scope: any){
    if(typeof fn.bind === 'function'){
        return fn.bind(scope);
    }
    return function(){
        return fn.apply(scope, arguments);
    };
}

function functions(obj: any): string[] {
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
