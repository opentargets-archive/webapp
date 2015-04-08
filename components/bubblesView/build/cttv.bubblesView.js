(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = bubblesView = require("./src/bubblesView.js");

},{"./src/bubblesView.js":11}],3:[function(require,module,exports){
var node = require("./src/node.js");
module.exports = exports = node;

},{"./src/node.js":10}],4:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":5}],5:[function(require,module,exports){
var api = function (who) {

    var _methods = function () {
	var m = [];

	m.add_batch = function (obj) {
	    m.unshift(obj);
	};

	m.update = function (method, value) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			m[i][p] = value;
			return true;
		    }
		}
	    }
	    return false;
	};

	m.add = function (method, value) {
	    if (m.update (method, value) ) {
	    } else {
		var reg = {};
		reg[method] = value;
		m.add_batch (reg);
	    }
	};

	m.get = function (method) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			return m[i][p];
		    }
		}
	    }
	};

	return m;
    };

    var methods    = _methods();
    var api = function () {};

    api.check = function (method, check, msg) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.check(method[i], check, msg);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.check(check, msg);
	} else {
	    who[method].check(check, msg);
	}
	return api;
    };

    api.transform = function (method, cbak) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.transform (method[i], cbak);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.transform (cbak);
	} else {
	    who[method].transform(cbak);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var checks = [];
	var transforms = [];

	var getter = opts.on_getter || function () {
	    return methods.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    for (var i=0; i<transforms.length; i++) {
		x = transforms[i](x);
	    }

	    for (var j=0; j<checks.length; j++) {
		if (!checks[j].check(x)) {
		    var msg = checks[j].msg || 
			("Value " + x + " doesn't seem to be valid for this method");
		    throw (msg);
		}
	    }
	    methods.add(method, x);
	};

	var new_method = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	};
	new_method.check = function (cbak, msg) {
	    if (!arguments.length) {
		return checks;
	    }
	    checks.push ({check : cbak,
			  msg   : msg});
	    return this;
	};
	new_method.transform = function (cbak) {
	    if (!arguments.length) {
		return transforms;
	    }
	    transforms.push(cbak);
	    return this;
	};

	who[method] = new_method;
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    methods.add_batch (param);
	    for (var p in param) {
		attach_method (p, opts);
	    }
	} else {
	    methods.add (param, opts.default_value);
	    attach_method (param, opts);
	}
    };

    api.getset = function (param, def) {
	getset(param, {default_value : def});

	return api;
    };

    api.get = function (param, def) {
	var on_setter = function () {
	    throw ("Method defined only as a getter (you are trying to use it as a setter");
	};

	getset(param, {default_value : def,
		       on_setter : on_setter}
	      );

	return api;
    };

    api.set = function (param, def) {
	var on_getter = function () {
	    throw ("Method defined only as a setter (you are trying to use it as a getter");
	};

	getset(param, {default_value : def,
		       on_getter : on_getter}
	      );

	return api;
    };

    api.method = function (name, cbak) {
	if (typeof (name) === 'object') {
	    for (var p in name) {
		who[p] = name[p];
	    }
	} else {
	    who[name] = cbak;
	}
	return api;
    };

    return api;
    
};

