
var tnt_tooltip = require("tnt.tooltip");

var tooltips = function () {

    var cttvRestApi;

    var m = {};

    // Tooltip on genes
    m.gene = function (gene) {

        // Gene tooltip data
        var tooltip_obj = function (ensemblData, cttvData) {
            console.log(ensemblData);
            var obj = {};
            obj.header = ensemblData.gene.external_name + " (" + ensemblData.gene.id + ")";
            obj.rows = [];

            // Associations and target links maybe
            var associationsValue;
            var targetValue;
            if (cttvData && cttvData.data && cttvData.data.length > 0) {
                associationsValue = "<a href='#/target/" + ensemblData.id + "/associations'>" + (cttvData.data.length - 1) + " disease associations</a> ";
                targetValue = "<a href='#/target/" + ensemblData.id + "'>View CTTV profile</a>";
            }

            obj.rows.push ({
                "label" : "Gene",
                "value" : ""
            });
            obj.rows.push( {
                "label" : "Biotype",
                "value" : ensemblData.gene.biotype
            });
            obj.rows.push({
                "label" : "Location",
                "value" : "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Location/View?db=core;g=" + ensemblData.id + "'>" + ensemblData.gene.seq_region_name + ":" + ensemblData.gene.start + "-" + ensemblData.gene.end + "</a>"
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
                "value" : ensemblData.gene.description
            });

            if (!ensemblData.isGene) {
                obj.rows.push({
                    "label" : "Transcript",
                    "value" : ""
                });

                obj.rows.push({
                    "label" : "Name",
                    "value" : ensemblData.transcript.external_name
                });

                obj.rows.push({
                    "label" : "ID",
                    "value" : "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=" + ensemblData.id + "'>" + ensemblData.id + "</a>"
                });

                obj.rows.push({
                    "label" : "biotype",
                    "value" : ensemblData.transcript.biotype
                });
            }

            return obj;
        };


        var t = tnt_tooltip.table()
        .id(1);
        var event = d3.event;
        var elem = this;

        var s = tnt_tooltip.plain()
        .id(1);

        var url = cttvRestApi.url.associations ({
            "gene" : gene.gene.id,
            "datastructure" : "flat"
        });
        cttvRestApi.call(url)
        .catch (function (x) {
            var obj = tooltip_obj(gene);
            t.call(elem, obj, event);
        })
        .then(function (resp) {
            var obj = tooltip_obj (gene, resp.body);
            t.call(elem, obj, event);
        });
        s.call(elem, {
            header : gene.gene.external_name + " (" + gene.gene.id + ")",
            body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
        });

    };

    m.cttvRestApi = function (api) {
        if (!arguments.length) {
            return cttvRestApi;
        }
        cttvRestApi = api;
        return this;
    };

    return m;
};

module.exports = exports = tooltips;
