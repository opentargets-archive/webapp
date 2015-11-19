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
        		return d.value;
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
            			return "#000";
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
        		});

    	    svg.append("path")
        		.attr("class", "petal")
        		.attr("d", line(realData))
        		.attr("fill", function () {
                    return color;
                });
    	};

    	var petals = function () {
    	    var r = 0;
    	    conf.values.forEach (function (d, i) {
        		if (d.active) {
        		    var l = radius;
        		    petal (l, r, sizeScale(d.value), colorScale(d.value));
        		}
        		r += radians;

    	    });
    	    r = 0;
    	    conf.values.forEach (function (d, i) {
        		if (d.active) {
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
    	radians = 2 * Math.PI / radii;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L2Zha2VfYjNmOGNmZi5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9mbG93ZXJWaWV3L2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2Zsb3dlclZpZXcvc3JjL2Zsb3dlclZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZsb3dlclZpZXcgPSByZXF1aXJlKFwiLi9zcmMvZmxvd2VyVmlldy5qc1wiKTtcbiIsInZhciBmbG93ZXJWaWV3ID0gZnVuY3Rpb24gKCkge1xuICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGNvbmYgPSB7XG4gICAgICAgIGRpYWdvbmFsIDogMTAwLFxuICAgIFx0dmFsdWVzIDogW10sXG4gICAgXHRmb250c2l6ZSA6IDEyLFxuICAgIFx0bWF4IDogMVxuICAgIH07XG5cbiAgICB2YXIgcmFkaXVzID0gY29uZi53aWR0aCAvIDI7XG4gICAgdmFyIHJhZGlpID0gY29uZi52YWx1ZXMubGVuZ3RoO1xuICAgIHZhciByYWRpYW5zID0gMiAqIE1hdGguUEkgLyByYWRpaTtcbiAgICAvLyB2YXIgY29sb3IgPSBkMy5zY2FsZS5jYXRlZ29yeTIwYygpO1xuICAgIHZhciByZW5kZXIgPSBmdW5jdGlvbiAoZGl2KSB7XG5cbiAgICBcdHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QoZGl2KTtcbiAgICBcdGNvbnRhaW5lci5zZWxlY3RBbGwoXCIqXCIpLnJlbW92ZSgpO1xuICAgIFx0cmFkaXVzID0gY29uZi5kaWFnb25hbCAvIDI7XG5cbiAgICBcdHZhciBzaXplU2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0ICAgIC5kb21haW4oWzAsY29uZi5tYXhdKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgcmFkaXVzXSk7XG5cbiAgICBcdHZhciBjb2xvclNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICBcdCAgICAuZG9tYWluKFswLGQzLmV4dGVudChjb25mLnZhbHVlcywgZnVuY3Rpb24oZCl7XG4gICAgICAgIFx0XHRyZXR1cm4gZC52YWx1ZTtcbiAgICBcdCAgICB9KVsxXV0pXG4gICAgXHQgICAgLy8uZG9tYWluKFswLCBkMy5leHRlbnQoY29uZi52YWx1ZXMpWzFdXSlcbiAgICBcdCAgICAvLy5yYW5nZShbXCIjM2U4YmFkXCIsIFwiIzk3NTI2OVwiXSk7XG4gICAgXHQgICAgLnJhbmdlKFtcIiMzZThiYWRcIiwgXCIjM2U4YmFkXCJdKTtcbiAgICBcdHZhciBiYWNrZ3JvdW5kQ29sb3IgPSBcIiNmMWYxZjFcIjtcblxuICAgIFx0dmFyIG9yaWdpbiA9IFt+fihjb25mLndpZHRoLzIpLCB+fihjb25mLmhlaWdodC8yKV07XG4gICAgXHR2YXIgc3ZnID0gY29udGFpbmVyLmFwcGVuZChcInN2Z1wiKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZi5kaWFnb25hbClcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmRpYWdvbmFsKVxuICAgIFx0ICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyByYWRpdXMgKyBcIixcIiArIHJhZGl1cyArIFwiKVwiKTtcblxuICAgIFx0dmFyIGxhYmVsID0gZnVuY3Rpb24gKHIsIGN1cnJMYWJlbCwgaGFzRGF0YSkge1xuICAgICAgICBcdCAgICB2YXIgcmFkcyA9IHIgKiAxODAgLyBNYXRoLlBJO1xuICAgICAgICBcdCAgICB2YXIgb2Zmc2V0ID0gMTU7XG4gICAgICAgIFx0ICAgIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIFx0XHQuYXR0cihcInhcIiwgb3JpZ2luWzBdKVxuICAgICAgICBcdFx0LmF0dHIoXCJ5XCIsIG9yaWdpblsxXSlcbiAgICAgICAgXHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIGNvbmYuZm9udHNpemUpXG4gICAgICAgIFx0XHQuYXR0cihcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgICBcdFx0LmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXHRcdCAgICBpZiAoaGFzRGF0YSkge1xuICAgICAgICAgICAgXHRcdFx0cmV0dXJuIFwiIzAwMFwiO1xuICAgICAgICBcdFx0ICAgIH1cbiAgICAgICAgXHRcdCAgICByZXR1cm4gXCIjY2NjXCI7XG4gICAgICAgIFx0XHR9KVxuICAgICAgICBcdFx0LmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCAoIWlzUmV2ZXJzZWQocmFkcyk/IFwic3RhcnRcIiA6IFwiZW5kXCIpKVxuICAgICAgICBcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAoMCtNYXRoLmNvcyhyKSpvZmZzZXQpICsgXCIsXCIgKyAoMCtNYXRoLnNpbihyKSpvZmZzZXQpICsgXCIpcm90YXRlKFwiICsgKHJhZHMpICsgXCIpcm90YXRlKFwiICsgKCFpc1JldmVyc2VkKHJhZHMpPzA6MTgwKSArIFwiKVwiKVxuICAgICAgICBcdFx0LnRleHQoY3VyckxhYmVsKTtcblxuICAgICAgICBcdCAgICBmdW5jdGlvbiBpc1JldmVyc2VkIChkKSB7XG4gICAgICAgICAgICBcdFx0cmV0dXJuIChkPjkwICYmIGQ8MjcwKTtcbiAgICAgICAgXHQgICAgfVxuXG4gICAgXHR9O1xuXG4gICAgXHR2YXIgcGV0YWwgPSBmdW5jdGlvbiAobCwgciwgZCwgY29sb3IpIHtcbiAgICBcdCAgICB2YXIgeCA9IGwgKiBNYXRoLmNvcyhyKTtcbiAgICBcdCAgICB2YXIgeSA9IGwgKiBNYXRoLnNpbihyKTtcbiAgICBcdCAgICAvL3ZhciByYWRzID0gTWF0aC5hdGFuMigwLXgsIDAteSkgKiAxODAgLyBNYXRoLlBJO1xuXG4gICAgXHQgICAgdmFyIHJlYWx4ID0gZCAqIE1hdGguY29zKHIpO1xuICAgIFx0ICAgIHZhciByZWFseSA9IGQgKiBNYXRoLnNpbihyKTtcblxuICAgIFx0ICAgIHZhciByeCA9IGwgKiAwLjggKiBNYXRoLmNvcyhyKyhyYWRpYW5zLzIpKTtcbiAgICBcdCAgICB2YXIgcnkgPSBsICogMC44ICogTWF0aC5zaW4ocisocmFkaWFucy8yKSk7XG4gICAgXHQgICAgdmFyIHJlYWxyeCA9IGQgKiAwLjggKiBNYXRoLmNvcyhyKyhyYWRpYW5zLzIpKTtcbiAgICBcdCAgICB2YXIgcmVhbHJ5ID0gZCAqIDAuOCAqIE1hdGguc2luKHIrKHJhZGlhbnMvMikpO1xuXG4gICAgXHQgICAgdmFyIGx4ID0gbCAqIDAuOCAqIE1hdGguY29zKHItKHJhZGlhbnMvMikpO1xuICAgIFx0ICAgIHZhciBseSA9IGwgKiAwLjggKiBNYXRoLnNpbihyLShyYWRpYW5zLzIpKTtcbiAgICBcdCAgICB2YXIgcmVhbGx4ID0gZCAqIDAuOCAqIE1hdGguY29zKHItKHJhZGlhbnMvMikpO1xuICAgIFx0ICAgIHZhciByZWFsbHkgPSBkICogMC44ICogTWF0aC5zaW4oci0ocmFkaWFucy8yKSk7XG5cbiAgICBcdCAgICAvLyBzdmcuYXBwZW5kIChcImxpbmVcIilcbiAgICBcdCAgICAvLyBcdC5hdHRyKFwiY2xhc3NcIiwgXCJzdGl0Y2hlc1wiKVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ4MVwiLCBvcmlnaW5bMF0pXG4gICAgXHQgICAgLy8gXHQuYXR0cihcInkxXCIsIG9yaWdpblsxXSlcbiAgICBcdCAgICAvLyBcdC5hdHRyKFwieDJcIiwgb3JpZ2luWzBdICsgeClcbiAgICBcdCAgICAvLyBcdC5hdHRyKFwieTJcIiwgb3JpZ2luWzFdICsgeSlcblxuICAgIFx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcbiAgICBcdCAgICAvLyBcdC5hdHRyKFwieDFcIiwgb3JpZ2luWzBdKVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ5MVwiLCBvcmlnaW5bMV0pXG4gICAgXHQgICAgLy8gXHQuYXR0cihcIngyXCIsIG9yaWdpblswXSArIHJ4KVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ5MlwiLCBvcmlnaW5bMV0gKyByeSlcblxuICAgIFx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcbiAgICBcdCAgICAvLyBcdC5hdHRyKFwieDFcIiwgb3JpZ2luWzBdICsgcngpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcInkxXCIsIG9yaWdpblsxXSArIHJ5KVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ4MlwiLCBvcmlnaW5bMF0gKyB4KVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ5MlwiLCBvcmlnaW5bMV0gKyB5KTtcblxuICAgIFx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcbiAgICBcdCAgICAvLyBcdC5hdHRyKFwieDFcIiwgb3JpZ2luWzBdKVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ5MVwiLCBvcmlnaW5bMV0pXG4gICAgXHQgICAgLy8gXHQuYXR0cihcIngyXCIsIG9yaWdpblswXSArIGx4KVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ5MlwiLCBvcmlnaW5bMV0gKyBseSlcblxuICAgIFx0ICAgIC8vIHN2Zy5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcImNsYXNzXCIsIFwic3RpdGNoZXNcIilcbiAgICBcdCAgICAvLyBcdC5hdHRyKFwieDFcIiwgb3JpZ2luWzBdICsgbHgpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcInkxXCIsIG9yaWdpblsxXSArIGx5KVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ4MlwiLCBvcmlnaW5bMF0gKyB4KVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ5MlwiLCBvcmlnaW5bMV0gKyB5KTtcblxuICAgIFx0ICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgICBcdFx0LngoZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC54O30pXG4gICAgICAgIFx0XHQueShmdW5jdGlvbiAoZCkge3JldHVybiBkLnk7fSlcbiAgICAgICAgXHRcdC5pbnRlcnBvbGF0ZShcImJhc2lzXCIpO1xuXG4gICAgXHQgICAgLy8gbWF4IHBldGFsIHNpemUgKGRvdHRlZClcbiAgICBcdCAgICB2YXIgZGF0YSA9IFtcbiAgICAgICAgXHRcdHt4Om9yaWdpblswXSwgIHk6b3JpZ2luWzFdfSxcbiAgICAgICAgXHRcdHt4Om9yaWdpblswXStyeCwgeTpvcmlnaW5bMV0rcnl9LFxuICAgICAgICBcdFx0e3g6b3JpZ2luWzBdK3gsIHk6b3JpZ2luWzBdK3l9LFxuICAgICAgICBcdFx0e3g6b3JpZ2luWzBdK2x4LCB5Om9yaWdpblswXStseX0sXG4gICAgICAgIFx0XHR7eDpvcmlnaW5bMF0sICB5Om9yaWdpblsxXX1cbiAgICBcdCAgICBdO1xuXG4gICAgXHQgICAgLy8gcmVhbCBwZXRhbCBzaXplXG4gICAgXHQgICAgdmFyIHJlYWxEYXRhID0gW1xuICAgICAgICBcdFx0e3g6b3JpZ2luWzBdLCAgeTpvcmlnaW5bMV19LFxuICAgICAgICBcdFx0e3g6b3JpZ2luWzBdK3JlYWxyeCwgeTpvcmlnaW5bMV0rcmVhbHJ5fSxcbiAgICAgICAgXHRcdHt4Om9yaWdpblswXStyZWFseCwgeTpvcmlnaW5bMV0rcmVhbHl9LFxuICAgICAgICBcdFx0e3g6b3JpZ2luWzBdK3JlYWxseCwgeTpvcmlnaW5bMV0rcmVhbGx5fSxcbiAgICAgICAgXHRcdHt4Om9yaWdpblswXSwgIHk6b3JpZ2luWzFdfVxuICAgIFx0ICAgIF07XG4gICAgXHQgICAgc3ZnLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJzdGl0Y2hlc1wiKVxuICAgICAgICBcdFx0LmF0dHIoXCJkXCIsIGxpbmUoZGF0YSkpXG4gICAgICAgIFx0XHQuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBcdFx0ICAgIGlmIChkPjApIHtcbiAgICAgICAgICAgIFx0XHRcdHJldHVybiBcIiMzZThiYWRcIjtcbiAgICAgICAgXHRcdCAgICB9XG4gICAgICAgICAgICBcdFx0cmV0dXJuIFwiI2NjY1wiO1xuICAgICAgICBcdFx0fSlcbiAgICAgICAgXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFx0XHQgICAgaWYgKGQ+MCkge1xuICAgICAgICAgICAgXHRcdFx0cmV0dXJuIFwiMC41cHhcIjtcbiAgICAgICAgXHRcdCAgICB9XG4gICAgICAgICAgICBcdFx0cmV0dXJuIFwiMC4yNXB4XCI7XG4gICAgICAgIFx0XHR9KTtcblxuICAgIFx0ICAgIHN2Zy5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIFx0XHQuYXR0cihcImNsYXNzXCIsIFwicGV0YWxcIilcbiAgICAgICAgXHRcdC5hdHRyKFwiZFwiLCBsaW5lKHJlYWxEYXRhKSlcbiAgICAgICAgXHRcdC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xvcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICBcdH07XG5cbiAgICBcdHZhciBwZXRhbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHQgICAgdmFyIHIgPSAwO1xuICAgIFx0ICAgIGNvbmYudmFsdWVzLmZvckVhY2ggKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIFx0XHRpZiAoZC5hY3RpdmUpIHtcbiAgICAgICAgXHRcdCAgICB2YXIgbCA9IHJhZGl1cztcbiAgICAgICAgXHRcdCAgICBwZXRhbCAobCwgciwgc2l6ZVNjYWxlKGQudmFsdWUpLCBjb2xvclNjYWxlKGQudmFsdWUpKTtcbiAgICAgICAgXHRcdH1cbiAgICAgICAgXHRcdHIgKz0gcmFkaWFucztcblxuICAgIFx0ICAgIH0pO1xuICAgIFx0ICAgIHIgPSAwO1xuICAgIFx0ICAgIGNvbmYudmFsdWVzLmZvckVhY2ggKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIFx0XHRpZiAoZC5hY3RpdmUpIHtcbiAgICAgICAgXHRcdCAgICB2YXIgbCA9IHJhZGl1cztcbiAgICAgICAgXHRcdCAgICBsYWJlbCAociwgZC5sYWJlbCwgZC52YWx1ZT4wKTtcbiAgICAgICAgXHRcdH1cbiAgICAgICAgXHRcdHIgKz0gcmFkaWFucztcbiAgICBcdCAgICB9KTtcbiAgICBcdH07XG5cbiAgICAgICAgcGV0YWxzKCk7XG4gICAgfTtcblxuICAgIHJlbmRlci52YWx1ZXMgPSBmdW5jdGlvbiAodmFscykge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIGNvbmYudmFsdWVzO1xuICAgIFx0fVxuICAgIFx0Y29uZi52YWx1ZXMgPSB2YWxzO1xuICAgIFx0cmFkaWkgPSB2YWxzLmxlbmd0aDtcbiAgICBcdHJhZGlhbnMgPSAyICogTWF0aC5QSSAvIHJhZGlpO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5kaWFnb25hbCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY29uZi5kaWFnb25hbDtcbiAgICBcdH1cbiAgICBcdGNvbmYuZGlhZ29uYWwgPSBkO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5mb250c2l6ZSA9IGZ1bmN0aW9uIChmKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY29uZi5mb250c2l6ZTtcbiAgICBcdH1cbiAgICBcdGNvbmYuZm9udHNpemUgPSBmO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiByZW5kZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBmbG93ZXJWaWV3O1xuIl19
