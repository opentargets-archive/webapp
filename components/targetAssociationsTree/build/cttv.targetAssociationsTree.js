(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = geneAssociationsTree = require("./src/targetAssociationsTree.js");

},{"./src/targetAssociationsTree.js":29}],3:[function(require,module,exports){
module.exports = tooltip = require("./src/tooltip.js");

},{"./src/tooltip.js":6}],4:[function(require,module,exports){
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
var apijs = require("tnt.api");

var tooltip = function () {
    "use strict";

    var drag = d3.behavior.drag();
    var tooltip_div;

    var conf = {
	position : "right",
	allow_drag : true,
	show_closer : true,
	fill : function () { throw "fill is not defined in the base object"; },
	width : 180,
	id : 1
    };

    var t = function (data, event) {
	drag
	    .origin(function(){
		return {x:parseInt(d3.select(this).style("left")),
			y:parseInt(d3.select(this).style("top"))
		       };
	    })
	    .on("drag", function() {
		if (conf.allow_drag) {
		    d3.select(this)
			.style("left", d3.event.x + "px")
			.style("top", d3.event.y + "px");
		}
	    });

	// TODO: Why do we need the div element?
	// It looks like if we anchor the tooltip in the "body"
	// The tooltip is not located in the right place (appears at the bottom)
	// See clients/tooltips_test.html for an example
	var containerElem = selectAncestor (this, "div");
	if (containerElem === undefined) {
	    // We require a div element at some point to anchor the tooltip
	    return;
	}

	tooltip_div = d3.select(containerElem)
	    .append("div")
	    .attr("class", "tnt_tooltip")
	    .classed("tnt_tooltip_active", true)  // TODO: Is this needed/used???
	    .call(drag);

	// prev tooltips with the same header
	d3.select("#tnt_tooltip_" + conf.id).remove();

	if ((d3.event === null) && (event)) {
	    d3.event = event;
	}
	var d3mouse = d3.mouse(containerElem);
	d3.event = null;

	var offset = 0;
	if (conf.position === "left") {
	    offset = conf.width;
	}

	tooltip_div.attr("id", "tnt_tooltip_" + conf.id);

	// We place the tooltip
	tooltip_div
	    .style("left", (d3mouse[0]) + "px")
	    .style("top", (d3mouse[1]) + "px");

	// Close
    if (conf.show_closer) {
        tooltip_div
            .append("div")
            .attr("class", "tnt_tooltip_closer")
            .on ("click", function () {
                t.close();
            })
    }

	conf.fill.call(tooltip_div, data);

	// return this here?
	return t;
    };

    // gets the first ancestor of elem having tagname "type"
    // example : var mydiv = selectAncestor(myelem, "div");
    function selectAncestor (elem, type) {
	type = type.toLowerCase();
	if (elem.parentNode === null) {
	    console.log("No more parents");
	    return undefined;
	}
	var tagName = elem.parentNode.tagName;

	if ((tagName !== undefined) && (tagName.toLowerCase() === type)) {
	    return elem.parentNode;
	} else {
	    return selectAncestor (elem.parentNode, type);
	}
    }

    var api = apijs(t)
	.getset(conf);
    api.check('position', function (val) {
	return (val === 'left') || (val === 'right');
    }, "Only 'left' or 'right' values are allowed for position");

    api.method('close', function () {
        if (tooltip_div) {
            tooltip_div.remove();
        }
    });

    return t;
};

tooltip.list = function () {
    // list tooltip is based on general tooltips
    var t = tooltip();
    var width = 180;

    t.fill (function (obj) {
	var tooltip_div = this;
	var obj_info_list = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

	// Tooltip header
    if (obj.header) {
        obj_info_list
	       .append("tr")
	       .attr("class", "tnt_zmenu_header")
           .append("th")
           .text(obj.header);
    }

	// Tooltip rows
	var table_rows = obj_info_list.selectAll(".tnt_zmenu_row")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "tnt_zmenu_row");

	table_rows
	    .append("td")
	    .style("text-align", "center")
	    .html(function(d,i) {
		return obj.rows[i].value;
	    })
	    .each(function (d) {
		if (d.link === undefined) {
		    return;
		}
		d3.select(this)
		    .classed("link", 1)
		    .on('click', function (d) {
			d.link(d.obj);
			t.close.call(this);
		    });
	    });
    });
    return t;
};

tooltip.table = function () {
    // table tooltips are based on general tooltips
    var t = tooltip();

    var width = 180;

    t.fill (function (obj) {
	var tooltip_div = this;

	var obj_info_table = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

	// Tooltip header
    if (obj.header) {
        obj_info_table
            .append("tr")
            .attr("class", "tnt_zmenu_header")
            .append("th")
            .attr("colspan", 2)
            .text(obj.header);
    }

	// Tooltip rows
	var table_rows = obj_info_table.selectAll(".tnt_zmenu_row")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "tnt_zmenu_row");

	table_rows
	    .append("th")
	    .attr("colspan", function (d, i) {
		if (d.value === "") {
		    return 2;
		}
		return 1;
	    })
	    .attr("class", function (d) {
		if (d.value === "") {
		    return "tnt_zmenu_inner_header";
		}
		return "tnt_zmenu_cell";
	    })
	    .html(function(d,i) {
		return obj.rows[i].label;
	    });

	table_rows
	    .append("td")
	    .html(function(d,i) {
		if (typeof obj.rows[i].value === 'function') {
		    obj.rows[i].value.call(this, d);
		} else {
		    return obj.rows[i].value;
		}
	    })
	    .each(function (d) {
		if (d.value === "") {
		    d3.select(this).remove();
		}
	    })
	    .each(function (d) {
		if (d.link === undefined) {
		    return;
		}
		d3.select(this)
		    .classed("link", 1)
		    .on('click', function (d) {
			d.link(d.obj);
			t.close.call(this);
		    });
	    });
    });

    return t;
};

tooltip.plain = function () {
    // plain tooltips are based on general tooltips
    var t = tooltip();

    t.fill (function (obj) {
	var tooltip_div = this;

	var obj_info_table = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

    if (obj.header) {
        obj_info_table
            .append("tr")
            .attr("class", "tnt_zmenu_header")
            .append("th")
            .text(obj.header);
    }

    if (obj.body) {
        obj_info_table
            .append("tr")
            .attr("class", "tnt_zmenu_row")
            .append("td")
            .style("text-align", "center")
            .html(obj.body);
    }
    });

    return t;
};

module.exports = exports = tooltip;

},{"tnt.api":4}],7:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
module.exports = tree = require("./src/index.js");
var eventsystem = require("biojs-events");
eventsystem.mixin(tree);
//tnt.utils = require("tnt.utils");
//tnt.tooltip = require("tnt.tooltip");
//tnt.tree = require("./src/index.js");


},{"./src/index.js":20,"biojs-events":8}],8:[function(require,module,exports){
var events = require("backbone-events-standalone");

events.onAll = function(callback,context){
  this.on("all", callback,context);
  return this;
};

// Mixin utility
events.oldMixin = events.mixin;
events.mixin = function(proto) {
  events.oldMixin(proto);
  // add custom onAll
  var exports = ['onAll'];
  for(var i=0; i < exports.length;i++){
    var name = exports[i];
    proto[name] = this[name];
  }
  return proto;
};

module.exports = events;

},{"backbone-events-standalone":10}],9:[function(require,module,exports){
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {
  var root = this,
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {
    return {
      keys: Object.keys || function (obj) {
        if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
          throw new TypeError("keys() called on a non-object");
        }
        var key, keys = [];
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys[keys.length] = key;
          }
        }
        return keys;
      },

      uniqueId: function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            iterator.call(context, obj[i], i, obj);
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              iterator.call(context, obj[key], key, obj);
            }
          }
        }
      },

      once: function(func) {
        var ran = false, memo;
        return function() {
          if (ran) return memo;
          ran = true;
          memo = func.apply(this, arguments);
          func = null;
          return memo;
        };
      }
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  }else if (typeof define === "function"  && typeof define.amd == "object") {
    define(function() {
      return Events;
    });
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],10:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":9}],11:[function(require,module,exports){
module.exports=require(4)
},{"./src/api.js":12}],12:[function(require,module,exports){
module.exports=require(5)
},{}],13:[function(require,module,exports){
var node = require("./src/node.js");
module.exports = exports = node;

},{"./src/node.js":18}],14:[function(require,module,exports){
module.exports = require("./src/index.js");

},{"./src/index.js":15}],15:[function(require,module,exports){
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

},{"./reduce.js":16,"./utils.js":17}],16:[function(require,module,exports){
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


},{}],17:[function(require,module,exports){

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

},{}],18:[function(require,module,exports){
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


},{"tnt.api":11,"tnt.utils":14}],19:[function(require,module,exports){
var apijs = require('tnt.api');
var tree = {};

tree.diagonal = function () {
    var d = function (diagonalPath) {
	var source = diagonalPath.source;
        var target = diagonalPath.target;
        var midpointX = (source.x + target.x) / 2;
        var midpointY = (source.y + target.y) / 2;
        var pathData = [source, {x: target.x, y: source.y}, target];
	pathData = pathData.map(d.projection());
	return d.path()(pathData, radial_calc.call(this,pathData))
    };

    var api = apijs (d)
	.getset ('projection')
	.getset ('path')
    
    var coordinateToAngle = function (coord, radius) {
      	var wholeAngle = 2 * Math.PI,
        quarterAngle = wholeAngle / 4
	
      	var coordQuad = coord[0] >= 0 ? (coord[1] >= 0 ? 1 : 2) : (coord[1] >= 0 ? 4 : 3),
        coordBaseAngle = Math.abs(Math.asin(coord[1] / radius))
	
      	// Since this is just based on the angle of the right triangle formed
      	// by the coordinate and the origin, each quad will have different 
      	// offsets
      	var coordAngle;
      	switch (coordQuad) {
      	case 1:
      	    coordAngle = quarterAngle - coordBaseAngle
      	    break
      	case 2:
      	    coordAngle = quarterAngle + coordBaseAngle
      	    break
      	case 3:
      	    coordAngle = 2*quarterAngle + quarterAngle - coordBaseAngle
      	    break
      	case 4:
      	    coordAngle = 3*quarterAngle + coordBaseAngle
      	}
      	return coordAngle
    };

    var radial_calc = function (pathData) {
	var src = pathData[0];
	var mid = pathData[1];
	var dst = pathData[2];
	var radius = Math.sqrt(src[0]*src[0] + src[1]*src[1]);
	var srcAngle = coordinateToAngle(src, radius);
	var midAngle = coordinateToAngle(mid, radius);
	var clockwise = Math.abs(midAngle - srcAngle) > Math.PI ? midAngle <= srcAngle : midAngle > srcAngle;
	return {
	    radius   : radius,
	    clockwise : clockwise
	};
    };

    return d;
};

// vertical diagonal for rect branches
tree.diagonal.vertical = function () {
    var path = function(pathData, obj) {
	var src = pathData[0];
	var mid = pathData[1];
	var dst = pathData[2];
	var radius = 200000; // Number long enough

	return "M" + src + " A" + [radius,radius] + " 0 0,0 " + mid + "M" + mid + "L" + dst; 
	
    };

    var projection = function(d) { 
	return [d.y, d.x];
    }

    return tree.diagonal()
      	.path(path)
      	.projection(projection);
};

tree.diagonal.radial = function () {
    var path = function(pathData, obj) {
      	var src = pathData[0];
      	var mid = pathData[1];
      	var dst = pathData[2];
	var radius = obj.radius;
	var clockwise = obj.clockwise;

	if (clockwise) {
	    return "M" + src + " A" + [radius,radius] + " 0 0,0 " + mid + "M" + mid + "L" + dst; 
	} else {
	    return "M" + mid + " A" + [radius,radius] + " 0 0,0 " + src + "M" + mid + "L" + dst;
	}

    };

    var projection = function(d) {
      	var r = d.y, a = (d.x - 90) / 180 * Math.PI;
      	return [r * Math.cos(a), r * Math.sin(a)];
    };

    return tree.diagonal()
      	.path(path)
      	.projection(projection)
};

module.exports = exports = tree.diagonal;

},{"tnt.api":11}],20:[function(require,module,exports){
var tree = require ("./tree.js");
tree.label = require("./label.js");
tree.diagonal = require("./diagonal.js");
tree.layout = require("./layout.js");
tree.node_display = require("./node_display.js");
// tree.node = require("tnt.tree.node");
// tree.parse_newick = require("tnt.newick").parse_newick;
// tree.parse_nhx = require("tnt.newick").parse_nhx;

module.exports = exports = tree;


},{"./diagonal.js":19,"./label.js":21,"./layout.js":22,"./node_display.js":23,"./tree.js":24}],21:[function(require,module,exports){
var apijs = require("tnt.api");
var tree = {};

tree.label = function () {
"use strict";

    // TODO: Not sure if we should be removing by default prev labels
    // or it would be better to have a separate remove method called by the vis
    // on update
    // We also have the problem that we may be transitioning from
    // text to img labels and we need to remove the label of a different type
    var label = function (node, layout_type, node_size) {
	if (typeof (node) !== 'function') {
            throw(node);
        }

	label.display().call(this, node, layout_type)
	    .attr("class", "tnt_tree_label")
	    .attr("transform", function (d) {
		var t = label.transform()(node, layout_type);
		return "translate (" + (t.translate[0] + node_size) + " " + t.translate[1] + ")rotate(" + t.rotate + ")";
	    })
	// TODO: this click event is probably never fired since there is an onclick event in the node g element?
	    .on("click", function(){
		if (label.on_click() !== undefined) {
		    d3.event.stopPropagation();
		    label.on_click().call(this, node);
		}
	    });
    };

    var api = apijs (label)
	.getset ('width', function () { throw "Need a width callback" })
	.getset ('height', function () { throw "Need a height callback" })
	.getset ('display', function () { throw "Need a display callback" })
	.getset ('transform', function () { throw "Need a transform callback" })
	.getset ('on_click');

    return label;
};

// Text based labels
tree.label.text = function () {
    var label = tree.label();

    var api = apijs (label)
	.getset ('fontsize', 10)
	.getset ('color', "#000")
	.getset ('text', function (d) {
	    return d.data().name;
	})

    label.display (function (node, layout_type) {
	var l = d3.select(this)
	    .append("text")
	    .attr("text-anchor", function (d) {
		if (layout_type === "radial") {
		    return (d.x%360 < 180) ? "start" : "end";
		}
		return "start";
	    })
	    .text(function(){
		return label.text()(node)
	    })
	    .style('font-size', label.fontsize() + "px")
	    .style('fill', d3.functor(label.color())(node));

	return l;
    });

    label.transform (function (node, layout_type) {
	var d = node.data();
	var t = {
	    translate : [5, 5],
	    rotate : 0
	};
	if (layout_type === "radial") {
	    t.translate[1] = t.translate[1] - (d.x%360 < 180 ? 0 : label.fontsize())
	    t.rotate = (d.x%360 < 180 ? 0 : 180)
	}
	return t;
    });


    // label.transform (function (node) {
    // 	var d = node.data();
    // 	return "translate(10 5)rotate(" + (d.x%360 < 180 ? 0 : 180) + ")";
    // });

    label.width (function (node) {
	var svg = d3.select("body")
	    .append("svg")
	    .attr("height", 0)
	    .style('visibility', 'hidden');

	var text = svg
	    .append("text")
	    .style('font-size', label.fontsize() + "px")
	    .text(label.text()(node));

	var width = text.node().getBBox().width;
	svg.remove();

	return width;
    });

    label.height (function (node) {
	return label.fontsize();
    });

    return label;
};

// Image based labels
tree.label.img = function () {
    var label = tree.label();

    var api = apijs (label)
	.getset ('src', function () {})

    label.display (function (node, layout_type) {
	if (label.src()(node)) {
	    var l = d3.select(this)
		.append("image")
		.attr("width", label.width()())
		.attr("height", label.height()())
		.attr("xlink:href", label.src()(node));
	    return l;
	}
	// fallback text in case the img is not found?
	return d3.select(this)
	    .append("text")
	    .text("");
    });

    label.transform (function (node, layout_type) {
	var d = node.data();
	var t = {
	    translate : [10, (-label.height()() / 2)],
	    rotate : 0
	};
	if (layout_type === 'radial') {
	    t.translate[0] = t.translate[0] + (d.x%360 < 180 ? 0 : label.width()()),
	    t.translate[1] = t.translate[1] + (d.x%360 < 180 ? 0 : label.height()()),
	    t.rotate = (d.x%360 < 180 ? 0 : 180)
	}

	return t;
    });

    return label;
};

// Labels made of 2+ simple labels
tree.label.composite = function () {
    var labels = [];

    var label = function (node, layout_type) {
	var curr_xoffset = 0;

	for (var i=0; i<labels.length; i++) {
	    var display = labels[i];

	    (function (offset) {
		display.transform (function (node, layout_type) {
		    var tsuper = display._super_.transform()(node, layout_type);
		    var t = {
			translate : [offset + tsuper.translate[0], tsuper.translate[1]],
			rotate : tsuper.rotate
		    };
		    return t;
		})
	    })(curr_xoffset);

	    curr_xoffset += 10;
	    curr_xoffset += display.width()(node);

	    display.call(this, node, layout_type);
	}
    };

    var api = apijs (label)

    api.method ('add_label', function (display, node) {
	display._super_ = {};
	apijs (display._super_)
	    .get ('transform', display.transform());

	labels.push(display);
	return label;
    });
    
    api.method ('width', function () {
	return function (node) {
	    var tot_width = 0;
	    for (var i=0; i<labels.length; i++) {
		tot_width += parseInt(labels[i].width()(node));
		tot_width += parseInt(labels[i]._super_.transform()(node).translate[0]);
	    }

	    return tot_width;
	}
    });

    api.method ('height', function () {
	return function (node) {
	    var max_height = 0;
	    for (var i=0; i<labels.length; i++) {
		var curr_height = labels[i].height()(node);
		if ( curr_height > max_height) {
		    max_height = curr_height;
		}
	    }
	    return max_height;
	}
    });

    return label;
};

module.exports = exports = tree.label;



},{"tnt.api":11}],22:[function(require,module,exports){
// Based on the code by Ken-ichi Ueda in http://bl.ocks.org/kueda/1036776#d3.phylogram.js

var apijs = require("tnt.api");
var diagonal = require("./diagonal.js");
var tree = {};

tree.layout = function () {

    var l = function () {
    };

    var cluster = d3.layout.cluster()
	.sort(null)
	.value(function (d) {return d.length} )
	.separation(function () {return 1});
    
    var api = apijs (l)
	.getset ('scale', true)
	.getset ('max_leaf_label_width', 0)
	.method ("cluster", cluster)
	.method('yscale', function () {throw "yscale is not defined in the base object"})
	.method('adjust_cluster_size', function () {throw "adjust_cluster_size is not defined in the base object" })
	.method('width', function () {throw "width is not defined in the base object"})
	.method('height', function () {throw "height is not defined in the base object"});

    api.method('scale_branch_lengths', function (curr) {
	if (l.scale() === false) {
	    return
	}

	var nodes = curr.nodes;
	var tree = curr.tree;

	var root_dists = nodes.map (function (d) {
	    return d._root_dist;
	});

	var yscale = l.yscale(root_dists);
	tree.apply (function (node) {
	    node.property("y", yscale(node.root_dist()));
	});
    });

    return l;
};

tree.layout.vertical = function () {
    var layout = tree.layout();
    // Elements like 'labels' depend on the layout type. This exposes a way of identifying the layout type
    layout.type = "vertical";

    var api = apijs (layout)
	.getset ('width', 360)
	.get ('translate_vis', [20,20])
	.method ('diagonal', diagonal.vertical)
	.method ('transform_node', function (d) {
    	    return "translate(" + d.y + "," + d.x + ")";
	});

    api.method('height', function (params) {
    	return (params.n_leaves * params.label_height);
    }); 

    api.method('yscale', function (dists) {
    	return d3.scale.linear()
    	    .domain([0, d3.max(dists)])
    	    .range([0, layout.width() - 20 - layout.max_leaf_label_width()]);
    });

    api.method('adjust_cluster_size', function (params) {
    	var h = layout.height(params);
    	var w = layout.width() - layout.max_leaf_label_width() - layout.translate_vis()[0] - params.label_padding;
    	layout.cluster.size ([h,w]);
    	return layout;
    });

    return layout;
};

tree.layout.radial = function () {
    var layout = tree.layout();
    // Elements like 'labels' depend on the layout type. This exposes a way of identifying the layout type
    layout.type = 'radial';

    var default_width = 360;
    var r = default_width / 2;

    var conf = {
    	width : 360
    };

    var api = apijs (layout)
	.getset (conf)
	.getset ('translate_vis', [r, r]) // TODO: 1.3 should be replaced by a sensible value
	.method ('transform_node', function (d) {
	    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
	})
	.method ('diagonal', diagonal.radial)
	.method ('height', function () { return conf.width });

    // Changes in width affect changes in r
    layout.width.transform (function (val) {
    	r = val / 2;
    	layout.cluster.size([360, r])
    	layout.translate_vis([r, r]);
    	return val;
    });

    api.method ("yscale",  function (dists) {
	return d3.scale.linear()
	    .domain([0,d3.max(dists)])
	    .range([0, r]);
    });

    api.method ("adjust_cluster_size", function (params) {
	r = (layout.width()/2) - layout.max_leaf_label_width() - 20;
	layout.cluster.size([360, r]);
	return layout;
    });

    return layout;
};

module.exports = exports = tree.layout;

},{"./diagonal.js":19,"tnt.api":11}],23:[function(require,module,exports){
var apijs = require("tnt.api");
var tree = {};

tree.node_display = function () {
    "use strict";

    var n = function (node) {
	n.display().call(this, node)
    };

    var api = apijs (n)
	.getset("size", 4.5)
	.getset("fill", "black")
	.getset("stroke", "black")
	.getset("stroke_width", "1px")
	.getset("display", function () {throw "display is not defined in the base object"});

    return n;
};

tree.node_display.circle = function () {
    var n = tree.node_display();

    n.display (function (node) {
	d3.select(this)
	    .append("circle")
	    .attr("r", function (d) {
		return d3.functor(n.size())(node);
	    })
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

tree.node_display.square = function () {
    var n = tree.node_display();

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	d3.select(this)
	    .append("rect")
	    .attr("x", function (d) {
		return -s
	    })
	    .attr("y", function (d) {
		return -s;
	    })
	    .attr("width", function (d) {
		return s*2;
	    })
	    .attr("height", function (d) {
		return s*2;
	    })
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

tree.node_display.triangle = function () {
    var n = tree.node_display();

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	d3.select(this)
	    .append("polygon")
	    .attr("points", (-s) + ",0 " + s + "," + (-s) + " " + s + "," + s)
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

// tree.node_display.cond = function () {
//     var n = tree.node_display();

//     // conditions are objects with
//     // name : a name for this display
//     // callback: the condition to apply (receives a tnt.node)
//     // display: a node_display
//     var conds = [];

//     n.display (function (node) {
// 	var s = d3.functor(n.size())(node);
// 	for (var i=0; i<conds.length; i++) {
// 	    var cond = conds[i];
// 	    // For each node, the first condition met is used
// 	    if (cond.callback.call(this, node) === true) {
// 		cond.display.call(this, node)
// 		break;
// 	    }
// 	}
//     })

//     var api = apijs(n);

//     api.method("add", function (name, cbak, node_display) {
// 	conds.push({ name : name,
// 		     callback : cbak,
// 		     display : node_display
// 		   });
// 	return n;
//     });

//     api.method("reset", function () {
// 	conds = [];
// 	return n;
//     });

//     api.method("update", function (name, cbak, new_display) {
// 	for (var i=0; i<conds.length; i++) {
// 	    if (conds[i].name === name) {
// 		conds[i].callback = cbak;
// 		conds[i].display = new_display;
// 	    }
// 	}
// 	return n;
//     });

//     return n;

// };

module.exports = exports = tree.node_display;

},{"tnt.api":11}],24:[function(require,module,exports){
var apijs = require("tnt.api");
var tnt_tree_node = require("tnt.tree.node");

var tree = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout");

    var conf = {
	duration         : 500,      // Duration of the transitions
	node_display     : tree.node_display.circle(),
	label            : tree.label.text(),
	layout           : tree.layout.vertical(),
	// on_click         : function () {},
	// on_dbl_click     : function () {},
	// on_mouseover     : function () {},
	branch_color       : 'black',
	id               : "_id"
    };

    // Keep track of the focused node
    // TODO: Would it be better to have multiple focused nodes? (ie use an array)
    var focused_node;

    // Extra delay in the transitions (TODO: Needed?)
    var delay = 0;

    // Ease of the transitions
    var ease = "cubic-in-out";

    // By node data
    var sp_counts = {};

    var scale = false;

    // The id of the tree container
    var div_id;

    // The tree visualization (svg)
    var svg;
    var vis;
    var links_g;
    var nodes_g;

    // TODO: For now, counts are given only for leaves
    // but it may be good to allow counts for internal nodes
    var counts = {};

    // The full tree
    var base = {
	tree : undefined,
	data : undefined,
	nodes : undefined,
	links : undefined
    };

    // The curr tree. Needed to re-compute the links / nodes positions of subtrees
    var curr = {
	tree : undefined,
	data : undefined,
	nodes : undefined,
	links : undefined
    };

    // The cbak returned
    var t = function (div) {
	div_id = d3.select(div).attr("id");

        var tree_div = d3.select(div)
            .append("div")
	    .style("width", (conf.layout.width() +  "px"))
	    .attr("class", "tnt_groupDiv");

	var cluster = conf.layout.cluster;

	var n_leaves = curr.tree.get_all_leaves().length;

	var max_leaf_label_length = function (tree) {
	    var max = 0;
	    var leaves = tree.get_all_leaves();
	    for (var i=0; i<leaves.length; i++) {
		var label_width = conf.label.width()(leaves[i]) + d3.functor(conf.node_display.size())(leaves[i]);
		if (label_width > max) {
		    max = label_width;
		}
	    }
	    return max;
	};

	var max_leaf_node_height = function (tree) {
	    var max = 0;
	    var leaves = tree.get_all_leaves();
	    for (var i=0; i<leaves.length; i++) {
		var node_size = d3.functor(conf.node_display.size())(leaves[i]);
		if (node_size > max) {
		    max = node_size;
		}
	    }
	    return max * 2;
	};

	var max_label_length = max_leaf_label_length(curr.tree);
	conf.layout.max_leaf_label_width(max_label_length);

	var max_node_height = max_leaf_node_height(curr.tree);

	// Cluster size is the result of...
	// total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the horizontal transform of the nodes
	var cluster_size_params = {
	    n_leaves : n_leaves,
	    label_height : d3.max([d3.functor(conf.label.height())(), max_node_height]),
	    label_padding : 15
	};

	conf.layout.adjust_cluster_size(cluster_size_params);

	var diagonal = conf.layout.diagonal();
	var transform = conf.layout.transform_node;

	svg = tree_div
	    .append("svg")
	    .attr("width", conf.layout.width())
	    .attr("height", conf.layout.height(cluster_size_params) + 30)
	    .attr("fill", "none");

	vis = svg
	    .append("g")
	    .attr("id", "tnt_st_" + div_id)
	    .attr("transform",
		  "translate(" +
		  conf.layout.translate_vis()[0] +
		  "," +
		  conf.layout.translate_vis()[1] +
		  ")");

	curr.nodes = cluster.nodes(curr.data);
	conf.layout.scale_branch_lengths(curr);
	curr.links = cluster.links(curr.nodes);

	// LINKS
	// All the links are grouped in a g element
	links_g = vis
	    .append("g")
	    .attr("class", "links");
	nodes_g = vis
	    .append("g")
	    .attr("class", "nodes");

	//var link = vis
	var link = links_g
	    .selectAll("path.tnt_tree_link")
	    .data(curr.links, function(d){return d.target[conf.id]});

	link
	    .enter()
	    .append("path")
	    .attr("class", "tnt_tree_link")
	    .attr("id", function(d) {
	    	return "tnt_tree_link_" + div_id + "_" + d.target._id;
	    })
	    .style("stroke", function (d) {
		return d3.functor(conf.branch_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
	    })
	    .attr("d", diagonal);

	// NODES
	//var node = vis
	var node = nodes_g
	    .selectAll("g.tnt_tree_node")
	    .data(curr.nodes, function(d) {return d[conf.id]});

	var new_node = node
	    .enter().append("g")
	    .attr("class", function(n) {
		if (n.children) {
		    if (n.depth == 0) {
			return "root tnt_tree_node"
		    } else {
			return "inner tnt_tree_node"
		    }
		} else {
		    return "leaf tnt_tree_node"
		}
	    })
	    .attr("id", function(d) {
		return "tnt_tree_node_" + div_id + "_" + d._id
	    })
	    .attr("transform", transform);

	// display node shape
	new_node
	    .each (function (d) {
		conf.node_display.call(this, tnt_tree_node(d))
	    });

	// display node label
	new_node
	    .each (function (d) {
	    	conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
	    });

    new_node.on("click", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:click", my_node);
        dispatch.click.call(this, my_node);
    });
    new_node.on("dblclick", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:dblclick", my_node);
        dispatch.dblclick.call(this, my_node);
    });
    new_node.on("mouseover", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:hover", tnt_tree_node(node));
        dispatch.mouseover.call(this, my_node);
    });
    new_node.on("mouseout", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:mouseout", tnt_tree_node(node));
        dispatch.mouseout.call(this, my_node);
    });

	// new_node.on("click", function (node) {
	//     conf.on_click.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:click", tnt_tree_node(node));
	// });
    //
	// new_node.on("mouseenter", function (node) {
	//     conf.on_mouseover.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:hover", tnt_tree_node(node));
	// });
    //
	// new_node.on("dblclick", function (node) {
	//     conf.on_dbl_click.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:dblclick", tnt_tree_node(node));
	// });


	// Update plots an updated tree
	api.method ('update', function() {
	    tree_div
		.style("width", (conf.layout.width() + "px"));
	    svg.attr("width", conf.layout.width());

	    var cluster = conf.layout.cluster;
	    var diagonal = conf.layout.diagonal();
	    var transform = conf.layout.transform_node;

	    var max_label_length = max_leaf_label_length(curr.tree);
	    conf.layout.max_leaf_label_width(max_label_length);

	    var max_node_height = max_leaf_node_height(curr.tree);

	    // Cluster size is the result of...
	    // total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the transform of the nodes (probably by selecting one node assuming all the nodes have the same transform
	    var n_leaves = curr.tree.get_all_leaves().length;
	    var cluster_size_params = {
		n_leaves : n_leaves,
		label_height : d3.max([d3.functor(conf.label.height())(), max_node_height]),
		label_padding : 15
	    };
	    conf.layout.adjust_cluster_size(cluster_size_params);

	    svg
		.transition()
		.duration(conf.duration)
		.ease(ease)
		.attr("height", conf.layout.height(cluster_size_params) + 30); // height is in the layout

	    vis
		.transition()
		.duration(conf.duration)
		.attr("transform",
		      "translate(" +
		      conf.layout.translate_vis()[0] +
		      "," +
		      conf.layout.translate_vis()[1] +
		      ")");

	    curr.nodes = cluster.nodes(curr.data);
	    conf.layout.scale_branch_lengths(curr);
	    curr.links = cluster.links(curr.nodes);

	    // LINKS
	    var link = links_g
		.selectAll("path.tnt_tree_link")
		.data(curr.links, function(d){return d.target[conf.id]});

            // NODES
	    var node = nodes_g
		.selectAll("g.tnt_tree_node")
		.data(curr.nodes, function(d) {return d[conf.id]});

	    var exit_link = link
		.exit()
		.remove();

	    link
		.enter()
		.append("path")
		.attr("class", "tnt_tree_link")
		.attr("id", function (d) {
		    return "tnt_tree_link_" + div_id + "_" + d.target._id;
		})
		.attr("stroke", function (d) {
		    return d3.functor(conf.branch_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
		})
		.attr("d", diagonal);

	    link
	    	.transition()
		.ease(ease)
	    	.duration(conf.duration)
	    	.attr("d", diagonal);


	    // Nodes
	    var new_node = node
		.enter()
		.append("g")
		.attr("class", function(n) {
		    if (n.children) {
			if (n.depth == 0) {
			    return "root tnt_tree_node"
			} else {
			    return "inner tnt_tree_node"
			}
		    } else {
			return "leaf tnt_tree_node"
		    }
		})
		.attr("id", function (d) {
		    return "tnt_tree_node_" + div_id + "_" + d._id;
		})
		.attr("transform", transform);

	    // Exiting nodes are just removed
	    node
		.exit()
		.remove();

        new_node.on("click", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:click", my_node);
            dispatch.click.call(this, my_node);
        });
        new_node.on("dblclick", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:dblclick", my_node);
            dispatch.dblclick.call(this, my_node);
        });
        new_node.on("mouseover", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:hover", tnt_tree_node(node));
            dispatch.mouseover.call(this, my_node);
        });
        new_node.on("mouseout", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:mouseout", tnt_tree_node(node));
            dispatch.mouseout.call(this, my_node);
        });

	    // new_node.on("click", function (node) {
		// conf.on_click.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:click", tnt_tree_node(node));
	    // });
        //
	    // new_node.on("mouseenter", function (node) {
		// conf.on_mouseover.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:hover", tnt_tree_node(node));
	    // });
        //
	    // new_node.on("dblclick", function (node) {
		// conf.on_dbl_click.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:dblclick", tnt_tree_node(node));
	    // });


	    // We need to re-create all the nodes again in case they have changed lively (or the layout)
	    node.selectAll("*").remove();
	    node
		    .each(function (d) {
			conf.node_display.call(this, tnt_tree_node(d))
		    });

	    // We need to re-create all the labels again in case they have changed lively (or the layout)
	    node
		    .each (function (d) {
			conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
		    });

	    node
		.transition()
		.ease(ease)
		.duration(conf.duration)
		.attr("transform", transform);

	});
    };

    // API
    var api = apijs (t)
	.getset (conf)

    // TODO: Rewrite data using getset / finalizers & transforms
    api.method ('data', function (d) {
	if (!arguments.length) {
	    return base.data;
	}

	// The original data is stored as the base and curr data
	base.data = d;
	curr.data = d;

	// Set up a new tree based on the data
	var newtree = tnt_tree_node(base.data);

	t.root(newtree);

	tree.trigger("data:hasChanged", base.data);

	return this;
    });

    // TODO: Rewrite tree using getset / finalizers & transforms
    api.method ('root', function (myTree) {
    	if (!arguments.length) {
    	    return curr.tree;
    	}

	// The original tree is stored as the base, prev and curr tree
    	base.tree = myTree;
	curr.tree = base.tree;
//	prev.tree = base.tree;
    	return this;
    });

    api.method ('subtree', function (curr_nodes, keepSingletons) {
	var subtree = base.tree.subtree(curr_nodes, keepSingletons);
	curr.data = subtree.data();
	curr.tree = subtree;

	return this;
    });

    api.method ('focus_node', function (node, keepSingletons) {
	// find
	var found_node = t.root().find_node(function (n) {
	    return node.id() === n.id();
	});
	focused_node = found_node;
	t.subtree(found_node.get_all_leaves(), keepSingletons);

	return this;
    });

    api.method ('has_focus', function (node) {
	return ((focused_node !== undefined) && (focused_node.id() === node.id()));
    });

    api.method ('release_focus', function () {
	t.data (base.data);
	focused_node = undefined;
	return this;
    });

    return d3.rebind (t, dispatch, "on");
};

