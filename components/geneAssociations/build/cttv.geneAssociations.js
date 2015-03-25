(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = geneAssociations = require("./src/geneAssociations.js");

},{"./src/geneAssociations.js":3}],3:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL2Zha2VfOGI5YTU1NDYuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvZ2VuZUFzc29jaWF0aW9ucy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL3NyYy9nZW5lQXNzb2NpYXRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCIvLyBpZiAodHlwZW9mIGJ1YmJsZXNWaWV3ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldyA9IHt9XG4vLyB9XG4vLyBidWJibGVzVmlldy5idWJibGVzVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9idWJibGVzVmlldy5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZ2VuZUFzc29jaWF0aW9ucyA9IHJlcXVpcmUoXCIuL3NyYy9nZW5lQXNzb2NpYXRpb25zLmpzXCIpO1xuIiwiLy8gdmFyIHRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG4vLyB2YXIgdG50X25vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcblxudmFyIGdlbmVBc3NvY2lhdGlvbnMgPSBmdW5jdGlvbiAoZGVwcykge1xuICAgIHZhciBjb25maWcgPSB7XG5cdHRhcmdldCA6IFwiXCIsXG5cdGRpYW1ldGVyIDogMTAwMCxcbiAgICB9O1xuXG4gICAgLy8gQ2hlY2sgdGhhdCBhbGwgZGVwZW5kZW5jaWVzIGFyZSB0aGVyZVxuICAgIGNoZWNrRGVwcyhkZXBzLCBbXCJidWJibGVzVmlld1wiLCBcImZsb3dlclZpZXdcIiwgXCJjdHR2QXBpXCIsIFwidG50LnRyZWUubm9kZVwiLCBcInRudC50b29sdGlwXCIsIFwiX1wiXSk7XG4gICAgXG4gICAgLy8gVE9ETzogTW92ZSB0byBjdHR2QXBpXG4gICAgLy8gVGhpcyBjb2RlIGlzIGR1cGxpY2F0ZWQgc2V2ZXJhbCB0aW1lcyBub3cgKGNvbnRyb2xsZXJzLCBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzKVxuICAgIGZ1bmN0aW9uIGxvb2tEYXRhc291cmNlIChhcnIsIGRzTmFtZSkge1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuICAgIFx0ICAgIHZhciBkcyA9IGFycltpXTtcbiAgICBcdCAgICBpZiAoZHMuZGF0YXR5cGUgPT09IGRzTmFtZSkge1xuICAgIFx0XHRyZXR1cm4ge1xuICAgIFx0XHQgICAgXCJjb3VudFwiOiBkcy5ldmlkZW5jZV9jb3VudCxcbiAgICBcdFx0ICAgIFwic2NvcmVcIjogZHMuYXNzb2NpYXRpb25fc2NvcmVcbiAgICBcdFx0fTtcbiAgICBcdCAgICB9XG4gICAgXHR9XG4gICAgXHRyZXR1cm4ge1xuICAgIFx0ICAgIFwiY291bnRcIjogMCxcbiAgICBcdCAgICBcInNjb3JlXCI6IDBcbiAgICBcdH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVuZGVyIChkaXYpIHtcblx0dmFyIGRhdGEgPSBjb25maWcuZGF0YTtcblx0Y29uZmlnLnJvb3QgPSBkZXBzW1widG50LnRyZWUubm9kZVwiXShkYXRhKTtcblx0dmFyIHRhTm9kZXMgPSBjb25maWcucm9vdC5jaGlsZHJlbigpO1xuXHR2YXIgdGhlcmFwZXV0aWNBcmVhcyA9IGRlcHMuXy5tYXAodGFOb2RlcywgZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHZhciBkID0gbm9kZS5kYXRhKCk7XG5cdCAgICB2YXIgbmFtZSA9IGQubGFiZWw7XG5cdCAgICBpZiAoZC5sYWJlbC5sZW5ndGggPiAyMCkge1xuXHRcdG5hbWUgPSBkLmxhYmVsLnN1YnN0cmluZygwLCAxOCkgKyBcIi4uLlwiO1xuXHQgICAgfVxuXHQgICAgdmFyIGxlYXZlcyA9IG5vZGUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0ICAgIHZhciBkaXNlYXNlcyA9IGRlcHMuXy5tYXAobGVhdmVzLCBmdW5jdGlvbiAobikge1xuXHRcdHZhciBkID0gbi5kYXRhKCk7XG5cdFx0cmV0dXJuIHtcblx0XHQgICAgXCJuYW1lXCI6IGQubGFiZWwsXG5cdFx0ICAgIFwiZWZvXCI6IGQuZWZvX2NvZGUsXG5cdFx0ICAgIFwic2NvcmVcIjogZC5hc3NvY2lhdGlvbl9zY29yZVxuXHRcdH07XG5cdCAgICB9KTtcblx0ICAgIHZhciBkaXNlYXNlc1NvcnRlZCA9IGRlcHMuXy5zb3J0QnkoZGlzZWFzZXMsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1kLnNjb3JlO1xuXHQgICAgfSk7XG5cdCAgICByZXR1cm4ge1xuXHRcdFwibmFtZVwiOiBuYW1lLFxuXHRcdFwic2NvcmVcIjogZGlzZWFzZXMubGVuZ3RoLFxuXHRcdFwiZWZvXCI6IGQuZWZvX2NvZGUsXG5cdFx0XCJkaXNlYXNlc1wiOiBkaXNlYXNlc1NvcnRlZFxuXHQgICAgfTtcblx0fSk7XG5cdHZhciB0aGVyYXBldXRpY0FyZWFzU29ydGVkID0gZGVwcy5fLnNvcnRCeSh0aGVyYXBldXRpY0FyZWFzLCBmdW5jdGlvbiAoYSkge1xuXHQgICAgcmV0dXJuIC1hLnNjb3JlO1xuXHR9KTtcblx0Ly8gU2V0IHVwIHRoZSBidWJibGVzIHZpZXcgY29ycmVjdGx5XG5cdGRlcHMuYnViYmxlc1ZpZXdcblx0ICAgIC5kYXRhKGNvbmZpZy5yb290KVxuXHQgICAgLnZhbHVlKFwiYXNzb2NpYXRpb25fc2NvcmVcIilcblx0ICAgIC5rZXkoXCJlZm9fY29kZVwiKVxuXHQgICAgLmxhYmVsKFwibGFiZWxcIilcblx0ICAgIC5kaWFtZXRlcihjb25maWcuZGlhbWV0ZXIpO1xuXHRcblx0dmFyIHRyZWUgPSBkZXBzLmJ1YmJsZXNWaWV3LmRhdGEoKTtcblxuXHQvLyBUb29sdGlwc1xuXHR2YXIgYnViYmxlX3Rvb2x0aXAgPSBmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgLy8gdG9wbGV2ZWwgcm9vdCBpcyBub3Qgc2hvd24gaW4gdGhlIGJ1YmJsZXMgdmlld1xuXHQgICAgaWYgKG5vZGUucGFyZW50KCkgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIG9iaiA9IHt9O1xuXHQgICAgdmFyIHNjb3JlID0gbm9kZS5wcm9wZXJ0eShcImFzc29jaWF0aW9uX3Njb3JlXCIpO1xuXHQgICAgb2JqLmhlYWRlciA9IG5vZGUucHJvcGVydHkoXCJsYWJlbFwiKSArIFwiIChBc3NvY2lhdGlvbiBTY29yZTogXCIgKyBzY29yZSArIFwiKVwiO1xuXHQgICAgdmFyIGxvYyA9IFwiIy9nZW5lLWRpc2Vhc2U/dD1cIiArIGNvbmZpZy50YXJnZXQgKyBcIiZkPVwiICsgbm9kZS5wcm9wZXJ0eShcImVmb19jb2RlXCIpO1xuXHQgICAgb2JqLmJvZHk9XCI8ZGl2PjwvZGl2PjxhIGhyZWY9XCIgKyBsb2MgKyBcIj5WaWV3IGRldGFpbHM8L2E+XCI7XG5cblx0ICAgIHZhciBsZWFmVG9vbHRpcCA9IGRlcHNbXCJ0bnQudG9vbHRpcFwiXS5wbGFpbigpXG5cdFx0LmlkKDEpXG5cdFx0LndpZHRoKDE4MCk7XG5cblx0ICAgIC8vSGlqYWNrIG9mIHRoZSBmaWxsIGNhbGxiYWNrXG5cdCAgICB2YXIgdGFibGVGaWxsID0gbGVhZlRvb2x0aXAuZmlsbCgpO1xuXG5cdCAgICAvL1Bhc3MgYSBuZXcgZmlsbCBjYWxsYmFjayB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBvbmUgYW5kIGRlY29yYXRlcyB3aXRoIGZsb3dlcnNcblx0ICAgIGxlYWZUb29sdGlwLmZpbGwoZnVuY3Rpb24gKGRhdGEpIHtcblx0XHR0YWJsZUZpbGwuY2FsbCh0aGlzLCBkYXRhKTtcblx0XHR2YXIgZGF0YXR5cGVzID0gbm9kZS5wcm9wZXJ0eShcImRhdGF0eXBlc1wiKTtcblx0XHR2YXIgZmxvd2VyRGF0YSA9IFtcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiZ2VuZXRpY19hc3NvY2lhdGlvblwiKS5zY29yZSwgIFwibGFiZWxcIjpcIkdlbmV0aWNzXCJ9LFxuXHRcdCAgICB7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJzb21hdGljX211dGF0aW9uXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiU29tYXRpY1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwia25vd25fZHJ1Z1wiKS5zY29yZSwgIFwibGFiZWxcIjpcIkRydWdzXCJ9LFxuXHRcdCAgICB7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJybmFfZXhwcmVzc2lvblwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlJOQVwifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiYWZmZWN0ZWRfcGF0aHdheVwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlBhdGh3YXlzXCJ9LFxuXHRcdCAgICB7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJhbmltYWxfbW9kZWxcIikuc2NvcmUsICBcImxhYmVsXCI6XCJNb2RlbHNcIn1cblx0XHRdO1xuXHRcdGRlcHMuZmxvd2VyVmlldy52YWx1ZXMoZmxvd2VyRGF0YSkodGhpcy5zZWxlY3QoXCJkaXZcIikubm9kZSgpKTtcblx0ICAgIH0pO1xuXHQgICAgXG5cdCAgICBsZWFmVG9vbHRpcC5jYWxsKHRoaXMsIG9iaik7XG5cdH07XG5cdGRlcHMuYnViYmxlc1ZpZXdcblx0ICAgIC5vbmNsaWNrIChidWJibGVfdG9vbHRpcCk7XG5cdC8vLm9uY2xpY2sgKGZ1bmN0aW9uIChkKSB7YlZpZXcuZm9jdXMoYlZpZXcubm9kZShkKSl9KVxuXHQvLyBSZW5kZXJcblx0ZGVwcy5idWJibGVzVmlldyhkaXYubm9kZSgpKTtcblxuXHQvL3JldHVybiB0aGVyYXBldXRpY0FyZWFzU29ydGVkO1xuICAgIH1cblxuICAgIC8vIGRlcHMgc2hvdWxkIGluY2x1ZGUgKGJ1YmJsZXNWaWV3LCBmbG93ZXJWaWV3LCBjdHR2QXBpLCB0bnQudHJlZS5ub2RlIGFuZCB0b29sdGlwKVxuICAgIHZhciBnYSA9IGZ1bmN0aW9uIChkaXYpIHtcblx0dmFyIHZpcyA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuc3R5bGUoXCJwb3NpdGlvblwiLCBcInJlbGF0aXZlXCIpO1xuXHRpZiAoY29uZmlnLmRhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgdmFyIGFwaSA9IGRlcHMuY3R0dkFwaTtcblx0ICAgIHZhciB1cmwgPSBhcGkudXJsLmFzc29jaWF0aW9ucyh7XG5cdFx0Z2VuZTogY29uZmlnLnRhcmdldCxcblx0XHRkYXRhc3RydWN0dXJlOiBcInRyZWVcIlxuXHQgICAgfSk7XG5cdCAgICBhcGkuY2FsbCh1cmwpXG5cdFx0LnRoZW4gKGZ1bmN0aW9uIChyZXNwKSB7XG5cdFx0ICAgIC8vdmFyIGRhdGEgPSBKU09OLnBhcnNlKHJlc3ApLmRhdGE7XG5cdFx0ICAgIHZhciBkYXRhID0gcmVzcC5ib2R5LmRhdGE7XG5cdFx0ICAgIHByb2Nlc3NEYXRhKGRhdGEpO1xuXHRcdCAgICBjb25maWcuZGF0YSA9IGRhdGE7XG5cdFx0ICAgIHJlbmRlcih2aXMpO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHQgICAgcmVuZGVyKHZpcyk7XG5cdH1cbiAgICB9O1xuICAgIFxuICAgIC8vIHByb2Nlc3MgdGhlIGRhdGEgZm9yIGJ1YmJsZXMgZGlzcGxheVxuICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhIChkYXRhKSB7XG5cdHZhciB0aGVyYXBldXRpY0FyZWFzID0gZGF0YS5jaGlsZHJlbjtcblxuXHRmb3IgKHZhciBpPTA7IGk8dGhlcmFwZXV0aWNBcmVhcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRBID0gdGhlcmFwZXV0aWNBcmVhc1tpXTtcblx0ICAgIHZhciB0YUNoaWxkcmVuID0gdEEuY2hpbGRyZW47XG5cdCAgICBpZiAodGFDaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICB2YXIgbmV3Q2hpbGRyZW4gPSBbXTtcblx0ICAgIGZvciAodmFyIGo9MDsgajx0YUNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIHRhQ2hpbGQgPSB0YUNoaWxkcmVuW2pdO1xuXHRcdHZhciB0YUxlYXZlcyA9IGRlcHNbXCJ0bnQudHJlZS5ub2RlXCJdKHRhQ2hpbGQpLmdldF9hbGxfbGVhdmVzKCk7XG5cdFx0Zm9yICh2YXIgaz0wOyBrPHRhTGVhdmVzLmxlbmd0aDsgaysrKSB7XG5cdFx0ICAgIG5ld0NoaWxkcmVuLnB1c2godGFMZWF2ZXNba10uZGF0YSgpKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICB0QS5jaGlsZHJlbiA9IG5ld0NoaWxkcmVuO1xuXHR9XG5cdHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgXG4gICAgZ2EuZGF0YSA9IGZ1bmN0aW9uIChkKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY29uZmlnLmRhdGE7XG4gICAgXHR9XG4gICAgXHRwcm9jZXNzRGF0YShkKTtcblx0Y29uZmlnLmRhdGEgPSBkO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8vIGdhLnJvb3QgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgLy8gXHQgICAgcmV0dXJuIHJvb3Q7XG4gICAgLy8gXHR9XG4gICAgLy8gXHRyb290ID0gbm9kZTtcbiAgICAvLyBcdHJldHVybiB0aGlzO1xuICAgIC8vIH07XG5cdFxuICAgIGdhLnRhcmdldCA9IGZ1bmN0aW9uICh0KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy50YXJnZXQ7XG5cdH1cblx0Y29uZmlnLnRhcmdldCA9IHQ7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBnYS5kaWFtZXRlciA9IGZ1bmN0aW9uIChkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy5kaWFtZXRlcjtcblx0fVxuXHRjb25maWcuZGlhbWV0ZXIgPSBkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIGdhLnNlbGVjdFRoZXJhcGV1dGljQXJlYSA9IGZ1bmN0aW9uIChlZm8pIHtcblx0dmFyIHRhTm9kZSA9IGNvbmZpZy5yb290LmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KFwiZWZvX2NvZGVcIikgPT0gZWZvIHx8IG5vZGUucHJvcGVydHkoXCJuYW1lXCIpID09IGVmbztcblx0fSk7XG5cdGlmICh0YU5vZGUucHJvcGVydHkoXCJmb2N1c2VkXCIpID09PSB0cnVlKSB7XG5cdCAgICB0YU5vZGUucHJvcGVydHkoXCJmb2N1c2VkXCIsIHVuZGVmaW5lZCk7XG5cdCAgICBkZXBzLmJ1YmJsZXNWaWV3LmZvY3VzKGNvbmZpZy5yb290KTtcblx0fSBlbHNlIHtcblx0ICAgIHRhTm9kZS5wcm9wZXJ0eShcImZvY3VzZWRcIiwgdHJ1ZSk7XG5cdCAgICAvLyByZWxlYXNlIHByZXYgZm9jdXNlZCBub2RlXG5cdCAgICBkZXBzLmJ1YmJsZXNWaWV3LmZvY3VzKCkucHJvcGVydHkoXCJmb2N1c2VkXCIsIHVuZGVmaW5lZCk7XG5cdCAgICAvLyBmb2N1cyB0aGUgbmV3IG5vZGVcblx0ICAgIGRlcHMuYnViYmxlc1ZpZXcuZm9jdXModGFOb2RlKTtcblx0fVxuXHRkZXBzLmJ1YmJsZXNWaWV3LnNlbGVjdChjb25maWcucm9vdCk7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBnYS5zZWxlY3REaXNlYXNlID0gZnVuY3Rpb24gKGVmbykge1xuXHQvLyBUaGlzIGNvZGUgaXMgZm9yIGRpc2Vhc2VzIHdpdGggbXVsdGlwbGUgcGFyZW50c1xuXHQvLyB2YXIgbm9kZXMgPSBub2RlRGF0YS5maW5kX2FsbChmdW5jdGlvbiAobm9kZSkge1xuXHQvLyAgcmV0dXJuIG5vZGUucHJvcGVydHkoXCJlZm9fY29kZVwiKSA9PT0gZWZvO1xuXHQvLyB9KTtcblx0Ly8gdmFyIGxjYTtcblx0Ly8gaWYgKG5vZGVzLmxlbmd0aCA+IDEpIHtcblx0Ly8gIGxjYSA9IHRyZWUubGNhKG5vZGVzKTtcblx0Ly8gfSBlbHNlIHtcblx0Ly8gIGxjYSA9IG5vZGVzWzBdLnBhcmVudCgpO1xuXHQvLyB9XG5cdHZhciBkTm9kZSA9IG5vZGVEYXRhLmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KFwiZWZvX2NvZGVcIikgPT09IGVmbztcblx0fSk7XG5cdGlmIChkTm9kZS5wcm9wZXJ0eShcInNlbGVjdGVkXCIpID09PSB0cnVlKSB7XG5cdCAgICBub2RlLnByb3BlcnR5KFwic2VsZWN0ZWRcIiwgdW5kZWZpbmVkKTtcblx0ICAgIGRlcHMuYnViYmxlc1ZpZXcuc2VsZWN0KGNvbmZpZy5yb290KTtcblx0fSBlbHNlIHtcblx0ICAgIGROb2RlLnByb3BlcnR5KFwic2VsZWN0ZWRcIiwgdHJ1ZSk7XG5cdCAgICBkZXBzLmJ1YmJsZXNWaWV3LnNlbGVjdChbbm9kZV0pO1xuXHR9XG5cdHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrRGVwcyAob2JqLCBkZXBOYW1lcykge1xuXHR2YXIgbWlzc2luZyA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGVwTmFtZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmICh0eXBlb2Yob2JqW2RlcE5hbWVzW2ldXSA9PT0gXCJ1bmRlZmluZWRcIikpIHtcblx0XHRtaXNzaW5nLnB1c2goZGVwTmFtZXNbaV0pO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiBtaXNzaW5nO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZ2E7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVBc3NvY2lhdGlvbnM7XG4iXX0=
