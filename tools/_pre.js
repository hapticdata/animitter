//###Env: Browser + Node
//*Author:* [Kyle Phillips](http://hapticdata.com)
//*published under the MIT license*

//animator factory for creating [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/DOM/window.requestAnimationFrame) callbacks
//and simplifying their cancellation.
//Animations can use `start()` and `stop()` repeatedly to pause, and `complete()` once to finish.

//**_Basic use:_**
//
//		loop = animitter(function(){
//			//do this every time
//			if(Math.random() > 0.9) this.complete();
//		}).start();
