var theme = function () {

    var _ = function (bubblesView, div) {
	bubblesView.data(tnt.tree.node(mydata1));
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
		    bubblesView.data(tnt.tree.node(mydata1));
		    bubblesView.update();
		    break;
		case "Simplified" :
		    bubblesView.data(tnt.tree.node(mydata2));
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
	
	var tree = bubblesView.data();
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

var mydata1 = {
    "name" : "cttv_disease",
    "value" : 18,
    "children" : [
	{
	    "name": "first",
	    "value" : 12
	},
	{
	    "name": "second",
	    "value" : 6
	}
    ]
};

var mydata2 = {
    "name" : "cttv_disease",
    "value" : 12,
    "children" : [
	{
	    "name": "first",
	    "value": 12
	}
    ]
};
