var ensemblRestApi = require("tnt.ensembl");
var tnt_tree = require("tnt.tree");
var tree_tooltips = require("./tooltips.js");
var tree_legend = require("./legend.js");
var RSVP = require('rsvp');

var targetGeneTree = function () {
    "use strict";
    var id;
    var width = 600;

    var proxy = "";

    var species = [
        9606, // human
        10090, // mouse
        9823, // pig
        9615, // dog
        9544, // macaque
        // 9541, // crab-eating macaque --- NOT IN ENSEMBL
        10116, // rat
        10141, // guinea pig
        9986, // rabbit
        8364, // frog
        7955, // zebrafish
    ];

    var colorScale = d3.scale.linear()
        .domain([0,100])
        .range(["#CBDCEA", "#005299"]);

    var tooltips = tree_tooltips();
    var legend = tree_legend();

    var render = function (div) {

        var labelPic = tnt_tree.label.img()
            .src (function (node) {
                if (node.is_leaf()) {
                    var data = node.data();
                    var spName = data.taxonomy.scientific_name.replace(/ /g, "_");
                    return "/imgs/species/" + spName + ".png";
                }
            })
            .width(function (d) {
                return 30;
            })
            .height(function (d) {
                return 30;
            });


        var labelText = tnt_tree.label.text()
            .text(function (node) {
                if (node.is_leaf()) {
                    return node.data().sequence.name || node.data().id.accession;
                } else {
                    return "";
                }
            })
            .height(function (d) {
                return 35;
            })
            .color(function (node) {
                if (node.property("taxonomy").scientific_name === "Homo sapiens") {
                    return "#005299";
                }
                return "#333333";
            })
            .fontsize(10);

        var label = tnt_tree.label.composite()
            .add_label (labelPic)
            .add_label (labelText);

        var tree_vis = tnt_tree();
        tree_vis
            .on("click", tooltips.node)
            .layout(tnt_tree.layout.vertical()
                .width(width)
                .scale(true)
            )
            .node_display(tree_vis.node_display()
                .fill(function (node) {
                    var data = node.data();
                    var thisId = data.id;
                    if (thisId && thisId.accession === id) {
                        return "red";
                    }
                    if (node.is_leaf()) {
                        if (data.homology) {
                            return colorScale(data.homology.percId);
                        } else {
                            return "#FFFFFF";
                        }
                    }
                    return "#BBBBBB";
                })
                .size(5)
            )
            .label(label);

        var rest = ensemblRestApi();
        if (proxy) {
            rest
                .proxyUrl(proxy);
        }

        var homologsUrl = rest.url.homologues({
            "id": id,
            "target_taxons": species,
            "format": "full"
        });
        var homologsPromise = rest.call(homologsUrl);
            // .catch(function (err) {
            //     console.warn (err);
            // });

        var genetreeUrl = rest.url.gene_tree({
            "member_id" : id,
            "sequence" : "none",
            "species": ["human"]
        });
        var genetreePromise = rest.call(genetreeUrl);
            // .catch(function (err) {
            //     console.warn (err);
            // });

        RSVP.all([homologsPromise, genetreePromise])
            .then (function (resps) {
                // Homologues Data
                var homologues = resps[0].body.data[0].homologies;
                var homologuesInfo = parseHomologues(homologues);

                // GeneTree
                var genetreeData = resps[1].body.tree;
                tree_vis.data(genetreeData);
                var root = tree_vis.root();
                sortTree(root);
                var subtree = pruneTree(root, species, homologuesInfo);
                tree_vis.data(subtree.data());
                tree_vis(div);

                var treeDiv = d3.select(div).select("div");

                // Update the tree when the species are selected / deselected
                legend
                    .update(function (species) {
                        var subtree = pruneTree(root, species, homologuesInfo);
                        tree_vis.data(subtree.data());
                        tree_vis.update();
                    });

                legend(treeDiv.node());
            });
        RSVP.on("error", function (reason) {
            console.warn (reason);
        });
    };

    render.id = function (newId) {
        if (!arguments.length) {
            return id;
        }
        id = newId;
        return this;
    };

    render.width = function (w) {
        if (!arguments.length) {
            return width;
        }
        width = w;
        return this;
    };

    render.proxy = function (p) {
        if (!arguments.length) {
            return proxy;
        }
        proxy = p;
        return this;
    };

    function pruneTree (root, species, homologiesInfo) {
        var leaves = root.get_all_leaves();
        var retainedLeaves = leaves.filter(function (node) {
            var taxid = node.property('taxonomy').id;
            return species.indexOf(taxid) >=0 ;
        });

        addHomologies(retainedLeaves, homologiesInfo);
        var subtree = root.subtree(retainedLeaves);
        return subtree;
    }

    function parseHomologues (homologues) {
        var info = {};
        for (var i=0; i<homologues.length; i++) {
            var homolog = homologues[i];
            info[homolog.target.id] = {
                "cigarLine" : homolog.target.cigar_line,
                "percId" : homolog.target.perc_id,
                "percPos" : homolog.target.perc_pos,
                "species" : homolog.target.species,
                "taxonId" : homolog.target.taxon_id,
                "level" : homolog.taxonomy_level,
                "type" : homolog.type,
                "dn_ds" : homolog.dn_ds
            };
        }
        return info;
    }

    function addHomologies (leaves, homologiesInfo) {
        leaves.map (function (leaf) {
            var leafData = leaf.data();
            leafData.homology = homologiesInfo[leafData.id.accession] || undefined;
        });
    }

    function sortTree (root) {
        root.sort (function (node1, node2) {
            return hasThisGene(node2) - hasThisGene(node1);
        });
    }

    function hasThisGene(node) {
        return node.present (function (n) {
            return n.is_leaf() && n.property("id").accession === id;
        });
    }

    return render;
};
module.exports = exports = targetGeneTree;
