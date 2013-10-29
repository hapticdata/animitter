# Animitter
## Event-based loops in browser and in Node
_by [Kyle Phillips](http://haptic-data.com)_

[![Build Status](https://travis-ci.org/hapticdata/animitter.png?branch=master)](https://travis-ci.org/hapticdata/animitter)

Animitter is a combination of an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) and a feature-filled animation loop.
It uses [requestAnimationFrame](http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/) with an automatic fallback to `setTimeout` and offers several
additional features, such as asynchronous execution of the next frame.

## Installation:
### Node.js:

    npm install animitter

### Browser
copy `./animitter.js` or `./animitter.min.js` into your project

    <script src="js/animitter.js"></script>
or with **require.js/amd**:

    require(['animitter'], function( animitter ){});

## Usage:
### start a new animation loop

```javascript
var loop = animitter(function(frameCount){
    //do something
}).start();
```

### start a new animation loop, listen to its built-in events

```javascript
var loop = animitter(function(frameCount){
    //do something
});

loop.on('start', function(frameCount){
    //loop started
});

loop.on('update', function(frameCount){
    if( frameCount === 100 ){
        //`this` is scoped to the Animitter instance
        this.complete();
    }
});

loop.on('stop', function(frameCount){
    //this will get triggered on a `complete` also
});

loop.on('complete', function(frameCount){
    //done
});

loop.start();   
```

### Start an asynchronous loop

Animitter allows you to create a loop that will pause at each frame until explicitly invoked.
It does this by passing a function as a 2nd argument:

```javascript
var asyncLoop = animitter({ async: true }, function(frameCount, nextFrame ){
    render();
    doSomethingAsync(function onComplete(){
        //now we are ready for the next frame loop
        nextFrame();
    });
});
    
asyncLoop.start();
```

### Start an fps-throttled loop

Throttle a `requestAnimationFrame` loop down to the specified frames-per-second.

```javascript
var loop = animitter({ fps: 30 }, function(frameCount){
    //do something  
});

loop.start();
```

### Combine options

```javascript
var loop = animitter({ async: true, fps: 30 });
loop.on('update', function(frameCount, nextFrame){
    render();
    doSomethingAsync(function(){
        nextFrame();
    });
});
loop.start();
```


### animitter.running
The `animitter` object comes with the property `running` this counter indicates the number
of animitter instances that are currently animating. This can be helpful for debugging to ensure
that you are properly stopping all of your animitter instances.
