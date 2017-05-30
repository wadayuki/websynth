define(["Tone/core/Tone", "Tone/core/Offline", "helper/BufferTest", "Tone/core/Master"], 
	function (Tone, Offline, BufferTest, Master) {

	return function(callback, duration, channels){
		duration = duration || 0.1;
		channels = channels || 1;
		return Offline(function(Transport){
			var testFn = callback(Transport);
			if (testFn){
				Transport.context.on("tick", function(){
					testFn(Transport.now());
				});
			}
		}, duration).then(function(buffer){
			BufferTest(buffer);
			if (channels === 1){
				buffer.toMono();
			}
			return buffer;
		});
	};
});