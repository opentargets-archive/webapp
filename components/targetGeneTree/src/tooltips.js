var tnt_tooltip = require("tnt.tooltip");

var tooltips = function () {

    var width = 180;

    var speciesNames = {
        9606 : "Human",
        10090 : "Mouse",
        9823 : "Pig",
        9615 : "Dog",
        9544 : "Macaque",
        10116 : "Rat",
        10141 : "Guinea Pig",
        9986 : "Rabbit",
        8364 : "Frog",
        7955 : "Zebrafish"
    };

    var homologyType = {
        "ortholog_one2one" : "ortholog 1:1",
        "ortholog_one2many" : "ortholog 1:many",
        "within_species_paralog" : "paralog",
    };

    var m = {};

    m.node = function (node) {
        var elem = this;
        var data = node.data();
        var obj = {};
        obj.rows = [];
        console.warn ("NODE");
        console.log(data);
        if (node.is_leaf()) {
            obj.header = data.sequence.name || data.id.accession;
            obj.rows.push({
                "label": "Species",
                "value": speciesNames[data.taxonomy.id]
            });

            if (data.homology !== undefined) {
                obj.rows.push({
                    "label" : "Homology",
                    "value" : ""
                });
                obj.rows.push({
                    "label": "% identity",
                    "value": data.homology.percId
                });
                obj.rows.push({
                    "label" : "Type",
                    "value" : homologyType[data.homology.type]
                });
                obj.rows.push({
                    "label" : "Level",
                    "value" : data.homology.level
                });
            }
        } else {
            obj.header = data.taxonomy.scientific_name;
            obj.rows.push({
                "label" : "Event type",
                "value" : data.events.type
            });
        }

        tnt.tooltip.table()
            .id(1)
            .width(width)
            .call(elem, obj);
    };

    return m;
};

module.exports = exports = tooltips;
