var tnt_tree = require("tnt.tree");
var tree_tooltips = require("./tooltips.js");

var geneAssociationsTree = function () {
    "use strict";

    var config = {
	data : undefined,
	diameter : 1000,
	cttvApi : undefined,
	legendText : "<text>Score range</text>"
    };

    var treeVis = tnt_tree();
    var tooltips = tree_tooltips();

    // var scale = d3.scale.quantize()
    // 	.domain([1,1])
    // 	.range(["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"]);
    var scale = d3.scale.linear()
	.domain([0,1])
	.range(["#ffffff", "#08519c"]);

    // function setTitles () {
	// d3.selectAll(".tnt_tree_node")
	//     .append("title")
	//     .text(function (d) {
	// 	return d.label;
	//     });
    // }

    function sortNodes () {
        treeVis.root().sort (function (node1, node2) {
            return node2.n_hidden() - node1.n_hidden();
        });
    }

    function render (flowerView, div) {
	var data = config.data;

    // node shapes (squares for Therapeutic areas // circles for the rest)
    var ta_display = tnt_tree.node_display.square()
        .size(6)
        .fill (function (node) {
            return scale(node.property("association_score"));
        });
    var node_display = tnt_tree.node_display.circle()
        .size(8)
        .fill (function (node) {
            return scale(node.property("association_score"));
        });
	treeVis
	    .data(config.data)
        .node_display ( tnt_tree.node_display()
            .size(12)
            .display (function (n) {
                if (n.property('__depth') === 1) {
                    ta_display.display().call(this, n);
                } else {
                    node_display.display().call(this, n);
                }
            })
        )
	    // .node_display(tnt_tree.node_display.circle()
	    // 		  .size(8)
	    // 		  .fill(function (node) {
	    // 		      return scale(node.property("association_score"));
	    // 		  })
	    // 		 )
	    //.on_click(nodeTooltip)
        .on("click", tooltips.click)
        .on("mouseover", tooltips.mouseover)
        .on("mouseout", tooltips.mouseout)
	    .label(tnt_tree.label.text()
		   .height(20)
	    	   .text(function (node) {
	    	       if (node.is_leaf()) {
	    		   var diseaseName = node.property("label");
	    		   if (diseaseName && diseaseName.length > 30) {
	    		       diseaseName = diseaseName.substring(0,30) + "...";
	    		   }
			   if (node.is_collapsed()) {
			       diseaseName += (" (+" + node.n_hidden() + " diseases)");
			   }
	    		   return diseaseName;
	    	       }
	    	       return "";
	    	   })
	    	   .fontsize(14)
	    	  )
	    .layout(tnt_tree.layout.vertical()
	    	    .width(config.diameter)
	    	    .scale(true)
	    	   );

    setBranchLengths (treeVis);


    // collapse all the therapeutic area nodes
	// if (tas !== undefined) {
	//     for (var i=0; i<tas.length; i++) {
	// 	tas[i].toggle();
	//     }
	//     sortNodes();
	// }

	treeVis(div.node());


    // Apply a legend on the node shapes
    var shapeLegendDiv = div
        .append("div")
        .style({
            "width" : "50%",
            "display" : "inline-block"
        });

    var s = shapeLegendDiv.selectAll("span")
        .data ([
            {
                "type" : "square",
                "label" : "Therapeutic Area"
            },
            {
                "type" : "circle",
                "label" : "Disease"
            }
        ])
        .enter()
        .append("div")
        .style({
            "font-size": "12px"
        });

    s
        .append("span")
        .style({
            "display": "block",
            "width"  : "15px",
            "height" : "15px",
            "border" : "1px solid #777",
            "float"  : "left",
        })
        .style("border-radius", function (d) {
            if (d.type === "circle") {
                return "50%";
            }
            return "";
        })
        .append("span")
        .style({
            "display" : "block",
            "width"   : "100%",
            "height"  : "100%",
            //"float"   : "left",
        });
    s
        .append("span")
        .style({
            "padding-right" : "5px",
            "padding-top"   : "2px",
            //"float"         : "left",
            "padding-left"  : "5px"
        })
        .text(function (d) {
            return d.label;
        });


	// Apply a legend on the node's color
    var legendBar = div
        .append("div")
        .style({
            "float": "left",
            "width" : "50%"
        });

	var legendColors = ["#ffffff", "#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"];

    legendBar
        .append("span")
        .style({
            "display" : "block",
            "float"   : "left",
            "padding-left" : "2px"
        })
        .text("0");

    legendBar.selectAll(".legendBox")
        .data(legendColors)
        .enter()
        .append("span")
        .attr("class", "legendBox")
        .style({
            "display" : "block",
            "width" : "20px",
            "height" : "20px",
            "border" : "0.5px solid #FFF",
            "float" : "left",
        })
        .style("background", function (d) {
            return d;
        });

    legendBar
        .append("span")
        .style({
            "display" : "block",
            "float" : "left",
            "padding-left" : "5px",
        })
        .text("1");
    legendBar
        .append("span")
        .style({
            "display" : "block",
            "float" : "left",
            "padding-left" : "10px",
        })
        .html (config.legendText);

	// Add titles
	// setTitles();
	// d3.selectAll(".tnt_tree_node")
	//     .append("title")
	//     .text(function (d) {
	// 	return d.label;
	//     });

    }

    // deps: tree_vis, flower
    var theme = function (flowerView, div) {
        tooltips
            .treeView (treeVis)
            .flowerView (flowerView)
            .target (config.target);

	var vis = d3.select(div)
	    .append("div")
	    .style("position", "relative");

	if ((config.data === undefined) && (config.target !== undefined) && (config.cttvApi !== undefined)) {
	    var api = config.cttvApi;
	    var url = api.url.associations({
		gene : config.target,
		datastructure : "tree",
		// TODO: Add datatypes here!
	    });
	    api.call(url)
		.then (function (resp) {
		    config.data = resp.body.data;
		    render(flowerView, vis);
		});
	} else {
	    render(flowerView, vis);
	}
    };


    theme.update = function () {
        treeVis.data(config.data);
        // collapse all the therapeutic area nodes
        // var root = treeVis.root();
        // var tas = root.children();
        // if (tas) {
        //     for (var i=0; i<tas.length; i++) {
        // 	tas[i].toggle();
        //     }
        // }
        setBranchLengths(treeVis);
        sortNodes();
        treeVis.update();
        // setTitles();
    };

    // size of the tree
    theme.diameter = function (d) {
	if (!arguments.length) {
	    return config.diameter;
	}
	config.diameter = d;
	return this;
    };

    //
    theme.target = function (t) {
	if (!arguments.length) {
	    return config.target;
	}
	config.target = t;
	return this;
    };

    theme.cttvApi = function (api) {
	if (!arguments.length) {
	    return config.cttvApi;
	}
	config.cttvApi = api;
	return this;
    };

    // data is object
    theme.data = function (d) {
	if (!arguments.length) {
	    return config.data;
	}
	config.data = d;
	return this;
    };

    // datatypes
    theme.datatypes = function (dts) {
	if (!arguments.length) {
	    return tooltips.datatypes();
	}
    tooltips.datatypes(dts);
    //config.datatypes = dts;
	return this;
    };

    // Legend text
    theme.legendText = function (t) {
	if (!arguments.length) {
	    return config.legendText;
	}
	config.legendText = t;
	return this;
    };

    function setBranchLengths (treeVis) {
        // Branch lengths:
        // First pass: Get the max depth:
        var setDepth = function (node, currDepth) {
            node.property('__depth', currDepth);
            var children = node.children(true) || [];
            for (var i=0; i<children.length; i++) {
                setDepth(children[i], currDepth+1);
            }
        };
        setDepth(treeVis.root(), 0);

        var tasNodes = treeVis.root().children();
        var maxDepth = 0;
        var findMaxDepth = function (n) {
            var depth = n.property('__depth');
            if (depth > maxDepth) {
                maxDepth = depth;
            }
        };
        for (var i=0; i<tasNodes.length; i++) {
            var taNode = tasNodes[i];
            taNode.apply (findMaxDepth);
        }

        // Second pass: Apply branch lengths
        var setLength = function (n) {
            if (n.children() === undefined) {
                n.property("branch_length", 1 + (maxDepth - n.property('__depth')));
            } else {
                n.property("branch_length", 1);
            }
        };
        for (var j=0; j<tasNodes.length; j++) {
            var taNode = tasNodes[j];
            taNode.property("branch_length", 1);

            taNode.apply (setLength);
        }

    }


    return theme;
};

module.exports = exports = geneAssociationsTree;
