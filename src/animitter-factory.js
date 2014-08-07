function createAnimitter( root, inherits, EventEmitter ){
    var exports;
    //##Animitter object
    //###Extends: [events.EventEmitter](./events.html)
    // *animation.Animitter*
    /** @expose */
    var Animitter = function( opts ){
        opts = opts || {};
        /** @expose */
        this.frameCount = 0;
        /** @expose */
        this.deltaTime = 0;
        /** @private */
        this.__animating = false;
        /** @private */
        this.__completed = false;
        /** @private */
        this.__async = (opts.async === true);
        /** @private */
        this.__fps = opts.fps || 60;
    };

    var methods = {
        //####myAnimation.complete()
        //stops the animation and emits *'complete'*
        complete: function(){
            this.stop();
            this.__completed = true;
            this.emit('complete', this.frameCount, this.deltaTime);
            return this;
        },
        getDeltaTime: function(){
            return this.deltaTime;
        },
        getFPS: function(){
            return this.__fps;
        },
        getFrameCount: function(){
            return this.frameCount;
        },
        isAnimating: function(){
            return this.__animating;
        },
        isCompleted: function(){
            return this.__completed;
        },
        isAsync: function(){
            return this.__async;
        },
        //####myAnimation.update();
        //emit the next update, once
        update: function(){
            this.frameCount++;
            /** @private */
            this.__lastTime = this.__lastTime || Date.now();
            var now = Date.now();
            this.deltaTime = now - this.__lastTime;
            this.__lastTime = now;
            this.emit('update', this.frameCount, this.deltaTime);
        },
        //####myAnimation.reset();
        //reset the animation loop
        reset: function(){
            if( this.__animating ){
                this.stop();
            }
            this.__completed = false;
            this.frameCount = 0;
            this.emit('reset', this.frameCount);
            return this;
        },
        //####myAnimation.start(function(){})
        //start the animation
        //optional **callback** will be attached to .on('update',fn)
        start: function( callback ){
            var self = this,
                enoughTimeElapsed,
                step,
                nextFrame,
                drawFrame;
            //dont let a second animation start on the same object
            //use *.on('update',fn)* instead
            if(this.__animating){
                return this;
            }
            //emit **start** once at the beginning
            this.emit('start', this.frameCount);
            exports.running += 1;
            this.__animating = true;
            var now = Date.now();
            this.deltaTime = now - this.__lastTime;
            this.__lastTime = now;

            step = function(){
                self.frameCount++;
                var now = Date.now();
                self.deltaTime = now - (self.__lastTime || now);
                self.__lastTime = now;
                if( self.__async ){
                    self.emit('update', self.frameCount, self.deltaTime, function(){
                        self.__animating = true;
                        drawFrame();
                    });
                    return false;
                } else {
                    self.emit('update', self.frameCount, self.deltaTime);
                    return true;
                }
            };

            if(callback !== undefined){
                this.on('update', callback);
            }


            //manage FPS if < 60, else return true;
            enoughTimeElapsed = (function(){
                var lastTime = Date.now();
                return (self.__fps < 60) ? function(){
                    //if a custom fps is requested
                    var now = Date.now();
                    if( now - lastTime < (1000/self.__fps) ){
                        return false;
                    }
                    lastTime = now;
                    return true;
                } : function(){ return true; };
            })();

            //continue the rAF loop, not necessarily calling the user's function
            nextFrame = (function(){
                var rAFID;
                return function(){
                    if(self.__animating){
                        rAFID = root.requestAnimationFrame(drawFrame);
                    } else {
                        root.cancelAnimationFrame(rAFID);
                    }
                };
            })();

            drawFrame = function(){
                if(!enoughTimeElapsed()){
                    nextFrame();
                    return;
                }
                if( step() ){
                    nextFrame();
                }
            };

            drawFrame();

            return this;
        },
        //####myAnimation.stop()
        //stops the animation but does not mark as completed
        stop: function(){
            if( this.__animating ){
                this.__animating = false;
                exports.running -= 1;
                this.emit('stop', this.frameCount, this.deltaTime);
            }
            return this;
        }
    };

    inherits(Animitter, EventEmitter);
    for(var method in methods){
        Animitter.prototype[method] = methods[method];
    }

    //####anim(function(){}).start();
    //creates an animitter but does not start it
    //**alternately:** anim({ async: true }, function( next ){ next(); })
    /** @expose */
    exports = function( opts, fn ){
        if( arguments.length === 1 && typeof opts === 'function'){
            fn = opts;
            opts = {};
        }
        var _instance = new Animitter( opts );
        if( fn ) _instance.on('update', fn);
        return _instance;
    };
    //log how many animations are running
    /** @expose */
    exports.running = 0;
    //####anim.async(function( next ){ next(); });
    //creates an asynchronous animation where the next frame is queued
    //once next(); is invoked
    /** @expose */
    exports.async = function( opts, fn ){
        if( arguments.length === 1){
            fn = opts;
            opts = {};
        }
        opts.async = true;
        return exports.start( opts, fn );
    };
    //####anim.start( function(){} )
    //creates a new animitter and auto-starts it
    //this is the most direct way to use it but will result in missing
    //at least one *.on('update',fn)* applied after
    /** @expose */
    exports.start = function( opts, fn ){
        if( arguments.length === 1 ){
            fn = opts;
            opts = {};
        }
        var _instance = new Animitter(opts);
        return _instance.start(fn);
    };
    /** @expose */
    exports.Animitter = Animitter;
    /** @expose */
    exports.EventEmitter = EventEmitter;
    return exports;
}
