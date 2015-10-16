var tree_node = require("tnt.tree.node");

var bubblesView = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "mouseover", "mouseout");

    var conf = {
        diameter : 600,
        format : d3.format(",d"),
        color : d3.scale.category20c(),
        colorPalette : true,
        data : undefined,
        value : "value",
        key : "name",
        label: "name",
        divId : undefined,
        on : function () {},
        //onclick : function () {},
        duration: 1000,
        breadcrumsClick : function () {
            render.focus(conf.data);
        },
        maxVal : 1,
        legendText : "<text>Current score range</text>",
        useFullPath : false
        //labelOffset : 10
    };

    var focus; // undef by default
    var highlight; // undef by default
    var view;
    var svg;
    var legend;
    var bubblesView_g;
    var breadcrums;
    var pack;
    var nodes;
    var circle;
    var label;
    var path;
    var defs;

    var currTranslate = [0,0];
    var currScale = 1;
    // var zoom = d3.behavior.zoom()
    // 	.scaleExtent([0.8, Infinity])
    // 	.on("zoom", function () {
    // 	    redraw(svg);
    // 	});

    /*
     * Render valid JSON data
     */
    var render = function(div) {

        conf.divId = d3.select(div).attr("id");

        // breadcrums-like navigation
        breadcrums = d3.select(div)
            .append("div")
            .attr("id", "cttv_bubblesView_breadcrums")
            .attr("height","50");

        svg = d3.select(div)
            .append("svg")
            .attr("width", conf.diameter)
            .attr("height", conf.diameter)
            .attr("class", "cttv_bubblesView");

        defs = svg.append("defs");

        bubblesView_g = svg
            .append("g");


        pack = d3.layout.pack()
            .value(function (d) {
                return d[conf.value];
            })
            .sort(null)
            .size([conf.diameter, conf.diameter])
            .padding(1.5);

        if (conf.maxVal !== undefined) {
            legend = svg
                .append("g")
                .attr("transform", "translate(20, " + (conf.diameter - 20) + ")");
            legend
                .append("rect")
                .attr("x", 0)
                .attr("y", -5)
                .attr("width", 80)
                .attr("height", 10)
                .attr("fill", "#c6dcec");
            legend
                .append("rect")
                .attr("class", "cttv_bubblesView_legendBar")
                .attr("x", 0)
                .attr("y", -5)
                .attr("width", 0)
                .attr("height", 10)
                .attr("fill", d3.rgb(62,139,173));
            // legend
            //     .append("polygon")
            //     .attr("points", "0,5 -5,15 5,15")
            //     .attr("fill", "none")
            //     .attr("stroke", "black")
            //     .attr("stroke-width", 2);

            // legend
            //     .append("text")
            //     .attr("class", "cttv_bubblesView_currentMaxValue")
            //     .attr("x", 0)
            //     .attr("y", -5)
            //     .attr("text-anchor", "middle")
            //     .text("0");

            legend
                .append("text")
                .attr("x", -5)
                .attr("y", 5)
                .attr("text-anchor", "end")
                .text(0);

            legend
                .append("text")
                .attr("x", 85)
                .attr("y", 5)
                .attr("text-anchor", "start")
                .text(conf.maxVal);

            var gLeg = legend
                .append("g")
                .attr("transform", "translate(100, 5)")
                .html(conf.legendText);

    	    // legend
    	    // 	.append("a")
    	    // 	.attr("x", 100)
    	    // 	.attr("y", 5)
    	    // 	.attr("text-anchor", "start")
    	    // 	.html("<a href='xlink:href=\"http://www.google.com\"'>Hurrah!</a>");

        }

        render.update();

        var d = conf.data.data();
        view = [d.x, d.y, d.r*2];
        //focusTo([d.x, d.y, d.r*2]);
        //render.focus (conf.data);

        return render;
    };

    render.update = function () {
        // Safely unfocus on update

        if (conf.data.children()) {
            render.focus(conf.data);
        }

        var packData = pack.nodes(conf.data.data());

        circle = bubblesView_g.selectAll("circle")
            .data(packData, function (d) {
                if (d._parent === undefined) {
                    return d[conf.key];
                }
                return d[conf.key] + "_" + d._parent[conf.key];
            });
        //.data(packData)

        // new circles
        circle
            .enter()
            .append("circle")
            .attr("class", function (d) {
                return "bubblesView_" + d[conf.key] + "_" + conf.divId;
            })
            .classed("bubblesViewNode", true)
            .attr("r", 0)
            .on("dblclick", function () {
                if (d3.event.defaultPrevented) {
                    return;
                }
                d3.event.stopPropagation();
            })
            .on ("click", function (d) {
                if (d3.event.defaultPrevented) {
                    return;
                }
                dispatch.click.call(this, tree_node(d));
            })
            .on ("mouseover", function (d) {
                dispatch.mouseover.call(this, tree_node(d));
            })
            .on ("mouseout", function (d) {
                dispatch.mouseout.call(this, tree_node(d));
            });
            // .on("click", function (d) {
            //     console.warn(" ===> ");
            //     if (d3.event.defaultPrevented) {
            //         return;
            //     }
            //     conf.onclick.call(this, tree_node(d));
            // });

        var exitCircles = circle
            .exit();

        // // titles
        // bubblesView_g.selectAll("title")
        //     .data(packData, function (d) {
        // 	return d._id;
        //     })
        //     .enter()
        //     .append("title")
        //     .text(function(d) { return d[conf.key] + ": " + conf.format(d[conf.value]); });

        //newNodes.append ("circle");

        //newNodes.append("text");

        path = defs.selectAll("path")
            .data(packData, function (d) {
                if (d._parent === undefined) {
                    return d[conf.key];
                }
                return d[conf.key] + "_" + d._parent[conf.key];
            });

        // new paths
        path
            .enter()
            .append("path")
            .attr("id", getPathId);
            //.attr("fill", "black");


        label = bubblesView_g.selectAll("text")
            .data(packData, function (d) {
                if (d._parent === undefined) {
                    return d[conf.key];
                }
                return d[conf.key] + "_" + d._parent[conf.key];
            });

        var newLabels = label
            .enter()
            .append("text")
            .attr("class", function (d) {
                if (d.children) {
                    return "topLabel";
                }
                return "leafLabel";
            })
            .style("cursor", "default")
            .attr("pointer-events", function (d) {return d.children ? "auto" : "none";})
            .on("click", function (d) { // only on those with pointer-events "auto" ie, on therapeutic areas labels
                if (d3.event.defaultPrevented) {
                    return;
                }
                dispatch.click.call(this, tree_node(d));
            })
            .attr("fill", "navy")
            .attr("font-size", 0)
            .attr("text-anchor", "middle");

        // Create new labels on therapeutic areas
        // newLabels
        //     .each(function (d, i) {
        //         if (d.children) {
        //             d3.select(this)
        //                 .append("textPath")
        //                 // .attr("xlink:href", window.location.href + "#" + getPathId(d))
        //                 .attr("startOffset", "50%")
        //                 .text(function () {
        //                     if (Math.PI*d.r/8 < 3) {
        //                         return "";
        //                     }
        //                     return d[conf.label] ? d[conf.label].substring(0, Math.PI*d.r/8) : "";
        //                 });
        //         }
        //  });

        var exitLabels = label
            .exit();

        var updateTransition = svg.transition()
            .duration(conf.duration);

        updateTransition
            .selectAll("circle")
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .attr("r", function (d) {
                return d.r;
            });

        // Move labels
        updateTransition
            .selectAll(".leafLabel")
            .attr("font-size", function (d) {
                var circleLength = d.r / 3;
                var labelLength = d[conf.label] ? d[conf.label].length : 0;
                if (circleLength < labelLength) {
                    return 10;
                }
                if (circleLength * 0.8 < labelLength) {
                    return 12;
                }
                if (circleLength * 0.6 < labelLength) {
                    return 14;
                }
            })
            .attr("dy", ".3em")
            .attr("x", function (d) { return d.x; })
            .attr("y", function (d) { return d.y; });
            // .text(function (d) {
            //     if (d.r/3 < 3) {
            //         return "";
            //     }
            //     return d[conf.label].substring(0, d.r / 3);
            // });

        updateTransition
            .selectAll(".topLabel")
            .attr("font-size", 10);

        // This has to be called after the updateTransition (otherwise, updateTransition would override these transitions)
        exitCircles
            .transition()
            .duration(1000)
            .attr("r", 0)
            .remove();
        exitLabels
            .transition()
            .duration(1000)
            .attr("font-size", 0)
            .remove();

            // Move labels
            // label
            // .each(function (d, i) {
            //     if (!d.children) {
            //         d3.select(this)
            //             .transition()
            //             .duration(conf.duration)
            //             .attr("dy", ".3em")
            //             .attr("x", function (d) { return d.x; })
            //             .attr("y", function (d) { return d.y; })
            //             .text(function (d) {
            //                 return d[conf.label].substring(0, d.r / 3);
            //             });
            //     }
            // });

        updateTransition
            .selectAll("path")
            .attr("d", function (d) {
                return describeArc(d.x, d.y+10, d.r, 160, -160);
            });


        // Moving nodes
        circle
            //.attr("class", "node")
            .classed ("bubblesViewLeaf", function (d) {
                return !d.children;
            })
            .classed ("bubblesViewRoot", function (d) {
                return !d._parent;
            });
            // .transition()
            // .duration(conf.duration)
            // .attr("cx", function (d) {
            // 	return d.x;
            // })
            // .attr("cy", function (d) { return d.y; })
            // .attr("r", function (d) { return d.r; });


            // .attr("transform", function(d) {
            // 	return "translate(" + d.x + "," + d.y + ")";
            // });

            //	nodes.select("path")

            //nodes.select("text")

            // nodes.select("circle")
            //     .attr ("class", function (d) {
            //     	return "bubblesView_" + d[conf.key] + "_" + conf.divId;
            //     })
            //     .transition()
            //     .duration(conf.duration)
            //     .attr ("r", function(d) {
            // 	//return d.r - (d.children ? 0 : conf.labelOffset);
            // 	return d.r;
            //     });

            //circle = nodes.selectAll("circle");

            // Exiting nodes
            // nodes
            //     .exit()
            //     .remove();

        // Size legend
        var maxCurrentVal = 0;
        conf.data.apply(function (node) {
            var score = node.property("association_score");
            if (score && score > maxCurrentVal) {
                maxCurrentVal = score;
            }
        });

        if (conf.maxVal !== undefined) {
            var legendScale = d3.scale.linear()
                .range([0,80])
                .domain([0,conf.maxVal]);

                var pos = legendScale(maxCurrentVal);
                legend
                    .select(".cttv_bubblesView_legendBar")
                    .transition()
                    .duration(conf.duration)
                    .attr("width", pos);
                legend
                    .select("polygon")
                    .transition()
                    .duration(conf.duration)
                    .attr("points", ((pos+0) + ",5 " + (pos-5) + ",15 " + (pos+5) + ",15"));
                legend
                    .select(".cttv_bubblesView_currentMaxValue")
                    .transition()
                    .duration(conf.duration)
                    .attr("x", pos)
                    .text(maxCurrentVal);
        }
    };

    ////////////////////////
    // Auxiliar functions //
    ////////////////////////
    function getPathId (d) {
        var id = "s";
        if (d[conf.key]) {
            id += d[conf.key];
            if (d._parent && d._parent[conf.key]) {
                id += d._parent[conf.key];
            }
        }
        return id;
    }

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    function describeArc(x, y, radius, startAngle, endAngle){
        var start = polarToCartesian(x, y, radius, endAngle);
        var end = polarToCartesian(x, y, radius, startAngle);
        var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
        var d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, 1, 1, end.x, end.y
        ].join(" ");
        return d;
    }

    function redraw (viz) {
        viz.attr ("transform",
        "translate (" + d3.event.translate + ") " +
        "scale (" + d3.event.scale + ")");
    }

    function focusTo (v) {
        var k = conf.diameter / v[2];
        var offset = conf.diameter / 2;
        view = v;

        circle
            .attr("cx", function (d) {
                return ((d.x - v[0])*k)+offset;
            })
            .attr("cy", function (d) {
                return ((d.y - v[1])*k)+offset;
            })
            // .attr("transform", function(d) {
            // 	return "translate(" + (((d.x - v[0]) * k) + offset) + "," + (((d.y - v[1]) * k) + offset) + ")";
            // });
            .attr("r", function(d) {
                return d.r * k;
            });

        path
            .attr("d", function (d) {
                return describeArc(((d.x-v[0])*k)+offset, ((d.y-v[1])*k)+10+offset, d.r*k, 160, -160);
            });

        label
            .each(function (d, i) {
                if (d.children) {
                    d3.select(this)
                        .select("*")
                        .remove();
                    d3.select(this)
                        .append("textPath")
                        // .attr("xlink:href", function () {
                        //     return "#s"+i;
                        // })
                        // When the "base" tag is present in the page, linking by name doesn't work in FF (Safari and Chrome looks good). We prepend window.location.href to get full IRI
                        // https://gist.github.com/leonderijke/c5cf7c5b2e424c0061d2
                        .attr("xlink:href", (conf.useFullPath ? window.location.href : "") + "#" + getPathId(d))
                        .attr("startOffset", "50%")
                        .text(function () {
                            if (Math.PI*d.r*k/8 < 3) {
                                return "";
                            }
                            return d[conf.label] ? d[conf.label].substring(0, Math.PI*d.r*k/8) : "";
                        });
                } else {
                    d3.select(this)
                        .attr("x", function (d) { return ((d.x - v[0])*k)+offset; })
                        .attr("y", function (d) { return ((d.y - v[1])*k)+offset; })
                        .text(function (d) {
                            if (d[conf.label]) {
                                if (d.r*k / 3 < 3) {
                                    return "";
                                }
                                return d[conf.label].substring(0, d.r*k / 3);
                            }
                        })
                        .attr("font-size", function (d) {
                            var circleLength = d.r * k / 3;
                            var labelLength = d[conf.label] ? d[conf.label].length : 0;
                            if (circleLength < labelLength) {
                                return 10;
                            }
                            if (circleLength * 0.8 < labelLength) {
                                return 12;
                            }
                            if (circleLength * 0.6 < labelLength) {
                                return 14;
                            }
                        });
                }
            });
    }

    //////////
    // API  //
    //////////

    render.maxVal = function (v) {
        if (!arguments.length) {
            return conf.maxVal;
        }
        conf.maxVal = v;
        return this;
    };

    render.legendText = function (t) {
        if (!arguments.length) {
            return conf.legendText;
        }
        conf.legendText = t;
        return this;
    };

    render.select = function (nodes) {
        if (!arguments.length) {
            return highlight;
        }
        highlight = nodes;

        // Unhighlight everything
        d3.selectAll(".highlight")
            .classed("highlight", false);

        // No node to highlight
        if ((nodes === null) || (nodes === undefined) || (nodes.length === 0)) {
            return this;
        }

        for (var i=0; i<nodes.length; i++) {
            var node = nodes[i];
            var circle = d3.selectAll(".bubblesView_" + node.property(conf.key) + "_" + conf.divId);
            circle
                .classed ("highlight", true);
        }
        return this;
    };

    render.focus = function (node) {
        if (!arguments.length) {
            return focus;
        }

        // Breadcrums
        var up = [];
        node.upstream (function (ancestor) {
            if (ancestor.parent() === undefined) {
                up.push(ancestor.property(conf.label) || "All");
            } else {
                up.push(node.property(conf.label));
            }
        });
        up.reverse();

        var breadLabels = breadcrums.selectAll("span")
            .data(up, function (d) {
                return d;
            });

        breadLabels
            .enter()
            .append("span")
            .attr("class", "cttv_bubblesView_breadcrumLabel")
            .text(function (d) {
                return d;
            });
            breadLabels
            .classed ("cttv_bubblesView_link", false)
            .on ("click", null);

        breadLabels.exit().remove();

        breadcrums.selectAll(":not(:last-child)")
            .classed ("cttv_bubblesView_link", true)
            .on("click", conf.breadcrumsClick);

        // Focus
        focus = node;
        var focusData = focus.data();
        var transition = d3.transition()
            .duration (conf.duration)
            .tween ("zoom", function () {
                var i = d3.interpolateZoom (view, [focusData.x, focusData.y, focusData.r*2]);
                return function (t) {
                    focusTo(i(t));
                };
            });
        return this;
    };

    render.breadcrumsClick = function (cb) {
        if (!arguments.length) {
            return conf.breadcrumsClick;
        }
        conf.breadcrumsClick = cb;
        return this;
    };

    render.data = function (newData) {
        if (!arguments.length) {
            return conf.data;
        }
        conf.data = newData;
        return this;
    };

    // render.onclick = function (cbak) {
	// if (!arguments.length) {
	//     return conf.onclick;
	// }
	// conf.onclick = cbak;
	// return this;
    // };

    render.key = function (n) {
        if (!arguments.length) {
            return conf.key;
        }
        conf.key = n;
        return this;
    };

    render.label = function (n) {
        if (!arguments.length) {
            return conf.label;
        }
        conf.label = n;
        return this;
    };

    render.value = function (v) {
        if (!arguments.length) {
            return conf.value;
        }
        conf.value = v;
        return this;
    };

    render.diameter = function (d) {
        if (!arguments.length) {
            return conf.diameter;
        }
        conf.diameter = d;
        return this;
    };

    render.useFullPath = function (b) {
        if (!arguments.length) {
            return conf.useFullPath;
        }
        conf.useFullPath = b;
        return this;
    };

    // render.flat = function (bool) {
    // 	if (!arguments.length) {
    // 	    return conf.flat;
    // 	}
    // 	conf.flat = bool;
    // 	return this;
    // };

    // render.node = tree_node;
    //return render;
    return d3.rebind (render, dispatch, "on");
};

module.exports = bubblesView;
