define(["helper/Basic", "Tone/source/PulseOscillator", "helper/Offline", "helper/SourceTests", "helper/OscillatorTests"], 
	function (BasicTests, PulseOscillator, Offline, SourceTests, OscillatorTests) {

	describe("PulseOscillator", function(){

		//run the common tests
		BasicTests(PulseOscillator);
		SourceTests(PulseOscillator);
		OscillatorTests(PulseOscillator);

		context("Phase Rotation", function(){
			it ("can change the phase to 90", function(){
				return Offline(function(){
					var osc = new PulseOscillator({
						"phase" : 90,
						"frequency" : 1
					});
					osc.toMaster();
					osc.start(0);
				}, 1).then(function(buffer){
					buffer.forEach(function(sample, time){
						if (time < 0.25){
							expect(sample).to.be.within(-1, 0);
						} else if (time < 0.5){
							expect(sample).to.be.within(0, 1);
						}
					});
				});
			});

			it ("can change the phase to -90", function(){
				return Offline(function(){
					var osc = new PulseOscillator({
						"phase" : 270,
						"frequency" : 1
					});
					osc.toMaster();
					osc.start(0);
				}, 1).then(function(buffer){
					buffer.forEach(function(sample, time){
						if (time < 0.25){
							expect(sample).to.be.within(0, 1);
						} else if (time < 0.5){
							expect(sample).to.be.within(-1, 0);
						}
					});
				});
			});
			
		});

		context("Width", function(){

			it ("can set the width", function(){
				var osc = new PulseOscillator({
					"width" : 0.2,
				});
				expect(osc.width.value).to.be.closeTo(0.2, 0.001);
				osc.dispose();
			});

			it ("outputs correctly with a width of 0", function(){
				return Offline(function(){
					var osc = new PulseOscillator({
						"width" : 0,
						"frequency" : 1
					});
					osc.toMaster();
					osc.start(0);
				}, 1).then(function(buffer){
					buffer.forEach(function(sample, time){
						if (time > 0.5){
							expect(sample).to.be.within(-1, 0);
						} 
					});
				});
			});

			it ("outputs correctly with a width of 0.5", function(){
				return Offline(function(){
					var osc = new PulseOscillator({
						"width" : 0.5,
						"frequency" : 1
					});
					osc.toMaster();
					osc.start(0);
				}, 1).then(function(buffer){
					buffer.forEach(function(sample, time){
						if (time <= 0.5){
							expect(sample).to.be.within(0, 1);
						} else if (time >= 0.51 && time <= 0.7){
							expect(sample).to.be.within(-1, 0);
						} else if (time > 0.71){
							expect(sample).to.be.within(0, 1);
						}
					});
				});
			});
		});

	});
});