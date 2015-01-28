var tree_node = require("tnt.tree.node");

var bubblesView = function () {
    "use strict";
    
    var conf = {
	diameter : 600,
	format : d3.format(",d"),
	color : d3.scale.category20c(),
	flat : true,
	colorPalette : true,
	data : undefined,
	key : "value",
	onclick : function () {}
    };

    var focus; // undef by default
    var view;
    var circle;
    
    // var diameter = elem[0].offsetWidth,
    //     format = d3.format(",d"),
    //     color = d3.scale.category20c(),
    //     isBubble = attrs.asBubble && attrs.asBubble.toLowerCase()==="true",
    //     useColorPalette = attrs.useColorPalette && attrs.useColorPalette.toLowerCase()==="true";


    /*
     * Render valid JSON data
     */ 
    var render = function(div) {
	var svg = d3.select(div)
	    .append("svg")
	    .attr("width", conf.diameter)
            .attr("height", conf.diameter);

	var pack = d3.layout.pack()
            .sort(null)
            .size([conf.diameter, conf.diameter])
            .padding(1.5);

	focus = conf.data;
	
        // remove all previous items before render
	// TODO: Not needed without updates!
        svg.selectAll('*').remove();
        // If we don't pass any data, return out of the element
        if (!conf.data) return;
	var nodes = svg.selectAll(".node")
            .data(
                function(){
                    if (conf.flat){
			conf.data = conf.data.flatten();
			return pack.nodes(conf.data.data()).filter(function(d) { return !d.children; });
			//return pack.nodes(conf.data.flatten().data()).filter(function(d) { return !d.children; });
                    } else {
                        return pack.nodes(conf.data.data());
                    }
                }()
            )
            .enter().append("g")
            .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	nodes
	    .on("click", conf.onclick);

        nodes.append("title")
            .text(function(d) { return d.name + ": " + conf.format(d.value); });

	// nodes = nodes.append("svg:a")
	//     .attr("xlink:href", function (d) {return "/app/#/associations?t=" + target + "&d=" + d.name;});
	
        circle = nodes.append ("circle");
        circle.attr ("r", function(d) { return d.r; });
        if (conf.flat){
            circle.style("fill", function(d) { return conf.color(conf.colorPalette ? d.name : d.parentName); });
        }
        nodes.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.name.substring(0, d.r / 3); });

	focusTo([conf.data.data().x, conf.data.data().y, conf.data.data().r*2]);
    };

    ////////////////////////
    // Auxiliar functions
    ////////////////////////
    
    function focusTo (v) {
	var k = conf.diameter / v[2];
	var offset = conf.diameter / 2;
	view = v;
	var node = d3.selectAll(".node");

	node.attr("transform", function(d) { return "translate(" + (((d.x - v[0]) * k) + offset) + "," + (((d.y - v[1]) * k) + offset) + ")"});
	circle.attr("r", function(d) { return d.r * k; });
    }

    //////////
    // API
    //////////
    render.focus = function (node) {
	if (!arguments.length) {
	    if (focus !== undefined) {
		return focus.data();
	    }
	    console.log("focus node is not (yet?) defined");
	    return;
	}
	focus = node;
	var transition = d3.transition()
	    .duration (700)
	    .tween ("zoom", function () {
		var i = d3.interpolateZoom (view, [focus.x, focus.y, focus.r*2]);
		return function (t) {
		    focusTo(i(t));
		};
	    });
    };
    
    render.data = function (newData) {
	if (!arguments.length) {
	    return conf.data;
	}
	conf.data = tree_node(newData);
	return this;
    };

    render.onclick = function (cbak) {
	if (!arguments.length) {
	    return conf.onclick;
	}
	conf.onclick = cbak;
	return this;
    };
    
    render.key = function (k) {
	if (!arguments.length) {
	    return conf.key;
	}
	conf.key = k;
	return this;
    };

    render.diameter = function (d) {
	if (!arguments.length) {
	    return conf.diameter;
	}
	conf.diameter = d;
	return this;
    };

    render.flat = function (bool) {
	if (!arguments.length) {
	    return conf.flat;
	}
	conf.flat = bool;
	return this;
    };
    
    return render;
};

module.exports = bubblesView;
