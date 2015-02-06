var theme = function () {

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
		    return node.node_name() === n;
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
		    return node.node_name() === n;
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
	    zoomSelect.append("option")
		.attr("value", node.node_name())
		.text(node.node_name());
	    highlightSelect.append("option")
		.attr("value", node.node_name())
		.text(node.node_name());
	});

	
	// Render
	bubblesView(div);
    };

    return _;
};
