var tnt_tooltip = require("tnt.tooltip");
var deferCancel = require ("tnt.utils").defer_cancel;

var tooltips = function () {

    var flowerView;
    var treeView;
    var target;
    var datatypes;

    var t = {};

    var hover_tooltip;
    var tooltip_width = 180;

    var show_deferred = deferCancel (function (obj, ev) {
        hover_tooltip.call(this, obj, ev);
    }, 200);
    var hide_deferred = deferCancel (function (obj, ev) {
        hover_tooltip.close();
    }, 200);

    t.mouseover = function (node) {
        var ev = d3.event;
        hover_tooltip = tnt_tooltip.plain()
        .id(2)
        .width(tooltip_width)
        .show_closer(false)
        .allow_drag(false);

        var obj = {};
        obj.header = "";
        obj.body = node.property("label") + " (" + node.property("association_score") + ")";
        show_deferred.call(this, obj, ev);
    };

    t.mouseout = function (node) {
        hide_deferred();
    };


    t.click = function (node) {
        var obj = {};
        var score = node.property("association_score");
        obj.header = node.property("label") + " (Association score: " + score + ")";
        var loc = "/evidence/" + target + "/" + node.property("efo_code");
        //obj.body="<div></div><a href=" + loc + ">View evidence details</a><br/><a href=''>Zoom on node</a>";
        obj.rows = [];
        obj.rows.push({
            value : "<a class=cttv_flowerLink href=" + loc + "><div class=tnt_flowerView></div></a>"
        });
        obj.rows.push({
            value: "<a href=" + loc + ">View evidence details</a>"
        });
        obj.rows.push({
            value : node.is_collapsed() ? "Expand node" : "Collapse node",
            link : function (n) {
                leafTooltip.close();
                n.toggle();
                treeView.update();
                //setTitles();
            },
            obj: node
        });
        var diseaseProfileLoc = "/disease/" + node.property("efo_code");
        var diseaseAssocLoc = diseaseProfileLoc + "/associations";
        obj.rows.push({
            "value" : "<a href=" + diseaseAssocLoc + "><div class='cttv_associations_link'></div></a><a href=" + diseaseProfileLoc + "><div class='cttv_profile_link'></div>"
        });


        // if (treeVis.has_focus(node)) {
        // 	obj.rows.push({
        // 	    value : "Release focus",
        // 	    link : function (n) {
        // 		treeVis.release_focus(n)
        // 		    .update();
        // 		// re-insert the titles
        // 		d3.selectAll(".tnt_tree_node")
        // 		    .append("title")
        // 		    .text(function (d) {
        // 			return d.label;
        // 		    });
        // 	    },
        // 	    obj : node
        // 	});
        // } else {
        // 	obj.rows.push({
        // 	    value:"Set focus on node",
        // 	    link : function (n) {
        // 		console.log("SET FOCUS ON NODE: ");
        // 		console.log(n.data());
        // 		treeVis.focus_node(n, true)
        // 		    .update();
        // 		// re-insert the titles
        // 		d3.selectAll(".tnt_tree_node")
        // 		    .append("title")
        // 		    .text(function (d) {
        // 			return d.label;
        // 		    });
        // 	    },
        // 	    obj: node
        // 	});
        // }

        var leafTooltip = tnt_tooltip.list()
        .id(1)
        .width(tooltip_width);
        // Hijack tooltip's fill callback
        var origFill = leafTooltip.fill();

        // Pass a new fill callback that calls the original one and decorates with flowers
        leafTooltip.fill (function (data) {
            origFill.call(this, data);
            var dts = node.property("datatypes");
            var flowerData = [
                {"value":lookDatasource(dts, "genetic_association").score, "label":"Genetics", "active": hasActiveDatatype("genetic_association",datatypes)},
                {"value":lookDatasource(dts, "somatic_mutation").score,  "label":"Somatic", "active": hasActiveDatatype("somatic_mutation", datatypes)},
                {"value":lookDatasource(dts, "known_drug").score,  "label":"Drugs", "active": hasActiveDatatype("known_drug", datatypes)},
                {"value":lookDatasource(dts, "rna_expression").score,  "label":"RNA", "active": hasActiveDatatype("rna_expression", datatypes)},
                {"value":lookDatasource(dts, "affected_pathway").score,  "label":"Pathways", "active": hasActiveDatatype("affected_pathway", datatypes)},
                {"value":lookDatasource(dts, "animal_model").score,  "label":"Models", "active": hasActiveDatatype("animal_model", datatypes)}
            ];

            flowerView
                .diagonal(150)
                .values(flowerData);
            flowerView(this.select("div .tnt_flowerView").node());
        });

        leafTooltip.call(this, obj);

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

    t.treeView = function (tree) {
        if (!arguments.length) {
            return treeView;
        }
        treeView = tree;
        return this;
    };

    t.flowerView = function (view) {
        if (!arguments.length) {
            return flowerView;
        }
        flowerView = view;
        return this;
    };

    t.datatypes = function (dts) {
        if (!arguments.length) {
            return datatypes;
        }
        datatypes = dts;
        return this;
    };

    t.target = function (t) {
        if (!arguments.length) {
            return target;
        }
        target = t;
        return this;
    };




    return t;
};

module.exports = exports = tooltips;
