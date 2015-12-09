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
                .attr("class", "cttv_petal_label")
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
