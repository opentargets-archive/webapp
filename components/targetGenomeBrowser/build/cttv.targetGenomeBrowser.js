(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
module.exports = targetGenomeBrowser = require("./src/targetGenomeBrowser.js");

},{"./src/targetGenomeBrowser.js":7}],3:[function(require,module,exports){
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
	// ie has scrollTop and scrollLeft on documentElement instead of body
	var scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
	var scrollLeft = (document.documentElement && document.documentElement.scrollLeft) || document.body.scrollLeft;
	var elemPos = containerElem.getBoundingClientRect();
	var elemTop = elemPos.top + scrollTop;
	var elemLeft = elemPos.left + scrollLeft;
	
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

var cttv_genome_browser = function() {
    "use strict";

    // Display elements options that can be overridden by setters
    // (so they are exposed in the API)
    var show_options = true;
    var show_title   = false;
    var show_links   = true;
    var title   = "";
    var chr = 0;
    
    var path = tnt.utils.script_path("cttv-target.js");

    // div_ids to display different elements
    // They have to be set dynamically because the IDs contain the div_id of the main element containing the plug-in
    var div_id;

    var fgColor = "#586471";
    var bgColor = "#c6dcec"

    var gBrowser;

    var gBrowserTheme = function(gB, div) {
	// Set the different #ids for the html elements (needs to be lively because they depend on the div_id)
	set_div_id(div);

	gBrowser = gB;

	// We set the original data so we can always come back
	// The values are set when the core plug-in is about to start
	var orig = {};

	// The Options pane
	var opts_pane = d3.select(div)
	    .append("div")
	    .attr("class", "tnt_options_pane")
	    .style("display", function() {
		if (show_options) {
		    return "block"
		} else {
		    return "none"
		}
	    });

	opts_pane
	    .append("span")
	    .text("Human Chr " + chr);
	
	var left_button = opts_pane
	    .append("i")
	    .attr("title", "go left")
	    .attr("class", "cttvGenomeBrowserIcon fa fa-arrow-circle-left fa-2x")
	    .on("click", gBrowserTheme.left);

	var zoomIn_button = opts_pane
	    .append("i")
	    .attr("title", "zoom in")
	    .attr("class", "cttvGenomeBrowserIcon fa fa-search-plus fa-2x")
	    .on("click", gBrowserTheme.zoomIn);

	var zoomOut_button = opts_pane
	    .append("i")
	    .attr("title", "zoom out")
	    .attr("class", "cttvGenomeBrowserIcon fa fa-search-minus fa-2x")
	    .on("click", gBrowserTheme.zoomOut);

	var right_button = opts_pane
	    .append("i")
	    .attr("title", "go right")
	    .attr("class", "cttvGenomeBrowserIcon fa fa-arrow-circle-right fa-2x")
	    .on("click", gBrowserTheme.right);
	
	var origLabel = opts_pane
	    .append("i")
	    .attr("title", "reload location")
	    .attr("class", "cttvGenomeBrowserIcon fa fa-refresh fa-lt")
	    .on("click", function () {
		gBrowser.start(orig)
	    });

	var browser_title = d3.select(div)
	    .append("h1")
	    .text(title)
	    .style("color", gBrowserTheme.foreground_color())
	    .style("display", function(){
		if (show_title) {
		    return "auto"
		} else {
		    return "none"
		}
	    });

	/////////////////////////////////////////
	// Here we have to include the browser //
	/////////////////////////////////////////

	// The Browser div
	// We set up the origin:
	if (gBrowser.gene() !== undefined) {
	    orig = {
		species : gBrowser.species(),
		gene    : gBrowser.gene()
	    };
	} else {
	    orig = {
		species : gBrowser.species(),
		chr     : gBrowser.chr(),
		from    : gBrowser.from(),
		to      : gBrowser.to()
	    }
	}

	var gene_track = tnt.board.track()
	    .height(200)
	    .background_color(gBrowserTheme.background_color())
	    .display(tnt.board.track.feature.gene()
		     .foreground_color(gBrowserTheme.foreground_color())
		    )
	    .data(tnt.board.track.data.gene());

	// Tooltip on genes
	var gene_tooltip = function (gene) {
	    var obj = {};
	    obj.header = gene.external_name + " (" + gene.id + ")";
	    obj.rows = [];
	    obj.rows.push( {
		"label" : "Gene Type",
		"value" : gene.biotype
	    });
	    obj.rows.push( {
		"label" : "Location",
		"value" : "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Location/View?db=core;g=" + gene.id + "'>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end + "</a>"
	    });
	    obj.rows.push( {
		"label" : "Description",
		"value" : gene.description
	    });

	    tooltip.table().call(this, obj);
	}
	
	gene_track
	    .display()
	    .on_click(gene_tooltip);

	gBrowser(div);
	gBrowser.add_track(gene_track);

	// The GeneInfo Panel
	d3.select(div).select(".tnt_groupDiv")
	    .append("div")
	    .attr("class", "ePeek_gene_info")
	    .attr("id", "tnt_" + div_id + "_gene_info") // Both needed?
	    .style("width", gBrowser.width() + "px");

	// Links div
	var links_pane = d3.select(div)
	    .append("div")
	    .attr("class", "tnt_links_pane")
	    .style("display", function() {if (show_links) {return "block"} else {return "none"}});

	// ensembl
	links_pane
	    .append("span")
	    .text("Open in Ensembl");
	var ensemblLoc = links_pane
	    .append("i")
	    .attr("title", "open region in ensembl")
	    .attr("class", "cttvGenomeBrowserIcon fa fa-external-link fa-2x")
	    .on("click", function() {var link = buildEnsemblLink(); window.open(link, "_blank")});

	gB.start();

    };

///*********************////
/// RENDERING FUNCTIONS ////
///*********************////
    // Private functions

    // callbacks plugged to the gBrowser object
    var gene_info_cbak = function (gene) {
	var sel = d3.select("#tnt_" + div_id + "_gene_info");

	sel
	    .classed("tnt_gene_info_active", true)
	    .append("p")
	    .attr("class", "tnt_gene_info_paragraph")
	    // .style("color", gBrowserTheme.foreground_color().darker())
	    // .style("background-color", gBrowserTheme.background_color().brighter())
	    // .style("height", gBrowser.height() + "px")
	    .html(function () {
		return "<h1>" + gene.external_name + "</h1>" +
		    "Ensembl ID: <i>" + gene.ID + "</i><br />" +
		    "Description: <i>" + gene.description + "</i><br />" +
		    "Source: <i>" + gene.logic_name + "</i><br />" +
		    "loc: <i>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end + " (Strand: " + gene.strand + ")</i><br />";});

	sel.append("span")
	    .attr("class", "tnt_text_rotated")
	    .style("top", ~~gBrowser.height()/2 + "px")
	    .style("background-color", gBrowserTheme.foreground_color())
	    .append("text")
	    .attr("class", "tnt_link")
	    .style("color", gBrowserTheme.background_color())
	    .text("[Close]")
	    .on("click", function() {d3.select("#tnt_" + div_id + "_gene_info" + " p").remove();
				     d3.select("#tnt_" + div_id + "_gene_info" + " span").remove();
				     sel.classed("tnt_gene_info_active", false)});

    };

    //// API
    gBrowserTheme.left = function () {
	gBrowser.move_left(1.5);
    };

    gBrowserTheme.right = function () {
	gBrowser.move_right(1.5);
    };

    gBrowserTheme.zoomIn = function () {
	gBrowser.zoom(0.5);
    }

    gBrowserTheme.zoomOut = function () {
	gBrowser.zoom(1.5);
    }

    gBrowserTheme.show_options = function(b) {
	show_options = b;
	return gBrowserTheme;
    };

    gBrowserTheme.chr = function (c) {
	if (!arguments.length) {
	    return chr;
	}
	chr = c;
	return this;
    };
    
    gBrowserTheme.show_title = function(b) {
	show_title = b;
	return gBrowserTheme;
    };

    gBrowserTheme.show_links = function(b) {
	show_links = b;
	return gBrowserTheme;
    };

    gBrowserTheme.title = function (s) {
	if (!arguments.length) {
	    return title;
	}
	title = s;
	return gBrowserTheme;
    };

    gBrowserTheme.foreground_color = function (c) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = c;
	return gBrowserTheme;
    };

    gBrowserTheme.background_color = function (c) {
	if (!arguments.length) {
	    return bgColor;
	}
	bgColor = c;
	return gBrowserTheme;
    };

    var set_div_id = function(div) {
	div_id = d3.select(div).attr("id");
    };


    ///*********************////
    /// UTILITY METHODS     ////
    ///*********************////
    // Private methods
    var buildEnsemblLink = function() {
	var url = "http://www.ensembl.org/" + gBrowser.species() + "/Location/View?r=" + gBrowser.chr() + "%3A" + gBrowser.from() + "-" + gBrowser.to();
	return url;
    };


    // Public methods


    /** <strong>buildEnsemblGeneLink</strong> returns the Ensembl url pointing to the gene summary of the given gene
	@param {String} gene The Ensembl gene id. Should be a valid ID of the form ENSGXXXXXXXXX"
	@returns {String} The Ensembl URL for the given gene
    */
    var buildEnsemblGeneLink = function(ensID) {
	//"http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000139618"
	var url = "http://www.ensembl.org/" + gBrowser.species() + "/Gene/Summary?g=" + ensID;
	return url;
    };



    return gBrowserTheme;
};

module.exports = exports = cttv_genome_browser;

},{"tnt.tooltip":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL2Zha2VfY2U5MTQwYzAuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL3NyYy90b29sdGlwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvc3JjL3RhcmdldEdlbm9tZUJyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRhcmdldEdlbm9tZUJyb3dzZXIgPSByZXF1aXJlKFwiLi9zcmMvdGFyZ2V0R2Vub21lQnJvd3Nlci5qc1wiKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gdG9vbHRpcCA9IHJlcXVpcmUoXCIuL3NyYy90b29sdGlwLmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvYXBpLmpzXCIpO1xuIiwidmFyIGFwaSA9IGZ1bmN0aW9uICh3aG8pIHtcblxuICAgIHZhciBfbWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG0gPSBbXTtcblxuXHRtLmFkZF9iYXRjaCA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgIG0udW5zaGlmdChvYmopO1xuXHR9O1xuXG5cdG0udXBkYXRlID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdG1baV1bcF0gPSB2YWx1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdG0uYWRkID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGlmIChtLnVwZGF0ZSAobWV0aG9kLCB2YWx1ZSkgKSB7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciByZWcgPSB7fTtcblx0XHRyZWdbbWV0aG9kXSA9IHZhbHVlO1xuXHRcdG0uYWRkX2JhdGNoIChyZWcpO1xuXHQgICAgfVxuXHR9O1xuXG5cdG0uZ2V0ID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0cmV0dXJuIG1baV1bcF07XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH07XG5cblx0cmV0dXJuIG07XG4gICAgfTtcblxuICAgIHZhciBtZXRob2RzICAgID0gX21ldGhvZHMoKTtcbiAgICB2YXIgYXBpID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBhcGkuY2hlY2sgPSBmdW5jdGlvbiAobWV0aG9kLCBjaGVjaywgbXNnKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS5jaGVjayhtZXRob2RbaV0sIGNoZWNrLCBtc2cpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0uY2hlY2soY2hlY2ssIG1zZyk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChtZXRob2QsIGNiYWspIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLnRyYW5zZm9ybSAobWV0aG9kW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC50cmFuc2Zvcm0gKGNiYWspO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0udHJhbnNmb3JtKGNiYWspO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHZhciBhdHRhY2hfbWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCwgb3B0cykge1xuXHR2YXIgY2hlY2tzID0gW107XG5cdHZhciB0cmFuc2Zvcm1zID0gW107XG5cblx0dmFyIGdldHRlciA9IG9wdHMub25fZ2V0dGVyIHx8IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBtZXRob2RzLmdldChtZXRob2QpO1xuXHR9O1xuXG5cdHZhciBzZXR0ZXIgPSBvcHRzLm9uX3NldHRlciB8fCBmdW5jdGlvbiAoeCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYW5zZm9ybXMubGVuZ3RoOyBpKyspIHtcblx0XHR4ID0gdHJhbnNmb3Jtc1tpXSh4KTtcblx0ICAgIH1cblxuXHQgICAgZm9yICh2YXIgaj0wOyBqPGNoZWNrcy5sZW5ndGg7IGorKykge1xuXHRcdGlmICghY2hlY2tzW2pdLmNoZWNrKHgpKSB7XG5cdFx0ICAgIHZhciBtc2cgPSBjaGVja3Nbal0ubXNnIHx8IFxuXHRcdFx0KFwiVmFsdWUgXCIgKyB4ICsgXCIgZG9lc24ndCBzZWVtIHRvIGJlIHZhbGlkIGZvciB0aGlzIG1ldGhvZFwiKTtcblx0XHQgICAgdGhyb3cgKG1zZyk7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgbWV0aG9kcy5hZGQobWV0aG9kLCB4KTtcblx0fTtcblxuXHR2YXIgbmV3X21ldGhvZCA9IGZ1bmN0aW9uIChuZXdfdmFsKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gZ2V0dGVyKCk7XG5cdCAgICB9XG5cdCAgICBzZXR0ZXIobmV3X3ZhbCk7XG5cdCAgICByZXR1cm4gd2hvOyAvLyBSZXR1cm4gdGhpcz9cblx0fTtcblx0bmV3X21ldGhvZC5jaGVjayA9IGZ1bmN0aW9uIChjYmFrLCBtc2cpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBjaGVja3M7XG5cdCAgICB9XG5cdCAgICBjaGVja3MucHVzaCAoe2NoZWNrIDogY2Jhayxcblx0XHRcdCAgbXNnICAgOiBtc2d9KTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXHRuZXdfbWV0aG9kLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gdHJhbnNmb3Jtcztcblx0ICAgIH1cblx0ICAgIHRyYW5zZm9ybXMucHVzaChjYmFrKTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHdob1ttZXRob2RdID0gbmV3X21ldGhvZDtcbiAgICB9O1xuXG4gICAgdmFyIGdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgb3B0cykge1xuXHRpZiAodHlwZW9mIChwYXJhbSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtZXRob2RzLmFkZF9iYXRjaCAocGFyYW0pO1xuXHQgICAgZm9yICh2YXIgcCBpbiBwYXJhbSkge1xuXHRcdGF0dGFjaF9tZXRob2QgKHAsIG9wdHMpO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgbWV0aG9kcy5hZGQgKHBhcmFtLCBvcHRzLmRlZmF1bHRfdmFsdWUpO1xuXHQgICAgYXR0YWNoX21ldGhvZCAocGFyYW0sIG9wdHMpO1xuXHR9XG4gICAgfTtcblxuICAgIGFwaS5nZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmfSk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLmdldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9zZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgZ2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBzZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fc2V0dGVyIDogb25fc2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5zZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fZ2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIHNldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgZ2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX2dldHRlciA6IG9uX2dldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kID0gZnVuY3Rpb24gKG5hbWUsIGNiYWspIHtcblx0aWYgKHR5cGVvZiAobmFtZSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBmb3IgKHZhciBwIGluIG5hbWUpIHtcblx0XHR3aG9bcF0gPSBuYW1lW3BdO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgd2hvW25hbWVdID0gY2Jhaztcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXBpO1xuICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYXBpOyIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xuXG52YXIgdG9vbHRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpO1xuICAgIHZhciB0b29sdGlwX2RpdjtcblxuICAgIHZhciBjb25mID0ge1xuXHRiYWNrZ3JvdW5kX2NvbG9yIDogXCJ3aGl0ZVwiLFxuXHRmb3JlZ3JvdW5kX2NvbG9yIDogXCJibGFja1wiLFxuXHRwb3NpdGlvbiA6IFwicmlnaHRcIixcblx0YWxsb3dfZHJhZyA6IHRydWUsXG5cdHNob3dfY2xvc2VyIDogdHJ1ZSxcblx0ZmlsbCA6IGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJmaWxsIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiOyB9LFxuXHR3aWR0aCA6IDE4MCxcblx0aWQgOiAxXG4gICAgfTtcblxuICAgIHZhciB0ID0gZnVuY3Rpb24gKGRhdGEsIGV2ZW50KSB7XG5cdGRyYWdcblx0ICAgIC5vcmlnaW4oZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4ge3g6cGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwibGVmdFwiKSksXG5cdFx0XHR5OnBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcInRvcFwiKSlcblx0XHQgICAgICAgfTtcblx0ICAgIH0pXG5cdCAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKCkge1xuXHRcdGlmIChjb25mLmFsbG93X2RyYWcpIHtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0XHQuc3R5bGUoXCJsZWZ0XCIsIGQzLmV2ZW50LnggKyBcInB4XCIpXG5cdFx0XHQuc3R5bGUoXCJ0b3BcIiwgZDMuZXZlbnQueSArIFwicHhcIik7XG5cdFx0fVxuXHQgICAgfSk7XG5cblx0Ly8gVE9ETzogV2h5IGRvIHdlIG5lZWQgdGhlIGRpdiBlbGVtZW50P1xuXHQvLyBJdCBsb29rcyBsaWtlIGlmIHdlIGFuY2hvciB0aGUgdG9vbHRpcCBpbiB0aGUgXCJib2R5XCJcblx0Ly8gVGhlIHRvb2x0aXAgaXMgbm90IGxvY2F0ZWQgaW4gdGhlIHJpZ2h0IHBsYWNlIChhcHBlYXJzIGF0IHRoZSBib3R0b20pXG5cdC8vIFNlZSBjbGllbnRzL3Rvb2x0aXBzX3Rlc3QuaHRtbCBmb3IgYW4gZXhhbXBsZVxuXHR2YXIgY29udGFpbmVyRWxlbSA9IHNlbGVjdEFuY2VzdG9yICh0aGlzLCBcImRpdlwiKTtcblx0aWYgKGNvbnRhaW5lckVsZW0gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgLy8gV2UgcmVxdWlyZSBhIGRpdiBlbGVtZW50IGF0IHNvbWUgcG9pbnQgdG8gYW5jaG9yIHRoZSB0b29sdGlwXG5cdCAgICByZXR1cm47XG5cdH1cblxuXHQvLyBDb250YWluZXIgZWxlbWVudCBwb3NpdGlvbiAobmVlZGVkIGZvciBcInJlbGF0aXZlXCIgcG9zaXRpb25lZCBwYXJlbnRzKVxuXHQvLyBpZSBoYXMgc2Nyb2xsVG9wIGFuZCBzY3JvbGxMZWZ0IG9uIGRvY3VtZW50RWxlbWVudCBpbnN0ZWFkIG9mIGJvZHlcblx0dmFyIHNjcm9sbFRvcCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3A7XG5cdHZhciBzY3JvbGxMZWZ0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCkgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0O1xuXHR2YXIgZWxlbVBvcyA9IGNvbnRhaW5lckVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdHZhciBlbGVtVG9wID0gZWxlbVBvcy50b3AgKyBzY3JvbGxUb3A7XG5cdHZhciBlbGVtTGVmdCA9IGVsZW1Qb3MubGVmdCArIHNjcm9sbExlZnQ7XG5cdFxuXHR0b29sdGlwX2RpdiA9IGQzLnNlbGVjdChjb250YWluZXJFbGVtKVxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90b29sdGlwXCIpXG5cdCAgICAuY2xhc3NlZChcInRudF90b29sdGlwX2FjdGl2ZVwiLCB0cnVlKSAgLy8gVE9ETzogSXMgdGhpcyBuZWVkZWQvdXNlZD8/P1xuXHQgICAgLmNhbGwoZHJhZyk7XG5cblx0Ly8gcHJldiB0b29sdGlwcyB3aXRoIHRoZSBzYW1lIGhlYWRlclxuXHRkMy5zZWxlY3QoXCIjdG50X3Rvb2x0aXBfXCIgKyBjb25mLmlkKS5yZW1vdmUoKTtcblxuXHRpZiAoKGQzLmV2ZW50ID09PSBudWxsKSAmJiAoZXZlbnQpKSB7XG5cdCAgICBkMy5ldmVudCA9IGV2ZW50O1xuXHR9XG5cdHZhciBtb3VzZSA9IFtkMy5ldmVudC5wYWdlWCwgZDMuZXZlbnQucGFnZVldO1xuXHRkMy5ldmVudCA9IG51bGw7XG5cblx0dmFyIG9mZnNldCA9IDA7XG5cdGlmIChjb25mLnBvc2l0aW9uID09PSBcImxlZnRcIikge1xuXHQgICAgb2Zmc2V0ID0gY29uZi53aWR0aDtcblx0fVxuXHRcblx0dG9vbHRpcF9kaXYuYXR0cihcImlkXCIsIFwidG50X3Rvb2x0aXBfXCIgKyBjb25mLmlkKTtcblx0XG5cdC8vIFdlIHBsYWNlIHRoZSB0b29sdGlwXG5cdHRvb2x0aXBfZGl2XG5cdCAgICAuc3R5bGUoXCJsZWZ0XCIsIChtb3VzZVswXSAtIG9mZnNldCAtIGVsZW1MZWZ0KSArIFwicHhcIilcblx0ICAgIC5zdHlsZShcInRvcFwiLCBtb3VzZVsxXSAtIGVsZW1Ub3AgKyBcInB4XCIpO1xuXG5cdC8vIENsb3NlXG5cdGlmIChjb25mLnNob3dfY2xvc2VyKSB7XG5cdCAgICB0b29sdGlwX2Rpdi5hcHBlbmQoXCJzcGFuXCIpXG5cdFx0LnN0eWxlKFwicG9zaXRpb25cIiwgXCJhYnNvbHV0ZVwiKVxuXHRcdC5zdHlsZShcInJpZ2h0XCIsIFwiLTEwcHhcIilcblx0XHQuc3R5bGUoXCJ0b3BcIiwgXCItMTBweFwiKVxuXHRcdC5hcHBlbmQoXCJpbWdcIilcblx0XHQuYXR0cihcInNyY1wiLCB0b29sdGlwLmltYWdlcy5jbG9zZSlcblx0XHQuYXR0cihcIndpZHRoXCIsIFwiMjBweFwiKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMjBweFwiKVxuXHRcdC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgdC5jbG9zZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0Y29uZi5maWxsLmNhbGwodG9vbHRpcF9kaXYsIGRhdGEpO1xuXG5cdC8vIHJldHVybiB0aGlzIGhlcmU/XG5cdHJldHVybiB0O1xuICAgIH07XG5cbiAgICAvLyBnZXRzIHRoZSBmaXJzdCBhbmNlc3RvciBvZiBlbGVtIGhhdmluZyB0YWduYW1lIFwidHlwZVwiXG4gICAgLy8gZXhhbXBsZSA6IHZhciBteWRpdiA9IHNlbGVjdEFuY2VzdG9yKG15ZWxlbSwgXCJkaXZcIik7XG4gICAgZnVuY3Rpb24gc2VsZWN0QW5jZXN0b3IgKGVsZW0sIHR5cGUpIHtcblx0dHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0aWYgKGVsZW0ucGFyZW50Tm9kZSA9PT0gbnVsbCkge1xuXHQgICAgY29uc29sZS5sb2coXCJObyBtb3JlIHBhcmVudHNcIik7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHZhciB0YWdOYW1lID0gZWxlbS5wYXJlbnROb2RlLnRhZ05hbWU7XG5cblx0aWYgKCh0YWdOYW1lICE9PSB1bmRlZmluZWQpICYmICh0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUpKSB7XG5cdCAgICByZXR1cm4gZWxlbS5wYXJlbnROb2RlO1xuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIHNlbGVjdEFuY2VzdG9yIChlbGVtLnBhcmVudE5vZGUsIHR5cGUpO1xuXHR9XG4gICAgfVxuICAgIFxuICAgIHZhciBhcGkgPSBhcGlqcyh0KVxuXHQuZ2V0c2V0KGNvbmYpO1xuICAgIGFwaS5jaGVjaygncG9zaXRpb24nLCBmdW5jdGlvbiAodmFsKSB7XG5cdHJldHVybiAodmFsID09PSAnbGVmdCcpIHx8ICh2YWwgPT09ICdyaWdodCcpO1xuICAgIH0sIFwiT25seSAnbGVmdCcgb3IgJ3JpZ2h0JyB2YWx1ZXMgYXJlIGFsbG93ZWQgZm9yIHBvc2l0aW9uXCIpO1xuXG4gICAgYXBpLm1ldGhvZCgnY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG5cdHRvb2x0aXBfZGl2LnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLmxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlzdCB0b29sdGlwIGlzIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcbiAgICB2YXIgd2lkdGggPSAxODA7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblx0dmFyIG9ial9pbmZvX2xpc3QgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdC8vIFRvb2x0aXAgaGVhZGVyXG5cdG9ial9pbmZvX2xpc3Rcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLnRleHQob2JqLmhlYWRlcik7XG5cblx0Ly8gVG9vbHRpcCByb3dzXG5cdHZhciB0YWJsZV9yb3dzID0gb2JqX2luZm9fbGlzdC5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGRcIilcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS52YWx1ZTtcblx0ICAgIH0pXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmxpbmsgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKVxuXHRcdCAgICAuY2xhc3NlZChcImxpbmtcIiwgMSlcblx0XHQgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRkLmxpbmsoZC5vYmopO1xuXHRcdFx0dC5jbG9zZS5jYWxsKHRoaXMpO1xuXHRcdCAgICB9KTtcblx0ICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0O1xufTtcblxudG9vbHRpcC50YWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyB0YWJsZSB0b29sdGlwcyBhcmUgYmFzZWQgb24gZ2VuZXJhbCB0b29sdGlwc1xuICAgIHZhciB0ID0gdG9vbHRpcCgpO1xuICAgIFxuICAgIHZhciB3aWR0aCA9IDE4MDtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gVG9vbHRpcCBoZWFkZXJcblx0b2JqX2luZm9fdGFibGVcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLmF0dHIoXCJjb2xzcGFuXCIsIDIpXG5cdCAgICAudGV4dChvYmouaGVhZGVyKTtcblxuXHQvLyBUb29sdGlwIHJvd3Ncblx0dmFyIHRhYmxlX3Jvd3MgPSBvYmpfaW5mb190YWJsZS5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS5sYWJlbDtcblx0ICAgIH0pO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0aWYgKHR5cGVvZiBvYmoucm93c1tpXS52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdCAgICBvYmoucm93c1tpXS52YWx1ZS5jYWxsKHRoaXMsIGQpO1xuXHRcdCAgICBjb25zb2xlLmxvZyh0aGlzKTtcblx0XHQgICAgY29uc29sZS5sb2coZCk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgcmV0dXJuIG9iai5yb3dzW2ldLnZhbHVlO1xuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmxpbmsgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKVxuXHRcdCAgICAuY2xhc3NlZChcImxpbmtcIiwgMSlcblx0XHQgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRkLmxpbmsoZC5vYmopO1xuXHRcdFx0dC5jbG9zZS5jYWxsKHRoaXMpO1xuXHRcdCAgICB9KTtcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLnBsYWluID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHBsYWluIHRvb2x0aXBzIGFyZSBiYXNlZCBvbiBnZW5lcmFsIHRvb2x0aXBzXG4gICAgdmFyIHQgPSB0b29sdGlwKCk7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblxuXHR2YXIgb2JqX2luZm9fdGFibGUgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdG9ial9pbmZvX3RhYmxlXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfaGVhZGVyXCIpXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuXG5cdG9ial9pbmZvX3RhYmxlXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfcm93XCIpXG5cdCAgICAuYXBwZW5kKFwidGRcIilcblx0ICAgIC5zdHlsZShcInRleHQtYWxpZ25cIiwgXCJjZW50ZXJcIilcblx0ICAgIC5odG1sKG9iai5ib2R5KTtcblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG4vLyBUT0RPOiBUaGlzIHNob3VsZG4ndCBiZSBleHBvc2VkIGluIHRoZSBBUEkuIEl0IHdvdWxkIGJlIGJldHRlciB0byBoYXZlIGFzIGEgbG9jYWwgdmFyaWFibGVcbi8vIG9yIGFsdGVybmF0aXZlbHkgaGF2ZSB0aGUgaW1hZ2VzIHNvbWV3aGVyZSBlbHNlIChhbHRob3VnaCB0aGUgbnVtYmVyIG9mIGhhcmRjb2RlZCBpbWFnZXMgc2hvdWxkIGJlIGxlZnQgYXQgYSBtaW5pbXVtKVxudG9vbHRpcC5pbWFnZXMgPSB7fTtcbnRvb2x0aXAuaW1hZ2VzLmNsb3NlID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBUUFBQUFFQUNBWUFBQUJjY3FobUFBQUtRMmxEUTFCSlEwTWdjSEp2Wm1sc1pRQUFlTnFkVTNkWWsvY1dQdC8zWlE5V1F0andzWmRzZ1FBaUk2d0l5QkJab2hDU0FHR0VFQkpBeFlXSUNsWVVGUkdjU0ZYRWd0VUtTSjJJNHFBb3VHZEJpb2hhaTFWY09PNGYzS2UxZlhydjdlMzcxL3U4NTV6bi9NNTV6dytBRVJJbWtlYWlhZ0E1VW9VOE90Z2ZqMDlJeE1tOWdBSVZTT0FFSUJEbXk4Sm5CY1VBQVBBRGVYaCtkTEEvL0FHdmJ3QUNBSERWTGlRU3grSC9nN3BRSmxjQUlKRUE0Q0lTNXdzQmtGSUF5QzVVeUJRQXlCZ0FzRk96WkFvQWxBQUFiSGw4UWlJQXFnMEE3UFJKUGdVQTJLbVQzQmNBMktJY3FRZ0FqUUVBbVNoSEpBSkF1d0JnVllGU0xBTEF3Z0NnckVBaUxnVEFyZ0dBV2JZeVJ3S0F2UVVBZG81WWtBOUFZQUNBbVVJc3pBQWdPQUlBUXg0VHpRTWdUQU9nTU5LLzRLbGZjSVc0U0FFQXdNdVZ6WmRMMGpNVXVKWFFHbmZ5OE9EaUllTENiTEZDWVJjcEVHWUo1Q0tjbDVzakUwam5BMHpPREFBQUd2blJ3ZjQ0UDVEbjV1VGg1bWJuYk8vMHhhTCthL0J2SWo0aDhkLyt2SXdDQkFBUVRzL3YybC9sNWRZRGNNY0JzSFcvYTZsYkFOcFdBR2pmK1YwejJ3bWdXZ3JRZXZtTGVUajhRQjZlb1ZESVBCMGNDZ3NMN1NWaW9iMHc0NHMrL3pQaGIrQ0xmdmI4UUI3KzIzcndBSEdhUUptdHdLT0QvWEZoYm5hdVVvN255d1JDTVc3MzV5UCt4NFYvL1k0cDBlSTBzVndzRllyeFdJbTRVQ0pOeDNtNVVwRkVJY21WNGhMcGZ6THhINWI5Q1pOM0RRQ3Noay9BVHJZSHRjdHN3SDd1QVFLTERsalNkZ0JBZnZNdGpCb0xrUUFRWnpReWVmY0FBSk8vK1k5QUt3RUF6WmVrNHdBQXZPZ1lYS2lVRjB6R0NBQUFSS0NCS3JCQkJ3ekJGS3pBRHB6QkhiekFGd0poQmtSQURDVEFQQkJDQnVTQUhBcWhHSlpCR1ZUQU90Z0V0YkFER3FBUm11RVF0TUV4T0EzbjRCSmNnZXR3RndaZ0dKN0NHTHlHQ1FSQnlBZ1RZU0U2aUJGaWp0Z2l6Z2dYbVk0RUltRklOSktBcENEcGlCUlJJc1hJY3FRQ3FVSnFrVjFJSS9JdGNoUTVqVnhBK3BEYnlDQXlpdnlLdkVjeGxJR3lVUVBVQW5WQXVhZ2ZHb3JHb0hQUmREUVBYWUNXb212UkdyUWVQWUMyb3FmUlMraDFkQUI5aW81amdORXhEbWFNMldGY2pJZEZZSWxZR2liSEZtUGxXRFZXanpWakhWZzNkaFVid0o1aDd3Z2tBb3VBRSt3SVhvUVF3bXlDa0pCSFdFeFlRNmdsN0NPMEVyb0lWd21EaERIQ0p5S1RxRSswSlhvUytjUjRZanF4a0ZoR3JDYnVJUjRobmlWZUp3NFRYNU5JSkE3Smt1Uk9DaUVsa0RKSkMwbHJTTnRJTGFSVHBEN1NFR21jVENicmtHM0ozdVFJc29Dc0lKZVJ0NUFQa0UrUys4bkQ1TGNVT3NXSTRrd0pvaVJTcEpRU1NqVmxQK1VFcFo4eVFwbWdxbEhOcVo3VUNLcUlPcDlhU1cyZ2RsQXZVNGVwRXpSMW1pWE5teFpEeTZRdG85WFFtbWxuYWZkb0wrbDB1Z25kZ3g1Rmw5Q1gwbXZvQitubjZZUDBkd3dOaGcyRHgwaGlLQmxyR1hzWnB4aTNHUytaVEtZRjA1ZVp5RlF3MXpJYm1XZVlENWh2VlZncTlpcDhGWkhLRXBVNmxWYVZmcFhucWxSVmMxVS8xWG1xQzFTclZRK3JYbFo5cGtaVnMxRGpxUW5VRnF2VnFSMVZ1NmsycnM1U2QxS1BVTTlSWDZPK1gvMkMrbU1Oc29hRlJxQ0dTS05VWTdmR0dZMGhGc1l5WmZGWVF0WnlWZ1ByTEd1WVRXSmJzdm5zVEhZRit4dDJMM3RNVTBOenFtYXNacEZtbmVaeHpRRU94ckhnOERuWm5Fck9JYzROem5zdEF5MC9MYkhXYXExbXJYNnROOXA2MnI3YVl1MXk3UmJ0NjlydmRYQ2RRSjBzbmZVNmJUcjNkUW02TnJwUnVvVzYyM1hQNmo3VFkrdDU2UW4xeXZVTzZkM1JSL1Z0OUtQMUYrcnYxdS9SSHpjd05BZzJrQmxzTVRoajhNeVFZK2hybUdtNDBmQ0U0YWdSeTJpNmtjUm9vOUZKb3llNEp1NkhaK00xZUJjK1pxeHZIR0tzTk41bDNHczhZV0pwTXR1a3hLVEY1TDRwelpScm1tYTYwYlRUZE16TXlDemNyTmlzeWV5T09kV2NhNTVodnRtODIveU5oYVZGbk1WS2l6YUx4NWJhbG56TEJaWk5sdmVzbUZZK1ZubFc5VmJYckVuV1hPc3M2MjNXVjJ4UUcxZWJESnM2bTh1MnFLMmJyY1IybTIzZkZPSVVqeW5TS2ZWVGJ0b3g3UHpzQ3V5YTdBYnRPZlpoOWlYMmJmYlBIY3djRWgzV08zUTdmSEowZGN4MmJIQzg2NlRoTk1PcHhLbkQ2VmRuRzJlaGM1M3pOUmVtUzVETEVwZDJseGRUYmFlS3AyNmZlc3VWNVJydXV0SzEwL1dqbTd1YjNLM1piZFRkekQzRmZhdjdUUzZiRzhsZHd6M3ZRZlR3OTFqaWNjempuYWVicDhMemtPY3ZYblplV1Y3N3ZSNVBzNXdtbnRZd2JjamJ4RnZndmN0N1lEbytQV1g2enVrRFBzWStBcDk2bjRlK3ByNGkzejIrSTM3V2ZwbCtCL3llK3p2NnkvMlArTC9oZWZJVzhVNEZZQUhCQWVVQnZZRWFnYk1EYXdNZkJKa0VwUWMxQlkwRnV3WXZERDRWUWd3SkRWa2ZjcE52d0JmeUcvbGpNOXhuTEpyUkZjb0luUlZhRy9vd3pDWk1IdFlSam9iUENOOFFmbSttK1V6cHpMWUlpT0JIYklpNEgya1ptUmY1ZlJRcEtqS3FMdXBSdEZOMGNYVDNMTmFzNUZuN1o3Mk84WStwakxrNzIycTJjblpuckdwc1VteGo3SnU0Z0xpcXVJRjRoL2hGOFpjU2RCTWtDZTJKNU1UWXhEMko0M01DNTJ5YU01emttbFNXZEdPdTVkeWl1UmZtNmM3TG5uYzhXVFZaa0h3NGhaZ1NsN0kvNVlNZ1FsQXZHRS9scDI1TkhSUHloSnVGVDBXK29vMmlVYkczdUVvOGt1YWRWcFgyT04wN2ZVUDZhSVpQUm5YR013bFBVaXQ1a1JtU3VTUHpUVlpFMXQ2c3o5bHgyUzA1bEp5VW5LTlNEV21XdEN2WE1MY290MDltS3l1VERlUjU1bTNLRzVPSHl2ZmtJL2x6ODlzVmJJVk0wYU8wVXE1UURoWk1MNmdyZUZzWVczaTRTTDFJV3RRejMyYis2dmtqQzRJV2ZMMlFzRkM0c0xQWXVIaFo4ZUFpdjBXN0ZpT0xVeGQzTGpGZFVycGtlR253MG4zTGFNdXlsdjFRNGxoU1ZmSnFlZHp5amxLRDBxV2xReXVDVnpTVnFaVEp5MjZ1OUZxNVl4VmhsV1JWNzJxWDFWdFdmeW9YbFYrc2NLeW9ydml3UnJqbTRsZE9YOVY4OVhsdDJ0cmVTcmZLN2V0STY2VHJicXozV2IrdlNyMXFRZFhRaHZBTnJSdnhqZVViWDIxSzNuU2hlbXIxanMyMHpjck5BelZoTmUxYnpMYXMyL0toTnFQMmVwMS9YY3RXL2EycnQ3N1pKdHJXdjkxM2UvTU9neDBWTzk3dmxPeTh0U3Q0VjJ1OVJYMzFidEx1Z3QyUEdtSWJ1ci9tZnQyNFIzZFB4WjZQZTZWN0IvWkY3K3RxZEc5czNLKy92N0lKYlZJMmpSNUlPbkRsbTRCdjJwdnRtbmUxY0ZvcURzSkI1Y0VuMzZaOGUrTlE2S0hPdzl6RHpkK1pmN2YxQ090SWVTdlNPcjkxckMyamJhQTlvYjN2Nkl5am5SMWVIVWUrdC85Kzd6SGpZM1hITlk5WG5xQ2RLRDN4K2VTQ2srT25aS2VlblU0L1BkU1ozSG4zVFB5WmExMVJYYjFuUTgrZVB4ZDA3a3kzWC9mSjg5N25qMTN3dkhEMEl2ZGkyeVczUzYwOXJqMUhmbkQ5NFVpdlcyL3JaZmZMN1ZjOHJuVDBUZXM3MGUvVGYvcHF3TlZ6MS9qWExsMmZlYjN2eHV3YnQyNG0zUnk0SmJyMStIYjI3UmQzQ3U1TTNGMTZqM2l2L0w3YS9lb0grZy9xZjdUK3NXWEFiZUQ0WU1CZ3o4TlpEKzhPQ1llZS9wVC8wNGZoMGtmTVI5VWpSaU9OajUwZkh4c05HcjN5Wk02VDRhZXlweFBQeW41Vy8zbnJjNnZuMy8zaSswdlBXUHpZOEF2NWk4Ky9ybm1wODNMdnE2bXZPc2NqeHgrOHpuazk4YWI4cmM3YmZlKzQ3N3JmeDcwZm1TajhRUDVRODlINlk4ZW4wRS8zUHVkOC92d3Y5NFR6KzRBNUpSRUFBQUFHWWt0SFJBRC9BUDhBLzZDOXA1TUFBQUFKY0VoWmN3QUFDeE1BQUFzVEFRQ2FuQmdBQUFBSGRFbE5SUWZkQ3dNVUVnYU5xZVhrQUFBZ0FFbEVRVlI0MnUxOWVWaVVaZmYvbVEwUWxXRm4yQVZjd0lVZEFkZGNFRFJOelNWUk15MlZ5cmMwVTN2VE1sT3pzc1UxQmR6M0ZRUUdtSTJCQWZTSFNtNVpXZm9tK3BiaXZtVUtncHpmSDkvT2M4MDhna3V2T3ZNTTk3a3Vybk5aTFBPYyszdys5K2MrOTdudkI0QVpNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGalpuNFRzUkNZMmhkZmZDRkNSRkZkWFoyb29xSUNLaW9xUkFBQWlDaENSQllnSVNXM1NJUWlrUWhhdEdpQkFRRUI5RytjT1hNbUc4akdUZ0R6NTg4WFZWUlVpQ3NxS2lRQUlEMTkrclQwekprek1nQ3dCUUFaQUVnQlFBSUE0cisvR0ZrS3p4QUE2djcrdWc4QXRRQlFBd0RWTFZxMHFBa0lDS2dGZ0ZwL2YvLzdnWUdCZGJObnowWkdBRlpxYytmT0ZaMDVjMFpTVVZFaFBYMzZ0TzNaczJmdEFhQ3BwNmVuYzF4Y1hFdUZRaEhvNmVucDM2VkxsMEEzTnplRnJhMXRNeHNibTJZU2ljUldMQlkzWlZnU0lQb1JvYWFtNWk4QXFLNnFxcnBkVlZWMSs5S2xTeGYrMy8vN2Y2Y3JLeXZQWHJodzRYUjVlZmwvS2lzcnJ3SEFYMzUrZm5jQ0FnS3EvZjM5YS8zOS9lL1BtemNQR1FFSTJPYk1tU002YythTTlNeVpNN1lHZzZFcEFEVHYyTEZqWUV4TVRIeGlZbUxIME5EUVNCc2JHMFZOVFExVVYxZkR2WHYzb0thbUJ1cnE2cUN1cmc0UWtmdGlKbHdUaThVZ0VvbEFKQktCV0N3R2lVUUNNcGtNYkd4c1FDcVZ3dDI3ZHk4Y1AzNzhpRTZuTzNENDhPR3lRNGNPblFhQVA3dDI3Zm9YQUZSMzdkcTFkc0dDQmNnSVFDQTJac3dZeWRtelorMktpNHViMmRuWk9ROFpNcVJiLy83OUV6dDI3Qmh0WjJmbmUrZk9IYmh6NXc3VTFOUkFiVzB0OTNPMXRiVnc3dHc1dUgzN05sUldWb0pVS29YS3lrcG8wcVFKWEw1OEdkemQzZUhTcFV2TUM4Uzd1Ym5CM2J0M3dkUFRFMnByYThIVDB4T2FOV3NHM3Q3ZUlKVktUUWhDS3BXQ3JhMHQyTm5ad1owN2QvNG9MeTh2VjZsVTJweWNuSkxxNnVxclhicDB1ZTNuNTFlMWRldlcrNHhTTGRBKy9QQkQwYXV2dmlyejkvZDNCSUNBWHIxNkRWbTFhdFgyMzMvLy9lcVpNMmZ3K1BIaldGNWVqdnYzNzhleXNqSlVxVlQ0NmFlZjR0U3BVN0Y3OSs3WXUzZHZ0TE96dzdDd01KUktwUmdSRVlGU3FSUWpJeU5SSnBOaFZGVFVRMzEwZERUelp2Q1BHcGZJeUVpVDhRd0xDME03T3p2czNiczNkdS9lSGFkT25ZcHo1c3hCbFVxRlpXVmxXRlpXaGdjUEhzVERody9qenovL2pDZE9uTGkrWk1tU0hkMjZkUnNDQUFHK3ZyNk95Y25Kc3VuVHA3T2FrQ1hZQng5OElCbzFhcFNObjUrZnM1MmRYZkQ0OGVPbi8vREREOGZPblR1SFAvMzBFNWFYbDJOWldSa1dGaGJpaWhVcmNPalFvWmlRa0lCU3FSVER3OE5SS3BWeXlSUWJHNHN5bVF6ajQrTlJKcE5ocDA2ZFVDYVRZZWZPbmRIR3hxWkIzNlZMRitiTjZCODJQc2JqU09OSzR4d2RIVzJTQndrSkNUaGt5QkJjc1dJRkZoWVdZbGxaR2U3ZnZ4OFBIejZNSjA2Y3dKS1NraDlHalJvMTNkYldOdGpYMTlkNXhJZ1JOdSsvL3o0akFuTlpjbkt5ek5mWDE4bmUzajVreG93WmN5c3FLdjQ0YytZTUhqbHloSnZwMDlMU01Da3BDV05pWWt4bWRFcUNUcDA2b1kyTkRYYnQyaFZ0Ykd6d2hSZGVRQnNiRyt6Um93ZmEydHBpejU0OTYvVzlldlZpM2dKOVErUFZvMGNQay9HbDhTWnlvSHlJaW9wQ3FWU0tNVEV4MktkUEgweE5UZVdVUVhsNU9SNC9maHdQSFRyMHg2UkprK1kyYWRJa3hNZkh4Mm5Zc0dFeWhzYm5hTU9IRDVmNCtQZzRBRURRTysrOE0vUDA2ZE8vbno1OUdnOGRPb1JsWldXbzBXaHd3b1FKMkxWclY1UktwWndjakl1TFE1bE1aZ0oyNCtSSlNFaEFXMXRiVEV4TVJGdGJXMHhLU21MZWlqeU5LNDB6alR1ZkZDaFBpQXk2ZHUySzQ4ZVBSNDFHZzJWbFpYamd3QUU4ZHV3WWxwZVgvejUrL1BpWkFCRGs3ZTN0OFBMTEwwc1lPcCtoVFowNlZSUWZIMjhIQUY1SlNVbkpSNDRjT1hybXpCazhmUGd3bHBXVllYWjJOazZhTkFudDdlMjVtVDR1THM1a2NHbG01NE85YjkrK2FHdHJpeSsrK0tLSjc5Ky9QK2Z0N095WUY1QTNIai8rdU5KNDgwbUJsQUtmRENJakk5SGUzaDRuVFpxRTJkblpYSzNnaHg5K1FJMUdjN1I3OSs3SkFPRFZzV05IdTBtVEpyRmx3ZE8yb1VPSFNyeTl2UjBWQ2tYa3VuWHJ0cDgvZjc3MjJMRmp1SC8vZmxTcFZEaGt5QkNNaUloQW1VeUdIVHQyUkpsTXhxMFIrYUNuR2FGZnYzNG00QjR3WUFEYTJkbmhTeSs5Wk9JSERoekl2SUE5Znp4cG5Ja2NLQThvTC9oazBLVkxGNU84aW9pSXdDRkRobkNGdy9MeWN2emhoeDlxdi83NjYrMXVibTZSWGw1ZWpvTUdEWkl5MUQ0Rm16SmxpbWpvMEtHMkFPRFZ2My8vY1dmT25EbC84dVJKUEhqd0lCb01CcHc1Y3lZMmJkcVVtL0ZwVFUveW5nYlRlSWF2RCt3TkpjK2dRWU9ZdHdML0tIS2dmT0FyQk1vZldpWlF6U0F5TWhLYk5tMktNMmZPUklQQndCVUx5OHJLemlja0pJd0RBSytCQXdmYXZ2WFdXMHdOL0EvZ0YzdDdlemUxczdOcnZXTEZpdFhuenAyclBYTGtDTzdidHcrWExWdUd2WHIxUXBsTWhqRXhNU2F5amRaMnhPaVBBdjNqSnRIZ3dZT1pGNUIvVW5Kb2lBd29qM3IxNm1XU1p6RXhNU2lUeWJCWHIxNjRkT2xTM0xkdkgrN2Z2eCtQSERsU08yL2V2RFcydHJhdFBUMDltNzcxMWx0aWh1Wi9CbjdIb0tDZ3p2djI3VHZ3MjIrLzRZRURCMUN2MStPSUVTTXdMQ3lNMjlwNTJJeFA4cjZobVo3TmtNdy9UQm5RTXFFaFJVQmJpMkZoWVRoaXhBalU2L1ZZVmxhR2h3NGR3bDI3ZGgzMDgvUHI3T25wNmZqbW0yOHlFbmlDOWI0VUFGemo0K09IVmxSVVZQNzAwMDlZVmxhRzI3ZHZ4NENBQUc2dFQvdTl0TlhEWm56bW42Y2k2Tm16cDBtL1FVUkVCTFpvMFFLM2JkdUcrL2J0dzRNSEQySkpTVWxsZUhqNFVBQndmZW1sbDFoZDRESEFMd01BeFd1dnZUYnBqei8rdUgzMDZGSGN0MjhmZnYzMTF5aVh5ekVxS29xVFliYTJ0dGk3ZCsvSG12RVp5Sm4vSitUd0tFVkErVWZMZ3Fpb0tKVEw1ZmoxMTE5elM0SURCdzdjSGp4NDhMOEFRREZnd0FEV00vQUk4SHRObXpadDVybHo1KzRkT25RSTkrM2JoKysrKzY3SldyOTc5KzRtY3F4ZnYzNG1UTTFBei95ekpBUEtNOW85b0R6czNyMjdTVzNnM1hmZjVVaWd2THo4M3JoeDQyWUNnQmNqZ1llQS8rT1BQNTc3KysrLzN6OTQ4Q0FXRkJUZzJMRmp1UzBZWS9EMzZkUEhCUHhzcmMvODg2NE5HSk1BNVNPUkFHMFpqaDA3RmdzS0NtaEpjUC9OTjkrYysvZU9GaU1Cc2lGRGhrZ0J3UFBERHovOGhNQ3YxV3B4K1BEaFhKdW1jYUdQbWpmNGEzMjJsY2Y4ODl4QzVOY0dLQytwUUVqdHhjT0hEMGV0Vmt0cTRQNzQ4ZU0vQVFEUC92MzdzNXJBMEtGREpRRGcvczQ3NzB6Ly9mZmZhd2o4Z3djUE51bmtvMlllS3NDd0daOTVTOXd0b1B5a0ppTHFKQnc4ZUxBeENkUWtKeWRQQndEMy92MzdOOTcyNGNtVEo0dTl2YjJkazVLU3h2eisrKzlWQnc4ZVJKMU9oME9IRGpXWitmbmdwNW1mZGV3eGIwa2RodnhkQWlJQlVnSkRodzVGblU2SCsvYnR3OUxTMHFvdVhicThwbEFvbkNkT25OajR0Z2pmZmZkZGtiZTN0ME9IRGgzNm5qMTc5dnFoUTRld3NMQVFrNU9UNndWL1E3S2ZnWjk1U3lDQmhwWURmQkpJVGs3R3dzSkMzTGR2SCtyMSt1c3RXN2JzcTFBb0hDWk1tTkM0T2daalkyT2J1TG01aFI4N2R1emswYU5Ic2JTMEZGTlNVdGpNejd6Vks0R1VsQlFzTFMzRnZYdjM0dTdkdTArNnVMaUVSMFpHTm1sTVJUOFpBUGhuWkdTb2Z2NzVaeXd0TGNXNWMrZWFWUHNmdGVabjRHZmVra21nb1pvQTdRN01uVHNYUzB0TGNkKytmZmpWVjErcEFNQy9VZXdNVEo0OFdRd0FidE9uVDU5OSt2UnAzTHQzTDY1YXRRcHRiVzI1ZmY1SFZmc2JPclhIUFBQbTlQejhiR2gzSUNZbUJtMXRiWEhWcWxWWVdscUtwYVdsT0hyMDZFOEF3RzNDaEFuV1hRL3c5dlp1RmhvYTJ2Zk1tVE8zRHh3NGdFcWxFbDFjWERBNk9wcmI1N2V4c1hua21wOTU1b1ZBQnNZa1lKemYwZEhSNk9MaWdqazVPVmhhV29vNm5lNzIzL1dBWnRiZTdCTm9NQmdPSGoxNkZFdEtTakFtSm9ZN3l0dXRXemUwc2JIaG1pcll6TSs4TlNtQlBuMzZvSTJORFhicjFvMDdVaHdkSFkwbEpTVllVbEtDNmVucEJ3RWcwQ283QmYrVy9xN1RwMC8vOU5TcFUxaGFXb3BUcDA3bFR2WFI1UjM4OWw3K1pSM01NeThreis4WVRFaElNTGxrSkN3c0RLZE9uWW9sSlNWb01CaHc5T2pSY3dIQTFlcTJCdVBqNDV2NCtmbkYvZmJiYjlmMzc5K1BtWm1aM0cyOGRJa0hIYXhnNEdmZW1rbWdkKy9lSnBlTFJFZEhZMlptSnBhVWxHQnVidTUxRHcrUHVPam9hT3ZaRlhqLy9mZkZBT0NWbnA2Ky9mang0MWhjWEl5dnZQS0tTYWNmWGVMUnQyOWZUall4RW1EZVdzQlArVXluQ09seUVlb1VmT1dWVjdDNHVCZ05CZ1ArKzkvLzNnNEFYbFp6a1VpblRwMmFSa2RIdjNqNjlPbDdlL2Z1eFJVclZuQlhML08zL0l5RHhTY0I1cGtYb3Vmbk0zOXJrSzZzLys2Nzc3QzR1QmpWYXZXOTRPRGdGMk5pWW9UL1RzcnAwNmRMQU1CbisvYnQrVWVPSE1IaTRtSnMyYklsUmtaR21wenVTMHhNNUdRU0F6L3oxa29DbE4rMHkwVzdBcEdSa2RpeVpVdE9CY3liTnk4ZkFId21UWm9rN0xNQ25UdDNiaG9mSC8vU2I3LzlWbHRhV29xZmZ2b3Bob2FHMWx2NGEwaitNOCs4TlpHQThmVml4Z1hCME5CUS9QVFRUMGtGMUxacjErNGxRYXVBR1RObWlBSEFhLzM2OVZtSER4OUdnOEdBUFh2Mk5Mbkx6L2dDei9vVUFQUE1XNU9uL09aZk5FcDNDL2JzMlJNTkJnTVdGaGJpckZtenNnREFhOUtrU1dLaHp2NTJyVnExNm5icTFLbTdwYVdsdUhqeFlwUktwZlcyK3pMd005OVlTY0M0VFZncWxlTGl4WXZSWURDZ1VxbTg2K1BqMHkwbUpzWk9jT0NmTm0yYUNBQmM1OHlacytMWXNXTm9NQmd3TkRRVUl5SWlUTzcwNjlPbkR5ZUxqSVBEUFBQVzdDbmZxZW1ON2hTTWlJakEwTkJRTkJnTVdGQlFnT1BHalZzQkFLNkNlOXZReUpFalpSS0pwUFVQUC96d3g5NjllM0g5K3ZYWXZuMTdrOXQ4NlpYY2ZBWEFQUE9Od1ZQZVUxOEEzUzdjdm4xN1hMOStQUllWRmVIbXpadi9FSXZGclFjUEhpeXM3a0JmWDk5bVE0WU1tWERpeEFrc0tpcDY0S2l2OFZYZVRBRXczMWdWQVArS2NlTWp3MFZGUmFoU3FiQnIxNjRUdkx5OGhITkc0SU1QUGhBQmdHTFZxbFZaNWVYbHFOVnFVUzZYY3ozL3RQVkI4b2VDUU5WUjVwbHZESjd5bnM0SWRPL2VuVHNqNE9EZ2dGcXRGZ3NLQ25ENjlPbFpBS0Q0MTcvK0pZeGx3S2hSbzJTMnRyWnRmL3JwcDJzbEpTVTRiOTQ4N05DaHd3UHluNEdmZVVZQ1NTYnR3YlFNNk5DaEE4NmJOdzhMQ3d0eDI3WnQxMlF5V1Z2QkxBTzZkdTNhZE9EQWdlTisvUEZITEN3c3hERmp4cUJVS20zd21pK2hrOEEvZlY4OUEwSGpqaU45L3ZxdUQ1TktwVGhtekJnc0xDekUzTnhjN05TcDA3aU9IVHMyRllyOGQxdXdZTUg2OHZKeTFPbDBKdksvVzdkdUppOVQ0Sk9BVUR4OWJ2SzBuQ0ZQejBlZS8vLzVQeSswNTJkeGZMclBUODluZkZSWUxwZWpUcWREclZhTDQ4ZVBYdzhBYnUrODg0NWxMd05telpvbEFZQ0FBd2NPbkN3dExjVnZ2LzJXcS83VHFUOXEvaEhhb0RXVXJMU2NvZWVpQWlmZjAvK243MitzWk1EaVdIODhxQ21JVGdtMmI5OGV2LzMyVzlUcjlaaWVubjRTQUFMZWZmZGR5MjRON3RhdG00MjN0M2ZzVHovOVZGTllXSWlUSjA4Mk9makRmNHN2ZjlBczFmTm5KRXBDV3M1UVlaUDJjNm5ObVR6OWR6cjdRRDlIdjRjL3d3a2xMaXlPVDhmejN6cE1CNFFtVDU2TWVyMGVkKzNhVmVQaTRoSWJHeHRyWStrRTBHellzR0Z2SFR0MkRQVjZQWWFIaDV0YyttSE0zRUpQVnJyQmlBcWJkTFNaT2gzNW52NC9mVDh0aDZ5ZERGZ2NIODhUTG93dkN3a1BEMGU5WG84NU9Ubll0V3ZYdHpwMjdHangyNEV1NzcvLy9zcURCdytpWHEvbndNOS93NCtsRHdwZmxwTDhwQm1LbGpQMElzakl5RWhzMHFRSkppUWtZSHg4UEw3MjJtczRhTkFnSER0MkxIYnExQWtURWhMUTN0NmVlN1U1S1NMNlBUU2owZDk1bEx3Vkd2aWZOSTU5K3ZUQitQaDRIRFZxRkE0YU5BaEhqUnFGY1hGeG1KQ1FnSFoyZGx4TnlWcmlTSitQLzBhaDBOQlExR3ExcUZhcmNlalFvU3NCd01WaWtUOXo1a3dSQUhobFpXVVpTa3BLY1BQbXpTaVZTcm5CNHIvU20xL1FzUlRQbjZsSWx0R01RMWM3UjBSRVlIUjBOSDc0NFllNGRPbFNWS3ZWV0ZCUTBPQ1hScVBCNWN1WDQ4eVpNekUyTnBhTEM4MXM5UHRwbWRUUVRDWVUveVJ4N05peDQyUEhVYVZTNGFKRmkzRDY5T2tZRVJIQmthclE0Mmo4cW5FaVE2bFVpcHMzYjBhTlJvUHo1czB6QUlEWDVNbVRMYk1RK1BISEgwc0FJR2ovL3Yxbmk0cUtjUGJzMlZ3Qk1ENCszb1NaaFpLME5GUFI2Y1dvcUNoMGQzZkhqejc2Q0hmdjNzMVZhZlB5OG5EUG5qMjRkZXRXWEw5K1BhNWV2UnJUMDlOeDdkcTF1SEhqUnR5NWN5ZG1aMmVqU3FWQ25VNkhCUVVGbUptWmliTm56MFovZjMvdWZnVDZPL3laVEdna1FKK1hQK1BUODBWR1JtSkFRQURPbmowYk16SXk2bzNqaGcwYmNNMmFOYmhxMVNwY3QyNGRGOGVjbkJ4VXE5VmNISGZ1M0lrZmZ2Z2h1cm01WVZSVVZMMXhGQW9KVUx6b2RHRDc5dTF4OXV6WnFOUHBNQzB0N1N3QUJFMlpNa1ZpcWV0L21WZ3NibnZzMkxFcXZWNlBNMmJNUUtsVWFuTGx0ekhUOGJkNHpPM3BjOUV5aFFwT05GUEZ4OGZqOU9uVFVhUFJvRmFyUmFWU2lSczNic1NsUzVkV2YvamhoMGRmZXVtbDlaMDdkLzQ0UER6ODliWnQydzV0MGFKRllraEl5TkN3c0xCeG5UcDErbmpBZ0FGclAvcm9vOE9wcWFsVk8zZnV4UHo4Zk5UcGRLalQ2WERtekpsY0V3ak5aS1NZNlBOWWF0eWVOSTZkTzNmR0R6LzhrQU45VGs0T3hiR0s0dGlwVTZlUHdzUEQzK2pRb2NQSUZpMWFKSWFHaG82S2lJZ1kzNmxUcDQ5ZmZ2bmxUWFBuenYxcDFhcFY5M2J2M3MyUnFscXR4dmZlZTQ5cnA2VytFNG9qZjFsZ3FYRXp2anBjS3BYaWpCa3pzS0NnQURkdjNsd2xGb3ZieHNYRnlTeVZBR3dqSXlON0h6bHlCSFU2SFE0WU1JQzcvS056NTg3MU1yR2xKaTFWbldsdE9uNzhlTXpJeUVDdFZvdDc5dXpCMU5SVW5EWnRXbm1uVHAwK2RuQnc2QWdBL2tWRlJiM3hJVlpVVk5RYkFQeWJOMjhlM2JsejU1bXpaczNhdjNuejVycmMzRnpVNlhTWWxaV0ZiNy85dHNuYWxncW5EUlc0TE0zekMzejhPTDc5OXR1NFo4OGUxR3ExbUptWmlTdFdyTGcvZGVyVS9mSHg4UjgxYjk0ODVuSGlPSFhxMU5ZQTBNTEp5YWxUMTY1ZDUzejY2YWRIdG16WmdubDVlYWpUNlhEMzd0MDRkdXhZa3pnS2hVd3BmalFaaElhRzRvQUJBMUNuMCtHT0hUdXdaY3VXdmVQaTRtd3RsUUNhRGhnd1lOejMzMytQT3AwT0J3MGFaTElGeUpkak5Bam05c1pKYTd5R2pJNk9SaWNuSjF5NGNDRTM0NmVucCtNNzc3eXpOemc0ZUNRQUJOVFcxbGJnUDdEYTJ0b0tBR2dSSEJ3OGJOcTBhVVhidDI5SGxVcUZXcTBXbHl4WmdpNHVMcHljcFFJWHJhSDVNNW1sZURyUVFwK1RQbmRVVkJRNk96dmpraVZMdURpbXBhWGhXMis5WlFnS0Nob0tBQzMrYVJ5cnFxb01BQkFZR2hyNjZzY2ZmM3hnNTg2ZDNQSmd3WUlGS0pmTE9RVks0OG9uVTB2TFExSUF0QlU0YU5BZ2p0aGlZMlBIeGNiR1dtWkhZTmV1WFpzbkp5ZFBwOWQ4dDJyVml0c0ZvT0JiV3ZJMkJQNm9xQ2gwYzNQRFRaczJvVWFqd1IwN2R1Qm5uMzEyTVNvcWFqSUFCT0JUTkFEd2o0Nk9mdk83Nzc0N3AxUXFVYXZWNHViTm05SFQwNU1yRkZvNkNkUUhmaXBrS1JRS3JwQzFmZnQybkRkdjN2bXdzTEMzQWFERlU0NWpZUGZ1M2FlbHA2ZGZ5YzNOUmExV2l4czJiREFoVTBzbkFZb2pLWUN3c0RCczFhb1Y2blE2M0xObkQzYnYzbjE2eDQ0ZG0xc2tBZmo1K1RtT0hUdDJmbGxaR2VwME9veUxpN05vQmRCUWRUb3FLZ29WQ2dWdTI3WU4xV28xYnRpd0FTZE5tbFRxNHVMUytmYnQyK3Z4R1ZoVlZaWEIyZG01NHdjZmZGQ1FsWldGV3EwV2QrM2FoWDUrZmx5VjI3aXdaVXdDNW9xbmNjZWU4ZWVpQWxaRVJBVDYrdnJpcmwyN1VLMVc0N3AxNnpBbEpVWHY1T1FVVzFWVlpYZ1djYnh5NWNxbjd1N3UzZWJPbmJzL096dWJJMVBqQW1GRHV3U1dxZ0RpNHVKUXA5TmhUazRPSmlRa3pQZnk4bkswMUoxQXAvSGp4eThxTFMzbGpnRHpGUUNmZWMzbENUejFnZC9GeFFVM2JkcUVLcFVLVjY5ZWpjbkp5YnNrRWtscmZBNG1Gb3RiVHB3NGNXTm1aaWFxMVdyY3VYTW4rdm41WVhoNGVMMGtZTzU0a25MaWd6ODhQQng5ZlgxeHg0NGRtSitmajZ0V3JjTGh3NGR2RW9sRUxaOUhIR1V5V2ZEa3laT3o5dXpaZ3hxTkJqZHUzRml2RWlBUzRKT3B1ZU5wckFEa2NqbFhMRTFNVEZ3RUFFNldTZ0RPRXlkT1hGbFNVb0phclJiYnQyOXZjZ2NnWHdGWVNyQ3BVQlVkSFkxTm1qVEI5UFIwVktsVXVIYnRXaHcrZlBpbXB5MzVIMFBLK3IzMjJtdkxMSjBFSGhmODZlbnBPSERnd09VQTRQK2M0eGo0emp2djdNek96a2FOUm9PcHFhbllwRWtUcmlaQTQyNHBreEpmQWRBZGdlM2J0K2RxSjBsSlNTc0F3TmxpQ1NBbEpXVzF3V0JBclZhTFVxbTBRUVhRMEVHUDUrWDU0S2NxOWV6WnMxR2owZUNXTFZ0dzNMaHh1UUFRaUdZd0FQQ3Rqd1Q0blpYVVJzdWZ5WjYxSitWRWY1ODYxOExDd2hvQ3Y2ODU0aWlWU2x2Tm1qVkxrNXViaXhxTkJxZFBuLzdBN29BbDVxV3hBcEJLcGFqVmFqRTNOeGY3OWV1MzJwSUp3Q1VsSldWMVVWRVJhalFhREE0T05sRUExTE50Q1VFMjdrR24vZW5FeEVSVXE5V1lrWkdCSDM3NDRTLzI5dmFoYUVZakVzakl5RUNWU29VN2R1eEFYMTlmczVQQW84Qy9mZnQyek12THc3UzBOSHpwcFpmTUJuNnk1czJiaDZXbXB2NmFuNStQYXJVYUV4TVRUZm90K0djSnpKMmZ4bmtwbFVveE9EZ1lOUm9OS3BWSzdOdTM3MnBMYmdjMklRQmpCV0JjeFRZT3RyazhCWm1hUmtKRFEzSEpraVdZbDVlSFM1Y3VyZkx4OFJtSUZtQ1BJZ0hqWnBmNlRzazliYzgvclVmeHMxVHdrN1Z1M1hwUVZsWldsVnF0eGtXTEZuRTNWRkg4K0NSZ0xzL2ZSU0VGSUVnQ0lBVkFjc3RTZ3N4dlN3MFBEK2RtL3kxYnR1RExMNys4QmdBODBVTE1Va2hBcU9EL080YWU3N3p6enJyOC9IelVhRFRZdTNkdjdvcDZmdHV3cFV4T3RBc2dLQVV3Y2VMRTFZV0ZoYWhXcXprRllCeGtjeXVBK3FyK01wa01OMjdjaUxtNXVmamxsMTllc2JlM2owQUxNejRKYk4rK0hYMTlmYmxPUzVLelZOTjQyc2xNNEtmZlQ4dW0wTkJRRS9DbnBxWmFIUGpKbkp5Y292ZnMyWE5kclZaamVubzZ5bVN5Qm5jRnpKMmZoQmRTQUdxMUduTnljb1JGQUczYXRERTVDMER0bUJSa2MzbWF3YWp3TjJEQUFGU3BWTGgxNjFaODhjVVhseitxRmRXY0pEQm16SmhsdTNmdnh2ejgvTWNtZ2Y4MVhvOEMvN1p0MnpBM054ZFRVMU54d0lBQkZnbCthaUdlTkdsU21rcWxRclZhalVsSlNmVzJDMXRLZnRKWmdEWnQyZ2lUQUtSU0tZYUdodFlyczh3VlhIN2hxa09IRGpoNThtVE16OC9IWmN1V1ZUazVPWFZHQzdiblRRTFdBbjR5WDEvZjdtcTF1a2FsVXVIYmI3L054YzI0b0dyTy9PUXZUME5EUTYxSEFWQVNrY3g1M3Q3NEVncnFWSk5LcGJoanh3N015c3JDOTk1N3I5alNFL2hoSkVDRkxUNEpHTzhTUEltbm4rT0R2ME9IRG9JRVAvVllyRnExYXI5YXJjYXRXN2VhM0ZkaGZLbUlPZlBVdUM5RmtBcEFyOWVqU3FWQ2lVVENNU3kvZWNYY3dTWDUzNzE3ZDFTcFZMaGx5eGJzMHFYTHAvLzBVSXE1U0dEWHJsMllsNWVIMjdadGU2b2s4RGpnVnlxVnVITGxTc0dBSHhHeHVycmFNR3pZc004MEdnMnFWQ3J1K2kxK3ZNdzlTVkZUVldob0tFb2tFbFNwVkppZG5ZMUpTVW5DSVlEV3JWdWpWQ3A5b05CQ0QvbThQYTJ0ak9WL1VsSVM1dWZuNDVvMWF6QXdNTEFmQ3NnZVJRSzB0cVc0Rys4U1BFNmM2T2VJTEJzQS96S2hnSjhzSmlabUlMMTJxM2Z2M2x5OCtIMFY1c3BUNHdLMVZDckYxcTFiQzVNQUpCS0p4UWFYcmx1YU9YTW01dVhsNGJKbHkyNENRREFLeko0MkNWZzcrUDgrYjlHMnNMRHdqa3FsNGk2dG9SdVp6RDFKMVZlakVxUUN5TS9QNXhRQUJaZldXUFNRejl2ejVXeTdkdTF3L3Z6NXFGUXE4YlBQUGp2eHZIditueVlKdlBycXF4d0piTjI2RlgxOWZibnIyS2dHUS9Ibkx3djQ4YUh2aTQ2TzVxNmw4dlgxeGExYnR3b2UvSFJHSURjMzl6ZTFXbzJmZlBJSnRtdlg3cUhMcHVmdEtmNDBTYlZ1M1JyejgvTXhLeXRMR0FSUVVGQ0ErZm41SmdxQTM2eGlydUFhSDFpUlNxVzRhdFVxek03T3hsbXpadTBEQUI4VXFCRUo3Tnk1RTNOemN4K2JCUGozN3o4TS9EazVPYmhpeFFyczM3Ky9ZTUZQc2RxK2ZmdCtqVWFEYVdscEtKVktIemhvWmE3ODVEZFprUUlRSkFHMGF0VUtwVkxwQXgxWDlKRFAyeHZmOUNPVHlUQWtKQVRYcmwyTDJkblpPRzNhTkIwQWVLR0FyU0VTb0JtT2YyRW14WU84OGNXbnBKQ3NEZngveDhsNzQ4YU5lcTFXaTZ0WHI4YVFrQkFUa3VRdmw1NjNwM0dnWGFwV3JWb0pWd0hRRE1TWFYrWUtydkhCRmFsVWloczJiTURzN0d6ODk3Ly9yUmM2QVR3SkNWQk5obVo4K3JlMWc1OElZTnUyYlFhZFRvZnIxcTB6T2JOQ2NUQlhmdktYcWUzYnR4ZVdBcGd3WWNKcW5VNkhlWGw1RFNvQS91dWVucGMzdnFPT0ZNQ3laY3N3T3pzYjU4eVpVMllOeVcxTUFqdDI3RUNsVW9sYnRtd3hJUUdxeWRDeWpEenRoeFA0dDJ6Wmd0bloyZmpkZDkvaGl5Kyt1TXlhNHJObno1NkRHbzBHRnk5ZS9JQUM0QytUbnJldlR3SFFkZW1DSWdDSlJNSWxIYjhhYmE3Z0doOWdrVXFsK00wMzM2QlNxY1N2di81YXNFWEFKeUdCdG0zYmNrMVFwQWlNLzkyMmJWdXJCajhWQVFzTEMwOXFOQnBjdUhDaGlRSWdNalJYZnZKM1g5cTFhNGNTaVVTWUJOQ3laVXV1d0ZMZk85MmV0K2V2Y1VOQ1F2RHR0OS9HM054Y1hMMTY5UTBoYmdNK0tRbjQrUGh3TXg0MWFaRVBDUWxCSHg4ZnF3Yi8zM0ZwZStqUW9kc3FsUW9uVHB6NGdBSm9xRWJ5dkR6aGhBclZMVnUyRkI0QjVPYm1va1FpNFdZY0tyeVJ2REpYY1BrS1lQVG8wZHhhdVdYTGxuM1J5b3hQQXBzM2IwWWZIeDl1aXpZa0pJVGJhdkx4OGNITm16ZGJOZmdSRVR0MzdqencwS0ZEbUp1Ymk4bkp5ZlVxQUhQbEo3V3BFMTdhdG0yTEVva0VjM056TVRNekV4TVRFeTJmQU9qNkltTUZZQnhjSW9IbjdXa0wwRGk0dnI2K21KdWJpeGtaR2RpN2QrODVRbWtGZmxJU0dEMTY5TEx0MjdkalRrNE9idHEwQ1gxOGZEQXdNQkNsVWlrR0JnYWlqNDhQYnRxMENiT3lzbkQ1OHVWV0MvN3E2bXJENjYrL1ByK3NyQXh6YzNOUm9WQnd5MVRLQzFJQTVzcFRtcVNNRllBZ0NjQllBWkRzdHJUZ3RtclZDamR1M0lnNU9UbjR5U2VmR0t3eDZSc2lBVzl2Yi9UeDhVRnZiKzlHQVg2S1EwNU96bDY5WG85cjE2N2xDdFdXTmtrUlhnU3RBSUtDZ2t6a0ZXMEZFZ2s4YjA5cksyTDZEaDA2b0ZRcXhWbXpadEV5b01yRnhTVWVyZFQ0SkxCeDQwYU1qbzdHalJzM05ncndJeUw2K3ZwMk9YNzhlSFYrZnA3YUFDa0FBQ0FBU1VSQlZENSs4TUVIS0pWS3VXWTFxZ0ZRbnBnclQya0xrSmFwUVVGQndpTUFwVktKRW9tRUs3QVFvMWxLY0dtTEpUZzRHRU5EUTFHcFZHSldWaFlPSHo1ODBXKy8vZlo2WXlFQmV1N0dBUDZpb3FMZXMyZlBYbjdnd0FGVUtwWFlybDA3cmdiQ2Y4VzRPU2NwWTd5RWhJU2dSQ0pCcFZLSkdSa1p3aUlBVWdCVVphYXRRSE1GbHp4dHNSRER0bXJWQ3RQVDAxR3BWT0tHRFJzdU5tL2VQQnl0MklnRXRtM2JocG1abWJoczJUS3JCejhpb3JPemM4VHg0OGV2MERzQ1NQNlRRclcwL0tUTFFJS0Nnb1JKQU1ZS2dKcE1hSTFGU3VCNWUySjRZbGg2ZWNtb1VhTlFxVlJpZG5ZMmpoOC9QaFVBUEJvQkNTeFp0R2dSOXUvZmY0bTFneDhBRkY5ODhVVmFlWGs1S3BWS0hERmlCUGZTRGVNT1Njb1BjK1VuMWFnSUw0SldBRlJsYm1pTlpTNVBERXZMZ0xadDI2SlVLc1hseTVlalVxbkUzYnQzM3drSUNPaVBWbTRBNEJFVkZkWFAyc2tPRVRFc0xHekFyNy8rZWtlbFV1SHk1Y3ROeHAza1B5a0FjK2NudjBZVkdCZ29YQVVRSEJ4czBtbEdETXR2UTMxZW52NCtCWmxrVnV2V3JiRk5temFvVkNveE56Y1gwOUxTZm1yYXRHbDdaQ1o0azh2bEhRNGVQUGhMU1VrSktwVktiTk9tRGRjSFFmS2ZKaWRMeUU5anZBUUhCd3RMQVl3ZlAzNjFScVBCbkp3Y1RnSHdaWmE1Z2t1ZW1KNWtGakZ0eTVZdE1TVWxCWE55Y2pBM054Yy8rdWlqSEd0cUQyNk1CZ0FCbXpadHl2NysrKzlScVZSaVNrb0sxNTlDeXBUT1JsQmVtRHMvK2N2VHdNQkF6TW5Kd2QyN2QyT2ZQbjJFUXdBU2lZUzdHSlQyV1VsK0U5T1p5NU1Db0dVQTlWeTNidDBhdi9ycUs4ekp5Y0g4L0h4ODc3MzMxc0p6ZnFrbHM2Y0dmdi9seTVldk8zNzhPT2JsNWVIQ2hRdXhWYXRXM0JrVlkvbFArV0R1dkNSOFVKOUttelp0VUNLUkNKTUFBZ0lDSGxBQWxoQms4dlI1S05qVWROR2hRd2RjdVhJbEtwVktWS2xVT0dYS2xGUUE4R09RRWhUNC9SWXZYcHo2ODg4L1kzNStQcTVjdVpLN1hJUFcvalFwV1dwZWtnSUlDQWdRcmdLb2I2MWx6SFRtOHZRNWFCbEF0UUJhYzBWR1J1S3FWYXRRcVZTaVdxMW1KQ0JBOEo4NGNRTHo4L054MWFwVkdCRVJ3ZFdralBPUnh0L1M4cEsycUZ1M2JpMWNCZENpUlF0T1hoc0gyOXhCSms5TXl5Y0JrbDBSRVJHTUJLd0kvTFFjcGI0VUduZktBMHZKUytON0dhUlNLYlpvMFVKWUJLQldxekU3Ty91aENzQlNQUDg4UE1rdVl0NklpQWhNVDAvSG5Kd2NWS2xVT0hueVpFWUNBcEQ5ZVhsNW1KNmV6b0dmOHBBS2YvejdFQ3d0TC9rS0lEczdHM2Z0MmlVc0FpQUZ3TCtFd3RLQ1RZeExhMEkrQ1lTSGh6TVNFQ0Q0dzhQRFRjQlB0U2dhWjc3OHR4UnZmRGtMS1FCQkVvQkVJdUhhTFVsMkVlTmFtcWVnRS9PUy9LS3FNU01CWVlLZjhvL0drNVFvWHdGWW1xZmxLT1dmVlNnQWZ0WFZVanpOQkk4aWdiQ3dNRVlDQWdCL1dGallZNEdmWHdPd0ZFODRzUW9GVUYvVGhTVjdDajR4TUEwQ0l3RmhncC9HanhRb1gvNWJxamR1VGhPY0FsQ3BWSmlWbFlYKy92N2N0Vk0wczFweTBHbG1hSWdFYURDSUJMS3pzekUvUDUrUmdJV0JueWFkaHNEUFZ3Q1c1Z2tuZEZUWjM5OGZzN0t5Y09mT25jSWlBT1BCb0FLTXBRZWZrWUN3d0orYm0ydFY0T2Z2UmxHK0NaSUEvUHo4Nm0yK29JZTBWRS9KUXArWDVCZ2R6YVJCQ1EwTlpTUmdBZUNuVjJqVHVORE1TY3RPR2tjK0NWaXFweG9VTmFYNStma0pWd0hRcFNEVURDU1VRWGdVQ1FRRkJURVNzQ0R3MDNnSUhmejBPYWx3U2M4bGFBWEE3OENpaDdSMFQ4bERuNXRrR1RFekl3SExBajhwVFZwdTByanhTY0RTUGI4ajFTb1ZBQ01CWmd6OERYdXJVQUMrdnI0bUNvQXZ5NFRpS1pubzg5UGdFRU1IQmdaeXB3Z1pDVHg3OE5PcFBvbzc1UmROTWpST2ZCSVFpcWZsSnVXWHI2K3ZjQlVBWFFwQ3pVQkNHd3hHQWd6ODV2QzBpMEhQS1JnQ2VPT05OMWJuNStmam5qMTdPQVhBNzhYbXY1Tk9LSjZTaTU2REJvbk9EQVFFQkhBa2tKYVdobGxaV1ppWGw4ZEk0Q21BUHkwdGpRTS94Wm55aWlZWEdoYytDUWpOODgraStQcjY0cDQ5ZTNESGpoMllrSkFnSEFLZ3dUSnVCaExxb0R3cENiUnYzOTZFQk41OTkxMUdBazhJL3A5KytnbVZTaVdtcGFWaCsvYnRHd1g0alYvVVNwZUJTQ1FTWVJLQWo0L1BBejNaeG9Na1ZFL0pSczlqL0lKTlJnTFBEL3cwcWRBNDhFbEFxSjUvQnNYSHgwZjRDb0J1QnhiNjREQVNZT0IvSHA1Mk5heEtBWkJjczNZU0lPWnUwYUlGSTRHbkFINktJK1dSdFlPZmZ3Qk4wQXFBamdSVHRaWUtITmJpU2E3Um9CRnpHNU9BV0N4bUpQQVB3QzhXaXg4QVA4V1g0azN4dDdhOElyelE4d3VTQUx5OXZVME9hTkFNMmRoSXdOL2ZIOFZpTWJacjE0NlJ3R09BdjEyN2RpZ1dpOUhmMzc5UmdwOXdRbWNidkwyOWhhc0E2RWd3cmQxbzBLek5VMUxTNEZHeTBpRDYrZm1oV0N6R2tKQVFSZ0lQQVg5SVNBaUt4V0t1alp3bUQ0b254WmRQQXRibUNTOUVnb0lrQUM4dkw1TjJZQnJFeGtJQ0pPT29uZFBIeHdmRllqRzJhZE9tUGhMd2JXVGc5K1dEdjAyYk5pZ1dpN25hRWVVTnhiR3hnSjl3UW5uajVlVWxYQVhnNStkbndtZzBlTmJ1YVJEcHVhbWE2K25waVdLeEdJT0NnamdTeU1yS3dva1RKeTVwVEFUd3pUZmZMUG54eHg4NThBY0ZCYUZZTEVaUFQwK1QzU09LSDEvK1c3dW41eVlsWkZVS29MR1JBSDhaNE9ibWhwNmVucmhtelJyY3ZYczNMbG15QkFjTkd2UlZZeUtBTjk5ODg2dXRXN2RpUmtZR3JsbXpCajA5UGRITnplMmg4cit4NVkxVktBQmZYMSt1SUdZczQ2emRHeGNDamF1NUNvVUN2Ynk4T1BBdlhyd1krL1hydHhRQWZCclpFc0JuNU1pUlN6ZHYzc3lSZ0plWEZ5b1VDcFBkSTM0QnNMSGtEejAzdGRNTGtnQkl6dEdCSVA1YXJyR0FudzUwZUhsNW9aZVhGNjVkdTVZRGY5KytmWmMxdHZXL2NSMGdPVGw1R1pIQTJyVnJ1UmdaNTAxakl3SENDZVdOcDZlbjhCVUFYODVacTZmQm82U2x0YitQanc4RC94T1FBQlVDcVJaQThhVDRXbnNlRVY2c1FnRTBWTkJoNEcvYzRHY2tVTCt2cjNBc1dBWGc0K1BERlRTc2VmQVkrQmtKUE0wOElyelE4d3VTQUl3TE9zWWRYZlNRMXVLSnNhbnpqOER2N2UzTndQOFVTSUE2U2ltdWxFY1VkMnZMSi81WkVvVkNJVXdDZUZoVEJ3TS9NMFlDRFh0Kzg1Z2dDY0REdzROckJ6YmUxNlZCRTdxbkpLUjlmZ2IrNTBzQ2xFOThNaEM2cDN3aTNIaDRlQWhYQWRDZzBaWU9Bejh6UmdLUDlyUUY2TzN0TFh3RlFKMWR0QXlnd1JLcXA2UWptVVpyTmJiUC8zejdCQ2p1bEZkOE1oQ3FwN3dpM0FoS0FSamZDbXlzQVBoVlhHc0YvN3AxNnpBakl3T1hMRm1DL2ZyMVkrQi9DaVF3Y3VUSVpWdTJiTUhNekV4Y3QyNWRveUFCWTBVcEZvdUZlUzI0dTd1N1ZTa0FTaTZTWjdSR1krQTNMd25RT05BeVUrZ2t3RmNBN3U3dXdpUUFzVmhzd3RUR2d5TTBUK1RGQjcrbnB5Y0R2eGxKZ0pyTitDVEFWd1JDODhiSzBtb1VBSitoR2ZpWk1SSjQwRk9lV1lVQ01CNGM0MEVSaXFka29qVVpEUXFkNm1QZ3R3d1NvS1l6R2grcU9mSEpRQ2plZUpJUnJBSndjM1BqRGdRWkR3b0RQek5HQWcxN3lqZkNqWnViRzFNQURQek1HaE1KV0kwQ01HNEhKakJSbGROU1BhM0JxQkREQi8vYXRXc1orQzJRQktoUGdFOENOSTQwcnBhZWY4WUh5ZWdHS1VFUmdGcXR4dXpzN0FjVWdCQUc0VkhnWDdkdUhXWm1adUxTcFVzWitDMkVCRWFOR3JWczY5YXR1R2ZQbmdhVmdGQklvTDVDczFnc3h1enNiTnkxYTVld0NNRFYxZFdrR1lnL0NKYm1pWGtwK0xRR1krQVhOZ25RT05LNDBqaGJhaDRTVHFnSnlOWFZWWmdFWUt3QWpOZGtEUHpNR0FrOFBBOEpMMWFsQVBqQnR4UlBqTXZBYjUwa1FHZFMrQ1JBNDI1cCtVaWZ6eW9VQUorQkxTM29mUEJUd2RMRHc0T0Izd3BKZ01iWFVrbUFQby94Sk1RVWdCbG1mazlQVHdaK0t5SUJUMC9QQnBjRGxrWUNnbGNBR28wR2MzSnlVQ3dXUDVKNXplMXByVVdmVDZGUW9MT3pNNjVac3diMzdObUR5NVl0WStBWE1BbHMyN1lOczdLeWNNMmFOZWpzN015UkFJMDNmNWZBM0w0K0pTb1dpekVuSndkMzc5NHRMQUp3Y1hFeE9SQms2Y0ZXS0JSb1oyZUhTNVlzd1QxNzl1Q0tGU3Z3cFpkZVNnZjJHbStoa29EZjJMRmowM2JzMklIWjJkbTRaTWtTdExPemU0QUVMSFZTb29OQUxpNHV3aVFBUzFZQWZObFAxZFlwVTZaZ2RuWTJybDY5R3BPVGt6TUJJSUJCU2RBa0VQRHV1KzltN042OUc3T3pzM0hLbENrbXUxTU5MUWVZQW5pS0NxQ2hZSnZMRThQeXdSOFRFNFBaMmRtNGRldFdmTys5OTQ3YjJOaTBaUkFTdnRuWjJiVmR0R2pSOFQxNzltQk9UZzdHeE1TWUtGUEtBOG9MYytjblB5OEZyUURvU0RBVkFpMHR5SlFFN3U3dXVHVEpFc3pNek1TdnZ2cnFqa0toNk5jSVprZEZjbkx5WUFCUVdQdXp0bWpSb3QvMjdkdnZaR2RuNDdmZmZzc2RWT09UZ0tWTVRvUVhkM2QzWVNtQUNSTW1yTlpxdGFoVUtodFVBUFNRNXZMME9ZeUQzTGR2WDh6SnljRzFhOWRpLy83OVZ3S0FoN1d2ajVjdVhicnkxMTkveGZmZmYzK2x0ZGM1QU1CajRzU0pxVmxaV1ppVGs0TUpDUWtQVEU2V2xwL0dDa0NwVkdKR1JnWW1KaVkrVlFLUVBrczJ1SDc5T3JpNHVNREZpeGRCb1ZEQStmUG53Y3ZMQzg2ZE93ZmUzdDVtOFY1ZVhuRCsvSGxRS0JSUVdWa0pycTZ1Y09YS0ZSZzJiQmpVMXRiQ0gzLzhjVkduMDYxQXhBdGdwU1lTaWZ3WEwxNDhNeUVoSWFXaW9nSVNFaExldkgvL3ZrZ2tFdmtqNGxscmZHWkV2T0RnNEJEUm8wZVBsNXMyYmVyMnlpdXZnRjZ2QnpjM042aXNyQVJQVDArTHlrOFBEdys0Y09FQ3VMaTR3TldyVjU5WlhNVFBNdWhPVGs1dzllcFZjSGQzaHdzWExuQkJObGR3dmIyOTRmejU4K0RwNlFtVmxaWGc3dTRPVjY1Y2djNmRPNE9ycXl2Y3VuVUxpb3VMTi8vODg4OHgxZzcreE1URWxETm56a0JOVFEzVTF0WkNVbEpTeXBRcFUyYUtSQ0ovYTMzMm5Kd2NWNjFXdXgwQXdNUERBK0xpNHVEeTVjdmc3dTV1UWdLV2tKOFhMbHdBZDNkM3VIcjFLamc1T1FtVEFFZ0JYTHAwaVp0eGlXSE41UW44Q29VQ0xsMjZCTTdPemhBUkVRR0lDTmV1WGJ0NzZOQ2gzWUdCZ1dzYUEvalBuVHNIYytiTWdRc1hMalFLRW5qaGhSZDBlWGw1MndIZ0hpSkNlSGc0T0RzN20rU25wNmVuV2ZQVHk4dkxKRDlkWEZ6Zyt2WHJ3aU1Ba1VqRUtRQTNOemNUQlVBeXh4eStzcktTazFldXJxNXc3ZG8xaUkyTmhacWFHdmpQZi82ei84YU5HMzlZSy9pWExGa3lNeWtwS2VYczJiTncvdng1bUQ5L1BodytmQmptejU4UEZ5OWVoUHYzNzBQZnZuMVQzbnZ2UGFzbGdVdVhMdjMrMy8vKzk0QllMSWJZMkZpNGR1MGF1THE2d29VTEY4RER3NE9icE15WnA2UUEzTnpjT0FVZ0VvbEFKQklKVXdGY3ZuelpJb043NWNvVmFOdTJMY2psY3JoejV3NGNQWHEwdUxhMnR0UmF3Vzg4ODMvMjJXZHc5dXhaY0hCd2dMTm56OEpubjMxbW9nU3NsUVNxcTZzM0dReUdFb2xFQWk0dUx0QzZkV3U0Y3VXS1JVNVNseTlmRnE0Q01LNEJ1TG01bVJRQ0tjam04TWJCZFhaMkJtOXZiMEJFcUtxcWduUG56aDJRU0NRdHJCMzhDeFlzZ0lxS0NuQnljb0pidDI2Qms1TVRWRlJVd0lJRkM2eWVCR3hzYkxxZlBuMzZvRXdtQXdBQWIyOXZjSFoyaHN1WEw1c3NBOHlacHdxRkFpNWV2R2lpQUFSYkE2RGdHaGNDS2NqbThCNGVIbkR4NGtWTy9vZUVoQUFpd3AwN2QyNmVQWHYyVEdNQS8rblRwOEhaMlJsdTNMZ0JMaTR1Y09QR0RYQjJkb2JUcDA4M0NoSTRmUGp3ZnhEeEx3Q0FrSkNRZXBjQjVzeFRLZ0RTSkNVNEJVQnJGVWRIUnk2NC9FS0xPYnd4czE2NWNnV2NuSnpBMWRVVkVCSCsvUFBQOHdCUWJZM2dQM3YyTEp3N2R3NCsvL3h6cUtpbzRKS0tTTkRWMVpVajY0cUtDdmo4ODg4NUVyRFNta0RWblR0M3pvdkZZbkJ4Y1FFbkp5ZHVHVUJLMWR4NWV1blNKVzU4SEIwZG4xa2dwTTh3QWJtWjVjcVZLeGFsQUl6M1Y1MmNuR2dKY0JNQWFxd1ovRFR6RStncDZTOWZ2c3o5bTVUQTU1OS9Eak5uemdTRlFnRjkrL1pOK2JzSVpTMTlBalhWMWRVM2JHMXRPZktqV3BWQ29iQ0lQSFYzZCtkMnFhNWR1OFlWQVo5MklmQ1pOZ0xKNWZKNkZZQzV2TEg4SndWZ2EydEx4YUcvQUtET0dzRlBzdC9KeWNrRS9DUXpLZG1NNDBMTEFTS0JwS1NrRlByOVZrQUNkZmZ1M2JzakVvbEFKcE54dFNwWFYxZTRlUEVpdHd3d1o1N1NMdFdWSzFkQUxwY0xUd0VBQU55OGViTmVlWFhod2dXemVYZDNkN2g0OFNMSHJCS0poSUNEMWc1K2t2M1VuR1VNZnZwM1l5RUJpVVFpRW9sRUlCYUx1ZVhQbFN0WHVFbkMzSGxLeW96R1RUQTFBR09wSXBmTHVhU2pyVUJ6QnRYRHc4TmtiZVhrNUFSMzd0d0JzVmdNOXZiMjlzKzZLUG84d0orVWxKVHkzLy8rRjg2ZlAvL0U0S2ZPTTVMRnhpUmczQ2N3ZGVwVW9kY0VKSCtQTjl5NWM4ZEVHVjI2ZE1raThwVEkrUHIxNnlDWHk1OVpIOEJ6VndBVVhITjRLZ0FhcjYxdTNib0ZZckVZNUhLNUN3REloQTUrbXZrLysreXplc0ZQejI4TWZtUFByd2tRQ1h6MjJXY3dhOVlzcmlZZ2NDVWdsY3ZsenRYVjFYRHIxaTBUQlVBSzBSTHlWSkFLZ0Y4RE1DNndHQWZYSE41WTVwSUNPSHYyTEloRUluQjBkUFFDQUR0ckFQLzgrZk5Od0U4RlQwcXFoc0JQOGFIOVoycENJUktZUDMrK3llNkFVSldBV0N4dTByeDVjMDlFaFAvKzk3OG1Dc0NTOHBUaUwvZ2FBTWxLa2xmbURDN05nQVNLOCtmUGcwZ2tnaVpObWpRUERnNE9zZ2J3VTVNUGdmL2F0V3NQZ1A5aHlXZXNCSXgzU3lvcUttRCsvUG53MFVjZkNWb0pkT3ZXTFZna0VqV3BxNnVEYytmT2NYRWlCV0FKZVdxc3dBVFpCMkJjQXpBT3JxVW9BRXJxNzcvL0hrUWlFZGpiMjRPZm4xL0hlL2Z1RlF0MXpmKy9ncDlxSk1aSzROcTFheVpLZ0VpQWFnTDkrdlZMZWYvOTl3V2pCRzdmdnIwaE9EaTQ0NzE3OTBBa0VrRjVlYm5KSkVXMUtuUG42WlVyVjB3VXdMT3FBVHh0YzVrNGNlSnF2VjZQS3BVS1JTSVJkeWtJM1d4Q2x4eVl5OU1kYTNSbHVaT1RFMjdhdEFuejgvTnh3WUlGKzBBQUYyTUFnTitTSlV0U2YvMzFWOVRwZExoKy9Yb01DZ295aVRlOW1KV2VsKzZYZjl3NDBmZlR6OVB2YzNGeFFaRkloRUZCUWJoKy9YcFVxOVZZVUZDQTc3Ly9mcXBBWXVldjBXZ09GQlVWNFpvMWE5REp5Y2trSCtoNXpaMm5oQmVLdDBxbHd1enNiRXhLU3JMc0c0R01DY0RSMGRFa3VFK2FoTThqdUhRUnFFcWx3aDA3ZHR4VEtCVGRHanY0clprRVdyWnMyZVBubjMrdTBXZzArSzkvL2Nza0R5eGxrcUs0RTI0Y0hSMkZSUUNGaFlVV3F3QW91TWJKSEJJU2dpcVZDbk56YzNIczJMRXJwMDZkMnRxU3dYL3k1TWxuRG41ckpBRUE4UGo4ODg5WEh6eDRFRlVxRmJadTNmcUJ1Rm5pSkNVNEJWQllXSWhxdGRwaUZVQjl5NEJseTVhaFdxM0diZHUyWFhWMGRJeXlaUEFYRkJUZ2hnMGJuam40bjRRRU5tellnQnFOQnZWNnZjV1NnSmVYVit5SkV5ZXVGeFFVNExmZmZtdXg4cjgrQmFCV3F6RW5Kd2Y3OXUwckhBSVFpVVRvN094Y0w4T2EyeHNuc1Znc3h2NzkrNk5hclVhVlNvV1RKazFhQndDZVFnQS94WmVTaFdZT1BnbjhyNTUrSC8xKytudk96czZDSUFFQThGcTJiTm1XUTRjT29WcXR4bjc5K3BtTXY2WG1KOFZYa0FRZ2w4dE5ndnkway9KL1RXWktZcHJKRmkxYVJJR3VhdE9temNzTS9OWkRBdkh4OGNOT25UcDFUNmZUNFZkZmZmVll5c25jK1VtZlR5NlhDNGNBVWxKU1ZoY1ZGYUZHbzdGb0JjQlBZaWNuSnd3S0NrS1ZTb1ZhclJZM2JkcjBIN2xjSG00SjREOTE2aFRxOVhxemd2OUpTVUNyMVdKaFlTRk9temJON0NUZzRlRVI5Y01QUDFUczI3Y1A4L1B6c1VXTEZnL0lmM29lUzFVQTlLNE5TeWNBNTRrVEozSUVZS2tLb0NFU2NIUjB4TkdqUjZOR28wR2RUb2VmZi82NVJpd1d0N1FrOEZOU21BUDhqME1DWXJIWW9raEFKcE8xenNuSktUeHk1QWhxTkJwTVRrNjJlUER6RllDVGt4TnFOQm9xQXFZQmdMUEZFc0Q0OGVOWEVnSFkyTmcwV0dpeEZNK3ZCVGc1T2VIWFgzL055ZGlQUC81NEJ3QUVQbWZ3dDFpNmRHbWFNZmdEQXdPNXoxZmYydFdTNGljV2l6RXdNTkNFQktaUG41NEdBQzJlWnh3bEVrbkxUWnMyWmZ6NDQ0OUU2RnhoMmxMaTE1QTNWcVoyZG5ZY0FTUW1KbjVueVFUZ05HN2N1RVVHZ3dHMVdpM0hhUHl0UUVzSk1uOEdvOC9wN2UyTjZlbnBxTlZxc2Fpb0NELy8vUE1zR3h1YjRPZVV0SzNXckZtejdlVEprMWhZV0lnYk4yNThKUGpORlZmNnV3OGpnWTBiTjZKT3AwT0R3WUJ6NXN6WkpoYUxXejJQT05yYjI0ZnMyclVyNzhTSkUxaFFVSURwNmVrbWI5dDltSUt5bEx5a3o2bFFLRkNyMVdKV1ZoWW1KQ1FzQWdBbmkwUy9yNit2NDZ1dnZqcS91TGdZdFZvdHVybTVQWkMwbHFvQStETFcxOWNYVjY5ZWpWcXRGZzBHQTI3WXNHRy9uNTlmdDZ0WHIzNzZMQkwycjcvK1d0K2lSWXRPR28ybStNU0pFNmpYNjNIanhvMmM3TGMwOEQ4dUNRUUZCWm1Rd09yVnEwdTh2YjA3Mzc1OWUvMnppT052di8zMmVwczJiWHFVbHBaKy8rT1BQM0xnOS9IeHFYZjVaS2tLd0RpT2JtNXVxTlZxTVNNakEzdjI3RG5mMDlQVDBTSUpvRXVYTHMySERSczJ2YVNrQkxWYUxYYm8wTUVrNkpiR3RJOGlBUjhmSDB4TlRlV1VRRkZSMGVVUkkwWk1lOXBMQWdBSUdEMTY5THYvK2M5L0xodytmQmgxT2gybXA2ZWpuNStmUllQL2NVbkF6OCtQVTFRR2d3RUxDd3N2RGhvMGFESTg1VmV2QTBEUXYvNzFyNWxuenB5NTl2MzMzNk5PcDhNVksxYWd0N2Uzb01CUDhhVFBHeG9haWxxdEZuZnUzSWxkdW5TWkhoTVQwOXhTQ2FCcDM3NTl4KzNkdXhlMVdpMUdSMGMvc09ZU0dnbDRlSGpndEduVFVLdlZvbDZ2eC8zNzkrT3VYYnNPSkNRa2pBR0F3T3JxYXNNL1NkYmEydG9LQUFqbzI3ZnZ5TUxDd3RMZmZ2c045KzdkaXpxZERqLzU1Qk91S2NUU3dmKzRKT0RwNllrelo4N2s0bmpnd0FIY3ZuMzd2cDQ5ZTQ0R2dJQi9Hc2UvL3ZwclBRQUVEaGt5NUkzOSsvY2ZPblhxRk5JRU5IbnlaTzd6Q1EzOEZEOUhSMGVNam81R3JWYUwyN1p0dytqbzZIRWRPM1pzYXFrRVlCc2FHdHE3ckt3TWRUb2REaGt5cE42dFFFc0wrcU5JUUM2WFk4K2VQWEgzN3QyY2xEMTA2QkJxdGRwajQ4YU5tK3Z0N2QwSkFGcE1uVHExZFcxdGJVVkR5VHAxNnRUV0FOREN5OHNyOXMwMzMvems0TUdEMzU4NWN3WVBIanlJQlFVRm1KbVppUU1HRE9CMlQranZXenI0SDBVQ3huRk1URXpFakl3TTFPbDBXRnhjakg4MzVod2VOMjdjbk1lSjQ5L0U2UUVBZ1FFQkFWMm5USm15NE5peFl6K2VQbjBhOSsvZmp3VUZCVFJUUGhCSFN3Yy9QdzlwQzNESWtDR28xV3B4NDhhTkdCQVEwTHRqeDQ2MlQrMVU2ZE1rZ002ZE84c09IRGpRMm1Bd0hMcDc5Njd0amgwN1lQZnUzZHpMSitobUd1UGJhQzNOMC9sM3VqSEkwZEVSYnR5NEFRNE9EbEJUVXdOdnZ2a205T3JWQzJReUdVaWxVbWphdENuWTI5dlgzTHg1ODFScGFlbXhpb3FLVTlldVhUdFhVMU56NThhTkczODZPVGsxbDhsa2RzN096cDR0Vzdac25aQ1FFTzdvNk5qNjl1M2JOamR1M0lDN2QrOUNUVTBOR0F3R1NFMU5CWkZJQkxkdTNlTCtMbjBPK2x5V0hqLzZmQStMWTExZEhhU2twRURQbmoxQktwV0NUQ1lEZTN0N2t6aWVPWFBtdDJ2WHJwMjdkKy9lWDRoNFh5d1dTK3pzN0pxNXVMajRCQWNIdCt6Um8wZDRzMmJOQW0vZHVpVzllZk1tVkZWVndkMjdkeUUvUHg4MmJOZ0FOalkyRDQyanBjZVA4T0xnNEFCRGh3NkY0Y09IdzVrelo2cFRVbElpTzNic2VPckFnUU5QNVFacjZWTW1nTHA5Ky9aVjNiNTkrNkpVS3ZYejlmV0ZtemR2Z3FPam84bTlBSllhL0laSWdBWkRMcGZEb2tXTFlNZU9IZENyVnkvbzE2OGZPRHM3dzYxYnQyUVNpYVJ0bHk1ZDJ2YnUzUnRzYlcxQktwV0NXQ3dHUkFSRWhKcWFHcWlxcW9LYk4yL0NsU3RYb0s2dURtN2N1QUVhalFhMFdpMzg4Y2NmNE9EZ1lFS1dRZ1AvbzBqQU9JN2ZmUE1ON05peEF4SVNFaUF4TVpIZVVzVEZzVmV2WHZYRzhkNjllMUJWVlFWWHJseUJ5c3BLUUVTNGZQa3k1T2ZuUTFGUkVWUldWb0pjTHVjdW82a3Zqa0xKUDdsY0RqZHUzQUJmWDErb3E2dURQLy84OHlJaVZzZkV4TlFkT0hEQThtNEVxcTJ0clFPQXFrdVhMbFg0K1BqNCtmajRnSU9Ed3dNM0ExbHk4QitIQk02ZlB3OVpXVm13Y2VOR2lJbUpnVFp0MmtCa1pDUzBhdFVLN093YXZsV3N1cm9hVHAwNkJZY1BINGFUSjAvQ3dZTUhvWG56NXZEbm4zOCtNbW1GQXY0bklZRS8vdmdEZHUvZURXdlhybjJpT042NWN3ZCsrZVVYT0hMa0NKdzhlUklPSHo0TWNya2NidDI2SlhqdzE2Y0FmSHg4b0s2dURpNWZ2bHdCQUZWMWRYVVdmWDI5eTF0dnZiV3lzTEFRdFZvdDJ0blpOZGg1WmFscnNJWnFBdncxTFQyWG82TWppa1FpbE12bDZPbnBpWjA3ZDhhNHVEZ2NNR0FBeHNYRllaY3VYZERIeHdlZG5KeTQ3elArZWY1YW43OVdGVXE4SGxVVGVKSTRlbmg0WUtkT25UQXVMZzU3OSs2TmNYRnhHQjhmajI1dWJpaVh5MUVrRW5FRjVzZU5vMURpVlY4VFVGWldGZzRZTUNEVmt0dUFhUm5RckgvLy9tOFhGeGRqUVVFQnhzYkdtZ3lPVUFhRFR3SlBrc1FQODQrYnJFS0xFNHZqMHk4QWlzVmlqSTJOeFlLQ0F0eTJiUnQyN05qeDdlam82R1lXVFFEeDhmRTJDb1VpdHFTa3BMYWdvQUNUazVNZk9CTWd0Qm1OUDVNOUtva2Y1ZW43K2RWOW9jLzQ1b3BqUTZBWGFwNFpud0pNVGs1R25VNkhxMWV2cm5WMmRvNk5pb3F5c1dnQ21ESmxpZ1FBQXJLenMwL3E5WHBjdkhneGlrUWlqckdGT3JQUjREd3FpZm5KekUvU1J5V3J0WUtmeGZISkZBQXRGeGN2WG94cXRSby8vL3p6a3dBUU1ISGlSSWxGRThDa1NaTkVBT0EyZmZyMERWUUg0RE9iME5lMGowcml4L1VOL1Q1ckJUK0w0NU1wQUhkM2Q5UnF0WmlkblkzRGh3L2ZBQUJ1NDhlUHQveXJnV05qWTV2MTZkUG5EWVBCZ0hxOUhudjE2dlhBOVdCQ1QvYUdrdTZmZW1zSFBZdmpreFVBSFIwZHNWZXZYbGhRVUlDYk4yL0dpSWlJMXlNakk1dUJFS3hqeDQ0eWUzdjdkbHF0OXJwZXI4Y0ZDeGJVdXd5d2x1Um5vR2R4ZkpxMUVaTC9DeFlzUUoxT2gwdVhMcjF1WTJQVE5pSWlRaGl2cm52cnJiZEVBT0M1WU1HQ0xMb2VqSC9LeWRxcTNNd3ovelR2VmZEdzhFQzFXbzFLcFJMZmVPT05MQUR3ZlAzMTEwVWdGUFB5OG1xZW1KZzRzYWlvQ1BWNlBmYnYzOS9xbGdITU0vK3M1SC8vL3YxUnI5Zmo1czJiTVNvcWFxSkNvV2dPUXJLQkF3Zkt4R0p4Njl6YzNNckN3a0pNUzBzeldRWXdFbUNlK2ZxYmYwUWlFYWFscGFGV3E4V3Z2LzY2VWlRU3RVNUtTaExXbTZzblRKZ2dBZ0RYZDk1NUo3V3dzQkNMaW9vd0ppYUdMUU9ZWi80UjhqOG1KZ1lMQ3dzeEl5TURCdzhlbkFvQXJtUEdqQkdCMEN3Nk90ck96OCt2dTFhcnJTb3NMTVI1OCtZSnZpbUllZWFmZGZQUHZIbnpzS0NnQUZldVhGbmw3dTdlUFN3c1RIQ3ZyUWNBZ0lrVEo0b0J3R3YrL1BsWmVyMGVpNHFLME4vZm45VUNtR2UrZ2JXL3Y3OC9GaFVWWVhaMk5oWC92TWFNR1NNR29WcFVWRlRUc0xDd2dRVUZCYlZGUlVVNGYvNzh4N3JYbm5ubUd4UDRhNnV5UWdBQUNtdEpSRUZVNmZLUCtmUG5vMTZ2eDlXclY5Y0dCZ1lPREFzTGF3cEN0bjc5K2trQXdHZmh3b1dxd3NKQ05CZ00zRjJCUXJucGhubm1uOGZOU1IwNmRFQ0R3WUE1T1RuNDVwdHZxZ0RBSnlFaFFRSkN0OGpJeUtadDI3YnRyOUZvN2hVVkZlR1hYMzc1UUMyQUZRU1piOHlGUDdsY2psOSsrU1hxOVhwTVMwdTc1Ky92M3o4ME5MUXBXSU85L3ZycllnRHdtalZyMWs2OVhvOEdnd0hqNCtNRmMyRW84OHcvNjRzLzQrUGowV0F3WUdabUpvNFpNMlluQUhpTkdqVktETlppRVJFUlRUdzhQT0tWU3VWMWVsQjdlM3ZXRjhCOG85LzN0N2UzeDh6TVROVHBkTGg0OGVMcnpzN084ZTNidDI4QzFtUmp4NDRWQTREcnFGR2o1aFlVRktEQllNQVpNMmF3Z2lEempiN3dOMlBHREN3cUtzSXRXN1pnUWtMQ1hBQndIVEZpaEJpc3pmN3VaZ3BNVFUwdEx5d3N4T0xpWXV6U3BRc3JDRExmYUF0L1hicDBRWVBCZ0VxbEVtZk1tRkVPQUlFOWUvYVVnYldhaDRkSHM2Q2dvTDVLcGZLMndXREFqSXdNN3MwdGpBU1liMHpnOS9iMnhveU1EQ3dvS01EbHk1ZmY5dmIyN3V2bTV0WU1yTm4rWGdxNGpSZ3hZZzY5SEdMeDRzV0Nld2tHODh6L3J5OUxXYng0TVJvTUJ0eTBhUk1tSkNUTUFRQzNWMTU1UlF6V2JvbUppVElBOEo4N2Q2NnFvS0FBaTR1TGNjS0VDUTF1RFRJU1lONmF3QytYeTNIQ2hBbFlYRnlNR1JrWm1KS1NvZ0lBL3g0OWVzaWdzVmhZV0ZnVEp5ZW44UFhyMTU4cUxDekVrcElTSERCZ2dHRGVoY2M4OC8vMFhZa0RCZ3pBNHVKaXpNdkx3MDgvL2ZTVWc0TkRlTHQyN1pwQVk3SXhZOGFJUER3OEhBSUNBdnBsWkdSYy8vdXRzZGk1YzJkR0FzeGJMZmc3ZCs2TWVyMGVOUm9OTGxxMDZMcVhsMWMvTnpjM2grSERoNHVnc2RscnI3MG05dkR3Y0k2TmpSMmJtNXRiVlZ4Y2pEcWREcU9qb3hrSk1HOTE0S2UzL09yMWVreE5UYTFxMzc3OU9EYzNOK2RHc2U1L1NEMUFBZ0R1TDczMDB2VGMzTnlhNHVKaTFHZzBHQkVSd1VpQWVhc0JmMFJFQkdvMEd1Nmd6d3N2dkRBREFOeDc5T2doZ2NadWlZbUpVZ0R3SEQ1OCtDZDVlWG4zaTR1TFVhdlZZbHhjSENNQjVnVVAvcmk0T05ScXRWaFlXSWhyMXF5NTM2ZFBuMDhBd0xOSGp4NVNZUFovMXFkUEh4a0FlSTBZTVdLdVVxbThUNjhXNjkyNzl3Tm5CdmdkZzR3TW1MZUVXNHo1THpOeGRIVEUzcjE3WTBGQkFlcjFlbHl6WnMzOXBLU2t1UURnMWFncS9rOUtBb01IRDU2Wm5aMTlyN2k0R0V0TFMzSDQ4T0dNQkpnWEhQaUhEeCtPcGFXbFdGQlFnT25wNmZkNjllbzFrNEgvOFVoQTBhTkhqMG03ZCsrK2JUQVlzTFMwRkdmTm1vVUtoY0xrM1hEVzhoWmQ1cTNqcmNlVWx3cUZBbWZObW9XbHBhV28wV2h3K2ZMbHQyTmpZLy8xZDE0ejhEOEdDVWdCd0xWTm16YkRObTdjZUZHdjEyTnBhU211VzdjT1EwSkM2bjFCWkdON3h4N3psdkZPUS80TFRVTkNRbkRkdW5WWVVsS0NPVGs1dUhEaHdvc0JBUUhEQU1DVnJmbWZ3RjU5OVZXeHU3dTdvNGVIUjVldnZ2cXFYSzFXWTBsSkNlcDBPaHd6Wm96SkZlTU52U1dXa1FEenozTEdOeTcwaVVRaUhETm1ET3AwT2pRWURMaGp4dzc4NElNUHlsMWRYYnU0dWJrNU51cXR2ditSQkpyS1pMTFdFeWRPWEx0bno1NWFXaEo4OTkxMzZPdnIrMEJ0Z0NrQzVwL0hqRys4MXZmMTljWHZ2dnNPUzB0TFVhdlY0dXJWcTJ0SGpCaXhWaXFWdG5aemMydkt3UDgvMk9qUm8wVjkrdlN4QlFDdjZPam8xOWVzV1hOZW85RmdhV2twRmhVVjRSdHZ2TUVOenFQZUc4L0lnUGwvQW5yK2pFOTU1dWJtaG0rODhRWVdGUlZoY1hFeFptWm00c0tGQzgrSGhvYSsvbmV4ejdaUmR2ZzlxN3FBdTd1N282T2pZK1JiYjcyMVBUTXo4MzVSVVJIdTNic1hjM0p5Y09USWtTaVZTaDlZRmp3dUdUQlNZQzhpZlJqb2plVytWQ3JGa1NOSFlrNU9EdTdkdXhjMUdnMnVXYlBtL3VqUm83YzdPRGhFdXJtNU9mYnMyWk90OTUrMmpSbzFTaFFhR21vSEFGNmhvYUhKMzN6enpROUtwUktMaTRzNUluajU1WmROcmx0NkhESjRGQ2t3YjUyZVAvNFBBejM5LzVkZmZwa0R2bDZ2eHkxYnR1RHMyYk9QaDRTRWpBUUE3L2J0Mjl1OThzb3JiTlovbHBhUWtDRHg4UEJ3QUlDZ1BuMzZ6RXBOVGYwakx5K1BJNEs4dkR4OCsrMjMwZFhWbGFzUjhKY0hmREpvaUJTWXQwN1BIM2QrWGxDK09EbzZvcXVySzc3OTl0dVlsNWVIZS9mdXhjTENRdHkrZlR0KytlV1hmN3p3d2d1ekFDREkzZDNkb1dmUG5xeXQ5M24zREhoNGVEaloyZG0xN2QrLy8veVZLMWVleThuSlFZUEJnSHYzN3NWOSsvYmhOOTk4Z3dNSERrUjdlM3VPRElqUkd5S0Zoc2lCZVdIN2hzYVo4b0R5d3RIUkVlM3Q3WEhnd0lINHpUZmY0TDU5KzdDMHRCUjFPaDF1M2JvVkZ5NWNlSzVQbno3emJXMXQyM3A0ZURqMTd0MmI3ZTJiczBpWWxKUmtBd0RPTXBrc3VGdTNiaDhzWExqd2gxMjdkcUZPcDhQUzBsSk9ybjN4eFJjNGJOZ3dkSE56NHk0Zm9VRi9YRkpnWHRpZUQzYnljcmtjM2R6Y2NOaXdZZmpGRjErZ1hxL0h2WHYzY3VmMjE2OWZqM1BtekRuZXFWT25EMlF5V1RBQU9QZnAwOGRtNU1pUmdwYjdJbXNpZ2l0WHJraVBIajNhOU1LRkMwNGhJU0ZSblR0M0hoWWJHOXZIMWRYVjBjSEJBV3hzYkVBcy9yOGRtWFBuenNFdnYvd0N2Lzc2SzF5OWVoVk9uRGdCdDIvZmhtdlhyb0ZjTG9kYnQyNkJnNE1EM0xwMUMrUnlPZHk4ZVpONWdYb2FSd2NIQjdoNTh5WTRPenREczJiTklDUWtCRnhjWEtCTm16WVFIQndNM3Q3ZUFBQlFXMXNMZCsvZWhhdFhyOExWcTFkdmxKZVhhOHZMeTNmOThzc3Zoenc4UEs2SGg0Zi81ZXJxV3J0bHl4WVVPbTZzc2xpUmxKUWt2WGp4b3UyUkkwZWEyZGpZdUVaRVJIU1Bpb3JxMDc1OSszaFhWMWYzNXMyYmc1MmRIVWlsVWhDTHhSd3AxTmJXUW1WbEpWeTRjQUgrK3VzdnVISGpCbFJYVjhQdDI3ZkJ4c1lHN3QyN3g3ekFmTE5temNEVzFoWWNIUjJoYWRPbW9GQW93TlBURTZUUy95dlMxOVhWd2YzNzkrSGV2WHZ3MTE5L3djMmJOK0hxMWF1WGZ2cnBwN0lmZnZoQmUvVG8wZUo3OSs1ZGpZaUkrTlBkM2IxYW85SFVXaE5XckxwYU9YYnNXTkhSbzBlbEZ5OWV0S3Vzckd3S0FBNXQyN2J0NE9ucEdSY1ZGUlhwNStmWHJubno1aDUyZG5aZ2IyOFB0cmEySUpWS1FTS1JnRmdzQnBGSUJDS1JpQ01JWnNLeXVybzZRRVR1aThCZVUxTURkKzdjZ2J0MzcwSjFkVFhjdW5YcjR0bXpaMzg2ZHV6WTRjckt5djBuVHB3NERnQzNGQXJGWHdxRm9pb3NMS3gydzRZTmFJMHhhalRiRmErLy9ycm8wcVZMa2dzWEx0aWNQMy9lOXZ6NTgwMEF3TjdSMGRIWjM5Ky9wVnd1RDVUTDVmN0J3Y0dCenM3T2lpWk5talMzc2JGcGFtTmowMVFpa2RneU9BblRhbXRycSsvZHUvZFhkWFgxWDNmdTNQbnoyclZyRjA2ZE9uWDY1czJiWjIvZXZIbjY3Tm16LzdseDQ4WTFBTGpqNWVWMTE4dkxxMXFoVU54emQzZS92M2J0V3JUMitEVGEvY3FKRXllS0xseTRJSzZzckpTSVJDTHB1WFBucE9mT25aTUJnQzBBeUFCQUNnQ1N2NzlFalRsV0FqYjgrK3YrMzErMUFGQURBTlhlM3Q0MVBqNCt0WFYxZGJXZW5wNzNQVDA5NjlMUzByQ3hCWWdsTmM5U1VsSkVZckZZSkJLSlJQdjM3eGVKUkNKQVJCWXI0UklBQUFERXhjVWhJbUpkWFIwMlJxQXpZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpDelovai9lenYwRVZzRTBqd0FBQUFCSlJVNUVya0pnZ2c9PSc7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRvb2x0aXA7XG4iLCJ2YXIgdG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcblxudmFyIGN0dHZfZ2Vub21lX2Jyb3dzZXIgPSBmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vIERpc3BsYXkgZWxlbWVudHMgb3B0aW9ucyB0aGF0IGNhbiBiZSBvdmVycmlkZGVuIGJ5IHNldHRlcnNcbiAgICAvLyAoc28gdGhleSBhcmUgZXhwb3NlZCBpbiB0aGUgQVBJKVxuICAgIHZhciBzaG93X29wdGlvbnMgPSB0cnVlO1xuICAgIHZhciBzaG93X3RpdGxlICAgPSBmYWxzZTtcbiAgICB2YXIgc2hvd19saW5rcyAgID0gdHJ1ZTtcbiAgICB2YXIgdGl0bGUgICA9IFwiXCI7XG4gICAgdmFyIGNociA9IDA7XG4gICAgXG4gICAgdmFyIHBhdGggPSB0bnQudXRpbHMuc2NyaXB0X3BhdGgoXCJjdHR2LXRhcmdldC5qc1wiKTtcblxuICAgIC8vIGRpdl9pZHMgdG8gZGlzcGxheSBkaWZmZXJlbnQgZWxlbWVudHNcbiAgICAvLyBUaGV5IGhhdmUgdG8gYmUgc2V0IGR5bmFtaWNhbGx5IGJlY2F1c2UgdGhlIElEcyBjb250YWluIHRoZSBkaXZfaWQgb2YgdGhlIG1haW4gZWxlbWVudCBjb250YWluaW5nIHRoZSBwbHVnLWluXG4gICAgdmFyIGRpdl9pZDtcblxuICAgIHZhciBmZ0NvbG9yID0gXCIjNTg2NDcxXCI7XG4gICAgdmFyIGJnQ29sb3IgPSBcIiNjNmRjZWNcIlxuXG4gICAgdmFyIGdCcm93c2VyO1xuXG4gICAgdmFyIGdCcm93c2VyVGhlbWUgPSBmdW5jdGlvbihnQiwgZGl2KSB7XG5cdC8vIFNldCB0aGUgZGlmZmVyZW50ICNpZHMgZm9yIHRoZSBodG1sIGVsZW1lbnRzIChuZWVkcyB0byBiZSBsaXZlbHkgYmVjYXVzZSB0aGV5IGRlcGVuZCBvbiB0aGUgZGl2X2lkKVxuXHRzZXRfZGl2X2lkKGRpdik7XG5cblx0Z0Jyb3dzZXIgPSBnQjtcblxuXHQvLyBXZSBzZXQgdGhlIG9yaWdpbmFsIGRhdGEgc28gd2UgY2FuIGFsd2F5cyBjb21lIGJhY2tcblx0Ly8gVGhlIHZhbHVlcyBhcmUgc2V0IHdoZW4gdGhlIGNvcmUgcGx1Zy1pbiBpcyBhYm91dCB0byBzdGFydFxuXHR2YXIgb3JpZyA9IHt9O1xuXG5cdC8vIFRoZSBPcHRpb25zIHBhbmVcblx0dmFyIG9wdHNfcGFuZSA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X29wdGlvbnNfcGFuZVwiKVxuXHQgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbigpIHtcblx0XHRpZiAoc2hvd19vcHRpb25zKSB7XG5cdFx0ICAgIHJldHVybiBcImJsb2NrXCJcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJub25lXCJcblx0XHR9XG5cdCAgICB9KTtcblxuXHRvcHRzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAudGV4dChcIkh1bWFuIENociBcIiArIGNocik7XG5cdFxuXHR2YXIgbGVmdF9idXR0b24gPSBvcHRzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJpXCIpXG5cdCAgICAuYXR0cihcInRpdGxlXCIsIFwiZ28gbGVmdFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1hcnJvdy1jaXJjbGUtbGVmdCBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZ0Jyb3dzZXJUaGVtZS5sZWZ0KTtcblxuXHR2YXIgem9vbUluX2J1dHRvbiA9IG9wdHNfcGFuZVxuXHQgICAgLmFwcGVuZChcImlcIilcblx0ICAgIC5hdHRyKFwidGl0bGVcIiwgXCJ6b29tIGluXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLXNlYXJjaC1wbHVzIGZhLTJ4XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBnQnJvd3NlclRoZW1lLnpvb21Jbik7XG5cblx0dmFyIHpvb21PdXRfYnV0dG9uID0gb3B0c19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcInpvb20gb3V0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLXNlYXJjaC1taW51cyBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZ0Jyb3dzZXJUaGVtZS56b29tT3V0KTtcblxuXHR2YXIgcmlnaHRfYnV0dG9uID0gb3B0c19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcImdvIHJpZ2h0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLWFycm93LWNpcmNsZS1yaWdodCBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZ0Jyb3dzZXJUaGVtZS5yaWdodCk7XG5cdFxuXHR2YXIgb3JpZ0xhYmVsID0gb3B0c19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcInJlbG9hZCBsb2NhdGlvblwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1yZWZyZXNoIGZhLWx0XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0Z0Jyb3dzZXIuc3RhcnQob3JpZylcblx0ICAgIH0pO1xuXG5cdHZhciBicm93c2VyX3RpdGxlID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJoMVwiKVxuXHQgICAgLnRleHQodGl0bGUpXG5cdCAgICAuc3R5bGUoXCJjb2xvclwiLCBnQnJvd3NlclRoZW1lLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oKXtcblx0XHRpZiAoc2hvd190aXRsZSkge1xuXHRcdCAgICByZXR1cm4gXCJhdXRvXCJcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJub25lXCJcblx0XHR9XG5cdCAgICB9KTtcblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLyBIZXJlIHdlIGhhdmUgdG8gaW5jbHVkZSB0aGUgYnJvd3NlciAvL1xuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cdC8vIFRoZSBCcm93c2VyIGRpdlxuXHQvLyBXZSBzZXQgdXAgdGhlIG9yaWdpbjpcblx0aWYgKGdCcm93c2VyLmdlbmUoKSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBvcmlnID0ge1xuXHRcdHNwZWNpZXMgOiBnQnJvd3Nlci5zcGVjaWVzKCksXG5cdFx0Z2VuZSAgICA6IGdCcm93c2VyLmdlbmUoKVxuXHQgICAgfTtcblx0fSBlbHNlIHtcblx0ICAgIG9yaWcgPSB7XG5cdFx0c3BlY2llcyA6IGdCcm93c2VyLnNwZWNpZXMoKSxcblx0XHRjaHIgICAgIDogZ0Jyb3dzZXIuY2hyKCksXG5cdFx0ZnJvbSAgICA6IGdCcm93c2VyLmZyb20oKSxcblx0XHR0byAgICAgIDogZ0Jyb3dzZXIudG8oKVxuXHQgICAgfVxuXHR9XG5cblx0dmFyIGdlbmVfdHJhY2sgPSB0bnQuYm9hcmQudHJhY2soKVxuXHQgICAgLmhlaWdodCgyMDApXG5cdCAgICAuYmFja2dyb3VuZF9jb2xvcihnQnJvd3NlclRoZW1lLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC5kaXNwbGF5KHRudC5ib2FyZC50cmFjay5mZWF0dXJlLmdlbmUoKVxuXHRcdCAgICAgLmZvcmVncm91bmRfY29sb3IoZ0Jyb3dzZXJUaGVtZS5mb3JlZ3JvdW5kX2NvbG9yKCkpXG5cdFx0ICAgIClcblx0ICAgIC5kYXRhKHRudC5ib2FyZC50cmFjay5kYXRhLmdlbmUoKSk7XG5cblx0Ly8gVG9vbHRpcCBvbiBnZW5lc1xuXHR2YXIgZ2VuZV90b29sdGlwID0gZnVuY3Rpb24gKGdlbmUpIHtcblx0ICAgIHZhciBvYmogPSB7fTtcblx0ICAgIG9iai5oZWFkZXIgPSBnZW5lLmV4dGVybmFsX25hbWUgKyBcIiAoXCIgKyBnZW5lLmlkICsgXCIpXCI7XG5cdCAgICBvYmoucm93cyA9IFtdO1xuXHQgICAgb2JqLnJvd3MucHVzaCgge1xuXHRcdFwibGFiZWxcIiA6IFwiR2VuZSBUeXBlXCIsXG5cdFx0XCJ2YWx1ZVwiIDogZ2VuZS5iaW90eXBlXG5cdCAgICB9KTtcblx0ICAgIG9iai5yb3dzLnB1c2goIHtcblx0XHRcImxhYmVsXCIgOiBcIkxvY2F0aW9uXCIsXG5cdFx0XCJ2YWx1ZVwiIDogXCI8YSB0YXJnZXQ9J19ibGFuaycgaHJlZj0naHR0cDovL3d3dy5lbnNlbWJsLm9yZy9Ib21vX3NhcGllbnMvTG9jYXRpb24vVmlldz9kYj1jb3JlO2c9XCIgKyBnZW5lLmlkICsgXCInPlwiICsgZ2VuZS5zZXFfcmVnaW9uX25hbWUgKyBcIjpcIiArIGdlbmUuc3RhcnQgKyBcIi1cIiArIGdlbmUuZW5kICsgXCI8L2E+XCJcblx0ICAgIH0pO1xuXHQgICAgb2JqLnJvd3MucHVzaCgge1xuXHRcdFwibGFiZWxcIiA6IFwiRGVzY3JpcHRpb25cIixcblx0XHRcInZhbHVlXCIgOiBnZW5lLmRlc2NyaXB0aW9uXG5cdCAgICB9KTtcblxuXHQgICAgdG9vbHRpcC50YWJsZSgpLmNhbGwodGhpcywgb2JqKTtcblx0fVxuXHRcblx0Z2VuZV90cmFja1xuXHQgICAgLmRpc3BsYXkoKVxuXHQgICAgLm9uX2NsaWNrKGdlbmVfdG9vbHRpcCk7XG5cblx0Z0Jyb3dzZXIoZGl2KTtcblx0Z0Jyb3dzZXIuYWRkX3RyYWNrKGdlbmVfdHJhY2spO1xuXG5cdC8vIFRoZSBHZW5lSW5mbyBQYW5lbFxuXHRkMy5zZWxlY3QoZGl2KS5zZWxlY3QoXCIudG50X2dyb3VwRGl2XCIpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiZVBlZWtfZ2VuZV9pbmZvXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfZ2VuZV9pbmZvXCIpIC8vIEJvdGggbmVlZGVkP1xuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgZ0Jyb3dzZXIud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gTGlua3MgZGl2XG5cdHZhciBsaW5rc19wYW5lID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfbGlua3NfcGFuZVwiKVxuXHQgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbigpIHtpZiAoc2hvd19saW5rcykge3JldHVybiBcImJsb2NrXCJ9IGVsc2Uge3JldHVybiBcIm5vbmVcIn19KTtcblxuXHQvLyBlbnNlbWJsXG5cdGxpbmtzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAudGV4dChcIk9wZW4gaW4gRW5zZW1ibFwiKTtcblx0dmFyIGVuc2VtYmxMb2MgPSBsaW5rc19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcIm9wZW4gcmVnaW9uIGluIGVuc2VtYmxcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtZXh0ZXJuYWwtbGluayBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7dmFyIGxpbmsgPSBidWlsZEVuc2VtYmxMaW5rKCk7IHdpbmRvdy5vcGVuKGxpbmssIFwiX2JsYW5rXCIpfSk7XG5cblx0Z0Iuc3RhcnQoKTtcblxuICAgIH07XG5cbi8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbi8vLyBSRU5ERVJJTkcgRlVOQ1RJT05TIC8vLy9cbi8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbiAgICAvLyBQcml2YXRlIGZ1bmN0aW9uc1xuXG4gICAgLy8gY2FsbGJhY2tzIHBsdWdnZWQgdG8gdGhlIGdCcm93c2VyIG9iamVjdFxuICAgIHZhciBnZW5lX2luZm9fY2JhayA9IGZ1bmN0aW9uIChnZW5lKSB7XG5cdHZhciBzZWwgPSBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfZ2VuZV9pbmZvXCIpO1xuXG5cdHNlbFxuXHQgICAgLmNsYXNzZWQoXCJ0bnRfZ2VuZV9pbmZvX2FjdGl2ZVwiLCB0cnVlKVxuXHQgICAgLmFwcGVuZChcInBcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ2VuZV9pbmZvX3BhcmFncmFwaFwiKVxuXHQgICAgLy8gLnN0eWxlKFwiY29sb3JcIiwgZ0Jyb3dzZXJUaGVtZS5mb3JlZ3JvdW5kX2NvbG9yKCkuZGFya2VyKCkpXG5cdCAgICAvLyAuc3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGdCcm93c2VyVGhlbWUuYmFja2dyb3VuZF9jb2xvcigpLmJyaWdodGVyKCkpXG5cdCAgICAvLyAuc3R5bGUoXCJoZWlnaHRcIiwgZ0Jyb3dzZXIuaGVpZ2h0KCkgKyBcInB4XCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIFwiPGgxPlwiICsgZ2VuZS5leHRlcm5hbF9uYW1lICsgXCI8L2gxPlwiICtcblx0XHQgICAgXCJFbnNlbWJsIElEOiA8aT5cIiArIGdlbmUuSUQgKyBcIjwvaT48YnIgLz5cIiArXG5cdFx0ICAgIFwiRGVzY3JpcHRpb246IDxpPlwiICsgZ2VuZS5kZXNjcmlwdGlvbiArIFwiPC9pPjxiciAvPlwiICtcblx0XHQgICAgXCJTb3VyY2U6IDxpPlwiICsgZ2VuZS5sb2dpY19uYW1lICsgXCI8L2k+PGJyIC8+XCIgK1xuXHRcdCAgICBcImxvYzogPGk+XCIgKyBnZW5lLnNlcV9yZWdpb25fbmFtZSArIFwiOlwiICsgZ2VuZS5zdGFydCArIFwiLVwiICsgZ2VuZS5lbmQgKyBcIiAoU3RyYW5kOiBcIiArIGdlbmUuc3RyYW5kICsgXCIpPC9pPjxiciAvPlwiO30pO1xuXG5cdHNlbC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RleHRfcm90YXRlZFwiKVxuXHQgICAgLnN0eWxlKFwidG9wXCIsIH5+Z0Jyb3dzZXIuaGVpZ2h0KCkvMiArIFwicHhcIilcblx0ICAgIC5zdHlsZShcImJhY2tncm91bmQtY29sb3JcIiwgZ0Jyb3dzZXJUaGVtZS5mb3JlZ3JvdW5kX2NvbG9yKCkpXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9saW5rXCIpXG5cdCAgICAuc3R5bGUoXCJjb2xvclwiLCBnQnJvd3NlclRoZW1lLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC50ZXh0KFwiW0Nsb3NlXVwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7ZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiX2dlbmVfaW5mb1wiICsgXCIgcFwiKS5yZW1vdmUoKTtcblx0XHRcdFx0ICAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfZ2VuZV9pbmZvXCIgKyBcIiBzcGFuXCIpLnJlbW92ZSgpO1xuXHRcdFx0XHQgICAgIHNlbC5jbGFzc2VkKFwidG50X2dlbmVfaW5mb19hY3RpdmVcIiwgZmFsc2UpfSk7XG5cbiAgICB9O1xuXG4gICAgLy8vLyBBUElcbiAgICBnQnJvd3NlclRoZW1lLmxlZnQgPSBmdW5jdGlvbiAoKSB7XG5cdGdCcm93c2VyLm1vdmVfbGVmdCgxLjUpO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLnJpZ2h0ID0gZnVuY3Rpb24gKCkge1xuXHRnQnJvd3Nlci5tb3ZlX3JpZ2h0KDEuNSk7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuem9vbUluID0gZnVuY3Rpb24gKCkge1xuXHRnQnJvd3Nlci56b29tKDAuNSk7XG4gICAgfVxuXG4gICAgZ0Jyb3dzZXJUaGVtZS56b29tT3V0ID0gZnVuY3Rpb24gKCkge1xuXHRnQnJvd3Nlci56b29tKDEuNSk7XG4gICAgfVxuXG4gICAgZ0Jyb3dzZXJUaGVtZS5zaG93X29wdGlvbnMgPSBmdW5jdGlvbihiKSB7XG5cdHNob3dfb3B0aW9ucyA9IGI7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLmNociA9IGZ1bmN0aW9uIChjKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNocjtcblx0fVxuXHRjaHIgPSBjO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIGdCcm93c2VyVGhlbWUuc2hvd190aXRsZSA9IGZ1bmN0aW9uKGIpIHtcblx0c2hvd190aXRsZSA9IGI7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLnNob3dfbGlua3MgPSBmdW5jdGlvbihiKSB7XG5cdHNob3dfbGlua3MgPSBiO1xuXHRyZXR1cm4gZ0Jyb3dzZXJUaGVtZTtcbiAgICB9O1xuXG4gICAgZ0Jyb3dzZXJUaGVtZS50aXRsZSA9IGZ1bmN0aW9uIChzKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHRpdGxlO1xuXHR9XG5cdHRpdGxlID0gcztcblx0cmV0dXJuIGdCcm93c2VyVGhlbWU7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuZm9yZWdyb3VuZF9jb2xvciA9IGZ1bmN0aW9uIChjKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGZnQ29sb3I7XG5cdH1cblx0ZmdDb2xvciA9IGM7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLmJhY2tncm91bmRfY29sb3IgPSBmdW5jdGlvbiAoYykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBiZ0NvbG9yO1xuXHR9XG5cdGJnQ29sb3IgPSBjO1xuXHRyZXR1cm4gZ0Jyb3dzZXJUaGVtZTtcbiAgICB9O1xuXG4gICAgdmFyIHNldF9kaXZfaWQgPSBmdW5jdGlvbihkaXYpIHtcblx0ZGl2X2lkID0gZDMuc2VsZWN0KGRpdikuYXR0cihcImlkXCIpO1xuICAgIH07XG5cblxuICAgIC8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbiAgICAvLy8gVVRJTElUWSBNRVRIT0RTICAgICAvLy8vXG4gICAgLy8vKioqKioqKioqKioqKioqKioqKioqLy8vL1xuICAgIC8vIFByaXZhdGUgbWV0aG9kc1xuICAgIHZhciBidWlsZEVuc2VtYmxMaW5rID0gZnVuY3Rpb24oKSB7XG5cdHZhciB1cmwgPSBcImh0dHA6Ly93d3cuZW5zZW1ibC5vcmcvXCIgKyBnQnJvd3Nlci5zcGVjaWVzKCkgKyBcIi9Mb2NhdGlvbi9WaWV3P3I9XCIgKyBnQnJvd3Nlci5jaHIoKSArIFwiJTNBXCIgKyBnQnJvd3Nlci5mcm9tKCkgKyBcIi1cIiArIGdCcm93c2VyLnRvKCk7XG5cdHJldHVybiB1cmw7XG4gICAgfTtcblxuXG4gICAgLy8gUHVibGljIG1ldGhvZHNcblxuXG4gICAgLyoqIDxzdHJvbmc+YnVpbGRFbnNlbWJsR2VuZUxpbms8L3N0cm9uZz4gcmV0dXJucyB0aGUgRW5zZW1ibCB1cmwgcG9pbnRpbmcgdG8gdGhlIGdlbmUgc3VtbWFyeSBvZiB0aGUgZ2l2ZW4gZ2VuZVxuXHRAcGFyYW0ge1N0cmluZ30gZ2VuZSBUaGUgRW5zZW1ibCBnZW5lIGlkLiBTaG91bGQgYmUgYSB2YWxpZCBJRCBvZiB0aGUgZm9ybSBFTlNHWFhYWFhYWFhYXCJcblx0QHJldHVybnMge1N0cmluZ30gVGhlIEVuc2VtYmwgVVJMIGZvciB0aGUgZ2l2ZW4gZ2VuZVxuICAgICovXG4gICAgdmFyIGJ1aWxkRW5zZW1ibEdlbmVMaW5rID0gZnVuY3Rpb24oZW5zSUQpIHtcblx0Ly9cImh0dHA6Ly93d3cuZW5zZW1ibC5vcmcvSG9tb19zYXBpZW5zL0dlbmUvU3VtbWFyeT9nPUVOU0cwMDAwMDEzOTYxOFwiXG5cdHZhciB1cmwgPSBcImh0dHA6Ly93d3cuZW5zZW1ibC5vcmcvXCIgKyBnQnJvd3Nlci5zcGVjaWVzKCkgKyBcIi9HZW5lL1N1bW1hcnk/Zz1cIiArIGVuc0lEO1xuXHRyZXR1cm4gdXJsO1xuICAgIH07XG5cblxuXG4gICAgcmV0dXJuIGdCcm93c2VyVGhlbWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBjdHR2X2dlbm9tZV9icm93c2VyO1xuIl19
