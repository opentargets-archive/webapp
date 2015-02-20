(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = geneAssociations = require("./src/geneAssociations.js");

},{"./src/geneAssociations.js":7}],3:[function(require,module,exports){
module.exports = tooltip = require("./src/tooltip.js");

},{"./src/tooltip.js":6}],4:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":5}],5:[function(require,module,exports){
var api = function (who) {

    var _methods = function () {
	var m = [];

	m.add_batch = function (obj) {
	    m.unshift(obj);
	};

	m.update = function (method, value) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			m[i][p] = value;
			return true;
		    }
		}
	    }
	    return false;
	};

	m.add = function (method, value) {
	    if (m.update (method, value) ) {
	    } else {
		var reg = {};
		reg[method] = value;
		m.add_batch (reg);
	    }
	};

	m.get = function (method) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			return m[i][p];
		    }
		}
	    }
	};

	return m;
    };

    var methods    = _methods();
    var api = function () {};

    api.check = function (method, check, msg) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.check(method[i], check, msg);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.check(check, msg);
	} else {
	    who[method].check(check, msg);
	}
	return api;
    };

    api.transform = function (method, cbak) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.transform (method[i], cbak);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.transform (cbak);
	} else {
	    who[method].transform(cbak);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var checks = [];
	var transforms = [];

	var getter = opts.on_getter || function () {
	    return methods.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    for (var i=0; i<transforms.length; i++) {
		x = transforms[i](x);
	    }

	    for (var j=0; j<checks.length; j++) {
		if (!checks[j].check(x)) {
		    var msg = checks[j].msg || 
			("Value " + x + " doesn't seem to be valid for this method");
		    throw (msg);
		}
	    }
	    methods.add(method, x);
	};

	var new_method = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	};
	new_method.check = function (cbak, msg) {
	    if (!arguments.length) {
		return checks;
	    }
	    checks.push ({check : cbak,
			  msg   : msg});
	    return this;
	};
	new_method.transform = function (cbak) {
	    if (!arguments.length) {
		return transforms;
	    }
	    transforms.push(cbak);
	    return this;
	};

	who[method] = new_method;
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    methods.add_batch (param);
	    for (var p in param) {
		attach_method (p, opts);
	    }
	} else {
	    methods.add (param, opts.default_value);
	    attach_method (param, opts);
	}
    };

    api.getset = function (param, def) {
	getset(param, {default_value : def});

	return api;
    };

    api.get = function (param, def) {
	var on_setter = function () {
	    throw ("Method defined only as a getter (you are trying to use it as a setter");
	};

	getset(param, {default_value : def,
		       on_setter : on_setter}
	      );

	return api;
    };

    api.set = function (param, def) {
	var on_getter = function () {
	    throw ("Method defined only as a setter (you are trying to use it as a getter");
	};

	getset(param, {default_value : def,
		       on_getter : on_getter}
	      );

	return api;
    };

    api.method = function (name, cbak) {
	if (typeof (name) === 'object') {
	    for (var p in name) {
		who[p] = name[p];
	    }
	} else {
	    who[name] = cbak;
	}
	return api;
    };

    return api;
    
};

module.exports = exports = api;
},{}],6:[function(require,module,exports){
var apijs = require("tnt.api");

var tooltip = function () {
    "use strict";

    var drag = d3.behavior.drag();
    var tooltip_div;

    var conf = {
	background_color : "white",
	foreground_color : "black",
	position : "right",
	allow_drag : true,
	show_closer : true,
	fill : function () { throw "fill is not defined in the base object"; },
	width : 180,
	id : 1
    };

    var t = function (data, event) {
	drag
	    .origin(function(){
		return {x:parseInt(d3.select(this).style("left")),
			y:parseInt(d3.select(this).style("top"))
		       };
	    })
	    .on("drag", function() {
		if (conf.allow_drag) {
		    d3.select(this)
			.style("left", d3.event.x + "px")
			.style("top", d3.event.y + "px");
		}
	    });

	// TODO: Why do we need the div element?
	// It looks like if we anchor the tooltip in the "body"
	// The tooltip is not located in the right place (appears at the bottom)
	// See clients/tooltips_test.html for an example
	var containerElem = selectAncestor (this, "div");
	if (containerElem === undefined) {
	    // We require a div element at some point to anchor the tooltip
	    return;
	}

	// Container element position (needed for "relative" positioned parents)
	var elemPos = containerElem.getBoundingClientRect();
	var elemTop = elemPos.top + document.body.scrollTop;
	var elemLeft = elemPos.left + document.body.scrollLeft;
	
	tooltip_div = d3.select(containerElem)
	    .append("div")
	    .attr("class", "tnt_tooltip")
	    .classed("tnt_tooltip_active", true)  // TODO: Is this needed/used???
	    .call(drag);

	// prev tooltips with the same header
	d3.select("#tnt_tooltip_" + conf.id).remove();

	if ((d3.event === null) && (event)) {
	    d3.event = event;
	}
	var mouse = [d3.event.pageX, d3.event.pageY];
	d3.event = null;

	var offset = 0;
	if (conf.position === "left") {
	    offset = conf.width;
	}
	
	tooltip_div.attr("id", "tnt_tooltip_" + conf.id);
	
	// We place the tooltip
	tooltip_div
	    .style("left", (mouse[0] - offset - elemLeft) + "px")
	    .style("top", mouse[1] - elemTop + "px");

	// Close
	if (conf.show_closer) {
	    tooltip_div.append("span")
		.style("position", "absolute")
		.style("right", "-10px")
		.style("top", "-10px")
		.append("img")
		.attr("src", tooltip.images.close)
		.attr("width", "20px")
		.attr("height", "20px")
		.on("click", function () {
		    t.close();
		});
	}

	conf.fill.call(tooltip_div, data);

	// return this here?
	return t;
    };

    // gets the first ancestor of elem having tagname "type"
    // example : var mydiv = selectAncestor(myelem, "div");
    function selectAncestor (elem, type) {
	type = type.toLowerCase();
	if (elem.parentNode === null) {
	    console.log("No more parents");
	    return undefined;
	}
	var tagName = elem.parentNode.tagName;

	if ((tagName !== undefined) && (tagName.toLowerCase() === type)) {
	    return elem.parentNode;
	} else {
	    return selectAncestor (elem.parentNode, type);
	}
    }
    
    var api = apijs(t)
	.getset(conf);
    api.check('position', function (val) {
	return (val === 'left') || (val === 'right');
    }, "Only 'left' or 'right' values are allowed for position");

    api.method('close', function () {
	tooltip_div.remove();
    });

    return t;
};

tooltip.list = function () {
    // list tooltip is based on general tooltips
    var t = tooltip();
    var width = 180;

    t.fill (function (obj) {
	var tooltip_div = this;
	var obj_info_list = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

	// Tooltip header
	obj_info_list
	    .append("tr")
	    .attr("class", "tnt_zmenu_header")
	    .append("th")
	    .text(obj.header);

	// Tooltip rows
	var table_rows = obj_info_list.selectAll(".tnt_zmenu_row")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "tnt_zmenu_row");

	table_rows
	    .append("td")
	    .html(function(d,i) {
		return obj.rows[i].value;
	    })
	    .each(function (d) {
		if (d.link === undefined) {
		    return;
		}
		d3.select(this)
		    .classed("link", 1)
		    .on('click', function (d) {
			d.link(d.obj);
			t.close.call(this);
		    });
	    });
    });
    return t;
};

tooltip.table = function () {
    // table tooltips are based on general tooltips
    var t = tooltip();
    
    var width = 180;

    t.fill (function (obj) {
	var tooltip_div = this;

	var obj_info_table = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

	// Tooltip header
	obj_info_table
	    .append("tr")
	    .attr("class", "tnt_zmenu_header")
	    .append("th")
	    .attr("colspan", 2)
	    .text(obj.header);

	// Tooltip rows
	var table_rows = obj_info_table.selectAll(".tnt_zmenu_row")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "tnt_zmenu_row");

	table_rows
	    .append("th")
	    .html(function(d,i) {
		return obj.rows[i].label;
	    });

	table_rows
	    .append("td")
	    .html(function(d,i) {
		if (typeof obj.rows[i].value === 'function') {
		    console.log("FUNCTION!!");
		    obj.rows[i].value.call(this, d);
		    console.log(this);
		    console.log(d);
		} else {
		    return obj.rows[i].value;
		}
	    })
	    .each(function (d) {
		if (d.link === undefined) {
		    return;
		}
		d3.select(this)
		    .classed("link", 1)
		    .on('click', function (d) {
			d.link(d.obj);
			t.close.call(this);
		    });
	    });
    });

    return t;
};

tooltip.plain = function () {
    // plain tooltips are based on general tooltips
    var t = tooltip();

    t.fill (function (obj) {
	var tooltip_div = this;

	var obj_info_table = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

	obj_info_table
	    .append("tr")
	    .attr("class", "tnt_zmenu_header")
	    .append("th")
	    .text(obj.header);

	obj_info_table
	    .append("tr")
	    .attr("class", "tnt_zmenu_row")
	    .append("td")
	    .style("text-align", "center")
	    .html(obj.body);
    });

    return t;
};

// TODO: This shouldn't be exposed in the API. It would be better to have as a local variable
// or alternatively have the images somewhere else (although the number of hardcoded images should be left at a minimum)
tooltip.images = {};
tooltip.images.close = 'data:image/png;base64,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';