module.exports = exports = tree;

},{"tnt.api":11,"tnt.tree.node":13}],25:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"./src/index.js":26}],26:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./reduce.js":27,"./utils.js":28}],27:[function(require,module,exports){
module.exports=require(16)
},{}],28:[function(require,module,exports){

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
	    var args = Array.prototype.slice.call(arguments);
	    var that = this;
	    clearTimeout(tick);
	    tick = setTimeout (function () {
		cbak.apply (that, args);
	    }, time);
	};

	return defer_cancel;
    }
};

},{}],29:[function(require,module,exports){
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

    function setTitles () {
	d3.selectAll(".tnt_tree_node")
	    .append("title")
	    .text(function (d) {
		return d.label;
	    });
    }

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
    var setBranchLength = function (n) {
        if (n.children() === undefined) {
            n.property("branch_length", 1 + (maxDepth - n.property('__depth')));
        } else {
            n.property("branch_length", 1);
        }
    };
    for (var j=0; j<tasNodes.length; j++) {
        var taNode = tasNodes[j];
        taNode.property("branch_length", 1);

        taNode.apply (setBranchLength);
    }

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
	setTitles();
	// d3.selectAll(".tnt_tree_node")
	//     .append("title")
	//     .text(function (d) {
	// 	return d.label;
	//     });

    }

    // deps: tree_vis, flower
    var theme = function (flowerView, div) {
        tooltips
            .flowerView(flowerView)
            .target(config.target);

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
	sortNodes();
	treeVis.update();
	setTitles();
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

    return theme;
};

module.exports = exports = geneAssociationsTree;

},{"./tooltips.js":30,"tnt.tree":7}],30:[function(require,module,exports){
var tnt_tooltip = require("tnt.tooltip");
var deferCancel = require ("tnt.utils").defer_cancel;

var tooltips = function () {

    var flowerView;
    var target;
    var datatypes;

    var t = {};

    var hover_tooltip;
    var tooltip_width = 180;

    var show_deferred = deferCancel (function (obj, ev) {
        hover_tooltip.call(this, obj, ev);
    }, 200);
    var hide_deferred = deferCancel (function (obj, ev) {
        hover_tooltip.close();
    }, 200);

    t.mouseover = function (node) {
        var ev = d3.event;
        hover_tooltip = tnt_tooltip.plain()
        .id(2)
        .width(tooltip_width)
        .show_closer(false)
        .allow_drag(false);

        var obj = {};
        obj.header = "";
        obj.body = node.property("label") + " (" + node.property("association_score") + ")";
        show_deferred.call(this, obj, ev);
    };

    t.mouseout = function (node) {
        hide_deferred();
    };


    t.click = function (node) {
        var obj = {};
        var score = node.property("association_score");
        obj.header = node.property("label") + " (Association score: " + score + ")";
        var loc = "#/evidence/" + target + "/" + node.property("efo_code");
        //obj.body="<div></div><a href=" + loc + ">View evidence details</a><br/><a href=''>Zoom on node</a>";
        obj.rows = [];
        obj.rows.push({
            value : "<a class=cttv_flowerLink href=" + loc + "><div class=tnt_flowerView></div></a>"
        });
        obj.rows.push({
            value: "<a href=" + loc + ">View evidence details</a>"
        });
        obj.rows.push({
            value : node.is_collapsed() ? "Expand node" : "Collapse node",
            link : function (n) {
                n.toggle();
                treeVis.update();
                setTitles();
            },
            obj: node
        });
        var diseaseProfileLoc = "#/disease/" + node.property("efo_code");
        var diseaseAssocLoc = diseaseProfileLoc + "/associations";
        obj.rows.push({
            "value" : "<a href=" + diseaseAssocLoc + "><div class='cttv_associations_link'></div></a><a href=" + diseaseProfileLoc + "><div class='cttv_profile_link'></div>"
        });


        // if (treeVis.has_focus(node)) {
        // 	obj.rows.push({
        // 	    value : "Release focus",
        // 	    link : function (n) {
        // 		treeVis.release_focus(n)
        // 		    .update();
        // 		// re-insert the titles
        // 		d3.selectAll(".tnt_tree_node")
        // 		    .append("title")
        // 		    .text(function (d) {
        // 			return d.label;
        // 		    });
        // 	    },
        // 	    obj : node
        // 	});
        // } else {
        // 	obj.rows.push({
        // 	    value:"Set focus on node",
        // 	    link : function (n) {
        // 		console.log("SET FOCUS ON NODE: ");
        // 		console.log(n.data());
        // 		treeVis.focus_node(n, true)
        // 		    .update();
        // 		// re-insert the titles
        // 		d3.selectAll(".tnt_tree_node")
        // 		    .append("title")
        // 		    .text(function (d) {
        // 			return d.label;
        // 		    });
        // 	    },
        // 	    obj: node
        // 	});
        // }

        var leafTooltip = tnt_tooltip.list()
        .id(1)
        .width(tooltip_width);
        // Hijack tooltip's fill callback
        var origFill = leafTooltip.fill();

        // Pass a new fill callback that calls the original one and decorates with flowers
        leafTooltip.fill (function (data) {
            origFill.call(this, data);
            var dts = node.property("datatypes");
            var flowerData = [
                {"value":lookDatasource(dts, "genetic_association").score, "label":"Genetics", "active": hasActiveDatatype("genetic_association",datatypes)},
                {"value":lookDatasource(dts, "somatic_mutation").score,  "label":"Somatic", "active": hasActiveDatatype("somatic_mutation", datatypes)},
                {"value":lookDatasource(dts, "known_drug").score,  "label":"Drugs", "active": hasActiveDatatype("known_drug", datatypes)},
                {"value":lookDatasource(dts, "rna_expression").score,  "label":"RNA", "active": hasActiveDatatype("rna_expression", datatypes)},
                {"value":lookDatasource(dts, "affected_pathway").score,  "label":"Pathways", "active": hasActiveDatatype("affected_pathway", datatypes)},
                {"value":lookDatasource(dts, "animal_model").score,  "label":"Models", "active": hasActiveDatatype("animal_model", datatypes)}
            ];

            flowerView
                .diagonal(150)
                .values(flowerData);
            flowerView(this.select("div .tnt_flowerView").node());
        });

        leafTooltip.call(this, obj);

        function lookDatasource (arr, dsName) {
            for (var i=0; i<arr.length; i++) {
                var ds = arr[i];
                if (ds.datatype === dsName) {
                    return {
                        "count": ds.evidence_count,
                        "score": ds.association_score
                    };
                }
            }
            return {
                "count": 0,
                "score": 0
            };
        }

        function hasActiveDatatype (checkDatatype) {
            for (var datatype in datatypes) {
                if (datatype === checkDatatype) {
                    return true;
                }
            }
            return false;
        }

    };

    t.flowerView = function (view) {
        if (!arguments.length) {
            return flowerView;
        }
        flowerView = view;
        return this;
    };

    t.datatypes = function (dts) {
        if (!arguments.length) {
            return datatypes;
        }
        datatypes = dts;
        return this;
    };

    t.target = function (t) {
        if (!arguments.length) {
            return target;
        }
        target = t;
        return this;
    };




    return t;
};

module.exports = exports = tooltips;

},{"tnt.tooltip":3,"tnt.utils":25}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL2Zha2VfOTM1ZGVkMDAuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL3NyYy90b29sdGlwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9yZWR1Y2UuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvdXRpbHMuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvc3JjL25vZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL2RpYWdvbmFsLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGFiZWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL2xheW91dC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbm9kZV9kaXNwbGF5LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy90cmVlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvdXRpbHMuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9zcmMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL3NyYy90b29sdGlwcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7Ozs7OztBQ0RBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ZEE7O0FDQUE7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9XQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsIi8vIGlmICh0eXBlb2YgYnViYmxlc1ZpZXcgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3ID0ge31cbi8vIH1cbi8vIGJ1YmJsZXNWaWV3LmJ1YmJsZXNWaWV3ID0gcmVxdWlyZShcIi4vc3JjL2J1YmJsZXNWaWV3LmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBnZW5lQXNzb2NpYXRpb25zVHJlZSA9IHJlcXVpcmUoXCIuL3NyYy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlLmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB0b29sdGlwID0gcmVxdWlyZShcIi4vc3JjL3Rvb2x0aXAuanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG5cbnZhciB0b29sdGlwID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRyYWcgPSBkMy5iZWhhdmlvci5kcmFnKCk7XG4gICAgdmFyIHRvb2x0aXBfZGl2O1xuXG4gICAgdmFyIGNvbmYgPSB7XG5cdHBvc2l0aW9uIDogXCJyaWdodFwiLFxuXHRhbGxvd19kcmFnIDogdHJ1ZSxcblx0c2hvd19jbG9zZXIgOiB0cnVlLFxuXHRmaWxsIDogZnVuY3Rpb24gKCkgeyB0aHJvdyBcImZpbGwgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7IH0sXG5cdHdpZHRoIDogMTgwLFxuXHRpZCA6IDFcbiAgICB9O1xuXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGF0YSwgZXZlbnQpIHtcblx0ZHJhZ1xuXHQgICAgLm9yaWdpbihmdW5jdGlvbigpe1xuXHRcdHJldHVybiB7eDpwYXJzZUludChkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJsZWZ0XCIpKSxcblx0XHRcdHk6cGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwidG9wXCIpKVxuXHRcdCAgICAgICB9O1xuXHQgICAgfSlcblx0ICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oKSB7XG5cdFx0aWYgKGNvbmYuYWxsb3dfZHJhZykge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcylcblx0XHRcdC5zdHlsZShcImxlZnRcIiwgZDMuZXZlbnQueCArIFwicHhcIilcblx0XHRcdC5zdHlsZShcInRvcFwiLCBkMy5ldmVudC55ICsgXCJweFwiKTtcblx0XHR9XG5cdCAgICB9KTtcblxuXHQvLyBUT0RPOiBXaHkgZG8gd2UgbmVlZCB0aGUgZGl2IGVsZW1lbnQ/XG5cdC8vIEl0IGxvb2tzIGxpa2UgaWYgd2UgYW5jaG9yIHRoZSB0b29sdGlwIGluIHRoZSBcImJvZHlcIlxuXHQvLyBUaGUgdG9vbHRpcCBpcyBub3QgbG9jYXRlZCBpbiB0aGUgcmlnaHQgcGxhY2UgKGFwcGVhcnMgYXQgdGhlIGJvdHRvbSlcblx0Ly8gU2VlIGNsaWVudHMvdG9vbHRpcHNfdGVzdC5odG1sIGZvciBhbiBleGFtcGxlXG5cdHZhciBjb250YWluZXJFbGVtID0gc2VsZWN0QW5jZXN0b3IgKHRoaXMsIFwiZGl2XCIpO1xuXHRpZiAoY29udGFpbmVyRWxlbSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAvLyBXZSByZXF1aXJlIGEgZGl2IGVsZW1lbnQgYXQgc29tZSBwb2ludCB0byBhbmNob3IgdGhlIHRvb2x0aXBcblx0ICAgIHJldHVybjtcblx0fVxuXG5cdHRvb2x0aXBfZGl2ID0gZDMuc2VsZWN0KGNvbnRhaW5lckVsZW0pXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3Rvb2x0aXBcIilcblx0ICAgIC5jbGFzc2VkKFwidG50X3Rvb2x0aXBfYWN0aXZlXCIsIHRydWUpICAvLyBUT0RPOiBJcyB0aGlzIG5lZWRlZC91c2VkPz8/XG5cdCAgICAuY2FsbChkcmFnKTtcblxuXHQvLyBwcmV2IHRvb2x0aXBzIHdpdGggdGhlIHNhbWUgaGVhZGVyXG5cdGQzLnNlbGVjdChcIiN0bnRfdG9vbHRpcF9cIiArIGNvbmYuaWQpLnJlbW92ZSgpO1xuXG5cdGlmICgoZDMuZXZlbnQgPT09IG51bGwpICYmIChldmVudCkpIHtcblx0ICAgIGQzLmV2ZW50ID0gZXZlbnQ7XG5cdH1cblx0dmFyIGQzbW91c2UgPSBkMy5tb3VzZShjb250YWluZXJFbGVtKTtcblx0ZDMuZXZlbnQgPSBudWxsO1xuXG5cdHZhciBvZmZzZXQgPSAwO1xuXHRpZiAoY29uZi5wb3NpdGlvbiA9PT0gXCJsZWZ0XCIpIHtcblx0ICAgIG9mZnNldCA9IGNvbmYud2lkdGg7XG5cdH1cblxuXHR0b29sdGlwX2Rpdi5hdHRyKFwiaWRcIiwgXCJ0bnRfdG9vbHRpcF9cIiArIGNvbmYuaWQpO1xuXG5cdC8vIFdlIHBsYWNlIHRoZSB0b29sdGlwXG5cdHRvb2x0aXBfZGl2XG5cdCAgICAuc3R5bGUoXCJsZWZ0XCIsIChkM21vdXNlWzBdKSArIFwicHhcIilcblx0ICAgIC5zdHlsZShcInRvcFwiLCAoZDNtb3VzZVsxXSkgKyBcInB4XCIpO1xuXG5cdC8vIENsb3NlXG4gICAgaWYgKGNvbmYuc2hvd19jbG9zZXIpIHtcbiAgICAgICAgdG9vbHRpcF9kaXZcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdG9vbHRpcF9jbG9zZXJcIilcbiAgICAgICAgICAgIC5vbiAoXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdC5jbG9zZSgpO1xuICAgICAgICAgICAgfSlcbiAgICB9XG5cblx0Y29uZi5maWxsLmNhbGwodG9vbHRpcF9kaXYsIGRhdGEpO1xuXG5cdC8vIHJldHVybiB0aGlzIGhlcmU/XG5cdHJldHVybiB0O1xuICAgIH07XG5cbiAgICAvLyBnZXRzIHRoZSBmaXJzdCBhbmNlc3RvciBvZiBlbGVtIGhhdmluZyB0YWduYW1lIFwidHlwZVwiXG4gICAgLy8gZXhhbXBsZSA6IHZhciBteWRpdiA9IHNlbGVjdEFuY2VzdG9yKG15ZWxlbSwgXCJkaXZcIik7XG4gICAgZnVuY3Rpb24gc2VsZWN0QW5jZXN0b3IgKGVsZW0sIHR5cGUpIHtcblx0dHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0aWYgKGVsZW0ucGFyZW50Tm9kZSA9PT0gbnVsbCkge1xuXHQgICAgY29uc29sZS5sb2coXCJObyBtb3JlIHBhcmVudHNcIik7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHZhciB0YWdOYW1lID0gZWxlbS5wYXJlbnROb2RlLnRhZ05hbWU7XG5cblx0aWYgKCh0YWdOYW1lICE9PSB1bmRlZmluZWQpICYmICh0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUpKSB7XG5cdCAgICByZXR1cm4gZWxlbS5wYXJlbnROb2RlO1xuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIHNlbGVjdEFuY2VzdG9yIChlbGVtLnBhcmVudE5vZGUsIHR5cGUpO1xuXHR9XG4gICAgfVxuXG4gICAgdmFyIGFwaSA9IGFwaWpzKHQpXG5cdC5nZXRzZXQoY29uZik7XG4gICAgYXBpLmNoZWNrKCdwb3NpdGlvbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0cmV0dXJuICh2YWwgPT09ICdsZWZ0JykgfHwgKHZhbCA9PT0gJ3JpZ2h0Jyk7XG4gICAgfSwgXCJPbmx5ICdsZWZ0JyBvciAncmlnaHQnIHZhbHVlcyBhcmUgYWxsb3dlZCBmb3IgcG9zaXRpb25cIik7XG5cbiAgICBhcGkubWV0aG9kKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRvb2x0aXBfZGl2KSB7XG4gICAgICAgICAgICB0b29sdGlwX2Rpdi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLmxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlzdCB0b29sdGlwIGlzIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcbiAgICB2YXIgd2lkdGggPSAxODA7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblx0dmFyIG9ial9pbmZvX2xpc3QgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdC8vIFRvb2x0aXAgaGVhZGVyXG4gICAgaWYgKG9iai5oZWFkZXIpIHtcbiAgICAgICAgb2JqX2luZm9fbGlzdFxuXHQgICAgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuICAgICAgICAgICAuYXBwZW5kKFwidGhcIilcbiAgICAgICAgICAgLnRleHQob2JqLmhlYWRlcik7XG4gICAgfVxuXG5cdC8vIFRvb2x0aXAgcm93c1xuXHR2YXIgdGFibGVfcm93cyA9IG9ial9pbmZvX2xpc3Quc2VsZWN0QWxsKFwiLnRudF96bWVudV9yb3dcIilcblx0ICAgIC5kYXRhKG9iai5yb3dzKVxuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIik7XG5cblx0dGFibGVfcm93c1xuXHQgICAgLmFwcGVuZChcInRkXCIpXG5cdCAgICAuc3R5bGUoXCJ0ZXh0LWFsaWduXCIsIFwiY2VudGVyXCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbihkLGkpIHtcblx0XHRyZXR1cm4gb2JqLnJvd3NbaV0udmFsdWU7XG5cdCAgICB9KVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5saW5rID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRkMy5zZWxlY3QodGhpcylcblx0XHQgICAgLmNsYXNzZWQoXCJsaW5rXCIsIDEpXG5cdFx0ICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0ZC5saW5rKGQub2JqKTtcblx0XHRcdHQuY2xvc2UuY2FsbCh0aGlzKTtcblx0XHQgICAgfSk7XG5cdCAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAudGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gdGFibGUgdG9vbHRpcHMgYXJlIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcblxuICAgIHZhciB3aWR0aCA9IDE4MDtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gVG9vbHRpcCBoZWFkZXJcbiAgICBpZiAob2JqLmhlYWRlcikge1xuICAgICAgICBvYmpfaW5mb190YWJsZVxuICAgICAgICAgICAgLmFwcGVuZChcInRyXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuICAgICAgICAgICAgLmFwcGVuZChcInRoXCIpXG4gICAgICAgICAgICAuYXR0cihcImNvbHNwYW5cIiwgMilcbiAgICAgICAgICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuICAgIH1cblxuXHQvLyBUb29sdGlwIHJvd3Ncblx0dmFyIHRhYmxlX3Jvd3MgPSBvYmpfaW5mb190YWJsZS5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC5hdHRyKFwiY29sc3BhblwiLCBmdW5jdGlvbiAoZCwgaSkge1xuXHRcdGlmIChkLnZhbHVlID09PSBcIlwiKSB7XG5cdFx0ICAgIHJldHVybiAyO1xuXHRcdH1cblx0XHRyZXR1cm4gMTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQudmFsdWUgPT09IFwiXCIpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3ptZW51X2lubmVyX2hlYWRlclwiO1xuXHRcdH1cblx0XHRyZXR1cm4gXCJ0bnRfem1lbnVfY2VsbFwiO1xuXHQgICAgfSlcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS5sYWJlbDtcblx0ICAgIH0pO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0aWYgKHR5cGVvZiBvYmoucm93c1tpXS52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdCAgICBvYmoucm93c1tpXS52YWx1ZS5jYWxsKHRoaXMsIGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBvYmoucm93c1tpXS52YWx1ZTtcblx0XHR9XG5cdCAgICB9KVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC52YWx1ZSA9PT0gXCJcIikge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcykucmVtb3ZlKCk7XG5cdFx0fVxuXHQgICAgfSlcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQubGluayA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIC5jbGFzc2VkKFwibGlua1wiLCAxKVxuXHRcdCAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdGQubGluayhkLm9iaik7XG5cdFx0XHR0LmNsb3NlLmNhbGwodGhpcyk7XG5cdFx0ICAgIH0pO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAucGxhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcGxhaW4gdG9vbHRpcHMgYXJlIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cbiAgICBpZiAob2JqLmhlYWRlcikge1xuICAgICAgICBvYmpfaW5mb190YWJsZVxuICAgICAgICAgICAgLmFwcGVuZChcInRyXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuICAgICAgICAgICAgLmFwcGVuZChcInRoXCIpXG4gICAgICAgICAgICAudGV4dChvYmouaGVhZGVyKTtcbiAgICB9XG5cbiAgICBpZiAob2JqLmJvZHkpIHtcbiAgICAgICAgb2JqX2luZm9fdGFibGVcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0clwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZFwiKVxuICAgICAgICAgICAgLnN0eWxlKFwidGV4dC1hbGlnblwiLCBcImNlbnRlclwiKVxuICAgICAgICAgICAgLmh0bWwob2JqLmJvZHkpO1xuICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG9vbHRpcDtcbiIsIi8vIGlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fVxuLy8gfVxubW9kdWxlLmV4cG9ydHMgPSB0cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZShcImJpb2pzLWV2ZW50c1wiKTtcbmV2ZW50c3lzdGVtLm1peGluKHRyZWUpO1xuLy90bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy90bnQudG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcbi8vdG50LnRyZWUgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbiIsInZhciBldmVudHMgPSByZXF1aXJlKFwiYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmVcIik7XG5cbmV2ZW50cy5vbkFsbCA9IGZ1bmN0aW9uKGNhbGxiYWNrLGNvbnRleHQpe1xuICB0aGlzLm9uKFwiYWxsXCIsIGNhbGxiYWNrLGNvbnRleHQpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIE1peGluIHV0aWxpdHlcbmV2ZW50cy5vbGRNaXhpbiA9IGV2ZW50cy5taXhpbjtcbmV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gIGV2ZW50cy5vbGRNaXhpbihwcm90byk7XG4gIC8vIGFkZCBjdXN0b20gb25BbGxcbiAgdmFyIGV4cG9ydHMgPSBbJ29uQWxsJ107XG4gIGZvcih2YXIgaT0wOyBpIDwgZXhwb3J0cy5sZW5ndGg7aSsrKXtcbiAgICB2YXIgbmFtZSA9IGV4cG9ydHNbaV07XG4gICAgcHJvdG9bbmFtZV0gPSB0aGlzW25hbWVdO1xuICB9XG4gIHJldHVybiBwcm90bztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzO1xuIiwiLyoqXG4gKiBTdGFuZGFsb25lIGV4dHJhY3Rpb24gb2YgQmFja2JvbmUuRXZlbnRzLCBubyBleHRlcm5hbCBkZXBlbmRlbmN5IHJlcXVpcmVkLlxuICogRGVncmFkZXMgbmljZWx5IHdoZW4gQmFja29uZS91bmRlcnNjb3JlIGFyZSBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudFxuICogZ2xvYmFsIGNvbnRleHQuXG4gKlxuICogTm90ZSB0aGF0IGRvY3Mgc3VnZ2VzdCB0byB1c2UgdW5kZXJzY29yZSdzIGBfLmV4dGVuZCgpYCBtZXRob2QgdG8gYWRkIEV2ZW50c1xuICogc3VwcG9ydCB0byBzb21lIGdpdmVuIG9iamVjdC4gQSBgbWl4aW4oKWAgbWV0aG9kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBFdmVudHNcbiAqIHByb3RvdHlwZSB0byBhdm9pZCB1c2luZyB1bmRlcnNjb3JlIGZvciB0aGF0IHNvbGUgcHVycG9zZTpcbiAqXG4gKiAgICAgdmFyIG15RXZlbnRFbWl0dGVyID0gQmFja2JvbmVFdmVudHMubWl4aW4oe30pO1xuICpcbiAqIE9yIGZvciBhIGZ1bmN0aW9uIGNvbnN0cnVjdG9yOlxuICpcbiAqICAgICBmdW5jdGlvbiBNeUNvbnN0cnVjdG9yKCl7fVxuICogICAgIE15Q29uc3RydWN0b3IucHJvdG90eXBlLmZvbyA9IGZ1bmN0aW9uKCl7fVxuICogICAgIEJhY2tib25lRXZlbnRzLm1peGluKE15Q29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAqXG4gKiAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBJbmMuXG4gKiAoYykgMjAxMyBOaWNvbGFzIFBlcnJpYXVsdFxuICovXG4vKiBnbG9iYWwgZXhwb3J0czp0cnVlLCBkZWZpbmUsIG1vZHVsZSAqL1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdCA9IHRoaXMsXG4gICAgICBuYXRpdmVGb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcbiAgICAgIGlkQ291bnRlciA9IDA7XG5cbiAgLy8gUmV0dXJucyBhIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gbWF0Y2hpbmcgdGhlIG1pbmltYWwgQVBJIHN1YnNldCByZXF1aXJlZFxuICAvLyBieSBCYWNrYm9uZS5FdmVudHNcbiAgZnVuY3Rpb24gbWluaXNjb3JlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBrZXlzOiBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmogIT09IFwiZnVuY3Rpb25cIiB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5cygpIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSwga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGtleXNba2V5cy5sZW5ndGhdID0ga2V5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgIH0sXG5cbiAgICAgIHVuaXF1ZUlkOiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICAgICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgICAgIH0sXG5cbiAgICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbmNlOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICBmdW5jID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdmFyIF8gPSBtaW5pc2NvcmUoKSwgRXZlbnRzO1xuXG4gIC8vIEJhY2tib25lLkV2ZW50c1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBIG1vZHVsZSB0aGF0IGNhbiBiZSBtaXhlZCBpbiB0byAqYW55IG9iamVjdCogaW4gb3JkZXIgdG8gcHJvdmlkZSBpdCB3aXRoXG4gIC8vIGN1c3RvbSBldmVudHMuIFlvdSBtYXkgYmluZCB3aXRoIGBvbmAgb3IgcmVtb3ZlIHdpdGggYG9mZmAgY2FsbGJhY2tcbiAgLy8gZnVuY3Rpb25zIHRvIGFuIGV2ZW50OyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICBFdmVudHMgPSB7XG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi4gUGFzc2luZyBgXCJhbGxcImAgd2lsbCBiaW5kXG4gICAgLy8gdGhlIGNhbGxiYWNrIHRvIGFsbCBldmVudHMgZmlyZWQuXG4gICAgb246IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb24nLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8ICh0aGlzLl9ldmVudHNbbmFtZV0gPSBbXSk7XG4gICAgICBldmVudHMucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBjb250ZXh0OiBjb250ZXh0LCBjdHg6IGNvbnRleHQgfHwgdGhpc30pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gb25seSBiZSB0cmlnZ2VyZWQgYSBzaW5nbGUgdGltZS4gQWZ0ZXIgdGhlIGZpcnN0IHRpbWVcbiAgICAvLyB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgaXQgd2lsbCBiZSByZW1vdmVkLlxuICAgIG9uY2U6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb25jZScsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgb25jZSA9IF8ub25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5vZmYobmFtZSwgb25jZSk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIG9uY2UuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICByZXR1cm4gdGhpcy5vbihuYW1lLCBvbmNlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIG9uZSBvciBtYW55IGNhbGxiYWNrcy4gSWYgYGNvbnRleHRgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgdGhlIGV2ZW50LiBJZiBgbmFtZWAgaXMgbnVsbCwgcmVtb3ZlcyBhbGwgYm91bmRcbiAgICAvLyBjYWxsYmFja3MgZm9yIGFsbCBldmVudHMuXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgdmFyIHJldGFpbiwgZXYsIGV2ZW50cywgbmFtZXMsIGksIGwsIGosIGs7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhZXZlbnRzQXBpKHRoaXMsICdvZmYnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIW5hbWUgJiYgIWNhbGxiYWNrICYmICFjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHJldGFpbiA9IFtdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBjb250ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZXZlbnRzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICBldiA9IGV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgaWYgKChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrLl9jYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGV2LmNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0YWluLnB1c2goZXYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmV0YWluLmxlbmd0aCkgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gICAgLy8gcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcbiAgICAvLyAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG9cbiAgICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAndHJpZ2dlcicsIG5hbWUsIGFyZ3MpKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gdGhpcy5fZXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRlbGwgdGhpcyBvYmplY3QgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gZWl0aGVyIHNwZWNpZmljIGV2ZW50cyAuLi4gb3JcbiAgICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZGVsZXRlTGlzdGVuZXIgPSAhbmFtZSAmJiAhY2FsbGJhY2s7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBpZiAob2JqKSAobGlzdGVuZXJzID0ge30pW29iai5fbGlzdGVuZXJJZF0gPSBvYmo7XG4gICAgICBmb3IgKHZhciBpZCBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzW2lkXS5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgICBpZiAoZGVsZXRlTGlzdGVuZXIpIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbaWRdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gIH07XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5ncy5cbiAgdmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbiAgLy8gSW1wbGVtZW50IGZhbmN5IGZlYXR1cmVzIG9mIHRoZSBFdmVudHMgQVBJIHN1Y2ggYXMgbXVsdGlwbGUgZXZlbnRcbiAgLy8gbmFtZXMgYFwiY2hhbmdlIGJsdXJcImAgYW5kIGpRdWVyeS1zdHlsZSBldmVudCBtYXBzIGB7Y2hhbmdlOiBhY3Rpb259YFxuICAvLyBpbiB0ZXJtcyBvZiB0aGUgZXhpc3RpbmcgQVBJLlxuICB2YXIgZXZlbnRzQXBpID0gZnVuY3Rpb24ob2JqLCBhY3Rpb24sIG5hbWUsIHJlc3QpIHtcbiAgICBpZiAoIW5hbWUpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gSGFuZGxlIGV2ZW50IG1hcHMuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG5hbWUpIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBba2V5LCBuYW1lW2tleV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNwYWNlIHNlcGFyYXRlZCBldmVudCBuYW1lcy5cbiAgICBpZiAoZXZlbnRTcGxpdHRlci50ZXN0KG5hbWUpKSB7XG4gICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGV2ZW50U3BsaXR0ZXIpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBbbmFtZXNbaV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gQSBkaWZmaWN1bHQtdG8tYmVsaWV2ZSwgYnV0IG9wdGltaXplZCBpbnRlcm5hbCBkaXNwYXRjaCBmdW5jdGlvbiBmb3JcbiAgLy8gdHJpZ2dlcmluZyBldmVudHMuIFRyaWVzIHRvIGtlZXAgdGhlIHVzdWFsIGNhc2VzIHNwZWVkeSAobW9zdCBpbnRlcm5hbFxuICAvLyBCYWNrYm9uZSBldmVudHMgaGF2ZSAzIGFyZ3VtZW50cykuXG4gIHZhciB0cmlnZ2VyRXZlbnRzID0gZnVuY3Rpb24oZXZlbnRzLCBhcmdzKSB7XG4gICAgdmFyIGV2LCBpID0gLTEsIGwgPSBldmVudHMubGVuZ3RoLCBhMSA9IGFyZ3NbMF0sIGEyID0gYXJnc1sxXSwgYTMgPSBhcmdzWzJdO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgpOyByZXR1cm47XG4gICAgICBjYXNlIDE6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSk7IHJldHVybjtcbiAgICAgIGNhc2UgMjogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMik7IHJldHVybjtcbiAgICAgIGNhc2UgMzogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMiwgYTMpOyByZXR1cm47XG4gICAgICBkZWZhdWx0OiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5hcHBseShldi5jdHgsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuTWV0aG9kcyA9IHtsaXN0ZW5UbzogJ29uJywgbGlzdGVuVG9PbmNlOiAnb25jZSd9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAgYW5kIGBvbmNlYC4gVGVsbCAqdGhpcyogb2JqZWN0IHRvXG4gIC8vIGxpc3RlbiB0byBhbiBldmVudCBpbiBhbm90aGVyIG9iamVjdCAuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3NcbiAgLy8gbGlzdGVuaW5nIHRvLlxuICBfLmVhY2gobGlzdGVuTWV0aG9kcywgZnVuY3Rpb24oaW1wbGVtZW50YXRpb24sIG1ldGhvZCkge1xuICAgIEV2ZW50c1ttZXRob2RdID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCAodGhpcy5fbGlzdGVuZXJzID0ge30pO1xuICAgICAgdmFyIGlkID0gb2JqLl9saXN0ZW5lcklkIHx8IChvYmouX2xpc3RlbmVySWQgPSBfLnVuaXF1ZUlkKCdsJykpO1xuICAgICAgbGlzdGVuZXJzW2lkXSA9IG9iajtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIG9ialtpbXBsZW1lbnRhdGlvbl0obmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIE1peGluIHV0aWxpdHlcbiAgRXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgICB2YXIgZXhwb3J0cyA9IFsnb24nLCAnb25jZScsICdvZmYnLCAndHJpZ2dlcicsICdzdG9wTGlzdGVuaW5nJywgJ2xpc3RlblRvJyxcbiAgICAgICAgICAgICAgICAgICAnbGlzdGVuVG9PbmNlJywgJ2JpbmQnLCAndW5iaW5kJ107XG4gICAgXy5lYWNoKGV4cG9ydHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gcHJvdG87XG4gIH07XG5cbiAgLy8gRXhwb3J0IEV2ZW50cyBhcyBCYWNrYm9uZUV2ZW50cyBkZXBlbmRpbmcgb24gY3VycmVudCBjb250ZXh0XG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50cztcbiAgICB9XG4gICAgZXhwb3J0cy5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfWVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT0gXCJvYmplY3RcIikge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudHM7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfVxufSkodGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUnKTtcbiIsInZhciBub2RlID0gcmVxdWlyZShcIi4vc3JjL25vZGUuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBub2RlO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIvLyByZXF1aXJlKCdmcycpLnJlYWRkaXJTeW5jKF9fZGlybmFtZSArICcvJykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4vLyAgICAgaWYgKGZpbGUubWF0Y2goLy4rXFwuanMvZykgIT09IG51bGwgJiYgZmlsZSAhPT0gX19maWxlbmFtZSkge1xuLy8gXHR2YXIgbmFtZSA9IGZpbGUucmVwbGFjZSgnLmpzJywgJycpO1xuLy8gXHRtb2R1bGUuZXhwb3J0c1tuYW1lXSA9IHJlcXVpcmUoJy4vJyArIGZpbGUpO1xuLy8gICAgIH1cbi8vIH0pO1xuXG4vLyBTYW1lIGFzXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnV0aWxzLnJlZHVjZSA9IHJlcXVpcmUoXCIuL3JlZHVjZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHV0aWxzO1xuIiwidmFyIHJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc21vb3RoID0gNTtcbiAgICB2YXIgdmFsdWUgPSAndmFsJztcbiAgICB2YXIgcmVkdW5kYW50ID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPCBiKSB7XG5cdCAgICByZXR1cm4gKChiLWEpIDw9IChiICogMC4yKSk7XG5cdH1cblx0cmV0dXJuICgoYS1iKSA8PSAoYSAqIDAuMikpO1xuICAgIH07XG4gICAgdmFyIHBlcmZvcm1fcmVkdWNlID0gZnVuY3Rpb24gKGFycikge3JldHVybiBhcnI7fTtcblxuICAgIHZhciByZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmICghYXJyLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoZWQgPSBwZXJmb3JtX3Ntb290aChhcnIpO1xuXHR2YXIgcmVkdWNlZCAgPSBwZXJmb3JtX3JlZHVjZShzbW9vdGhlZCk7XG5cdHJldHVybiByZWR1Y2VkO1xuICAgIH07XG5cbiAgICB2YXIgbWVkaWFuID0gZnVuY3Rpb24gKHYsIGFycikge1xuXHRhcnIuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHQgICAgcmV0dXJuIGFbdmFsdWVdIC0gYlt2YWx1ZV07XG5cdH0pO1xuXHRpZiAoYXJyLmxlbmd0aCAlIDIpIHtcblx0ICAgIHZbdmFsdWVdID0gYXJyW35+KGFyci5sZW5ndGggLyAyKV1bdmFsdWVdO1x0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIG4gPSB+fihhcnIubGVuZ3RoIC8gMikgLSAxO1xuXHQgICAgdlt2YWx1ZV0gPSAoYXJyW25dW3ZhbHVlXSArIGFycltuKzFdW3ZhbHVlXSkgLyAyO1xuXHR9XG5cblx0cmV0dXJuIHY7XG4gICAgfTtcblxuICAgIHZhciBjbG9uZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0dmFyIHRhcmdldCA9IHt9O1xuXHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuXHQgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICB2YXIgcGVyZm9ybV9zbW9vdGggPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmIChzbW9vdGggPT09IDApIHsgLy8gbm8gc21vb3RoXG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhfYXJyID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBsb3cgPSAoaSA8IHNtb290aCkgPyAwIDogKGkgLSBzbW9vdGgpO1xuXHQgICAgdmFyIGhpZ2ggPSAoaSA+IChhcnIubGVuZ3RoIC0gc21vb3RoKSkgPyBhcnIubGVuZ3RoIDogKGkgKyBzbW9vdGgpO1xuXHQgICAgc21vb3RoX2FycltpXSA9IG1lZGlhbihjbG9uZShhcnJbaV0pLCBhcnIuc2xpY2UobG93LGhpZ2grMSkpO1xuXHR9XG5cdHJldHVybiBzbW9vdGhfYXJyO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdWNlciA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1fcmVkdWNlO1xuXHR9XG5cdHBlcmZvcm1fcmVkdWNlID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVuZGFudCA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHJlZHVuZGFudDtcblx0fVxuXHRyZWR1bmRhbnQgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdHZhbHVlID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2Uuc21vb3RoID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBzbW9vdGg7XG5cdH1cblx0c21vb3RoID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkdWNlO1xufTtcblxudmFyIGJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKVxuXHQudmFsdWUoJ3N0YXJ0Jyk7XG5cbiAgICB2YXIgdmFsdWUyID0gJ2VuZCc7XG5cbiAgICB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnb2JqZWN0JyA6IHtcbiAgICAgICAgICAgICAgICAnc3RhcnQnIDogb2JqMS5vYmplY3RbcmVkLnZhbHVlKCldLFxuICAgICAgICAgICAgICAgICdlbmQnICAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmFsdWUnICA6IG9iajJbdmFsdWUyXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7IHJldHVybiBvYmoxIH07XG5cbiAgICByZWQucmVkdWNlciggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0ge1xuXHQgICAgJ29iamVjdCcgOiBhcnJbMF0sXG5cdCAgICAndmFsdWUnICA6IGFyclswXVt2YWx1ZTJdXG5cdH07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnIudmFsdWUpKSB7XG5cdFx0Y3VyciA9IGpvaW4oY3VyciwgYXJyW2ldKTtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIub2JqZWN0KTtcblx0ICAgIGN1cnIub2JqZWN0ID0gYXJyW2ldO1xuXHQgICAgY3Vyci52YWx1ZSA9IGFycltpXS5lbmQ7XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyLm9iamVjdCk7XG5cblx0Ly8gcmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJlZHVjZS5qb2luID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gam9pbjtcblx0fVxuXHRqb2luID0gY2Jhaztcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlMiA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTI7XG5cdH1cblx0dmFsdWUyID0gZmllbGQ7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJldHVybiByZWQ7XG59O1xuXG52YXIgbGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKCk7XG5cbiAgICByZWQucmVkdWNlciAoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IGFyclswXTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGgtMTsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyW3ZhbHVlXSkpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIpO1xuXHQgICAgY3VyciA9IGFycltpXTtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIpO1xuXHRyZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlZDtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2U7XG5tb2R1bGUuZXhwb3J0cy5saW5lID0gbGluZTtcbm1vZHVsZS5leHBvcnRzLmJsb2NrID0gYmxvY2s7XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXRlcmF0b3IgOiBmdW5jdGlvbihpbml0X3ZhbCkge1xuXHR2YXIgaSA9IGluaXRfdmFsIHx8IDA7XG5cdHZhciBpdGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIGkrKztcblx0fTtcblx0cmV0dXJuIGl0ZXI7XG4gICAgfSxcblxuICAgIHNjcmlwdF9wYXRoIDogZnVuY3Rpb24gKHNjcmlwdF9uYW1lKSB7IC8vIHNjcmlwdF9uYW1lIGlzIHRoZSBmaWxlbmFtZVxuXHR2YXIgc2NyaXB0X3NjYXBlZCA9IHNjcmlwdF9uYW1lLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuXHR2YXIgc2NyaXB0X3JlID0gbmV3IFJlZ0V4cChzY3JpcHRfc2NhcGVkICsgJyQnKTtcblx0dmFyIHNjcmlwdF9yZV9zdWIgPSBuZXcgUmVnRXhwKCcoLiopJyArIHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXG5cdC8vIFRPRE86IFRoaXMgcmVxdWlyZXMgcGhhbnRvbS5qcyBvciBhIHNpbWlsYXIgaGVhZGxlc3Mgd2Via2l0IHRvIHdvcmsgKGRvY3VtZW50KVxuXHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0dmFyIHBhdGggPSBcIlwiOyAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHBhdGhcblx0aWYoc2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gc2NyaXB0cykge1xuXHRcdGlmKHNjcmlwdHNbaV0uc3JjICYmIHNjcmlwdHNbaV0uc3JjLm1hdGNoKHNjcmlwdF9yZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdHNbaV0uc3JjLnJlcGxhY2Uoc2NyaXB0X3JlX3N1YiwgJyQxJyk7XG5cdFx0fVxuICAgICAgICAgICAgfVxuXHR9XG5cdHJldHVybiBwYXRoO1xuICAgIH0sXG5cbiAgICBkZWZlcl9jYW5jZWwgOiBmdW5jdGlvbiAoY2JhaywgdGltZSkge1xuXHR2YXIgdGljaztcblxuXHR2YXIgZGVmZXJfY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgY2xlYXJUaW1lb3V0KHRpY2spO1xuXHQgICAgdGljayA9IHNldFRpbWVvdXQoY2JhaywgdGltZSk7XG5cdH07XG5cblx0cmV0dXJuIGRlZmVyX2NhbmNlbDtcbiAgICB9XG59O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHZhciBsO1xuXHQgICAgaWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5fcm9vdF9kaXN0ID0gMDtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGwgPSAwO1xuXHRcdGlmIChkLmJyYW5jaF9sZW5ndGgpIHtcblx0XHQgICAgbCA9IGQuYnJhbmNoX2xlbmd0aFxuXHRcdH1cblx0XHRkLl9yb290X2Rpc3QgPSBsICsgZC5fcGFyZW50Ll9yb290X2Rpc3Q7XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBkYXRhIGNhbid0IGJlIHJld3JpdHRlbiB1c2VkIHRoZSBhcGkgeWV0LiBXZSBuZWVkIGZpbmFsaXplcnNcbiAgICBub2RlLmRhdGEgPSBmdW5jdGlvbihuZXdfZGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkYXRhXG5cdH1cblx0ZGF0YSA9IG5ld19kYXRhO1xuXHRjcmVhdGVfaWRzKCk7XG5cdGxpbmtfcGFyZW50cyhkYXRhKTtcblx0Y29tcHV0ZV9yb290X2Rpc3RzKGRhdGEpO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9O1xuICAgIC8vIFdlIGJpbmQgdGhlIGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWRcbiAgICBub2RlLmRhdGEoZGF0YSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9hbGwnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pKSB7XG5cdFx0bm9kZXMucHVzaCAobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZV9ieV9uYW1lJywgZnVuY3Rpb24obmFtZSwgZGVlcCkge1xuXHRyZXR1cm4gbm9kZS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5ub2RlX25hbWUoKSA9PT0gbmFtZVxuXHR9LCBkZWVwKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0b2dnbGUnLCBmdW5jdGlvbigpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7IC8vIFVuY29sbGFwc2VkIC0+IGNvbGxhcHNlXG5cdFx0dmFyIGhpZGRlbiA9IDA7XG5cdFx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgdmFyIGhpZGRlbl9oZXJlID0gbi5uX2hpZGRlbigpIHx8IDA7XG5cdFx0ICAgIGhpZGRlbiArPSAobi5uX2hpZGRlbigpIHx8IDApICsgMTtcblx0XHR9KTtcblx0XHRub2RlLm5faGlkZGVuIChoaWRkZW4tMSk7XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2UgeyAgICAgICAgICAgICAvLyBDb2xsYXBzZWQgLT4gdW5jb2xsYXBzZVxuXHRcdG5vZGUubl9oaWRkZW4oMCk7XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IGRhdGEuX2NoaWxkcmVuO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSwgZGVlcCk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBsZWF2ZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKG4uaXNfbGVhZihkZWVwKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9LCBkZWVwKTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcywga2VlcF9zaW5nbGV0b25zKSB7XG5cdGlmIChrZWVwX3NpbmdsZXRvbnMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAga2VlcF9zaW5nbGV0b25zID0gZmFsc2U7XG5cdH1cbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXHR2YXIgaXNfc2luZ2xldG9uID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5fY2hpbGRyZW4gPSAwO1xuXHQgICAgaWYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpZCA9IG5vZGVfZGF0YS5jaGlsZHJlbltpXS5faWQ7XG5cdFx0aWYgKG5vZGVfY291bnRzW2lkXSA+IDApIHtcblx0XHQgICAgbl9jaGlsZHJlbisrO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBuX2NoaWxkcmVuID09PSAxO1xuXHR9O1xuXG5cdHZhciBzdWJ0cmVlID0ge307XG5cdGNvcHlfZGF0YSAoZGF0YSwgc3VidHJlZSwgMCwgZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5vZGVfaWQgPSBub2RlX2RhdGEuX2lkO1xuXHQgICAgdmFyIGNvdW50cyA9IG5vZGVfY291bnRzW25vZGVfaWRdO1xuXHQgICAgXG5cdCAgICAvLyBJcyBpbiBwYXRoXG5cdCAgICBpZiAoY291bnRzID4gMCkge1xuXHRcdGlmIChpc19zaW5nbGV0b24obm9kZV9kYXRhKSAmJiAha2VlcF9zaW5nbGV0b25zKSB7XG5cdFx0ICAgIHJldHVybiBmYWxzZTsgXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gSXMgbm90IGluIHBhdGhcblx0ICAgIHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0cmV0dXJuIHRudF9ub2RlKHN1YnRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAob3JpZ19kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25kaXRpb24ob3JpZ19kYXRhKSkge1xuXHQgICAgdmFyIGNvcHkgPSBjb3B5X25vZGUob3JpZ19kYXRhLCBjdXJyQnJhbmNoTGVuZ3RoKTtcblx0ICAgIGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJ0cmVlLmNoaWxkcmVuID0gW107XG5cdCAgICB9XG5cdCAgICBzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YSAob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBjb3B5LCAwLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgY3VyckJyYW5jaExlbmd0aCArPSBvcmlnX2RhdGEuYnJhbmNoX2xlbmd0aCB8fCAwO1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjdXJyQnJhbmNoTGVuZ3RoLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjb3B5X25vZGUgPSBmdW5jdGlvbiAobm9kZV9kYXRhLCBleHRyYUJyYW5jaExlbmd0aCkge1xuXHR2YXIgY29weSA9IHt9O1xuXHQvLyBjb3B5IGFsbCB0aGUgb3duIHByb3BlcnRpZXMgZXhjZXB0cyBsaW5rcyB0byBvdGhlciBub2RlcyBvciBkZXB0aFxuXHRmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0ICAgIGlmICgocGFyYW0gPT09IFwiY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX2NoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9wYXJlbnRcIikgfHxcblx0XHQocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0Y29weVtwYXJhbV0gPSBub2RlX2RhdGFbcGFyYW1dO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoY29weS5icmFuY2hfbGVuZ3RoICE9PSB1bmRlZmluZWQpICYmIChleHRyYUJyYW5jaExlbmd0aCAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgY29weS5icmFuY2hfbGVuZ3RoICs9IGV4dHJhQnJhbmNoTGVuZ3RoO1xuXHR9XG5cdHJldHVybiBjb3B5O1xuICAgIH07XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZsYXR0ZW4nLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChub2RlLmlzX2xlYWYoKSkge1xuXHQgICAgcmV0dXJuIG5vZGU7XG5cdH1cblx0dmFyIGRhdGEgPSBub2RlLmRhdGEoKTtcblx0dmFyIG5ld3Jvb3QgPSBjb3B5X25vZGUoZGF0YSk7XG5cdHZhciBsZWF2ZXMgPSBub2RlLmdldF9hbGxfbGVhdmVzKCk7XG5cdG5ld3Jvb3QuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3cm9vdC5jaGlsZHJlbi5wdXNoKGNvcHlfbm9kZShsZWF2ZXNbaV0uZGF0YSgpKSk7XG5cdH1cblxuXHRyZXR1cm4gdG50X25vZGUobmV3cm9vdCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBvbmx5ICdhcHBseSdzIHRvIG5vbiBjb2xsYXBzZWQgbm9kZXMgKGllIC5fY2hpbGRyZW4gaXMgbm90IHZpc2l0ZWQpXG4gICAgLy8gV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgYW4gZXh0cmEgZmxhZyAodHJ1ZS9mYWxzZSkgdG8gdmlzaXQgYWxzbyBjb2xsYXBzZWQgbm9kZXM/XG4gICAgYXBpLm1ldGhvZCAoJ2FwcGx5JywgZnVuY3Rpb24oY2JhaywgZGVlcCkge1xuXHRpZiAoZGVlcCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBkZWVwID0gZmFsc2U7XG5cdH1cblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuXG5cdGlmICgoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkgJiYgZGVlcCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltqXSk7XG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKGRlZXApIHtcblx0aWYgKGRlZXApIHtcblx0ICAgIHJldHVybiAoKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgJiYgKGRhdGEuX2NoaWxkcmVuID09PSB1bmRlZmluZWQpKTtcblx0fVxuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblxuXHRpZiAoZGF0YS5jaGlsZHJlbikge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoKGRhdGEuX2NoaWxkcmVuKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKSk7XG5cdCAgICB9XG5cdH1cblx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gY2hpbGRyZW47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIHRudF9ub2RlKGRhdGEuX3BhcmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbm9kZTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X25vZGU7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoJ3RudC5hcGknKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUuZGlhZ29uYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGQgPSBmdW5jdGlvbiAoZGlhZ29uYWxQYXRoKSB7XG5cdHZhciBzb3VyY2UgPSBkaWFnb25hbFBhdGguc291cmNlO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZGlhZ29uYWxQYXRoLnRhcmdldDtcbiAgICAgICAgdmFyIG1pZHBvaW50WCA9IChzb3VyY2UueCArIHRhcmdldC54KSAvIDI7XG4gICAgICAgIHZhciBtaWRwb2ludFkgPSAoc291cmNlLnkgKyB0YXJnZXQueSkgLyAyO1xuICAgICAgICB2YXIgcGF0aERhdGEgPSBbc291cmNlLCB7eDogdGFyZ2V0LngsIHk6IHNvdXJjZS55fSwgdGFyZ2V0XTtcblx0cGF0aERhdGEgPSBwYXRoRGF0YS5tYXAoZC5wcm9qZWN0aW9uKCkpO1xuXHRyZXR1cm4gZC5wYXRoKCkocGF0aERhdGEsIHJhZGlhbF9jYWxjLmNhbGwodGhpcyxwYXRoRGF0YSkpXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAoZClcblx0LmdldHNldCAoJ3Byb2plY3Rpb24nKVxuXHQuZ2V0c2V0ICgncGF0aCcpXG4gICAgXG4gICAgdmFyIGNvb3JkaW5hdGVUb0FuZ2xlID0gZnVuY3Rpb24gKGNvb3JkLCByYWRpdXMpIHtcbiAgICAgIFx0dmFyIHdob2xlQW5nbGUgPSAyICogTWF0aC5QSSxcbiAgICAgICAgcXVhcnRlckFuZ2xlID0gd2hvbGVBbmdsZSAvIDRcblx0XG4gICAgICBcdHZhciBjb29yZFF1YWQgPSBjb29yZFswXSA+PSAwID8gKGNvb3JkWzFdID49IDAgPyAxIDogMikgOiAoY29vcmRbMV0gPj0gMCA/IDQgOiAzKSxcbiAgICAgICAgY29vcmRCYXNlQW5nbGUgPSBNYXRoLmFicyhNYXRoLmFzaW4oY29vcmRbMV0gLyByYWRpdXMpKVxuXHRcbiAgICAgIFx0Ly8gU2luY2UgdGhpcyBpcyBqdXN0IGJhc2VkIG9uIHRoZSBhbmdsZSBvZiB0aGUgcmlnaHQgdHJpYW5nbGUgZm9ybWVkXG4gICAgICBcdC8vIGJ5IHRoZSBjb29yZGluYXRlIGFuZCB0aGUgb3JpZ2luLCBlYWNoIHF1YWQgd2lsbCBoYXZlIGRpZmZlcmVudCBcbiAgICAgIFx0Ly8gb2Zmc2V0c1xuICAgICAgXHR2YXIgY29vcmRBbmdsZTtcbiAgICAgIFx0c3dpdGNoIChjb29yZFF1YWQpIHtcbiAgICAgIFx0Y2FzZSAxOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdCAgICBicmVha1xuICAgICAgXHRjYXNlIDI6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlICsgY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgMzpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAyKnF1YXJ0ZXJBbmdsZSArIHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdCAgICBicmVha1xuICAgICAgXHRjYXNlIDQ6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gMypxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZVxuICAgICAgXHR9XG4gICAgICBcdHJldHVybiBjb29yZEFuZ2xlXG4gICAgfTtcblxuICAgIHZhciByYWRpYWxfY2FsYyA9IGZ1bmN0aW9uIChwYXRoRGF0YSkge1xuXHR2YXIgc3JjID0gcGF0aERhdGFbMF07XG5cdHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcblx0dmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuXHR2YXIgcmFkaXVzID0gTWF0aC5zcXJ0KHNyY1swXSpzcmNbMF0gKyBzcmNbMV0qc3JjWzFdKTtcblx0dmFyIHNyY0FuZ2xlID0gY29vcmRpbmF0ZVRvQW5nbGUoc3JjLCByYWRpdXMpO1xuXHR2YXIgbWlkQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShtaWQsIHJhZGl1cyk7XG5cdHZhciBjbG9ja3dpc2UgPSBNYXRoLmFicyhtaWRBbmdsZSAtIHNyY0FuZ2xlKSA+IE1hdGguUEkgPyBtaWRBbmdsZSA8PSBzcmNBbmdsZSA6IG1pZEFuZ2xlID4gc3JjQW5nbGU7XG5cdHJldHVybiB7XG5cdCAgICByYWRpdXMgICA6IHJhZGl1cyxcblx0ICAgIGNsb2Nrd2lzZSA6IGNsb2Nrd2lzZVxuXHR9O1xuICAgIH07XG5cbiAgICByZXR1cm4gZDtcbn07XG5cbi8vIHZlcnRpY2FsIGRpYWdvbmFsIGZvciByZWN0IGJyYW5jaGVzXG50cmVlLmRpYWdvbmFsLnZlcnRpY2FsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXRoID0gZnVuY3Rpb24ocGF0aERhdGEsIG9iaikge1xuXHR2YXIgc3JjID0gcGF0aERhdGFbMF07XG5cdHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcblx0dmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuXHR2YXIgcmFkaXVzID0gMjAwMDAwOyAvLyBOdW1iZXIgbG9uZyBlbm91Z2hcblxuXHRyZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7IFxuXHRcbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7IFxuXHRyZXR1cm4gW2QueSwgZC54XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xufTtcblxudHJlZS5kaWFnb25hbC5yYWRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG4gICAgICBcdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcbiAgICAgIFx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuICAgICAgXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSBvYmoucmFkaXVzO1xuXHR2YXIgY2xvY2t3aXNlID0gb2JqLmNsb2Nrd2lzZTtcblxuXHRpZiAoY2xvY2t3aXNlKSB7XG5cdCAgICByZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7IFxuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIFwiTVwiICsgbWlkICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBzcmMgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0O1xuXHR9XG5cbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gICAgICBcdHZhciByID0gZC55LCBhID0gKGQueCAtIDkwKSAvIDE4MCAqIE1hdGguUEk7XG4gICAgICBcdHJldHVybiBbciAqIE1hdGguY29zKGEpLCByICogTWF0aC5zaW4oYSldO1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmRpYWdvbmFsO1xuIiwidmFyIHRyZWUgPSByZXF1aXJlIChcIi4vdHJlZS5qc1wiKTtcbnRyZWUubGFiZWwgPSByZXF1aXJlKFwiLi9sYWJlbC5qc1wiKTtcbnRyZWUuZGlhZ29uYWwgPSByZXF1aXJlKFwiLi9kaWFnb25hbC5qc1wiKTtcbnRyZWUubGF5b3V0ID0gcmVxdWlyZShcIi4vbGF5b3V0LmpzXCIpO1xudHJlZS5ub2RlX2Rpc3BsYXkgPSByZXF1aXJlKFwiLi9ub2RlX2Rpc3BsYXkuanNcIik7XG4vLyB0cmVlLm5vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcbi8vIHRyZWUucGFyc2VfbmV3aWNrID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2VfbmV3aWNrO1xuLy8gdHJlZS5wYXJzZV9uaHggPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uaHg7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5sYWJlbCA9IGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgd2Ugc2hvdWxkIGJlIHJlbW92aW5nIGJ5IGRlZmF1bHQgcHJldiBsYWJlbHNcbiAgICAvLyBvciBpdCB3b3VsZCBiZSBiZXR0ZXIgdG8gaGF2ZSBhIHNlcGFyYXRlIHJlbW92ZSBtZXRob2QgY2FsbGVkIGJ5IHRoZSB2aXNcbiAgICAvLyBvbiB1cGRhdGVcbiAgICAvLyBXZSBhbHNvIGhhdmUgdGhlIHByb2JsZW0gdGhhdCB3ZSBtYXkgYmUgdHJhbnNpdGlvbmluZyBmcm9tXG4gICAgLy8gdGV4dCB0byBpbWcgbGFiZWxzIGFuZCB3ZSBuZWVkIHRvIHJlbW92ZSB0aGUgbGFiZWwgb2YgYSBkaWZmZXJlbnQgdHlwZVxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSwgbm9kZV9zaXplKSB7XG5cdGlmICh0eXBlb2YgKG5vZGUpICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyhub2RlKTtcbiAgICAgICAgfVxuXG5cdGxhYmVsLmRpc3BsYXkoKS5jYWxsKHRoaXMsIG5vZGUsIGxheW91dF90eXBlKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xhYmVsXCIpXG5cdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHZhciB0ID0gbGFiZWwudHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuXHRcdHJldHVybiBcInRyYW5zbGF0ZSAoXCIgKyAodC50cmFuc2xhdGVbMF0gKyBub2RlX3NpemUpICsgXCIgXCIgKyB0LnRyYW5zbGF0ZVsxXSArIFwiKXJvdGF0ZShcIiArIHQucm90YXRlICsgXCIpXCI7XG5cdCAgICB9KVxuXHQvLyBUT0RPOiB0aGlzIGNsaWNrIGV2ZW50IGlzIHByb2JhYmx5IG5ldmVyIGZpcmVkIHNpbmNlIHRoZXJlIGlzIGFuIG9uY2xpY2sgZXZlbnQgaW4gdGhlIG5vZGUgZyBlbGVtZW50P1xuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKXtcblx0XHRpZiAobGFiZWwub25fY2xpY2soKSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIGQzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdCAgICBsYWJlbC5vbl9jbGljaygpLmNhbGwodGhpcywgbm9kZSk7XG5cdFx0fVxuXHQgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cdC5nZXRzZXQgKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgd2lkdGggY2FsbGJhY2tcIiB9KVxuXHQuZ2V0c2V0ICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBoZWlnaHQgY2FsbGJhY2tcIiB9KVxuXHQuZ2V0c2V0ICgnZGlzcGxheScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgZGlzcGxheSBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIHRyYW5zZm9ybSBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdvbl9jbGljaycpO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuLy8gVGV4dCBiYXNlZCBsYWJlbHNcbnRyZWUubGFiZWwudGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWwgPSB0cmVlLmxhYmVsKCk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuXHQuZ2V0c2V0ICgnZm9udHNpemUnLCAxMClcblx0LmdldHNldCAoJ2NvbG9yJywgXCIjMDAwXCIpXG5cdC5nZXRzZXQgKCd0ZXh0JywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBkLmRhdGEoKS5uYW1lO1xuXHR9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBsID0gZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuXHRcdCAgICByZXR1cm4gKGQueCUzNjAgPCAxODApID8gXCJzdGFydFwiIDogXCJlbmRcIjtcblx0XHR9XG5cdFx0cmV0dXJuIFwic3RhcnRcIjtcblx0ICAgIH0pXG5cdCAgICAudGV4dChmdW5jdGlvbigpe1xuXHRcdHJldHVybiBsYWJlbC50ZXh0KCkobm9kZSlcblx0ICAgIH0pXG5cdCAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGxhYmVsLmZvbnRzaXplKCkgKyBcInB4XCIpXG5cdCAgICAuc3R5bGUoJ2ZpbGwnLCBkMy5mdW5jdG9yKGxhYmVsLmNvbG9yKCkpKG5vZGUpKTtcblxuXHRyZXR1cm4gbDtcbiAgICB9KTtcblxuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBkID0gbm9kZS5kYXRhKCk7XG5cdHZhciB0ID0ge1xuXHQgICAgdHJhbnNsYXRlIDogWzUsIDVdLFxuXHQgICAgcm90YXRlIDogMFxuXHR9O1xuXHRpZiAobGF5b3V0X3R5cGUgPT09IFwicmFkaWFsXCIpIHtcblx0ICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gLSAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5mb250c2l6ZSgpKVxuXHQgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG5cdH1cblx0cmV0dXJuIHQ7XG4gICAgfSk7XG5cblxuICAgIC8vIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyBcdHZhciBkID0gbm9kZS5kYXRhKCk7XG4gICAgLy8gXHRyZXR1cm4gXCJ0cmFuc2xhdGUoMTAgNSlyb3RhdGUoXCIgKyAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApICsgXCIpXCI7XG4gICAgLy8gfSk7XG5cbiAgICBsYWJlbC53aWR0aCAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHN2ZyA9IGQzLnNlbGVjdChcImJvZHlcIilcblx0ICAgIC5hcHBlbmQoXCJzdmdcIilcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIDApXG5cdCAgICAuc3R5bGUoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG5cblx0dmFyIHRleHQgPSBzdmdcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGxhYmVsLmZvbnRzaXplKCkgKyBcInB4XCIpXG5cdCAgICAudGV4dChsYWJlbC50ZXh0KCkobm9kZSkpO1xuXG5cdHZhciB3aWR0aCA9IHRleHQubm9kZSgpLmdldEJCb3goKS53aWR0aDtcblx0c3ZnLnJlbW92ZSgpO1xuXG5cdHJldHVybiB3aWR0aDtcbiAgICB9KTtcblxuICAgIGxhYmVsLmhlaWdodCAoZnVuY3Rpb24gKG5vZGUpIHtcblx0cmV0dXJuIGxhYmVsLmZvbnRzaXplKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBJbWFnZSBiYXNlZCBsYWJlbHNcbnRyZWUubGFiZWwuaW1nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cdC5nZXRzZXQgKCdzcmMnLCBmdW5jdGlvbiAoKSB7fSlcblxuICAgIGxhYmVsLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHRpZiAobGFiZWwuc3JjKCkobm9kZSkpIHtcblx0ICAgIHZhciBsID0gZDMuc2VsZWN0KHRoaXMpXG5cdFx0LmFwcGVuZChcImltYWdlXCIpXG5cdFx0LmF0dHIoXCJ3aWR0aFwiLCBsYWJlbC53aWR0aCgpKCkpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgbGFiZWwuaGVpZ2h0KCkoKSlcblx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgbGFiZWwuc3JjKCkobm9kZSkpO1xuXHQgICAgcmV0dXJuIGw7XG5cdH1cblx0Ly8gZmFsbGJhY2sgdGV4dCBpbiBjYXNlIHRoZSBpbWcgaXMgbm90IGZvdW5kP1xuXHRyZXR1cm4gZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLnRleHQoXCJcIik7XG4gICAgfSk7XG5cbiAgICBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHR2YXIgZCA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgdCA9IHtcblx0ICAgIHRyYW5zbGF0ZSA6IFsxMCwgKC1sYWJlbC5oZWlnaHQoKSgpIC8gMildLFxuXHQgICAgcm90YXRlIDogMFxuXHR9O1xuXHRpZiAobGF5b3V0X3R5cGUgPT09ICdyYWRpYWwnKSB7XG5cdCAgICB0LnRyYW5zbGF0ZVswXSA9IHQudHJhbnNsYXRlWzBdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwud2lkdGgoKSgpKSxcblx0ICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5oZWlnaHQoKSgpKSxcblx0ICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuXHR9XG5cblx0cmV0dXJuIHQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBMYWJlbHMgbWFkZSBvZiAyKyBzaW1wbGUgbGFiZWxzXG50cmVlLmxhYmVsLmNvbXBvc2l0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWxzID0gW107XG5cbiAgICB2YXIgbGFiZWwgPSBmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGN1cnJfeG9mZnNldCA9IDA7XG5cblx0Zm9yICh2YXIgaT0wOyBpPGxhYmVscy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIGRpc3BsYXkgPSBsYWJlbHNbaV07XG5cblx0ICAgIChmdW5jdGlvbiAob2Zmc2V0KSB7XG5cdFx0ZGlzcGxheS50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHRcdCAgICB2YXIgdHN1cGVyID0gZGlzcGxheS5fc3VwZXJfLnRyYW5zZm9ybSgpKG5vZGUsIGxheW91dF90eXBlKTtcblx0XHQgICAgdmFyIHQgPSB7XG5cdFx0XHR0cmFuc2xhdGUgOiBbb2Zmc2V0ICsgdHN1cGVyLnRyYW5zbGF0ZVswXSwgdHN1cGVyLnRyYW5zbGF0ZVsxXV0sXG5cdFx0XHRyb3RhdGUgOiB0c3VwZXIucm90YXRlXG5cdFx0ICAgIH07XG5cdFx0ICAgIHJldHVybiB0O1xuXHRcdH0pXG5cdCAgICB9KShjdXJyX3hvZmZzZXQpO1xuXG5cdCAgICBjdXJyX3hvZmZzZXQgKz0gMTA7XG5cdCAgICBjdXJyX3hvZmZzZXQgKz0gZGlzcGxheS53aWR0aCgpKG5vZGUpO1xuXG5cdCAgICBkaXNwbGF5LmNhbGwodGhpcywgbm9kZSwgbGF5b3V0X3R5cGUpO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cbiAgICBhcGkubWV0aG9kICgnYWRkX2xhYmVsJywgZnVuY3Rpb24gKGRpc3BsYXksIG5vZGUpIHtcblx0ZGlzcGxheS5fc3VwZXJfID0ge307XG5cdGFwaWpzIChkaXNwbGF5Ll9zdXBlcl8pXG5cdCAgICAuZ2V0ICgndHJhbnNmb3JtJywgZGlzcGxheS50cmFuc2Zvcm0oKSk7XG5cblx0bGFiZWxzLnB1c2goZGlzcGxheSk7XG5cdHJldHVybiBsYWJlbDtcbiAgICB9KTtcbiAgICBcbiAgICBhcGkubWV0aG9kICgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgdmFyIHRvdF93aWR0aCA9IDA7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dG90X3dpZHRoICs9IHBhcnNlSW50KGxhYmVsc1tpXS53aWR0aCgpKG5vZGUpKTtcblx0XHR0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLl9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSkudHJhbnNsYXRlWzBdKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHRvdF93aWR0aDtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgbWF4X2hlaWdodCA9IDA7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGN1cnJfaGVpZ2h0ID0gbGFiZWxzW2ldLmhlaWdodCgpKG5vZGUpO1xuXHRcdGlmICggY3Vycl9oZWlnaHQgPiBtYXhfaGVpZ2h0KSB7XG5cdFx0ICAgIG1heF9oZWlnaHQgPSBjdXJyX2hlaWdodDtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbWF4X2hlaWdodDtcblx0fVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5sYWJlbDtcblxuXG4iLCIvLyBCYXNlZCBvbiB0aGUgY29kZSBieSBLZW4taWNoaSBVZWRhIGluIGh0dHA6Ly9ibC5vY2tzLm9yZy9rdWVkYS8xMDM2Nzc2I2QzLnBoeWxvZ3JhbS5qc1xuXG52YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBkaWFnb25hbCA9IHJlcXVpcmUoXCIuL2RpYWdvbmFsLmpzXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5sYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgdmFyIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXG5cdC5zb3J0KG51bGwpXG5cdC52YWx1ZShmdW5jdGlvbiAoZCkge3JldHVybiBkLmxlbmd0aH0gKVxuXHQuc2VwYXJhdGlvbihmdW5jdGlvbiAoKSB7cmV0dXJuIDF9KTtcbiAgICBcbiAgICB2YXIgYXBpID0gYXBpanMgKGwpXG5cdC5nZXRzZXQgKCdzY2FsZScsIHRydWUpXG5cdC5nZXRzZXQgKCdtYXhfbGVhZl9sYWJlbF93aWR0aCcsIDApXG5cdC5tZXRob2QgKFwiY2x1c3RlclwiLCBjbHVzdGVyKVxuXHQubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJ5c2NhbGUgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KVxuXHQubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKCkge3Rocm93IFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIiB9KVxuXHQubWV0aG9kKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHt0aHJvdyBcIndpZHRoIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwifSlcblx0Lm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKCkge3Rocm93IFwiaGVpZ2h0IGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwifSk7XG5cbiAgICBhcGkubWV0aG9kKCdzY2FsZV9icmFuY2hfbGVuZ3RocycsIGZ1bmN0aW9uIChjdXJyKSB7XG5cdGlmIChsLnNjYWxlKCkgPT09IGZhbHNlKSB7XG5cdCAgICByZXR1cm5cblx0fVxuXG5cdHZhciBub2RlcyA9IGN1cnIubm9kZXM7XG5cdHZhciB0cmVlID0gY3Vyci50cmVlO1xuXG5cdHZhciByb290X2Rpc3RzID0gbm9kZXMubWFwIChmdW5jdGlvbiAoZCkge1xuXHQgICAgcmV0dXJuIGQuX3Jvb3RfZGlzdDtcblx0fSk7XG5cblx0dmFyIHlzY2FsZSA9IGwueXNjYWxlKHJvb3RfZGlzdHMpO1xuXHR0cmVlLmFwcGx5IChmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgbm9kZS5wcm9wZXJ0eShcInlcIiwgeXNjYWxlKG5vZGUucm9vdF9kaXN0KCkpKTtcblx0fSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbDtcbn07XG5cbnRyZWUubGF5b3V0LnZlcnRpY2FsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXlvdXQgPSB0cmVlLmxheW91dCgpO1xuICAgIC8vIEVsZW1lbnRzIGxpa2UgJ2xhYmVscycgZGVwZW5kIG9uIHRoZSBsYXlvdXQgdHlwZS4gVGhpcyBleHBvc2VzIGEgd2F5IG9mIGlkZW50aWZ5aW5nIHRoZSBsYXlvdXQgdHlwZVxuICAgIGxheW91dC50eXBlID0gXCJ2ZXJ0aWNhbFwiO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG5cdC5nZXRzZXQgKCd3aWR0aCcsIDM2MClcblx0LmdldCAoJ3RyYW5zbGF0ZV92aXMnLCBbMjAsMjBdKVxuXHQubWV0aG9kICgnZGlhZ29uYWwnLCBkaWFnb25hbC52ZXJ0aWNhbClcblx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIixcIiArIGQueCArIFwiKVwiO1xuXHR9KTtcblxuICAgIGFwaS5tZXRob2QoJ2hlaWdodCcsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICBcdHJldHVybiAocGFyYW1zLm5fbGVhdmVzICogcGFyYW1zLmxhYmVsX2hlaWdodCk7XG4gICAgfSk7IFxuXG4gICAgYXBpLm1ldGhvZCgneXNjYWxlJywgZnVuY3Rpb24gKGRpc3RzKSB7XG4gICAgXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcbiAgICBcdCAgICAuZG9tYWluKFswLCBkMy5tYXgoZGlzdHMpXSlcbiAgICBcdCAgICAucmFuZ2UoWzAsIGxheW91dC53aWR0aCgpIC0gMjAgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKV0pO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnYWRqdXN0X2NsdXN0ZXJfc2l6ZScsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICBcdHZhciBoID0gbGF5b3V0LmhlaWdodChwYXJhbXMpO1xuICAgIFx0dmFyIHcgPSBsYXlvdXQud2lkdGgoKSAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpIC0gbGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSAtIHBhcmFtcy5sYWJlbF9wYWRkaW5nO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZSAoW2gsd10pO1xuICAgIFx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG50cmVlLmxheW91dC5yYWRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSAncmFkaWFsJztcblxuICAgIHZhciBkZWZhdWx0X3dpZHRoID0gMzYwO1xuICAgIHZhciByID0gZGVmYXVsdF93aWR0aCAvIDI7XG5cbiAgICB2YXIgY29uZiA9IHtcbiAgICBcdHdpZHRoIDogMzYwXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGF5b3V0KVxuXHQuZ2V0c2V0IChjb25mKVxuXHQuZ2V0c2V0ICgndHJhbnNsYXRlX3ZpcycsIFtyLCByXSkgLy8gVE9ETzogMS4zIHNob3VsZCBiZSByZXBsYWNlZCBieSBhIHNlbnNpYmxlIHZhbHVlXG5cdC5tZXRob2QgKCd0cmFuc2Zvcm1fbm9kZScsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7XG5cdH0pXG5cdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnJhZGlhbClcblx0Lm1ldGhvZCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbmYud2lkdGggfSk7XG5cbiAgICAvLyBDaGFuZ2VzIGluIHdpZHRoIGFmZmVjdCBjaGFuZ2VzIGluIHJcbiAgICBsYXlvdXQud2lkdGgudHJhbnNmb3JtIChmdW5jdGlvbiAodmFsKSB7XG4gICAgXHRyID0gdmFsIC8gMjtcbiAgICBcdGxheW91dC5jbHVzdGVyLnNpemUoWzM2MCwgcl0pXG4gICAgXHRsYXlvdXQudHJhbnNsYXRlX3Zpcyhbciwgcl0pO1xuICAgIFx0cmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwieXNjYWxlXCIsICBmdW5jdGlvbiAoZGlzdHMpIHtcblx0cmV0dXJuIGQzLnNjYWxlLmxpbmVhcigpXG5cdCAgICAuZG9tYWluKFswLGQzLm1heChkaXN0cyldKVxuXHQgICAgLnJhbmdlKFswLCByXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kIChcImFkanVzdF9jbHVzdGVyX3NpemVcIiwgZnVuY3Rpb24gKHBhcmFtcykge1xuXHRyID0gKGxheW91dC53aWR0aCgpLzIpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSAyMDtcblx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSk7XG5cdHJldHVybiBsYXlvdXQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGF5b3V0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5sYXlvdXQ7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUubm9kZV9kaXNwbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG4gPSBmdW5jdGlvbiAobm9kZSkge1xuXHRuLmRpc3BsYXkoKS5jYWxsKHRoaXMsIG5vZGUpXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobilcblx0LmdldHNldChcInNpemVcIiwgNC41KVxuXHQuZ2V0c2V0KFwiZmlsbFwiLCBcImJsYWNrXCIpXG5cdC5nZXRzZXQoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHQuZ2V0c2V0KFwic3Ryb2tlX3dpZHRoXCIsIFwiMXB4XCIpXG5cdC5nZXRzZXQoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uICgpIHt0aHJvdyBcImRpc3BsYXkgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuY2lyY2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdCAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcblx0ICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LnNxdWFyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdHZhciBzID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG5cdGQzLnNlbGVjdCh0aGlzKVxuXHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAtc1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAtcztcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHMqMjtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBzKjI7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcblx0ICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LnRyaWFuZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwicG9seWdvblwiKVxuXHQgICAgLmF0dHIoXCJwb2ludHNcIiwgKC1zKSArIFwiLDAgXCIgKyBzICsgXCIsXCIgKyAoLXMpICsgXCIgXCIgKyBzICsgXCIsXCIgKyBzKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcblx0ICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbi8vIHRyZWUubm9kZV9kaXNwbGF5LmNvbmQgPSBmdW5jdGlvbiAoKSB7XG4vLyAgICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4vLyAgICAgLy8gY29uZGl0aW9ucyBhcmUgb2JqZWN0cyB3aXRoXG4vLyAgICAgLy8gbmFtZSA6IGEgbmFtZSBmb3IgdGhpcyBkaXNwbGF5XG4vLyAgICAgLy8gY2FsbGJhY2s6IHRoZSBjb25kaXRpb24gdG8gYXBwbHkgKHJlY2VpdmVzIGEgdG50Lm5vZGUpXG4vLyAgICAgLy8gZGlzcGxheTogYSBub2RlX2Rpc3BsYXlcbi8vICAgICB2YXIgY29uZHMgPSBbXTtcblxuLy8gICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcbi8vIFx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcbi8vIFx0Zm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG4vLyBcdCAgICB2YXIgY29uZCA9IGNvbmRzW2ldO1xuLy8gXHQgICAgLy8gRm9yIGVhY2ggbm9kZSwgdGhlIGZpcnN0IGNvbmRpdGlvbiBtZXQgaXMgdXNlZFxuLy8gXHQgICAgaWYgKGNvbmQuY2FsbGJhY2suY2FsbCh0aGlzLCBub2RlKSA9PT0gdHJ1ZSkge1xuLy8gXHRcdGNvbmQuZGlzcGxheS5jYWxsKHRoaXMsIG5vZGUpXG4vLyBcdFx0YnJlYWs7XG4vLyBcdCAgICB9XG4vLyBcdH1cbi8vICAgICB9KVxuXG4vLyAgICAgdmFyIGFwaSA9IGFwaWpzKG4pO1xuXG4vLyAgICAgYXBpLm1ldGhvZChcImFkZFwiLCBmdW5jdGlvbiAobmFtZSwgY2Jhaywgbm9kZV9kaXNwbGF5KSB7XG4vLyBcdGNvbmRzLnB1c2goeyBuYW1lIDogbmFtZSxcbi8vIFx0XHQgICAgIGNhbGxiYWNrIDogY2Jhayxcbi8vIFx0XHQgICAgIGRpc3BsYXkgOiBub2RlX2Rpc3BsYXlcbi8vIFx0XHQgICB9KTtcbi8vIFx0cmV0dXJuIG47XG4vLyAgICAgfSk7XG5cbi8vICAgICBhcGkubWV0aG9kKFwicmVzZXRcIiwgZnVuY3Rpb24gKCkge1xuLy8gXHRjb25kcyA9IFtdO1xuLy8gXHRyZXR1cm4gbjtcbi8vICAgICB9KTtcblxuLy8gICAgIGFwaS5tZXRob2QoXCJ1cGRhdGVcIiwgZnVuY3Rpb24gKG5hbWUsIGNiYWssIG5ld19kaXNwbGF5KSB7XG4vLyBcdGZvciAodmFyIGk9MDsgaTxjb25kcy5sZW5ndGg7IGkrKykge1xuLy8gXHQgICAgaWYgKGNvbmRzW2ldLm5hbWUgPT09IG5hbWUpIHtcbi8vIFx0XHRjb25kc1tpXS5jYWxsYmFjayA9IGNiYWs7XG4vLyBcdFx0Y29uZHNbaV0uZGlzcGxheSA9IG5ld19kaXNwbGF5O1xuLy8gXHQgICAgfVxuLy8gXHR9XG4vLyBcdHJldHVybiBuO1xuLy8gICAgIH0pO1xuXG4vLyAgICAgcmV0dXJuIG47XG5cbi8vIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUubm9kZV9kaXNwbGF5O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdG50X3RyZWVfbm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuXG52YXIgdHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoIChcImNsaWNrXCIsIFwiZGJsY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiKTtcblxuICAgIHZhciBjb25mID0ge1xuXHRkdXJhdGlvbiAgICAgICAgIDogNTAwLCAgICAgIC8vIER1cmF0aW9uIG9mIHRoZSB0cmFuc2l0aW9uc1xuXHRub2RlX2Rpc3BsYXkgICAgIDogdHJlZS5ub2RlX2Rpc3BsYXkuY2lyY2xlKCksXG5cdGxhYmVsICAgICAgICAgICAgOiB0cmVlLmxhYmVsLnRleHQoKSxcblx0bGF5b3V0ICAgICAgICAgICA6IHRyZWUubGF5b3V0LnZlcnRpY2FsKCksXG5cdC8vIG9uX2NsaWNrICAgICAgICAgOiBmdW5jdGlvbiAoKSB7fSxcblx0Ly8gb25fZGJsX2NsaWNrICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuXHQvLyBvbl9tb3VzZW92ZXIgICAgIDogZnVuY3Rpb24gKCkge30sXG5cdGJyYW5jaF9jb2xvciAgICAgICA6ICdibGFjaycsXG5cdGlkICAgICAgICAgICAgICAgOiBcIl9pZFwiXG4gICAgfTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGZvY3VzZWQgbm9kZVxuICAgIC8vIFRPRE86IFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIG11bHRpcGxlIGZvY3VzZWQgbm9kZXM/IChpZSB1c2UgYW4gYXJyYXkpXG4gICAgdmFyIGZvY3VzZWRfbm9kZTtcblxuICAgIC8vIEV4dHJhIGRlbGF5IGluIHRoZSB0cmFuc2l0aW9ucyAoVE9ETzogTmVlZGVkPylcbiAgICB2YXIgZGVsYXkgPSAwO1xuXG4gICAgLy8gRWFzZSBvZiB0aGUgdHJhbnNpdGlvbnNcbiAgICB2YXIgZWFzZSA9IFwiY3ViaWMtaW4tb3V0XCI7XG5cbiAgICAvLyBCeSBub2RlIGRhdGFcbiAgICB2YXIgc3BfY291bnRzID0ge307XG5cbiAgICB2YXIgc2NhbGUgPSBmYWxzZTtcblxuICAgIC8vIFRoZSBpZCBvZiB0aGUgdHJlZSBjb250YWluZXJcbiAgICB2YXIgZGl2X2lkO1xuXG4gICAgLy8gVGhlIHRyZWUgdmlzdWFsaXphdGlvbiAoc3ZnKVxuICAgIHZhciBzdmc7XG4gICAgdmFyIHZpcztcbiAgICB2YXIgbGlua3NfZztcbiAgICB2YXIgbm9kZXNfZztcblxuICAgIC8vIFRPRE86IEZvciBub3csIGNvdW50cyBhcmUgZ2l2ZW4gb25seSBmb3IgbGVhdmVzXG4gICAgLy8gYnV0IGl0IG1heSBiZSBnb29kIHRvIGFsbG93IGNvdW50cyBmb3IgaW50ZXJuYWwgbm9kZXNcbiAgICB2YXIgY291bnRzID0ge307XG5cbiAgICAvLyBUaGUgZnVsbCB0cmVlXG4gICAgdmFyIGJhc2UgPSB7XG5cdHRyZWUgOiB1bmRlZmluZWQsXG5cdGRhdGEgOiB1bmRlZmluZWQsXG5cdG5vZGVzIDogdW5kZWZpbmVkLFxuXHRsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY3VyciB0cmVlLiBOZWVkZWQgdG8gcmUtY29tcHV0ZSB0aGUgbGlua3MgLyBub2RlcyBwb3NpdGlvbnMgb2Ygc3VidHJlZXNcbiAgICB2YXIgY3VyciA9IHtcblx0dHJlZSA6IHVuZGVmaW5lZCxcblx0ZGF0YSA6IHVuZGVmaW5lZCxcblx0bm9kZXMgOiB1bmRlZmluZWQsXG5cdGxpbmtzIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFRoZSBjYmFrIHJldHVybmVkXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGl2KSB7XG5cdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuICAgICAgICB2YXIgdHJlZV9kaXYgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyAgXCJweFwiKSlcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cblx0dmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuXG5cdHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcblxuXHR2YXIgbWF4X2xlYWZfbGFiZWxfbGVuZ3RoID0gZnVuY3Rpb24gKHRyZWUpIHtcblx0ICAgIHZhciBtYXggPSAwO1xuXHQgICAgdmFyIGxlYXZlcyA9IHRyZWUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbGFiZWxfd2lkdGggPSBjb25mLmxhYmVsLndpZHRoKCkobGVhdmVzW2ldKSArIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pO1xuXHRcdGlmIChsYWJlbF93aWR0aCA+IG1heCkge1xuXHRcdCAgICBtYXggPSBsYWJlbF93aWR0aDtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbWF4O1xuXHR9O1xuXG5cdHZhciBtYXhfbGVhZl9ub2RlX2hlaWdodCA9IGZ1bmN0aW9uICh0cmVlKSB7XG5cdCAgICB2YXIgbWF4ID0gMDtcblx0ICAgIHZhciBsZWF2ZXMgPSB0cmVlLmdldF9hbGxfbGVhdmVzKCk7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIG5vZGVfc2l6ZSA9IGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pO1xuXHRcdGlmIChub2RlX3NpemUgPiBtYXgpIHtcblx0XHQgICAgbWF4ID0gbm9kZV9zaXplO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXggKiAyO1xuXHR9O1xuXG5cdHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG5cdGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG5cdHZhciBtYXhfbm9kZV9oZWlnaHQgPSBtYXhfbGVhZl9ub2RlX2hlaWdodChjdXJyLnRyZWUpO1xuXG5cdC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG5cdC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcblx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIG5vZGVzXG5cdHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuXHQgICAgbl9sZWF2ZXMgOiBuX2xlYXZlcyxcblx0ICAgIGxhYmVsX2hlaWdodCA6IGQzLm1heChbZDMuZnVuY3Rvcihjb25mLmxhYmVsLmhlaWdodCgpKSgpLCBtYXhfbm9kZV9oZWlnaHRdKSxcblx0ICAgIGxhYmVsX3BhZGRpbmcgOiAxNVxuXHR9O1xuXG5cdGNvbmYubGF5b3V0LmFkanVzdF9jbHVzdGVyX3NpemUoY2x1c3Rlcl9zaXplX3BhcmFtcyk7XG5cblx0dmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcblx0dmFyIHRyYW5zZm9ybSA9IGNvbmYubGF5b3V0LnRyYW5zZm9ybV9ub2RlO1xuXG5cdHN2ZyA9IHRyZWVfZGl2XG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYubGF5b3V0LndpZHRoKCkpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMClcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cblx0dmlzID0gc3ZnXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9zdF9cIiArIGRpdl9pZClcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsXG5cdFx0ICBcInRyYW5zbGF0ZShcIiArXG5cdFx0ICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgXCIsXCIgK1xuXHRcdCAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzFdICtcblx0XHQgIFwiKVwiKTtcblxuXHRjdXJyLm5vZGVzID0gY2x1c3Rlci5ub2RlcyhjdXJyLmRhdGEpO1xuXHRjb25mLmxheW91dC5zY2FsZV9icmFuY2hfbGVuZ3RocyhjdXJyKTtcblx0Y3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0Ly8gTElOS1Ncblx0Ly8gQWxsIHRoZSBsaW5rcyBhcmUgZ3JvdXBlZCBpbiBhIGcgZWxlbWVudFxuXHRsaW5rc19nID0gdmlzXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtzXCIpO1xuXHRub2Rlc19nID0gdmlzXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVzXCIpO1xuXG5cdC8vdmFyIGxpbmsgPSB2aXNcblx0dmFyIGxpbmsgPSBsaW5rc19nXG5cdCAgICAuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG5cdCAgICAuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtyZXR1cm4gZC50YXJnZXRbY29uZi5pZF19KTtcblxuXHRsaW5rXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInBhdGhcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0ICAgIFx0cmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgZC50YXJnZXQuX2lkO1xuXHQgICAgfSlcblx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKGNvbmYuYnJhbmNoX2NvbG9yKSh0bnRfdHJlZV9ub2RlKGQuc291cmNlKSwgdG50X3RyZWVfbm9kZShkLnRhcmdldCkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblx0Ly8gTk9ERVNcblx0Ly92YXIgbm9kZSA9IHZpc1xuXHR2YXIgbm9kZSA9IG5vZGVzX2dcblx0ICAgIC5zZWxlY3RBbGwoXCJnLnRudF90cmVlX25vZGVcIilcblx0ICAgIC5kYXRhKGN1cnIubm9kZXMsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gZFtjb25mLmlkXX0pO1xuXG5cdHZhciBuZXdfbm9kZSA9IG5vZGVcblx0ICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuXHRcdGlmIChuLmNoaWxkcmVuKSB7XG5cdFx0ICAgIGlmIChuLmRlcHRoID09IDApIHtcblx0XHRcdHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gXCJpbm5lciB0bnRfdHJlZV9ub2RlXCJcblx0XHQgICAgfVxuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBcImxlYWYgdG50X3RyZWVfbm9kZVwiXG5cdFx0fVxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24oZCkge1xuXHRcdHJldHVybiBcInRudF90cmVlX25vZGVfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGQuX2lkXG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtKTtcblxuXHQvLyBkaXNwbGF5IG5vZGUgc2hhcGVcblx0bmV3X25vZGVcblx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHRcdGNvbmYubm9kZV9kaXNwbGF5LmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSlcblx0ICAgIH0pO1xuXG5cdC8vIGRpc3BsYXkgbm9kZSBsYWJlbFxuXHRuZXdfbm9kZVxuXHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG5cdCAgICBcdGNvbmYubGFiZWwuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpLCBjb25mLmxheW91dC50eXBlLCBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkodG50X3RyZWVfbm9kZShkKSkpO1xuXHQgICAgfSk7XG5cbiAgICBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcbiAgICBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcbiAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6aG92ZXJcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgIH0pO1xuICAgIG5ld19ub2RlLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOm1vdXNlb3V0XCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgIH0pO1xuXG5cdC8vIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0Ly8gICAgIGNvbmYub25fY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAvL1xuXHQvLyAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0Ly8gfSk7XG4gICAgLy9cblx0Ly8gbmV3X25vZGUub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vICAgICBjb25mLm9uX21vdXNlb3Zlci5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgIC8vXG5cdC8vICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQvLyB9KTtcbiAgICAvL1xuXHQvLyBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vICAgICBjb25mLm9uX2RibF9jbGljay5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgIC8vXG5cdC8vICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQvLyB9KTtcblxuXG5cdC8vIFVwZGF0ZSBwbG90cyBhbiB1cGRhdGVkIHRyZWVcblx0YXBpLm1ldGhvZCAoJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgdHJlZV9kaXZcblx0XHQuc3R5bGUoXCJ3aWR0aFwiLCAoY29uZi5sYXlvdXQud2lkdGgoKSArIFwicHhcIikpO1xuXHQgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmxheW91dC53aWR0aCgpKTtcblxuXHQgICAgdmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuXHQgICAgdmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcblx0ICAgIHZhciB0cmFuc2Zvcm0gPSBjb25mLmxheW91dC50cmFuc2Zvcm1fbm9kZTtcblxuXHQgICAgdmFyIG1heF9sYWJlbF9sZW5ndGggPSBtYXhfbGVhZl9sYWJlbF9sZW5ndGgoY3Vyci50cmVlKTtcblx0ICAgIGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG5cdCAgICB2YXIgbWF4X25vZGVfaGVpZ2h0ID0gbWF4X2xlYWZfbm9kZV9oZWlnaHQoY3Vyci50cmVlKTtcblxuXHQgICAgLy8gQ2x1c3RlciBzaXplIGlzIHRoZSByZXN1bHQgb2YuLi5cblx0ICAgIC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcblx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgdHJhbnNmb3JtIG9mIHRoZSBub2RlcyAocHJvYmFibHkgYnkgc2VsZWN0aW5nIG9uZSBub2RlIGFzc3VtaW5nIGFsbCB0aGUgbm9kZXMgaGF2ZSB0aGUgc2FtZSB0cmFuc2Zvcm1cblx0ICAgIHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcblx0ICAgIHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuXHRcdG5fbGVhdmVzIDogbl9sZWF2ZXMsXG5cdFx0bGFiZWxfaGVpZ2h0IDogZDMubWF4KFtkMy5mdW5jdG9yKGNvbmYubGFiZWwuaGVpZ2h0KCkpKCksIG1heF9ub2RlX2hlaWdodF0pLFxuXHRcdGxhYmVsX3BhZGRpbmcgOiAxNVxuXHQgICAgfTtcblx0ICAgIGNvbmYubGF5b3V0LmFkanVzdF9jbHVzdGVyX3NpemUoY2x1c3Rlcl9zaXplX3BhcmFtcyk7XG5cblx0ICAgIHN2Z1xuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuZWFzZShlYXNlKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYubGF5b3V0LmhlaWdodChjbHVzdGVyX3NpemVfcGFyYW1zKSArIDMwKTsgLy8gaGVpZ2h0IGlzIGluIHRoZSBsYXlvdXRcblxuXHQgICAgdmlzXG5cdFx0LnRyYW5zaXRpb24oKVxuXHRcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsXG5cdFx0ICAgICAgXCJ0cmFuc2xhdGUoXCIgK1xuXHRcdCAgICAgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSArXG5cdFx0ICAgICAgXCIsXCIgK1xuXHRcdCAgICAgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVsxXSArXG5cdFx0ICAgICAgXCIpXCIpO1xuXG5cdCAgICBjdXJyLm5vZGVzID0gY2x1c3Rlci5ub2RlcyhjdXJyLmRhdGEpO1xuXHQgICAgY29uZi5sYXlvdXQuc2NhbGVfYnJhbmNoX2xlbmd0aHMoY3Vycik7XG5cdCAgICBjdXJyLmxpbmtzID0gY2x1c3Rlci5saW5rcyhjdXJyLm5vZGVzKTtcblxuXHQgICAgLy8gTElOS1Ncblx0ICAgIHZhciBsaW5rID0gbGlua3NfZ1xuXHRcdC5zZWxlY3RBbGwoXCJwYXRoLnRudF90cmVlX2xpbmtcIilcblx0XHQuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtyZXR1cm4gZC50YXJnZXRbY29uZi5pZF19KTtcblxuICAgICAgICAgICAgLy8gTk9ERVNcblx0ICAgIHZhciBub2RlID0gbm9kZXNfZ1xuXHRcdC5zZWxlY3RBbGwoXCJnLnRudF90cmVlX25vZGVcIilcblx0XHQuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7cmV0dXJuIGRbY29uZi5pZF19KTtcblxuXHQgICAgdmFyIGV4aXRfbGluayA9IGxpbmtcblx0XHQuZXhpdCgpXG5cdFx0LnJlbW92ZSgpO1xuXG5cdCAgICBsaW5rXG5cdFx0LmVudGVyKClcblx0XHQuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9saW5rX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLnRhcmdldC5faWQ7XG5cdFx0fSlcblx0XHQuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0XHR9KVxuXHRcdC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblx0ICAgIGxpbmtcblx0ICAgIFx0LnRyYW5zaXRpb24oKVxuXHRcdC5lYXNlKGVhc2UpXG5cdCAgICBcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHQgICAgXHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cblx0ICAgIC8vIE5vZGVzXG5cdCAgICB2YXIgbmV3X25vZGUgPSBub2RlXG5cdFx0LmVudGVyKClcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuXHRcdCAgICBpZiAobi5jaGlsZHJlbikge1xuXHRcdFx0aWYgKG4uZGVwdGggPT0gMCkge1xuXHRcdFx0ICAgIHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0ICAgIHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIlxuXHRcdFx0fVxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCJcblx0XHQgICAgfVxuXHRcdH0pXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZDtcblx0XHR9KVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0ICAgIC8vIEV4aXRpbmcgbm9kZXMgYXJlIGp1c3QgcmVtb3ZlZFxuXHQgICAgbm9kZVxuXHRcdC5leGl0KClcblx0XHQucmVtb3ZlKCk7XG5cbiAgICAgICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIG15X25vZGUpO1xuICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19ub2RlLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOm1vdXNlb3V0XCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG5cblx0ICAgIC8vIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHQvLyBjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgIC8vXG5cdFx0Ly8gdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIC8vIH0pO1xuICAgICAgICAvL1xuXHQgICAgLy8gbmV3X25vZGUub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Ly8gY29uZi5vbl9tb3VzZW92ZXIuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgLy9cblx0XHQvLyB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgLy8gfSk7XG4gICAgICAgIC8vXG5cdCAgICAvLyBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Ly8gY29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgLy9cblx0XHQvLyB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgLy8gfSk7XG5cblxuXHQgICAgLy8gV2UgbmVlZCB0byByZS1jcmVhdGUgYWxsIHRoZSBub2RlcyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcblx0ICAgIG5vZGUuc2VsZWN0QWxsKFwiKlwiKS5yZW1vdmUoKTtcblx0ICAgIG5vZGVcblx0XHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRcdGNvbmYubm9kZV9kaXNwbGF5LmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSlcblx0XHQgICAgfSk7XG5cblx0ICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbGFiZWxzIGFnYWluIGluIGNhc2UgdGhleSBoYXZlIGNoYW5nZWQgbGl2ZWx5IChvciB0aGUgbGF5b3V0KVxuXHQgICAgbm9kZVxuXHRcdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRcdGNvbmYubGFiZWwuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpLCBjb25mLmxheW91dC50eXBlLCBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkodG50X3RyZWVfbm9kZShkKSkpO1xuXHRcdCAgICB9KTtcblxuXHQgICAgbm9kZVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZWFzZShlYXNlKVxuXHRcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAodClcblx0LmdldHNldCAoY29uZilcblxuICAgIC8vIFRPRE86IFJld3JpdGUgZGF0YSB1c2luZyBnZXRzZXQgLyBmaW5hbGl6ZXJzICYgdHJhbnNmb3Jtc1xuICAgIGFwaS5tZXRob2QgKCdkYXRhJywgZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gYmFzZS5kYXRhO1xuXHR9XG5cblx0Ly8gVGhlIG9yaWdpbmFsIGRhdGEgaXMgc3RvcmVkIGFzIHRoZSBiYXNlIGFuZCBjdXJyIGRhdGFcblx0YmFzZS5kYXRhID0gZDtcblx0Y3Vyci5kYXRhID0gZDtcblxuXHQvLyBTZXQgdXAgYSBuZXcgdHJlZSBiYXNlZCBvbiB0aGUgZGF0YVxuXHR2YXIgbmV3dHJlZSA9IHRudF90cmVlX25vZGUoYmFzZS5kYXRhKTtcblxuXHR0LnJvb3QobmV3dHJlZSk7XG5cblx0dHJlZS50cmlnZ2VyKFwiZGF0YTpoYXNDaGFuZ2VkXCIsIGJhc2UuZGF0YSk7XG5cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIHRyZWUgdXNpbmcgZ2V0c2V0IC8gZmluYWxpemVycyAmIHRyYW5zZm9ybXNcbiAgICBhcGkubWV0aG9kICgncm9vdCcsIGZ1bmN0aW9uIChteVRyZWUpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiBjdXJyLnRyZWU7XG4gICAgXHR9XG5cblx0Ly8gVGhlIG9yaWdpbmFsIHRyZWUgaXMgc3RvcmVkIGFzIHRoZSBiYXNlLCBwcmV2IGFuZCBjdXJyIHRyZWVcbiAgICBcdGJhc2UudHJlZSA9IG15VHJlZTtcblx0Y3Vyci50cmVlID0gYmFzZS50cmVlO1xuLy9cdHByZXYudHJlZSA9IGJhc2UudHJlZTtcbiAgICBcdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbiAoY3Vycl9ub2Rlcywga2VlcFNpbmdsZXRvbnMpIHtcblx0dmFyIHN1YnRyZWUgPSBiYXNlLnRyZWUuc3VidHJlZShjdXJyX25vZGVzLCBrZWVwU2luZ2xldG9ucyk7XG5cdGN1cnIuZGF0YSA9IHN1YnRyZWUuZGF0YSgpO1xuXHRjdXJyLnRyZWUgPSBzdWJ0cmVlO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZvY3VzX25vZGUnLCBmdW5jdGlvbiAobm9kZSwga2VlcFNpbmdsZXRvbnMpIHtcblx0Ly8gZmluZFxuXHR2YXIgZm91bmRfbm9kZSA9IHQucm9vdCgpLmZpbmRfbm9kZShmdW5jdGlvbiAobikge1xuXHQgICAgcmV0dXJuIG5vZGUuaWQoKSA9PT0gbi5pZCgpO1xuXHR9KTtcblx0Zm9jdXNlZF9ub2RlID0gZm91bmRfbm9kZTtcblx0dC5zdWJ0cmVlKGZvdW5kX25vZGUuZ2V0X2FsbF9sZWF2ZXMoKSwga2VlcFNpbmdsZXRvbnMpO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2hhc19mb2N1cycsIGZ1bmN0aW9uIChub2RlKSB7XG5cdHJldHVybiAoKGZvY3VzZWRfbm9kZSAhPT0gdW5kZWZpbmVkKSAmJiAoZm9jdXNlZF9ub2RlLmlkKCkgPT09IG5vZGUuaWQoKSkpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3JlbGVhc2VfZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG5cdHQuZGF0YSAoYmFzZS5kYXRhKTtcblx0Zm9jdXNlZF9ub2RlID0gdW5kZWZpbmVkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQgKHQsIGRpc3BhdGNoLCBcIm9uXCIpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcbiIsImFyZ3VtZW50c1s0XVsxNF1bMF0uYXBwbHkoZXhwb3J0cyxhcmd1bWVudHMpIiwiYXJndW1lbnRzWzRdWzE1XVswXS5hcHBseShleHBvcnRzLGFyZ3VtZW50cykiLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGl0ZXJhdG9yIDogZnVuY3Rpb24oaW5pdF92YWwpIHtcblx0dmFyIGkgPSBpbml0X3ZhbCB8fCAwO1xuXHR2YXIgaXRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBpKys7XG5cdH07XG5cdHJldHVybiBpdGVyO1xuICAgIH0sXG5cbiAgICBzY3JpcHRfcGF0aCA6IGZ1bmN0aW9uIChzY3JpcHRfbmFtZSkgeyAvLyBzY3JpcHRfbmFtZSBpcyB0aGUgZmlsZW5hbWVcblx0dmFyIHNjcmlwdF9zY2FwZWQgPSBzY3JpcHRfbmFtZS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcblx0dmFyIHNjcmlwdF9yZSA9IG5ldyBSZWdFeHAoc2NyaXB0X3NjYXBlZCArICckJyk7XG5cdHZhciBzY3JpcHRfcmVfc3ViID0gbmV3IFJlZ0V4cCgnKC4qKScgKyBzY3JpcHRfc2NhcGVkICsgJyQnKTtcblxuXHQvLyBUT0RPOiBUaGlzIHJlcXVpcmVzIHBoYW50b20uanMgb3IgYSBzaW1pbGFyIGhlYWRsZXNzIHdlYmtpdCB0byB3b3JrIChkb2N1bWVudClcblx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdHZhciBwYXRoID0gXCJcIjsgIC8vIERlZmF1bHQgdG8gY3VycmVudCBwYXRoXG5cdGlmKHNjcmlwdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKHZhciBpIGluIHNjcmlwdHMpIHtcblx0XHRpZihzY3JpcHRzW2ldLnNyYyAmJiBzY3JpcHRzW2ldLnNyYy5tYXRjaChzY3JpcHRfcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRzW2ldLnNyYy5yZXBsYWNlKHNjcmlwdF9yZV9zdWIsICckMScpO1xuXHRcdH1cbiAgICAgICAgICAgIH1cblx0fVxuXHRyZXR1cm4gcGF0aDtcbiAgICB9LFxuXG4gICAgZGVmZXJfY2FuY2VsIDogZnVuY3Rpb24gKGNiYWssIHRpbWUpIHtcblx0dmFyIHRpY2s7XG5cblx0dmFyIGRlZmVyX2NhbmNlbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblx0ICAgIHZhciB0aGF0ID0gdGhpcztcblx0ICAgIGNsZWFyVGltZW91dCh0aWNrKTtcblx0ICAgIHRpY2sgPSBzZXRUaW1lb3V0IChmdW5jdGlvbiAoKSB7XG5cdFx0Y2Jhay5hcHBseSAodGhhdCwgYXJncyk7XG5cdCAgICB9LCB0aW1lKTtcblx0fTtcblxuXHRyZXR1cm4gZGVmZXJfY2FuY2VsO1xuICAgIH1cbn07XG4iLCJ2YXIgdG50X3RyZWUgPSByZXF1aXJlKFwidG50LnRyZWVcIik7XG52YXIgdHJlZV90b29sdGlwcyA9IHJlcXVpcmUoXCIuL3Rvb2x0aXBzLmpzXCIpO1xuXG52YXIgZ2VuZUFzc29jaWF0aW9uc1RyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgY29uZmlnID0ge1xuXHRkYXRhIDogdW5kZWZpbmVkLFxuXHRkaWFtZXRlciA6IDEwMDAsXG5cdGN0dHZBcGkgOiB1bmRlZmluZWQsXG5cdGxlZ2VuZFRleHQgOiBcIjx0ZXh0PlNjb3JlIHJhbmdlPC90ZXh0PlwiXG4gICAgfTtcblxuICAgIHZhciB0cmVlVmlzID0gdG50X3RyZWUoKTtcbiAgICB2YXIgdG9vbHRpcHMgPSB0cmVlX3Rvb2x0aXBzKCk7XG5cbiAgICAvLyB2YXIgc2NhbGUgPSBkMy5zY2FsZS5xdWFudGl6ZSgpXG4gICAgLy8gXHQuZG9tYWluKFsxLDFdKVxuICAgIC8vIFx0LnJhbmdlKFtcIiNiMjE4MmJcIiwgXCIjZWY4YTYyXCIsIFwiI2ZkZGJjN1wiLCBcIiNmN2Y3ZjdcIiwgXCIjZDFlNWYwXCIsIFwiIzY3YTljZlwiLCBcIiMyMTY2YWNcIl0pO1xuICAgIHZhciBzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG5cdC5kb21haW4oWzAsMV0pXG5cdC5yYW5nZShbXCIjZmZmZmZmXCIsIFwiIzA4NTE5Y1wiXSk7XG5cbiAgICBmdW5jdGlvbiBzZXRUaXRsZXMgKCkge1xuXHRkMy5zZWxlY3RBbGwoXCIudG50X3RyZWVfbm9kZVwiKVxuXHQgICAgLmFwcGVuZChcInRpdGxlXCIpXG5cdCAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkLmxhYmVsO1xuXHQgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc29ydE5vZGVzICgpIHtcblx0dHJlZVZpcy5yb290KCkuc29ydCAoZnVuY3Rpb24gKG5vZGUxLCBub2RlMikge1xuXHQgICAgcmV0dXJuIG5vZGUyLm5faGlkZGVuKCkgLSBub2RlMS5uX2hpZGRlbigpO1xuXHR9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW5kZXIgKGZsb3dlclZpZXcsIGRpdikge1xuXHR2YXIgZGF0YSA9IGNvbmZpZy5kYXRhO1xuXG4gICAgLy8gbm9kZSBzaGFwZXMgKHNxdWFyZXMgZm9yIFRoZXJhcGV1dGljIGFyZWFzIC8vIGNpcmNsZXMgZm9yIHRoZSByZXN0KVxuICAgIHZhciB0YV9kaXNwbGF5ID0gdG50X3RyZWUubm9kZV9kaXNwbGF5LnNxdWFyZSgpXG4gICAgICAgIC5zaXplKDYpXG4gICAgICAgIC5maWxsIChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjYWxlKG5vZGUucHJvcGVydHkoXCJhc3NvY2lhdGlvbl9zY29yZVwiKSk7XG4gICAgICAgIH0pO1xuICAgIHZhciBub2RlX2Rpc3BsYXkgPSB0bnRfdHJlZS5ub2RlX2Rpc3BsYXkuY2lyY2xlKClcbiAgICAgICAgLnNpemUoOClcbiAgICAgICAgLmZpbGwgKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NhbGUobm9kZS5wcm9wZXJ0eShcImFzc29jaWF0aW9uX3Njb3JlXCIpKTtcbiAgICAgICAgfSk7XG5cdHRyZWVWaXNcblx0ICAgIC5kYXRhKGNvbmZpZy5kYXRhKVxuICAgICAgICAubm9kZV9kaXNwbGF5ICggdG50X3RyZWUubm9kZV9kaXNwbGF5KClcbiAgICAgICAgICAgIC5zaXplKDEyKVxuICAgICAgICAgICAgLmRpc3BsYXkgKGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICAgICAgaWYgKG4ucHJvcGVydHkoJ19fZGVwdGgnKSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0YV9kaXNwbGF5LmRpc3BsYXkoKS5jYWxsKHRoaXMsIG4pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVfZGlzcGxheS5kaXNwbGF5KCkuY2FsbCh0aGlzLCBuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICApXG5cdCAgICAvLyAubm9kZV9kaXNwbGF5KHRudF90cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUoKVxuXHQgICAgLy8gXHRcdCAgLnNpemUoOClcblx0ICAgIC8vIFx0XHQgIC5maWxsKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICAvLyBcdFx0ICAgICAgcmV0dXJuIHNjYWxlKG5vZGUucHJvcGVydHkoXCJhc3NvY2lhdGlvbl9zY29yZVwiKSk7XG5cdCAgICAvLyBcdFx0ICB9KVxuXHQgICAgLy8gXHRcdCApXG5cdCAgICAvLy5vbl9jbGljayhub2RlVG9vbHRpcClcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgdG9vbHRpcHMuY2xpY2spXG4gICAgICAgIC5vbihcIm1vdXNlb3ZlclwiLCB0b29sdGlwcy5tb3VzZW92ZXIpXG4gICAgICAgIC5vbihcIm1vdXNlb3V0XCIsIHRvb2x0aXBzLm1vdXNlb3V0KVxuXHQgICAgLmxhYmVsKHRudF90cmVlLmxhYmVsLnRleHQoKVxuXHRcdCAgIC5oZWlnaHQoMjApXG5cdCAgICBcdCAgIC50ZXh0KGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBcdCAgICAgICBpZiAobm9kZS5pc19sZWFmKCkpIHtcblx0ICAgIFx0XHQgICB2YXIgZGlzZWFzZU5hbWUgPSBub2RlLnByb3BlcnR5KFwibGFiZWxcIik7XG5cdCAgICBcdFx0ICAgaWYgKGRpc2Vhc2VOYW1lICYmIGRpc2Vhc2VOYW1lLmxlbmd0aCA+IDMwKSB7XG5cdCAgICBcdFx0ICAgICAgIGRpc2Vhc2VOYW1lID0gZGlzZWFzZU5hbWUuc3Vic3RyaW5nKDAsMzApICsgXCIuLi5cIjtcblx0ICAgIFx0XHQgICB9XG5cdFx0XHQgICBpZiAobm9kZS5pc19jb2xsYXBzZWQoKSkge1xuXHRcdFx0ICAgICAgIGRpc2Vhc2VOYW1lICs9IChcIiAoK1wiICsgbm9kZS5uX2hpZGRlbigpICsgXCIgZGlzZWFzZXMpXCIpO1xuXHRcdFx0ICAgfVxuXHQgICAgXHRcdCAgIHJldHVybiBkaXNlYXNlTmFtZTtcblx0ICAgIFx0ICAgICAgIH1cblx0ICAgIFx0ICAgICAgIHJldHVybiBcIlwiO1xuXHQgICAgXHQgICB9KVxuXHQgICAgXHQgICAuZm9udHNpemUoMTQpXG5cdCAgICBcdCAgKVxuXHQgICAgLmxheW91dCh0bnRfdHJlZS5sYXlvdXQudmVydGljYWwoKVxuXHQgICAgXHQgICAgLndpZHRoKGNvbmZpZy5kaWFtZXRlcilcblx0ICAgIFx0ICAgIC5zY2FsZSh0cnVlKVxuXHQgICAgXHQgICApO1xuXG4gICAgLy8gQnJhbmNoIGxlbmd0aHM6XG4gICAgLy8gRmlyc3QgcGFzczogR2V0IHRoZSBtYXggZGVwdGg6XG4gICAgdmFyIHNldERlcHRoID0gZnVuY3Rpb24gKG5vZGUsIGN1cnJEZXB0aCkge1xuICAgICAgICBub2RlLnByb3BlcnR5KCdfX2RlcHRoJywgY3VyckRlcHRoKTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbih0cnVlKSB8fCBbXTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzZXREZXB0aChjaGlsZHJlbltpXSwgY3VyckRlcHRoKzEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBzZXREZXB0aCh0cmVlVmlzLnJvb3QoKSwgMCk7XG5cdHZhciB0YXNOb2RlcyA9IHRyZWVWaXMucm9vdCgpLmNoaWxkcmVuKCk7XG4gICAgdmFyIG1heERlcHRoID0gMDtcbiAgICB2YXIgZmluZE1heERlcHRoID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgdmFyIGRlcHRoID0gbi5wcm9wZXJ0eSgnX19kZXB0aCcpO1xuICAgICAgICBpZiAoZGVwdGggPiBtYXhEZXB0aCkge1xuICAgICAgICAgICAgbWF4RGVwdGggPSBkZXB0aDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZm9yICh2YXIgaT0wOyBpPHRhc05vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0YU5vZGUgPSB0YXNOb2Rlc1tpXTtcbiAgICAgICAgdGFOb2RlLmFwcGx5IChmaW5kTWF4RGVwdGgpO1xuICAgIH1cblxuICAgIC8vIFNlY29uZCBwYXNzOiBBcHBseSBicmFuY2ggbGVuZ3Roc1xuICAgIHZhciBzZXRCcmFuY2hMZW5ndGggPSBmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAobi5jaGlsZHJlbigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG4ucHJvcGVydHkoXCJicmFuY2hfbGVuZ3RoXCIsIDEgKyAobWF4RGVwdGggLSBuLnByb3BlcnR5KCdfX2RlcHRoJykpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG4ucHJvcGVydHkoXCJicmFuY2hfbGVuZ3RoXCIsIDEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmb3IgKHZhciBqPTA7IGo8dGFzTm9kZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIHRhTm9kZSA9IHRhc05vZGVzW2pdO1xuICAgICAgICB0YU5vZGUucHJvcGVydHkoXCJicmFuY2hfbGVuZ3RoXCIsIDEpO1xuXG4gICAgICAgIHRhTm9kZS5hcHBseSAoc2V0QnJhbmNoTGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvLyBjb2xsYXBzZSBhbGwgdGhlIHRoZXJhcGV1dGljIGFyZWEgbm9kZXNcblx0Ly8gaWYgKHRhcyAhPT0gdW5kZWZpbmVkKSB7XG5cdC8vICAgICBmb3IgKHZhciBpPTA7IGk8dGFzLmxlbmd0aDsgaSsrKSB7XG5cdC8vIFx0dGFzW2ldLnRvZ2dsZSgpO1xuXHQvLyAgICAgfVxuXHQvLyAgICAgc29ydE5vZGVzKCk7XG5cdC8vIH1cblxuXHR0cmVlVmlzKGRpdi5ub2RlKCkpO1xuXG5cbiAgICAvLyBBcHBseSBhIGxlZ2VuZCBvbiB0aGUgbm9kZSBzaGFwZXNcbiAgICB2YXIgc2hhcGVMZWdlbmREaXYgPSBkaXZcbiAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgXCJ3aWR0aFwiIDogXCI1MCVcIixcbiAgICAgICAgICAgIFwiZGlzcGxheVwiIDogXCJpbmxpbmUtYmxvY2tcIlxuICAgICAgICB9KTtcblxuICAgIHZhciBzID0gc2hhcGVMZWdlbmREaXYuc2VsZWN0QWxsKFwic3BhblwiKVxuICAgICAgICAuZGF0YSAoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwidHlwZVwiIDogXCJzcXVhcmVcIixcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIlRoZXJhcGV1dGljIEFyZWFcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcInR5cGVcIiA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJEaXNlYXNlXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSlcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIxMnB4XCJcbiAgICAgICAgfSk7XG5cbiAgICBzXG4gICAgICAgIC5hcHBlbmQoXCJzcGFuXCIpXG4gICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJibG9ja1wiLFxuICAgICAgICAgICAgXCJ3aWR0aFwiICA6IFwiMTVweFwiLFxuICAgICAgICAgICAgXCJoZWlnaHRcIiA6IFwiMTVweFwiLFxuICAgICAgICAgICAgXCJib3JkZXJcIiA6IFwiMXB4IHNvbGlkICM3NzdcIixcbiAgICAgICAgICAgIFwiZmxvYXRcIiAgOiBcImxlZnRcIixcbiAgICAgICAgfSlcbiAgICAgICAgLnN0eWxlKFwiYm9yZGVyLXJhZGl1c1wiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgaWYgKGQudHlwZSA9PT0gXCJjaXJjbGVcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIjUwJVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH0pXG4gICAgICAgIC5hcHBlbmQoXCJzcGFuXCIpXG4gICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICBcImRpc3BsYXlcIiA6IFwiYmxvY2tcIixcbiAgICAgICAgICAgIFwid2lkdGhcIiAgIDogXCIxMDAlXCIsXG4gICAgICAgICAgICBcImhlaWdodFwiICA6IFwiMTAwJVwiLFxuICAgICAgICAgICAgLy9cImZsb2F0XCIgICA6IFwibGVmdFwiLFxuICAgICAgICB9KTtcbiAgICBzXG4gICAgICAgIC5hcHBlbmQoXCJzcGFuXCIpXG4gICAgICAgIC5zdHlsZSh7XG4gICAgICAgICAgICBcInBhZGRpbmctcmlnaHRcIiA6IFwiNXB4XCIsXG4gICAgICAgICAgICBcInBhZGRpbmctdG9wXCIgICA6IFwiMnB4XCIsXG4gICAgICAgICAgICAvL1wiZmxvYXRcIiAgICAgICAgIDogXCJsZWZ0XCIsXG4gICAgICAgICAgICBcInBhZGRpbmctbGVmdFwiICA6IFwiNXB4XCJcbiAgICAgICAgfSlcbiAgICAgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLmxhYmVsO1xuICAgICAgICB9KTtcblxuXG5cdC8vIEFwcGx5IGEgbGVnZW5kIG9uIHRoZSBub2RlJ3MgY29sb3JcbiAgICB2YXIgbGVnZW5kQmFyID0gZGl2XG4gICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgIFwiZmxvYXRcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICBcIndpZHRoXCIgOiBcIjUwJVwiXG4gICAgICAgIH0pO1xuXG5cdHZhciBsZWdlbmRDb2xvcnMgPSBbXCIjZmZmZmZmXCIsIFwiI2VmZjNmZlwiLCBcIiNiZGQ3ZTdcIiwgXCIjNmJhZWQ2XCIsIFwiIzMxODJiZFwiLCBcIiMwODUxOWNcIl07XG5cbiAgICBsZWdlbmRCYXJcbiAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgIFwiZGlzcGxheVwiIDogXCJibG9ja1wiLFxuICAgICAgICAgICAgXCJmbG9hdFwiICAgOiBcImxlZnRcIixcbiAgICAgICAgICAgIFwicGFkZGluZy1sZWZ0XCIgOiBcIjJweFwiXG4gICAgICAgIH0pXG4gICAgICAgIC50ZXh0KFwiMFwiKTtcblxuICAgIGxlZ2VuZEJhci5zZWxlY3RBbGwoXCIubGVnZW5kQm94XCIpXG4gICAgICAgIC5kYXRhKGxlZ2VuZENvbG9ycylcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZEJveFwiKVxuICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgXCJkaXNwbGF5XCIgOiBcImJsb2NrXCIsXG4gICAgICAgICAgICBcIndpZHRoXCIgOiBcIjIwcHhcIixcbiAgICAgICAgICAgIFwiaGVpZ2h0XCIgOiBcIjIwcHhcIixcbiAgICAgICAgICAgIFwiYm9yZGVyXCIgOiBcIjAuNXB4IHNvbGlkICNGRkZcIixcbiAgICAgICAgICAgIFwiZmxvYXRcIiA6IFwibGVmdFwiLFxuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoXCJiYWNrZ3JvdW5kXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfSk7XG5cbiAgICBsZWdlbmRCYXJcbiAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgLnN0eWxlKHtcbiAgICAgICAgICAgIFwiZGlzcGxheVwiIDogXCJibG9ja1wiLFxuICAgICAgICAgICAgXCJmbG9hdFwiIDogXCJsZWZ0XCIsXG4gICAgICAgICAgICBcInBhZGRpbmctbGVmdFwiIDogXCI1cHhcIixcbiAgICAgICAgfSlcbiAgICAgICAgLnRleHQoXCIxXCIpO1xuICAgIGxlZ2VuZEJhclxuICAgICAgICAuYXBwZW5kKFwic3BhblwiKVxuICAgICAgICAuc3R5bGUoe1xuICAgICAgICAgICAgXCJkaXNwbGF5XCIgOiBcImJsb2NrXCIsXG4gICAgICAgICAgICBcImZsb2F0XCIgOiBcImxlZnRcIixcbiAgICAgICAgICAgIFwicGFkZGluZy1sZWZ0XCIgOiBcIjEwcHhcIixcbiAgICAgICAgfSlcbiAgICAgICAgLmh0bWwgKGNvbmZpZy5sZWdlbmRUZXh0KTtcblxuXHQvLyBBZGQgdGl0bGVzXG5cdHNldFRpdGxlcygpO1xuXHQvLyBkMy5zZWxlY3RBbGwoXCIudG50X3RyZWVfbm9kZVwiKVxuXHQvLyAgICAgLmFwcGVuZChcInRpdGxlXCIpXG5cdC8vICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuXHQvLyBcdHJldHVybiBkLmxhYmVsO1xuXHQvLyAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvLyBkZXBzOiB0cmVlX3ZpcywgZmxvd2VyXG4gICAgdmFyIHRoZW1lID0gZnVuY3Rpb24gKGZsb3dlclZpZXcsIGRpdikge1xuICAgICAgICB0b29sdGlwc1xuICAgICAgICAgICAgLmZsb3dlclZpZXcoZmxvd2VyVmlldylcbiAgICAgICAgICAgIC50YXJnZXQoY29uZmlnLnRhcmdldCk7XG5cblx0dmFyIHZpcyA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuc3R5bGUoXCJwb3NpdGlvblwiLCBcInJlbGF0aXZlXCIpO1xuXG5cdGlmICgoY29uZmlnLmRhdGEgPT09IHVuZGVmaW5lZCkgJiYgKGNvbmZpZy50YXJnZXQgIT09IHVuZGVmaW5lZCkgJiYgKGNvbmZpZy5jdHR2QXBpICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICB2YXIgYXBpID0gY29uZmlnLmN0dHZBcGk7XG5cdCAgICB2YXIgdXJsID0gYXBpLnVybC5hc3NvY2lhdGlvbnMoe1xuXHRcdGdlbmUgOiBjb25maWcudGFyZ2V0LFxuXHRcdGRhdGFzdHJ1Y3R1cmUgOiBcInRyZWVcIixcblx0XHQvLyBUT0RPOiBBZGQgZGF0YXR5cGVzIGhlcmUhXG5cdCAgICB9KTtcblx0ICAgIGFwaS5jYWxsKHVybClcblx0XHQudGhlbiAoZnVuY3Rpb24gKHJlc3ApIHtcblx0XHQgICAgY29uZmlnLmRhdGEgPSByZXNwLmJvZHkuZGF0YTtcblx0XHQgICAgcmVuZGVyKGZsb3dlclZpZXcsIHZpcyk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdCAgICByZW5kZXIoZmxvd2VyVmlldywgdmlzKTtcblx0fVxuICAgIH07XG5cblxuICAgIHRoZW1lLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0dHJlZVZpcy5kYXRhKGNvbmZpZy5kYXRhKTtcblx0Ly8gY29sbGFwc2UgYWxsIHRoZSB0aGVyYXBldXRpYyBhcmVhIG5vZGVzXG5cdC8vIHZhciByb290ID0gdHJlZVZpcy5yb290KCk7XG5cdC8vIHZhciB0YXMgPSByb290LmNoaWxkcmVuKCk7XG5cdC8vIGlmICh0YXMpIHtcblx0Ly8gICAgIGZvciAodmFyIGk9MDsgaTx0YXMubGVuZ3RoOyBpKyspIHtcblx0Ly8gXHR0YXNbaV0udG9nZ2xlKCk7XG5cdC8vICAgICB9XG5cdC8vIH1cblx0c29ydE5vZGVzKCk7XG5cdHRyZWVWaXMudXBkYXRlKCk7XG5cdHNldFRpdGxlcygpO1xuICAgIH07XG5cbiAgICAvLyBzaXplIG9mIHRoZSB0cmVlXG4gICAgdGhlbWUuZGlhbWV0ZXIgPSBmdW5jdGlvbiAoZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25maWcuZGlhbWV0ZXI7XG5cdH1cblx0Y29uZmlnLmRpYW1ldGVyID0gZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vXG4gICAgdGhlbWUudGFyZ2V0ID0gZnVuY3Rpb24gKHQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZmlnLnRhcmdldDtcblx0fVxuXHRjb25maWcudGFyZ2V0ID0gdDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHRoZW1lLmN0dHZBcGkgPSBmdW5jdGlvbiAoYXBpKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy5jdHR2QXBpO1xuXHR9XG5cdGNvbmZpZy5jdHR2QXBpID0gYXBpO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gZGF0YSBpcyBvYmplY3RcbiAgICB0aGVtZS5kYXRhID0gZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZmlnLmRhdGE7XG5cdH1cblx0Y29uZmlnLmRhdGEgPSBkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gZGF0YXR5cGVzXG4gICAgdGhlbWUuZGF0YXR5cGVzID0gZnVuY3Rpb24gKGR0cykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB0b29sdGlwcy5kYXRhdHlwZXMoKTtcblx0fVxuICAgIHRvb2x0aXBzLmRhdGF0eXBlcyhkdHMpO1xuICAgIC8vY29uZmlnLmRhdGF0eXBlcyA9IGR0cztcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vIExlZ2VuZCB0ZXh0XG4gICAgdGhlbWUubGVnZW5kVGV4dCA9IGZ1bmN0aW9uICh0KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy5sZWdlbmRUZXh0O1xuXHR9XG5cdGNvbmZpZy5sZWdlbmRUZXh0ID0gdDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiB0aGVtZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGdlbmVBc3NvY2lhdGlvbnNUcmVlO1xuIiwidmFyIHRudF90b29sdGlwID0gcmVxdWlyZShcInRudC50b29sdGlwXCIpO1xudmFyIGRlZmVyQ2FuY2VsID0gcmVxdWlyZSAoXCJ0bnQudXRpbHNcIikuZGVmZXJfY2FuY2VsO1xuXG52YXIgdG9vbHRpcHMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZmxvd2VyVmlldztcbiAgICB2YXIgdGFyZ2V0O1xuICAgIHZhciBkYXRhdHlwZXM7XG5cbiAgICB2YXIgdCA9IHt9O1xuXG4gICAgdmFyIGhvdmVyX3Rvb2x0aXA7XG4gICAgdmFyIHRvb2x0aXBfd2lkdGggPSAxODA7XG5cbiAgICB2YXIgc2hvd19kZWZlcnJlZCA9IGRlZmVyQ2FuY2VsIChmdW5jdGlvbiAob2JqLCBldikge1xuICAgICAgICBob3Zlcl90b29sdGlwLmNhbGwodGhpcywgb2JqLCBldik7XG4gICAgfSwgMjAwKTtcbiAgICB2YXIgaGlkZV9kZWZlcnJlZCA9IGRlZmVyQ2FuY2VsIChmdW5jdGlvbiAob2JqLCBldikge1xuICAgICAgICBob3Zlcl90b29sdGlwLmNsb3NlKCk7XG4gICAgfSwgMjAwKTtcblxuICAgIHQubW91c2VvdmVyID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIGV2ID0gZDMuZXZlbnQ7XG4gICAgICAgIGhvdmVyX3Rvb2x0aXAgPSB0bnRfdG9vbHRpcC5wbGFpbigpXG4gICAgICAgIC5pZCgyKVxuICAgICAgICAud2lkdGgodG9vbHRpcF93aWR0aClcbiAgICAgICAgLnNob3dfY2xvc2VyKGZhbHNlKVxuICAgICAgICAuYWxsb3dfZHJhZyhmYWxzZSk7XG5cbiAgICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgICBvYmouaGVhZGVyID0gXCJcIjtcbiAgICAgICAgb2JqLmJvZHkgPSBub2RlLnByb3BlcnR5KFwibGFiZWxcIikgKyBcIiAoXCIgKyBub2RlLnByb3BlcnR5KFwiYXNzb2NpYXRpb25fc2NvcmVcIikgKyBcIilcIjtcbiAgICAgICAgc2hvd19kZWZlcnJlZC5jYWxsKHRoaXMsIG9iaiwgZXYpO1xuICAgIH07XG5cbiAgICB0Lm1vdXNlb3V0ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaGlkZV9kZWZlcnJlZCgpO1xuICAgIH07XG5cblxuICAgIHQuY2xpY2sgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgb2JqID0ge307XG4gICAgICAgIHZhciBzY29yZSA9IG5vZGUucHJvcGVydHkoXCJhc3NvY2lhdGlvbl9zY29yZVwiKTtcbiAgICAgICAgb2JqLmhlYWRlciA9IG5vZGUucHJvcGVydHkoXCJsYWJlbFwiKSArIFwiIChBc3NvY2lhdGlvbiBzY29yZTogXCIgKyBzY29yZSArIFwiKVwiO1xuICAgICAgICB2YXIgbG9jID0gXCIjL2V2aWRlbmNlL1wiICsgdGFyZ2V0ICsgXCIvXCIgKyBub2RlLnByb3BlcnR5KFwiZWZvX2NvZGVcIik7XG4gICAgICAgIC8vb2JqLmJvZHk9XCI8ZGl2PjwvZGl2PjxhIGhyZWY9XCIgKyBsb2MgKyBcIj5WaWV3IGV2aWRlbmNlIGRldGFpbHM8L2E+PGJyLz48YSBocmVmPScnPlpvb20gb24gbm9kZTwvYT5cIjtcbiAgICAgICAgb2JqLnJvd3MgPSBbXTtcbiAgICAgICAgb2JqLnJvd3MucHVzaCh7XG4gICAgICAgICAgICB2YWx1ZSA6IFwiPGEgY2xhc3M9Y3R0dl9mbG93ZXJMaW5rIGhyZWY9XCIgKyBsb2MgKyBcIj48ZGl2IGNsYXNzPXRudF9mbG93ZXJWaWV3PjwvZGl2PjwvYT5cIlxuICAgICAgICB9KTtcbiAgICAgICAgb2JqLnJvd3MucHVzaCh7XG4gICAgICAgICAgICB2YWx1ZTogXCI8YSBocmVmPVwiICsgbG9jICsgXCI+VmlldyBldmlkZW5jZSBkZXRhaWxzPC9hPlwiXG4gICAgICAgIH0pO1xuICAgICAgICBvYmoucm93cy5wdXNoKHtcbiAgICAgICAgICAgIHZhbHVlIDogbm9kZS5pc19jb2xsYXBzZWQoKSA/IFwiRXhwYW5kIG5vZGVcIiA6IFwiQ29sbGFwc2Ugbm9kZVwiLFxuICAgICAgICAgICAgbGluayA6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICAgICAgbi50b2dnbGUoKTtcbiAgICAgICAgICAgICAgICB0cmVlVmlzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHNldFRpdGxlcygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9iajogbm9kZVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGRpc2Vhc2VQcm9maWxlTG9jID0gXCIjL2Rpc2Vhc2UvXCIgKyBub2RlLnByb3BlcnR5KFwiZWZvX2NvZGVcIik7XG4gICAgICAgIHZhciBkaXNlYXNlQXNzb2NMb2MgPSBkaXNlYXNlUHJvZmlsZUxvYyArIFwiL2Fzc29jaWF0aW9uc1wiO1xuICAgICAgICBvYmoucm93cy5wdXNoKHtcbiAgICAgICAgICAgIFwidmFsdWVcIiA6IFwiPGEgaHJlZj1cIiArIGRpc2Vhc2VBc3NvY0xvYyArIFwiPjxkaXYgY2xhc3M9J2N0dHZfYXNzb2NpYXRpb25zX2xpbmsnPjwvZGl2PjwvYT48YSBocmVmPVwiICsgZGlzZWFzZVByb2ZpbGVMb2MgKyBcIj48ZGl2IGNsYXNzPSdjdHR2X3Byb2ZpbGVfbGluayc+PC9kaXY+XCJcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvLyBpZiAodHJlZVZpcy5oYXNfZm9jdXMobm9kZSkpIHtcbiAgICAgICAgLy8gXHRvYmoucm93cy5wdXNoKHtcbiAgICAgICAgLy8gXHQgICAgdmFsdWUgOiBcIlJlbGVhc2UgZm9jdXNcIixcbiAgICAgICAgLy8gXHQgICAgbGluayA6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIC8vIFx0XHR0cmVlVmlzLnJlbGVhc2VfZm9jdXMobilcbiAgICAgICAgLy8gXHRcdCAgICAudXBkYXRlKCk7XG4gICAgICAgIC8vIFx0XHQvLyByZS1pbnNlcnQgdGhlIHRpdGxlc1xuICAgICAgICAvLyBcdFx0ZDMuc2VsZWN0QWxsKFwiLnRudF90cmVlX25vZGVcIilcbiAgICAgICAgLy8gXHRcdCAgICAuYXBwZW5kKFwidGl0bGVcIilcbiAgICAgICAgLy8gXHRcdCAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAvLyBcdFx0XHRyZXR1cm4gZC5sYWJlbDtcbiAgICAgICAgLy8gXHRcdCAgICB9KTtcbiAgICAgICAgLy8gXHQgICAgfSxcbiAgICAgICAgLy8gXHQgICAgb2JqIDogbm9kZVxuICAgICAgICAvLyBcdH0pO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyBcdG9iai5yb3dzLnB1c2goe1xuICAgICAgICAvLyBcdCAgICB2YWx1ZTpcIlNldCBmb2N1cyBvbiBub2RlXCIsXG4gICAgICAgIC8vIFx0ICAgIGxpbmsgOiBmdW5jdGlvbiAobikge1xuICAgICAgICAvLyBcdFx0Y29uc29sZS5sb2coXCJTRVQgRk9DVVMgT04gTk9ERTogXCIpO1xuICAgICAgICAvLyBcdFx0Y29uc29sZS5sb2cobi5kYXRhKCkpO1xuICAgICAgICAvLyBcdFx0dHJlZVZpcy5mb2N1c19ub2RlKG4sIHRydWUpXG4gICAgICAgIC8vIFx0XHQgICAgLnVwZGF0ZSgpO1xuICAgICAgICAvLyBcdFx0Ly8gcmUtaW5zZXJ0IHRoZSB0aXRsZXNcbiAgICAgICAgLy8gXHRcdGQzLnNlbGVjdEFsbChcIi50bnRfdHJlZV9ub2RlXCIpXG4gICAgICAgIC8vIFx0XHQgICAgLmFwcGVuZChcInRpdGxlXCIpXG4gICAgICAgIC8vIFx0XHQgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgLy8gXHRcdFx0cmV0dXJuIGQubGFiZWw7XG4gICAgICAgIC8vIFx0XHQgICAgfSk7XG4gICAgICAgIC8vIFx0ICAgIH0sXG4gICAgICAgIC8vIFx0ICAgIG9iajogbm9kZVxuICAgICAgICAvLyBcdH0pO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgdmFyIGxlYWZUb29sdGlwID0gdG50X3Rvb2x0aXAubGlzdCgpXG4gICAgICAgIC5pZCgxKVxuICAgICAgICAud2lkdGgodG9vbHRpcF93aWR0aCk7XG4gICAgICAgIC8vIEhpamFjayB0b29sdGlwJ3MgZmlsbCBjYWxsYmFja1xuICAgICAgICB2YXIgb3JpZ0ZpbGwgPSBsZWFmVG9vbHRpcC5maWxsKCk7XG5cbiAgICAgICAgLy8gUGFzcyBhIG5ldyBmaWxsIGNhbGxiYWNrIHRoYXQgY2FsbHMgdGhlIG9yaWdpbmFsIG9uZSBhbmQgZGVjb3JhdGVzIHdpdGggZmxvd2Vyc1xuICAgICAgICBsZWFmVG9vbHRpcC5maWxsIChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgb3JpZ0ZpbGwuY2FsbCh0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgIHZhciBkdHMgPSBub2RlLnByb3BlcnR5KFwiZGF0YXR5cGVzXCIpO1xuICAgICAgICAgICAgdmFyIGZsb3dlckRhdGEgPSBbXG4gICAgICAgICAgICAgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkdHMsIFwiZ2VuZXRpY19hc3NvY2lhdGlvblwiKS5zY29yZSwgXCJsYWJlbFwiOlwiR2VuZXRpY3NcIiwgXCJhY3RpdmVcIjogaGFzQWN0aXZlRGF0YXR5cGUoXCJnZW5ldGljX2Fzc29jaWF0aW9uXCIsZGF0YXR5cGVzKX0sXG4gICAgICAgICAgICAgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkdHMsIFwic29tYXRpY19tdXRhdGlvblwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlNvbWF0aWNcIiwgXCJhY3RpdmVcIjogaGFzQWN0aXZlRGF0YXR5cGUoXCJzb21hdGljX211dGF0aW9uXCIsIGRhdGF0eXBlcyl9LFxuICAgICAgICAgICAgICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZHRzLCBcImtub3duX2RydWdcIikuc2NvcmUsICBcImxhYmVsXCI6XCJEcnVnc1wiLCBcImFjdGl2ZVwiOiBoYXNBY3RpdmVEYXRhdHlwZShcImtub3duX2RydWdcIiwgZGF0YXR5cGVzKX0sXG4gICAgICAgICAgICAgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkdHMsIFwicm5hX2V4cHJlc3Npb25cIikuc2NvcmUsICBcImxhYmVsXCI6XCJSTkFcIiwgXCJhY3RpdmVcIjogaGFzQWN0aXZlRGF0YXR5cGUoXCJybmFfZXhwcmVzc2lvblwiLCBkYXRhdHlwZXMpfSxcbiAgICAgICAgICAgICAgICB7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGR0cywgXCJhZmZlY3RlZF9wYXRod2F5XCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiUGF0aHdheXNcIiwgXCJhY3RpdmVcIjogaGFzQWN0aXZlRGF0YXR5cGUoXCJhZmZlY3RlZF9wYXRod2F5XCIsIGRhdGF0eXBlcyl9LFxuICAgICAgICAgICAgICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZHRzLCBcImFuaW1hbF9tb2RlbFwiKS5zY29yZSwgIFwibGFiZWxcIjpcIk1vZGVsc1wiLCBcImFjdGl2ZVwiOiBoYXNBY3RpdmVEYXRhdHlwZShcImFuaW1hbF9tb2RlbFwiLCBkYXRhdHlwZXMpfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgZmxvd2VyVmlld1xuICAgICAgICAgICAgICAgIC5kaWFnb25hbCgxNTApXG4gICAgICAgICAgICAgICAgLnZhbHVlcyhmbG93ZXJEYXRhKTtcbiAgICAgICAgICAgIGZsb3dlclZpZXcodGhpcy5zZWxlY3QoXCJkaXYgLnRudF9mbG93ZXJWaWV3XCIpLm5vZGUoKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxlYWZUb29sdGlwLmNhbGwodGhpcywgb2JqKTtcblxuICAgICAgICBmdW5jdGlvbiBsb29rRGF0YXNvdXJjZSAoYXJyLCBkc05hbWUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZHMgPSBhcnJbaV07XG4gICAgICAgICAgICAgICAgaWYgKGRzLmRhdGF0eXBlID09PSBkc05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY291bnRcIjogZHMuZXZpZGVuY2VfY291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInNjb3JlXCI6IGRzLmFzc29jaWF0aW9uX3Njb3JlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBcImNvdW50XCI6IDAsXG4gICAgICAgICAgICAgICAgXCJzY29yZVwiOiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaGFzQWN0aXZlRGF0YXR5cGUgKGNoZWNrRGF0YXR5cGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGRhdGF0eXBlIGluIGRhdGF0eXBlcykge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhdHlwZSA9PT0gY2hlY2tEYXRhdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICB0LmZsb3dlclZpZXcgPSBmdW5jdGlvbiAodmlldykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmbG93ZXJWaWV3O1xuICAgICAgICB9XG4gICAgICAgIGZsb3dlclZpZXcgPSB2aWV3O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdC5kYXRhdHlwZXMgPSBmdW5jdGlvbiAoZHRzKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGF0eXBlcztcbiAgICAgICAgfVxuICAgICAgICBkYXRhdHlwZXMgPSBkdHM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB0LnRhcmdldCA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQgPSB0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5cblxuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0b29sdGlwcztcbiJdfQ==
