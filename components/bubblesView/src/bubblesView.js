var tree_node = require("tnt.tree.node");

var bubblesView = function () {
    "use strict";
    
    var conf = {
	diameter : 600,
	format : d3.format(",d"),
	color : d3.scale.category20c(),
	// flat : true,
	colorPalette : true,
	data : undefined,
	value : "value",
	key : "name",
	divId : undefined,
	onclick : function () {},
	duration: 1000
    };

    var focus; // undef by default
    var highlight; // undef by default
    var view;
    var svg;
    var pack;
    var nodes;
    var circle;

    var currTranslate = [0,0];
    var currScale = 1;
    var zoom = d3.behavior.zoom()
	.scaleExtent([0.8, Infinity])
	.on("zoom", function () {
	    redraw(svg);
	});
    
    /*
     * Render valid JSON data
     */ 
    var render = function(div) {
	conf.divId = d3.select(div).attr("id");
	svg = d3.select(div)
	    .append("svg")
	    .attr("width", conf.diameter)
            .attr("height", conf.diameter)
	    // .attr("pointer-events", "all")
	    .append("g")
	    .call(zoom)
	    // .call(d3.behavior.zoom()
	    // 	  .scaleExtent([0.8, Infinity])
	    // 	  .on("zoom", function() { redraw(svg); })
	    // 	 )
	    .append("g");

	pack = d3.layout.pack()
	    .value(function (d) {
		return d[conf.value];
	    })
            .sort(null)
            .size([conf.diameter, conf.diameter])
            .padding(1.5);

	render.update();
	return render;
    };

    render.update = function () {
	focus = conf.data;
	
        // If we don't pass any data, return out of the element
        if (!conf.data) return;
	var packData = pack.nodes(conf.data.data());
	// if (conf.flat){
	//     conf.data = conf.data.flatten();
	//     return pack.nodes(conf.data.data()).filter(function(d) { return !d.children; });
	// 		//return pack.nodes(conf.data.flatten().data()).filter(function(d) { return !d.children; });
        //             } else {
        //                 return pack.nodes(conf.data.data());
        //             }
	var nodes = svg.selectAll(".node")
        //.data(packData, function (d) {return d[conf.key]});
	    .data(packData, function (d) {
		return d._id;
	    });

	// Entering nodes
	var newNodes = nodes
            .enter()
	    .append("g")
	    .on("click", function (d) {
		if (d3.event.defaultPrevented) {
		    return;
		}
		conf.onclick.call(this, tree_node(d));
	    });

	newNodes
	    .append("title")
            .text(function(d) { return d[conf.key] + ": " + conf.format(d[conf.value]); });	
	
        newNodes.append ("circle");
	
	// if (conf.flat){
	    // TODO: circle is not yet defined here
//            circle.style("fill", function(d) { return conf.color(conf.colorPalette ? d.name : d.parentName); });
        // }

        newNodes.append("text");

	// Moving nodes
	nodes
	    .attr("class", "node")
	    .classed ("leaf", function (d) {
		return !d.children;
	    })
	    .classed ("root", function (d) {
		return !d._parent;
	    })
	    // .attr("class", function(d) {
	    // 	return d.children ? "node" : "leaf node";
	    // })
	    .transition()
	    .duration(conf.duration)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	nodes.select("text")
	    .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d[conf.key].substring(0, d.r / 3); });
	
        nodes.select("circle")
	    .attr ("class", function (d) {
	    	return "bubblesView_" + d[conf.key] + "_" + conf.divId;
	    })
	    .transition()
	    .duration(conf.duration)
	    .attr ("r", function(d) {
		return d.r;
	    });

	circle = nodes.selectAll("circle");

	// Exiting nodes
	nodes
	    .exit()
	    .remove();


	var d = conf.data.data();
	view = [d.x, d.y, d.r*2];
	//focusTo([d.x, d.y, d.r*2]);
	focus (conf.data);
    };

    ////////////////////////
    // Auxiliar functions //
    ////////////////////////

    function redraw (viz) {
	viz.attr ("transform",
		   "translate (" + d3.event.translate + ") " +
		  "scale (" + d3.event.scale + ")");
	// var node = d3.selectAll(".node");
	// node
	//     .attr("transform", function (d) {
	// 	return "translate(" + 
	//     })
    }
    
    function focusTo (v) {
	var k = conf.diameter / v[2];
	var offset = conf.diameter / 2;
	view = v;
	var node = d3.selectAll(".node");

	node
	    .attr("transform", function(d) {
		return "translate(" + (((d.x - v[0]) * k) + offset) + "," + (((d.y - v[1]) * k) + offset) + ")";
	    });
	circle
	    .attr("r", function(d) { return d.r * k; });
    }

    //////////
    // API  //
    //////////

    render.select = function (nodes) {
	if (!arguments.length) {
	    return highlight;
	}
	highlight = nodes;

	// Unhighlight everything
	d3.selectAll(".highlight")
	    .classed("highlight", false);

	// No node to highlight
	if ((nodes === null) || (nodes === undefined) || (nodes.length === 0)) {
	    return this;
	}

	for (var i=0; i<nodes.length; i++) {
	    var node = nodes[i];

	    var circle = d3.selectAll(".bubblesView_" + node.property(conf.key) + "_" + conf.divId);
	    circle
		.classed ("highlight", true);
	}
	return this;
    };
    
    render.focus = function (node) {
	if (!arguments.length) {
	    return focus;
	}
	svg.transition()
	    .duration(conf.duration)
	    .attr("transform",
		  "translate (0,0)scale (1)");
	zoom.translate([0,0]);
	
	focus = node;
	var focusData = focus.data();
	var transition = d3.transition()
	    .duration (conf.duration)
	    .tween ("zoom", function () {
		var i = d3.interpolateZoom (view, [focusData.x, focusData.y, focusData.r*2]);
		return function (t) {
		    focusTo(i(t));
		};
	    });
	return this;
    };
    
    render.data = function (newData) {
	if (!arguments.length) {
	    return conf.data;
	}
	conf.data = newData;
	return this;
    };

    render.onclick = function (cbak) {
	if (!arguments.length) {
	    return conf.onclick;
	}
	conf.onclick = cbak;
	return this;
    };
    
    render.key = function (n) {
	if (!arguments.length) {
	    return conf.key;
	}
	conf.key = n;
	return this;
    };

    render.value = function (v) {
	if (!arguments.length) {
	    return conf.value;
	}
	conf.value = v;
	return this;
    };

    render.diameter = function (d) {
	if (!arguments.length) {
	    return conf.diameter;
	}
	conf.diameter = d;
	return this;
    };

    // render.flat = function (bool) {
    // 	if (!arguments.length) {
    // 	    return conf.flat;
    // 	}
    // 	conf.flat = bool;
    // 	return this;
    // };

    render.node = tree_node;
    
    return render;
};

bubblesView.node = tree_node;
module.exports = bubblesView;
