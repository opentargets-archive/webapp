var tooltip = require("tnt.tooltip");

var geneAssociations = function () {
    var config = {
	target : ""
    };
    var _ = function (bubblesView, div) {
    
	var menu = d3.select(div)
	    .append("div");
	
	// Zoom Select
	var zoomSelect = menu
	    .append("span")
	    .attr("class", "cttvGA_toplevelSelect")
	    .text("Zoom: ")
	    .append("select")
	    .on("change", function () {
		//var node = tree.find_node_by_name(this.value);
		var n = this.value;
		if (n === "Root") {
		    bubblesView.focus(tree);
		    bubblesView.select(tree);
		    return;
		}
		var nodes = tree.find_all(function (node) {
		    return node.property("key") === n;
		});
		var lca;
		if (nodes.length > 1) {
		    lca = tree.lca(nodes);
		} else {
		    lca = nodes[0].parent();
		}
		bubblesView.focus(lca);
		bubblesView.select(nodes);
	    });

	zoomSelect
	    .append("option")
	    .attr("selected", 1)
	    .attr("value","Root")
	    .text("None");
	
	// // Highlight Select
	// var highlightSelect = menu
	//     .append("span")
	//     .attr("class", "cttvGA_toplevelSelect")
	//     .text("Highlight")
	//     .append("select")
	//     .on("change", function () {
	// 	var n = this.value;
	// 	var nodes = tree.find_all(function (node) {
	// 	    return node.property("key") === n;
	// 	});
	// 	bubblesView.select(nodes);
	//     });
	// highlightSelect
	//     .append("option")
	//     .attr("value", "none")
	//     .attr("selected", 1)
	//     .text("None");

	// // Switch between different structures
	// Structure Select
	// var structureSelect = menu
	//     .append("span")
	//     .text("Structure")
	//     .append("select")
	//     .on("change", function () {
	// 	var n = this.value;
	// 	switch (n) {
	// 	case "EFO" :
	// 	    //bubblesView.data(data1);
	// 	    //bubblesView.update();
	// 	    break;
	// 	case "Simplified" :
	// 	    //bubblesView.data(data2);
	// 	    //bubblesView.update();
	// 	    break;
	// 	}
	//     });
	// structureSelect
	//     .append("option")
	//     .attr("value", "EFO")
	//     .attr("selected", 1)
	//     .text("EFO");
	// structureSelect
	//     .append("option")
	//     .attr("value", "Simplified")
	//     .text("Simplified EFO");
	
	var tree = bubblesView.data();
	tree.apply (function (node) {
	    if (node.is_leaf()) {
		zoomSelect.append("option")
		    .attr("value", node.property("key"))
		    .text(node.property("key"));
	    }
	    // highlightSelect.append("option")
	    // 	.attr("value", node.property("key"))
	    // 	.text(node.property("key"));
	});

	// Tooltips
	var bubble_tooltip = function (node) {
	    var obj = {};
	    obj.header = "Name: " + node.property("key");
	    obj.rows = [];
	    obj.rows.push({
		"label" : "EFO",
		"value" : "<a target='_blank' href='http://www.ebi.ac.uk/efo/" + node.property("key")  + "'>" + node.property("key")  + "</a>"
	    });
	    obj.rows.push({
		"label" : "Evidence count",
		"value" : node.property("value")
	    });
	    obj.rows.push({
		"label" : "Depth",
		"value" : node.property("depth")
	    });
	    if (node.property("focused") === 1) {
		obj.rows.push({
		    "label" : "Action",
		    "value" : "release focus",
		    "obj" : node,
		    "link" : function (node) {
			node.property("focused", undefined);
			bubblesView.focus(tree);
		    }
		});
	    } else {
		obj.rows.push({
		    "label" : "Action",
		    "value" : "focus",
		    "obj" : node,
		    "link" : function (node) {
			tree.apply( function (n) {
			    n.property("focused", undefined);
			});
			node.property("focused", 1);
			bubblesView.focus(node);
		    }
		})
	    };
	    obj.rows.push({
		"label" : "Action",
		"value" : "View evidence",
		"obj" : node,
		"link" : function (node) {
		    window.location.href="/app/#/gene-disease?t=" + config.target + "&d=" + node.property("key");
		}
	    });
	    tooltip.table()
	        .id(node.id())
	        .width(180)
	        .call (this, obj);
	};
	bubblesView
	    .onclick (bubble_tooltip);
	    //.onclick (function (d) {bView.focus(bView.node(d))})
	// Render
	bubblesView(div);
    };

    _.target = function (t) {
	if (!arguments.length) {
	    return config.target;
	}
	config.target = t;
	return this;
    };
    
    return _;
};

module.exports = geneAssociations;
