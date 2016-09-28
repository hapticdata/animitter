var test = require('tape'),
    assert = require('assert'),
    animitter = require('./index');



function invoke(arr, fnString){
    arr.forEach(function(item){
        item[fnString]();
    });
}

//create a fn that completes that loop at frame 100
function completeAtFrame(done, frame){
    return function(deltaTime, elapsedTime, frameCount){
        if( frameCount === frame ){
            this.complete();
        }
    };
}

function createLoops( n ){
    var threads = [];
    var noop = function(){};
    for( var i=0; i<n; i++){
        threads.push(animitter(noop));
    }
    return threads;
}


function okDelta(fps, deltaTime){
    var fpsMS = ~~(1000/fps);
    return (deltaTime === 0 || deltaTime>(fpsMS-10)) && deltaTime - fpsMS < fpsMS;
}

test('running counter', function(t){
    t.plan(5);

    var n = 100;
    var loops;

    //havent been started yet
    loops = createLoops(n);
    t.equal(animitter.running, 0, 'should have 0 animations running after creation');

    //started now
    invoke(loops, 'start');
    t.equal(animitter.running, n, 'all ' + n + ' loops running');

    //stopped
    invoke(loops, 'stop');
    t.equal(animitter.running, 0, 'all ' + n + ' loops should be stopped and not counted as running');

    invoke(loops, 'start');
    //half are stopped half are completed
    loops.forEach(function(loop, i){
        loop[ (i%2===0) ? 'stop' : 'complete' ]();
    });
    t.equal(animitter.running, 0, 'complete() and stop() should both drop the running counter');


    //repeatedly stopped, counter should not go negative
    invoke(loops, 'start');
    invoke(loops, 'stop');
    invoke(loops, 'complete');
    invoke(loops, 'stop');

    t.equal(animitter.running, 0, 'should not go negative when calling stop multiple times in a row');
});

test('load animitter', function(t){
    t.plan(2);

    //load it
    t.equal(typeof animitter, 'function', 'animitter module should be a function');
    t.equal(typeof animitter.Animitter.prototype.emit, 'function', 'emit should be a function on the prototype object');
});

test('invoke animitter()', function(t){
    t.plan(3);

    //create a loop but not start it
    var loop = animitter();
    t.equal(loop.isRunning(), false, 'should not be animating since the loop has not started');
    t.equal(loop.frameCount, 0, 'should not have updated yet');
    loop.start();
    t.equal(loop.isRunning(), true, 'should be animating now that start() has been called');
    loop.stop();
    //loop.dispose();
});

test('animitter().dispose()', function(t){

    var events = ['start', 'update', 'stop', 'complete'];
    t.plan(1 + events.length);

    var cbUpdate = function(){};
    var cbUpdate2 = function(){};
    var cbStart = function(){};
    var cbStop = function(){};
    var cbComplete = function(){};

    var loop = animitter()
        .on('start', cbStart)
        .on('update', cbUpdate)
        .on('update', cbUpdate2)
        .on('stop', cbStop)
        .on('complete', cbComplete);

    loop.start();

    setTimeout(function(){
        //should stop the loop and remove all listeners
        loop.dispose();

        t.ok(!loop.isRunning(), 'should not be animating');

        events.forEach(function(evtName){
            t.equal(loop.listeners(evtName).length, 0, 'should have all listeners removed for ' + evtName);
        });

    }, 33);

});

test('animitter().update()', function(t){
    t.plan(2);
    //calling update() without calling start()
    var loop = animitter(function(deltaTime, elapsedTime, frameCount){
        t.equal(loop.isRunning(), false, 'false cause it was never started');
        t.equal(frameCount, 1, 'should run only once');
    });

    loop.update();
});

test('animitter({ fps: fps })', function(t){
    t.plan(1);

    var fps = 15;
    var loop = animitter({ fps: fps });
    t.equal(loop.getFPS(), fps);
});


test('callback(deltaTime, elapsedTime, frameCount)', function(t){
    var totalFrames = 10;
    t.plan(4);

    var loop = animitter();
    var frame = 0;

    var dt = true,
        et = true,
        fc = true,
        fc2 = true;

    loop.on('update', function(deltaTime, elapsedTime, frameCount){
        frame++;
        dt && (dt = deltaTime === this.getDeltaTime());
        et && (et = elapsedTime === this.getElapsedTime());
        fc && (fc = frameCount === this.getFrameCount());
        fc2 && (fc2 = frameCount === frame);
        if(frameCount === totalFrames){
            this.complete();
        }
    });

    loop.on('complete', function(){
        t.ok(dt, 'deltaTime matches getDeltaTime()');
        t.ok(et, 'elapsedTime matches getElapsedTime()');
        t.ok(fc, 'frameCount matches getFrameCount()');
        t.ok(fc2, 'frameCount matches counter');
    });


    loop.start();
});

