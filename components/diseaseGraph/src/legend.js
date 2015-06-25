
var legend = function (div) {
    
    var ancestorLegend = div
        .append("span")
        .attr("class", "cttv_diseaseGraph_ancestor_legend");

    ancestorLegend
        .append("div");

    ancestorLegend
        .append("text")
        .text("Ancestor");

    div
        .append("div")
        .attr("class", "cttv_diseaseGraph_child_legend");
};

module.exports = exports = legend;
