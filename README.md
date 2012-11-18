#Animitter
##Event-based animation in browser and in Node
_by [Kyle Phillips](http://haptic-data.com)_

Animitter is a combination of an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) and a feature-filled animation loop.
It uses `requestAnimationFrame` with an automatic fallback to `setTimeout` and offers several
additional features, such as asynchronous execution of the next frame.

#Installation:
##Node.js:

	npm install animitter

##Browser
copy `./animitter.js` or `./animitter.min.js` into your project

	<script src="js/animitter.js"></script>
or with **require.js/amd**:

	require(['animitter'], function( animitter ){});

#Basic use:
##start a new animation loop immediately
	var loop = animitter(function(){
		//do something
	}).start();
##start a new animation loop, listen to its built-in events
	var loop = animitter(function(){
		//do something
	});

	loop.on('update', function(){
		if( this.frameCount > 99 ){
			this.complete();
		}
	});

	loop.on('complete', function(){
		//done
	});

	loop.start();