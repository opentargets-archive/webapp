var legend = function () {

    var update = function () {};

    var species = { // model
        "Homo_sapiens" : true, // Human
        "Mus_musculus" : true, // Mouse
        "Cavia_porcellus" : true, // Guinea pig
        "Macaca_mulatta" : true,  // Macaque
        "Canis_lupus_familiaris" : true, // Dog
        "Oryctolagus_cuniculus" : true, // Rabbit
        "Rattus_norvegicus" : true, // Rat
        "Sus_scrofa" : true, // Pig
        "Xenopus_tropicalis" : true, // Frog
        "Danio_rerio" : true // Zebrafish
    };

    var scientific2common = {
        "Homo_sapiens" : "Human",
        "Mus_musculus" : "Mouse",
        "Cavia_porcellus" : "Guinea pig",
        "Macaca_mulatta" : "Macaque",
        "Canis_lupus_familiaris" : "Dog",
        "Oryctolagus_cuniculus" : "Rabbit",
        "Rattus_norvegicus" : "Rat",
        "Sus_scrofa" : "Pig",
        "Xenopus_tropicalis" : "Frog",
        "Danio_rerio" : "Zebrafish"
    };

    var speciesTaxonIds = {
        "Homo_sapiens" : 9606,
        "Mus_musculus" : 10090,
        "Cavia_porcellus" : 10141,
        "Macaca_mulatta" : 9544,
        "Canis_lupus_familiaris" : 9615,
        "Oryctolagus_cuniculus" : 9986,
        "Rattus_norvegicus" : 10116,
        "Sus_scrofa" : 9823,
        "Xenopus_tropicalis" : 8364,
        "Danio_rerio" : 7955
    };


    var speciesArr = [];
    for (var sp in species) {
        if (species.hasOwnProperty(sp)) {
            speciesArr.push({
                "name" : sp,
                "checked" : species[sp]
            });
        }
    }

    var l = function (container) {

        var div = d3.select(container)
            .append("div")
            .style({
                "position": "absolute",
                "left" : "10px",
                "top" : "10px",
                "background-color" : "#FFFFFF",
            });

        var checkbox = div.selectAll("input")
            .data(speciesArr)
            .enter()
            .append("span")
            .style("display", "block");
            checkbox
            .append("input")
            .attr("type", "checkbox")
            .attr("checked", function (d) {
                return d.checked;
            })
            .attr("name", "spcheck")
            .attr("value", function (d) {
                return d.name;
            })
            .on("change", function () {
                species[this.value] = this.checked;
                var currentSps = [];
                var allSps = [];
                for (var sp in species) {
                    if (species.hasOwnProperty(sp)) {
                        allSps.push(speciesTaxonIds[sp]);
                        if (species[sp]) {
                            currentSps.push(speciesTaxonIds[sp]);
                        }
                    }
                }
                if (!currentSps.length) {
                    currentSps = allSps;
                }
                update(currentSps);
            });

        checkbox
            .append("img")
            .style({
                "width" : "30px",
                "height" : "30px",
                "margin-left" : "10px",
                "margin-top" : "5px"
            })
            .attr("src", function (d) {
                return "/imgs/species/" + d.name + ".png";
            });

        checkbox
            .append("text")
            .style({
                "margin-left" : "10px"
            })
            .text(function (d) {
                return scientific2common[d.name];
            });
    };

    l.update = function (cbak) {
        if (!arguments.length) {
            return update;
        }
        update = cbak;
        return this;
    };

    return l;
};
module.exports = exports = legend;
