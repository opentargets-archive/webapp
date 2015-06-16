var tnt_tooltip = require("tnt.tooltip");
var deferCancel = require ("tnt.utils").defer_cancel;


var tooltips = function () {

    var flowerView;
    var datatypes;
    var target;
    var datatypes = {
	    "genetic_association": "Genetics",
	    "somatic_mutations": "Somatic",
	    "known_drugs": "Drugs",
	    "rna_expression": "RNA",
	    "affected_pathways": "Pathways",
	    "animal_models": "Models"
	};

    var t = {};
    var hover_tooltip;

    var show_deferred = deferCancel(function (obj, ev) {
        hover_tooltip.call(this, obj, ev);
    }, 200);
    var hide_deferred = deferCancel(function () {
        hover_tooltip.close();
    }, 200);

    t.mouseover = function (node) {
        if (node.parent() === undefined) {
            return;
        }
        var ev = d3.event;
        hover_tooltip = tnt_tooltip.plain()
            .id(2)
            .width(180)
            .show_closer(false);

        var obj = {};
        obj.header = "";
        //obj.header = node.property('label') + " (" + node.property("association_score") + ")";
        obj.body = node.property('label') + " (" + node.property("association_score") + ")";
        show_deferred.call(this, obj, ev);
    };

    t.mouseout = function (node) {
        hide_deferred();
    };

    t.click = function (node) {
        // toplevel root is not shown in the bubbles view
        if (node.parent() === undefined) {
            return;
        }

        var obj = {};
        var score = node.property("association_score");
        obj.header = node.property("label") + " (Association Score: " + score + ")";
        obj.rows = [];
        var evidenceLoc = "#/evidence/" + target + "/" + node.property("efo_code");
        obj.rows.push({
            "value" : "<a class='cttv_flowerLink' href=" + evidenceLoc + "><div class='tnt_flowerView'></div></a>"
        });
        obj.rows.push({
            "value" : "<a href=" + evidenceLoc + ">View evidence details</a>"
        });
        var diseaseProfileLoc = "#/disease/" + node.property("efo_code");
        var diseaseAssocLoc = diseaseProfileLoc + "/associations";
        obj.rows.push({
            "value" : "<a href=" + diseaseAssocLoc + "><div class='cttv_associations_link'></div></a><a href=" + diseaseProfileLoc + "><div class='cttv_profile_link'></div>"
        })

        //obj.body="<a class='cttv_flowerLink' href=" + loc + "><div class='tnt_flowerView'></div></a><a href=" + loc + ">View evidence details</a>";

        var leafTooltip = tnt_tooltip.list()
            .id(1)
            .width(180);

        //Hijack of the fill callback
        var tableFill = leafTooltip.fill();

        //Pass a new fill callback that calls the original one and decorates with flowers
        leafTooltip.fill(function (data) {
        tableFill.call(this, data);
        var flowerData = [];

        });

        leafTooltip.fill(function (data) {
        tableFill.call(this, data);
        var nodeDatatypes = node.property("datatypes");
        var datatypes = {};
        datatypes.genetic_association = lookDatasource(nodeDatatypes, "genetic_association");
        datatypes.somatic_mutation = lookDatasource(nodeDatatypes, "somatic_mutation");
        datatypes.known_drug = lookDatasource(nodeDatatypes, "known_drug");
        datatypes.rna_expression = lookDatasource(nodeDatatypes, "rna_expression");
        datatypes.affected_pathway = lookDatasource(nodeDatatypes, "affected_pathway");
        datatypes.animal_model = lookDatasource(nodeDatatypes, "animal_model");
        var flowerData = [
            {"value": datatypes.genetic_association.score, "label": "Genetics", "active": hasActiveDatatype("genetic_association")},
            {"value":datatypes.somatic_mutation.score,  "label":"Somatic", "active": hasActiveDatatype("somatic_mutation")},
            {"value":datatypes.known_drug.score,  "label":"Drugs", "active": hasActiveDatatype("known_drug")},
            {"value":datatypes.rna_expression.score,  "label":"RNA", "active": hasActiveDatatype("rna_expression")},
            {"value":datatypes.affected_pathway.score,  "label":"Pathways", "active": hasActiveDatatype("affected_pathway")},
            {"value":datatypes.animal_model.score,  "label":"Models", "active": hasActiveDatatype("animal_model")}
        ];
        // for (var datatype in config.datatypes) {
        //     if (config.datatypes.hasOwnProperty(datatype)) {
        // 	flowerData.push({
        // 	    "value": lookDatasource(nodeDatatypes, datatype).score, "label": config.datatypes[datatype]});
        //     }
        // }

        flowerView
            .values (flowerData);
        flowerView(this.select("div .tnt_flowerView").node());
        //flowerView.values(flowerData)(this.select("div").node());
        });

        leafTooltip.call(this, obj);

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

        function hasActiveDatatype (checkDatatype) {
            for (var datatype in datatypes) {
                if (datatype === checkDatatype) {
                    return true;
                }
            }
            return false;
        }


    };
    t.flowerView = function (view) {
        if (!arguments.length) {
            return flowerView;
        }
        flowerView = view;
        return this;
    };

    t.target = function (t) {
        if (!arguments.length) {
            return target;
        }
        target = t;
        return this;
    };

    t.datatypes = function (dts) {
        if (!arguments.length) {
            return datatypes;
        }
        datatypes = dts;
        return this;
    };

    return t;

};

module.exports = exports = tooltips;