module.exports = exports = api;
},{}],6:[function(require,module,exports){
module.exports = require("./src/index.js");

},{"./src/index.js":7}],7:[function(require,module,exports){
// require('fs').readdirSync(__dirname + '/').forEach(function(file) {
//     if (file.match(/.+\.js/g) !== null && file !== __filename) {
// 	var name = file.replace('.js', '');
// 	module.exports[name] = require('./' + file);
//     }
// });

// Same as
var utils = require("./utils.js");
utils.reduce = require("./reduce.js");
module.exports = exports = utils;

},{"./reduce.js":8,"./utils.js":9}],8:[function(require,module,exports){
var reduce = function () {
    var smooth = 5;
    var value = 'val';
    var redundant = function (a, b) {
	if (a < b) {
	    return ((b-a) <= (b * 0.2));
	}
	return ((a-b) <= (a * 0.2));
    };
    var perform_reduce = function (arr) {return arr;};

    var reduce = function (arr) {
	if (!arr.length) {
	    return arr;
	}
	var smoothed = perform_smooth(arr);
	var reduced  = perform_reduce(smoothed);
	return reduced;
    };

    var median = function (v, arr) {
	arr.sort(function (a, b) {
	    return a[value] - b[value];
	});
	if (arr.length % 2) {
	    v[value] = arr[~~(arr.length / 2)][value];	    
	} else {
	    var n = ~~(arr.length / 2) - 1;
	    v[value] = (arr[n][value] + arr[n+1][value]) / 2;
	}

	return v;
    };

    var clone = function (source) {
	var target = {};
	for (var prop in source) {
	    if (source.hasOwnProperty(prop)) {
		target[prop] = source[prop];
	    }
	}
	return target;
    };

    var perform_smooth = function (arr) {
	if (smooth === 0) { // no smooth
	    return arr;
	}
	var smooth_arr = [];
	for (var i=0; i<arr.length; i++) {
	    var low = (i < smooth) ? 0 : (i - smooth);
	    var high = (i > (arr.length - smooth)) ? arr.length : (i + smooth);
	    smooth_arr[i] = median(clone(arr[i]), arr.slice(low,high+1));
	}
	return smooth_arr;
    };

    reduce.reducer = function (cbak) {
	if (!arguments.length) {
	    return perform_reduce;
	}
	perform_reduce = cbak;
	return reduce;
    };

    reduce.redundant = function (cbak) {
	if (!arguments.length) {
	    return redundant;
	}
	redundant = cbak;
	return reduce;
    };

    reduce.value = function (val) {
	if (!arguments.length) {
	    return value;
	}
	value = val;
	return reduce;
    };

    reduce.smooth = function (val) {
	if (!arguments.length) {
	    return smooth;
	}
	smooth = val;
	return reduce;
    };

    return reduce;
};

var block = function () {
    var red = reduce()
	.value('start');

    var value2 = 'end';

    var join = function (obj1, obj2) {
        return {
            'object' : {
                'start' : obj1.object[red.value()],
                'end'   : obj2[value2]
            },
            'value'  : obj2[value2]
        };
    };

    // var join = function (obj1, obj2) { return obj1 };

    red.reducer( function (arr) {
	var value = red.value();
	var redundant = red.redundant();
	var reduced_arr = [];
	var curr = {
	    'object' : arr[0],
	    'value'  : arr[0][value2]
	};
	for (var i=1; i<arr.length; i++) {
	    if (redundant (arr[i][value], curr.value)) {
		curr = join(curr, arr[i]);
		continue;
	    }
	    reduced_arr.push (curr.object);
	    curr.object = arr[i];
	    curr.value = arr[i].end;
	}
	reduced_arr.push(curr.object);

	// reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    reduce.join = function (cbak) {
	if (!arguments.length) {
	    return join;
	}
	join = cbak;
	return red;
    };

    reduce.value2 = function (field) {
	if (!arguments.length) {
	    return value2;
	}
	value2 = field;
	return red;
    };

    return red;
};

var line = function () {
    var red = reduce();

    red.reducer ( function (arr) {
	var redundant = red.redundant();
	var value = red.value();
	var reduced_arr = [];
	var curr = arr[0];
	for (var i=1; i<arr.length-1; i++) {
	    if (redundant (arr[i][value], curr[value])) {
		continue;
	    }
	    reduced_arr.push (curr);
	    curr = arr[i];
	}
	reduced_arr.push(curr);
	reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    return red;

};

module.exports = reduce;
module.exports.line = line;
module.exports.block = block;


},{}],9:[function(require,module,exports){

module.exports = {
    iterator : function(init_val) {
	var i = init_val || 0;
	var iter = function () {
	    return i++;
	};
	return iter;
    },

    script_path : function (script_name) { // script_name is the filename
	var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	var script_re = new RegExp(script_scaped + '$');
	var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

	// TODO: This requires phantom.js or a similar headless webkit to work (document)
	var scripts = document.getElementsByTagName('script');
	var path = "";  // Default to current path
	if(scripts !== undefined) {
            for(var i in scripts) {
		if(scripts[i].src && scripts[i].src.match(script_re)) {
                    return scripts[i].src.replace(script_re_sub, '$1');
		}
            }
	}
	return path;
    },

    defer_cancel : function (cbak, time) {
	var tick;

	var defer_cancel = function () {
	    clearTimeout(tick);
	    tick = setTimeout(cbak, time);
	};

	return defer_cancel;
    }
};

},{}],10:[function(require,module,exports){
var apijs = require("tnt.api");
var iterator = require("tnt.utils").iterator;

var tnt_node = function (data) {
//tnt.tree.node = function (data) {
    "use strict";

    var node = function () {
    };

    var api = apijs (node);

    // API
//     node.nodes = function() {
// 	if (cluster === undefined) {
// 	    cluster = d3.layout.cluster()
// 	    // TODO: length and children should be exposed in the API
// 	    // i.e. the user should be able to change this defaults via the API
// 	    // children is the defaults for parse_newick, but maybe we should change that
// 	    // or at least not assume this is always the case for the data provided
// 		.value(function(d) {return d.length})
// 		.children(function(d) {return d.children});
// 	}
// 	nodes = cluster.nodes(data);
// 	return nodes;
//     };

    var apply_to_data = function (data, cbak) {
	cbak(data);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		apply_to_data(data.children[i], cbak);
	    }
	}
    };

    var create_ids = function () {
	var i = iterator(1);
	// We can't use apply because apply creates new trees on every node
	// We should use the direct data instead
	apply_to_data (data, function (d) {
	    if (d._id === undefined) {
		d._id = i();
		// TODO: Not sure _inSubTree is strictly necessary
		// d._inSubTree = {prev:true, curr:true};
	    }
	});
    };

    var link_parents = function (data) {
	if (data === undefined) {
	    return;
	}
	if (data.children === undefined) {
	    return;
	}
	for (var i=0; i<data.children.length; i++) {
	    // _parent?
	    data.children[i]._parent = data;
	    link_parents(data.children[i]);
	}
    };

    var compute_root_dists = function (data) {
	// console.log(data);
	apply_to_data (data, function (d) {
	    var l;
	    if (d._parent === undefined) {
		d._root_dist = 0;
	    } else {
		var l = 0;
		if (d.branch_length) {
		    l = d.branch_length
		}
		d._root_dist = l + d._parent._root_dist;
	    }
	});
    };

    // TODO: data can't be rewritten used the api yet. We need finalizers
    node.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
	create_ids();
	link_parents(data);
	compute_root_dists(data);
	return node;
    };
    // We bind the data that has been passed
    node.data(data);

    api.method ('find_all', function (cbak, deep) {
	var nodes = [];
	node.apply (function (n) {
	    if (cbak(n)) {
		nodes.push (n);
	    }
	});
	return nodes;
    });
    
    api.method ('find_node', function (cbak, deep) {
	if (cbak(node)) {
	    return node;
	}

	if (data.children !== undefined) {
	    for (var j=0; j<data.children.length; j++) {
		var found = tnt_node(data.children[j]).find_node(cbak);
		if (found) {
		    return found;
		}
	    }
	}

	if (deep && (data._children !== undefined)) {
	    for (var i=0; i<data._children.length; i++) {
		tnt_node(data._children[i]).find_node(cbak)
		var found = tnt_node(data.children[j]).find_node(cbak);
		if (found) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name) {
	return node.find_node (function (node) {
	    return node.node_name() === name
	});
    });

    api.method ('toggle', function() {
	if (data) {
	    if (data.children) { // Uncollapsed -> collapse
		var hidden = 0;
		node.apply (function (n) {
		    var hidden_here = n.n_hidden() || 0;
		    hidden += (n.n_hidden() || 0) + 1;
		});
		node.n_hidden (hidden-1);
		data._children = data.children;
		data.children = undefined;
	    } else {             // Collapsed -> uncollapse
		node.n_hidden(0);
		data.children = data._children;
		data._children = undefined;
	    }
	}
    });

    api.method ('is_collapsed', function () {
	return (data._children !== undefined && data.children === undefined);
    });

    var has_ancestor = function(n, ancestor) {
	// It is better to work at the data level
	n = n.data();
	ancestor = ancestor.data();
	if (n._parent === undefined) {
	    return false
	}
	n = n._parent
	for (;;) {
	    if (n === undefined) {
		return false;
	    }
	    if (n === ancestor) {
		return true;
	    }
	    n = n._parent;
	}
    };

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It is working fine by now, but in case it needs to be more performant we can implement the LCA
    // algorithm explained here:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    api.method ('lca', function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i<nodes.length; i++) {
	    lca_node = _lca(lca_node, nodes[i]);
	}
	return lca_node;
	// return tnt_node(lca_node);
    });

    var _lca = function(node1, node2) {
	if (node1.data() === node2.data()) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2.parent());
    };

    api.method('n_hidden', function (val) {
	if (!arguments.length) {
	    return node.property('_hidden');
	}
	node.property('_hidden', val);
	return node
    });

    api.method ('get_all_nodes', function () {
	var nodes = [];
	node.apply(function (n) {
	    nodes.push(n);
	});
	return nodes;
    });

    api.method ('get_all_leaves', function () {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf()) {
		leaves.push(n);
	    }
	});
	return leaves;
    });

    api.method ('upstream', function(cbak) {
	cbak(node);
	var parent = node.parent();
	if (parent !== undefined) {
	    parent.upstream(cbak);
	}
//	tnt_node(parent).upstream(cbak);
// 	node.upstream(node._parent, cbak);
    });

    api.method ('subtree', function(nodes) {
    	var node_counts = {};
    	for (var i=0; i<nodes.length; i++) {
	    var n = nodes[i];
	    if (n !== undefined) {
		n.upstream (function (this_node){
		    var id = this_node.id();
		    if (node_counts[id] === undefined) {
			node_counts[id] = 0;
		    }
		    node_counts[id]++
    		});
	    }
    	}
    

	var is_singleton = function (node_data) {
	    var n_children = 0;
	    if (node_data.children === undefined) {
		return false;
	    }
	    for (var i=0; i<node_data.children.length; i++) {
		var id = node_data.children[i]._id;
		if (node_counts[id] > 0) {
		    n_children++;
		}
	    }
	    return n_children === 1;
	};

	var subtree = {};
	copy_data (data, subtree, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];

	    if (counts === undefined) {
	    	return false;
	    }
// 	    if ((node.children !== undefined) && (node.children.length < 2)) {
// 		return false;
// 	    }
	    if ((counts > 1) && (!is_singleton(node_data))) {
		return true;
	    }
	    if ((counts > 0) && (node_data.children === undefined)) {
		return true;
	    }
	    return false;
	});

	return tnt_node(subtree.children[0]);
    });

    var copy_data = function (orig_data, subtree, condition) {
        if (orig_data === undefined) {
	    return;
        }

        if (condition(orig_data)) {
	    var copy = copy_node(orig_data);
	    if (subtree.children === undefined) {
                subtree.children = [];
	    }
	    subtree.children.push(copy);
	    if (orig_data.children === undefined) {
                return;
	    }
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data (orig_data.children[i], copy, condition);
	    }
        } else {
	    if (orig_data.children === undefined) {
                return;
	    }
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data(orig_data.children[i], subtree, condition);
	    }
        }
    };

    var copy_node = function (node_data) {
	var copy = {};
	// copy all the own properties excepts links to other nodes or depth
	for (var param in node_data) {
	    if ((param === "children") ||
		(param === "_children") ||
		(param === "_parent") ||
		(param === "depth")) {
		continue;
	    }
	    if (node_data.hasOwnProperty(param)) {
		copy[param] = node_data[param];
	    }
	}
	return copy;
    };

    
    // TODO: This method visits all the nodes
    // a more performant version should return true
    // the first time cbak(node) is true
    api.method ('present', function (cbak) {
	// cbak should return true/false
	var is_true = false;
	node.apply (function (n) {
	    if (cbak(n) === true) {
		is_true = true;
	    }
	});
	return is_true;
    });

    // cbak is called with two nodes
    // and should return a negative number, 0 or a positive number
    api.method ('sort', function (cbak) {
	if (data.children === undefined) {
	    return;
	}

	var new_children = [];
	for (var i=0; i<data.children.length; i++) {
	    new_children.push(tnt_node(data.children[i]));
	}

	new_children.sort(cbak);

	data.children = [];
	for (var i=0; i<new_children.length; i++) {
	    data.children.push(new_children[i].data());
	}

	for (var i=0; i<data.children.length; i++) {
	    tnt_node(data.children[i]).sort(cbak);
	}
    });

    api.method ('flatten', function () {
	if (node.is_leaf()) {
	    return node;
	}
	var data = node.data();
	var newroot = copy_node(data);
	var leaves = node.get_all_leaves();
	newroot.children = [];
	for (var i=0; i<leaves.length; i++) {
	    newroot.children.push(copy_node(leaves[i].data()));
	}

	return tnt_node(newroot);
    });

    
    // TODO: This method only 'apply's to non collapsed nodes (ie ._children is not visited)
    // Would it be better to have an extra flag (true/false) to visit also collapsed nodes?
    api.method ('apply', function(cbak) {
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = tnt_node(data.children[i])
		n.apply(cbak);
	    }
	}
    });

    // TODO: Not sure if it makes sense to set via a callback:
    // root.property (function (node, val) {
    //    node.deeper.field = val
    // }, 'new_value')
    api.method ('property', function(prop, value) {
	if (arguments.length === 1) {
	    if ((typeof prop) === 'function') {
		return prop(data)	
	    }
	    return data[prop]
	}
	if ((typeof prop) === 'function') {
	    prop(data, value);   
	}
	data[prop] = value;
	return node;
    });

    api.method ('is_leaf', function() {
	return data.children === undefined;
    });

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the tnt.tree() method call
    // so I'm commenting the getter
    // node.cluster = function() {
    // 	return cluster;
    // };

    // node.depth = function (node) {
    //     return node.depth;
    // };

//     node.name = function (node) {
//         return node.name;
//     };

    api.method ('id', function () {
	return node.property('_id');
    });

    api.method ('node_name', function () {
	return node.property('name');
    });

    api.method ('branch_length', function () {
	return node.property('branch_length');
    });

    api.method ('root_dist', function () {
	return node.property('_root_dist');
    });

    api.method ('children', function () {
	if (data.children === undefined) {
	    return;
	}
	var children = [];
	for (var i=0; i<data.children.length; i++) {
	    children.push(tnt_node(data.children[i]));
	}
	return children;
    });

    api.method ('parent', function () {
	if (data._parent === undefined) {
	    return undefined;
	}
	return tnt_node(data._parent);
    });

    return node;

};

