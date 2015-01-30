var tooltip = require("tnt.tooltip");

var geneAssociations = function () {

    var _ = function (bubblesView, div) {

	var menu = d3.select(div)
	    .append("div");
	
	// Zoom Select
	var zoomSelect = menu
	    .append("span")
	    .text("Zoom: ")
	    .append("select")
	    .on("change", function () {
		//var node = tree.find_node_by_name(this.value);
		var n = this.value;
		var nodes = tree.find_all(function (node) {
		    return node.property("key") === n;
		});
		var lca = tree.lca(nodes);
		bubblesView.focus(lca);
	    });

	// Highlight Select
	var highlightSelect = menu
	    .append("span")
	    .text("Highlight")
	    .append("select")
	    .on("change", function () {
		var n = this.value;
		var nodes = tree.find_all(function (node) {
		    return node.property("key") === n;
		});
		bubblesView.select(nodes);
	    });
	highlightSelect
	    .append("option")
	    .attr("value", "none")
	    .attr("selected", 1)
	    .text("None");

	// Structure Select
	var structureSelect = menu
	    .append("span")
	    .text("Structure")
	    .append("select")
	    .on("change", function () {
		var n = this.value;
		switch (n) {
		case "EFO" :
		    bubblesView.data(data1);
		    bubblesView.update();
		    break;
		case "Simplified" :
		    bubblesView.data(data2);
		    bubblesView.update();
		    break;
		}
	    });
	structureSelect
	    .append("option")
	    .attr("value", "EFO")
	    .attr("selected", 1)
	    .text("EFO");
	structureSelect
	    .append("option")
	    .attr("value", "Simplified")
	    .text("Simplified EFO");
	
	var tree = bubblesView.node(bubblesView.data());
	tree.apply (function (node) {
	    console.log(node.data());
	    console.log(node.property("key"));
	    // if (!node.is_leaf()) {
		zoomSelect.append("option")
		    .attr("value", node.property("key"))
		    .text(node.property("key"));
	    // }
	    highlightSelect.append("option")
		.attr("value", node.property("key"))
		.text(node.property("key"));
	});

	
	// Render
	bubblesView(div);
    };

    return _;
};

module.exports = geneAssociations;
