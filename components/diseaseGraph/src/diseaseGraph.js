var getGraph = require("./getGraph.js");
var graph_tooltips = require("./tooltips.js");

var diseaseGraph = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "mouseover", "mouseout", "tick");

    var color = d3.scale.category10();

    var graph;
    var tooltips = graph_tooltips();

    // default dimensions
    var width = 800;
    var height = 800;

    var d3cola = cola.d3adaptor()
        .linkDistance(200)
        .avoidOverlaps(true)
        .size([width, height]);

    var render = function (container) {
        var div = d3.select(container)
            .append("div")
            .style("position", "relative");

        var zoom = d3.behavior.zoom()
            .on("zoom", redraw);

        function redraw() {
            vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }

        var svg = div
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("pointer-events", "all");

        svg
            .append("rect")
            .attr('class', 'cttv_diseaseGraph_background')
            .attr('width', "100%")
            .attr('height', "100%")
            .call(zoom);

        var vis = svg
            .append("g");
            // .call(zoom)
            // .append("g");

        graph.nodes.forEach(function (v) {
            v.x = 400;
            v.y = 50;
        });

        d3cola
            .nodes(graph.nodes)
            .links(graph.links)
            .constraints(graph.constraints)
            .groups(graph.groups)
            .start(20,20,20);

        var link = vis.selectAll(".cttv_diseaseGraph_link")
            .data(graph.links)
            .enter().append("line")
            .attr("class", "cttv_diseaseGraph_link");

        var node = vis.selectAll(".cttv_diseaseGraph_node")
            .data(graph.nodes, function (d) {
                return d.efo;
            })
            .enter().append("rect")
            .attr("class", "cttv_diseaseGraph_node")
            .classed("cttv_diseaseGraph_child", function (d) {
                return d.type === "child";
            })
            .classed("cttv_diseaseGraph_ancestor", function (d) {
                return d.type === "ancestor";
            })
            .attr("width", function (d) { return d.width; })
            .attr("height", function (d) { return d.height; })
            .attr("rx", 5).attr("ry", 5)
            .on("click", function (d) {
                if (d3.event.defaultPrevented) {
                    return;
                }
                tooltips.click.call(this, d);
                //console.warn(d);
            })
            .call(d3cola.drag);

        var label = vis.selectAll(".cttv_diseaseGraph_label")
            .data(graph.nodes)
            .enter()
            .append("text")
            .attr("class", "cttv_diseaseGraph_label")
            .attr("pointer-events", "none")
            .text(function (d) {
                return d.label;
            })
            .call(d3cola.drag);

        node.append("title")
            .text(function (d) {
                return d.label;
            });

        d3cola.on("tick", function () {
            var extents = getBounds(node);
            var xExtent = extents.x;
            var yExtent = extents.y;

            var scaleMin = d3.min([Math.abs (height/(yExtent[1] - yExtent[0])), Math.abs(width/(xExtent[1] - xExtent[0]))]);
            if (scaleMin > 1) {
                scaleMin = 1;
            }

            var extraX = (width - (xExtent[1] - xExtent[0]) * scaleMin) / 2;
            var startX = (-(xExtent[0]) * scaleMin) + extraX;
            var extraY = (height - (yExtent[1] - yExtent[0]) * scaleMin) / 2;
            var startY = (-(yExtent[0]) * scaleMin) + extraY;

            vis.attr("transform", "translate(" + [startX, startY] + ") scale(" + scaleMin + ")");

            zoom.translate([startX, startY]);
            zoom.scale(scaleMin);

            vis.call(zoom);

            node
                .attr("x", function (d) { return d.x - d.width / 2; })
                .attr("y", function (d) { return d.y - d.height / 2; });

            label
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    var h = this.getBBox().height;
                    return d.y + h/4;
                });

            link.attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });
        });

        function getBounds (nodes) {
            var xs = [];
            var ys = [];

            nodes.each(function (d) {
                xs.push(d.x);
                xs.push(d.x - d.width/2);
                xs.push(d.x + d.width/2);
                ys.push(d.y);
                ys.push(d.y - d.height/2);
                ys.push(d.y + d.height/2);
            });

            var xExtent = d3.extent(xs);
            var yExtent = d3.extent(ys);

            return {
                "x": xExtent,
                "y": yExtent
            };
        }

    };

    render.data = function (d) {
        if (!arguments.length) {
            return data;
        }
        graph = getGraph(d);
        return this;
    };

    render.width = function (w) {
        if (!arguments.length) {
            return width;
        }
        width = w;
        return this;
    };

    render.height = function (h) {
        if (!arguments.length) {
            return height;
        }
        height = h;
        return this;
    };

    return d3.rebind (render, dispatch, "on");
};

// Dummy data
// var graph = {
//     "nodes":[
//         {"name":"a","width":60,"height":40},
//         {"name":"b","width":60,"height":40},
//         {"name":"c","width":60,"height":40},
//         {"name":"d","width":60,"height":40},
//         {"name":"e","width":60,"height":40}
//     ],
//     "links":[
//         {"source":1,"target":2},
//         {"source":2,"target":0},
//         {"source":2,"target":3},
//         {"source":2,"target":4},
//     ],
//     "constraints":[
//         {
//             "type":"alignment",
//             "axis":"x",
//             "offsets":[
//                 {"node":1, "offset":0},
//                 {"node":2, "offset":0},
//                 {"node":3, "offset":0}
//             ]
//         },
//         {
//             "type":"alignment",
//             "axis":"y",
//             "offsets":[
//                 {"node":0, "offset":0},
//                 {"node":1, "offset":0},
//                 {"node":4, "offset":0}
//             ]
//         }
//     ]
// };

var graph = {
    "nodes" : [
        {"name":"a","width":60,"height":40}, // 0
        {"name":"b","width":60,"height":40}, // 1
        {"name":"c","width":60,"height":40}, // 2
        {"name":"d","width":60,"height":40}, // 3
        {"name":"e","width":60,"height":40}, // 4
        {"name":"f","width":60,"height":40}  // 5
    ],
    "links" : [
        {"source" : 1, "target" : 0},
        {"source" : 2, "target" : 0},
        {"source" : 0, "target" : 3},
        {"source" : 0, "target" : 4},
        {"source" : 0, "target" : 5},
    ],
    "constraints" : [
        {
            "type" : "alignment",
            "axis" : "y",
            "offsets" : [
                { "node" : 3, "offset" : 0 },
                { "node" : 4, "offset" : 0 },
                { "node" : 5, "offset" : 0 }
            ]
        },
        {
            "type" : "alignment",
            "axis" : "x",
            "offsets" : [
                { "node" : 1, "offset" : 0 },
                { "node" : 2, "offset" : 0 }
            ]
        }
    ]
};

module.exports = exports = diseaseGraph;
