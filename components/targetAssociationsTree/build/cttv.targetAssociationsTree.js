(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = geneAssociationsTree = require("./src/targetAssociationsTree.js");

},{"./src/targetAssociationsTree.js":25}],3:[function(require,module,exports){
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
	background_color : "white",
	foreground_color : "black",
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

	// Container element position (needed for "relative" positioned parents)
	// ie has scrollTop and scrollLeft on documentElement instead of body
	// var scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
	// var scrollLeft = (document.documentElement && document.documentElement.scrollLeft) || document.body.scrollLeft;
	// var elemPos = containerElem.getBoundingClientRect();
	// var elemTop = elemPos.top + scrollTop;
	// var elemLeft = elemPos.left + scrollLeft;
	
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
	// var mouse = [d3.event.pageX, d3.event.pageY];
	d3.event = null;

	var offset = 0;
	if (conf.position === "left") {
	    offset = conf.width;
	}
	
	tooltip_div.attr("id", "tnt_tooltip_" + conf.id);
	
	// We place the tooltip
	tooltip_div
	// .style("left", (mouse[0] - offset - elemLeft) + "px")
	// .style("top", mouse[1] - elemTop + "px");
	    .style("left", (d3mouse[0]) + "px")
	    .style("top", (d3mouse[1]) + "px");

	// Close
	if (conf.show_closer) {
	    tooltip_div.append("span")
		.style("position", "absolute")
		.style("right", "-10px")
		.style("top", "-10px")
		.append("img")
		.attr("src", tooltip.images.close)
		.attr("width", "20px")
		.attr("height", "20px")
		.on("click", function () {
		    t.close();
		});
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
	tooltip_div.remove();
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
	obj_info_list
	    .append("tr")
	    .attr("class", "tnt_zmenu_header")
	    .append("th")
	    .text(obj.header);

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
	obj_info_table
	    .append("tr")
	    .attr("class", "tnt_zmenu_header")
	    .append("th")
	    .attr("colspan", 2)
	    .text(obj.header);

	// Tooltip rows
	var table_rows = obj_info_table.selectAll(".tnt_zmenu_row")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "tnt_zmenu_row");

	table_rows
	    .append("th")
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

	obj_info_table
	    .append("tr")
	    .attr("class", "tnt_zmenu_header")
	    .append("th")
	    .text(obj.header);

	obj_info_table
	    .append("tr")
	    .attr("class", "tnt_zmenu_row")
	    .append("td")
	    .style("text-align", "center")
	    .html(obj.body);

    });

    return t;
};

// TODO: This shouldn't be exposed in the API. It would be better to have as a local variable
// or alternatively have the images somewhere else (although the number of hardcoded images should be left at a minimum)
tooltip.images = {};
tooltip.images.close = 'data:image/png;base64,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';

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
  }else if (typeof define === "function") {
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

tree.node_display.cond = function () {
    var n = tree.node_display();

    // conditions are objects with
    // name : a name for this display
    // callback: the condition to apply (receives a tnt.node)
    // display: a node_display
    var conds = [];

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	for (var i=0; i<conds.length; i++) {
	    var cond = conds[i];
	    // For each node, the first condition met is used
	    if (cond.callback.call(this, node) === true) {
		cond.display.call(this, node)
		break;
	    }
	}
    })

    var api = apijs(n);

    api.method("add", function (name, cbak, node_display) {
	conds.push({ name : name,
		     callback : cbak,
		     display : node_display
		   });
	return n;
    });

    api.method("reset", function () {
	conds = [];
	return n;
    });

    api.method("update", function (name, cbak, new_display) {
	for (var i=0; i<conds.length; i++) {
	    if (conds[i].name === name) {
		conds[i].callback = cbak;
		conds[i].display = new_display;
	    }
	}
	return n;
    });

    return n;

};

