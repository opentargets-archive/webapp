// var tooltip = require("tnt.tooltip");
// var tnt_node = require("tnt.tree.node");

var geneAssociations = function (deps) {
    var config = {
	target : "",
	diameter : 1000,
    };

    // Check that all dependencies are there
    checkDeps(deps, ["bubblesView", "flowerView", "cttvApi", "tnt.tree.node", "tnt.tooltip", "_"]);
    
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
	config.root = deps["tnt.tree.node"](data);
	var taNodes = config.root.children();
	var therapeuticAreas = deps._.map(taNodes, function (node) {
	    var d = node.data();
	    var name = d.label;
	    if (d.label.length > 20) {
		name = d.label.substring(0, 18) + "...";
	    }
	    var leaves = node.get_all_leaves();
	    var diseases = deps._.map(leaves, function (n) {
		var d = n.data();
		return {
		    "name": d.label,
		    "efo": d.efo_code,
		    "score": d.association_score
		};
	    });
	    var diseasesSorted = deps._.sortBy(diseases, function (d) {
		return -d.score;
	    });
	    return {
		"name": name,
		"score": diseases.length,
		"efo": d.efo_code,
		"diseases": diseasesSorted
	    };
	});
	var therapeuticAreasSorted = deps._.sortBy(therapeuticAreas, function (a) {
	    return -a.score;
	});
	// Set up the bubbles view correctly
	deps.bubblesView
	    .data(config.root)
	    .value("association_score")
	    .key("efo_code")
	    .label("label")
	    .diameter(config.diameter);
	
	var tree = deps.bubblesView.data();

	// Tooltips
	var bubble_tooltip = function (node) {
	    // toplevel root is not shown in the bubbles view
	    if (node.parent() === undefined) {
		return;
	    }

	    var obj = {};
	    var score = node.property("association_score");
	    obj.header = node.property("label") + " (Association Score: " + score + ")";
	    var loc = "#/gene-disease?t=" + config.target + "&d=" + node.property("efo_code");
	    obj.body="<div></div><a href=" + loc + ">View details</a>";

	    var leafTooltip = deps["tnt.tooltip"].plain()
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
		deps.flowerView.values(flowerData)(this.select("div").node());
	    });
	    
	    leafTooltip.call(this, obj);
	};
	deps.bubblesView
	    .onclick (bubble_tooltip);
	//.onclick (function (d) {bView.focus(bView.node(d))})
	// Render
	deps.bubblesView(div.node());

	//return therapeuticAreasSorted;
    }

    // deps should include (bubblesView, flowerView, cttvApi, tnt.tree.node and tooltip)
    var ga = function (div) {
	var vis = d3.select(div)
	    .append("div")
	    .style("position", "relative");
	if (config.data === undefined) {
	    var api = deps.cttvApi;
	    var url = api.url.associations({
		gene: config.target,
		datastructure: "tree"
	    });
	    api.call(url)
		.then (function (resp) {
		    //var data = JSON.parse(resp).data;
		    var data = resp.body.data;
		    processData(data);
		    config.data = data;
		    render(vis);
		});
	} else {
	    render(vis);
	}
    };
    
    // process the data for bubbles display
    function processData (data) {
	var therapeuticAreas = data.children;

	for (var i=0; i<therapeuticAreas.length; i++) {
	    var tA = therapeuticAreas[i];
	    var taChildren = tA.children;
	    if (taChildren === undefined) {
		continue;
	    }
	    var newChildren = [];
	    for (var j=0; j<taChildren.length; j++) {
		var taChild = taChildren[j];
		var taLeaves = deps["tnt.tree.node"](taChild).get_all_leaves();
		for (var k=0; k<taLeaves.length; k++) {
		    newChildren.push(taLeaves[k].data());
		}
	    }
	    tA.children = newChildren;
	}
	return data;
    };
    
    ga.data = function (d) {
    	if (!arguments.length) {
    	    return config.data;
    	}
    	processData(d);
	config.data = d;
    	return this;
    }
    
    // ga.root = function (node) {
    // 	if (!arguments.length) {
    // 	    return root;
    // 	}
    // 	root = node;
    // 	return this;
    // };
	
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
    
    ga.selectTherapeuticArea = function (efo) {
	var taNode = config.root.find_node (function (node) {
	    return node.property("efo_code") == efo || node.property("name") == efo;
	});
	if (taNode.property("focused") === true) {
	    taNode.property("focused", undefined);
	    deps.bubblesView.focus(config.root);
	} else {
	    taNode.property("focused", true);
	    // release prev focused node
	    deps.bubblesView.focus().property("focused", undefined);
	    // focus the new node
	    deps.bubblesView.focus(taNode);
	}
	deps.bubblesView.select(config.root);
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
	    deps.bubblesView.select(config.root);
	} else {
	    dNode.property("selected", true);
	    deps.bubblesView.select([node]);
	}
	return this;
    }

    function checkDeps (obj, depNames) {
	var missing = [];
	for (var i=0; i<depNames.length; i++) {
	    if (typeof(obj[depNames[i]] === "undefined")) {
		missing.push(depNames[i]);
	    }
	}
	return missing;
    }
    
    return ga;
};

module.exports = geneAssociations;
