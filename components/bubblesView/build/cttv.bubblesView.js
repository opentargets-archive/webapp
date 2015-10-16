(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
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
		var found = tnt_node(data.children[j]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}

	if (deep && (data._children !== undefined)) {
	    for (var i=0; i<data._children.length; i++) {
		tnt_node(data._children[i]).find_node(cbak, deep)
		var found = tnt_node(data._children[i]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name, deep) {
	return node.find_node (function (node) {
	    return node.node_name() === name
	}, deep);
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
	return this;
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

    api.method ('get_all_nodes', function (deep) {
	var nodes = [];
	node.apply(function (n) {
	    nodes.push(n);
	}, deep);
	return nodes;
    });

    api.method ('get_all_leaves', function (deep) {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf(deep)) {
		leaves.push(n);
	    }
	}, deep);
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

    api.method ('subtree', function(nodes, keep_singletons) {
	if (keep_singletons === undefined) {
	    keep_singletons = false;
	}
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
	copy_data (data, subtree, 0, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];
	    
	    // Is in path
	    if (counts > 0) {
		if (is_singleton(node_data) && !keep_singletons) {
		    return false; 
		}
		return true;
	    }
	    // Is not in path
	    return false;
	});

	return tnt_node(subtree.children[0]);
    });

    var copy_data = function (orig_data, subtree, currBranchLength, condition) {
        if (orig_data === undefined) {
	    return;
        }

        if (condition(orig_data)) {
	    var copy = copy_node(orig_data, currBranchLength);
	    if (subtree.children === undefined) {
                subtree.children = [];
	    }
	    subtree.children.push(copy);
	    if (orig_data.children === undefined) {
                return;
	    }
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data (orig_data.children[i], copy, 0, condition);
	    }
        } else {
	    if (orig_data.children === undefined) {
                return;
	    }
	    currBranchLength += orig_data.branch_length || 0;
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data(orig_data.children[i], subtree, currBranchLength, condition);
	    }
        }
    };

    var copy_node = function (node_data, extraBranchLength) {
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
	if ((copy.branch_length !== undefined) && (extraBranchLength !== undefined)) {
	    copy.branch_length += extraBranchLength;
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
    api.method ('apply', function(cbak, deep) {
	if (deep === undefined) {
	    deep = false;
	}
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = tnt_node(data.children[i])
		n.apply(cbak, deep);
	    }
	}

	if ((data._children !== undefined) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		var n = tnt_node(data._children[j]);
		n.apply(cbak, deep);
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

    api.method ('is_leaf', function(deep) {
	if (deep) {
	    return ((data.children === undefined) && (data._children === undefined));
	}
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

    api.method ('children', function (deep) {
	var children = [];

	if (data.children) {
	    for (var i=0; i<data.children.length; i++) {
		children.push(tnt_node(data.children[i]));
	    }
	}
	if ((data._children) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		children.push(tnt_node(data._children[j]));
	    }
	}
	if (children.length === 0) {
	    return undefined;
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
                .attr("y", 0)
                .attr("width", 80)
                .attr("height", 5)
                .attr("fill", "#c6dcec");
            legend
                .append("rect")
                .attr("class", "cttv_bubblesView_legendBar")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 0)
                .attr("height", 5)
                .attr("fill", d3.rgb(62,139,173));
            legend
                .append("polygon")
                .attr("points", "0,5 -5,15 5,15")
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            legend
                .append("text")
                .attr("class", "cttv_bubblesView_currentMaxValue")
                .attr("x", 0)
                .attr("y", -5)
                .attr("text-anchor", "middle")
                .text("0");

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

},{"tnt.tree.node":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sdWNhZi9naXQvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2x1Y2FmL2dpdC93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9mYWtlXzJlMzU5YWU1LmpzIiwiL1VzZXJzL2x1Y2FmL2dpdC93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9sdWNhZi9naXQvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvaW5kZXguanMiLCIvVXNlcnMvbHVjYWYvZ2l0L3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQuYXBpL2luZGV4LmpzIiwiL1VzZXJzL2x1Y2FmL2dpdC93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL2x1Y2FmL2dpdC93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL2x1Y2FmL2dpdC93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9sdWNhZi9naXQvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcmVkdWNlLmpzIiwiL1VzZXJzL2x1Y2FmL2dpdC93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy91dGlscy5qcyIsIi9Vc2Vycy9sdWNhZi9naXQvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvc3JjL25vZGUuanMiLCIvVXNlcnMvbHVjYWYvZ2l0L3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L3NyYy9idWJibGVzVmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3ID0gcmVxdWlyZShcIi4vc3JjL2J1YmJsZXNWaWV3LmpzXCIpO1xuIiwidmFyIG5vZGUgPSByZXF1aXJlKFwiLi9zcmMvbm9kZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5vZGU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIvLyByZXF1aXJlKCdmcycpLnJlYWRkaXJTeW5jKF9fZGlybmFtZSArICcvJykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4vLyAgICAgaWYgKGZpbGUubWF0Y2goLy4rXFwuanMvZykgIT09IG51bGwgJiYgZmlsZSAhPT0gX19maWxlbmFtZSkge1xuLy8gXHR2YXIgbmFtZSA9IGZpbGUucmVwbGFjZSgnLmpzJywgJycpO1xuLy8gXHRtb2R1bGUuZXhwb3J0c1tuYW1lXSA9IHJlcXVpcmUoJy4vJyArIGZpbGUpO1xuLy8gICAgIH1cbi8vIH0pO1xuXG4vLyBTYW1lIGFzXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnV0aWxzLnJlZHVjZSA9IHJlcXVpcmUoXCIuL3JlZHVjZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHV0aWxzO1xuIiwidmFyIHJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc21vb3RoID0gNTtcbiAgICB2YXIgdmFsdWUgPSAndmFsJztcbiAgICB2YXIgcmVkdW5kYW50ID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPCBiKSB7XG5cdCAgICByZXR1cm4gKChiLWEpIDw9IChiICogMC4yKSk7XG5cdH1cblx0cmV0dXJuICgoYS1iKSA8PSAoYSAqIDAuMikpO1xuICAgIH07XG4gICAgdmFyIHBlcmZvcm1fcmVkdWNlID0gZnVuY3Rpb24gKGFycikge3JldHVybiBhcnI7fTtcblxuICAgIHZhciByZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmICghYXJyLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoZWQgPSBwZXJmb3JtX3Ntb290aChhcnIpO1xuXHR2YXIgcmVkdWNlZCAgPSBwZXJmb3JtX3JlZHVjZShzbW9vdGhlZCk7XG5cdHJldHVybiByZWR1Y2VkO1xuICAgIH07XG5cbiAgICB2YXIgbWVkaWFuID0gZnVuY3Rpb24gKHYsIGFycikge1xuXHRhcnIuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHQgICAgcmV0dXJuIGFbdmFsdWVdIC0gYlt2YWx1ZV07XG5cdH0pO1xuXHRpZiAoYXJyLmxlbmd0aCAlIDIpIHtcblx0ICAgIHZbdmFsdWVdID0gYXJyW35+KGFyci5sZW5ndGggLyAyKV1bdmFsdWVdO1x0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIG4gPSB+fihhcnIubGVuZ3RoIC8gMikgLSAxO1xuXHQgICAgdlt2YWx1ZV0gPSAoYXJyW25dW3ZhbHVlXSArIGFycltuKzFdW3ZhbHVlXSkgLyAyO1xuXHR9XG5cblx0cmV0dXJuIHY7XG4gICAgfTtcblxuICAgIHZhciBjbG9uZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0dmFyIHRhcmdldCA9IHt9O1xuXHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuXHQgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICB2YXIgcGVyZm9ybV9zbW9vdGggPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmIChzbW9vdGggPT09IDApIHsgLy8gbm8gc21vb3RoXG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhfYXJyID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBsb3cgPSAoaSA8IHNtb290aCkgPyAwIDogKGkgLSBzbW9vdGgpO1xuXHQgICAgdmFyIGhpZ2ggPSAoaSA+IChhcnIubGVuZ3RoIC0gc21vb3RoKSkgPyBhcnIubGVuZ3RoIDogKGkgKyBzbW9vdGgpO1xuXHQgICAgc21vb3RoX2FycltpXSA9IG1lZGlhbihjbG9uZShhcnJbaV0pLCBhcnIuc2xpY2UobG93LGhpZ2grMSkpO1xuXHR9XG5cdHJldHVybiBzbW9vdGhfYXJyO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdWNlciA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1fcmVkdWNlO1xuXHR9XG5cdHBlcmZvcm1fcmVkdWNlID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVuZGFudCA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHJlZHVuZGFudDtcblx0fVxuXHRyZWR1bmRhbnQgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdHZhbHVlID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2Uuc21vb3RoID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBzbW9vdGg7XG5cdH1cblx0c21vb3RoID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkdWNlO1xufTtcblxudmFyIGJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKVxuXHQudmFsdWUoJ3N0YXJ0Jyk7XG5cbiAgICB2YXIgdmFsdWUyID0gJ2VuZCc7XG5cbiAgICB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnb2JqZWN0JyA6IHtcbiAgICAgICAgICAgICAgICAnc3RhcnQnIDogb2JqMS5vYmplY3RbcmVkLnZhbHVlKCldLFxuICAgICAgICAgICAgICAgICdlbmQnICAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmFsdWUnICA6IG9iajJbdmFsdWUyXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7IHJldHVybiBvYmoxIH07XG5cbiAgICByZWQucmVkdWNlciggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0ge1xuXHQgICAgJ29iamVjdCcgOiBhcnJbMF0sXG5cdCAgICAndmFsdWUnICA6IGFyclswXVt2YWx1ZTJdXG5cdH07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnIudmFsdWUpKSB7XG5cdFx0Y3VyciA9IGpvaW4oY3VyciwgYXJyW2ldKTtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIub2JqZWN0KTtcblx0ICAgIGN1cnIub2JqZWN0ID0gYXJyW2ldO1xuXHQgICAgY3Vyci52YWx1ZSA9IGFycltpXS5lbmQ7XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyLm9iamVjdCk7XG5cblx0Ly8gcmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJlZHVjZS5qb2luID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gam9pbjtcblx0fVxuXHRqb2luID0gY2Jhaztcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlMiA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTI7XG5cdH1cblx0dmFsdWUyID0gZmllbGQ7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJldHVybiByZWQ7XG59O1xuXG52YXIgbGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKCk7XG5cbiAgICByZWQucmVkdWNlciAoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IGFyclswXTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGgtMTsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyW3ZhbHVlXSkpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIpO1xuXHQgICAgY3VyciA9IGFycltpXTtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIpO1xuXHRyZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlZDtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2U7XG5tb2R1bGUuZXhwb3J0cy5saW5lID0gbGluZTtcbm1vZHVsZS5leHBvcnRzLmJsb2NrID0gYmxvY2s7XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXRlcmF0b3IgOiBmdW5jdGlvbihpbml0X3ZhbCkge1xuXHR2YXIgaSA9IGluaXRfdmFsIHx8IDA7XG5cdHZhciBpdGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIGkrKztcblx0fTtcblx0cmV0dXJuIGl0ZXI7XG4gICAgfSxcblxuICAgIHNjcmlwdF9wYXRoIDogZnVuY3Rpb24gKHNjcmlwdF9uYW1lKSB7IC8vIHNjcmlwdF9uYW1lIGlzIHRoZSBmaWxlbmFtZVxuXHR2YXIgc2NyaXB0X3NjYXBlZCA9IHNjcmlwdF9uYW1lLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuXHR2YXIgc2NyaXB0X3JlID0gbmV3IFJlZ0V4cChzY3JpcHRfc2NhcGVkICsgJyQnKTtcblx0dmFyIHNjcmlwdF9yZV9zdWIgPSBuZXcgUmVnRXhwKCcoLiopJyArIHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXG5cdC8vIFRPRE86IFRoaXMgcmVxdWlyZXMgcGhhbnRvbS5qcyBvciBhIHNpbWlsYXIgaGVhZGxlc3Mgd2Via2l0IHRvIHdvcmsgKGRvY3VtZW50KVxuXHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0dmFyIHBhdGggPSBcIlwiOyAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHBhdGhcblx0aWYoc2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gc2NyaXB0cykge1xuXHRcdGlmKHNjcmlwdHNbaV0uc3JjICYmIHNjcmlwdHNbaV0uc3JjLm1hdGNoKHNjcmlwdF9yZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdHNbaV0uc3JjLnJlcGxhY2Uoc2NyaXB0X3JlX3N1YiwgJyQxJyk7XG5cdFx0fVxuICAgICAgICAgICAgfVxuXHR9XG5cdHJldHVybiBwYXRoO1xuICAgIH0sXG5cbiAgICBkZWZlcl9jYW5jZWwgOiBmdW5jdGlvbiAoY2JhaywgdGltZSkge1xuXHR2YXIgdGljaztcblxuXHR2YXIgZGVmZXJfY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgY2xlYXJUaW1lb3V0KHRpY2spO1xuXHQgICAgdGljayA9IHNldFRpbWVvdXQoY2JhaywgdGltZSk7XG5cdH07XG5cblx0cmV0dXJuIGRlZmVyX2NhbmNlbDtcbiAgICB9XG59O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHZhciBsO1xuXHQgICAgaWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5fcm9vdF9kaXN0ID0gMDtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGwgPSAwO1xuXHRcdGlmIChkLmJyYW5jaF9sZW5ndGgpIHtcblx0XHQgICAgbCA9IGQuYnJhbmNoX2xlbmd0aFxuXHRcdH1cblx0XHRkLl9yb290X2Rpc3QgPSBsICsgZC5fcGFyZW50Ll9yb290X2Rpc3Q7XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBkYXRhIGNhbid0IGJlIHJld3JpdHRlbiB1c2VkIHRoZSBhcGkgeWV0LiBXZSBuZWVkIGZpbmFsaXplcnNcbiAgICBub2RlLmRhdGEgPSBmdW5jdGlvbihuZXdfZGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkYXRhXG5cdH1cblx0ZGF0YSA9IG5ld19kYXRhO1xuXHRjcmVhdGVfaWRzKCk7XG5cdGxpbmtfcGFyZW50cyhkYXRhKTtcblx0Y29tcHV0ZV9yb290X2Rpc3RzKGRhdGEpO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9O1xuICAgIC8vIFdlIGJpbmQgdGhlIGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWRcbiAgICBub2RlLmRhdGEoZGF0YSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9hbGwnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pKSB7XG5cdFx0bm9kZXMucHVzaCAobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZV9ieV9uYW1lJywgZnVuY3Rpb24obmFtZSwgZGVlcCkge1xuXHRyZXR1cm4gbm9kZS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5ub2RlX25hbWUoKSA9PT0gbmFtZVxuXHR9LCBkZWVwKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0b2dnbGUnLCBmdW5jdGlvbigpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7IC8vIFVuY29sbGFwc2VkIC0+IGNvbGxhcHNlXG5cdFx0dmFyIGhpZGRlbiA9IDA7XG5cdFx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgdmFyIGhpZGRlbl9oZXJlID0gbi5uX2hpZGRlbigpIHx8IDA7XG5cdFx0ICAgIGhpZGRlbiArPSAobi5uX2hpZGRlbigpIHx8IDApICsgMTtcblx0XHR9KTtcblx0XHRub2RlLm5faGlkZGVuIChoaWRkZW4tMSk7XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2UgeyAgICAgICAgICAgICAvLyBDb2xsYXBzZWQgLT4gdW5jb2xsYXBzZVxuXHRcdG5vZGUubl9oaWRkZW4oMCk7XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IGRhdGEuX2NoaWxkcmVuO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSwgZGVlcCk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBsZWF2ZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKG4uaXNfbGVhZihkZWVwKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9LCBkZWVwKTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcywga2VlcF9zaW5nbGV0b25zKSB7XG5cdGlmIChrZWVwX3NpbmdsZXRvbnMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAga2VlcF9zaW5nbGV0b25zID0gZmFsc2U7XG5cdH1cbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXHR2YXIgaXNfc2luZ2xldG9uID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5fY2hpbGRyZW4gPSAwO1xuXHQgICAgaWYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpZCA9IG5vZGVfZGF0YS5jaGlsZHJlbltpXS5faWQ7XG5cdFx0aWYgKG5vZGVfY291bnRzW2lkXSA+IDApIHtcblx0XHQgICAgbl9jaGlsZHJlbisrO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBuX2NoaWxkcmVuID09PSAxO1xuXHR9O1xuXG5cdHZhciBzdWJ0cmVlID0ge307XG5cdGNvcHlfZGF0YSAoZGF0YSwgc3VidHJlZSwgMCwgZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5vZGVfaWQgPSBub2RlX2RhdGEuX2lkO1xuXHQgICAgdmFyIGNvdW50cyA9IG5vZGVfY291bnRzW25vZGVfaWRdO1xuXHQgICAgXG5cdCAgICAvLyBJcyBpbiBwYXRoXG5cdCAgICBpZiAoY291bnRzID4gMCkge1xuXHRcdGlmIChpc19zaW5nbGV0b24obm9kZV9kYXRhKSAmJiAha2VlcF9zaW5nbGV0b25zKSB7XG5cdFx0ICAgIHJldHVybiBmYWxzZTsgXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gSXMgbm90IGluIHBhdGhcblx0ICAgIHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0cmV0dXJuIHRudF9ub2RlKHN1YnRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAob3JpZ19kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25kaXRpb24ob3JpZ19kYXRhKSkge1xuXHQgICAgdmFyIGNvcHkgPSBjb3B5X25vZGUob3JpZ19kYXRhLCBjdXJyQnJhbmNoTGVuZ3RoKTtcblx0ICAgIGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJ0cmVlLmNoaWxkcmVuID0gW107XG5cdCAgICB9XG5cdCAgICBzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YSAob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBjb3B5LCAwLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgY3VyckJyYW5jaExlbmd0aCArPSBvcmlnX2RhdGEuYnJhbmNoX2xlbmd0aCB8fCAwO1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjdXJyQnJhbmNoTGVuZ3RoLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjb3B5X25vZGUgPSBmdW5jdGlvbiAobm9kZV9kYXRhLCBleHRyYUJyYW5jaExlbmd0aCkge1xuXHR2YXIgY29weSA9IHt9O1xuXHQvLyBjb3B5IGFsbCB0aGUgb3duIHByb3BlcnRpZXMgZXhjZXB0cyBsaW5rcyB0byBvdGhlciBub2RlcyBvciBkZXB0aFxuXHRmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0ICAgIGlmICgocGFyYW0gPT09IFwiY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX2NoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9wYXJlbnRcIikgfHxcblx0XHQocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0Y29weVtwYXJhbV0gPSBub2RlX2RhdGFbcGFyYW1dO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoY29weS5icmFuY2hfbGVuZ3RoICE9PSB1bmRlZmluZWQpICYmIChleHRyYUJyYW5jaExlbmd0aCAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgY29weS5icmFuY2hfbGVuZ3RoICs9IGV4dHJhQnJhbmNoTGVuZ3RoO1xuXHR9XG5cdHJldHVybiBjb3B5O1xuICAgIH07XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZsYXR0ZW4nLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChub2RlLmlzX2xlYWYoKSkge1xuXHQgICAgcmV0dXJuIG5vZGU7XG5cdH1cblx0dmFyIGRhdGEgPSBub2RlLmRhdGEoKTtcblx0dmFyIG5ld3Jvb3QgPSBjb3B5X25vZGUoZGF0YSk7XG5cdHZhciBsZWF2ZXMgPSBub2RlLmdldF9hbGxfbGVhdmVzKCk7XG5cdG5ld3Jvb3QuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3cm9vdC5jaGlsZHJlbi5wdXNoKGNvcHlfbm9kZShsZWF2ZXNbaV0uZGF0YSgpKSk7XG5cdH1cblxuXHRyZXR1cm4gdG50X25vZGUobmV3cm9vdCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBvbmx5ICdhcHBseSdzIHRvIG5vbiBjb2xsYXBzZWQgbm9kZXMgKGllIC5fY2hpbGRyZW4gaXMgbm90IHZpc2l0ZWQpXG4gICAgLy8gV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgYW4gZXh0cmEgZmxhZyAodHJ1ZS9mYWxzZSkgdG8gdmlzaXQgYWxzbyBjb2xsYXBzZWQgbm9kZXM/XG4gICAgYXBpLm1ldGhvZCAoJ2FwcGx5JywgZnVuY3Rpb24oY2JhaywgZGVlcCkge1xuXHRpZiAoZGVlcCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBkZWVwID0gZmFsc2U7XG5cdH1cblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuXG5cdGlmICgoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkgJiYgZGVlcCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltqXSk7XG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKGRlZXApIHtcblx0aWYgKGRlZXApIHtcblx0ICAgIHJldHVybiAoKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgJiYgKGRhdGEuX2NoaWxkcmVuID09PSB1bmRlZmluZWQpKTtcblx0fVxuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblxuXHRpZiAoZGF0YS5jaGlsZHJlbikge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoKGRhdGEuX2NoaWxkcmVuKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKSk7XG5cdCAgICB9XG5cdH1cblx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gY2hpbGRyZW47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIHRudF9ub2RlKGRhdGEuX3BhcmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbm9kZTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X25vZGU7XG5cbiIsInZhciB0cmVlX25vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcblxudmFyIGJ1YmJsZXNWaWV3ID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2ggKFwiY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiKTtcblxuICAgIHZhciBjb25mID0ge1xuICAgICAgICBkaWFtZXRlciA6IDYwMCxcbiAgICAgICAgZm9ybWF0IDogZDMuZm9ybWF0KFwiLGRcIiksXG4gICAgICAgIGNvbG9yIDogZDMuc2NhbGUuY2F0ZWdvcnkyMGMoKSxcbiAgICAgICAgY29sb3JQYWxldHRlIDogdHJ1ZSxcbiAgICAgICAgZGF0YSA6IHVuZGVmaW5lZCxcbiAgICAgICAgdmFsdWUgOiBcInZhbHVlXCIsXG4gICAgICAgIGtleSA6IFwibmFtZVwiLFxuICAgICAgICBsYWJlbDogXCJuYW1lXCIsXG4gICAgICAgIGRpdklkIDogdW5kZWZpbmVkLFxuICAgICAgICBvbiA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAvL29uY2xpY2sgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICAgIGJyZWFkY3J1bXNDbGljayA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlbmRlci5mb2N1cyhjb25mLmRhdGEpO1xuICAgICAgICB9LFxuICAgICAgICBtYXhWYWwgOiAxLFxuICAgICAgICBsZWdlbmRUZXh0IDogXCI8dGV4dD5DdXJyZW50IHNjb3JlIHJhbmdlPC90ZXh0PlwiLFxuICAgICAgICB1c2VGdWxsUGF0aCA6IGZhbHNlXG4gICAgICAgIC8vbGFiZWxPZmZzZXQgOiAxMFxuICAgIH07XG5cbiAgICB2YXIgZm9jdXM7IC8vIHVuZGVmIGJ5IGRlZmF1bHRcbiAgICB2YXIgaGlnaGxpZ2h0OyAvLyB1bmRlZiBieSBkZWZhdWx0XG4gICAgdmFyIHZpZXc7XG4gICAgdmFyIHN2ZztcbiAgICB2YXIgbGVnZW5kO1xuICAgIHZhciBidWJibGVzVmlld19nO1xuICAgIHZhciBicmVhZGNydW1zO1xuICAgIHZhciBwYWNrO1xuICAgIHZhciBub2RlcztcbiAgICB2YXIgY2lyY2xlO1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgcGF0aDtcbiAgICB2YXIgZGVmcztcblxuICAgIHZhciBjdXJyVHJhbnNsYXRlID0gWzAsMF07XG4gICAgdmFyIGN1cnJTY2FsZSA9IDE7XG4gICAgLy8gdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAvLyBcdC5zY2FsZUV4dGVudChbMC44LCBJbmZpbml0eV0pXG4gICAgLy8gXHQub24oXCJ6b29tXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBcdCAgICByZWRyYXcoc3ZnKTtcbiAgICAvLyBcdH0pO1xuXG4gICAgLypcbiAgICAgKiBSZW5kZXIgdmFsaWQgSlNPTiBkYXRhXG4gICAgICovXG4gICAgdmFyIHJlbmRlciA9IGZ1bmN0aW9uKGRpdikge1xuXG4gICAgICAgIGNvbmYuZGl2SWQgPSBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIik7XG5cbiAgICAgICAgLy8gYnJlYWRjcnVtcy1saWtlIG5hdmlnYXRpb25cbiAgICAgICAgYnJlYWRjcnVtcyA9IGQzLnNlbGVjdChkaXYpXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIFwiY3R0dl9idWJibGVzVmlld19icmVhZGNydW1zXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLFwiNTBcIik7XG5cbiAgICAgICAgc3ZnID0gZDMuc2VsZWN0KGRpdilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZi5kaWFtZXRlcilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYuZGlhbWV0ZXIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dl9idWJibGVzVmlld1wiKTtcblxuICAgICAgICBkZWZzID0gc3ZnLmFwcGVuZChcImRlZnNcIik7XG5cbiAgICAgICAgYnViYmxlc1ZpZXdfZyA9IHN2Z1xuICAgICAgICAgICAgLmFwcGVuZChcImdcIik7XG5cblxuICAgICAgICBwYWNrID0gZDMubGF5b3V0LnBhY2soKVxuICAgICAgICAgICAgLnZhbHVlKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRbY29uZi52YWx1ZV07XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnNvcnQobnVsbClcbiAgICAgICAgICAgIC5zaXplKFtjb25mLmRpYW1ldGVyLCBjb25mLmRpYW1ldGVyXSlcbiAgICAgICAgICAgIC5wYWRkaW5nKDEuNSk7XG5cbiAgICAgICAgaWYgKGNvbmYubWF4VmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGxlZ2VuZCA9IHN2Z1xuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMjAsIFwiICsgKGNvbmYuZGlhbWV0ZXIgLSAyMCkgKyBcIilcIik7XG4gICAgICAgICAgICBsZWdlbmRcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgODApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgNSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCIjYzZkY2VjXCIpO1xuICAgICAgICAgICAgbGVnZW5kXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dl9idWJibGVzVmlld19sZWdlbmRCYXJcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgMClcbiAgICAgICAgICAgICAgICAuYXR0cihcInlcIiwgMClcbiAgICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIDApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgNSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgZDMucmdiKDYyLDEzOSwxNzMpKTtcbiAgICAgICAgICAgIGxlZ2VuZFxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJwb2x5Z29uXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgXCIwLDUgLTUsMTUgNSwxNVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMik7XG5cbiAgICAgICAgICAgIGxlZ2VuZFxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZfYnViYmxlc1ZpZXdfY3VycmVudE1heFZhbHVlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIC01KVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgICAgICAgICAudGV4dChcIjBcIik7XG5cbiAgICAgICAgICAgIGxlZ2VuZFxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIC01KVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCA1KVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgICAgICAgICAudGV4dCgwKTtcblxuICAgICAgICAgICAgbGVnZW5kXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgODUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIDUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXG4gICAgICAgICAgICAgICAgLnRleHQoY29uZi5tYXhWYWwpO1xuXG4gICAgICAgICAgICB2YXIgZ0xlZyA9IGxlZ2VuZFxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMTAwLCA1KVwiKVxuICAgICAgICAgICAgICAgIC5odG1sKGNvbmYubGVnZW5kVGV4dCk7XG5cbiAgICBcdCAgICAvLyBsZWdlbmRcbiAgICBcdCAgICAvLyBcdC5hcHBlbmQoXCJhXCIpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcInhcIiwgMTAwKVxuICAgIFx0ICAgIC8vIFx0LmF0dHIoXCJ5XCIsIDUpXG4gICAgXHQgICAgLy8gXHQuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcbiAgICBcdCAgICAvLyBcdC5odG1sKFwiPGEgaHJlZj0neGxpbms6aHJlZj1cXFwiaHR0cDovL3d3dy5nb29nbGUuY29tXFxcIic+SHVycmFoITwvYT5cIik7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJlbmRlci51cGRhdGUoKTtcblxuICAgICAgICB2YXIgZCA9IGNvbmYuZGF0YS5kYXRhKCk7XG4gICAgICAgIHZpZXcgPSBbZC54LCBkLnksIGQucioyXTtcbiAgICAgICAgLy9mb2N1c1RvKFtkLngsIGQueSwgZC5yKjJdKTtcbiAgICAgICAgLy9yZW5kZXIuZm9jdXMgKGNvbmYuZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIHJlbmRlcjtcbiAgICB9O1xuXG4gICAgcmVuZGVyLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gU2FmZWx5IHVuZm9jdXMgb24gdXBkYXRlXG5cbiAgICAgICAgaWYgKGNvbmYuZGF0YS5jaGlsZHJlbigpKSB7XG4gICAgICAgICAgICByZW5kZXIuZm9jdXMoY29uZi5kYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwYWNrRGF0YSA9IHBhY2subm9kZXMoY29uZi5kYXRhLmRhdGEoKSk7XG5cbiAgICAgICAgY2lyY2xlID0gYnViYmxlc1ZpZXdfZy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5kYXRhKHBhY2tEYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZFtjb25mLmtleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkW2NvbmYua2V5XSArIFwiX1wiICsgZC5fcGFyZW50W2NvbmYua2V5XTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAvLy5kYXRhKHBhY2tEYXRhKVxuXG4gICAgICAgIC8vIG5ldyBjaXJjbGVzXG4gICAgICAgIGNpcmNsZVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJidWJibGVzVmlld19cIiArIGRbY29uZi5rZXldICsgXCJfXCIgKyBjb25mLmRpdklkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jbGFzc2VkKFwiYnViYmxlc1ZpZXdOb2RlXCIsIHRydWUpXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMClcbiAgICAgICAgICAgIC5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGQzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbiAoXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChkMy5ldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCB0cmVlX25vZGUoZCkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbiAoXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCB0cmVlX25vZGUoZCkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbiAoXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwodGhpcywgdHJlZV9ub2RlKGQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLndhcm4oXCIgPT09PiBcIik7XG4gICAgICAgICAgICAvLyAgICAgaWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vICAgICBjb25mLm9uY2xpY2suY2FsbCh0aGlzLCB0cmVlX25vZGUoZCkpO1xuICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgdmFyIGV4aXRDaXJjbGVzID0gY2lyY2xlXG4gICAgICAgICAgICAuZXhpdCgpO1xuXG4gICAgICAgIC8vIC8vIHRpdGxlc1xuICAgICAgICAvLyBidWJibGVzVmlld19nLnNlbGVjdEFsbChcInRpdGxlXCIpXG4gICAgICAgIC8vICAgICAuZGF0YShwYWNrRGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgLy8gXHRyZXR1cm4gZC5faWQ7XG4gICAgICAgIC8vICAgICB9KVxuICAgICAgICAvLyAgICAgLmVudGVyKClcbiAgICAgICAgLy8gICAgIC5hcHBlbmQoXCJ0aXRsZVwiKVxuICAgICAgICAvLyAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFtjb25mLmtleV0gKyBcIjogXCIgKyBjb25mLmZvcm1hdChkW2NvbmYudmFsdWVdKTsgfSk7XG5cbiAgICAgICAgLy9uZXdOb2Rlcy5hcHBlbmQgKFwiY2lyY2xlXCIpO1xuXG4gICAgICAgIC8vbmV3Tm9kZXMuYXBwZW5kKFwidGV4dFwiKTtcblxuICAgICAgICBwYXRoID0gZGVmcy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgICAgICAuZGF0YShwYWNrRGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRbY29uZi5rZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZFtjb25mLmtleV0gKyBcIl9cIiArIGQuX3BhcmVudFtjb25mLmtleV07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBuZXcgcGF0aHNcbiAgICAgICAgcGF0aFxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIGdldFBhdGhJZCk7XG4gICAgICAgICAgICAvLy5hdHRyKFwiZmlsbFwiLCBcImJsYWNrXCIpO1xuXG5cbiAgICAgICAgbGFiZWwgPSBidWJibGVzVmlld19nLnNlbGVjdEFsbChcInRleHRcIilcbiAgICAgICAgICAgIC5kYXRhKHBhY2tEYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZFtjb25mLmtleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkW2NvbmYua2V5XSArIFwiX1wiICsgZC5fcGFyZW50W2NvbmYua2V5XTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBuZXdMYWJlbHMgPSBsYWJlbFxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwidG9wTGFiZWxcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibGVhZkxhYmVsXCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKFwiY3Vyc29yXCIsIFwiZGVmYXVsdFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJwb2ludGVyLWV2ZW50c1wiLCBmdW5jdGlvbiAoZCkge3JldHVybiBkLmNoaWxkcmVuID8gXCJhdXRvXCIgOiBcIm5vbmVcIjt9KVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHsgLy8gb25seSBvbiB0aG9zZSB3aXRoIHBvaW50ZXItZXZlbnRzIFwiYXV0b1wiIGllLCBvbiB0aGVyYXBldXRpYyBhcmVhcyBsYWJlbHNcbiAgICAgICAgICAgICAgICBpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgdHJlZV9ub2RlKGQpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJuYXZ5XCIpXG4gICAgICAgICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcblxuICAgICAgICAvLyBDcmVhdGUgbmV3IGxhYmVscyBvbiB0aGVyYXBldXRpYyBhcmVhc1xuICAgICAgICAvLyBuZXdMYWJlbHNcbiAgICAgICAgLy8gICAgIC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIC8vICAgICAgICAgaWYgKGQuY2hpbGRyZW4pIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFBhdGhcIilcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIC8vIC5hdHRyKFwieGxpbms6aHJlZlwiLCB3aW5kb3cubG9jYXRpb24uaHJlZiArIFwiI1wiICsgZ2V0UGF0aElkKGQpKVxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgLmF0dHIoXCJzdGFydE9mZnNldFwiLCBcIjUwJVwiKVxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLlBJKmQuci84IDwgMykge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRbY29uZi5sYWJlbF0gPyBkW2NvbmYubGFiZWxdLnN1YnN0cmluZygwLCBNYXRoLlBJKmQuci84KSA6IFwiXCI7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICB9KTtcblxuICAgICAgICB2YXIgZXhpdExhYmVscyA9IGxhYmVsXG4gICAgICAgICAgICAuZXhpdCgpO1xuXG4gICAgICAgIHZhciB1cGRhdGVUcmFuc2l0aW9uID0gc3ZnLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pO1xuXG4gICAgICAgIHVwZGF0ZVRyYW5zaXRpb25cbiAgICAgICAgICAgIC5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC55O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBNb3ZlIGxhYmVsc1xuICAgICAgICB1cGRhdGVUcmFuc2l0aW9uXG4gICAgICAgICAgICAuc2VsZWN0QWxsKFwiLmxlYWZMYWJlbFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2lyY2xlTGVuZ3RoID0gZC5yIC8gMztcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWxMZW5ndGggPSBkW2NvbmYubGFiZWxdID8gZFtjb25mLmxhYmVsXS5sZW5ndGggOiAwO1xuICAgICAgICAgICAgICAgIGlmIChjaXJjbGVMZW5ndGggPCBsYWJlbExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjaXJjbGVMZW5ndGggKiAwLjggPCBsYWJlbExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjaXJjbGVMZW5ndGggKiAwLjYgPCBsYWJlbExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuM2VtXCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC55OyB9KTtcbiAgICAgICAgICAgIC8vIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAvLyAgICAgaWYgKGQuci8zIDwgMykge1xuICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIGRbY29uZi5sYWJlbF0uc3Vic3RyaW5nKDAsIGQuciAvIDMpO1xuICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgdXBkYXRlVHJhbnNpdGlvblxuICAgICAgICAgICAgLnNlbGVjdEFsbChcIi50b3BMYWJlbFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMTApO1xuXG4gICAgICAgIC8vIFRoaXMgaGFzIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgdXBkYXRlVHJhbnNpdGlvbiAob3RoZXJ3aXNlLCB1cGRhdGVUcmFuc2l0aW9uIHdvdWxkIG92ZXJyaWRlIHRoZXNlIHRyYW5zaXRpb25zKVxuICAgICAgICBleGl0Q2lyY2xlc1xuICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLmR1cmF0aW9uKDEwMDApXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMClcbiAgICAgICAgICAgIC5yZW1vdmUoKTtcbiAgICAgICAgZXhpdExhYmVsc1xuICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLmR1cmF0aW9uKDEwMDApXG4gICAgICAgICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAwKVxuICAgICAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAvLyBNb3ZlIGxhYmVsc1xuICAgICAgICAgICAgLy8gbGFiZWxcbiAgICAgICAgICAgIC8vIC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAvLyAgICAgaWYgKCFkLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjNlbVwiKVxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLng7IH0pXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueTsgfSlcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgcmV0dXJuIGRbY29uZi5sYWJlbF0uc3Vic3RyaW5nKDAsIGQuciAvIDMpO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgdXBkYXRlVHJhbnNpdGlvblxuICAgICAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXNjcmliZUFyYyhkLngsIGQueSsxMCwgZC5yLCAxNjAsIC0xNjApO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAvLyBNb3Zpbmcgbm9kZXNcbiAgICAgICAgY2lyY2xlXG4gICAgICAgICAgICAvLy5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXG4gICAgICAgICAgICAuY2xhc3NlZCAoXCJidWJibGVzVmlld0xlYWZcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWQuY2hpbGRyZW47XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNsYXNzZWQgKFwiYnViYmxlc1ZpZXdSb290XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFkLl9wYXJlbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC8vIC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuICAgICAgICAgICAgLy8gLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgLy8gXHRyZXR1cm4gZC54O1xuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueTsgfSlcbiAgICAgICAgICAgIC8vIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5yOyB9KTtcblxuXG4gICAgICAgICAgICAvLyAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XG4gICAgICAgICAgICAvLyB9KTtcblxuICAgICAgICAgICAgLy9cdG5vZGVzLnNlbGVjdChcInBhdGhcIilcblxuICAgICAgICAgICAgLy9ub2Rlcy5zZWxlY3QoXCJ0ZXh0XCIpXG5cbiAgICAgICAgICAgIC8vIG5vZGVzLnNlbGVjdChcImNpcmNsZVwiKVxuICAgICAgICAgICAgLy8gICAgIC5hdHRyIChcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAvLyAgICAgXHRyZXR1cm4gXCJidWJibGVzVmlld19cIiArIGRbY29uZi5rZXldICsgXCJfXCIgKyBjb25mLmRpdklkO1xuICAgICAgICAgICAgLy8gICAgIH0pXG4gICAgICAgICAgICAvLyAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLy8gICAgIC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuICAgICAgICAgICAgLy8gICAgIC5hdHRyIChcInJcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgLy8gXHQvL3JldHVybiBkLnIgLSAoZC5jaGlsZHJlbiA/IDAgOiBjb25mLmxhYmVsT2Zmc2V0KTtcbiAgICAgICAgICAgIC8vIFx0cmV0dXJuIGQucjtcbiAgICAgICAgICAgIC8vICAgICB9KTtcblxuICAgICAgICAgICAgLy9jaXJjbGUgPSBub2Rlcy5zZWxlY3RBbGwoXCJjaXJjbGVcIik7XG5cbiAgICAgICAgICAgIC8vIEV4aXRpbmcgbm9kZXNcbiAgICAgICAgICAgIC8vIG5vZGVzXG4gICAgICAgICAgICAvLyAgICAgLmV4aXQoKVxuICAgICAgICAgICAgLy8gICAgIC5yZW1vdmUoKTtcblxuICAgICAgICAvLyBTaXplIGxlZ2VuZFxuICAgICAgICB2YXIgbWF4Q3VycmVudFZhbCA9IDA7XG4gICAgICAgIGNvbmYuZGF0YS5hcHBseShmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIHNjb3JlID0gbm9kZS5wcm9wZXJ0eShcImFzc29jaWF0aW9uX3Njb3JlXCIpO1xuICAgICAgICAgICAgaWYgKHNjb3JlICYmIHNjb3JlID4gbWF4Q3VycmVudFZhbCkge1xuICAgICAgICAgICAgICAgIG1heEN1cnJlbnRWYWwgPSBzY29yZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNvbmYubWF4VmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciBsZWdlbmRTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAgICAgLnJhbmdlKFswLDgwXSlcbiAgICAgICAgICAgICAgICAuZG9tYWluKFswLGNvbmYubWF4VmFsXSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgcG9zID0gbGVnZW5kU2NhbGUobWF4Q3VycmVudFZhbCk7XG4gICAgICAgICAgICAgICAgbGVnZW5kXG4gICAgICAgICAgICAgICAgICAgIC5zZWxlY3QoXCIuY3R0dl9idWJibGVzVmlld19sZWdlbmRCYXJcIilcbiAgICAgICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBwb3MpO1xuICAgICAgICAgICAgICAgIGxlZ2VuZFxuICAgICAgICAgICAgICAgICAgICAuc2VsZWN0KFwicG9seWdvblwiKVxuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcInBvaW50c1wiLCAoKHBvcyswKSArIFwiLDUgXCIgKyAocG9zLTUpICsgXCIsMTUgXCIgKyAocG9zKzUpICsgXCIsMTVcIikpO1xuICAgICAgICAgICAgICAgIGxlZ2VuZFxuICAgICAgICAgICAgICAgICAgICAuc2VsZWN0KFwiLmN0dHZfYnViYmxlc1ZpZXdfY3VycmVudE1heFZhbHVlXCIpXG4gICAgICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBwb3MpXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KG1heEN1cnJlbnRWYWwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEF1eGlsaWFyIGZ1bmN0aW9ucyAvL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZ1bmN0aW9uIGdldFBhdGhJZCAoZCkge1xuICAgICAgICB2YXIgaWQgPSBcInNcIjtcbiAgICAgICAgaWYgKGRbY29uZi5rZXldKSB7XG4gICAgICAgICAgICBpZCArPSBkW2NvbmYua2V5XTtcbiAgICAgICAgICAgIGlmIChkLl9wYXJlbnQgJiYgZC5fcGFyZW50W2NvbmYua2V5XSkge1xuICAgICAgICAgICAgICAgIGlkICs9IGQuX3BhcmVudFtjb25mLmtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvbGFyVG9DYXJ0ZXNpYW4oY2VudGVyWCwgY2VudGVyWSwgcmFkaXVzLCBhbmdsZUluRGVncmVlcykge1xuICAgICAgICB2YXIgYW5nbGVJblJhZGlhbnMgPSAoYW5nbGVJbkRlZ3JlZXMtOTApICogTWF0aC5QSSAvIDE4MC4wO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogY2VudGVyWCArIChyYWRpdXMgKiBNYXRoLmNvcyhhbmdsZUluUmFkaWFucykpLFxuICAgICAgICAgICAgeTogY2VudGVyWSArIChyYWRpdXMgKiBNYXRoLnNpbihhbmdsZUluUmFkaWFucykpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVzY3JpYmVBcmMoeCwgeSwgcmFkaXVzLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSl7XG4gICAgICAgIHZhciBzdGFydCA9IHBvbGFyVG9DYXJ0ZXNpYW4oeCwgeSwgcmFkaXVzLCBlbmRBbmdsZSk7XG4gICAgICAgIHZhciBlbmQgPSBwb2xhclRvQ2FydGVzaWFuKHgsIHksIHJhZGl1cywgc3RhcnRBbmdsZSk7XG4gICAgICAgIHZhciBhcmNTd2VlcCA9IGVuZEFuZ2xlIC0gc3RhcnRBbmdsZSA8PSAxODAgPyBcIjBcIiA6IFwiMVwiO1xuICAgICAgICB2YXIgZCA9IFtcbiAgICAgICAgICAgIFwiTVwiLCBzdGFydC54LCBzdGFydC55LFxuICAgICAgICAgICAgXCJBXCIsIHJhZGl1cywgcmFkaXVzLCAwLCAxLCAxLCBlbmQueCwgZW5kLnlcbiAgICAgICAgXS5qb2luKFwiIFwiKTtcbiAgICAgICAgcmV0dXJuIGQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVkcmF3ICh2aXopIHtcbiAgICAgICAgdml6LmF0dHIgKFwidHJhbnNmb3JtXCIsXG4gICAgICAgIFwidHJhbnNsYXRlIChcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKSBcIiArXG4gICAgICAgIFwic2NhbGUgKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9jdXNUbyAodikge1xuICAgICAgICB2YXIgayA9IGNvbmYuZGlhbWV0ZXIgLyB2WzJdO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gY29uZi5kaWFtZXRlciAvIDI7XG4gICAgICAgIHZpZXcgPSB2O1xuXG4gICAgICAgIGNpcmNsZVxuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKGQueCAtIHZbMF0pKmspK29mZnNldDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgoZC55IC0gdlsxXSkqaykrb2Zmc2V0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC8vIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIC8vIFx0cmV0dXJuIFwidHJhbnNsYXRlKFwiICsgKCgoZC54IC0gdlswXSkgKiBrKSArIG9mZnNldCkgKyBcIixcIiArICgoKGQueSAtIHZbMV0pICogaykgKyBvZmZzZXQpICsgXCIpXCI7XG4gICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQuciAqIGs7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBwYXRoXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVzY3JpYmVBcmMoKChkLngtdlswXSkqaykrb2Zmc2V0LCAoKGQueS12WzFdKSprKSsxMCtvZmZzZXQsIGQuciprLCAxNjAsIC0xNjApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbGFiZWxcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2VsZWN0KFwiKlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0UGF0aFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gLmF0dHIoXCJ4bGluazpocmVmXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gXCIjc1wiK2k7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgXCJiYXNlXCIgdGFnIGlzIHByZXNlbnQgaW4gdGhlIHBhZ2UsIGxpbmtpbmcgYnkgbmFtZSBkb2Vzbid0IHdvcmsgaW4gRkYgKFNhZmFyaSBhbmQgQ2hyb21lIGxvb2tzIGdvb2QpLiBXZSBwcmVwZW5kIHdpbmRvdy5sb2NhdGlvbi5ocmVmIHRvIGdldCBmdWxsIElSSVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vbGVvbmRlcmlqa2UvYzVjZjdjNWIyZTQyNGMwMDYxZDJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwieGxpbms6aHJlZlwiLCAoY29uZi51c2VGdWxsUGF0aCA/IHdpbmRvdy5sb2NhdGlvbi5ocmVmIDogXCJcIikgKyBcIiNcIiArIGdldFBhdGhJZChkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwic3RhcnRPZmZzZXRcIiwgXCI1MCVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5QSSpkLnIqay84IDwgMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRbY29uZi5sYWJlbF0gPyBkW2NvbmYubGFiZWxdLnN1YnN0cmluZygwLCBNYXRoLlBJKmQuciprLzgpIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiAoKGQueCAtIHZbMF0pKmspK29mZnNldDsgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gKChkLnkgLSB2WzFdKSprKStvZmZzZXQ7IH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkW2NvbmYubGFiZWxdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLnIqayAvIDMgPCAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgZC5yKmsgLyAzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2lyY2xlTGVuZ3RoID0gZC5yICogayAvIDM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsTGVuZ3RoID0gZFtjb25mLmxhYmVsXSA/IGRbY29uZi5sYWJlbF0ubGVuZ3RoIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2lyY2xlTGVuZ3RoIDwgbGFiZWxMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2lyY2xlTGVuZ3RoICogMC44IDwgbGFiZWxMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2lyY2xlTGVuZ3RoICogMC42IDwgbGFiZWxMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy9cbiAgICAvLyBBUEkgIC8vXG4gICAgLy8vLy8vLy8vL1xuXG4gICAgcmVuZGVyLm1heFZhbCA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmYubWF4VmFsO1xuICAgICAgICB9XG4gICAgICAgIGNvbmYubWF4VmFsID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5sZWdlbmRUZXh0ID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5sZWdlbmRUZXh0O1xuICAgICAgICB9XG4gICAgICAgIGNvbmYubGVnZW5kVGV4dCA9IHQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIuc2VsZWN0ID0gZnVuY3Rpb24gKG5vZGVzKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGhpZ2hsaWdodDtcbiAgICAgICAgfVxuICAgICAgICBoaWdobGlnaHQgPSBub2RlcztcblxuICAgICAgICAvLyBVbmhpZ2hsaWdodCBldmVyeXRoaW5nXG4gICAgICAgIGQzLnNlbGVjdEFsbChcIi5oaWdobGlnaHRcIilcbiAgICAgICAgICAgIC5jbGFzc2VkKFwiaGlnaGxpZ2h0XCIsIGZhbHNlKTtcblxuICAgICAgICAvLyBObyBub2RlIHRvIGhpZ2hsaWdodFxuICAgICAgICBpZiAoKG5vZGVzID09PSBudWxsKSB8fCAobm9kZXMgPT09IHVuZGVmaW5lZCkgfHwgKG5vZGVzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgdmFyIGNpcmNsZSA9IGQzLnNlbGVjdEFsbChcIi5idWJibGVzVmlld19cIiArIG5vZGUucHJvcGVydHkoY29uZi5rZXkpICsgXCJfXCIgKyBjb25mLmRpdklkKTtcbiAgICAgICAgICAgIGNpcmNsZVxuICAgICAgICAgICAgICAgIC5jbGFzc2VkIChcImhpZ2hsaWdodFwiLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLmZvY3VzID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9jdXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCcmVhZGNydW1zXG4gICAgICAgIHZhciB1cCA9IFtdO1xuICAgICAgICBub2RlLnVwc3RyZWFtIChmdW5jdGlvbiAoYW5jZXN0b3IpIHtcbiAgICAgICAgICAgIGlmIChhbmNlc3Rvci5wYXJlbnQoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdXAucHVzaChhbmNlc3Rvci5wcm9wZXJ0eShjb25mLmxhYmVsKSB8fCBcIkFsbFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXAucHVzaChub2RlLnByb3BlcnR5KGNvbmYubGFiZWwpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHVwLnJldmVyc2UoKTtcblxuICAgICAgICB2YXIgYnJlYWRMYWJlbHMgPSBicmVhZGNydW1zLnNlbGVjdEFsbChcInNwYW5cIilcbiAgICAgICAgICAgIC5kYXRhKHVwLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWRMYWJlbHNcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwic3BhblwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZfYnViYmxlc1ZpZXdfYnJlYWRjcnVtTGFiZWxcIilcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFkTGFiZWxzXG4gICAgICAgICAgICAuY2xhc3NlZCAoXCJjdHR2X2J1YmJsZXNWaWV3X2xpbmtcIiwgZmFsc2UpXG4gICAgICAgICAgICAub24gKFwiY2xpY2tcIiwgbnVsbCk7XG5cbiAgICAgICAgYnJlYWRMYWJlbHMuZXhpdCgpLnJlbW92ZSgpO1xuXG4gICAgICAgIGJyZWFkY3J1bXMuc2VsZWN0QWxsKFwiOm5vdCg6bGFzdC1jaGlsZClcIilcbiAgICAgICAgICAgIC5jbGFzc2VkIChcImN0dHZfYnViYmxlc1ZpZXdfbGlua1wiLCB0cnVlKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgY29uZi5icmVhZGNydW1zQ2xpY2spO1xuXG4gICAgICAgIC8vIEZvY3VzXG4gICAgICAgIGZvY3VzID0gbm9kZTtcbiAgICAgICAgdmFyIGZvY3VzRGF0YSA9IGZvY3VzLmRhdGEoKTtcbiAgICAgICAgdmFyIHRyYW5zaXRpb24gPSBkMy50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC5kdXJhdGlvbiAoY29uZi5kdXJhdGlvbilcbiAgICAgICAgICAgIC50d2VlbiAoXCJ6b29tXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGQzLmludGVycG9sYXRlWm9vbSAodmlldywgW2ZvY3VzRGF0YS54LCBmb2N1c0RhdGEueSwgZm9jdXNEYXRhLnIqMl0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgICAgICBmb2N1c1RvKGkodCkpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5icmVhZGNydW1zQ2xpY2sgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5icmVhZGNydW1zQ2xpY2s7XG4gICAgICAgIH1cbiAgICAgICAgY29uZi5icmVhZGNydW1zQ2xpY2sgPSBjYjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5kYXRhID0gZnVuY3Rpb24gKG5ld0RhdGEpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5kYXRhO1xuICAgICAgICB9XG4gICAgICAgIGNvbmYuZGF0YSA9IG5ld0RhdGE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvLyByZW5kZXIub25jbGljayA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdC8vIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQvLyAgICAgcmV0dXJuIGNvbmYub25jbGljaztcblx0Ly8gfVxuXHQvLyBjb25mLm9uY2xpY2sgPSBjYmFrO1xuXHQvLyByZXR1cm4gdGhpcztcbiAgICAvLyB9O1xuXG4gICAgcmVuZGVyLmtleSA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmYua2V5O1xuICAgICAgICB9XG4gICAgICAgIGNvbmYua2V5ID0gbjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5sYWJlbCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmYubGFiZWw7XG4gICAgICAgIH1cbiAgICAgICAgY29uZi5sYWJlbCA9IG47XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIudmFsdWUgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25mLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbmYudmFsdWUgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLmRpYW1ldGVyID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5kaWFtZXRlcjtcbiAgICAgICAgfVxuICAgICAgICBjb25mLmRpYW1ldGVyID0gZDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci51c2VGdWxsUGF0aCA9IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmYudXNlRnVsbFBhdGg7XG4gICAgICAgIH1cbiAgICAgICAgY29uZi51c2VGdWxsUGF0aCA9IGI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvLyByZW5kZXIuZmxhdCA9IGZ1bmN0aW9uIChib29sKSB7XG4gICAgLy8gXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAvLyBcdCAgICByZXR1cm4gY29uZi5mbGF0O1xuICAgIC8vIFx0fVxuICAgIC8vIFx0Y29uZi5mbGF0ID0gYm9vbDtcbiAgICAvLyBcdHJldHVybiB0aGlzO1xuICAgIC8vIH07XG5cbiAgICAvLyByZW5kZXIubm9kZSA9IHRyZWVfbm9kZTtcbiAgICAvL3JldHVybiByZW5kZXI7XG4gICAgcmV0dXJuIGQzLnJlYmluZCAocmVuZGVyLCBkaXNwYXRjaCwgXCJvblwiKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXc7XG4iXX0=
