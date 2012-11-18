/*global describe,it*/
var requirejs = require('requirejs'),
	_ = require('underscore'),
	assert = require('assert');


requirejs.config({
	baseUrl: process.cwd() +'/'
});

describe('load module', function(){
	it('should load animitter', function( done ){
		requirejs(['animitter'], function (anim){
			done();
			function makeHandlers ( expectedUpdates, done ){
				var frame = 0, completed = false, updated = 0, stopped = false;
				return {
					loop: function loop (){
						if(this.frameCount === 5 ) this.complete();
					},

					onUpdate: function ( ){
						updated++;
						frame = this.frameCount;
						if( completed && updated === expectedUpdates ) done();
					},

					onStop: function (){
						stopped = true;
					},

					onComplete: function (){
						if( this.frameCount === 5  && frame === 4 && stopped && this.completed && !this.animating ) completed = true;
					}
				};
			}
			

			describe('Animation module', function (){
				it('should give me animation module', function (done){
					if(anim.Animator.prototype.emit !== undefined){
						done();
					} else {
						done(Error("Animation did not have emit"));
					}
				});

				it('create is called 5 times, update called 4 times (starting at frame 2), stop and complete once,', function (done){
					this.timeout(10000);
					var lis = makeHandlers( 4, done );
					anim
						.create(lis.loop)
						.on('update',lis.onUpdate )
						.on('stop', lis.onStop)
						.once('complete', lis.onComplete);
				});


				it('creates a deferred animation, update called 5 times (starting at frame 1), stop and complete once', function (done){
					this.timeout(10000);
					var lis = makeHandlers( 5, done );
					anim
						.defer( lis.loop )
						.on('update', lis.onUpdate)
						.on('stop', lis.onStop)
						.once('complete', lis.onComplete)
						.start();
				});


				describe('running counter', function(){
					var threads = [];
					_(100).times(function(){
						threads.push(anim.defer(function(){
							//empty loop
						}));
					});
					it('should have 0 animations running', function(){
						assert.equal(anim.running, 0);
					});

					it('should have 100 animations running', function(){
						_(threads).each(function( thread ){
							thread.start();
						});
						assert.equal(anim.running, 100);
					});

					it('should have 0 animations running', function(){
						_(threads).each(function( thread, i ){
							//complete() and stop() should both drop the running counter
							if( i % 2 === 0){
								thread.stop();
							} else {
								thread.complete();
							}
						});
						assert.equal(anim.running, 0);
					});

				});

			});
		});
	});
});