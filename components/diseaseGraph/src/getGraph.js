function getGraph (efo_info) {
    var nodes = [];
    var index = [];
    var links = [];
    var constraints = [];
    var groups = [];
    var ix=0;
    var width = 60;
    var height = 40;

    // EFO node
    nodes.push({
        "efo" : efo_info.efo,
        "label" : efo_info.label,
        "width" : efo_info.label.length * 8,
        "height" : height,
    });
    index[efo_info.efo] = ix++;

    // Children alignment and grouping
    // var childrenConstraint = {
    //     "type" : "alignment",
    //     "axis" : "y",
    //     "offsets" : []
    // };
    var childrenGroup = {
        "leaves" : []
    };
    for (var i=0; i<efo_info.children.length; i++) {
        nodes.push({
            "efo" : efo_info.children[i].code,
            "label" : efo_info.children[i].label,
            "width" : efo_info.children[i].label.length * 8,
            "height" : height,
            "type" : "child"
        });
        index[efo_info.children[i].code] = ix++;
        var srcIndex = index[efo_info.efo];
        var dstIndex = index[efo_info.children[i].code];
        links.push({
            "source" : srcIndex,
            "target" : dstIndex
        });
        // childrenConstraint.offsets.push({
        //     "node" : dstIndex,
        //     "offset" : 0
        // });
        childrenGroup.leaves.push (dstIndex);
    }
    //constraints.push(childrenConstraint);
    if (childrenGroup.leaves.length) {
        groups.push(childrenGroup);
    }

    // Paths
    var linksIndex = {};
    var ancestorGroup = {
        "leaves" : []
    };
    for (var j=0; j<efo_info.paths.length; j++) {
        var path = efo_info.paths[j];
        for (var k=path.length-2; k>=0; k--) {
            var thisNode = path[k];
            var thisChild = path[k+1];
            // If this node has not been visited yet, store it
            if (index[thisNode.efo] === undefined) {
                nodes.push({
                    "efo" : thisNode.efo,
                    "label" : thisNode.label,
                    "width" : thisNode.label.length*8,
                    "type" : "ancestor",
                    "height" : height
                });
                ancestorGroup.leaves.push(ix);
                index[thisNode.efo] = ix++;
            }
            // If the child of the node has not been visited yet, store it
            if (index[thisChild.efo] === undefined) {
                nodes.push({
                    "efo" : thisChild.efo,
                    "label" : thisChild.label,
                    "width" : thisChild.label.length*8,
                    "type" : "ancestor",
                    "height" : height
                });
                ancestorGroup.leaves.push(ix);
                index[thisChild.efo] = ix++;
            }

            if (linksIndex[thisNode.efo] === undefined) {
                linksIndex[thisNode.efo] = {};
            }
            if (linksIndex[thisChild.efo] === undefined) {
                linksIndex[thisChild.efo] = {};
            }
            if (linksIndex[thisNode.efo][thisChild.efo] === undefined) {
                links.push({
                    "source" : index[thisChild.efo],
                    "target" : index[thisNode.efo]
                });
                linksIndex[thisNode.efo][thisChild.efo] = true;
                linksIndex[thisChild.efo][thisNode.efo] = true;
                // Parent always on top of childrens
                constraints.push({
                    "axis" : "y",
                    "left" : index[thisNode.efo],
                    "right" : index[thisChild.efo],
                    "gap" : 50
                });
            }
        }
    }

    if (ancestorGroup.leaves.length) {
        groups.push(ancestorGroup);
    }

    // Aligning ancestors and 1 child
    childrenGroup.leaves.map (function (d) {
        constraints.push({
            "axis" : "y",
            "left" : 0,
            "right" : d,
            "gap" : 70
        });
    });

    ancestorGroup.leaves.map (function (d) {
        constraints.push({
            "axis" : "y",
            "left" : d,
            "right" : 0,
            "gap" : 70
        });
    });

    // var childrenConstraint = {
    //     "axis" : "y",
    //     "left" : 0,
    //     "right" : childrenGroup.leaves[0],
    //     "gap" : 20
    // };

    // Aligning ancestors and 1 parent
    // var ancestorConstraint = {
    //     "axis" : "y",
    //     "left" : ancestorGroup.leaves[0],
    //     "right" : 0,
    //     "gap" : 20
    // };
    //constraints.push(childrenConstraint);
    // constraints.push(ancestorConstraint);

    console.log({
        "nodes" : nodes,
        "links" : links,
        "constraints" : constraints,
        "groups" : groups
    });

    return {
        "nodes" : nodes,
        "links" : links,
        "constraints" : constraints,
        "groups" : groups
    };
}


module.exports = exports = getGraph;
