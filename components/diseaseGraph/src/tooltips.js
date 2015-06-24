var tnt_tooltip = require("tnt.tooltip");

var tooltips = function () {
    var t = {};

    var tooltip_width = 180;

    t.click = function (efo) {
        console.warn (efo);
        var obj = {};
        obj.header = efo.label;
        obj.rows = [];
        obj.rows.push({
            "label" : "EFO code",
            "value" : "<a href=/#/disease/" + efo.efo + ">" + efo.efo + "</a>"
        });

        return tnt_tooltip.table()
        .id(1)
        .width(tooltip_width)
        .call(this, obj);
    };

    return t;
};

module.exports = exports = tooltips;
