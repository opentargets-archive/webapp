var tnt_tooltip = require("tnt.tooltip");
var deferCancel = require ("tnt.utils").defer_cancel;

var tooltips = function () {

    var flowerView;
    var treeView;
    var names;
    var target;
    var filters;

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
        obj.body = node.property(function (n) { return n.disease.efo_info.label; }) + " (" + node.property("__association_score").toFixed(2) + ")";
        show_deferred.call(this, obj, ev);
    };

    t.mouseout = function (node) {
        hide_deferred();
    };


    t.click = function (node) {
        //console.log(filters);
        var obj = {};
        var score = node.property("__association_score");
        obj.header = node.property(function (n) { return n.disease.efo_info.label; });+ " (Association score: " + score.toFixed(2) + ")";
        var loc = "/evidence/" + target + "/" +node.property(function (n) { return n.disease.id }) + (filters.score_str ? "?score_str=" + filters.score_str[0] : "");
        //var loc = "/evidence/" + target + "/" + node.property("efo_code") + '?score_str=' + filters.score_str[0];
        //obj.body="<div></div><a href=" + loc + ">View evidence details</a><br/><a href=''>Zoom on node</a>";
        obj.rows = [];

        var diseaseProfileLoc = "/disease/" + node.property(function (n) { return n.disease.id; });
        var diseaseAssocLoc = diseaseProfileLoc + "/associations";
        obj.rows.push({
            "value": '<a href="' + diseaseProfileLoc + '"><span class="fa-stack"><i class="fa fa-circle fa-stack-2x"></i><i class="fa fa-align-justify fa-stack-1x fa-inverse"></i></span> Profile</a> | <a href="' + diseaseAssocLoc + '">Associations <span class="fa-stack"><i class="fa fa-circle fa-stack-2x"></i><i class="fa fa-th fa-stack-1x fa-inverse"></i></span></a>'
        });

        obj.rows.push({
            value : "<a class=cttv_flowerLink href=" + loc + "><div class=tnt_flowerView></div>View evidence details</a>"
        });
        // obj.rows.push({
        //     value: "<a href=" + loc + "><span style=font-weight:bold>View evidence details</span></a>"
        // });


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
            var nodeDatatypes = node.property(function (d) {
                return d.association_score.datatypes;
            });

            var flowerData = [];
            for (var i=0; i<names.datatypesOrder.length; i++) {
                var dkey = names.datatypes[names.datatypesOrder[i]];
                var key = names.datatypesOrder[i];
                var datasource = nodeDatatypes[dkey];

                // var datasource = lookDatasource(nodeDatatypes, dkey);
                flowerData.push({
                    "value": datasource,
                    "label": names.datatypesLabels[key],
                    "active": true,//hasActiveDatatype(names.datatypes[key])
                });
            }

            flowerView
                .diagonal(150)
                .values(flowerData);
            flowerView(d3.select(this).select("div .tnt_flowerView").node());
        });

        leafTooltip.call(this, obj);

        // function lookDatasource (arr, dsName) {
        //     for (var i=0; i<arr.length; i++) {
        //         var ds = arr[i];
        //         if (ds.datatype === dsName) {
        //             return {
        //                 "count": ds.evidence_count,
        //                 "score": ds.association_score
        //             };
        //         }
        //     }
        //     return {
        //         "count": 0,
        //         "score": 0
        //     };
        // }

        function hasActiveDatatype (checkDatatype) {
            for (var datatype in filters.datatypes) {
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

    t.filters = function (dts) {
        if (!arguments.length) {
            return filters;
        }
        filters = dts;
        return this;
    };

    t.names = function (lbs) {
        if (!arguments.length) {
            return names;
        }
        names = lbs;
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
