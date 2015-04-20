var tnt_tooltip = require("tnt.tooltip");
var tnt_node = require("tnt.tree.node");
var _ = require("lodash");

var geneAssociations = function () {
    var config = {
	target : "",
	diameter : 1000,
	cttvApi : undefined,
	datatypes : {
	    "genetic_association": "Genetics",
	    "somatic_mutations": "Somatic",
	    "known_drugs": "Drugs",
	    "rna_expression": "RNA",
	    "affected_pathways": "Pathways",
	    "animal_models": "Models"
	}
    };

    var bubblesView;
    var flowerView;
    
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

    function render (div) {
	var data = config.data;

	// Set up the bubbles view correctly
	bubblesView
	    .data(config.root)
	    .value("association_score")
	    .key("efo_code")
	    .label("label")
	    .diameter(config.diameter);
	
	var tree = bubblesView.data();

	// Tooltips
	var bubble_tooltip = function (node) {
	    // toplevel root is not shown in the bubbles view
	    if (node.parent() === undefined) {
		return;
	    }

	    var obj = {};
	    var score = node.property("association_score");
	    obj.header = node.property("label") + " (Association Score: " + score + ")";
	    var loc = "#/evidence/" + config.target + "/" + node.property("efo_code");
	    obj.body="<a class='cttv_flowerLink' href=" + loc + "><div></div></a><a href=" + loc + ">View evidence details</a>";

	    var leafTooltip = tnt_tooltip.plain()
		.id(1)
		.width(180);

	    //Hijack of the fill callback
	    var tableFill = leafTooltip.fill();

	    //Pass a new fill callback that calls the original one and decorates with flowers
	    leafTooltip.fill(function (data) {
		tableFill.call(this, data);
		var nodeDatatypes = node.property("datatypes");
		var flowerData = [];
		for (var datatype in config.datatypes) {
		    if (config.datatypes.hasOwnProperty(datatype)) {
			flowerData.push({
			    "value": lookDatasource(nodeDatatypes, datatype).score, "label": config.datatypes[datatype]});
		    }
		}
		flowerView.values(flowerData)(this.select("div").node());
	    });
	    
	    leafTooltip.call(this, obj);
	};
	bubblesView
	    .onclick (bubble_tooltip);
	//.onclick (function (d) {bView.focus(bView.node(d))})
	// Render
	bubblesView(div.node());

	//return therapeuticAreasSorted;
    }

    var ga = function (bubbles, flower, div) {
	bubblesView = bubbles;
	flowerView = flower;
	var vis = d3.select(div)
	    .append("div")
	    .style("position", "relative");
	if ((config.data === undefined) && (config.cttvApi !== undefined)) {
	    var api = config.cttvApi;
	    var url = api.url.associations({
		gene: config.target,
		datastructure: "tree"
	    });
	    api.call(url)
		.then (function (resp) {
		    //var data = JSON.parse(resp).data;
		    var data = resp.body.data;
		    ga.data(data);
		    // processData(data);
		    // config.data = data;
		    render(vis);
		});
	} else {
	    render(vis);
	}
    };
    
    // process the data for bubbles display
    function processData (data) {
	if (data === undefined) {
	    return [];
	}
	if (data.children === undefined) {
	    return data;
	}
	var therapeuticAreas = data.children;
	for (var i=0; i<therapeuticAreas.length; i++) {
	    var tA = therapeuticAreas[i];
	    var taChildren = tA.children;
	    if (taChildren === undefined) {
		continue;
	    }
	    var newChildren = [];
	    var nonRedundant = {};
	    for (var j=0; j<taChildren.length; j++) {
		var taChild = taChildren[j];
		var taLeaves = tnt_node(taChild).get_all_leaves();
		for (var k=0; k<taLeaves.length; k++) {
		    var leafData = taLeaves[k].data();
		    if (nonRedundant[leafData.name] === undefined) {
			nonRedundant[leafData.name] = 1;
			newChildren.push(leafData);
		    }
		}
	    }
	    tA.children = newChildren;
	}
	return sortData(data);
    };

    function sortData (data) {
	var dataSorted = _.sortBy(data.children, function (d) {
            return d.children ? -d.children.length : 0;
	});
	
	for (var i=0; i<data.children.length; i++) {
	    data.children[i].children = _.sortBy (data.children[i].children, function (d) {
	        return -d.association_score;
	    });
	}
	data.children = dataSorted;
	return data;
    };

    // Getters / Setters
    ga.data = function (d) {
    	if (!arguments.length) {
    	    return config.data;
    	}
    	//processData(d);
	config.data = processData(d);
	//config.data = d;
	config.root = tnt_node(config.data);
    	return this;
    };
    
    ga.target = function (t) {
	if (!arguments.length) {
	    return config.target;
	}
	config.target = t;
	return this;
    };

    ga.diameter = function (d) {
	if (!arguments.length) {
	    return config.diameter;
	}
	config.diameter = d;
	return this;
    };

    ga.cttvApi = function (api) {
	if (!arguments.length) {
	    return config.cttvApi;
	}
	config.cttvApi = api;
	return this;
    };

    ga.datatypes = function (dts) {
    	if (!arguments.length) {
    	    return config.datatypes;
    	}
    	config.datatypes = dts;
    	return this;
    };

    // Other methods to interact with the bubblesView
    ga.update = function (data) {
	ga.data (data);
	bubblesView
	    .data(config.root);
	bubblesView.update();
    };
    
    ga.selectTherapeuticArea = function (efo) {
	var taNode = config.root.find_node (function (node) {
	    return node.property("efo_code") == efo || node.property("name") == efo;
	});
	if (taNode.property("focused") === true) {
	    taNode.property("focused", undefined);
	    bubblesView.focus(config.root);
	} else {
	    taNode.property("focused", true);
	    // release prev focused node
	    bubblesView.focus().property("focused", undefined);
	    // focus the new node
	    bubblesView.focus(taNode);
	}
	bubblesView.select(config.root);
	return this;
    };

    ga.selectDisease = function (efo) {
	// This code is for diseases with multiple parents
	// var nodes = nodeData.find_all(function (node) {
	//  return node.property("efo_code") === efo;
	// });
	// var lca;
	// if (nodes.length > 1) {
	//  lca = tree.lca(nodes);
	// } else {
	//  lca = nodes[0].parent();
	// }
	var dNode = nodeData.find_node (function (node) {
	    return node.property("efo_code") === efo;
	});
	if (dNode.property("selected") === true) {
	    node.property("selected", undefined);
	    bubblesView.select(config.root);
	} else {
	    dNode.property("selected", true);
	    bubblesView.select([node]);
	}
	return this;
    };
    
    return ga;
};

module.exports = geneAssociations;