module.exports = exports = tooltip;

},{"tnt.api":4}],7:[function(require,module,exports){
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
	var zoomSelect = menu
	    .append("span")
	    .attr("class", "cttvGA_toplevelSelect")
	    .text("Find: ")
	    .append("select")
	    .on("change", function () {
		var n = this.value;
		if (n === "Root") {
		    bubblesView.focus(tree);
		    bubblesView.select(tree);
		    return;
		}
		var nodes = tree.find_all(function (node) {
		    return node.property("efo_code") === n;
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
	    if (node.is_leaf() && (node.property("label") !== undefined)) {
		zoomSelect.append("option")
		    .attr("value", node.property("efo_code"))
		    .text(node.property("label"));
	    }
	    // highlightSelect.append("option")
	    // 	.attr("value", node.property("key"))
	    // 	.text(node.property("key"));
	});

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
		var loc = "/app/#/gene-disease?t=" + config.target + "&d=" + node.property("efo_code");
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
		    "value" : Math.round(node.property("association_score"), 2)
		});
		obj.rows.push({
		    "label" : "Evidence count",
		    "value" : Math.round(node.property("evidence_count"), 2)
		});

		if (node.property("focused") === 1) {
		    obj.rows.push({
			"label" : "Action",
			"value" : "Zoom Out",
			"obj" : node,
			"link" : function (node) {
			    node.property("focused", undefined);
			    bubblesView.focus(tree);
			}
		    });
		} else {
		    obj.rows.push({
			"label" : "Action",
			"value" : "Zoom In",
			"obj" : node,
			"link" : function (node) {
			    tree.apply( function (n) {
				n.property("focused", undefined);
			    });
			    node.property("focused", 1);
			    bubblesView.focus(node);
			}
		    });
		}
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

},{"tnt.tooltip":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL2Zha2VfNDc1ZjU4YjkuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvZ2VuZUFzc29jaWF0aW9ucy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2dlbmVBc3NvY2lhdGlvbnMvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL3NyYy90b29sdGlwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2dlbmVBc3NvY2lhdGlvbnMvc3JjL2dlbmVBc3NvY2lhdGlvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2luZGV4LmpzXCIpO1xuIiwiLy8gaWYgKHR5cGVvZiBidWJibGVzVmlldyA9PT0gXCJ1bmRlZmluZWRcIikge1xuLy8gICAgIG1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXcgPSB7fVxuLy8gfVxuLy8gYnViYmxlc1ZpZXcuYnViYmxlc1ZpZXcgPSByZXF1aXJlKFwiLi9zcmMvYnViYmxlc1ZpZXcuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVBc3NvY2lhdGlvbnMgPSByZXF1aXJlKFwiLi9zcmMvZ2VuZUFzc29jaWF0aW9ucy5qc1wiKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gdG9vbHRpcCA9IHJlcXVpcmUoXCIuL3NyYy90b29sdGlwLmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvYXBpLmpzXCIpO1xuIiwidmFyIGFwaSA9IGZ1bmN0aW9uICh3aG8pIHtcblxuICAgIHZhciBfbWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG0gPSBbXTtcblxuXHRtLmFkZF9iYXRjaCA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgIG0udW5zaGlmdChvYmopO1xuXHR9O1xuXG5cdG0udXBkYXRlID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdG1baV1bcF0gPSB2YWx1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdG0uYWRkID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGlmIChtLnVwZGF0ZSAobWV0aG9kLCB2YWx1ZSkgKSB7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciByZWcgPSB7fTtcblx0XHRyZWdbbWV0aG9kXSA9IHZhbHVlO1xuXHRcdG0uYWRkX2JhdGNoIChyZWcpO1xuXHQgICAgfVxuXHR9O1xuXG5cdG0uZ2V0ID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0cmV0dXJuIG1baV1bcF07XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH07XG5cblx0cmV0dXJuIG07XG4gICAgfTtcblxuICAgIHZhciBtZXRob2RzICAgID0gX21ldGhvZHMoKTtcbiAgICB2YXIgYXBpID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBhcGkuY2hlY2sgPSBmdW5jdGlvbiAobWV0aG9kLCBjaGVjaywgbXNnKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS5jaGVjayhtZXRob2RbaV0sIGNoZWNrLCBtc2cpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0uY2hlY2soY2hlY2ssIG1zZyk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChtZXRob2QsIGNiYWspIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLnRyYW5zZm9ybSAobWV0aG9kW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC50cmFuc2Zvcm0gKGNiYWspO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0udHJhbnNmb3JtKGNiYWspO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHZhciBhdHRhY2hfbWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCwgb3B0cykge1xuXHR2YXIgY2hlY2tzID0gW107XG5cdHZhciB0cmFuc2Zvcm1zID0gW107XG5cblx0dmFyIGdldHRlciA9IG9wdHMub25fZ2V0dGVyIHx8IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBtZXRob2RzLmdldChtZXRob2QpO1xuXHR9O1xuXG5cdHZhciBzZXR0ZXIgPSBvcHRzLm9uX3NldHRlciB8fCBmdW5jdGlvbiAoeCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYW5zZm9ybXMubGVuZ3RoOyBpKyspIHtcblx0XHR4ID0gdHJhbnNmb3Jtc1tpXSh4KTtcblx0ICAgIH1cblxuXHQgICAgZm9yICh2YXIgaj0wOyBqPGNoZWNrcy5sZW5ndGg7IGorKykge1xuXHRcdGlmICghY2hlY2tzW2pdLmNoZWNrKHgpKSB7XG5cdFx0ICAgIHZhciBtc2cgPSBjaGVja3Nbal0ubXNnIHx8IFxuXHRcdFx0KFwiVmFsdWUgXCIgKyB4ICsgXCIgZG9lc24ndCBzZWVtIHRvIGJlIHZhbGlkIGZvciB0aGlzIG1ldGhvZFwiKTtcblx0XHQgICAgdGhyb3cgKG1zZyk7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgbWV0aG9kcy5hZGQobWV0aG9kLCB4KTtcblx0fTtcblxuXHR2YXIgbmV3X21ldGhvZCA9IGZ1bmN0aW9uIChuZXdfdmFsKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gZ2V0dGVyKCk7XG5cdCAgICB9XG5cdCAgICBzZXR0ZXIobmV3X3ZhbCk7XG5cdCAgICByZXR1cm4gd2hvOyAvLyBSZXR1cm4gdGhpcz9cblx0fTtcblx0bmV3X21ldGhvZC5jaGVjayA9IGZ1bmN0aW9uIChjYmFrLCBtc2cpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBjaGVja3M7XG5cdCAgICB9XG5cdCAgICBjaGVja3MucHVzaCAoe2NoZWNrIDogY2Jhayxcblx0XHRcdCAgbXNnICAgOiBtc2d9KTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXHRuZXdfbWV0aG9kLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gdHJhbnNmb3Jtcztcblx0ICAgIH1cblx0ICAgIHRyYW5zZm9ybXMucHVzaChjYmFrKTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHdob1ttZXRob2RdID0gbmV3X21ldGhvZDtcbiAgICB9O1xuXG4gICAgdmFyIGdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgb3B0cykge1xuXHRpZiAodHlwZW9mIChwYXJhbSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtZXRob2RzLmFkZF9iYXRjaCAocGFyYW0pO1xuXHQgICAgZm9yICh2YXIgcCBpbiBwYXJhbSkge1xuXHRcdGF0dGFjaF9tZXRob2QgKHAsIG9wdHMpO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgbWV0aG9kcy5hZGQgKHBhcmFtLCBvcHRzLmRlZmF1bHRfdmFsdWUpO1xuXHQgICAgYXR0YWNoX21ldGhvZCAocGFyYW0sIG9wdHMpO1xuXHR9XG4gICAgfTtcblxuICAgIGFwaS5nZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmfSk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLmdldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9zZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgZ2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBzZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fc2V0dGVyIDogb25fc2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5zZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fZ2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIHNldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgZ2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX2dldHRlciA6IG9uX2dldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kID0gZnVuY3Rpb24gKG5hbWUsIGNiYWspIHtcblx0aWYgKHR5cGVvZiAobmFtZSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBmb3IgKHZhciBwIGluIG5hbWUpIHtcblx0XHR3aG9bcF0gPSBuYW1lW3BdO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgd2hvW25hbWVdID0gY2Jhaztcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXBpO1xuICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYXBpOyIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xuXG52YXIgdG9vbHRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpO1xuICAgIHZhciB0b29sdGlwX2RpdjtcblxuICAgIHZhciBjb25mID0ge1xuXHRiYWNrZ3JvdW5kX2NvbG9yIDogXCJ3aGl0ZVwiLFxuXHRmb3JlZ3JvdW5kX2NvbG9yIDogXCJibGFja1wiLFxuXHRwb3NpdGlvbiA6IFwicmlnaHRcIixcblx0YWxsb3dfZHJhZyA6IHRydWUsXG5cdHNob3dfY2xvc2VyIDogdHJ1ZSxcblx0ZmlsbCA6IGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJmaWxsIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiOyB9LFxuXHR3aWR0aCA6IDE4MCxcblx0aWQgOiAxXG4gICAgfTtcblxuICAgIHZhciB0ID0gZnVuY3Rpb24gKGRhdGEsIGV2ZW50KSB7XG5cdGRyYWdcblx0ICAgIC5vcmlnaW4oZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4ge3g6cGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwibGVmdFwiKSksXG5cdFx0XHR5OnBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcInRvcFwiKSlcblx0XHQgICAgICAgfTtcblx0ICAgIH0pXG5cdCAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKCkge1xuXHRcdGlmIChjb25mLmFsbG93X2RyYWcpIHtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0XHQuc3R5bGUoXCJsZWZ0XCIsIGQzLmV2ZW50LnggKyBcInB4XCIpXG5cdFx0XHQuc3R5bGUoXCJ0b3BcIiwgZDMuZXZlbnQueSArIFwicHhcIik7XG5cdFx0fVxuXHQgICAgfSk7XG5cblx0Ly8gVE9ETzogV2h5IGRvIHdlIG5lZWQgdGhlIGRpdiBlbGVtZW50P1xuXHQvLyBJdCBsb29rcyBsaWtlIGlmIHdlIGFuY2hvciB0aGUgdG9vbHRpcCBpbiB0aGUgXCJib2R5XCJcblx0Ly8gVGhlIHRvb2x0aXAgaXMgbm90IGxvY2F0ZWQgaW4gdGhlIHJpZ2h0IHBsYWNlIChhcHBlYXJzIGF0IHRoZSBib3R0b20pXG5cdC8vIFNlZSBjbGllbnRzL3Rvb2x0aXBzX3Rlc3QuaHRtbCBmb3IgYW4gZXhhbXBsZVxuXHR2YXIgY29udGFpbmVyRWxlbSA9IHNlbGVjdEFuY2VzdG9yICh0aGlzLCBcImRpdlwiKTtcblx0aWYgKGNvbnRhaW5lckVsZW0gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgLy8gV2UgcmVxdWlyZSBhIGRpdiBlbGVtZW50IGF0IHNvbWUgcG9pbnQgdG8gYW5jaG9yIHRoZSB0b29sdGlwXG5cdCAgICByZXR1cm47XG5cdH1cblxuXHQvLyBDb250YWluZXIgZWxlbWVudCBwb3NpdGlvbiAobmVlZGVkIGZvciBcInJlbGF0aXZlXCIgcG9zaXRpb25lZCBwYXJlbnRzKVxuXHR2YXIgZWxlbVBvcyA9IGNvbnRhaW5lckVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdHZhciBlbGVtVG9wID0gZWxlbVBvcy50b3AgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcblx0dmFyIGVsZW1MZWZ0ID0gZWxlbVBvcy5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0O1xuXHRcblx0dG9vbHRpcF9kaXYgPSBkMy5zZWxlY3QoY29udGFpbmVyRWxlbSlcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdG9vbHRpcFwiKVxuXHQgICAgLmNsYXNzZWQoXCJ0bnRfdG9vbHRpcF9hY3RpdmVcIiwgdHJ1ZSkgIC8vIFRPRE86IElzIHRoaXMgbmVlZGVkL3VzZWQ/Pz9cblx0ICAgIC5jYWxsKGRyYWcpO1xuXG5cdC8vIHByZXYgdG9vbHRpcHMgd2l0aCB0aGUgc2FtZSBoZWFkZXJcblx0ZDMuc2VsZWN0KFwiI3RudF90b29sdGlwX1wiICsgY29uZi5pZCkucmVtb3ZlKCk7XG5cblx0aWYgKChkMy5ldmVudCA9PT0gbnVsbCkgJiYgKGV2ZW50KSkge1xuXHQgICAgZDMuZXZlbnQgPSBldmVudDtcblx0fVxuXHR2YXIgbW91c2UgPSBbZDMuZXZlbnQucGFnZVgsIGQzLmV2ZW50LnBhZ2VZXTtcblx0ZDMuZXZlbnQgPSBudWxsO1xuXG5cdHZhciBvZmZzZXQgPSAwO1xuXHRpZiAoY29uZi5wb3NpdGlvbiA9PT0gXCJsZWZ0XCIpIHtcblx0ICAgIG9mZnNldCA9IGNvbmYud2lkdGg7XG5cdH1cblx0XG5cdHRvb2x0aXBfZGl2LmF0dHIoXCJpZFwiLCBcInRudF90b29sdGlwX1wiICsgY29uZi5pZCk7XG5cdFxuXHQvLyBXZSBwbGFjZSB0aGUgdG9vbHRpcFxuXHR0b29sdGlwX2RpdlxuXHQgICAgLnN0eWxlKFwibGVmdFwiLCAobW91c2VbMF0gLSBvZmZzZXQgLSBlbGVtTGVmdCkgKyBcInB4XCIpXG5cdCAgICAuc3R5bGUoXCJ0b3BcIiwgbW91c2VbMV0gLSBlbGVtVG9wICsgXCJweFwiKTtcblxuXHQvLyBDbG9zZVxuXHRpZiAoY29uZi5zaG93X2Nsb3Nlcikge1xuXHQgICAgdG9vbHRpcF9kaXYuYXBwZW5kKFwic3BhblwiKVxuXHRcdC5zdHlsZShcInBvc2l0aW9uXCIsIFwiYWJzb2x1dGVcIilcblx0XHQuc3R5bGUoXCJyaWdodFwiLCBcIi0xMHB4XCIpXG5cdFx0LnN0eWxlKFwidG9wXCIsIFwiLTEwcHhcIilcblx0XHQuYXBwZW5kKFwiaW1nXCIpXG5cdFx0LmF0dHIoXCJzcmNcIiwgdG9vbHRpcC5pbWFnZXMuY2xvc2UpXG5cdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjIwcHhcIilcblx0XHQuYXR0cihcImhlaWdodFwiLCBcIjIwcHhcIilcblx0XHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIHQuY2xvc2UoKTtcblx0XHR9KTtcblx0fVxuXG5cdGNvbmYuZmlsbC5jYWxsKHRvb2x0aXBfZGl2LCBkYXRhKTtcblxuXHQvLyByZXR1cm4gdGhpcyBoZXJlP1xuXHRyZXR1cm4gdDtcbiAgICB9O1xuXG4gICAgLy8gZ2V0cyB0aGUgZmlyc3QgYW5jZXN0b3Igb2YgZWxlbSBoYXZpbmcgdGFnbmFtZSBcInR5cGVcIlxuICAgIC8vIGV4YW1wbGUgOiB2YXIgbXlkaXYgPSBzZWxlY3RBbmNlc3RvcihteWVsZW0sIFwiZGl2XCIpO1xuICAgIGZ1bmN0aW9uIHNlbGVjdEFuY2VzdG9yIChlbGVtLCB0eXBlKSB7XG5cdHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cdGlmIChlbGVtLnBhcmVudE5vZGUgPT09IG51bGwpIHtcblx0ICAgIGNvbnNvbGUubG9nKFwiTm8gbW9yZSBwYXJlbnRzXCIpO1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHR2YXIgdGFnTmFtZSA9IGVsZW0ucGFyZW50Tm9kZS50YWdOYW1lO1xuXG5cdGlmICgodGFnTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiAodGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSB0eXBlKSkge1xuXHQgICAgcmV0dXJuIGVsZW0ucGFyZW50Tm9kZTtcblx0fSBlbHNlIHtcblx0ICAgIHJldHVybiBzZWxlY3RBbmNlc3RvciAoZWxlbS5wYXJlbnROb2RlLCB0eXBlKTtcblx0fVxuICAgIH1cbiAgICBcbiAgICB2YXIgYXBpID0gYXBpanModClcblx0LmdldHNldChjb25mKTtcbiAgICBhcGkuY2hlY2soJ3Bvc2l0aW9uJywgZnVuY3Rpb24gKHZhbCkge1xuXHRyZXR1cm4gKHZhbCA9PT0gJ2xlZnQnKSB8fCAodmFsID09PSAncmlnaHQnKTtcbiAgICB9LCBcIk9ubHkgJ2xlZnQnIG9yICdyaWdodCcgdmFsdWVzIGFyZSBhbGxvd2VkIGZvciBwb3NpdGlvblwiKTtcblxuICAgIGFwaS5tZXRob2QoJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuXHR0b29sdGlwX2Rpdi5yZW1vdmUoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0O1xufTtcblxudG9vbHRpcC5saXN0ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpc3QgdG9vbHRpcCBpcyBiYXNlZCBvbiBnZW5lcmFsIHRvb2x0aXBzXG4gICAgdmFyIHQgPSB0b29sdGlwKCk7XG4gICAgdmFyIHdpZHRoID0gMTgwO1xuXG4gICAgdC5maWxsIChmdW5jdGlvbiAob2JqKSB7XG5cdHZhciB0b29sdGlwX2RpdiA9IHRoaXM7XG5cdHZhciBvYmpfaW5mb19saXN0ID0gdG9vbHRpcF9kaXZcblx0ICAgIC5hcHBlbmQoXCJ0YWJsZVwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudVwiKVxuXHQgICAgLmF0dHIoXCJib3JkZXJcIiwgXCJzb2xpZFwiKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgdC53aWR0aCgpICsgXCJweFwiKTtcblxuXHQvLyBUb29sdGlwIGhlYWRlclxuXHRvYmpfaW5mb19saXN0XG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfaGVhZGVyXCIpXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuXG5cdC8vIFRvb2x0aXAgcm93c1xuXHR2YXIgdGFibGVfcm93cyA9IG9ial9pbmZvX2xpc3Quc2VsZWN0QWxsKFwiLnRudF96bWVudV9yb3dcIilcblx0ICAgIC5kYXRhKG9iai5yb3dzKVxuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIik7XG5cblx0dGFibGVfcm93c1xuXHQgICAgLmFwcGVuZChcInRkXCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbihkLGkpIHtcblx0XHRyZXR1cm4gb2JqLnJvd3NbaV0udmFsdWU7XG5cdCAgICB9KVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5saW5rID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRkMy5zZWxlY3QodGhpcylcblx0XHQgICAgLmNsYXNzZWQoXCJsaW5rXCIsIDEpXG5cdFx0ICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0ZC5saW5rKGQub2JqKTtcblx0XHRcdHQuY2xvc2UuY2FsbCh0aGlzKTtcblx0XHQgICAgfSk7XG5cdCAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAudGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gdGFibGUgdG9vbHRpcHMgYXJlIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcbiAgICBcbiAgICB2YXIgd2lkdGggPSAxODA7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblxuXHR2YXIgb2JqX2luZm9fdGFibGUgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdC8vIFRvb2x0aXAgaGVhZGVyXG5cdG9ial9pbmZvX3RhYmxlXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfaGVhZGVyXCIpXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC5hdHRyKFwiY29sc3BhblwiLCAyKVxuXHQgICAgLnRleHQob2JqLmhlYWRlcik7XG5cblx0Ly8gVG9vbHRpcCByb3dzXG5cdHZhciB0YWJsZV9yb3dzID0gb2JqX2luZm9fdGFibGUuc2VsZWN0QWxsKFwiLnRudF96bWVudV9yb3dcIilcblx0ICAgIC5kYXRhKG9iai5yb3dzKVxuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIik7XG5cblx0dGFibGVfcm93c1xuXHQgICAgLmFwcGVuZChcInRoXCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbihkLGkpIHtcblx0XHRyZXR1cm4gb2JqLnJvd3NbaV0ubGFiZWw7XG5cdCAgICB9KTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGRcIilcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdGlmICh0eXBlb2Ygb2JqLnJvd3NbaV0udmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHQgICAgY29uc29sZS5sb2coXCJGVU5DVElPTiEhXCIpO1xuXHRcdCAgICBvYmoucm93c1tpXS52YWx1ZS5jYWxsKHRoaXMsIGQpO1xuXHRcdCAgICBjb25zb2xlLmxvZyh0aGlzKTtcblx0XHQgICAgY29uc29sZS5sb2coZCk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgcmV0dXJuIG9iai5yb3dzW2ldLnZhbHVlO1xuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmxpbmsgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKVxuXHRcdCAgICAuY2xhc3NlZChcImxpbmtcIiwgMSlcblx0XHQgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRkLmxpbmsoZC5vYmopO1xuXHRcdFx0dC5jbG9zZS5jYWxsKHRoaXMpO1xuXHRcdCAgICB9KTtcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLnBsYWluID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHBsYWluIHRvb2x0aXBzIGFyZSBiYXNlZCBvbiBnZW5lcmFsIHRvb2x0aXBzXG4gICAgdmFyIHQgPSB0b29sdGlwKCk7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblxuXHR2YXIgb2JqX2luZm9fdGFibGUgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdG9ial9pbmZvX3RhYmxlXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfaGVhZGVyXCIpXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuXG5cdG9ial9pbmZvX3RhYmxlXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfcm93XCIpXG5cdCAgICAuYXBwZW5kKFwidGRcIilcblx0ICAgIC5zdHlsZShcInRleHQtYWxpZ25cIiwgXCJjZW50ZXJcIilcblx0ICAgIC5odG1sKG9iai5ib2R5KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0O1xufTtcblxuLy8gVE9ETzogVGhpcyBzaG91bGRuJ3QgYmUgZXhwb3NlZCBpbiB0aGUgQVBJLiBJdCB3b3VsZCBiZSBiZXR0ZXIgdG8gaGF2ZSBhcyBhIGxvY2FsIHZhcmlhYmxlXG4vLyBvciBhbHRlcm5hdGl2ZWx5IGhhdmUgdGhlIGltYWdlcyBzb21ld2hlcmUgZWxzZSAoYWx0aG91Z2ggdGhlIG51bWJlciBvZiBoYXJkY29kZWQgaW1hZ2VzIHNob3VsZCBiZSBsZWZ0IGF0IGEgbWluaW11bSlcbnRvb2x0aXAuaW1hZ2VzID0ge307XG50b29sdGlwLmltYWdlcy5jbG9zZSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQVFBQUFBRUFDQVlBQUFCY2NxaG1BQUFLUTJsRFExQkpRME1nY0hKdlptbHNaUUFBZU5xZFUzZFlrL2NXUHQvM1pROVdRdGp3c1pkc2dRQWlJNndJeUJCWm9oQ1NBR0dFRUJKQXhZV0lDbFlVRlJHY1NGWEVndFVLU0oySTRxQW91R2RCaW9oYWkxVmNPTzRmM0tlMWZYcnY3ZTM3MS91ODU1em4vTTU1encrQUVSSW1rZWFpYWdBNVVvVThPdGdmajA5SXhNbTlnQUlWU09BRUlCRG15OEpuQmNVQUFQQURlWGgrZExBLy9BR3Zid0FDQUhEVkxpUVN4K0gvZzdwUUpsY0FJSkVBNENJUzV3c0JrRklBeUM1VXlCUUF5QmdBc0ZPelpBb0FsQUFBYkhsOFFpSUFxZzBBN1BSSlBnVUEyS21UM0JjQTJLSWNxUWdBalFFQW1TaEhKQUpBdXdCZ1ZZRlNMQUxBd2dDZ3JFQWlMZ1RBcmdHQVdiWXlSd0tBdlFVQWRvNVlrQTlBWUFDQW1VSXN6QUFnT0FJQVF4NFR6UU1nVEFPZ01OSy80S2xmY0lXNFNBRUF3TXVWelpkTDBqTVV1SlhRR25meThPRGlJZUxDYkxGQ1lSY3BFR1lKNUNLY2w1c2pFMGpuQTB6T0RBQUFHdm5Sd2Y0NFA1RG41dVRoNW1ibmJPLzB4YUwrYS9CdklqNGg4ZC8rdkl3Q0JBQVFUcy92MmwvbDVkWURjTWNCc0hXL2E2bGJBTnBXQUdqZitWMHoyd21nV2dyUWV2bUxlVGo4UUI2ZW9WRElQQjBjQ2dzTDdTVmlvYjB3NDRzKy96UGhiK0NMZnZiOFFCNysyM3J3QUhHYVFKbXR3S09EL1hGaGJuYXVVbzdueXdSQ01XNzM1eVAreDRWLy9ZNHAwZUkwc1Z3c0ZZcnhXSW00VUNKTngzbTVVcEZFSWNtVjRoTHBmekx4SDViOUNaTjNEUUNzaGsvQVRyWUh0Y3Rzd0g3dUFRS0xEbGpTZGdCQWZ2TXRqQm9Ma1FBUVp6UXllZmNBQUpPLytZOUFLd0VBelplazR3QUF2T2dZWEtpVUYwekdDQUFBUktDQktyQkJCd3pCRkt6QURwekJIYnpBRndKaEJrUkFEQ1RBUEJCQ0J1U0FIQXFoR0paQkdWVEFPdGdFdGJBREdxQVJtdUVRdE1FeE9BM240QkpjZ2V0d0Z3WmdHSjdDR0x5R0NRUkJ5QWdUWVNFNmlCRmlqdGdpemdnWG1ZNEVJbUZJTkpLQXBDRHBpQlJSSXNYSWNxUUNxVUpxa1YxSUkvSXRjaFE1alZ4QStwRGJ5Q0F5aXZ5S3ZFY3hsSUd5VVFQVUFuVkF1YWdmR29yR29IUFJkRFFQWFlDV29tdlJHclFlUFlDMm9xZlJTK2gxZEFCOWlvNWpnTkV4RG1hTTJXRmNqSWRGWUlsWUdpYkhGbVBsV0RWV2p6VmpIVmczZGhVYndKNWg3d2drQW91QUUrd0lYb1FRd215Q2tKQkhXRXhZUTZnbDdDTzBFcm9JVndtRGhESENKeUtUcUUrMEpYb1MrY1I0WWpxeGtGaEdyQ2J1SVI0aG5pVmVKdzRUWDVOSUpBN0prdVJPQ2lFbGtESkpDMGxyU050SUxhUlRwRDdTRUdtY1RDYnJrRzNKM3VRSXNvQ3NJSmVSdDVBUGtFK1MrOG5ENUxjVU9zV0k0a3dKb2lSU3BKUVNTalZsUCtVRXBaOHlRcG1ncWxITnFaN1VDS3FJT3A5YVNXMmdkbEF2VTRlcEV6UjFtaVhObXhaRHk2UXRvOVhRbW1sbmFmZG9MK2wwdWduZGd4NUZsOUNYMG12b0Irbm42WVAwZHd3TmhnMkR4MGhpS0JsckdYc1pweGkzR1MrWlRLWUYwNWVaeUZRdzF6SWJtV2VZRDVodlZWZ3E5aXA4RlpIS0VwVTZsVmFWZnBYbnFsUlZjMVUvMVhtcUMxU3JWUStyWGxaOXBrWlZzMURqcVFuVUZxdlZxUjFWdTZrMnJzNVNkMUtQVU05Ulg2TytYLzJDK21NTnNvYUZScUNHU0tOVVk3ZkdHWTBoRnNZeVpmRllRdFp5VmdQckxHdVlUV0pic3Zuc1RIWUYreHQyTDN0TVUwTnpxbWFzWnBGbW5lWnh6UUVPeHJIZzhEblpuRXJPSWM0Tnpuc3RBeTAvTGJIV2FxMW1yWDZ0TjlwNjJyN2FZdTF5N1JidDY5cnZkWENkUUowc25mVTZiVHIzZFFtNk5ycFJ1b1c2MjNYUDZqN1RZK3Q1NlFuMXl2VU82ZDNSUi9WdDlLUDFGK3J2MXUvUkh6Y3dOQWcya0Jsc01UaGo4TXlRWStocm1HbTQwZkNFNGFnUnkyaTZrY1JvbzlGSm95ZTRKdTZIWitNMWVCYytacXh2SEdLc05ONWwzR3M4WVdKcE10dWt4S1RGNUw0cHpaUnJtbWE2MGJUVGRNek15Q3pjck5pc3lleU9PZFdjYTU1aHZ0bTgyL3lOaGFWRm5NVktpemFMeDViYWxuekxCWlpObHZlc21GWStWbmxXOVZiWHJFbldYT3NzNjIzV1YyeFFHMWViREpzNm04dTJxSzJicmNSMm0yM2ZGT0lVanluU0tmVlRidG94N1B6c0N1eWE3QWJ0T2ZaaDlpWDJiZmJQSGN3Y0VoM1dPM1E3ZkhKMGRjeDJiSEM4NjZUaE5NT3B4S25ENlZkbkcyZWhjNTN6TlJlbVM1RExFcGQybHhkVGJhZUtwMjZmZXN1VjVScnV1dEsxMC9Xam03dWIzSzNaYmRUZHpEM0ZmYXY3VFM2Ykc4bGR3ejN2UWZUdzkxamljY3pqbmFlYnA4THprT2N2WG5aZVdWNzd2UjVQczV3bW50WXdiY2pieEZ2Z3ZjdDdZRG8rUFdYNnp1a0RQc1krQXA5Nm40ZStwcjRpM3oyK0kzN1dmcGwrQi95ZSt6djZ5LzJQK0wvaGVmSVc4VTRGWUFIQkFlVUJ2WUVhZ2JNRGF3TWZCSmtFcFFjMUJZMEZ1d1l2REQ0VlFnd0pEVmtmY3BOdndCZnlHL2xqTTl4bkxKclJGY29JblJWYUcvb3d6Q1pNSHRZUmpvYlBDTjhRZm0rbStVenB6TFlJaU9CSGJJaTRIMmtabVJmNWZSUXBLaktxTHVwUnRGTjBjWFQzTE5hczVGbjdaNzJPOFkrcGpMazcyMnEyY25abnJHcHNVbXhqN0p1NGdMaXF1SUY0aC9oRjhaY1NkQk1rQ2UySjVNVFl4RDJKNDNNQzUyeWFNNXprbWxTV2RHT3U1ZHlpdVJmbTZjN0xubmM4V1RWWmtIdzRoWmdTbDdJLzVZTWdRbEF2R0UvbHAyNU5IUlB5aEp1RlQwVytvbzJpVWJHM3VFbzhrdWFkVnBYMk9OMDdmVVA2YUlaUFJuWEdNd2xQVWl0NWtSbVN1U1B6VFZaRTF0NnN6OWx4MlMwNWxKeVVuS05TRFdtV3RDdlhNTGNvdDA5bUt5dVREZVI1NW0zS0c1T0h5dmZrSS9sejg5c1ZiSVZNMGFPMFVxNVFEaFpNTDZncmVGc1lXM2k0U0wxSVd0UXozMmIrNnZrakM0SVdmTDJRc0ZDNHNMUFl1SGhaOGVBaXYwVzdGaU9MVXhkM0xqRmRVcnBrZUdudzBuM0xhTXV5bHYxUTRsaFNWZkpxZWR6eWpsS0QwcVdsUXl1Q1Z6U1ZxWlRKeTI2dTlGcTVZeFZobFdSVjcycVgxVnRXZnlvWGxWK3NjS3lvcnZpd1Jyam00bGRPWDlWODlYbHQydHJlU3JmSzdldEk2NlRyYnF6M1diK3ZTcjFxUWRYUWh2QU5yUnZ4amVVYlgyMUszblNoZW1yMWpzMjB6Y3JOQXpWaE5lMWJ6TGFzMi9LaE5xUDJlcDEvWGN0Vy9hMnJ0NzdaSnRyV3Y5MTNlL01PZ3gwVk85N3ZsT3k4dFN0NFYydTlSWDMxYnRMdWd0MlBHbUlidXIvbWZ0MjRSM2RQeFo2UGU2VjdCL1pGNyt0cWRHOXMzSysvdjdJSmJWSTJqUjVJT25EbG00QnYycHZ0bW5lMWNGb3FEc0pCNWNFbjM2WjhlK05RNktIT3c5ekR6ZCtaZjdmMUNPdEllU3ZTT3I5MXJDMmpiYUE5b2IzdjZJeWpuUjFlSFVlK3QvOSs3ekhqWTNYSE5ZOVhucUNkS0QzeCtlU0NrK09uWktlZW5VNC9QZFNaM0huM1RQeVphMTFSWGIxblE4K2VQeGQwN2t5M1gvZko4OTduajEzd3ZIRDBJdmRpMnlXM1M2MDlyajFIZm5EOTRVaXZXMi9yWmZmTDdWYzhyblQwVGVzNzBlL1RmL3Bxd05WejEvalhMbDJmZWIzdnh1d2J0MjRtM1J5NEpicjErSGIyN1JkM0N1NU0zRjE2ajNpdi9MN2EvZW9IK2cvcWY3VCtzV1hBYmVENFlNQmd6OE5aRCs4T0NZZWUvcFQvMDRmaDBrZk1SOVVqUmlPTmo1MGZIeHNOR3IzeVpNNlQ0YWV5cHhQUHluNVcvM25yYzZ2bjMvM2krMHZQV1B6WThBdjVpOCsvcm5tcDgzTHZxNm12T3Njanh4Kzh6bms5OGFiOHJjN2JmZSs0NzdyZng3MGZtU2o4UVA1UTg5SDZZOGVuMEUvM1B1ZDgvdnd2OTRUeis0QTVKUkVBQUFBR1lrdEhSQUQvQVA4QS82QzlwNU1BQUFBSmNFaFpjd0FBQ3hNQUFBc1RBUUNhbkJnQUFBQUhkRWxOUlFmZEN3TVVFZ2FOcWVYa0FBQWdBRWxFUVZSNDJ1MTllVmlVWmZmL21RMFFsV0ZuMkFWY3dJVWRBZGRjRURSTnpTVlJNeTJWeXJjMFUzdlRNbE96c3NVMUJkejNGUVFHbUkyQkFmU0hTbTVaV2ZvbStwYml2bVVLZ3B6Zkg5L09jODA4Z2t1dk92TU05N2t1cm5OWkxQT2MrM3crOStjKzk3bnZCNEFaTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmpabjRUc1JDWTJoZGZmQ0ZDUkZGZFhaMm9vcUlDS2lvcVJBQUFpQ2hDUkJZZ0lTVzNTSVFpa1FoYXRHaUJBUUVCOUcrY09YTW1HOGpHVGdEejU4OFhWVlJVaUNzcUtpUUFJRDE5K3JUMHpKa3pNZ0N3QlFBWkFFZ0JRQUlBNHIrL0dGa0t6eEFBNnY3K3VnOEF0UUJRQXdEVkxWcTBxQWtJQ0tnRmdGcC9mLy83Z1lHQmRiTm56MFpHQUZacWMrZk9GWjA1YzBaU1VWRWhQWDM2dE8zWnMyZnRBYUNwcDZlbmMxeGNYRXVGUWhIbzZlbnAzNlZMbDBBM056ZUZyYTF0TXhzYm0yWVNpY1JXTEJZM1pWZ1NJUG9Sb2FhbTVpOEFxSzZxcXJwZFZWVjErOUtsU3hmKzMvLzdmNmNyS3l2UFhyaHc0WFI1ZWZsL0tpc3Jyd0hBWDM1K2ZuY0NBZ0txL2YzOWEvMzkvZS9QbXpjUEdRRUkyT2JNbVNNNmMrYU05TXlaTTdZR2c2RXBBRFR2MkxGallFeE1USHhpWW1MSDBORFFTQnNiRzBWTlRRMVVWMWZEdlh2M29LYW1CdXJxNnFDdXJnNFFrZnRpSmx3VGk4VWdFb2xBSkJLQldDd0dpVVFDTXBrTWJHeHNRQ3FWd3QyN2R5OGNQMzc4aUU2bk8zRDQ4T0d5UTRjT25RYUFQN3QyN2ZvWEFGUjM3ZHExZHNHQ0JjZ0lRQ0EyWnN3WXlkbXpaKzJLaTR1YjJkblpPUThaTXFSYi8vNzlFenQyN0JodFoyZm5lK2ZPSGJoejV3N1UxTlJBYlcwdDkzTzF0YlZ3N3R3NXVIMzdObFJXVm9KVUtvWEt5a3BvMHFRSlhMNThHZHpkM2VIU3BVdk1DOFM3dWJuQjNidDN3ZFBURTJwcmE4SFQweE9hTldzRzN0N2VJSlZLVFFoQ0twV0NyYTB0Mk5uWndaMDdkLzRvTHk4dlY2bFUycHljbkpMcTZ1cXJYYnAwdWUzbjUxZTFkZXZXKzR4U0xkQSsvUEJEMGF1dnZpcno5L2QzQklDQVhyMTZEVm0xYXRYMjMzLy8vZXFaTTJmdytQSGpXRjVlanZ2Mzc4ZXlzakpVcVZUNDZhZWY0dFNwVTdGNzkrN1l1M2R2dExPenc3Q3dNSlJLcFJnUkVZRlNxUlFqSXlOUkpwTmhWRlRVUTMxMGREVHpadkNQR3BmSXlFaVQ4UXdMQzBNN096dnMzYnMzZHUvZUhhZE9uWXB6NXN4QmxVcUZaV1ZsV0ZaV2hnY1BIc1REaHcvanp6Ly9qQ2RPbkxpK1pNbVNIZDI2ZFJzQ0FBRyt2cjZPeWNuSnN1blRwN09ha0NYWUJ4OThJQm8xYXBTTm41K2ZzNTJkWGZENDhlT24vL0RERDhmT25UdUhQLzMwRTVhWGwyTlpXUmtXRmhiaWloVXJjT2pRb1ppUWtJQlNxUlREdzhOUktwVnl5UlFiRzRzeW1Remo0K05SSnBOaHAwNmRVQ2FUWWVmT25kSEd4cVpCMzZWTEYrYk42QjgyUHNialNPTks0eHdkSFcyU0J3a0pDVGhreUJCY3NXSUZGaFlXWWxsWkdlN2Z2eDhQSHo2TUowNmN3SktTa2g5R2pSbzEzZGJXTnRqWDE5ZDV4SWdSTnUrLy96NGpBbk5aY25LeXpOZlgxOG5lM2o1a3hvd1pjeXNxS3Y0NGMrWU1Iamx5aEp2cDA5TFNNQ2twQ1dOaVlreG1kRXFDVHAwNm9ZMk5EWGJ0MmhWdGJHendoUmRlUUJzYkcrelJvd2ZhMnRwaXo1NDk2L1c5ZXZWaTNnSjlRK1BWbzBjUGsvR2w4U1p5b0h5SWlvcENxVlNLTVRFeDJLZFBIMHhOVGVXVVFYbDVPUjQvZmh3UEhUcjB4NlJKaytZMmFkSWt4TWZIeDJuWXNHRXloc2JuYU1PSEQ1ZjQrUGc0QUVEUU8rKzhNL1AwNmRPL256NTlHZzhkT29SbFpXV28wV2h3d29RSjJMVnJWNVJLcFp3Y2pJdUxRNWxNWmdKMjQrUkpTRWhBVzF0YlRFeE1SRnRiVzB4S1NtTGVpanlOSzQwempUdWZGQ2hQaUF5NmR1Mks0OGVQUjQxR2cyVmxaWGpnd0FFOGR1d1lscGVYL3o1Ky9QaVpBQkRrN2UzdDhQTExMMHNZT3AraFRaMDZWUlFmSDI4SEFGNUpTVW5KUjQ0Y09Ycm16Qms4ZlBnd2xwV1ZZWFoyTms2YU5BbnQ3ZTI1bVQ0dUxzNWtjR2xtNTRPOWI5KythR3RyaXkrKytLS0o3OSsvUCtmdDdPeVlGNUEzSGovK3VOSjQ4MG1CbEFLZkRDSWpJOUhlM2g0blRacUUyZG5aWEszZ2h4OStRSTFHYzdSNzkrN0pBT0RWc1dOSHUwbVRKckZsd2RPMm9VT0hTcnk5dlIwVkNrWGt1blhydHA4L2Y3NzIyTEZqdUgvL2ZsU3BWRGhreUJDTWlJaEFtVXlHSFR0MlJKbE14cTBSK2FDbkdhRmZ2MzRtNEI0d1lBRGEyZG5oU3krOVpPSUhEaHpJdklBOWZ6eHBuSWtjS0E4b0wvaGswS1ZMRjVPOGlvaUl3Q0ZEaG5DRncvTHljdnpoaHg5cXYvNzY2KzF1Ym02UlhsNWVqb01HRFpJeTFENEZtekpsaW1qbzBLRzJBT0RWdjMvL2NXZk9uRGwvOHVSSlBIandJQm9NQnB3NWN5WTJiZHFVbS9GcFRVL3luZ2JUZUlhdkQrd05KYytnUVlPWXR3TC9LSEtnZk9BckJNb2ZXaVpRelNBeU1oS2JObTJLTTJmT1JJUEJ3QlVMeThyS3ppY2tKSXdEQUsrQkF3ZmF2dlhXVzB3Ti9BL2dGM3Q3ZXplMXM3TnJ2V0xGaXRYbnpwMnJQWExrQ083YnR3K1hMVnVHdlhyMVFwbE1oakV4TVNheWpkWjJ4T2lQQXYzakp0SGd3WU9aRjVCL1VuSm9pQXdvajNyMTZtV1NaekV4TVNpVHliQlhyMTY0ZE9sUzNMZHZIKzdmdngrUEhEbFNPMi9ldkRXMnRyYXRQVDA5bTc3MTFsdGlodVovQm43SG9LQ2d6dnYyN1R2dzIyKy80WUVEQjFDdjErT0lFU013TEN5TTI5cDUySXhQOHI2aG1aN05rTXcvVEJuUU1xRWhSVUJiaTJGaFlUaGl4QWpVNi9WWVZsYUdodzRkd2wyN2RoMzA4L1ByN09ucDZmam1tMjh5RW5pQzliNFVBRnpqNCtPSFZsUlVWUDcwMDA5WVZsYUcyN2R2eDRDQUFHNnRUL3U5dE5YRFpuem1uNmNpNk5tenAwbS9RVVJFQkxabzBRSzNiZHVHKy9idHc0TUhEMkpKU1VsbGVIajRVQUJ3ZmVtbGwxaGQ0REhBTHdNQXhXdXZ2VGJwanovK3VIMzA2RkhjdDI4ZmZ2MzExeWlYeXpFcUtvcVRZYmEydHRpN2QrL0htdkVaeUpuL0orVHdLRVZBK1VmTGdxaW9LSlRMNWZqMTExOXpTNElEQnc3Y0hqeDQ4TDhBUURGZ3dBRFdNL0FJOEh0Tm16WnQ1cmx6NSs0ZE9uUUk5KzNiaCsrKys2N0pXcjk3OSs0bWNxeGZ2MzRtVE0xQXoveXpKQVBLTTlvOW9EenMzcjI3U1czZzNYZmY1VWlndkx6ODNyaHg0MllDZ0JjamdZZUEvK09QUDU3NysrKy8zejk0OENBV0ZCVGcyTEZqdVMwWVkvRDM2ZFBIQlB4c3JjLzg4NjROR0pNQTVTT1JBRzBaamgwN0Znc0tDbWhKY1AvTk45K2MrL2VPRmlNQnNpRkRoa2dCd1BQRER6LzhoTUN2MVdweCtQRGhYSnVtY2FHUG1qZjRhMzIybGNmODg5eEM1TmNHS0MrcFFFanR4Y09IRDBldFZrdHE0UDc0OGVNL0FRRFAvdjM3czVyQTBLRkRKUURnL3M0Nzcwei8vZmZmYXdqOGd3Y1BOdW5rbzJZZUtzQ3dHWjk1Uzl3dG9QeWtKaUxxSkJ3OGVMQXhDZFFrSnlkUEJ3RDMvdjM3Tjk3MjRjbVRKNHU5dmIyZGs1S1N4dnorKys5VkJ3OGVSSjFPaDBPSERqV1orZm5ncDVtZmRld3hiMGtkaHZ4ZEFpSUJVZ0pEaHc1Rm5VNkgrL2J0dzlMUzBxb3VYYnE4cGxBb25DZE9uTmo0dGdqZmZmZGRrYmUzdDBPSERoMzZuajE3OXZxaFE0ZXdzTEFRazVPVDZ3Vi9RN0tmZ1o5NVN5Q0JocFlEZkJKSVRrN0d3c0pDM0xkdkgrcjErdXN0Vzdic3ExQW9IQ1pNbU5DNE9nWmpZMk9idUxtNWhSODdkdXprMGFOSHNiUzBGRk5TVXRqTXo3elZLNEdVbEJRc0xTM0Z2WHYzNHU3ZHUwKzZ1TGlFUjBaR05tbE1SVDhaQVBoblpHU29mdjc1Wnl3dExjVzVjK2VhVlBzZnRlWm40R2Zla2ttZ29ab0E3UTdNblRzWFMwdExjZCsrZmZqVlYxK3BBTUMvVWV3TVRKNDhXUXdBYnRPblQ1OTkrdlJwM0x0M0w2NWF0UXB0YlcyNWZmNUhWZnNiT3JYSFBQUG05UHo4YkdoM0lDWW1CbTF0YlhIVnFsVllXbHFLcGFXbE9IcjA2RThBd0czQ2hBbldYUS93OXZadUZob2EydmZNbVRPM0R4dzRnRXFsRWwxY1hEQTZPcHJiNTdleHNYbmttcDk1NW9WQUJzWWtZSnpmMGRIUjZPTGlnams1T1ZoYVdvbzZuZTcyMy9XQVp0YmU3Qk5vTUJnT0hqMTZGRXRLU2pBbUpvWTd5dHV0V3plMHNiSGhtaXJZek0rOE5TbUJQbjM2b0kyTkRYYnIxbzA3VWh3ZEhZMGxKU1ZZVWxLQzZlbnBCd0VnMENvN0JmK1cvcTdUcDAvLzlOU3BVMWhhV29wVHAwN2xUdlhSNVIzODlsNytaUjNNTXk4a3orOFlURWhJTUxsa0pDd3NES2RPbllvbEpTVm9NQmh3OU9qUmN3SEExZXEyQnVQajQ1djQrZm5GL2ZiYmI5ZjM3OStQbVptWjNHMjhkSWtISGF4ZzRHZmVta21nZCsvZUpwZUxSRWRIWTJabUpwYVVsR0J1YnU1MUR3K1B1T2pvYU92WkZYai8vZmZGQU9DVm5wNisvZmp4NDFoY1hJeXZ2UEtLU2FjZlhlTFJ0MjlmVGpZeEVtRGVXc0JQK1V5bkNPbHlFZW9VZk9XVlY3QzR1QmdOQmdQKys5Ly8zZzRBWGxaemtVaW5UcDJhUmtkSHYzajY5T2w3ZS9mdXhSVXJWbkJYTC9PMy9JeUR4U2NCNXBrWG91Zm5NMzlya0s2cy8rNjc3N0M0dUJqVmF2Vzk0T0RnRjJOaVlvVC9Uc3JwMDZkTEFNQm4rL2J0K1VlT0hNSGk0bUpzMmJJbFJrWkdtcHp1UzB4TTVHUVNBei96MWtvQ2xOKzB5MFc3QXBHUmtkaXlaVXRPQmN5Yk55OGZBSHdtVFpvazdMTUNuVHQzYmhvZkgvL1NiNy85Vmx0YVdvcWZmdm9waG9hRzFsdjRhMGorTTgrOE5aR0E4ZlZpeGdYQjBOQlEvUFRUVDBrRjFMWnIxKzRsUWF1QUdUTm1pQUhBYS8zNjlWbUhEeDlHZzhHQVBYdjJOTG5Mei9nQ3ovb1VBUFBNVzVPbi9PWmZORXAzQy9iczJSTU5CZ01XRmhiaXJGbXpzZ0RBYTlLa1NXS2h6djUyclZxMTZuYnExS203cGFXbHVIanhZcFJLcGZXMit6THdNOTlZU2NDNFRWZ3FsZUxpeFl2UllEQ2dVcW04NitQajB5MG1Kc1pPY09DZk5tMmFDQUJjNTh5WnMrTFlzV05vTUJnd05EUVVJeUlpVE83MDY5T25EeWVMaklQRFBQUFc3Q25mcWVtTjdoU01pSWpBME5CUU5CZ01XRkJRZ09QR2pWc0JBSzZDZTl2UXlKRWpaUktKcFBVUFAvend4OTY5ZTNIOSt2WFl2bjE3azl0ODZaWGNmQVhBUFBPTndWUGVVMThBM1M3Y3ZuMTdYTDkrUFJZVkZlSG16WnYvRUl2RnJRY1BIaXlzN2tCZlg5OW1RNFlNbVhEaXhBa3NLaXA2NEtpdjhWWGVUQUV3MzFnVkFQK0tjZU1qdzBWRlJhaFNxYkJyMTY0VHZMeThoSE5HNElNUFBoQUJnR0xWcWxWWjVlWGxxTlZxVVM2WGN6My90UFZCOG9lQ1FOVlI1cGx2REo3eW5zNElkTy9lblRzajRPRGdnRnF0RmdzS0NuRDY5T2xaQUtENDE3LytKWXhsd0toUm8yUzJ0clp0Zi9ycHAyc2xKU1U0Yjk0ODdOQ2h3d1B5bjRHZmVVWUNTU2J0d2JRTTZOQ2hBODZiTnc4TEN3dHgyN1p0MTJReVdWdkJMQU82ZHUzYWRPREFnZU4rL1BGSExDd3N4REZqeHFCVUttM3dtaStoazhBL2ZWODlBMEhqamlOOS92cXVENU5LcFRobXpCZ3NMQ3pFM054YzdOU3AwN2lPSFRzMkZZcjhkMXV3WU1INjh2SnkxT2wwSnZLL1c3ZHVKaTlUNEpPQVVEeDlidkswbkNGUHowZWUvLy81UHkrMDUyZHhmTHJQVDg5bmZGUllMcGVqVHFkRHJWYUw0OGVQWHc4QWJ1Kzg4NDVsTHdObXpab2xBWUNBQXdjT25Dd3RMY1Z2di8yV3EvN1RxVDlxL2hIYW9EV1VyTFNjb2VlaUFpZmYwLytuNzIrc1pNRGlXSDg4cUNtSVRnbTJiOThldi8zMlc5VHI5Wmllbm40U0FBTGVmZmRkeTI0Tjd0YXRtNDIzdDNmc1R6LzlWRk5ZV0lpVEowODJPZmpEZjRzdmY5QXMxZk5uSkVwQ1dzNVFZWlAyYzZuTm1UejlkenI3UUQ5SHY0Yy93d2tsTGl5T1Q4ZnozenBNQjRRbVQ1Nk1lcjBlZCszYVZlUGk0aEliR3h0clkra0UwR3pZc0dGdkhUdDJEUFY2UFlhSGg1dGMrbUhNM0VKUFZyckJpQXFiZExTWk9oMzVudjQvZlQ4dGg2eWRERmdjSDg4VExvd3ZDd2tQRDBlOVhvODVPVG5ZdFd2WHR6cDI3R2p4MjRFdTc3Ly8vc3FEQncraVhxL253TTkvdzQrbER3cGZscEw4cEJtS2xqUDBJc2pJeUVoczBxUUpKaVFrWUh4OFBMNzIybXM0YU5BZ0hEdDJMSGJxMUFrVEVoTFEzdDZlZTdVNUtTTDZQVFNqMGQ5NWxMd1ZHdmlmTkk1OSt2VEIrUGg0SERWcUZBNGFOQWhIalJxRmNYRnhtSkNRZ0haMmRseE55VnJpU0orUC8wYWgwTkJRMUdxMXFGYXJjZWpRb1NzQndNVmlrVDl6NWt3UkFIaGxaV1VaU2twS2NQUG16U2lWU3JuQjRyL1NtMS9Rc1JUUG42bElsdEdNUTFjN1IwUkVZSFIwTkg3NDRZZTRkT2xTVkt2VldGQlEwT0NYUnFQQjVjdVg0OHlaTXpFMk5wYUxDODFzOVB0cG1kVFFUQ1lVL3lSeDdOaXg0MlBIVWFWUzRhSkZpM0Q2OU9rWUVSSEJrYXJRNDJqOHFuRWlRNmxVaXBzM2IwYU5Sb1B6NXMwekFJRFg1TW1UTGJNUStQSEhIMHNBSUdqLy92MW5pNHFLY1BiczJWd0JNRDQrM29TWmhaSzBORlBSNmNXb3FDaDBkM2ZIano3NkNIZnYzczFWYWZQeThuRFBuajI0ZGV0V1hMOStQYTVldlJyVDA5Tng3ZHExdUhIalJ0eTVjeWRtWjJlalNxVkNuVTZIQlFVRm1KbVppYk5uejBaL2YzL3VmZ1Q2Ty95WlRHZ2tRSitYUCtQVDgwVkdSbUpBUUFET25qMGJNekl5Nm8zamhnMGJjTTJhTmJocTFTcGN0MjRkRjhlY25CeFVxOVZjSEhmdTNJa2ZmdmdodXJtNVlWUlVWTDF4RkFvSlVMem9kR0Q3OXUxeDl1elpxTlBwTUMwdDdTd0FCRTJaTWtWaXFldC9tVmdzYm52czJMRXF2VjZQTTJiTVFLbFVhbkxsdHpIVDhiZDR6TzNwYzlFeWhRcE9ORlBGeDhmajlPblRVYVBSb0ZhclJhVlNpUnMzYnNTbFM1ZFdmL2poaDBkZmV1bWw5WjA3ZC80NFBEejg5Ylp0Mnc1dDBhSkZZa2hJeU5Dd3NMQnhuVHAxK25qQWdBRnJQL3JvbzhPcHFhbFZPM2Z1eFB6OGZOVHBkS2pUNlhEbXpKbGNFd2pOWktTWTZQTllhdHllTkk2ZE8zZkdEei84a0FOOVRrNE94YkdLNHRpcFU2ZVB3c1BEMytqUW9jUElGaTFhSklhR2hvNktpSWdZMzZsVHA0OWZmdm5sVFhQbnp2MXAxYXBWOTNidjNzMlJxbHF0eHZmZWU0OXJwNlcrRTRvamYxbGdxWEV6dmpwY0twWGlqQmt6c0tDZ0FEZHYzbHdsRm92YnhzWEZ5U3lWQUd3akl5TjdIemx5QkhVNkhRNFlNSUM3L0tOejU4NzFNckdsSmkxVm5XbHRPbjc4ZU16SXlFQ3RWb3Q3OXV6QjFOUlVuRFp0V25tblRwMCtkbkJ3NkFnQS9rVkZSYjN4SVZaVVZOUWJBUHliTjI4ZTNibHo1NW16WnMzYXYzbno1cnJjM0Z6VTZYU1lsWldGYjcvOXRzbmFsZ3FuRFJXNExNM3pDM3o4T0w3OTl0dTRaODhlMUdxMW1KbVppU3RXckxnL2RlclUvZkh4OFI4MWI5NDg1bkhpT0hYcTFOWUEwTUxKeWFsVDE2NWQ1M3o2NmFkSHRtelpnbmw1ZWFqVDZYRDM3dDA0ZHV4WWt6Z0toVXdwZmpRWmhJYUc0b0FCQTFDbjArR09IVHV3WmN1V3ZlUGk0bXd0bFFDYURoZ3dZTnozMzMrUE9wME9CdzBhWkxJRnlKZGpOQWptOXNaSmE3eUdqSTZPUmljbkoxeTRjQ0UzNDZlbnArTTc3N3l6TnpnNGVDUUFCTlRXMWxiZ1A3RGEydG9LQUdnUkhCdzhiTnEwYVVYYnQyOUhsVXFGV3EwV2x5eFpnaTR1THB5Y3BRSVhyYUg1TTVtbGVEclFRcCtUUG5kVVZCUTZPenZqa2lWTHVEaW1wYVhoVzIrOVpRZ0tDaG9LQUMzK2FSeXJxcW9NQUJBWUdocjY2c2NmZjN4ZzU4NmQzUEpnd1lJRktKZkxPUVZLNDhvblUwdkxRMUlBdEJVNGFOQWdqdGhpWTJQSHhjYkdXbVpIWU5ldVhac25KeWRQcDlkOHQyclZpdHNGb09CYld2STJCUDZvcUNoMGMzUERUWnMyb1VhandSMDdkdUJubjMxMk1Tb3FhaklBQk9CVE5BRHdqNDZPZnZPNzc3NDdwMVFxVWF2VjR1Yk5tOUhUMDVNckZGbzZDZFFIZmlwa0tSUUtycEMxZmZ0Mm5EZHYzdm13c0xDM0FhREZVNDVqWVBmdTNhZWxwNmRmeWMzTlJhMVdpeHMyYkRBaFUwc25BWW9qS1lDd3NEQnMxYW9WNm5RNjNMTm5EM2J2M24xNng0NGRtMXNrQWZqNStUbU9IVHQyZmxsWkdlcDBPb3lMaTdOb0JkQlFkVG9xS2dvVkNnVnUyN1lOMVdvMWJ0aXdBU2RObWxUcTR1TFMrZmJ0Mit2eEdWaFZWWlhCMmRtNTR3Y2ZmRkNRbFpXRldxMFdkKzNhaFg1K2ZseVYyN2l3WlV3QzVvcW5jY2VlOGVlaUFsWkVSQVQ2K3ZyaXJsMjdVSzFXNDdwMTZ6QWxKVVh2NU9RVVcxVlZaWGdXY2J4eTVjcW43dTd1M2ViT25icy9PenViSTFQakFtRkR1d1NXcWdEaTR1SlFwOU5oVGs0T0ppUWt6UGZ5OG5LMDFKMUFwL0hqeHk4cUxTM2xqZ0R6RlFDZmVjM2xDVHoxZ2QvRnhRVTNiZHFFS3BVS1Y2OWVqY25KeWJza0VrbHJmQTRtRm90YlRwdzRjV05tWmlhcTFXcmN1WE1uK3ZuNVlYaDRlTDBrWU81NGtuTGlnejg4UEJ4OWZYMXh4NDRkbUorZmo2dFdyY0xodzRkdkVvbEVMWjlISEdVeVdmRGt5Wk96OXV6Wmd4cU5CamR1M0ZpdkVpQVM0Sk9wdWVOcHJBRGtjamxYTEUxTVRGd0VBRTZXU2dET0V5ZE9YRmxTVW9KYXJSYmJ0Mjl2Y2djZ1h3RllTckNwVUJVZEhZMU5talRCOVBSMFZLbFV1SGJ0V2h3K2ZQaW1weTM1SDBQSytyMzIybXZMTEowRUhoZjg2ZW5wT0hEZ3dPVUE0UCtjNHhqNHpqdnY3TXpPemthTlJvT3BxYW5ZcEVrVHJpWkE0MjRwa3hKZkFkQWRnZTNidCtkcUowbEpTU3NBd05saUNTQWxKV1cxd1dCQXJWYUxVcW0wUVFYUTBFR1A1K1g1NEtjcTllelpzMUdqMGVDV0xWdHczTGh4dVFBUWlHWXdBUEN0andUNG5aWFVSc3VmeVo2MUorVkVmNTg2MThMQ3dob0N2Njg1NGlpVlNsdk5talZMazV1Yml4cU5CcWRQbi83QTdvQWw1cVd4QXBCS3BhalZhakUzTnhmNzlldTMycElKd0NVbEpXVjFVVkVSYWpRYURBNE9ObEVBMUxOdENVRTI3a0duL2VuRXhFUlVxOVdZa1pHQkgzNzQ0Uy8yOXZhaGFFWWpFc2pJeUVDVlNvVTdkdXhBWDE5ZnM1UEFvOEMvZmZ0MnpNdkx3N1MwTkh6cHBaZk1CbjZ5NXMyYmg2V21wdjZhbjUrUGFyVWFFeE1UVGZvdCtHY0p6SjJmeG5rcGxVb3hPRGdZTlJvTktwVks3TnUzNzJwTGJnYzJJUUJqQldCY3hUWU90cms4QlptYVJrSkRRM0hKa2lXWWw1ZUhTNWN1cmZMeDhSbUlGbUNQSWdIalpwZjZUc2s5YmM4L3JVZnhzMVR3azdWdTNYcFFWbFpXbFZxdHhrV0xGbkUzVkZIOCtDUmdMcy9mUlNFRklFZ0NJQVZBY3N0U2dzeHZTdzBQRCtkbS95MWJ0dURMTDcrOEJnQTgwVUxNVWtoQXFPRC9PNGFlNzd6enpycjgvSHpVYURUWXUzZHY3b3A2ZnR1d3BVeE90QXNnS0FVd2NlTEUxWVdGaGFoV3F6a0ZZQnhrY3l1QStxcitNcGtNTjI3Y2lMbTV1ZmpsbDE5ZXNiZTNqMEFMTXo0SmJOKytIWDE5ZmJsT1M1S3pWTk40MnNsTTRLZmZUOHVtME5CUUUvQ25wcVphSFBqSm5KeWNvdmZzMlhOZHJWWmplbm82eW1TeUJuY0Z6SjJmaEJkU0FHcTFHbk55Y29SRkFHM2F0REU1QzBEdG1CUmtjM21hd2Fqd04yREFBRlNwVkxoMTYxWjg4Y1VYbHorcUZkV2NKREJtekpobHUzZnZ4dno4L01jbWdmODFYbzhDLzdadDJ6QTNOeGRUVTFOeHdJQUJGZ2wrYWlHZU5HbFNta3FsUXJWYWpVbEpTZlcyQzF0S2Z0SlpnRFp0MmdpVEFLUlNLWWFHaHRZcnM4d1ZYSDdocWtPSERqaDU4bVRNejgvSFpjdVdWVGs1T1hWR0M3Ym5UUUxXQW40eVgxL2Y3bXExdWthbFV1SGJiNy9OeGMyNG9Hck8vT1F2VDBORFE2MUhBVkFTa2N4NTN0NzRFZ3JxVkpOS3BiaGp4dzdNeXNyQzk5NTdyOWpTRS9oaEpFQ0ZMVDRKR084U1BJbW5uK09EdjBPSERvSUVQL1ZZckZxMWFyOWFyY2F0VzdlYTNGZGhmS21JT2ZQVXVDOUZrQXBBcjllalNxVkNpVVRDTVN5L2VjWGN3U1g1MzcxN2QxU3BWTGhseXhiczBxWExwLy8wVUlxNVNHRFhybDJZbDVlSDI3WnRlNm9rOERqZ1Z5cVZ1SExsU3NHQUh4R3h1cnJhTUd6WXNNODBHZzJxVkNydStpMSt2TXc5U1ZGVFZXaG9LRW9rRWxTcFZKaWRuWTFKU1VuQ0lZRFdyVnVqVkNwOW9OQkNEL204UGEydGpPVi9VbElTNXVmbjQ1bzFhekF3TUxBZkNzZ2VSUUswdHFXNEcrOFNQRTZjNk9lSUxCc0EvektoZ0o4c0ppWm1JTDEycTNmdjNseTgrSDBWNXNwVDR3SzFWQ3JGMXExYkM1TUFKQktKeFFhWHJsdWFPWE1tNXVYbDRiSmx5MjRDUURBS3pKNDJDVmc3K1A4K2I5RzJzTER3amtxbDRpNnRvUnVaekQxSjFWZWpFcVFDeU0vUDV4UUFCWmZXV1BTUXo5dno1V3k3ZHUxdy92ejVxRlFxOGJQUFBqdnh2SHYrbnlZSnZQcnFxeHdKYk4yNkZYMTlmYm5yMktnR1EvSG5Md3Y0OGFIdmk0Nk81cTZsOHZYMXhhMWJ0d29lL0hSR0lEYzM5emUxV28yZmZQSUp0bXZYN3FITHB1ZnRLZjQwU2JWdTNScno4L014S3l0TEdBUlFVRkNBK2ZuNUpncUEzNnhpcnVBYUgxaVJTcVc0YXRVcXpNN094bG16WnUwREFCOFVxQkVKN055NUUzTnpjeCtiQlBqMzd6OE0vRGs1T2JoaXhRcnMzNysvWU1GUHNkcStmZnQralVhRGFXbHBLSlZLSHpob1phNzg1RGRaa1FJUUpBRzBhdFVLcFZMcEF4MVg5SkRQMnh2ZjlDT1R5VEFrSkFUWHJsMkwyZG5aT0czYU5CMEFlS0dBclNFU29CbU9mMkVteFlPODhjV25wSkNzRGZ4L3g4bDc0OGFOZXExV2k2dFhyOGFRa0JBVGt1UXZsNTYzcDNHZ1hhcFdyVm9KVndIUURNU1hWK1lLcnZIQkZhbFVpaHMyYk1EczdHejg5Ny8vclJjNkFUd0pDVkJOaG1aOCtyZTFnNThJWU51MmJRYWRUb2ZyMXEwek9iTkNjVEJYZnZLWHFlM2J0eGVXQXBnd1ljSnFuVTZIZVhsNURTb0EvdXVlbnBjM3ZxT09GTUN5WmNzd096c2I1OHlaVTJZTnlXMU1BanQyN0VDbFVvbGJ0bXd4SVFHcXlkQ3lqRHp0aHhQNHQyelpndG5aMmZqZGQ5L2hpeSsrdU15YTRyTm56NTZER28wR0Z5OWUvSUFDNEMrVG5yZXZUd0hRZGVtQ0lnQ0pSTUlsSGI4YWJhN2dHaDlna1VxbCtNMDMzNkJTcWNTdnYvNWFzRVhBSnlHQnRtM2JjazFRcEFpTS85MjJiVnVyQmo4VkFRc0xDMDlxTkJwY3VIQ2hpUUlnTWpSWGZ2SjNYOXExYTRjU2lVU1lCTkN5WlV1dXdGTGZPOTJldCtldmNVTkNRdkR0dDkvRzNOeGNYTDE2OVEwaGJnTStLUW40K1Bod014NDFhWkVQQ1FsQkh4OGZxd2IvMzNGcGUralFvZHNxbFFvblRwejRnQUpvcUVieXZEemhoQXJWTFZ1MkZCNEI1T2Jtb2tRaTRXWWNLcnlSdkRKWGNQa0tZUFRvMGR4YXVXWExsbjNSeW94UEFwczNiMFlmSHg5dWl6WWtKSVRiYXZMeDhjSE5temRiTmZnUkVUdDM3anp3MEtGRG1KdWJpOG5KeWZVcUFIUGxKN1dwRTE3YXRtMkxFb2tFYzNOek1UTXpFeE1URXkyZkFPajZJbU1GWUJ4Y0lvSG43V2tMMERpNHZyNittSnViaXhrWkdkaTdkKzg1UW1rRmZsSVNHRDE2OUxMdDI3ZGpUazRPYnRxMENYMThmREF3TUJDbFVpa0dCZ2FpajQ4UGJ0cTBDYk95c25ENTh1VldDLzdxNm1yRDY2Ky9QcitzckF4emMzTlJvVkJ3eTFUS0MxSUE1c3BUbXFTTUZZQWdDY0JZQVpEc3RyVGd0bXJWQ2pkdTNJZzVPVG40eVNlZkdLd3g2UnNpQVc5dmIvVHg4VUZ2Yis5R0FYNktRMDVPemw2OVhvOXIxNjdsQ3RXV05ra1JYZ1N0QUlLQ2dremtGVzBGRWdrOGIwOXJLMkw2RGgwNm9GUXF4Vm16WnRFeW9NckZ4U1VlcmRUNEpMQng0MGFNam83R2pSczNOZ3J3SXlMNit2cDJPWDc4ZUhWK2ZwN2FBQ2tBQUNBQVNVUkJWRDUrOE1FSEtKVkt1V1kxcWdGUW5wZ3JUMmtMa0phcFFVRkJ3aU1BcFZLSkVvbUVLN0FRbzFsS2NHbUxKVGc0R0VORFExR3BWR0pXVmhZT0h6NTgwVysvL2ZaNll5RUJldTdHQVA2aW9xTGVzMmZQWG43Z3dBRlVLcFhZcmwwN3JnYkNmOFc0T1NjcFk3eUVoSVNnUkNKQnBWS0pHUmtad2lJQVVnQlVaYWF0UUhNRmx6eHRzUkREdG1yVkN0UFQwMUdwVk9LR0RSc3VObS9lUEJ5dDJJZ0V0bTNiaHBtWm1iaHMyVEtyQno4aW9yT3pjOFR4NDhldjBEc0NTUDZUUXJXMC9LVExRSUtDZ29SSkFNWUtnSnBNYUkxRlN1QjVlMko0WWxoNmVjbW9VYU5RcVZSaWRuWTJqaDgvUGhVQVBCb0JDU3hadEdnUjl1L2ZmNG0xZ3g4QUZGOTg4VVZhZVhrNUtwVktIREZpQlBmU0RlTU9TY29QYytVbjFhZ0lMNEpXQUZSbGJtaU5aUzVQREV2TGdMWnQyNkpVS3NYbHk1ZWpVcW5FM2J0MzN3a0lDT2lQVm00QTRCRVZGZFhQMnNrT0VURXNMR3pBcjcvK2VrZWxVdUh5NWN0TnhwM2tQeWtBYytjbnYwWVZHQmdvWEFVUUhCeHMwbWxHRE10dlEzMWVudjQrQlpsa1Z1dldyYkZObXphb1ZDb3hOemNYMDlMU2ZtcmF0R2w3WkNaNGs4dmxIUTRlUFBoTFNVa0pLcFZLYk5PbURkY0hRZktmSmlkTHlFOWp2QVFIQnd0TEFZd2ZQMzYxUnFQQm5Kd2NUZ0h3WlphNWdrdWVtSjVrRmpGdHk1WXRNU1VsQlhOeWNqQTNOeGMvK3VpakhHdHFEMjZNQmdBQm16WnR5djcrKys5UnFWUmlTa29LMTU5Q3lwVE9SbEJlbURzLytjdlR3TUJBek1uSndkMjdkMk9mUG4yRVF3QVNpWVM3R0pUMldVbCtFOU9aeTVNQ29HVUE5VnkzYnQwYXYvcnFLOHpKeWNIOC9IeDg3NzMzMXNKemZxa2xzNmNHZnYvbHk1ZXZPMzc4T09ibDVlSENoUXV4VmF0VzNCa1ZZL2xQK1dEdXZDUjhVSjlLbXpadFVDS1JDSk1BQWdJQ0hsQUFsaEJrOHZSNUtOalVkTkdoUXdkY3VYSWxLcFZLVktsVU9HWEtsRlFBOEdPUUVoVDQvUll2WHB6Njg4OC9ZMzUrUHE1Y3VaSzdYSVBXL2pRcFdXcGVrZ0lJQ0FnUXJnS29iNjFsekhUbTh2UTVhQmxBdFFCYWMwVkdSdUtxVmF0UXFWU2lXcTFtSkNCQThKODRjUUx6OC9OeDFhcFZHQkVSd2RXa2pQT1J4dC9TOHBLMnFGdTNiaTFjQmRDaVJRdE9YaHNIMjl4QkprOU15eWNCa2wwUkVSR01CS3dJL0xRY3BiNFVHbmZLQTB2SlMrTjdHYVJTS2JabzBVSllCS0JXcXpFN08vdWhDc0JTUFA4OFBNa3VZdDZJaUFoTVQwL0huSndjVktsVU9IbnlaRVlDQXBEOWVYbDVtSjZlem9HZjhwQUtmL3o3RUN3dEwva0tJRHM3RzNmdDJpVXNBaUFGd0wrRXd0S0NUWXhMYTBJK0NZU0hoek1TRUNENHc4UERUY0JQdFNnYVo3Nzh0eFJ2ZkRrTEtRQkJFb0JFSXVIYUxVbDJFZU5hbXFlZ0UvT1MvS0txTVNNQllZS2Y4by9HazVRb1h3RlltcWZsS09XZlZTZ0FmdFhWVWp6TkJJOGlnYkN3TUVZQ0FnQi9XRmpZWTRHZlh3T3dGRTg0c1FvRlVGL1RoU1Y3Q2o0eE1BMENJd0ZoZ3AvR2p4UW9YLzVicWpkdVRoT2NBbENwVkppVmxZWCsvdjdjdFZNMHMxcHkwR2xtYUlnRWFEQ0lCTEt6c3pFL1A1K1JnSVdCbnlhZGhzRFBWd0NXNWdrbmRGVFozOThmczdLeWNPZk9uY0lpQU9QQm9BS01wUWVma1lDd3dKK2JtMnRWNE9mdlJsRytDWklBL1B6ODZtMitvSWUwVkUvSlFwK1g1QmdkemFSQkNRME5aU1JnQWVDblYyalR1TkRNU2N0T0drYytDVmlxcHhvVU5hWDUrZmtKVndIUXBTRFVEQ1NVUVhnVUNRUUZCVEVTc0NEdzAzZ0lIZnowT2Fsd1NjOGxhQVhBNzhDaWg3UjBUOGxEbjV0a0dURXpJd0hMQWo4cFRWcHUwcmp4U2NEU1BiOGoxU29WQUNNQlpnejhEWHVyVUFDK3ZyNG1Db0F2eTRUaUtabm84OVBnRUVNSEJnWnlwd2daQ1R4NzhOT3BQb283NVJkTk1qUk9mQklRaXFmbEp1V1hyNit2Y0JVQVhRcEN6VUJDR3d4R0Fnejg1dkMwaTBIUEtSZ0NlT09OTjFibjUrZmpuajE3T0FYQTc4WG12NU5PS0o2U2k1NkRCb25PREFRRUJIQWtrSmFXaGxsWldaaVhsOGRJNENtQVB5MHRqUU0veFpueWlpWVhHaGMrQ1FqTjg4K2krUHI2NHA0OWUzREhqaDJZa0pBZ0hBS2d3VEp1QmhMcW9Ed3BDYlJ2Mzk2RUJONTk5MTFHQWs4SS9wOSsrZ21WU2lXbXBhVmgrL2J0R3dYNGpWL1VTcGVCU0NRU1lSS0FqNC9QQXozWnhvTWtWRS9KUnM5ai9JSk5SZ0xQRC93MHFkQTQ4RWxBcUo1L0JzWEh4MGY0Q29CdUJ4YjY0REFTWU9CL0hwNTJOYXhLQVpCY3MzWVNJT1p1MGFJRkk0R25BSDZLSStXUnRZT2Zmd0JOMEFxQWpnUlR0WllLSE5iaVNhN1JvQkZ6RzVPQVdDeG1KUEFQd0M4V2l4OEFQOFdYNGszeHQ3YThJcnpROHd1U0FMeTl2VTBPYU5BTTJkaEl3Ti9mSDhWaU1iWnIxNDZSd0dPQXYxMjdkaWdXaTlIZjM3OVJncDl3UW1jYnZMMjloYXNBNkVnd3JkMW8wS3pOVTFMUzRGR3kwaUQ2K2ZtaFdDekdrSkFRUmdJUEFYOUlTQWlLeFdLdWpad21ENG9ueFpkUEF0Ym1DUzlFZ29Ja0FDOHZMNU4yWUJyRXhrSUNKT09vbmRQSHh3ZkZZakcyYWRPbVBoTHdiV1RnOStXRHYwMmJOaWdXaTduYUVlVU54Ykd4Z0o5d1Fubmo1ZVVsWEFYZzUrZG53bWcwZU5idWFSRHB1YW1hNitucGlXS3hHSU9DZ2pnU3lNckt3b2tUSnk1cFRBVHd6VGZmTFBueHh4ODU4QWNGQmFGWUxFWlBUMCtUM1NPS0gxLytXN3VuNXlZbFpGVUtvTEdSQUg4WjRPYm1ocDZlbnJobXpScmN2WHMzTGxteUJBY05HdlJWWXlLQU45OTg4NnV0VzdkaVJrWUdybG16QmowOVBkSE56ZTJoOHIreDVZMVZLQUJmWDErdUlHWXM0NnpkR3hjQ2phdTVDb1VDdmJ5OE9QQXZYcndZKy9YcnR4UUFmQnJaRXNCbjVNaVJTemR2M3N5UmdKZVhGeW9VQ3BQZEkzNEJzTEhrRHowM3RkTUxrZ0JJenRHQklQNWFyckdBbnc1MGVIbDVvWmVYRjY1ZHU1WURmOSsrZlpjMXR2Vy9jUjBnT1RsNUdaSEEyclZydVJnWjUwMWpJd0hDQ2VXTnA2ZW44QlVBWDg1WnE2ZkJvNlNsdGIrUGp3OEQveE9RQUJVQ3FSWkE4YVQ0V25zZUVWNnNRZ0UwVk5CaDRHL2M0R2NrVUwrdnIzQXNXQVhnNCtQREZUU3NlZkFZK0JrSlBNMDhJcnpROHd1U0FJd0xPc1lkWGZTUTF1S0pzYW56ajhEdjdlM053UDhVU0lBNlNpbXVsRWNVZDJ2TEovNVpFb1ZDSVV3Q2VGaFRCd00vTTBZQ0RYdCs4NWdnQ2NERHc0TnJCemJlMTZWQkU3cW5KS1I5ZmdiKzUwc0NsRTk4TWhDNnAzd2kzSGg0ZUFoWEFkQ2cwWllPQXo4elJnS1A5clFGNk8zdExYd0ZRSjFkdEF5Z3dSS3FwNlFqbVVack5iYlAvM3o3QkNqdWxGZDhNaENxcDd3aTNBaEtBUmpmQ215c0FQaFZYR3NGLzdwMTZ6QWpJd09YTEZtQy9mcjFZK0IvQ2lRd2N1VElaVnUyYk1ITXpFeGN0MjVkb3lBQlkwVXBGb3VGZVMyNHU3dTdWU2tBU2k2U1o3UkdZK0EzTHduUU9OQXlVK2drd0ZjQTd1N3V3aVFBc1Zoc3d0VEdneU0wVCtURkI3K25weWNEdnhsSmdKck4rQ1RBVndSQzg4YkswbW9VQUoraEdmaVpNUko0MEZPZVdZVUNNQjRjNDBFUmlxZGtvalVaRFFxZDZtUGd0d3dTb0tZekdoK3FPZkhKUUNqZWVKSVJyQUp3YzNQakRnUVpEd29EUHpOR0FnMTd5amZDalp1YkcxTUFEUHpNR2hNSldJMENNRzRISmpCUmxkTlNQYTNCcUJEREIvL2F0V3NaK0MyUUJLaFBnRThDTkk0MHJwYWVmOFlIeWVnR0tVRVJnRnF0eHV6czdBY1VnQkFHNFZIZ1g3ZHVIV1ptWnVMU3BVc1orQzJFQkVhTkdyVnM2OWF0dUdmUG5nYVZnRkJJb0w1Q3MxZ3N4dXpzYk55MWE1ZXdDTURWMWRXa0dZZy9DSmJtaVhrcCtMUUdZK0FYTmduUU9OSzQwamhiYWg0U1RxZ0p5TlhWVlpnRVlLd0FqTmRrRFB6TUdBazhQQThKTDFhbEFQakJ0eFJQak12QWI1MGtRR2RTK0NSQTQyNXArVWlmenlvVUFKK0JMUzNvZlBCVHdkTER3NE9CM3dwSmdNYlhVa21BUG8veEpNUVVnQmxtZms5UFR3WitLeUlCVDAvUEJwY0Rsa1lDZ2xjQUdvMEdjM0p5VUN3V1A1SjV6ZTFwclVXZlQ2RlFvTE96TTY1WnN3YjM3Tm1EeTVZdFkrQVhNQWxzMjdZTnM3S3ljTTJhTmVqczdNeVJBSTAzZjVmQTNMNCtKU29XaXpFbkp3ZDM3OTR0TEFKd2NYRXhPUkJrNmNGV0tCUm9aMmVIUzVZc3dUMTc5dUNLRlN2d3BaZGVTZ2YyR20raGtvRGYyTEZqMDNiczJJSFoyZG00Wk1rU3RMT3plNEFFTEhWU29vTkFMaTR1d2lRQVMxWUFmTmxQMWRZcFU2Wmdkblkycmw2OUdwT1Rrek1CSUlCQlNkQWtFUER1dSs5bTdONjlHN096czNIS2xDa211MU1OTFFlWUFuaUtDcUNoWUp2TEU4UHl3UjhURTRQWjJkbTRkZXRXZk8rOTk0N2IyTmkwWlJBU3Z0bloyYlZkdEdqUjhUMTc5bUJPVGc3R3hNU1lLRlBLQThvTGMrY25QeThGclFEb1NEQVZBaTB0eUpRRTd1N3V1R1RKRXN6TXpNU3Z2dnJxamtLaDZOY0laa2RGY25MeVlBQlFXUHV6dG1qUm90LzI3ZHZ2WkdkbjQ3ZmZmc3NkVk9PVGdLVk1Ub1FYZDNkM1lTbUFDUk1tck5acXRhaFVLaHRVQVBTUTV2TDBPWXlEM0xkdlg4ekp5Y0cxYTlkaS8vNzlWd0tBaDdXdmo1Y3VYYnJ5MTE5L3hmZmZmMytsdGRjNUFNQmo0c1NKcVZsWldaaVRrNE1KQ1FrUFRFNldscC9HQ2tDcFZHSkdSZ1ltSmlZK1ZRS1FQa3MydUg3OU9yaTR1TURGaXhkQm9WREErZlBud2N2TEM4NmRPd2ZlM3Q1bThWNWVYbkQrL0hsUUtCUlFXVmtKcnE2dWNPWEtGUmcyYkJqVTF0YkNIMy84Y1ZHbjA2MUF4QXRncFNZU2lmd1hMMTQ4TXlFaElhV2lvZ0lTRWhMZXZILy92a2drRXZrajRsbHJmR1pFdk9EZzRCRFJvMGVQbDVzMmJlcjJ5aXV2Z0Y2dkJ6YzNONmlzckFSUFQwK0x5azhQRHcrNGNPRUN1TGk0d05XclY1OVpYTVRQTXVoT1RrNXc5ZXBWY0hkM2h3c1hMbkJCTmxkd3ZiMjk0Zno1OCtEcDZRbVZsWlhnN3U0T1Y2NWNnYzZkTzRPcnF5dmN1blVMaW91TE4vLzg4ODh4MWc3K3hNVEVsRE5uemtCTlRRM1UxdFpDVWxKU3lwUXBVMmFLUkNKL2EzMzJuSndjVjYxV3V4MEF3TVBEQStMaTR1RHk1Y3ZnN3U1dVFnS1drSjhYTGx3QWQzZDN1SHIxS2pnNU9RbVRBRWdCWExwMGladHhpV0hONVFuOENvVUNMbDI2Qk03T3poQVJFUUdJQ05ldVhidDc2TkNoM1lHQmdXc2FBL2pQblRzSGMrYk1nUXNYTGpRS0VuamhoUmQwZVhsNTJ3SGdIaUpDZUhnNE9EczdtK1NucDZlbldmUFR5OHZMSkQ5ZFhGemcrdlhyd2lNQWtVakVLUUEzTnpjVEJVQXl4eHkrc3JLU2sxZXVycTV3N2RvMWlJMk5oWnFhR3ZqUGYvNnovOGFORzM5WUsvaVhMRmt5TXlrcEtlWHMyYk53L3Z4NW1EOS9QaHcrZkJqbXo1OFBGeTllaFB2MzcwUGZ2bjFUM252dlBhc2xnVXVYTHYzKzMvLys5NEJZTEliWTJGaTRkdTBhdUxxNndvVUxGOEREdzRPYnBNeVpwNlFBM056Y09BVWdFb2xBSkJJSlV3RmN2bnpaSW9ONzVjb1ZhTnUyTGNqbGNyaHo1dzRjUFhxMHVMYTJ0dFJhd1c4ODgzLzIyV2R3OXV4WmNIQndnTE5uejhKbm4zMW1vZ1NzbFFTcXE2czNHUXlHRW9sRUFpNHVMdEM2ZFd1NGN1V0tSVTVTbHk5ZkZxNENNSzRCdUxtNW1SUUNLY2ptOE1iQmRYWjJCbTl2YjBCRXFLcXFnblBuemgyUVNDUXRyQjM4Q3hZc2dJcUtDbkJ5Y29KYnQyNkJrNU1UVkZSVXdJSUZDNnllQkd4c2JMcWZQbjM2b0V3bUF3QUFiMjl2Y0haMmhzdVhMNXNzQTh5WnB3cUZBaTVldkdpaUFBUmJBNkRnR2hjQ0tjam04QjRlSG5EeDRrVk8vb2VFaEFBaXdwMDdkMjZlUFh2MlRHTUEvK25UcDhIWjJSbHUzTGdCTGk0dWNPUEdEWEIyZG9iVHAwODNDaEk0ZlBqd2Z4RHhMd0NBa0pDUWVwY0I1c3hUS2dEU0pDVTRCVUJyRlVkSFJ5NjQvRUtMT2J3eHMxNjVjZ1djbkp6QTFkVVZFQkgrL1BQUDh3QlFiWTNnUDN2MkxKdzdkdzQrLy94enFLaW80SktLU05EVjFaVWo2NHFLQ3ZqODg4ODVFckRTbWtEVm5UdDN6b3ZGWW5CeGNRRW5KeWR1R1VCSzFkeDVldW5TSlc1OEhCMGRuMWtncE04d0FibVo1Y3FWS3hhbEFJejNWNTJjbkdnSmNCTUFhcXdaL0RUekUrZ3A2UzlmdnN6OW01VEE1NTkvRGpObnpnU0ZRZ0Y5Ky9aTitic0laUzE5QWpYVjFkVTNiRzF0T2ZLaldwVkNvYkNJUEhWM2QrZDJxYTVkdThZVkFaOTJJZkNaTmdMSjVmSjZGWUM1dkxIOEp3VmdhMnRMeGFHL0FLRE9Hc0ZQc3QvSnlja0UvQ1F6S2RtTTQwTExBU0tCcEtTa0ZQcjlWa0FDZGZmdTNic2pFb2xBSnBOeHRTcFhWMWU0ZVBFaXR3d3daNTdTTHRXVksxZEFMcGNMVHdFQUFOeThlYk5lZVhYaHdnV3plWGQzZDdoNDhTTEhyQktKaElDRDFnNStrdjNVbkdVTWZ2cDNZeUVCaVVRaUVvbEVJQmFMdWVYUGxTdFh1RW5DM0hsS3lvekdUVEExQUdPcElwZkx1YVNqclVCekJ0WER3OE5rYmVYazVBUjM3dHdCc1ZnTTl2YjI5cys2S1BvOHdKK1VsSlR5My8vK0Y4NmZQLy9FNEtmT001TEZ4aVJnM0Njd2RlcFVvZGNFSkgrUE45eTVjOGRFR1YyNmRNa2k4cFRJK1ByMTZ5Q1h5NTlaSDhCelZ3QVVYSE40S2dBYXI2MXUzYm9GWXJFWTVISzVDd0RJaEE1K212ay8rK3l6ZXNGUHoyOE1mbVBQcndrUUNYejIyV2N3YTlZc3JpWWdjQ1VnbGN2bHp0WFYxWERyMWkwVEJVQUswUkx5VkpBS2dGOERNQzZ3R0FmWEhONVk1cElDT0h2MkxJaEVJbkIwZFBRQ0FEdHJBUC84K2ZOTndFOEZUMHFxaHNCUDhhSDlaMnBDSVJLWVAzKyt5ZTZBVUpXQVdDeHUwcng1YzA5RWhQLys5NzhtQ3NDUzhwVGlML2dhQU1sS2tsZm1EQzdOZ0FTSzgrZlBnMGdrZ2laTm1qUVBEZzRPc2did1U1TVBnZi9hdFdzUGdQOWh5V2VzQkl4M1N5b3FLbUQrL1BudzBVY2ZDVm9KZE92V0xWZ2tFaldwcTZ1RGMrZk9jWEVpQldBSmVXcXN3QVRaQjJCY0F6QU9ycVVvQUVycTc3Ly9Ia1FpRWRqYjI0T2ZuMS9IZS9mdUZRdDF6ZisvZ3A5cUpNWks0TnExYXlaS2dFaUFhZ0w5K3ZWTGVmLzk5d1dqQkc3ZnZyMGhPRGk0NDcxNzkwQWtFa0Y1ZWJuSkpFVzFLblBuNlpVclYwd1V3TE9xQVR4dGM1azRjZUpxdlY2UEtwVUtSU0lSZHlrSTNXeENseHlZeTlNZGEzUmx1Wk9URTI3YXRBbno4L054d1lJRiswQUFGMk1BZ04rU0pVdFNmLzMxVjlUcGRMaCsvWG9NQ2dveWlUZTltSldlbCs2WGY5dzQwZmZUejlQdmMzRnhRWkZJaEVGQlFiaCsvWHBVcTlWWVVGQ0E3Ny8vZnFwQVl1ZXYwV2dPRkJVVjRabzFhOURKeWNra0graDV6WjJuaEJlS3QwcWx3dXpzYkV4S1NyTHNHNEdNQ2NEUjBkRWt1RSthaE04anVIUVJxRXFsd2gwN2R0eFRLQlRkR2p2NHJaa0VXclpzMmVQbm4zK3UwV2cwK0s5Ly9jc2tEeXhsa3FLNEUyNGNIUjJGUlFDRmhZVVdxd0FvdU1iSkhCSVNnaXFWQ25OemMzSHMyTEVycDA2ZDJ0cVN3WC95NU1sbkRuNXJKQUVBOFBqODg4OVhIeng0RUZVcUZiWnUzZnFCdUZuaUpDVTRCVkJZV0locXRkcGlGVUI5eTRCbHk1YWhXcTNHYmR1MlhYVjBkSXl5WlBBWEZCVGdoZzBibmpuNG40UUVObXpZZ0JxTkJ2VjZ2Y1dTZ0plWFYreUpFeWV1RnhRVTRMZmZmbXV4OHI4K0JhQldxekVuSndmNzl1MHJIQUlRaVVUbzdPeGNMOE9hMnhzbnNWZ3N4djc5KzZOYXJVYVZTb1dUSmsxYUJ3Q2VRZ0EveFplU2hXWU9QZ244cjU1K0gvMSsrbnZPenM2Q0lBRUE4RnEyYk5tV1E0Y09vVnF0eG43OStwbU12NlhtSjhWWGtBUWdsOHROZ3Z5MGsvSi9UV1pLWXBySkZpMWFSSUd1YXRPbXpjc00vTlpEQXZIeDhjTk9uVHAxVDZmVDRWZGZmZlZZeXNuYytVbWZUeTZYQzRjQVVsSlNWaGNWRmFGR283Rm9CY0JQWWljbkp3d0tDa0tWU29WYXJSWTNiZHIwSDdsY0htNEo0RDkxNmhUcTlYcXpndjlKU1VDcjFXSmhZU0ZPbXpiTjdDVGc0ZUVSOWNNUFAxVHMyN2NQOC9QenNVV0xGZy9JZjNvZVMxVUE5SzROU3ljQTU0a1RKM0lFWUtrS29DRVNjSFIweE5HalI2TkdvMEdkVG9lZmYvNjVSaXdXdDdRazhGTlNtQVA4ajBNQ1lySFlva2hBSnBPMXpzbkpLVHh5NUFocU5CcE1UazYyZVBEekZZQ1RreE5xTkJvcUFxWUJnTFBGRXNENDhlTlhFZ0hZMk5nMFdHaXhGTSt2QlRnNU9lSFhYMy9OeWRpUFAvNTRCd0FFUG1md3QxaTZkR21hTWZnREF3TzV6MWZmMnRXUzRpY1dpekV3TU5DRUJLWlBuNTRHQUMyZVp4d2xFa25MVFpzMlpmejQ0NDlFNkZ4aDJsTGkxNUEzVnFaMmRuWWNBU1FtSm41bnlRVGdORzdjdUVVR2d3RzFXaTNIYVB5dFFFc0pNbjhHbzgvcDdlMk42ZW5wcU5WcXNhaW9DRC8vL1BNc0d4dWI0T2VVdEszV3JGbXo3ZVRKazFoWVdJZ2JOMjU4SlBqTkZWZjZ1dzhqZ1kwYk42Sk9wME9Ed1lCejVzelpKaGFMV3oyUE9OcmIyNGZzMnJVcjc4U0pFMWhRVUlEcDZla21iOXQ5bUlLeWxMeWt6NmxRS0ZDcjFXSldWaFltSkNRc0FnQW5pMFMvcjYrdjQ2dXZ2anEvdUxnWXRWb3R1cm01UFpDMGxxb0ErRExXMTljWFY2OWVqVnF0RmcwR0EyN1lzR0cvbjU5ZnQ2dFhyMzc2TEJMMnI3LytXdCtpUll0T0dvMm0rTVNKRTZqWDYzSGp4bzJjN0xjMDhEOHVDUVFGQlptUXdPclZxMHU4dmIwNzM3NTllLzJ6aU9OdnYvMzJlcHMyYlhxVWxwWisvK09QUDNMZzkvSHhxWGY1WktrS3dEaU9ibTV1cU5WcU1TTWpBM3YyN0RuZjA5UFQwU0lKb0V1WExzMkhEUnMydmFTa0JMVmFMWGJvME1FazZKYkd0SThpQVI4ZkgweE5UZVdVUUZGUjBlVVJJMFpNZTlwTEFnQUlHRDE2OUx2LytjOS9MaHcrZkJoMU9oMm1wNmVqbjUrZlJZUC9jVW5BejgrUFUxUUdnd0VMQ3dzdkRobzBhREk4NVZldkEwRFF2LzcxcjVsbnpweTU5djMzMzZOT3A4TVZLMWFndDdlM29NQlA4YVRQR3hvYWlscXRGbmZ1M0lsZHVuU1pIaE1UMDl4U0NhQnAzNzU5eCszZHV4ZTFXaTFHUjBjL3NPWVNHZ2w0ZUhqZ3RHblRVS3ZWb2w2dngvMzc5K091WGJzT0pDUWtqQUdBd09ycWFzTS9TZGJhMnRvS0FBam8yN2Z2eU1MQ3d0TGZmdnNOOSs3ZGl6cWREai81NUJPdUtjVFN3Zis0Sk9EcDZZa3paODdrNG5qZ3dBSGN2bjM3dnA0OWU0NEdnSUIvR3NlLy92cHJQUUFFRGhreTVJMzkrL2NmT25YcUZOSUVOSG55Wk83ekNRMzhGRDlIUjBlTWpvNUdyVmFMMjdadHcram82SEVkTzNac2Fxa0VZQnNhR3RxN3JLd01kVG9kRGhreXBONnRRRXNMK3FOSVFDNlhZOCtlUFhIMzd0MmNsRDEwNkJCcXRkcGo0OGFObSt2dDdkMEpBRnBNblRxMWRXMXRiVVZEeVRwMTZ0VFdBTkRDeThzcjlzMDMzL3prNE1HRDM1ODVjd1lQSGp5SUJRVUZtSm1aaVFNR0RPQjJUK2p2V3pyNEgwVUN4bkZNVEV6RWpJd00xT2wwV0Z4Y2pIODM1aHdlTjI3Y25NZUo0OS9FNlFFQWdRRUJBVjJuVEpteTROaXhZeitlUG4wYTkrL2Zqd1VGQlRSVFBoQkhTd2MvUHc5cEMzRElrQ0dvMVdweDQ4YU5HQkFRMEx0ang0NjJUKzFVNmRNa2dNNmRPOHNPSERqUTJtQXdITHA3OTY3dGpoMDdZUGZ1M2R6TEoraG1HdVBiYUMzTjAvbDN1akhJMGRFUmJ0eTRBUTRPRGxCVFV3TnZ2dmttOU9yVkMyUXlHVWlsVW1qYXRDblkyOXZYM0x4NTgxUnBhZW14aW9xS1U5ZXVYVHRYVTFOejU4YU5HMzg2T1RrMWw4bGtkczdPenA0dFc3WnNuWkNRRU83bzZOajY5dTNiTmpkdTNJQzdkKzlDVFUwTkdBd0dTRTFOQlpGSUJMZHUzZUwrTG4wTytseVdIai82ZkErTFkxMWRIYVNrcEVEUG5qMUJLcFdDVENZRGUzdDdremllT1hQbXQydlhycDI3ZCsvZVg0aDRYeXdXUyt6czdKcTV1TGo0QkFjSHQrelJvMGQ0czJiTkFtL2R1aVc5ZWZNbVZGVlZ3ZDI3ZHlFL1B4ODJiTmdBTmpZMkQ0MmpwY2VQOE9MZzRBQkRodzZGNGNPSHc1a3paNnBUVWxJaU8zYnNlT3JBZ1FOUDVRWnI2Vk1tZ0xwOSsvWlYzYjU5KzZKVUt2WHo5ZldGbXpkdmdxT2pvOG05QUpZYS9JWklnQVpETHBmRG9rV0xZTWVPSGRDclZ5L28xNjhmT0RzN3c2MWJ0MlFTaWFSdGx5NWQydmJ1M1J0c2JXMUJLcFdDV0N3R1JBUkVoSnFhR3FpcXFvS2JOMi9DbFN0WG9LNnVEbTdjdUFFYWpRYTBXaTM4OGNjZjRPRGdZRUtXUWdQL28wakFPSTdmZlBNTjdOaXhBeElTRWlBeE1aSGVVc1RGc1Zldlh2WEc4ZDY5ZTFCVlZRVlhybHlCeXNwS1FFUzRmUGt5NU9mblExRlJFVlJXVm9KY0x1Y3VvNmt2amtMSlA3bGNEamR1M0FCZlgxK29xNnVEUC8vODh5SWlWc2ZFeE5RZE9IREE4bTRFcXEydHJRT0Fxa3VYTGxYNCtQajQrZmo0Z0lPRHd3TTNBMWx5OEIrSEJNNmZQdzlaV1Ztd2NlTkdpSW1KZ1RadDJrQmtaQ1MwYXRVSzdPd2F2bFdzdXJvYVRwMDZCWWNQSDRhVEowL0N3WU1Ib1huejV2RG5uMzgrTW1tRkF2NG5JWUUvL3ZnRGR1L2VEV3ZYcm4yaU9ONjVjd2QrK2VVWE9ITGtDSnc4ZVJJT0h6NE1jcmtjYnQyNkpYancxNmNBZkh4OG9LNnVEaTVmdmx3QkFGVjFkWFVXZlgyOXkxdHZ2Yld5c0xBUXRWb3QydG5aTmRoNVphbHJzSVpxQXZ3MUxUMlhvNk1qaWtRaWxNdmw2T25waVowN2Q4YTR1RGdjTUdBQXhzWEZZWmN1WGRESHh3ZWRuSnk0N3pQK2VmNWFuNzlXRlVxOEhsVVRlSkk0ZW5oNFlLZE9uVEF1TGc1NzkrNk5jWEZ4R0I4ZmoyNXViaWlYeTFFa0VuRUY1c2VObzFEaVZWOFRVRlpXRmc0WU1DRFZrdHVBYVJuUXJILy8vbThYRnhkalFVRUJ4c2JHbWd5T1VBYURUd0pQa3NRUDg0K2JyRUtMRTR2ajB5OEFpc1ZpakkyTnhZS0NBdHkyYlJ0MjdOang3ZWpvNkdZV1RRRHg4ZkUyQ29VaXRxU2twTGFnb0FDVGs1TWZPQk1ndEJtTlA1TTlLb2tmNWVuNytkVjlvYy80NW9walE2QVhhcDRabndKTVRrNUduVTZIcTFldnJuVjJkbzZOaW9xeXNXZ0NtREpsaWdRQUFyS3pzMC9xOVhwY3ZIZ3hpa1FpanJHRk9yUFI0RHdxaWZuSnpFL1NSeVdydFlLZnhmSEpGQUF0RnhjdlhveHF0Um8vLy96emt3QVFNSEhpUklsRkU4Q2tTWk5FQU9BMmZmcjBEVlFINERPYjBOZTBqMHJpeC9VTi9UNXJCVCtMNDVNcEFIZDNkOVJxdFppZG5ZM0Rody9mQUFCdTQ4ZVB0L3lyZ1dOalk1djE2ZFBuRFlQQmdIcTlIbnYxNnZYQTlXQkNUL2FHa3U2ZmVtc0hQWXZqa3hVQUhSMGRzVmV2WGxoUVVJQ2JOMi9HaUlpSTF5TWpJNXVCRUt4ang0NHllM3Y3ZGxxdDlycGVyOGNGQ3hiVXV3eXdsdVJub0dkeGZKcTFFWkwvQ3hZc1FKMU9oMHVYTHIxdVkyUFROaUlpUWhpdnJudnJyYmRFQU9DNVlNR0NMTG9lakgvS3lkcXEzTXd6L3pUdlZmRHc4RUMxV28xS3BSTGZlT09OTEFEd2ZQMzExMFVnRlBQeThtcWVtSmc0c2Fpb0NQVjZQZmJ2MzkvcWxnSE1NLytzNUgvLy92MVJyOWZqNXMyYk1Tb3FhcUpDb1dnT1FyS0JBd2ZLeEdKeDY5emMzTXJDd2tKTVMwc3pXUVl3RW1DZStmcWJmMFFpRWFhbHBhRldxOFd2di82NlVpUVN0VTVLU2hMV202c25USmdnQWdEWGQ5NTVKN1d3c0JDTGlvb3dKaWFHTFFPWVovNFI4ajhtSmdZTEN3c3hJeU1EQnc4ZW5Bb0FybVBHakJHQjBDdzZPdHJPejgrdnUxYXJyU29zTE1SNTgrWUp2aW1JZWVhZmRmUFB2SG56c0tDZ0FGZXVYRm5sN3U3ZVBTd3NUSEN2clFjQWdJa1RKNG9Cd0d2Ky9QbFplcjBlaTRxSzBOL2ZuOVVDbUdlK2diVy92NzgvRmhVVllYWjJOaFgvdk1hTUdTTUdvVnBVVkZUVHNMQ3dnUVVGQmJWRlJVVTRmLzc4eDdyWG5ubm1HeFA0YTZ1eVFnQUFDbXRKUkVGVTZmS1ArZlBubzE2dng5V3JWOWNHQmdZT0RBc0xhd3BDdG43OStra0F3R2Zod29XcXdzSkNOQmdNM0YyQlFybnBobm5tbjhmTlNSMDZkRUNEd1lBNU9UbjQ1cHR2cWdEQUp5RWhRUUpDdDhqSXlLWnQyN2J0cjlGbzdoVVZGZUdYWDM3NVFDMkFGUVNaYjh5RlA3bGNqbDkrK1NYcTlYcE1TMHU3NSsvdjN6ODBOTFFwV0lPOS92cnJZZ0R3bWpWcjFrNjlYbzhHZ3dIajQrTUZjMkVvODh3LzY0cy80K1BqMFdBd1lHWm1KbzRaTTJZbkFIaU5HalZLRE5aaUVSRVJUVHc4UE9LVlN1VjFlbEI3ZTN2V0Y4QjhvOS8zdDdlM3g4ek1UTlRwZExoNDhlTHJ6czdPOGUzYnQyOEMxbVJqeDQ0VkE0RHJxRkdqNWhZVUZLREJZTUFaTTJhd2dpRHpqYjd3TjJQR0RDd3FLc0l0VzdaZ1FrTENYQUJ3SFRGaWhCaXN6Zjd1WmdwTVRVMHRMeXdzeE9MaVl1elNwUXNyQ0RMZmFBdC9YYnAwUVlQQmdFcWxFbWZNbUZFT0FJRTllL2FVZ2JXYWg0ZEhzNkNnb0w1S3BmSzJ3V0RBakl3TTdzMHRqQVNZYjB6ZzkvYjJ4b3lNREN3b0tNRGx5NWZmOXZiMjd1dm01dFlNck5uK1hncTRqUmd4WWc2OUhHTHg0c1dDZXdrRzg4ei9yeTlMV2J4NE1Sb01CdHkwYVJNbUpDVE1BUUMzVjE1NVJReldib21KaVRJQThKODdkNjZxb0tBQWk0dUxjY0tFQ1ExdURUSVNZTjZhd0MrWHkzSENoQWxZWEZ5TUdSa1ptSktTb2dJQS94NDllc2lnc1ZoWVdGZ1RKeWVuOFBYcjE1OHFMQ3pFa3BJU0hEQmdnR0RlaGNjODgvLzBYWWtEQmd6QTR1Sml6TXZMdzA4Ly9mU1VnNE5EZUx0MjdacEFZN0l4WThhSVBEdzhIQUlDQXZwbFpHUmMvL3V0c2RpNWMyZEdBc3hiTGZnN2QrNk1lcjBlTlJvTkxscTA2THFYbDFjL056YzNoK0hEaDR1Z3NkbHJyNzBtOXZEd2NJNk5qUjJibTV0YlZWeGNqRHFkRHFPam94a0pNRzkxNEtlMy9PcjFla3hOVGExcTM3NzlPRGMzTitkR3NlNS9TRDFBQWdEdUw3MzAwdlRjM055YTR1SmkxR2cwR0JFUndVaUFlYXNCZjBSRUJHbzBHdTZnendzdnZEQURBTng3OU9naGdjWnVpWW1KVWdEd0hENTgrQ2Q1ZVhuM2k0dUxVYXZWWWx4Y0hDTUI1Z1VQL3JpNE9OUnF0VmhZV0locjFxeTUzNmRQbjA4QXdMTkhqeDVTWVBaLzFxZFBIeGtBZUkwWU1XS3VVcW04VDY4VzY5Mjc5d05uQnZnZGc0d01tTGVFVzR6NUx6TnhkSFRFM3IxN1kwRkJBZXIxZWx5elpzMzlwS1NrdVFEZzFhZ3EvazlLQW9NSEQ1NlpuWjE5cjdpNEdFdExTM0g0OE9HTUJKZ1hIUGlIRHgrT3BhV2xXRkJRZ09ucDZmZDY5ZW8xazRILzhVaEEwYU5IajBtN2QrKytiVEFZc0xTMEZHZk5tb1VLaGNMazNYRFc4aFpkNXEzanJjZVVsd3FGQW1mTm1vV2xwYVdvMFdodytmTGx0Mk5qWS8vMWQxNHo4RDhHQ1VnQndMVk5temJETm03Y2VGR3YxMk5wYVNtdVc3Y09RMEpDNm4xQlpHTjd4eDd6bHZGT1EvNExUVU5DUW5EZHVuVllVbEtDT1RrNXVIRGh3b3NCQVFIREFNQ1ZyZm1md0Y1OTlWV3h1N3U3bzRlSFI1ZXZ2dnFxWEsxV1kwbEpDZXAwT2h3elpvekpGZU1OdlNXV2tRRHp6M0xHTnk3MGlVUWlIRE5tRE9wME9qUVlETGhqeHc3ODRJTVB5bDFkWGJ1NHViazVOdXF0dnYrUkJKcktaTExXRXlkT1hMdG56NTVhV2hKODk5MTM2T3ZyKzBCdGdDa0M1cC9IakcrODF2ZjE5Y1h2dnZzT1MwdExVYXZWNHVyVnEydEhqQml4VmlxVnRuWnpjMnZLd1A4LzJPalJvMFY5K3ZTeEJRQ3Y2T2pvMTllc1dYTmVvOUZnYVdrcEZoVVY0UnR2dk1FTnpxUGVHOC9JZ1BsL0FucitqRTk1NXVibWhtKzg4UVlXRlJWaGNYRXhabVptNHNLRkM4K0hob2ErL25leHo3WlJkdmc5cTdxQXU3dTdvNk9qWStSYmI3MjFQVE16ODM1UlVSSHUzYnNYYzNKeWNPVElrU2lWU2g5WUZqd3VHVEJTWUM4aWZSam9qZVcrVkNyRmtTTkhZazVPRHU3ZHV4YzFHZzJ1V2JQbS91alJvN2M3T0RoRXVybTVPZmJzMlpPdDk1KzJqUm8xU2hRYUdtb0hBRjZob2FISjMzenp6UTlLcFJLTGk0czVJbmo1NVpkTnJsdDZIREo0RkNrd2I1MmVQLzRQQXozOS81ZGZmcGtEdmw2dnh5MWJ0dURzMmJPUGg0U0VqQVFBNy9idDI5dTk4c29yYk5aL2xwYVFrQ0R4OFBCd0FJQ2dQbjM2ekVwTlRmMGpMeStQSTRLOHZEeDgrKzIzMGRYVmxhc1I4SmNIZkRKb2lCU1l0MDdQSDNkK1hsQytPRG82b3F1cks3Nzk5dHVZbDVlSGUvZnV4Y0xDUXR5K2ZUdCsrZVdYZjd6d3dndXpBQ0RJM2QzZG9XZlBucXl0OTNuM0RIaDRlRGpaMmRtMTdkKy8vL3lWSzFlZXk4bkpRWVBCZ0h2MzdzVjkrL2JoTjk5OGd3TUhEa1I3ZTN1T0RJalJHeUtGaHNpQmVXSDdoc2FaOG9EeXd0SFJFZTN0N1hIZ3dJSDR6VGZmNEw1OSs3QzB0QlIxT2gxdTNib1ZGeTVjZUs1UG56N3piVzF0MjNwNGVEajE3dDJiN2UyYnMwaVlsSlJrQXdET01wa3N1RnUzYmg4c1hMandoMTI3ZHFGT3A4UFMwbEpPcm4zeHhSYzRiTmd3ZEhOejR5NGZvVUYvWEZKZ1h0aWVEM2J5Y3JrYzNkemNjTml3WWZqRkYxK2dYcS9Idlh2M2N1ZjIxNjlmajNQbXpEbmVxVk9uRDJReVdUQUFPUGZwMDhkbTVNaVJncGI3SW1zaWdpdFhya2lQSGozYTlNS0ZDMDRoSVNGUm5UdDNIaFliRzl2SDFkWFYwY0hCQVd4c2JFQXMvcjhkbVhQbnpzRXZ2L3dDdi83NksxeTllaFZPbkRnQnQyL2ZobXZYcm9GY0xvZGJ0MjZCZzRNRDNMcDFDK1J5T2R5OGVaTjVnWG9hUndjSEI3aDU4eVk0T3p0RHMyYk5JQ1FrQkZ4Y1hLQk5tellRSEJ3TTN0N2VBQUJRVzFzTGQrL2VoYXRYcjhMVnExZHZsSmVYYTh2THkzZjk4c3N2aHp3OFBLNkhoNGYvNWVycVdydGx5eFlVT202c3NsaVJsSlFrdlhqeG91MlJJMGVhMmRqWXVFWkVSSFNQaW9ycTA3NTkrM2hYVjFmMzVzMmJnNTJkSFVpbFVoQ0x4UndwMU5iV1FtVmxKVnk0Y0FIKyt1c3Z1SEhqQmxSWFY4UHQyN2ZCeHNZRzd0Mjd4N3pBZkxObXpjRFcxaFljSFIyaGFkT21vRkFvd05QVEU2VFMveXZTMTlYVndmMzc5K0hldlh2dzExOS93YzJiTitIcTFhdVhmdnJwcDdJZmZ2aEJlL1RvMGVKNzkrNWRqWWlJK05QZDNiMWFvOUhVV2hOV3JMcGFPWGJzV05IUm8wZWxGeTlldEt1c3JHd0tBQTV0MjdidDRPbnBHUmNWRlJYcDUrZlhybm56NWg1MmRuWmdiMjhQdHJhMklKVktRU0tSZ0Znc0JwRklCQ0tSaUNNSVpzS3l1cm82UUVUdWk4QmVVMU1EZCs3Y2didDM3MEoxZFRYY3VuWHI0dG16WjM4NmR1elk0Y3JLeXYwblRwdzREZ0MzRkFyRlh3cUZvaW9zTEt4Mnc0WU5hSTB4YWpUYkZhKy8vcnJvMHFWTGtnc1hMdGljUDMvZTl2ejU4MDBBd043UjBkSFozOSsvcFZ3dUQ1VEw1ZjdCd2NHQnpzN09paVpObWpTM3NiRnBhbU5qMDFRaWtkZ3lPQW5UYW10cnErL2R1L2RYZFhYMVgzZnUzUG56MnJWckYwNmRPblg2NXMyYloyL2V2SG42N05tei83bHg0OFkxQUxqajVlVjExOHZMcTFxaFVOeHpkM2UvdjNidFdyVDIrRFRhL2NxSkV5ZUtMbHk0SUs2c3JKU0lSQ0xwdVhQbnBPZk9uWk1CZ0MwQXlBQkFDZ0NTdjc5RWpUbFdBamI4Kyt2KzMxKzFBRkFEQU5YZTN0NDFQajQrdFhWMWRiV2VucDczUFQwOTY5TFMwckN4QllnbE5jOVNVbEpFWXJGWUpCS0pSUHYzN3hlSlJDSkFSQllyNFJJQUFBREV4Y1VoSW1KZFhSMDJScUF6WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Q3paL2ovZXp2MEVWc0UwandBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0b29sdGlwO1xuIiwidmFyIHRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG5cbnZhciBnZW5lQXNzb2NpYXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb25maWcgPSB7XG5cdHRhcmdldCA6IFwiXCJcbiAgICB9O1xuXG4gICAgLy8gVE9ETzogTW92ZSB0byBjdHR2QXBpXG4gICAgLy8gVGhpcyBjb2RlIGlzIGR1cGxpY2F0ZWQgc2V2ZXJhbCB0aW1lcyBub3cgKGNvbnRyb2xsZXJzLCBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzKVxuICAgIGZ1bmN0aW9uIGxvb2tEYXRhc291cmNlIChhcnIsIGRzTmFtZSkge1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuICAgIFx0ICAgIHZhciBkcyA9IGFycltpXTtcbiAgICBcdCAgICBpZiAoZHMuZGF0YXR5cGUgPT09IGRzTmFtZSkge1xuICAgIFx0XHRyZXR1cm4ge1xuICAgIFx0XHQgICAgXCJjb3VudFwiOiBkcy5ldmlkZW5jZV9jb3VudCxcbiAgICBcdFx0ICAgIFwic2NvcmVcIjogZHMuYXNzb2NpYXRpb25fc2NvcmVcbiAgICBcdFx0fTtcbiAgICBcdCAgICB9XG4gICAgXHR9XG4gICAgXHRyZXR1cm4ge1xuICAgIFx0ICAgIFwiY291bnRcIjogMCxcbiAgICBcdCAgICBcInNjb3JlXCI6IDBcbiAgICBcdH07XG4gICAgfVxuICAgIFxuICAgIHZhciBfID0gZnVuY3Rpb24gKGJ1YmJsZXNWaWV3LCBkaXYsIGZsb3dlcikge1xuICAgIFxuXHR2YXIgbWVudSA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpO1xuXHRcblx0Ly8gWm9vbSBTZWxlY3Rcblx0dmFyIHpvb21TZWxlY3QgPSBtZW51XG5cdCAgICAuYXBwZW5kKFwic3BhblwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHQV90b3BsZXZlbFNlbGVjdFwiKVxuXHQgICAgLnRleHQoXCJGaW5kOiBcIilcblx0ICAgIC5hcHBlbmQoXCJzZWxlY3RcIilcblx0ICAgIC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIG4gPSB0aGlzLnZhbHVlO1xuXHRcdGlmIChuID09PSBcIlJvb3RcIikge1xuXHRcdCAgICBidWJibGVzVmlldy5mb2N1cyh0cmVlKTtcblx0XHQgICAgYnViYmxlc1ZpZXcuc2VsZWN0KHRyZWUpO1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdHZhciBub2RlcyA9IHRyZWUuZmluZF9hbGwoZnVuY3Rpb24gKG5vZGUpIHtcblx0XHQgICAgcmV0dXJuIG5vZGUucHJvcGVydHkoXCJlZm9fY29kZVwiKSA9PT0gbjtcblx0XHR9KTtcblx0XHR2YXIgbGNhO1xuXHRcdGlmIChub2Rlcy5sZW5ndGggPiAxKSB7XG5cdFx0ICAgIGxjYSA9IHRyZWUubGNhKG5vZGVzKTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICBsY2EgPSBub2Rlc1swXS5wYXJlbnQoKTtcblx0XHR9XG5cdFx0YnViYmxlc1ZpZXcuZm9jdXMobGNhKTtcblx0XHRidWJibGVzVmlldy5zZWxlY3Qobm9kZXMpO1xuXHQgICAgfSk7XG5cblx0em9vbVNlbGVjdFxuXHQgICAgLmFwcGVuZChcIm9wdGlvblwiKVxuXHQgICAgLmF0dHIoXCJzZWxlY3RlZFwiLCAxKVxuXHQgICAgLmF0dHIoXCJ2YWx1ZVwiLFwiUm9vdFwiKVxuXHQgICAgLnRleHQoXCJOb25lXCIpO1xuXHRcblx0Ly8gLy8gSGlnaGxpZ2h0IFNlbGVjdFxuXHQvLyB2YXIgaGlnaGxpZ2h0U2VsZWN0ID0gbWVudVxuXHQvLyAgICAgLmFwcGVuZChcInNwYW5cIilcblx0Ly8gICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R0FfdG9wbGV2ZWxTZWxlY3RcIilcblx0Ly8gICAgIC50ZXh0KFwiSGlnaGxpZ2h0XCIpXG5cdC8vICAgICAuYXBwZW5kKFwic2VsZWN0XCIpXG5cdC8vICAgICAub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuXHQvLyBcdHZhciBuID0gdGhpcy52YWx1ZTtcblx0Ly8gXHR2YXIgbm9kZXMgPSB0cmVlLmZpbmRfYWxsKGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vIFx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KFwia2V5XCIpID09PSBuO1xuXHQvLyBcdH0pO1xuXHQvLyBcdGJ1YmJsZXNWaWV3LnNlbGVjdChub2Rlcyk7XG5cdC8vICAgICB9KTtcblx0Ly8gaGlnaGxpZ2h0U2VsZWN0XG5cdC8vICAgICAuYXBwZW5kKFwib3B0aW9uXCIpXG5cdC8vICAgICAuYXR0cihcInZhbHVlXCIsIFwibm9uZVwiKVxuXHQvLyAgICAgLmF0dHIoXCJzZWxlY3RlZFwiLCAxKVxuXHQvLyAgICAgLnRleHQoXCJOb25lXCIpO1xuXG5cdC8vIC8vIFN3aXRjaCBiZXR3ZWVuIGRpZmZlcmVudCBzdHJ1Y3R1cmVzXG5cdC8vIFN0cnVjdHVyZSBTZWxlY3Rcblx0Ly8gdmFyIHN0cnVjdHVyZVNlbGVjdCA9IG1lbnVcblx0Ly8gICAgIC5hcHBlbmQoXCJzcGFuXCIpXG5cdC8vICAgICAudGV4dChcIlN0cnVjdHVyZVwiKVxuXHQvLyAgICAgLmFwcGVuZChcInNlbGVjdFwiKVxuXHQvLyAgICAgLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcblx0Ly8gXHR2YXIgbiA9IHRoaXMudmFsdWU7XG5cdC8vIFx0c3dpdGNoIChuKSB7XG5cdC8vIFx0Y2FzZSBcIkVGT1wiIDpcblx0Ly8gXHQgICAgLy9idWJibGVzVmlldy5kYXRhKGRhdGExKTtcblx0Ly8gXHQgICAgLy9idWJibGVzVmlldy51cGRhdGUoKTtcblx0Ly8gXHQgICAgYnJlYWs7XG5cdC8vIFx0Y2FzZSBcIlNpbXBsaWZpZWRcIiA6XG5cdC8vIFx0ICAgIC8vYnViYmxlc1ZpZXcuZGF0YShkYXRhMik7XG5cdC8vIFx0ICAgIC8vYnViYmxlc1ZpZXcudXBkYXRlKCk7XG5cdC8vIFx0ICAgIGJyZWFrO1xuXHQvLyBcdH1cblx0Ly8gICAgIH0pO1xuXHQvLyBzdHJ1Y3R1cmVTZWxlY3Rcblx0Ly8gICAgIC5hcHBlbmQoXCJvcHRpb25cIilcblx0Ly8gICAgIC5hdHRyKFwidmFsdWVcIiwgXCJFRk9cIilcblx0Ly8gICAgIC5hdHRyKFwic2VsZWN0ZWRcIiwgMSlcblx0Ly8gICAgIC50ZXh0KFwiRUZPXCIpO1xuXHQvLyBzdHJ1Y3R1cmVTZWxlY3Rcblx0Ly8gICAgIC5hcHBlbmQoXCJvcHRpb25cIilcblx0Ly8gICAgIC5hdHRyKFwidmFsdWVcIiwgXCJTaW1wbGlmaWVkXCIpXG5cdC8vICAgICAudGV4dChcIlNpbXBsaWZpZWQgRUZPXCIpO1xuXHRcblx0dmFyIHRyZWUgPSBidWJibGVzVmlldy5kYXRhKCk7XG5cdHRyZWUuYXBwbHkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBpZiAobm9kZS5pc19sZWFmKCkgJiYgKG5vZGUucHJvcGVydHkoXCJsYWJlbFwiKSAhPT0gdW5kZWZpbmVkKSkge1xuXHRcdHpvb21TZWxlY3QuYXBwZW5kKFwib3B0aW9uXCIpXG5cdFx0ICAgIC5hdHRyKFwidmFsdWVcIiwgbm9kZS5wcm9wZXJ0eShcImVmb19jb2RlXCIpKVxuXHRcdCAgICAudGV4dChub2RlLnByb3BlcnR5KFwibGFiZWxcIikpO1xuXHQgICAgfVxuXHQgICAgLy8gaGlnaGxpZ2h0U2VsZWN0LmFwcGVuZChcIm9wdGlvblwiKVxuXHQgICAgLy8gXHQuYXR0cihcInZhbHVlXCIsIG5vZGUucHJvcGVydHkoXCJrZXlcIikpXG5cdCAgICAvLyBcdC50ZXh0KG5vZGUucHJvcGVydHkoXCJrZXlcIikpO1xuXHR9KTtcblxuXHQvLyBUb29sdGlwc1xuXHR2YXIgYnViYmxlX3Rvb2x0aXAgPSBmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgLy8gdG9wbGV2ZWwgcm9vdCBpcyBub3Qgc2hvd24gaW4gdGhlIGJ1YmJsZXMgdmlld1xuXHQgICAgaWYgKG5vZGUucGFyZW50KCkgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIG9iaiA9IHt9O1xuXHQgICAgLy8gVG9vbHRpcCBmb3IgdGhlIGxlYXZlc1xuXHQgICAgaWYgKG5vZGUuaXNfbGVhZigpKSB7XG5cdFx0Ly8gdG9vbHRpcCBpcyBmb3IgYSBkaXNlYXNlXG5cdFx0dmFyIHNjb3JlID0gbm9kZS5wcm9wZXJ0eShcImFzc29jaWF0aW9uX3Njb3JlXCIpO1xuXHRcdG9iai5oZWFkZXIgPSBub2RlLnByb3BlcnR5KFwibGFiZWxcIikgKyBcIiAoQXNzb2NpYXRpb24gU2NvcmU6IFwiICsgc2NvcmUgKyBcIilcIjtcblx0XHR2YXIgbG9jID0gXCIvYXBwLyMvZ2VuZS1kaXNlYXNlP3Q9XCIgKyBjb25maWcudGFyZ2V0ICsgXCImZD1cIiArIG5vZGUucHJvcGVydHkoXCJlZm9fY29kZVwiKTtcblx0XHRvYmouYm9keT1cIjxkaXY+PC9kaXY+PGEgaHJlZj1cIiArIGxvYyArIFwiPlZpZXcgZGV0YWlsczwvYT5cIjtcblxuXHRcdHZhciBsZWFmVG9vbHRpcCA9IHRvb2x0aXAucGxhaW4oKVxuXHRcdCAgICAuaWQoMSlcblx0XHQgICAgLndpZHRoKDE4MCk7XG5cblx0XHQvL0hpamFjayBvZiB0aGUgZmlsbCBjYWxsYmFja1xuXHRcdHZhciB0YWJsZUZpbGwgPSBsZWFmVG9vbHRpcC5maWxsKCk7XG5cblx0XHQvL1Bhc3MgYSBuZXcgZmlsbCBjYWxsYmFjayB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBvbmUgYW5kIGRlY29yYXRlcyB3aXRoIGZsb3dlcnNcblx0XHRsZWFmVG9vbHRpcC5maWxsKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0ICAgIHRhYmxlRmlsbC5jYWxsKHRoaXMsIGRhdGEpO1xuXHRcdCAgICB2YXIgZGF0YXR5cGVzID0gbm9kZS5wcm9wZXJ0eShcImRhdGF0eXBlc1wiKTtcblx0XHQgICAgdmFyIGZsb3dlckRhdGEgPSBbXG5cdFx0XHR7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJnZW5ldGljX2Fzc29jaWF0aW9uXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiR2VuZXRpY3NcIn0sXG5cdFx0XHR7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJzb21hdGljX211dGF0aW9uXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiU29tYXRpY1wifSxcblx0XHRcdHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcImtub3duX2RydWdcIikuc2NvcmUsICBcImxhYmVsXCI6XCJEcnVnc1wifSxcblx0XHRcdHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcInJuYV9leHByZXNzaW9uXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiUk5BXCJ9LFxuXHRcdFx0e1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiYWZmZWN0ZWRfcGF0aHdheVwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlBhdGh3YXlzXCJ9LFxuXHRcdFx0e1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiYW5pbWFsX21vZGVsXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiTW9kZWxzXCJ9XG5cdFx0ICAgIF07XG5cdFx0ICAgIGZsb3dlci52YWx1ZXMoZmxvd2VyRGF0YSkodGhpcy5zZWxlY3QoXCJkaXZcIikubm9kZSgpKTtcblx0XHR9KTtcblx0XHRcblx0XHRsZWFmVG9vbHRpcC5jYWxsKHRoaXMsIG9iaik7XG5cblx0ICAgIH0gZWxzZSB7XG5cdFx0Ly8gdG9vbHRpcCBpcyBmb3IgYSB0aGVyYXBldXRpYyBhcmVhXG5cdFx0b2JqLmhlYWRlciA9IG5vZGUucHJvcGVydHkoXCJsYWJlbFwiKTtcblx0XHRvYmoucm93cyA9IFtdO1xuXHRcdG9iai5yb3dzLnB1c2goe1xuXHRcdCAgICBcImxhYmVsXCIgOiBcIlNjb3JlXCIsXG5cdFx0ICAgIFwidmFsdWVcIiA6IE1hdGgucm91bmQobm9kZS5wcm9wZXJ0eShcImFzc29jaWF0aW9uX3Njb3JlXCIpLCAyKVxuXHRcdH0pO1xuXHRcdG9iai5yb3dzLnB1c2goe1xuXHRcdCAgICBcImxhYmVsXCIgOiBcIkV2aWRlbmNlIGNvdW50XCIsXG5cdFx0ICAgIFwidmFsdWVcIiA6IE1hdGgucm91bmQobm9kZS5wcm9wZXJ0eShcImV2aWRlbmNlX2NvdW50XCIpLCAyKVxuXHRcdH0pO1xuXG5cdFx0aWYgKG5vZGUucHJvcGVydHkoXCJmb2N1c2VkXCIpID09PSAxKSB7XG5cdFx0ICAgIG9iai5yb3dzLnB1c2goe1xuXHRcdFx0XCJsYWJlbFwiIDogXCJBY3Rpb25cIixcblx0XHRcdFwidmFsdWVcIiA6IFwiWm9vbSBPdXRcIixcblx0XHRcdFwib2JqXCIgOiBub2RlLFxuXHRcdFx0XCJsaW5rXCIgOiBmdW5jdGlvbiAobm9kZSkge1xuXHRcdFx0ICAgIG5vZGUucHJvcGVydHkoXCJmb2N1c2VkXCIsIHVuZGVmaW5lZCk7XG5cdFx0XHQgICAgYnViYmxlc1ZpZXcuZm9jdXModHJlZSk7XG5cdFx0XHR9XG5cdFx0ICAgIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIG9iai5yb3dzLnB1c2goe1xuXHRcdFx0XCJsYWJlbFwiIDogXCJBY3Rpb25cIixcblx0XHRcdFwidmFsdWVcIiA6IFwiWm9vbSBJblwiLFxuXHRcdFx0XCJvYmpcIiA6IG5vZGUsXG5cdFx0XHRcImxpbmtcIiA6IGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0XHQgICAgdHJlZS5hcHBseSggZnVuY3Rpb24gKG4pIHtcblx0XHRcdFx0bi5wcm9wZXJ0eShcImZvY3VzZWRcIiwgdW5kZWZpbmVkKTtcblx0XHRcdCAgICB9KTtcblx0XHRcdCAgICBub2RlLnByb3BlcnR5KFwiZm9jdXNlZFwiLCAxKTtcblx0XHRcdCAgICBidWJibGVzVmlldy5mb2N1cyhub2RlKTtcblx0XHRcdH1cblx0XHQgICAgfSk7XG5cdFx0fVxuXHRcdHRvb2x0aXAudGFibGUoKVxuXHQgICAgICAgICAgICAuaWQoMilcblx0ICAgICAgICAgICAgLndpZHRoKDE4MClcblx0ICAgICAgICAgICAgLmNhbGwgKHRoaXMsIG9iaik7XG5cdCAgICB9XG5cdH07XG5cdGJ1YmJsZXNWaWV3XG5cdCAgICAub25jbGljayAoYnViYmxlX3Rvb2x0aXApO1xuXHQgICAgLy8ub25jbGljayAoZnVuY3Rpb24gKGQpIHtiVmlldy5mb2N1cyhiVmlldy5ub2RlKGQpKX0pXG5cdC8vIFJlbmRlclxuXHRidWJibGVzVmlldyhkaXYpO1xuICAgIH07XG5cbiAgICBfLnRhcmdldCA9IGZ1bmN0aW9uICh0KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy50YXJnZXQ7XG5cdH1cblx0Y29uZmlnLnRhcmdldCA9IHQ7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIF87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVBc3NvY2lhdGlvbnM7XG4iXX0=
