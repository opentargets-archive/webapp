(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = bubblesView = require("./src/bubblesView.js");

},{"./src/bubblesView.js":11}],3:[function(require,module,exports){
module.exports = require("./src/node.js");

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
	//labelOffset : 10
    };

    var focus; // undef by default
    var highlight; // undef by default
    var view;
    var svg;
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
	// console.log("DATA FOR BUBBLES:");
	// console.log(conf.data.data());
	conf.divId = d3.select(div).attr("id");
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
	return render;
    };

    render.update = function () {
	
        // If we don't pass any data, return out of the element
        if (!conf.data) return;
	var packData = pack.nodes(conf.data.data());
	// console.log("DATA IN BUBBLES: ");
	// console.log(packData);

	// if (conf.flat){
	//     conf.data = conf.data.flatten();
	//     return pack.nodes(conf.data.data()).filter(function(d) { return !d.children; });
	// 		//return pack.nodes(conf.data.flatten().data()).filter(function(d) { return !d.children; });
        //             } else {
        //                 return pack.nodes(conf.data.data());
        //             }
	circle = svg.selectAll("circle")
	    // .data(packData, function (d) {
	    // 	return d[conf.key];
	// })
	    .data(packData)
            .enter()
	    .append("circle")
	    .attr("class", function (d) {
		return "bubblesView_" + d[conf.key] + "_" + conf.divId;
	    })
	    .classed("node", true)

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
	    // .data(packData, function (d) {
	    // 	return d._id;
	// })
	    .data(packData)
	    .enter()
	    .append("path")
	    .attr("id", function(d,i){return "s"+i;})
	    .attr("fill", "none");

	label = svg.selectAll("text")
	    // .data(packData, function (d) {
	    // 	return d._id;
	// })
	    .data(packData)
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
	    .attr("text-anchor", "middle")
	    .each(function (d, i) {
		if (d.children) {
		    d3.select(this)
			.append("textPath")
			.attr("xlink:href", function () {
			    return "#s"+i;
			})
			.attr("startOffset", "50%")
			.text(function () {
			    return d[conf.label] ? d[conf.label].substring(0, Math.PI*d.r/8) : "";
			});
		} else {
		    d3.select(this)
			.attr("dy", ".3em")
			.attr("x", function (d) { return d.x; })
			.attr("y", function (d) { return d.y; })
			.text(function (d) {
			    return d[conf.label].substring(0, d.r / 3);
			});
		}
	    });
	

	// Moving nodes
	circle
	    //.attr("class", "node")
	    .classed ("leaf", function (d) {
		return !d.children;
	    })
	    .classed ("root", function (d) {
		return !d._parent;
	    })
	    .transition()
	    .duration(conf.duration)
	    .attr("cx", function (d) { return d.x; })
	    .attr("cy", function (d) { return d.y; })
	    .attr("r", function (d) { return d.r; });
            // .attr("transform", function(d) {
	    // 	return "translate(" + d.x + "," + d.y + ")";
	    // });

	//	nodes.select("path")
	path
	    .attr("d", function (d) {
		return describeArc(d.x, d.y+10, d.r, 160, -160);
	    });
	
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


	var d = conf.data.data();
	view = [d.x, d.y, d.r*2];
	//focusTo([d.x, d.y, d.r*2]);
	render.focus (conf.data);
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
	    console.log("KEY: " + conf.key);
	    console.log(node.data());
	    console.log(node.property(conf.key));
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

    render.node = tree_node;
    
    return render;
};