module.exports = exports = tnt_node;


},{"tnt.api":4,"tnt.utils":6}],11:[function(require,module,exports){
var tree_node = require("tnt.tree.node");

var bubblesView = function () {
    "use strict";
    
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
	onclick : function () {},
	duration: 1000,
	breadcrumsClick : function () {
	    render.focus(conf.data);
	}
	//labelOffset : 10
    };

    var focus; // undef by default
    var highlight; // undef by default
    var view;
    var svg;
    var breadcrums;
    var pack;
    var nodes;
    var circle;
    var label;
    var path;

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
	    .attr("class", "cttv_bubblesView")
	    .attr("width", conf.diameter)
            .attr("height", conf.diameter)
	    .append("g");

	pack = d3.layout.pack()
	    .value(function (d) {
		return d[conf.value];
	    })
            .sort(null)
            .size([conf.diameter, conf.diameter])
            .padding(1.5);

	render.update();

	var d = conf.data.data();
	view = [d.x, d.y, d.r*2];
	//focusTo([d.x, d.y, d.r*2]);
	//render.focus (conf.data);

	return render;
    };

    render.update = function () {
	// Safely unfocus on update

	render.focus(conf.data);
        // If we don't pass any data, return out of the element
        if (!conf.data) return;
	var packData = pack.nodes(conf.data.data());

	circle = svg.selectAll("circle")
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

	    .on("dblclick", function () {
		if (d3.event.defaultPrevented) {
		    return;
		}
		d3.event.stopPropagation();
	    })
	    .on("click", function (d) {
		if (d3.event.defaultPrevented) {
		    return;
		}
		conf.onclick.call(this, tree_node(d));
	    });
	circle.exit().remove();

	// // titles
	// svg.selectAll("title")
	//     .data(packData, function (d) {
	// 	return d._id;
	//     })
	//     .enter()
	//     .append("title")
        //     .text(function(d) { return d[conf.key] + ": " + conf.format(d[conf.value]); });	
	
        //newNodes.append ("circle");

        //newNodes.append("text");

	path = svg.selectAll("path")
	    .data(packData, function (d) {
		if (d._parent === undefined) {
		    return d[conf.key];
		}
		return d[conf.key] + "_" + d._parent[conf.key];
	    });
	// new paths
	path
	//.data(packData)
	    .enter()
	    .append("path")
	    .attr("id", function(d,i){return "s"+i;})
	    .attr("fill", "none");


	label = svg.selectAll("text")
	    .data(packData, function (d) {
		if (d._parent === undefined) {
		    return d[conf.key];
		}
		return d[conf.key] + "_" + d._parent[conf.key];
	    });
	//.data(packData)

	var newLabels = label
	    .enter()
	    .append("text")
	    .attr("class", function (d) {
		if (d.children) return "topLabel";
		return "leafLabel";
	    })
	    .style("cursor", "default")
	    .attr("pointer-events", function (d) {return d.children ? "auto" : "none"})
	    .on("click", function (d) { // only on those with pointer-events "auto" ie, on therapeutic areas labels
		if (d3.event.defaultPrevented) {
		    return;
		}
		conf.onclick.call(this, tree_node(d));
	    })
	    .attr("fill", "navy")
	    .attr("font-size", 10)
	    .attr("text-anchor", "middle");

	// Create new labels on therapeutic areas
	newLabels
	    .each(function (d, i) {
		if (d.children) {
		    d3.select(this)
			.append("textPath")
			.attr("xlink:href", function () {
			    return "#s" + i;
			})
			.attr("startOffset", "50%")
			.text(function () {
			    return d[conf.label] ? d[conf.label].substring(0, Math.PI*d.r/8) : "";
			});
		}
	    });

	label.exit().remove();

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
	    })

	// Move labels
	updateTransition
	    .selectAll(".leafLabel")
	    .attr("dy", ".3em")
	    .attr("x", function (d) { return d.x; })
	    .attr("y", function (d) { return d.y; })
	    .text(function (d) {
		return d[conf.label].substring(0, d.r / 3);
	    });
	
	// Move labels
	// label
	//     .each(function (d, i) {
	// 	if (!d.children) {
	// 	    d3.select(this)
	// 		.transition()
	// 		.duration(conf.duration)
	// 		.attr("dy", ".3em")
	// 		.attr("x", function (d) { return d.x; })
	// 		.attr("y", function (d) { return d.y; })
	// 		.text(function (d) {
	// 		    return d[conf.label].substring(0, d.r / 3);
	// 		});
	// 	}
	//     });

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
	    })
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

    };

    ////////////////////////
    // Auxiliar functions //
    ////////////////////////

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
	    .attr("cx", function (d) { return ((d.x - v[0])*k)+offset; })
	    .attr("cy", function (d) { return ((d.y - v[1])*k)+offset; })
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
			.attr("xlink:href", function () {
			    return "#s"+i;
			})
			.attr("startOffset", "50%")
			.text(function () {
			    return d[conf.label] ? d[conf.label].substring(0, Math.PI*d.r*k/8) : "";
			});
		} else {
		    d3.select(this)
		    	.attr("x", function (d) { return ((d.x - v[0])*k)+offset; })
			.attr("y", function (d) { return ((d.y - v[1])*k)+offset; })
		    	.text(function (d) {
			    return d[conf.label].substring(0, d.r*k / 3);
			})
			.attr("font-size", function (d) {
			    var circleLength = d.r * k / 3;
			    var labelLength = d[conf.label].length;
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
	    .on("click", conf.breadcrumsClick)

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

    render.onclick = function (cbak) {
	if (!arguments.length) {
	    return conf.onclick;
	}
	conf.onclick = cbak;
	return this;
    };
    
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

    // render.flat = function (bool) {
    // 	if (!arguments.length) {
    // 	    return conf.flat;
    // 	}
    // 	conf.flat = bool;
    // 	return this;
    // };

    // render.node = tree_node;
    return render;
};

module.exports = bubblesView;

},{"tnt.tree.node":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvZmFrZV83ODM0YzYyYi5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcmVkdWNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3V0aWxzLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL3NyYy9ub2RlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L3NyYy9idWJibGVzVmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9kQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2luZGV4LmpzXCIpO1xuIiwiLy8gaWYgKHR5cGVvZiBidWJibGVzVmlldyA9PT0gXCJ1bmRlZmluZWRcIikge1xuLy8gICAgIG1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXcgPSB7fVxuLy8gfVxuLy8gYnViYmxlc1ZpZXcuYnViYmxlc1ZpZXcgPSByZXF1aXJlKFwiLi9zcmMvYnViYmxlc1ZpZXcuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3ID0gcmVxdWlyZShcIi4vc3JjL2J1YmJsZXNWaWV3LmpzXCIpO1xuIiwidmFyIG5vZGUgPSByZXF1aXJlKFwiLi9zcmMvbm9kZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5vZGU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIvLyByZXF1aXJlKCdmcycpLnJlYWRkaXJTeW5jKF9fZGlybmFtZSArICcvJykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4vLyAgICAgaWYgKGZpbGUubWF0Y2goLy4rXFwuanMvZykgIT09IG51bGwgJiYgZmlsZSAhPT0gX19maWxlbmFtZSkge1xuLy8gXHR2YXIgbmFtZSA9IGZpbGUucmVwbGFjZSgnLmpzJywgJycpO1xuLy8gXHRtb2R1bGUuZXhwb3J0c1tuYW1lXSA9IHJlcXVpcmUoJy4vJyArIGZpbGUpO1xuLy8gICAgIH1cbi8vIH0pO1xuXG4vLyBTYW1lIGFzXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnV0aWxzLnJlZHVjZSA9IHJlcXVpcmUoXCIuL3JlZHVjZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHV0aWxzO1xuIiwidmFyIHJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc21vb3RoID0gNTtcbiAgICB2YXIgdmFsdWUgPSAndmFsJztcbiAgICB2YXIgcmVkdW5kYW50ID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPCBiKSB7XG5cdCAgICByZXR1cm4gKChiLWEpIDw9IChiICogMC4yKSk7XG5cdH1cblx0cmV0dXJuICgoYS1iKSA8PSAoYSAqIDAuMikpO1xuICAgIH07XG4gICAgdmFyIHBlcmZvcm1fcmVkdWNlID0gZnVuY3Rpb24gKGFycikge3JldHVybiBhcnI7fTtcblxuICAgIHZhciByZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmICghYXJyLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoZWQgPSBwZXJmb3JtX3Ntb290aChhcnIpO1xuXHR2YXIgcmVkdWNlZCAgPSBwZXJmb3JtX3JlZHVjZShzbW9vdGhlZCk7XG5cdHJldHVybiByZWR1Y2VkO1xuICAgIH07XG5cbiAgICB2YXIgbWVkaWFuID0gZnVuY3Rpb24gKHYsIGFycikge1xuXHRhcnIuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHQgICAgcmV0dXJuIGFbdmFsdWVdIC0gYlt2YWx1ZV07XG5cdH0pO1xuXHRpZiAoYXJyLmxlbmd0aCAlIDIpIHtcblx0ICAgIHZbdmFsdWVdID0gYXJyW35+KGFyci5sZW5ndGggLyAyKV1bdmFsdWVdO1x0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIG4gPSB+fihhcnIubGVuZ3RoIC8gMikgLSAxO1xuXHQgICAgdlt2YWx1ZV0gPSAoYXJyW25dW3ZhbHVlXSArIGFycltuKzFdW3ZhbHVlXSkgLyAyO1xuXHR9XG5cblx0cmV0dXJuIHY7XG4gICAgfTtcblxuICAgIHZhciBjbG9uZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0dmFyIHRhcmdldCA9IHt9O1xuXHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuXHQgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICB2YXIgcGVyZm9ybV9zbW9vdGggPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmIChzbW9vdGggPT09IDApIHsgLy8gbm8gc21vb3RoXG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhfYXJyID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBsb3cgPSAoaSA8IHNtb290aCkgPyAwIDogKGkgLSBzbW9vdGgpO1xuXHQgICAgdmFyIGhpZ2ggPSAoaSA+IChhcnIubGVuZ3RoIC0gc21vb3RoKSkgPyBhcnIubGVuZ3RoIDogKGkgKyBzbW9vdGgpO1xuXHQgICAgc21vb3RoX2FycltpXSA9IG1lZGlhbihjbG9uZShhcnJbaV0pLCBhcnIuc2xpY2UobG93LGhpZ2grMSkpO1xuXHR9XG5cdHJldHVybiBzbW9vdGhfYXJyO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdWNlciA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1fcmVkdWNlO1xuXHR9XG5cdHBlcmZvcm1fcmVkdWNlID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVuZGFudCA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHJlZHVuZGFudDtcblx0fVxuXHRyZWR1bmRhbnQgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdHZhbHVlID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2Uuc21vb3RoID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBzbW9vdGg7XG5cdH1cblx0c21vb3RoID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkdWNlO1xufTtcblxudmFyIGJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKVxuXHQudmFsdWUoJ3N0YXJ0Jyk7XG5cbiAgICB2YXIgdmFsdWUyID0gJ2VuZCc7XG5cbiAgICB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnb2JqZWN0JyA6IHtcbiAgICAgICAgICAgICAgICAnc3RhcnQnIDogb2JqMS5vYmplY3RbcmVkLnZhbHVlKCldLFxuICAgICAgICAgICAgICAgICdlbmQnICAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmFsdWUnICA6IG9iajJbdmFsdWUyXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7IHJldHVybiBvYmoxIH07XG5cbiAgICByZWQucmVkdWNlciggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0ge1xuXHQgICAgJ29iamVjdCcgOiBhcnJbMF0sXG5cdCAgICAndmFsdWUnICA6IGFyclswXVt2YWx1ZTJdXG5cdH07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnIudmFsdWUpKSB7XG5cdFx0Y3VyciA9IGpvaW4oY3VyciwgYXJyW2ldKTtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIub2JqZWN0KTtcblx0ICAgIGN1cnIub2JqZWN0ID0gYXJyW2ldO1xuXHQgICAgY3Vyci52YWx1ZSA9IGFycltpXS5lbmQ7XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyLm9iamVjdCk7XG5cblx0Ly8gcmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJlZHVjZS5qb2luID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gam9pbjtcblx0fVxuXHRqb2luID0gY2Jhaztcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlMiA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTI7XG5cdH1cblx0dmFsdWUyID0gZmllbGQ7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJldHVybiByZWQ7XG59O1xuXG52YXIgbGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKCk7XG5cbiAgICByZWQucmVkdWNlciAoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IGFyclswXTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGgtMTsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyW3ZhbHVlXSkpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIpO1xuXHQgICAgY3VyciA9IGFycltpXTtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIpO1xuXHRyZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlZDtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2U7XG5tb2R1bGUuZXhwb3J0cy5saW5lID0gbGluZTtcbm1vZHVsZS5leHBvcnRzLmJsb2NrID0gYmxvY2s7XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXRlcmF0b3IgOiBmdW5jdGlvbihpbml0X3ZhbCkge1xuXHR2YXIgaSA9IGluaXRfdmFsIHx8IDA7XG5cdHZhciBpdGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIGkrKztcblx0fTtcblx0cmV0dXJuIGl0ZXI7XG4gICAgfSxcblxuICAgIHNjcmlwdF9wYXRoIDogZnVuY3Rpb24gKHNjcmlwdF9uYW1lKSB7IC8vIHNjcmlwdF9uYW1lIGlzIHRoZSBmaWxlbmFtZVxuXHR2YXIgc2NyaXB0X3NjYXBlZCA9IHNjcmlwdF9uYW1lLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuXHR2YXIgc2NyaXB0X3JlID0gbmV3IFJlZ0V4cChzY3JpcHRfc2NhcGVkICsgJyQnKTtcblx0dmFyIHNjcmlwdF9yZV9zdWIgPSBuZXcgUmVnRXhwKCcoLiopJyArIHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXG5cdC8vIFRPRE86IFRoaXMgcmVxdWlyZXMgcGhhbnRvbS5qcyBvciBhIHNpbWlsYXIgaGVhZGxlc3Mgd2Via2l0IHRvIHdvcmsgKGRvY3VtZW50KVxuXHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0dmFyIHBhdGggPSBcIlwiOyAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHBhdGhcblx0aWYoc2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gc2NyaXB0cykge1xuXHRcdGlmKHNjcmlwdHNbaV0uc3JjICYmIHNjcmlwdHNbaV0uc3JjLm1hdGNoKHNjcmlwdF9yZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdHNbaV0uc3JjLnJlcGxhY2Uoc2NyaXB0X3JlX3N1YiwgJyQxJyk7XG5cdFx0fVxuICAgICAgICAgICAgfVxuXHR9XG5cdHJldHVybiBwYXRoO1xuICAgIH0sXG5cbiAgICBkZWZlcl9jYW5jZWwgOiBmdW5jdGlvbiAoY2JhaywgdGltZSkge1xuXHR2YXIgdGljaztcblxuXHR2YXIgZGVmZXJfY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgY2xlYXJUaW1lb3V0KHRpY2spO1xuXHQgICAgdGljayA9IHNldFRpbWVvdXQoY2JhaywgdGltZSk7XG5cdH07XG5cblx0cmV0dXJuIGRlZmVyX2NhbmNlbDtcbiAgICB9XG59O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0Ly8gY29uc29sZS5sb2coZGF0YSk7XG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICB2YXIgbDtcblx0ICAgIGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX3Jvb3RfZGlzdCA9IDA7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciBsID0gMDtcblx0XHRpZiAoZC5icmFuY2hfbGVuZ3RoKSB7XG5cdFx0ICAgIGwgPSBkLmJyYW5jaF9sZW5ndGhcblx0XHR9XG5cdFx0ZC5fcm9vdF9kaXN0ID0gbCArIGQuX3BhcmVudC5fcm9vdF9kaXN0O1xuXHQgICAgfVxuXHR9KTtcbiAgICB9O1xuXG4gICAgLy8gVE9ETzogZGF0YSBjYW4ndCBiZSByZXdyaXR0ZW4gdXNlZCB0aGUgYXBpIHlldC4gV2UgbmVlZCBmaW5hbGl6ZXJzXG4gICAgbm9kZS5kYXRhID0gZnVuY3Rpb24obmV3X2RhdGEpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZGF0YVxuXHR9XG5cdGRhdGEgPSBuZXdfZGF0YTtcblx0Y3JlYXRlX2lkcygpO1xuXHRsaW5rX3BhcmVudHMoZGF0YSk7XG5cdGNvbXB1dGVfcm9vdF9kaXN0cyhkYXRhKTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfTtcbiAgICAvLyBXZSBiaW5kIHRoZSBkYXRhIHRoYXQgaGFzIGJlZW4gcGFzc2VkXG4gICAgbm9kZS5kYXRhKGRhdGEpO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfYWxsJywgZnVuY3Rpb24gKGNiYWssIGRlZXApIHtcblx0dmFyIG5vZGVzID0gW107XG5cdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAoY2JhayhuKSkge1xuXHRcdG5vZGVzLnB1c2ggKG4pO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIG5vZGVzO1xuICAgIH0pO1xuICAgIFxuICAgIGFwaS5tZXRob2QgKCdmaW5kX25vZGUnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHRpZiAoY2Jhayhub2RlKSkge1xuXHQgICAgcmV0dXJuIG5vZGU7XG5cdH1cblxuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdHZhciBmb3VuZCA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5bal0pLmZpbmRfbm9kZShjYmFrKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuXG5cdGlmIChkZWVwICYmIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrKVxuXHRcdHZhciBmb3VuZCA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5bal0pLmZpbmRfbm9kZShjYmFrKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZV9ieV9uYW1lJywgZnVuY3Rpb24obmFtZSkge1xuXHRyZXR1cm4gbm9kZS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5ub2RlX25hbWUoKSA9PT0gbmFtZVxuXHR9KTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0b2dnbGUnLCBmdW5jdGlvbigpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7IC8vIFVuY29sbGFwc2VkIC0+IGNvbGxhcHNlXG5cdFx0dmFyIGhpZGRlbiA9IDA7XG5cdFx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgdmFyIGhpZGRlbl9oZXJlID0gbi5uX2hpZGRlbigpIHx8IDA7XG5cdFx0ICAgIGhpZGRlbiArPSAobi5uX2hpZGRlbigpIHx8IDApICsgMTtcblx0XHR9KTtcblx0XHRub2RlLm5faGlkZGVuIChoaWRkZW4tMSk7XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2UgeyAgICAgICAgICAgICAvLyBDb2xsYXBzZWQgLT4gdW5jb2xsYXBzZVxuXHRcdG5vZGUubl9oaWRkZW4oMCk7XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IGRhdGEuX2NoaWxkcmVuO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfY29sbGFwc2VkJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIHZhciBoYXNfYW5jZXN0b3IgPSBmdW5jdGlvbihuLCBhbmNlc3Rvcikge1xuXHQvLyBJdCBpcyBiZXR0ZXIgdG8gd29yayBhdCB0aGUgZGF0YSBsZXZlbFxuXHRuID0gbi5kYXRhKCk7XG5cdGFuY2VzdG9yID0gYW5jZXN0b3IuZGF0YSgpO1xuXHRpZiAobi5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiBmYWxzZVxuXHR9XG5cdG4gPSBuLl9wYXJlbnRcblx0Zm9yICg7Oykge1xuXHQgICAgaWYgKG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIGlmIChuID09PSBhbmNlc3Rvcikge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgbiA9IG4uX3BhcmVudDtcblx0fVxuICAgIH07XG5cbiAgICAvLyBUaGlzIGlzIHRoZSBlYXNpZXN0IHdheSB0byBjYWxjdWxhdGUgdGhlIExDQSBJIGNhbiB0aGluayBvZi4gQnV0IGl0IGlzIHZlcnkgaW5lZmZpY2llbnQgdG9vLlxuICAgIC8vIEl0IGlzIHdvcmtpbmcgZmluZSBieSBub3csIGJ1dCBpbiBjYXNlIGl0IG5lZWRzIHRvIGJlIG1vcmUgcGVyZm9ybWFudCB3ZSBjYW4gaW1wbGVtZW50IHRoZSBMQ0FcbiAgICAvLyBhbGdvcml0aG0gZXhwbGFpbmVkIGhlcmU6XG4gICAgLy8gaHR0cDovL2NvbW11bml0eS50b3Bjb2Rlci5jb20vdGM/bW9kdWxlPVN0YXRpYyZkMT10dXRvcmlhbHMmZDI9bG93ZXN0Q29tbW9uQW5jZXN0b3JcbiAgICBhcGkubWV0aG9kICgnbGNhJywgZnVuY3Rpb24gKG5vZGVzKSB7XG5cdGlmIChub2Rlcy5sZW5ndGggPT09IDEpIHtcblx0ICAgIHJldHVybiBub2Rlc1swXTtcblx0fVxuXHR2YXIgbGNhX25vZGUgPSBub2Rlc1swXTtcblx0Zm9yICh2YXIgaSA9IDE7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGxjYV9ub2RlID0gX2xjYShsY2Ffbm9kZSwgbm9kZXNbaV0pO1xuXHR9XG5cdHJldHVybiBsY2Ffbm9kZTtcblx0Ly8gcmV0dXJuIHRudF9ub2RlKGxjYV9ub2RlKTtcbiAgICB9KTtcblxuICAgIHZhciBfbGNhID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XG5cdGlmIChub2RlMS5kYXRhKCkgPT09IG5vZGUyLmRhdGEoKSkge1xuXHQgICAgcmV0dXJuIG5vZGUxO1xuXHR9XG5cdGlmIChoYXNfYW5jZXN0b3Iobm9kZTEsIG5vZGUyKSkge1xuXHQgICAgcmV0dXJuIG5vZGUyO1xuXHR9XG5cdHJldHVybiBfbGNhKG5vZGUxLCBub2RlMi5wYXJlbnQoKSk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QoJ25faGlkZGVuJywgZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KCdfaGlkZGVuJyk7XG5cdH1cblx0bm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicsIHZhbCk7XG5cdHJldHVybiBub2RlXG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZ2V0X2FsbF9ub2RlcycsIGZ1bmN0aW9uICgpIHtcblx0dmFyIG5vZGVzID0gW107XG5cdG5vZGUuYXBwbHkoZnVuY3Rpb24gKG4pIHtcblx0ICAgIG5vZGVzLnB1c2gobik7XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZ2V0X2FsbF9sZWF2ZXMnLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBsZWF2ZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKG4uaXNfbGVhZigpKSB7XG5cdFx0bGVhdmVzLnB1c2gobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbGVhdmVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Vwc3RyZWFtJywgZnVuY3Rpb24oY2Jhaykge1xuXHRjYmFrKG5vZGUpO1xuXHR2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnQoKTtcblx0aWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBwYXJlbnQudXBzdHJlYW0oY2Jhayk7XG5cdH1cbi8vXHR0bnRfbm9kZShwYXJlbnQpLnVwc3RyZWFtKGNiYWspO1xuLy8gXHRub2RlLnVwc3RyZWFtKG5vZGUuX3BhcmVudCwgY2Jhayk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnc3VidHJlZScsIGZ1bmN0aW9uKG5vZGVzKSB7XG4gICAgXHR2YXIgbm9kZV9jb3VudHMgPSB7fTtcbiAgICBcdGZvciAodmFyIGk9MDsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIG4gPSBub2Rlc1tpXTtcblx0ICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHtcblx0XHRuLnVwc3RyZWFtIChmdW5jdGlvbiAodGhpc19ub2RlKXtcblx0XHQgICAgdmFyIGlkID0gdGhpc19ub2RlLmlkKCk7XG5cdFx0ICAgIGlmIChub2RlX2NvdW50c1tpZF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0bm9kZV9jb3VudHNbaWRdID0gMDtcblx0XHQgICAgfVxuXHRcdCAgICBub2RlX2NvdW50c1tpZF0rK1xuICAgIFx0XHR9KTtcblx0ICAgIH1cbiAgICBcdH1cbiAgICBcblxuXHR2YXIgaXNfc2luZ2xldG9uID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5fY2hpbGRyZW4gPSAwO1xuXHQgICAgaWYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpZCA9IG5vZGVfZGF0YS5jaGlsZHJlbltpXS5faWQ7XG5cdFx0aWYgKG5vZGVfY291bnRzW2lkXSA+IDApIHtcblx0XHQgICAgbl9jaGlsZHJlbisrO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBuX2NoaWxkcmVuID09PSAxO1xuXHR9O1xuXG5cdHZhciBzdWJ0cmVlID0ge307XG5cdGNvcHlfZGF0YSAoZGF0YSwgc3VidHJlZSwgZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5vZGVfaWQgPSBub2RlX2RhdGEuX2lkO1xuXHQgICAgdmFyIGNvdW50cyA9IG5vZGVfY291bnRzW25vZGVfaWRdO1xuXG5cdCAgICBpZiAoY291bnRzID09PSB1bmRlZmluZWQpIHtcblx0ICAgIFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuLy8gXHQgICAgaWYgKChub2RlLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpICYmIChub2RlLmNoaWxkcmVuLmxlbmd0aCA8IDIpKSB7XG4vLyBcdFx0cmV0dXJuIGZhbHNlO1xuLy8gXHQgICAgfVxuXHQgICAgaWYgKChjb3VudHMgPiAxKSAmJiAoIWlzX3NpbmdsZXRvbihub2RlX2RhdGEpKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgaWYgKChjb3VudHMgPiAwKSAmJiAobm9kZV9kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH0pO1xuXG5cdHJldHVybiB0bnRfbm9kZShzdWJ0cmVlLmNoaWxkcmVuWzBdKTtcbiAgICB9KTtcblxuICAgIHZhciBjb3B5X2RhdGEgPSBmdW5jdGlvbiAob3JpZ19kYXRhLCBzdWJ0cmVlLCBjb25kaXRpb24pIHtcbiAgICAgICAgaWYgKG9yaWdfZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZGl0aW9uKG9yaWdfZGF0YSkpIHtcblx0ICAgIHZhciBjb3B5ID0gY29weV9ub2RlKG9yaWdfZGF0YSk7XG5cdCAgICBpZiAoc3VidHJlZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3VidHJlZS5jaGlsZHJlbiA9IFtdO1xuXHQgICAgfVxuXHQgICAgc3VidHJlZS5jaGlsZHJlbi5wdXNoKGNvcHkpO1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEgKG9yaWdfZGF0YS5jaGlsZHJlbltpXSwgY29weSwgY29uZGl0aW9uKTtcblx0ICAgIH1cbiAgICAgICAgfSBlbHNlIHtcblx0ICAgIGlmIChvcmlnX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZ19kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29weV9kYXRhKG9yaWdfZGF0YS5jaGlsZHJlbltpXSwgc3VidHJlZSwgY29uZGl0aW9uKTtcblx0ICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgY29weV9ub2RlID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHR2YXIgY29weSA9IHt9O1xuXHQvLyBjb3B5IGFsbCB0aGUgb3duIHByb3BlcnRpZXMgZXhjZXB0cyBsaW5rcyB0byBvdGhlciBub2RlcyBvciBkZXB0aFxuXHRmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0ICAgIGlmICgocGFyYW0gPT09IFwiY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX2NoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9wYXJlbnRcIikgfHxcblx0XHQocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0Y29weVtwYXJhbV0gPSBub2RlX2RhdGFbcGFyYW1dO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiBjb3B5O1xuICAgIH07XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZsYXR0ZW4nLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChub2RlLmlzX2xlYWYoKSkge1xuXHQgICAgcmV0dXJuIG5vZGU7XG5cdH1cblx0dmFyIGRhdGEgPSBub2RlLmRhdGEoKTtcblx0dmFyIG5ld3Jvb3QgPSBjb3B5X25vZGUoZGF0YSk7XG5cdHZhciBsZWF2ZXMgPSBub2RlLmdldF9hbGxfbGVhdmVzKCk7XG5cdG5ld3Jvb3QuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3cm9vdC5jaGlsZHJlbi5wdXNoKGNvcHlfbm9kZShsZWF2ZXNbaV0uZGF0YSgpKSk7XG5cdH1cblxuXHRyZXR1cm4gdG50X25vZGUobmV3cm9vdCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBvbmx5ICdhcHBseSdzIHRvIG5vbiBjb2xsYXBzZWQgbm9kZXMgKGllIC5fY2hpbGRyZW4gaXMgbm90IHZpc2l0ZWQpXG4gICAgLy8gV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgYW4gZXh0cmEgZmxhZyAodHJ1ZS9mYWxzZSkgdG8gdmlzaXQgYWxzbyBjb2xsYXBzZWQgbm9kZXM/XG4gICAgYXBpLm1ldGhvZCAoJ2FwcGx5JywgZnVuY3Rpb24oY2Jhaykge1xuXHRjYmFrKG5vZGUpO1xuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBuID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSlcblx0XHRuLmFwcGx5KGNiYWspO1xuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdmlhIGEgY2FsbGJhY2s6XG4gICAgLy8gcm9vdC5wcm9wZXJ0eSAoZnVuY3Rpb24gKG5vZGUsIHZhbCkge1xuICAgIC8vICAgIG5vZGUuZGVlcGVyLmZpZWxkID0gdmFsXG4gICAgLy8gfSwgJ25ld192YWx1ZScpXG4gICAgYXBpLm1ldGhvZCAoJ3Byb3BlcnR5JywgZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcblx0ICAgIGlmICgodHlwZW9mIHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0cmV0dXJuIHByb3AoZGF0YSlcdFxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGRhdGFbcHJvcF1cblx0fVxuXHRpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcHJvcChkYXRhLCB2YWx1ZSk7ICAgXG5cdH1cblx0ZGF0YVtwcm9wXSA9IHZhbHVlO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdpc19sZWFmJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQ7XG4gICAgfSk7XG5cbiAgICAvLyBJdCBsb29rcyBsaWtlIHRoZSBjbHVzdGVyIGNhbid0IGJlIHVzZWQgZm9yIGFueXRoaW5nIHVzZWZ1bCBoZXJlXG4gICAgLy8gSXQgaXMgbm93IGluY2x1ZGVkIGFzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byB0aGUgdG50LnRyZWUoKSBtZXRob2QgY2FsbFxuICAgIC8vIHNvIEknbSBjb21tZW50aW5nIHRoZSBnZXR0ZXJcbiAgICAvLyBub2RlLmNsdXN0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBcdHJldHVybiBjbHVzdGVyO1xuICAgIC8vIH07XG5cbiAgICAvLyBub2RlLmRlcHRoID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyAgICAgcmV0dXJuIG5vZGUuZGVwdGg7XG4gICAgLy8gfTtcblxuLy8gICAgIG5vZGUubmFtZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4vLyAgICAgICAgIHJldHVybiBub2RlLm5hbWU7XG4vLyAgICAgfTtcblxuICAgIGFwaS5tZXRob2QgKCdpZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19pZCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ25vZGVfbmFtZScsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ25hbWUnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdicmFuY2hfbGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnYnJhbmNoX2xlbmd0aCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3RfZGlzdCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19yb290X2Rpc3QnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdjaGlsZHJlbicsIGZ1bmN0aW9uICgpIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdHZhciBjaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgY2hpbGRyZW4ucHVzaCh0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKSk7XG5cdH1cblx0cmV0dXJuIGNoaWxkcmVuO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3BhcmVudCcsIGZ1bmN0aW9uICgpIHtcblx0aWYgKGRhdGEuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiB0bnRfbm9kZShkYXRhLl9wYXJlbnQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5vZGU7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRudF9ub2RlO1xuXG4iLCJ2YXIgdHJlZV9ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG5cbnZhciBidWJibGVzVmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBcbiAgICB2YXIgY29uZiA9IHtcblx0ZGlhbWV0ZXIgOiA2MDAsXG5cdGZvcm1hdCA6IGQzLmZvcm1hdChcIixkXCIpLFxuXHRjb2xvciA6IGQzLnNjYWxlLmNhdGVnb3J5MjBjKCksXG5cdGNvbG9yUGFsZXR0ZSA6IHRydWUsXG5cdGRhdGEgOiB1bmRlZmluZWQsXG5cdHZhbHVlIDogXCJ2YWx1ZVwiLFxuXHRrZXkgOiBcIm5hbWVcIixcblx0bGFiZWw6IFwibmFtZVwiLFxuXHRkaXZJZCA6IHVuZGVmaW5lZCxcblx0b25jbGljayA6IGZ1bmN0aW9uICgpIHt9LFxuXHRkdXJhdGlvbjogMTAwMCxcblx0YnJlYWRjcnVtc0NsaWNrIDogZnVuY3Rpb24gKCkge1xuXHQgICAgcmVuZGVyLmZvY3VzKGNvbmYuZGF0YSk7XG5cdH1cblx0Ly9sYWJlbE9mZnNldCA6IDEwXG4gICAgfTtcblxuICAgIHZhciBmb2N1czsgLy8gdW5kZWYgYnkgZGVmYXVsdFxuICAgIHZhciBoaWdobGlnaHQ7IC8vIHVuZGVmIGJ5IGRlZmF1bHRcbiAgICB2YXIgdmlldztcbiAgICB2YXIgc3ZnO1xuICAgIHZhciBicmVhZGNydW1zO1xuICAgIHZhciBwYWNrO1xuICAgIHZhciBub2RlcztcbiAgICB2YXIgY2lyY2xlO1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgcGF0aDtcblxuICAgIHZhciBjdXJyVHJhbnNsYXRlID0gWzAsMF07XG4gICAgdmFyIGN1cnJTY2FsZSA9IDE7XG4gICAgLy8gdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAvLyBcdC5zY2FsZUV4dGVudChbMC44LCBJbmZpbml0eV0pXG4gICAgLy8gXHQub24oXCJ6b29tXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBcdCAgICByZWRyYXcoc3ZnKTtcbiAgICAvLyBcdH0pO1xuICAgIFxuICAgIC8qXG4gICAgICogUmVuZGVyIHZhbGlkIEpTT04gZGF0YVxuICAgICAqL1xuICAgIHZhciByZW5kZXIgPSBmdW5jdGlvbihkaXYpIHtcblx0Y29uZi5kaXZJZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuXHQvLyBicmVhZGNydW1zLWxpa2UgbmF2aWdhdGlvblxuXHRicmVhZGNydW1zID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJjdHR2X2J1YmJsZXNWaWV3X2JyZWFkY3J1bXNcIilcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsXCI1MFwiKTtcblx0XG5cdHN2ZyA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dl9idWJibGVzVmlld1wiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmRpYW1ldGVyKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgY29uZi5kaWFtZXRlcilcblx0ICAgIC5hcHBlbmQoXCJnXCIpO1xuXG5cdHBhY2sgPSBkMy5sYXlvdXQucGFjaygpXG5cdCAgICAudmFsdWUoZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZFtjb25mLnZhbHVlXTtcblx0ICAgIH0pXG4gICAgICAgICAgICAuc29ydChudWxsKVxuICAgICAgICAgICAgLnNpemUoW2NvbmYuZGlhbWV0ZXIsIGNvbmYuZGlhbWV0ZXJdKVxuICAgICAgICAgICAgLnBhZGRpbmcoMS41KTtcblxuXHRyZW5kZXIudXBkYXRlKCk7XG5cblx0dmFyIGQgPSBjb25mLmRhdGEuZGF0YSgpO1xuXHR2aWV3ID0gW2QueCwgZC55LCBkLnIqMl07XG5cdC8vZm9jdXNUbyhbZC54LCBkLnksIGQucioyXSk7XG5cdC8vcmVuZGVyLmZvY3VzIChjb25mLmRhdGEpO1xuXG5cdHJldHVybiByZW5kZXI7XG4gICAgfTtcblxuICAgIHJlbmRlci51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdC8vIFNhZmVseSB1bmZvY3VzIG9uIHVwZGF0ZVxuXG5cdHJlbmRlci5mb2N1cyhjb25mLmRhdGEpO1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBwYXNzIGFueSBkYXRhLCByZXR1cm4gb3V0IG9mIHRoZSBlbGVtZW50XG4gICAgICAgIGlmICghY29uZi5kYXRhKSByZXR1cm47XG5cdHZhciBwYWNrRGF0YSA9IHBhY2subm9kZXMoY29uZi5kYXRhLmRhdGEoKSk7XG5cblx0Y2lyY2xlID0gc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuXHQgICAgLmRhdGEocGFja0RhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybiBkW2NvbmYua2V5XTtcblx0XHR9XG5cdFx0cmV0dXJuIGRbY29uZi5rZXldICsgXCJfXCIgKyBkLl9wYXJlbnRbY29uZi5rZXldO1xuXHQgICAgfSk7XG5cdC8vLmRhdGEocGFja0RhdGEpXG5cblx0Ly8gbmV3IGNpcmNsZXNcblx0Y2lyY2xlXG4gICAgICAgICAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBcImJ1YmJsZXNWaWV3X1wiICsgZFtjb25mLmtleV0gKyBcIl9cIiArIGNvbmYuZGl2SWQ7XG5cdCAgICB9KVxuXHQgICAgLmNsYXNzZWQoXCJidWJibGVzVmlld05vZGVcIiwgdHJ1ZSlcblxuXHQgICAgLm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuXHRcdGlmIChkMy5ldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0ZDMuZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdCAgICB9KVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGNvbmYub25jbGljay5jYWxsKHRoaXMsIHRyZWVfbm9kZShkKSk7XG5cdCAgICB9KTtcblx0Y2lyY2xlLmV4aXQoKS5yZW1vdmUoKTtcblxuXHQvLyAvLyB0aXRsZXNcblx0Ly8gc3ZnLnNlbGVjdEFsbChcInRpdGxlXCIpXG5cdC8vICAgICAuZGF0YShwYWNrRGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0Ly8gXHRyZXR1cm4gZC5faWQ7XG5cdC8vICAgICB9KVxuXHQvLyAgICAgLmVudGVyKClcblx0Ly8gICAgIC5hcHBlbmQoXCJ0aXRsZVwiKVxuICAgICAgICAvLyAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFtjb25mLmtleV0gKyBcIjogXCIgKyBjb25mLmZvcm1hdChkW2NvbmYudmFsdWVdKTsgfSk7XHRcblx0XG4gICAgICAgIC8vbmV3Tm9kZXMuYXBwZW5kIChcImNpcmNsZVwiKTtcblxuICAgICAgICAvL25ld05vZGVzLmFwcGVuZChcInRleHRcIik7XG5cblx0cGF0aCA9IHN2Zy5zZWxlY3RBbGwoXCJwYXRoXCIpXG5cdCAgICAuZGF0YShwYWNrRGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcmV0dXJuIGRbY29uZi5rZXldO1xuXHRcdH1cblx0XHRyZXR1cm4gZFtjb25mLmtleV0gKyBcIl9cIiArIGQuX3BhcmVudFtjb25mLmtleV07XG5cdCAgICB9KTtcblx0Ly8gbmV3IHBhdGhzXG5cdHBhdGhcblx0Ly8uZGF0YShwYWNrRGF0YSlcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkLGkpe3JldHVybiBcInNcIitpO30pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cblx0bGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwidGV4dFwiKVxuXHQgICAgLmRhdGEocGFja0RhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybiBkW2NvbmYua2V5XTtcblx0XHR9XG5cdFx0cmV0dXJuIGRbY29uZi5rZXldICsgXCJfXCIgKyBkLl9wYXJlbnRbY29uZi5rZXldO1xuXHQgICAgfSk7XG5cdC8vLmRhdGEocGFja0RhdGEpXG5cblx0dmFyIG5ld0xhYmVscyA9IGxhYmVsXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRleHRcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5jaGlsZHJlbikgcmV0dXJuIFwidG9wTGFiZWxcIjtcblx0XHRyZXR1cm4gXCJsZWFmTGFiZWxcIjtcblx0ICAgIH0pXG5cdCAgICAuc3R5bGUoXCJjdXJzb3JcIiwgXCJkZWZhdWx0XCIpXG5cdCAgICAuYXR0cihcInBvaW50ZXItZXZlbnRzXCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQuY2hpbGRyZW4gPyBcImF1dG9cIiA6IFwibm9uZVwifSlcblx0ICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChkKSB7IC8vIG9ubHkgb24gdGhvc2Ugd2l0aCBwb2ludGVyLWV2ZW50cyBcImF1dG9cIiBpZSwgb24gdGhlcmFwZXV0aWMgYXJlYXMgbGFiZWxzXG5cdFx0aWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcblx0XHQgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRjb25mLm9uY2xpY2suY2FsbCh0aGlzLCB0cmVlX25vZGUoZCkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5hdnlcIilcblx0ICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIDEwKVxuXHQgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcblxuXHQvLyBDcmVhdGUgbmV3IGxhYmVscyBvbiB0aGVyYXBldXRpYyBhcmVhc1xuXHRuZXdMYWJlbHNcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XG5cdFx0aWYgKGQuY2hpbGRyZW4pIHtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0XHQuYXBwZW5kKFwidGV4dFBhdGhcIilcblx0XHRcdC5hdHRyKFwieGxpbms6aHJlZlwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHQgICAgcmV0dXJuIFwiI3NcIiArIGk7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJzdGFydE9mZnNldFwiLCBcIjUwJVwiKVxuXHRcdFx0LnRleHQoZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAgIHJldHVybiBkW2NvbmYubGFiZWxdID8gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgTWF0aC5QSSpkLnIvOCkgOiBcIlwiO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHQgICAgfSk7XG5cblx0bGFiZWwuZXhpdCgpLnJlbW92ZSgpO1xuXG5cdHZhciB1cGRhdGVUcmFuc2l0aW9uID0gc3ZnLnRyYW5zaXRpb24oKVxuXHQgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pO1xuXG5cdHVwZGF0ZVRyYW5zaXRpb25cblx0ICAgIC5zZWxlY3RBbGwoXCJjaXJjbGVcIilcblx0ICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZC54O1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZC55O1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkLnI7XG5cdCAgICB9KVxuXG5cdC8vIE1vdmUgbGFiZWxzXG5cdHVwZGF0ZVRyYW5zaXRpb25cblx0ICAgIC5zZWxlY3RBbGwoXCIubGVhZkxhYmVsXCIpXG5cdCAgICAuYXR0cihcImR5XCIsIFwiLjNlbVwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLng7IH0pXG5cdCAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueTsgfSlcblx0ICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGRbY29uZi5sYWJlbF0uc3Vic3RyaW5nKDAsIGQuciAvIDMpO1xuXHQgICAgfSk7XG5cdFxuXHQvLyBNb3ZlIGxhYmVsc1xuXHQvLyBsYWJlbFxuXHQvLyAgICAgLmVhY2goZnVuY3Rpb24gKGQsIGkpIHtcblx0Ly8gXHRpZiAoIWQuY2hpbGRyZW4pIHtcblx0Ly8gXHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdC8vIFx0XHQudHJhbnNpdGlvbigpXG5cdC8vIFx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0Ly8gXHRcdC5hdHRyKFwiZHlcIiwgXCIuM2VtXCIpXG5cdC8vIFx0XHQuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueDsgfSlcblx0Ly8gXHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC55OyB9KVxuXHQvLyBcdFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0Ly8gXHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgZC5yIC8gMyk7XG5cdC8vIFx0XHR9KTtcblx0Ly8gXHR9XG5cdC8vICAgICB9KTtcblxuXHR1cGRhdGVUcmFuc2l0aW9uXG5cdCAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGRlc2NyaWJlQXJjKGQueCwgZC55KzEwLCBkLnIsIDE2MCwgLTE2MCk7XG5cdCAgICB9KTtcblxuXHRcblx0Ly8gTW92aW5nIG5vZGVzXG5cdGNpcmNsZVxuXHQgICAgLy8uYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuXHQgICAgLmNsYXNzZWQgKFwiYnViYmxlc1ZpZXdMZWFmXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuICFkLmNoaWxkcmVuO1xuXHQgICAgfSlcblx0ICAgIC5jbGFzc2VkIChcImJ1YmJsZXNWaWV3Um9vdFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAhZC5fcGFyZW50O1xuXHQgICAgfSlcblx0ICAgIC8vIC50cmFuc2l0aW9uKClcblx0ICAgIC8vIC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHQgICAgLy8gLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgLy8gXHRyZXR1cm4gZC54O1xuXHQgICAgLy8gfSlcblx0ICAgIC8vIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueTsgfSlcblx0ICAgIC8vIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5yOyB9KTtcblxuXG5cdC8vIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcblx0ICAgIC8vIFx0cmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC54ICsgXCIsXCIgKyBkLnkgKyBcIilcIjtcblx0ICAgIC8vIH0pO1xuXG5cdC8vXHRub2Rlcy5zZWxlY3QoXCJwYXRoXCIpXHRcdFx0ICAgXG5cblx0Ly9ub2Rlcy5zZWxlY3QoXCJ0ZXh0XCIpXG5cdFxuICAgICAgICAvLyBub2Rlcy5zZWxlY3QoXCJjaXJjbGVcIilcblx0Ly8gICAgIC5hdHRyIChcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdC8vICAgICBcdHJldHVybiBcImJ1YmJsZXNWaWV3X1wiICsgZFtjb25mLmtleV0gKyBcIl9cIiArIGNvbmYuZGl2SWQ7XG5cdC8vICAgICB9KVxuXHQvLyAgICAgLnRyYW5zaXRpb24oKVxuXHQvLyAgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdC8vICAgICAuYXR0ciAoXCJyXCIsIGZ1bmN0aW9uKGQpIHtcblx0Ly8gXHQvL3JldHVybiBkLnIgLSAoZC5jaGlsZHJlbiA/IDAgOiBjb25mLmxhYmVsT2Zmc2V0KTtcblx0Ly8gXHRyZXR1cm4gZC5yO1xuXHQvLyAgICAgfSk7XG5cdFxuXHQvL2NpcmNsZSA9IG5vZGVzLnNlbGVjdEFsbChcImNpcmNsZVwiKTtcblxuXHQvLyBFeGl0aW5nIG5vZGVzXG5cdC8vIG5vZGVzXG5cdC8vICAgICAuZXhpdCgpXG5cdC8vICAgICAucmVtb3ZlKCk7XG5cbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQXV4aWxpYXIgZnVuY3Rpb25zIC8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICBmdW5jdGlvbiBwb2xhclRvQ2FydGVzaWFuKGNlbnRlclgsIGNlbnRlclksIHJhZGl1cywgYW5nbGVJbkRlZ3JlZXMpIHtcblx0dmFyIGFuZ2xlSW5SYWRpYW5zID0gKGFuZ2xlSW5EZWdyZWVzLTkwKSAqIE1hdGguUEkgLyAxODAuMDtcblx0cmV0dXJuIHtcblx0ICAgIHg6IGNlbnRlclggKyAocmFkaXVzICogTWF0aC5jb3MoYW5nbGVJblJhZGlhbnMpKSxcblx0ICAgIHk6IGNlbnRlclkgKyAocmFkaXVzICogTWF0aC5zaW4oYW5nbGVJblJhZGlhbnMpKVxuXHR9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlc2NyaWJlQXJjKHgsIHksIHJhZGl1cywgc3RhcnRBbmdsZSwgZW5kQW5nbGUpe1xuXHR2YXIgc3RhcnQgPSBwb2xhclRvQ2FydGVzaWFuKHgsIHksIHJhZGl1cywgZW5kQW5nbGUpO1xuXHR2YXIgZW5kID0gcG9sYXJUb0NhcnRlc2lhbih4LCB5LCByYWRpdXMsIHN0YXJ0QW5nbGUpO1xuXHR2YXIgYXJjU3dlZXAgPSBlbmRBbmdsZSAtIHN0YXJ0QW5nbGUgPD0gMTgwID8gXCIwXCIgOiBcIjFcIjtcblx0dmFyIGQgPSBbXG5cdCAgICBcIk1cIiwgc3RhcnQueCwgc3RhcnQueSxcblx0ICAgIFwiQVwiLCByYWRpdXMsIHJhZGl1cywgMCwgMSwgMSwgZW5kLngsIGVuZC55XG5cdF0uam9pbihcIiBcIik7XG5cdHJldHVybiBkO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiByZWRyYXcgKHZpeikge1xuXHR2aXouYXR0ciAoXCJ0cmFuc2Zvcm1cIixcblx0XHQgICBcInRyYW5zbGF0ZSAoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIikgXCIgK1xuXHRcdCAgXCJzY2FsZSAoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gZm9jdXNUbyAodikge1xuXHR2YXIgayA9IGNvbmYuZGlhbWV0ZXIgLyB2WzJdO1xuXHR2YXIgb2Zmc2V0ID0gY29uZi5kaWFtZXRlciAvIDI7XG5cdHZpZXcgPSB2O1xuXG5cdGNpcmNsZVxuXHQgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gKChkLnggLSB2WzBdKSprKStvZmZzZXQ7IH0pXG5cdCAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiAoKGQueSAtIHZbMV0pKmspK29mZnNldDsgfSlcblx0ICAgIC8vIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcblx0ICAgIC8vIFx0cmV0dXJuIFwidHJhbnNsYXRlKFwiICsgKCgoZC54IC0gdlswXSkgKiBrKSArIG9mZnNldCkgKyBcIixcIiArICgoKGQueSAtIHZbMV0pICogaykgKyBvZmZzZXQpICsgXCIpXCI7XG5cdCAgICAvLyB9KTtcblx0ICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbihkKSB7XG5cdFx0cmV0dXJuIGQuciAqIGs7XG5cdCAgICB9KTtcblxuXHRwYXRoXG5cdCAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZGVzY3JpYmVBcmMoKChkLngtdlswXSkqaykrb2Zmc2V0LCAoKGQueS12WzFdKSprKSsxMCtvZmZzZXQsIGQuciprLCAxNjAsIC0xNjApO1xuXHQgICAgfSk7XG5cblx0bGFiZWxcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XG5cdFx0aWYgKGQuY2hpbGRyZW4pIHtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0XHQuc2VsZWN0KFwiKlwiKVxuXHRcdFx0LnJlbW92ZSgpO1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcylcblx0XHQgICAgXHQuYXBwZW5kKFwidGV4dFBhdGhcIilcblx0XHRcdC5hdHRyKFwieGxpbms6aHJlZlwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHQgICAgcmV0dXJuIFwiI3NcIitpO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwic3RhcnRPZmZzZXRcIiwgXCI1MCVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uICgpIHtcblx0XHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXSA/IGRbY29uZi5sYWJlbF0uc3Vic3RyaW5nKDAsIE1hdGguUEkqZC5yKmsvOCkgOiBcIlwiO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiAoKGQueCAtIHZbMF0pKmspK29mZnNldDsgfSlcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gKChkLnkgLSB2WzFdKSprKStvZmZzZXQ7IH0pXG5cdFx0ICAgIFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgZC5yKmsgLyAzKTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcImZvbnQtc2l6ZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0ICAgIHZhciBjaXJjbGVMZW5ndGggPSBkLnIgKiBrIC8gMztcblx0XHRcdCAgICB2YXIgbGFiZWxMZW5ndGggPSBkW2NvbmYubGFiZWxdLmxlbmd0aDtcblx0XHRcdCAgICBpZiAoY2lyY2xlTGVuZ3RoIDwgbGFiZWxMZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIDEwO1xuXHRcdFx0ICAgIH1cblx0XHRcdCAgICBpZiAoY2lyY2xlTGVuZ3RoICogMC44IDwgbGFiZWxMZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIDEyO1xuXHRcdFx0ICAgIH1cblx0XHRcdCAgICBpZiAoY2lyY2xlTGVuZ3RoICogMC42IDwgbGFiZWxMZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIDE0O1xuXHRcdFx0ICAgIH1cblx0XHRcdH0pO1xuXHRcdH1cblx0ICAgIH0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy9cbiAgICAvLyBBUEkgIC8vXG4gICAgLy8vLy8vLy8vL1xuXG4gICAgcmVuZGVyLnNlbGVjdCA9IGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBoaWdobGlnaHQ7XG5cdH1cblx0aGlnaGxpZ2h0ID0gbm9kZXM7XG5cblx0Ly8gVW5oaWdobGlnaHQgZXZlcnl0aGluZ1xuXHRkMy5zZWxlY3RBbGwoXCIuaGlnaGxpZ2h0XCIpXG5cdCAgICAuY2xhc3NlZChcImhpZ2hsaWdodFwiLCBmYWxzZSk7XG5cblx0Ly8gTm8gbm9kZSB0byBoaWdobGlnaHRcblx0aWYgKChub2RlcyA9PT0gbnVsbCkgfHwgKG5vZGVzID09PSB1bmRlZmluZWQpIHx8IChub2Rlcy5sZW5ndGggPT09IDApKSB7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fVxuXG5cdGZvciAodmFyIGk9MDsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIG5vZGUgPSBub2Rlc1tpXTtcblx0ICAgIHZhciBjaXJjbGUgPSBkMy5zZWxlY3RBbGwoXCIuYnViYmxlc1ZpZXdfXCIgKyBub2RlLnByb3BlcnR5KGNvbmYua2V5KSArIFwiX1wiICsgY29uZi5kaXZJZCk7XG5cdCAgICBjaXJjbGVcblx0XHQuY2xhc3NlZCAoXCJoaWdobGlnaHRcIiwgdHJ1ZSk7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZW5kZXIuZm9jdXMgPSBmdW5jdGlvbiAobm9kZSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBmb2N1cztcblx0fVxuXG5cdC8vIEJyZWFkY3J1bXNcblx0dmFyIHVwID0gW107XG5cdG5vZGUudXBzdHJlYW0gKGZ1bmN0aW9uIChhbmNlc3Rvcikge1xuXHQgICAgaWYgKGFuY2VzdG9yLnBhcmVudCgpID09PSB1bmRlZmluZWQpIHtcblx0XHR1cC5wdXNoKGFuY2VzdG9yLnByb3BlcnR5KGNvbmYubGFiZWwpIHx8IFwiQWxsXCIpO1xuXHQgICAgfSBlbHNlIHtcblx0XHR1cC5wdXNoKG5vZGUucHJvcGVydHkoY29uZi5sYWJlbCkpO1xuXHQgICAgfVxuXHR9KTtcblx0dXAucmV2ZXJzZSgpO1xuXG5cdHZhciBicmVhZExhYmVscyA9IGJyZWFkY3J1bXMuc2VsZWN0QWxsKFwic3BhblwiKVxuXHQgICAgLmRhdGEodXAsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQ7XG5cdCAgICB9KTtcblxuXHRicmVhZExhYmVsc1xuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJzcGFuXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dl9idWJibGVzVmlld19icmVhZGNydW1MYWJlbFwiKVxuXHQgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDtcblx0ICAgIH0pO1xuXHRicmVhZExhYmVsc1xuXHQgICAgLmNsYXNzZWQgKFwiY3R0dl9idWJibGVzVmlld19saW5rXCIsIGZhbHNlKVxuXHQgICAgLm9uIChcImNsaWNrXCIsIG51bGwpO1xuXG5cdGJyZWFkTGFiZWxzLmV4aXQoKS5yZW1vdmUoKTtcblxuXHRicmVhZGNydW1zLnNlbGVjdEFsbChcIjpub3QoOmxhc3QtY2hpbGQpXCIpXG5cdCAgICAuY2xhc3NlZCAoXCJjdHR2X2J1YmJsZXNWaWV3X2xpbmtcIiwgdHJ1ZSlcblx0ICAgIC5vbihcImNsaWNrXCIsIGNvbmYuYnJlYWRjcnVtc0NsaWNrKVxuXG5cdC8vIEZvY3VzXG5cdGZvY3VzID0gbm9kZTtcblx0dmFyIGZvY3VzRGF0YSA9IGZvY3VzLmRhdGEoKTtcblx0dmFyIHRyYW5zaXRpb24gPSBkMy50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbiAoY29uZi5kdXJhdGlvbilcblx0ICAgIC50d2VlbiAoXCJ6b29tXCIsIGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaSA9IGQzLmludGVycG9sYXRlWm9vbSAodmlldywgW2ZvY3VzRGF0YS54LCBmb2N1c0RhdGEueSwgZm9jdXNEYXRhLnIqMl0pO1xuXHRcdHJldHVybiBmdW5jdGlvbiAodCkge1xuXHRcdCAgICBmb2N1c1RvKGkodCkpO1xuXHRcdH07XG5cdCAgICB9KTtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5icmVhZGNydW1zQ2xpY2sgPSBmdW5jdGlvbiAoY2IpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5icmVhZGNydW1zQ2xpY2s7XG5cdH1cblx0Y29uZi5icmVhZGNydW1zQ2xpY2sgPSBjYjtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZW5kZXIuZGF0YSA9IGZ1bmN0aW9uIChuZXdEYXRhKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYuZGF0YTtcblx0fVxuXHRjb25mLmRhdGEgPSBuZXdEYXRhO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLm9uY2xpY2sgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLm9uY2xpY2s7XG5cdH1cblx0Y29uZi5vbmNsaWNrID0gY2Jhaztcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZW5kZXIua2V5ID0gZnVuY3Rpb24gKG4pIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5rZXk7XG5cdH1cblx0Y29uZi5rZXkgPSBuO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLmxhYmVsID0gZnVuY3Rpb24gKG4pIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5sYWJlbDtcblx0fVxuXHRjb25mLmxhYmVsID0gbjtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci52YWx1ZSA9IGZ1bmN0aW9uICh2KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYudmFsdWU7XG5cdH1cblx0Y29uZi52YWx1ZSA9IHY7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIuZGlhbWV0ZXIgPSBmdW5jdGlvbiAoZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLmRpYW1ldGVyO1xuXHR9XG5cdGNvbmYuZGlhbWV0ZXIgPSBkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gcmVuZGVyLmZsYXQgPSBmdW5jdGlvbiAoYm9vbCkge1xuICAgIC8vIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgLy8gXHQgICAgcmV0dXJuIGNvbmYuZmxhdDtcbiAgICAvLyBcdH1cbiAgICAvLyBcdGNvbmYuZmxhdCA9IGJvb2w7XG4gICAgLy8gXHRyZXR1cm4gdGhpcztcbiAgICAvLyB9O1xuXG4gICAgLy8gcmVuZGVyLm5vZGUgPSB0cmVlX25vZGU7XG4gICAgcmV0dXJuIHJlbmRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXc7XG4iXX0=
