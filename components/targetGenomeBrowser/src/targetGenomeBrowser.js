//var ensembl_rest_api = require("tnt.ensembl");
var nav = require("cttv.genomeBrowserNav");
var browser_tooltips = require("./tooltips.js");
var async = require("./callbacks.js");
var aggregation = require("./aggregation.js");
var RSVP = require('rsvp');

var cttv_genome_browser = function() {
    "use strict";

    var navTheme = nav()
    .show_options(true);

    var show_links   = true;
    var chr = 0;
    var efo;

    var snps = {};

    // gwas
    // var rest = ensembl_rest_api()
    //     .proxyUrl("/ensembl");
    var rest;

    var gwas_data = [];

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

        rest = gB.rest();
        async.rest = rest; // Ensembl rest api

        // tooltips
        var tooltips = browser_tooltips()
            .cttvRestApi (cttvRestApi)
            .ensemblRestApi (rest)
            .view (gB);


        // Transcript data
        var transcript_data = tnt.board.track.data.genome.transcript();
        transcript_data.update().success(function (transcripts) {
            var newGenes = {};
            for (var i=0; i<transcripts.length; i++) {
                var t = transcripts[i];
                var mygene = t.gene.external_name;
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
        // ClinVar track
        var clinvar_updater = tnt.board.track.data.retriever.sync()
            .retriever (function () {
                return async.data.clinvar;
            });

        var clinvar_display = tnt.board.track.feature.pin()
            .domain([0.3, 1.2])
            .foreground_color("#3e8bad")
            .on("click", tooltips.snp)
            .layout(tnt.board.track.layout()
            .elements(aggregation)
        );

        var clinvar_track = tnt.board.track()
            .label("Variants in rare diseases")
            .height(60)
            .background_color("white")
            .display(clinvar_display)
            .data (tnt.board.track.data()
            .update( clinvar_updater )
        );

        // Gwas track
        var gwas_updater = tnt.board.track.data.retriever.sync()
            .retriever (function () {
                return async.data.gwas;
            });
        var gwas_display = tnt.board.track.feature.pin()
            .domain([0.3,1.2])
            .foreground_color("#3e8bad")
            .on("click", tooltips.snp)
            .layout(tnt.board.track.layout()
            .elements(aggregation)
        );

        //var gwas_guider = gwas_display.guider();
        // gwas_display.guider (function (width) {
        //     var track = this;
        //     var p0_offset = 16.11;
        //     var p05_offset = 43.88
        //
        //     // pvalue 0
        //     track.g
        //     .append("line")
        //     .attr("x1", 0)
        //     .attr("y1", p0_offset)
        //     //.attr("y1", y_offset)
        //     .attr("x2", width)
        //         .attr("y2", p0_offset)
        //     //.attr("y2", y_offset)
        //     .attr("stroke", "lightgrey");
        //     track.g
        //     .append("text")
        //     .attr("x", width - 50)
        //     .attr("y", p0_offset + 10)
        //     .attr("font-size", 10)
        //     .attr("fill", "lightgrey")
        //     .text("pvalue 0");

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
        //gwas_guider.call(track, width);

        //});

        var gwas_track = tnt.board.track()
            .label("Variants in common diseases")
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
                .on("click", tooltips.gene)
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
            .add_track(clinvar_track)
            .add_track(sequence_track)
            .add_track(transcript_label_track)
            .add_track(transcript_track);

        // DATA
        // Gene
        var geneUrl = rest.url.gene ({
            id: gB.gene()
        });
        var genePromise = rest.call(geneUrl)
            .then (async.gene);

        // SNPs ClinVar
        var opts = getOpts(gB.gene(), ["eva","uniprot"], efo);
        var url = cttvRestApi.url.filterby(opts);
        var snpsClinVarPromise = cttvRestApi.call(url)
            .then (async.cttv_clinvar)
            .then (async.ensembl_call_snps)
            .then (async.ensembl_parse_snps)
            .then (async.ensembl_parse_clinvar_snps);

        // SNP GWASs
        var opts = getOpts(gB.gene(), ["gwas_catalog"], efo);
        var url = cttvRestApi.url.filterby(opts);
        var snpsGwasPromise = cttvRestApi.call(url)
            .then (async.cttv_gwas)
            .then (async.ensembl_call_snps)
            .then (async.ensembl_parse_gwas_snps);

        RSVP.all([genePromise, snpsGwasPromise, snpsClinVarPromise])
            .then (function (resps) {
                var gene = resps[0];
                var gene_extent = [gene.start, gene.end];
                var gwas_extent = resps[1];
                var clinvar_extent = resps[2];

                var gwasLength = gwas_extent[1] - gwas_extent[0];
                var clinvarLength = clinvar_extent[1] - clinvar_extent[0];
                var geneLength = gene_extent[1] - gene_extent[0];
                //
                var gwasStart = ~~(gwas_extent[0] - (gwasLength/5));
                var gwasEnd   = ~~(gwas_extent[1] + (gwasLength/5));
                var geneStart = ~~(gene_extent[0] - (geneLength/5));
                var geneEnd   = ~~(gene_extent[1] + (geneLength/5));
                var clinvarStart = ~~(clinvar_extent[0] - (clinvarLength/5));
                var clinvarEnd = ~~(clinvar_extent[1] + (clinvarLength/5));
                //
                var start = d3.min([gwasStart||Infinity, geneStart, clinvarStart||Infinity]);
                var end   = d3.max([gwasEnd||0, geneEnd, clinvarEnd||0]);
                //
                // We can finally start!
                gB.chr(gene.seq_region_name);
                navTheme.orig ({
                    from : start,
                    to : end
                });
                gB.start({from: start, to: end});

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
            .style("display", function() {
                if (show_links) {
                    return "block";
                } else {
                    return "none";
                }
            });

        // ensembl
        links_pane
            .append("span")
            .text("Open in Ensembl");

        var ensemblLoc = links_pane
            .append("i")
            .attr("title", "open region in ensembl")
            .attr("class", "cttvGenomeBrowserIcon fa fa-external-link fa-2x")
            .on("click", function() {var link = buildEnsemblLink(); window.open(link, "_blank");});

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
        return this;
    };

    gBrowserTheme.foreground_color = function (c) {
        if (!arguments.length) {
            return fgColor;
        }
        fgColor = c;
        return this;
    };

    gBrowserTheme.efo = function (e) {
        if (!arguments.length) {
            return efo;
        }
        efo = e;
        return this;
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

    function getOpts (gene, datasources, efo) {
        var opts = {
            target : gene,
            size : 1000,
            datasource : datasources,
            fields : [
                "target.gene_info",
                "disease.efo_info",
                "variant",
                "evidence",
                "unique_association_fields",
                "type"
            ]
        };
        if (efo !== undefined) {
            opts.disease = efo;
            opts.expandefo = true;
        }
        return opts;
    }


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
