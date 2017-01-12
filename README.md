# Animitter
## Event-based loops in browser and in Node
_by [Kyle Phillips](http://haptic-data.com)_

[![Build Status](https://travis-ci.org/hapticdata/animitter.png?branch=master)](https://travis-ci.org/hapticdata/animitter)

Animitter is a combination of an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) and a feature-filled animation loop. It uses [requestAnimationFrame](http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/) with an automatic fallback to `setTimeout` and offers several additional features, such as framerate throttling, easy starting and stopping of the loop, providing `deltaTime` in milliseconds between frames, as well as total `elapsedTime` and `frameCount`. Listen to the built-in `update`, `start`, `stop`, `complete` and `reset` events, or emit your own.

## Installation:
### Node.js or Browserify:

    npm install animitter --save
    
### Browser global
copy `./animitter.js` or `./animitter.min.js` into your project

    <script src="js/animitter.js"></script>
or with **require.js/amd**:

    require(['animitter'], function( animitter ){});



## Usage:
### start a new animation loop

```javascript
var loop = animitter(function(deltaTime, elapsedTime, frameCount){
    //do something
}).start();
```

### start a new animation loop, listen to its built-in events

```javascript
var loop = animitter(function(deltaTime, elapsedTime, frameCount){
    //do something
});

loop.on('start', function(deltaTime, elapsedTime, frameCount){
    //loop started
});

loop.on('update', function(deltaTime, elapsedTime, frameCount){
    if( frameCount === 100 ){
        //`this` is scoped to the Animitter instance
        this.complete();
    }
});

loop.on('stop', function(deltaTime, elapsedTime, frameCount){
    //this will get triggered on a `complete` also
});

loop.on('complete', function(deltaTime, elapsedTime, frameCount){
    //done, can't be started again unless reset
});

loop.on('reset', function(deltaTime, elapsedTime, frameCount){

});

loop.start();   
```


### Pausing and Resuming a loop

Animitter provides `animitter().start()` and `animitter().stop()` to easily pause and resume an animation. Any stopped loop can be resumed with `animitter().start()` as long as it has not been marked as completed via `animitter().complete()`.

```js

var stats = document.createElement('div');
var button = document.createElement('button');
button.innerHTML = 'play';

var loop = animitter(function(deltaTime, elapsedTime, frameCount){
    stats.innerHTML = Math.floor(this.getFPS()) + 'fps, elapsed: ' +elapsedTime+ ', delta: ' +deltaTime+ ' frames: ' +frameCount;
});

loop.on('start', function(){ button.innerHTML = 'pause'; });
loop.on('stop',  function(){ button.innerHTML = 'play'; });

button.addEventListener('click', function(){
    if(loop.isRunning()){
      loop.stop();
    } else {
      loop.start();
    }
 });
  
 document.body.appendChild(stats);
 document.body.appendChild(button);

```

### Custom Events + Adding / Removing listeners
Animitter uses the same [EventEmitter](http://nodejs.org/api/events.html) as Node.js. This allows you to `emit` events, add listeners with `on`,`once`,`addListener` or remove listeners with `removeListener` or `removeAllListeners`.

The following example periodically emits a custom event. A listener is added for the event which removes itself after a few uses:
```javascript
var timesDovesHaveFlown = 0,
    shouldMakeDovesFly = function(){ return Math.random() > 0.9; };

var loop = animitter(function(deltaTime, elapsedTime, frameCount){
    //play an animation
    if( shouldMakeDovesFly() ){
        //after the event-type, pass any parameters you want the listener to receive
        this.emit('doves-fly', doves);
    }
});

loop.on('doves-fly', function(doves){
    timesDovesHaveFlown++;
    //make doves fly here
    if( timesDovesHaveFlown > 4 ){
        this.removeListener('doves-fly', makeDovesFly);
    }
});


loop.start();

```

## API

Animitter inherits from [EventEmitter](https://nodejs.org/api/events.html) which provides methods such as `emit`, `on`, `removeListener` etc… below _(in alphabetical order)_ are the methods that animitter provides directly:

### animitter([options, fn])
    
+ **options.fps : _Number_**  _defaults to Infinity_, set a framerate to throttle the loop, otherwise it will run as fast as possible, _60fps on desktop, 60-100fps on VRDisplay_
+ **options.requestAnimationFrameObject : _Object_** _defaults to global object_, allows providing in an object such as a [VRDisplay](https://w3c.github.io/webvr/#interface-vrdisplay) to use its `requestAnimationFrame` related methods.
+ **options.delay : _Number_** _defaults to 0_, set an optional delay in milliseconds to wait before invoking the first update on the loop after calling `start()`
+ **options.fixedDelta : _Boolean_**  _defaults to false_, if true, `'update'` events will always report `deltaTime` and `elapsedTime` as consistent framerate intervals. Useful in situations such as when you may be recording output at a rate different than real-time.



### animitter().complete()
stop the loop and mark it as completed and unable to start again.

### animitter().dispose()
stop the loop and remove all listeners.

### animitter().getFPS()
returns the calculated rate of frames-per-second for the last update based on `animitter().getDeltaTime()`, will return `0` if the loop has not started yet.

### animitter().getFPSLimit()
return the framerate as set via `options.fps` or `animitter().setFPS(fps)`, returns `Infinity` if no limit has been set.

### animitter().getRequestAnimationFrameObject()
returns the object that is providing `requestAnimationFrame` to this instance

### animitter().getDeltaTime()
return the time between the last two frames in milliseconds

### animittter().getElapsedTime()
return the sum of all elapsed time while running in milliseconds. This is the sum of deltas between frames; if a loop is stopped and started later that time will not be included as elapsed time.

### animitter().getFrameCount()
return the number of times the loop has repeated.

### animitter().isRunning()
return true if the loop is currently active

### animitter().isCompleted()
return true if the loop has been marked as completed.

### animitter().reset()
stops the loop and resets its times, frameCount and whether it was completed, leaves listeners intact.

### animitter().setFPS( fps )
throttle the loop to a preferred framerate between 0-60.

### animitter().setRequestAnimationFrameObject( object )
allows you to use `requestAnimationFrame` from a custom object, such as a VRDisplay.
Below is an example of using `animitter().setRequestAnimationFrameObject` with WebVR:

```js
var loop = animitter().start();
navigator.getVRDisplays().then((displays)=>{
    if(displays.length > 0){
        var vrDisplay = displays[0];
        loop.setRequestAnimationFrameObject(vrDisplay)
        loop.on('update', function(){
            //now you can safely call VRDisplay#submitFrame()
            vrDisplay.submitFrame();
        });
    }
});
```

### animitter().start()
starts repeating the update loop.

### animitter().stop()
stops repeating the update loop.

### animitter().update()
updates the loop once.



### animitter.running
The `animitter` object comes with the property `running` this counter indicates the number
of animitter instances that are currently animating. This can be helpful for debugging to ensure
that you are properly stopping all of your animitter instances.

### animitter.globalFixedDelta
Setting this to true will force all animitter instances to behave as if `options.fixedDelta` was `true`. A helpful application-wide toggle if you begin to record the output not in real-time.


## Tests

Animitter comes with TAP tests. These tests are compatible in node and in browser. 
**To run the tests in node:**

```
npm test
```

**To run tests in browser:**
A very simple way of accomplishing this, is to use something like [budo](http://github.com/mattdesl/budo) and watch your console for logs:

```
npm install budo -g
budo test.js
```

## Breaking changes from < 3.0.0

* `animitter().getFPS()` now returns the actual running frame rate instead of just returning the frame rate set via `animitter().setFPS(fps)`, for this behavior use `animitter().setFPSLimit()`.
* `animitter().getElapsedTime()` no longer includes durations that elapsed in-between when a loop has been stopped and started again.

## Breaking changes for those migrating from <1.0.0
In v1.0.0 a few aspects of the API have changed. Most notably the parameter signature of all events is now:

```js
function onEvent( deltaTime, elapsedTime, frameCount ){ }
```

Additionally, `animitter().isAnimating()` has been renamed to `isRunning()` and `{ async: true }` option no longer is available. Instead users should call `animitter().update()` directly to update their loop asynchronously.



**MIT License**


