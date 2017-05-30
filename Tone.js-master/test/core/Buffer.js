define(["Test", "Tone/core/Buffer", "Tone/core/Tone"], function (Test, Buffer, Tone) {
	
	if (window.__karma__){
		Buffer.baseUrl = "/base/test/";
	}

	var testFile = "./audio/sine.wav";

	describe("Buffer", function(){
		it ("can be created and disposed", function(){
			var buff = new Buffer(testFile);
			buff.dispose();
			Test.wasDisposed(buff);
		});

		it("loads a file from a url string", function(done){
			var buffer = new Buffer(testFile, function(buff){
				expect(buff).to.be.instanceof(Buffer);
				buffer.dispose();
				done();
			});
		});

		it("has a duration", function(done){
			var buffer = new Buffer(testFile, function(){
				expect(buffer.duration).to.be.closeTo(3, 0.01);
				buffer.dispose();
				done();
			});
		});

		it("can get the number of channels", function(done){
			var buffer = new Buffer(testFile, function(){
				expect(buffer.numberOfChannels).to.be.equal(1);
				buffer.dispose();
				done();
			});
		});

		it("can get the length of the buffer", function(done){
			var buffer = new Buffer(testFile, function(){
				expect(buffer.length).to.be.a.number;
				expect(buffer.length).to.be.above(130000);
				buffer.dispose();
				done();
			});
		});

		it("invokes the error callback if there is a problem with the file", function(done){
			var buffer = new Buffer("nosuchfile.wav", function(){
				throw new Error("shouldn't invoke this function");
			}, function(e){
				buffer.dispose();
				done();
			});
		});

		it("invokes the error callback on static .load method", function(done){
			Buffer.load("nosuchfile.wav", function(){
				Buffer.cancelDownloads();
				throw new Error("shouldn't invoke this function");
			}, function(){
				Buffer.cancelDownloads();
				done();
			});
		});

		it("the static on('error') method is invoked", function(done){
			Buffer.on("error", function(e){
				buffer.dispose();
				Buffer.cancelDownloads();
				Buffer.off("error");
				done();
			});
			var buffer = new Buffer("nosuchfile.wav");
		});

		it("the static on('load') method is invoked", function(done){
			var buffer = new Buffer(testFile);
			Buffer.on("load", function(){
				buffer.dispose();
				Buffer.off("load");
				done();
			});
		});


		it("can be constructed with an options object", function(done){
			var buffer = new Buffer({
				"url" : testFile,
				"reverse" : true,
				"onload" : function(){
					buffer.dispose();
					done();
				}
			});
		});

		it("takes an AudioBuffer in the constructor method", function(done){
			var buffer = new Buffer({
				"url" : testFile,
				"onload" : function(){
					var testOne = new Buffer(buffer.get());
					expect(testOne.get()).to.equal(buffer.get());
					testOne.dispose();
					buffer.dispose();
					done();
				}
			});
		});

		it("takes a Tone.Buffer in the constructor method", function(done){
			var buffer = new Buffer({
				"url" : testFile,
				"onload" : function(){
					var testOne = new Buffer(buffer);
					expect(testOne.get()).to.equal(buffer.get());
					testOne.dispose();
					buffer.dispose();
					done();
				}
			});
		});

		it("takes Tone.Buffer in the set method", function(done){
			var buffer = new Buffer({
				"url" : testFile,
				"onload" : function(){
					var testOne = new Buffer(testFile);
					testOne.set(buffer);
					expect(testOne.get()).to.equal(buffer.get());
					testOne.dispose();
					buffer.dispose();
					done();
				}
			});
		});

		it("takes AudioBuffer in the set method", function(done){
			var buffer = new Buffer({
				"url" : testFile,
				"onload" : function(){
					var testOne = new Buffer(testFile);
					testOne.set(buffer.get());
					expect(testOne.get()).to.equal(buffer.get());
					testOne.dispose();
					buffer.dispose();
					done();
				}
			});
		});

		it("the static on('progress') method is invoked", function(done){
			var buffer = new Buffer(testFile);
			Buffer.on("progress", function(percent){
				expect(percent).to.be.a.number;
				Buffer.off("progress");
				buffer.dispose();
				done();
			});
		});

		it("can get the channel data as an array", function(done){
			var buffer = new Buffer(testFile, function(){
				expect(buffer.getChannelData(0)).to.be.an.instanceOf(Float32Array);
				expect(buffer.getChannelData(0).length).to.be.above(130000);
				buffer.dispose();
				done();
			});
		});

		it("can reverse a buffer", function(done){
			var buffer = new Buffer(testFile, function(){
				var buffArray = buffer.get();
				var lastSample = buffArray[buffArray.length - 1];
				buffer.reverse = true;
				expect(buffer.get()[0]).to.equal(lastSample);
				buffer.dispose();
				done();
			});
		});

		it("can convert from an array", function(){
			var buffer = new Buffer();
			var arr = new Float32Array(0.5 * buffer.context.sampleRate);
			arr[0] = 0.5;
			buffer.fromArray(arr);
			expect(buffer.duration).to.equal(0.5);
			expect(buffer.numberOfChannels).to.equal(1);
			//test the first sample of the first channel to see if it's the same
			expect(buffer.get().getChannelData(0)[0]).to.equal(0.5);
			buffer.dispose();
		});

		it("can convert from a multidimentional array", function(){
			var buffer = new Buffer();
			var arr = [new Float32Array(0.5 * buffer.context.sampleRate), new Float32Array(0.5 * buffer.context.sampleRate)];
			arr[0][0] = 0.5;
			buffer.fromArray(arr);
			expect(buffer.duration).to.equal(0.5);
			expect(buffer.numberOfChannels).to.equal(2);
			expect(buffer.get().getChannelData(0)[0]).to.equal(0.5);
			buffer.dispose();
		});

		it("can convert to and from an array", function(){
			var buffer = new Buffer();
			var arr = [new Float32Array(0.5 * buffer.context.sampleRate), new Float32Array(0.5 * buffer.context.sampleRate)];
			arr[0][0] = 0.5;
			buffer.fromArray(arr);
			expect(buffer.get().getChannelData(0)[0]).to.equal(0.5);
			expect(buffer.toArray()[0][0]).to.equal(0.5);
			//with a selected channel
			expect(buffer.toArray(0)[0]).to.equal(0.5);
			buffer.dispose();
		});

		it("can slice a portion of the array", function(done){
			var buffer = new Buffer(testFile, function(){
				//original duration
				expect(buffer.duration).to.be.closeTo(3, 0.01);
				var sliced1 = buffer.slice(0, 1);
				//does not modify the original
				expect(buffer.duration).to.be.closeTo(3, 0.01);
				expect(sliced1.duration).to.be.closeTo(1, 0.01);
				var sliced2 = sliced1.slice(0.5);
				expect(sliced2.duration).to.be.closeTo(0.5, 0.01);
				
				buffer.dispose();
				sliced1.dispose();
				sliced2.dispose();
				done();
			});
		});

		it("instance .load method returns Promise", function(done){
			var promise = (new Buffer()).load(testFile);
			expect(promise).to.be.instanceOf(Promise);
			promise.then(function(buff){
				expect(buff).to.be.instanceOf(Buffer);
				done();
			});
			promise.catch(function(){
				throw new Error("shouldn't invoke this function");
			});
		});

		it("Promise invokes catch callback", function(done){
			var promise = (new Buffer()).load("nosuchfile.wav");
			promise.then(function(){
				throw new Error("shouldn't invoke this function");
			});
			promise.catch(function(){
				done();
			});
		});

		it("Test if the browser supports the given type", function(){
			expect(Buffer.supportsType('test.wav')).to.be.true
			expect(Buffer.supportsType('wav')).to.be.true
			expect(Buffer.supportsType('path/to/test.wav')).to.be.true
			expect(Buffer.supportsType('path/to/test.nope')).to.be.false
		});
	});

	describe("Tone.loaded()", function(){

		it ("returns a promise", function(){
			expect(Tone.loaded()).to.be.instanceOf(Promise)
		});

		it ("is invoked when all the buffers are loaded", function(){
			Tone.Buffer.cancelDownloads()
			// expect(Tone.loaded)
			var buff0 = new Buffer(testFile)
			var buff1 = new Buffer(testFile)
			return Tone.loaded()
		});

		it ("invokes an error if one of the buffers is not found", function(done){
			Tone.Buffer.cancelDownloads()
			// expect(Tone.loaded)
			var buff0 = new Buffer(testFile)
			var buff1 = new Buffer("nosuchfile.wav")
			Tone.loaded().catch(function(e){
				expect(e).to.be.instanceOf(Error)
				done()
			});
		});
	});
});