# Animitter
## Event-based animation in browser and in Node
_by [Kyle Phillips](http://haptic-data.com)_

Animitter is a combination of an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) and a feature-filled animation loop.
It uses `requestAnimationFrame` with an automatic fallback to `setTimeout` and offers several
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
### start a new animation loop immediately

```javascript
var loop = animitter(function(){
	//do something
}).start();
```

### start a new animation loop, listen to its built-in events

```javascript
var loop = animitter(function(){
	//do something
});

loop.on('update', function(self, frameCount){
	if( frameCount > 99 ){
		//this is scoped to the Animitter instance
		this.complete();
	}
});

loop.on('complete', function(){
	//done
});

loop.start();	
```

### Start an asynchronous loop

Animitter allows you to create a loop that will pause at each frame until explicitly invoked:

```javascript
var asyncLoop = animitter({ async: true }, function(loop, frameCount, nextFrame ){
	render();
	doSomethingAsynchronous(function onComplete(){
		//now we are ready for the next frame loop
		nextFrame();
	});
});
	
asyncLoop.start();
```

### Start an fps-throttled loop

Throttle a `requestAnimationFrame` loop down to the specified frames-per-second.

```javascript
var loop = animitter({ fps: 30 }, function(self, frameCount){
	
});
```

### Combine options

```javascript
var loop = animitter({ async: true, fps: 30 });
loop.on('update', function( self, frameCount ){
	render();
});
loop.start();
```