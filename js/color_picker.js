"use strict";

/*
 Color Picker
 By Erik Wrenholt 2015
 MIT License
*/

var ColorPicker = function() {

	var _current_hue_degrees = 0;  // 0-360
	var _current_saturation = 0;   // 0-1 left to right (x)
	var _current_value = 0;		   // 0-1 top to bottom (y)

	var _mouse_is_down_hue = false;
	var _mouse_is_down_mixer = false;
	
	var _onselect = function(){};
	var _oncancel = function(){};
	
	
	function hsv() {
		return {
			hue: _current_hue_degrees,
			saturation: _current_saturation * 100.0,
			value: (1-_current_value) * 100
		};
	}

	function rgb() {
		return hsv2rgb(hsv());
	}

	function rgb_array() {
		var c = rgb();
		return [c.r, c.g, c.b];
	}
	
	function rgb_string() {
		return "rgb(" + rgb_array().join(",") + ")";
	}

	//http://stackoverflow.com/questions/1664140/js-function-to-calculate-complementary-colour
	function rgb2hsv(rgb) {
		var hsv = new Object();
		var max = Math.max.apply(Math, [rgb.r,rgb.g,rgb.b]);
		var min = Math.min.apply(Math, [rgb.r,rgb.g,rgb.b]);
		var dif = max - min;
		hsv.saturation=(max==0.0)?0:(100*dif/max);
		
		if (hsv.saturation==0) hsv.hue=0;
		else if (rgb.r==max) hsv.hue=60.0*(rgb.g-rgb.b)/dif;
		else if (rgb.g==max) hsv.hue=120.0+60.0*(rgb.b-rgb.r)/dif;
		else if (rgb.b==max) hsv.hue=240.0+60.0*(rgb.r-rgb.g)/dif;
		
		if (hsv.hue<0.0) hsv.hue+=360.0;
		
		hsv.value=Math.round(max*100/255);
		hsv.hue=Math.round(hsv.hue);
		hsv.saturation=Math.round(hsv.saturation);
		
		return hsv;
	}

	// RGB2HSV and HSV2RGB are based on Color Match Remix [http://color.twysted.net/]
	// which is based on or copied from ColorMatch 5K [http://colormatch.dk/]
	function hsv2rgb(hsv) {
		var rgb=new Object();
		
		if (hsv.saturation==0) {
			rgb.r=rgb.g=rgb.b=Math.round(hsv.value*2.55);
		} else {
		
			hsv.hue/=60;
			hsv.saturation/=100;
			hsv.value/=100;
			
			var i=Math.floor(hsv.hue);
			var f=hsv.hue-i;
			var p=hsv.value*(1-hsv.saturation);
			var q=hsv.value*(1-hsv.saturation*f);
			var t=hsv.value*(1-hsv.saturation*(1-f));
			
			switch(i) {
				case 0: rgb.r=hsv.value; rgb.g=t; rgb.b=p; break;
				case 1: rgb.r=q; rgb.g=hsv.value; rgb.b=p; break;
				case 2: rgb.r=p; rgb.g=hsv.value; rgb.b=t; break;
				case 3: rgb.r=p; rgb.g=q; rgb.b=hsv.value; break;
				case 4: rgb.r=t; rgb.g=p; rgb.b=hsv.value; break;
				default: rgb.r=hsv.value; rgb.g=p; rgb.b=q;
			}
			
			rgb.r=Math.round(rgb.r*255);
			rgb.g=Math.round(rgb.g*255);
			rgb.b=Math.round(rgb.b*255);
		}
		
		return rgb;
	}

	function update_current_color() {
		var color_new = document.getElementById("color_new");
		color_new.style.backgroundColor = rgb_string();
	}

	function full_sat_color() {
		return 'hsl(' + _current_hue_degrees + ', 100%, 50%)';
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

		var x = Math.round((_current_saturation) * width) + 0.5;
		var y = Math.round((_current_value) * height) + 0.5;
		
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
		
		_current_value = canY/height;
		_current_saturation = canX/width;
		
		if (_current_value < 0)
			_current_value = 0;
		else if (_current_value > 1.0) {
			_current_value = 1.0;
		}
		
		if (_current_saturation < 0)
			_current_saturation = 0;
		else if (_current_saturation > 1) {
			_current_saturation = 1.0;
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
			color_old.style.background = rgb_string();
			_onselect();
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
		
	function showPicker() {
		var color_hue = document.getElementById("color_container");
		color_hue.style.visibility = "visible";
	}
	
	function hidePicker() {
		var color_hue = document.getElementById("color_container");
		color_hue.style.visibility = "hidden";
	}
	
	function presentPickerWithColor(params) {

		var rgb_array = params["rgb_array"];
		
		var rgb = {
			r: rgb_array[0],
			g: rgb_array[1],
			b: rgb_array[2]
		};
		
		var hsv = rgb2hsv(rgb);
		
		_current_hue_degrees = hsv.hue;
		_current_saturation = hsv.saturation / 100.0;
		_current_value = (100.0-hsv.value) / 100.0;
		
		_onselect = params["onselect"];
		_oncancel = params["oncancel"];
		
		draw_color_mixer();
		draw_hue_gradient();
		add_listeners();
		
		showPicker();
	}
	
	return {
		presentPickerWithColor: presentPickerWithColor,
		showPicker: showPicker,
		hidePicker: hidePicker,
		rgb_array: rgb_array,
		rgb_string: rgb_string
	}
}
