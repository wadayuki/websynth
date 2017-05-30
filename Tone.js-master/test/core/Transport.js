define(["Test", "Tone/core/Transport", "Tone/core/Tone", "helper/Offline", 
	"Tone/type/TransportTime", "Tone/signal/Signal", "helper/BufferTest"], 
function (Test, Transport, Tone, Offline, TransportTime, Signal, BufferTest) {

	describe("Transport", function(){

		function resetTransport(done){
			Tone.Transport.cancel(0);
			Tone.Transport.off("start stop pause loop loopStart loopEnd");
			Tone.Transport.stop();
			// set the defaults
			Tone.Transport.set(Tone.Transport.constructor.defaults);
			setTimeout(done, 300);
		}

		it("exists", function(){
			expect(Tone.Transport).to.exist;
		});

		context("BPM and timeSignature", function(){

			it("can get and set bpm", function(){
				return Offline(function(Transport){
					Transport.bpm.value = 125;
					expect(Transport.bpm.value).to.be.closeTo(125, 0.001);
					Transport.bpm.value = 120;
					expect(Transport.bpm._param.value).to.equal(2 * Transport.PPQ);
				});
			});

			it("can get and set timeSignature as both an array or number", function(){
				return Offline(function(Transport){
					Transport.timeSignature = [6, 8];
					expect(Transport.timeSignature).to.equal(3);
					Transport.timeSignature = 5;
					expect(Transport.timeSignature).to.equal(5);
				});
			});

			it("can get and set timeSignature as both an array or number", function(){
				return Offline(function(Transport){
					Transport.timeSignature = [6, 8];
					expect(Transport.timeSignature).to.equal(3);
					Transport.timeSignature = 5;
					expect(Transport.timeSignature).to.equal(5);
				});
			});

		});

		context("looping", function(){

			it("can get and set loop points", function(){
				return Offline(function(Transport){
					Transport.loopStart = 0.2;
					Transport.loopEnd = 0.4;
					expect(Transport.loopStart).to.be.closeTo(0.2, 0.01);
					expect(Transport.loopEnd).to.be.closeTo(0.4, 0.01);
					Transport.setLoopPoints(0, "1m");
					expect(Transport.loopStart).to.be.closeTo(0, 0.01);
					expect(Transport.loopEnd).to.be.closeTo(Transport.toSeconds("1m"), 0.01);
				});
			});

			it ("can loop events scheduled on the transport", function(){
				var invocations = 0;
				return Offline(function(Transport){
					Transport.schedule(function(){
						invocations++;
					}, 0);
					Transport.setLoopPoints(0, 0.1).start(0);
					Transport.loop = true;
				}, 0.4).then(function(){
					expect(invocations).to.equal(5);
				});
			});

		});

		context("nextSubdivision", function(){

			it("returns 0 if the transports not started", function(){
				return Offline(function(Transport){
					expect(Transport.nextSubdivision()).to.equal(0);
				});
			});

			it("can get the next subdivision of the transport", function(){
				return Offline(function(Transport){
					Transport.start(0);
					return function(time){
						Test.whenBetween(time, 0.05, 0.07, function(){
							expect(Transport.nextSubdivision(0.5)).to.be.closeTo(0.5, 0.01);
							expect(Transport.nextSubdivision(0.04)).to.be.closeTo(0.08, 0.01);
							expect(Transport.nextSubdivision(2)).to.be.closeTo(2, 0.01);
						});
						Test.whenBetween(time, 0.09, 0.1, function(){
							expect(Transport.nextSubdivision(0.04)).to.be.closeTo(0.12, 0.01);
							expect(Transport.nextSubdivision("8n")).to.be.closeTo(0.25, 0.01);
						});
					};
				}, 0.1);
			});

		});

		context("PPQ", function(){

			it("can get and set pulses per quarter", function(){
				return Offline(function(Transport){
					Transport.PPQ = 96;
					expect(Transport.PPQ).to.equal(96);
				});
			});

			it("schedules a quarter note at the same time with a different PPQ", function(){
				return Offline(function(Transport){
					Transport.PPQ = 1;
					var id = Transport.schedule(function(time){
						expect(time).to.be.closeTo(Transport.toSeconds("4n"), 0.1);
						Transport.cancel(id);
					}, "4n");
					Transport.start();
				});
			});

			it ("invokes the right number of ticks with a different PPQ", function(){
				return Offline(function(Transport){
					Transport.bpm.value = 120;
					var ppq = 20;
					Transport.PPQ = ppq;
					Transport.start();

					return function(time){
						if (time > 0.5){
							expect(Transport.ticks).to.be.within(ppq, ppq * 1.2);
						}
					};
				}, 0.55);
			});

		});

		context("position", function(){

			it("can jump to a specific tick number", function(){
				return Offline(function(Transport){
					Transport.ticks = 200;
					expect(Transport.ticks).to.equal(200);
					Transport.start(0);
					var tested = false;
					return function(){
						if (!tested){
							expect(Transport.ticks).to.at.least(200);
							tested = true;
						}
					};
				}, 0.1);
			});

			it("can get the current position in BarsBeatsSixteenths", function(){
				return Offline(function(Transport){
					expect(Transport.position).to.equal("0:0:0");
					Transport.start(0);
					var tested = false;
					return function(){
						if (!tested){
							tested = true;
							expect(Transport.position).to.not.equal("0:0:0");
						}
					};
				}, 0.1);
			});

			it("can get the current position in seconds", function(){
				return Offline(function(Transport){
					expect(Transport.seconds).to.equal(0);
					Transport.start(0.05);
					return function(time){
						if (time > 0.05){
							expect(Transport.seconds).to.be.closeTo(time - 0.05, 0.01);
						}
					};
				}, 0.1);
			});

			it("can set the current position in seconds", function(){
				return Offline(function(Transport){
					expect(Transport.seconds).to.equal(0);
					Transport.seconds = 3;
					expect(Transport.seconds).to.be.closeTo(3, 0.01);
				});
			});

			it("can set the current position in BarsBeatsSixteenths", function(){
				return Offline(function(Transport){
					expect(Transport.position).to.equal("0:0:0");
					Transport.position = "3:0";
					expect(Transport.position).to.equal("3:0:0");
					Transport.position = "0:0";
					expect(Transport.position).to.equal("0:0:0");
				});
			});

			it ("can get the progress of the loop", function(){
				return Offline(function(Transport){
					Transport.setLoopPoints(0, "1m").start();
					Transport.loop = true;
					expect(Transport.progress).to.be.equal(0);
					Transport.position = "2n";
					expect(Transport.progress).to.be.closeTo(0.5, 0.001);
					Transport.position = "2n + 4n";
					expect(Transport.progress).to.be.closeTo(0.75, 0.001);
				});
			});

		});
		

		context("state", function(){

			it("can start, pause, and restart", function(){
				return Offline(function(Transport){
					Transport.start(0).pause(0.2).start(0.4);

					var pulse = new Signal(0).toMaster();

					Transport.schedule(function(time){
						pulse.setValueAtTime(1, time);
						pulse.setValueAtTime(0, time + 0.1);
					}, 0);

					Transport.schedule(function(time){
						pulse.setValueAtTime(1, time);
						pulse.setValueAtTime(0, time + 0.1);
					}, 0.3);

					return function(time){
						Test.whenBetween(time, 0, 0.2, function(){
							expect(Transport.state).to.equal("started");
						});

						Test.whenBetween(time, 0.2, 0.4, function(){
							expect(Transport.state).to.equal("paused");
						});

						Test.whenBetween(time, 0.4, Infinity, function(){
							expect(Transport.state).to.equal("started");
						});
					};
				}, 0.6).then(function(buffer){

					buffer.forEach(function(sample, time){
						Test.whenBetween(time, 0, 0.01, function(){
							expect(sample).to.equal(1);
						});
						Test.whenBetween(time, 0.1, 0.11, function(){
							expect(sample).to.equal(0);
						});
						Test.whenBetween(time, 0.5, 0.51, function(){
							expect(sample).to.equal(1);
						});
					});
				});
			});

		});


		context("ticks", function(){

			it("resets ticks on stop but not on pause", function(){
				return Offline(function(Transport){
					Transport.start(0).pause(0.1).stop(0.2);
					
					var pausedTicks = 0;

					return function(time){
						Test.whenBetween(time, 0, 0.1, function(){
							pausedTicks = Transport.ticks;
						});
						Test.whenBetween(time, 0.1, 0.19, function(){
							expect(Transport.ticks).to.equal(pausedTicks);
						});
						Test.whenBetween(time, 0.2, Infinity, function(){
							expect(Transport.ticks).to.equal(0);
						});
					};
				}, 0.3);
			});

			it("tracks ticks after start", function(){

				return Offline(function(Transport){
					Transport.bpm.value = 120;
					var ppq = Transport.PPQ;
					Transport.start();

					return function(time){
						if (time > 0.5){
							expect(Transport.ticks).to.at.least(ppq);
						}
					};
				}, 0.6);
			});

			it("can start with a tick offset", function(){
				return Offline(function(Transport){
					Transport.start(0, "200i");

					return function(time){
						if (time < 0.01){
							expect(Transport.ticks).to.at.least(200);
						}
					};
				}, 0.1);
			});

			it("tracks ticks correctly with a different PPQ and BPM", function(){

				return Offline(function(Transport){
					Transport.PPQ = 96;
					Transport.bpm.value = 90;
					Transport.start();

					return function(time){
						if (time > 0.5){
							expect(Tone.Transport.ticks).to.at.least(72);
						}
					};
				}, 0.6);
			});

		});	

		context("schedule", function(){	
			
			it ("can schedule an event on the timeline", function(){
				return Offline(function(Transport){
					var eventID = Transport.schedule(function(){}, 0);
					expect(eventID).to.be.a.number;
				});
			});


			it ("scheduled event gets invoked with the time of the event", function(){
				return Offline(function(Transport){
					var startTime = 0.1;
					Transport.schedule(function(time){
						expect(time).to.equal(startTime);
					}, 0);
					Transport.start(startTime);
				}, 0.2);
			});

			it ("can schedule events with TransportTime", function(){
				return Offline(function(Transport){
					var startTime = 0.1;
					var eighth = Transport.toSeconds("8n");
					Transport.schedule(function(time){
						expect(time).to.be.closeTo(startTime + eighth, 0.01);
					}, TransportTime("8n"));
					Transport.start(startTime);
				}, 0.5);
			});

			it ("can cancel a scheduled event", function(){
				return Offline(function(Transport){
					var eventID = Transport.schedule(function(){
						throw new Error("should not call this function");
					}, 0);
					Transport.cancel(eventID);
					Transport.start();
				});
			});

			it ("can cancel the timeline of scheduled object", function(){
				return Offline(function(Transport){
					Transport.schedule(Tone.noOp, 0);
					Transport.schedule(Tone.noOp, 1);
					Transport.schedule(Tone.noOp, 2);
					expect(Transport._timeline.length).to.equal(3);
					Transport.cancel(2);
					expect(Transport._timeline.length).to.equal(2);
					Transport.cancel(0);
					expect(Transport._timeline.length).to.equal(0);
				});
			});

			it ("can cancel the timeline of schedulOnce object", function(){
				return Offline(function(Transport){
					Transport.scheduleOnce(Tone.noOp, 0);
					Transport.scheduleOnce(Tone.noOp, 1);
					Transport.scheduleOnce(Tone.noOp, 2);
					expect(Transport._onceEvents.length).to.equal(3);
					Transport.cancel(2);
					expect(Transport._onceEvents.length).to.equal(2);
					Transport.cancel(0);
					expect(Transport._onceEvents.length).to.equal(0);
				});
			});

			it ("scheduled event anywhere along the timeline", function(){
				return Offline(function(Transport){
					var startTime = Transport.now();
					Transport.schedule(function(time){
						expect(time).to.be.closeTo(startTime + 0.5, 0.001);
					}, 0.5);
					Transport.start(startTime);
				}, 0.6);
			});

			it ("can schedule multiple events and invoke them in the right order", function(){
				return Offline(function(Transport){
					var first = false;
					Transport.schedule(function(){
						first = true;
					}, 0.1);
					Transport.schedule(function(){
						expect(first).to.be.true;
					}, 0.11);
					Tone.Transport.start();
				}, 0.2);
			});

			it ("invokes the event again if the timeline is restarted", function(){
				var iterations = 0;
				return Offline(function(Transport){
					Transport.schedule(function(){
						iterations++;
					}, 0.05);
					Transport.start(0).stop(0.1).start(0.2);
				}, 0.3).then(function(){
					expect(iterations).to.be.equal(2);
				});
			});

		});

		context("scheduleRepeat", function(){	

			it ("can schedule a repeated event", function(){
				return Offline(function(Transport){
					var eventID = Transport.scheduleRepeat(function(){}, 1, 0);
					expect(eventID).to.be.a.number;
				});
			});

			it ("scheduled event gets invoked with the time of the event", function(){
				var invoked = false;
				return Offline(function(Transport){
					var startTime = 0.1;
					var eventID = Transport.scheduleRepeat(function(time){
						Transport.clear(eventID);
						expect(time).to.equal(startTime);
						invoked = true;
					}, 1, 0);
					Transport.start(startTime);
				}, 0.3).then(function(){
					expect(invoked).to.be.true;
				});
			});

			it ("can schedule events with TransportTime", function(){
				var invoked = false;
				return Offline(function(Transport){
					var startTime = 0.1;
					var eighth = Transport.toSeconds("8n");
					Transport.scheduleRepeat(function(time){
						expect(time).to.be.closeTo(startTime + eighth, 0.01);
						invoked = true;
					}, "1n", TransportTime("8n"));
					Transport.start(startTime);
				}, 0.4).then(function(){
					expect(invoked).to.be.true;
				});
			});

			it ("can clear a scheduled event", function(){
				return Offline(function(Transport){
					var eventID = Transport.scheduleRepeat(function(){
						throw new Error("should not call this function");
					}, 1, 0);
					Transport.clear(eventID);
					Transport.stop();
				});
			});

			it ("can be scheduled in the future", function(){
				var invoked = false;
				return Offline(function(Transport){
					var startTime = 0.1;
					var eventID = Transport.scheduleRepeat(function(time){
						Transport.clear(eventID);
						expect(time).to.be.closeTo(startTime + 0.2, 0.01);
						invoked = true;
					}, 1, 0.2);
					Transport.start(startTime);
				}, 0.5).then(function(){
					expect(invoked).to.be.true;
				});
			});

			it ("repeats a repeat event", function(){
				var invocations = 0;
				return Offline(function(Transport){
					Transport.scheduleRepeat(function(){
						invocations++;
					}, 0.1, 0);
					Transport.start();
				}, 0.5).then(function(){
					expect(invocations).to.equal(6);
				});
			});

			it ("repeats at the repeat interval", function(){
				return Offline(function(Transport){
					var repeatTime = -1;
					Transport.scheduleRepeat(function(time){
						if (repeatTime !== -1){
							expect(time - repeatTime).to.be.closeTo(0.1, 0.01);
						}
						repeatTime = time;
					}, 0.1, 0);
					Transport.start();
				}, 0.5);
			});

			it ("can schedule multiple events and invoke them in the right order", function(){
				var first = false;
				var second = false;
				return Offline(function(Transport){
					var firstID = Transport.scheduleRepeat(function(){
						first = true;
						Transport.clear(firstID);
					}, 1, 0.1);
					var secondID = Transport.scheduleRepeat(function(){
						Transport.clear(secondID);
						expect(first).to.be.true;
						second = true;
					}, 1, 0.11);
					Transport.start();
				}, 0.3).then(function(){
					expect(first);
					expect(second);
				});
			});

			it ("cannot schedule an event with an interval of 0", function(){
				return Offline(function(Transport){
					expect(function(){
						Transport.scheduleRepeat(function(){}, 0, 10);
					}).to.throw(Error);
				});
			});

			it ("repeats for the given interval", function(){
				var repeatCount = 0;
				return Offline(function(Transport){
					Transport.scheduleRepeat(function(){
						repeatCount++;
					}, 0.1, 0, 0.5);
					Transport.start();
				}, 0.6).then(function(){
					expect(repeatCount).to.equal(6);
				});
			});

		});

		context("scheduleOnce", function(){	

			it ("can schedule a single event on the timeline", function(){
				return Offline(function(Transport){
					var eventID = Transport.scheduleOnce(function(){}, 0);
					expect(eventID).to.be.a.number;
				});
			});


			it ("scheduled event gets invoked with the time of the event", function(){
				var invoked = false;
				return Offline(function(Transport){
					var startTime = 0.1;
					var eventID = Transport.scheduleOnce(function(time){
						invoked = true;
						Transport.clear(eventID);
						expect(time).to.equal(startTime);
					}, 0);
					Tone.Transport.start(startTime);
				}, 0.2).then(function(){
					expect(invoked).to.be.true;
				});
			});

			it ("can schedule events with TransportTime", function(){
				var invoked = false;
				return Offline(function(Transport){
					var startTime = 0.1;
					var eighth = Transport.toSeconds("8n");
					Transport.scheduleOnce(function(time){
						expect(time).to.be.closeTo(startTime + eighth, 0.01);
						invoked = true;
					}, TransportTime("8n"));
					Transport.start(startTime);
				}, 0.5).then(function(){
					expect(invoked).to.be.true;
				});
			});


			it ("can cancel a scheduled event", function(){
				return Offline(function(Transport){
					var eventID = Transport.scheduleOnce(function(){
						throw new Error("should not call this function");
					}, 0);
					Transport.clear(eventID);
					Transport.start();
				});
			});

			it ("can be scheduled in the future", function(){
				var invoked = false;
				return Offline(function(Transport){
					var startTime = Tone.Transport.now() + 0.1;
					var eventID = Transport.scheduleOnce(function(time){
						Transport.clear(eventID);
						expect(time).to.be.closeTo(startTime + 0.3, 0.01);
						invoked = true;
					}, 0.3);
					Transport.start(startTime);
				}, 0.5).then(function(){
					expect(invoked).to.be.true;
				});
			});

			it ("the event is removed after is is invoked", function(){
				var iterations = 0;
				return Offline(function(Transport){
					Transport.scheduleOnce(function(){
						iterations++;
					}, 0);
					Transport.start().stop("+0.1").start("+0.2");
				}, 0.5).then(function(){
					expect(iterations).to.be.lessThan(2);
				});
			});

		});

		context("events", function(){

			it("invokes start/stop/pause events", function(){
				var invokations = 0;
				return Offline(function(Transport){
					Tone.Transport.on("start pause stop", function(){
						invokations++;
					});
					Transport.start().stop(0.1).start(0.2);
				}, 0.5).then(function(){
					expect(invokations).to.equal(3);
				});
			});

			it("invokes start event with correct offset", function(){
				return Offline(function(Transport){
					Transport.on("start", function(time, offset){
						expect(time).to.be.closeTo(0.2, 0.01);
						expect(offset).to.be.closeTo(0.5, 0.001);
					});
					Transport.start(0.2, "4n");
				}, 0.3);
			});

			it("invokes the event just before the scheduled time", function(){
				var invoked = false;
				return Offline(function(Transport){
					Transport.on("start", function(time, offset){
						expect(time - Transport.now()).to.be.within(0, 0.05);
						expect(offset).to.equal(0);
						invoked = true;
					});
					Transport.start(0.2);
				}, 0.3).then(function(){
					expect(invoked).to.be.true;
				});
			});

			it("passes in the time argument to the events", function(){
				var invokations = 0;
				return Offline(function(Transport){
					var now = Transport.now();
					Transport.on("start", function(time){
						invokations++;
						expect(time).to.be.closeTo(now + 0.1, 0.01);
					});
					Transport.on("stop", function(time){
						invokations++;
						expect(time).to.be.closeTo(now + 0.2, 0.01);
					});
					Transport.start("+0.1").stop("+0.2");
				}, 0.3).then(function(){
					expect(invokations).to.equal(2);
				});
			});

			it("invokes the 'loop' method on loop", function(){
				var loops = 0;
				return Offline(function(Transport){
					var sixteenth = Transport.toSeconds("16n");
					Transport.setLoopPoints(0, sixteenth);
					Transport.loop = true;
					var lastLoop = -1;
					Transport.on("loop", function(time){
						loops++;
						if (lastLoop !== -1){
							expect(time - lastLoop).to.be.closeTo(sixteenth, 0.001);
						}
						lastLoop = time;
					});
					Transport.start(0).stop(sixteenth * 5.1);
				}, 0.7).then(function(){
					expect(loops).to.equal(5);
				});
			});
		});

		context("swing", function(){

			it("can get/set the swing subdivision", function(){
				return Offline(function(Transport){
					Transport.swingSubdivision = "8n";
					expect(Transport.swingSubdivision).to.equal("8n");
					Transport.swingSubdivision = "4n";
					expect(Transport.swingSubdivision).to.equal("4n");
				});
			});

			it("can get/set the swing amount", function(){
				return Offline(function(Transport){
					Transport.swing = 0.5;
					expect(Transport.swing).to.equal(0.5);
					Transport.swing = 0;
					expect(Transport.swing).to.equal(0);
				});
			});

			it("can swing", function(){
				var invokations = 0;
				return Offline(function(Transport){
					Transport.swing = 1;
					Transport.swingSubdivision = "8n";
					var eightNote = Transport.toSeconds("8n");
					//downbeat, no swing
					Transport.schedule(function(time){
						invokations++;
						expect(time).is.closeTo(0, 0.001);
					}, 0);
					//eighth note has swing
					Transport.schedule(function(time){
						invokations++;
						expect(time).is.closeTo(eightNote * 5/3, 0.001);
					}, "8n");
					//sixteenth note is also swung
					Transport.schedule(function(time){
						invokations++;
						expect(time).is.closeTo(eightNote, 0.05);
					}, "16n");
					//no swing on the quarter
					Transport.schedule(function(time){
						invokations++;
						expect(time).is.closeTo(eightNote * 2, 0.001);
					}, "4n");
					Transport.start(0).stop(0.7);
				}, 0.7).then(function(){
					expect(invokations).to.equal(4);
				});
			});
		});

	});
});