module.exports = exports = tree.node_display;

},{"tnt.api":11}],24:[function(require,module,exports){
var apijs = require("tnt.api");
var tnt_tree_node = require("tnt.tree.node");

var tree = function () {
    "use strict";

    var conf = {
	duration         : 500,      // Duration of the transitions
	node_display     : tree.node_display.circle(),
	label            : tree.label.text(),
	layout           : tree.layout.vertical(),
	on_click         : function () {},
	on_dbl_click     : function () {},
	on_mouseover     : function () {},
	link_color       : 'black',
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
	var link = vis.selectAll("path.tnt_tree_link")
	    .data(curr.links, function(d){return d.target[conf.id]});
	
	link
	    .enter()
	    .append("path")
	    .attr("class", "tnt_tree_link")
	    .attr("id", function(d) {
	    	return "tnt_tree_link_" + div_id + "_" + d.target._id;
	    })
	    .style("stroke", function (d) {
		return d3.functor(conf.link_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
	    })
	    .attr("d", diagonal);	    

	// NODES
	var node = vis.selectAll("g.tnt_tree_node")
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
	    conf.on_click.call(this, tnt_tree_node(node));

	    tree.trigger("node:click", tnt_tree_node(node));
	});

	new_node.on("mouseenter", function (node) {
	    conf.on_mouseover.call(this, tnt_tree_node(node));

	    tree.trigger("node:hover", tnt_tree_node(node));
	});

	new_node.on("dblclick", function (node) {
	    conf.on_dbl_click.call(this, tnt_tree_node(node));

	    tree.trigger("node:dblclick", tnt_tree_node(node));
	});


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
		label_height : d3.max([d3.functor(conf.label.height())()]),
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
	    var link = vis.selectAll("path.tnt_tree_link")
		.data(curr.links, function(d){return d.target[conf.id]});

            // NODES
	    var node = vis.selectAll("g.tnt_tree_node")
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
		    return d3.functor(conf.link_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
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
		conf.on_click.call(this, tnt_tree_node(node));

		tree.trigger("node:click", tnt_tree_node(node));
	    });

	    new_node.on("mouseenter", function (node) {
		conf.on_mouseover.call(this, tnt_tree_node(node));

		tree.trigger("node:hover", tnt_tree_node(node));
	    });

	    new_node.on("dblclick", function (node) {
		conf.on_dbl_click.call(this, tnt_tree_node(node));

		tree.trigger("node:dblclick", tnt_tree_node(node));
	    });


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

    api.method ('subtree', function (curr_nodes) {
	var subtree = base.tree.subtree(curr_nodes);
	curr.data = subtree.data();
	curr.tree = subtree;

	return this;
    });

    api.method ('focus_node', function (node) {
	// find 
	var found_node = t.root().find_node(function (n) {
	    return node.id() === n.id();
	});
	focused_node = found_node;
	t.subtree(found_node.get_all_leaves());

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

    return t;
};

module.exports = exports = tree;

},{"tnt.api":11,"tnt.tree.node":13}],25:[function(require,module,exports){
var tnt_tree = require("tnt.tree");
var tnt_tooltip = require("tnt.tooltip");

var geneAssociationsTree = function () {
    "use strict";

    var config = {
	data : undefined,
	diameter : 1000,
	cttvApi : undefined
    };
    
    var scale = d3.scale.quantize()
	.domain([-3,3])
	.range(["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"]);

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
    

    function render (flowerView, div) {
	var data = config.data;
	var treeVis = tnt_tree();
    
	// tooltips
	var nodeTooltip = function (node) {
	    var obj = {};
	    var score = node.property("association_score");
	    obj.header = node.property("label") + " (Association score: " + score + ")";
	    var loc = "#/evidence/" + config.target + "/" + node.property("efo_code");
	    //obj.body="<div></div><a href=" + loc + ">View evidence details</a><br/><a href=''>Zoom on node</a>";
	    obj.rows = [];
	    obj.rows.push({
		value : "<a class=cttv_flowerLink href=" + loc + "><div></div></a>"
	    });
	    obj.rows.push({
		value: "<a href=" + loc + ">View evidence details</a>"
	    });
	    obj.rows.push({
		value : node.is_collapsed() ? "Uncollapse children" : "Collapse children",
		link : function (n) {
		    n.toggle();
		    treeVis.update();
		},
		obj: node
	    });

	    if (treeVis.has_focus(node)) {
		obj.rows.push({
		    value : "Release focus",
		    link : function (n) {
			treeVis.release_focus(n)
			    .update();
		    },
		    obj : node
		});
	    } else {
		obj.rows.push({
		    value:"Set focus on node",
		    link : function (n) {
			treeVis.focus_node(n)
			    .update();
		    },
		    obj: node
		});
	    }

	    var t = tnt_tooltip.list()
		.id(1)
		.width(180);
	    // Hijack tooltip's fill callback
	    var origFill = t.fill();

	    // Pass a new fill callback that calls the original one and decorates with flowers
	    t.fill (function (data) {
		origFill.call(this, data);
		var datatypes = node.property("datatypes");
		var flowerData = [
		    {"value":lookDatasource(datatypes, "genetic_association").score,  "label":"Genetics"},
		    {"value":lookDatasource(datatypes, "somatic_mutation").score,  "label":"Somatic"},
		    {"value":lookDatasource(datatypes, "known_drug").score,  "label":"Drugs"},
		    {"value":lookDatasource(datatypes, "rna_expression").score,  "label":"RNA"},
		    {"value":lookDatasource(datatypes, "affected_pathway").score,  "label":"Pathways"},
		    {"value":lookDatasource(datatypes, "animal_model").score,  "label":"Models"}
		]
		flowerView
		    .diagonal(150)
		    .values(flowerData)(this.select("div").node());
	    });

	    t.call(this, obj);
	}

	treeVis
	    .data(config.data)
	    .node_display(tnt_tree.node_display.circle()
	    		  .size(8)
	    		  .fill(function (node) {
	    		      return scale(node.property("association_score"));
	    		  })
	    		 )
	    .on_click(nodeTooltip)
	    .label(tnt_tree.label.text()
	    	   .text(function (node) {
	    	       if (node.is_leaf()) {
	    		   var diseaseName = node.property("label");
	    		   if (diseaseName.length > 30) {
	    		       diseaseName = diseaseName.substring(0,30) + "...";
	    		   }
	    		   return diseaseName
	    	       }
	    	       return "";
	    	   })
	    	   .fontsize(14)
	    	  )
	    .layout(tnt_tree.layout.radial()
	    	    .width(config.diameter)
	    	    .scale(false)
	    	   );

	treeVis(div.node());
	d3.selectAll(".tnt_tree_node")
	    .append("title")
	    .text(function (d) {
		return d.label;
	    });

    }
    
    // deps: tree_vis, flower
    var theme = function (flowerView, div) {
	var vis = d3.select(div)
	    .append("div")
	    .style("position", "relative");

	if ((config.data === undefined) && (config.target !== undefined) && (config.cttvApi !== undefined)) {
	    var api = config.cttvApi;
	    var url = api.url.associations({
		gene : config.target,
		datastructure : "tree"
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

    // size of the tree
    theme.diameter = function (d) {
	if (!arguments.length) {
	    return config.diameter;
	}
	config.diameter = d;
	return this;
    }
    
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

    return theme;
};

module.exports = exports = geneAssociationsTree;

},{"tnt.tooltip":3,"tnt.tree":7}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL2Zha2VfZDBlYTNlMTEuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL3NyYy90b29sdGlwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9yZWR1Y2UuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvdXRpbHMuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvc3JjL25vZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL2RpYWdvbmFsLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGFiZWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL2xheW91dC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRBc3NvY2lhdGlvbnNUcmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbm9kZV9kaXNwbGF5LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy90cmVlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEFzc29jaWF0aW9uc1RyZWUvc3JjL3RhcmdldEFzc29jaWF0aW9uc1RyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBOzs7Ozs7QUNEQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCIvLyBpZiAodHlwZW9mIGJ1YmJsZXNWaWV3ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldyA9IHt9XG4vLyB9XG4vLyBidWJibGVzVmlldy5idWJibGVzVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9idWJibGVzVmlldy5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZ2VuZUFzc29jaWF0aW9uc1RyZWUgPSByZXF1aXJlKFwiLi9zcmMvdGFyZ2V0QXNzb2NpYXRpb25zVHJlZS5qc1wiKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gdG9vbHRpcCA9IHJlcXVpcmUoXCIuL3NyYy90b29sdGlwLmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvYXBpLmpzXCIpO1xuIiwidmFyIGFwaSA9IGZ1bmN0aW9uICh3aG8pIHtcblxuICAgIHZhciBfbWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG0gPSBbXTtcblxuXHRtLmFkZF9iYXRjaCA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgIG0udW5zaGlmdChvYmopO1xuXHR9O1xuXG5cdG0udXBkYXRlID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdG1baV1bcF0gPSB2YWx1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdG0uYWRkID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGlmIChtLnVwZGF0ZSAobWV0aG9kLCB2YWx1ZSkgKSB7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciByZWcgPSB7fTtcblx0XHRyZWdbbWV0aG9kXSA9IHZhbHVlO1xuXHRcdG0uYWRkX2JhdGNoIChyZWcpO1xuXHQgICAgfVxuXHR9O1xuXG5cdG0uZ2V0ID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0cmV0dXJuIG1baV1bcF07XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH07XG5cblx0cmV0dXJuIG07XG4gICAgfTtcblxuICAgIHZhciBtZXRob2RzICAgID0gX21ldGhvZHMoKTtcbiAgICB2YXIgYXBpID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBhcGkuY2hlY2sgPSBmdW5jdGlvbiAobWV0aG9kLCBjaGVjaywgbXNnKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS5jaGVjayhtZXRob2RbaV0sIGNoZWNrLCBtc2cpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0uY2hlY2soY2hlY2ssIG1zZyk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChtZXRob2QsIGNiYWspIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLnRyYW5zZm9ybSAobWV0aG9kW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC50cmFuc2Zvcm0gKGNiYWspO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0udHJhbnNmb3JtKGNiYWspO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHZhciBhdHRhY2hfbWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCwgb3B0cykge1xuXHR2YXIgY2hlY2tzID0gW107XG5cdHZhciB0cmFuc2Zvcm1zID0gW107XG5cblx0dmFyIGdldHRlciA9IG9wdHMub25fZ2V0dGVyIHx8IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBtZXRob2RzLmdldChtZXRob2QpO1xuXHR9O1xuXG5cdHZhciBzZXR0ZXIgPSBvcHRzLm9uX3NldHRlciB8fCBmdW5jdGlvbiAoeCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYW5zZm9ybXMubGVuZ3RoOyBpKyspIHtcblx0XHR4ID0gdHJhbnNmb3Jtc1tpXSh4KTtcblx0ICAgIH1cblxuXHQgICAgZm9yICh2YXIgaj0wOyBqPGNoZWNrcy5sZW5ndGg7IGorKykge1xuXHRcdGlmICghY2hlY2tzW2pdLmNoZWNrKHgpKSB7XG5cdFx0ICAgIHZhciBtc2cgPSBjaGVja3Nbal0ubXNnIHx8IFxuXHRcdFx0KFwiVmFsdWUgXCIgKyB4ICsgXCIgZG9lc24ndCBzZWVtIHRvIGJlIHZhbGlkIGZvciB0aGlzIG1ldGhvZFwiKTtcblx0XHQgICAgdGhyb3cgKG1zZyk7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgbWV0aG9kcy5hZGQobWV0aG9kLCB4KTtcblx0fTtcblxuXHR2YXIgbmV3X21ldGhvZCA9IGZ1bmN0aW9uIChuZXdfdmFsKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gZ2V0dGVyKCk7XG5cdCAgICB9XG5cdCAgICBzZXR0ZXIobmV3X3ZhbCk7XG5cdCAgICByZXR1cm4gd2hvOyAvLyBSZXR1cm4gdGhpcz9cblx0fTtcblx0bmV3X21ldGhvZC5jaGVjayA9IGZ1bmN0aW9uIChjYmFrLCBtc2cpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBjaGVja3M7XG5cdCAgICB9XG5cdCAgICBjaGVja3MucHVzaCAoe2NoZWNrIDogY2Jhayxcblx0XHRcdCAgbXNnICAgOiBtc2d9KTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXHRuZXdfbWV0aG9kLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gdHJhbnNmb3Jtcztcblx0ICAgIH1cblx0ICAgIHRyYW5zZm9ybXMucHVzaChjYmFrKTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHdob1ttZXRob2RdID0gbmV3X21ldGhvZDtcbiAgICB9O1xuXG4gICAgdmFyIGdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgb3B0cykge1xuXHRpZiAodHlwZW9mIChwYXJhbSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtZXRob2RzLmFkZF9iYXRjaCAocGFyYW0pO1xuXHQgICAgZm9yICh2YXIgcCBpbiBwYXJhbSkge1xuXHRcdGF0dGFjaF9tZXRob2QgKHAsIG9wdHMpO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgbWV0aG9kcy5hZGQgKHBhcmFtLCBvcHRzLmRlZmF1bHRfdmFsdWUpO1xuXHQgICAgYXR0YWNoX21ldGhvZCAocGFyYW0sIG9wdHMpO1xuXHR9XG4gICAgfTtcblxuICAgIGFwaS5nZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmfSk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLmdldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9zZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgZ2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBzZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fc2V0dGVyIDogb25fc2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5zZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fZ2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIHNldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgZ2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX2dldHRlciA6IG9uX2dldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kID0gZnVuY3Rpb24gKG5hbWUsIGNiYWspIHtcblx0aWYgKHR5cGVvZiAobmFtZSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBmb3IgKHZhciBwIGluIG5hbWUpIHtcblx0XHR3aG9bcF0gPSBuYW1lW3BdO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgd2hvW25hbWVdID0gY2Jhaztcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXBpO1xuICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYXBpOyIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xuXG52YXIgdG9vbHRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpO1xuICAgIHZhciB0b29sdGlwX2RpdjtcblxuICAgIHZhciBjb25mID0ge1xuXHRiYWNrZ3JvdW5kX2NvbG9yIDogXCJ3aGl0ZVwiLFxuXHRmb3JlZ3JvdW5kX2NvbG9yIDogXCJibGFja1wiLFxuXHRwb3NpdGlvbiA6IFwicmlnaHRcIixcblx0YWxsb3dfZHJhZyA6IHRydWUsXG5cdHNob3dfY2xvc2VyIDogdHJ1ZSxcblx0ZmlsbCA6IGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJmaWxsIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiOyB9LFxuXHR3aWR0aCA6IDE4MCxcblx0aWQgOiAxXG4gICAgfTtcblxuICAgIHZhciB0ID0gZnVuY3Rpb24gKGRhdGEsIGV2ZW50KSB7XG5cdGRyYWdcblx0ICAgIC5vcmlnaW4oZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4ge3g6cGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwibGVmdFwiKSksXG5cdFx0XHR5OnBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcInRvcFwiKSlcblx0XHQgICAgICAgfTtcblx0ICAgIH0pXG5cdCAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKCkge1xuXHRcdGlmIChjb25mLmFsbG93X2RyYWcpIHtcblx0XHQgICAgZDMuc2VsZWN0KHRoaXMpXG5cdFx0XHQuc3R5bGUoXCJsZWZ0XCIsIGQzLmV2ZW50LnggKyBcInB4XCIpXG5cdFx0XHQuc3R5bGUoXCJ0b3BcIiwgZDMuZXZlbnQueSArIFwicHhcIik7XG5cdFx0fVxuXHQgICAgfSk7XG5cblx0Ly8gVE9ETzogV2h5IGRvIHdlIG5lZWQgdGhlIGRpdiBlbGVtZW50P1xuXHQvLyBJdCBsb29rcyBsaWtlIGlmIHdlIGFuY2hvciB0aGUgdG9vbHRpcCBpbiB0aGUgXCJib2R5XCJcblx0Ly8gVGhlIHRvb2x0aXAgaXMgbm90IGxvY2F0ZWQgaW4gdGhlIHJpZ2h0IHBsYWNlIChhcHBlYXJzIGF0IHRoZSBib3R0b20pXG5cdC8vIFNlZSBjbGllbnRzL3Rvb2x0aXBzX3Rlc3QuaHRtbCBmb3IgYW4gZXhhbXBsZVxuXHR2YXIgY29udGFpbmVyRWxlbSA9IHNlbGVjdEFuY2VzdG9yICh0aGlzLCBcImRpdlwiKTtcblx0aWYgKGNvbnRhaW5lckVsZW0gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgLy8gV2UgcmVxdWlyZSBhIGRpdiBlbGVtZW50IGF0IHNvbWUgcG9pbnQgdG8gYW5jaG9yIHRoZSB0b29sdGlwXG5cdCAgICByZXR1cm47XG5cdH1cblxuXHQvLyBDb250YWluZXIgZWxlbWVudCBwb3NpdGlvbiAobmVlZGVkIGZvciBcInJlbGF0aXZlXCIgcG9zaXRpb25lZCBwYXJlbnRzKVxuXHQvLyBpZSBoYXMgc2Nyb2xsVG9wIGFuZCBzY3JvbGxMZWZ0IG9uIGRvY3VtZW50RWxlbWVudCBpbnN0ZWFkIG9mIGJvZHlcblx0Ly8gdmFyIHNjcm9sbFRvcCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3A7XG5cdC8vIHZhciBzY3JvbGxMZWZ0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCkgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0O1xuXHQvLyB2YXIgZWxlbVBvcyA9IGNvbnRhaW5lckVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdC8vIHZhciBlbGVtVG9wID0gZWxlbVBvcy50b3AgKyBzY3JvbGxUb3A7XG5cdC8vIHZhciBlbGVtTGVmdCA9IGVsZW1Qb3MubGVmdCArIHNjcm9sbExlZnQ7XG5cdFxuXHR0b29sdGlwX2RpdiA9IGQzLnNlbGVjdChjb250YWluZXJFbGVtKVxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90b29sdGlwXCIpXG5cdCAgICAuY2xhc3NlZChcInRudF90b29sdGlwX2FjdGl2ZVwiLCB0cnVlKSAgLy8gVE9ETzogSXMgdGhpcyBuZWVkZWQvdXNlZD8/P1xuXHQgICAgLmNhbGwoZHJhZyk7XG5cblx0Ly8gcHJldiB0b29sdGlwcyB3aXRoIHRoZSBzYW1lIGhlYWRlclxuXHRkMy5zZWxlY3QoXCIjdG50X3Rvb2x0aXBfXCIgKyBjb25mLmlkKS5yZW1vdmUoKTtcblxuXHRpZiAoKGQzLmV2ZW50ID09PSBudWxsKSAmJiAoZXZlbnQpKSB7XG5cdCAgICBkMy5ldmVudCA9IGV2ZW50O1xuXHR9XG5cdHZhciBkM21vdXNlID0gZDMubW91c2UoY29udGFpbmVyRWxlbSk7XG5cdC8vIHZhciBtb3VzZSA9IFtkMy5ldmVudC5wYWdlWCwgZDMuZXZlbnQucGFnZVldO1xuXHRkMy5ldmVudCA9IG51bGw7XG5cblx0dmFyIG9mZnNldCA9IDA7XG5cdGlmIChjb25mLnBvc2l0aW9uID09PSBcImxlZnRcIikge1xuXHQgICAgb2Zmc2V0ID0gY29uZi53aWR0aDtcblx0fVxuXHRcblx0dG9vbHRpcF9kaXYuYXR0cihcImlkXCIsIFwidG50X3Rvb2x0aXBfXCIgKyBjb25mLmlkKTtcblx0XG5cdC8vIFdlIHBsYWNlIHRoZSB0b29sdGlwXG5cdHRvb2x0aXBfZGl2XG5cdC8vIC5zdHlsZShcImxlZnRcIiwgKG1vdXNlWzBdIC0gb2Zmc2V0IC0gZWxlbUxlZnQpICsgXCJweFwiKVxuXHQvLyAuc3R5bGUoXCJ0b3BcIiwgbW91c2VbMV0gLSBlbGVtVG9wICsgXCJweFwiKTtcblx0ICAgIC5zdHlsZShcImxlZnRcIiwgKGQzbW91c2VbMF0pICsgXCJweFwiKVxuXHQgICAgLnN0eWxlKFwidG9wXCIsIChkM21vdXNlWzFdKSArIFwicHhcIik7XG5cblx0Ly8gQ2xvc2Vcblx0aWYgKGNvbmYuc2hvd19jbG9zZXIpIHtcblx0ICAgIHRvb2x0aXBfZGl2LmFwcGVuZChcInNwYW5cIilcblx0XHQuc3R5bGUoXCJwb3NpdGlvblwiLCBcImFic29sdXRlXCIpXG5cdFx0LnN0eWxlKFwicmlnaHRcIiwgXCItMTBweFwiKVxuXHRcdC5zdHlsZShcInRvcFwiLCBcIi0xMHB4XCIpXG5cdFx0LmFwcGVuZChcImltZ1wiKVxuXHRcdC5hdHRyKFwic3JjXCIsIHRvb2x0aXAuaW1hZ2VzLmNsb3NlKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgXCIyMHB4XCIpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgXCIyMHB4XCIpXG5cdFx0Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuXHRcdCAgICB0LmNsb3NlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRjb25mLmZpbGwuY2FsbCh0b29sdGlwX2RpdiwgZGF0YSk7XG5cblx0Ly8gcmV0dXJuIHRoaXMgaGVyZT9cblx0cmV0dXJuIHQ7XG4gICAgfTtcblxuICAgIC8vIGdldHMgdGhlIGZpcnN0IGFuY2VzdG9yIG9mIGVsZW0gaGF2aW5nIHRhZ25hbWUgXCJ0eXBlXCJcbiAgICAvLyBleGFtcGxlIDogdmFyIG15ZGl2ID0gc2VsZWN0QW5jZXN0b3IobXllbGVtLCBcImRpdlwiKTtcbiAgICBmdW5jdGlvbiBzZWxlY3RBbmNlc3RvciAoZWxlbSwgdHlwZSkge1xuXHR0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXHRpZiAoZWxlbS5wYXJlbnROb2RlID09PSBudWxsKSB7XG5cdCAgICBjb25zb2xlLmxvZyhcIk5vIG1vcmUgcGFyZW50c1wiKTtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0dmFyIHRhZ05hbWUgPSBlbGVtLnBhcmVudE5vZGUudGFnTmFtZTtcblxuXHRpZiAoKHRhZ05hbWUgIT09IHVuZGVmaW5lZCkgJiYgKHRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gdHlwZSkpIHtcblx0ICAgIHJldHVybiBlbGVtLnBhcmVudE5vZGU7XG5cdH0gZWxzZSB7XG5cdCAgICByZXR1cm4gc2VsZWN0QW5jZXN0b3IgKGVsZW0ucGFyZW50Tm9kZSwgdHlwZSk7XG5cdH1cbiAgICB9XG4gICAgXG4gICAgdmFyIGFwaSA9IGFwaWpzKHQpXG5cdC5nZXRzZXQoY29uZik7XG4gICAgYXBpLmNoZWNrKCdwb3NpdGlvbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0cmV0dXJuICh2YWwgPT09ICdsZWZ0JykgfHwgKHZhbCA9PT0gJ3JpZ2h0Jyk7XG4gICAgfSwgXCJPbmx5ICdsZWZ0JyBvciAncmlnaHQnIHZhbHVlcyBhcmUgYWxsb3dlZCBmb3IgcG9zaXRpb25cIik7XG5cbiAgICBhcGkubWV0aG9kKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcblx0dG9vbHRpcF9kaXYucmVtb3ZlKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAubGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaXN0IHRvb2x0aXAgaXMgYmFzZWQgb24gZ2VuZXJhbCB0b29sdGlwc1xuICAgIHZhciB0ID0gdG9vbHRpcCgpO1xuICAgIHZhciB3aWR0aCA9IDE4MDtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXHR2YXIgb2JqX2luZm9fbGlzdCA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gVG9vbHRpcCBoZWFkZXJcblx0b2JqX2luZm9fbGlzdFxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuXHQgICAgLmFwcGVuZChcInRoXCIpXG5cdCAgICAudGV4dChvYmouaGVhZGVyKTtcblxuXHQvLyBUb29sdGlwIHJvd3Ncblx0dmFyIHRhYmxlX3Jvd3MgPSBvYmpfaW5mb19saXN0LnNlbGVjdEFsbChcIi50bnRfem1lbnVfcm93XCIpXG5cdCAgICAuZGF0YShvYmoucm93cylcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfcm93XCIpO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLnN0eWxlKFwidGV4dC1hbGlnblwiLCBcImNlbnRlclwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0cmV0dXJuIG9iai5yb3dzW2ldLnZhbHVlO1xuXHQgICAgfSlcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQubGluayA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIC5jbGFzc2VkKFwibGlua1wiLCAxKVxuXHRcdCAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdGQubGluayhkLm9iaik7XG5cdFx0XHR0LmNsb3NlLmNhbGwodGhpcyk7XG5cdFx0ICAgIH0pO1xuXHQgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLnRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHRhYmxlIHRvb2x0aXBzIGFyZSBiYXNlZCBvbiBnZW5lcmFsIHRvb2x0aXBzXG4gICAgdmFyIHQgPSB0b29sdGlwKCk7XG4gICAgXG4gICAgdmFyIHdpZHRoID0gMTgwO1xuXG4gICAgdC5maWxsIChmdW5jdGlvbiAob2JqKSB7XG5cdHZhciB0b29sdGlwX2RpdiA9IHRoaXM7XG5cblx0dmFyIG9ial9pbmZvX3RhYmxlID0gdG9vbHRpcF9kaXZcblx0ICAgIC5hcHBlbmQoXCJ0YWJsZVwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudVwiKVxuXHQgICAgLmF0dHIoXCJib3JkZXJcIiwgXCJzb2xpZFwiKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgdC53aWR0aCgpICsgXCJweFwiKTtcblxuXHQvLyBUb29sdGlwIGhlYWRlclxuXHRvYmpfaW5mb190YWJsZVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuXHQgICAgLmFwcGVuZChcInRoXCIpXG5cdCAgICAuYXR0cihcImNvbHNwYW5cIiwgMilcblx0ICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuXG5cdC8vIFRvb2x0aXAgcm93c1xuXHR2YXIgdGFibGVfcm93cyA9IG9ial9pbmZvX3RhYmxlLnNlbGVjdEFsbChcIi50bnRfem1lbnVfcm93XCIpXG5cdCAgICAuZGF0YShvYmoucm93cylcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfcm93XCIpO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0cmV0dXJuIG9iai5yb3dzW2ldLmxhYmVsO1xuXHQgICAgfSk7XG5cblx0dGFibGVfcm93c1xuXHQgICAgLmFwcGVuZChcInRkXCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbihkLGkpIHtcblx0XHRpZiAodHlwZW9mIG9iai5yb3dzW2ldLnZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0ICAgIG9iai5yb3dzW2ldLnZhbHVlLmNhbGwodGhpcywgZCk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgcmV0dXJuIG9iai5yb3dzW2ldLnZhbHVlO1xuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmxpbmsgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKVxuXHRcdCAgICAuY2xhc3NlZChcImxpbmtcIiwgMSlcblx0XHQgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRkLmxpbmsoZC5vYmopO1xuXHRcdFx0dC5jbG9zZS5jYWxsKHRoaXMpO1xuXHRcdCAgICB9KTtcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLnBsYWluID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHBsYWluIHRvb2x0aXBzIGFyZSBiYXNlZCBvbiBnZW5lcmFsIHRvb2x0aXBzXG4gICAgdmFyIHQgPSB0b29sdGlwKCk7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblxuXHR2YXIgb2JqX2luZm9fdGFibGUgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdG9ial9pbmZvX3RhYmxlXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfaGVhZGVyXCIpXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuXG5cdG9ial9pbmZvX3RhYmxlXG5cdCAgICAuYXBwZW5kKFwidHJcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVfcm93XCIpXG5cdCAgICAuYXBwZW5kKFwidGRcIilcblx0ICAgIC5zdHlsZShcInRleHQtYWxpZ25cIiwgXCJjZW50ZXJcIilcblx0ICAgIC5odG1sKG9iai5ib2R5KTtcblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG4vLyBUT0RPOiBUaGlzIHNob3VsZG4ndCBiZSBleHBvc2VkIGluIHRoZSBBUEkuIEl0IHdvdWxkIGJlIGJldHRlciB0byBoYXZlIGFzIGEgbG9jYWwgdmFyaWFibGVcbi8vIG9yIGFsdGVybmF0aXZlbHkgaGF2ZSB0aGUgaW1hZ2VzIHNvbWV3aGVyZSBlbHNlIChhbHRob3VnaCB0aGUgbnVtYmVyIG9mIGhhcmRjb2RlZCBpbWFnZXMgc2hvdWxkIGJlIGxlZnQgYXQgYSBtaW5pbXVtKVxudG9vbHRpcC5pbWFnZXMgPSB7fTtcbnRvb2x0aXAuaW1hZ2VzLmNsb3NlID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBUUFBQUFFQUNBWUFBQUJjY3FobUFBQUtRMmxEUTFCSlEwTWdjSEp2Wm1sc1pRQUFlTnFkVTNkWWsvY1dQdC8zWlE5V1F0andzWmRzZ1FBaUk2d0l5QkJab2hDU0FHR0VFQkpBeFlXSUNsWVVGUkdjU0ZYRWd0VUtTSjJJNHFBb3VHZEJpb2hhaTFWY09PNGYzS2UxZlhydjdlMzcxL3U4NTV6bi9NNTV6dytBRVJJbWtlYWlhZ0E1VW9VOE90Z2ZqMDlJeE1tOWdBSVZTT0FFSUJEbXk4Sm5CY1VBQVBBRGVYaCtkTEEvL0FHdmJ3QUNBSERWTGlRU3grSC9nN3BRSmxjQUlKRUE0Q0lTNXdzQmtGSUF5QzVVeUJRQXlCZ0FzRk96WkFvQWxBQUFiSGw4UWlJQXFnMEE3UFJKUGdVQTJLbVQzQmNBMktJY3FRZ0FqUUVBbVNoSEpBSkF1d0JnVllGU0xBTEF3Z0NnckVBaUxnVEFyZ0dBV2JZeVJ3S0F2UVVBZG81WWtBOUFZQUNBbVVJc3pBQWdPQUlBUXg0VHpRTWdUQU9nTU5LLzRLbGZjSVc0U0FFQXdNdVZ6WmRMMGpNVXVKWFFHbmZ5OE9EaUllTENiTEZDWVJjcEVHWUo1Q0tjbDVzakUwam5BMHpPREFBQUd2blJ3ZjQ0UDVEbjV1VGg1bWJuYk8vMHhhTCthL0J2SWo0aDhkLyt2SXdDQkFBUVRzL3YybC9sNWRZRGNNY0JzSFcvYTZsYkFOcFdBR2pmK1YwejJ3bWdXZ3JRZXZtTGVUajhRQjZlb1ZESVBCMGNDZ3NMN1NWaW9iMHc0NHMrL3pQaGIrQ0xmdmI4UUI3KzIzcndBSEdhUUptdHdLT0QvWEZoYm5hdVVvN255d1JDTVc3MzV5UCt4NFYvL1k0cDBlSTBzVndzRllyeFdJbTRVQ0pOeDNtNVVwRkVJY21WNGhMcGZ6THhINWI5Q1pOM0RRQ3Noay9BVHJZSHRjdHN3SDd1QVFLTERsalNkZ0JBZnZNdGpCb0xrUUFRWnpReWVmY0FBSk8vK1k5QUt3RUF6WmVrNHdBQXZPZ1lYS2lVRjB6R0NBQUFSS0NCS3JCQkJ3ekJGS3pBRHB6QkhiekFGd0poQmtSQURDVEFQQkJDQnVTQUhBcWhHSlpCR1ZUQU90Z0V0YkFER3FBUm11RVF0TUV4T0EzbjRCSmNnZXR3RndaZ0dKN0NHTHlHQ1FSQnlBZ1RZU0U2aUJGaWp0Z2l6Z2dYbVk0RUltRklOSktBcENEcGlCUlJJc1hJY3FRQ3FVSnFrVjFJSS9JdGNoUTVqVnhBK3BEYnlDQXlpdnlLdkVjeGxJR3lVUVBVQW5WQXVhZ2ZHb3JHb0hQUmREUVBYWUNXb212UkdyUWVQWUMyb3FmUlMraDFkQUI5aW81amdORXhEbWFNMldGY2pJZEZZSWxZR2liSEZtUGxXRFZXanpWakhWZzNkaFVid0o1aDd3Z2tBb3VBRSt3SVhvUVF3bXlDa0pCSFdFeFlRNmdsN0NPMEVyb0lWd21EaERIQ0p5S1RxRSswSlhvUytjUjRZanF4a0ZoR3JDYnVJUjRobmlWZUp3NFRYNU5JSkE3Smt1Uk9DaUVsa0RKSkMwbHJTTnRJTGFSVHBEN1NFR21jVENicmtHM0ozdVFJc29Dc0lKZVJ0NUFQa0UrUys4bkQ1TGNVT3NXSTRrd0pvaVJTcEpRU1NqVmxQK1VFcFo4eVFwbWdxbEhOcVo3VUNLcUlPcDlhU1cyZ2RsQXZVNGVwRXpSMW1pWE5teFpEeTZRdG85WFFtbWxuYWZkb0wrbDB1Z25kZ3g1Rmw5Q1gwbXZvQitubjZZUDBkd3dOaGcyRHgwaGlLQmxyR1hzWnB4aTNHUytaVEtZRjA1ZVp5RlF3MXpJYm1XZVlENWh2VlZncTlpcDhGWkhLRXBVNmxWYVZmcFhucWxSVmMxVS8xWG1xQzFTclZRK3JYbFo5cGtaVnMxRGpxUW5VRnF2VnFSMVZ1NmsycnM1U2QxS1BVTTlSWDZPK1gvMkMrbU1Oc29hRlJxQ0dTS05VWTdmR0dZMGhGc1l5WmZGWVF0WnlWZ1ByTEd1WVRXSmJzdm5zVEhZRit4dDJMM3RNVTBOenFtYXNacEZtbmVaeHpRRU94ckhnOERuWm5Fck9JYzROem5zdEF5MC9MYkhXYXExbXJYNnROOXA2MnI3YVl1MXk3UmJ0NjlydmRYQ2RRSjBzbmZVNmJUcjNkUW02TnJwUnVvVzYyM1hQNmo3VFkrdDU2UW4xeXZVTzZkM1JSL1Z0OUtQMUYrcnYxdS9SSHpjd05BZzJrQmxzTVRoajhNeVFZK2hybUdtNDBmQ0U0YWdSeTJpNmtjUm9vOUZKb3llNEp1NkhaK00xZUJjK1pxeHZIR0tzTk41bDNHczhZV0pwTXR1a3hLVEY1TDRwelpScm1tYTYwYlRUZE16TXlDemNyTmlzeWV5T09kV2NhNTVodnRtODIveU5oYVZGbk1WS2l6YUx4NWJhbG56TEJaWk5sdmVzbUZZK1ZubFc5VmJYckVuV1hPc3M2MjNXVjJ4UUcxZWJESnM2bTh1MnFLMmJyY1IybTIzZkZPSVVqeW5TS2ZWVGJ0b3g3UHpzQ3V5YTdBYnRPZlpoOWlYMmJmYlBIY3djRWgzV08zUTdmSEowZGN4MmJIQzg2NlRoTk1PcHhLbkQ2VmRuRzJlaGM1M3pOUmVtUzVETEVwZDJseGRUYmFlS3AyNmZlc3VWNVJydXV0SzEwL1dqbTd1YjNLM1piZFRkekQzRmZhdjdUUzZiRzhsZHd6M3ZRZlR3OTFqaWNjempuYWVicDhMemtPY3ZYblplV1Y3N3ZSNVBzNXdtbnRZd2JjamJ4RnZndmN0N1lEbytQV1g2enVrRFBzWStBcDk2bjRlK3ByNGkzejIrSTM3V2ZwbCtCL3llK3p2NnkvMlArTC9oZWZJVzhVNEZZQUhCQWVVQnZZRWFnYk1EYXdNZkJKa0VwUWMxQlkwRnV3WXZERDRWUWd3SkRWa2ZjcE52d0JmeUcvbGpNOXhuTEpyUkZjb0luUlZhRy9vd3pDWk1IdFlSam9iUENOOFFmbSttK1V6cHpMWUlpT0JIYklpNEgya1ptUmY1ZlJRcEtqS3FMdXBSdEZOMGNYVDNMTmFzNUZuN1o3Mk84WStwakxrNzIycTJjblpuckdwc1VteGo3SnU0Z0xpcXVJRjRoL2hGOFpjU2RCTWtDZTJKNU1UWXhEMko0M01DNTJ5YU01emttbFNXZEdPdTVkeWl1UmZtNmM3TG5uYzhXVFZaa0h3NGhaZ1NsN0kvNVlNZ1FsQXZHRS9scDI1TkhSUHloSnVGVDBXK29vMmlVYkczdUVvOGt1YWRWcFgyT04wN2ZVUDZhSVpQUm5YR013bFBVaXQ1a1JtU3VTUHpUVlpFMXQ2c3o5bHgyUzA1bEp5VW5LTlNEV21XdEN2WE1MY290MDltS3l1VERlUjU1bTNLRzVPSHl2ZmtJL2x6ODlzVmJJVk0wYU8wVXE1UURoWk1MNmdyZUZzWVczaTRTTDFJV3RRejMyYis2dmtqQzRJV2ZMMlFzRkM0c0xQWXVIaFo4ZUFpdjBXN0ZpT0xVeGQzTGpGZFVycGtlR253MG4zTGFNdXlsdjFRNGxoU1ZmSnFlZHp5amxLRDBxV2xReXVDVnpTVnFaVEp5MjZ1OUZxNVl4VmhsV1JWNzJxWDFWdFdmeW9YbFYrc2NLeW9ydml3UnJqbTRsZE9YOVY4OVhsdDJ0cmVTcmZLN2V0STY2VHJicXozV2IrdlNyMXFRZFhRaHZBTnJSdnhqZVViWDIxSzNuU2hlbXIxanMyMHpjck5BelZoTmUxYnpMYXMyL0toTnFQMmVwMS9YY3RXL2EycnQ3N1pKdHJXdjkxM2UvTU9neDBWTzk3dmxPeTh0U3Q0VjJ1OVJYMzFidEx1Z3QyUEdtSWJ1ci9tZnQyNFIzZFB4WjZQZTZWN0IvWkY3K3RxZEc5czNLKy92N0lKYlZJMmpSNUlPbkRsbTRCdjJwdnRtbmUxY0ZvcURzSkI1Y0VuMzZaOGUrTlE2S0hPdzl6RHpkK1pmN2YxQ090SWVTdlNPcjkxckMyamJhQTlvYjN2Nkl5am5SMWVIVWUrdC85Kzd6SGpZM1hITlk5WG5xQ2RLRDN4K2VTQ2srT25aS2VlblU0L1BkU1ozSG4zVFB5WmExMVJYYjFuUTgrZVB4ZDA3a3kzWC9mSjg5N25qMTN3dkhEMEl2ZGkyeVczUzYwOXJqMUhmbkQ5NFVpdlcyL3JaZmZMN1ZjOHJuVDBUZXM3MGUvVGYvcHF3TlZ6MS9qWExsMmZlYjN2eHV3YnQyNG0zUnk0SmJyMStIYjI3UmQzQ3U1TTNGMTZqM2l2L0w3YS9lb0grZy9xZjdUK3NXWEFiZUQ0WU1CZ3o4TlpEKzhPQ1llZS9wVC8wNGZoMGtmTVI5VWpSaU9OajUwZkh4c05HcjN5Wk02VDRhZXlweFBQeW41Vy8zbnJjNnZuMy8zaSswdlBXUHpZOEF2NWk4Ky9ybm1wODNMdnE2bXZPc2NqeHgrOHpuazk4YWI4cmM3YmZlKzQ3N3JmeDcwZm1TajhRUDVRODlINlk4ZW4wRS8zUHVkOC92d3Y5NFR6KzRBNUpSRUFBQUFHWWt0SFJBRC9BUDhBLzZDOXA1TUFBQUFKY0VoWmN3QUFDeE1BQUFzVEFRQ2FuQmdBQUFBSGRFbE5SUWZkQ3dNVUVnYU5xZVhrQUFBZ0FFbEVRVlI0MnUxOWVWaVVaZmYvbVEwUWxXRm4yQVZjd0lVZEFkZGNFRFJOelNWUk15MlZ5cmMwVTN2VE1sT3pzc1UxQmR6M0ZRUUdtSTJCQWZTSFNtNVpXZm9tK3BiaXZtVUtncHpmSDkvT2M4MDhna3V2T3ZNTTk3a3Vybk5aTFBPYyszdys5K2MrOTdudkI0QVpNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGanhvd1pNMmJNbURGalpuNFRzUkNZMmhkZmZDRkNSRkZkWFoyb29xSUNLaW9xUkFBQWlDaENSQllnSVNXM1NJUWlrUWhhdEdpQkFRRUI5RytjT1hNbUc4akdUZ0R6NTg4WFZWUlVpQ3NxS2lRQUlEMTkrclQwekprek1nQ3dCUUFaQUVnQlFBSUE0cisvR0ZrS3p4QUE2djcrdWc4QXRRQlFBd0RWTFZxMHFBa0lDS2dGZ0ZwL2YvLzdnWUdCZGJObnowWkdBRlpxYytmT0ZaMDVjMFpTVVZFaFBYMzZ0TzNaczJmdEFhQ3BwNmVuYzF4Y1hFdUZRaEhvNmVucDM2VkxsMEEzTnplRnJhMXRNeHNibTJZU2ljUldMQlkzWlZnU0lQb1JvYWFtNWk4QXFLNnFxcnBkVlZWMSs5S2xTeGYrMy8vN2Y2Y3JLeXZQWHJodzRYUjVlZmwvS2lzcnJ3SEFYMzUrZm5jQ0FnS3EvZjM5YS8zOS9lL1BtemNQR1FFSTJPYk1tU002YythTTlNeVpNN1lHZzZFcEFEVHYyTEZqWUV4TVRIeGlZbUxIME5EUVNCc2JHMFZOVFExVVYxZkR2WHYzb0thbUJ1cnE2cUN1cmc0UWtmdGlKbHdUaThVZ0VvbEFKQktCV0N3R2lVUUNNcGtNYkd4c1FDcVZ3dDI3ZHk4Y1AzNzhpRTZuTzNENDhPR3lRNGNPblFhQVA3dDI3Zm9YQUZSMzdkcTFkc0dDQmNnSVFDQTJac3dZeWRtelorMktpNHViMmRuWk9ROFpNcVJiLy83OUV6dDI3Qmh0WjJmbmUrZk9IYmh6NXc3VTFOUkFiVzB0OTNPMXRiVnc3dHc1dUgzN05sUldWb0pVS29YS3lrcG8wcVFKWEw1OEdkemQzZUhTcFV2TUM4Uzd1Ym5CM2J0M3dkUFRFMnByYThIVDB4T2FOV3NHM3Q3ZUlKVktUUWhDS3BXQ3JhMHQyTm5ad1owN2QvNG9MeTh2VjZsVTJweWNuSkxxNnVxclhicDB1ZTNuNTFlMWRldlcrNHhTTGRBKy9QQkQwYXV2dmlyejkvZDNCSUNBWHIxNkRWbTFhdFgyMzMvLy9lcVpNMmZ3K1BIaldGNWVqdnYzNzhleXNqSlVxVlQ0NmFlZjR0U3BVN0Y3OSs3WXUzZHZ0TE96dzdDd01KUktwUmdSRVlGU3FSUWpJeU5SSnBOaFZGVFVRMzEwZERUelp2Q1BHcGZJeUVpVDhRd0xDME03T3p2czNiczNkdS9lSGFkT25ZcHo1c3hCbFVxRlpXVmxXRlpXaGdjUEhzVERody9qenovL2pDZE9uTGkrWk1tU0hkMjZkUnNDQUFHK3ZyNk95Y25Kc3VuVHA3T2FrQ1hZQng5OElCbzFhcFNObjUrZnM1MmRYZkQ0OGVPbi8vREREOGZPblR1SFAvMzBFNWFYbDJOWldSa1dGaGJpaWhVcmNPalFvWmlRa0lCU3FSVER3OE5SS3BWeXlSUWJHNHN5bVF6ajQrTlJKcE5ocDA2ZFVDYVRZZWZPbmRIR3hxWkIzNlZMRitiTjZCODJQc2JqU09OSzR4d2RIVzJTQndrSkNUaGt5QkJjc1dJRkZoWVdZbGxaR2U3ZnZ4OFBIejZNSjA2Y3dKS1NraDlHalJvMTNkYldOdGpYMTlkNXhJZ1JOdSsvL3o0akFuTlpjbkt5ek5mWDE4bmUzajVreG93WmN5c3FLdjQ0YytZTUhqbHloSnZwMDlMU01Da3BDV05pWWt4bWRFcUNUcDA2b1kyTkRYYnQyaFZ0Ykd6d2hSZGVRQnNiRyt6Um93ZmEydHBpejU0OTYvVzlldlZpM2dKOVErUFZvMGNQay9HbDhTWnlvSHlJaW9wQ3FWU0tNVEV4MktkUEgweE5UZVdVUVhsNU9SNC9maHdQSFRyMHg2UkprK1kyYWRJa3hNZkh4Mm5Zc0dFeWhzYm5hTU9IRDVmNCtQZzRBRURRTysrOE0vUDA2ZE8vbno1OUdnOGRPb1JsWldXbzBXaHd3b1FKMkxWclY1UktwWndjakl1TFE1bE1aZ0oyNCtSSlNFaEFXMXRiVEV4TVJGdGJXMHhLU21MZWlqeU5LNDB6alR1ZkZDaFBpQXk2ZHUySzQ4ZVBSNDFHZzJWbFpYamd3QUU4ZHV3WWxwZVgvejUrL1BpWkFCRGs3ZTN0OFBMTEwwc1lPcCtoVFowNlZSUWZIMjhIQUY1SlNVbkpSNDRjT1hybXpCazhmUGd3bHBXVllYWjJOazZhTkFudDdlMjVtVDR1THM1a2NHbG01NE85YjkrK2FHdHJpeSsrK0tLSjc5Ky9QK2Z0N095WUY1QTNIai8rdU5KNDgwbUJsQUtmRENJakk5SGUzaDRuVFpxRTJkblpYSzNnaHg5K1FJMUdjN1I3OSs3SkFPRFZzV05IdTBtVEpyRmx3ZE8yb1VPSFNyeTl2UjBWQ2tYa3VuWHJ0cDgvZjc3MjJMRmp1SC8vZmxTcFZEaGt5QkNNaUloQW1VeUdIVHQyUkpsTXhxMFIrYUNuR2FGZnYzNG00QjR3WUFEYTJkbmhTeSs5Wk9JSERoekl2SUE5Znp4cG5Ja2NLQThvTC9oazBLVkxGNU84aW9pSXdDRkRobkNGdy9MeWN2emhoeDlxdi83NjYrMXVibTZSWGw1ZWpvTUdEWkl5MUQ0Rm16SmxpbWpvMEtHMkFPRFZ2My8vY1dmT25EbC84dVJKUEhqd0lCb01CcHc1Y3lZMmJkcVVtL0ZwVFUveW5nYlRlSWF2RCt3TkpjK2dRWU9ZdHdML0tIS2dmT0FyQk1vZldpWlF6U0F5TWhLYk5tMktNMmZPUklQQndCVUx5OHJLemlja0pJd0RBSytCQXdmYXZ2WFdXMHdOL0EvZ0YzdDdlemUxczdOcnZXTEZpdFhuenAyclBYTGtDTzdidHcrWExWdUd2WHIxUXBsTWhqRXhNU2F5amRaMnhPaVBBdjNqSnRIZ3dZT1pGNUIvVW5Kb2lBd29qM3IxNm1XU1p6RXhNU2lUeWJCWHIxNjRkT2xTM0xkdkgrN2Z2eCtQSERsU08yL2V2RFcydHJhdFBUMDltNzcxMWx0aWh1Wi9CbjdIb0tDZ3p2djI3VHZ3MjIrLzRZRURCMUN2MStPSUVTTXdMQ3lNMjlwNTJJeFA4cjZobVo3TmtNdy9UQm5RTXFFaFJVQmJpMkZoWVRoaXhBalU2L1ZZVmxhR2h3NGR3bDI3ZGgzMDgvUHI3T25wNmZqbW0yOHlFbmlDOWI0VUFGemo0K09IVmxSVVZQNzAwMDlZVmxhRzI3ZHZ4NENBQUc2dFQvdTl0TlhEWm56bW42Y2k2Tm16cDBtL1FVUkVCTFpvMFFLM2JkdUcrL2J0dzRNSEQySkpTVWxsZUhqNFVBQndmZW1sbDFoZDRESEFMd01BeFd1dnZUYnBqei8rdUgzMDZGSGN0MjhmZnYzMTF5aVh5ekVxS29xVFliYTJ0dGk3ZCsvSG12RVp5Sm4vSitUd0tFVkErVWZMZ3Fpb0tKVEw1ZmoxMTE5elM0SURCdzdjSGp4NDhMOEFRREZnd0FEV00vQUk4SHRObXpadDVybHo1KzRkT25RSTkrM2JoKysrKzY3SldyOTc5KzRtY3F4ZnYzNG1UTTFBei95ekpBUEtNOW85b0R6czNyMjdTVzNnM1hmZjVVaWd2THo4M3JoeDQyWUNnQmNqZ1llQS8rT1BQNTc3KysrLzN6OTQ4Q0FXRkJUZzJMRmp1UzBZWS9EMzZkUEhCUHhzcmMvODg2NE5HSk1BNVNPUkFHMFpqaDA3RmdzS0NtaEpjUC9OTjkrYysvZU9GaU1Cc2lGRGhrZ0J3UFBERHovOGhNQ3YxV3B4K1BEaFhKdW1jYUdQbWpmNGEzMjJsY2Y4ODl4QzVOY0dLQytwUUVqdHhjT0hEMGV0Vmt0cTRQNzQ4ZU0vQVFEUC92MzdzNXJBMEtGREpRRGcvczQ3NzB6Ly9mZmZhd2o4Z3djUE51bmtvMlllS3NDd0daOTVTOXd0b1B5a0ppTHFKQnc4ZUxBeENkUWtKeWRQQndEMy92MzdOOTcyNGNtVEo0dTl2YjJkazVLU3h2eisrKzlWQnc4ZVJKMU9oME9IRGpXWitmbmdwNW1mZGV3eGIwa2RodnhkQWlJQlVnSkRodzVGblU2SCsvYnR3OUxTMHFvdVhicThwbEFvbkNkT25OajR0Z2pmZmZkZGtiZTN0ME9IRGgzNm5qMTc5dnFoUTRld3NMQVFrNU9UNndWL1E3S2ZnWjk1U3lDQmhwWURmQkpJVGs3R3dzSkMzTGR2SCtyMSt1c3RXN2JzcTFBb0hDWk1tTkM0T2daalkyT2J1TG01aFI4N2R1emswYU5Ic2JTMEZGTlNVdGpNejd6Vks0R1VsQlFzTFMzRnZYdjM0dTdkdTArNnVMaUVSMFpHTm1sTVJUOFpBUGhuWkdTb2Z2NzVaeXd0TGNXNWMrZWFWUHNmdGVabjRHZmVra21nb1pvQTdRN01uVHNYUzB0TGNkKytmZmpWVjErcEFNQy9VZXdNVEo0OFdRd0FidE9uVDU5OSt2UnAzTHQzTDY1YXRRcHRiVzI1ZmY1SFZmc2JPclhIUFBQbTlQejhiR2gzSUNZbUJtMXRiWEhWcWxWWVdscUtwYVdsT0hyMDZFOEF3RzNDaEFuV1hRL3c5dlp1RmhvYTJ2Zk1tVE8zRHh3NGdFcWxFbDFjWERBNk9wcmI1N2V4c1hua21wOTU1b1ZBQnNZa1lKemYwZEhSNk9MaWdqazVPVmhhV29vNm5lNzIzL1dBWnRiZTdCTm9NQmdPSGoxNkZFdEtTakFtSm9ZN3l0dXRXemUwc2JIaG1pcll6TSs4TlNtQlBuMzZvSTJORFhicjFvMDdVaHdkSFkwbEpTVllVbEtDNmVucEJ3RWcwQ283QmYrVy9xN1RwMC8vOU5TcFUxaGFXb3BUcDA3bFR2WFI1UjM4OWw3K1pSM01NeThreis4WVRFaElNTGxrSkN3c0RLZE9uWW9sSlNWb01CaHc5T2pSY3dIQTFlcTJCdVBqNDV2NCtmbkYvZmJiYjlmMzc5K1BtWm1aM0cyOGRJa0hIYXhnNEdmZW1rbWdkKy9lSnBlTFJFZEhZMlptSnBhVWxHQnVidTUxRHcrUHVPam9hT3ZaRlhqLy9mZkZBT0NWbnA2Ky9mang0MWhjWEl5dnZQS0tTYWNmWGVMUnQyOWZUall4RW1EZVdzQlArVXluQ09seUVlb1VmT1dWVjdDNHVCZ05CZ1ArKzkvLzNnNEFYbFp6a1VpblRwMmFSa2RIdjNqNjlPbDdlL2Z1eFJVclZuQlhML08zL0l5RHhTY0I1cGtYb3Vmbk0zOXJrSzZzLys2Nzc3QzR1QmpWYXZXOTRPRGdGMk5pWW9UL1RzcnAwNmRMQU1CbisvYnQrVWVPSE1IaTRtSnMyYklsUmtaR21wenVTMHhNNUdRU0F6L3oxa29DbE4rMHkwVzdBcEdSa2RpeVpVdE9CY3liTnk4ZkFId21UWm9rN0xNQ25UdDNiaG9mSC8vU2I3LzlWbHRhV29xZmZ2b3Bob2FHMWx2NGEwaitNOCs4TlpHQThmVml4Z1hCME5CUS9QVFRUMGtGMUxacjErNGxRYXVBR1RObWlBSEFhLzM2OVZtSER4OUdnOEdBUFh2Mk5Mbkx6L2dDei9vVUFQUE1XNU9uL09aZk5FcDNDL2JzMlJNTkJnTVdGaGJpckZtenNnREFhOUtrU1dLaHp2NTJyVnExNm5icTFLbTdwYVdsdUhqeFlwUktwZlcyK3pMd005OVlTY0M0VFZncWxlTGl4WXZSWURDZ1VxbTg2K1BqMHkwbUpzWk9jT0NmTm0yYUNBQmM1OHlacytMWXNXTm9NQmd3TkRRVUl5SWlUTzcwNjlPbkR5ZUxqSVBEUFBQVzdDbmZxZW1ON2hTTWlJakEwTkJRTkJnTVdGQlFnT1BHalZzQkFLNkNlOXZReUpFalpSS0pwUFVQUC96d3g5NjllM0g5K3ZYWXZuMTdrOXQ4NlpYY2ZBWEFQUE9Od1ZQZVUxOEEzUzdjdm4xN1hMOStQUllWRmVIbXpadi9FSXZGclFjUEhpeXM3a0JmWDk5bVE0WU1tWERpeEFrc0tpcDY0S2l2OFZYZVRBRXczMWdWQVArS2NlTWp3MFZGUmFoU3FiQnIxNjRUdkx5OGhITkc0SU1QUGhBQmdHTFZxbFZaNWVYbHFOVnFVUzZYY3ozL3RQVkI4b2VDUU5WUjVwbHZESjd5bnM0SWRPL2VuVHNqNE9EZ2dGcXRGZ3NLQ25ENjlPbFpBS0Q0MTcvK0pZeGx3S2hSbzJTMnRyWnRmL3JwcDJzbEpTVTRiOTQ4N05DaHd3UHluNEdmZVVZQ1NTYnR3YlFNNk5DaEE4NmJOdzhMQ3d0eDI3WnQxMlF5V1Z2QkxBTzZkdTNhZE9EQWdlTisvUEZITEN3c3hERmp4cUJVS20zd21pK2hrOEEvZlY4OUEwSGpqaU45L3ZxdUQ1TktwVGhtekJnc0xDekUzTnhjN05TcDA3aU9IVHMyRllyOGQxdXdZTUg2OHZKeTFPbDBKdksvVzdkdUppOVQ0Sk9BVUR4OWJ2SzBuQ0ZQejBlZS8vLzVQeSswNTJkeGZMclBUODluZkZSWUxwZWpUcWREclZhTDQ4ZVBYdzhBYnUrODg0NWxMd05telpvbEFZQ0FBd2NPbkN3dExjVnZ2LzJXcS83VHFUOXEvaEhhb0RXVXJMU2NvZWVpQWlmZjAvK243MitzWk1EaVdIODhxQ21JVGdtMmI5OGV2LzMyVzlUcjlaaWVubjRTQUFMZWZmZGR5MjRON3RhdG00MjN0M2ZzVHovOVZGTllXSWlUSjA4Mk9makRmNHN2ZjlBczFmTm5KRXBDV3M1UVlaUDJjNm5ObVR6OWR6cjdRRDlIdjRjL3d3a2xMaXlPVDhmejN6cE1CNFFtVDU2TWVyMGVkKzNhVmVQaTRoSWJHeHRyWStrRTBHellzR0Z2SFR0MkRQVjZQWWFIaDV0YyttSE0zRUpQVnJyQmlBcWJkTFNaT2gzNW52NC9mVDh0aDZ5ZERGZ2NIODhUTG93dkN3a1BEMGU5WG84NU9Ubll0V3ZYdHpwMjdHangyNEV1NzcvLy9zcURCdytpWHEvbndNOS93NCtsRHdwZmxwTDhwQm1LbGpQMElzakl5RWhzMHFRSkppUWtZSHg4UEw3MjJtczRhTkFnSER0MkxIYnExQWtURWhMUTN0NmVlN1U1S1NMNlBUU2owZDk1bEx3Vkd2aWZOSTU5K3ZUQitQaDRIRFZxRkE0YU5BaEhqUnFGY1hGeG1KQ1FnSFoyZGx4TnlWcmlTSitQLzBhaDBOQlExR3ExcUZhcmNlalFvU3NCd01WaWtUOXo1a3dSQUhobFpXVVpTa3BLY1BQbXpTaVZTcm5CNHIvU20xL1FzUlRQbjZsSWx0R01RMWM3UjBSRVlIUjBOSDc0NFllNGRPbFNWS3ZWV0ZCUTBPQ1hScVBCNWN1WDQ4eVpNekUyTnBhTEM4MXM5UHRwbWRUUVRDWVUveVJ4N05peDQyUEhVYVZTNGFKRmkzRDY5T2tZRVJIQmthclE0Mmo4cW5FaVE2bFVpcHMzYjBhTlJvUHo1czB6QUlEWDVNbVRMYk1RK1BISEgwc0FJR2ovL3Yxbmk0cUtjUGJzMlZ3Qk1ENCszb1NaaFpLME5GUFI2Y1dvcUNoMGQzZkhqejc2Q0hmdjNzMVZhZlB5OG5EUG5qMjRkZXRXWEw5K1BhNWV2UnJUMDlOeDdkcTF1SEhqUnR5NWN5ZG1aMmVqU3FWQ25VNkhCUVVGbUptWmliTm56MFovZjMvdWZnVDZPL3laVEdna1FKK1hQK1BUODBWR1JtSkFRQURPbmowYk16SXk2bzNqaGcwYmNNMmFOYmhxMVNwY3QyNGRGOGVjbkJ4VXE5VmNISGZ1M0lrZmZ2Z2h1cm01WVZSVVZMMXhGQW9KVUx6b2RHRDc5dTF4OXV6WnFOUHBNQzB0N1N3QUJFMlpNa1ZpcWV0L21WZ3NibnZzMkxFcXZWNlBNMmJNUUtsVWFuTGx0ekhUOGJkNHpPM3BjOUV5aFFwT05GUEZ4OGZqOU9uVFVhUFJvRmFyUmFWU2lSczNic1NsUzVkV2YvamhoMGRmZXVtbDlaMDdkLzQ0UER6ODliWnQydzV0MGFKRllraEl5TkN3c0xCeG5UcDErbmpBZ0FGclAvcm9vOE9wcWFsVk8zZnV4UHo4Zk5UcGRLalQ2WERtekpsY0V3ak5aS1NZNlBOWWF0eWVOSTZkTzNmR0R6LzhrQU45VGs0T3hiR0s0dGlwVTZlUHdzUEQzK2pRb2NQSUZpMWFKSWFHaG82S2lJZ1kzNmxUcDQ5ZmZ2bmxUWFBuenYxcDFhcFY5M2J2M3MyUnFscXR4dmZlZTQ5cnA2VytFNG9qZjFsZ3FYRXp2anBjS3BYaWpCa3pzS0NnQURkdjNsd2xGb3ZieHNYRnlTeVZBR3dqSXlON0h6bHlCSFU2SFE0WU1JQzcvS056NTg3MU1yR2xKaTFWbldsdE9uNzhlTXpJeUVDdFZvdDc5dXpCMU5SVW5EWnRXbm1uVHAwK2RuQnc2QWdBL2tWRlJiM3hJVlpVVk5RYkFQeWJOMjhlM2JsejU1bXpaczNhdjNuejVycmMzRnpVNlhTWWxaV0ZiNy85dHNuYWxncW5EUlc0TE0zekMzejhPTDc5OXR1NFo4OGUxR3ExbUptWmlTdFdyTGcvZGVyVS9mSHg4UjgxYjk0ODVuSGlPSFhxMU5ZQTBNTEp5YWxUMTY1ZDUzejY2YWRIdG16WmdubDVlYWpUNlhEMzd0MDRkdXhZa3pnS2hVd3BmalFaaElhRzRvQUJBMUNuMCtHT0hUdXdaY3VXdmVQaTRtd3RsUUNhRGhnd1lOejMzMytQT3AwT0J3MGFaTElGeUpkak5Bam05c1pKYTd5R2pJNk9SaWNuSjF5NGNDRTM0NmVucCtNNzc3eXpOemc0ZUNRQUJOVFcxbGJnUDdEYTJ0b0tBR2dSSEJ3OGJOcTBhVVhidDI5SGxVcUZXcTBXbHl4WmdpNHVMcHljcFFJWHJhSDVNNW1sZURyUVFwK1RQbmRVVkJRNk96dmpraVZMdURpbXBhWGhXMis5WlFnS0Nob0tBQzMrYVJ5cnFxb01BQkFZR2hyNjZzY2ZmM3hnNTg2ZDNQSmd3WUlGS0pmTE9RVks0OG9uVTB2TFExSUF0QlU0YU5BZ2p0aGlZMlBIeGNiR1dtWkhZTmV1WFpzbkp5ZFBwOWQ4dDJyVml0c0ZvT0JiV3ZJMkJQNm9xQ2gwYzNQRFRaczJvVWFqd1IwN2R1Qm5uMzEyTVNvcWFqSUFCT0JUTkFEd2o0Nk9mdk83Nzc0N3AxUXFVYXZWNHViTm05SFQwNU1yRkZvNkNkUUhmaXBrS1JRS3JwQzFmZnQybkRkdjN2bXdzTEMzQWFERlU0NWpZUGZ1M2FlbHA2ZGZ5YzNOUmExV2l4czJiREFoVTBzbkFZb2pLWUN3c0RCczFhb1Y2blE2M0xObkQzYnYzbjE2eDQ0ZG0xc2tBZmo1K1RtT0hUdDJmbGxaR2VwME9veUxpN05vQmRCUWRUb3FLZ29WQ2dWdTI3WU4xV28xYnRpd0FTZE5tbFRxNHVMUytmYnQyK3Z4R1ZoVlZaWEIyZG01NHdjZmZGQ1FsWldGV3EwV2QrM2FoWDUrZmx5VjI3aXdaVXdDNW9xbmNjZWU4ZWVpQWxaRVJBVDYrdnJpcmwyN1VLMVc0N3AxNnpBbEpVWHY1T1FVVzFWVlpYZ1djYnh5NWNxbjd1N3UzZWJPbmJzL096dWJJMVBqQW1GRHV3U1dxZ0RpNHVKUXA5TmhUazRPSmlRa3pQZnk4bkswMUoxQXAvSGp4eThxTFMzbGpnRHpGUUNmZWMzbENUejFnZC9GeFFVM2JkcUVLcFVLVjY5ZWpjbkp5YnNrRWtscmZBNG1Gb3RiVHB3NGNXTm1aaWFxMVdyY3VYTW4rdm41WVhoNGVMMGtZTzU0a25MaWd6ODhQQng5ZlgxeHg0NGRtSitmajZ0V3JjTGh3NGR2RW9sRUxaOUhIR1V5V2ZEa3laT3o5dXpaZ3hxTkJqZHUzRml2RWlBUzRKT3B1ZU5wckFEa2NqbFhMRTFNVEZ3RUFFNldTZ0RPRXlkT1hGbFNVb0phclJiYnQyOXZjZ2NnWHdGWVNyQ3BVQlVkSFkxTm1qVEI5UFIwVktsVXVIYnRXaHcrZlBpbXB5MzVIMFBLK3IzMjJtdkxMSjBFSGhmODZlbnBPSERnd09VQTRQK2M0eGo0emp2djdNek96a2FOUm9PcHFhbllwRWtUcmlaQTQyNHBreEpmQWRBZGdlM2J0K2RxSjBsSlNTc0F3TmxpQ1NBbEpXVzF3V0JBclZhTFVxbTBRUVhRMEVHUDUrWDU0S2NxOWV6WnMxR2owZUNXTFZ0dzNMaHh1UUFRaUdZd0FQQ3Rqd1Q0blpYVVJzdWZ5WjYxSitWRWY1ODYxOExDd2hvQ3Y2ODU0aWlWU2x2Tm1qVkxrNXViaXhxTkJxZFBuLzdBN29BbDVxV3hBcEJLcGFqVmFqRTNOeGY3OWV1MzJwSUp3Q1VsSldWMVVWRVJhalFhREE0T05sRUExTE50Q1VFMjdrR24vZW5FeEVSVXE5V1lrWkdCSDM3NDRTLzI5dmFoYUVZakVzakl5RUNWU29VN2R1eEFYMTlmczVQQW84Qy9mZnQyek12THc3UzBOSHpwcFpmTUJuNnk1czJiaDZXbXB2NmFuNStQYXJVYUV4TVRUZm90K0djSnpKMmZ4bmtwbFVveE9EZ1lOUm9OS3BWSzdOdTM3MnBMYmdjMklRQmpCV0JjeFRZT3RyazhCWm1hUmtKRFEzSEpraVdZbDVlSFM1Y3VyZkx4OFJtSUZtQ1BJZ0hqWnBmNlRzazliYzgvclVmeHMxVHdrN1Z1M1hwUVZsWldsVnF0eGtXTEZuRTNWRkg4K0NSZ0xzL2ZSU0VGSUVnQ0lBVkFjc3RTZ3N4dlN3MFBEK2RtL3kxYnR1RExMNys4QmdBODBVTE1Va2hBcU9EL080YWU3N3p6enJyOC9IelVhRFRZdTNkdjdvcDZmdHV3cFV4T3RBc2dLQVV3Y2VMRTFZV0ZoYWhXcXprRllCeGtjeXVBK3FyK01wa01OMjdjaUxtNXVmamxsMTllc2JlM2owQUxNejRKYk4rK0hYMTlmYmxPUzVLelZOTjQyc2xNNEtmZlQ4dW0wTkJRRS9DbnBxWmFIUGpKbkp5Y292ZnMyWE5kclZaamVubzZ5bVN5Qm5jRnpKMmZoQmRTQUdxMUduTnljb1JGQUczYXRERTVDMER0bUJSa2MzbWF3YWp3TjJEQUFGU3BWTGgxNjFaODhjVVhseitxRmRXY0pEQm16SmhsdTNmdnh2ejgvTWNtZ2Y4MVhvOEMvN1p0MnpBM054ZFRVMU54d0lBQkZnbCthaUdlTkdsU21rcWxRclZhalVsSlNmVzJDMXRLZnRKWmdEWnQyZ2lUQUtSU0tZYUdodFlyczh3VlhIN2hxa09IRGpoNThtVE16OC9IWmN1V1ZUazVPWFZHQzdiblRRTFdBbjR5WDEvZjdtcTF1a2FsVXVIYmI3L054YzI0b0dyTy9PUXZUME5EUTYxSEFWQVNrY3g1M3Q3NEVncnFWSk5LcGJoanh3N015c3JDOTk1N3I5alNFL2hoSkVDRkxUNEpHTzhTUEltbm4rT0R2ME9IRG9JRVAvVllyRnExYXI5YXJjYXRXN2VhM0ZkaGZLbUlPZlBVdUM5RmtBcEFyOWVqU3FWQ2lVVENNU3kvZWNYY3dTWDUzNzE3ZDFTcFZMaGx5eGJzMHFYTHAvLzBVSXE1U0dEWHJsMllsNWVIMjdadGU2b2s4RGpnVnlxVnVITGxTc0dBSHhHeHVycmFNR3pZc004MEdnMnFWQ3J1K2kxK3ZNdzlTVkZUVldob0tFb2tFbFNwVkppZG5ZMUpTVW5DSVlEV3JWdWpWQ3A5b05CQ0QvbThQYTJ0ak9WL1VsSVM1dWZuNDVvMWF6QXdNTEFmQ3NnZVJRSzB0cVc0Rys4U1BFNmM2T2VJTEJzQS96S2hnSjhzSmlabUlMMTJxM2Z2M2x5OCtIMFY1c3BUNHdLMVZDckYxcTFiQzVNQUpCS0p4UWFYcmx1YU9YTW01dVhsNGJKbHkyNENRREFLeko0MkNWZzcrUDgrYjlHMnNMRHdqa3FsNGk2dG9SdVp6RDFKMVZlakVxUUN5TS9QNXhRQUJaZldXUFNRejl2ejVXeTdkdTF3L3Z6NXFGUXE4YlBQUGp2eHZIditueVlKdlBycXF4d0piTjI2RlgxOWZibnIyS2dHUS9Ibkx3djQ4YUh2aTQ2TzVxNmw4dlgxeGExYnR3b2UvSFJHSURjMzl6ZTFXbzJmZlBJSnRtdlg3cUhMcHVmdEtmNDBTYlZ1M1JyejgvTXhLeXRMR0FSUVVGQ0ErZm41SmdxQTM2eGlydUFhSDFpUlNxVzRhdFVxek03T3hsbXpadTBEQUI4VXFCRUo3Tnk1RTNOemN4K2JCUGozN3o4TS9EazVPYmhpeFFyczM3Ky9ZTUZQc2RxK2ZmdCtqVWFEYVdscEtKVktIemhvWmE3ODVEZFprUUlRSkFHMGF0VUtwVkxwQXgxWDlKRFAyeHZmOUNPVHlUQWtKQVRYcmwyTDJkblpPRzNhTkIwQWVLR0FyU0VTb0JtT2YyRW14WU84OGNXbnBKQ3NEZngveDhsNzQ4YU5lcTFXaTZ0WHI4YVFrQkFUa3VRdmw1NjNwM0dnWGFwV3JWb0pWd0hRRE1TWFYrWUtydkhCRmFsVWloczJiTURzN0d6ODk3Ly9yUmM2QVR3SkNWQk5obVo4K3JlMWc1OElZTnUyYlFhZFRvZnIxcTB6T2JOQ2NUQlhmdktYcWUzYnR4ZVdBcGd3WWNKcW5VNkhlWGw1RFNvQS91dWVucGMzdnFPT0ZNQ3laY3N3T3pzYjU4eVpVMllOeVcxTUFqdDI3RUNsVW9sYnRtd3hJUUdxeWRDeWpEenRoeFA0dDJ6Wmd0bloyZmpkZDkvaGl5Kyt1TXlhNHJObno1NkRHbzBHRnk5ZS9JQUM0QytUbnJldlR3SFFkZW1DSWdDSlJNSWxIYjhhYmE3Z0doOWdrVXFsK00wMzM2QlNxY1N2di81YXNFWEFKeUdCdG0zYmNrMVFwQWlNLzkyMmJWdXJCajhWQVFzTEMwOXFOQnBjdUhDaGlRSWdNalJYZnZKM1g5cTFhNGNTaVVTWUJOQ3laVXV1d0ZMZk85MmV0K2V2Y1VOQ1F2RHR0OS9HM054Y1hMMTY5UTBoYmdNK0tRbjQrUGh3TXg0MWFaRVBDUWxCSHg4ZnF3Yi8zM0ZwZStqUW9kc3FsUW9uVHB6NGdBSm9xRWJ5dkR6aGhBclZMVnUyRkI0QjVPYm1va1FpNFdZY0tyeVJ2REpYY1BrS1lQVG8wZHhhdVdYTGxuM1J5b3hQQXBzM2IwWWZIeDl1aXpZa0pJVGJhdkx4OGNITm16ZGJOZmdSRVR0MzdqencwS0ZEbUp1Ymk4bkp5ZlVxQUhQbEo3V3BFMTdhdG0yTEVva0VjM056TVRNekV4TVRFeTJmQU9qNkltTUZZQnhjSW9IbjdXa0wwRGk0dnI2K21KdWJpeGtaR2RpN2QrODVRbWtGZmxJU0dEMTY5TEx0MjdkalRrNE9idHEwQ1gxOGZEQXdNQkNsVWlrR0JnYWlqNDhQYnRxMENiT3lzbkQ1OHVWV0MvN3E2bXJENjYrL1ByK3NyQXh6YzNOUm9WQnd5MVRLQzFJQTVzcFRtcVNNRllBZ0NjQllBWkRzdHJUZ3RtclZDamR1M0lnNU9UbjR5U2VmR0t3eDZSc2lBVzl2Yi9UeDhVRnZiKzlHQVg2S1EwNU96bDY5WG85cjE2N2xDdFdXTmtrUlhnU3RBSUtDZ2t6a0ZXMEZFZ2s4YjA5cksyTDZEaDA2b0ZRcXhWbXpadEV5b01yRnhTVWVyZFQ0SkxCeDQwYU1qbzdHalJzM05ncndJeUw2K3ZwMk9YNzhlSFYrZnA3YUFDa0FBQ0FBU1VSQlZENSs4TUVIS0pWS3VXWTFxZ0ZRbnBnclQya0xrSmFwUVVGQndpTUFwVktKRW9tRUs3QVFvMWxLY0dtTEpUZzRHRU5EUTFHcFZHSldWaFlPSHo1ODBXKy8vZlo2WXlFQmV1N0dBUDZpb3FMZXMyZlBYbjdnd0FGVUtwWFlybDA3cmdiQ2Y4VzRPU2NwWTd5RWhJU2dSQ0pCcFZLSkdSa1p3aUlBVWdCVVphYXRRSE1GbHp4dHNSRER0bXJWQ3RQVDAxR3BWT0tHRFJzdU5tL2VQQnl0MklnRXRtM2JocG1abWJoczJUS3JCejhpb3JPemM4VHg0OGV2MERzQ1NQNlRRclcwL0tUTFFJS0Nnb1JKQU1ZS2dKcE1hSTFGU3VCNWUySjRZbGg2ZWNtb1VhTlFxVlJpZG5ZMmpoOC9QaFVBUEJvQkNTeFp0R2dSOXUvZmY0bTFneDhBRkY5ODhVVmFlWGs1S3BWS0hERmlCUGZTRGVNT1Njb1BjK1VuMWFnSUw0SldBRlJsYm1pTlpTNVBERXZMZ0xadDI2SlVLc1hseTVlalVxbkUzYnQzM3drSUNPaVBWbTRBNEJFVkZkWFAyc2tPRVRFc0xHekFyNy8rZWtlbFV1SHk1Y3ROeHAza1B5a0FjK2NudjBZVkdCZ29YQVVRSEJ4czBtbEdETXR2UTMxZW52NCtCWmxrVnV2V3JiRk5temFvVkNveE56Y1gwOUxTZm1yYXRHbDdaQ1o0azh2bEhRNGVQUGhMU1VrSktwVktiTk9tRGRjSFFmS2ZKaWRMeUU5anZBUUhCd3RMQVl3ZlAzNjFScVBCbkp3Y1RnSHdaWmE1Z2t1ZW1KNWtGakZ0eTVZdE1TVWxCWE55Y2pBM054Yy8rdWlqSEd0cUQyNk1CZ0FCbXpadHl2NysrKzlScVZSaVNrb0sxNTlDeXBUT1JsQmVtRHMvK2N2VHdNQkF6TW5Kd2QyN2QyT2ZQbjJFUXdBU2lZUzdHSlQyV1VsK0U5T1p5NU1Db0dVQTlWeTNidDBhdi9ycUs4ekp5Y0g4L0h4ODc3MzMxc0p6ZnFrbHM2Y0dmdi9seTVldk8zNzhPT2JsNWVIQ2hRdXhWYXRXM0JrVlkvbFArV0R1dkNSOFVKOUttelp0VUNLUkNKTUFBZ0lDSGxBQWxoQms4dlI1S05qVWROR2hRd2RjdVhJbEtwVktWS2xVT0dYS2xGUUE4R09RRWhUNC9SWXZYcHo2ODg4L1kzNStQcTVjdVpLN1hJUFcvalFwV1dwZWtnSUlDQWdRcmdLb2I2MWx6SFRtOHZRNWFCbEF0UUJhYzBWR1J1S3FWYXRRcVZTaVdxMW1KQ0JBOEo4NGNRTHo4L054MWFwVkdCRVJ3ZFdralBPUnh0L1M4cEsycUZ1M2JpMWNCZENpUlF0T1hoc0gyOXhCSms5TXl5Y0JrbDBSRVJHTUJLd0kvTFFjcGI0VUduZktBMHZKUytON0dhUlNLYlpvMFVKWUJLQldxekU3Ty91aENzQlNQUDg4UE1rdVl0NklpQWhNVDAvSG5Kd2NWS2xVT0hueVpFWUNBcEQ5ZVhsNW1KNmV6b0dmOHBBS2YvejdFQ3d0TC9rS0lEczdHM2Z0MmlVc0FpQUZ3TCtFd3RLQ1RZeExhMEkrQ1lTSGh6TVNFQ0Q0dzhQRFRjQlB0U2dhWjc3OHR4UnZmRGtMS1FCQkVvQkVJdUhhTFVsMkVlTmFtcWVnRS9PUy9LS3FNU01CWVlLZjhvL0drNVFvWHdGWW1xZmxLT1dmVlNnQWZ0WFZVanpOQkk4aWdiQ3dNRVlDQWdCL1dGallZNEdmWHdPd0ZFODRzUW9GVUYvVGhTVjdDajR4TUEwQ0l3RmhncC9HanhRb1gvNWJxamR1VGhPY0FsQ3BWSmlWbFlYKy92N2N0Vk0wczFweTBHbG1hSWdFYURDSUJMS3pzekUvUDUrUmdJV0JueWFkaHNEUFZ3Q1c1Z2tuZEZUWjM5OGZzN0t5Y09mT25jSWlBT1BCb0FLTXBRZWZrWUN3d0orYm0ydFY0T2Z2UmxHK0NaSUEvUHo4Nm0yK29JZTBWRS9KUXArWDVCZ2R6YVJCQ1EwTlpTUmdBZUNuVjJqVHVORE1TY3RPR2tjK0NWaXFweG9VTmFYNStma0pWd0hRcFNEVURDU1VRWGdVQ1FRRkJURVNzQ0R3MDNnSUhmejBPYWx3U2M4bGFBWEE3OENpaDdSMFQ4bERuNXRrR1RFekl3SExBajhwVFZwdTByanhTY0RTUGI4ajFTb1ZBQ01CWmd6OERYdXJVQUMrdnI0bUNvQXZ5NFRpS1pubzg5UGdFRU1IQmdaeXB3Z1pDVHg3OE5PcFBvbzc1UmROTWpST2ZCSVFpcWZsSnVXWHI2K3ZjQlVBWFFwQ3pVQkNHd3hHQWd6ODV2QzBpMEhQS1JnQ2VPT05OMWJuNStmam5qMTdPQVhBNzhYbXY1Tk9LSjZTaTU2REJvbk9EQVFFQkhBa2tKYVdobGxaV1ppWGw4ZEk0Q21BUHkwdGpRTS94Wm55aWlZWEdoYytDUWpOODgraStQcjY0cDQ5ZTNESGpoMllrSkFnSEFLZ3dUSnVCaExxb0R3cENiUnYzOTZFQk41OTkxMUdBazhJL3A5KytnbVZTaVdtcGFWaCsvYnRHd1g0alYvVVNwZUJTQ1FTWVJLQWo0L1BBejNaeG9Na1ZFL0pSczlqL0lKTlJnTFBEL3cwcWRBNDhFbEFxSjUvQnNYSHgwZjRDb0J1QnhiNjREQVNZT0IvSHA1Mk5heEtBWkJjczNZU0lPWnUwYUlGSTRHbkFINktJK1dSdFlPZmZ3Qk4wQXFBamdSVHRaWUtITmJpU2E3Um9CRnpHNU9BV0N4bUpQQVB3QzhXaXg4QVA4V1g0azN4dDdhOElyelE4d3VTQUx5OXZVME9hTkFNMmRoSXdOL2ZIOFZpTWJacjE0NlJ3R09BdjEyN2RpZ1dpOUhmMzc5UmdwOXdRbWNidkwyOWhhc0E2RWd3cmQxbzBLek5VMUxTNEZHeTBpRDYrZm1oV0N6R2tKQVFSZ0lQQVg5SVNBaUt4V0t1alp3bUQ0b254WmRQQXRibUNTOUVnb0lrQUM4dkw1TjJZQnJFeGtJQ0pPT29uZFBIeHdmRllqRzJhZE9tUGhMd2JXVGc5K1dEdjAyYk5pZ1dpN25hRWVVTnhiR3hnSjl3UW5uajVlVWxYQVhnNStkbndtZzBlTmJ1YVJEcHVhbWE2K25waVdLeEdJT0NnamdTeU1yS3dva1RKeTVwVEFUd3pUZmZMUG54eHg4NThBY0ZCYUZZTEVaUFQwK1QzU09LSDEvK1c3dW41eVlsWkZVS29MR1JBSDhaNE9ibWhwNmVucmhtelJyY3ZYczNMbG15QkFjTkd2UlZZeUtBTjk5ODg2dXRXN2RpUmtZR3JsbXpCajA5UGRITnplMmg4cit4NVkxVktBQmZYMSt1SUdZczQ2emRHeGNDamF1NUNvVUN2Ynk4T1BBdlhyd1krL1hydHhRQWZCclpFc0JuNU1pUlN6ZHYzc3lSZ0plWEZ5b1VDcFBkSTM0QnNMSGtEejAzdGRNTGtnQkl6dEdCSVA1YXJyR0FudzUwZUhsNW9aZVhGNjVkdTVZRGY5KytmWmMxdHZXL2NSMGdPVGw1R1pIQTJyVnJ1UmdaNTAxakl3SENDZVdOcDZlbjhCVUFYODVacTZmQm82U2x0YitQanc4RC94T1FBQlVDcVJaQThhVDRXbnNlRVY2c1FnRTBWTkJoNEcvYzRHY2tVTCt2cjNBc1dBWGc0K1BERlRTc2VmQVkrQmtKUE0wOElyelE4d3VTQUl3TE9zWWRYZlNRMXVLSnNhbnpqOER2N2UzTndQOFVTSUE2U2ltdWxFY1VkMnZMSi81WkVvVkNJVXdDZUZoVEJ3TS9NMFlDRFh0Kzg1Z2dDY0REdzROckJ6YmUxNlZCRTdxbkpLUjlmZ2IrNTBzQ2xFOThNaEM2cDN3aTNIaDRlQWhYQWRDZzBaWU9Bejh6UmdLUDlyUUY2TzN0TFh3RlFKMWR0QXlnd1JLcXA2UWptVVpyTmJiUC8zejdCQ2p1bEZkOE1oQ3FwN3dpM0FoS0FSamZDbXlzQVBoVlhHc0YvN3AxNnpBakl3T1hMRm1DL2ZyMVkrQi9DaVF3Y3VUSVpWdTJiTUhNekV4Y3QyNWRveUFCWTBVcEZvdUZlUzI0dTd1N1ZTa0FTaTZTWjdSR1krQTNMd25RT05BeVUrZ2t3RmNBN3U3dXdpUUFzVmhzd3RUR2d5TTBUK1RGQjcrbnB5Y0R2eGxKZ0pyTitDVEFWd1JDODhiSzBtb1VBSitoR2ZpWk1SSjQwRk9lV1lVQ01CNGM0MEVSaXFka29qVVpEUXFkNm1QZ3R3d1NvS1l6R2grcU9mSEpRQ2plZUpJUnJBSndjM1BqRGdRWkR3b0RQek5HQWcxN3lqZkNqWnViRzFNQURQek1HaE1KV0kwQ01HNEhKakJSbGROU1BhM0JxQkREQi8vYXRXc1orQzJRQktoUGdFOENOSTQwcnBhZWY4WUh5ZWdHS1VFUmdGcXR4dXpzN0FjVWdCQUc0VkhnWDdkdUhXWm1adUxTcFVzWitDMkVCRWFOR3JWczY5YXR1R2ZQbmdhVmdGQklvTDVDczFnc3h1enNiTnkxYTVld0NNRFYxZFdrR1lnL0NKYm1pWGtwK0xRR1krQVhOZ25RT05LNDBqaGJhaDRTVHFnSnlOWFZWWmdFWUt3QWpOZGtEUHpNR0FrOFBBOEpMMWFsQVBqQnR4UlBqTXZBYjUwa1FHZFMrQ1JBNDI1cCtVaWZ6eW9VQUorQkxTM29mUEJUd2RMRHc0T0Izd3BKZ01iWFVrbUFQby94Sk1RVWdCbG1mazlQVHdaK0t5SUJUMC9QQnBjRGxrWUNnbGNBR28wR2MzSnlVQ3dXUDVKNXplMXByVVdmVDZGUW9MT3pNNjVac3diMzdObUR5NVl0WStBWE1BbHMyN1lOczdLeWNNMmFOZWpzN015UkFJMDNmNWZBM0w0K0pTb1dpekVuSndkMzc5NHRMQUp3Y1hFeE9SQms2Y0ZXS0JSb1oyZUhTNVlzd1QxNzl1Q0tGU3Z3cFpkZVNnZjJHbStoa29EZjJMRmowM2JzMklIWjJkbTRaTWtTdExPemU0QUVMSFZTb29OQUxpNHV3aVFBUzFZQWZObFAxZFlwVTZaZ2RuWTJybDY5R3BPVGt6TUJJSUJCU2RBa0VQRHV1KzltN042OUc3T3pzM0hLbENrbXUxTU5MUWVZQW5pS0NxQ2hZSnZMRThQeXdSOFRFNFBaMmRtNGRldFdmTys5OTQ3YjJOaTBaUkFTdnRuWjJiVmR0R2pSOFQxNzltQk9UZzdHeE1TWUtGUEtBOG9MYytjblB5OEZyUURvU0RBVkFpMHR5SlFFN3U3dXVHVEpFc3pNek1TdnZ2cnFqa0toNk5jSVprZEZjbkx5WUFCUVdQdXp0bWpSb3QvMjdkdnZaR2RuNDdmZmZzc2RWT09UZ0tWTVRvUVhkM2QzWVNtQUNSTW1yTlpxdGFoVUtodFVBUFNRNXZMME9ZeUQzTGR2WDh6SnljRzFhOWRpLy83OVZ3S0FoN1d2ajVjdVhicnkxMTkveGZmZmYzK2x0ZGM1QU1CajRzU0pxVmxaV1ppVGs0TUpDUWtQVEU2V2xwL0dDa0NwVkdKR1JnWW1KaVkrVlFLUVBrczJ1SDc5T3JpNHVNREZpeGRCb1ZEQStmUG53Y3ZMQzg2ZE93ZmUzdDVtOFY1ZVhuRCsvSGxRS0JSUVdWa0pycTZ1Y09YS0ZSZzJiQmpVMXRiQ0gzLzhjVkduMDYxQXhBdGdwU1lTaWZ3WEwxNDhNeUVoSWFXaW9nSVNFaExldkgvL3ZrZ2tFdmtqNGxscmZHWkV2T0RnNEJEUm8wZVBsNXMyYmVyMnlpdXZnRjZ2QnpjM042aXNyQVJQVDArTHlrOFBEdys0Y09FQ3VMaTR3TldyVjU5WlhNVFBNdWhPVGs1dzllcFZjSGQzaHdzWExuQkJObGR3dmIyOTRmejU4K0RwNlFtVmxaWGc3dTRPVjY1Y2djNmRPNE9ycXl2Y3VuVUxpb3VMTi8vODg4OHgxZzcreE1URWxETm56a0JOVFEzVTF0WkNVbEpTeXBRcFUyYUtSQ0ovYTMzMm5Kd2NWNjFXdXgwQXdNUERBK0xpNHVEeTVjdmc3dTV1UWdLV2tKOFhMbHdBZDNkM3VIcjFLamc1T1FtVEFFZ0JYTHAwaVp0eGlXSE41UW44Q29VQ0xsMjZCTTdPemhBUkVRR0lDTmV1WGJ0NzZOQ2gzWUdCZ1dzYUEvalBuVHNIYytiTWdRc1hMalFLRW5qaGhSZDBlWGw1MndIZ0hpSkNlSGc0T0RzN20rU25wNmVuV2ZQVHk4dkxKRDlkWEZ6Zyt2WHJ3aU1Ba1VqRUtRQTNOemNUQlVBeXh4eStzcktTazFldXJxNXc3ZG8xaUkyTmhacWFHdmpQZi82ei84YU5HMzlZSy9pWExGa3lNeWtwS2VYczJiTncvdng1bUQ5L1BodytmQmptejU4UEZ5OWVoUHYzNzBQZnZuMVQzbnZ2UGFzbGdVdVhMdjMrMy8vKzk0QllMSWJZMkZpNGR1MGF1THE2d29VTEY4RER3NE9icE15WnA2UUEzTnpjT0FVZ0VvbEFKQklKVXdGY3ZuelpJb043NWNvVmFOdTJMY2psY3JoejV3NGNQWHEwdUxhMnR0UmF3Vzg4ODMvMjJXZHc5dXhaY0hCd2dMTm56OEpubjMxbW9nU3NsUVNxcTZzM0dReUdFb2xFQWk0dUx0QzZkV3U0Y3VXS1JVNVNseTlmRnE0Q01LNEJ1TG01bVJRQ0tjam04TWJCZFhaMkJtOXZiMEJFcUtxcWduUG56aDJRU0NRdHJCMzhDeFlzZ0lxS0NuQnljb0pidDI2Qms1TVRWRlJVd0lJRkM2eWVCR3hzYkxxZlBuMzZvRXdtQXdBQWIyOXZjSFoyaHN1WEw1c3NBOHlacHdxRkFpNWV2R2lpQUFSYkE2RGdHaGNDS2NqbThCNGVIbkR4NGtWTy9vZUVoQUFpd3AwN2QyNmVQWHYyVEdNQS8rblRwOEhaMlJsdTNMZ0JMaTR1Y09QR0RYQjJkb2JUcDA4M0NoSTRmUGp3ZnhEeEx3Q0FrSkNRZXBjQjVzeFRLZ0RTSkNVNEJVQnJGVWRIUnk2NC9FS0xPYnd4czE2NWNnV2NuSnpBMWRVVkVCSCsvUFBQOHdCUWJZM2dQM3YyTEp3N2R3NCsvL3h6cUtpbzRKS0tTTkRWMVpVajY0cUtDdmo4ODg4NUVyRFNta0RWblR0M3pvdkZZbkJ4Y1FFbkp5ZHVHVUJLMWR4NWV1blNKVzU4SEIwZG4xa2dwTTh3QWJtWjVjcVZLeGFsQUl6M1Y1MmNuR2dKY0JNQWFxd1ovRFR6RStncDZTOWZ2c3o5bTVUQTU1OS9Eak5uemdTRlFnRjkrL1pOK2JzSVpTMTlBalhWMWRVM2JHMXRPZktqV3BWQ29iQ0lQSFYzZCtkMnFhNWR1OFlWQVo5MklmQ1pOZ0xKNWZKNkZZQzV2TEg4SndWZ2EydEx4YUcvQUtET0dzRlBzdC9KeWNrRS9DUXpLZG1NNDBMTEFTS0JwS1NrRlByOVZrQUNkZmZ1M2JzakVvbEFKcE54dFNwWFYxZTRlUEVpdHd3d1o1N1NMdFdWSzFkQUxwY0xUd0VBQU55OGViTmVlWFhod2dXemVYZDNkN2g0OFNMSHJCS0poSUNEMWc1K2t2M1VuR1VNZnZwM1l5RUJpVVFpRW9sRUlCYUx1ZVhQbFN0WHVFbkMzSGxLeW96R1RUQTFBR09wSXBmTHVhU2pyVUJ6QnRYRHc4TmtiZVhrNUFSMzd0d0JzVmdNOXZiMjlzKzZLUG84d0orVWxKVHkzLy8rRjg2ZlAvL0U0S2ZPTTVMRnhpUmczQ2N3ZGVwVW9kY0VKSCtQTjl5NWM4ZEVHVjI2ZE1raThwVEkrUHIxNnlDWHk1OVpIOEJ6VndBVVhITjRLZ0FhcjYxdTNib0ZZckVZNUhLNUN3REloQTUrbXZrLysreXplc0ZQejI4TWZtUFByd2tRQ1h6MjJXY3dhOVlzcmlZZ2NDVWdsY3ZsenRYVjFYRHIxaTBUQlVBSzBSTHlWSkFLZ0Y4RE1DNndHQWZYSE41WTVwSUNPSHYyTEloRUluQjBkUFFDQUR0ckFQLzgrZk5Od0U4RlQwcXFoc0JQOGFIOVoycENJUktZUDMrK3llNkFVSldBV0N4dTByeDVjMDlFaFAvKzk3OG1Dc0NTOHBUaUwvZ2FBTWxLa2xmbURDN05nQVNLOCtmUGcwZ2tnaVpObWpRUERnNE9zZ2J3VTVNUGdmL2F0V3NQZ1A5aHlXZXNCSXgzU3lvcUttRCsvUG53MFVjZkNWb0pkT3ZXTFZna0VqV3BxNnVEYytmT2NYRWlCV0FKZVdxc3dBVFpCMkJjQXpBT3JxVW9BRXJxNzcvL0hrUWlFZGpiMjRPZm4xL0hlL2Z1RlF0MXpmKy9ncDlxSk1aSzROcTFheVpLZ0VpQWFnTDkrdlZMZWYvOTl3V2pCRzdmdnIwaE9EaTQ0NzE3OTBBa0VrRjVlYm5KSkVXMUtuUG42WlVyVjB3VXdMT3FBVHh0YzVrNGNlSnF2VjZQS3BVS1JTSVJkeWtJM1d4Q2x4eVl5OU1kYTNSbHVaT1RFMjdhdEFuejgvTnh3WUlGKzBBQUYyTUFnTitTSlV0U2YvMzFWOVRwZExoKy9Yb01DZ295aVRlOW1KV2VsKzZYZjl3NDBmZlR6OVB2YzNGeFFaRkloRUZCUWJoKy9YcFVxOVZZVUZDQTc3Ly9mcXBBWXVldjBXZ09GQlVWNFpvMWE5REp5Y2trSCtoNXpaMm5oQmVLdDBxbHd1enNiRXhLU3JMc0c0R01DY0RSMGRFa3VFK2FoTThqdUhRUnFFcWx3aDA3ZHR4VEtCVGRHanY0clprRVdyWnMyZVBubjMrdTBXZzArSzkvL2Nza0R5eGxrcUs0RTI0Y0hSMkZSUUNGaFlVV3F3QW91TWJKSEJJU2dpcVZDbk56YzNIczJMRXJwMDZkMnRxU3dYL3k1TWxuRG41ckpBRUE4UGo4ODg5WEh6eDRFRlVxRmJadTNmcUJ1Rm5pSkNVNEJWQllXSWhxdGRwaUZVQjl5NEJseTVhaFdxM0diZHUyWFhWMGRJeXlaUEFYRkJUZ2hnMGJuam40bjRRRU5tellnQnFOQnZWNnZjV1NnSmVYVit5SkV5ZXVGeFFVNExmZmZtdXg4cjgrQmFCV3F6RW5Kd2Y3OXUwckhBSVFpVVRvN094Y0w4T2EyeHNuc1Znc3h2NzkrNk5hclVhVlNvV1RKazFhQndDZVFnQS94WmVTaFdZT1BnbjhyNTUrSC8xKytudk96czZDSUFFQThGcTJiTm1XUTRjT29WcXR4bjc5K3BtTXY2WG1KOFZYa0FRZ2w4dE5ndnkway9KL1RXWktZcHJKRmkxYVJJR3VhdE9temNzTS9OWkRBdkh4OGNOT25UcDFUNmZUNFZkZmZmVll5c25jK1VtZlR5NlhDNGNBVWxKU1ZoY1ZGYUZHbzdGb0JjQlBZaWNuSnd3S0NrS1ZTb1ZhclJZM2JkcjBIN2xjSG00SjREOTE2aFRxOVhxemd2OUpTVUNyMVdKaFlTRk9temJON0NUZzRlRVI5Y01QUDFUczI3Y1A4L1B6c1VXTEZnL0lmM29lUzFVQTlLNE5TeWNBNTRrVEozSUVZS2tLb0NFU2NIUjB4TkdqUjZOR28wR2RUb2VmZi82NVJpd1d0N1FrOEZOU21BUDhqME1DWXJIWW9raEFKcE8xenNuSktUeHk1QWhxTkJwTVRrNjJlUER6RllDVGt4TnFOQm9xQXFZQmdMUEZFc0Q0OGVOWEVnSFkyTmcwV0dpeEZNK3ZCVGc1T2VIWFgzL055ZGlQUC81NEJ3QUVQbWZ3dDFpNmRHbWFNZmdEQXdPNXoxZmYydFdTNGljV2l6RXdNTkNFQktaUG41NEdBQzJlWnh3bEVrbkxUWnMyWmZ6NDQ0OUU2RnhoMmxMaTE1QTNWcVoyZG5ZY0FTUW1KbjVueVFUZ05HN2N1RVVHZ3dHMVdpM0hhUHl0UUVzSk1uOEdvOC9wN2UyTjZlbnBxTlZxc2Fpb0NELy8vUE1zR3h1YjRPZVV0SzNXckZtejdlVEprMWhZV0lnYk4yNThKUGpORlZmNnV3OGpnWTBiTjZKT3AwT0R3WUJ6NXN6WkpoYUxXejJQT05yYjI0ZnMyclVyNzhTSkUxaFFVSURwNmVrbWI5dDltSUt5bEx5a3o2bFFLRkNyMVdKV1ZoWW1KQ1FzQWdBbmkwUy9yNit2NDZ1dnZqcS91TGdZdFZvdHVybTVQWkMwbHFvQStETFcxOWNYVjY5ZWpWcXRGZzBHQTI3WXNHRy9uNTlmdDZ0WHIzNzZMQkwycjcvK1d0K2lSWXRPR28ybStNU0pFNmpYNjNIanhvMmM3TGMwOEQ4dUNRUUZCWm1Rd09yVnEwdTh2YjA3Mzc1OWUvMnppT052di8zMmVwczJiWHFVbHBaKy8rT1BQM0xnOS9IeHFYZjVaS2tLd0RpT2JtNXVxTlZxTVNNakEzdjI3RG5mMDlQVDBTSUpvRXVYTHMySERSczJ2YVNrQkxWYUxYYm8wTUVrNkpiR3RJOGlBUjhmSDB4TlRlV1VRRkZSMGVVUkkwWk1lOXBMQWdBSUdEMTY5THYvK2M5L0xodytmQmgxT2gybXA2ZWpuNStmUllQL2NVbkF6OCtQVTFRR2d3RUxDd3N2RGhvMGFESTg1VmV2QTBEUXYvNzFyNWxuenB5NTl2MzMzNk5PcDhNVksxYWd0N2Uzb01CUDhhVFBHeG9haWxxdEZuZnUzSWxkdW5TWkhoTVQwOXhTQ2FCcDM3NTl4KzNkdXhlMVdpMUdSMGMvc09ZU0dnbDRlSGpndEduVFVLdlZvbDZ2eC8zNzkrT3VYYnNPSkNRa2pBR0F3T3JxYXNNL1NkYmEydG9LQUFqbzI3ZnZ5TUxDd3RMZmZ2c045KzdkaXpxZERqLzU1Qk91S2NUU3dmKzRKT0RwNllrelo4N2s0bmpnd0FIY3ZuMzd2cDQ5ZTQ0R2dJQi9Hc2UvL3ZwclBRQUVEaGt5NUkzOSsvY2ZPblhxRk5JRU5IbnlaTzd6Q1EzOEZEOUhSMGVNam81R3JWYUwyN1p0dytqbzZIRWRPM1pzYXFrRVlCc2FHdHE3ckt3TWRUb2REaGt5cE42dFFFc0wrcU5JUUM2WFk4K2VQWEgzN3QyY2xEMTA2QkJxdGRwajQ4YU5tK3Z0N2QwSkFGcE1uVHExZFcxdGJVVkR5VHAxNnRUV0FOREN5OHNyOXMwMzMvems0TUdEMzU4NWN3WVBIanlJQlFVRm1KbVppUU1HRE9CMlQranZXenI0SDBVQ3huRk1URXpFakl3TTFPbDBXRnhjakg4MzVod2VOMjdjbk1lSjQ5L0U2UUVBZ1FFQkFWMm5USm15NE5peFl6K2VQbjBhOSsvZmp3VUZCVFJUUGhCSFN3Yy9QdzlwQzNESWtDR28xV3B4NDhhTkdCQVEwTHRqeDQ2MlQrMVU2ZE1rZ002ZE84c09IRGpRMm1Bd0hMcDc5Njd0amgwN1lQZnUzZHpMSitobUd1UGJhQzNOMC9sM3VqSEkwZEVSYnR5NEFRNE9EbEJUVXdOdnZ2a205T3JWQzJReUdVaWxVbWphdENuWTI5dlgzTHg1ODFScGFlbXhpb3FLVTlldVhUdFhVMU56NThhTkczODZPVGsxbDhsa2RzN096cDR0Vzdac25aQ1FFTzdvNk5qNjl1M2JOamR1M0lDN2QrOUNUVTBOR0F3R1NFMU5CWkZJQkxkdTNlTCtMbjBPK2x5V0hqLzZmQStMWTExZEhhU2twRURQbmoxQktwV0NUQ1lEZTN0N2t6aWVPWFBtdDJ2WHJwMjdkKy9lWDRoNFh5d1dTK3pzN0pxNXVMajRCQWNIdCt6Um8wZDRzMmJOQW0vZHVpVzllZk1tVkZWVndkMjdkeUUvUHg4MmJOZ0FOalkyRDQyanBjZVA4T0xnNEFCRGh3NkY0Y09IdzVrelo2cFRVbElpTzNic2VPckFnUU5QNVFacjZWTW1nTHA5Ky9aVjNiNTkrNkpVS3ZYejlmV0ZtemR2Z3FPam84bTlBSllhL0laSWdBWkRMcGZEb2tXTFlNZU9IZENyVnkvbzE2OGZPRHM3dzYxYnQyUVNpYVJ0bHk1ZDJ2YnUzUnRzYlcxQktwV0NXQ3dHUkFSRWhKcWFHcWlxcW9LYk4yL0NsU3RYb0s2dURtN2N1QUVhalFhMFdpMzg4Y2NmNE9EZ1lFS1dRZ1AvbzBqQU9JN2ZmUE1ON05peEF4SVNFaUF4TVpIZVVzVEZzVmV2WHZYRzhkNjllMUJWVlFWWHJseUJ5c3BLUUVTNGZQa3k1T2ZuUTFGUkVWUldWb0pjTHVjdW82a3Zqa0xKUDdsY0RqZHUzQUJmWDErb3E2dURQLy84OHlJaVZzZkV4TlFkT0hEQThtNEVxcTJ0clFPQXFrdVhMbFg0K1BqNCtmajRnSU9Ed3dNM0ExbHk4QitIQk02ZlB3OVpXVm13Y2VOR2lJbUpnVFp0MmtCa1pDUzBhdFVLN093YXZsV3N1cm9hVHAwNkJZY1BINGFUSjAvQ3dZTUhvWG56NXZEbm4zOCtNbW1GQXY0bklZRS8vdmdEZHUvZURXdlhybjJpT042NWN3ZCsrZVVYT0hMa0NKdzhlUklPSHo0TWNya2NidDI2SlhqdzE2Y0FmSHg4b0s2dURpNWZ2bHdCQUZWMWRYVVdmWDI5eTF0dnZiV3lzTEFRdFZvdDJ0blpOZGg1WmFscnNJWnFBdncxTFQyWG82TWppa1FpbE12bDZPbnBpWjA3ZDhhNHVEZ2NNR0FBeHNYRllaY3VYZERIeHdlZG5KeTQ3elArZWY1YW43OVdGVXE4SGxVVGVKSTRlbmg0WUtkT25UQXVMZzU3OSs2TmNYRnhHQjhmajI1dWJpaVh5MUVrRW5FRjVzZU5vMURpVlY4VFVGWldGZzRZTUNEVmt0dUFhUm5RckgvLy9tOFhGeGRqUVVFQnhzYkdtZ3lPVUFhRFR3SlBrc1FQODQrYnJFS0xFNHZqMHk4QWlzVmlqSTJOeFlLQ0F0eTJiUnQyN05qeDdlam82R1lXVFFEeDhmRTJDb1VpdHFTa3BMYWdvQUNUazVNZk9CTWd0Qm1OUDVNOUtva2Y1ZW43K2RWOW9jLzQ1b3BqUTZBWGFwNFpud0pNVGs1R25VNkhxMWV2cm5WMmRvNk5pb3F5c1dnQ21ESmxpZ1FBQXJLenMwL3E5WHBjdkhneGlrUWlqckdGT3JQUjREd3FpZm5KekUvU1J5V3J0WUtmeGZISkZBQXRGeGN2WG94cXRSby8vL3p6a3dBUU1ISGlSSWxGRThDa1NaTkVBT0EyZmZyMERWUUg0RE9iME5lMGowcml4L1VOL1Q1ckJUK0w0NU1wQUhkM2Q5UnF0WmlkblkzRGh3L2ZBQUJ1NDhlUHQveXJnV05qWTV2MTZkUG5EWVBCZ0hxOUhudjE2dlhBOVdCQ1QvYUdrdTZmZW1zSFBZdmpreFVBSFIwZHNWZXZYbGhRVUlDYk4yL0dpSWlJMXlNakk1dUJFS3hqeDQ0eWUzdjdkbHF0OXJwZXI4Y0ZDeGJVdXd5d2x1Um5vR2R4ZkpxMUVaTC9DeFlzUUoxT2gwdVhMcjF1WTJQVE5pSWlRaGl2cm52cnJiZEVBT0M1WU1HQ0xMb2VqSC9LeWRxcTNNd3ovelR2VmZEdzhFQzFXbzFLcFJMZmVPT05MQUR3ZlAzMTEwVWdGUFB5OG1xZW1KZzRzYWlvQ1BWNlBmYnYzOS9xbGdITU0vK3M1SC8vL3YxUnI5Zmo1czJiTVNvcWFxSkNvV2dPUXJLQkF3Zkt4R0p4Njl6YzNNckN3a0pNUzBzeldRWXdFbUNlK2ZxYmYwUWlFYWFscGFGV3E4V3Z2LzY2VWlRU3RVNUtTaExXbTZzblRKZ2dBZ0RYZDk1NUo3V3dzQkNMaW9vd0ppYUdMUU9ZWi80UjhqOG1KZ1lMQ3dzeEl5TURCdzhlbkFvQXJtUEdqQkdCMEN3Nk90ck96OCt2dTFhcnJTb3NMTVI1OCtZSnZpbUllZWFmZGZQUHZIbnpzS0NnQUZldVhGbmw3dTdlUFN3c1RIQ3ZyUWNBZ0lrVEo0b0J3R3YrL1BsWmVyMGVpNHFLME4vZm45VUNtR2UrZ2JXL3Y3OC9GaFVWWVhaMk5oWC92TWFNR1NNR29WcFVWRlRUc0xDd2dRVUZCYlZGUlVVNGYvNzh4N3JYbm5ubUd4UDRhNnV5UWdBQUNtdEpSRUZVNmZLUCtmUG5vMTZ2eDlXclY5Y0dCZ1lPREFzTGF3cEN0bjc5K2trQXdHZmh3b1dxd3NKQ05CZ00zRjJCUXJucGhubm1uOGZOU1IwNmRFQ0R3WUE1T1RuNDVwdHZxZ0RBSnlFaFFRSkN0OGpJeUtadDI3YnRyOUZvN2hVVkZlR1hYMzc1UUMyQUZRU1piOHlGUDdsY2psOSsrU1hxOVhwTVMwdTc1Ky92M3o4ME5MUXBXSU85L3ZycllnRHdtalZyMWs2OVhvOEdnd0hqNCtNRmMyRW84OHcvNjRzLzQrUGowV0F3WUdabUpvNFpNMlluQUhpTkdqVktETlppRVJFUlRUdzhQT0tWU3VWMWVsQjdlM3ZXRjhCOG85LzN0N2UzeDh6TVROVHBkTGg0OGVMcnpzN084ZTNidDI4QzFtUmp4NDRWQTREcnFGR2o1aFlVRktEQllNQVpNMmF3Z2lEempiN3dOMlBHREN3cUtzSXRXN1pnUWtMQ1hBQndIVEZpaEJpc3pmN3VaZ3BNVFUwdEx5d3N4T0xpWXV6U3BRc3JDRExmYUF0L1hicDBRWVBCZ0VxbEVtZk1tRkVPQUlFOWUvYVVnYldhaDRkSHM2Q2dvTDVLcGZLMndXREFqSXdNN3MwdGpBU1liMHpnOS9iMnhveU1EQ3dvS01EbHk1ZmY5dmIyN3V2bTV0WU1yTm4rWGdxNGpSZ3hZZzY5SEdMeDRzV0Nld2tHODh6L3J5OUxXYng0TVJvTUJ0eTBhUk1tSkNUTUFRQzNWMTU1UlF6V2JvbUppVElBOEo4N2Q2NnFvS0FBaTR1TGNjS0VDUTF1RFRJU1lONmF3QytYeTNIQ2hBbFlYRnlNR1JrWm1KS1NvZ0lBL3g0OWVzaWdzVmhZV0ZnVEp5ZW44UFhyMTU4cUxDekVrcElTSERCZ2dHRGVoY2M4OC8vMFhZa0RCZ3pBNHVKaXpNdkx3MDgvL2ZTVWc0TkRlTHQyN1pwQVk3SXhZOGFJUER3OEhBSUNBdnBsWkdSYy8vdXRzZGk1YzJkR0FzeGJMZmc3ZCs2TWVyMGVOUm9OTGxxMDZMcVhsMWMvTnpjM2grSERoNHVnc2RscnI3MG05dkR3Y0k2TmpSMmJtNXRiVlZ4Y2pEcWREcU9qb3hrSk1HOTE0S2UzL09yMWVreE5UYTFxMzc3OU9EYzNOK2RHc2U1L1NEMUFBZ0R1TDczMDB2VGMzTnlhNHVKaTFHZzBHQkVSd1VpQWVhc0JmMFJFQkdvMEd1Nmd6d3N2dkRBREFOeDc5T2doZ2NadWlZbUpVZ0R3SEQ1OCtDZDVlWG4zaTR1TFVhdlZZbHhjSENNQjVnVVAvcmk0T05ScXRWaFlXSWhyMXF5NTM2ZFBuMDhBd0xOSGp4NVNZUFovMXFkUEh4a0FlSTBZTVdLdVVxbThUNjhXNjkyNzl3Tm5CdmdkZzR3TW1MZUVXNHo1THpOeGRIVEUzcjE3WTBGQkFlcjFlbHl6WnMzOXBLU2t1UURnMWFncS9rOUtBb01IRDU2Wm5aMTlyN2k0R0V0TFMzSDQ4T0dNQkpnWEhQaUhEeCtPcGFXbFdGQlFnT25wNmZkNjllbzFrNEgvOFVoQTBhTkhqMG03ZCsrK2JUQVlzTFMwRkdmTm1vVUtoY0xrM1hEVzhoWmQ1cTNqcmNlVWx3cUZBbWZObW9XbHBhV28wV2h3K2ZMbHQyTmpZLy8xZDE0ejhEOEdDVWdCd0xWTm16YkRObTdjZUZHdjEyTnBhU211VzdjT1EwSkM2bjFCWkdON3h4N3psdkZPUS80TFRVTkNRbkRkdW5WWVVsS0NPVGs1dUhEaHdvc0JBUUhEQU1DVnJmbWZ3RjU5OVZXeHU3dTdvNGVIUjVldnZ2cXFYSzFXWTBsSkNlcDBPaHd6Wm96SkZlTU52U1dXa1FEenozTEdOeTcwaVVRaUhETm1ET3AwT2pRWURMaGp4dzc4NElNUHlsMWRYYnU0dWJrNU51cXR2ditSQkpyS1pMTFdFeWRPWEx0bno1NWFXaEo4OTkxMzZPdnIrMEJ0Z0NrQzVwL0hqRys4MXZmMTljWHZ2dnNPUzB0TFVhdlY0dXJWcTJ0SGpCaXhWaXFWdG5aemMydkt3UDgvMk9qUm8wVjkrdlN4QlFDdjZPam8xOWVzV1hOZW85RmdhV2twRmhVVjRSdHZ2TUVOenFQZUc4L0lnUGwvQW5yK2pFOTU1dWJtaG0rODhRWVdGUlZoY1hFeFptWm00c0tGQzgrSGhvYSsvbmV4ejdaUmR2ZzlxN3FBdTd1N282T2pZK1JiYjcyMVBUTXo4MzVSVVJIdTNic1hjM0p5Y09USWtTaVZTaDlZRmp3dUdUQlNZQzhpZlJqb2plVytWQ3JGa1NOSFlrNU9EdTdkdXhjMUdnMnVXYlBtL3VqUm83YzdPRGhFdXJtNU9mYnMyWk90OTUrMmpSbzFTaFFhR21vSEFGNmhvYUhKMzN6enpROUtwUktMaTRzNUluajU1WmROcmx0NkhESjRGQ2t3YjUyZVAvNFBBejM5LzVkZmZwa0R2bDZ2eHkxYnR1RHMyYk9QaDRTRWpBUUE3L2J0Mjl1OThzb3JiTlovbHBhUWtDRHg4UEJ3QUlDZ1BuMzZ6RXBOVGYwakx5K1BJNEs4dkR4OCsrMjMwZFhWbGFzUjhKY0hmREpvaUJTWXQwN1BIM2QrWGxDK09EbzZvcXVySzc3OTl0dVlsNWVIZS9mdXhjTENRdHkrZlR0KytlV1hmN3p3d2d1ekFDREkzZDNkb1dmUG5xeXQ5M24zREhoNGVEaloyZG0xN2QrLy8veVZLMWVleThuSlFZUEJnSHYzN3NWOSsvYmhOOTk4Z3dNSERrUjdlM3VPRElqUkd5S0Zoc2lCZVdIN2hzYVo4b0R5d3RIUkVlM3Q3WEhnd0lINHpUZmY0TDU5KzdDMHRCUjFPaDF1M2JvVkZ5NWNlSzVQbno3emJXMXQyM3A0ZURqMTd0MmI3ZTJiczBpWWxKUmtBd0RPTXBrc3VGdTNiaDhzWExqd2gxMjdkcUZPcDhQUzBsSk9ybjN4eFJjNGJOZ3dkSE56NHk0Zm9VRi9YRkpnWHRpZUQzYnljcmtjM2R6Y2NOaXdZZmpGRjErZ1hxL0h2WHYzY3VmMjE2OWZqM1BtekRuZXFWT25EMlF5V1RBQU9QZnAwOGRtNU1pUmdwYjdJbXNpZ2l0WHJraVBIajNhOU1LRkMwNGhJU0ZSblR0M0hoWWJHOXZIMWRYVjBjSEJBV3hzYkVBcy9yOGRtWFBuenNFdnYvd0N2Lzc2SzF5OWVoVk9uRGdCdDIvZmhtdlhyb0ZjTG9kYnQyNkJnNE1EM0xwMUMrUnlPZHk4ZVpONWdYb2FSd2NIQjdoNTh5WTRPenREczJiTklDUWtCRnhjWEtCTm16WVFIQndNM3Q3ZUFBQlFXMXNMZCsvZWhhdFhyOExWcTFkdmxKZVhhOHZMeTNmOThzc3Zoenc4UEs2SGg0Zi81ZXJxV3J0bHl4WVVPbTZzc2xpUmxKUWt2WGp4b3UyUkkwZWEyZGpZdUVaRVJIU1Bpb3JxMDc1OSszaFhWMWYzNXMyYmc1MmRIVWlsVWhDTHhSd3AxTmJXUW1WbEpWeTRjQUgrK3VzdnVISGpCbFJYVjhQdDI3ZkJ4c1lHN3QyN3g3ekFmTE5temNEVzFoWWNIUjJoYWRPbW9GQW93TlBURTZUUy95dlMxOVhWd2YzNzkrSGV2WHZ3MTE5L3djMmJOK0hxMWF1WGZ2cnBwN0lmZnZoQmUvVG8wZUo3OSs1ZGpZaUkrTlBkM2IxYW85SFVXaE5XckxwYU9YYnNXTkhSbzBlbEZ5OWV0S3Vzckd3S0FBNXQyN2J0NE9ucEdSY1ZGUlhwNStmWHJubno1aDUyZG5aZ2IyOFB0cmEySUpWS1FTS1JnRmdzQnBGSUJDS1JpQ01JWnNLeXVybzZRRVR1aThCZVUxTURkKzdjZ2J0MzcwSjFkVFhjdW5YcjR0bXpaMzg2ZHV6WTRjckt5djBuVHB3NERnQzNGQXJGWHdxRm9pb3NMS3gydzRZTmFJMHhhalRiRmErLy9ycm8wcVZMa2dzWEx0aWNQMy9lOXZ6NTgwMEF3TjdSMGRIWjM5Ky9wVnd1RDVUTDVmN0J3Y0dCenM3T2lpWk5talMzc2JGcGFtTmowMVFpa2RneU9BblRhbXRycSsvZHUvZFhkWFgxWDNmdTNQbnoyclZyRjA2ZE9uWDY1czJiWjIvZXZIbjY3Tm16LzdseDQ4WTFBTGpqNWVWMTE4dkxxMXFoVU54emQzZS92M2J0V3JUMitEVGEvY3FKRXllS0xseTRJSzZzckpTSVJDTHB1WFBucE9mT25aTUJnQzBBeUFCQUNnQ1N2NzlFalRsV0FqYjgrK3YrMzErMUFGQURBTlhlM3Q0MVBqNCt0WFYxZGJXZW5wNzNQVDA5NjlMUzByQ3hCWWdsTmM5U1VsSkVZckZZSkJLSlJQdjM3eGVKUkNKQVJCWXI0UklBQUFERXhjVWhJbUpkWFIwMlJxQXpZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpKZ3hZOGFNR1RObXpDelovai9lenYwRVZzRTBqd0FBQUFCSlJVNUVya0pnZ2c9PSc7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRvb2x0aXA7XG4iLCIvLyBpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuLy8gICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0ge31cbi8vIH1cbm1vZHVsZS5leHBvcnRzID0gdHJlZSA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcbnZhciBldmVudHN5c3RlbSA9IHJlcXVpcmUoXCJiaW9qcy1ldmVudHNcIik7XG5ldmVudHN5c3RlbS5taXhpbih0cmVlKTtcbi8vdG50LnV0aWxzID0gcmVxdWlyZShcInRudC51dGlsc1wiKTtcbi8vdG50LnRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG4vL3RudC50cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuXG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZShcImJhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lXCIpO1xuXG5ldmVudHMub25BbGwgPSBmdW5jdGlvbihjYWxsYmFjayxjb250ZXh0KXtcbiAgdGhpcy5vbihcImFsbFwiLCBjYWxsYmFjayxjb250ZXh0KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBNaXhpbiB1dGlsaXR5XG5ldmVudHMub2xkTWl4aW4gPSBldmVudHMubWl4aW47XG5ldmVudHMubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICBldmVudHMub2xkTWl4aW4ocHJvdG8pO1xuICAvLyBhZGQgY3VzdG9tIG9uQWxsXG4gIHZhciBleHBvcnRzID0gWydvbkFsbCddO1xuICBmb3IodmFyIGk9MDsgaSA8IGV4cG9ydHMubGVuZ3RoO2krKyl7XG4gICAgdmFyIG5hbWUgPSBleHBvcnRzW2ldO1xuICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgfVxuICByZXR1cm4gcHJvdG87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50cztcbiIsIi8qKlxuICogU3RhbmRhbG9uZSBleHRyYWN0aW9uIG9mIEJhY2tib25lLkV2ZW50cywgbm8gZXh0ZXJuYWwgZGVwZW5kZW5jeSByZXF1aXJlZC5cbiAqIERlZ3JhZGVzIG5pY2VseSB3aGVuIEJhY2tvbmUvdW5kZXJzY29yZSBhcmUgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnRcbiAqIGdsb2JhbCBjb250ZXh0LlxuICpcbiAqIE5vdGUgdGhhdCBkb2NzIHN1Z2dlc3QgdG8gdXNlIHVuZGVyc2NvcmUncyBgXy5leHRlbmQoKWAgbWV0aG9kIHRvIGFkZCBFdmVudHNcbiAqIHN1cHBvcnQgdG8gc29tZSBnaXZlbiBvYmplY3QuIEEgYG1peGluKClgIG1ldGhvZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRXZlbnRzXG4gKiBwcm90b3R5cGUgdG8gYXZvaWQgdXNpbmcgdW5kZXJzY29yZSBmb3IgdGhhdCBzb2xlIHB1cnBvc2U6XG4gKlxuICogICAgIHZhciBteUV2ZW50RW1pdHRlciA9IEJhY2tib25lRXZlbnRzLm1peGluKHt9KTtcbiAqXG4gKiBPciBmb3IgYSBmdW5jdGlvbiBjb25zdHJ1Y3RvcjpcbiAqXG4gKiAgICAgZnVuY3Rpb24gTXlDb25zdHJ1Y3Rvcigpe31cbiAqICAgICBNeUNvbnN0cnVjdG9yLnByb3RvdHlwZS5mb28gPSBmdW5jdGlvbigpe31cbiAqICAgICBCYWNrYm9uZUV2ZW50cy5taXhpbihNeUNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gKlxuICogKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuICogKGMpIDIwMTMgTmljb2xhcyBQZXJyaWF1bHRcbiAqL1xuLyogZ2xvYmFsIGV4cG9ydHM6dHJ1ZSwgZGVmaW5lLCBtb2R1bGUgKi9cbihmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3QgPSB0aGlzLFxuICAgICAgbmF0aXZlRm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLFxuICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBpZENvdW50ZXIgPSAwO1xuXG4gIC8vIFJldHVybnMgYSBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIG1hdGNoaW5nIHRoZSBtaW5pbWFsIEFQSSBzdWJzZXQgcmVxdWlyZWRcbiAgLy8gYnkgQmFja2JvbmUuRXZlbnRzXG4gIGZ1bmN0aW9uIG1pbmlzY29yZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAga2V5czogT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2Ygb2JqICE9PSBcImZ1bmN0aW9uXCIgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleXMoKSBjYWxsZWQgb24gYSBub24tb2JqZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXksIGtleXMgPSBbXTtcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBrZXlzW2tleXMubGVuZ3RoXSA9IGtleTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgICB9LFxuXG4gICAgICB1bmlxdWVJZDogZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICAgICAgfSxcblxuICAgICAgaGFzOiBmdW5jdGlvbihvYmosIGtleSkge1xuICAgICAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gICAgICB9LFxuXG4gICAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhcyhvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgb25jZTogZnVuY3Rpb24oZnVuYykge1xuICAgICAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgZnVuYyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHZhciBfID0gbWluaXNjb3JlKCksIEV2ZW50cztcblxuICAvLyBCYWNrYm9uZS5FdmVudHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQSBtb2R1bGUgdGhhdCBjYW4gYmUgbWl4ZWQgaW4gdG8gKmFueSBvYmplY3QqIGluIG9yZGVyIHRvIHByb3ZpZGUgaXQgd2l0aFxuICAvLyBjdXN0b20gZXZlbnRzLiBZb3UgbWF5IGJpbmQgd2l0aCBgb25gIG9yIHJlbW92ZSB3aXRoIGBvZmZgIGNhbGxiYWNrXG4gIC8vIGZ1bmN0aW9ucyB0byBhbiBldmVudDsgYHRyaWdnZXJgLWluZyBhbiBldmVudCBmaXJlcyBhbGwgY2FsbGJhY2tzIGluXG4gIC8vIHN1Y2Nlc3Npb24uXG4gIC8vXG4gIC8vICAgICB2YXIgb2JqZWN0ID0ge307XG4gIC8vICAgICBfLmV4dGVuZChvYmplY3QsIEJhY2tib25lLkV2ZW50cyk7XG4gIC8vICAgICBvYmplY3Qub24oJ2V4cGFuZCcsIGZ1bmN0aW9uKCl7IGFsZXJ0KCdleHBhbmRlZCcpOyB9KTtcbiAgLy8gICAgIG9iamVjdC50cmlnZ2VyKCdleHBhbmQnKTtcbiAgLy9cbiAgRXZlbnRzID0ge1xuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uIFBhc3NpbmcgYFwiYWxsXCJgIHdpbGwgYmluZFxuICAgIC8vIHRoZSBjYWxsYmFjayB0byBhbGwgZXZlbnRzIGZpcmVkLlxuICAgIG9uOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSB8fCAodGhpcy5fZXZlbnRzW25hbWVdID0gW10pO1xuICAgICAgZXZlbnRzLnB1c2goe2NhbGxiYWNrOiBjYWxsYmFjaywgY29udGV4dDogY29udGV4dCwgY3R4OiBjb250ZXh0IHx8IHRoaXN9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIG9ubHkgYmUgdHJpZ2dlcmVkIGEgc2luZ2xlIHRpbWUuIEFmdGVyIHRoZSBmaXJzdCB0aW1lXG4gICAgLy8gdGhlIGNhbGxiYWNrIGlzIGludm9rZWQsIGl0IHdpbGwgYmUgcmVtb3ZlZC5cbiAgICBvbmNlOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uY2UnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIG9uY2UgPSBfLm9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub2ZmKG5hbWUsIG9uY2UpO1xuICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBvbmNlLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgcmV0dXJuIHRoaXMub24obmFtZSwgb25jZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSBvbmUgb3IgbWFueSBjYWxsYmFja3MuIElmIGBjb250ZXh0YCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyB3aXRoIHRoYXQgZnVuY3Rpb24uIElmIGBjYWxsYmFja2AgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3MgZm9yIHRoZSBldmVudC4gSWYgYG5hbWVgIGlzIG51bGwsIHJlbW92ZXMgYWxsIGJvdW5kXG4gICAgLy8gY2FsbGJhY2tzIGZvciBhbGwgZXZlbnRzLlxuICAgIG9mZjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXRhaW4sIGV2LCBldmVudHMsIG5hbWVzLCBpLCBsLCBqLCBrO1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIWV2ZW50c0FwaSh0aGlzLCAnb2ZmJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkpIHJldHVybiB0aGlzO1xuICAgICAgaWYgKCFuYW1lICYmICFjYWxsYmFjayAmJiAhY29udGV4dCkge1xuICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIG5hbWVzID0gbmFtZSA/IFtuYW1lXSA6IF8ua2V5cyh0aGlzLl9ldmVudHMpO1xuICAgICAgZm9yIChpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGlmIChldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0pIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSByZXRhaW4gPSBbXTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sgfHwgY29udGV4dCkge1xuICAgICAgICAgICAgZm9yIChqID0gMCwgayA9IGV2ZW50cy5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgZXYgPSBldmVudHNbal07XG4gICAgICAgICAgICAgIGlmICgoY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjay5fY2FsbGJhY2spIHx8XG4gICAgICAgICAgICAgICAgICAoY29udGV4dCAmJiBjb250ZXh0ICE9PSBldi5jb250ZXh0KSkge1xuICAgICAgICAgICAgICAgIHJldGFpbi5wdXNoKGV2KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXJldGFpbi5sZW5ndGgpIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRyaWdnZXIgb25lIG9yIG1hbnkgZXZlbnRzLCBmaXJpbmcgYWxsIGJvdW5kIGNhbGxiYWNrcy4gQ2FsbGJhY2tzIGFyZVxuICAgIC8vIHBhc3NlZCB0aGUgc2FtZSBhcmd1bWVudHMgYXMgYHRyaWdnZXJgIGlzLCBhcGFydCBmcm9tIHRoZSBldmVudCBuYW1lXG4gICAgLy8gKHVubGVzcyB5b3UncmUgbGlzdGVuaW5nIG9uIGBcImFsbFwiYCwgd2hpY2ggd2lsbCBjYXVzZSB5b3VyIGNhbGxiYWNrIHRvXG4gICAgLy8gcmVjZWl2ZSB0aGUgdHJ1ZSBuYW1lIG9mIHRoZSBldmVudCBhcyB0aGUgZmlyc3QgYXJndW1lbnQpLlxuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ3RyaWdnZXInLCBuYW1lLCBhcmdzKSkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgdmFyIGFsbEV2ZW50cyA9IHRoaXMuX2V2ZW50cy5hbGw7XG4gICAgICBpZiAoZXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGV2ZW50cywgYXJncyk7XG4gICAgICBpZiAoYWxsRXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGFsbEV2ZW50cywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUZWxsIHRoaXMgb2JqZWN0IHRvIHN0b3AgbGlzdGVuaW5nIHRvIGVpdGhlciBzcGVjaWZpYyBldmVudHMgLi4uIG9yXG4gICAgLy8gdG8gZXZlcnkgb2JqZWN0IGl0J3MgY3VycmVudGx5IGxpc3RlbmluZyB0by5cbiAgICBzdG9wTGlzdGVuaW5nOiBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzO1xuICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGRlbGV0ZUxpc3RlbmVyID0gIW5hbWUgJiYgIWNhbGxiYWNrO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgaWYgKG9iaikgKGxpc3RlbmVycyA9IHt9KVtvYmouX2xpc3RlbmVySWRdID0gb2JqO1xuICAgICAgZm9yICh2YXIgaWQgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgIGxpc3RlbmVyc1tpZF0ub2ZmKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgICAgaWYgKGRlbGV0ZUxpc3RlbmVyKSBkZWxldGUgdGhpcy5fbGlzdGVuZXJzW2lkXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICB9O1xuXG4gIC8vIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHNwbGl0IGV2ZW50IHN0cmluZ3MuXG4gIHZhciBldmVudFNwbGl0dGVyID0gL1xccysvO1xuXG4gIC8vIEltcGxlbWVudCBmYW5jeSBmZWF0dXJlcyBvZiB0aGUgRXZlbnRzIEFQSSBzdWNoIGFzIG11bHRpcGxlIGV2ZW50XG4gIC8vIG5hbWVzIGBcImNoYW5nZSBibHVyXCJgIGFuZCBqUXVlcnktc3R5bGUgZXZlbnQgbWFwcyBge2NoYW5nZTogYWN0aW9ufWBcbiAgLy8gaW4gdGVybXMgb2YgdGhlIGV4aXN0aW5nIEFQSS5cbiAgdmFyIGV2ZW50c0FwaSA9IGZ1bmN0aW9uKG9iaiwgYWN0aW9uLCBuYW1lLCByZXN0KSB7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIEhhbmRsZSBldmVudCBtYXBzLlxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW2tleSwgbmFtZVtrZXldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBzcGFjZSBzZXBhcmF0ZWQgZXZlbnQgbmFtZXMuXG4gICAgaWYgKGV2ZW50U3BsaXR0ZXIudGVzdChuYW1lKSkge1xuICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChldmVudFNwbGl0dGVyKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW25hbWVzW2ldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIEEgZGlmZmljdWx0LXRvLWJlbGlldmUsIGJ1dCBvcHRpbWl6ZWQgaW50ZXJuYWwgZGlzcGF0Y2ggZnVuY3Rpb24gZm9yXG4gIC8vIHRyaWdnZXJpbmcgZXZlbnRzLiBUcmllcyB0byBrZWVwIHRoZSB1c3VhbCBjYXNlcyBzcGVlZHkgKG1vc3QgaW50ZXJuYWxcbiAgLy8gQmFja2JvbmUgZXZlbnRzIGhhdmUgMyBhcmd1bWVudHMpLlxuICB2YXIgdHJpZ2dlckV2ZW50cyA9IGZ1bmN0aW9uKGV2ZW50cywgYXJncykge1xuICAgIHZhciBldiwgaSA9IC0xLCBsID0gZXZlbnRzLmxlbmd0aCwgYTEgPSBhcmdzWzBdLCBhMiA9IGFyZ3NbMV0sIGEzID0gYXJnc1syXTtcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4KTsgcmV0dXJuO1xuICAgICAgY2FzZSAxOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEpOyByZXR1cm47XG4gICAgICBjYXNlIDI6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIpOyByZXR1cm47XG4gICAgICBjYXNlIDM6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIsIGEzKTsgcmV0dXJuO1xuICAgICAgZGVmYXVsdDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suYXBwbHkoZXYuY3R4LCBhcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpc3Rlbk1ldGhvZHMgPSB7bGlzdGVuVG86ICdvbicsIGxpc3RlblRvT25jZTogJ29uY2UnfTtcblxuICAvLyBJbnZlcnNpb24tb2YtY29udHJvbCB2ZXJzaW9ucyBvZiBgb25gIGFuZCBgb25jZWAuIFRlbGwgKnRoaXMqIG9iamVjdCB0b1xuICAvLyBsaXN0ZW4gdG8gYW4gZXZlbnQgaW4gYW5vdGhlciBvYmplY3QgLi4uIGtlZXBpbmcgdHJhY2sgb2Ygd2hhdCBpdCdzXG4gIC8vIGxpc3RlbmluZyB0by5cbiAgXy5lYWNoKGxpc3Rlbk1ldGhvZHMsIGZ1bmN0aW9uKGltcGxlbWVudGF0aW9uLCBtZXRob2QpIHtcbiAgICBFdmVudHNbbWV0aG9kXSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMgfHwgKHRoaXMuX2xpc3RlbmVycyA9IHt9KTtcbiAgICAgIHZhciBpZCA9IG9iai5fbGlzdGVuZXJJZCB8fCAob2JqLl9saXN0ZW5lcklkID0gXy51bmlxdWVJZCgnbCcpKTtcbiAgICAgIGxpc3RlbmVyc1tpZF0gPSBvYmo7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBvYmpbaW1wbGVtZW50YXRpb25dKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBFdmVudHMuYmluZCAgID0gRXZlbnRzLm9uO1xuICBFdmVudHMudW5iaW5kID0gRXZlbnRzLm9mZjtcblxuICAvLyBNaXhpbiB1dGlsaXR5XG4gIEV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gICAgdmFyIGV4cG9ydHMgPSBbJ29uJywgJ29uY2UnLCAnb2ZmJywgJ3RyaWdnZXInLCAnc3RvcExpc3RlbmluZycsICdsaXN0ZW5UbycsXG4gICAgICAgICAgICAgICAgICAgJ2xpc3RlblRvT25jZScsICdiaW5kJywgJ3VuYmluZCddO1xuICAgIF8uZWFjaChleHBvcnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBwcm90b1tuYW1lXSA9IHRoaXNbbmFtZV07XG4gICAgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9O1xuXG4gIC8vIEV4cG9ydCBFdmVudHMgYXMgQmFja2JvbmVFdmVudHMgZGVwZW5kaW5nIG9uIGN1cnJlbnQgY29udGV4dFxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7XG4gICAgfVxuICAgIGV4cG9ydHMuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRXZlbnRzO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1cbn0pKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lJyk7XG4iLCJ2YXIgbm9kZSA9IHJlcXVpcmUoXCIuL3NyYy9ub2RlLmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbm9kZTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiLy8gcmVxdWlyZSgnZnMnKS5yZWFkZGlyU3luYyhfX2Rpcm5hbWUgKyAnLycpLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuLy8gICAgIGlmIChmaWxlLm1hdGNoKC8uK1xcLmpzL2cpICE9PSBudWxsICYmIGZpbGUgIT09IF9fZmlsZW5hbWUpIHtcbi8vIFx0dmFyIG5hbWUgPSBmaWxlLnJlcGxhY2UoJy5qcycsICcnKTtcbi8vIFx0bW9kdWxlLmV4cG9ydHNbbmFtZV0gPSByZXF1aXJlKCcuLycgKyBmaWxlKTtcbi8vICAgICB9XG4vLyB9KTtcblxuLy8gU2FtZSBhc1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG51dGlscy5yZWR1Y2UgPSByZXF1aXJlKFwiLi9yZWR1Y2UuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB1dGlscztcbiIsInZhciByZWR1Y2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNtb290aCA9IDU7XG4gICAgdmFyIHZhbHVlID0gJ3ZhbCc7XG4gICAgdmFyIHJlZHVuZGFudCA9IGZ1bmN0aW9uIChhLCBiKSB7XG5cdGlmIChhIDwgYikge1xuXHQgICAgcmV0dXJuICgoYi1hKSA8PSAoYiAqIDAuMikpO1xuXHR9XG5cdHJldHVybiAoKGEtYikgPD0gKGEgKiAwLjIpKTtcbiAgICB9O1xuICAgIHZhciBwZXJmb3JtX3JlZHVjZSA9IGZ1bmN0aW9uIChhcnIpIHtyZXR1cm4gYXJyO307XG5cbiAgICB2YXIgcmVkdWNlID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoIWFyci5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBhcnI7XG5cdH1cblx0dmFyIHNtb290aGVkID0gcGVyZm9ybV9zbW9vdGgoYXJyKTtcblx0dmFyIHJlZHVjZWQgID0gcGVyZm9ybV9yZWR1Y2Uoc21vb3RoZWQpO1xuXHRyZXR1cm4gcmVkdWNlZDtcbiAgICB9O1xuXG4gICAgdmFyIG1lZGlhbiA9IGZ1bmN0aW9uICh2LCBhcnIpIHtcblx0YXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0ICAgIHJldHVybiBhW3ZhbHVlXSAtIGJbdmFsdWVdO1xuXHR9KTtcblx0aWYgKGFyci5sZW5ndGggJSAyKSB7XG5cdCAgICB2W3ZhbHVlXSA9IGFyclt+fihhcnIubGVuZ3RoIC8gMildW3ZhbHVlXTtcdCAgICBcblx0fSBlbHNlIHtcblx0ICAgIHZhciBuID0gfn4oYXJyLmxlbmd0aCAvIDIpIC0gMTtcblx0ICAgIHZbdmFsdWVdID0gKGFycltuXVt2YWx1ZV0gKyBhcnJbbisxXVt2YWx1ZV0pIC8gMjtcblx0fVxuXG5cdHJldHVybiB2O1xuICAgIH07XG5cbiAgICB2YXIgY2xvbmUgPSBmdW5jdGlvbiAoc291cmNlKSB7XG5cdHZhciB0YXJnZXQgPSB7fTtcblx0Zm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcblx0ICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcblx0XHR0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRhcmdldDtcbiAgICB9O1xuXG4gICAgdmFyIHBlcmZvcm1fc21vb3RoID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoc21vb3RoID09PSAwKSB7IC8vIG5vIHNtb290aFxuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoX2FyciA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbG93ID0gKGkgPCBzbW9vdGgpID8gMCA6IChpIC0gc21vb3RoKTtcblx0ICAgIHZhciBoaWdoID0gKGkgPiAoYXJyLmxlbmd0aCAtIHNtb290aCkpID8gYXJyLmxlbmd0aCA6IChpICsgc21vb3RoKTtcblx0ICAgIHNtb290aF9hcnJbaV0gPSBtZWRpYW4oY2xvbmUoYXJyW2ldKSwgYXJyLnNsaWNlKGxvdyxoaWdoKzEpKTtcblx0fVxuXHRyZXR1cm4gc21vb3RoX2FycjtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVjZXIgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBwZXJmb3JtX3JlZHVjZTtcblx0fVxuXHRwZXJmb3JtX3JlZHVjZSA9IGNiYWs7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS5yZWR1bmRhbnQgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiByZWR1bmRhbnQ7XG5cdH1cblx0cmVkdW5kYW50ID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YWx1ZSA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnNtb290aCA9IGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gc21vb3RoO1xuXHR9XG5cdHNtb290aCA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlZHVjZTtcbn07XG5cbnZhciBibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKClcblx0LnZhbHVlKCdzdGFydCcpO1xuXG4gICAgdmFyIHZhbHVlMiA9ICdlbmQnO1xuXG4gICAgdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ29iamVjdCcgOiB7XG4gICAgICAgICAgICAgICAgJ3N0YXJ0JyA6IG9iajEub2JqZWN0W3JlZC52YWx1ZSgpXSxcbiAgICAgICAgICAgICAgICAnZW5kJyAgIDogb2JqMlt2YWx1ZTJdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3ZhbHVlJyAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikgeyByZXR1cm4gb2JqMSB9O1xuXG4gICAgcmVkLnJlZHVjZXIoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IHtcblx0ICAgICdvYmplY3QnIDogYXJyWzBdLFxuXHQgICAgJ3ZhbHVlJyAgOiBhcnJbMF1bdmFsdWUyXVxuXHR9O1xuXHRmb3IgKHZhciBpPTE7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyLnZhbHVlKSkge1xuXHRcdGN1cnIgPSBqb2luKGN1cnIsIGFycltpXSk7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyLm9iamVjdCk7XG5cdCAgICBjdXJyLm9iamVjdCA9IGFycltpXTtcblx0ICAgIGN1cnIudmFsdWUgPSBhcnJbaV0uZW5kO1xuXHR9XG5cdHJlZHVjZWRfYXJyLnB1c2goY3Vyci5vYmplY3QpO1xuXG5cdC8vIHJlZHVjZWRfYXJyLnB1c2goYXJyW2Fyci5sZW5ndGgtMV0pO1xuXHRyZXR1cm4gcmVkdWNlZF9hcnI7XG4gICAgfSk7XG5cbiAgICByZWR1Y2Uuam9pbiA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGpvaW47XG5cdH1cblx0am9pbiA9IGNiYWs7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJlZHVjZS52YWx1ZTIgPSBmdW5jdGlvbiAoZmllbGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdmFsdWUyO1xuXHR9XG5cdHZhbHVlMiA9IGZpZWxkO1xuXHRyZXR1cm4gcmVkO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkO1xufTtcblxudmFyIGxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlZCA9IHJlZHVjZSgpO1xuXG4gICAgcmVkLnJlZHVjZXIgKCBmdW5jdGlvbiAoYXJyKSB7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciB2YWx1ZSA9IHJlZC52YWx1ZSgpO1xuXHR2YXIgcmVkdWNlZF9hcnIgPSBbXTtcblx0dmFyIGN1cnIgPSBhcnJbMF07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoLTE7IGkrKykge1xuXHQgICAgaWYgKHJlZHVuZGFudCAoYXJyW2ldW3ZhbHVlXSwgY3Vyclt2YWx1ZV0pKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyKTtcblx0ICAgIGN1cnIgPSBhcnJbaV07XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyKTtcblx0cmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJldHVybiByZWQ7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWNlO1xubW9kdWxlLmV4cG9ydHMubGluZSA9IGxpbmU7XG5tb2R1bGUuZXhwb3J0cy5ibG9jayA9IGJsb2NrO1xuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGl0ZXJhdG9yIDogZnVuY3Rpb24oaW5pdF92YWwpIHtcblx0dmFyIGkgPSBpbml0X3ZhbCB8fCAwO1xuXHR2YXIgaXRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBpKys7XG5cdH07XG5cdHJldHVybiBpdGVyO1xuICAgIH0sXG5cbiAgICBzY3JpcHRfcGF0aCA6IGZ1bmN0aW9uIChzY3JpcHRfbmFtZSkgeyAvLyBzY3JpcHRfbmFtZSBpcyB0aGUgZmlsZW5hbWVcblx0dmFyIHNjcmlwdF9zY2FwZWQgPSBzY3JpcHRfbmFtZS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcblx0dmFyIHNjcmlwdF9yZSA9IG5ldyBSZWdFeHAoc2NyaXB0X3NjYXBlZCArICckJyk7XG5cdHZhciBzY3JpcHRfcmVfc3ViID0gbmV3IFJlZ0V4cCgnKC4qKScgKyBzY3JpcHRfc2NhcGVkICsgJyQnKTtcblxuXHQvLyBUT0RPOiBUaGlzIHJlcXVpcmVzIHBoYW50b20uanMgb3IgYSBzaW1pbGFyIGhlYWRsZXNzIHdlYmtpdCB0byB3b3JrIChkb2N1bWVudClcblx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdHZhciBwYXRoID0gXCJcIjsgIC8vIERlZmF1bHQgdG8gY3VycmVudCBwYXRoXG5cdGlmKHNjcmlwdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKHZhciBpIGluIHNjcmlwdHMpIHtcblx0XHRpZihzY3JpcHRzW2ldLnNyYyAmJiBzY3JpcHRzW2ldLnNyYy5tYXRjaChzY3JpcHRfcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRzW2ldLnNyYy5yZXBsYWNlKHNjcmlwdF9yZV9zdWIsICckMScpO1xuXHRcdH1cbiAgICAgICAgICAgIH1cblx0fVxuXHRyZXR1cm4gcGF0aDtcbiAgICB9LFxuXG4gICAgZGVmZXJfY2FuY2VsIDogZnVuY3Rpb24gKGNiYWssIHRpbWUpIHtcblx0dmFyIHRpY2s7XG5cblx0dmFyIGRlZmVyX2NhbmNlbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIGNsZWFyVGltZW91dCh0aWNrKTtcblx0ICAgIHRpY2sgPSBzZXRUaW1lb3V0KGNiYWssIHRpbWUpO1xuXHR9O1xuXG5cdHJldHVybiBkZWZlcl9jYW5jZWw7XG4gICAgfVxufTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGl0ZXJhdG9yID0gcmVxdWlyZShcInRudC51dGlsc1wiKS5pdGVyYXRvcjtcblxudmFyIHRudF9ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbi8vdG50LnRyZWUubm9kZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChub2RlKTtcblxuICAgIC8vIEFQSVxuLy8gICAgIG5vZGUubm9kZXMgPSBmdW5jdGlvbigpIHtcbi8vIFx0aWYgKGNsdXN0ZXIgPT09IHVuZGVmaW5lZCkge1xuLy8gXHQgICAgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcbi8vIFx0ICAgIC8vIFRPRE86IGxlbmd0aCBhbmQgY2hpbGRyZW4gc2hvdWxkIGJlIGV4cG9zZWQgaW4gdGhlIEFQSVxuLy8gXHQgICAgLy8gaS5lLiB0aGUgdXNlciBzaG91bGQgYmUgYWJsZSB0byBjaGFuZ2UgdGhpcyBkZWZhdWx0cyB2aWEgdGhlIEFQSVxuLy8gXHQgICAgLy8gY2hpbGRyZW4gaXMgdGhlIGRlZmF1bHRzIGZvciBwYXJzZV9uZXdpY2ssIGJ1dCBtYXliZSB3ZSBzaG91bGQgY2hhbmdlIHRoYXRcbi8vIFx0ICAgIC8vIG9yIGF0IGxlYXN0IG5vdCBhc3N1bWUgdGhpcyBpcyBhbHdheXMgdGhlIGNhc2UgZm9yIHRoZSBkYXRhIHByb3ZpZGVkXG4vLyBcdFx0LnZhbHVlKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5sZW5ndGh9KVxuLy8gXHRcdC5jaGlsZHJlbihmdW5jdGlvbihkKSB7cmV0dXJuIGQuY2hpbGRyZW59KTtcbi8vIFx0fVxuLy8gXHRub2RlcyA9IGNsdXN0ZXIubm9kZXMoZGF0YSk7XG4vLyBcdHJldHVybiBub2Rlcztcbi8vICAgICB9O1xuXG4gICAgdmFyIGFwcGx5X3RvX2RhdGEgPSBmdW5jdGlvbiAoZGF0YSwgY2Jhaykge1xuXHRjYmFrKGRhdGEpO1xuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdGFwcGx5X3RvX2RhdGEoZGF0YS5jaGlsZHJlbltpXSwgY2Jhayk7XG5cdCAgICB9XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGNyZWF0ZV9pZHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBpID0gaXRlcmF0b3IoMSk7XG5cdC8vIFdlIGNhbid0IHVzZSBhcHBseSBiZWNhdXNlIGFwcGx5IGNyZWF0ZXMgbmV3IHRyZWVzIG9uIGV2ZXJ5IG5vZGVcblx0Ly8gV2Ugc2hvdWxkIHVzZSB0aGUgZGlyZWN0IGRhdGEgaW5zdGVhZFxuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgaWYgKGQuX2lkID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9pZCA9IGkoKTtcblx0XHQvLyBUT0RPOiBOb3Qgc3VyZSBfaW5TdWJUcmVlIGlzIHN0cmljdGx5IG5lY2Vzc2FyeVxuXHRcdC8vIGQuX2luU3ViVHJlZSA9IHtwcmV2OnRydWUsIGN1cnI6dHJ1ZX07XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICB2YXIgbGlua19wYXJlbnRzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0aWYgKGRhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgLy8gX3BhcmVudD9cblx0ICAgIGRhdGEuY2hpbGRyZW5baV0uX3BhcmVudCA9IGRhdGE7XG5cdCAgICBsaW5rX3BhcmVudHMoZGF0YS5jaGlsZHJlbltpXSk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGNvbXB1dGVfcm9vdF9kaXN0cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG5cdC8vIGNvbnNvbGUubG9nKGRhdGEpO1xuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgdmFyIGw7XG5cdCAgICBpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9yb290X2Rpc3QgPSAwO1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgbCA9IDA7XG5cdFx0aWYgKGQuYnJhbmNoX2xlbmd0aCkge1xuXHRcdCAgICBsID0gZC5icmFuY2hfbGVuZ3RoXG5cdFx0fVxuXHRcdGQuX3Jvb3RfZGlzdCA9IGwgKyBkLl9wYXJlbnQuX3Jvb3RfZGlzdDtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIFRPRE86IGRhdGEgY2FuJ3QgYmUgcmV3cml0dGVuIHVzZWQgdGhlIGFwaSB5ZXQuIFdlIG5lZWQgZmluYWxpemVyc1xuICAgIG5vZGUuZGF0YSA9IGZ1bmN0aW9uKG5ld19kYXRhKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGRhdGFcblx0fVxuXHRkYXRhID0gbmV3X2RhdGE7XG5cdGNyZWF0ZV9pZHMoKTtcblx0bGlua19wYXJlbnRzKGRhdGEpO1xuXHRjb21wdXRlX3Jvb3RfZGlzdHMoZGF0YSk7XG5cdHJldHVybiBub2RlO1xuICAgIH07XG4gICAgLy8gV2UgYmluZCB0aGUgZGF0YSB0aGF0IGhhcyBiZWVuIHBhc3NlZFxuICAgIG5vZGUuZGF0YShkYXRhKTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX2FsbCcsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikpIHtcblx0XHRub2Rlcy5wdXNoIChuKTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcbiAgICBcbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlJywgZnVuY3Rpb24gKGNiYWssIGRlZXApIHtcblx0aWYgKGNiYWsobm9kZSkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2pdKS5maW5kX25vZGUoY2Jhayk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cblxuXHRpZiAoZGVlcCAmJiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2ldKS5maW5kX25vZGUoY2Jhaylcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2pdKS5maW5kX25vZGUoY2Jhayk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX25vZGVfYnlfbmFtZScsIGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIG5vZGUuZmluZF9ub2RlIChmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgcmV0dXJuIG5vZGUubm9kZV9uYW1lKCkgPT09IG5hbWVcblx0fSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgndG9nZ2xlJywgZnVuY3Rpb24oKSB7XG5cdGlmIChkYXRhKSB7XG5cdCAgICBpZiAoZGF0YS5jaGlsZHJlbikgeyAvLyBVbmNvbGxhcHNlZCAtPiBjb2xsYXBzZVxuXHRcdHZhciBoaWRkZW4gPSAwO1xuXHRcdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdFx0ICAgIHZhciBoaWRkZW5faGVyZSA9IG4ubl9oaWRkZW4oKSB8fCAwO1xuXHRcdCAgICBoaWRkZW4gKz0gKG4ubl9oaWRkZW4oKSB8fCAwKSArIDE7XG5cdFx0fSk7XG5cdFx0bm9kZS5uX2hpZGRlbiAoaGlkZGVuLTEpO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gZGF0YS5jaGlsZHJlbjtcblx0XHRkYXRhLmNoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfSBlbHNlIHsgICAgICAgICAgICAgLy8gQ29sbGFwc2VkIC0+IHVuY29sbGFwc2Vcblx0XHRub2RlLm5faGlkZGVuKDApO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSBkYXRhLl9jaGlsZHJlbjtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBub2Rlcy5wdXNoKG4pO1xuXHR9KTtcblx0cmV0dXJuIG5vZGVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbGVhdmVzJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgbGVhdmVzID0gW107XG5cdG5vZGUuYXBwbHkoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChuLmlzX2xlYWYoKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcykge1xuICAgIFx0dmFyIG5vZGVfY291bnRzID0ge307XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBuID0gbm9kZXNbaV07XG5cdCAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0bi51cHN0cmVhbSAoZnVuY3Rpb24gKHRoaXNfbm9kZSl7XG5cdFx0ICAgIHZhciBpZCA9IHRoaXNfbm9kZS5pZCgpO1xuXHRcdCAgICBpZiAobm9kZV9jb3VudHNbaWRdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdG5vZGVfY291bnRzW2lkXSA9IDA7XG5cdFx0ICAgIH1cblx0XHQgICAgbm9kZV9jb3VudHNbaWRdKytcbiAgICBcdFx0fSk7XG5cdCAgICB9XG4gICAgXHR9XG4gICAgXG5cblx0dmFyIGlzX3NpbmdsZXRvbiA9IGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0ICAgIHZhciBuX2NoaWxkcmVuID0gMDtcblx0ICAgIGlmIChub2RlX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGk9MDsgaTxub2RlX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgaWQgPSBub2RlX2RhdGEuY2hpbGRyZW5baV0uX2lkO1xuXHRcdGlmIChub2RlX2NvdW50c1tpZF0gPiAwKSB7XG5cdFx0ICAgIG5fY2hpbGRyZW4rKztcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbl9jaGlsZHJlbiA9PT0gMTtcblx0fTtcblxuXHR2YXIgc3VidHJlZSA9IHt9O1xuXHRjb3B5X2RhdGEgKGRhdGEsIHN1YnRyZWUsIGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0ICAgIHZhciBub2RlX2lkID0gbm9kZV9kYXRhLl9pZDtcblx0ICAgIHZhciBjb3VudHMgPSBub2RlX2NvdW50c1tub2RlX2lkXTtcblxuXHQgICAgaWYgKGNvdW50cyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cbi8vIFx0ICAgIGlmICgobm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSAmJiAobm9kZS5jaGlsZHJlbi5sZW5ndGggPCAyKSkge1xuLy8gXHRcdHJldHVybiBmYWxzZTtcbi8vIFx0ICAgIH1cblx0ICAgIGlmICgoY291bnRzID4gMSkgJiYgKCFpc19zaW5nbGV0b24obm9kZV9kYXRhKSkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIGlmICgoY291bnRzID4gMCkgJiYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9KTtcblxuXHRyZXR1cm4gdG50X25vZGUoc3VidHJlZS5jaGlsZHJlblswXSk7XG4gICAgfSk7XG5cbiAgICB2YXIgY29weV9kYXRhID0gZnVuY3Rpb24gKG9yaWdfZGF0YSwgc3VidHJlZSwgY29uZGl0aW9uKSB7XG4gICAgICAgIGlmIChvcmlnX2RhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbihvcmlnX2RhdGEpKSB7XG5cdCAgICB2YXIgY29weSA9IGNvcHlfbm9kZShvcmlnX2RhdGEpO1xuXHQgICAgaWYgKHN1YnRyZWUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN1YnRyZWUuY2hpbGRyZW4gPSBbXTtcblx0ICAgIH1cblx0ICAgIHN1YnRyZWUuY2hpbGRyZW4ucHVzaChjb3B5KTtcblx0ICAgIGlmIChvcmlnX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZ19kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29weV9kYXRhIChvcmlnX2RhdGEuY2hpbGRyZW5baV0sIGNvcHksIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH0gZWxzZSB7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YShvcmlnX2RhdGEuY2hpbGRyZW5baV0sIHN1YnRyZWUsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGNvcHlfbm9kZSA9IGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0dmFyIGNvcHkgPSB7fTtcblx0Ly8gY29weSBhbGwgdGhlIG93biBwcm9wZXJ0aWVzIGV4Y2VwdHMgbGlua3MgdG8gb3RoZXIgbm9kZXMgb3IgZGVwdGhcblx0Zm9yICh2YXIgcGFyYW0gaW4gbm9kZV9kYXRhKSB7XG5cdCAgICBpZiAoKHBhcmFtID09PSBcImNoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9jaGlsZHJlblwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJfcGFyZW50XCIpIHx8XG5cdFx0KHBhcmFtID09PSBcImRlcHRoXCIpKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICBpZiAobm9kZV9kYXRhLmhhc093blByb3BlcnR5KHBhcmFtKSkge1xuXHRcdGNvcHlbcGFyYW1dID0gbm9kZV9kYXRhW3BhcmFtXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gY29weTtcbiAgICB9O1xuXG4gICAgXG4gICAgLy8gVE9ETzogVGhpcyBtZXRob2QgdmlzaXRzIGFsbCB0aGUgbm9kZXNcbiAgICAvLyBhIG1vcmUgcGVyZm9ybWFudCB2ZXJzaW9uIHNob3VsZCByZXR1cm4gdHJ1ZVxuICAgIC8vIHRoZSBmaXJzdCB0aW1lIGNiYWsobm9kZSkgaXMgdHJ1ZVxuICAgIGFwaS5tZXRob2QgKCdwcmVzZW50JywgZnVuY3Rpb24gKGNiYWspIHtcblx0Ly8gY2JhayBzaG91bGQgcmV0dXJuIHRydWUvZmFsc2Vcblx0dmFyIGlzX3RydWUgPSBmYWxzZTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pID09PSB0cnVlKSB7XG5cdFx0aXNfdHJ1ZSA9IHRydWU7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gaXNfdHJ1ZTtcbiAgICB9KTtcblxuICAgIC8vIGNiYWsgaXMgY2FsbGVkIHdpdGggdHdvIG5vZGVzXG4gICAgLy8gYW5kIHNob3VsZCByZXR1cm4gYSBuZWdhdGl2ZSBudW1iZXIsIDAgb3IgYSBwb3NpdGl2ZSBudW1iZXJcbiAgICBhcGkubWV0aG9kICgnc29ydCcsIGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXG5cdHZhciBuZXdfY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIG5ld19jaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0fVxuXG5cdG5ld19jaGlsZHJlbi5zb3J0KGNiYWspO1xuXG5cdGRhdGEuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPG5ld19jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgZGF0YS5jaGlsZHJlbi5wdXNoKG5ld19jaGlsZHJlbltpXS5kYXRhKCkpO1xuXHR9XG5cblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pLnNvcnQoY2Jhayk7XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmbGF0dGVuJywgZnVuY3Rpb24gKCkge1xuXHRpZiAobm9kZS5pc19sZWFmKCkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cdHZhciBkYXRhID0gbm9kZS5kYXRhKCk7XG5cdHZhciBuZXdyb290ID0gY29weV9ub2RlKGRhdGEpO1xuXHR2YXIgbGVhdmVzID0gbm9kZS5nZXRfYWxsX2xlYXZlcygpO1xuXHRuZXdyb290LmNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIG5ld3Jvb3QuY2hpbGRyZW4ucHVzaChjb3B5X25vZGUobGVhdmVzW2ldLmRhdGEoKSkpO1xuXHR9XG5cblx0cmV0dXJuIHRudF9ub2RlKG5ld3Jvb3QpO1xuICAgIH0pO1xuXG4gICAgXG4gICAgLy8gVE9ETzogVGhpcyBtZXRob2Qgb25seSAnYXBwbHkncyB0byBub24gY29sbGFwc2VkIG5vZGVzIChpZSAuX2NoaWxkcmVuIGlzIG5vdCB2aXNpdGVkKVxuICAgIC8vIFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIGFuIGV4dHJhIGZsYWcgKHRydWUvZmFsc2UpIHRvIHZpc2l0IGFsc28gY29sbGFwc2VkIG5vZGVzP1xuICAgIGFwaS5tZXRob2QgKCdhcHBseScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cdHJldHVybiBjaGlsZHJlbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gdG50X25vZGUoZGF0YS5fcGFyZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBub2RlO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfbm9kZTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZSgndG50LmFwaScpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5kaWFnb25hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZCA9IGZ1bmN0aW9uIChkaWFnb25hbFBhdGgpIHtcblx0dmFyIHNvdXJjZSA9IGRpYWdvbmFsUGF0aC5zb3VyY2U7XG4gICAgICAgIHZhciB0YXJnZXQgPSBkaWFnb25hbFBhdGgudGFyZ2V0O1xuICAgICAgICB2YXIgbWlkcG9pbnRYID0gKHNvdXJjZS54ICsgdGFyZ2V0LngpIC8gMjtcbiAgICAgICAgdmFyIG1pZHBvaW50WSA9IChzb3VyY2UueSArIHRhcmdldC55KSAvIDI7XG4gICAgICAgIHZhciBwYXRoRGF0YSA9IFtzb3VyY2UsIHt4OiB0YXJnZXQueCwgeTogc291cmNlLnl9LCB0YXJnZXRdO1xuXHRwYXRoRGF0YSA9IHBhdGhEYXRhLm1hcChkLnByb2plY3Rpb24oKSk7XG5cdHJldHVybiBkLnBhdGgoKShwYXRoRGF0YSwgcmFkaWFsX2NhbGMuY2FsbCh0aGlzLHBhdGhEYXRhKSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChkKVxuXHQuZ2V0c2V0ICgncHJvamVjdGlvbicpXG5cdC5nZXRzZXQgKCdwYXRoJylcbiAgICBcbiAgICB2YXIgY29vcmRpbmF0ZVRvQW5nbGUgPSBmdW5jdGlvbiAoY29vcmQsIHJhZGl1cykge1xuICAgICAgXHR2YXIgd2hvbGVBbmdsZSA9IDIgKiBNYXRoLlBJLFxuICAgICAgICBxdWFydGVyQW5nbGUgPSB3aG9sZUFuZ2xlIC8gNFxuXHRcbiAgICAgIFx0dmFyIGNvb3JkUXVhZCA9IGNvb3JkWzBdID49IDAgPyAoY29vcmRbMV0gPj0gMCA/IDEgOiAyKSA6IChjb29yZFsxXSA+PSAwID8gNCA6IDMpLFxuICAgICAgICBjb29yZEJhc2VBbmdsZSA9IE1hdGguYWJzKE1hdGguYXNpbihjb29yZFsxXSAvIHJhZGl1cykpXG5cdFxuICAgICAgXHQvLyBTaW5jZSB0aGlzIGlzIGp1c3QgYmFzZWQgb24gdGhlIGFuZ2xlIG9mIHRoZSByaWdodCB0cmlhbmdsZSBmb3JtZWRcbiAgICAgIFx0Ly8gYnkgdGhlIGNvb3JkaW5hdGUgYW5kIHRoZSBvcmlnaW4sIGVhY2ggcXVhZCB3aWxsIGhhdmUgZGlmZmVyZW50IFxuICAgICAgXHQvLyBvZmZzZXRzXG4gICAgICBcdHZhciBjb29yZEFuZ2xlO1xuICAgICAgXHRzd2l0Y2ggKGNvb3JkUXVhZCkge1xuICAgICAgXHRjYXNlIDE6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgMjpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSBxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZVxuICAgICAgXHQgICAgYnJlYWtcbiAgICAgIFx0Y2FzZSAzOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IDIqcXVhcnRlckFuZ2xlICsgcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgNDpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAzKnF1YXJ0ZXJBbmdsZSArIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdH1cbiAgICAgIFx0cmV0dXJuIGNvb3JkQW5nbGVcbiAgICB9O1xuXG4gICAgdmFyIHJhZGlhbF9jYWxjID0gZnVuY3Rpb24gKHBhdGhEYXRhKSB7XG5cdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcblx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSBNYXRoLnNxcnQoc3JjWzBdKnNyY1swXSArIHNyY1sxXSpzcmNbMV0pO1xuXHR2YXIgc3JjQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShzcmMsIHJhZGl1cyk7XG5cdHZhciBtaWRBbmdsZSA9IGNvb3JkaW5hdGVUb0FuZ2xlKG1pZCwgcmFkaXVzKTtcblx0dmFyIGNsb2Nrd2lzZSA9IE1hdGguYWJzKG1pZEFuZ2xlIC0gc3JjQW5nbGUpID4gTWF0aC5QSSA/IG1pZEFuZ2xlIDw9IHNyY0FuZ2xlIDogbWlkQW5nbGUgPiBzcmNBbmdsZTtcblx0cmV0dXJuIHtcblx0ICAgIHJhZGl1cyAgIDogcmFkaXVzLFxuXHQgICAgY2xvY2t3aXNlIDogY2xvY2t3aXNlXG5cdH07XG4gICAgfTtcblxuICAgIHJldHVybiBkO1xufTtcblxuLy8gdmVydGljYWwgZGlhZ29uYWwgZm9yIHJlY3QgYnJhbmNoZXNcbnRyZWUuZGlhZ29uYWwudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG5cdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcblx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSAyMDAwMDA7IC8vIE51bWJlciBsb25nIGVub3VnaFxuXG5cdHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDsgXG5cdFxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHsgXG5cdHJldHVybiBbZC55LCBkLnhdO1xuICAgIH1cblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbik7XG59O1xuXG50cmVlLmRpYWdvbmFsLnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGF0aCA9IGZ1bmN0aW9uKHBhdGhEYXRhLCBvYmopIHtcbiAgICAgIFx0dmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuICAgICAgXHR2YXIgbWlkID0gcGF0aERhdGFbMV07XG4gICAgICBcdHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcblx0dmFyIHJhZGl1cyA9IG9iai5yYWRpdXM7XG5cdHZhciBjbG9ja3dpc2UgPSBvYmouY2xvY2t3aXNlO1xuXG5cdGlmIChjbG9ja3dpc2UpIHtcblx0ICAgIHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDsgXG5cdH0gZWxzZSB7XG5cdCAgICByZXR1cm4gXCJNXCIgKyBtaWQgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIHNyYyArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7XG5cdH1cblxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIFx0dmFyIHIgPSBkLnksIGEgPSAoZC54IC0gOTApIC8gMTgwICogTWF0aC5QSTtcbiAgICAgIFx0cmV0dXJuIFtyICogTWF0aC5jb3MoYSksIHIgKiBNYXRoLnNpbihhKV07XG4gICAgfTtcblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbilcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUuZGlhZ29uYWw7XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUgKFwiLi90cmVlLmpzXCIpO1xudHJlZS5sYWJlbCA9IHJlcXVpcmUoXCIuL2xhYmVsLmpzXCIpO1xudHJlZS5kaWFnb25hbCA9IHJlcXVpcmUoXCIuL2RpYWdvbmFsLmpzXCIpO1xudHJlZS5sYXlvdXQgPSByZXF1aXJlKFwiLi9sYXlvdXQuanNcIik7XG50cmVlLm5vZGVfZGlzcGxheSA9IHJlcXVpcmUoXCIuL25vZGVfZGlzcGxheS5qc1wiKTtcbi8vIHRyZWUubm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuLy8gdHJlZS5wYXJzZV9uZXdpY2sgPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uZXdpY2s7XG4vLyB0cmVlLnBhcnNlX25oeCA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25oeDtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxhYmVsID0gZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiB3ZSBzaG91bGQgYmUgcmVtb3ZpbmcgYnkgZGVmYXVsdCBwcmV2IGxhYmVsc1xuICAgIC8vIG9yIGl0IHdvdWxkIGJlIGJldHRlciB0byBoYXZlIGEgc2VwYXJhdGUgcmVtb3ZlIG1ldGhvZCBjYWxsZWQgYnkgdGhlIHZpc1xuICAgIC8vIG9uIHVwZGF0ZVxuICAgIC8vIFdlIGFsc28gaGF2ZSB0aGUgcHJvYmxlbSB0aGF0IHdlIG1heSBiZSB0cmFuc2l0aW9uaW5nIGZyb21cbiAgICAvLyB0ZXh0IHRvIGltZyBsYWJlbHMgYW5kIHdlIG5lZWQgdG8gcmVtb3ZlIHRoZSBsYWJlbCBvZiBhIGRpZmZlcmVudCB0eXBlXG4gICAgdmFyIGxhYmVsID0gZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlLCBub2RlX3NpemUpIHtcblx0aWYgKHR5cGVvZiAobm9kZSkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93KG5vZGUpO1xuICAgICAgICB9XG5cblx0bGFiZWwuZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSwgbGF5b3V0X3R5cGUpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGFiZWxcIilcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0dmFyIHQgPSBsYWJlbC50cmFuc2Zvcm0oKShub2RlLCBsYXlvdXRfdHlwZSk7XG5cdFx0cmV0dXJuIFwidHJhbnNsYXRlIChcIiArICh0LnRyYW5zbGF0ZVswXSArIG5vZGVfc2l6ZSkgKyBcIiBcIiArIHQudHJhbnNsYXRlWzFdICsgXCIpcm90YXRlKFwiICsgdC5yb3RhdGUgKyBcIilcIjtcblx0ICAgIH0pXG5cdC8vIFRPRE86IHRoaXMgY2xpY2sgZXZlbnQgaXMgcHJvYmFibHkgbmV2ZXIgZmlyZWQgc2luY2UgdGhlcmUgaXMgYW4gb25jbGljayBldmVudCBpbiB0aGUgbm9kZSBnIGVsZW1lbnQ/XG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbigpe1xuXHRcdGlmIChsYWJlbC5vbl9jbGljaygpICE9PSB1bmRlZmluZWQpIHtcblx0XHQgICAgZDMuZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0ICAgIGxhYmVsLm9uX2NsaWNrKCkuY2FsbCh0aGlzLCBub2RlKTtcblx0XHR9XG5cdCAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblx0LmdldHNldCAoJ3dpZHRoJywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSB3aWR0aCBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIGhlaWdodCBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdkaXNwbGF5JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBkaXNwbGF5IGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgdHJhbnNmb3JtIGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ29uX2NsaWNrJyk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBUZXh0IGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC50ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cdC5nZXRzZXQgKCdmb250c2l6ZScsIDEwKVxuXHQuZ2V0c2V0ICgnY29sb3InLCBcIiMwMDBcIilcblx0LmdldHNldCAoJ3RleHQnLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgcmV0dXJuIGQuZGF0YSgpLm5hbWU7XG5cdH0pXG5cbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGwgPSBkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGxheW91dF90eXBlID09PSBcInJhZGlhbFwiKSB7XG5cdFx0ICAgIHJldHVybiAoZC54JTM2MCA8IDE4MCkgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xuXHRcdH1cblx0XHRyZXR1cm4gXCJzdGFydFwiO1xuXHQgICAgfSlcblx0ICAgIC50ZXh0KGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIGxhYmVsLnRleHQoKShub2RlKVxuXHQgICAgfSlcblx0ICAgIC5zdHlsZSgnZm9udC1zaXplJywgbGFiZWwuZm9udHNpemUoKSArIFwicHhcIilcblx0ICAgIC5zdHlsZSgnZmlsbCcsIGQzLmZ1bmN0b3IobGFiZWwuY29sb3IoKSkobm9kZSkpO1xuXG5cdHJldHVybiBsO1xuICAgIH0pO1xuXG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGQgPSBub2RlLmRhdGEoKTtcblx0dmFyIHQgPSB7XG5cdCAgICB0cmFuc2xhdGUgOiBbNSwgNV0sXG5cdCAgICByb3RhdGUgOiAwXG5cdH07XG5cdGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuXHQgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSAtIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmZvbnRzaXplKCkpXG5cdCAgICB0LnJvdGF0ZSA9IChkLnglMzYwIDwgMTgwID8gMCA6IDE4MClcblx0fVxuXHRyZXR1cm4gdDtcbiAgICB9KTtcblxuXG4gICAgLy8gbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vIFx0dmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZSgxMCA1KXJvdGF0ZShcIiArIChkLnglMzYwIDwgMTgwID8gMCA6IDE4MCkgKyBcIilcIjtcbiAgICAvLyB9KTtcblxuICAgIGxhYmVsLndpZHRoIChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgc3ZnID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgMClcblx0ICAgIC5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcblxuXHR2YXIgdGV4dCA9IHN2Z1xuXHQgICAgLmFwcGVuZChcInRleHRcIilcblx0ICAgIC5zdHlsZSgnZm9udC1zaXplJywgbGFiZWwuZm9udHNpemUoKSArIFwicHhcIilcblx0ICAgIC50ZXh0KGxhYmVsLnRleHQoKShub2RlKSk7XG5cblx0dmFyIHdpZHRoID0gdGV4dC5ub2RlKCkuZ2V0QkJveCgpLndpZHRoO1xuXHRzdmcucmVtb3ZlKCk7XG5cblx0cmV0dXJuIHdpZHRoO1xuICAgIH0pO1xuXG4gICAgbGFiZWwuaGVpZ2h0IChmdW5jdGlvbiAobm9kZSkge1xuXHRyZXR1cm4gbGFiZWwuZm9udHNpemUoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIEltYWdlIGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC5pbWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblx0LmdldHNldCAoJ3NyYycsIGZ1bmN0aW9uICgpIHt9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdGlmIChsYWJlbC5zcmMoKShub2RlKSkge1xuXHQgICAgdmFyIGwgPSBkMy5zZWxlY3QodGhpcylcblx0XHQuYXBwZW5kKFwiaW1hZ2VcIilcblx0XHQuYXR0cihcIndpZHRoXCIsIGxhYmVsLndpZHRoKCkoKSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBsYWJlbC5oZWlnaHQoKSgpKVxuXHRcdC5hdHRyKFwieGxpbms6aHJlZlwiLCBsYWJlbC5zcmMoKShub2RlKSk7XG5cdCAgICByZXR1cm4gbDtcblx0fVxuXHQvLyBmYWxsYmFjayB0ZXh0IGluIGNhc2UgdGhlIGltZyBpcyBub3QgZm91bmQ/XG5cdHJldHVybiBkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAudGV4dChcIlwiKTtcbiAgICB9KTtcblxuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBkID0gbm9kZS5kYXRhKCk7XG5cdHZhciB0ID0ge1xuXHQgICAgdHJhbnNsYXRlIDogWzEwLCAoLWxhYmVsLmhlaWdodCgpKCkgLyAyKV0sXG5cdCAgICByb3RhdGUgOiAwXG5cdH07XG5cdGlmIChsYXlvdXRfdHlwZSA9PT0gJ3JhZGlhbCcpIHtcblx0ICAgIHQudHJhbnNsYXRlWzBdID0gdC50cmFuc2xhdGVbMF0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC53aWR0aCgpKCkpLFxuXHQgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmhlaWdodCgpKCkpLFxuXHQgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG5cdH1cblxuXHRyZXR1cm4gdDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIExhYmVscyBtYWRlIG9mIDIrIHNpbXBsZSBsYWJlbHNcbnRyZWUubGFiZWwuY29tcG9zaXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbHMgPSBbXTtcblxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHR2YXIgY3Vycl94b2Zmc2V0ID0gMDtcblxuXHRmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgZGlzcGxheSA9IGxhYmVsc1tpXTtcblxuXHQgICAgKGZ1bmN0aW9uIChvZmZzZXQpIHtcblx0XHRkaXNwbGF5LnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdFx0ICAgIHZhciB0c3VwZXIgPSBkaXNwbGF5Ll9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuXHRcdCAgICB2YXIgdCA9IHtcblx0XHRcdHRyYW5zbGF0ZSA6IFtvZmZzZXQgKyB0c3VwZXIudHJhbnNsYXRlWzBdLCB0c3VwZXIudHJhbnNsYXRlWzFdXSxcblx0XHRcdHJvdGF0ZSA6IHRzdXBlci5yb3RhdGVcblx0XHQgICAgfTtcblx0XHQgICAgcmV0dXJuIHQ7XG5cdFx0fSlcblx0ICAgIH0pKGN1cnJfeG9mZnNldCk7XG5cblx0ICAgIGN1cnJfeG9mZnNldCArPSAxMDtcblx0ICAgIGN1cnJfeG9mZnNldCArPSBkaXNwbGF5LndpZHRoKCkobm9kZSk7XG5cblx0ICAgIGRpc3BsYXkuY2FsbCh0aGlzLCBub2RlLCBsYXlvdXRfdHlwZSk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfbGFiZWwnLCBmdW5jdGlvbiAoZGlzcGxheSwgbm9kZSkge1xuXHRkaXNwbGF5Ll9zdXBlcl8gPSB7fTtcblx0YXBpanMgKGRpc3BsYXkuX3N1cGVyXylcblx0ICAgIC5nZXQgKCd0cmFuc2Zvcm0nLCBkaXNwbGF5LnRyYW5zZm9ybSgpKTtcblxuXHRsYWJlbHMucHVzaChkaXNwbGF5KTtcblx0cmV0dXJuIGxhYmVsO1xuICAgIH0pO1xuICAgIFxuICAgIGFwaS5tZXRob2QgKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgdG90X3dpZHRoID0gMDtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcblx0XHR0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLndpZHRoKCkobm9kZSkpO1xuXHRcdHRvdF93aWR0aCArPSBwYXJzZUludChsYWJlbHNbaV0uX3N1cGVyXy50cmFuc2Zvcm0oKShub2RlKS50cmFuc2xhdGVbMF0pO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdG90X3dpZHRoO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHZhciBtYXhfaGVpZ2h0ID0gMDtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgY3Vycl9oZWlnaHQgPSBsYWJlbHNbaV0uaGVpZ2h0KCkobm9kZSk7XG5cdFx0aWYgKCBjdXJyX2hlaWdodCA+IG1heF9oZWlnaHQpIHtcblx0XHQgICAgbWF4X2hlaWdodCA9IGN1cnJfaGVpZ2h0O1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXhfaGVpZ2h0O1xuXHR9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxhYmVsO1xuXG5cbiIsIi8vIEJhc2VkIG9uIHRoZSBjb2RlIGJ5IEtlbi1pY2hpIFVlZGEgaW4gaHR0cDovL2JsLm9ja3Mub3JnL2t1ZWRhLzEwMzY3NzYjZDMucGh5bG9ncmFtLmpzXG5cbnZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGRpYWdvbmFsID0gcmVxdWlyZShcIi4vZGlhZ29uYWwuanNcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBsID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcblx0LnNvcnQobnVsbClcblx0LnZhbHVlKGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQubGVuZ3RofSApXG5cdC5zZXBhcmF0aW9uKGZ1bmN0aW9uICgpIHtyZXR1cm4gMX0pO1xuICAgIFxuICAgIHZhciBhcGkgPSBhcGlqcyAobClcblx0LmdldHNldCAoJ3NjYWxlJywgdHJ1ZSlcblx0LmdldHNldCAoJ21heF9sZWFmX2xhYmVsX3dpZHRoJywgMClcblx0Lm1ldGhvZCAoXCJjbHVzdGVyXCIsIGNsdXN0ZXIpXG5cdC5tZXRob2QoJ3lzY2FsZScsIGZ1bmN0aW9uICgpIHt0aHJvdyBcInlzY2FsZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pXG5cdC5tZXRob2QoJ2FkanVzdF9jbHVzdGVyX3NpemUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJhZGp1c3RfY2x1c3Rlcl9zaXplIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiIH0pXG5cdC5tZXRob2QoJ3dpZHRoJywgZnVuY3Rpb24gKCkge3Rocm93IFwid2lkdGggaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KVxuXHQubWV0aG9kKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJoZWlnaHQgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KTtcblxuICAgIGFwaS5tZXRob2QoJ3NjYWxlX2JyYW5jaF9sZW5ndGhzJywgZnVuY3Rpb24gKGN1cnIpIHtcblx0aWYgKGwuc2NhbGUoKSA9PT0gZmFsc2UpIHtcblx0ICAgIHJldHVyblxuXHR9XG5cblx0dmFyIG5vZGVzID0gY3Vyci5ub2Rlcztcblx0dmFyIHRyZWUgPSBjdXJyLnRyZWU7XG5cblx0dmFyIHJvb3RfZGlzdHMgPSBub2Rlcy5tYXAgKGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5fcm9vdF9kaXN0O1xuXHR9KTtcblxuXHR2YXIgeXNjYWxlID0gbC55c2NhbGUocm9vdF9kaXN0cyk7XG5cdHRyZWUuYXBwbHkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBub2RlLnByb3BlcnR5KFwieVwiLCB5c2NhbGUobm9kZS5yb290X2Rpc3QoKSkpO1xuXHR9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsO1xufTtcblxudHJlZS5sYXlvdXQudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSBcInZlcnRpY2FsXCI7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxheW91dClcblx0LmdldHNldCAoJ3dpZHRoJywgMzYwKVxuXHQuZ2V0ICgndHJhbnNsYXRlX3ZpcycsIFsyMCwyMF0pXG5cdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnZlcnRpY2FsKVxuXHQubWV0aG9kICgndHJhbnNmb3JtX25vZGUnLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueSArIFwiLFwiICsgZC54ICsgXCIpXCI7XG5cdH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0cmV0dXJuIChwYXJhbXMubl9sZWF2ZXMgKiBwYXJhbXMubGFiZWxfaGVpZ2h0KTtcbiAgICB9KTsgXG5cbiAgICBhcGkubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoZGlzdHMpIHtcbiAgICBcdHJldHVybiBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0ICAgIC5kb21haW4oWzAsIGQzLm1heChkaXN0cyldKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgbGF5b3V0LndpZHRoKCkgLSAyMCAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0dmFyIGggPSBsYXlvdXQuaGVpZ2h0KHBhcmFtcyk7XG4gICAgXHR2YXIgdyA9IGxheW91dC53aWR0aCgpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSBsYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdIC0gcGFyYW1zLmxhYmVsX3BhZGRpbmc7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplIChbaCx3XSk7XG4gICAgXHRyZXR1cm4gbGF5b3V0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxheW91dDtcbn07XG5cbnRyZWUubGF5b3V0LnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGF5b3V0ID0gdHJlZS5sYXlvdXQoKTtcbiAgICAvLyBFbGVtZW50cyBsaWtlICdsYWJlbHMnIGRlcGVuZCBvbiB0aGUgbGF5b3V0IHR5cGUuIFRoaXMgZXhwb3NlcyBhIHdheSBvZiBpZGVudGlmeWluZyB0aGUgbGF5b3V0IHR5cGVcbiAgICBsYXlvdXQudHlwZSA9ICdyYWRpYWwnO1xuXG4gICAgdmFyIGRlZmF1bHRfd2lkdGggPSAzNjA7XG4gICAgdmFyIHIgPSBkZWZhdWx0X3dpZHRoIC8gMjtcblxuICAgIHZhciBjb25mID0ge1xuICAgIFx0d2lkdGggOiAzNjBcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG5cdC5nZXRzZXQgKGNvbmYpXG5cdC5nZXRzZXQgKCd0cmFuc2xhdGVfdmlzJywgW3IsIHJdKSAvLyBUT0RPOiAxLjMgc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IGEgc2Vuc2libGUgdmFsdWVcblx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBcInJvdGF0ZShcIiArIChkLnggLSA5MCkgKyBcIil0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIilcIjtcblx0fSlcblx0Lm1ldGhvZCAoJ2RpYWdvbmFsJywgZGlhZ29uYWwucmFkaWFsKVxuXHQubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZi53aWR0aCB9KTtcblxuICAgIC8vIENoYW5nZXMgaW4gd2lkdGggYWZmZWN0IGNoYW5nZXMgaW4gclxuICAgIGxheW91dC53aWR0aC50cmFuc2Zvcm0gKGZ1bmN0aW9uICh2YWwpIHtcbiAgICBcdHIgPSB2YWwgLyAyO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSlcbiAgICBcdGxheW91dC50cmFuc2xhdGVfdmlzKFtyLCByXSk7XG4gICAgXHRyZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoXCJ5c2NhbGVcIiwgIGZ1bmN0aW9uIChkaXN0cykge1xuXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcblx0ICAgIC5kb21haW4oWzAsZDMubWF4KGRpc3RzKV0pXG5cdCAgICAucmFuZ2UoWzAsIHJdKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZVwiLCBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdHIgPSAobGF5b3V0LndpZHRoKCkvMikgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKSAtIDIwO1xuXHRsYXlvdXQuY2x1c3Rlci5zaXplKFszNjAsIHJdKTtcblx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxheW91dDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5ub2RlX2Rpc3BsYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbiA9IGZ1bmN0aW9uIChub2RlKSB7XG5cdG4uZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChuKVxuXHQuZ2V0c2V0KFwic2l6ZVwiLCA0LjUpXG5cdC5nZXRzZXQoXCJmaWxsXCIsIFwiYmxhY2tcIilcblx0LmdldHNldChcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdC5nZXRzZXQoXCJzdHJva2Vfd2lkdGhcIiwgXCIxcHhcIilcblx0LmdldHNldChcImRpc3BsYXlcIiwgZnVuY3Rpb24gKCkge3Rocm93IFwiZGlzcGxheSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcblx0ICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zXG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gcyoyO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHMqMjtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkudHJpYW5nbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJwb2x5Z29uXCIpXG5cdCAgICAuYXR0cihcInBvaW50c1wiLCAoLXMpICsgXCIsMCBcIiArIHMgKyBcIixcIiArICgtcykgKyBcIiBcIiArIHMgKyBcIixcIiArIHMpXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuY29uZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICAvLyBjb25kaXRpb25zIGFyZSBvYmplY3RzIHdpdGhcbiAgICAvLyBuYW1lIDogYSBuYW1lIGZvciB0aGlzIGRpc3BsYXlcbiAgICAvLyBjYWxsYmFjazogdGhlIGNvbmRpdGlvbiB0byBhcHBseSAocmVjZWl2ZXMgYSB0bnQubm9kZSlcbiAgICAvLyBkaXNwbGF5OiBhIG5vZGVfZGlzcGxheVxuICAgIHZhciBjb25kcyA9IFtdO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRmb3IgKHZhciBpPTA7IGk8Y29uZHMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBjb25kID0gY29uZHNbaV07XG5cdCAgICAvLyBGb3IgZWFjaCBub2RlLCB0aGUgZmlyc3QgY29uZGl0aW9uIG1ldCBpcyB1c2VkXG5cdCAgICBpZiAoY29uZC5jYWxsYmFjay5jYWxsKHRoaXMsIG5vZGUpID09PSB0cnVlKSB7XG5cdFx0Y29uZC5kaXNwbGF5LmNhbGwodGhpcywgbm9kZSlcblx0XHRicmVhaztcblx0ICAgIH1cblx0fVxuICAgIH0pXG5cbiAgICB2YXIgYXBpID0gYXBpanMobik7XG5cbiAgICBhcGkubWV0aG9kKFwiYWRkXCIsIGZ1bmN0aW9uIChuYW1lLCBjYmFrLCBub2RlX2Rpc3BsYXkpIHtcblx0Y29uZHMucHVzaCh7IG5hbWUgOiBuYW1lLFxuXHRcdCAgICAgY2FsbGJhY2sgOiBjYmFrLFxuXHRcdCAgICAgZGlzcGxheSA6IG5vZGVfZGlzcGxheVxuXHRcdCAgIH0pO1xuXHRyZXR1cm4gbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoXCJyZXNldFwiLCBmdW5jdGlvbiAoKSB7XG5cdGNvbmRzID0gW107XG5cdHJldHVybiBuO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZChcInVwZGF0ZVwiLCBmdW5jdGlvbiAobmFtZSwgY2JhaywgbmV3X2Rpc3BsYXkpIHtcblx0Zm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAoY29uZHNbaV0ubmFtZSA9PT0gbmFtZSkge1xuXHRcdGNvbmRzW2ldLmNhbGxiYWNrID0gY2Jhaztcblx0XHRjb25kc1tpXS5kaXNwbGF5ID0gbmV3X2Rpc3BsYXk7XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIG47XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5ub2RlX2Rpc3BsYXk7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0bnRfdHJlZV9ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG5cbnZhciB0cmVlID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGNvbmYgPSB7XG5cdGR1cmF0aW9uICAgICAgICAgOiA1MDAsICAgICAgLy8gRHVyYXRpb24gb2YgdGhlIHRyYW5zaXRpb25zXG5cdG5vZGVfZGlzcGxheSAgICAgOiB0cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUoKSxcblx0bGFiZWwgICAgICAgICAgICA6IHRyZWUubGFiZWwudGV4dCgpLFxuXHRsYXlvdXQgICAgICAgICAgIDogdHJlZS5sYXlvdXQudmVydGljYWwoKSxcblx0b25fY2xpY2sgICAgICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuXHRvbl9kYmxfY2xpY2sgICAgIDogZnVuY3Rpb24gKCkge30sXG5cdG9uX21vdXNlb3ZlciAgICAgOiBmdW5jdGlvbiAoKSB7fSxcblx0bGlua19jb2xvciAgICAgICA6ICdibGFjaycsXG5cdGlkICAgICAgICAgICAgICAgOiBcIl9pZFwiXG4gICAgfTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGZvY3VzZWQgbm9kZVxuICAgIC8vIFRPRE86IFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIG11bHRpcGxlIGZvY3VzZWQgbm9kZXM/IChpZSB1c2UgYW4gYXJyYXkpXG4gICAgdmFyIGZvY3VzZWRfbm9kZTtcblxuICAgIC8vIEV4dHJhIGRlbGF5IGluIHRoZSB0cmFuc2l0aW9ucyAoVE9ETzogTmVlZGVkPylcbiAgICB2YXIgZGVsYXkgPSAwO1xuXG4gICAgLy8gRWFzZSBvZiB0aGUgdHJhbnNpdGlvbnNcbiAgICB2YXIgZWFzZSA9IFwiY3ViaWMtaW4tb3V0XCI7XG5cbiAgICAvLyBCeSBub2RlIGRhdGFcbiAgICB2YXIgc3BfY291bnRzID0ge307XG4gXG4gICAgdmFyIHNjYWxlID0gZmFsc2U7XG5cbiAgICAvLyBUaGUgaWQgb2YgdGhlIHRyZWUgY29udGFpbmVyXG4gICAgdmFyIGRpdl9pZDtcblxuICAgIC8vIFRoZSB0cmVlIHZpc3VhbGl6YXRpb24gKHN2ZylcbiAgICB2YXIgc3ZnO1xuICAgIHZhciB2aXM7XG5cbiAgICAvLyBUT0RPOiBGb3Igbm93LCBjb3VudHMgYXJlIGdpdmVuIG9ubHkgZm9yIGxlYXZlc1xuICAgIC8vIGJ1dCBpdCBtYXkgYmUgZ29vZCB0byBhbGxvdyBjb3VudHMgZm9yIGludGVybmFsIG5vZGVzXG4gICAgdmFyIGNvdW50cyA9IHt9O1xuXG4gICAgLy8gVGhlIGZ1bGwgdHJlZVxuICAgIHZhciBiYXNlID0ge1xuXHR0cmVlIDogdW5kZWZpbmVkLFxuXHRkYXRhIDogdW5kZWZpbmVkLFx0XG5cdG5vZGVzIDogdW5kZWZpbmVkLFxuXHRsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY3VyciB0cmVlLiBOZWVkZWQgdG8gcmUtY29tcHV0ZSB0aGUgbGlua3MgLyBub2RlcyBwb3NpdGlvbnMgb2Ygc3VidHJlZXNcbiAgICB2YXIgY3VyciA9IHtcblx0dHJlZSA6IHVuZGVmaW5lZCxcblx0ZGF0YSA6IHVuZGVmaW5lZCxcblx0bm9kZXMgOiB1bmRlZmluZWQsXG5cdGxpbmtzIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFRoZSBjYmFrIHJldHVybmVkXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGl2KSB7XG5cdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuICAgICAgICB2YXIgdHJlZV9kaXYgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyAgXCJweFwiKSlcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cblx0dmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuXG5cdHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcblxuXHR2YXIgbWF4X2xlYWZfbGFiZWxfbGVuZ3RoID0gZnVuY3Rpb24gKHRyZWUpIHtcblx0ICAgIHZhciBtYXggPSAwO1xuXHQgICAgdmFyIGxlYXZlcyA9IHRyZWUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbGFiZWxfd2lkdGggPSBjb25mLmxhYmVsLndpZHRoKCkobGVhdmVzW2ldKSArIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pO1xuXHRcdGlmIChsYWJlbF93aWR0aCA+IG1heCkge1xuXHRcdCAgICBtYXggPSBsYWJlbF93aWR0aDtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbWF4O1xuXHR9O1xuXG5cdHZhciBtYXhfbGVhZl9ub2RlX2hlaWdodCA9IGZ1bmN0aW9uICh0cmVlKSB7XG5cdCAgICB2YXIgbWF4ID0gMDtcblx0ICAgIHZhciBsZWF2ZXMgPSB0cmVlLmdldF9hbGxfbGVhdmVzKCk7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIG5vZGVfc2l6ZSA9IGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pO1xuXHRcdGlmIChub2RlX3NpemUgPiBtYXgpIHtcblx0XHQgICAgbWF4ID0gbm9kZV9zaXplO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXggKiAyO1xuXHR9O1xuXG5cdHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG5cdGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG5cdHZhciBtYXhfbm9kZV9oZWlnaHQgPSBtYXhfbGVhZl9ub2RlX2hlaWdodChjdXJyLnRyZWUpO1xuXG5cdC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG5cdC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcblx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIG5vZGVzXG5cdHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuXHQgICAgbl9sZWF2ZXMgOiBuX2xlYXZlcyxcblx0ICAgIGxhYmVsX2hlaWdodCA6IGQzLm1heChbZDMuZnVuY3Rvcihjb25mLmxhYmVsLmhlaWdodCgpKSgpLCBtYXhfbm9kZV9oZWlnaHRdKSxcblx0ICAgIGxhYmVsX3BhZGRpbmcgOiAxNVxuXHR9O1xuXG5cdGNvbmYubGF5b3V0LmFkanVzdF9jbHVzdGVyX3NpemUoY2x1c3Rlcl9zaXplX3BhcmFtcyk7XG5cblx0dmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcblx0dmFyIHRyYW5zZm9ybSA9IGNvbmYubGF5b3V0LnRyYW5zZm9ybV9ub2RlO1xuXG5cdHN2ZyA9IHRyZWVfZGl2XG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYubGF5b3V0LndpZHRoKCkpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMClcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cblx0dmlzID0gc3ZnXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9zdF9cIiArIGRpdl9pZClcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsXG5cdFx0ICBcInRyYW5zbGF0ZShcIiArXG5cdFx0ICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgXCIsXCIgK1xuXHRcdCAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzFdICtcblx0XHQgIFwiKVwiKTtcblxuXHRjdXJyLm5vZGVzID0gY2x1c3Rlci5ub2RlcyhjdXJyLmRhdGEpO1xuXHRjb25mLmxheW91dC5zY2FsZV9icmFuY2hfbGVuZ3RocyhjdXJyKTtcblx0Y3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0Ly8gTElOS1Ncblx0dmFyIGxpbmsgPSB2aXMuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG5cdCAgICAuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtyZXR1cm4gZC50YXJnZXRbY29uZi5pZF19KTtcblx0XG5cdGxpbmtcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xpbmtcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24oZCkge1xuXHQgICAgXHRyZXR1cm4gXCJ0bnRfdHJlZV9saW5rX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLnRhcmdldC5faWQ7XG5cdCAgICB9KVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3IoY29uZi5saW5rX2NvbG9yKSh0bnRfdHJlZV9ub2RlKGQuc291cmNlKSwgdG50X3RyZWVfbm9kZShkLnRhcmdldCkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHQgICAgXG5cblx0Ly8gTk9ERVNcblx0dmFyIG5vZGUgPSB2aXMuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdCAgICAuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7cmV0dXJuIGRbY29uZi5pZF19KTtcblxuXHR2YXIgbmV3X25vZGUgPSBub2RlXG5cdCAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcblx0XHRpZiAobi5jaGlsZHJlbikge1xuXHRcdCAgICBpZiAobi5kZXB0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIlxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiaW5uZXIgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH1cblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJsZWFmIHRudF90cmVlX25vZGVcIlxuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0XHRyZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZFxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0Ly8gZGlzcGxheSBub2RlIHNoYXBlXG5cdG5ld19ub2RlXG5cdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdCAgICB9KTtcblxuXHQvLyBkaXNwbGF5IG5vZGUgbGFiZWxcblx0bmV3X25vZGVcblx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHQgICAgXHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0ICAgIH0pO1xuXG5cdG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIGNvbmYub25fY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblxuXHQgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0fSk7XG5cblx0bmV3X25vZGUub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBjb25mLm9uX21vdXNlb3Zlci5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdCAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHR9KTtcblxuXHRuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBjb25mLm9uX2RibF9jbGljay5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdCAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHR9KTtcblxuXG5cdC8vIFVwZGF0ZSBwbG90cyBhbiB1cGRhdGVkIHRyZWVcblx0YXBpLm1ldGhvZCAoJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgdHJlZV9kaXZcblx0XHQuc3R5bGUoXCJ3aWR0aFwiLCAoY29uZi5sYXlvdXQud2lkdGgoKSArIFwicHhcIikpO1xuXHQgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmxheW91dC53aWR0aCgpKTtcblxuXHQgICAgdmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuXHQgICAgdmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcblx0ICAgIHZhciB0cmFuc2Zvcm0gPSBjb25mLmxheW91dC50cmFuc2Zvcm1fbm9kZTtcblxuXHQgICAgdmFyIG1heF9sYWJlbF9sZW5ndGggPSBtYXhfbGVhZl9sYWJlbF9sZW5ndGgoY3Vyci50cmVlKTtcblx0ICAgIGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG5cdCAgICB2YXIgbWF4X25vZGVfaGVpZ2h0ID0gbWF4X2xlYWZfbm9kZV9oZWlnaHQoY3Vyci50cmVlKTtcblxuXHQgICAgLy8gQ2x1c3RlciBzaXplIGlzIHRoZSByZXN1bHQgb2YuLi5cblx0ICAgIC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcblx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgdHJhbnNmb3JtIG9mIHRoZSBub2RlcyAocHJvYmFibHkgYnkgc2VsZWN0aW5nIG9uZSBub2RlIGFzc3VtaW5nIGFsbCB0aGUgbm9kZXMgaGF2ZSB0aGUgc2FtZSB0cmFuc2Zvcm1cblx0ICAgIHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcblx0ICAgIHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuXHRcdG5fbGVhdmVzIDogbl9sZWF2ZXMsXG5cdFx0bGFiZWxfaGVpZ2h0IDogZDMubWF4KFtkMy5mdW5jdG9yKGNvbmYubGFiZWwuaGVpZ2h0KCkpKCldKSxcblx0XHRsYWJlbF9wYWRkaW5nIDogMTVcblx0ICAgIH07XG5cdCAgICBjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG5cdCAgICBzdmdcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMCk7IC8vIGhlaWdodCBpcyBpbiB0aGUgbGF5b3V0XG5cblx0ICAgIHZpc1xuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLFxuXHRcdCAgICAgIFwidHJhbnNsYXRlKFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgICAgIFwiLFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuXHRcdCAgICAgIFwiKVwiKTtcblx0ICAgIFxuXHQgICAgY3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcblx0ICAgIGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuXHQgICAgY3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0ICAgIC8vIExJTktTXG5cdCAgICB2YXIgbGluayA9IHZpcy5zZWxlY3RBbGwoXCJwYXRoLnRudF90cmVlX2xpbmtcIilcblx0XHQuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtyZXR1cm4gZC50YXJnZXRbY29uZi5pZF19KTtcblxuICAgICAgICAgICAgLy8gTk9ERVNcblx0ICAgIHZhciBub2RlID0gdmlzLnNlbGVjdEFsbChcImcudG50X3RyZWVfbm9kZVwiKVxuXHRcdC5kYXRhKGN1cnIubm9kZXMsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gZFtjb25mLmlkXX0pO1xuXG5cdCAgICB2YXIgZXhpdF9saW5rID0gbGlua1xuXHRcdC5leGl0KClcblx0XHQucmVtb3ZlKCk7XG5cblx0ICAgIGxpbmtcblx0XHQuZW50ZXIoKVxuXHRcdC5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xpbmtcIilcblx0XHQuYXR0cihcImlkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0ICAgIHJldHVybiBcInRudF90cmVlX2xpbmtfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGQudGFyZ2V0Ll9pZDtcblx0XHR9KVxuXHRcdC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0ICAgIHJldHVybiBkMy5mdW5jdG9yKGNvbmYubGlua19jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0XHR9KVxuXHRcdC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblx0ICAgIGxpbmtcblx0ICAgIFx0LnRyYW5zaXRpb24oKVxuXHRcdC5lYXNlKGVhc2UpXG5cdCAgICBcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHQgICAgXHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cblx0ICAgIC8vIE5vZGVzXG5cdCAgICB2YXIgbmV3X25vZGUgPSBub2RlXG5cdFx0LmVudGVyKClcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuXHRcdCAgICBpZiAobi5jaGlsZHJlbikge1xuXHRcdFx0aWYgKG4uZGVwdGggPT0gMCkge1xuXHRcdFx0ICAgIHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0ICAgIHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIlxuXHRcdFx0fVxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCJcblx0XHQgICAgfVxuXHRcdH0pXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZDtcblx0XHR9KVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG4gICBcblx0ICAgIC8vIEV4aXRpbmcgbm9kZXMgYXJlIGp1c3QgcmVtb3ZlZFxuXHQgICAgbm9kZVxuXHRcdC5leGl0KClcblx0XHQucmVtb3ZlKCk7XG5cblx0ICAgIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cblx0XHR0cmVlLnRyaWdnZXIoXCJub2RlOmNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgfSk7XG5cblx0ICAgIG5ld19ub2RlLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdGNvbmYub25fbW91c2VvdmVyLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cblx0XHR0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgfSk7XG5cblx0ICAgIG5ld19ub2RlLm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRjb25mLm9uX2RibF9jbGljay5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdFx0dHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIH0pO1xuXG5cblx0ICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbm9kZXMgYWdhaW4gaW4gY2FzZSB0aGV5IGhhdmUgY2hhbmdlZCBsaXZlbHkgKG9yIHRoZSBsYXlvdXQpXG5cdCAgICBub2RlLnNlbGVjdEFsbChcIipcIikucmVtb3ZlKCk7XG5cdCAgICBub2RlXG5cdFx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdFx0ICAgIH0pO1xuXG5cdCAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhbGwgdGhlIGxhYmVscyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcblx0ICAgIG5vZGVcblx0XHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0XHQgICAgfSk7XG5cblx0ICAgIG5vZGVcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHQpXG5cdC5nZXRzZXQgKGNvbmYpXG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIGRhdGEgdXNpbmcgZ2V0c2V0IC8gZmluYWxpemVycyAmIHRyYW5zZm9ybXNcbiAgICBhcGkubWV0aG9kICgnZGF0YScsIGZ1bmN0aW9uIChkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGJhc2UuZGF0YTtcblx0fVxuXG5cdC8vIFRoZSBvcmlnaW5hbCBkYXRhIGlzIHN0b3JlZCBhcyB0aGUgYmFzZSBhbmQgY3VyciBkYXRhXG5cdGJhc2UuZGF0YSA9IGQ7XG5cdGN1cnIuZGF0YSA9IGQ7XG5cblx0Ly8gU2V0IHVwIGEgbmV3IHRyZWUgYmFzZWQgb24gdGhlIGRhdGFcblx0dmFyIG5ld3RyZWUgPSB0bnRfdHJlZV9ub2RlKGJhc2UuZGF0YSk7XG5cblx0dC5yb290KG5ld3RyZWUpO1xuXG5cdHRyZWUudHJpZ2dlcihcImRhdGE6aGFzQ2hhbmdlZFwiLCBiYXNlLmRhdGEpO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogUmV3cml0ZSB0cmVlIHVzaW5nIGdldHNldCAvIGZpbmFsaXplcnMgJiB0cmFuc2Zvcm1zXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3QnLCBmdW5jdGlvbiAobXlUcmVlKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY3Vyci50cmVlO1xuICAgIFx0fVxuXG5cdC8vIFRoZSBvcmlnaW5hbCB0cmVlIGlzIHN0b3JlZCBhcyB0aGUgYmFzZSwgcHJldiBhbmQgY3VyciB0cmVlXG4gICAgXHRiYXNlLnRyZWUgPSBteVRyZWU7XG5cdGN1cnIudHJlZSA9IGJhc2UudHJlZTtcbi8vXHRwcmV2LnRyZWUgPSBiYXNlLnRyZWU7XG4gICAgXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdzdWJ0cmVlJywgZnVuY3Rpb24gKGN1cnJfbm9kZXMpIHtcblx0dmFyIHN1YnRyZWUgPSBiYXNlLnRyZWUuc3VidHJlZShjdXJyX25vZGVzKTtcblx0Y3Vyci5kYXRhID0gc3VidHJlZS5kYXRhKCk7XG5cdGN1cnIudHJlZSA9IHN1YnRyZWU7XG5cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZm9jdXNfbm9kZScsIGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vIGZpbmQgXG5cdHZhciBmb3VuZF9ub2RlID0gdC5yb290KCkuZmluZF9ub2RlKGZ1bmN0aW9uIChuKSB7XG5cdCAgICByZXR1cm4gbm9kZS5pZCgpID09PSBuLmlkKCk7XG5cdH0pO1xuXHRmb2N1c2VkX25vZGUgPSBmb3VuZF9ub2RlO1xuXHR0LnN1YnRyZWUoZm91bmRfbm9kZS5nZXRfYWxsX2xlYXZlcygpKTtcblxuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdoYXNfZm9jdXMnLCBmdW5jdGlvbiAobm9kZSkge1xuXHRyZXR1cm4gKChmb2N1c2VkX25vZGUgIT09IHVuZGVmaW5lZCkgJiYgKGZvY3VzZWRfbm9kZS5pZCgpID09PSBub2RlLmlkKCkpKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyZWxlYXNlX2ZvY3VzJywgZnVuY3Rpb24gKCkge1xuXHR0LmRhdGEgKGJhc2UuZGF0YSk7XG5cdGZvY3VzZWRfbm9kZSA9IHVuZGVmaW5lZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG4iLCJ2YXIgdG50X3RyZWUgPSByZXF1aXJlKFwidG50LnRyZWVcIik7XG52YXIgdG50X3Rvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG5cbnZhciBnZW5lQXNzb2NpYXRpb25zVHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBjb25maWcgPSB7XG5cdGRhdGEgOiB1bmRlZmluZWQsXG5cdGRpYW1ldGVyIDogMTAwMCxcblx0Y3R0dkFwaSA6IHVuZGVmaW5lZFxuICAgIH07XG4gICAgXG4gICAgdmFyIHNjYWxlID0gZDMuc2NhbGUucXVhbnRpemUoKVxuXHQuZG9tYWluKFstMywzXSlcblx0LnJhbmdlKFtcIiNiMjE4MmJcIiwgXCIjZWY4YTYyXCIsIFwiI2ZkZGJjN1wiLCBcIiNmN2Y3ZjdcIiwgXCIjZDFlNWYwXCIsIFwiIzY3YTljZlwiLCBcIiMyMTY2YWNcIl0pO1xuXG4gICAgZnVuY3Rpb24gbG9va0RhdGFzb3VyY2UgKGFyciwgZHNOYW1lKSB7XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBkcyA9IGFycltpXTtcblx0ICAgIGlmIChkcy5kYXRhdHlwZSA9PT0gZHNOYW1lKSB7XG5cdFx0cmV0dXJuIHtcblx0XHQgICAgXCJjb3VudFwiOiBkcy5ldmlkZW5jZV9jb3VudCxcblx0XHQgICAgXCJzY29yZVwiOiBkcy5hc3NvY2lhdGlvbl9zY29yZVxuXHRcdH07XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHtcblx0ICAgIFwiY291bnRcIjogMCxcblx0ICAgIFwic2NvcmVcIjogMFxuXHR9O1xuICAgIH1cbiAgICBcblxuICAgIGZ1bmN0aW9uIHJlbmRlciAoZmxvd2VyVmlldywgZGl2KSB7XG5cdHZhciBkYXRhID0gY29uZmlnLmRhdGE7XG5cdHZhciB0cmVlVmlzID0gdG50X3RyZWUoKTtcbiAgICBcblx0Ly8gdG9vbHRpcHNcblx0dmFyIG5vZGVUb29sdGlwID0gZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHZhciBvYmogPSB7fTtcblx0ICAgIHZhciBzY29yZSA9IG5vZGUucHJvcGVydHkoXCJhc3NvY2lhdGlvbl9zY29yZVwiKTtcblx0ICAgIG9iai5oZWFkZXIgPSBub2RlLnByb3BlcnR5KFwibGFiZWxcIikgKyBcIiAoQXNzb2NpYXRpb24gc2NvcmU6IFwiICsgc2NvcmUgKyBcIilcIjtcblx0ICAgIHZhciBsb2MgPSBcIiMvZXZpZGVuY2UvXCIgKyBjb25maWcudGFyZ2V0ICsgXCIvXCIgKyBub2RlLnByb3BlcnR5KFwiZWZvX2NvZGVcIik7XG5cdCAgICAvL29iai5ib2R5PVwiPGRpdj48L2Rpdj48YSBocmVmPVwiICsgbG9jICsgXCI+VmlldyBldmlkZW5jZSBkZXRhaWxzPC9hPjxici8+PGEgaHJlZj0nJz5ab29tIG9uIG5vZGU8L2E+XCI7XG5cdCAgICBvYmoucm93cyA9IFtdO1xuXHQgICAgb2JqLnJvd3MucHVzaCh7XG5cdFx0dmFsdWUgOiBcIjxhIGNsYXNzPWN0dHZfZmxvd2VyTGluayBocmVmPVwiICsgbG9jICsgXCI+PGRpdj48L2Rpdj48L2E+XCJcblx0ICAgIH0pO1xuXHQgICAgb2JqLnJvd3MucHVzaCh7XG5cdFx0dmFsdWU6IFwiPGEgaHJlZj1cIiArIGxvYyArIFwiPlZpZXcgZXZpZGVuY2UgZGV0YWlsczwvYT5cIlxuXHQgICAgfSk7XG5cdCAgICBvYmoucm93cy5wdXNoKHtcblx0XHR2YWx1ZSA6IG5vZGUuaXNfY29sbGFwc2VkKCkgPyBcIlVuY29sbGFwc2UgY2hpbGRyZW5cIiA6IFwiQ29sbGFwc2UgY2hpbGRyZW5cIixcblx0XHRsaW5rIDogZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgbi50b2dnbGUoKTtcblx0XHQgICAgdHJlZVZpcy51cGRhdGUoKTtcblx0XHR9LFxuXHRcdG9iajogbm9kZVxuXHQgICAgfSk7XG5cblx0ICAgIGlmICh0cmVlVmlzLmhhc19mb2N1cyhub2RlKSkge1xuXHRcdG9iai5yb3dzLnB1c2goe1xuXHRcdCAgICB2YWx1ZSA6IFwiUmVsZWFzZSBmb2N1c1wiLFxuXHRcdCAgICBsaW5rIDogZnVuY3Rpb24gKG4pIHtcblx0XHRcdHRyZWVWaXMucmVsZWFzZV9mb2N1cyhuKVxuXHRcdFx0ICAgIC51cGRhdGUoKTtcblx0XHQgICAgfSxcblx0XHQgICAgb2JqIDogbm9kZVxuXHRcdH0pO1xuXHQgICAgfSBlbHNlIHtcblx0XHRvYmoucm93cy5wdXNoKHtcblx0XHQgICAgdmFsdWU6XCJTZXQgZm9jdXMgb24gbm9kZVwiLFxuXHRcdCAgICBsaW5rIDogZnVuY3Rpb24gKG4pIHtcblx0XHRcdHRyZWVWaXMuZm9jdXNfbm9kZShuKVxuXHRcdFx0ICAgIC51cGRhdGUoKTtcblx0XHQgICAgfSxcblx0XHQgICAgb2JqOiBub2RlXG5cdFx0fSk7XG5cdCAgICB9XG5cblx0ICAgIHZhciB0ID0gdG50X3Rvb2x0aXAubGlzdCgpXG5cdFx0LmlkKDEpXG5cdFx0LndpZHRoKDE4MCk7XG5cdCAgICAvLyBIaWphY2sgdG9vbHRpcCdzIGZpbGwgY2FsbGJhY2tcblx0ICAgIHZhciBvcmlnRmlsbCA9IHQuZmlsbCgpO1xuXG5cdCAgICAvLyBQYXNzIGEgbmV3IGZpbGwgY2FsbGJhY2sgdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgb25lIGFuZCBkZWNvcmF0ZXMgd2l0aCBmbG93ZXJzXG5cdCAgICB0LmZpbGwgKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0b3JpZ0ZpbGwuY2FsbCh0aGlzLCBkYXRhKTtcblx0XHR2YXIgZGF0YXR5cGVzID0gbm9kZS5wcm9wZXJ0eShcImRhdGF0eXBlc1wiKTtcblx0XHR2YXIgZmxvd2VyRGF0YSA9IFtcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiZ2VuZXRpY19hc3NvY2lhdGlvblwiKS5zY29yZSwgIFwibGFiZWxcIjpcIkdlbmV0aWNzXCJ9LFxuXHRcdCAgICB7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJzb21hdGljX211dGF0aW9uXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiU29tYXRpY1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwia25vd25fZHJ1Z1wiKS5zY29yZSwgIFwibGFiZWxcIjpcIkRydWdzXCJ9LFxuXHRcdCAgICB7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJybmFfZXhwcmVzc2lvblwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlJOQVwifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiYWZmZWN0ZWRfcGF0aHdheVwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlBhdGh3YXlzXCJ9LFxuXHRcdCAgICB7XCJ2YWx1ZVwiOmxvb2tEYXRhc291cmNlKGRhdGF0eXBlcywgXCJhbmltYWxfbW9kZWxcIikuc2NvcmUsICBcImxhYmVsXCI6XCJNb2RlbHNcIn1cblx0XHRdXG5cdFx0Zmxvd2VyVmlld1xuXHRcdCAgICAuZGlhZ29uYWwoMTUwKVxuXHRcdCAgICAudmFsdWVzKGZsb3dlckRhdGEpKHRoaXMuc2VsZWN0KFwiZGl2XCIpLm5vZGUoKSk7XG5cdCAgICB9KTtcblxuXHQgICAgdC5jYWxsKHRoaXMsIG9iaik7XG5cdH1cblxuXHR0cmVlVmlzXG5cdCAgICAuZGF0YShjb25maWcuZGF0YSlcblx0ICAgIC5ub2RlX2Rpc3BsYXkodG50X3RyZWUubm9kZV9kaXNwbGF5LmNpcmNsZSgpXG5cdCAgICBcdFx0ICAuc2l6ZSg4KVxuXHQgICAgXHRcdCAgLmZpbGwoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIFx0XHQgICAgICByZXR1cm4gc2NhbGUobm9kZS5wcm9wZXJ0eShcImFzc29jaWF0aW9uX3Njb3JlXCIpKTtcblx0ICAgIFx0XHQgIH0pXG5cdCAgICBcdFx0IClcblx0ICAgIC5vbl9jbGljayhub2RlVG9vbHRpcClcblx0ICAgIC5sYWJlbCh0bnRfdHJlZS5sYWJlbC50ZXh0KClcblx0ICAgIFx0ICAgLnRleHQoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIFx0ICAgICAgIGlmIChub2RlLmlzX2xlYWYoKSkge1xuXHQgICAgXHRcdCAgIHZhciBkaXNlYXNlTmFtZSA9IG5vZGUucHJvcGVydHkoXCJsYWJlbFwiKTtcblx0ICAgIFx0XHQgICBpZiAoZGlzZWFzZU5hbWUubGVuZ3RoID4gMzApIHtcblx0ICAgIFx0XHQgICAgICAgZGlzZWFzZU5hbWUgPSBkaXNlYXNlTmFtZS5zdWJzdHJpbmcoMCwzMCkgKyBcIi4uLlwiO1xuXHQgICAgXHRcdCAgIH1cblx0ICAgIFx0XHQgICByZXR1cm4gZGlzZWFzZU5hbWVcblx0ICAgIFx0ICAgICAgIH1cblx0ICAgIFx0ICAgICAgIHJldHVybiBcIlwiO1xuXHQgICAgXHQgICB9KVxuXHQgICAgXHQgICAuZm9udHNpemUoMTQpXG5cdCAgICBcdCAgKVxuXHQgICAgLmxheW91dCh0bnRfdHJlZS5sYXlvdXQucmFkaWFsKClcblx0ICAgIFx0ICAgIC53aWR0aChjb25maWcuZGlhbWV0ZXIpXG5cdCAgICBcdCAgICAuc2NhbGUoZmFsc2UpXG5cdCAgICBcdCAgICk7XG5cblx0dHJlZVZpcyhkaXYubm9kZSgpKTtcblx0ZDMuc2VsZWN0QWxsKFwiLnRudF90cmVlX25vZGVcIilcblx0ICAgIC5hcHBlbmQoXCJ0aXRsZVwiKVxuXHQgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZC5sYWJlbDtcblx0ICAgIH0pO1xuXG4gICAgfVxuICAgIFxuICAgIC8vIGRlcHM6IHRyZWVfdmlzLCBmbG93ZXJcbiAgICB2YXIgdGhlbWUgPSBmdW5jdGlvbiAoZmxvd2VyVmlldywgZGl2KSB7XG5cdHZhciB2aXMgPSBkMy5zZWxlY3QoZGl2KVxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLnN0eWxlKFwicG9zaXRpb25cIiwgXCJyZWxhdGl2ZVwiKTtcblxuXHRpZiAoKGNvbmZpZy5kYXRhID09PSB1bmRlZmluZWQpICYmIChjb25maWcudGFyZ2V0ICE9PSB1bmRlZmluZWQpICYmIChjb25maWcuY3R0dkFwaSAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgdmFyIGFwaSA9IGNvbmZpZy5jdHR2QXBpO1xuXHQgICAgdmFyIHVybCA9IGFwaS51cmwuYXNzb2NpYXRpb25zKHtcblx0XHRnZW5lIDogY29uZmlnLnRhcmdldCxcblx0XHRkYXRhc3RydWN0dXJlIDogXCJ0cmVlXCJcblx0ICAgIH0pO1xuXHQgICAgYXBpLmNhbGwodXJsKVxuXHRcdC50aGVuIChmdW5jdGlvbiAocmVzcCkge1xuXHRcdCAgICBjb25maWcuZGF0YSA9IHJlc3AuYm9keS5kYXRhO1xuXHRcdCAgICByZW5kZXIoZmxvd2VyVmlldywgdmlzKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0ICAgIHJlbmRlcihmbG93ZXJWaWV3LCB2aXMpO1xuXHR9XG4gICAgfTtcblxuICAgIC8vIHNpemUgb2YgdGhlIHRyZWVcbiAgICB0aGVtZS5kaWFtZXRlciA9IGZ1bmN0aW9uIChkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmZpZy5kaWFtZXRlcjtcblx0fVxuXHRjb25maWcuZGlhbWV0ZXIgPSBkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLy9cbiAgICB0aGVtZS50YXJnZXQgPSBmdW5jdGlvbiAodCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25maWcudGFyZ2V0O1xuXHR9XG5cdGNvbmZpZy50YXJnZXQgPSB0O1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdGhlbWUuY3R0dkFwaSA9IGZ1bmN0aW9uIChhcGkpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZmlnLmN0dHZBcGk7XG5cdH1cblx0Y29uZmlnLmN0dHZBcGkgPSBhcGk7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgLy8gZGF0YSBpcyBvYmplY3RcbiAgICB0aGVtZS5kYXRhID0gZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZmlnLmRhdGE7XG5cdH1cblx0Y29uZmlnLmRhdGEgPSBkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoZW1lO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZ2VuZUFzc29jaWF0aW9uc1RyZWU7XG4iXX0=
