if( typeof define === 'function' && define.amd ){
    define(['animitter', 'chai'], specTest);
} else if( typeof require === 'function' ){
    //node
    specTest( require('../animitter'), require('chai') );
}

function specTest( anim, chai ){
    var expect = chai.expect;

    //create a fn that completes that loop at frame 100
    var completeAt = function(done, frame){
        frame = frame || 50;
        return function(frameCount){
            if( frameCount === frame ){
                this.complete();
                expect(this.isAnimating()).to.be.false;
                expect(this.isCompleted()).to.be.true;
                if( done ) {
                    done();
                }
            }
        };
    };

    var createLoops = function( n ){
        var threads = [];
        var noop = function(){};
        for( var i=0; i<n; i++){
            threads.push(anim(noop));
        }
        return threads;
    };

    describe('running counter', function(){

        it('should have 0 animations running', function(){
            var threads = createLoops(100);
            expect(anim.running).to.equal(0);
        });

        it('should have 100 animations running', function(){
            var threads = createLoops(100);
            threads.forEach(function( thread ){
                thread.start();
            });
            expect(anim.running).to.equal(100);
            threads.forEach(function( thread ){
                thread.stop();
            });
            expect(anim.running).to.equal(0);
        });

        it('should have 0 animations running, from being stopped and completed', function(){
            var threads = createLoops(100);
            threads.forEach(function( thread ){
                thread.start();
            });
            threads.forEach(function( thread, i ){
                //complete() and stop() should both drop the running counter
                thread[ (i%2===0) ? 'stop' : 'complete' ]();
            });
            expect(anim.running).to.equal(0);
        });

        it('should not go negative when calling stop multiple times in a row', function(){
            var threads = createLoops(100);
            threads.forEach(function( thread ){
                thread.start();
            });

            threads.forEach(function( thread ){
                //call a many times, only count once
                thread.stop();
                thread.complete();
                thread.stop();
            });

            expect( anim.running ).to.equal( 0 );
        });


    });

    describe('Animitter', function(){
        this.timeout(10000);
        //load it
        describe('load', function(){
            it('should be loaded via require.js', function(){
                expect(anim).to.be.a('function');
                expect(anim.async).to.be.a('function');
                expect(anim.Animitter.prototype.emit).to.be.a('function');
            });
        });

        describe('animitter()', function(){
            it('should create a loop, but not start it', function(done){
                var loop = anim(completeAt(done, 60));
                expect(loop.isAnimating()).to.be.false;
                expect(loop.frameCount).to.equal(0);
                loop.start();
                expect(loop.isAnimating()).to.be.true;
            });
        });

        describe('animitter.start()', function(){
            it('should start a new loop', function(done){
                anim.start(function(frameCount){
                    if( frameCount === 100 ){
                        this.complete();
                        done();
                    }
                });
            });
        });

        describe('animitter().update()', function(){
            it('should run the loop one time', function( done ){
                var loop = anim(function(frameCount){
                    expect( loop.isAnimating() ).to.be.false;
                    expect( frameCount ).to.equal(1);
                    done();
                });
                loop.update();
            });
        });

        describe('animitter.async()', function(){
            it('should start an asynchronous loop', function(done){
                var frames = 0;
                anim
                .async(function(frameCount, deltaTime, next){
                    frames++;
                    expect(next).to.be.a('function');
                    expect(frameCount).to.equal(frames);
                    if( frameCount === 10 ){
                        this.complete();
                        done();
                        return;
                    }
                    var self = this;
                    setTimeout(function(){
                        //make sure it isnt secretly running
                        expect(self.frameCount).to.equal(frameCount);
                        next();
                    }, 100);
                })
                .start();
            });
        });

        describe('animitter({ fps: fps })', function(){
            it('should accept params without function', function(){
                var fps = 15;
                var loop = anim({ fps: fps });
                expect( loop.getFPS() ).to.equal( fps );
            });
        });

        describe('animitter({ fps: fps }, fn)', function(){
            var testAt = function(fps, tolerance){
                tolerance = tolerance || 100;
                return function(done){
                    this.timeout(210 * (1000/fps));
                    var lastTime = Date.now();
                    anim({ fps: fps }, completeAt(null, 10))
                        .on('update', function(frameCount, deltaTime){
                            var now = Date.now();
                            expect(now-lastTime).to.be.within((1000/fps)-tolerance, (1000/fps)+tolerance);
                            lastTime = now;
                        })
                        .on('complete', function(){
                            done();
                        })
                        .start();
                };
            };

            it('should pace its loop at 60', testAt(60));
            it('should pace its loop at 45', testAt(45));
            it('should pace its loop at 30', testAt(30));
            it('should pace its loop at 15', testAt(15));
            it('should pace its loop at 5', testAt(5));
        });

        describe('callback(frameCount, deltaTime)', function(){
            it('should provide frameCount as 1st parameter and deltaTime as 2nd', function(done){
                var frame = 0;
                anim.start(function(frameCount, deltaTime){
                    frame++;
                    expect(frameCount).to.equal(frame);
                    expect(deltaTime).to.be.a('number');
                    if( frameCount === 100 ){
                        done();
                    }
                });
            });
        });

        describe('#getFrameCount()', function(){
            it('should match provided callbacks frameCount', function(done){
                anim.start(function(frameCount){
                    expect(this.getFrameCount()).to.equal(frameCount);
                    if( frameCount === 100 ){
                        this.complete();
                        done();
                    }
                });
            });

            it('should be 0 when a loop is reset', function(done){
                anim.start(function(){
                    var loop = this;
                    if( this.getFrameCount() === 100 ){
                        this.reset();
                        setTimeout(function(){
                            expect(loop.getFrameCount()).to.equal(0);
                            done();
                        }, 500);
                    }
                });
            });

        });

        describe('#getElapsedTime()', function(){
            it('should be 0 if it never started', function(done){
                var loop = anim();
                setTimeout(function(){
                    expect(loop.getElapsedTime()).to.equal(0);
                    done();
                }, 500);
            });

            it('should be 0 if it was reset', function(done){
                var loop = anim()
                    .on('update', function(frameCount){
                        if( frameCount === 10 ){
                            this.reset();
                            setTimeout(function(){
                                expect(loop.getElapsedTime()).to.equal(0);
                                done();
                            }, 500);
                        }
                    })
                    .start();
            });

            it('should track the total time the loop played for', function(done){
                anim()
                    .on('start', function(){
                        var loop = this,
                            delay = 1000,
                            thresh = 32; //milliseconds
                        setTimeout(function(){
                            expect(loop.getElapsedTime()).to.be.within(delay-thresh,delay+thresh);
                            done();
                        }, delay);
                    })
                    .start();
            });
            it('should stop counting forward when stopped', function(done){
                var lastElapsed;
                anim()
                    .on('start', function(){
                        var loop = this,
                            delay = 1000;

                        setTimeout(function(){
                            expect(loop.getElapsedTime()).to.equal(lastElapsed);
                            done();
                        }, delay);
                    })
                    .once('update', function(){
                        lastElapsed = this.getElapsedTime();
                        this.stop();
                    })
                    .start();
            });
        });

        describe('update event emitted', function(){
            var numExpectedUpdates = 4;
            it('should be deferred, calling update 100 times, starting at frame 1', function(){
                var loop = anim(completeAt());
                var updated = 0;
                loop.on('update', function(frameCount){
                    updated++;
                    if( updated === 100 ){
                        expect(frameCount).to.equal(100);
                        this.complete();
                        done();
                    }
                });
            });
            it('should be started immediately calling update 4 times, starting at frame 2', function(done){
                this.timeout(1000);
                var updated = 0;
                anim
                    .start()
                    .on('update', function(){
                        updated++;
                        if( updated === 1 ){
                            expect(this.frameCount).to.equal(2);
                        }
                        if( updated === numExpectedUpdates ){
                            expect(updated).to.equal(numExpectedUpdates);
                            expect(this.frameCount).to.equal(numExpectedUpdates+1);
                            this.complete();
                            expect(this.isAnimating()).to.be.false;
                            done();
                        }
                    });
            });

        });

        describe('#complete()', function(){
            it('should trigger complete', function( done ){
                var loop = anim
                    .start(completeAt(null,30))
                    .on('complete', function(frameCount){
                        expect(frameCount).to.be.a('number');
                        expect(this.isCompleted()).to.be.true;
                        done();
                    });
            });
        });

        describe('#reset()', function(){
            it('should reset a loop for reuse', function( done ){
                var loop = anim();
                var i = 0;
                var lastFrame = 100;
                var timesCompleted = 0;
                var timesReset = 0;
                loop.on('update', function( frameCount ){
                    //make sure frames are all reaching update
                    i++;
                    expect( frameCount ).to.equal( i );
                    //call complete on lastFrame
                    if( i === lastFrame ){
                        this.complete();
                    }
                });

                // on first complete, reset, on 2nd complete, done()
                loop.on('complete', function( frameCount ){
                    expect( frameCount ).to.equal( lastFrame );
                    timesCompleted++;
                    if( timesCompleted === 1 ){
                        loop.reset();
                    } else {
                        expect( timesReset ).to.equal( 1 );
                        done();
                    }
                });

                //on first reset, start again
                loop.on('reset', function( frameCount ){
                    //expect frameCount to be 0, cause it hasnt started back up yet
                    expect( frameCount ).to.equal( 0 );
                    timesReset++;
                    i = 0;
                    loop.start();
                });

                loop.start();
            });
        });

        describe('#stop()', function(){
            it('should trigger stop event and stop the loop', function(done){
                var stopAtFrame = 10;
                var loop = anim
                    .start(function(frameCount){
                        if(frameCount === stopAtFrame ){
                            this.stop();
                        }
                    })
                    .on('stop', function(frameCount){
                        expect(frameCount).to.equal(stopAtFrame);
                        expect(loop.isAnimating()).to.be.false;
                        expect(loop.isCompleted()).to.be.false;
                        done();
                    });
            });
        });

    });

}
