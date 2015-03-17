(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
module.exports = targetGenomeBrowser = require("./src/targetGenomeBrowser.js");

},{"./src/targetGenomeBrowser.js":3}],3:[function(require,module,exports){
//var tooltip = require("tnt.tooltip");

var cttv_genome_browser = function(deps) {
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
	    var t = deps["tnt.tooltip"].table()
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL2Zha2VfOGM2ZmMwZWIuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL3NyYy90YXJnZXRHZW5vbWVCcm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gdGFyZ2V0R2Vub21lQnJvd3NlciA9IHJlcXVpcmUoXCIuL3NyYy90YXJnZXRHZW5vbWVCcm93c2VyLmpzXCIpO1xuIiwiLy92YXIgdG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcblxudmFyIGN0dHZfZ2Vub21lX2Jyb3dzZXIgPSBmdW5jdGlvbihkZXBzKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBEaXNwbGF5IGVsZW1lbnRzIG9wdGlvbnMgdGhhdCBjYW4gYmUgb3ZlcnJpZGRlbiBieSBzZXR0ZXJzXG4gICAgLy8gKHNvIHRoZXkgYXJlIGV4cG9zZWQgaW4gdGhlIEFQSSlcbiAgICB2YXIgc2hvd19vcHRpb25zID0gdHJ1ZTtcbiAgICB2YXIgc2hvd190aXRsZSAgID0gZmFsc2U7XG4gICAgdmFyIHNob3dfbGlua3MgICA9IHRydWU7XG4gICAgdmFyIHRpdGxlICAgPSBcIlwiO1xuICAgIHZhciBjaHIgPSAwO1xuICAgIFxuICAgIHZhciBwYXRoID0gdG50LnV0aWxzLnNjcmlwdF9wYXRoKFwiY3R0di10YXJnZXQuanNcIik7XG5cbiAgICAvLyBkaXZfaWRzIHRvIGRpc3BsYXkgZGlmZmVyZW50IGVsZW1lbnRzXG4gICAgLy8gVGhleSBoYXZlIHRvIGJlIHNldCBkeW5hbWljYWxseSBiZWNhdXNlIHRoZSBJRHMgY29udGFpbiB0aGUgZGl2X2lkIG9mIHRoZSBtYWluIGVsZW1lbnQgY29udGFpbmluZyB0aGUgcGx1Zy1pblxuICAgIHZhciBkaXZfaWQ7XG5cbiAgICB2YXIgZmdDb2xvciA9IFwiIzU4NjQ3MVwiO1xuICAgIHZhciBiZ0NvbG9yID0gXCIjYzZkY2VjXCJcblxuICAgIHZhciBnQnJvd3NlcjtcblxuICAgIHZhciBnQnJvd3NlclRoZW1lID0gZnVuY3Rpb24oZ0IsIGRpdiwgY3R0dlJlc3RBcGkpIHtcblx0Ly8gU2V0IHRoZSBkaWZmZXJlbnQgI2lkcyBmb3IgdGhlIGh0bWwgZWxlbWVudHMgKG5lZWRzIHRvIGJlIGxpdmVseSBiZWNhdXNlIHRoZXkgZGVwZW5kIG9uIHRoZSBkaXZfaWQpXG5cdHNldF9kaXZfaWQoZGl2KTtcblxuXHRnQnJvd3NlciA9IGdCO1xuXG5cdC8vIFdlIHNldCB0aGUgb3JpZ2luYWwgZGF0YSBzbyB3ZSBjYW4gYWx3YXlzIGNvbWUgYmFja1xuXHQvLyBUaGUgdmFsdWVzIGFyZSBzZXQgd2hlbiB0aGUgY29yZSBwbHVnLWluIGlzIGFib3V0IHRvIHN0YXJ0XG5cdHZhciBvcmlnID0ge307XG5cblx0Ly8gVGhlIE9wdGlvbnMgcGFuZVxuXHR2YXIgb3B0c19wYW5lID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfb3B0aW9uc19wYW5lXCIpXG5cdCAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKCkge1xuXHRcdGlmIChzaG93X29wdGlvbnMpIHtcblx0XHQgICAgcmV0dXJuIFwiYmxvY2tcIlxuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBcIm5vbmVcIlxuXHRcdH1cblx0ICAgIH0pO1xuXG5cdG9wdHNfcGFuZVxuXHQgICAgLmFwcGVuZChcInNwYW5cIilcblx0ICAgIC50ZXh0KFwiSHVtYW4gQ2hyIFwiICsgY2hyKTtcblx0XG5cdHZhciBsZWZ0X2J1dHRvbiA9IG9wdHNfcGFuZVxuXHQgICAgLmFwcGVuZChcImlcIilcblx0ICAgIC5hdHRyKFwidGl0bGVcIiwgXCJnbyBsZWZ0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLWFycm93LWNpcmNsZS1sZWZ0IGZhLTJ4XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBnQnJvd3NlclRoZW1lLmxlZnQpO1xuXG5cdHZhciB6b29tSW5fYnV0dG9uID0gb3B0c19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcInpvb20gaW5cIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtc2VhcmNoLXBsdXMgZmEtMnhcIilcblx0ICAgIC5vbihcImNsaWNrXCIsIGdCcm93c2VyVGhlbWUuem9vbUluKTtcblxuXHR2YXIgem9vbU91dF9idXR0b24gPSBvcHRzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJpXCIpXG5cdCAgICAuYXR0cihcInRpdGxlXCIsIFwiem9vbSBvdXRcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtc2VhcmNoLW1pbnVzIGZhLTJ4XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBnQnJvd3NlclRoZW1lLnpvb21PdXQpO1xuXG5cdHZhciByaWdodF9idXR0b24gPSBvcHRzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJpXCIpXG5cdCAgICAuYXR0cihcInRpdGxlXCIsIFwiZ28gcmlnaHRcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtYXJyb3ctY2lyY2xlLXJpZ2h0IGZhLTJ4XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBnQnJvd3NlclRoZW1lLnJpZ2h0KTtcblx0XG5cdHZhciBvcmlnTGFiZWwgPSBvcHRzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJpXCIpXG5cdCAgICAuYXR0cihcInRpdGxlXCIsIFwicmVsb2FkIGxvY2F0aW9uXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLXJlZnJlc2ggZmEtbHRcIilcblx0ICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRnQnJvd3Nlci5zdGFydChvcmlnKVxuXHQgICAgfSk7XG5cblx0dmFyIGJyb3dzZXJfdGl0bGUgPSBkMy5zZWxlY3QoZGl2KVxuXHQgICAgLmFwcGVuZChcImgxXCIpXG5cdCAgICAudGV4dCh0aXRsZSlcblx0ICAgIC5zdHlsZShcImNvbG9yXCIsIGdCcm93c2VyVGhlbWUuZm9yZWdyb3VuZF9jb2xvcigpKVxuXHQgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbigpe1xuXHRcdGlmIChzaG93X3RpdGxlKSB7XG5cdFx0ICAgIHJldHVybiBcImF1dG9cIlxuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBcIm5vbmVcIlxuXHRcdH1cblx0ICAgIH0pO1xuXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vIEhlcmUgd2UgaGF2ZSB0byBpbmNsdWRlIHRoZSBicm93c2VyIC8vXG5cdC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblx0Ly8gVGhlIEJyb3dzZXIgZGl2XG5cdC8vIFdlIHNldCB1cCB0aGUgb3JpZ2luOlxuXHRpZiAoZ0Jyb3dzZXIuZ2VuZSgpICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIG9yaWcgPSB7XG5cdFx0c3BlY2llcyA6IGdCcm93c2VyLnNwZWNpZXMoKSxcblx0XHRnZW5lICAgIDogZ0Jyb3dzZXIuZ2VuZSgpXG5cdCAgICB9O1xuXHR9IGVsc2Uge1xuXHQgICAgb3JpZyA9IHtcblx0XHRzcGVjaWVzIDogZ0Jyb3dzZXIuc3BlY2llcygpLFxuXHRcdGNociAgICAgOiBnQnJvd3Nlci5jaHIoKSxcblx0XHRmcm9tICAgIDogZ0Jyb3dzZXIuZnJvbSgpLFxuXHRcdHRvICAgICAgOiBnQnJvd3Nlci50bygpXG5cdCAgICB9XG5cdH1cblxuXHR2YXIgZ2VuZV90cmFjayA9IHRudC5ib2FyZC50cmFjaygpXG5cdCAgICAuaGVpZ2h0KDIwMClcblx0ICAgIC5iYWNrZ3JvdW5kX2NvbG9yKGdCcm93c2VyVGhlbWUuYmFja2dyb3VuZF9jb2xvcigpKVxuXHQgICAgLmRpc3BsYXkodG50LmJvYXJkLnRyYWNrLmZlYXR1cmUuZ2VuZSgpXG5cdFx0ICAgICAuZm9yZWdyb3VuZF9jb2xvcihnQnJvd3NlclRoZW1lLmZvcmVncm91bmRfY29sb3IoKSlcblx0XHQgICAgKVxuXHQgICAgLmRhdGEodG50LmJvYXJkLnRyYWNrLmRhdGEuZ2VuZSgpKTtcblxuXHRnZW5lX3RyYWNrLmRhdGEoKS51cGRhdGUoKS5zdWNjZXNzIChmdW5jdGlvbiAoZ2VuZXMpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxnZW5lcy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChnZW5lc1tpXS5pZCA9PT0gZ0Jyb3dzZXIuZ2VuZSgpKSB7XG5cdFx0ICAgIGdlbmVzW2ldLmNvbG9yID0gXCIjQTAwMDAwXCI7XG5cdFx0fVxuXHQgICAgfVxuXHR9KVxuXG5cdHZhciB0b29sdGlwX29iaiA9IGZ1bmN0aW9uIChlbnNlbWJsRGF0YSwgY3R0dkRhdGEpIHtcblx0ICAgIHZhciBvYmogPSB7fTtcblx0ICAgIG9iai5oZWFkZXIgPSBlbnNlbWJsRGF0YS5leHRlcm5hbF9uYW1lICsgXCIgKFwiICsgZW5zZW1ibERhdGEuaWQgKyBcIilcIjtcblx0ICAgIG9iai5yb3dzID0gW107XG5cblx0ICAgIC8vIEFzc29jaWF0aW9ucyBhbmQgdGFyZ2V0IGxpbmtzIG1heWJlXG5cdCAgICB2YXIgYXNzb2NpYXRpb25zVmFsdWU7XG5cdCAgICB2YXIgdGFyZ2V0VmFsdWU7XG5cdCAgICBpZiAoY3R0dkRhdGEgJiYgY3R0dkRhdGEuZGF0YSAmJiBjdHR2RGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcblx0XHRhc3NvY2lhdGlvbnNWYWx1ZSA9IFwiPGEgaHJlZj0nIy90YXJnZXQtYXNzb2NpYXRpb25zP3E9XCIgKyBlbnNlbWJsRGF0YS5pZCArIFwiJmxhYmVsPVwiICsgZW5zZW1ibERhdGEuZXh0ZXJuYWxfbmFtZSArIFwiJz5cIiArIChjdHR2RGF0YS5kYXRhLmxlbmd0aCAtIDEpICsgXCIgZGlzZWFzZSBhc3NvY2lhdGlvbnM8L2E+IFwiO1xuXHRcdHRhcmdldFZhbHVlID0gXCI8YSBocmVmPScjL3RhcmdldC9cIiArIGVuc2VtYmxEYXRhLmlkICsgXCInPlZpZXcgQ1RUViBwcm9maWxlPC9hPlwiO1xuXHQgICAgfVxuXG5cdCAgICBvYmoucm93cy5wdXNoKCB7XG5cdFx0XCJsYWJlbFwiIDogXCJHZW5lIFR5cGVcIixcblx0XHRcInZhbHVlXCIgOiBlbnNlbWJsRGF0YS5iaW90eXBlXG5cdCAgICB9KTtcblx0ICAgIG9iai5yb3dzLnB1c2goe1xuXHRcdFwibGFiZWxcIiA6IFwiTG9jYXRpb25cIixcblx0XHRcInZhbHVlXCIgOiBcIjxhIHRhcmdldD0nX2JsYW5rJyBocmVmPSdodHRwOi8vd3d3LmVuc2VtYmwub3JnL0hvbW9fc2FwaWVucy9Mb2NhdGlvbi9WaWV3P2RiPWNvcmU7Zz1cIiArIGVuc2VtYmxEYXRhLmlkICsgXCInPlwiICsgZW5zZW1ibERhdGEuc2VxX3JlZ2lvbl9uYW1lICsgXCI6XCIgKyBlbnNlbWJsRGF0YS5zdGFydCArIFwiLVwiICsgZW5zZW1ibERhdGEuZW5kICsgXCI8L2E+XCJcblx0ICAgIH0pO1xuXHQgICAgaWYgKGFzc29jaWF0aW9uc1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0XHRvYmoucm93cy5wdXNoKHtcblx0XHQgICAgXCJsYWJlbFwiIDogXCJBc3NvY2lhdGlvbnNcIixcblx0XHQgICAgXCJ2YWx1ZVwiIDogYXNzb2NpYXRpb25zVmFsdWVcblx0XHR9KTtcblx0ICAgIH1cblx0ICAgIGlmICh0YXJnZXRWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnJvd3MucHVzaCh7XG5cdFx0ICAgIFwibGFiZWxcIiA6IFwiQ1RUViBQcm9maWxlXCIsXG5cdFx0ICAgIFwidmFsdWVcIiA6IHRhcmdldFZhbHVlXG5cdFx0fSk7XG5cdCAgICB9XG5cdCAgICBvYmoucm93cy5wdXNoKCB7XG5cdFx0XCJsYWJlbFwiIDogXCJEZXNjcmlwdGlvblwiLFxuXHRcdFwidmFsdWVcIiA6IGVuc2VtYmxEYXRhLmRlc2NyaXB0aW9uXG5cdCAgICB9KTtcblx0ICAgIHJldHVybiBvYmo7XG5cdH07XG5cdFxuXHQvLyBUb29sdGlwIG9uIGdlbmVzXG5cdHZhciBnZW5lX3Rvb2x0aXAgPSBmdW5jdGlvbiAoZ2VuZSkge1xuXHQgICAgdmFyIHQgPSBkZXBzW1widG50LnRvb2x0aXBcIl0udGFibGUoKVxuXHRcdC5pZCgxKTtcblx0ICAgIHZhciBldmVudCA9IGQzLmV2ZW50O1xuXHQgICAgdmFyIGVsZW0gPSB0aGlzO1xuXG5cdCAgICB2YXIgcyA9IHRvb2x0aXAucGxhaW4oKVxuXHRcdC5pZCgxKTtcblx0ICAgIFxuXHQgICAgdmFyIHVybCA9IGN0dHZSZXN0QXBpLnVybC5hc3NvY2lhdGlvbnMgKHtcblx0XHRcImdlbmVcIiA6IGdlbmUuaWQsXG5cdFx0XCJkYXRhc3RydWN0dXJlXCIgOiBcImZsYXRcIlxuXHQgICAgfSk7XG5cdCAgICBjdHR2UmVzdEFwaS5jYWxsKHVybClcblx0XHQuY2F0Y2ggKGZ1bmN0aW9uICgpIHtcblx0XHQgICAgY29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT4gRVJST1IhISFcIik7XG5cdFx0ICAgIHZhciBvYmogPSB0b29sdGlwX29iaihnZW5lKTtcblx0XHQgICAgdC5jYWxsKGVsZW0sIG9iaiwgZXZlbnQpO1xuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcblx0XHQgICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcC50ZXh0KTtcblx0XHQgICAgY29uc29sZS5sb2cocmVzcCk7XG5cdFx0ICAgIHZhciBvYmogPSB0b29sdGlwX29iaiAoZ2VuZSwgcmVzcCk7XG5cdFx0ICAgIHQuY2FsbChlbGVtLCBvYmosIGV2ZW50KTtcblx0XHR9KTtcblx0ICAgIHMuY2FsbChlbGVtLCB7XG5cdFx0aGVhZGVyIDogZ2VuZS5leHRlcm5hbF9uYW1lICsgXCIgKFwiICsgZ2VuZS5pZCArIFwiKVwiLFxuXHRcdGJvZHkgOiBcIjxpIGNsYXNzPSdmYSBmYS1zcGlubmVyIGZhLTJ4IGZhLXNwaW4nPjwvaT5cIlxuXHQgICAgfSk7XG5cblx0ICAgIC8vdG9vbHRpcC50YWJsZSgpLmNhbGwodGhpcywgb2JqKTtcblx0fVxuXHRcblx0Z2VuZV90cmFja1xuXHQgICAgLmRpc3BsYXkoKVxuXHQgICAgLm9uX2NsaWNrKGdlbmVfdG9vbHRpcCk7XG5cblx0Z0Jyb3dzZXIoZGl2KTtcblx0Z0Jyb3dzZXIuYWRkX3RyYWNrKGdlbmVfdHJhY2spO1xuXG5cdC8vIFRoZSBHZW5lSW5mbyBQYW5lbFxuXHRkMy5zZWxlY3QoZGl2KS5zZWxlY3QoXCIudG50X2dyb3VwRGl2XCIpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiZVBlZWtfZ2VuZV9pbmZvXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfZ2VuZV9pbmZvXCIpIC8vIEJvdGggbmVlZGVkP1xuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgZ0Jyb3dzZXIud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gTGlua3MgZGl2XG5cdHZhciBsaW5rc19wYW5lID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfbGlua3NfcGFuZVwiKVxuXHQgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbigpIHtpZiAoc2hvd19saW5rcykge3JldHVybiBcImJsb2NrXCJ9IGVsc2Uge3JldHVybiBcIm5vbmVcIn19KTtcblxuXHQvLyBlbnNlbWJsXG5cdGxpbmtzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAudGV4dChcIk9wZW4gaW4gRW5zZW1ibFwiKTtcblx0dmFyIGVuc2VtYmxMb2MgPSBsaW5rc19wYW5lXG5cdCAgICAuYXBwZW5kKFwiaVwiKVxuXHQgICAgLmF0dHIoXCJ0aXRsZVwiLCBcIm9wZW4gcmVnaW9uIGluIGVuc2VtYmxcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtZXh0ZXJuYWwtbGluayBmYS0yeFwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7dmFyIGxpbmsgPSBidWlsZEVuc2VtYmxMaW5rKCk7IHdpbmRvdy5vcGVuKGxpbmssIFwiX2JsYW5rXCIpfSk7XG5cblx0Z0Iuc3RhcnQoKTtcblxuICAgIH07XG5cbi8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbi8vLyBSRU5ERVJJTkcgRlVOQ1RJT05TIC8vLy9cbi8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbiAgICAvLyBQcml2YXRlIGZ1bmN0aW9uc1xuXG4gICAgLy8gY2FsbGJhY2tzIHBsdWdnZWQgdG8gdGhlIGdCcm93c2VyIG9iamVjdFxuICAgIHZhciBnZW5lX2luZm9fY2JhayA9IGZ1bmN0aW9uIChnZW5lKSB7XG5cdHZhciBzZWwgPSBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfZ2VuZV9pbmZvXCIpO1xuXG5cdHNlbFxuXHQgICAgLmNsYXNzZWQoXCJ0bnRfZ2VuZV9pbmZvX2FjdGl2ZVwiLCB0cnVlKVxuXHQgICAgLmFwcGVuZChcInBcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ2VuZV9pbmZvX3BhcmFncmFwaFwiKVxuXHQgICAgLy8gLnN0eWxlKFwiY29sb3JcIiwgZ0Jyb3dzZXJUaGVtZS5mb3JlZ3JvdW5kX2NvbG9yKCkuZGFya2VyKCkpXG5cdCAgICAvLyAuc3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGdCcm93c2VyVGhlbWUuYmFja2dyb3VuZF9jb2xvcigpLmJyaWdodGVyKCkpXG5cdCAgICAvLyAuc3R5bGUoXCJoZWlnaHRcIiwgZ0Jyb3dzZXIuaGVpZ2h0KCkgKyBcInB4XCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIFwiPGgxPlwiICsgZ2VuZS5leHRlcm5hbF9uYW1lICsgXCI8L2gxPlwiICtcblx0XHQgICAgXCJFbnNlbWJsIElEOiA8aT5cIiArIGdlbmUuSUQgKyBcIjwvaT48YnIgLz5cIiArXG5cdFx0ICAgIFwiRGVzY3JpcHRpb246IDxpPlwiICsgZ2VuZS5kZXNjcmlwdGlvbiArIFwiPC9pPjxiciAvPlwiICtcblx0XHQgICAgXCJTb3VyY2U6IDxpPlwiICsgZ2VuZS5sb2dpY19uYW1lICsgXCI8L2k+PGJyIC8+XCIgK1xuXHRcdCAgICBcImxvYzogPGk+XCIgKyBnZW5lLnNlcV9yZWdpb25fbmFtZSArIFwiOlwiICsgZ2VuZS5zdGFydCArIFwiLVwiICsgZ2VuZS5lbmQgKyBcIiAoU3RyYW5kOiBcIiArIGdlbmUuc3RyYW5kICsgXCIpPC9pPjxiciAvPlwiO30pO1xuXG5cdHNlbC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RleHRfcm90YXRlZFwiKVxuXHQgICAgLnN0eWxlKFwidG9wXCIsIH5+Z0Jyb3dzZXIuaGVpZ2h0KCkvMiArIFwicHhcIilcblx0ICAgIC5zdHlsZShcImJhY2tncm91bmQtY29sb3JcIiwgZ0Jyb3dzZXJUaGVtZS5mb3JlZ3JvdW5kX2NvbG9yKCkpXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9saW5rXCIpXG5cdCAgICAuc3R5bGUoXCJjb2xvclwiLCBnQnJvd3NlclRoZW1lLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC50ZXh0KFwiW0Nsb3NlXVwiKVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7ZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiX2dlbmVfaW5mb1wiICsgXCIgcFwiKS5yZW1vdmUoKTtcblx0XHRcdFx0ICAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfZ2VuZV9pbmZvXCIgKyBcIiBzcGFuXCIpLnJlbW92ZSgpO1xuXHRcdFx0XHQgICAgIHNlbC5jbGFzc2VkKFwidG50X2dlbmVfaW5mb19hY3RpdmVcIiwgZmFsc2UpfSk7XG5cbiAgICB9O1xuXG4gICAgLy8vLyBBUElcbiAgICBnQnJvd3NlclRoZW1lLmxlZnQgPSBmdW5jdGlvbiAoKSB7XG5cdGdCcm93c2VyLm1vdmVfbGVmdCgxLjUpO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLnJpZ2h0ID0gZnVuY3Rpb24gKCkge1xuXHRnQnJvd3Nlci5tb3ZlX3JpZ2h0KDEuNSk7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuem9vbUluID0gZnVuY3Rpb24gKCkge1xuXHRnQnJvd3Nlci56b29tKDAuNSk7XG4gICAgfVxuXG4gICAgZ0Jyb3dzZXJUaGVtZS56b29tT3V0ID0gZnVuY3Rpb24gKCkge1xuXHRnQnJvd3Nlci56b29tKDEuNSk7XG4gICAgfVxuXG4gICAgZ0Jyb3dzZXJUaGVtZS5zaG93X29wdGlvbnMgPSBmdW5jdGlvbihiKSB7XG5cdHNob3dfb3B0aW9ucyA9IGI7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLmNociA9IGZ1bmN0aW9uIChjKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNocjtcblx0fVxuXHRjaHIgPSBjO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIGdCcm93c2VyVGhlbWUuc2hvd190aXRsZSA9IGZ1bmN0aW9uKGIpIHtcblx0c2hvd190aXRsZSA9IGI7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLnNob3dfbGlua3MgPSBmdW5jdGlvbihiKSB7XG5cdHNob3dfbGlua3MgPSBiO1xuXHRyZXR1cm4gZ0Jyb3dzZXJUaGVtZTtcbiAgICB9O1xuXG4gICAgZ0Jyb3dzZXJUaGVtZS50aXRsZSA9IGZ1bmN0aW9uIChzKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHRpdGxlO1xuXHR9XG5cdHRpdGxlID0gcztcblx0cmV0dXJuIGdCcm93c2VyVGhlbWU7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuZm9yZWdyb3VuZF9jb2xvciA9IGZ1bmN0aW9uIChjKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGZnQ29sb3I7XG5cdH1cblx0ZmdDb2xvciA9IGM7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLmJhY2tncm91bmRfY29sb3IgPSBmdW5jdGlvbiAoYykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBiZ0NvbG9yO1xuXHR9XG5cdGJnQ29sb3IgPSBjO1xuXHRyZXR1cm4gZ0Jyb3dzZXJUaGVtZTtcbiAgICB9O1xuXG4gICAgdmFyIHNldF9kaXZfaWQgPSBmdW5jdGlvbihkaXYpIHtcblx0ZGl2X2lkID0gZDMuc2VsZWN0KGRpdikuYXR0cihcImlkXCIpO1xuICAgIH07XG5cblxuICAgIC8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbiAgICAvLy8gVVRJTElUWSBNRVRIT0RTICAgICAvLy8vXG4gICAgLy8vKioqKioqKioqKioqKioqKioqKioqLy8vL1xuICAgIC8vIFByaXZhdGUgbWV0aG9kc1xuICAgIHZhciBidWlsZEVuc2VtYmxMaW5rID0gZnVuY3Rpb24oKSB7XG5cdHZhciB1cmwgPSBcImh0dHA6Ly93d3cuZW5zZW1ibC5vcmcvXCIgKyBnQnJvd3Nlci5zcGVjaWVzKCkgKyBcIi9Mb2NhdGlvbi9WaWV3P3I9XCIgKyBnQnJvd3Nlci5jaHIoKSArIFwiJTNBXCIgKyBnQnJvd3Nlci5mcm9tKCkgKyBcIi1cIiArIGdCcm93c2VyLnRvKCk7XG5cdHJldHVybiB1cmw7XG4gICAgfTtcblxuXG4gICAgLy8gUHVibGljIG1ldGhvZHNcblxuXG4gICAgLyoqIDxzdHJvbmc+YnVpbGRFbnNlbWJsR2VuZUxpbms8L3N0cm9uZz4gcmV0dXJucyB0aGUgRW5zZW1ibCB1cmwgcG9pbnRpbmcgdG8gdGhlIGdlbmUgc3VtbWFyeSBvZiB0aGUgZ2l2ZW4gZ2VuZVxuXHRAcGFyYW0ge1N0cmluZ30gZ2VuZSBUaGUgRW5zZW1ibCBnZW5lIGlkLiBTaG91bGQgYmUgYSB2YWxpZCBJRCBvZiB0aGUgZm9ybSBFTlNHWFhYWFhYWFhYXCJcblx0QHJldHVybnMge1N0cmluZ30gVGhlIEVuc2VtYmwgVVJMIGZvciB0aGUgZ2l2ZW4gZ2VuZVxuICAgICovXG4gICAgdmFyIGJ1aWxkRW5zZW1ibEdlbmVMaW5rID0gZnVuY3Rpb24oZW5zSUQpIHtcblx0Ly9cImh0dHA6Ly93d3cuZW5zZW1ibC5vcmcvSG9tb19zYXBpZW5zL0dlbmUvU3VtbWFyeT9nPUVOU0cwMDAwMDEzOTYxOFwiXG5cdHZhciB1cmwgPSBcImh0dHA6Ly93d3cuZW5zZW1ibC5vcmcvXCIgKyBnQnJvd3Nlci5zcGVjaWVzKCkgKyBcIi9HZW5lL1N1bW1hcnk/Zz1cIiArIGVuc0lEO1xuXHRyZXR1cm4gdXJsO1xuICAgIH07XG5cblxuXG4gICAgcmV0dXJuIGdCcm93c2VyVGhlbWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBjdHR2X2dlbm9tZV9icm93c2VyO1xuIl19
