var tnt_node = require("tnt.tree.node");
var _ = require("lodash");
var bubbles_tooltips = require("./tooltips.js");

var geneAssociations = function () {
    var config = {
        target : "",
    	diameter : 1000,
    	cttvApi : undefined,
    };

    var bubblesView;
    var tooltips = bubbles_tooltips();
    //var flowerView;

    // This code is duplicated several times now (controllers, directives and components)

    function render (div) {
        var data = config.data;

        // Set up the bubbles view correctly

        bubblesView
            .data(config.root)
            .value("association_score")
            .key("efo_code")
            .label("label")
            .diameter(config.diameter);

        var tree = bubblesView.data();

        // Tooltips

        bubblesView
            .on("click", tooltips.click)
            .on("mouseover", tooltips.mouseover)
            .on("mouseout", tooltips.mouseout);
        	// Render
    	bubblesView(div.node());

    }

    var ga = function (bubbles, flower, div) {
        bubblesView = bubbles;
        tooltips
            .flowerView(flower)
            .target(config.target);

        //flowerView = flower;
        var vis = d3.select(div)
            .append("div")
            .style("position", "relative");

        if ((config.data === undefined) && (config.cttvApi !== undefined)) {
            var api = config.cttvApi;
            var url = api.url.associations({
                target: config.target,
                datastructure: "tree"
            });
            api.call(url)
                .then (function (resp) {
                    var data = resp.body.data;
                    ga.data(data);
                    // processData(data);
                    // config.data = data;
                    render(vis);
            });
        } else {
            render(vis);
        }
    };

    // process data
    // flattening the tree (duplicates?)
    function processData (data) {
        if (data === undefined) {
            return [];
        }

        if (data.children === undefined) {
            return data;
        }
        var therapeuticAreas = data.children;
        for (var i=0; i<therapeuticAreas.length; i++) {
            var tA = therapeuticAreas[i];
            var taChildren = tA.children;
            if (taChildren === undefined) {
                // If the TA doesn't have a child, just create one for it with the same information as the TA
                tA.children = [_.clone(tA)];
                //continue;
            }
            var flattenChildren = tnt_node(tA).flatten(true).data().children;
            var newChildren = [];
            var nonRedundant = {};
            for (var j=0; j<flattenChildren.length; j++) {
                var childData = flattenChildren[j];
                if (nonRedundant[childData.name] === undefined) {
                    nonRedundant[childData.name] = 1;
                    newChildren.push(childData);
                }
            }
            tA.children = newChildren;
        }
        return sortData(data);
    }

    function sortData (data) {
        var dataSorted = _.sortBy(data.children, function (d) {
            return d.children ? -d.children.length : 0;
        });

        for (var i=0; i<data.children.length; i++) {
            data.children[i].children = _.sortBy (data.children[i].children, function (d) {
                return -d.association_score;
            });
        }
        data.children = dataSorted;
        return data;
    }

    // Getters / Setters
    ga.data = function (d) {
        if (!arguments.length) {
            return config.data;
        }
        //processData(d);
        config.data = processData(d);
        //config.data = d;
        config.root = tnt_node(config.data);
        return this;
    };

    ga.target = function (t) {
        if (!arguments.length) {
            return config.target;
        }
        config.target = t;
        return this;
    };

    ga.diameter = function (d) {
        if (!arguments.length) {
            return config.diameter;
        }
        config.diameter = d;
        // Hot plug
        if (bubblesView) {
            bubblesView.diameter(d);
        }
        return this;
    };

    ga.cttvApi = function (api) {
        if (!arguments.length) {
            return config.cttvApi;
        }
        config.cttvApi = api;
        return this;
    };

    ga.filters = function (dts) {
        if (!arguments.length) {
            return tooltips.filters();
        }
        tooltips.filters(dts);
        return this;
    };

    ga.names = function (dts) {
        if (!arguments.length) {
            return tooltips.names();
        }
        tooltips.names(dts);
        return this;
    };

    // Other methods to interact with the bubblesView
    ga.update = function (data) {
        ga.data (data);
        bubblesView
            .data(config.root);
        bubblesView.update();
    };

    ga.selectTherapeuticArea = function (efo) {
	var taNode = config.root.find_node (function (node) {
	    return node.property("efo_code") == efo || node.property("name") == efo;
	});
	if (taNode.property("focused") === true) {
	    taNode.property("focused", undefined);
	    bubblesView.focus(config.root);
	} else {
	    taNode.property("focused", true);
	    // release prev focused node
	    bubblesView.focus().property("focused", undefined);
	    // focus the new node
	    bubblesView.focus(taNode);
	}
	bubblesView.select(config.root);
	return this;
    };

    ga.selectDisease = function (efo) {
        // This code is for diseases with multiple parents
        // var nodes = nodeData.find_all(function (node) {
        //  return node.property("efo_code") === efo;
        // });
        // var lca;
        // if (nodes.length > 1) {
        //  lca = tree.lca(nodes);
        // } else {
        //  lca = nodes[0].parent();
        // }
        var dNode = config.root.find_node (function (node) {
            if (node.parent() === undefined) {
                return false;
            }
            return efo.efo === node.property("efo_code") && efo.parent_efo === node.parent().property("efo_code");
        });
        if (dNode.property("selected") === true) {
            dNode.property("selected", undefined);
            bubblesView.select(config.root);
        } else {
            dNode.property("selected", true);
            bubblesView.select([dNode]);
        }
        return this;
    };

    return ga;
};

module.exports = geneAssociations;