test('animitter().getFrameCount()', function(t){
    var totalFrames = 10;
    t.plan(3);

    var fcOk = true;
    animitter()
        .on('update', function(delta, elapsed, frameCount){
            fcOk && (fcOk = frameCount === this.getFrameCount());
            if(frameCount === totalFrames){
                this.complete();
            }
        })
        .on('complete', function(delta, elapsed, frameCount){
            t.ok(fcOk, 'frameCount should be consistent');
            t.equal(this.getFrameCount(), totalFrames, 'frameCount should be ' + totalFrames + ' when complete');
            this.reset();
        })
        .on('reset', function(delta, elapsed, frameCount){
            t.equal(this.getFrameCount(), 0, 'frameCount should be 0 when reset');
        })
        .start();
});

test('animitter().getElapsedTime() without being started', function(t){
    t.plan(1);
    var loop = animitter();
    setTimeout(function(){
        t.equal(loop.getElapsedTime(), 0, 'should be 0');
    });
});

test('animitter().getElapsedTime() after reset', function(t){
    t.plan(1);

    var loop = animitter(function(delta, elapsed, frame){
        if(frame === 10){
            this.reset();
        }
    });
    loop.on('reset', function(delta, elapsed, frame){
        t.equal(loop.getElapsedTime(), 0, 'should be 0');
    });
    loop.start();
});

test('animitter().getElapsedTime() should track total time played', function(t){
    t.plan(1);
    var delay = 1000;
    var thresh = 32;

    var loop = animitter();
    loop.on('start', function(){
        setTimeout(function(){
            t.ok(loop.getElapsedTime() > delay-thresh && loop.getElapsedTime() < delay + thresh, 'should accurately track time');
            loop.complete();
        }, delay);
    });
    loop.start();
});

test('animitter().getElapsedTime() should stop counting forward when stopped', function(t){
    t.plan(1);
    var lastElapsed;
    var loop = animitter();
    loop.on('start', function(){
        var loop = this,
            delay = 1000;

        setTimeout(function(){
            t.equal(loop.getElapsedTime(), lastElapsed, 'elapsed time stopped counting forward after stopped');
        }, delay);
    });
    loop.once('update', function(deltaTime, elapsedTime){
        this.stop();
        lastElapsed = elapsedTime;
    });
    loop.start();
});


test('animitter().complete() should trigger complete', function(t){
    t.plan(1);

    animitter(completeAtFrame(null,30))
        .on('complete', function(delta, elapsed, frameCount){
            t.ok(this.isCompleted(), 'complete triggered');
        })
        .start();
});

test('animitter().reset() should reset a loop for reuse', function(t){
    t.plan(2);

    var lastFrame = 100;
    var timesCompleted = 0;
    var timesReset = 0;

    var loop = animitter(completeAtFrame(null,lastFrame));

    //on first complete, reset, on 2nd complete, done()
    loop.on('complete', function(delta, elapsed, frameCount){
        timesCompleted++;
        if(timesCompleted === 1){
            loop.reset();
        } else {
            t.equal(timesReset, 1, 'loop has been reset twice');
        }
    });

    //on first reset, start again
    loop.on('reset', function(delta, elapsed, frameCount){
        //expect frameCount to be 0, cause it hasnt started back up yet
        t.equal(frameCount, 0, 'frameCount should be reset');
        timesReset++;
        loop.start();
    });

    loop.start();
});

test('should trigger stop event and stop the loop', function(t){
    t.plan(3);
    var totalFrames = 10;

    var loop = animitter()
        .on('update', function(delta, elapsed, frameCount){
            if(frameCount === totalFrames){
                this.stop();
            }
        })
        .on('stop', function(delta, elapsed, frameCount){
            t.equal(frameCount, totalFrames, 'stopped at ' + totalFrames);
            t.notOk(this.isRunning(), 'is not animating');
            t.notOk(this.isCompleted(), 'is not completed');
        })
        .start();
});


test('animitter({ fps: fps }, fn)', function(t){
    //we aren't testing 60 because that is the
    //responsibility of requestAnimationFrame to throttle correctly
    var frameRateRuns = [45, 30, 15, 5];
    var totalFrames = 10;

    //an assertion every update, and one for complete for each run
    t.plan(frameRateRuns.length * totalFrames + frameRateRuns.length);

    function testAt(fps){
        var fpsMS = ~~(1000/fps);

        var loop = animitter({ fps: fps }, function(deltaTime, elapsedTime, frameCount){
            //first frame will be fast
            //deltaTime would be 0 on the first frame
            //fpsMS-9 is the desired time minus half of a 60fps frame (8.5ms)
            t.ok(okDelta(fps, deltaTime), 'paced at ' + fps + 'fps, deltaTime = ' + deltaTime);

            if(frameCount === totalFrames){
                this.complete();
            }
        });

        loop.on('complete', function(){
            t.equal(loop.isCompleted(), true, 'should be completed');
        })

        return loop;
    };

    //this test is sensitive to other tests, so we
    //will wait 5 seconds before beginning to start

    setTimeout(function(){
        invoke(frameRateRuns.map(testAt), 'start');
    }, 3000);


});


