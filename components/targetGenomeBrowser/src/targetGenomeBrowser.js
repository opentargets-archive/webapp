var ensembl_rest_api = require("tnt.ensembl");
var nav = require("cttv.genomeBrowserNav");
var browser_tooltips = require("./tooltips.js");

var cttv_genome_browser = function() {
    "use strict";

    var navTheme = nav()
        .show_options(true);

    var show_links   = true;
    var chr = 0;

    // gwas
    var rest = ensembl_rest_api();
    var gwas_data = [];
    var gwas_extent = [];

    // div_ids to display different elements
    // They have to be set dynamically because the IDs contain the div_id of the main element containing the plug-in
    var div_id;

    var fgColor = "#586471";

    var gBrowser;

    var gBrowserTheme = function(gB, cttvRestApi, div) {
	// Set the different #ids for the html elements (needs to be lively because they depend on the div_id)
	set_div_id(div);
	gBrowser = gB;

    // Navigation
	navTheme (gB, div);

    // tooltips
    var tooltips = browser_tooltips()
        .cttvRestApi (cttvRestApi);


    // Transcript data
    var transcript_data = tnt.board.track.data.genome.transcript();
    transcript_data.update().success(function (transcripts) {
        var newGenes = {};
        for (var i=0; i<transcripts.length; i++) {
            var t = transcripts[i];
            var mygene = t.gene.external_name
            if (gB.gene() === t.gene.id) {
                newGenes[t.external_name] = t;
                continue;
            } else if (newGenes[mygene] === undefined) {
                t.exons = [{
                    start : t.gene.start,
                    end : t.gene.end,
                    offset : 0,
                    isGene : true
                }];
                t.start = t.gene.start;
                t.end = t.gene.end;
                t.introns = [];
                t.display_label = t.gene.strand === 1 ? (mygene + ">") : ("<" + mygene);
                t.isGene = true;
                newGenes[mygene] = t;
            }
        }
        var elems = [];
        for (var elem in newGenes) {
            if (newGenes.hasOwnProperty(elem)) {
                elems.push(newGenes[elem]);
            }
        }
        return elems;
    });

    // Aux track for label
    var transcript_label_track = tnt.board.track()
    .label ("Genes / Transcripts")
    .height(20)
    .background_color ("#EEEFFF")
    .display(tnt.board.track.feature.block())
    .data(tnt.board.track.data()
        .update(tnt.board.track.data.retriever.sync()
            .retriever (function () {
                return [];
            })
        )
    );

    // TRACKS!
    // Gwas track
    var gwas_updater = tnt.board.track.data.retriever.sync()
        .retriever (function () {
        return gwas_data;
        });
    var gwas_display = tnt.board.track.feature.pin()
        .domain([0.3,1.2])
        .foreground_color("#3e8bad")
        //.on_click (gwas_tooltip);
    var gwas_guider = gwas_display.guider();
    gwas_display.guider (function (width) {
        var track = this;
        var p0_offset = 16.11;
        var p05_offset = 43.88

        // pvalue 0
        track.g
        .append("line")
        .attr("x1", 0)
        .attr("y1", p0_offset)
        //.attr("y1", y_offset)
        .attr("x2", width)
            .attr("y2", p0_offset)
        //.attr("y2", y_offset)
        .attr("stroke", "lightgrey");
        track.g
        .append("text")
        .attr("x", width - 50)
        .attr("y", p0_offset + 10)
        .attr("font-size", 10)
        .attr("fill", "lightgrey")
        .text("pvalue 0");

        // pvalue 0.5
        // track.g
        // 	.append("line")
        // 	.attr("x1", 0)
        // 	.attr("y1", p05_offset)
        // 	.attr("x2", width)
        // 	.attr("y2", p05_offset)
        // 	.attr("stroke", "lightgrey")
        // track.g
        // 	.append("text")
        // 	.attr("x", width - 50)
        // 	.attr("y", p05_offset + 10)
        // 	.attr("font-size", 10)
        // 	.attr("fill", "lightgrey")
        // 	.text("pvalue 0.5");

        // continue with rest of guider
        gwas_guider.call(track, width);

    });

    var gwas_track = tnt.board.track()
        .label("GWAS snps")
	    .height(60)
	    .background_color("white")
	    .display(gwas_display)
	    .data (tnt.board.track.data()
		   .update( gwas_updater )
		  );

    // Transcript / Gene track
    var transcript_track = tnt.board.track()
        .height(300)
        .background_color("#EEEFFF")
        .display(tnt.board.track.feature.genome.transcript()
            .foreground_color (function (t) {
                if (t.isGene) {
                    return "#005588";
                }
                return "red";
            })
            .on_click (tooltips.gene)
        )
        .data(transcript_data);

    // Sequence track
    var sequence_track = tnt.board.track()
        .label ("sequence")
        .height(30)
        .background_color("white")
        .display(tnt.board.track.feature.genome.sequence())
        .data(tnt.board.track.data.genome.sequence()
            .limit(150)
        );


	gBrowser(div);
	gBrowser
        //.add_track(gene_track)
        .add_track(gwas_track)
        .add_track(sequence_track)
        .add_track(transcript_label_track)
        .add_track(transcript_track);

    var url = cttvRestApi.url.filterby({
        gene : gB.gene(),
        datasource : "gwas",
        size : 1000,
        fields : [
            "biological_object.efo_info", // disease
            "evidence.evidence_chain"
        ]
    });
    cttvRestApi.call(url)
    .then (function (resp) {
        console.log(resp.body);
        var snps = {};
        for (var i=0; i<resp.body.data.length; i++) {
            var this_snp = resp.body.data[i].evidence;
            var this_disease = resp.body.data[i].biological_object;
            var snp_name = this_snp.evidence_chain[0].biological_object.about[0].split("/").pop();
            if (snps[snp_name] === undefined) {
                snps[snp_name] = {};
                snps[snp_name].study = [];
                snps[snp_name].name = snp_name;
            }
            snps[snp_name].study.push ({
                "pmid"   : this_snp.evidence_chain[1].evidence.provenance_type.literature.pubmed_refs[0].split("/").pop(),
                "pvalue" : this_snp.evidence_chain[1].evidence.association_score.pvalue.value.toExponential(),
                "name"   : this_snp.evidence_chain[0].biological_object.about[0].split("/").pop(),
                "efo"    : this_disease.efo_info[0][0].efo_id,
                "efo_label" : this_disease.efo_info[0][0].label
            });
        }
        var snp_names = Object.keys(snps);

        var min = function (arr) {
            var m;
            for (var i=0; i<arr.length; i++) {
                if (m === undefined) {
                    m = +arr[i].pvalue;
                } else {
                    if (m > +arr[i].pvalue) {
                        m = arr[i].pvalue;
                    }
                }
            }
            return m;
        };

        var var_url = rest.url.variation ({
            species : "human"
        });

        rest.call(var_url, {
            "ids" : snp_names
        })
        .then (function (resp) {
            var min_pos, max_pos;
            gwas_data = [];
            for (var snp_name in resp.body) {
                if (resp.body.hasOwnProperty(snp_name)) {
                    var snp = resp.body[snp_name];
                    var info = snps[snp_name];
                    info.pos = snp.mappings[0].start;
                    info.val = 1 - min(info["study"]);
                    gwas_data.push(info)
                }
            }
            gwas_extent = d3.extent(gwas_data, function (d) {
                return d.pos
            });

            gB.start();
        });
    });


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
