var tooltip = require("tnt.tooltip");

var geneAssociations = function () {
    var config = {
	target : ""
    };

    // TODO: Move to cttvApi
    // This code is duplicated several times now (controllers, directives and components)
    function lookDatasource (arr, dsName) {
    	for (var i=0; i<arr.length; i++) {
    	    var ds = arr[i];
    	    if (ds.datatype === dsName) {
    		return {
    		    "count": ds.evidence_count,
    		    "score": ds.association_score
    		};
    	    }
    	}
    	return {
    	    "count": 0,
    	    "score": 0
    	};
    }
    
    var _ = function (bubblesView, div, flower) {
    
	var menu = d3.select(div)
	    .append("div");
	
	// Zoom Select
	// var zoomSelect = menu
	//     .append("span")
	//     .attr("class", "cttvGA_toplevelSelect")
	//     .text("Find: ")
	//     .append("select")
	//     .on("change", function () {
	// 	var n = this.value;
	// 	if (n === "Root") {
	// 	    bubblesView.focus(tree);
	// 	    bubblesView.select(tree);
	// 	    return;
	// 	}
	// 	var nodes = tree.find_all(function (node) {
	// 	    return node.property("efo_code") === n;
	// 	});
	// 	var lca;
	// 	if (nodes.length > 1) {
	// 	    lca = tree.lca(nodes);
	// 	} else {
	// 	    lca = nodes[0].parent();
	// 	}
	// 	bubblesView.focus(lca);
	// 	bubblesView.select(nodes);
	//     });

	// zoomSelect
	//     .append("option")
	//     .attr("selected", 1)
	//     .attr("value","Root")
	//     .text("None");
	
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
	// tree.apply (function (node) {
	//     if (node.is_leaf() && (node.property("label") !== undefined)) {
	// 	zoomSelect.append("option")
	// 	    .attr("value", node.property("efo_code"))
	// 	    .text(node.property("label"));
	//     }
	    // highlightSelect.append("option")
	    // 	.attr("value", node.property("key"))
	    // 	.text(node.property("key"));
    //});

	// Tooltips
	var bubble_tooltip = function (node) {
	    // toplevel root is not shown in the bubbles view
	    if (node.parent() === undefined) {
		return;
	    }

	    var obj = {};
	    // Tooltip for the leaves
	    if (node.is_leaf()) {
		// tooltip is for a disease
		var score = node.property("association_score");
		obj.header = node.property("label") + " (Association Score: " + score + ")";
		var loc = "#/gene-disease?t=" + config.target + "&d=" + node.property("efo_code");
		obj.body="<div></div><a href=" + loc + ">View details</a>";

		var leafTooltip = tooltip.plain()
		    .id(1)
		    .width(180);

		//Hijack of the fill callback
		var tableFill = leafTooltip.fill();

		//Pass a new fill callback that calls the original one and decorates with flowers
		leafTooltip.fill(function (data) {
		    tableFill.call(this, data);
		    var datatypes = node.property("datatypes");
		    var flowerData = [
			{"value":lookDatasource(datatypes, "genetic_association").score,  "label":"Genetics"},
			{"value":lookDatasource(datatypes, "somatic_mutation").score,  "label":"Somatic"},
			{"value":lookDatasource(datatypes, "known_drug").score,  "label":"Drugs"},
			{"value":lookDatasource(datatypes, "rna_expression").score,  "label":"RNA"},
			{"value":lookDatasource(datatypes, "affected_pathway").score,  "label":"Pathways"},
			{"value":lookDatasource(datatypes, "animal_model").score,  "label":"Models"}
		    ];
		    flower.values(flowerData)(this.select("div").node());
		});
		
		leafTooltip.call(this, obj);

	    } else {
		// tooltip is for a therapeutic area
		obj.header = node.property("label");
		obj.rows = [];
		obj.rows.push({
		    "label" : "Score",
		    "value" : node.property("association_score")
		});
		// obj.rows.push({
		//     "label" : "Evidence count",
		//     "value" : Math.round(node.property("evidence_count"), 2)
		// });

		// if (node.property("focused") === 1) {
		//     obj.rows.push({
		// 	"label" : "Action",
		// 	"value" : "Zoom Out",
		// 	"obj" : node,
		// 	"link" : function (node) {
		// 	    node.property("focused", undefined);
		// 	    bubblesView.focus(tree);
		// 	}
		//     });
		// } else {
		//     obj.rows.push({
		// 	"label" : "Action",
		// 	"value" : "Zoom In",
		// 	"obj" : node,
		// 	"link" : function (node) {
		// 	    tree.apply( function (n) {
		// 		n.property("focused", undefined);
		// 	    });
		// 	    node.property("focused", 1);
		// 	    bubblesView.focus(node);
		// 	}
		//     });
		// }
		tooltip.table()
	            .id(2)
	            .width(180)
	            .call (this, obj);
	    }
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
