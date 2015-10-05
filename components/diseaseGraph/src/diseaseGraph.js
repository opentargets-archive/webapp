var getGraph = require("./getGraph.js");
var graph_tooltips = require("./tooltips.js");
var legend = require("./legend.js");
var deferCall = require("tnt.utils").defer_cancel;

var diseaseGraph = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "mouseover", "mouseout", "tick");

    var color = d3.scale.category10();

    var graph;

    var vis;
    var zoom;
    var cttvApi;
    var tooltips;

    // default dimensions
    var width = 800;
    var height = 800;

    var d3cola = cola.d3adaptor()
        .linkDistance(200)
        .avoidOverlaps(true)
        .size([width, height]);

    var render = function (container) {
        tooltips = graph_tooltips()
            .cttvApi (cttvApi)
            .actions({
                "focus" : function (efo) {
                    var url = cttvApi.url.disease({
                        "code" : efo.efo
                    });
                    cttvApi
                        .call(url)
                        .then (function (resp) {
                            var data = resp.body;
                            var obj = parseDisease(data);
                            render.data(obj);
                            render.update();
                        });
                }
        });

        var div = d3.select(container)
            .append("div")
            .style("position", "relative");

        zoom = d3.behavior.zoom()
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
            .attr('height', "100%");
            // .call(zoom);

        vis = svg
            .append("g");
            // .call(zoom)
            // .append("g");

        render.update();
        //legend(div);
    };


    render.update = function() {
        graph.nodes.forEach(function (v) {
            v.x = 400;
            v.y = 50;
        });

        d3cola
            .nodes(graph.nodes)
            .links(graph.links)
            .alpha(0.5)
            .constraints(graph.constraints)
            .groups(graph.groups)
            .start(20,20,20);

        // Links
        var link = vis.selectAll(".cttv_diseaseGraph_link")
            .data(graph.links, function (d) {
                return d.source.efo + "_" + d.target.efo;
            });

        link
            .enter()
            .append("line")
            .attr("class", "cttv_diseaseGraph_link");

        link
            .exit()
            .remove();

        // Nodes
        var node = vis.selectAll(".cttv_diseaseGraph_node")
            .data(graph.nodes, function (d) {
                return d.efo;
            });

        var node_drag = d3.behavior.drag()
            .on("dragstart", dragstart)
            .on("drag", dragmove)
            .on("dragend", dragend);

        function dragstart(d, i) {
            d3cola.stop(); // stops the force auto positioning before you start dragging
        }

        function dragmove(d, i) {
            d.px += d3.event.dx;
            d.py += d3.event.dy;
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            tick(); // this is the key to make it work together with updating both px,py,x,y on d !
        }

        function dragend(d, i) {
            //d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
            tick();
            d3cola.start();
        }

        var newNode = node
            .enter()
            .append("g")
            .attr("class", "cttv_diseaseGraph_node")
            .on("click", function (d) {
                if (d3.event.defaultPrevented) {
                    return;
                }
                tooltips.click.call(this, d);
            })
            .call(d3cola.drag);
            //.call(node_drag);

        newNode
            .append("rect")
            .attr("class", "cttv_diseaseGraph_box")
            .attr("x", function (d) {
                return -d.width/2;
            })
            .attr("y", function (d) {
                return -d.height/2;
            })
            .attr("width", function (d) { return d.width; })
            .attr("height", function (d) { return d.height; })
            .attr("rx", 5).attr("ry", 5)
            .classed("cttv_diseaseGraph_child", function (d) {
                return d.type === "child";
            })
            .classed("cttv_diseaseGraph_ancestor", function (d) {
                return d.type === "ancestor";
            });
            //.call(moveToFront);

        newNode
            .append("text")
            .attr("class", "cttv_diseaseGraph_label")
            .attr("pointer-events", "none")
            .text(function (d) {
                return d.label;
            });
        node.call(moveToFront);


        // node
        //     .enter()
        //     .append("rect")
        //     .attr("class", "cttv_diseaseGraph_node")
        //     .attr("width", function (d) { return d.width; })
        //     .attr("height", function (d) { return d.height; })
        //     .attr("rx", 5).attr("ry", 5)
        //     .on("click", function (d) {
        //         if (d3.event.defaultPrevented) {
        //             return;
        //         }
        //         tooltips.click.call(this, d);
        //     })
        //     .call(d3cola.drag);
        //     //.call(node_drag);


        node
            .exit()
            .remove();

        // var label = vis.selectAll(".cttv_diseaseGraph_label")
        //     .data(graph.nodes, function (d) {
        //         return d.efo;
        //     });

        // Labels
        // label
        //     .enter()
        //     .append("text")
        //     .attr("class", "cttv_diseaseGraph_label")
        //     .attr("pointer-events", "none")
        //     .text(function (d) {
        //         return d.label;
        //     })
        //     .call(d3cola.drag);
        //     //.call(node_drag);
        //
        // label
        //     .call(moveToFront);
        //
        // label
        //     .exit()
        //     .remove();

        d3cola.on("tick", tick);

        function tick() {
            adjustScaleLevel();

            node
                // .attr("x", function (d) {
                //     return d.x - d.width/2;
                // })
                // .attr("y", function (d) {
                //     return d.y - d.height / 2;
                // });
                .attr("transform", function (d) {
                    return "translate("+ [d.x, d.y] + ")";
                });

            // label
            //     .attr("x", function (d) {
            //         return d.x;
            //     })
            //     .attr("y", function (d) {
            //         var h = this.getBoundingClientRect().height;
            //         return d.y + h/4;
            //     });

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
        }

        function adjustScaleLevel() {

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

            vis
                .attr("transform", "translate(" + [startX, startY] + ") scale(" + scaleMin + ")");

            zoom.translate([startX, startY]);
            zoom.scale(scaleMin);
            //
            // vis.call(zoom);
        }

        var deferredScale = deferCall (adjustScaleLevel, 200);

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

    render.cttvApi = function (api) {
        if (!arguments.length) {
            return cttvApi;
        }
        cttvApi = api;
        return this;
    };

    function moveToFront() {
        return this.each(function() {
            this.parentNode.appendChild(this);
        });
    }

    function parseDisease(data) {
        var obj = {
            "label" : data.label
        };

        // efo code
        var efo_url = data.code;
        var efo_url_parts = efo_url.split("/");
        var efo_code = efo_url_parts.pop();
        obj.efo = efo_code;

        // paths
        var paths = [];
        for (var i=0; i<data.path.length; i++) {
            data.path[i].shift();
            var path=[];
            for(var j=0; j<data.path[i].length; j++){
                path.push({
                    "label" : data.path[i][j].label,
                    "efo" : data.path[i][j].uri.split("/").pop()
                });
            }
            paths.push(path);
        }
        obj.paths = paths;

        // children
        obj.children = data.children;

        return obj;
    }

    return d3.rebind (render, dispatch, "on");
};

module.exports = exports = diseaseGraph;
