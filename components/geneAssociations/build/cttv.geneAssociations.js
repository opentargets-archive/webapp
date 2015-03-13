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

    function render (data, div) {
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
		    render(data, vis);
		});
	} else {
	    render(config.data, vis);
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
	    return node.property("efo_code") == efo;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL2Zha2VfYTE5Mzc0YS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2dlbmVBc3NvY2lhdGlvbnMvc3JjL2dlbmVBc3NvY2lhdGlvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2luZGV4LmpzXCIpO1xuIiwiLy8gaWYgKHR5cGVvZiBidWJibGVzVmlldyA9PT0gXCJ1bmRlZmluZWRcIikge1xuLy8gICAgIG1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXcgPSB7fVxuLy8gfVxuLy8gYnViYmxlc1ZpZXcuYnViYmxlc1ZpZXcgPSByZXF1aXJlKFwiLi9zcmMvYnViYmxlc1ZpZXcuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVBc3NvY2lhdGlvbnMgPSByZXF1aXJlKFwiLi9zcmMvZ2VuZUFzc29jaWF0aW9ucy5qc1wiKTtcbiIsIi8vIHZhciB0b29sdGlwID0gcmVxdWlyZShcInRudC50b29sdGlwXCIpO1xuLy8gdmFyIHRudF9ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG5cbnZhciBnZW5lQXNzb2NpYXRpb25zID0gZnVuY3Rpb24gKGRlcHMpIHtcbiAgICB2YXIgY29uZmlnID0ge1xuXHR0YXJnZXQgOiBcIlwiLFxuXHRkaWFtZXRlciA6IDEwMDAsXG4gICAgfTtcblxuICAgIC8vIENoZWNrIHRoYXQgYWxsIGRlcGVuZGVuY2llcyBhcmUgdGhlcmVcbiAgICBjaGVja0RlcHMoZGVwcywgW1wiYnViYmxlc1ZpZXdcIiwgXCJmbG93ZXJWaWV3XCIsIFwiY3R0dkFwaVwiLCBcInRudC50cmVlLm5vZGVcIiwgXCJ0bnQudG9vbHRpcFwiLCBcIl9cIl0pO1xuICAgIFxuICAgIC8vIFRPRE86IE1vdmUgdG8gY3R0dkFwaVxuICAgIC8vIFRoaXMgY29kZSBpcyBkdXBsaWNhdGVkIHNldmVyYWwgdGltZXMgbm93IChjb250cm9sbGVycywgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cylcbiAgICBmdW5jdGlvbiBsb29rRGF0YXNvdXJjZSAoYXJyLCBkc05hbWUpIHtcbiAgICBcdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBcdCAgICB2YXIgZHMgPSBhcnJbaV07XG4gICAgXHQgICAgaWYgKGRzLmRhdGF0eXBlID09PSBkc05hbWUpIHtcbiAgICBcdFx0cmV0dXJuIHtcbiAgICBcdFx0ICAgIFwiY291bnRcIjogZHMuZXZpZGVuY2VfY291bnQsXG4gICAgXHRcdCAgICBcInNjb3JlXCI6IGRzLmFzc29jaWF0aW9uX3Njb3JlXG4gICAgXHRcdH07XG4gICAgXHQgICAgfVxuICAgIFx0fVxuICAgIFx0cmV0dXJuIHtcbiAgICBcdCAgICBcImNvdW50XCI6IDAsXG4gICAgXHQgICAgXCJzY29yZVwiOiAwXG4gICAgXHR9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbmRlciAoZGF0YSwgZGl2KSB7XG5cdGNvbmZpZy5yb290ID0gZGVwc1tcInRudC50cmVlLm5vZGVcIl0oZGF0YSk7XG5cdHZhciB0YU5vZGVzID0gY29uZmlnLnJvb3QuY2hpbGRyZW4oKTtcblx0dmFyIHRoZXJhcGV1dGljQXJlYXMgPSBkZXBzLl8ubWFwKHRhTm9kZXMsIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgZCA9IG5vZGUuZGF0YSgpO1xuXHQgICAgdmFyIG5hbWUgPSBkLmxhYmVsO1xuXHQgICAgaWYgKGQubGFiZWwubGVuZ3RoID4gMjApIHtcblx0XHRuYW1lID0gZC5sYWJlbC5zdWJzdHJpbmcoMCwgMTgpICsgXCIuLi5cIjtcblx0ICAgIH1cblx0ICAgIHZhciBsZWF2ZXMgPSBub2RlLmdldF9hbGxfbGVhdmVzKCk7XG5cdCAgICB2YXIgZGlzZWFzZXMgPSBkZXBzLl8ubWFwKGxlYXZlcywgZnVuY3Rpb24gKG4pIHtcblx0XHR2YXIgZCA9IG4uZGF0YSgpO1xuXHRcdHJldHVybiB7XG5cdFx0ICAgIFwibmFtZVwiOiBkLmxhYmVsLFxuXHRcdCAgICBcImVmb1wiOiBkLmVmb19jb2RlLFxuXHRcdCAgICBcInNjb3JlXCI6IGQuYXNzb2NpYXRpb25fc2NvcmVcblx0XHR9O1xuXHQgICAgfSk7XG5cdCAgICB2YXIgZGlzZWFzZXNTb3J0ZWQgPSBkZXBzLl8uc29ydEJ5KGRpc2Vhc2VzLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAtZC5zY29yZTtcblx0ICAgIH0pO1xuXHQgICAgcmV0dXJuIHtcblx0XHRcIm5hbWVcIjogbmFtZSxcblx0XHRcInNjb3JlXCI6IGRpc2Vhc2VzLmxlbmd0aCxcblx0XHRcImVmb1wiOiBkLmVmb19jb2RlLFxuXHRcdFwiZGlzZWFzZXNcIjogZGlzZWFzZXNTb3J0ZWRcblx0ICAgIH07XG5cdH0pO1xuXHR2YXIgdGhlcmFwZXV0aWNBcmVhc1NvcnRlZCA9IGRlcHMuXy5zb3J0QnkodGhlcmFwZXV0aWNBcmVhcywgZnVuY3Rpb24gKGEpIHtcblx0ICAgIHJldHVybiAtYS5zY29yZTtcblx0fSk7XG5cdC8vIFNldCB1cCB0aGUgYnViYmxlcyB2aWV3IGNvcnJlY3RseVxuXHRkZXBzLmJ1YmJsZXNWaWV3XG5cdCAgICAuZGF0YShjb25maWcucm9vdClcblx0ICAgIC52YWx1ZShcImFzc29jaWF0aW9uX3Njb3JlXCIpXG5cdCAgICAua2V5KFwiZWZvX2NvZGVcIilcblx0ICAgIC5sYWJlbChcImxhYmVsXCIpXG5cdCAgICAuZGlhbWV0ZXIoY29uZmlnLmRpYW1ldGVyKTtcblx0XG5cdHZhciB0cmVlID0gZGVwcy5idWJibGVzVmlldy5kYXRhKCk7XG5cblx0Ly8gVG9vbHRpcHNcblx0dmFyIGJ1YmJsZV90b29sdGlwID0gZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIC8vIHRvcGxldmVsIHJvb3QgaXMgbm90IHNob3duIGluIHRoZSBidWJibGVzIHZpZXdcblx0ICAgIGlmIChub2RlLnBhcmVudCgpID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIHZhciBvYmogPSB7fTtcblx0ICAgIHZhciBzY29yZSA9IG5vZGUucHJvcGVydHkoXCJhc3NvY2lhdGlvbl9zY29yZVwiKTtcblx0ICAgIG9iai5oZWFkZXIgPSBub2RlLnByb3BlcnR5KFwibGFiZWxcIikgKyBcIiAoQXNzb2NpYXRpb24gU2NvcmU6IFwiICsgc2NvcmUgKyBcIilcIjtcblx0ICAgIHZhciBsb2MgPSBcIiMvZ2VuZS1kaXNlYXNlP3Q9XCIgKyBjb25maWcudGFyZ2V0ICsgXCImZD1cIiArIG5vZGUucHJvcGVydHkoXCJlZm9fY29kZVwiKTtcblx0ICAgIG9iai5ib2R5PVwiPGRpdj48L2Rpdj48YSBocmVmPVwiICsgbG9jICsgXCI+VmlldyBkZXRhaWxzPC9hPlwiO1xuXG5cdCAgICB2YXIgbGVhZlRvb2x0aXAgPSBkZXBzW1widG50LnRvb2x0aXBcIl0ucGxhaW4oKVxuXHRcdC5pZCgxKVxuXHRcdC53aWR0aCgxODApO1xuXG5cdCAgICAvL0hpamFjayBvZiB0aGUgZmlsbCBjYWxsYmFja1xuXHQgICAgdmFyIHRhYmxlRmlsbCA9IGxlYWZUb29sdGlwLmZpbGwoKTtcblxuXHQgICAgLy9QYXNzIGEgbmV3IGZpbGwgY2FsbGJhY2sgdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgb25lIGFuZCBkZWNvcmF0ZXMgd2l0aCBmbG93ZXJzXG5cdCAgICBsZWFmVG9vbHRpcC5maWxsKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0dGFibGVGaWxsLmNhbGwodGhpcywgZGF0YSk7XG5cdFx0dmFyIGRhdGF0eXBlcyA9IG5vZGUucHJvcGVydHkoXCJkYXRhdHlwZXNcIik7XG5cdFx0dmFyIGZsb3dlckRhdGEgPSBbXG5cdFx0ICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcImdlbmV0aWNfYXNzb2NpYXRpb25cIikuc2NvcmUsICBcImxhYmVsXCI6XCJHZW5ldGljc1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwic29tYXRpY19tdXRhdGlvblwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlNvbWF0aWNcIn0sXG5cdFx0ICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcImtub3duX2RydWdcIikuc2NvcmUsICBcImxhYmVsXCI6XCJEcnVnc1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwicm5hX2V4cHJlc3Npb25cIikuc2NvcmUsICBcImxhYmVsXCI6XCJSTkFcIn0sXG5cdFx0ICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcImFmZmVjdGVkX3BhdGh3YXlcIikuc2NvcmUsICBcImxhYmVsXCI6XCJQYXRod2F5c1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiYW5pbWFsX21vZGVsXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiTW9kZWxzXCJ9XG5cdFx0XTtcblx0XHRkZXBzLmZsb3dlclZpZXcudmFsdWVzKGZsb3dlckRhdGEpKHRoaXMuc2VsZWN0KFwiZGl2XCIpLm5vZGUoKSk7XG5cdCAgICB9KTtcblx0ICAgIFxuXHQgICAgbGVhZlRvb2x0aXAuY2FsbCh0aGlzLCBvYmopO1xuXHR9O1xuXHRkZXBzLmJ1YmJsZXNWaWV3XG5cdCAgICAub25jbGljayAoYnViYmxlX3Rvb2x0aXApO1xuXHQvLy5vbmNsaWNrIChmdW5jdGlvbiAoZCkge2JWaWV3LmZvY3VzKGJWaWV3Lm5vZGUoZCkpfSlcblx0Ly8gUmVuZGVyXG5cdGRlcHMuYnViYmxlc1ZpZXcoZGl2Lm5vZGUoKSk7XG5cblx0Ly9yZXR1cm4gdGhlcmFwZXV0aWNBcmVhc1NvcnRlZDtcbiAgICB9XG4gICAgXG4gICAgLy8gZGVwcyBzaG91bGQgaW5jbHVkZSAoYnViYmxlc1ZpZXcsIGZsb3dlclZpZXcsIGN0dHZBcGksIHRudC50cmVlLm5vZGUgYW5kIHRvb2x0aXApXG4gICAgdmFyIGdhID0gZnVuY3Rpb24gKGRpdikge1xuXHR2YXIgdmlzID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwicmVsYXRpdmVcIik7XG5cdGlmIChjb25maWcuZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICB2YXIgYXBpID0gZGVwcy5jdHR2QXBpO1xuXHQgICAgdmFyIHVybCA9IGFwaS51cmwuYXNzb2NpYXRpb25zKHtcblx0XHRnZW5lOiBjb25maWcudGFyZ2V0LFxuXHRcdGRhdGFzdHJ1Y3R1cmU6IFwidHJlZVwiXG5cdCAgICB9KTtcblx0ICAgIGFwaS5jYWxsKHVybClcblx0XHQudGhlbiAoZnVuY3Rpb24gKHJlc3ApIHtcblx0XHQgICAgLy92YXIgZGF0YSA9IEpTT04ucGFyc2UocmVzcCkuZGF0YTtcblx0XHQgICAgdmFyIGRhdGEgPSByZXNwLmJvZHkuZGF0YTtcblx0XHQgICAgcHJvY2Vzc0RhdGEoZGF0YSk7XG5cdFx0ICAgIHJlbmRlcihkYXRhLCB2aXMpO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHQgICAgcmVuZGVyKGNvbmZpZy5kYXRhLCB2aXMpO1xuXHR9XG4gICAgfTtcblxuICAgIC8vIHByb2Nlc3MgdGhlIGRhdGEgZm9yIGJ1YmJsZXMgZGlzcGxheVxuICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhIChkYXRhKSB7XG5cdHZhciB0aGVyYXBldXRpY0FyZWFzID0gZGF0YS5jaGlsZHJlbjtcblxuXHRmb3IgKHZhciBpPTA7IGk8dGhlcmFwZXV0aWNBcmVhcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRBID0gdGhlcmFwZXV0aWNBcmVhc1tpXTtcblx0ICAgIHZhciB0YUNoaWxkcmVuID0gdEEuY2hpbGRyZW47XG5cdCAgICBpZiAodGFDaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICB2YXIgbmV3Q2hpbGRyZW4gPSBbXTtcblx0ICAgIGZvciAodmFyIGo9MDsgajx0YUNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIHRhQ2hpbGQgPSB0YUNoaWxkcmVuW2pdO1xuXHRcdHZhciB0YUxlYXZlcyA9IGRlcHNbXCJ0bnQudHJlZS5ub2RlXCJdKHRhQ2hpbGQpLmdldF9hbGxfbGVhdmVzKCk7XG5cdFx0Zm9yICh2YXIgaz0wOyBrPHRhTGVhdmVzLmxlbmd0aDsgaysrKSB7XG5cdFx0ICAgIG5ld0NoaWxkcmVuLnB1c2godGFMZWF2ZXNba10uZGF0YSgpKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICB0QS5jaGlsZHJlbiA9IG5ld0NoaWxkcmVuO1xuXHR9XG5cdHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgXG4gICAgZ2EuZGF0YSA9IGZ1bmN0aW9uIChkKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY29uZmlnLmRhdGE7XG4gICAgXHR9XG4gICAgXHRwcm9jZXNzRGF0YShkKTtcblx0Y29uZmlnLmRhdGEgPSBkO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8vIGdhLnJvb3QgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgLy8gXHQgICAgcmV0dXJuIHJvb3Q7XG4gICAgLy8gXHR9XG4gICAgLy8gXHRyb290ID0gbm9kZTtcbiAgICAvLyBcdHJldHVybiB0aGlzO1xuICAgIC8vIH07XG5cdFxuICAgIGdhLnRhcmdldCA9IGZ1bmN0aW9uICh0KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy50YXJnZXQ7XG5cdH1cblx0Y29uZmlnLnRhcmdldCA9IHQ7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBnYS5kaWFtZXRlciA9IGZ1bmN0aW9uIChkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy5kaWFtZXRlcjtcblx0fVxuXHRjb25maWcuZGlhbWV0ZXIgPSBkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIGdhLnNlbGVjdFRoZXJhcGV1dGljQXJlYSA9IGZ1bmN0aW9uIChlZm8pIHtcblx0dmFyIHRhTm9kZSA9IGNvbmZpZy5yb290LmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KFwiZWZvX2NvZGVcIikgPT0gZWZvO1xuXHR9KTtcblx0aWYgKHRhTm9kZS5wcm9wZXJ0eShcImZvY3VzZWRcIikgPT09IHRydWUpIHtcblx0ICAgIHRhTm9kZS5wcm9wZXJ0eShcImZvY3VzZWRcIiwgdW5kZWZpbmVkKTtcblx0ICAgIGRlcHMuYnViYmxlc1ZpZXcuZm9jdXMoY29uZmlnLnJvb3QpO1xuXHR9IGVsc2Uge1xuXHQgICAgdGFOb2RlLnByb3BlcnR5KFwiZm9jdXNlZFwiLCB0cnVlKTtcblx0ICAgIC8vIHJlbGVhc2UgcHJldiBmb2N1c2VkIG5vZGVcblx0ICAgIGRlcHMuYnViYmxlc1ZpZXcuZm9jdXMoKS5wcm9wZXJ0eShcImZvY3VzZWRcIiwgdW5kZWZpbmVkKTtcblx0ICAgIC8vIGZvY3VzIHRoZSBuZXcgbm9kZVxuXHQgICAgZGVwcy5idWJibGVzVmlldy5mb2N1cyh0YU5vZGUpO1xuXHR9XG5cdGRlcHMuYnViYmxlc1ZpZXcuc2VsZWN0KGNvbmZpZy5yb290KTtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGdhLnNlbGVjdERpc2Vhc2UgPSBmdW5jdGlvbiAoZWZvKSB7XG5cdC8vIFRoaXMgY29kZSBpcyBmb3IgZGlzZWFzZXMgd2l0aCBtdWx0aXBsZSBwYXJlbnRzXG5cdC8vIHZhciBub2RlcyA9IG5vZGVEYXRhLmZpbmRfYWxsKGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vICByZXR1cm4gbm9kZS5wcm9wZXJ0eShcImVmb19jb2RlXCIpID09PSBlZm87XG5cdC8vIH0pO1xuXHQvLyB2YXIgbGNhO1xuXHQvLyBpZiAobm9kZXMubGVuZ3RoID4gMSkge1xuXHQvLyAgbGNhID0gdHJlZS5sY2Eobm9kZXMpO1xuXHQvLyB9IGVsc2Uge1xuXHQvLyAgbGNhID0gbm9kZXNbMF0ucGFyZW50KCk7XG5cdC8vIH1cblx0dmFyIGROb2RlID0gbm9kZURhdGEuZmluZF9ub2RlIChmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgcmV0dXJuIG5vZGUucHJvcGVydHkoXCJlZm9fY29kZVwiKSA9PT0gZWZvO1xuXHR9KTtcblx0aWYgKGROb2RlLnByb3BlcnR5KFwic2VsZWN0ZWRcIikgPT09IHRydWUpIHtcblx0ICAgIG5vZGUucHJvcGVydHkoXCJzZWxlY3RlZFwiLCB1bmRlZmluZWQpO1xuXHQgICAgZGVwcy5idWJibGVzVmlldy5zZWxlY3QoY29uZmlnLnJvb3QpO1xuXHR9IGVsc2Uge1xuXHQgICAgZE5vZGUucHJvcGVydHkoXCJzZWxlY3RlZFwiLCB0cnVlKTtcblx0ICAgIGRlcHMuYnViYmxlc1ZpZXcuc2VsZWN0KFtub2RlXSk7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tEZXBzIChvYmosIGRlcE5hbWVzKSB7XG5cdHZhciBtaXNzaW5nID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxkZXBOYW1lcy5sZW5ndGg7IGkrKykge1xuXHQgICAgaWYgKHR5cGVvZihvYmpbZGVwTmFtZXNbaV1dID09PSBcInVuZGVmaW5lZFwiKSkge1xuXHRcdG1pc3NpbmcucHVzaChkZXBOYW1lc1tpXSk7XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIG1pc3Npbmc7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBnYTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuZUFzc29jaWF0aW9ucztcbiJdfQ==
