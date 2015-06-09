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
		if (d.active === false) {
		} else {
		    var l = radius;
		    petal (l, r, sizeScale(d.value), colorScale(d.value));
		}
		r += radians;

	    });
	    r = 0;
	    conf.values.forEach (function (d, i) {
		if (d.active === false) {
		} else {
		    var l = radius;
		    label (r, d.label, d.value>0);
		}
		r += radians;
	    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L2Zha2VfZTk5NjMwNGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvZmxvd2VyVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L3NyYy9mbG93ZXJWaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZmxvd2VyVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9mbG93ZXJWaWV3LmpzXCIpO1xuIiwidmFyIGZsb3dlclZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgY29uZiA9IHtcblx0ZGlhZ29uYWwgOiAxMDAsXG5cdHZhbHVlcyA6IFtdLFxuXHRmb250c2l6ZSA6IDEyLFxuXHRtYXggOiAxXG4gICAgfTtcblxuICAgIHZhciByYWRpdXMgPSBjb25mLndpZHRoIC8gMjtcbiAgICB2YXIgcmFkaWkgPSBjb25mLnZhbHVlcy5sZW5ndGg7XG4gICAgdmFyIHJhZGlhbnMgPSAyICogTWF0aC5QSSAvIHJhZGlpO1xuICAgIC8vIHZhciBjb2xvciA9IGQzLnNjYWxlLmNhdGVnb3J5MjBjKCk7XG4gICAgdmFyIHJlbmRlciA9IGZ1bmN0aW9uIChkaXYpIHtcblxuICAgIFx0dmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdChkaXYpO1xuXHRjb250YWluZXIuc2VsZWN0QWxsKFwiKlwiKS5yZW1vdmUoKTtcbiAgICBcdHJhZGl1cyA9IGNvbmYuZGlhZ29uYWwgLyAyO1xuXG5cdHZhciBzaXplU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuXHQgICAgLmRvbWFpbihbMCxjb25mLm1heF0pXG5cdCAgICAucmFuZ2UoWzAsIHJhZGl1c10pO1xuXHRcdFxuXHR2YXIgY29sb3JTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG5cdCAgICAuZG9tYWluKFswLGQzLmV4dGVudChjb25mLnZhbHVlcywgZnVuY3Rpb24oZCl7XG5cdFx0cmV0dXJuIGQudmFsdWVcblx0ICAgIH0pWzFdXSlcblx0ICAgIC8vLmRvbWFpbihbMCwgZDMuZXh0ZW50KGNvbmYudmFsdWVzKVsxXV0pXG5cdCAgICAvLy5yYW5nZShbXCIjM2U4YmFkXCIsIFwiIzk3NTI2OVwiXSk7XG5cdCAgICAucmFuZ2UoW1wiIzNlOGJhZFwiLCBcIiMzZThiYWRcIl0pO1xuXHR2YXIgYmFja2dyb3VuZENvbG9yID0gXCIjZjFmMWYxXCI7XG5cdFx0XG5cdHZhciBvcmlnaW4gPSBbfn4oY29uZi53aWR0aC8yKSwgfn4oY29uZi5oZWlnaHQvMildO1xuXHR2YXIgc3ZnID0gY29udGFpbmVyLmFwcGVuZChcInN2Z1wiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmRpYWdvbmFsKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgY29uZi5kaWFnb25hbClcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHJhZGl1cyArIFwiLFwiICsgcmFkaXVzICsgXCIpXCIpO1xuXG5cdHZhciBsYWJlbCA9IGZ1bmN0aW9uIChyLCBjdXJyTGFiZWwsIGhhc0RhdGEpIHtcblx0ICAgIHZhciByYWRzID0gciAqIDE4MCAvIE1hdGguUEk7XG5cdCAgICB2YXIgb2Zmc2V0ID0gMTU7XG5cdCAgICBzdmcuYXBwZW5kKFwidGV4dFwiKVxuXHRcdC5hdHRyKFwieFwiLCBvcmlnaW5bMF0pXG5cdFx0LmF0dHIoXCJ5XCIsIG9yaWdpblsxXSlcblx0XHQuYXR0cihcImZvbnQtc2l6ZVwiLCBjb25mLmZvbnRzaXplKVxuXHRcdC5hdHRyKFwiZm9udC13ZWlnaHRcIiwgXCJib2xkXCIpXG5cdFx0LmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgaWYgKGhhc0RhdGEpIHtcblx0XHRcdHJldHVybiBcIiMwMDBcIlxuXHRcdCAgICB9XG5cdFx0ICAgIHJldHVybiBcIiNjY2NcIjtcblx0XHR9KVxuXHRcdC5hdHRyKFwidGV4dC1hbmNob3JcIiwgKCFpc1JldmVyc2VkKHJhZHMpPyBcInN0YXJ0XCIgOiBcImVuZFwiKSlcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArICgwK01hdGguY29zKHIpKm9mZnNldCkgKyBcIixcIiArICgwK01hdGguc2luKHIpKm9mZnNldCkgKyBcIilyb3RhdGUoXCIgKyAocmFkcykgKyBcIilyb3RhdGUoXCIgKyAoIWlzUmV2ZXJzZWQocmFkcyk/MDoxODApICsgXCIpXCIpXG5cdFx0LnRleHQoY3VyckxhYmVsKTtcblxuXHQgICAgZnVuY3Rpb24gaXNSZXZlcnNlZCAoZCkge1xuXHRcdHJldHVybiAoZD45MCAmJiBkPDI3MCk7XG5cdCAgICB9XG5cdCAgICBcblx0fTtcblx0XG5cdHZhciBwZXRhbCA9IGZ1bmN0aW9uIChsLCByLCBkLCBjb2xvcikge1xuXHQgICAgdmFyIHggPSBsICogTWF0aC5jb3Mocik7XG5cdCAgICB2YXIgeSA9IGwgKiBNYXRoLnNpbihyKTtcblx0ICAgIC8vdmFyIHJhZHMgPSBNYXRoLmF0YW4yKDAteCwgMC15KSAqIDE4MCAvIE1hdGguUEk7XG5cdCAgICBcblx0ICAgIHZhciByZWFseCA9IGQgKiBNYXRoLmNvcyhyKTtcblx0ICAgIHZhciByZWFseSA9IGQgKiBNYXRoLnNpbihyKTtcblxuXHQgICAgdmFyIHJ4ID0gbCAqIDAuOCAqIE1hdGguY29zKHIrKHJhZGlhbnMvMikpO1xuXHQgICAgdmFyIHJ5ID0gbCAqIDAuOCAqIE1hdGguc2luKHIrKHJhZGlhbnMvMikpO1xuXHQgICAgdmFyIHJlYWxyeCA9IGQgKiAwLjggKiBNYXRoLmNvcyhyKyhyYWRpYW5zLzIpKTtcblx0ICAgIHZhciByZWFscnkgPSBkICogMC44ICogTWF0aC5zaW4ocisocmFkaWFucy8yKSk7XG5cblx0ICAgIHZhciBseCA9IGwgKiAwLjggKiBNYXRoLmNvcyhyLShyYWRpYW5zLzIpKTtcblx0ICAgIHZhciBseSA9IGwgKiAwLjggKiBNYXRoLnNpbihyLShyYWRpYW5zLzIpKTtcblx0ICAgIHZhciByZWFsbHggPSBkICogMC44ICogTWF0aC5jb3Moci0ocmFkaWFucy8yKSk7XG5cdCAgICB2YXIgcmVhbGx5ID0gZCAqIDAuOCAqIE1hdGguc2luKHItKHJhZGlhbnMvMikpO1xuXG5cdCAgICAvLyBzdmcuYXBwZW5kIChcImxpbmVcIilcblx0ICAgIC8vIFx0LmF0dHIoXCJjbGFzc1wiLCBcInN0aXRjaGVzXCIpXG5cdCAgICAvLyBcdC5hdHRyKFwieDFcIiwgb3JpZ2luWzBdKVxuXHQgICAgLy8gXHQuYXR0cihcInkxXCIsIG9yaWdpblsxXSlcblx0ICAgIC8vIFx0LmF0dHIoXCJ4MlwiLCBvcmlnaW5bMF0gKyB4KVxuXHQgICAgLy8gXHQuYXR0cihcInkyXCIsIG9yaWdpblsxXSArIHkpXG5cblx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG5cdCAgICAvLyBcdC5hdHRyKFwiY2xhc3NcIiwgXCJzdGl0Y2hlc1wiKVxuXHQgICAgLy8gXHQuYXR0cihcIngxXCIsIG9yaWdpblswXSlcblx0ICAgIC8vIFx0LmF0dHIoXCJ5MVwiLCBvcmlnaW5bMV0pXG5cdCAgICAvLyBcdC5hdHRyKFwieDJcIiwgb3JpZ2luWzBdICsgcngpXG5cdCAgICAvLyBcdC5hdHRyKFwieTJcIiwgb3JpZ2luWzFdICsgcnkpXG5cblx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG5cdCAgICAvLyBcdC5hdHRyKFwiY2xhc3NcIiwgXCJzdGl0Y2hlc1wiKVxuXHQgICAgLy8gXHQuYXR0cihcIngxXCIsIG9yaWdpblswXSArIHJ4KVxuXHQgICAgLy8gXHQuYXR0cihcInkxXCIsIG9yaWdpblsxXSArIHJ5KVxuXHQgICAgLy8gXHQuYXR0cihcIngyXCIsIG9yaWdpblswXSArIHgpXG5cdCAgICAvLyBcdC5hdHRyKFwieTJcIiwgb3JpZ2luWzFdICsgeSk7XG5cblx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG5cdCAgICAvLyBcdC5hdHRyKFwiY2xhc3NcIiwgXCJzdGl0Y2hlc1wiKVxuXHQgICAgLy8gXHQuYXR0cihcIngxXCIsIG9yaWdpblswXSlcblx0ICAgIC8vIFx0LmF0dHIoXCJ5MVwiLCBvcmlnaW5bMV0pXG5cdCAgICAvLyBcdC5hdHRyKFwieDJcIiwgb3JpZ2luWzBdICsgbHgpXG5cdCAgICAvLyBcdC5hdHRyKFwieTJcIiwgb3JpZ2luWzFdICsgbHkpXG5cblx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG5cdCAgICAvLyBcdC5hdHRyKFwiY2xhc3NcIiwgXCJzdGl0Y2hlc1wiKVxuXHQgICAgLy8gXHQuYXR0cihcIngxXCIsIG9yaWdpblswXSArIGx4KVxuXHQgICAgLy8gXHQuYXR0cihcInkxXCIsIG9yaWdpblsxXSArIGx5KVxuXHQgICAgLy8gXHQuYXR0cihcIngyXCIsIG9yaWdpblswXSArIHgpXG5cdCAgICAvLyBcdC5hdHRyKFwieTJcIiwgb3JpZ2luWzFdICsgeSk7XG5cblx0ICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuXHRcdC54KGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQueDt9KVxuXHRcdC55KGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQueTt9KVxuXHRcdC5pbnRlcnBvbGF0ZShcImJhc2lzXCIpO1xuXG5cdCAgICAvLyBtYXggcGV0YWwgc2l6ZSAoZG90dGVkKVxuXHQgICAgdmFyIGRhdGEgPSBbXG5cdFx0e3g6b3JpZ2luWzBdLCAgeTpvcmlnaW5bMV19LFxuXHRcdHt4Om9yaWdpblswXStyeCwgeTpvcmlnaW5bMV0rcnl9LFxuXHRcdHt4Om9yaWdpblswXSt4LCB5Om9yaWdpblswXSt5fSxcblx0XHR7eDpvcmlnaW5bMF0rbHgsIHk6b3JpZ2luWzBdK2x5fSxcblx0XHR7eDpvcmlnaW5bMF0sICB5Om9yaWdpblsxXX1cblx0ICAgIF07XG5cblx0ICAgIC8vIHJlYWwgcGV0YWwgc2l6ZVxuXHQgICAgdmFyIHJlYWxEYXRhID0gW1xuXHRcdHt4Om9yaWdpblswXSwgIHk6b3JpZ2luWzFdfSxcblx0XHR7eDpvcmlnaW5bMF0rcmVhbHJ4LCB5Om9yaWdpblsxXStyZWFscnl9LFxuXHRcdHt4Om9yaWdpblswXStyZWFseCwgeTpvcmlnaW5bMV0rcmVhbHl9LFxuXHRcdHt4Om9yaWdpblswXStyZWFsbHgsIHk6b3JpZ2luWzFdK3JlYWxseX0sXG5cdFx0e3g6b3JpZ2luWzBdLCAgeTpvcmlnaW5bMV19XG5cdCAgICBdO1xuXHQgICAgc3ZnLmFwcGVuZChcInBhdGhcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcblx0XHQuYXR0cihcImRcIiwgbGluZShkYXRhKSlcblx0XHQuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKCkge1xuXHRcdCAgICBpZiAoZD4wKSB7XG5cdFx0XHRyZXR1cm4gXCIjM2U4YmFkXCI7XG5cdFx0ICAgIH1cblx0XHQgICAgcmV0dXJuIFwiI2NjY1wiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgaWYgKGQ+MCkge1xuXHRcdFx0cmV0dXJuIFwiMC41cHhcIjtcblx0XHQgICAgfVxuXHRcdCAgICByZXR1cm4gXCIwLjI1cHhcIjtcblx0XHR9KVxuXG5cdCAgICBzdmcuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwZXRhbFwiKVxuXHRcdC5hdHRyKFwiZFwiLCBsaW5lKHJlYWxEYXRhKSlcblx0XHQuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKCkge3JldHVybiBjb2xvcn0pO1xuXHR9O1xuXG5cdHZhciBwZXRhbHMgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB2YXIgciA9IDA7XG5cdCAgICBjb25mLnZhbHVlcy5mb3JFYWNoIChmdW5jdGlvbiAoZCwgaSkge1xuXHRcdGlmIChkLmFjdGl2ZSA9PT0gZmFsc2UpIHtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICB2YXIgbCA9IHJhZGl1cztcblx0XHQgICAgcGV0YWwgKGwsIHIsIHNpemVTY2FsZShkLnZhbHVlKSwgY29sb3JTY2FsZShkLnZhbHVlKSk7XG5cdFx0fVxuXHRcdHIgKz0gcmFkaWFucztcblxuXHQgICAgfSk7XG5cdCAgICByID0gMDtcblx0ICAgIGNvbmYudmFsdWVzLmZvckVhY2ggKGZ1bmN0aW9uIChkLCBpKSB7XG5cdFx0aWYgKGQuYWN0aXZlID09PSBmYWxzZSkge1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHZhciBsID0gcmFkaXVzO1xuXHRcdCAgICBsYWJlbCAociwgZC5sYWJlbCwgZC52YWx1ZT4wKTtcblx0XHR9XG5cdFx0ciArPSByYWRpYW5zO1xuXHQgICAgfSk7XG5cdH07XG5cdHBldGFscygpO1xuICAgIH07XG5cbiAgICByZW5kZXIudmFsdWVzID0gZnVuY3Rpb24gKHZhbHMpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi52YWx1ZXM7XG5cdH1cblx0Y29uZi52YWx1ZXMgPSB2YWxzO1xuXHRyYWRpaSA9IHZhbHMubGVuZ3RoO1xuXHRyYWRpYW5zID0gMiAqIE1hdGguUEkgLyByYWRpaVxuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLmRpYWdvbmFsID0gZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5kaWFnb25hbDtcblx0fVxuXHRjb25mLmRpYWdvbmFsID0gZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5mb250c2l6ZSA9IGZ1bmN0aW9uIChmKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYuZm9udHNpemU7XG5cdH1cblx0Y29uZi5mb250c2l6ZSA9IGY7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHJlbmRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZsb3dlclZpZXc7XG4iXX0=
