var bubblesView = function () {

    var key = function (o) {
	return o["biological_object.efo_info.efo_label"];
    };
    
    var conf = {
	width : 800,
	height : 300,
	format : d3.format(",d"),
	color : d3.scale.category20c(),
	flat : true,
	colorPalette : true,
	data : undefined,
	key : key,
	onclick : function () {}
    };
    target = undefined;
    
    // var diameter = elem[0].offsetWidth,
    //     format = d3.format(",d"),
    //     color = d3.scale.category20c(),
    //     isBubble = attrs.asBubble && attrs.asBubble.toLowerCase()==="true",
    //     useColorPalette = attrs.useColorPalette && attrs.useColorPalette.toLowerCase()==="true";

    // processData aggregates evidence by EFO id
    // TODO: This function may change once we have a final version of the API. In the meantime, counts are processed here
    function processData (data) {
	var d = {};
	for (var i=0; i<data.length; i++) {
	    //var efo_label = data[i]["biological_object.efo_info.efo_label"];
	    var label = conf.key(data[i]);
	    if (d[label] === undefined) {
		d[label] = 1;
	    } else {
		d[label]++;
	    }
	}

	var o = {name: "Root", children: []};
	for (var j in d) {
	    o.children.push ( {"name":j, "value":d[j]} );
	}
	return o;
    }
    
    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function getFlatData(root) {
        var leaves = [];

        function recurse(name, node) {
            if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
            else leaves.push({parentName: name || node.name, name: node.name, value: node.value});
        }

        recurse(null, root);
        return {children: leaves};
    }

    /*
     * Render valid JSON data
     */ 
    var render = function(div) {
	var svg = d3.select(div)
	    .append("svg")
	    .attr("width", conf.width)
            .attr("height", conf.height);

	var pack = d3.layout.pack()
            .sort(null)
            .size([conf.width, conf.height])
            .padding(1.5);

	var data = processData(conf.data);
	
        // remove all previous items before render
	// TODO: Not needed without updates!
        svg.selectAll('*').remove();
        // If we don't pass any data, return out of the element
        if (!data) return;
	var nodes = svg.selectAll(".node")
            .data(
                function(){
                    if (conf.flat){
                        return pack.nodes(getFlatData(data)).filter(function(d) { return !d.children; });
                    } else {
                        return pack.nodes(data);
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
		
        var circle = nodes.append ("circle");
        circle.attr ("r", function(d) { return d.r; });
        if (conf.flat){
            circle.style("fill", function(d) { return conf.color(conf.colorPalette ? d.name : d.parentName); });
        }
        nodes.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.name.substring(0, d.r / 3) });
    };

    render.data = function (newData) {
	if (!arguments.length) {
	    return conf.data;
	}
	//target = newData.data[0]["biological_subject.gene_info.gene_name"];
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
    
    render.key = function (k) {
	if (!arguments.length) {
	    return conf.key;
	}
	conf.key = k;
	return this;
    };
    
    render.height = function (h) {
	if (!arguments.length) {
	    return conf.height;
	}
	conf.height = h;
	return this;
    };

    render.width = function (w) {
	if (!arguments.length) {
	    return conf.width;
	}
	conf.width = w;
	return this;
    };
    
    return render;
};

module.exports = bubblesView;
