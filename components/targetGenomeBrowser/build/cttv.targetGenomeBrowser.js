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

    var gBrowserTheme = function(gB, div, cttvRestApi) {
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

	gene_track.data().update().success (function (genes) {
	    for (var i=0; i<genes.length; i++) {
		if (genes[i].id === gBrowser.gene()) {
		    genes[i].color = "#A00000";
		}
	    }
	})

	var tooltip_obj = function (ensemblData, cttvData) {
	    var obj = {};
	    obj.header = ensemblData.external_name + " (" + ensemblData.id + ")";
	    obj.rows = [];

	    // Associations and target links maybe
	    var associationsValue;
	    var targetValue;
	    if (cttvData && cttvData.data && cttvData.data.length > 0) {
		associationsValue = "<a href='#/target-associations?q=" + ensemblData.id + "&label=" + ensemblData.external_name + "'>" + (cttvData.data.length - 1) + " disease associations</a> ";
		targetValue = "<a href='#/target/" + ensemblData.id + "'>View CTTV profile</a>";
	    }

	    obj.rows.push( {
		"label" : "Gene Type",
		"value" : ensemblData.biotype
	    });
	    obj.rows.push({
		"label" : "Location",
		"value" : "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Location/View?db=core;g=" + ensemblData.id + "'>" + ensemblData.seq_region_name + ":" + ensemblData.start + "-" + ensemblData.end + "</a>"
	    });
	    if (associationsValue !== undefined) {
		obj.rows.push({
		    "label" : "Associations",
		    "value" : associationsValue
		});
	    }
	    if (targetValue !== undefined) {
		obj.rows.push({
		    "label" : "CTTV Profile",
		    "value" : targetValue
		});
	    }
	    obj.rows.push( {
		"label" : "Description",
		"value" : ensemblData.description
	    });
	    return obj;
	};
	
	// Tooltip on genes
	var gene_tooltip = function (gene) {
	    var t = tooltip.table()
		.id(1);
	    var event = d3.event;
	    var elem = this;

	    var s = tooltip.plain()
		.id(1);
	    
	    var url = cttvRestApi.url.associations ({
		"gene" : gene.id,
		"datastructure" : "flat"
	    });
	    cttvRestApi.call(url)
		.catch (function () {
		    console.log("==============> ERROR!!!");
		    var obj = tooltip_obj(gene);
		    t.call(elem, obj, event);
		})
		.then(function (resp) {
		    resp = JSON.parse(resp.text);
		    console.log(resp);
		    var obj = tooltip_obj (gene, resp);
		    t.call(elem, obj, event);
		});
	    s.call(elem, {
		header : gene.external_name + " (" + gene.id + ")",
		body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
	    });

	    //tooltip.table().call(this, obj);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL2Zha2VfZGQxZGE0NzEuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL3NyYy90b29sdGlwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvc3JjL3RhcmdldEdlbm9tZUJyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gdGFyZ2V0R2Vub21lQnJvd3NlciA9IHJlcXVpcmUoXCIuL3NyYy90YXJnZXRHZW5vbWVCcm93c2VyLmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB0b29sdGlwID0gcmVxdWlyZShcIi4vc3JjL3Rvb2x0aXAuanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG5cbnZhciB0b29sdGlwID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRyYWcgPSBkMy5iZWhhdmlvci5kcmFnKCk7XG4gICAgdmFyIHRvb2x0aXBfZGl2O1xuXG4gICAgdmFyIGNvbmYgPSB7XG5cdGJhY2tncm91bmRfY29sb3IgOiBcIndoaXRlXCIsXG5cdGZvcmVncm91bmRfY29sb3IgOiBcImJsYWNrXCIsXG5cdHBvc2l0aW9uIDogXCJyaWdodFwiLFxuXHRhbGxvd19kcmFnIDogdHJ1ZSxcblx0c2hvd19jbG9zZXIgOiB0cnVlLFxuXHRmaWxsIDogZnVuY3Rpb24gKCkgeyB0aHJvdyBcImZpbGwgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7IH0sXG5cdHdpZHRoIDogMTgwLFxuXHRpZCA6IDFcbiAgICB9O1xuXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGF0YSwgZXZlbnQpIHtcblx0ZHJhZ1xuXHQgICAgLm9yaWdpbihmdW5jdGlvbigpe1xuXHRcdHJldHVybiB7eDpwYXJzZUludChkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJsZWZ0XCIpKSxcblx0XHRcdHk6cGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwidG9wXCIpKVxuXHRcdCAgICAgICB9O1xuXHQgICAgfSlcblx0ICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oKSB7XG5cdFx0aWYgKGNvbmYuYWxsb3dfZHJhZykge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcylcblx0XHRcdC5zdHlsZShcImxlZnRcIiwgZDMuZXZlbnQueCArIFwicHhcIilcblx0XHRcdC5zdHlsZShcInRvcFwiLCBkMy5ldmVudC55ICsgXCJweFwiKTtcblx0XHR9XG5cdCAgICB9KTtcblxuXHQvLyBUT0RPOiBXaHkgZG8gd2UgbmVlZCB0aGUgZGl2IGVsZW1lbnQ/XG5cdC8vIEl0IGxvb2tzIGxpa2UgaWYgd2UgYW5jaG9yIHRoZSB0b29sdGlwIGluIHRoZSBcImJvZHlcIlxuXHQvLyBUaGUgdG9vbHRpcCBpcyBub3QgbG9jYXRlZCBpbiB0aGUgcmlnaHQgcGxhY2UgKGFwcGVhcnMgYXQgdGhlIGJvdHRvbSlcblx0Ly8gU2VlIGNsaWVudHMvdG9vbHRpcHNfdGVzdC5odG1sIGZvciBhbiBleGFtcGxlXG5cdHZhciBjb250YWluZXJFbGVtID0gc2VsZWN0QW5jZXN0b3IgKHRoaXMsIFwiZGl2XCIpO1xuXHRpZiAoY29udGFpbmVyRWxlbSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAvLyBXZSByZXF1aXJlIGEgZGl2IGVsZW1lbnQgYXQgc29tZSBwb2ludCB0byBhbmNob3IgdGhlIHRvb2x0aXBcblx0ICAgIHJldHVybjtcblx0fVxuXG5cdC8vIENvbnRhaW5lciBlbGVtZW50IHBvc2l0aW9uIChuZWVkZWQgZm9yIFwicmVsYXRpdmVcIiBwb3NpdGlvbmVkIHBhcmVudHMpXG5cdC8vIGllIGhhcyBzY3JvbGxUb3AgYW5kIHNjcm9sbExlZnQgb24gZG9jdW1lbnRFbGVtZW50IGluc3RlYWQgb2YgYm9keVxuXHR2YXIgc2Nyb2xsVG9wID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wKSB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcblx0dmFyIHNjcm9sbExlZnQgPSAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0KSB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQ7XG5cdHZhciBlbGVtUG9zID0gY29udGFpbmVyRWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0dmFyIGVsZW1Ub3AgPSBlbGVtUG9zLnRvcCArIHNjcm9sbFRvcDtcblx0dmFyIGVsZW1MZWZ0ID0gZWxlbVBvcy5sZWZ0ICsgc2Nyb2xsTGVmdDtcblx0XG5cdHRvb2x0aXBfZGl2ID0gZDMuc2VsZWN0KGNvbnRhaW5lckVsZW0pXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3Rvb2x0aXBcIilcblx0ICAgIC5jbGFzc2VkKFwidG50X3Rvb2x0aXBfYWN0aXZlXCIsIHRydWUpICAvLyBUT0RPOiBJcyB0aGlzIG5lZWRlZC91c2VkPz8/XG5cdCAgICAuY2FsbChkcmFnKTtcblxuXHQvLyBwcmV2IHRvb2x0aXBzIHdpdGggdGhlIHNhbWUgaGVhZGVyXG5cdGQzLnNlbGVjdChcIiN0bnRfdG9vbHRpcF9cIiArIGNvbmYuaWQpLnJlbW92ZSgpO1xuXG5cdGlmICgoZDMuZXZlbnQgPT09IG51bGwpICYmIChldmVudCkpIHtcblx0ICAgIGQzLmV2ZW50ID0gZXZlbnQ7XG5cdH1cblx0dmFyIG1vdXNlID0gW2QzLmV2ZW50LnBhZ2VYLCBkMy5ldmVudC5wYWdlWV07XG5cdGQzLmV2ZW50ID0gbnVsbDtcblxuXHR2YXIgb2Zmc2V0ID0gMDtcblx0aWYgKGNvbmYucG9zaXRpb24gPT09IFwibGVmdFwiKSB7XG5cdCAgICBvZmZzZXQgPSBjb25mLndpZHRoO1xuXHR9XG5cdFxuXHR0b29sdGlwX2Rpdi5hdHRyKFwiaWRcIiwgXCJ0bnRfdG9vbHRpcF9cIiArIGNvbmYuaWQpO1xuXHRcblx0Ly8gV2UgcGxhY2UgdGhlIHRvb2x0aXBcblx0dG9vbHRpcF9kaXZcblx0ICAgIC5zdHlsZShcImxlZnRcIiwgKG1vdXNlWzBdIC0gb2Zmc2V0IC0gZWxlbUxlZnQpICsgXCJweFwiKVxuXHQgICAgLnN0eWxlKFwidG9wXCIsIG1vdXNlWzFdIC0gZWxlbVRvcCArIFwicHhcIik7XG5cblx0Ly8gQ2xvc2Vcblx0aWYgKGNvbmYuc2hvd19jbG9zZXIpIHtcblx0ICAgIHRvb2x0aXBfZGl2LmFwcGVuZChcInNwYW5cIilcblx0XHQuc3R5bGUoXCJwb3NpdGlvblwiLCBcImFic29sdXRlXCIpXG5cdFx0LnN0eWxlKFwicmlnaHRcIiwgXCItMTBweFwiKVxuXHRcdC5zdHlsZShcInRvcFwiLCBcIi0xMHB4XCIpXG5cdFx0LmFwcGVuZChcImltZ1wiKVxuXHRcdC5hdHRyKFwic3JjXCIsIHRvb2x0aXAuaW1hZ2VzLmNsb3NlKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgXCIyMHB4XCIpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgXCIyMHB4XCIpXG5cdFx0Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuXHRcdCAgICB0LmNsb3NlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRjb25mLmZpbGwuY2FsbCh0b29sdGlwX2RpdiwgZGF0YSk7XG5cblx0Ly8gcmV0dXJuIHRoaXMgaGVyZT9cblx0cmV0dXJuIHQ7XG4gICAgfTtcblxuICAgIC8vIGdldHMgdGhlIGZpcnN0IGFuY2VzdG9yIG9mIGVsZW0gaGF2aW5nIHRhZ25hbWUgXCJ0eXBlXCJcbiAgICAvLyBleGFtcGxlIDogdmFyIG15ZGl2ID0gc2VsZWN0QW5jZXN0b3IobXllbGVtLCBcImRpdlwiKTtcbiAgICBmdW5jdGlvbiBzZWxlY3RBbmNlc3RvciAoZWxlbSwgdHlwZSkge1xuXHR0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXHRpZiAoZWxlbS5wYXJlbnROb2RlID09PSBudWxsKSB7XG5cdCAgICBjb25zb2xlLmxvZyhcIk5vIG1vcmUgcGFyZW50c1wiKTtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0dmFyIHRhZ05hbWUgPSBlbGVtLnBhcmVudE5vZGUudGFnTmFtZTtcblxuXHRpZiAoKHRhZ05hbWUgIT09IHVuZGVmaW5lZCkgJiYgKHRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gdHlwZSkpIHtcblx0ICAgIHJldHVybiBlbGVtLnBhcmVudE5vZGU7XG5cdH0gZWxzZSB7XG5cdCAgICByZXR1cm4gc2VsZWN0QW5jZXN0b3IgKGVsZW0ucGFyZW50Tm9kZSwgdHlwZSk7XG5cdH1cbiAgICB9XG4gICAgXG4gICAgdmFyIGFwaSA9IGFwaWpzKHQpXG5cdC5nZXRzZXQoY29uZik7XG4gICAgYXBpLmNoZWNrKCdwb3NpdGlvbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0cmV0dXJuICh2YWwgPT09ICdsZWZ0JykgfHwgKHZhbCA9PT0gJ3JpZ2h0Jyk7XG4gICAgfSwgXCJPbmx5ICdsZWZ0JyBvciAncmlnaHQnIHZhbHVlcyBhcmUgYWxsb3dlZCBmb3IgcG9zaXRpb25cIik7XG5cbiAgICBhcGkubWV0aG9kKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcblx0dG9vbHRpcF9kaXYucmVtb3ZlKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAubGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaXN0IHRvb2x0aXAgaXMgYmFzZWQgb24gZ2VuZXJhbCB0b29sdGlwc1xuICAgIHZhciB0ID0gdG9vbHRpcCgpO1xuICAgIHZhciB3aWR0aCA9IDE4MDtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXHR2YXIgb2JqX2luZm9fbGlzdCA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gVG9vbHRpcCBoZWFkZXJcblx0b2JqX2luZm9fbGlzdFxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuXHQgICAgLmFwcGVuZChcInRoXCIpXG5cdCAgICAudGV4dChvYmouaGVhZGVyKTtcblxuXHQvLyBUb29sdGlwIHJvd3Ncblx0dmFyIHRhYmxlX3Jvd3MgPSBvYmpfaW5mb19saXN0LnNlbGVjdEFsbChcIi50bnRfem1lbnVfcm93XCIpXG5cdCAgICAuZGF0YShvYmoucm93cylcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfcm93XCIpO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0cmV0dXJuIG9iai5yb3dzW2ldLnZhbHVlO1xuXHQgICAgfSlcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQubGluayA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIC5jbGFzc2VkKFwibGlua1wiLCAxKVxuXHRcdCAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdGQubGluayhkLm9iaik7XG5cdFx0XHR0LmNsb3NlLmNhbGwodGhpcyk7XG5cdFx0ICAgIH0pO1xuXHQgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLnRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHRhYmxlIHRvb2x0aXBzIGFyZSBiYXNlZCBvbiBnZW5lcmFsIHRvb2x0aXBzXG4gICAgdmFyIHQgPSB0b29sdGlwKCk7XG4gICAgXG4gICAgdmFyIHdpZHRoID0gMTgwO1xuXG4gICAgdC5maWxsIChmdW5jdGlvbiAob2JqKSB7XG5cdHZhciB0b29sdGlwX2RpdiA9IHRoaXM7XG5cblx0dmFyIG9ial9pbmZvX3RhYmxlID0gdG9vbHRpcF9kaXZcblx0ICAgIC5hcHBlbmQoXCJ0YWJsZVwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudVwiKVxuXHQgICAgLmF0dHIoXCJib3JkZXJcIiwgXCJzb2xpZFwiKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgdC53aWR0aCgpICsgXCJweFwiKTtcblxuXHQvLyBUb29sdGlwIGhlYWRlclxuXHRvYmpfaW5mb190YWJsZVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuXHQgICAgLmFwcGVuZChcInRoXCIpXG5cdCAgICAuYXR0cihcImNvbHNwYW5cIiwgMilcblx0ICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuXG5cdC8vIFRvb2x0aXAgcm93c1xuXHR2YXIgdGFibGVfcm93cyA9IG9ial9pbmZvX3RhYmxlLnNlbGVjdEFsbChcIi50bnRfem1lbnVfcm93XCIpXG5cdCAgICAuZGF0YShvYmoucm93cylcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfcm93XCIpO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0cmV0dXJuIG9iai5yb3dzW2ldLmxhYmVsO1xuXHQgICAgfSk7XG5cblx0dGFibGVfcm93c1xuXHQgICAgLmFwcGVuZChcInRkXCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbihkLGkpIHtcblx0XHRpZiAodHlwZW9mIG9iai5yb3dzW2ldLnZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0ICAgIG9iai5yb3dzW2ldLnZhbHVlLmNhbGwodGhpcywgZCk7XG5cdFx0ICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuXHRcdCAgICBjb25zb2xlLmxvZyhkKTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gb2JqLnJvd3NbaV0udmFsdWU7XG5cdFx0fVxuXHQgICAgfSlcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQubGluayA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIC5jbGFzc2VkKFwibGlua1wiLCAxKVxuXHRcdCAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdGQubGluayhkLm9iaik7XG5cdFx0XHR0LmNsb3NlLmNhbGwodGhpcyk7XG5cdFx0ICAgIH0pO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAucGxhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcGxhaW4gdG9vbHRpcHMgYXJlIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0b2JqX2luZm9fdGFibGVcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLnRleHQob2JqLmhlYWRlcik7XG5cblx0b2JqX2luZm9fdGFibGVcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIilcblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLnN0eWxlKFwidGV4dC1hbGlnblwiLCBcImNlbnRlclwiKVxuXHQgICAgLmh0bWwob2JqLmJvZHkpO1xuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbi8vIFRPRE86IFRoaXMgc2hvdWxkbid0IGJlIGV4cG9zZWQgaW4gdGhlIEFQSS4gSXQgd291bGQgYmUgYmV0dGVyIHRvIGhhdmUgYXMgYSBsb2NhbCB2YXJpYWJsZVxuLy8gb3IgYWx0ZXJuYXRpdmVseSBoYXZlIHRoZSBpbWFnZXMgc29tZXdoZXJlIGVsc2UgKGFsdGhvdWdoIHRoZSBudW1iZXIgb2YgaGFyZGNvZGVkIGltYWdlcyBzaG91bGQgYmUgbGVmdCBhdCBhIG1pbmltdW0pXG50b29sdGlwLmltYWdlcyA9IHt9O1xudG9vbHRpcC5pbWFnZXMuY2xvc2UgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFRQUFBQUVBQ0FZQUFBQmNjcWhtQUFBS1EybERRMUJKUTBNZ2NISnZabWxzWlFBQWVOcWRVM2RZay9jV1B0LzNaUTlXUXRqd3NaZHNnUUFpSTZ3SXlCQlpvaENTQUdHRUVCSkF4WVdJQ2xZVUZSR2NTRlhFZ3RVS1NKMkk0cUFvdUdkQmlvaGFpMVZjT080ZjNLZTFmWHJ2N2UzNzEvdTg1NXpuL001NXp3K0FFUklta2VhaWFnQTVVb1U4T3RnZmowOUl4TW05Z0FJVlNPQUVJQkRteThKbkJjVUFBUEFEZVhoK2RMQS8vQUd2YndBQ0FIRFZMaVFTeCtIL2c3cFFKbGNBSUpFQTRDSVM1d3NCa0ZJQXlDNVV5QlFBeUJnQXNGT3paQW9BbEFBQWJIbDhRaUlBcWcwQTdQUkpQZ1VBMkttVDNCY0EyS0ljcVFnQWpRRUFtU2hISkFKQXV3QmdWWUZTTEFMQXdnQ2dyRUFpTGdUQXJnR0FXYll5UndLQXZRVUFkbzVZa0E5QVlBQ0FtVUlzekFBZ09BSUFReDRUelFNZ1RBT2dNTksvNEtsZmNJVzRTQUVBd011VnpaZEwwak1VdUpYUUduZnk4T0RpSWVMQ2JMRkNZUmNwRUdZSjVDS2NsNXNqRTBqbkEwek9EQUFBR3ZuUndmNDRQNURuNXVUaDVtYm5iTy8weGFMK2EvQnZJajRoOGQvK3ZJd0NCQUFRVHMvdjJsL2w1ZFlEY01jQnNIVy9hNmxiQU5wV0FHamYrVjB6MndtZ1dnclFldm1MZVRqOFFCNmVvVkRJUEIwY0Nnc0w3U1Zpb2IwdzQ0cysvelBoYitDTGZ2YjhRQjcrMjNyd0FIR2FRSm10d0tPRC9YRmhibmF1VW83bnl3UkNNVzczNXlQK3g0Vi8vWTRwMGVJMHNWd3NGWXJ4V0ltNFVDSk54M201VXBGRUljbVY0aExwZnpMeEg1YjlDWk4zRFFDc2hrL0FUcllIdGN0c3dIN3VBUUtMRGxqU2RnQkFmdk10akJvTGtRQVFaelF5ZWZjQUFKTy8rWTlBS3dFQXpaZWs0d0FBdk9nWVhLaVVGMHpHQ0FBQVJLQ0JLckJCQnd6QkZLekFEcHpCSGJ6QUZ3SmhCa1JBRENUQVBCQkNCdVNBSEFxaEdKWkJHVlRBT3RnRXRiQURHcUFSbXVFUXRNRXhPQTNuNEJKY2dldHdGd1pnR0o3Q0dMeUdDUVJCeUFnVFlTRTZpQkZpanRnaXpnZ1htWTRFSW1GSU5KS0FwQ0RwaUJSUklzWEljcVFDcVVKcWtWMUlJL0l0Y2hRNWpWeEErcERieUNBeWl2eUt2RWN4bElHeVVRUFVBblZBdWFnZkdvckdvSFBSZERRUFhZQ1dvbXZSR3JRZVBZQzJvcWZSUytoMWRBQjlpbzVqZ05FeERtYU0yV0ZjaklkRllJbFlHaWJIRm1QbFdEVldqelZqSFZnM2RoVWJ3SjVoN3dna0FvdUFFK3dJWG9RUXdteUNrSkJIV0V4WVE2Z2w3Q08wRXJvSVZ3bURoREhDSnlLVHFFKzBKWG9TK2NSNFlqcXhrRmhHckNidUlSNGhuaVZlSnc0VFg1TklKQTdKa3VST0NpRWxrREpKQzBsclNOdElMYVJUcEQ3U0VHbWNUQ2Jya0czSjN1UUlzb0NzSUplUnQ1QVBrRStTKzhuRDVMY1VPc1dJNGt3Sm9pUlNwSlFTU2pWbFArVUVwWjh5UXBtZ3FsSE5xWjdVQ0txSU9wOWFTVzJnZGxBdlU0ZXBFelIxbWlYTm14WkR5NlF0bzlYUW1tbG5hZmRvTCtsMHVnbmRneDVGbDlDWDBtdm9CK25uNllQMGR3d05oZzJEeDBoaUtCbHJHWHNacHhpM0dTK1pUS1lGMDVlWnlGUXcxeklibVdlWUQ1aHZWVmdxOWlwOEZaSEtFcFU2bFZhVmZwWG5xbFJWYzFVLzFYbXFDMVNyVlErclhsWjlwa1pWczFEanFRblVGcXZWcVIxVnU2azJyczVTZDFLUFVNOVJYNk8rWC8yQyttTU5zb2FGUnFDR1NLTlVZN2ZHR1kwaEZzWXlaZkZZUXRaeVZnUHJMR3VZVFdKYnN2bnNUSFlGK3h0MkwzdE1VME56cW1hc1pwRm1uZVp4elFFT3hySGc4RG5abkVyT0ljNE56bnN0QXkwL0xiSFdhcTFtclg2dE45cDYycjdhWXUxeTdSYnQ2OXJ2ZFhDZFFKMHNuZlU2YlRyM2RRbTZOcnBSdW9XNjIzWFA2ajdUWSt0NTZRbjF5dlVPNmQzUlIvVnQ5S1AxRitydjF1L1JIemN3TkFnMmtCbHNNVGhqOE15UVkraHJtR200MGZDRTRhZ1J5Mmk2a2NSb285RkpveWU0SnU2SForTTFlQmMrWnF4dkhHS3NOTjVsM0dzOFlXSnBNdHVreEtURjVMNHB6WlJybW1hNjBiVFRkTXpNeUN6Y3JOaXN5ZXlPT2RXY2E1NWh2dG04Mi95TmhhVkZuTVZLaXphTHg1YmFsbnpMQlpaTmx2ZXNtRlkrVm5sVzlWYlhyRW5XWE9zczYyM1dWMnhRRzFlYkRKczZtOHUycUsyYnJjUjJtMjNmRk9JVWp5blNLZlZUYnRveDdQenNDdXlhN0FidE9mWmg5aVgyYmZiUEhjd2NFaDNXTzNRN2ZISjBkY3gyYkhDODY2VGhOTU9weEtuRDZWZG5HMmVoYzUzek5SZW1TNURMRXBkMmx4ZFRiYWVLcDI2ZmVzdVY1UnJ1dXRLMTAvV2ptN3ViM0szWmJkVGR6RDNGZmF2N1RTNmJHOGxkd3ozdlFmVHc5MWppY2N6am5hZWJwOEx6a09jdlhuWmVXVjc3dlI1UHM1d21udFl3YmNqYnhGdmd2Y3Q3WURvK1BXWDZ6dWtEUHNZK0FwOTZuNGUrcHI0aTN6MitJMzdXZnBsK0IveWUrenY2eS8yUCtML2hlZklXOFU0RllBSEJBZVVCdllFYWdiTURhd01mQkprRXBRYzFCWTBGdXdZdkRENFZRZ3dKRFZrZmNwTnZ3QmZ5Ry9sak05eG5MSnJSRmNvSW5SVmFHL293ekNaTUh0WVJqb2JQQ044UWZtK20rVXpwekxZSWlPQkhiSWk0SDJrWm1SZjVmUlFwS2pLcUx1cFJ0Rk4wY1hUM0xOYXM1Rm43WjcyTzhZK3BqTGs3MjJxMmNuWm5yR3BzVW14ajdKdTRnTGlxdUlGNGgvaEY4WmNTZEJNa0NlMko1TVRZeEQySjQzTUM1MnlhTTV6a21sU1dkR091NWR5aXVSZm02YzdMbm5jOFdUVlprSHc0aFpnU2w3SS81WU1nUWxBdkdFL2xwMjVOSFJQeWhKdUZUMFcrb28yaVViRzN1RW84a3VhZFZwWDJPTjA3ZlVQNmFJWlBSblhHTXdsUFVpdDVrUm1TdVNQelRWWkUxdDZzejlseDJTMDVsSnlVbktOU0RXbVd0Q3ZYTUxjb3QwOW1LeXVURGVSNTVtM0tHNU9IeXZma0kvbHo4OXNWYklWTTBhTzBVcTVRRGhaTUw2Z3JlRnNZVzNpNFNMMUlXdFF6MzJiKzZ2a2pDNElXZkwyUXNGQzRzTFBZdUhoWjhlQWl2MFc3RmlPTFV4ZDNMakZkVXJwa2VHbncwbjNMYU11eWx2MVE0bGhTVmZKcWVkenlqbEtEMHFXbFF5dUNWelNWcVpUSnkyNnU5RnE1WXhWaGxXUlY3MnFYMVZ0V2Z5b1hsVitzY0t5b3J2aXdScmptNGxkT1g5Vjg5WGx0MnRyZVNyZks3ZXRJNjZUcmJxejNXYit2U3IxcVFkWFFodkFOclJ2eGplVWJYMjFLM25TaGVtcjFqczIwemNyTkF6VmhOZTFiekxhczIvS2hOcVAyZXAxL1hjdFcvYTJydDc3Wkp0cld2OTEzZS9NT2d4MFZPOTd2bE95OHRTdDRWMnU5UlgzMWJ0THVndDJQR21JYnVyL21mdDI0UjNkUHhaNlBlNlY3Qi9aRjcrdHFkRzlzM0srL3Y3SUpiVkkyalI1SU9uRGxtNEJ2MnB2dG1uZTFjRm9xRHNKQjVjRW4zNlo4ZStOUTZLSE93OXpEemQrWmY3ZjFDT3RJZVN2U09yOTFyQzJqYmFBOW9iM3Y2SXlqblIxZUhVZSt0LzkrN3pIalkzWEhOWTlYbnFDZEtEM3grZVNDaytPblpLZWVuVTQvUGRTWjNIbjNUUHlaYTExUlhiMW5ROCtlUHhkMDdreTNYL2ZKODk3bmoxM3d2SEQwSXZkaTJ5VzNTNjA5cmoxSGZuRDk0VWl2VzIvclpmZkw3VmM4cm5UMFRlczcwZS9UZi9wcXdOVnoxL2pYTGwyZmViM3Z4dXdidDI0bTNSeTRKYnIxK0hiMjdSZDNDdTVNM0YxNmozaXYvTDdhL2VvSCtnL3FmN1Qrc1dYQWJlRDRZTUJnejhOWkQrOE9DWWVlL3BULzA0Zmgwa2ZNUjlValJpT05qNTBmSHhzTkdyM3laTTZUNGFleXB4UFB5bjVXLzNucmM2dm4zLzNpKzB2UFdQelk4QXY1aTgrL3JubXA4M0x2cTZtdk9zY2p4eCs4em5rOThhYjhyYzdiZmUrNDc3cmZ4NzBmbVNqOFFQNVE4OUg2WThlbjBFLzNQdWQ4L3Z3djk0VHorNEE1SlJFQUFBQUdZa3RIUkFEL0FQOEEvNkM5cDVNQUFBQUpjRWhaY3dBQUN4TUFBQXNUQVFDYW5CZ0FBQUFIZEVsTlJRZmRDd01VRWdhTnFlWGtBQUFnQUVsRVFWUjQydTE5ZVZpVVpmZi9tUTBRbFdGbjJBVmN3SVVkQWRkY0VEUk56U1ZSTXkyVnlyYzBVM3ZUTWxPenNzVTFCZHozRlFRR21JMkJBZlNIU201Wldmb20rcGJpdm1VS2dwemZIOS9PYzgwOGdrdXZPdk1NOTdrdXJuTlpMUE9jKzN3KzkrYys5N252QjRBWk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqWm40VHNSQ1kyaGRmZkNGQ1JGRmRYWjJvb3FJQ0tpb3FSQUFBaUNoQ1JCWWdJU1czU0lRaWtRaGF0R2lCQVFFQjlHK2NPWE1tRzhqR1RnRHo1ODhYVlZSVWlDc3FLaVFBSUQxOStyVDB6Smt6TWdDd0JRQVpBRWdCUUFJQTRyKy9HRmtLenhBQTZ2Nyt1ZzhBdFFCUUF3RFZMVnEwcUFrSUNLZ0ZnRnAvZi8vN2dZR0JkYk5uejBaR0FGWnFjK2ZPRlowNWMwWlNVVkVoUFgzNnRPM1pzMmZ0QWFDcHA2ZW5jMXhjWEV1RlFoSG82ZW5wMzZWTGwwQTNOemVGcmExdE14c2JtMllTaWNSV0xCWTNaVmdTSVBvUm9hYW01aThBcUs2cXFycGRWVlYxKzlLbFN4ZiszLy83ZjZjckt5dlBYcmh3NFhSNWVmbC9LaXNycndIQVgzNStmbmNDQWdLcS9mMzlhLzM5L2UvUG16Y1BHUUVJMk9iTW1TTTZjK2FNOU15Wk03WUdnNkVwQURUdjJMRmpZRXhNVEh4aVltTEgwTkRRU0JzYkcwVk5UUTFVVjFmRHZYdjNvS2FtQnVycTZxQ3VyZzRRa2Z0aUpsd1RpOFVnRW9sQUpCS0JXQ3dHaVVRQ01wa01iR3hzUUNxVnd0MjdkeThjUDM3OGlFNm5PM0Q0OE9HeVE0Y09uUWFBUDd0Mjdmb1hBRlIzN2RxMWRzR0NCY2dJUUNBMlpzd1l5ZG16WisyS2k0dWIyZG5aT1E4Wk1xUmIvLzc5RXp0MjdCaHRaMmZuZStmT0hiaHo1dzdVMU5SQWJXMHQ5M08xdGJWdzd0dzV1SDM3TmxSV1ZvSlVLb1hLeWtwbzBxUUpYTDU4R2R6ZDNlSFNwVXZNQzhTN3VibkIzYnQzd2RQVEUycHJhOEhUMHhPYU5Xc0czdDdlSUpWS1RRaENLcFdDcmEwdDJOblp3WjA3ZC80b0x5OHZWNmxVMnB5Y25KTHE2dXFyWGJwMHVlM241MWUxZGV2Vys0eFNMZEErL1BCRDBhdXZ2aXJ6OS9kM0JJQ0FYcjE2RFZtMWF0WDIzMy8vL2VxWk0yZncrUEhqV0Y1ZWp2djM3OGV5c2pKVXFWVDQ2YWVmNHRTcFU3Rjc5KzdZdTNkdnRMT3p3N0N3TUpSS3BSZ1JFWUZTcVJRakl5TlJKcE5oVkZUVVEzMTBkRFR6WnZDUEdwZkl5RWlUOFF3TEMwTTdPenZzM2JzM2R1L2VIYWRPbllwejVzeEJsVXFGWldWbFdGWldoZ2NQSHNURGh3L2p6ei8vakNkT25MaStaTW1TSGQyNmRSc0NBQUcrdnI2T3ljbkpzdW5UcDdPYWtDWFlCeDk4SUJvMWFwU05uNStmczUyZFhmRDQ4ZU9uLy9EREQ4Zk9uVHVIUC8zMEU1YVhsMk5aV1JrV0ZoYmlpaFVyY09qUW9aaVFrSUJTcVJURHc4TlJLcFZ5eVJRYkc0c3ltUXpqNCtOUkpwTmhwMDZkVUNhVFllZk9uZEhHeHFaQjM2VkxGK2JONkI4MlBzYmpTT05LNHh3ZEhXMlNCd2tKQ1Roa3lCQmNzV0lGRmhZV1lsbFpHZTdmdng4UEh6Nk1KMDZjd0pLU2toOUdqUm8xM2RiV050algxOWQ1eElnUk51Ky8vejRqQW5OWmNuS3l6TmZYMThuZTNqNWt4b3daY3lzcUt2NDRjK1lNSGpseWhKdnAwOUxTTUNrcENXTmlZa3htZEVxQ1RwMDZvWTJORFhidDJoVnRiR3p3aFJkZVFCc2JHK3pSb3dmYTJ0cGl6NTQ5Ni9XOWV2VmkzZ0o5UStQVm8wY1BrL0dsOFNaeW9IeUlpb3BDcVZTS01URXgyS2RQSDB4TlRlV1VRWGw1T1I0L2Zod1BIVHIweDZSSmsrWTJhZElreE1mSHgybllzR0V5aHNibmFNT0hENWY0K1BnNEFFRFFPKys4TS9QMDZkTy9uejU5R2c4ZE9vUmxaV1dvMFdod3dvUUoyTFZyVjVSS3Bad2NqSXVMUTVsTVpnSjI0K1JKU0VoQVcxdGJURXhNUkZ0YlcweEtTbUxlaWp5Tks0MHpqVHVmRkNoUGlBeTZkdTJLNDhlUFI0MUdnMlZsWlhqZ3dBRThkdXdZbHBlWC96NSsvUGlaQUJEazdlM3Q4UExMTDBzWU9wK2hUWjA2VlJRZkgyOEhBRjVKU1VuSlI0NGNPWHJtekJrOGZQZ3dscFdWWVhaMk5rNmFOQW50N2UyNW1UNHVMczVrY0dsbTU0TzliOSsrYUd0cml5KysrS0tKNzkrL1ArZnQ3T3lZRjVBM0hqLyt1Tko0ODBtQmxBS2ZEQ0lqSTlIZTNoNG5UWnFFMmRuWlhLM2doeDkrUUkxR2M3Ujc5KzdKQU9EVnNXTkh1MG1USnJGbHdkTzJvVU9IU3J5OXZSMFZDa1hrdW5YcnRwOC9mNzcyMkxGanVILy9mbFNwVkRoa3lCQ01pSWhBbVV5R0hUdDJSSmxNeHEwUithQ25HYUZmdjM0bTRCNHdZQURhMmRuaFN5KzlaT0lIRGh6SXZJQTlmenhwbklrY0tBOG9ML2hrMEtWTEY1Tzhpb2lJd0NGRGhuQ0Z3L0x5Y3Z6aGh4OXF2Lzc2NisxdWJtNlJYbDVlam9NR0RaSXkxRDRGbXpKbGltam8wS0cyQU9EVnYzLy9jV2ZPbkRsLzh1UkpQSGp3SUJvTUJwdzVjeVkyYmRxVW0vRnBUVS95bmdiVGVJYXZEK3dOSmMrZ1FZT1l0d0wvS0hLZ2ZPQXJCTW9mV2laUXpTQXlNaEtiTm0yS00yZk9SSVBCd0JVTHk4ckt6aWNrSkl3REFLK0JBd2ZhdnZYV1cwd04vQS9nRjN0N2V6ZTFzN05ydldMRml0WG56cDJyUFhMa0NPN2J0dytYTFZ1R3ZYcjFRcGxNaGpFeE1TYXlqZFoyeE9pUEF2M2pKdEhnd1lPWkY1Qi9VbkpvaUF3b2ozcjE2bVdTWnpFeE1TaVR5YkJYcjE2NGRPbFMzTGR2SCs3ZnZ4K1BIRGxTTzIvZXZEVzJ0cmF0UFQwOW03NzExbHRpaHVaL0JuN0hvS0NnenZ2MjdUdncyMisvNFlFREIxQ3YxK09JRVNNd0xDeU0yOXA1Mkl4UDhyNmhtWjdOa013L1RCblFNcUVoUlVCYmkyRmhZVGhpeEFqVTYvVllWbGFHaHc0ZHdsMjdkaDMwOC9QcjdPbnA2ZmptbTI4eUVuaUM5YjRVQUZ6ajQrT0hWbFJVVlA3MDAwOVlWbGFHMjdkdng0Q0FBRzZ0VC91OXROWERabnptbjZjaTZObXpwMG0vUVVSRUJMWm8wUUszYmR1RysvYnR3NE1IRDJKSlNVbGxlSGo0VUFCd2ZlbWxsMWhkNERIQUx3TUF4V3V2dlRicGp6Lyt1SDMwNkZIY3QyOGZmdjMxMXlpWHl6RXFLb3FUWWJhMnR0aTdkKy9IbXZFWnlKbi9KK1R3S0VWQStVZkxncWlvS0pUTDVmajExMTl6UzRJREJ3N2NIang0OEw4QVFERmd3QURXTS9BSThIdE5telp0NXJsejUrNGRPblFJOSszYmgrKysrNjdKV3I5NzkrNG1jcXhmdjM0bVRNMUF6L3l6SkFQS005bzlvRHpzM3IyN1NXM2czWGZmNVVpZ3ZMejgzcmh4NDJZQ2dCY2pnWWVBLytPUFA1NzcrKysvM3o5NDhDQVdGQlRnMkxGanVTMFlZL0QzNmRQSEJQeHNyYy84ODY0TkdKTUE1U09SQUcwWmpoMDdGZ3NLQ21oSmNQL05OOStjKy9lT0ZpTUJzaUZEaGtnQndQUEREei84aE1DdjFXcHgrUERoWEp1bWNhR1BtamY0YTMyMmxjZjg4OXhDNU5jR0tDK3BRRWp0eGNPSEQwZXRWa3RxNFA3NDhlTS9BUURQL3YzN3M1ckEwS0ZESlFEZy9zNDc3MHovL2ZmZmF3ajhnd2NQTnVua28yWWVLc0N3R1o5NVM5d3RvUHlrSmlMcUpCdzhlTEF4Q2RRa0p5ZFBCd0QzL3YzN045NzI0Y21USjR1OXZiMmRrNUtTeHZ6KysrOVZCdzhlUkoxT2gwT0hEaldaK2ZuZ3A1bWZkZXd4YjBrZGh2eGRBaUlCVWdKRGh3NUZuVTZIKy9idHc5TFMwcW91WGJxOHBsQW9uQ2RPbk5qNHRnamZmZmRka2JlM3QwT0hEaDM2bmoxNzl2cWhRNGV3c0xBUWs1T1Q2d1YvUTdLZmdaOTVTeUNCaHBZRGZCSklUazdHd3NKQzNMZHZIK3IxK3VzdFc3YnNxMUFvSENaTW1OQzRPZ1pqWTJPYnVMbTVoUjg3ZHV6azBhTkhzYlMwRkZOU1V0ak16N3pWSzRHVWxCUXNMUzNGdlh2MzR1N2R1MCs2dUxpRVIwWkdObWxNUlQ4WkFQaG5aR1NvZnY3NVp5d3RMY1c1YytlYVZQc2Z0ZVpuNEdmZWtrbWdvWm9BN1E3TW5Uc1hTMHRMY2QrK2ZmalZWMStwQU1DL1Vld01USjQ4V1F3QWJ0T25UNTk5K3ZScDNMdDNMNjVhdFFwdGJXMjVmZjVIVmZzYk9yWEhQUFBtOVB6OGJHaDNJQ1ltQm0xdGJYSFZxbFZZV2xxS3BhV2xPSHIwNkU4QXdHM0NoQW5XWFEvdzl2WnVGaG9hMnZmTW1UTzNEeHc0Z0VxbEVsMWNYREE2T3ByYjU3ZXhzWG5rbXA5NTVvVkFCc1lrWUp6ZjBkSFI2T0xpZ2prNU9WaGFXb282bmU3MjMvV0FadGJlN0JOb01CZ09IajE2RkV0S1NqQW1Kb1k3eXR1dFd6ZTBzYkhobWlyWXpNKzhOU21CUG4zNm9JMk5EWGJyMW8wN1Vod2RIWTBsSlNWWVVsS0M2ZW5wQndFZzBDbzdCZitXL3E3VHAwLy85TlNwVTFoYVdvcFRwMDdsVHZYUjVSMzg5bDcrWlIzTU15OGt6KzhZVEVoSU1MbGtKQ3dzREtkT25Zb2xKU1ZvTUJodzlPalJjd0hBMWVxMkJ1UGo0NXY0K2ZuRi9mYmJiOWYzNzkrUG1abVozRzI4ZElrSEhheGc0R2ZlbWttZ2QrL2VKcGVMUkVkSFkyWm1KcGFVbEdCdWJ1NTFEdytQdU9qb2FPdlpGWGovL2ZmRkFPQ1ZucDYrL2ZqeDQxaGNYSXl2dlBLS1NhY2ZYZUxSdDI5ZlRqWXhFbURlV3NCUCtVeW5DT2x5RWVvVWZPV1ZWN0M0dUJnTkJnUCsrOS8vM2c0QVhsWnprVWluVHAyYVJrZEh2M2o2OU9sN2UvZnV4UlVyVm5CWEwvTzMvSXlEeFNjQjVwa1hvdWZuTTM5cmtLNnMvKzY3NzdDNHVCalZhdlc5NE9EZ0YyTmlZb1QvVHNycDA2ZExBTUJuKy9idCtVZU9ITUhpNG1KczJiSWxSa1pHbXB6dVMweE01R1FTQXovejFrb0NsTisweTBXN0FwR1JrZGl5WlV0T0JjeWJOeThmQUh3bVRab2s3TE1DblR0M2Job2ZILy9TYjcvOVZsdGFXb3FmZnZvcGhvYUcxbHY0YTBqK004KzhOWkdBOGZWaXhnWEIwTkJRL1BUVFQwa0YxTFpyMSs0bFFhdUFHVE5taUFIQWEvMzY5Vm1IRHg5R2c4R0FQWHYyTkxuTHovZ0N6L29VQVBQTVc1T24vT1pmTkVwM0MvYnMyUk1OQmdNV0ZoYmlyRm16c2dEQWE5S2tTV0toenY1MnJWcTE2bmJxMUttN3BhV2x1SGp4WXBSS3BmVzIrekx3TTk5WVNjQzRUVmdxbGVMaXhZdlJZRENnVXFtODYrUGoweTBtSnNaT2NPQ2ZObTJhQ0FCYzU4eVpzK0xZc1dOb01CZ3dORFFVSXlJaVRPNzA2OU9uRHllTGpJUERQUFBXN0NuZnFlbU43aFNNaUlqQTBOQlFOQmdNV0ZCUWdPUEdqVnNCQUs2Q2U5dlF5SkVqWlJLSnBQVVBQL3p3eDk2OWUzSDkrdlhZdm4xN2s5dDg2WlhjZkFYQVBQT053VlBlVTE4QTNTN2N2bjE3WEw5K1BSWVZGZUhtelp2L0VJdkZyUWNQSGl5czdrQmZYOTltUTRZTW1YRGl4QWtzS2lwNjRLaXY4VlhlVEFFdzMxZ1ZBUCtLY2VNancwVkZSYWhTcWJCcjE2NFR2THk4aEhORzRJTVBQaEFCZ0dMVnFsVlo1ZVhscU5WcVVTNlhjejMvdFBWQjhvZUNRTlZSNXBsdkRKN3luczRJZE8vZW5Uc2o0T0RnZ0ZxdEZnc0tDbkQ2OU9sWkFLRDQxNy8rSll4bHdLaFJvMlMydHJadGYvcnBwMnNsSlNVNGI5NDg3TkNod3dQeW40R2ZlVVlDU1NidHdiUU02TkNoQTg2Yk53OExDd3R4MjdadDEyUXlXVnZCTEFPNmR1M2FkT0RBZ2VOKy9QRkhMQ3dzeERGanhxQlVLbTN3bWkraGs4QS9mVjg5QTBIamppTjkvdnF1RDVOS3BUaG16QmdzTEN6RTNOeGM3TlNwMDdpT0hUczJGWXI4ZDF1d1lNSDY4dkp5MU9sMEp2Sy9XN2R1Smk5VDRKT0FVRHg5YnZLMG5DRlB6MGVlLy8vNVB5KzA1MmR4ZkxyUFQ4OW5mRlJZTHBlalRxZERyVmFMNDhlUFh3OEFidSs4ODQ1bEx3Tm16Wm9sQVlDQUF3Y09uQ3d0TGNWdnYvMldxLzdUcVQ5cS9oSGFvRFdVckxTY29lZWlBaWZmMC8rbjcyK3NaTURpV0g4OHFDbUlUZ20yYjk4ZXYvMzJXOVRyOVppZW5uNFNBQUxlZmZkZHkyNE43dGF0bTQyM3QzZnNUei85VkZOWVdJaVRKMDgyT2ZqRGY0c3ZmOUFzMWZObkpFcENXczVRWVpQMmM2bk5tVHo5ZHpyN1FEOUh2NGMvd3drbExpeU9UOGZ6M3pwTUI0UW1UNTZNZXIwZWQrM2FWZVBpNGhJYkd4dHJZK2tFMEd6WXNHRnZIVHQyRFBWNlBZYUhoNXRjK21ITTNFSlBWcnJCaUFxYmRMU1pPaDM1bnY0L2ZUOHRoNnlkREZnY0g4OFRMb3d2Q3drUEQwZTlYbzg1T1RuWXRXdlh0enAyN0dqeDI0RXU3Ny8vL3NxREJ3K2lYcS9ud005L3c0K2xEd3BmbHBMOHBCbUtsalAwSXNqSXlFaHMwcVFKSmlRa1lIeDhQTDcyMm1zNGFOQWdIRHQyTEhicTFBa1RFaExRM3Q2ZWU3VTVLU0w2UFRTajBkOTVsTHdWR3ZpZk5JNTkrdlRCK1BoNEhEVnFGQTRhTkFoSGpScUZjWEZ4bUpDUWdIWjJkbHhOeVZyaVNKK1AvMGFoME5CUTFHcTFxRmFyY2VqUW9Tc0J3TVZpa1Q5ejVrd1JBSGhsWldVWlNrcEtjUFBtelNpVlNybkI0ci9TbTEvUXNSVFBuNmxJbHRHTVExYzdSMFJFWUhSME5INzQ0WWU0ZE9sU1ZLdlZXRkJRME9DWFJxUEI1Y3VYNDh5Wk16RTJOcGFMQzgxczlQdHBtZFRRVENZVS95Ung3Tml4NDJQSFVhVlM0YUpGaTNENjlPa1lFUkhCa2FyUTQyajhxbkVpUTZsVWlwczNiMGFOUm9QejVzMHpBSURYNU1tVExiTVErUEhISDBzQUlHai8vdjFuaTRxS2NQYnMyVndCTUQ0KzNvU1poWkswTkZQUjZjV29xQ2gwZDNmSGp6NzZDSGZ2M3MxVmFmUHk4bkRQbmoyNGRldFdYTDkrUGE1ZXZSclQwOU54N2RxMXVISGpSdHk1Y3lkbVoyZWpTcVZDblU2SEJRVUZtSm1aaWJObnowWi9mMy91ZmdUNk8veVpUR2drUUorWFArUFQ4MFZHUm1KQVFBRE9uajBiTXpJeTZvM2poZzBiY00yYU5iaHExU3BjdDI0ZEY4ZWNuQnhVcTlWY0hIZnUzSWtmZnZnaHVybTVZVlJVVkwxeEZBb0pVTHpvZEdENzl1MXg5dXpacU5QcE1DMHQ3U3dBQkUyWk1rVmlxZXQvbVZnc2JudnMyTEVxdlY2UE0yYk1RS2xVYW5MbHR6SFQ4YmQ0ek8zcGM5RXloUXBPTkZQRng4Zmo5T25UVWFQUm9GYXJSYVZTaVJzM2JzU2xTNWRXZi9qaGgwZGZldW1sOVowN2QvNDRQRHo4OWJadDJ3NXQwYUpGWWtoSXlOQ3dzTEJ4blRwMStuakFnQUZyUC9yb284T3BxYWxWTzNmdXhQejhmTlRwZEtqVDZYRG16SmxjRXdqTlpLU1k2UE5ZYXR5ZU5JNmRPM2ZHRHovOGtBTjlUazRPeGJHSzR0aXBVNmVQd3NQRDMralFvY1BJRmkxYUpJYUdobzZLaUlnWTM2bFRwNDlmZnZubFRYUG56djFwMWFwVjkzYnYzczJScWxxdHh2ZmVlNDlycDZXK0U0b2pmMWxncVhFenZqcGNLcFhpakJrenNLQ2dBRGR2M2x3bEZvdmJ4c1hGeVN5VkFHd2pJeU43SHpseUJIVTZIUTRZTUlDNy9LTno1ODcxTXJHbEppMVZuV2x0T243OGVNekl5RUN0Vm90Nzl1ekIxTlJVbkRadFdubW5UcDArZG5CdzZBZ0Eva1ZGUmIzeElWWlVWTlFiQVB5Yk4yOGUzYmx6NTVtelpzM2F2M256NXJyYzNGelU2WFNZbFpXRmI3Lzl0c25hbGdxbkRSVzRMTTN6QzN6OE9MNzk5dHU0Wjg4ZTFHcTFtSm1aaVN0V3JMZy9kZXJVL2ZIeDhSODFiOTQ4NW5IaU9IWHExTllBME1MSnlhbFQxNjVkNTN6NjZhZEh0bXpaZ25sNWVhalQ2WEQzN3QwNGR1eFlremdLaFV3cGZqUVpoSWFHNG9BQkExQ24wK0dPSFR1d1pjdVd2ZVBpNG13dGxRQ2FEaGd3WU56MzMzK1BPcDBPQncwYVpMSUZ5SmRqTkFqbTlzWkphN3lHakk2T1JpY25KMXk0Y0NFMzQ2ZW5wK003Nzd5ek56ZzRlQ1FBQk5UVzFsYmdQN0RhMnRvS0FHZ1JIQnc4Yk5xMGFVWGJ0MjlIbFVxRldxMFdseXhaZ2k0dUxweWNwUUlYcmFINU01bWxlRHJRUXArVFBuZFVWQlE2T3p2amtpVkx1RGltcGFYaFcyKzlaUWdLQ2hvS0FDMythUnlycXFvTUFCQVlHaHI2NnNjZmYzeGc1ODZkM1BKZ3dZSUZLSmZMT1FWSzQ4b25VMHZMUTFJQXRCVTRhTkFnanRoaVkyUEh4Y2JHV21aSFlOZXVYWnNuSnlkUHA5ZDh0MnJWaXRzRm9PQmJXdkkyQlA2b3FDaDBjM1BEVFpzMm9VYWp3UjA3ZHVCbm4zMTJNU29xYWpJQUJPQlROQUR3ajQ2T2Z2Tzc3NzQ3cDFRcVVhdlY0dWJObTlIVDA1TXJGRm82Q2RRSGZpcGtLUlFLcnBDMWZmdDJuRGR2M3Ztd3NMQzNBYURGVTQ1allQZnUzYWVscDZkZnljM05SYTFXaXhzMmJEQWhVMHNuQVlvaktZQ3dzREJzMWFvVjZuUTYzTE5uRDNidjNuMTZ4NDRkbTFza0FmajUrVG1PSFR0MmZsbFpHZXAwT295TGk3Tm9CZEJRZFRvcUtnb1ZDZ1Z1MjdZTjFXbzFidGl3QVNkTm1sVHE0dUxTK2ZidDIrdnhHVmhWVlpYQjJkbTU0d2NmZkZDUWxaV0ZXcTBXZCszYWhYNStmbHlWMjdpd1pVd0M1b3FuY2NlZThlZWlBbFpFUkFUNit2cmlybDI3VUsxVzQ3cDE2ekFsSlVYdjVPUVVXMVZWWlhnV2NieHk1Y3FuN3U3dTNlYk9uYnMvT3p1YkkxUGpBbUZEdXdTV3FnRGk0dUpRcDlOaFRrNE9KaVFrelBmeThuSzAxSjFBcC9Ianh5OHFMUzNsamdEekZRQ2ZlYzNsQ1R6MWdkL0Z4UVUzYmRxRUtwVUtWNjllamNuSnlic2tFa2xyZkE0bUZvdGJUcHc0Y1dObVppYXExV3JjdVhNbit2bjVZWGg0ZUwwa1lPNTRrbkxpZ3o4OFBCeDlmWDF4eDQ0ZG1KK2ZqNnRXcmNMaHc0ZHZFb2xFTFo5SEhHVXlXZkRreVpPejl1elpneHFOQmpkdTNGaXZFaUFTNEpPcHVlTnByQURrY2psWExFMU1URndFQUU2V1NnRE9FeWRPWEZsU1VvSmFyUmJidDI5dmNnY2dYd0ZZU3JDcFVCVWRIWTFObWpUQjlQUjBWS2xVdUhidFdodytmUGltcHkzNUgwUEsrcjMyMm12TExKMEVIaGY4NmVucE9IRGd3T1VBNFArYzR4ajR6anZ2N016T3prYU5Sb09wcWFuWXBFa1RyaVpBNDI0cGt4SmZBZEFkZ2UzYnQrZHFKMGxKU1NzQXdObGlDU0FsSldXMXdXQkFyVmFMVXFtMFFRWFEwRUdQNStYNTRLY3E5ZXpaczFHajBlQ1dMVnR3M0xoeHVRQVFpR1l3QVBDdGp3VDRuWlhVUnN1ZnlaNjFKK1ZFZjU4NjE4TEN3aG9DdjY4NTRpaVZTbHZObWpWTGs1dWJpeHFOQnFkUG4vN0E3b0FsNXFXeEFwQktwYWpWYWpFM054Zjc5ZXUzMnBJSndDVWxKV1YxVVZFUmFqUWFEQTRPTmxFQTFMTnRDVUUyN2tHbi9lbkV4RVJVcTlXWWtaR0JIMzc0NFMvMjl2YWhhRVlqRXNqSXlFQ1ZTb1U3ZHV4QVgxOWZzNVBBbzhDL2ZmdDJ6TXZMdzdTME5IenBwWmZNQm42eTVzMmJoNldtcHY2YW41K1BhclVhRXhNVFRmb3QrR2NKekoyZnhua3BsVW94T0RnWU5Sb05LcFZLN051MzcycExiZ2MySVFCakJXQmN4VFlPdHJrOEJabWFSa0pEUTNISmtpV1lsNWVIUzVjdXJmTHg4Um1JRm1DUElnSGpacGY2VHNrOWJjOC9yVWZ4czFUd2s3VnUzWHBRVmxaV2xWcXR4a1dMRm5FM1ZGSDgrQ1JnTHMvZlJTRUZJRWdDSUFWQWNzdFNnc3h2U3cwUEQrZG0veTFidHVETEw3KzhCZ0E4MFVMTVVraEFxT0QvTzRhZTc3enp6cnI4L0h6VWFEVFl1M2R2N29wNmZ0dXdwVXhPdEFzZ0tBVXdjZUxFMVlXRmhhaFdxemtGWUJ4a2N5dUErcXIrTXBrTU4yN2NpTG01dWZqbGwxOWVzYmUzajBBTE16NEpiTisrSFgxOWZibE9TNUt6Vk5ONDJzbE00S2ZmVDh1bTBOQlFFL0NucHFaYUhQakpuSnljb3ZmczJYTmRyVlpqZW5vNnltU3lCbmNGekoyZmhCZFNBR3ExR25OeWNvUkZBRzNhdERFNUMwRHRtQlJrYzNtYXdhandOMkRBQUZTcFZMaDE2MVo4OGNVWGx6K3FGZFdjSkRCbXpKaGx1M2Z2eHZ6OC9NY21nZjgxWG84Qy83WnQyekEzTnhkVFUxTnh3SUFCRmdsK2FpR2VOR2xTbWtxbFFyVmFqVWxKU2ZXMkMxdEtmdEpaZ0RadDJnaVRBS1JTS1lhR2h0WXJzOHdWWEg3aHFrT0hEamg1OG1UTXo4L0haY3VXVlRrNU9YVkdDN2JuVFFMV0FuNHlYMS9mN21xMXVrYWxVdUhiYjcvTnhjMjRvR3JPL09RdlQwTkRRNjFIQVZBU2tjeDUzdDc0RWdycVZKTktwYmhqeHc3TXlzckM5OTU3cjlqU0UvaGhKRUNGTFQ0SkdPOFNQSW1ubitPRHYwT0hEb0lFUC9WWXJGcTFhcjlhcmNhdFc3ZWEzRmRoZkttSU9mUFV1QzlGa0FwQXI5ZWpTcVZDaVVUQ01TeS9lY1hjd1NYNTM3MTdkMVNwVkxobHl4YnMwcVhMcC8vMFVJcTVTR0RYcmwyWWw1ZUgyN1p0ZTZvazhEamdWeXFWdUhMbFNzR0FIeEd4dXJyYU1HellzTTgwR2cycVZDcnUraTErdk13OVNWRlRWV2hvS0Vva0VsU3BWSmlkblkxSlNVbkNJWURXclZ1alZDcDlvTkJDRC9tOFBhMnRqT1YvVWxJUzV1Zm40NW8xYXpBd01MQWZDc2dlUlFLMHRxVzRHKzhTUEU2YzZPZUlMQnNBL3pLaGdKOHNKaVptSUwxMnEzZnYzbHk4K0gwVjVzcFQ0d0sxVkNyRjFxMWJDNU1BSkJLSnhRYVhybHVhT1hNbTV1WGw0YkpseTI0Q1FEQUt6SjQyQ1ZnNytQOCtiOUcyc0xEd2prcWw0aTZ0b1J1WnpEMUoxVmVqRXFRQ3lNL1A1eFFBQlpmV1dQU1F6OXZ6NVd5N2R1MXcvdno1cUZRcThiUFBQanZ4dkh2K255WUp2UHJxcXh3SmJOMjZGWDE5ZmJucjJLZ0dRL0huTHd2NDhhSHZpNDZPNXE2bDh2WDF4YTFidHdvZS9IUkdJRGMzOXplMVdvMmZmUElKdG12WDdxSExwdWZ0S2Y0MFNiVnUzUnJ6OC9NeEt5dExHQVJRVUZDQStmbjVKZ3FBMzZ4aXJ1QWFIMWlSU3FXNGF0VXF6TTdPeGxtelp1MERBQjhVcUJFSjdOeTVFM056Y3grYkJQajM3ejhNL0RrNU9iaGl4UXJzMzcrL1lNRlBzZHErZmZ0K2pVYURhV2xwS0pWS0h6aG9aYTc4NURkWmtRSVFKQUcwYXRVS3BWTHBBeDFYOUpEUDJ4dmY5Q09UeVRBa0pBVFhybDJMMmRuWk9HM2FOQjBBZUtHQXJTRVNvQm1PZjJFbXhZTzg4Y1ducEpDc0RmeC94OGw3NDhhTmVxMVdpNnRYcjhhUWtCQVRrdVF2bDU2M3AzR2dYYXBXclZvSlZ3SFFETVNYVitZS3J2SEJGYWxVaWhzMmJNRHM3R3o4OTcvL3JSYzZBVHdKQ1ZCTmhtWjgrcmUxZzU4SVlOdTJiUWFkVG9mcjFxMHpPYk5DY1RCWGZ2S1hxZTNidHhlV0FwZ3dZY0pxblU2SGVYbDVEU29BL3V1ZW5wYzN2cU9PRk1DeVpjc3dPenNiNTh5WlUyWU55VzFNQWp0MjdFQ2xVb2xidG13eElRR3F5ZEN5akR6dGh4UDR0MnpaZ3RuWjJmamRkOS9oaXkrK3VNeWE0ck5uejU2REdvMEdGeTllL0lBQzRDK1RucmV2VHdIUWRlbUNJZ0NKUk1JbEhiOGFiYTdnR2g5Z2tVcWwrTTAzMzZCU3FjU3Z2LzVhc0VYQUp5R0J0bTNiY2sxUXBBaU0vOTIyYlZ1ckJqOFZBUXNMQzA5cU5CcGN1SENoaVFJZ01qUlhmdkozWDlxMWE0Y1NpVVNZQk5DeVpVdXV3RkxmTzkyZXQrZXZjVU5DUXZEdHQ5L0czTnhjWEwxNjlRMGhiZ00rS1FuNCtQaHdNeDQxYVpFUENRbEJIeDhmcXdiLzMzRnBlK2pRb2RzcWxRb25UcHo0Z0FKb3FFYnl2RHpoaEFyVkxWdTJGQjRCNU9ibW9rUWk0V1ljS3J5UnZESlhjUGtLWVBUbzBkeGF1V1hMbG4zUnlveFBBcHMzYjBZZkh4OXVpellrSklUYmF2THg4Y0hObXpkYk5mZ1JFVHQzN2p6dzBLRkRtSnViaThuSnlmVXFBSFBsSjdXcEUxN2F0bTJMRW9rRWMzTnpNVE16RXhNVEV5MmZBT2o2SW1NRllCeGNJb0huN1drTDBEaTR2cjYrbUp1Yml4a1pHZGk3ZCs4NVFta0ZmbElTR0QxNjlMTHQyN2RqVGs0T2J0cTBDWDE4ZkRBd01CQ2xVaWtHQmdhaWo0OFBidHEwQ2JPeXNuRDU4dVZXQy83cTZtckQ2NisvUHIrc3JBeHpjM05Sb1ZCd3kxVEtDMUlBNXNwVG1xU01GWUFnQ2NCWUFaRHN0clRndG1yVkNqZHUzSWc1T1RuNHlTZWZHS3d4NlJzaUFXOXZiL1R4OFVGdmIrOUdBWDZLUTA1T3psNjlYbzlyMTY3bEN0V1dOa2tSWGdTdEFJS0Nna3prRlcwRkVnazhiMDlySzJMNkRoMDZvRlFxeFZtelp0RXlvTXJGeFNVZXJkVDRKTEJ4NDBhTWpvN0dqUnMzTmdyd0l5TDYrdnAyT1g3OGVIVitmcDdhQUNrQUFDQUFTVVJCVkQ1KzhNRUhLSlZLdVdZMXFnRlFucGdyVDJrTGtKYXBRVUZCd2lNQXBWS0pFb21FSzdBUW8xbEtjR21MSlRnNEdFTkRRMUdwVkdKV1ZoWU9IejU4MFcrLy9mWjZZeUVCZXU3R0FQNmlvcUxlczJmUFhuN2d3QUZVS3BYWXJsMDdyZ2JDZjhXNE9TY3BZN3lFaElTZ1JDSkJwVktKR1JrWndpSUFVZ0JVWmFhdFFITUZsenh0c1JERHRtclZDdFBUMDFHcFZPS0dEUnN1Tm0vZVBCeXQySWdFdG0zYmhwbVptYmhzMlRLckJ6OGlvck96YzhUeDQ4ZXYwRHNDU1A2VFFyVzAvS1RMUUlLQ2dvUkpBTVlLZ0pwTWFJMUZTdUI1ZTJKNFlsaDZlY21vVWFOUXFWUmlkblkyamg4L1BoVUFQQm9CQ1N4WnRHZ1I5dS9mZjRtMWd4OEFGRjk4OFVWYWVYazVLcFZLSERGaUJQZlNEZU1PU2NvUGMrVW4xYWdJTDRKV0FGUmxibWlOWlM1UERFdkxnTFp0MjZKVUtzWGx5NWVqVXFuRTNidDMzd2tJQ09pUFZtNEE0QkVWRmRYUDJza09FVEVzTEd6QXI3Lytla2VsVXVIeTVjdE54cDNrUHlrQWMrY252MFlWR0Jnb1hBVVFIQnhzMG1sR0RNdHZRMzFlbnY0K0JabGtWdXZXcmJGTm16YW9WQ294TnpjWDA5TFNmbXJhdEdsN1pDWjRrOHZsSFE0ZVBQaExTVWtKS3BWS2JOT21EZGNIUWZLZkppZEx5RTlqdkFRSEJ3dExBWXdmUDM2MVJxUEJuSndjVGdId1paYTVna3VlbUo1a0ZqRnR5NVl0TVNVbEJYTnljakEzTnhjLyt1aWpIR3RxRDI2TUJnQUJtelp0eXY3KysrOVJxVlJpU2tvSzE1OUN5cFRPUmxCZW1Ecy8rY3ZUd01CQXpNbkp3ZDI3ZDJPZlBuMkVRd0FTaVlTN0dKVDJXVWwrRTlPWnk1TUNvR1VBOVZ5M2J0MGF2L3JxSzh6SnljSDgvSHg4NzczMzFzSnpmcWtsczZjR2Z2L2x5NWV2TzM3OE9PYmw1ZUhDaFF1eFZhdFczQmtWWS9sUCtXRHV2Q1I4VUo5S216WnRVQ0tSQ0pNQUFnSUNIbEFBbGhCazh2UjVLTmpVZE5HaFF3ZGN1WElsS3BWS1ZLbFVPR1hLbEZRQThHT1FFaFQ0L1JZdlhwejY4ODgvWTM1K1BxNWN1Wks3WElQVy9qUXBXV3Bla2dJSUNBZ1FyZ0tvYjYxbHpIVG04dlE1YUJsQXRRQmFjMFZHUnVLcVZhdFFxVlNpV3ExbUpDQkE4Sjg0Y1FMejgvTngxYXBWR0JFUndkV2tqUE9SeHQvUzhwSzJxRnUzYmkxY0JkQ2lSUXRPWGhzSDI5eEJKazlNeXljQmtsMFJFUkdNQkt3SS9MUWNwYjRVR25mS0EwdkpTK043R2FSU0tiWm8wVUpZQktCV3F6RTdPL3VoQ3NCU1BQODhQTWt1WXQ2SWlBaE1UMC9Ibkp3Y1ZLbFVPSG55WkVZQ0FwRDllWGw1bUo2ZXpvR2Y4cEFLZi96N0VDd3RML2tLSURzN0czZnQyaVVzQWlBRndMK0V3dEtDVFl4TGEwSStDWVNIaHpNU0VDRDR3OFBEVGNCUHRTZ2FaNzc4dHhSdmZEa0xLUUJCRW9CRUl1SGFMVWwyRWVOYW1xZWdFL09TL0tLcU1TTUJZWUtmOG8vR2s1UW9Yd0ZZbXFmbEtPV2ZWU2dBZnRYVlVqek5CSThpZ2JDd01FWUNBZ0IvV0ZqWVk0R2ZYd093RkU4NHNRb0ZVRi9UaFNWN0NqNHhNQTBDSXdGaGdwL0dqeFFvWC81YnFqZHVUaE9jQWxDcFZKaVZsWVgrL3Y3Y3RWTTBzMXB5MEdsbWFJZ0VhRENJQkxLenN6RS9QNStSZ0lXQm55YWRoc0RQVndDVzVna25kRlRaMzk4ZnM3S3ljT2ZPbmNJaUFPUEJvQUtNcFFlZmtZQ3d3SitibTJ0VjRPZnZSbEcrQ1pJQS9Qejg2bTIrb0llMFZFL0pRcCtYNUJnZHphUkJDUTBOWlNSZ0FlQ25WMmpUdU5ETVNjdE9Ha2MrQ1ZpcXB4b1VOYVg1K2ZrSlZ3SFFwU0RVRENTVVFYZ1VDUVFGQlRFU3NDRHcwM2dJSGZ6ME9hbHdTYzhsYUFYQTc4Q2loN1IwVDhsRG41dGtHVEV6SXdITEFqOHBUVnB1MHJqeFNjRFNQYjhqMVNvVkFDTUJaZ3o4RFh1clVBQyt2cjRtQ29Bdnk0VGlLWm5vODlQZ0VFTUhCZ1p5cHdnWkNUeDc4Tk9wUG9vNzVSZE5NalJPZkJJUWlxZmxKdVdYcjYrdmNCVUFYUXBDelVCQ0d3eEdBZ3o4NXZDMGkwSFBLUmdDZU9PTk4xYm41K2ZqbmoxN09BWEE3OFhtdjVOT0tKNlNpNTZEQm9uT0RBUUVCSEFra0phV2hsbFpXWmlYbDhkSTRDbUFQeTB0alFNL3habnlpaVlYR2hjK0NRak44OCtpK1ByNjRwNDllM0RIamgyWWtKQWdIQUtnd1RKdUJoTHFvRHdwQ2JSdjM5NkVCTjU5OTExR0FrOEkvcDkrK2dtVlNpV21wYVZoKy9idEd3WDRqVi9VU3BlQlNDUVNZUktBajQvUEF6M1p4b01rVkUvSlJzOWovSUpOUmdMUEQvdzBxZEE0OEVsQXFKNS9Cc1hIeDBmNENvQnVCeGI2NERBU1lPQi9IcDUyTmF4S0FaQmNzM1lTSU9adTBhSUZJNEduQUg2S0krV1J0WU9mZndCTjBBcUFqZ1JUdFpZS0hOYmlTYTdSb0JGekc1T0FXQ3htSlBBUHdDOFdpeDhBUDhXWDRrM3h0N2E4SXJ6UTh3dVNBTHk5dlUwT2FOQU0yZGhJd04vZkg4VmlNYlpyMTQ2UndHT0F2MTI3ZGlnV2k5SGYzNzlSZ3A5d1FtY2J2TDI5aGFzQTZFZ3dyZDFvMEt6TlUxTFM0Rkd5MGlENitmbWhXQ3pHa0pBUVJnSVBBWDlJU0FpS3hXS3VqWndtRDRvbnhaZFBBdGJtQ1M5RWdvSWtBQzh2TDVOMllCckV4a0lDSk9Pb25kUEh4d2ZGWWpHMmFkT21QaEx3YldUZzkrV0R2MDJiTmlnV2k3bmFFZVVOeGJHeGdKOXdRbm5qNWVVbFhBWGc1K2Rud21nMGVOYnVhUkRwdWFtYTYrbnBpV0t4R0lPQ2dqZ1N5TXJLd29rVEp5NXBUQVR3elRmZkxQbnh4eDg1OEFjRkJhRllMRVpQVDArVDNTT0tIMS8rVzd1bjV5WWxaRlVLb0xHUkFIOFo0T2JtaHA2ZW5yaG16UnJjdlhzM0xsbXlCQWNOR3ZSVll5S0FOOTk4ODZ1dFc3ZGlSa1lHcmxtekJqMDlQZEhOemUyaDhyK3g1WTFWS0FCZlgxK3VJR1lzNDZ6ZEd4Y0NqYXU1Q29VQ3ZieThPUEF2WHJ3WSsvWHJ0eFFBZkJyWkVzQm41TWlSU3pkdjNzeVJnSmVYRnlvVUNwUGRJMzRCc0xIa0R6MDN0ZE1Ma2dCSXp0R0JJUDVhcnJHQW53NTBlSGw1b1plWEY2NWR1NVlEZjkrK2ZaYzF0dlcvY1IwZ09UbDVHWkhBMnJWcnVSZ1o1MDFqSXdIQ0NlV05wNmVuOEJVQVg4NVpxNmZCbzZTbHRiK1BqdzhEL3hPUUFCVUNxUlpBOGFUNFduc2VFVjZzUWdFMFZOQmg0Ry9jNEdja1VMK3ZyM0FzV0FYZzQrUERGVFNzZWZBWStCa0pQTTA4SXJ6UTh3dVNBSXdMT3NZZFhmU1ExdUtKc2Fuemo4RHY3ZTNOd1A4VVNJQTZTaW11bEVjVWQydkxKLzVaRW9WQ0lVd0NlRmhUQndNL00wWUNEWHQrODVnZ0NjRER3NE5yQnpiZTE2VkJFN3FuSktSOWZnYis1MHNDbEU5OE1oQzZwM3dpM0hoNGVBaFhBZENnMFpZT0F6OHpSZ0tQOXJRRjZPM3RMWHdGUUoxZHRBeWd3UktxcDZRam1VWnJOYmJQLzN6N0JDanVsRmQ4TWhDcXA3d2kzQWhLQVJqZkNteXNBUGhWWEdzRi83cDE2ekFqSXdPWExGbUMvZnIxWStCL0NpUXdjdVRJWlZ1MmJNSE16RXhjdDI1ZG95QUJZMFVwRm91RmVTMjR1N3U3VlNrQVNpNlNaN1JHWStBM0x3blFPTkF5VStna3dGY0E3dTd1d2lRQXNWaHN3dFRHZ3lNMFQrVEZCNytucHljRHZ4bEpnSnJOK0NUQVZ3UkM4OGJLMG1vVUFKK2hHZmlaTVJKNDBGT2VXWVVDTUI0YzQwRVJpcWRrb2pVWkRRcWQ2bVBndHd3U29LWXpHaCtxT2ZISlFDamVlSklSckFKd2MzUGpEZ1FaRHdvRFB6TkdBZzE3eWpmQ2padWJHMU1BRFB6TUdoTUpXSTBDTUc0SEpqQlJsZE5TUGEzQnFCRERCLy9hdFdzWitDMlFCS2hQZ0U4Q05JNDBycGFlZjhZSHllZ0dLVUVSZ0ZxdHh1enM3QWNVZ0JBRzRWSGdYN2R1SFdabVp1TFNwVXNaK0MyRUJFYU5HclZzNjlhdHVHZlBuZ2FWZ0ZCSW9MNUNzMWdzeHV6c2JOeTFhNWV3Q01EVjFkV2tHWWcvQ0pibWlYa3ArTFFHWStBWE5nblFPTks0MGpoYmFoNFNUcWdKeU5YVlZaZ0VZS3dBak5ka0RQek1HQWs4UEE4SkwxYWxBUGpCdHhSUGpNdkFiNTBrUUdkUytDUkE0MjVwK1VpZnp5b1VBSitCTFMzb2ZQQlR3ZExEdzRPQjN3cEpnTWJYVWttQVBvL3hKTVFVZ0JsbWZrOVBUd1orS3lJQlQwL1BCcGNEbGtZQ2dsY0FHbzBHYzNKeVVDd1dQNUo1emUxcHJVV2ZUNkZRb0xPek02NVpzd2IzN05tRHk1WXRZK0FYTUFsczI3WU5zN0t5Y00yYU5lanM3TXlSQUkwM2Y1ZkEzTDQrSlNvV2l6RW5Kd2QzNzk0dExBSndjWEV4T1JCazZjRldLQlJvWjJlSFM1WXN3VDE3OXVDS0ZTdndwWmRlU2dmMkdtK2hrb0RmMkxGajAzYnMySUhaMmRtNFpNa1N0TE96ZTRBRUxIVlNvb05BTGk0dXdpUUFTMVlBZk5sUDFkWXBVNlpnZG5ZMnJsNjlHcE9Ua3pNQklJQkJTZEFrRVBEdXUrOW03TjY5RzdPenMzSEtsQ2ttdTFNTkxRZVlBbmlLQ3FDaFlKdkxFOFB5d1I4VEU0UFoyZG00ZGV0V2ZPKzk5NDdiMk5pMFpSQVN2dG5aMmJWZHRHalI4VDE3OW1CT1RnN0d4TVNZS0ZQS0E4b0xjK2NuUHk4RnJRRG9TREFWQWkwdHlKUUU3dTd1dUdUSkVzek16TVN2dnZycWprS2g2TmNJWmtkRmNuTHlZQUJRV1B1enRtalJvdC8yN2R2dlpHZG40N2ZmZnNzZFZPT1RnS1ZNVG9RWGQzZDNZU21BQ1JNbXJOWnF0YWhVS2h0VUFQU1E1dkwwT1l5RDNMZHZYOHpKeWNHMWE5ZGkvLzc5VndLQWg3V3ZqNWN1WGJyeTExOS94ZmZmZjMrbHRkYzVBTUJqNHNTSnFWbFpXWmlUazRNSkNRa1BURTZXbHAvR0NrQ3BWR0pHUmdZbUppWStWUUtRUGtzMnVINzlPcmk0dU1ERml4ZEJvVkRBK2ZQbndjdkxDODZkT3dmZTN0NW04VjVlWG5EKy9IbFFLQlJRV1ZrSnJxNnVjT1hLRlJnMmJCalUxdGJDSDMvOGNWR24wNjFBeEF0Z3BTWVNpZndYTDE0OE15RWhJYVdpb2dJU0VoTGV2SC8vdmtna0V2a2o0bGxyZkdaRXZPRGc0QkRSbzBlUGw1czJiZXIyeWl1dmdGNnZCemMzTjZpc3JBUlBUMCtMeWs4UER3KzRjT0VDdUxpNHdOV3JWNTlaWE1UUE11aE9UazV3OWVwVmNIZDNod3NYTG5CQk5sZHd2YjI5NGZ6NTgrRHA2UW1WbFpYZzd1NE9WNjVjZ2M2ZE80T3JxeXZjdW5VTGlvdUxOLy84ODg4eDFnNyt4TVRFbERObnprQk5UUTNVMXRaQ1VsSlN5cFFwVTJhS1JDSi9hMzMybkp3Y1Y2MVd1eDBBd01QREErTGk0dUR5NWN2Zzd1NXVRZ0tXa0o4WExsd0FkM2QzdUhyMUtqZzVPUW1UQUVnQlhMcDBpWnR4aVdITjVRbjhDb1VDTGwyNkJNN096aEFSRVFHSUNOZXVYYnQ3Nk5DaDNZR0JnV3NhQS9qUG5Uc0hjK2JNZ1FzWExqUUtFbmpoaFJkMGVYbDUyd0hnSGlKQ2VIZzRPRHM3bStTbnA2ZW5XZlBUeTh2TEpEOWRYRnpnK3ZYcndpTUFrVWpFS1FBM056Y1RCVUF5eHh5K3NyS1NrMWV1cnE1dzdkbzFpSTJOaFpxYUd2alBmLzZ6LzhhTkczOVlLL2lYTEZreU15a3BLZVhzMmJOdy92eDVtRDkvUGh3K2ZCam16NThQRnk5ZWhQdjM3MFBmdm4xVDNudnZQYXNsZ1V1WEx2MyszLy8rOTRCWUxJYlkyRmk0ZHUwYXVMcTZ3b1VMRjhERHc0T2JwTXlacDZRQTNOemNPQVVnRW9sQUpCSUpVd0Zjdm56WklvTjc1Y29WYU51Mkxjamxjcmh6NXc0Y1BYcTB1TGEydHRSYXdXODg4My8yMldkdzl1eFpjSEJ3Z0xObno4Sm5uMzFtb2dTc2xRU3FxNnMzR1F5R0VvbEVBaTR1THRDNmRXdTRjdVdLUlU1U2x5OWZGcTRDTUs0QnVMbTVtUlFDS2NqbThNYkJkWFoyQm05dmIwQkVxS3FxZ25QbnpoMlFTQ1F0ckIzOEN4WXNnSXFLQ25CeWNvSmJ0MjZCazVNVFZGUlV3SUlGQzZ5ZUJHeHNiTHFmUG4zNm9Fd21Bd0FBYjI5dmNIWjJoc3VYTDVzc0E4eVpwd3FGQWk1ZXZHaWlBQVJiQTZEZ0doY0NLY2ptOEI0ZUhuRHg0a1ZPL29lRWhBQWl3cDA3ZDI2ZVBYdjJUR01BLytuVHA4SFoyUmx1M0xnQkxpNHVjT1BHRFhCMmRvYlRwMDgzQ2hJNGZQandmeER4THdDQWtKQ1FlcGNCNXN4VEtnRFNKQ1U0QlVCckZVZEhSeTY0L0VLTE9id3hzMTY1Y2dXY25KekExZFVWRUJIKy9QUFA4d0JRYlkzZ1AzdjJMSnc3ZHc0Ky8veHpxS2lvNEpLS1NORFYxWlVqNjRxS0N2ajg4ODg1RXJEU21rRFZuVHQzem92RlluQnhjUUVuSnlkdUdVQksxZHg1ZXVuU0pXNThIQjBkbjFrZ3BNOHdBYm1aNWNxVkt4YWxBSXozVjUyY25HZ0pjQk1BYXF3Wi9EVHpFK2dwNlM5ZnZzejltNVRBNTU5L0RqTm56Z1NGUWdGOSsvWk4rYnNJWlMxOUFqWFYxZFUzYkcxdE9mS2pXcFZDb2JDSVBIVjNkK2QycWE1ZHU4WVZBWjkySWZDWk5nTEo1Zko2RllDNXZMSDhKd1ZnYTJ0THhhRy9BS0RPR3NGUHN0L0p5Y2tFL0NRektkbU00MExMQVNLQnBLU2tGUHI5VmtBQ2RmZnUzYnNqRW9sQUpwTnh0U3BYVjFlNGVQRWl0d3d3WjU3U0x0V1ZLMWRBTHBjTFR3RUFBTnk4ZWJOZWVYWGh3Z1d6ZVhkM2Q3aDQ4U0xIckJLSmhJQ0QxZzUra3YzVW5HVU1mdnAzWXlFQmlVUWlFb2xFSUJhTHVlWFBsU3RYdUVuQzNIbEt5b3pHVFRBMUFHT3BJcGZMdWFTanJVQnpCdFhEdzhOa2JlWGs1QVIzN3R3QnNWZ005dmIyOXMrNktQbzh3SitVbEpUeTMvLytGODZmUC8vRTRLZk9NNUxGeGlSZzNDY3dkZXBVb2RjRUpIK1BOOXk1YzhkRUdWMjZkTWtpOHBUSStQcjE2eUNYeTU5Wkg4QnpWd0FVWEhONEtnQWFyNjF1M2JvRllyRVk1SEs1Q3dESWhBNSttdmsvKyt5emVzRlB6MjhNZm1QUHJ3a1FDWHoyMldjd2E5WXNyaVlnY0NVZ2xjdmx6dFhWMVhEcjFpMFRCVUFLMFJMeVZKQUtnRjhETUM2d0dBZlhITjVZNXBJQ09IdjJMSWhFSW5CMGRQUUNBRHRyQVAvOCtmTk53RThGVDBxcWhzQlA4YUg5WjJwQ0lSS1lQMysreWU2QVVKV0FXQ3h1MHJ4NWMwOUVoUC8rOTc4bUNzQ1M4cFRpTC9nYUFNbEtrbGZtREM3TmdBU0s4K2ZQZzBna2dpWk5talFQRGc0T3NnYndVNU1QZ2YvYXRXc1BnUDloeVdlc0JJeDNTeW9xS21EKy9QbncwVWNmQ1ZvSmRPdldMVmdrRWpXcHE2dURjK2ZPY1hFaUJXQUplV3Fzd0FUWkIyQmNBekFPcnFVb0FFcnE3Ny8vSGtRaUVkamIyNE9mbjEvSGUvZnVGUXQxemYrL2dwOXFKTVpLNE5xMWF5WktnRWlBYWdMOSt2VkxlZi85OXdXakJHN2Z2cjBoT0RpNDQ3MTc5MEFrRWtGNWVibkpKRVcxS25QbjZaVXJWMHdVd0xPcUFUeHRjNWs0Y2VKcXZWNlBLcFVLUlNJUmR5a0kzV3hDbHh5WXk5TWRhM1JsdVpPVEUyN2F0QW56OC9OeHdZSUYrMEFBRjJNQWdOK1NKVXRTZi8zMVY5VHBkTGgrL1hvTUNnb3lpVGU5bUpXZWwrNlhmOXc0MGZmVHo5UHZjM0Z4UVpGSWhFRkJRYmgrL1hwVXE5VllVRkNBNzcvL2ZxcEFZdWV2MFdnT0ZCVVY0Wm8xYTlESnlja2tIK2g1eloybmhCZUt0MHFsd3V6c2JFeEtTckxzRzRHTUNjRFIwZEVrdUUrYWhNOGp1SFFScUVxbHdoMDdkdHhUS0JUZEdqdjRyWmtFV3JaczJlUG5uMyt1MFdnMCtLOS8vY3NrRHl4bGtxSzRFMjRjSFIyRlJRQ0ZoWVVXcXdBb3VNYkpIQklTZ2lxVkNuTnpjM0hzMkxFcnAwNmQydHFTd1gveTVNbG5EbjVySkFFQThQajg4ODlYSHp4NEVGVXFGYlp1M2ZxQnVGbmlKQ1U0QlZCWVdJaHF0ZHBpRlVCOXk0Qmx5NWFoV3EzR2JkdTJYWFYwZEl5eVpQQVhGQlRnaGcwYm5qbjRuNFFFTm16WWdCcU5CdlY2dmNXU2dKZVhWK3lKRXlldUZ4UVU0TGZmZm11eDhyOCtCYUJXcXpFbkp3Zjc5dTBySEFJUWlVVG83T3hjTDhPYTJ4c25zVmdzeHY3OSs2TmFyVWFWU29XVEprMWFCd0NlUWdBL3haZVNoV1lPUGduOHI1NStILzErK252T3pzNkNJQUVBOEZxMmJObVdRNGNPb1ZxdHhuNzkrcG1NdjZYbUo4VlhrQVFnbDh0Tmd2eTBrL0ovVFdaS1lwckpGaTFhUklHdWF0T216Y3NNL05aREF2SHg4Y05PblRwMVQ2ZlQ0VmRmZmZWWXlzbmMrVW1mVHk2WEM0Y0FVbEpTVmhjVkZhRkdvN0ZvQmNCUFlpY25Kd3dLQ2tLVlNvVmFyUlkzYmRyMEg3bGNIbTRKNEQ5MTZoVHE5WHF6Z3Y5SlNVQ3IxV0poWVNGT216Yk43Q1RnNGVFUjljTVBQMVRzMjdjUDgvUHpzVVdMRmcvSWYzb2VTMVVBOUs0TlN5Y0E1NGtUSjNJRVlLa0tvQ0VTY0hSMHhOR2pSNk5HbzBHZFRvZWZmLzY1Uml3V3Q3UWs4Rk5TbUFQOGowTUNZckhZb2toQUpwTzF6c25KS1R4eTVBaHFOQnBNVGs2MmVQRHpGWUNUa3hOcU5Cb3FBcVlCZ0xQRkVzRDQ4ZU5YRWdIWTJOZzBXR2l4Rk0rdkJUZzVPZUhYWDMvTnlkaVBQLzU0QndBRVBtZnd0MWk2ZEdtYU1mZ0RBd081ejFmZjJ0V1M0aWNXaXpFd01OQ0VCS1pQbjU0R0FDMmVaeHdsRWtuTFRaczJaZno0NDQ5RTZGeGgybExpMTVBM1ZxWjJkblljQVNRbUpuNW55UVRnTkc3Y3VFVUdnd0cxV2kzSGFQeXRRRXNKTW44R284L3A3ZTJONmVucHFOVnFzYWlvQ0QvLy9QTXNHeHViNE9lVXRLM1dyRm16N2VUSmsxaFlXSWdiTjI1OEpQak5GVmY2dXc4amdZMGJONkpPcDBPRHdZQno1c3paSmhhTFd6MlBPTnJiMjRmczJyVXI3OFNKRTFoUVVJRHA2ZWttYjl0OW1JS3lsTHlrejZsUUtGQ3IxV0pXVmhZbUpDUXNBZ0FuaTBTL3I2K3Y0NnV2dmpxL3VMZ1l0Vm90dXJtNVBaQzBscW9BK0RMVzE5Y1hWNjllalZxdEZnMEdBMjdZc0dHL241OWZ0NnRYcjM3NkxCTDJyNy8rV3QraVJZdE9HbzJtK01TSkU2alg2M0hqeG8yYzdMYzA4RDh1Q1FRRkJabVF3T3JWcTB1OHZiMDczNzU5ZS8yemlPTnZ2LzMyZXBzMmJYcVVscForLytPUFAzTGc5L0h4cVhmNVpLa0t3RGlPYm01dXFOVnFNU01qQTN2MjdEbmYwOVBUMFNJSm9FdVhMczJIRFJzMnZhU2tCTFZhTFhibzBNRWs2SmJHdEk4aUFSOGZIMHhOVGVXVVFGRlIwZVVSSTBaTWU5cExBZ0FJR0QxNjlMdi8rYzkvTGh3K2ZCaDFPaDJtcDZlam41K2ZSWVAvY1VuQXo4K1BVMVFHZ3dFTEN3c3ZEaG8wYURJODVWZXZBMERRdi83MXI1bG56cHk1OXYzMzM2Tk9wOE1WSzFhZ3Q3ZTNvTUJQOGFUUEd4b2FpbHF0Rm5mdTNJbGR1blNaSGhNVDA5eFNDYUJwMzc1OXgrM2R1eGUxV2kxR1IwYy9zT1lTR2dsNGVIamd0R25UVUt2Vm9sNnZ4LzM3OStPdVhic09KQ1FrakFHQXdPcnFhc00vU2RiYTJ0b0tBQWpvMjdmdnlNTEN3dExmZnZzTjkrN2RpenFkRGovNTVCT3VLY1RTd2YrNEpPRHA2WWt6Wjg3azRuamd3QUhjdm4zN3ZwNDllNDRHZ0lCL0dzZS8vdnByUFFBRURoa3k1STM5Ky9jZk9uWHFGTklFTkhueVpPN3pDUTM4RkQ5SFIwZU1qbzVHclZhTDI3WnR3K2pvNkhFZE8zWnNhcWtFWUJzYUd0cTdyS3dNZFRvZERoa3lwTjZ0UUVzTCtxTklRQzZYWTgrZVBYSDM3dDJjbEQxMDZCQnF0ZHBqNDhhTm0rdnQ3ZDBKQUZwTW5UcTFkVzF0YlVWRHlUcDE2dFRXQU5EQ3k4c3I5czAzMy96azRNR0QzNTg1Y3dZUEhqeUlCUVVGbUptWmlRTUdET0IyVCtqdld6cjRIMFVDeG5GTVRFekVqSXdNMU9sMFdGeGNqSDgzNWh3ZU4yN2NuTWVKNDkvRTZRRUFnUUVCQVYyblRKbXk0Tml4WXorZVBuMGE5Ky9mandVRkJUUlRQaEJIU3djL1B3OXBDM0RJa0NHbzFXcHg0OGFOR0JBUTBMdGp4NDYyVCsxVTZkTWtnTTZkTzhzT0hEalEybUF3SExwNzk2N3RqaDA3WVBmdTNkekxKK2htR3VQYmFDM04wL2wzdWpISTBkRVJidHk0QVE0T0RsQlRVd052dnZrbTlPclZDMlF5R1VpbFVtamF0Q25ZMjl2WDNMeDU4MVJwYWVteGlvcUtVOWV1WFR0WFUxTno1OGFORzM4Nk9UazFsOGxrZHM3T3pwNHRXN1pzblpDUUVPN282Tmo2OXUzYk5qZHUzSUM3ZCs5Q1RVME5HQXdHU0UxTkJaRklCTGR1M2VMK0xuME8rbHlXSGovNmZBK0xZMTFkSGFTa3BFRFBuajFCS3BXQ1RDWURlM3Q3a3ppZU9YUG10MnZYcnAyN2QrL2VYNGg0WHl3V1MrenM3SnE1dUxqNEJBY0h0K3pSbzBkNHMyYk5BbS9kdWlXOWVmTW1WRlZWd2QyN2R5RS9QeDgyYk5nQU5qWTJENDJqcGNlUDhPTGc0QUJEaHc2RjRjT0h3NWt6WjZwVFVsSWlPM2JzZU9yQWdRTlA1UVpyNlZNbWdMcDkrL1pWM2I1OSs2SlVLdlh6OWZXRm16ZHZncU9qbzhtOUFKWWEvSVpJZ0FaRExwZkRva1dMWU1lT0hkQ3JWeS9vMTY4Zk9Eczd3NjFidDJRU2lhUnRseTVkMnZidTNSdHNiVzFCS3BXQ1dDd0dSQVJFaEpxYUdxaXFxb0tiTjIvQ2xTdFhvSzZ1RG03Y3VBRWFqUWEwV2kzODhjY2Y0T0RnWUVLV1FnUC9vMGpBT0k3ZmZQTU43Tml4QXhJU0VpQXhNWkhlVXNURnNWZXZYdlhHOGQ2OWUxQlZWUVZYcmx5QnlzcEtRRVM0ZlBreTVPZm5RMUZSRVZSV1ZvSmNMdWN1bzZrdmprTEpQN2xjRGpkdTNBQmZYMStvcTZ1RFAvLzg4eUlpVnNmRXhOUWRPSERBOG00RXFxMnRyUU9BcWt1WExsWDQrUGo0K2ZqNGdJT0R3d00zQTFseThCK0hCTTZmUHc5WldWbXdjZU5HaUltSmdUWnQya0JrWkNTMGF0VUs3T3dhdmxXc3Vyb2FUcDA2QlljUEg0YVRKMC9Dd1lNSG9Ybno1dkRubjM4K01tbUZBdjRuSVlFLy92Z0RkdS9lRFd2WHJuMmlPTjY1Y3dkKytlVVhPSExrQ0p3OGVSSU9IejRNY3JrY2J0MjZKWGp3MTZjQWZIeDhvSzZ1RGk1ZnZsd0JBRlYxZFhVV2ZYMjl5MXR2dmJXeXNMQVF0Vm90MnRuWk5kaDVaYWxyc0lacUF2dzFMVDJYbzZNamlrUWlsTXZsNk9ucGlaMDdkOGE0dURnY01HQUF4c1hGWVpjdVhkREh4d2Vkbkp5NDd6UCtlZjVhbjc5V0ZVcThIbFVUZUpJNGVuaDRZS2RPblRBdUxnNTc5KzZOY1hGeEdCOGZqMjV1YmlpWHkxRWtFbkVGNXNlTm8xRGlWVjhUVUZaV0ZnNFlNQ0RWa3R1QWFSblFySC8vL204WEZ4ZGpRVUVCeHNiR21neU9VQWFEVHdKUGtzUVA4NCtickVLTEU0dmoweThBaXNWaWpJMk54WUtDQXR5MmJSdDI3Tmp4N2VqbzZHWVdUUUR4OGZFMkNvVWl0cVNrcExhZ29BQ1RrNU1mT0JNZ3RCbU5QNU05S29rZjVlbjcrZFY5b2MvNDVvcGpRNkFYYXA0Wm53Sk1UazVHblU2SHExZXZyblYyZG82TmlvcXlzV2dDbURKbGlnUUFBckt6czAvcTlYcGN2SGd4aWtRaWpyR0ZPclBSNER3cWlmbkp6RS9TUnlXcnRZS2Z4ZkhKRkFBdEZ4Y3ZYb3hxdFJvLy8venprd0FRTUhIaVJJbEZFOENrU1pORUFPQTJmZnIwRFZRSDRET2IwTmUwajByaXgvVU4vVDVyQlQrTDQ1TXBBSGQzZDlScXRaaWRuWTNEaHcvZkFBQnU0OGVQdC95cmdXTmpZNXYxNmRQbkRZUEJnSHE5SG52MTZ2WEE5V0JDVC9hR2t1NmZlbXNIUFl2amt4VUFIUjBkc1ZldlhsaFFVSUNiTjIvR2lJaUkxeU1qSTV1QkVLeGp4NDR5ZTN2N2RscXQ5cnBlcjhjRkN4YlV1d3l3bHVSbm9HZHhmSnExRVpML0N4WXNRSjFPaDB1WExyMXVZMlBUTmlJaVFoaXZybnZycmJkRUFPQzVZTUdDTExvZWpIL0t5ZHFxM013ei96VHZWZkR3OEVDMVdvMUtwUkxmZU9PTkxBRHdmUDMxMTBVZ0ZQUHk4bXFlbUpnNHNhaW9DUFY2UGZidjM5L3FsZ0hNTS8rczVILy8vdjFScjlmajVzMmJNU29xYXFKQ29XZ09RcktCQXdmS3hHSng2OXpjM01yQ3drSk1TMHN6V1FZd0VtQ2UrZnFiZjBRaUVhYWxwYUZXcThXdnYvNjZVaVFTdFU1S1NoTFdtNnNuVEpnZ0FnRFhkOTU1SjdXd3NCQ0xpb293SmlhR0xRT1laLzRSOGo4bUpnWUxDd3N4SXlNREJ3OGVuQW9Bcm1QR2pCR0IwQ3c2T3RyT3o4K3Z1MWFyclNvc0xNUjU4K1lKdmltSWVlYWZkZlBQdkhuenNLQ2dBRmV1WEZubDd1N2VQU3dzVEhDdnJRY0FnSWtUSjRvQndHdisvUGxaZXIwZWk0cUswTi9mbjlVQ21HZStnYlcvdjc4L0ZoVVZZWFoyTmhYL3ZNYU1HU01Hb1ZwVVZGVFRzTEN3Z1FVRkJiVkZSVVU0Zi83OHg3clhubm5tR3hQNGE2dXlRZ0FBQ210SlJFRlU2ZktQK2ZQbm8xNnZ4OVdyVjljR0JnWU9EQXNMYXdwQ3RuNzkra2tBd0dmaHdvV3F3c0pDTkJnTTNGMkJRcm5waG5ubW44Zk5TUjA2ZEVDRHdZQTVPVG40NXB0dnFnREFKeUVoUVFKQ3Q4akl5S1p0MjdidHI5Rm83aFVWRmVHWFgzNzVRQzJBRlFTWmI4eUZQN2xjamw5KytTWHE5WHBNUzB1NzUrL3YzejgwTkxRcFdJTzkvdnJyWWdEd21qVnIxazY5WG84R2d3SGo0K01GYzJFbzg4dy82NHMvNCtQajBXQXdZR1ptSm80Wk0yWW5BSGlOR2pWS0ROWmlFUkVSVFR3OFBPS1ZTdVYxZWxCN2UzdldGOEI4bzkvM3Q3ZTN4OHpNVE5UcGRMaDQ4ZUxyenM3TzhlM2J0MjhDMW1Sang0NFZBNERycUZHajVoWVVGS0RCWU1BWk0yYXdnaUR6amI3d04yUEdEQ3dxS3NJdFc3WmdRa0xDWEFCd0hURmloQmlzemY3dVpncE1UVTB0THl3c3hPTGlZdXpTcFFzckNETGZhQXQvWGJwMFFZUEJnRXFsRW1mTW1GRU9BSUU5ZS9hVWdiV2FoNGRIczZDZ29MNUtwZksyd1dEQWpJd003czB0akFTWWIwemc5L2IyeG95TURDd29LTURseTVmZjl2YjI3dXZtNXRZTXJObitYZ3E0alJneFlnNjlIR0x4NHNXQ2V3a0c4OHovcnk5TFdieDRNUm9NQnR5MGFSTW1KQ1RNQVFDM1YxNTVSUXpXYm9tSmlUSUE4Sjg3ZDY2cW9LQUFpNHVMY2NLRUNRMXVEVElTWU42YXdDK1h5M0hDaEFsWVhGeU1HUmtabUpLU29nSUEveDQ5ZXNpZ3NWaFlXRmdUSnllbjhQWHIxNThxTEN6RWtwSVNIREJnZ0dEZWhjYzg4Ly8wWFlrREJnekE0dUppek12THcwOC8vZlNVZzRORGVMdDI3WnBBWTdJeFk4YUlQRHc4SEFJQ0F2cGxaR1JjLy91dHNkaTVjMmRHQXN4YkxmZzdkKzZNZXIwZU5Sb05MbHEwNkxxWGwxYy9OemMzaCtIRGg0dWdzZGxycjcwbTl2RHdjSTZOalIyYm01dGJWVnhjakRxZERxT2pveGtKTUc5MTRLZTMvT3IxZWt4TlRhMXEzNzc5T0RjM04rZEdzZTUvU0QxQUFnRHVMNzMwMHZUYzNOeWE0dUppMUdnMEdCRVJ3VWlBZWFzQmYwUkVCR28wR3U2Z3p3c3Z2REFEQU54NzlPZ2hnY1p1aVltSlVnRHdIRDU4K0NkNWVYbjNpNHVMVWF2VllseGNIQ01CNWdVUC9yaTRPTlJxdFZoWVdJaHIxcXk1MzZkUG4wOEF3TE5Iang1U1lQWi8xcWRQSHhrQWVJMFlNV0t1VXFtOFQ2OFc2OTI3OXdObkJ2Z2RnNHdNbUxlRVc0ejVMek54ZEhURTNyMTdZMEZCQWVyMWVseXpaczM5cEtTa3VRRGcxYWdxL2s5S0FvTUhENTZabloxOXI3aTRHRXRMUzNINDhPR01CSmdYSFBpSER4K09wYVdsV0ZCUWdPbnA2ZmQ2OWVvMWs0SC84VWhBMGFOSGowbTdkKysrYlRBWXNMUzBGR2ZObW9VS2hjTGszWERXOGhaZDVxM2pyY2VVbHdxRkFtZk5tb1dscGFXbzBXaHcrZkxsdDJOalkvLzFkMTR6OEQ4R0NVZ0J3TFZObXpiRE5tN2NlRkd2MTJOcGFTbXVXN2NPUTBKQzZuMUJaR043eHg3emx2Rk9RLzRMVFVOQ1FuRGR1blZZVWxLQ09UazV1SERod29zQkFRSERBTUNWcmZtZndGNTk5Vld4dTd1N280ZUhSNWV2dnZxcVhLMVdZMGxKQ2VwME9od3pab3pKRmVNTnZTV1drUUR6ejNMR055NzBpVVFpSERObURPcDBPalFZRExoanh3Nzg0SU1QeWwxZFhidTR1Yms1TnVxdHZ2K1JCSnJLWkxMV0V5ZE9YTHRuejU1YVdoSjg5OTEzNk92ciswQnRnQ2tDNXAvSGpHKzgxdmYxOWNYdnZ2c09TMHRMVWF2VjR1clZxMnRIakJpeFZpcVZ0blp6YzJ2S3dQOC8yT2pSbzBWOSt2U3hCUUN2Nk9qbzE5ZXNXWE5lbzlGZ2FXa3BGaFVWNFJ0dnZNRU56cVBlRzgvSWdQbC9BbnIrakU5NTV1Ym1obSs4OFFZV0ZSVmhjWEV4Wm1abTRzS0ZDOCtIaG9hKy9uZXh6N1pSZHZnOXE3cUF1N3U3bzZPalkrUmJiNzIxUFRNejgzNVJVUkh1M2JzWGMzSnljT1RJa1NpVlNoOVlGand1R1RCU1lDOGlmUmpvamVXK1ZDckZrU05IWWs1T0R1N2R1eGMxR2cydVdiUG0vdWpSbzdjN09EaEV1cm01T2ZiczJaT3Q5NSsyalJvMVNoUWFHbW9IQUY2aG9hSEozM3p6elE5S3BSS0xpNHM1SW5qNTVaZE5ybHQ2SERKNEZDa3diNTJlUC80UEF6MzkvNWRmZnBrRHZsNnZ4eTFidHVEczJiT1BoNFNFakFRQTcvYnQyOXU5OHNvcmJOWi9scGFRa0NEeDhQQndBSUNnUG4zNnpFcE5UZjBqTHkrUEk0Szh2RHg4KysyMzBkWFZsYXNSOEpjSGZESm9pQlNZdDA3UEgzZCtYbEMrT0RvNm9xdXJLNzc5OXR1WWw1ZUhlL2Z1eGNMQ1F0eStmVHQrK2VXWGY3end3Z3V6QUNESTNkM2RvV2ZQbnF5dDkzbjNESGg0ZURqWjJkbTE3ZCsvLy95VksxZWV5OG5KUVlQQmdIdjM3c1Y5Ky9iaE45OThnd01IRGtSN2UzdU9ESWpSR3lLRmhzaUJlV0g3aHNhWjhvRHl3dEhSRWUzdDdYSGd3SUg0elRmZjRMNTkrN0MwdEJSMU9oMXUzYm9WRnk1Y2VLNVBuejd6YlcxdDIzcDRlRGoxN3QyYjdlMmJzMGlZbEpSa0F3RE9NcGtzdUZ1M2JoOHNYTGp3aDEyN2RxRk9wOFBTMGxKT3JuM3h4UmM0Yk5nd2RITno0eTRmb1VGL1hGSmdYdGllRDNieWNya2MzZHpjY05pd1lmakZGMStnWHEvSHZYdjNjdWYyMTY5ZmozUG16RG5lcVZPbkQyUXlXVEFBT1BmcDA4ZG01TWlSZ3BiN0ltc2lnaXRYcmtpUEhqM2E5TUtGQzA0aElTRlJuVHQzSGhZYkc5dkgxZFhWMGNIQkFXeHNiRUFzL3I4ZG1YUG56c0V2di93Q3YvNzZLMXk5ZWhWT25EZ0J0Mi9maG12WHJvRmNMb2RidDI2Qmc0TUQzTHAxQytSeU9keThlWk41Z1hvYVJ3Y0hCN2g1OHlZNE96dERzMmJOSUNRa0JGeGNYS0JObXpZUUhCd00zdDdlQUFCUVcxc0xkKy9laGF0WHI4TFZxMWR2bEplWGE4dkx5M2Y5OHNzdmh6dzhQSzZIaDRmLzVlcnFXcnRseXhZVU9tNnNzbGlSbEpRa3ZYanhvdTJSSTBlYTJkall1RVpFUkhTUGlvcnEwNzU5KzNoWFYxZjM1czJiZzUyZEhVaWxVaENMeFJ3cDFOYldRbVZsSlZ5NGNBSCsrdXN2dUhIakJsUlhWOFB0MjdmQnhzWUc3dDI3eDd6QWZMTm16Y0RXMWhZY0hSMmhhZE9tb0ZBb3dOUFRFNlRTL3l2UzE5WFZ3ZjM3OStIZXZYdncxMTkvd2MyYk4rSHExYXVYZnZycHA3SWZmdmhCZS9UbzBlSjc5KzVkallpSStOUGQzYjFhbzlIVVdoTldyTHBhT1hic1dOSFJvMGVsRnk5ZXRLdXNyR3dLQUE1dDI3YnQ0T25wR1JjVkZSWHA1K2ZYcm5uejVoNTJkblpnYjI4UHRyYTJJSlZLUVNLUmdGZ3NCcEZJQkNLUmlDTUlac0t5dXJvNlFFVHVpOEJlVTFNRGQrN2NnYnQzNzBKMWRUWGN1blhyNHRtelozODZkdXpZNGNyS3l2MG5UcHc0RGdDM0ZBckZYd3FGb2lvc0xLeDJ3NFlOYUkweGFqVGJGYSsvL3JybzBxVkxrZ3NYTHRpY1AzL2U5dno1ODAwQXdON1IwZEhaMzkrL3BWd3VENVRMNWY3QndjR0J6czdPaWlaTm1qUzNzYkZwYW1OajAxUWlrZGd5T0FuVGFtdHJxKy9kdS9kWGRYWDFYM2Z1M1BuejJyVnJGMDZkT25YNjVzMmJaMi9ldkhuNjdObXovN2x4NDhZMUFMamo1ZVYxMTh2THExcWhVTnh6ZDNlL3YzYnRXclQyK0RUYS9jcUpFeWVLTGx5NElLNnNySlNJUkNMcHVYUG5wT2ZPblpNQmdDMEF5QUJBQ2dDU3Y3OUVqVGxXQWpiOCsrdiszMSsxQUZBREFOWGUzdDQxUGo0K3RYVjFkYldlbnA3M1BUMDk2OUxTMHJDeEJZZ2xOYzlTVWxKRVlyRllKQktKUlB2Mzd4ZUpSQ0pBUkJZcjRSSUFBQURFeGNVaEltSmRYUjAyUnFBelk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekN6Wi9qL2V6djBFVnNFMGp3QUFBQUJKUlU1RXJrSmdnZz09JztcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG9vbHRpcDtcbiIsInZhciB0b29sdGlwID0gcmVxdWlyZShcInRudC50b29sdGlwXCIpO1xuXG52YXIgY3R0dl9nZW5vbWVfYnJvd3NlciA9IGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gRGlzcGxheSBlbGVtZW50cyBvcHRpb25zIHRoYXQgY2FuIGJlIG92ZXJyaWRkZW4gYnkgc2V0dGVyc1xuICAgIC8vIChzbyB0aGV5IGFyZSBleHBvc2VkIGluIHRoZSBBUEkpXG4gICAgdmFyIHNob3dfb3B0aW9ucyA9IHRydWU7XG4gICAgdmFyIHNob3dfdGl0bGUgICA9IGZhbHNlO1xuICAgIHZhciBzaG93X2xpbmtzICAgPSB0cnVlO1xuICAgIHZhciB0aXRsZSAgID0gXCJcIjtcbiAgICB2YXIgY2hyID0gMDtcbiAgICBcbiAgICB2YXIgcGF0aCA9IHRudC51dGlscy5zY3JpcHRfcGF0aChcImN0dHYtdGFyZ2V0LmpzXCIpO1xuXG4gICAgLy8gZGl2X2lkcyB0byBkaXNwbGF5IGRpZmZlcmVudCBlbGVtZW50c1xuICAgIC8vIFRoZXkgaGF2ZSB0byBiZSBzZXQgZHluYW1pY2FsbHkgYmVjYXVzZSB0aGUgSURzIGNvbnRhaW4gdGhlIGRpdl9pZCBvZiB0aGUgbWFpbiBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIHBsdWctaW5cbiAgICB2YXIgZGl2X2lkO1xuXG4gICAgdmFyIGZnQ29sb3IgPSBcIiM1ODY0NzFcIjtcbiAgICB2YXIgYmdDb2xvciA9IFwiI2M2ZGNlY1wiXG5cbiAgICB2YXIgZ0Jyb3dzZXI7XG5cbiAgICB2YXIgZ0Jyb3dzZXJUaGVtZSA9IGZ1bmN0aW9uKGdCLCBkaXYsIGN0dHZSZXN0QXBpKSB7XG5cdC8vIFNldCB0aGUgZGlmZmVyZW50ICNpZHMgZm9yIHRoZSBodG1sIGVsZW1lbnRzIChuZWVkcyB0byBiZSBsaXZlbHkgYmVjYXVzZSB0aGV5IGRlcGVuZCBvbiB0aGUgZGl2X2lkKVxuXHRzZXRfZGl2X2lkKGRpdik7XG5cblx0Z0Jyb3dzZXIgPSBnQjtcblxuXHQvLyBXZSBzZXQgdGhlIG9yaWdpbmFsIGRhdGEgc28gd2UgY2FuIGFsd2F5cyBjb21lIGJhY2tcblx0Ly8gVGhlIHZhbHVlcyBhcmUgc2V0IHdoZW4gdGhlIGNvcmUgcGx1Zy1pbiBpcyBhYm91dCB0byBzdGFydFxuXHR2YXIgb3JpZyA9IHt9O1xuXG5cdC8vIFRoZSBPcHRpb25zIHBhbmVcblx0dmFyIG9wdHNfcGFuZSA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X29wdGlvbnNfcGFuZVwiKVxuXHQgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbigpIHtcblx0XHRpZiAoc2hvd19vcHRpb25zKSB7XG5cdFx0ICAgIHJldHVybiBcImJsb2NrXCJcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJub25lXCJcblx0XHR9XG5cdCAgICB9KTtcblxuXHRvcHRzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAudGV4dChcIkh1bWFuIENociBcIiArIGNocik7XG5cdFxuXHR2YXIgbGVmdF9idXR0b24gPSBvcHRzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJpXCIpXG5cdCAgICAuYXR0cihcInRpdGxlXCIsIFwiZ28gbGVmdFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1hcnJvdy1jaXJjbGUtbGVmdCBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZ0Jyb3dzZXJUaGVtZS5sZWZ0KTtcblxuXHR2YXIgem9vbUluX2J1dHRvbiA9IG9wdHNfcGFuZVxuXHQgICAgLmFwcGVuZChcImlcIilcblx0ICAgIC5hdHRyKFwidGl0bGVcIiwgXCJ6b29tIGluXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLXNlYXJjaC1wbHVzIGZhLTJ4XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBnQnJvd3NlclRoZW1lLnpvb21Jbik7XG5cblx0dmFyIHpvb21PdXRfYnV0dG9uID0gb3B0c19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcInpvb20gb3V0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLXNlYXJjaC1taW51cyBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZ0Jyb3dzZXJUaGVtZS56b29tT3V0KTtcblxuXHR2YXIgcmlnaHRfYnV0dG9uID0gb3B0c19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcImdvIHJpZ2h0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLWFycm93LWNpcmNsZS1yaWdodCBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZ0Jyb3dzZXJUaGVtZS5yaWdodCk7XG5cdFxuXHR2YXIgb3JpZ0xhYmVsID0gb3B0c19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcInJlbG9hZCBsb2NhdGlvblwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1yZWZyZXNoIGZhLWx0XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0Z0Jyb3dzZXIuc3RhcnQob3JpZylcblx0ICAgIH0pO1xuXG5cdHZhciBicm93c2VyX3RpdGxlID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJoMVwiKVxuXHQgICAgLnRleHQodGl0bGUpXG5cdCAgICAuc3R5bGUoXCJjb2xvclwiLCBnQnJvd3NlclRoZW1lLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oKXtcblx0XHRpZiAoc2hvd190aXRsZSkge1xuXHRcdCAgICByZXR1cm4gXCJhdXRvXCJcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJub25lXCJcblx0XHR9XG5cdCAgICB9KTtcblxuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXHQvLyBIZXJlIHdlIGhhdmUgdG8gaW5jbHVkZSB0aGUgYnJvd3NlciAvL1xuXHQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cdC8vIFRoZSBCcm93c2VyIGRpdlxuXHQvLyBXZSBzZXQgdXAgdGhlIG9yaWdpbjpcblx0aWYgKGdCcm93c2VyLmdlbmUoKSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBvcmlnID0ge1xuXHRcdHNwZWNpZXMgOiBnQnJvd3Nlci5zcGVjaWVzKCksXG5cdFx0Z2VuZSAgICA6IGdCcm93c2VyLmdlbmUoKVxuXHQgICAgfTtcblx0fSBlbHNlIHtcblx0ICAgIG9yaWcgPSB7XG5cdFx0c3BlY2llcyA6IGdCcm93c2VyLnNwZWNpZXMoKSxcblx0XHRjaHIgICAgIDogZ0Jyb3dzZXIuY2hyKCksXG5cdFx0ZnJvbSAgICA6IGdCcm93c2VyLmZyb20oKSxcblx0XHR0byAgICAgIDogZ0Jyb3dzZXIudG8oKVxuXHQgICAgfVxuXHR9XG5cblx0dmFyIGdlbmVfdHJhY2sgPSB0bnQuYm9hcmQudHJhY2soKVxuXHQgICAgLmhlaWdodCgyMDApXG5cdCAgICAuYmFja2dyb3VuZF9jb2xvcihnQnJvd3NlclRoZW1lLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC5kaXNwbGF5KHRudC5ib2FyZC50cmFjay5mZWF0dXJlLmdlbmUoKVxuXHRcdCAgICAgLmZvcmVncm91bmRfY29sb3IoZ0Jyb3dzZXJUaGVtZS5mb3JlZ3JvdW5kX2NvbG9yKCkpXG5cdFx0ICAgIClcblx0ICAgIC5kYXRhKHRudC5ib2FyZC50cmFjay5kYXRhLmdlbmUoKSk7XG5cblx0Z2VuZV90cmFjay5kYXRhKCkudXBkYXRlKCkuc3VjY2VzcyAoZnVuY3Rpb24gKGdlbmVzKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8Z2VuZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAoZ2VuZXNbaV0uaWQgPT09IGdCcm93c2VyLmdlbmUoKSkge1xuXHRcdCAgICBnZW5lc1tpXS5jb2xvciA9IFwiI0EwMDAwMFwiO1xuXHRcdH1cblx0ICAgIH1cblx0fSlcblxuXHR2YXIgdG9vbHRpcF9vYmogPSBmdW5jdGlvbiAoZW5zZW1ibERhdGEsIGN0dHZEYXRhKSB7XG5cdCAgICB2YXIgb2JqID0ge307XG5cdCAgICBvYmouaGVhZGVyID0gZW5zZW1ibERhdGEuZXh0ZXJuYWxfbmFtZSArIFwiIChcIiArIGVuc2VtYmxEYXRhLmlkICsgXCIpXCI7XG5cdCAgICBvYmoucm93cyA9IFtdO1xuXG5cdCAgICAvLyBBc3NvY2lhdGlvbnMgYW5kIHRhcmdldCBsaW5rcyBtYXliZVxuXHQgICAgdmFyIGFzc29jaWF0aW9uc1ZhbHVlO1xuXHQgICAgdmFyIHRhcmdldFZhbHVlO1xuXHQgICAgaWYgKGN0dHZEYXRhICYmIGN0dHZEYXRhLmRhdGEgJiYgY3R0dkRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XG5cdFx0YXNzb2NpYXRpb25zVmFsdWUgPSBcIjxhIGhyZWY9JyMvdGFyZ2V0LWFzc29jaWF0aW9ucz9xPVwiICsgZW5zZW1ibERhdGEuaWQgKyBcIiZsYWJlbD1cIiArIGVuc2VtYmxEYXRhLmV4dGVybmFsX25hbWUgKyBcIic+XCIgKyAoY3R0dkRhdGEuZGF0YS5sZW5ndGggLSAxKSArIFwiIGRpc2Vhc2UgYXNzb2NpYXRpb25zPC9hPiBcIjtcblx0XHR0YXJnZXRWYWx1ZSA9IFwiPGEgaHJlZj0nIy90YXJnZXQvXCIgKyBlbnNlbWJsRGF0YS5pZCArIFwiJz5WaWV3IENUVFYgcHJvZmlsZTwvYT5cIjtcblx0ICAgIH1cblxuXHQgICAgb2JqLnJvd3MucHVzaCgge1xuXHRcdFwibGFiZWxcIiA6IFwiR2VuZSBUeXBlXCIsXG5cdFx0XCJ2YWx1ZVwiIDogZW5zZW1ibERhdGEuYmlvdHlwZVxuXHQgICAgfSk7XG5cdCAgICBvYmoucm93cy5wdXNoKHtcblx0XHRcImxhYmVsXCIgOiBcIkxvY2F0aW9uXCIsXG5cdFx0XCJ2YWx1ZVwiIDogXCI8YSB0YXJnZXQ9J19ibGFuaycgaHJlZj0naHR0cDovL3d3dy5lbnNlbWJsLm9yZy9Ib21vX3NhcGllbnMvTG9jYXRpb24vVmlldz9kYj1jb3JlO2c9XCIgKyBlbnNlbWJsRGF0YS5pZCArIFwiJz5cIiArIGVuc2VtYmxEYXRhLnNlcV9yZWdpb25fbmFtZSArIFwiOlwiICsgZW5zZW1ibERhdGEuc3RhcnQgKyBcIi1cIiArIGVuc2VtYmxEYXRhLmVuZCArIFwiPC9hPlwiXG5cdCAgICB9KTtcblx0ICAgIGlmIChhc3NvY2lhdGlvbnNWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnJvd3MucHVzaCh7XG5cdFx0ICAgIFwibGFiZWxcIiA6IFwiQXNzb2NpYXRpb25zXCIsXG5cdFx0ICAgIFwidmFsdWVcIiA6IGFzc29jaWF0aW9uc1ZhbHVlXG5cdFx0fSk7XG5cdCAgICB9XG5cdCAgICBpZiAodGFyZ2V0VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuXHRcdG9iai5yb3dzLnB1c2goe1xuXHRcdCAgICBcImxhYmVsXCIgOiBcIkNUVFYgUHJvZmlsZVwiLFxuXHRcdCAgICBcInZhbHVlXCIgOiB0YXJnZXRWYWx1ZVxuXHRcdH0pO1xuXHQgICAgfVxuXHQgICAgb2JqLnJvd3MucHVzaCgge1xuXHRcdFwibGFiZWxcIiA6IFwiRGVzY3JpcHRpb25cIixcblx0XHRcInZhbHVlXCIgOiBlbnNlbWJsRGF0YS5kZXNjcmlwdGlvblxuXHQgICAgfSk7XG5cdCAgICByZXR1cm4gb2JqO1xuXHR9O1xuXHRcblx0Ly8gVG9vbHRpcCBvbiBnZW5lc1xuXHR2YXIgZ2VuZV90b29sdGlwID0gZnVuY3Rpb24gKGdlbmUpIHtcblx0ICAgIHZhciB0ID0gdG9vbHRpcC50YWJsZSgpXG5cdFx0LmlkKDEpO1xuXHQgICAgdmFyIGV2ZW50ID0gZDMuZXZlbnQ7XG5cdCAgICB2YXIgZWxlbSA9IHRoaXM7XG5cblx0ICAgIHZhciBzID0gdG9vbHRpcC5wbGFpbigpXG5cdFx0LmlkKDEpO1xuXHQgICAgXG5cdCAgICB2YXIgdXJsID0gY3R0dlJlc3RBcGkudXJsLmFzc29jaWF0aW9ucyAoe1xuXHRcdFwiZ2VuZVwiIDogZ2VuZS5pZCxcblx0XHRcImRhdGFzdHJ1Y3R1cmVcIiA6IFwiZmxhdFwiXG5cdCAgICB9KTtcblx0ICAgIGN0dHZSZXN0QXBpLmNhbGwodXJsKVxuXHRcdC5jYXRjaCAoZnVuY3Rpb24gKCkge1xuXHRcdCAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PiBFUlJPUiEhIVwiKTtcblx0XHQgICAgdmFyIG9iaiA9IHRvb2x0aXBfb2JqKGdlbmUpO1xuXHRcdCAgICB0LmNhbGwoZWxlbSwgb2JqLCBldmVudCk7XG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcCkge1xuXHRcdCAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLnRleHQpO1xuXHRcdCAgICBjb25zb2xlLmxvZyhyZXNwKTtcblx0XHQgICAgdmFyIG9iaiA9IHRvb2x0aXBfb2JqIChnZW5lLCByZXNwKTtcblx0XHQgICAgdC5jYWxsKGVsZW0sIG9iaiwgZXZlbnQpO1xuXHRcdH0pO1xuXHQgICAgcy5jYWxsKGVsZW0sIHtcblx0XHRoZWFkZXIgOiBnZW5lLmV4dGVybmFsX25hbWUgKyBcIiAoXCIgKyBnZW5lLmlkICsgXCIpXCIsXG5cdFx0Ym9keSA6IFwiPGkgY2xhc3M9J2ZhIGZhLXNwaW5uZXIgZmEtMnggZmEtc3Bpbic+PC9pPlwiXG5cdCAgICB9KTtcblxuXHQgICAgLy90b29sdGlwLnRhYmxlKCkuY2FsbCh0aGlzLCBvYmopO1xuXHR9XG5cdFxuXHRnZW5lX3RyYWNrXG5cdCAgICAuZGlzcGxheSgpXG5cdCAgICAub25fY2xpY2soZ2VuZV90b29sdGlwKTtcblxuXHRnQnJvd3NlcihkaXYpO1xuXHRnQnJvd3Nlci5hZGRfdHJhY2soZ2VuZV90cmFjayk7XG5cblx0Ly8gVGhlIEdlbmVJbmZvIFBhbmVsXG5cdGQzLnNlbGVjdChkaXYpLnNlbGVjdChcIi50bnRfZ3JvdXBEaXZcIilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJlUGVla19nZW5lX2luZm9cIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl9nZW5lX2luZm9cIikgLy8gQm90aCBuZWVkZWQ/XG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCBnQnJvd3Nlci53aWR0aCgpICsgXCJweFwiKTtcblxuXHQvLyBMaW5rcyBkaXZcblx0dmFyIGxpbmtzX3BhbmUgPSBkMy5zZWxlY3QoZGl2KVxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9saW5rc19wYW5lXCIpXG5cdCAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKCkge2lmIChzaG93X2xpbmtzKSB7cmV0dXJuIFwiYmxvY2tcIn0gZWxzZSB7cmV0dXJuIFwibm9uZVwifX0pO1xuXG5cdC8vIGVuc2VtYmxcblx0bGlua3NfcGFuZVxuXHQgICAgLmFwcGVuZChcInNwYW5cIilcblx0ICAgIC50ZXh0KFwiT3BlbiBpbiBFbnNlbWJsXCIpO1xuXHR2YXIgZW5zZW1ibExvYyA9IGxpbmtzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJpXCIpXG5cdCAgICAuYXR0cihcInRpdGxlXCIsIFwib3BlbiByZWdpb24gaW4gZW5zZW1ibFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1leHRlcm5hbC1saW5rIGZhLTJ4XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHt2YXIgbGluayA9IGJ1aWxkRW5zZW1ibExpbmsoKTsgd2luZG93Lm9wZW4obGluaywgXCJfYmxhbmtcIil9KTtcblxuXHRnQi5zdGFydCgpO1xuXG4gICAgfTtcblxuLy8vKioqKioqKioqKioqKioqKioqKioqLy8vL1xuLy8vIFJFTkRFUklORyBGVU5DVElPTlMgLy8vL1xuLy8vKioqKioqKioqKioqKioqKioqKioqLy8vL1xuICAgIC8vIFByaXZhdGUgZnVuY3Rpb25zXG5cbiAgICAvLyBjYWxsYmFja3MgcGx1Z2dlZCB0byB0aGUgZ0Jyb3dzZXIgb2JqZWN0XG4gICAgdmFyIGdlbmVfaW5mb19jYmFrID0gZnVuY3Rpb24gKGdlbmUpIHtcblx0dmFyIHNlbCA9IGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl9nZW5lX2luZm9cIik7XG5cblx0c2VsXG5cdCAgICAuY2xhc3NlZChcInRudF9nZW5lX2luZm9fYWN0aXZlXCIsIHRydWUpXG5cdCAgICAuYXBwZW5kKFwicFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9nZW5lX2luZm9fcGFyYWdyYXBoXCIpXG5cdCAgICAvLyAuc3R5bGUoXCJjb2xvclwiLCBnQnJvd3NlclRoZW1lLmZvcmVncm91bmRfY29sb3IoKS5kYXJrZXIoKSlcblx0ICAgIC8vIC5zdHlsZShcImJhY2tncm91bmQtY29sb3JcIiwgZ0Jyb3dzZXJUaGVtZS5iYWNrZ3JvdW5kX2NvbG9yKCkuYnJpZ2h0ZXIoKSlcblx0ICAgIC8vIC5zdHlsZShcImhlaWdodFwiLCBnQnJvd3Nlci5oZWlnaHQoKSArIFwicHhcIilcblx0ICAgIC5odG1sKGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gXCI8aDE+XCIgKyBnZW5lLmV4dGVybmFsX25hbWUgKyBcIjwvaDE+XCIgK1xuXHRcdCAgICBcIkVuc2VtYmwgSUQ6IDxpPlwiICsgZ2VuZS5JRCArIFwiPC9pPjxiciAvPlwiICtcblx0XHQgICAgXCJEZXNjcmlwdGlvbjogPGk+XCIgKyBnZW5lLmRlc2NyaXB0aW9uICsgXCI8L2k+PGJyIC8+XCIgK1xuXHRcdCAgICBcIlNvdXJjZTogPGk+XCIgKyBnZW5lLmxvZ2ljX25hbWUgKyBcIjwvaT48YnIgLz5cIiArXG5cdFx0ICAgIFwibG9jOiA8aT5cIiArIGdlbmUuc2VxX3JlZ2lvbl9uYW1lICsgXCI6XCIgKyBnZW5lLnN0YXJ0ICsgXCItXCIgKyBnZW5lLmVuZCArIFwiIChTdHJhbmQ6IFwiICsgZ2VuZS5zdHJhbmQgKyBcIik8L2k+PGJyIC8+XCI7fSk7XG5cblx0c2VsLmFwcGVuZChcInNwYW5cIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdGV4dF9yb3RhdGVkXCIpXG5cdCAgICAuc3R5bGUoXCJ0b3BcIiwgfn5nQnJvd3Nlci5oZWlnaHQoKS8yICsgXCJweFwiKVxuXHQgICAgLnN0eWxlKFwiYmFja2dyb3VuZC1jb2xvclwiLCBnQnJvd3NlclRoZW1lLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2xpbmtcIilcblx0ICAgIC5zdHlsZShcImNvbG9yXCIsIGdCcm93c2VyVGhlbWUuYmFja2dyb3VuZF9jb2xvcigpKVxuXHQgICAgLnRleHQoXCJbQ2xvc2VdXCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfZ2VuZV9pbmZvXCIgKyBcIiBwXCIpLnJlbW92ZSgpO1xuXHRcdFx0XHQgICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl9nZW5lX2luZm9cIiArIFwiIHNwYW5cIikucmVtb3ZlKCk7XG5cdFx0XHRcdCAgICAgc2VsLmNsYXNzZWQoXCJ0bnRfZ2VuZV9pbmZvX2FjdGl2ZVwiLCBmYWxzZSl9KTtcblxuICAgIH07XG5cbiAgICAvLy8vIEFQSVxuICAgIGdCcm93c2VyVGhlbWUubGVmdCA9IGZ1bmN0aW9uICgpIHtcblx0Z0Jyb3dzZXIubW92ZV9sZWZ0KDEuNSk7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUucmlnaHQgPSBmdW5jdGlvbiAoKSB7XG5cdGdCcm93c2VyLm1vdmVfcmlnaHQoMS41KTtcbiAgICB9O1xuXG4gICAgZ0Jyb3dzZXJUaGVtZS56b29tSW4gPSBmdW5jdGlvbiAoKSB7XG5cdGdCcm93c2VyLnpvb20oMC41KTtcbiAgICB9XG5cbiAgICBnQnJvd3NlclRoZW1lLnpvb21PdXQgPSBmdW5jdGlvbiAoKSB7XG5cdGdCcm93c2VyLnpvb20oMS41KTtcbiAgICB9XG5cbiAgICBnQnJvd3NlclRoZW1lLnNob3dfb3B0aW9ucyA9IGZ1bmN0aW9uKGIpIHtcblx0c2hvd19vcHRpb25zID0gYjtcblx0cmV0dXJuIGdCcm93c2VyVGhlbWU7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuY2hyID0gZnVuY3Rpb24gKGMpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY2hyO1xuXHR9XG5cdGNociA9IGM7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgZ0Jyb3dzZXJUaGVtZS5zaG93X3RpdGxlID0gZnVuY3Rpb24oYikge1xuXHRzaG93X3RpdGxlID0gYjtcblx0cmV0dXJuIGdCcm93c2VyVGhlbWU7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuc2hvd19saW5rcyA9IGZ1bmN0aW9uKGIpIHtcblx0c2hvd19saW5rcyA9IGI7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLnRpdGxlID0gZnVuY3Rpb24gKHMpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdGl0bGU7XG5cdH1cblx0dGl0bGUgPSBzO1xuXHRyZXR1cm4gZ0Jyb3dzZXJUaGVtZTtcbiAgICB9O1xuXG4gICAgZ0Jyb3dzZXJUaGVtZS5mb3JlZ3JvdW5kX2NvbG9yID0gZnVuY3Rpb24gKGMpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZmdDb2xvcjtcblx0fVxuXHRmZ0NvbG9yID0gYztcblx0cmV0dXJuIGdCcm93c2VyVGhlbWU7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuYmFja2dyb3VuZF9jb2xvciA9IGZ1bmN0aW9uIChjKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGJnQ29sb3I7XG5cdH1cblx0YmdDb2xvciA9IGM7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICB2YXIgc2V0X2Rpdl9pZCA9IGZ1bmN0aW9uKGRpdikge1xuXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIik7XG4gICAgfTtcblxuXG4gICAgLy8vKioqKioqKioqKioqKioqKioqKioqLy8vL1xuICAgIC8vLyBVVElMSVRZIE1FVEhPRFMgICAgIC8vLy9cbiAgICAvLy8qKioqKioqKioqKioqKioqKioqKiovLy8vXG4gICAgLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgdmFyIGJ1aWxkRW5zZW1ibExpbmsgPSBmdW5jdGlvbigpIHtcblx0dmFyIHVybCA9IFwiaHR0cDovL3d3dy5lbnNlbWJsLm9yZy9cIiArIGdCcm93c2VyLnNwZWNpZXMoKSArIFwiL0xvY2F0aW9uL1ZpZXc/cj1cIiArIGdCcm93c2VyLmNocigpICsgXCIlM0FcIiArIGdCcm93c2VyLmZyb20oKSArIFwiLVwiICsgZ0Jyb3dzZXIudG8oKTtcblx0cmV0dXJuIHVybDtcbiAgICB9O1xuXG5cbiAgICAvLyBQdWJsaWMgbWV0aG9kc1xuXG5cbiAgICAvKiogPHN0cm9uZz5idWlsZEVuc2VtYmxHZW5lTGluazwvc3Ryb25nPiByZXR1cm5zIHRoZSBFbnNlbWJsIHVybCBwb2ludGluZyB0byB0aGUgZ2VuZSBzdW1tYXJ5IG9mIHRoZSBnaXZlbiBnZW5lXG5cdEBwYXJhbSB7U3RyaW5nfSBnZW5lIFRoZSBFbnNlbWJsIGdlbmUgaWQuIFNob3VsZCBiZSBhIHZhbGlkIElEIG9mIHRoZSBmb3JtIEVOU0dYWFhYWFhYWFhcIlxuXHRAcmV0dXJucyB7U3RyaW5nfSBUaGUgRW5zZW1ibCBVUkwgZm9yIHRoZSBnaXZlbiBnZW5lXG4gICAgKi9cbiAgICB2YXIgYnVpbGRFbnNlbWJsR2VuZUxpbmsgPSBmdW5jdGlvbihlbnNJRCkge1xuXHQvL1wiaHR0cDovL3d3dy5lbnNlbWJsLm9yZy9Ib21vX3NhcGllbnMvR2VuZS9TdW1tYXJ5P2c9RU5TRzAwMDAwMTM5NjE4XCJcblx0dmFyIHVybCA9IFwiaHR0cDovL3d3dy5lbnNlbWJsLm9yZy9cIiArIGdCcm93c2VyLnNwZWNpZXMoKSArIFwiL0dlbmUvU3VtbWFyeT9nPVwiICsgZW5zSUQ7XG5cdHJldHVybiB1cmw7XG4gICAgfTtcblxuXG5cbiAgICByZXR1cm4gZ0Jyb3dzZXJUaGVtZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGN0dHZfZ2Vub21lX2Jyb3dzZXI7XG4iXX0=
