(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
module.exports = flowerView = require("./src/flowerView.js");

},{"./src/flowerView.js":3}],3:[function(require,module,exports){
var flowerView = function () {
   "use strict";
    var conf = {
	diagonal : 100,
	values : [],
	fontsize : 12,
	max : 1
    };

    var radius = conf.width / 2;
    var radii = conf.values.length;
    var radians = 2 * Math.PI / radii;
    // var color = d3.scale.category20c();
    var render = function (div) {

    	var container = d3.select(div);
	container.selectAll("*").remove();
    	radius = conf.diagonal / 2;

	var sizeScale = d3.scale.linear()
	    .domain([0,conf.max])
	    .range([0, radius]);
		
	var colorScale = d3.scale.linear()
	    .domain([0,d3.extent(conf.values, function(d){
		return d.value
	    })[1]])
	    //.domain([0, d3.extent(conf.values)[1]])
	    //.range(["#3e8bad", "#975269"]);
	    .range(["#3e8bad", "#3e8bad"]);
	var backgroundColor = "#f1f1f1";
		
	var origin = [~~(conf.width/2), ~~(conf.height/2)];
	var svg = container.append("svg")
	    .attr("width", conf.diagonal)
	    .attr("height", conf.diagonal)
	    .append("g")
	    .attr("transform", "translate(" + radius + "," + radius + ")");

	var label = function (r, currLabel, hasData) {
	    var rads = r * 180 / Math.PI;
	    var offset = 15;
	    svg.append("text")
		.attr("x", origin[0])
		.attr("y", origin[1])
		.attr("font-size", conf.fontsize)
		.attr("font-weight", "bold")
		.attr("fill", function () {
		    if (hasData) {
			return "#000"
		    }
		    return "#ccc";
		})
		.attr("text-anchor", (!isReversed(rads)? "start" : "end"))
		.attr("transform", "translate(" + (0+Math.cos(r)*offset) + "," + (0+Math.sin(r)*offset) + ")rotate(" + (rads) + ")rotate(" + (!isReversed(rads)?0:180) + ")")
		.text(currLabel);

	    function isReversed (d) {
		return (d>90 && d<270);
	    }
	    
	};
	
	var petal = function (l, r, d, color) {
	    var x = l * Math.cos(r);
	    var y = l * Math.sin(r);
	    //var rads = Math.atan2(0-x, 0-y) * 180 / Math.PI;
	    
	    var realx = d * Math.cos(r);
	    var realy = d * Math.sin(r);

	    var rx = l * 0.8 * Math.cos(r+(radians/2));
	    var ry = l * 0.8 * Math.sin(r+(radians/2));
	    var realrx = d * 0.8 * Math.cos(r+(radians/2));
	    var realry = d * 0.8 * Math.sin(r+(radians/2));

	    var lx = l * 0.8 * Math.cos(r-(radians/2));
	    var ly = l * 0.8 * Math.sin(r-(radians/2));
	    var reallx = d * 0.8 * Math.cos(r-(radians/2));
	    var really = d * 0.8 * Math.sin(r-(radians/2));

	    // svg.append ("line")
	    // 	.attr("class", "stitches")
	    // 	.attr("x1", origin[0])
	    // 	.attr("y1", origin[1])
	    // 	.attr("x2", origin[0] + x)
	    // 	.attr("y2", origin[1] + y)

	    // svg.append("line")
	    // 	.attr("class", "stitches")
	    // 	.attr("x1", origin[0])
	    // 	.attr("y1", origin[1])
	    // 	.attr("x2", origin[0] + rx)
	    // 	.attr("y2", origin[1] + ry)

	    // svg.append("line")
	    // 	.attr("class", "stitches")
	    // 	.attr("x1", origin[0] + rx)
	    // 	.attr("y1", origin[1] + ry)
	    // 	.attr("x2", origin[0] + x)
	    // 	.attr("y2", origin[1] + y);

	    // svg.append("line")
	    // 	.attr("class", "stitches")
	    // 	.attr("x1", origin[0])
	    // 	.attr("y1", origin[1])
	    // 	.attr("x2", origin[0] + lx)
	    // 	.attr("y2", origin[1] + ly)

	    // svg.append("line")
	    // 	.attr("class", "stitches")
	    // 	.attr("x1", origin[0] + lx)
	    // 	.attr("y1", origin[1] + ly)
	    // 	.attr("x2", origin[0] + x)
	    // 	.attr("y2", origin[1] + y);

	    var line = d3.svg.line()
		.x(function (d) {return d.x;})
		.y(function (d) {return d.y;})
		.interpolate("basis");

	    // max petal size (dotted)
	    var data = [
		{x:origin[0],  y:origin[1]},
		{x:origin[0]+rx, y:origin[1]+ry},
		{x:origin[0]+x, y:origin[0]+y},
		{x:origin[0]+lx, y:origin[0]+ly},
		{x:origin[0],  y:origin[1]}
	    ];

	    // real petal size
	    var realData = [
		{x:origin[0],  y:origin[1]},
		{x:origin[0]+realrx, y:origin[1]+realry},
		{x:origin[0]+realx, y:origin[1]+realy},
		{x:origin[0]+reallx, y:origin[1]+really},
		{x:origin[0],  y:origin[1]}
	    ];
	    svg.append("path")
		.attr("class", "stitches")
		.attr("d", line(data))
		.style("stroke", function () {
		    if (d>0) {
			return "#3e8bad";
		    }
		    return "#ccc";
		})
		.style("stroke-width", function () {
		    if (d>0) {
			return "0.5px";
		    }
		    return "0.25px";
		})

	    svg.append("path")
		.attr("class", "petal")
		.attr("d", line(realData))
		.attr("fill", function () {return color});
	};

	var petals = function () {
	    var r = 0;
	    conf.values.forEach (function (d, i) {
		var l = radius;
		petal (l, r, sizeScale(d.value), colorScale(d.value));
		r += radians;
	    })
	    r = 0;
	    conf.values.forEach (function (d, i) {
		var l = radius;
		label (r, d.label, d.value>0);
		r += radians;
	    })
	};
	petals();
    };

    render.values = function (vals) {
	if (!arguments.length) {
	    return conf.values;
	}
	conf.values = vals;
	radii = vals.length;
	radians = 2 * Math.PI / radii
	return this;
    };

    render.diagonal = function (d) {
	if (!arguments.length) {
	    return conf.diagonal;
	}
	conf.diagonal = d;
	return this;
    };

    render.fontsize = function (f) {
	if (!arguments.length) {
	    return conf.fontsize;
	}
	conf.fontsize = f;
	return this;
    };
    
    return render;
};

module.exports = exports = flowerView;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L2Zha2VfNGU1MjFlNjQuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvZmxvd2VyVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L3NyYy9mbG93ZXJWaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZsb3dlclZpZXcgPSByZXF1aXJlKFwiLi9zcmMvZmxvd2VyVmlldy5qc1wiKTtcbiIsInZhciBmbG93ZXJWaWV3ID0gZnVuY3Rpb24gKCkge1xuICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGNvbmYgPSB7XG5cdGRpYWdvbmFsIDogMTAwLFxuXHR2YWx1ZXMgOiBbXSxcblx0Zm9udHNpemUgOiAxMixcblx0bWF4IDogMVxuICAgIH07XG5cbiAgICB2YXIgcmFkaXVzID0gY29uZi53aWR0aCAvIDI7XG4gICAgdmFyIHJhZGlpID0gY29uZi52YWx1ZXMubGVuZ3RoO1xuICAgIHZhciByYWRpYW5zID0gMiAqIE1hdGguUEkgLyByYWRpaTtcbiAgICAvLyB2YXIgY29sb3IgPSBkMy5zY2FsZS5jYXRlZ29yeTIwYygpO1xuICAgIHZhciByZW5kZXIgPSBmdW5jdGlvbiAoZGl2KSB7XG5cbiAgICBcdHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QoZGl2KTtcblx0Y29udGFpbmVyLnNlbGVjdEFsbChcIipcIikucmVtb3ZlKCk7XG4gICAgXHRyYWRpdXMgPSBjb25mLmRpYWdvbmFsIC8gMjtcblxuXHR2YXIgc2l6ZVNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcblx0ICAgIC5kb21haW4oWzAsY29uZi5tYXhdKVxuXHQgICAgLnJhbmdlKFswLCByYWRpdXNdKTtcblx0XHRcblx0dmFyIGNvbG9yU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuXHQgICAgLmRvbWFpbihbMCxkMy5leHRlbnQoY29uZi52YWx1ZXMsIGZ1bmN0aW9uKGQpe1xuXHRcdHJldHVybiBkLnZhbHVlXG5cdCAgICB9KVsxXV0pXG5cdCAgICAvLy5kb21haW4oWzAsIGQzLmV4dGVudChjb25mLnZhbHVlcylbMV1dKVxuXHQgICAgLy8ucmFuZ2UoW1wiIzNlOGJhZFwiLCBcIiM5NzUyNjlcIl0pO1xuXHQgICAgLnJhbmdlKFtcIiMzZThiYWRcIiwgXCIjM2U4YmFkXCJdKTtcblx0dmFyIGJhY2tncm91bmRDb2xvciA9IFwiI2YxZjFmMVwiO1xuXHRcdFxuXHR2YXIgb3JpZ2luID0gW35+KGNvbmYud2lkdGgvMiksIH5+KGNvbmYuaGVpZ2h0LzIpXTtcblx0dmFyIHN2ZyA9IGNvbnRhaW5lci5hcHBlbmQoXCJzdmdcIilcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZi5kaWFnb25hbClcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYuZGlhZ29uYWwpXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyByYWRpdXMgKyBcIixcIiArIHJhZGl1cyArIFwiKVwiKTtcblxuXHR2YXIgbGFiZWwgPSBmdW5jdGlvbiAociwgY3VyckxhYmVsLCBoYXNEYXRhKSB7XG5cdCAgICB2YXIgcmFkcyA9IHIgKiAxODAgLyBNYXRoLlBJO1xuXHQgICAgdmFyIG9mZnNldCA9IDE1O1xuXHQgICAgc3ZnLmFwcGVuZChcInRleHRcIilcblx0XHQuYXR0cihcInhcIiwgb3JpZ2luWzBdKVxuXHRcdC5hdHRyKFwieVwiLCBvcmlnaW5bMV0pXG5cdFx0LmF0dHIoXCJmb250LXNpemVcIiwgY29uZi5mb250c2l6ZSlcblx0XHQuYXR0cihcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuXHRcdC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIGlmIChoYXNEYXRhKSB7XG5cdFx0XHRyZXR1cm4gXCIjMDAwXCJcblx0XHQgICAgfVxuXHRcdCAgICByZXR1cm4gXCIjY2NjXCI7XG5cdFx0fSlcblx0XHQuYXR0cihcInRleHQtYW5jaG9yXCIsICghaXNSZXZlcnNlZChyYWRzKT8gXCJzdGFydFwiIDogXCJlbmRcIikpXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAoMCtNYXRoLmNvcyhyKSpvZmZzZXQpICsgXCIsXCIgKyAoMCtNYXRoLnNpbihyKSpvZmZzZXQpICsgXCIpcm90YXRlKFwiICsgKHJhZHMpICsgXCIpcm90YXRlKFwiICsgKCFpc1JldmVyc2VkKHJhZHMpPzA6MTgwKSArIFwiKVwiKVxuXHRcdC50ZXh0KGN1cnJMYWJlbCk7XG5cblx0ICAgIGZ1bmN0aW9uIGlzUmV2ZXJzZWQgKGQpIHtcblx0XHRyZXR1cm4gKGQ+OTAgJiYgZDwyNzApO1xuXHQgICAgfVxuXHQgICAgXG5cdH07XG5cdFxuXHR2YXIgcGV0YWwgPSBmdW5jdGlvbiAobCwgciwgZCwgY29sb3IpIHtcblx0ICAgIHZhciB4ID0gbCAqIE1hdGguY29zKHIpO1xuXHQgICAgdmFyIHkgPSBsICogTWF0aC5zaW4ocik7XG5cdCAgICAvL3ZhciByYWRzID0gTWF0aC5hdGFuMigwLXgsIDAteSkgKiAxODAgLyBNYXRoLlBJO1xuXHQgICAgXG5cdCAgICB2YXIgcmVhbHggPSBkICogTWF0aC5jb3Mocik7XG5cdCAgICB2YXIgcmVhbHkgPSBkICogTWF0aC5zaW4ocik7XG5cblx0ICAgIHZhciByeCA9IGwgKiAwLjggKiBNYXRoLmNvcyhyKyhyYWRpYW5zLzIpKTtcblx0ICAgIHZhciByeSA9IGwgKiAwLjggKiBNYXRoLnNpbihyKyhyYWRpYW5zLzIpKTtcblx0ICAgIHZhciByZWFscnggPSBkICogMC44ICogTWF0aC5jb3MocisocmFkaWFucy8yKSk7XG5cdCAgICB2YXIgcmVhbHJ5ID0gZCAqIDAuOCAqIE1hdGguc2luKHIrKHJhZGlhbnMvMikpO1xuXG5cdCAgICB2YXIgbHggPSBsICogMC44ICogTWF0aC5jb3Moci0ocmFkaWFucy8yKSk7XG5cdCAgICB2YXIgbHkgPSBsICogMC44ICogTWF0aC5zaW4oci0ocmFkaWFucy8yKSk7XG5cdCAgICB2YXIgcmVhbGx4ID0gZCAqIDAuOCAqIE1hdGguY29zKHItKHJhZGlhbnMvMikpO1xuXHQgICAgdmFyIHJlYWxseSA9IGQgKiAwLjggKiBNYXRoLnNpbihyLShyYWRpYW5zLzIpKTtcblxuXHQgICAgLy8gc3ZnLmFwcGVuZCAoXCJsaW5lXCIpXG5cdCAgICAvLyBcdC5hdHRyKFwiY2xhc3NcIiwgXCJzdGl0Y2hlc1wiKVxuXHQgICAgLy8gXHQuYXR0cihcIngxXCIsIG9yaWdpblswXSlcblx0ICAgIC8vIFx0LmF0dHIoXCJ5MVwiLCBvcmlnaW5bMV0pXG5cdCAgICAvLyBcdC5hdHRyKFwieDJcIiwgb3JpZ2luWzBdICsgeClcblx0ICAgIC8vIFx0LmF0dHIoXCJ5MlwiLCBvcmlnaW5bMV0gKyB5KVxuXG5cdCAgICAvLyBzdmcuYXBwZW5kKFwibGluZVwiKVxuXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcblx0ICAgIC8vIFx0LmF0dHIoXCJ4MVwiLCBvcmlnaW5bMF0pXG5cdCAgICAvLyBcdC5hdHRyKFwieTFcIiwgb3JpZ2luWzFdKVxuXHQgICAgLy8gXHQuYXR0cihcIngyXCIsIG9yaWdpblswXSArIHJ4KVxuXHQgICAgLy8gXHQuYXR0cihcInkyXCIsIG9yaWdpblsxXSArIHJ5KVxuXG5cdCAgICAvLyBzdmcuYXBwZW5kKFwibGluZVwiKVxuXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcblx0ICAgIC8vIFx0LmF0dHIoXCJ4MVwiLCBvcmlnaW5bMF0gKyByeClcblx0ICAgIC8vIFx0LmF0dHIoXCJ5MVwiLCBvcmlnaW5bMV0gKyByeSlcblx0ICAgIC8vIFx0LmF0dHIoXCJ4MlwiLCBvcmlnaW5bMF0gKyB4KVxuXHQgICAgLy8gXHQuYXR0cihcInkyXCIsIG9yaWdpblsxXSArIHkpO1xuXG5cdCAgICAvLyBzdmcuYXBwZW5kKFwibGluZVwiKVxuXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcblx0ICAgIC8vIFx0LmF0dHIoXCJ4MVwiLCBvcmlnaW5bMF0pXG5cdCAgICAvLyBcdC5hdHRyKFwieTFcIiwgb3JpZ2luWzFdKVxuXHQgICAgLy8gXHQuYXR0cihcIngyXCIsIG9yaWdpblswXSArIGx4KVxuXHQgICAgLy8gXHQuYXR0cihcInkyXCIsIG9yaWdpblsxXSArIGx5KVxuXG5cdCAgICAvLyBzdmcuYXBwZW5kKFwibGluZVwiKVxuXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcblx0ICAgIC8vIFx0LmF0dHIoXCJ4MVwiLCBvcmlnaW5bMF0gKyBseClcblx0ICAgIC8vIFx0LmF0dHIoXCJ5MVwiLCBvcmlnaW5bMV0gKyBseSlcblx0ICAgIC8vIFx0LmF0dHIoXCJ4MlwiLCBvcmlnaW5bMF0gKyB4KVxuXHQgICAgLy8gXHQuYXR0cihcInkyXCIsIG9yaWdpblsxXSArIHkpO1xuXG5cdCAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcblx0XHQueChmdW5jdGlvbiAoZCkge3JldHVybiBkLng7fSlcblx0XHQueShmdW5jdGlvbiAoZCkge3JldHVybiBkLnk7fSlcblx0XHQuaW50ZXJwb2xhdGUoXCJiYXNpc1wiKTtcblxuXHQgICAgLy8gbWF4IHBldGFsIHNpemUgKGRvdHRlZClcblx0ICAgIHZhciBkYXRhID0gW1xuXHRcdHt4Om9yaWdpblswXSwgIHk6b3JpZ2luWzFdfSxcblx0XHR7eDpvcmlnaW5bMF0rcngsIHk6b3JpZ2luWzFdK3J5fSxcblx0XHR7eDpvcmlnaW5bMF0reCwgeTpvcmlnaW5bMF0reX0sXG5cdFx0e3g6b3JpZ2luWzBdK2x4LCB5Om9yaWdpblswXStseX0sXG5cdFx0e3g6b3JpZ2luWzBdLCAgeTpvcmlnaW5bMV19XG5cdCAgICBdO1xuXG5cdCAgICAvLyByZWFsIHBldGFsIHNpemVcblx0ICAgIHZhciByZWFsRGF0YSA9IFtcblx0XHR7eDpvcmlnaW5bMF0sICB5Om9yaWdpblsxXX0sXG5cdFx0e3g6b3JpZ2luWzBdK3JlYWxyeCwgeTpvcmlnaW5bMV0rcmVhbHJ5fSxcblx0XHR7eDpvcmlnaW5bMF0rcmVhbHgsIHk6b3JpZ2luWzFdK3JlYWx5fSxcblx0XHR7eDpvcmlnaW5bMF0rcmVhbGx4LCB5Om9yaWdpblsxXStyZWFsbHl9LFxuXHRcdHt4Om9yaWdpblswXSwgIHk6b3JpZ2luWzFdfVxuXHQgICAgXTtcblx0ICAgIHN2Zy5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInN0aXRjaGVzXCIpXG5cdFx0LmF0dHIoXCJkXCIsIGxpbmUoZGF0YSkpXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgaWYgKGQ+MCkge1xuXHRcdFx0cmV0dXJuIFwiIzNlOGJhZFwiO1xuXHRcdCAgICB9XG5cdFx0ICAgIHJldHVybiBcIiNjY2NcIjtcblx0XHR9KVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIGlmIChkPjApIHtcblx0XHRcdHJldHVybiBcIjAuNXB4XCI7XG5cdFx0ICAgIH1cblx0XHQgICAgcmV0dXJuIFwiMC4yNXB4XCI7XG5cdFx0fSlcblxuXHQgICAgc3ZnLmFwcGVuZChcInBhdGhcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwicGV0YWxcIilcblx0XHQuYXR0cihcImRcIiwgbGluZShyZWFsRGF0YSkpXG5cdFx0LmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uICgpIHtyZXR1cm4gY29sb3J9KTtcblx0fTtcblxuXHR2YXIgcGV0YWxzID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdmFyIHIgPSAwO1xuXHQgICAgY29uZi52YWx1ZXMuZm9yRWFjaCAoZnVuY3Rpb24gKGQsIGkpIHtcblx0XHR2YXIgbCA9IHJhZGl1cztcblx0XHRwZXRhbCAobCwgciwgc2l6ZVNjYWxlKGQudmFsdWUpLCBjb2xvclNjYWxlKGQudmFsdWUpKTtcblx0XHRyICs9IHJhZGlhbnM7XG5cdCAgICB9KVxuXHQgICAgciA9IDA7XG5cdCAgICBjb25mLnZhbHVlcy5mb3JFYWNoIChmdW5jdGlvbiAoZCwgaSkge1xuXHRcdHZhciBsID0gcmFkaXVzO1xuXHRcdGxhYmVsIChyLCBkLmxhYmVsLCBkLnZhbHVlPjApO1xuXHRcdHIgKz0gcmFkaWFucztcblx0ICAgIH0pXG5cdH07XG5cdHBldGFscygpO1xuICAgIH07XG5cbiAgICByZW5kZXIudmFsdWVzID0gZnVuY3Rpb24gKHZhbHMpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi52YWx1ZXM7XG5cdH1cblx0Y29uZi52YWx1ZXMgPSB2YWxzO1xuXHRyYWRpaSA9IHZhbHMubGVuZ3RoO1xuXHRyYWRpYW5zID0gMiAqIE1hdGguUEkgLyByYWRpaVxuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLmRpYWdvbmFsID0gZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5kaWFnb25hbDtcblx0fVxuXHRjb25mLmRpYWdvbmFsID0gZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5mb250c2l6ZSA9IGZ1bmN0aW9uIChmKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYuZm9udHNpemU7XG5cdH1cblx0Y29uZi5mb250c2l6ZSA9IGY7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHJlbmRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZsb3dlclZpZXc7XG4iXX0=
