
var tnt_tooltip = require("tnt.tooltip");

var tooltips = function () {

    var cttvRestApi;
    var ensemblRestApi;
    var view;
    var id = 1;
    var target;

    var m = {};

    var snp_data = function (data, ensembl_data) {
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
            if (ensembl_data.MAF) {
                obj.rows.push({
                    "label" : "MAF",
                    "value" : ensembl_data.MAF
                });
            }
            obj.rows.push({
                "label" : "Location",
                "link" : function (d) {
                view.start({
                    from : d.pos - 50,
                    to   : d.pos + 50
                });
                },
                obj : data,
                value : "Jump to sequence"
            });
            obj.rows.push({
                "label": "target",
                "value": data.target.symbol
            });
        }
        if (data.associations && data.associations.length) {
            obj.rows.push({
                "label" : "Associations",
                "value" : ""
            });

            for (var i=0; i<data.associations.length; i++) {
                var association = data.associations[i];
                obj.rows.push({
                    "label" : "<a href=/evidence/" + data.target.geneid + "/" + (association.efo.split("/").pop()) + ">" + association.label + "</a>",
                    "value" : association.pmids.length + (association.pmids.length === 1 ? " article" : " articles") + "  <a href='http://europepmc.org/search?query=" + association.pmids.map(function (d) {return "EXT_ID:"+d;}).join("%20OR%20") + "' target=_blank <i class='fa fa-newspaper-o fa-lg'></i></a>"
                });
            }
        }
        if (data.study && data.study.length) {
            obj.rows.push({
                "label" : "Associations",
                "value" : ""
            });

            for (var i=0; i<data.study.length; i++) {
                obj.rows.push({
                    "label" : "<a href='/evidence/" + data.target.geneid + "/"+ (data.study[i].efo.split("/").pop()) + "'>" + data.study[i].efo_label + '</a>',
                    "value" : parseFloat(data.study[i].pvalue).toPrecision(1) + " <a target=_blank href='http://europepmc.org/abstract/med/" + (data.study[i].pmid.split("/").pop()) + "'><i class='fa fa-newspaper-o fa-lg'></i></a>"
                });
            }
        }

        return obj;

    };

    // Tooltip on GWAS
    m.snp = function (data) {
        var t = tnt.tooltip.table()
            .width(250)
            .id(id);
        var event = d3.event;
        var elem = this;
        var spinner = tnt.tooltip.plain()
            .id(id);
        var url = ensemblRestApi.url.variation({
            species : "human"
        });
        ensemblRestApi.call (url, {
            "ids" : [data.name]
        })
        .catch (function () {
            console.log("NO VARIANT INFORMATION FOR THIS SNP");
        })
        .then (function (resp) {
            var obj = snp_data (data, resp.body[data.name]);
            t.call (elem, obj, event);
        });
        spinner.call (elem, {
            header : data.name,
            body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
        });

    };

    // Tooltip on genes
    m.gene = function (gene) {

        // Gene tooltip data
        var tooltip_obj = function (ensemblData, cttvData, transcriptData) {

            var obj = {};
            obj.header = (ensemblData.display_name || ensemblData.external_name) + " (" + ensemblData.id + ")";
            obj.rows = [];

            // Associations and target links maybe
            var associationsValue;
            var targetValue;
            if (cttvData && cttvData.data && cttvData.data.length > 0) {
                associationsValue = "<a href='/target/" + ensemblData.id + "/associations'>" + (cttvData.data.length) + " disease associations</a> ";
                targetValue = "<a href='/target/" + ensemblData.id + "'>View CTTV profile</a>";
            }

            obj.rows.push ({
                "label" : "Gene",
                "value" : ""
            });
            obj.rows.push( {
                "label" : "Biotype",
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

            if (transcriptData) {
                obj.rows.push({
                    "label" : "Transcript",
                    "value" : ""
                });

                obj.rows.push({
                    "label" : "Name",
                    "value" : transcriptData.display_name
                });

                obj.rows.push({
                    "label" : "ID",
                    "value" : "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=" + transcriptData.id + "'>" + transcriptData.id + "</a>"
                });

                obj.rows.push({
                    "label" : "biotype",
                    "value" : transcriptData.biotype
                });
            }

            return obj;
        };


        var t = tnt_tooltip.table()
            .id(id);
        var event = d3.event;
        var elem = this;

        var s = tnt_tooltip.plain()
            .id(id);

        var url = cttvRestApi.url.associations ({
            "target" : (gene.isGene ? gene.id : gene.gene.id),
            "datastructure" : "flat",
            "filterbyscorevalue_min": 0,
            "stringency": 1
        });
        cttvRestApi.call(url)
        .catch (function (x) {
            var obj = tooltip_obj(gene);
            t.call(elem, obj, event);
        })
        .then(function (resp) {
            var obj;
            if (gene.isGene) {
                obj = tooltip_obj (gene, resp.body);
            } else {
                obj = tooltip_obj (gene.gene, resp.body, gene); // gene is a transcript
            }
            // var obj = tooltip_obj (gene, resp.body);
            t.call(elem, obj, event);
        });
        s.call(elem, {
            header : (gene.isGene? gene.external_name + " (" + gene.gene_id + ")" : gene.gene.display_name + "(" + gene.gene.id + ")"),
            body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
        });

    };

    m.ensemblRestApi = function (api) {
        if (!arguments.length) {
            return ensemblRestApi;
        }
        ensemblRestApi = api;
        return this;
    };

    m.cttvRestApi = function (api) {
        if (!arguments.length) {
            return cttvRestApi;
        }
        cttvRestApi = api;
        return this;
    };

    m.view = function (v) {
        if (!arguments.length) {
            return view;
        }
        view = v;
        return this;
    };

    return m;
};

module.exports = exports = tooltips;