test('animitter().setFPS(fps)', function(t){
    var frameRates = [30, 10, 45, 20, 5];

    t.plan(frameRates.length);

    var fps = frameRates.shift();
    var loop = animitter({ fps: fps });


    loop.update();
    loop.on('update', function(delta){

        t.ok(okDelta(fps, delta), 'pace set at ' + fps + 'fps' +', deltaTime = ' + delta);

        if( frameRates.length ){
            fps = frameRates.shift();
            loop.setFPS(fps);
        } else {
            this.complete();
        }
    });

    loop.start();
});

test('animitter.bound()', function(t){
    t.plan(1);

    var loop = animitter.bound();
    loop.on('update', function(){
        t.ok(this instanceof animitter.Animitter);
    });

    setTimeout(loop.update, 10);

});

test('animitter({ fixedDelta: true })', function(t){
    t.plan(6);
    var loop = animitter({ fixedDelta: true});
    testFixedDelta(loop, t, function(){
        testNonFixedDelta(loop, t);
    });
});

test('animitter.globalFixedDelta : Boolean', function(t){
    animitter.globalFixedDelta = true;

    t.plan(12);
    testFixedDelta(animitter(), t, function(){
        testFixedDelta(animitter({ fps: 30 }), t, function(){

            animitter.globalFixedDelta = false;
            console.log('globalFixedDelta = false');
            testNonFixedDelta(animitter(), t);
            testNonFixedDelta(animitter({ fps: 30 }), t);

        });
    });

});


function testFixedDelta(loop, t, callback){

    callback = callback || function(){};


    loop.once('update', function(delta, elapsed, frameCount){
        console.log('frameCount: ' + frameCount);
        t.equal(delta, 1000/this.getFPS(), 'delta should be fixed');
        t.equal(elapsed, 1000/this.getFPS() * frameCount);
    });

    loop.update();


    setTimeout(function(){
        loop.once('update', function(delta, elapsed, frameCount){
            t.equal(delta, 1000/this.getFPS());
            t.equal(elapsed, 1000/this.getFPS() * frameCount);
        });

        loop.update();

        callback();

    }, 200);
}

function testNonFixedDelta(loop, t, callback){
    callback = callback || function(){};

    //toggle it at any time
    loop.fixedDelta = false;
    loop.update();
    setTimeout(function(){
        loop.once('update', function(delta, elapsed, frameCount){
            t.ok(delta > 1000/this.getFPS() * frameCount, '3rd frame delta should not be fixed');
            t.ok(elapsed > 1000/this.getFPS() * frameCount);

            callback();
        });

        loop.update();
    }, 300);
}


test('animitter.setRequestAnimationFrame(request, cancel, fps)', function(t){

    t.plan(10);

    function missingParams(){
        //no cancelAnimationFrame
        animitter.setAnimationFrame(function(){});
    }

    t.ok(missingParams, /invalid parameters/, 'should throw an error of invalid parameters');

    var request = function(fn){};
    var cancel = function(){};
    var fps = 90;

    var original = animitter.getAnimationFrame();

    animitter.setAnimationFrame(request, cancel, fps);

    var animationFrame = animitter.getAnimationFrame();

    t.equal(animationFrame.requestAnimationFrame, request);
    t.equal(animationFrame.cancelAnimationFrame, cancel);
    t.equal(animationFrame.fps, fps);

    console.log('request: ', original.requestAnimationFrame);
    console.log('cancel: ', original.cancelAnimationFrame);
    animitter.setAnimationFrame(original.requestAnimationFrame, original.cancelAnimationFrame, original.fps);


    animationFrame = animitter.getAnimationFrame();
    t.equal(animationFrame.requestAnimationFrame, original.requestAnimationFrame);
    t.equal(animationFrame.cancelAnimationFrame, original.cancelAnimationFrame);
    t.equal(animationFrame.fps, original.fps);


    //test that i can setAnimationFrame({ request, cancel, fps })
    animitter.setAnimationFrame({ requestAnimationFrame: request, cancelAnimationFrame: cancel, fps: fps });

    animationFrame = animitter.getAnimationFrame();

    t.equal(animationFrame.requestAnimationFrame, request);
    t.equal(animationFrame.cancelAnimationFrame, cancel);
    t.equal(animationFrame.fps, fps);
});

