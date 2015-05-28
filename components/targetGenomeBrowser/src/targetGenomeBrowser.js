var tnt_tooltip = require("tnt.tooltip");
var nav = require("cttv.genomeBrowserNav");

var cttv_genome_browser = function() {
    "use strict";

    var navTheme = nav()
        .show_options(true);

    var show_links   = true;
    var chr = 0;

    // div_ids to display different elements
    // They have to be set dynamically because the IDs contain the div_id of the main element containing the plug-in
    var div_id;

    var fgColor = "#586471";

    var gBrowser;

    var gBrowserTheme = function(gB, cttvRestApi, div) {
	// Set the different #ids for the html elements (needs to be lively because they depend on the div_id)
	set_div_id(div);
	gBrowser = gB;

	navTheme (gB, div);

	var gene_track = tnt.board.track()
	    .height(200)
	  //  .background_color(gBrowserTheme.background_color())
	    .display(tnt.board.track.feature.genome.gene()
		     .foreground_color(gBrowserTheme.foreground_color())
		    )
	    .data(tnt.board.track.data.genome.gene());

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
		associationsValue = "<a href='#/target/" + ensemblData.id + "/associations'>" + (cttvData.data.length - 1) + " disease associations</a> ";
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
	    var t = tnt_tooltip.table()
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
		    var obj = tooltip_obj(gene);
		    t.call(elem, obj, event);
		})
		.then(function (resp) {
		    resp = JSON.parse(resp.text);
		    var obj = tooltip_obj (gene, resp);
		    t.call(elem, obj, event);
		});
	    s.call(elem, {
		header : gene.external_name + " (" + gene.id + ")",
		body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
	    });

	};

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
    // API


    gBrowserTheme.chr = function (c) {
	if (!arguments.length) {
	    return chr;
	}
	chr = c;
	return this;
    };

    gBrowserTheme.show_links = function(b) {
	show_links = b;
	return gBrowserTheme;
    };

    gBrowserTheme.foreground_color = function (c) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = c;
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
