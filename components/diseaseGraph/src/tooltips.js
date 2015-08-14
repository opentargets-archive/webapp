var tnt_tooltip = require("tnt.tooltip");

var tooltips = function () {
    var actions = {};
    var cttvApi;

    var t = {};

    t.click = function (efo) {
        var ttable = tnt.tooltip.table()
            .width(270)
            .id(1);

        var event = d3.event;
        var elem = this;
        var spinner = tnt.tooltip.plain()
            .id(1);
        var url = cttvApi.url.associations({
            "disease" : efo.efo,
            "expandefo": true
        });
        cttvApi.call(url)
            .then(function (resp) {
                var data = resp.body.data;
                var obj = {};
                obj.header = efo.label;

                obj.rows = [];
                obj.rows.push({
                    "label" : "EFO code",
                    "value" : "<a href=/disease/" + efo.efo + ">" + efo.efo + "</a>"
                });

                // obj.rows.push({
                //     "label" : "Link",
                //     "link" : function (d) {
                //         actions.focus(d);
                //     },
                //     "obj" : efo,
                //     "value" : "Jump to node"
                // });

                if (data.length) {
                    var is_truncated = data.length > 10;
                    obj.rows.push({
                        "label" : "<a href=/disease/" + efo.efo + "/associations>" + data.length + " genes associated" + "</a>" + (data.length>10 ? " (Showing the first 10)" : ""),
                        "value" : ""
                    });
                    data.sort(function (a, b) {
                        return b.association_score - a.association_score;
                    });
                    for (var i=0; i<d3.min([data.length, 10]); i++) {
                        var thisAssociation = data[i];
                        obj.rows.push({
                            "label": "<a href=/target/" + thisAssociation.gene_id + "/associations>" + thisAssociation.label + "</a>",
                            "value": "<a href=/evidence/" + thisAssociation.gene_id + "/" + efo.efo + ">" + thisAssociation.association_score + ""
                        });
                    }
                }

                ttable.call(elem, obj, event);
            });
        spinner.call(elem, {
            header : efo.label,
            body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
        });

    };

    t.actions = function (acts) {
        if (!arguments.length) {
            return actions;
        }
        actions = acts;
        return this;
    };

    t.cttvApi = function (api) {
        if (!arguments.length) {
            return cttvApi;
        }
        cttvApi = api;
        return this;
    };

    return t;
};

module.exports = exports = tooltips;
