"use strict";

/*
 Color Picker
 By Erik Wrenholt 2015
 MIT License
*/

var ColorPicker = function() {

	var _current_hue_degrees = 0;  // 0-360
	var _current_saturation = 0;   // 0-100 left to right (x)
	var _current_value = 0;        // 0-100 top to bottom (y)

	var _mouse_is_down_hue = false;
	var _mouse_is_down_mixer = false;
	
	var _onselect = function(){};
	var _oncancel = function(){};
	
	function full_sat_color() {
		return 'hsl(' + _current_hue_degrees + ', 100%, 50%)';
	}

	//https://gist.github.com/xpansive/1337890
	function hsv2hsl(hue,sat,val){
		return [		//[hue, saturation, lightness]
						//Range should be between 0 - 1
						
				hue,    //Hue stays the same

						//Saturation is very different between the two color spaces
						//If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
						//Otherwise sat*val/(2-(2-sat)*val)
						//Conditional is not operating with hue, it is reassigned!
				sat*val/((hue=(2-sat)*val)<1?hue:2-hue), 

				hue/2]  //Lightness is (2-sat)*val/2
						//See reassignment of hue above
	}
	//https://gist.github.com/xpansive/1337890
	function hsl2hsv(hue,sat,light) {
		sat*=light<.5?light:1-light;
		return[ //[hue, saturation, value]
				//Range should be between 0 - 1	
					
				hue,					//Hue stays the same
				2*sat/(light+sat),		//Saturation
				light+sat]				//Value
	}

	function current_color() {
		var result = hsv2hsl(
						_current_hue_degrees/360, 
						_current_saturation/100, 
						1 - _current_value/100);
		
		var h,s,l;
		
		h = result[0] * 360;
		s = result[1] * 100;
		l = result[2] * 100;
		
		if (h > 360) { h = 360; }
		if (s > 100) { s = 100; }
		if (l > 100) { l = 100; }
		
		if (h < 0 || isNaN(h)) { h = 0; }
		if (s < 0 || isNaN(s)) { s = 0; }
		if (l < 0 || isNaN(l)) { l = 0; }
				
		var hsl = 'hsl(' + h + ', '  + s +  '%, ' + l +'%)';
		//console.log(hsl);
		return hsl;
	}
	
	function update_current_color() {
		var color_new = document.getElementById("color_new");
		color_new.style.backgroundColor = current_color();
	}
	
	function draw_color_mixer() {

		var color_box = document.getElementById("color_box");
		var context = color_box.getContext("2d");
	
		var width = color_box.width;
		var height = color_box.height;
	
		// white to color, left to right
		context.globalCompositeOperation = "copy";
		var gradient = context.createLinearGradient(0,0,width,0);
		gradient.addColorStop(0,"white");		
		gradient.addColorStop(1, full_sat_color());
		context.fillStyle = gradient;
		context.fillRect(0,0,width,height);

		// Transparent to black, top to bottom
		context.globalCompositeOperation = "multiply";
		var gradient = context.createLinearGradient(0,0,0,height);
		gradient.addColorStop(0,"transparent");
		gradient.addColorStop(1,"black");
		context.fillStyle = gradient;
		context.fillRect(0,0,width,height);
		
		var context = color_box.getContext("2d");
		context.globalCompositeOperation = "source-over";

		var x = Math.round((_current_saturation / 100) * width) + 0.5;
		var y = Math.round((_current_value / 100) * height) + 0.5;

		context.strokeStyle = "black";
		context.strokeRect(x - 10, y - 10, 20, 20);

		context.strokeStyle = "white";
		context.strokeRect(x - 9, y - 9, 18, 18);
		
		update_current_color();
	}
	
	function draw_hue_gradient() {
	
		var color_hue = document.getElementById("color_hue");
		var context = color_hue.getContext("2d");
	
		var width = color_hue.width;
		var height = color_hue.height;

		var i;
		for (i = 0; i < height; i++) {
			var hue = Math.round((i / height) * 360);
			var hsl = 'hsl(' + hue + ', 100%, 50%)';
			context.fillStyle = hsl;
			context.fillRect(0, i, width, 1);
		}
		
		var hue_offset = Math.round((_current_hue_degrees / 360) * height) + 0.5;
		context.globalCompositeOperation = "source-over";
		context.strokeStyle = "black";
		context.strokeRect(0.5, hue_offset-10, width-1, 20);
		context.strokeStyle = "white";
		context.strokeRect(1.5, hue_offset-9, width-3, 18);
		
	}

	function update_mixer(e) {
		var color_box = document.getElementById("color_box");
		var width = color_box.width;
		var height = color_box.height;

		var rect = color_box.getBoundingClientRect();
		var canX = e.clientX - rect.left;
		var canY = e.clientY - rect.top;
		
		_current_value = canY/height * 100;
		_current_saturation = canX/width * 100;
		
		if (_current_value < 0)
			_current_value = 0;
		else if (_current_value > 100) {
			_current_value = 100;
		}
		
		if (_current_saturation < 0)
			_current_saturation = 0;
		else if (_current_saturation > 100) {
			_current_saturation = 100;
		}
		
		draw_color_mixer();
	}
	
	function add_mixer_listeners() {
		var color_box = document.getElementById("color_box");
				
		color_box.onmousedown = function (e) {
			_mouse_is_down_mixer = true;
			update_mixer(e);
		};

	}
	
	function update_hue(e) {
		var color_hue = document.getElementById("color_hue");
		var rect = color_hue.getBoundingClientRect();
		var canX = e.clientX - rect.left;
		var canY = e.clientY - rect.top;
		var height = color_hue.height;
		
		_current_hue_degrees = canY/height * 360;
		if (_current_hue_degrees < 0)
			_current_hue_degrees = 0;
		else if (_current_hue_degrees > 360) {
			_current_hue_degrees = 360;
		}
		
		draw_color_mixer();
		draw_hue_gradient();
	}

	function add_hue_listeners() {
		var color_hue = document.getElementById("color_hue");
				
		color_hue.onmousedown = function(e) {
			_mouse_is_down_hue = true;
			update_hue(e);
		};

	}

	function add_listeners() {
	
		var color_new = document.getElementById("color_new");
		var color_old = document.getElementById("color_old");
		
		color_new.onclick = function(e) {
			var c = current_color();
			color_old.style.background = c;
			// Take newly selected color
			_onselect(c);
		}
		
		color_old.onclick = function(e) {
			_oncancel();
		}


		add_hue_listeners();
		add_mixer_listeners();

		document.onmouseup = function(e) {
			if (_mouse_is_down_mixer) {
				update_mixer(e);
			}
			if (_mouse_is_down_hue) {
				update_hue(e);
			}
			_mouse_is_down_mixer = false;
			_mouse_is_down_hue = false;
		};
		
		document.onmousemove = function(e) {
			if (_mouse_is_down_hue) {
				update_hue(e);
			}
			if (_mouse_is_down_mixer) {
				update_mixer(e);
			}
		};
	}
	
	function init() {
		draw_color_mixer();
		draw_hue_gradient();
		add_listeners();
	}
	
	function showPicker() {
		var color_hue = document.getElementById("color_container");
		color_hue.style.visibility = "visible";
	}
	
	function hidePicker() {
		var color_hue = document.getElementById("color_container");
		color_hue.style.visibility = "hidden";
	}
	
	function presentPickerWithColor(params) {
		//FIXME implement color
		// params["color"]
		_onselect = params["onselect"];
		_oncancel = params["oncancel"];
		showPicker();
	}
	
	return {
		init: init,
		presentPickerWithColor: presentPickerWithColor,
		showPicker: showPicker,
		hidePicker: hidePicker
	}
}
