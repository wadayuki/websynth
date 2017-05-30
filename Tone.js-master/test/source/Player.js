define(["helper/Basic", "Tone/source/Player", "helper/Offline", 
	"helper/SourceTests", "Tone/core/Buffer", "helper/Meter", "Test", "Tone/core/Tone"], 
	function (BasicTests, Player, Offline, SourceTests, Buffer, Meter, Test, Tone) {

	if (window.__karma__){
		Buffer.baseUrl = "/base/test/";
	}

	describe("Player", function(){

		var buffer = new Buffer();

		beforeEach(function(done){
			buffer.load("./audio/sine.wav", function(){
				done();
			});
		});

		//run the common tests
		BasicTests(Player, buffer);
		SourceTests(Player, buffer);

		context("Constructor", function(){

			it ("can be constructed with a Tone.Buffer", function(done){
				var player = new Player(buffer);
				expect(player.buffer.get()).to.equal(buffer.get());
				player.dispose();
				done();
			});

			it ("can be constructed with an AudioBuffer", function(done){
				var player = new Player(buffer.get());
				expect(player.buffer.get()).to.equal(buffer.get());
				player.dispose();
				done();
			});
		});

		context("Loading", function(){

			it("loads a url which was passed in", function(done){
				var player = new Player("./audio/sine.wav", function(){
					player.dispose();
					done();
				});
			});

			it("loads a url using the load method", function(done){
				var player = new Player();
				player.load("./audio/sine.wav", function(){
					expect(player._buffer).to.be.instanceof(Buffer);
					done();
				});
			});

			it("returns a promise", function(done){
				var player = new Player();
				var promise = player.load("./audio/sine.wav");
				expect(promise).to.be.instanceof(Promise);
				promise.then(function(){
					done();
				});
			});

			it("can be created with an options object", function(){
				var player = new Player({
					"url" : "./audio/sine.wav",
					"loop" : true
				});
				player.dispose();
			});

			it("can autostart after loading", function(done){
				var player = new Player({
					"url" : "./audio/sine.wav",
					"autostart" : true,
					"onload" : function(){
						setTimeout(function(){
							expect(player.state).to.be.equal("started");
							done();
						}, 10);
					}
				});
			});

		});

		context("Reverse", function(){

			it("can be played in reverse", function(){
				var audioBuffer = buffer.get().getChannelData(0);
				var lastSample = audioBuffer[audioBuffer.length - 1];
				return Offline(function(){
					var player = new Player(buffer.get()).toMaster();
					player.reverse = true;
					player.start(0);
				}).then(function(buffer){
					var firstSample = buffer.toArray()[0];
					expect(firstSample).to.equal(lastSample);
				});
			});

		});

		context("Looping", function(){

			beforeEach(function(done){
				buffer.load("./audio/short_sine.wav", function(){
					done();
				});
			});

			it("can be set to loop", function(){
				var player = new Player();
				player.loop = true;
				expect(player.loop).to.be.true;
				player.dispose();
			});

			it("can set the loop points", function(){
				var player = new Player();
				player.loopStart = 0.4;
				expect(player.loopStart).to.equal(0.4);
				player.loopEnd = 0.5;
				expect(player.loopEnd).to.equal(0.5);
				player.setLoopPoints(0, 0.2);
				expect(player.loopStart).to.equal(0);
				expect(player.loopEnd).to.equal(0.2);
				player.dispose();
			});

			it("loops the audio", function(){
				return Meter(function(){
					var player = new Player(buffer);
					player.loop = true;
					player.toMaster();
					player.start(0);
				}).then(function(rms){
					rms.forEach(function(level){
						expect(level).to.be.above(0);
					});
				});
			});

		});

		context("Get/Set", function(){

			it("can be set with an options object", function(){
				var player = new Player();
				expect(player.loop).to.be.false;
				player.set({
					"loop" : true,
					"loopStart" : 0.4
				});
				expect(player.loop).to.be.true;
				expect(player.loopStart).to.equal(0.4);
				player.dispose();
			});

			it("can get an options object", function(){
				var player = new Player({
					"url" : "./audio/sine.wav",
					"loopStart" : 0.2,
					"loopEnd" : 0.3,
					"loop" : true,
					"reverse" : true
				});
				expect(player.get().loopStart).to.equal(0.2);
				expect(player.get().loopEnd).to.equal(0.3);
				expect(player.get().loop).to.be.true;
				expect(player.get().reverse).to.be.true;
				player.dispose();
			});

			it("can get/set the playbackRate", function(){
				var player = new Player();
				player.playbackRate = 0.5;
				expect(player.playbackRate).to.equal(0.5);
				player.dispose();
			});

		});

		context("Start Scheduling", function(){

			it("can be start with an offset", function(){
				var testSample = buffer.toArray()[Math.floor(0.1 * buffer.context.sampleRate)];
				return Offline(function(){
					var player = new Player(buffer.get());
					player.toMaster();
					player.start(0, 0.1);
				}).then(function(buffer){
					expect(buffer.toArray()[0]).to.equal(testSample);
				});
			});

			it("is stopped and restarted if retrigger=false", function(){
				return Offline(function(){
					//make a ramp between 0-1
					var ramp = new Float32Array(Math.floor(Tone.context.sampleRate * 0.3));
					for (var i = 0; i < ramp.length; i++){
						ramp[i] = (i / (ramp.length-1));
					}
					var buff = new Buffer().fromArray(ramp);
					var player = new Player(buff).toMaster();
					player.retrigger = false;
					player.start(0);
					player.start(0.1);
				}, 0.31).then(function(buffer){
					expect(buffer.max()).to.be.lessThan(1);
				});
			});

			it("can be retriggered", function(){
				return Offline(function(){
					//make a ramp between 0-1
					var ramp = new Float32Array(Math.floor(Tone.context.sampleRate * 0.3));
					for (var i = 0; i < ramp.length; i++){
						ramp[i] = (i / (ramp.length-1));
					}
					var buff = new Buffer().fromArray(ramp);
					var player = new Player(buff).toMaster();
					player.retrigger = true;
					player.start(0);
					player.start(0.1);
				}, 0.31).then(function(buffer){
					expect(buffer.max()).to.be.greaterThan(1);
				});
			});

			it("can seek to a position at the given time", function(){
				return Offline(function(){
					var ramp = new Float32Array(Math.floor(Tone.context.sampleRate * 0.3));
					for (var i = 0; i < ramp.length; i++){
						ramp[i] = (i / (ramp.length)) * 0.3;
					}
					var buff = new Buffer().fromArray(ramp);
					var player = new Player(buff).toMaster();
					player.start(0);
					player.seek(0.2, 0.1);
				}, 0.3).then(function(buffer){
					buffer.forEach(function(sample, time){
						if (time < 0.09){
							expect(sample).to.be.within(0, 0.1);
						} else if (time > 0.1 && time < 0.19){
							expect(sample).to.be.within(0.2, 0.3);
						}
					});
				});
			});

			it ("correctly compensates if the offset is greater than the loopEnd", function(){
				return Offline(function(){
					//make a ramp between 0-1
					var ramp = new Float32Array(Math.floor(Tone.context.sampleRate * 0.3));
					for (var i = 0; i < ramp.length; i++){
						ramp[i] = (i / (ramp.length)) * 0.3;
					}
					var buff = new Buffer().fromArray(ramp);
					var player = new Player(buff).toMaster();
					player.loopStart = 0.1;
					player.loopEnd = 0.2;
					player.loop = true;
					player.start(0, 0.35);
				}, 0.3).then(function(buffer){
					buffer.forEach(function(sample, time){
						if (time < 0.04){
							expect(sample).to.be.within(0.15, 0.2);
						} else if (time > 0.05 && time < 0.09){
							expect(sample).to.be.within(0.1, 0.15);
						}
					});
				});
			});

			it("can be play for a specific duration", function(){
				return Offline(function(){
					var player = new Player(buffer);
					player.toMaster();
					player.start(0).stop(0.1);
					return function(time){
						Test.whenBetween(time, 0.1, Infinity, function(){
							expect(player.state).to.equal("stopped");
						});
						Test.whenBetween(time, 0, 0.1, function(){
							expect(player.state).to.equal("started");
						});
					};
				}, 0.3).then(function(buffer){
					buffer.forEach(function(sample){
						expect(sample).to.equal(0);
					}, 0.11, 0.15);
				});
			});

			it("can be play for a specific duration passed in the 'start' method", function(){
				return Offline(function(){
					var player = new Player(buffer);
					player.toMaster();
					player.start(0, 0, 0.1);
					return function(time){
						Test.whenBetween(time, 0.1, Infinity, function(){
							expect(player.state).to.equal("stopped");
						});
						Test.whenBetween(time, 0, 0.1, function(){
							expect(player.state).to.equal("started");
						});
					};
				}, 0.3).then(function(buffer){
					expect(buffer.getLastSoundTime()).to.be.closeTo(0.1, 0.02);
				});
			});

			it("reports itself as stopped after a single iterations of the buffer", function(){
				return Offline(function(){
					var player = new Player(buffer).toMaster();
					player.start();

					return function(time){
						Test.whenBetween(time, buffer.duration, Infinity, function(){
							expect(player.state).to.equal("stopped");
						});
						Test.whenBetween(time, 0, buffer.duration, function(){
							expect(player.state).to.equal("started");
						});
					};
				});
			});
		});
	});
});