var tnt_tooltip = require("tnt.tooltip");
var ensembl_rest_api = require("tnt.ensembl");

var transcriptViewerTheme = function () {

    // Colors for biotypes
    var colors = {
	"protein_coding" : d3.rgb("#A00000"),
	"nonsense_mediated_decay" : d3.rgb("#3a99d7"),
	"retained_intron" : d3.rgb("#039933"),
	"processed_transcript" : d3.rgb("#FFA500"),
	
    };
    
    var rest = ensembl_rest_api();
    var gwas_data = [];
    
    var theme = function (tv, cttvRestApi, div) {

	// TOOLTIPS
	var transcript_tooltip = function (data) {
	    var t = data.transcript;
	    var obj = {};
	    obj.header = t.display_name;

	    obj.rows = [];
	    obj.rows.push({
		"label" : "Location",
		"value" : "Chromosome " + t.seq_region_name + ": " + t.start + " - " + t.end
	    });
	    obj.rows.push({
		"label" : "Type",
		"value" : t.biotype
	    });
	    obj.rows.push({
		"label" : "Strand",
		"value" : t.strand === 1 ? "Forward" : "Reverse"
	    });
	    
	    var t = tnt.tooltip.table()
		.width(250)
		.id(1)
		.call(this, obj);
	};

	// TOOLTIPS FOR GWAS PINS
	var gwas_tooltip_data = function (data, ensembl_data) {
	    var obj = {};
	    obj.header = data.name;
	    obj.rows = [];
	    if (ensembl_data) {
		obj.rows.push({
		    "label" : "Ancestral allele",
		    "value" : ensembl_data.ancestral_allele
		});
		obj.rows.push({
		    "label" : "Allele string",
		    "value" : ensembl_data.mappings[0].allele_string
		});
		obj.rows.push({
		    "label" : "Most severe consequence",
		    "value" : ensembl_data.most_severe_consequence
		});
		obj.rows.push({
	    	    "label" : "MAF",
		    "value" : ensembl_data.MAF
		});
		obj.rows.push({
		    "label" : "Location",
		    "link" : function (d) {
			console.log(d.pos - 50);
			console.log(d.pos + 50);
			tv.start({
			    from : d.pos - 50,
			    to   : d.pos + 50
			});
		    },
		    obj : data,
		    value : "Jump to sequence"
		});	
	    }
	    if (data.study.length) {
		obj.rows.push({
		    "label" : "Associations",
		    "value" : ""
		});
	    }
	    for (var i=0; i<data.study.length; i++) {
		obj.rows.push({
		    "label" : "<a href='/#/disease/EFO_" + data.study[i].efo + "'>EFO_" + data.study[i].efo + '</a>',
		    "value" : data.study[i].pvalue + " <a target=_blank href='http://europepmc.org/search?query=" + data.study[i].pmid + "'><i class='fa fa-newspaper-o'></i></a>"
		})
	    }

	    return obj;
	};

	var gwas_tooltip = function (data) {

	    var t = tnt.tooltip.table()
		.width(250)
		.id(1);

	    var event = d3.event;
	    var elem = this;

	    var spinner = tnt.tooltip.plain()
		.id(1);
	    var url = rest.url.variation ({
		species : "human"
	    });
	    rest.call(url, {
		"ids" : [data.name]
	    })
		.catch (function () {
		    console.log("NO VARIANT INFO FOR THIS SNP");
		})
		.then (function (resp) {
		    console.log(resp.body);
		    var obj = gwas_tooltip_data (data, resp.body[data.name]);
		    t.call(elem, obj, event);
		});
	    spinner.call(elem, {
		header : data.name,
		body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
	    });
	};
	
	// TRANSCRIPT TYPE LEGEND
	var createLegend = function (t) {
	    var legend_div = d3.select(div)
		.append("div")
		.attr("class", "tnt_legend_div")

	    legend_div
		.append("text")
		.text("Transcript type:");

	    var biotypes_arr = t.map(function (e) {
		return e.biotype;
	    });
	    var biotypes_hash = {};
	    for (var i=0; i<biotypes_arr.length; i++) {
		biotypes_hash[biotypes_arr[i]] = 1;
	    }
	    var biotypes = Object.keys(biotypes_hash);
	    var biotypes_legend = legend_div.selectAll(".tnt_biotype_legend")
		.data(biotypes, function (d) { return d })
		.enter()
		.append("div")
		.attr("class", "tnt_biotype_legend")
		.style("display", "inline");
	    biotypes_legend
		.append("div")
		.style("display", "inline-block")
		.style("margin", "0px 2px 0px 15px")
		.style("width", "10px")
		.style("height", "10px")
		.style("border", "1px solid #000")
		.style("background", function (d) { return colors[d] || "black"; })
	    biotypes_legend
		.append("text")
		.text(function (d) {return d});

	};

	// seq track
	var seq_track = tnt.board.track()
	    .height(20)
	    .background_color("white")
	    .display(tnt.board.track.feature.genome.sequence())
	    .data(tnt.board.track.data.genome.sequence()
		  .limit(150));

	// gwas track
	var gwas_updater = tnt.board.track.data.retriever.sync()
	    .retriever (function () {
		return gwas_data;
	    });
	var gwas_track = tnt.board.track()
	    .height(30)
	    .background_color("white")
	    .display(tnt.board.track.feature.pin()
		     .domain([0,1])
		     .foreground_color("#3e8bad")
		     .on_click(gwas_tooltip)
		    )
	    .data (tnt.board.track.data()
		   .update( gwas_updater )
		  );
	tv
	    .add_track(gwas_track)
	    .add_track(seq_track);
	
	tv
	    .on_load (function (t) {
		// Coordinates for the sequence display
		tv
		    .species(t[0].species)
		    .chr(t[0].seq_region_name);
		
		var tracks = tv.tracks();
		for (var i=3; i<tracks.length; i++) {
		    var composite = tracks[i].display();
		    var displays = composite.displays();
		    for (var j=0; j<displays.length; j++) {
			displays[j]
			    .foreground_color(colors[t[i-3].biotype] || "black")
			    .on_click(transcript_tooltip);
		    }
		}
		createLegend(t);
	    });
	tv(div);

	var url = cttvRestApi.url.filterby({
	    gene : tv.gene(),
	    datasource : "gwas",
	    size : 1000,
	    fields : [
		"unique_association_fields"
	    ]
	});
	cttvRestApi.call(url).
	    then (function (resp) {
		var snps = {};
		for (var i=0; i<resp.body.data.length; i++) {
		    var this_snp = resp.body.data[i].unique_association_fields;
		    var snp_name = this_snp.snp.split("/").pop();
		    if (snps[snp_name] === undefined) {
			snps[snp_name] = {};
			snps[snp_name].study = [];
			snps[snp_name].name = snp_name;
		    }
		    snps[snp_name].study.push ({
			"pmid" : this_snp.pubmed_refs.split("/").pop(),
			"pvalue" : this_snp.pvalue,
			"name"   : this_snp.study_name,
			"efo"    : this_snp.object.split("/").pop()
		    });
		}
		console.log(snps);
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
			tv.start();
		    });
	    });

    };

    return theme;
};

module.exports = exports = transcriptViewerTheme;