bubblesView.node = tree_node;
module.exports = bubblesView;

},{"tnt.tree.node":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvZmFrZV9hNTk1NTY5ZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcmVkdWNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3V0aWxzLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL3NyYy9ub2RlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2J1YmJsZXNWaWV3L3NyYy9idWJibGVzVmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCIvLyBpZiAodHlwZW9mIGJ1YmJsZXNWaWV3ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldyA9IHt9XG4vLyB9XG4vLyBidWJibGVzVmlldy5idWJibGVzVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9idWJibGVzVmlldy5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXcgPSByZXF1aXJlKFwiLi9zcmMvYnViYmxlc1ZpZXcuanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9ub2RlLmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvYXBpLmpzXCIpO1xuIiwidmFyIGFwaSA9IGZ1bmN0aW9uICh3aG8pIHtcblxuICAgIHZhciBfbWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG0gPSBbXTtcblxuXHRtLmFkZF9iYXRjaCA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgIG0udW5zaGlmdChvYmopO1xuXHR9O1xuXG5cdG0udXBkYXRlID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdG1baV1bcF0gPSB2YWx1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdG0uYWRkID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGlmIChtLnVwZGF0ZSAobWV0aG9kLCB2YWx1ZSkgKSB7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciByZWcgPSB7fTtcblx0XHRyZWdbbWV0aG9kXSA9IHZhbHVlO1xuXHRcdG0uYWRkX2JhdGNoIChyZWcpO1xuXHQgICAgfVxuXHR9O1xuXG5cdG0uZ2V0ID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0cmV0dXJuIG1baV1bcF07XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH07XG5cblx0cmV0dXJuIG07XG4gICAgfTtcblxuICAgIHZhciBtZXRob2RzICAgID0gX21ldGhvZHMoKTtcbiAgICB2YXIgYXBpID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBhcGkuY2hlY2sgPSBmdW5jdGlvbiAobWV0aG9kLCBjaGVjaywgbXNnKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS5jaGVjayhtZXRob2RbaV0sIGNoZWNrLCBtc2cpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0uY2hlY2soY2hlY2ssIG1zZyk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChtZXRob2QsIGNiYWspIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLnRyYW5zZm9ybSAobWV0aG9kW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC50cmFuc2Zvcm0gKGNiYWspO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0udHJhbnNmb3JtKGNiYWspO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHZhciBhdHRhY2hfbWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCwgb3B0cykge1xuXHR2YXIgY2hlY2tzID0gW107XG5cdHZhciB0cmFuc2Zvcm1zID0gW107XG5cblx0dmFyIGdldHRlciA9IG9wdHMub25fZ2V0dGVyIHx8IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBtZXRob2RzLmdldChtZXRob2QpO1xuXHR9O1xuXG5cdHZhciBzZXR0ZXIgPSBvcHRzLm9uX3NldHRlciB8fCBmdW5jdGlvbiAoeCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYW5zZm9ybXMubGVuZ3RoOyBpKyspIHtcblx0XHR4ID0gdHJhbnNmb3Jtc1tpXSh4KTtcblx0ICAgIH1cblxuXHQgICAgZm9yICh2YXIgaj0wOyBqPGNoZWNrcy5sZW5ndGg7IGorKykge1xuXHRcdGlmICghY2hlY2tzW2pdLmNoZWNrKHgpKSB7XG5cdFx0ICAgIHZhciBtc2cgPSBjaGVja3Nbal0ubXNnIHx8IFxuXHRcdFx0KFwiVmFsdWUgXCIgKyB4ICsgXCIgZG9lc24ndCBzZWVtIHRvIGJlIHZhbGlkIGZvciB0aGlzIG1ldGhvZFwiKTtcblx0XHQgICAgdGhyb3cgKG1zZyk7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgbWV0aG9kcy5hZGQobWV0aG9kLCB4KTtcblx0fTtcblxuXHR2YXIgbmV3X21ldGhvZCA9IGZ1bmN0aW9uIChuZXdfdmFsKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gZ2V0dGVyKCk7XG5cdCAgICB9XG5cdCAgICBzZXR0ZXIobmV3X3ZhbCk7XG5cdCAgICByZXR1cm4gd2hvOyAvLyBSZXR1cm4gdGhpcz9cblx0fTtcblx0bmV3X21ldGhvZC5jaGVjayA9IGZ1bmN0aW9uIChjYmFrLCBtc2cpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBjaGVja3M7XG5cdCAgICB9XG5cdCAgICBjaGVja3MucHVzaCAoe2NoZWNrIDogY2Jhayxcblx0XHRcdCAgbXNnICAgOiBtc2d9KTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXHRuZXdfbWV0aG9kLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gdHJhbnNmb3Jtcztcblx0ICAgIH1cblx0ICAgIHRyYW5zZm9ybXMucHVzaChjYmFrKTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHdob1ttZXRob2RdID0gbmV3X21ldGhvZDtcbiAgICB9O1xuXG4gICAgdmFyIGdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgb3B0cykge1xuXHRpZiAodHlwZW9mIChwYXJhbSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtZXRob2RzLmFkZF9iYXRjaCAocGFyYW0pO1xuXHQgICAgZm9yICh2YXIgcCBpbiBwYXJhbSkge1xuXHRcdGF0dGFjaF9tZXRob2QgKHAsIG9wdHMpO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgbWV0aG9kcy5hZGQgKHBhcmFtLCBvcHRzLmRlZmF1bHRfdmFsdWUpO1xuXHQgICAgYXR0YWNoX21ldGhvZCAocGFyYW0sIG9wdHMpO1xuXHR9XG4gICAgfTtcblxuICAgIGFwaS5nZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmfSk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLmdldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9zZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgZ2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBzZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fc2V0dGVyIDogb25fc2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5zZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fZ2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIHNldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgZ2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX2dldHRlciA6IG9uX2dldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kID0gZnVuY3Rpb24gKG5hbWUsIGNiYWspIHtcblx0aWYgKHR5cGVvZiAobmFtZSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBmb3IgKHZhciBwIGluIG5hbWUpIHtcblx0XHR3aG9bcF0gPSBuYW1lW3BdO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgd2hvW25hbWVdID0gY2Jhaztcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXBpO1xuICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYXBpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiLy8gcmVxdWlyZSgnZnMnKS5yZWFkZGlyU3luYyhfX2Rpcm5hbWUgKyAnLycpLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuLy8gICAgIGlmIChmaWxlLm1hdGNoKC8uK1xcLmpzL2cpICE9PSBudWxsICYmIGZpbGUgIT09IF9fZmlsZW5hbWUpIHtcbi8vIFx0dmFyIG5hbWUgPSBmaWxlLnJlcGxhY2UoJy5qcycsICcnKTtcbi8vIFx0bW9kdWxlLmV4cG9ydHNbbmFtZV0gPSByZXF1aXJlKCcuLycgKyBmaWxlKTtcbi8vICAgICB9XG4vLyB9KTtcblxuLy8gU2FtZSBhc1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG51dGlscy5yZWR1Y2UgPSByZXF1aXJlKFwiLi9yZWR1Y2UuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB1dGlscztcbiIsInZhciByZWR1Y2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNtb290aCA9IDU7XG4gICAgdmFyIHZhbHVlID0gJ3ZhbCc7XG4gICAgdmFyIHJlZHVuZGFudCA9IGZ1bmN0aW9uIChhLCBiKSB7XG5cdGlmIChhIDwgYikge1xuXHQgICAgcmV0dXJuICgoYi1hKSA8PSAoYiAqIDAuMikpO1xuXHR9XG5cdHJldHVybiAoKGEtYikgPD0gKGEgKiAwLjIpKTtcbiAgICB9O1xuICAgIHZhciBwZXJmb3JtX3JlZHVjZSA9IGZ1bmN0aW9uIChhcnIpIHtyZXR1cm4gYXJyO307XG5cbiAgICB2YXIgcmVkdWNlID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoIWFyci5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBhcnI7XG5cdH1cblx0dmFyIHNtb290aGVkID0gcGVyZm9ybV9zbW9vdGgoYXJyKTtcblx0dmFyIHJlZHVjZWQgID0gcGVyZm9ybV9yZWR1Y2Uoc21vb3RoZWQpO1xuXHRyZXR1cm4gcmVkdWNlZDtcbiAgICB9O1xuXG4gICAgdmFyIG1lZGlhbiA9IGZ1bmN0aW9uICh2LCBhcnIpIHtcblx0YXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0ICAgIHJldHVybiBhW3ZhbHVlXSAtIGJbdmFsdWVdO1xuXHR9KTtcblx0aWYgKGFyci5sZW5ndGggJSAyKSB7XG5cdCAgICB2W3ZhbHVlXSA9IGFyclt+fihhcnIubGVuZ3RoIC8gMildW3ZhbHVlXTtcdCAgICBcblx0fSBlbHNlIHtcblx0ICAgIHZhciBuID0gfn4oYXJyLmxlbmd0aCAvIDIpIC0gMTtcblx0ICAgIHZbdmFsdWVdID0gKGFycltuXVt2YWx1ZV0gKyBhcnJbbisxXVt2YWx1ZV0pIC8gMjtcblx0fVxuXG5cdHJldHVybiB2O1xuICAgIH07XG5cbiAgICB2YXIgY2xvbmUgPSBmdW5jdGlvbiAoc291cmNlKSB7XG5cdHZhciB0YXJnZXQgPSB7fTtcblx0Zm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcblx0ICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcblx0XHR0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRhcmdldDtcbiAgICB9O1xuXG4gICAgdmFyIHBlcmZvcm1fc21vb3RoID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoc21vb3RoID09PSAwKSB7IC8vIG5vIHNtb290aFxuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoX2FyciA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbG93ID0gKGkgPCBzbW9vdGgpID8gMCA6IChpIC0gc21vb3RoKTtcblx0ICAgIHZhciBoaWdoID0gKGkgPiAoYXJyLmxlbmd0aCAtIHNtb290aCkpID8gYXJyLmxlbmd0aCA6IChpICsgc21vb3RoKTtcblx0ICAgIHNtb290aF9hcnJbaV0gPSBtZWRpYW4oY2xvbmUoYXJyW2ldKSwgYXJyLnNsaWNlKGxvdyxoaWdoKzEpKTtcblx0fVxuXHRyZXR1cm4gc21vb3RoX2FycjtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVjZXIgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBwZXJmb3JtX3JlZHVjZTtcblx0fVxuXHRwZXJmb3JtX3JlZHVjZSA9IGNiYWs7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS5yZWR1bmRhbnQgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiByZWR1bmRhbnQ7XG5cdH1cblx0cmVkdW5kYW50ID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YWx1ZSA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnNtb290aCA9IGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gc21vb3RoO1xuXHR9XG5cdHNtb290aCA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlZHVjZTtcbn07XG5cbnZhciBibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKClcblx0LnZhbHVlKCdzdGFydCcpO1xuXG4gICAgdmFyIHZhbHVlMiA9ICdlbmQnO1xuXG4gICAgdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ29iamVjdCcgOiB7XG4gICAgICAgICAgICAgICAgJ3N0YXJ0JyA6IG9iajEub2JqZWN0W3JlZC52YWx1ZSgpXSxcbiAgICAgICAgICAgICAgICAnZW5kJyAgIDogb2JqMlt2YWx1ZTJdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3ZhbHVlJyAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikgeyByZXR1cm4gb2JqMSB9O1xuXG4gICAgcmVkLnJlZHVjZXIoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IHtcblx0ICAgICdvYmplY3QnIDogYXJyWzBdLFxuXHQgICAgJ3ZhbHVlJyAgOiBhcnJbMF1bdmFsdWUyXVxuXHR9O1xuXHRmb3IgKHZhciBpPTE7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyLnZhbHVlKSkge1xuXHRcdGN1cnIgPSBqb2luKGN1cnIsIGFycltpXSk7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyLm9iamVjdCk7XG5cdCAgICBjdXJyLm9iamVjdCA9IGFycltpXTtcblx0ICAgIGN1cnIudmFsdWUgPSBhcnJbaV0uZW5kO1xuXHR9XG5cdHJlZHVjZWRfYXJyLnB1c2goY3Vyci5vYmplY3QpO1xuXG5cdC8vIHJlZHVjZWRfYXJyLnB1c2goYXJyW2Fyci5sZW5ndGgtMV0pO1xuXHRyZXR1cm4gcmVkdWNlZF9hcnI7XG4gICAgfSk7XG5cbiAgICByZWR1Y2Uuam9pbiA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGpvaW47XG5cdH1cblx0am9pbiA9IGNiYWs7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJlZHVjZS52YWx1ZTIgPSBmdW5jdGlvbiAoZmllbGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdmFsdWUyO1xuXHR9XG5cdHZhbHVlMiA9IGZpZWxkO1xuXHRyZXR1cm4gcmVkO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkO1xufTtcblxudmFyIGxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlZCA9IHJlZHVjZSgpO1xuXG4gICAgcmVkLnJlZHVjZXIgKCBmdW5jdGlvbiAoYXJyKSB7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciB2YWx1ZSA9IHJlZC52YWx1ZSgpO1xuXHR2YXIgcmVkdWNlZF9hcnIgPSBbXTtcblx0dmFyIGN1cnIgPSBhcnJbMF07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoLTE7IGkrKykge1xuXHQgICAgaWYgKHJlZHVuZGFudCAoYXJyW2ldW3ZhbHVlXSwgY3Vyclt2YWx1ZV0pKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyKTtcblx0ICAgIGN1cnIgPSBhcnJbaV07XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyKTtcblx0cmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJldHVybiByZWQ7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWNlO1xubW9kdWxlLmV4cG9ydHMubGluZSA9IGxpbmU7XG5tb2R1bGUuZXhwb3J0cy5ibG9jayA9IGJsb2NrO1xuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGl0ZXJhdG9yIDogZnVuY3Rpb24oaW5pdF92YWwpIHtcblx0dmFyIGkgPSBpbml0X3ZhbCB8fCAwO1xuXHR2YXIgaXRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBpKys7XG5cdH07XG5cdHJldHVybiBpdGVyO1xuICAgIH0sXG5cbiAgICBzY3JpcHRfcGF0aCA6IGZ1bmN0aW9uIChzY3JpcHRfbmFtZSkgeyAvLyBzY3JpcHRfbmFtZSBpcyB0aGUgZmlsZW5hbWVcblx0dmFyIHNjcmlwdF9zY2FwZWQgPSBzY3JpcHRfbmFtZS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcblx0dmFyIHNjcmlwdF9yZSA9IG5ldyBSZWdFeHAoc2NyaXB0X3NjYXBlZCArICckJyk7XG5cdHZhciBzY3JpcHRfcmVfc3ViID0gbmV3IFJlZ0V4cCgnKC4qKScgKyBzY3JpcHRfc2NhcGVkICsgJyQnKTtcblxuXHQvLyBUT0RPOiBUaGlzIHJlcXVpcmVzIHBoYW50b20uanMgb3IgYSBzaW1pbGFyIGhlYWRsZXNzIHdlYmtpdCB0byB3b3JrIChkb2N1bWVudClcblx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdHZhciBwYXRoID0gXCJcIjsgIC8vIERlZmF1bHQgdG8gY3VycmVudCBwYXRoXG5cdGlmKHNjcmlwdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKHZhciBpIGluIHNjcmlwdHMpIHtcblx0XHRpZihzY3JpcHRzW2ldLnNyYyAmJiBzY3JpcHRzW2ldLnNyYy5tYXRjaChzY3JpcHRfcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRzW2ldLnNyYy5yZXBsYWNlKHNjcmlwdF9yZV9zdWIsICckMScpO1xuXHRcdH1cbiAgICAgICAgICAgIH1cblx0fVxuXHRyZXR1cm4gcGF0aDtcbiAgICB9LFxuXG4gICAgZGVmZXJfY2FuY2VsIDogZnVuY3Rpb24gKGNiYWssIHRpbWUpIHtcblx0dmFyIHRpY2s7XG5cblx0dmFyIGRlZmVyX2NhbmNlbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIGNsZWFyVGltZW91dCh0aWNrKTtcblx0ICAgIHRpY2sgPSBzZXRUaW1lb3V0KGNiYWssIHRpbWUpO1xuXHR9O1xuXG5cdHJldHVybiBkZWZlcl9jYW5jZWw7XG4gICAgfVxufTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGl0ZXJhdG9yID0gcmVxdWlyZShcInRudC51dGlsc1wiKS5pdGVyYXRvcjtcblxudmFyIHRudF9ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbi8vdG50LnRyZWUubm9kZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChub2RlKTtcblxuICAgIC8vIEFQSVxuLy8gICAgIG5vZGUubm9kZXMgPSBmdW5jdGlvbigpIHtcbi8vIFx0aWYgKGNsdXN0ZXIgPT09IHVuZGVmaW5lZCkge1xuLy8gXHQgICAgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcbi8vIFx0ICAgIC8vIFRPRE86IGxlbmd0aCBhbmQgY2hpbGRyZW4gc2hvdWxkIGJlIGV4cG9zZWQgaW4gdGhlIEFQSVxuLy8gXHQgICAgLy8gaS5lLiB0aGUgdXNlciBzaG91bGQgYmUgYWJsZSB0byBjaGFuZ2UgdGhpcyBkZWZhdWx0cyB2aWEgdGhlIEFQSVxuLy8gXHQgICAgLy8gY2hpbGRyZW4gaXMgdGhlIGRlZmF1bHRzIGZvciBwYXJzZV9uZXdpY2ssIGJ1dCBtYXliZSB3ZSBzaG91bGQgY2hhbmdlIHRoYXRcbi8vIFx0ICAgIC8vIG9yIGF0IGxlYXN0IG5vdCBhc3N1bWUgdGhpcyBpcyBhbHdheXMgdGhlIGNhc2UgZm9yIHRoZSBkYXRhIHByb3ZpZGVkXG4vLyBcdFx0LnZhbHVlKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5sZW5ndGh9KVxuLy8gXHRcdC5jaGlsZHJlbihmdW5jdGlvbihkKSB7cmV0dXJuIGQuY2hpbGRyZW59KTtcbi8vIFx0fVxuLy8gXHRub2RlcyA9IGNsdXN0ZXIubm9kZXMoZGF0YSk7XG4vLyBcdHJldHVybiBub2Rlcztcbi8vICAgICB9O1xuXG4gICAgdmFyIGFwcGx5X3RvX2RhdGEgPSBmdW5jdGlvbiAoZGF0YSwgY2Jhaykge1xuXHRjYmFrKGRhdGEpO1xuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdGFwcGx5X3RvX2RhdGEoZGF0YS5jaGlsZHJlbltpXSwgY2Jhayk7XG5cdCAgICB9XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGNyZWF0ZV9pZHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBpID0gaXRlcmF0b3IoMSk7XG5cdC8vIFdlIGNhbid0IHVzZSBhcHBseSBiZWNhdXNlIGFwcGx5IGNyZWF0ZXMgbmV3IHRyZWVzIG9uIGV2ZXJ5IG5vZGVcblx0Ly8gV2Ugc2hvdWxkIHVzZSB0aGUgZGlyZWN0IGRhdGEgaW5zdGVhZFxuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgaWYgKGQuX2lkID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9pZCA9IGkoKTtcblx0XHQvLyBUT0RPOiBOb3Qgc3VyZSBfaW5TdWJUcmVlIGlzIHN0cmljdGx5IG5lY2Vzc2FyeVxuXHRcdC8vIGQuX2luU3ViVHJlZSA9IHtwcmV2OnRydWUsIGN1cnI6dHJ1ZX07XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICB2YXIgbGlua19wYXJlbnRzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0aWYgKGRhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgLy8gX3BhcmVudD9cblx0ICAgIGRhdGEuY2hpbGRyZW5baV0uX3BhcmVudCA9IGRhdGE7XG5cdCAgICBsaW5rX3BhcmVudHMoZGF0YS5jaGlsZHJlbltpXSk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGNvbXB1dGVfcm9vdF9kaXN0cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG5cdC8vIGNvbnNvbGUubG9nKGRhdGEpO1xuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgdmFyIGw7XG5cdCAgICBpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9yb290X2Rpc3QgPSAwO1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgbCA9IDA7XG5cdFx0aWYgKGQuYnJhbmNoX2xlbmd0aCkge1xuXHRcdCAgICBsID0gZC5icmFuY2hfbGVuZ3RoXG5cdFx0fVxuXHRcdGQuX3Jvb3RfZGlzdCA9IGwgKyBkLl9wYXJlbnQuX3Jvb3RfZGlzdDtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIFRPRE86IGRhdGEgY2FuJ3QgYmUgcmV3cml0dGVuIHVzZWQgdGhlIGFwaSB5ZXQuIFdlIG5lZWQgZmluYWxpemVyc1xuICAgIG5vZGUuZGF0YSA9IGZ1bmN0aW9uKG5ld19kYXRhKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGRhdGFcblx0fVxuXHRkYXRhID0gbmV3X2RhdGE7XG5cdGNyZWF0ZV9pZHMoKTtcblx0bGlua19wYXJlbnRzKGRhdGEpO1xuXHRjb21wdXRlX3Jvb3RfZGlzdHMoZGF0YSk7XG5cdHJldHVybiBub2RlO1xuICAgIH07XG4gICAgLy8gV2UgYmluZCB0aGUgZGF0YSB0aGF0IGhhcyBiZWVuIHBhc3NlZFxuICAgIG5vZGUuZGF0YShkYXRhKTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX2FsbCcsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikpIHtcblx0XHRub2Rlcy5wdXNoIChuKTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcbiAgICBcbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlJywgZnVuY3Rpb24gKGNiYWssIGRlZXApIHtcblx0aWYgKGNiYWsobm9kZSkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2pdKS5maW5kX25vZGUoY2Jhayk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cblxuXHRpZiAoZGVlcCAmJiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2ldKS5maW5kX25vZGUoY2Jhaylcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2pdKS5maW5kX25vZGUoY2Jhayk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX25vZGVfYnlfbmFtZScsIGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIG5vZGUuZmluZF9ub2RlIChmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgcmV0dXJuIG5vZGUubm9kZV9uYW1lKCkgPT09IG5hbWVcblx0fSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgndG9nZ2xlJywgZnVuY3Rpb24oKSB7XG5cdGlmIChkYXRhKSB7XG5cdCAgICBpZiAoZGF0YS5jaGlsZHJlbikgeyAvLyBVbmNvbGxhcHNlZCAtPiBjb2xsYXBzZVxuXHRcdHZhciBoaWRkZW4gPSAwO1xuXHRcdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdFx0ICAgIHZhciBoaWRkZW5faGVyZSA9IG4ubl9oaWRkZW4oKSB8fCAwO1xuXHRcdCAgICBoaWRkZW4gKz0gKG4ubl9oaWRkZW4oKSB8fCAwKSArIDE7XG5cdFx0fSk7XG5cdFx0bm9kZS5uX2hpZGRlbiAoaGlkZGVuLTEpO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gZGF0YS5jaGlsZHJlbjtcblx0XHRkYXRhLmNoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfSBlbHNlIHsgICAgICAgICAgICAgLy8gQ29sbGFwc2VkIC0+IHVuY29sbGFwc2Vcblx0XHRub2RlLm5faGlkZGVuKDApO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSBkYXRhLl9jaGlsZHJlbjtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBub2Rlcy5wdXNoKG4pO1xuXHR9KTtcblx0cmV0dXJuIG5vZGVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbGVhdmVzJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgbGVhdmVzID0gW107XG5cdG5vZGUuYXBwbHkoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChuLmlzX2xlYWYoKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcykge1xuICAgIFx0dmFyIG5vZGVfY291bnRzID0ge307XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBuID0gbm9kZXNbaV07XG5cdCAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0bi51cHN0cmVhbSAoZnVuY3Rpb24gKHRoaXNfbm9kZSl7XG5cdFx0ICAgIHZhciBpZCA9IHRoaXNfbm9kZS5pZCgpO1xuXHRcdCAgICBpZiAobm9kZV9jb3VudHNbaWRdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdG5vZGVfY291bnRzW2lkXSA9IDA7XG5cdFx0ICAgIH1cblx0XHQgICAgbm9kZV9jb3VudHNbaWRdKytcbiAgICBcdFx0fSk7XG5cdCAgICB9XG4gICAgXHR9XG4gICAgXG5cblx0dmFyIGlzX3NpbmdsZXRvbiA9IGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0ICAgIHZhciBuX2NoaWxkcmVuID0gMDtcblx0ICAgIGlmIChub2RlX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGk9MDsgaTxub2RlX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgaWQgPSBub2RlX2RhdGEuY2hpbGRyZW5baV0uX2lkO1xuXHRcdGlmIChub2RlX2NvdW50c1tpZF0gPiAwKSB7XG5cdFx0ICAgIG5fY2hpbGRyZW4rKztcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbl9jaGlsZHJlbiA9PT0gMTtcblx0fTtcblxuXHR2YXIgc3VidHJlZSA9IHt9O1xuXHRjb3B5X2RhdGEgKGRhdGEsIHN1YnRyZWUsIGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0ICAgIHZhciBub2RlX2lkID0gbm9kZV9kYXRhLl9pZDtcblx0ICAgIHZhciBjb3VudHMgPSBub2RlX2NvdW50c1tub2RlX2lkXTtcblxuXHQgICAgaWYgKGNvdW50cyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cbi8vIFx0ICAgIGlmICgobm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSAmJiAobm9kZS5jaGlsZHJlbi5sZW5ndGggPCAyKSkge1xuLy8gXHRcdHJldHVybiBmYWxzZTtcbi8vIFx0ICAgIH1cblx0ICAgIGlmICgoY291bnRzID4gMSkgJiYgKCFpc19zaW5nbGV0b24obm9kZV9kYXRhKSkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIGlmICgoY291bnRzID4gMCkgJiYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9KTtcblxuXHRyZXR1cm4gdG50X25vZGUoc3VidHJlZS5jaGlsZHJlblswXSk7XG4gICAgfSk7XG5cbiAgICB2YXIgY29weV9kYXRhID0gZnVuY3Rpb24gKG9yaWdfZGF0YSwgc3VidHJlZSwgY29uZGl0aW9uKSB7XG4gICAgICAgIGlmIChvcmlnX2RhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbihvcmlnX2RhdGEpKSB7XG5cdCAgICB2YXIgY29weSA9IGNvcHlfbm9kZShvcmlnX2RhdGEpO1xuXHQgICAgaWYgKHN1YnRyZWUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN1YnRyZWUuY2hpbGRyZW4gPSBbXTtcblx0ICAgIH1cblx0ICAgIHN1YnRyZWUuY2hpbGRyZW4ucHVzaChjb3B5KTtcblx0ICAgIGlmIChvcmlnX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZ19kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29weV9kYXRhIChvcmlnX2RhdGEuY2hpbGRyZW5baV0sIGNvcHksIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH0gZWxzZSB7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YShvcmlnX2RhdGEuY2hpbGRyZW5baV0sIHN1YnRyZWUsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGNvcHlfbm9kZSA9IGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0dmFyIGNvcHkgPSB7fTtcblx0Ly8gY29weSBhbGwgdGhlIG93biBwcm9wZXJ0aWVzIGV4Y2VwdHMgbGlua3MgdG8gb3RoZXIgbm9kZXMgb3IgZGVwdGhcblx0Zm9yICh2YXIgcGFyYW0gaW4gbm9kZV9kYXRhKSB7XG5cdCAgICBpZiAoKHBhcmFtID09PSBcImNoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9jaGlsZHJlblwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJfcGFyZW50XCIpIHx8XG5cdFx0KHBhcmFtID09PSBcImRlcHRoXCIpKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICBpZiAobm9kZV9kYXRhLmhhc093blByb3BlcnR5KHBhcmFtKSkge1xuXHRcdGNvcHlbcGFyYW1dID0gbm9kZV9kYXRhW3BhcmFtXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gY29weTtcbiAgICB9O1xuXG4gICAgXG4gICAgLy8gVE9ETzogVGhpcyBtZXRob2QgdmlzaXRzIGFsbCB0aGUgbm9kZXNcbiAgICAvLyBhIG1vcmUgcGVyZm9ybWFudCB2ZXJzaW9uIHNob3VsZCByZXR1cm4gdHJ1ZVxuICAgIC8vIHRoZSBmaXJzdCB0aW1lIGNiYWsobm9kZSkgaXMgdHJ1ZVxuICAgIGFwaS5tZXRob2QgKCdwcmVzZW50JywgZnVuY3Rpb24gKGNiYWspIHtcblx0Ly8gY2JhayBzaG91bGQgcmV0dXJuIHRydWUvZmFsc2Vcblx0dmFyIGlzX3RydWUgPSBmYWxzZTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pID09PSB0cnVlKSB7XG5cdFx0aXNfdHJ1ZSA9IHRydWU7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gaXNfdHJ1ZTtcbiAgICB9KTtcblxuICAgIC8vIGNiYWsgaXMgY2FsbGVkIHdpdGggdHdvIG5vZGVzXG4gICAgLy8gYW5kIHNob3VsZCByZXR1cm4gYSBuZWdhdGl2ZSBudW1iZXIsIDAgb3IgYSBwb3NpdGl2ZSBudW1iZXJcbiAgICBhcGkubWV0aG9kICgnc29ydCcsIGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXG5cdHZhciBuZXdfY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIG5ld19jaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0fVxuXG5cdG5ld19jaGlsZHJlbi5zb3J0KGNiYWspO1xuXG5cdGRhdGEuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPG5ld19jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgZGF0YS5jaGlsZHJlbi5wdXNoKG5ld19jaGlsZHJlbltpXS5kYXRhKCkpO1xuXHR9XG5cblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pLnNvcnQoY2Jhayk7XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmbGF0dGVuJywgZnVuY3Rpb24gKCkge1xuXHRpZiAobm9kZS5pc19sZWFmKCkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cdHZhciBkYXRhID0gbm9kZS5kYXRhKCk7XG5cdHZhciBuZXdyb290ID0gY29weV9ub2RlKGRhdGEpO1xuXHR2YXIgbGVhdmVzID0gbm9kZS5nZXRfYWxsX2xlYXZlcygpO1xuXHRuZXdyb290LmNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIG5ld3Jvb3QuY2hpbGRyZW4ucHVzaChjb3B5X25vZGUobGVhdmVzW2ldLmRhdGEoKSkpO1xuXHR9XG5cblx0cmV0dXJuIHRudF9ub2RlKG5ld3Jvb3QpO1xuICAgIH0pO1xuXG4gICAgXG4gICAgLy8gVE9ETzogVGhpcyBtZXRob2Qgb25seSAnYXBwbHkncyB0byBub24gY29sbGFwc2VkIG5vZGVzIChpZSAuX2NoaWxkcmVuIGlzIG5vdCB2aXNpdGVkKVxuICAgIC8vIFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIGFuIGV4dHJhIGZsYWcgKHRydWUvZmFsc2UpIHRvIHZpc2l0IGFsc28gY29sbGFwc2VkIG5vZGVzP1xuICAgIGFwaS5tZXRob2QgKCdhcHBseScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cdHJldHVybiBjaGlsZHJlbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gdG50X25vZGUoZGF0YS5fcGFyZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBub2RlO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfbm9kZTtcblxuIiwidmFyIHRyZWVfbm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuXG52YXIgYnViYmxlc1ZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgXG4gICAgdmFyIGNvbmYgPSB7XG5cdGRpYW1ldGVyIDogNjAwLFxuXHRmb3JtYXQgOiBkMy5mb3JtYXQoXCIsZFwiKSxcblx0Y29sb3IgOiBkMy5zY2FsZS5jYXRlZ29yeTIwYygpLFxuXHRjb2xvclBhbGV0dGUgOiB0cnVlLFxuXHRkYXRhIDogdW5kZWZpbmVkLFxuXHR2YWx1ZSA6IFwidmFsdWVcIixcblx0a2V5IDogXCJuYW1lXCIsXG5cdGxhYmVsOiBcIm5hbWVcIixcblx0ZGl2SWQgOiB1bmRlZmluZWQsXG5cdG9uY2xpY2sgOiBmdW5jdGlvbiAoKSB7fSxcblx0ZHVyYXRpb246IDEwMDAsXG5cdC8vbGFiZWxPZmZzZXQgOiAxMFxuICAgIH07XG5cbiAgICB2YXIgZm9jdXM7IC8vIHVuZGVmIGJ5IGRlZmF1bHRcbiAgICB2YXIgaGlnaGxpZ2h0OyAvLyB1bmRlZiBieSBkZWZhdWx0XG4gICAgdmFyIHZpZXc7XG4gICAgdmFyIHN2ZztcbiAgICB2YXIgcGFjaztcbiAgICB2YXIgbm9kZXM7XG4gICAgdmFyIGNpcmNsZTtcbiAgICB2YXIgbGFiZWw7XG4gICAgdmFyIHBhdGg7XG5cbiAgICB2YXIgY3VyclRyYW5zbGF0ZSA9IFswLDBdO1xuICAgIHZhciBjdXJyU2NhbGUgPSAxO1xuICAgIC8vIHZhciB6b29tID0gZDMuYmVoYXZpb3Iuem9vbSgpXG4gICAgLy8gXHQuc2NhbGVFeHRlbnQoWzAuOCwgSW5maW5pdHldKVxuICAgIC8vIFx0Lm9uKFwiem9vbVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gXHQgICAgcmVkcmF3KHN2Zyk7XG4gICAgLy8gXHR9KTtcbiAgICBcbiAgICAvKlxuICAgICAqIFJlbmRlciB2YWxpZCBKU09OIGRhdGFcbiAgICAgKi8gXG4gICAgdmFyIHJlbmRlciA9IGZ1bmN0aW9uKGRpdikge1xuXHQvLyBjb25zb2xlLmxvZyhcIkRBVEEgRk9SIEJVQkJMRVM6XCIpO1xuXHQvLyBjb25zb2xlLmxvZyhjb25mLmRhdGEuZGF0YSgpKTtcblx0Y29uZi5kaXZJZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblx0c3ZnID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJzdmdcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2X2J1YmJsZXNWaWV3XCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYuZGlhbWV0ZXIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmRpYW1ldGVyKVxuXHQgICAgLmFwcGVuZChcImdcIik7XG5cblx0cGFjayA9IGQzLmxheW91dC5wYWNrKClcblx0ICAgIC52YWx1ZShmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkW2NvbmYudmFsdWVdO1xuXHQgICAgfSlcbiAgICAgICAgICAgIC5zb3J0KG51bGwpXG4gICAgICAgICAgICAuc2l6ZShbY29uZi5kaWFtZXRlciwgY29uZi5kaWFtZXRlcl0pXG4gICAgICAgICAgICAucGFkZGluZygxLjUpO1xuXG5cdHJlbmRlci51cGRhdGUoKTtcblx0cmV0dXJuIHJlbmRlcjtcbiAgICB9O1xuXG4gICAgcmVuZGVyLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XG4gICAgICAgIC8vIElmIHdlIGRvbid0IHBhc3MgYW55IGRhdGEsIHJldHVybiBvdXQgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgaWYgKCFjb25mLmRhdGEpIHJldHVybjtcblx0dmFyIHBhY2tEYXRhID0gcGFjay5ub2Rlcyhjb25mLmRhdGEuZGF0YSgpKTtcblx0Ly8gY29uc29sZS5sb2coXCJEQVRBIElOIEJVQkJMRVM6IFwiKTtcblx0Ly8gY29uc29sZS5sb2cocGFja0RhdGEpO1xuXG5cdC8vIGlmIChjb25mLmZsYXQpe1xuXHQvLyAgICAgY29uZi5kYXRhID0gY29uZi5kYXRhLmZsYXR0ZW4oKTtcblx0Ly8gICAgIHJldHVybiBwYWNrLm5vZGVzKGNvbmYuZGF0YS5kYXRhKCkpLmZpbHRlcihmdW5jdGlvbihkKSB7IHJldHVybiAhZC5jaGlsZHJlbjsgfSk7XG5cdC8vIFx0XHQvL3JldHVybiBwYWNrLm5vZGVzKGNvbmYuZGF0YS5mbGF0dGVuKCkuZGF0YSgpKS5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gIWQuY2hpbGRyZW47IH0pO1xuICAgICAgICAvLyAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgcmV0dXJuIHBhY2subm9kZXMoY29uZi5kYXRhLmRhdGEoKSk7XG4gICAgICAgIC8vICAgICAgICAgICAgIH1cblx0Y2lyY2xlID0gc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuXHQgICAgLy8gLmRhdGEocGFja0RhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICAvLyBcdHJldHVybiBkW2NvbmYua2V5XTtcblx0Ly8gfSlcblx0ICAgIC5kYXRhKHBhY2tEYXRhKVxuICAgICAgICAgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gXCJidWJibGVzVmlld19cIiArIGRbY29uZi5rZXldICsgXCJfXCIgKyBjb25mLmRpdklkO1xuXHQgICAgfSlcblx0ICAgIC5jbGFzc2VkKFwibm9kZVwiLCB0cnVlKVxuXG5cdCAgICAub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcblx0XHQgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRkMy5ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0ICAgIH0pXG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkMy5ldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0Y29uZi5vbmNsaWNrLmNhbGwodGhpcywgdHJlZV9ub2RlKGQpKTtcblx0ICAgIH0pO1xuXG5cdC8vIC8vIHRpdGxlc1xuXHQvLyBzdmcuc2VsZWN0QWxsKFwidGl0bGVcIilcblx0Ly8gICAgIC5kYXRhKHBhY2tEYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQvLyBcdHJldHVybiBkLl9pZDtcblx0Ly8gICAgIH0pXG5cdC8vICAgICAuZW50ZXIoKVxuXHQvLyAgICAgLmFwcGVuZChcInRpdGxlXCIpXG4gICAgICAgIC8vICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkW2NvbmYua2V5XSArIFwiOiBcIiArIGNvbmYuZm9ybWF0KGRbY29uZi52YWx1ZV0pOyB9KTtcdFxuXHRcbiAgICAgICAgLy9uZXdOb2Rlcy5hcHBlbmQgKFwiY2lyY2xlXCIpO1xuXG4gICAgICAgIC8vbmV3Tm9kZXMuYXBwZW5kKFwidGV4dFwiKTtcblxuXHRwYXRoID0gc3ZnLnNlbGVjdEFsbChcInBhdGhcIilcblx0ICAgIC8vIC5kYXRhKHBhY2tEYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgLy8gXHRyZXR1cm4gZC5faWQ7XG5cdC8vIH0pXG5cdCAgICAuZGF0YShwYWNrRGF0YSlcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkLGkpe3JldHVybiBcInNcIitpO30pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cdGxhYmVsID0gc3ZnLnNlbGVjdEFsbChcInRleHRcIilcblx0ICAgIC8vIC5kYXRhKHBhY2tEYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgLy8gXHRyZXR1cm4gZC5faWQ7XG5cdC8vIH0pXG5cdCAgICAuZGF0YShwYWNrRGF0YSlcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmNoaWxkcmVuKSByZXR1cm4gXCJ0b3BMYWJlbFwiO1xuXHRcdHJldHVybiBcImxlYWZMYWJlbFwiO1xuXHQgICAgfSlcblx0ICAgIC5zdHlsZShcImN1cnNvclwiLCBcImRlZmF1bHRcIilcblx0ICAgIC5hdHRyKFwicG9pbnRlci1ldmVudHNcIiwgZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC5jaGlsZHJlbiA/IFwiYXV0b1wiIDogXCJub25lXCJ9KVxuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHsgLy8gb25seSBvbiB0aG9zZSB3aXRoIHBvaW50ZXItZXZlbnRzIFwiYXV0b1wiIGllLCBvbiB0aGVyYXBldXRpYyBhcmVhcyBsYWJlbHNcblx0XHRpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGNvbmYub25jbGljay5jYWxsKHRoaXMsIHRyZWVfbm9kZShkKSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwibmF2eVwiKVxuXHQgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMTApXG5cdCAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCwgaSkge1xuXHRcdGlmIChkLmNoaWxkcmVuKSB7XG5cdFx0ICAgIGQzLnNlbGVjdCh0aGlzKVxuXHRcdFx0LmFwcGVuZChcInRleHRQYXRoXCIpXG5cdFx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAgIHJldHVybiBcIiNzXCIraTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInN0YXJ0T2Zmc2V0XCIsIFwiNTAlXCIpXG5cdFx0XHQudGV4dChmdW5jdGlvbiAoKSB7XG5cdFx0XHQgICAgcmV0dXJuIGRbY29uZi5sYWJlbF0gPyBkW2NvbmYubGFiZWxdLnN1YnN0cmluZygwLCBNYXRoLlBJKmQuci84KSA6IFwiXCI7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcylcblx0XHRcdC5hdHRyKFwiZHlcIiwgXCIuM2VtXCIpXG5cdFx0XHQuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQueDsgfSlcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC55OyB9KVxuXHRcdFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgZC5yIC8gMyk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdCAgICB9KTtcblx0XG5cblx0Ly8gTW92aW5nIG5vZGVzXG5cdGNpcmNsZVxuXHQgICAgLy8uYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuXHQgICAgLmNsYXNzZWQgKFwibGVhZlwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAhZC5jaGlsZHJlbjtcblx0ICAgIH0pXG5cdCAgICAuY2xhc3NlZCAoXCJyb290XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuICFkLl9wYXJlbnQ7XG5cdCAgICB9KVxuXHQgICAgLnRyYW5zaXRpb24oKVxuXHQgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdCAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLng7IH0pXG5cdCAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7IHJldHVybiBkLnk7IH0pXG5cdCAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQucjsgfSk7XG4gICAgICAgICAgICAvLyAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG5cdCAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XG5cdCAgICAvLyB9KTtcblxuXHQvL1x0bm9kZXMuc2VsZWN0KFwicGF0aFwiKVxuXHRwYXRoXG5cdCAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZGVzY3JpYmVBcmMoZC54LCBkLnkrMTAsIGQuciwgMTYwLCAtMTYwKTtcblx0ICAgIH0pO1xuXHRcblx0Ly9ub2Rlcy5zZWxlY3QoXCJ0ZXh0XCIpXG5cblx0XG4gICAgICAgIC8vIG5vZGVzLnNlbGVjdChcImNpcmNsZVwiKVxuXHQvLyAgICAgLmF0dHIgKFwiY2xhc3NcIiwgZnVuY3Rpb24gKGQpIHtcblx0Ly8gICAgIFx0cmV0dXJuIFwiYnViYmxlc1ZpZXdfXCIgKyBkW2NvbmYua2V5XSArIFwiX1wiICsgY29uZi5kaXZJZDtcblx0Ly8gICAgIH0pXG5cdC8vICAgICAudHJhbnNpdGlvbigpXG5cdC8vICAgICAuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0Ly8gICAgIC5hdHRyIChcInJcIiwgZnVuY3Rpb24oZCkge1xuXHQvLyBcdC8vcmV0dXJuIGQuciAtIChkLmNoaWxkcmVuID8gMCA6IGNvbmYubGFiZWxPZmZzZXQpO1xuXHQvLyBcdHJldHVybiBkLnI7XG5cdC8vICAgICB9KTtcblx0XG5cdC8vY2lyY2xlID0gbm9kZXMuc2VsZWN0QWxsKFwiY2lyY2xlXCIpO1xuXG5cdC8vIEV4aXRpbmcgbm9kZXNcblx0Ly8gbm9kZXNcblx0Ly8gICAgIC5leGl0KClcblx0Ly8gICAgIC5yZW1vdmUoKTtcblxuXG5cdHZhciBkID0gY29uZi5kYXRhLmRhdGEoKTtcblx0dmlldyA9IFtkLngsIGQueSwgZC5yKjJdO1xuXHQvL2ZvY3VzVG8oW2QueCwgZC55LCBkLnIqMl0pO1xuXHRyZW5kZXIuZm9jdXMgKGNvbmYuZGF0YSk7XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEF1eGlsaWFyIGZ1bmN0aW9ucyAvL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgZnVuY3Rpb24gcG9sYXJUb0NhcnRlc2lhbihjZW50ZXJYLCBjZW50ZXJZLCByYWRpdXMsIGFuZ2xlSW5EZWdyZWVzKSB7XG5cdHZhciBhbmdsZUluUmFkaWFucyA9IChhbmdsZUluRGVncmVlcy05MCkgKiBNYXRoLlBJIC8gMTgwLjA7XG5cdHJldHVybiB7XG5cdCAgICB4OiBjZW50ZXJYICsgKHJhZGl1cyAqIE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKSksXG5cdCAgICB5OiBjZW50ZXJZICsgKHJhZGl1cyAqIE1hdGguc2luKGFuZ2xlSW5SYWRpYW5zKSlcblx0fTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNjcmliZUFyYyh4LCB5LCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKXtcblx0dmFyIHN0YXJ0ID0gcG9sYXJUb0NhcnRlc2lhbih4LCB5LCByYWRpdXMsIGVuZEFuZ2xlKTtcblx0dmFyIGVuZCA9IHBvbGFyVG9DYXJ0ZXNpYW4oeCwgeSwgcmFkaXVzLCBzdGFydEFuZ2xlKTtcblx0dmFyIGFyY1N3ZWVwID0gZW5kQW5nbGUgLSBzdGFydEFuZ2xlIDw9IDE4MCA/IFwiMFwiIDogXCIxXCI7XG5cdHZhciBkID0gW1xuXHQgICAgXCJNXCIsIHN0YXJ0LngsIHN0YXJ0LnksXG5cdCAgICBcIkFcIiwgcmFkaXVzLCByYWRpdXMsIDAsIDEsIDEsIGVuZC54LCBlbmQueVxuXHRdLmpvaW4oXCIgXCIpO1xuXHRyZXR1cm4gZDtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gcmVkcmF3ICh2aXopIHtcblx0dml6LmF0dHIgKFwidHJhbnNmb3JtXCIsXG5cdFx0ICAgXCJ0cmFuc2xhdGUgKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpIFwiICtcblx0XHQgIFwic2NhbGUgKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIGZvY3VzVG8gKHYpIHtcblx0dmFyIGsgPSBjb25mLmRpYW1ldGVyIC8gdlsyXTtcblx0dmFyIG9mZnNldCA9IGNvbmYuZGlhbWV0ZXIgLyAyO1xuXHR2aWV3ID0gdjtcblxuXHRjaXJjbGVcblx0ICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuICgoZC54IC0gdlswXSkqaykrb2Zmc2V0OyB9KVxuXHQgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gKChkLnkgLSB2WzFdKSprKStvZmZzZXQ7IH0pXG5cdCAgICAvLyAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG5cdCAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZShcIiArICgoKGQueCAtIHZbMF0pICogaykgKyBvZmZzZXQpICsgXCIsXCIgKyAoKChkLnkgLSB2WzFdKSAqIGspICsgb2Zmc2V0KSArIFwiKVwiO1xuXHQgICAgLy8gfSk7XG5cdCAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCkge1xuXHRcdHJldHVybiBkLnIgKiBrO1xuXHQgICAgfSk7XG5cblx0cGF0aFxuXHQgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGRlc2NyaWJlQXJjKCgoZC54LXZbMF0pKmspK29mZnNldCwgKChkLnktdlsxXSkqaykrMTArb2Zmc2V0LCBkLnIqaywgMTYwLCAtMTYwKTtcblx0ICAgIH0pO1xuXG5cdGxhYmVsXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCwgaSkge1xuXHRcdGlmIChkLmNoaWxkcmVuKSB7XG5cdFx0ICAgIGQzLnNlbGVjdCh0aGlzKVxuXHRcdFx0LnNlbGVjdChcIipcIilcblx0XHRcdC5yZW1vdmUoKTtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIFx0LmFwcGVuZChcInRleHRQYXRoXCIpXG5cdFx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAgIHJldHVybiBcIiNzXCIraTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInN0YXJ0T2Zmc2V0XCIsIFwiNTAlXCIpXG5cdFx0XHQudGV4dChmdW5jdGlvbiAoKSB7XG5cdFx0XHQgICAgcmV0dXJuIGRbY29uZi5sYWJlbF0gPyBkW2NvbmYubGFiZWxdLnN1YnN0cmluZygwLCBNYXRoLlBJKmQuciprLzgpIDogXCJcIjtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIGQzLnNlbGVjdCh0aGlzKVxuXHRcdCAgICBcdC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkgeyByZXR1cm4gKChkLnggLSB2WzBdKSprKStvZmZzZXQ7IH0pXG5cdFx0XHQuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHsgcmV0dXJuICgoZC55IC0gdlsxXSkqaykrb2Zmc2V0OyB9KVxuXHRcdFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdCAgICByZXR1cm4gZFtjb25mLmxhYmVsXS5zdWJzdHJpbmcoMCwgZC5yKmsgLyAzKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0ICAgIH0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy9cbiAgICAvLyBBUEkgIC8vXG4gICAgLy8vLy8vLy8vL1xuXG4gICAgcmVuZGVyLnNlbGVjdCA9IGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBoaWdobGlnaHQ7XG5cdH1cblx0aGlnaGxpZ2h0ID0gbm9kZXM7XG5cblx0Ly8gVW5oaWdobGlnaHQgZXZlcnl0aGluZ1xuXHRkMy5zZWxlY3RBbGwoXCIuaGlnaGxpZ2h0XCIpXG5cdCAgICAuY2xhc3NlZChcImhpZ2hsaWdodFwiLCBmYWxzZSk7XG5cblx0Ly8gTm8gbm9kZSB0byBoaWdobGlnaHRcblx0aWYgKChub2RlcyA9PT0gbnVsbCkgfHwgKG5vZGVzID09PSB1bmRlZmluZWQpIHx8IChub2Rlcy5sZW5ndGggPT09IDApKSB7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fVxuXG5cdGZvciAodmFyIGk9MDsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIG5vZGUgPSBub2Rlc1tpXTtcblx0ICAgIGNvbnNvbGUubG9nKFwiS0VZOiBcIiArIGNvbmYua2V5KTtcblx0ICAgIGNvbnNvbGUubG9nKG5vZGUuZGF0YSgpKTtcblx0ICAgIGNvbnNvbGUubG9nKG5vZGUucHJvcGVydHkoY29uZi5rZXkpKTtcblx0ICAgIHZhciBjaXJjbGUgPSBkMy5zZWxlY3RBbGwoXCIuYnViYmxlc1ZpZXdfXCIgKyBub2RlLnByb3BlcnR5KGNvbmYua2V5KSArIFwiX1wiICsgY29uZi5kaXZJZCk7XG5cdCAgICBjaXJjbGVcblx0XHQuY2xhc3NlZCAoXCJoaWdobGlnaHRcIiwgdHJ1ZSk7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZW5kZXIuZm9jdXMgPSBmdW5jdGlvbiAobm9kZSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBmb2N1cztcblx0fVxuXHRmb2N1cyA9IG5vZGU7XG5cdHZhciBmb2N1c0RhdGEgPSBmb2N1cy5kYXRhKCk7XG5cdHZhciB0cmFuc2l0aW9uID0gZDMudHJhbnNpdGlvbigpXG5cdCAgICAuZHVyYXRpb24gKGNvbmYuZHVyYXRpb24pXG5cdCAgICAudHdlZW4gKFwiem9vbVwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGkgPSBkMy5pbnRlcnBvbGF0ZVpvb20gKHZpZXcsIFtmb2N1c0RhdGEueCwgZm9jdXNEYXRhLnksIGZvY3VzRGF0YS5yKjJdKTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHQpIHtcblx0XHQgICAgZm9jdXNUbyhpKHQpKTtcblx0XHR9O1xuXHQgICAgfSk7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLmRhdGEgPSBmdW5jdGlvbiAobmV3RGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLmRhdGE7XG5cdH1cblx0Y29uZi5kYXRhID0gbmV3RGF0YTtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5vbmNsaWNrID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5vbmNsaWNrO1xuXHR9XG5cdGNvbmYub25jbGljayA9IGNiYWs7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLmtleSA9IGZ1bmN0aW9uIChuKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYua2V5O1xuXHR9XG5cdGNvbmYua2V5ID0gbjtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5sYWJlbCA9IGZ1bmN0aW9uIChuKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYubGFiZWw7XG5cdH1cblx0Y29uZi5sYWJlbCA9IG47XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIudmFsdWUgPSBmdW5jdGlvbiAodikge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLnZhbHVlO1xuXHR9XG5cdGNvbmYudmFsdWUgPSB2O1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLmRpYW1ldGVyID0gZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5kaWFtZXRlcjtcblx0fVxuXHRjb25mLmRpYW1ldGVyID0gZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vIHJlbmRlci5mbGF0ID0gZnVuY3Rpb24gKGJvb2wpIHtcbiAgICAvLyBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIC8vIFx0ICAgIHJldHVybiBjb25mLmZsYXQ7XG4gICAgLy8gXHR9XG4gICAgLy8gXHRjb25mLmZsYXQgPSBib29sO1xuICAgIC8vIFx0cmV0dXJuIHRoaXM7XG4gICAgLy8gfTtcblxuICAgIHJlbmRlci5ub2RlID0gdHJlZV9ub2RlO1xuICAgIFxuICAgIHJldHVybiByZW5kZXI7XG59O1xuXG5idWJibGVzVmlldy5ub2RlID0gdHJlZV9ub2RlO1xubW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldztcbiJdfQ==
