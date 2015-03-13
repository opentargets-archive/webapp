(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
if (typeof tnt === "undefined") {
    module.exports = tnt = require("./src/ta.js");
}
var eventsystem = require ("biojs-events");
eventsystem.mixin (tnt);
tnt.utils = require ("tnt.utils");
tnt.tooltip = require ("tnt.tooltip");
tnt.tree = require ("tnt.tree");
tnt.tree.node = require ("tnt.tree.node");
tnt.board = require ("tnt.board");
tnt.board.genome = require("tnt.genome");
tnt.legend = require ("tnt.legend");

},{"./src/ta.js":49,"biojs-events":3,"tnt.board":8,"tnt.genome":26,"tnt.legend":32,"tnt.tooltip":34,"tnt.tree":38,"tnt.tree.node":36,"tnt.utils":45}],3:[function(require,module,exports){
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

},{"backbone-events-standalone":5}],4:[function(require,module,exports){
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
      breaker = {},
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
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              if (iterator.call(context, obj[key], key, obj) === breaker) return;
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
  if (typeof define === "function") {
    define(function() {
      return Events;
    });
  } else if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],5:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":4}],6:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":7}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
// tnt.utils = require("tnt.utils");
// tnt.tooltip = require("tnt.tooltip");
// tnt.board = require("./src/index.js");

module.exports = board = require("./src/index");

},{"./src/index":12}],9:[function(require,module,exports){
var apijs = require ("tnt.api");
var deferCancel = require ("tnt.utils").defer_cancel;

var board = function() {
    "use strict";
    
    //// Private vars
    var svg;
    var div_id;
    var tracks = [];
    var min_width = 50;
    var height    = 0;    // This is the global height including all the tracks
    var width     = 920;
    var height_offset = 20;
    var loc = {
	species  : undefined,
	chr      : undefined,
        from     : 0,
        to       : 500
    };

    // TODO: We have now background color in the tracks. Can this be removed?
    // It looks like it is used in the too-wide pane etc, but it may not be needed anymore
    var bgColor   = d3.rgb('#F8FBEF'); //#F8FBEF
    var pane; // Draggable pane
    var svg_g;
    var xScale;
    var zoomEventHandler = d3.behavior.zoom();
    var limits = {
	left : 0,
	right : 1000,
	zoom_out : 1000,
	zoom_in  : 100
    };
    var cap_width = 3;
    var dur = 500;
    var drag_allowed = true;

    var exports = {
	ease          : d3.ease("cubic-in-out"),
	extend_canvas : {
	    left : 0,
	    right : 0
	},
	show_frame : true
	// limits        : function () {throw "The limits method should be defined"}	
    };

    // The returned closure / object
    var track_vis = function(div) {
	div_id = d3.select(div).attr("id");

	// The original div is classed with the tnt class
	d3.select(div)
	    .classed("tnt", true);

	// TODO: Move the styling to the scss?
	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("id", "tnt_" + div_id)
	    .style("position", "relative")
	    .classed("tnt_framed", exports.show_frame ? true : false)
	    .style("width", (width + cap_width*2 + exports.extend_canvas.right + exports.extend_canvas.left) + "px")

	var groupDiv = browserDiv
	    .append("div")
	    .attr("class", "tnt_groupDiv");

	// The SVG
	svg = groupDiv
	    .append("svg")
	    .attr("class", "tnt_svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("pointer-events", "all");

	svg_g = svg
	    .append("g")
            .attr("transform", "translate(0,20)")
            .append("g")
	    .attr("class", "tnt_g");

	// caps
	svg_g
	    .append("rect")
	    .attr("id", "tnt_" + div_id + "_5pcap")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");
	svg_g
	    .append("rect")
	    .attr("id", "tnt_" + div_id + "_3pcap")
	    .attr("x", width-cap_width)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");

	// The Zooming/Panning Pane
	pane = svg_g
	    .append("rect")
	    .attr("class", "tnt_pane")
	    .attr("id", "tnt_" + div_id + "_pane")
	    .attr("width", width)
	    .attr("height", height)
	    .style("fill", bgColor);

	// ** TODO: Wouldn't be better to have these messages by track?
	// var tooWide_text = svg_g
	//     .append("text")
	//     .attr("class", "tnt_wideOK_text")
	//     .attr("id", "tnt_" + div_id + "_tooWide")
	//     .attr("fill", bgColor)
	//     .text("Region too wide");

	// TODO: I don't know if this is the best way (and portable) way
	// of centering the text in the text area
	// var bb = tooWide_text[0][0].getBBox();
	// tooWide_text
	//     .attr("x", ~~(width/2 - bb.width/2))
	//     .attr("y", ~~(height/2 - bb.height/2));
    };

    // API
    var api = apijs (track_vis)
	.getset (exports)
	.getset (limits)
	.getset (loc);

    api.transform (track_vis.extend_canvas, function (val) {
	var prev_val = track_vis.extend_canvas();
	val.left = val.left || prev_val.left;
	val.right = val.right || prev_val.right;
	return val;
    });

    // track_vis always starts on loc.from & loc.to
    api.method ('start', function () {

	// Reset the tracks
	for (var i=0; i<tracks.length; i++) {
	    if (tracks[i].g) {
		tracks[i].display().reset.call(tracks[i]);
	    }
	    _init_track(tracks[i]);
	}

	_place_tracks();

	// The continuation callback
	var cont = function (resp) {
	    limits.right = resp;

	    // zoomEventHandler.xExtent([limits.left, limits.right]);
	    if ((loc.to - loc.from) < limits.zoom_in) {
		if ((loc.from + limits.zoom_in) > limits.zoom_in) {
		    loc.to = limits.right;
		} else {
		    loc.to = loc.from + limits.zoom_in;
		}
	    }
	    plot();

	    for (var i=0; i<tracks.length; i++) {
		_update_track(tracks[i], loc);
	    }
	};

	// If limits.right is a function, we have to call it asynchronously and
	// then starting the plot once we have set the right limit (plot)
	// If not, we assume that it is an objet with new (maybe partially defined)
	// definitions of the limits and we can plot directly
	// TODO: Right now, only right can be called as an async function which is weak
	if (typeof (limits.right) === 'function') {
	    limits.right(cont);
	} else {
	    cont(limits.right);
	}

    });

    api.method ('update', function () {
	for (var i=0; i<tracks.length; i++) {
	    _update_track (tracks[i]);
	}

    });

    var _update_track = function (track, where) {
	if (track.data()) {
	    var data_updater = track.data().update();
	    data_updater({
		'loc' : where,
		'on_success' : function () {
		    track.display().update.call(track, xScale);
		}
	    });
	}
    };

    var plot = function() {

	xScale = d3.scale.linear()
	    .domain([loc.from, loc.to])
	    .range([0, width]);

	if (drag_allowed) {
	    svg_g.call( zoomEventHandler
		       .x(xScale)
		       .scaleExtent([(loc.to-loc.from)/(limits.zoom_out-1), (loc.to-loc.from)/limits.zoom_in])
		       .on("zoom", _move)
		     );
	}

    };

    // right/left/zoom pans or zooms the track. These methods are exposed to allow external buttons, etc to interact with the tracks. The argument is the amount of panning/zooming (ie. 1.2 means 20% panning) With left/right only positive numbers are allowed.
    api.method ('move_right', function (factor) {
	if (factor > 0) {
	    _manual_move(factor, 1);
	}
    });

    api.method ('move_left', function (factor) {
	if (factor > 0) {
	    _manual_move(factor, -1);
	}
    });

    api.method ('zoom', function (factor) {
	_manual_move(factor, 0);
    });

    api.method ('find_track_by_id', function (id) {
	for (var i=0; i<tracks.length; i++) {
	    if (tracks[i].id() === id) {
		return tracks[i];
	    }
	}
    });

    api.method ('reorder', function (new_tracks) {
	// TODO: This is defining a new height, but the global height is used to define the size of several
	// parts. We should do this dynamically

	for (var j=0; j<new_tracks.length; j++) {
	    var found = false;
	    for (var i=0; i<tracks.length; i++) {
		if (tracks[i].id() === new_tracks[j].id()) {
		    found = true;
		    tracks.splice(i,1);
		    break;
		}
	    }
	    if (!found) {
		_init_track(new_tracks[j]);
		_update_track(new_tracks[j], {from : loc.from, to : loc.to});
	    }
	}

	for (var x=0; x<tracks.length; x++) {
	    tracks[x].g.remove();
	}

	tracks = new_tracks;
	_place_tracks();

    });

    api.method ('remove_track', function (track) {
	track.g.remove();
    });

    api.method ('add_track', function (track) {
	if (track instanceof Array) {
	    for (var i=0; i<track.length; i++) {
		track_vis.add_track (track[i]);
	    }
	    return track_vis;
	}
	tracks.push(track);
	return track_vis;
    });

    api.method('tracks', function (new_tracks) {
	if (!arguments.length) {
	    return tracks
	}
	tracks = new_tracks;
	return track_vis;
    });

    // 
    api.method ('width', function (w) {
	// TODO: Allow suffixes like "1000px"?
	// TODO: Test wrong formats
	if (!arguments.length) {
	    return width;
	}
	// At least min-width
	if (w < min_width) {
	    w = min_width
	}

	// We are resizing
	if (div_id !== undefined) {
	    d3.select("#tnt_" + div_id).select("svg").attr("width", w);
	    // Resize the zooming/panning pane
	    d3.select("#tnt_" + div_id).style("width", (parseInt(w) + cap_width*2) + "px");
	    d3.select("#tnt_" + div_id + "_pane").attr("width", w);

	    // Replot
	    width = w;
	    plot();
	    for (var i=0; i<tracks.length; i++) {
		tracks[i].g.select("rect").attr("width", w);
		tracks[i].display().reset.call(tracks[i]);
		tracks[i].display().update.call(tracks[i],xScale);
	    }
	    
	} else {
	    width = w;
	}
	
	return track_vis;
    });

    api.method('allow_drag', function(b) {
	if (!arguments.length) {
	    return drag_allowed;
	}
	drag_allowed = b;
	if (drag_allowed) {
	    // When this method is called on the object before starting the simulation, we don't have defined xScale
	    if (xScale !== undefined) {
		svg_g.call( zoomEventHandler.x(xScale)
			   // .xExtent([0, limits.right])
			   .scaleExtent([(loc.to-loc.from)/(limits.zoom_out-1), (loc.to-loc.from)/limits.zoom_in])
			   .on("zoom", _move) );
	    }
	} else {
	    // We create a new dummy scale in x to avoid dragging the previous one
	    // TODO: There may be a cheaper way of doing this?
	    zoomEventHandler.x(d3.scale.linear()).on("zoom", null);
	}
	return track_vis;
    });

    var _place_tracks = function () {
	var h = 0;
	for (var i=0; i<tracks.length; i++) {
	    var track = tracks[i];
	    if (track.g.attr("transform")) {
		track.g
		    .transition()
		    .duration(dur)
		    .attr("transform", "translate(0," + h + ")");
	    } else {
		track.g
		    .attr("transform", "translate(0," + h + ")");
	    }

	    h += track.height();
	}

	// svg
	svg.attr("height", h + height_offset);

	// div
	d3.select("#tnt_" + div_id)
	    .style("height", (h + 10 + height_offset) + "px");

	// caps
	d3.select("#tnt_" + div_id + "_5pcap")
	    .attr("height", h)
	    // .move_to_front()
	    .each(function (d) {
		move_to_front(this);
	    })
	d3.select("#tnt_" + div_id + "_3pcap")
	    .attr("height", h)
	//.move_to_front()
	    .each (function (d) {
		move_to_front(this);
	    });
	

	// pane
	pane
	    .attr("height", h + height_offset);

	// tooWide_text. TODO: Is this still needed?
	// var tooWide_text = d3.select("#tnt_" + div_id + "_tooWide");
	// var bb = tooWide_text[0][0].getBBox();
	// tooWide_text
	//     .attr("y", ~~(h/2) - bb.height/2);

	return track_vis;
    }

    var _init_track = function (track) {
	track.g = svg.select("g").select("g")
	    .append("g")
	    .attr("class", "tnt_track")
	    .attr("height", track.height());

	// Rect for the background color
	track.g
	    .append("rect")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", track_vis.width())
	    .attr("height", track.height())
	    .style("fill", track.background_color())
	    .style("pointer-events", "none");

	if (track.display()) {
	    track.display().init.call(track, width);
	}
	
	return track_vis;
    };

    var _manual_move = function (factor, direction) {
	var oldDomain = xScale.domain();

	var span = oldDomain[1] - oldDomain[0];
	var offset = (span * factor) - span;

	var newDomain;
	switch (direction) {
	case -1 :
	    newDomain = [(~~oldDomain[0] - offset), ~~(oldDomain[1] - offset)];
	    break;
	case 1 :
	    newDomain = [(~~oldDomain[0] + offset), ~~(oldDomain[1] - offset)];
	    break;
	case 0 :
	    newDomain = [oldDomain[0] - ~~(offset/2), oldDomain[1] + (~~offset/2)];
	}

	var interpolator = d3.interpolateNumber(oldDomain[0], newDomain[0]);
	var ease = exports.ease;

	var x = 0;
	d3.timer(function() {
	    var curr_start = interpolator(ease(x));
	    var curr_end;
	    switch (direction) {
	    case -1 :
		curr_end = curr_start + span;
		break;
	    case 1 :
		curr_end = curr_start + span;
		break;
	    case 0 :
		curr_end = oldDomain[1] + oldDomain[0] - curr_start;
		break;
	    }

	    var currDomain = [curr_start, curr_end];
	    xScale.domain(currDomain);
	    _move(xScale);
	    x+=0.02;
	    return x>1;
	});
    };


    var _move_cbak = function () {
	var currDomain = xScale.domain();
	track_vis.from(~~currDomain[0]);
	track_vis.to(~~currDomain[1]);

	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    _update_track(track, loc);
	}
    };
    // The deferred_cbak is deferred at least this amount of time or re-scheduled if deferred is called before
    var _deferred = deferCancel(_move_cbak, 300);

    // api.method('update', function () {
    // 	_move();
    // });

    var _move = function (new_xScale) {
	if (new_xScale !== undefined && drag_allowed) {
	    zoomEventHandler.x(new_xScale);
	}

	// Show the red bars at the limits
	var domain = xScale.domain();
	if (domain[0] <= 5) {
	    d3.select("#tnt_" + div_id + "_5pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	if (domain[1] >= (limits.right)-5) {
	    d3.select("#tnt_" + div_id + "_3pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}


	// Avoid moving past the limits
	if (domain[0] < limits.left) {
	    zoomEventHandler.translate([zoomEventHandler.translate()[0] - xScale(limits.left) + xScale.range()[0], zoomEventHandler.translate()[1]]);
	} else if (domain[1] > limits.right) {
	    zoomEventHandler.translate([zoomEventHandler.translate()[0] - xScale(limits.right) + xScale.range()[1], zoomEventHandler.translate()[1]]);
	}

	_deferred();

	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    track.display().move.call(track,xScale);
	}
    };

    // api.method({
    // 	allow_drag : api_allow_drag,
    // 	width      : api_width,
    // 	add_track  : api_add_track,
    // 	reorder    : api_reorder,
    // 	zoom       : api_zoom,
    // 	left       : api_left,
    // 	right      : api_right,
    // 	start      : api_start
    // });

    // Auxiliar functions
    function move_to_front (elem) {
	elem.parentNode.appendChild(elem);
    }
    
    return track_vis;
};

module.exports = exports = board;

},{"tnt.api":6,"tnt.utils":45}],10:[function(require,module,exports){
var apijs = require ("tnt.api");
var ensemblRestAPI = require("tnt.ensembl");

// var board = {};
// board.track = {};

var data = function() {
    "use strict";
    var _ = function () {
    };

    // Getters / Setters
    apijs (_)
	.getset ('label', "")
	.getset ('elements', [])
	.getset ('update', function () {});


    // The retrievers. They need to access 'elements'
    data.retriever = {};

    data.retriever.sync = function() {
	var update_track = function(obj) {
        // Object has a location and a plug-in defined callback
            _.elements(update_track.retriever()(obj.loc));
            obj.on_success();
	};

	apijs (update_track)
	    .getset ('retriever', function () {})

	return update_track;
    };

    data.retriever.async = function () {
	var url = '';

	var update_track = function (obj) {
	    d3.json(url, function (err, resp) {
		_.elements(resp);
		obj.on_success();
	    }); 
	};

	apijs (update_track)
	    .getset ('url', '');

	return update_track;
    };

    data.retriever.ensembl = function() {
    	var success = [function () {}];
    	var endpoint;
    	var eRest = ensemblRestAPI();
    	var update_track = function(obj) {
            // Object has loc and a plug-in defined callback
            var loc         = obj.loc;
            var plugin_cbak = obj.on_success;
            eRest.call({url     : eRest.url[update_track.endpoint()](loc),
    			success : function (resp) {
                            _.elements(resp);

                        // User-defined
                            for (var i=0; i<success.length; i++) {
    				success[i](resp);
                            };

                        // Plug-in defined
                            plugin_cbak();
    			}
                       });

    	};

    	apijs(update_track)
    	    .getset('endpoint');

    // TODO: We don't have a way of resetting the success array
    // TODO: Should this also be included in the sync retriever?
    // Still not sure this is the best option to support more than one callback
    	update_track.success = function (callback) {
            if (!arguments.length) {
    		return success;
            }
            success.push(callback);
            return update_track;
    	};

    	return update_track;
    };


    return _;
};


// A predefined track for genes
// tnt.track.data.gene = function () {
//     var track = tnt.track.data();
// 	// .index("ID");

//     var updater = tnt.track.retriever.ensembl()
// 	.endpoint("region")
//     // TODO: If success is defined here, means that it can't be user-defined
//     // is that good? enough? API?
//     // UPDATE: Now success is backed up by an array. Still don't know if this is the best option
// 	.success(function(genes) {
// 	    for (var i = 0; i < genes.length; i++) {
// 		if (genes[i].strand === -1) {  
// 		    genes[i].display_label = "<" + genes[i].external_name;
// 		} else {
// 		    genes[i].display_label = genes[i].external_name + ">";
// 		}
// 	    }
// 	});

//     return track.update(updater);
// }

// A predefined track displaying no external data
// it is used for location and axis tracks for example
data.empty = function () {
    var track = data();
    var updater = data.retriever.sync();
    track.update(updater);

    return track;
};

module.exports = exports = data;

},{"tnt.api":6,"tnt.ensembl":15}],11:[function(require,module,exports){
var apijs = require ("tnt.api");
var layout = require("./layout.js");

// FEATURE VIS
// var board = {};
// board.track = {};
var tnt_feature = function () {
    ////// Vars exposed in the API
    var exports = {
	create   : function () {throw "create_elem is not defined in the base feature object"},
	mover    : function () {throw "move_elem is not defined in the base feature object"},
	updater  : function () {},
	on_click : function () {},
	on_mouseover : function () {},
	guider   : function () {},
	index    : undefined,
	layout   : layout.identity(),
	foreground_color : '#000'
    };


    // The returned object
    var feature = {};

    var reset = function () {
    	var track = this;
    	track.g.selectAll(".tnt_elem").remove();
	track.g.selectAll(".tnt_guider").remove();
    };

    var init = function (width) {
	var track = this;
	exports.guider.call(track, width);
    };

    var plot = function (new_elems, track, xScale) {
	new_elems.on("click", exports.on_click);
	new_elems.on("mouseover", exports.on_mouseover);
	// new_elem is a g element where the feature is inserted
	exports.create.call(track, new_elems, xScale);
    };

    var update = function (xScale, field) {
	var track = this;
	var svg_g = track.g;
	var layout = exports.layout;

	var elements = track.data().elements();

	if (field !== undefined) {
	    elements = elements[field];
	}

	layout(elements, xScale);
	var data_elems = layout.elements();

	var vis_sel;
	var vis_elems;
	if (field !== undefined) {
	    vis_sel = svg_g.selectAll(".tnt_elem_" + field);
	} else {
	    vis_sel = svg_g.selectAll(".tnt_elem");
	}

	if (exports.index) { // Indexing by field
	    vis_elems = vis_sel
		.data(data_elems, function (d) {
		    if (d !== undefined) {
			return exports.index(d);
		    }
		})
	} else { // Indexing by position in array
	    vis_elems = vis_sel
		.data(data_elems)
	}

	exports.updater.call(track, vis_elems, xScale);

	var new_elem = vis_elems
	    .enter();

	new_elem
	    .append("g")
	    .attr("class", "tnt_elem")
	    .classed("tnt_elem_" + field, field)
	    .call(feature.plot, track, xScale);

	vis_elems
	    .exit()
	    .remove();
    };

    var move = function (xScale, field) {
	var track = this;
	var svg_g = track.g;
	var elems;
	// TODO: Is selecting the elements to move too slow?
	// It would be nice to profile
	if (field !== undefined) {
	    elems = svg_g.selectAll(".tnt_elem_" + field);
	} else {
	    elems = svg_g.selectAll(".tnt_elem");
	}

	exports.mover.call(this, elems, xScale);
    };

    var move_to_front = function (field) {
	if (field !== undefined) {
	    var track = this;
	    var svg_g = track.g;
	    svg_g.selectAll(".tnt_elem_" + field).move_to_front();
	}
    };

    // API
    apijs (feature)
	.getset (exports)
	.method ({
	    reset  : reset,
	    plot   : plot,
	    update : update,
	    move   : move,
	    init   : init,
	    move_to_front : move_to_front
	});

    return feature;
};

tnt_feature.composite = function () {
    var displays = {};
    var display_order = [];

    var features = {};

    var reset = function () {
	var track = this;
	for (var i=0; i<displays.length; i++) {
	    displays[i].reset.call(track);
	}
    };

    var init = function (width) {
	var track = this;
 	for (var display in displays) {
	    if (displays.hasOwnProperty(display)) {
		displays[display].init.call(track, width);
	    }
	}
    };

    var update = function (xScale) {
	var track = this;
	for (var i=0; i<display_order.length; i++) {
	    displays[display_order[i]].update.call(track, xScale, display_order[i]);
	    displays[display_order[i]].move_to_front.call(track, display_order[i]);
	}
	// for (var display in displays) {
	//     if (displays.hasOwnProperty(display)) {
	// 	displays[display].update.call(track, xScale, display);
	//     }
	// }
    };

    var move = function (xScale) {
	var track = this;
	for (var display in displays) {
	    if (displays.hasOwnProperty(display)) {
		displays[display].move.call(track, xScale, display);
	    }
	}
    };

    var add = function (key, display) {
	displays[key] = display;
	display_order.push(key);
	return features;
    };

    // API
    apijs (features)
	.method ({
	    reset  : reset,
	    update : update,
	    move   : move,
	    init   : init,
	    add    : add
	});


    return features;
};

tnt_feature.sequence = function () {
    // 'Inherit' from tnt.track.feature
    var feature = tnt_feature();

    var config = {
	fontsize : 10,
	sequence : function (d) {
	    return d.sequence
	}
    };

    var api = apijs (feature)
	.getset (config);


    feature.create (function (new_nts, xScale) {
	var track = this;

	new_nts
	    .append("text")
	    .attr("fill", track.background_color())
	    .style('font-size', config.fontsize + "px")
	    .attr("x", function (d) {
		return xScale (d.pos);
	    })
	    .attr("y", function (d) {
		return ~~(track.height() / 2) + 5; 
	    })
	    .text(config.sequence)
	    .transition()
	    .duration(500)
	    .attr('fill', feature.foreground_color());
    });

    feature.mover (function (nts, xScale) {
	nts.select ("text")
	    .attr("x", function (d) {
		return xScale(d.pos);
	    });
    });

    return feature;
};

tnt_feature.area = function () {
    var feature = tnt_feature.line();
    var line = tnt_feature.line();

    var area = d3.svg.area()
	.interpolate(line.interpolate())
	.tension(feature.tension());

    var data_points;

    var line_create = feature.create(); // We 'save' line creation
    feature.create (function (points, xScale) {
	var track = this;

	if (data_points !== undefined) {
//	     return;
	    track.g.select("path").remove();
	}

	line_create.call(track, points, xScale);

	area
	    .x(line.x())
	    .y1(line.y())
	    .y0(track.height());

	data_points = points.data();
	points.remove();

	track.g
	    .append("path")
	    .attr("class", "tnt_area")
	    .classed("tnt_elem", true)
	    .datum(data_points)
	    .attr("d", area)
	    .attr("fill", d3.rgb(feature.foreground_color()).brighter());
	
    });

    var line_mover = feature.mover();
    feature.mover (function (path, xScale) {
	var track = this;
	line_mover.call(track, path, xScale);

	area.x(line.x());
	track.g
	    .select(".tnt_area")
	    .datum(data_points)
	    .attr("d", area);
    });

    return feature;

};

tnt_feature.line = function () {
    var feature = tnt_feature();

    var x = function (d) {
	return d.pos;
    };
    var y = function (d) {
	return d.val;
    };
    var tension = 0.7;
    var yScale = d3.scale.linear();
    var line = d3.svg.line()
	.interpolate("basis");

    // line getter. TODO: Setter?
    feature.line = function () {
	return line;
    };

    feature.x = function (cbak) {
	if (!arguments.length) {
	    return x;
	}
	x = cbak;
	return feature;
    };

    feature.y = function (cbak) {
	if (!arguments.length) {
	    return y;
	}
	y = cbak;
	return feature;
    };

    feature.tension = function (t) {
	if (!arguments.length) {
	    return tension;
	}
	tension = t;
	return feature;
    };

    var data_points;

    // For now, create is a one-off event
    // TODO: Make it work with partial paths, ie. creating and displaying only the path that is being displayed
    feature.create (function (points, xScale) {
	var track = this;

	if (data_points !== undefined) {
	    // return;
	    track.g.select("path").remove();
	}

	line
	    .tension(tension)
	    .x(function (d) {return xScale(x(d))})
	    .y(function (d) {return track.height() - yScale(y(d))})

	data_points = points.data();
	points.remove();

	yScale
	    .domain([0, 1])
	    // .domain([0, d3.max(data_points, function (d) {
	    // 	return y(d);
	    // })])
	    .range([0, track.height() - 2]);
	
	track.g
	    .append("path")
	    .attr("class", "tnt_elem")
	    .attr("d", line(data_points))
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 4)
	    .style("fill", "none");

    });

    feature.mover (function (path, xScale) {
	var track = this;

	line.x(function (d) {
	    return xScale(x(d))
	});
	track.g.select("path")
	    .attr("d", line(data_points));
    });

    return feature;
};

tnt_feature.conservation = function () {
    // 'Inherit' from feature.area
    var feature = tnt_feature.area();

    var area_create = feature.create(); // We 'save' area creation
    feature.create  (function (points, xScale) {
	var track = this;

	area_create.call(track, d3.select(points[0][0]), xScale)
    });

    return feature;
};

tnt_feature.ensembl = function () {
    // 'Inherit' from board.track.feature
    var feature = tnt_feature();

    var foreground_color2 = "#7FFF00";
    var foreground_color3 = "#00BB00";

    feature.guider (function (width) {
	var track = this;
	var height_offset = ~~(track.height() - (track.height()  * .8)) / 2;

	track.g
	    .append("line")
	    .attr("class", "tnt_guider")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", height_offset)
	    .attr("y2", height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

	track.g
	    .append("line")
	    .attr("class", "tnt_guider")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", track.height() - height_offset)
	    .attr("y2", track.height() - height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

    });

    feature.create (function (new_elems, xScale) {
	var track = this;

	var height_offset = ~~(track.height() - (track.height()  * .8)) / 2;

	new_elems
	    .append("rect")
	    .attr("x", function (d) {
		return xScale (d.start);
	    })
	    .attr("y", height_offset)
// 	    .attr("rx", 3)
// 	    .attr("ry", 3)
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", track.height() - ~~(height_offset * 2))
	    .attr("fill", track.background_color())
	    .transition()
	    .duration(500)
	    .attr("fill", function (d) { 
		if (d.type === 'high') {
		    return d3.rgb(feature.foreground_color());
		}
		if (d.type === 'low') {
		    return d3.rgb(feature.foreground_color2());
		}
		return d3.rgb(feature.foreground_color3());
	    });
    });

    feature.updater (function (blocks, xScale) {
	blocks
	    .select("rect")
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start))
	    });
    });

    feature.mover (function (blocks, xScale) {
	blocks
	    .select("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    });

    feature.foreground_color2 = function (col) {
	if (!arguments.length) {
	    return foreground_color2;
	}
	foreground_color2 = col;
	return feature;
    };

    feature.foreground_color3 = function (col) {
	if (!arguments.length) {
	    return foreground_color3;
	}
	foreground_color3 = col;
	return feature;
    };

    return feature;
};

tnt_feature.vline = function () {
    // 'Inherit' from feature
    var feature = tnt_feature();

    feature.create (function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append ("line")
	    .attr("x1", function (d) {
		// TODO: Should use the index value?
		return xScale(feature.index()(d))
	    })
	    .attr("x2", function (d) {
		return xScale(feature.index()(d))
	    })
	    .attr("y1", 0)
	    .attr("y2", track.height())
	    .attr("stroke", feature.foreground_color())
	    .attr("stroke-width", 1);
    });

    feature.mover (function (vlines, xScale) {
	vlines
	    .select("line")
	    .attr("x1", function (d) {
		return xScale(feature.index()(d));
	    })
	    .attr("x2", function (d) {
		return xScale(feature.index()(d));
	    });
    });

    return feature;

};

tnt_feature.block = function () {
    // 'Inherit' from board.track.feature
    var feature = tnt_feature();

    apijs(feature)
	.getset('from', function (d) {
	    return d.start;
	})
	.getset('to', function (d) {
	    return d.end;
	});

    feature.create(function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append("rect")
	    .attr("x", function (d, i) {
		// TODO: start, end should be adjustable via the tracks API
		return xScale(feature.from()(d, i));
	    })
	    .attr("y", 0)
	    .attr("width", function (d, i) {
		return (xScale(feature.to()(d, i)) - xScale(feature.from()(d, i)));
	    })
	    .attr("height", track.height())
	    .attr("fill", track.background_color())
	    .transition()
	    .duration(500)
	    .attr("fill", function (d) {
		if (d.color === undefined) {
		    return feature.foreground_color();
		} else {
		    return d.color;
		}
	    });
    });

    feature.updater(function (elems, xScale) {
	elems
	    .select("rect")
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    });

    feature.mover(function (blocks, xScale) {
	blocks
	    .select("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    });

    return feature;

};

tnt_feature.axis = function () {
    var xAxis;
    var orientation = "top";

    // Axis doesn't inherit from feature
    var feature = {};
    feature.reset = function () {
	xAxis = undefined;
	var track = this;
	track.g.selectAll("rect").remove();
	track.g.selectAll(".tick").remove();
    };
    feature.plot = function () {};
    feature.move = function () {
	var track = this;
	var svg_g = track.g;
	svg_g.call(xAxis);
    }
    
    feature.init = function () {};

    feature.update = function (xScale) {
	// Create Axis if it doesn't exist
	if (xAxis === undefined) {
	    xAxis = d3.svg.axis()
		.scale(xScale)
		.orient(orientation);
	}

	var track = this;
	var svg_g = track.g;
	svg_g.call(xAxis);
    };

    feature.orientation = function (pos) {
	if (!arguments.length) {
	    return orientation;
	}
	orientation = pos;
	return feature;
    };

    return feature;
};

tnt_feature.location = function () {
    var row;

    var feature = {};
    feature.reset = function () {};
    feature.plot = function () {};
    feature.init = function () {};
    feature.move = function(xScale) {
	var domain = xScale.domain();
	row.select("text")
	    .text("Location: " + ~~domain[0] + "-" + ~~domain[1]);
    };

    feature.update = function (xScale) {
	var track = this;
	var svg_g = track.g;
	var domain = xScale.domain();
	if (row === undefined) {
	    row = svg_g;
	    row
		.append("text")
		.text("Location: " + ~~domain[0] + "-" + ~~domain[1]);
	}
    };

    return feature;
};

module.exports = exports = tnt_feature;

},{"./layout.js":13,"tnt.api":6}],12:[function(require,module,exports){
var board = require ("./board.js");
board.track = require ("./track");
board.track.data = require ("./data.js");
board.track.layout = require ("./layout.js");
board.track.feature = require ("./feature.js");

module.exports = exports = board;

},{"./board.js":9,"./data.js":10,"./feature.js":11,"./layout.js":13,"./track":14}],13:[function(require,module,exports){
var apijs = require ("tnt.api");

// var board = {};
// board.track = {};
layout = {};

layout.identity = function () {
    // vars exposed in the API:
    var elements;

    // The returned closure / object
    var l = function (new_elements) {
	elements = new_elements;
    }

    var api = apijs (l)
	.method ({
	    height   : function () {},
	    elements : function () {
		return elements;
	    }
	});

    return l;
};

module.exports = exports = layout;

},{"tnt.api":6}],14:[function(require,module,exports){
var apijs = require ("tnt.api");
var iterator = require("tnt.utils").iterator;

//var board = {};

var track = function () {
    "use strict";

    var read_conf = {
	// Unique ID for this track
	id : track.id()
    };

    var display;

    var conf = {
	// foreground_color : d3.rgb('#000000'),
	background_color : d3.rgb('#CCCCCC'),
	height           : 250,
	// data is the object (normally a tnt.track.data object) used to retrieve and update data for the track
	data             : track.data.empty()
    };

    // The returned object / closure
    var _ = function() {
    };

    // API
    var api = apijs (_)
	.getset (conf)
	.get (read_conf);

    // TODO: This means that height should be defined before display
    // we shouldn't rely on this
    _.display = function (new_plotter) {
	if (!arguments.length) {
	    return display;
	}
	display = new_plotter;
	if (typeof (display) === 'function') {
	    display.layout && display.layout().height(conf.height);	    
	} else {
	    for (var key in display) {
		if (display.hasOwnProperty(key)) {
		    display[key].layout && display[key].layout().height(conf.height);
		}
	    }
	}

	return _;
    };

    return _;

};

track.id = iterator(1);

module.exports = exports = track;

},{"tnt.api":6,"tnt.utils":45}],15:[function(require,module,exports){
module.exports = tnt_ensembl = require("./src/rest.js");

},{"./src/rest.js":25}],16:[function(require,module,exports){
'use strict';

var Response = require('./response');

function RequestError(message, props) {
    var err = new Error(message);
    err.name = 'RequestError';
    this.name = err.name;
    this.message = err.message;
    if (err.stack) {
        this.stack = err.stack;
    }

    this.toString = function () {
        return this.message;
    };

    for (var k in props) {
        if (props.hasOwnProperty(k)) {
            this[k] = props[k];
        }
    }
}

RequestError.prototype = Error.prototype;

RequestError.create = function (message, req, props) {
    var err = new RequestError(message, props);
    Response.call(err, req);
    return err;
};

module.exports = RequestError;

},{"./response":19}],17:[function(require,module,exports){
'use strict';

var i,
    cleanURL = require('../plugins/cleanurl'),
    XHR = require('./xhr'),
    delay = require('./utils/delay'),
    createError = require('./error').create,
    Response = require('./response'),
    Request = require('./request'),
    extend = require('xtend'),
    once = require('./utils/once');

function factory(defaults, plugins) {
    defaults = defaults || {};
    plugins = plugins || [];

    function http(req, cb) {
        var xhr, plugin, done, k, timeoutId;

        req = new Request(extend(defaults, req));

        for (i = 0; i < plugins.length; i++) {
            plugin = plugins[i];
            if (plugin.processRequest) {
                plugin.processRequest(req);
            }
        }

        // Give the plugins a chance to create the XHR object
        for (i = 0; i < plugins.length; i++) {
            plugin = plugins[i];
            if (plugin.createXHR) {
                xhr = plugin.createXHR(req);
                break; // First come, first serve
            }
        }
        xhr = xhr || new XHR();

        req.xhr = xhr;

        // Because XHR can be an XMLHttpRequest or an XDomainRequest, we add
        // `onreadystatechange`, `onload`, and `onerror` callbacks. We use the
        // `once` util to make sure that only one is called (and it's only called
        // one time).
        done = once(delay(function (err) {
            clearTimeout(timeoutId);
            xhr.onload = xhr.onerror = xhr.onreadystatechange = xhr.ontimeout = xhr.onprogress = null;
            var res = err && err.isHttpError ? err : new Response(req);
            for (i = 0; i < plugins.length; i++) {
                plugin = plugins[i];
                if (plugin.processResponse) {
                    plugin.processResponse(res);
                }
            }
            if (err) {
                if (req.onerror) {
                    req.onerror(err);
                }
            } else {
                if (req.onload) {
                    req.onload(res);
                }
            }
            if (cb) {
                cb(err, res);
            }
        }));

        // When the request completes, continue.
        xhr.onreadystatechange = function () {
            if (req.timedOut) return;

            if (req.aborted) {
                done(createError('Request aborted', req, {name: 'Abort'}));
            } else if (xhr.readyState === 4) {
                var type = Math.floor(xhr.status / 100);
                if (type === 2) {
                    done();
                } else if (xhr.status === 404 && !req.errorOn404) {
                    done();
                } else {
                    var kind;
                    switch (type) {
                        case 4:
                            kind = 'Client';
                            break;
                        case 5:
                            kind = 'Server';
                            break;
                        default:
                            kind = 'HTTP';
                    }
                    var msg = kind + ' Error: ' +
                              'The server returned a status of ' + xhr.status +
                              ' for the request "' +
                              req.method.toUpperCase() + ' ' + req.url + '"';
                    done(createError(msg, req));
                }
            }
        };

        // `onload` is only called on success and, in IE, will be called without
        // `xhr.status` having been set, so we don't check it.
        xhr.onload = function () { done(); };

        xhr.onerror = function () {
            done(createError('Internal XHR Error', req));
        };

        // IE sometimes fails if you don't specify every handler.
        // See http://social.msdn.microsoft.com/Forums/ie/en-US/30ef3add-767c-4436-b8a9-f1ca19b4812e/ie9-rtm-xdomainrequest-issued-requests-may-abort-if-all-event-handlers-not-specified?forum=iewebdevelopment
        xhr.ontimeout = function () { /* noop */ };
        xhr.onprogress = function () { /* noop */ };

        xhr.open(req.method, req.url);

        if (req.timeout) {
            // If we use the normal XHR timeout mechanism (`xhr.timeout` and
            // `xhr.ontimeout`), `onreadystatechange` will be triggered before
            // `ontimeout`. There's no way to recognize that it was triggered by
            // a timeout, and we'd be unable to dispatch the right error.
            timeoutId = setTimeout(function () {
                req.timedOut = true;
                done(createError('Request timeout', req, {name: 'Timeout'}));
                try {
                    xhr.abort();
                } catch (err) {}
            }, req.timeout);
        }

        for (k in req.headers) {
            if (req.headers.hasOwnProperty(k)) {
                xhr.setRequestHeader(k, req.headers[k]);
            }
        }

        xhr.send(req.body);

        return req;
    }

    var method,
        methods = ['get', 'post', 'put', 'head', 'patch', 'delete'],
        verb = function (method) {
            return function (req, cb) {
                req = new Request(req);
                req.method = method;
                return http(req, cb);
            };
        };
    for (i = 0; i < methods.length; i++) {
        method = methods[i];
        http[method] = verb(method);
    }

    http.plugins = function () {
        return plugins;
    };

    http.defaults = function (newValues) {
        if (newValues) {
            return factory(extend(defaults, newValues), plugins);
        }
        return defaults;
    };

    http.use = function () {
        var newPlugins = Array.prototype.slice.call(arguments, 0);
        return factory(defaults, plugins.concat(newPlugins));
    };

    http.bare = function () {
        return factory();
    };

    http.Request = Request;
    http.Response = Response;

    return http;
}

module.exports = factory({}, [cleanURL]);

},{"../plugins/cleanurl":24,"./error":16,"./request":18,"./response":19,"./utils/delay":20,"./utils/once":21,"./xhr":22,"xtend":23}],18:[function(require,module,exports){
'use strict';

function Request(optsOrUrl) {
    var opts = typeof optsOrUrl === 'string' ? {url: optsOrUrl} : optsOrUrl || {};
    this.method = opts.method ? opts.method.toUpperCase() : 'GET';
    this.url = opts.url;
    this.headers = opts.headers || {};
    this.body = opts.body;
    this.timeout = opts.timeout || 0;
    this.errorOn404 = opts.errorOn404 != null ? opts.errorOn404 : true;
    this.onload = opts.onload;
    this.onerror = opts.onerror;
}

Request.prototype.abort = function () {
    if (this.aborted) return;
    this.aborted = true;
    this.xhr.abort();
    return this;
};

Request.prototype.header = function (name, value) {
    var k;
    for (k in this.headers) {
        if (this.headers.hasOwnProperty(k)) {
            if (name.toLowerCase() === k.toLowerCase()) {
                if (arguments.length === 1) {
                    return this.headers[k];
                }

                delete this.headers[k];
                break;
            }
        }
    }
    if (value != null) {
        this.headers[name] = value;
        return value;
    }
};


module.exports = Request;

},{}],19:[function(require,module,exports){
'use strict';

var Request = require('./request');


function Response(req) {
    var i, lines, m,
        xhr = req.xhr;
    this.request = req;
    this.xhr = xhr;
    this.headers = {};

    // Browsers don't like you trying to read XHR properties when you abort the
    // request, so we don't.
    if (req.aborted || req.timedOut) return;

    this.status = xhr.status || 0;
    this.text = xhr.responseText;
    this.body = xhr.response || xhr.responseText;
    this.contentType = xhr.contentType || (xhr.getResponseHeader && xhr.getResponseHeader('Content-Type'));

    if (xhr.getAllResponseHeaders) {
        lines = xhr.getAllResponseHeaders().split('\n');
        for (i = 0; i < lines.length; i++) {
            if ((m = lines[i].match(/\s*([^\s]+):\s+([^\s]+)/))) {
                this.headers[m[1]] = m[2];
            }
        }
    }

    this.isHttpError = this.status >= 400;
}

Response.prototype.header = Request.prototype.header;


module.exports = Response;

},{"./request":18}],20:[function(require,module,exports){
'use strict';

// Wrap a function in a `setTimeout` call. This is used to guarantee async
// behavior, which can avoid unexpected errors.

module.exports = function (fn) {
    return function () {
        var
            args = Array.prototype.slice.call(arguments, 0),
            newFunc = function () {
                return fn.apply(null, args);
            };
        setTimeout(newFunc, 0);
    };
};

},{}],21:[function(require,module,exports){
'use strict';

// A "once" utility.
module.exports = function (fn) {
    var result, called = false;
    return function () {
        if (!called) {
            called = true;
            result = fn.apply(this, arguments);
        }
        return result;
    };
};

},{}],22:[function(require,module,exports){
module.exports = window.XMLHttpRequest;

},{}],23:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],24:[function(require,module,exports){
'use strict';

module.exports = {
    processRequest: function (req) {
        req.url = req.url.replace(/[^%]+/g, function (s) {
            return encodeURI(s);
        });
    }
};

},{}],25:[function(require,module,exports){
var http = require("httpplease");
var apijs = require("tnt.api");

tnt_eRest = function() {

    // Prefixes to use the REST API.
    // These are modified in the localREST setter
    var prefix = "http://rest.ensembl.org";
    var prefix_region = prefix + "/overlap/region/";
    var prefix_ensgene = prefix + "/lookup/id/";
    var prefix_xref = prefix + "/xrefs/symbol/";
    var prefix_homologues = prefix + "/homology/id/";
    var prefix_chr_info = prefix + "/info/assembly/";
    var prefix_aln_region = prefix + "/alignment/region/";
    var prefix_gene_tree = prefix + "/genetree/id/";
    var prefix_assembly = prefix + "/info/assembly/";

    // Number of connections made to the database
    var connections = 0;

    var eRest = function() {
    };

    // Limits imposed by the ensembl REST API
    eRest.limits = {
	region : 5000000
    };

    var api = apijs (eRest);


    /** <strong>localREST</strong> points the queries to a local REST service to debug.
	TODO: This method should be removed in "production"
    */
    api.method ('localREST', function() {
	prefix = "http://127.0.0.1:3000";
	prefix_region = prefix + "/overlap/region/";
	prefix_ensgene = prefix + "/lookup/id/";
	prefix_xref = prefix + "/xrefs/symbol/";
	prefix_homologues = prefix + "/homology/id/";

	return eRest;
    });

    /** <strong>call</strong> makes an asynchronous call to the ensembl REST service.
	@param {Object} object - A literal object containing the following fields:
	<ul>
	<li>url => The rest URL. This is returned by {@link eRest.url}</li>
	<li>success => A callback to be called when the REST query is successful (i.e. the response from the server is a defined value and no error has been returned)</li>
	<li>error => A callback to be called when the REST query returns an error
	</ul>
    */
    api.method ('call', function (obj) {
	var url = obj.url;
	var on_success = obj.success;
	var on_error   = obj.error;
	connections++;
	http.get({
	    "url" : url
	}, function (error, resp) {
	    if (resp !== undefined && error == null && on_success !== undefined) {
		on_success(JSON.parse(resp.body));
	    }
	    if (error !== null && on_error !== undefined) {
		on_error(error);
	    }
	});
	// d3.json (url, function (error, resp) {
	//     connections--;
	//     if (resp !== undefined && error === null && on_success !== undefined) {
	// 	on_success(resp);
	//     }
	//     if (error !== null && on_error !== undefined) {
	// 	on_error(error);
	//     }
	// });
    });


    eRest.url = {};
    var url_api = apijs (eRest.url);
	/** eRest.url.<strong>region</strong> returns the ensembl REST url to retrieve the genes included in the specified region
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>species : The species the region refers to</li>
<li>chr     : The chr (or seq_region name)</li>
<li>from    : The start position of the region in the chr</li>
<li>to      : The end position of the region (from < to always)</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/feature/region/homo_sapiens/13:32889611-32973805.json?feature=gene|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.region ({ species : "homo_sapiens", chr : "13", from : 32889611, to : 32973805 }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('region', function(obj) {
	return prefix_region +
	    obj.species +
	    "/" +
	    obj.chr +
	    ":" + 
	    obj.from + 
	    "-" + obj.to + 
	    ".json?feature=gene";
    });

	/** eRest.url.<strong>species_gene</strong> returns the ensembl REST url to retrieve the ensembl gene associated with
	    the given name in the specified species.
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>species   : The species the region refers to</li>
<li>gene_name : The name of the gene</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/xrefs/symbol/human/BRCA2.json?object_type=gene|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.species_gene ({ species : "human", gene_name : "BRCA2" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('xref', function (obj) {
	return prefix_xref +
	    obj.species  +
	    "/" +
	    obj.name +
	    ".json?object_type=gene";
    });

	/** eRest.url.<strong>homologues</strong> returns the ensembl REST url to retrieve the homologues (orthologues + paralogues) of the given ensembl ID.
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>id : The Ensembl ID of the gene</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/homology/id/ENSG00000139618.json?format=condensed;sequence=none;type=all|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.homologues ({ id : "ENSG00000139618" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('homologues', function(obj) {
	return prefix_homologues +
	    obj.id + 
	    ".json?format=condensed;sequence=none;type=all";
    });

	/** eRest.url.<strong>gene</strong> returns the ensembl REST url to retrieve the ensembl gene associated with
	    the given ID
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>id : The name of the gene</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/lookup/ENSG00000139618.json?format=full|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.gene ({ id : "ENSG00000139618" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('gene', function(obj) {
	return prefix_ensgene +
	    obj.id +
	    ".json?format=full";
    });

	/** eRest.url.<strong>chr_info</strong> returns the ensembl REST url to retrieve the information associated with the chromosome (seq_region in Ensembl nomenclature).
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>species : The species the chr (or seq_region) belongs to
<li>chr     : The name of the chr (or seq_region)</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/assembly/info/homo_sapiens/13.json?format=full|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.chr_info ({ species : "homo_sapiens", chr : "13" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('chr_info', function(obj) {
	return prefix_chr_info +
	    obj.species +
	    "/" +
	    obj.chr +
	    ".json?format=full";
    });

	// TODO: For now, it only works with species_set and not species_set_groups
	// Should be extended for wider use
    url_api.method ('aln_block', function (obj) {
	var url = prefix_aln_region + 
	    obj.species +
	    "/" +
	    obj.chr +
	    ":" +
	    obj.from +
	    "-" +
	    obj.to +
	    ".json?method=" +
	    obj.method;

	for (var i=0; i<obj.species_set.length; i++) {
	    url += "&species_set=" + obj.species_set[i];
	}

	return url;
    });

    url_api.method ('gene_tree', function (obj) {
	return prefix_gene_tree +
	    obj.id + 
	    ".json?sequence=" +
	    ((obj.sequence || obj.aligned) ? 1 : "none") +
	    (obj.aligned ? '&aligned=1' : '');
    });

    url_api.method('assembly', function (obj) {
	return prefix_assembly + 
	    obj.species +
	    ".json";
    });


    api.method ('connections', function() {
	return connections;
    });

    return eRest;
};

module.exports = exports = tnt_eRest;

},{"httpplease":17,"tnt.api":6}],26:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
module.exports = require("./src/index.js");


},{"./src/index.js":30}],27:[function(require,module,exports){
var board = require("tnt.board");
var apijs = require("tnt.api");
var ensemblRestAPI = require("tnt.ensembl");

// A predefined track for genes
var data_gene = function () {
//board.track.data.gene = function () {

    var track = board.track.data();
    // .index("ID");

    var updater = board.track.data.retriever.ensembl()
        .endpoint("region")
    // TODO: If success is defined here, means that it can't be user-defined
    // is that good? enough? API?
    // UPDATE: Now success is backed up by an array. Still don't know if this is the best option
        .success(function(genes) {
	    for (var i = 0; i < genes.length; i++) {
		if (genes[i].strand === -1) {
		    genes[i].display_label = "<" + genes[i].external_name;
		} else {
		    genes[i].display_label = genes[i].external_name + ">";
		}
	    }
	});

    return track.update(updater);
}

module.exports = exports = data_gene;

},{"tnt.api":6,"tnt.board":8,"tnt.ensembl":15}],28:[function(require,module,exports){
var apijs = require ("tnt.api");
var layout = require("./layout.js");
var board = require("tnt.board");

tnt_feature_gene = function () {

    // 'Inherit' from tnt.track.feature
    var feature = board.track.feature()
	.layout(board.track.layout.feature())
	.index(function (d) {
	    return d.id;
	});

    // var tooltip = function () {
    //     var tooltip = board.tooltip.table();
    //     var gene_tooltip = function(gene) {
    //         var obj = {};
    //         obj.header = {
    //             label : "HGNC Symbol",
    //             value : gene.external_name
    //         };
    //         obj.rows = [];
    //         obj.rows.push( {
    //             label : "Name",
    //             value : "<a href=''>" + gene.ID  + "</a>"
    //         });
    //         obj.rows.push( {
    //             label : "Gene Type",
    //             value : gene.biotype
    //         });
    //         obj.rows.push( {
    //             label : "Location",
    //             value : "<a href=''>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end  + "</a>"
    //         });
    //         obj.rows.push( {
    //             label : "Strand",
    //             value : (gene.strand === 1 ? "Forward" : "Reverse")
    //         });
    //         obj.rows.push( {
    //             label : "Description",
    //             value : gene.description
    //         });

    //         tooltip.call(this, obj);
    //     };

    //     return gene_tooltip;
    // };


    feature.create(function (new_elems, xScale) {
	var track = this;

	new_elems
	    .append("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("y", function (d) {
		return feature.layout().gene_slot().slot_height * d.slot;
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", feature.layout().gene_slot().gene_height)
	    .attr("fill", track.background_color())
	    .transition()
	    .duration(500)
	    .attr("fill", function (d) {
		if (d.color === undefined) {
		    return feature.foreground_color();
		} else {
		    return d.color
		}
	    });

	new_elems
	    .append("text")
	    .attr("class", "tnt_name")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .attr("fill", track.background_color())
	    .text(function (d) {
		if (feature.layout().gene_slot().show_label) {
		    return d.display_label
		} else {
		    return ""
		}
	    })
	    .style("font-weight", "normal")
	    .transition()
	    .duration(500)
	    .attr("fill", function() {
		return feature.foreground_color();
	    });	    
    });

    feature.updater(function (genes) {
	var track = this;
	genes
	    .select("rect")
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot);
	    })
	    .attr("height", feature.layout().gene_slot().gene_height);

	genes
	    .select("text")
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .text(function (d) {
                if (feature.layout().gene_slot().show_label) {
		    return d.display_label;
                } else {
		    return "";
                }
	    });
    });

    feature.mover(function (genes, xScale) {
	genes.select("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });

	genes.select("text")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
    });

    // apijs (feature)
    // 	.method ({
    // 	    tooltip : tooltip
    // 	});


    return feature;
};

module.exports = exports = tnt_feature_gene;

},{"./layout.js":31,"tnt.api":6,"tnt.board":8}],29:[function(require,module,exports){
var tnt_rest = require("tnt.ensembl");
var apijs = require("tnt.api");
var tnt_board = require("tnt.board");
tnt_board.track.layout.gene = require("./layout.js");
tnt_board.track.feature.gene = require("./feature.js");

tnt_board_genome = function() {
    "use strict"

    // Private vars
    var ens_re = /^ENS\w+\d+$/;
    var eRest = tnt_rest();
    var chr_length;
    
    // Vars exposed in the API
    var conf = {
	gene           : undefined,
	xref_search    : function () {},
	ensgene_search : function () {},
	context        : 0
    };

    var gene;
    var limits = {
        left : 0,
	right : undefined,
	zoom_out : eRest.limits.region,
	zoom_in  : 200
    };


    // We "inherit" from board
    var genome_browser = tnt_board();

    // The location and axis track
    var location_track = tnt_board.track()
	.height(20)
	.background_color("white")
	.data(tnt_board.track.data.empty())
	.display(tnt_board.track.feature.location());

    var axis_track = tnt_board.track()
	.height(20)
	.background_color("white")
	.data(tnt_board.track.data.empty())
	.display(tnt_board.track.feature.axis());

    genome_browser
	.add_track(location_track)
	.add_track(axis_track);

    // Default location:
    genome_browser
	.species("human")
	.chr(7)
	.from(139424940)
	.to(141784100);

    // We save the start method of the 'parent' object
    genome_browser._start = genome_browser.start;

    // We hijack parent's start method
    var start = function (where) {
	if (where !== undefined) {
	    if (where.gene !== undefined) {
		get_gene(where);
		return;
	    } else {
		if (where.species === undefined) {
		    where.species = genome_browser.species();
		} else {
		    genome_browser.species(where.species);
		}
		if (where.chr === undefined) {
		    where.chr = genome_browser.chr();
		} else {
		    genome_browser.chr(where.chr);
		}
		if (where.from === undefined) {
		    where.from = genome_browser.from();
		} else {
		    genome_browser.from(where.from)
		}
		if (where.to === undefined) {
		    where.to = genome_browser.to();
		} else {
		    genome_browser.to(where.to);
		}
	    }
	} else { // "where" is undef so look for gene or loc
	    if (genome_browser.gene() !== undefined) {
		get_gene({ species : genome_browser.species(),
			   gene    : genome_browser.gene()
			 });
		return;
	    } else {
		where = {};
		where.species = genome_browser.species(),
		where.chr     = genome_browser.chr(),
		where.from    = genome_browser.from(),
		where.to      = genome_browser.to()
	    }
	}

	genome_browser.right (function (done) {
	    // Get the chromosome length and use it as the 'right' limit

	    genome_browser.zoom_in (limits.zoom_in);
	    genome_browser.zoom_out (limits.zoom_out);

	    eRest.call({url : eRest.url.chr_info ({species : where.species,
						   chr     : where.chr
						  }),
			success : function (resp) {
			    done(resp.length);
			}
		       });
	});
	genome_browser._start();
    };

     var homologues = function (ensGene, callback)  {
	eRest.call({url : eRest.url.homologues ({id : ensGene}),
		    success : function(resp) {
			var homologues = resp.data[0].homologies;
			if (callback !== undefined) {
			    var homologues_obj = split_homologues(homologues)
			    callback(homologues_obj);
			}
		    }
		   });
    }

    var isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
            return true;
        } else {
            return false;
        }
    };

    var get_gene = function (where) {
	if (isEnsemblGene(where.gene)) {
	    get_ensGene(where.gene)
	} else {
	    eRest.call({url : eRest.url.xref ({ species : where.species,
						name    : where.gene 
					      }
					     ),
			success : function(resp) {
			    resp = resp.filter(function(d) {
				return !d.id.indexOf("ENS");
			    });
			    if (resp[0] !== undefined) {
				conf.xref_search(resp);
				get_ensGene(resp[0].id)
			    } else {
				genome_browser.start();
			    }
			}
		       }
		      );
	}
    };

    var get_ensGene = function (id) {
	eRest.call({url     : eRest.url.gene ({id : id}),
		    success : function(resp) {
			conf.ensgene_search(resp);

			var extra = ~~((resp.end - resp.start) * (conf.context/100));
			genome_browser
			    .species(resp.species)
			    .chr(resp.seq_region_name)
			    .from(resp.start - extra)
			    .to(resp.end + extra);

			genome_browser.start( { species : resp.species,
					  chr     : resp.seq_region_name,
					  from    : resp.start - extra,
					  to      : resp.end + extra
					} );
		    }
		   });
    };

    var split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };

    var api = apijs(genome_browser)
	.getset (conf);

    api.method ({
	start      : start,
	homologues : homologues
    });

    return genome_browser;
};

module.exports = exports = tnt_board_genome;

},{"./feature.js":28,"./layout.js":31,"tnt.api":6,"tnt.board":8,"tnt.ensembl":15}],30:[function(require,module,exports){
var board = require("tnt.board");
board.genome = require("./genome");
board.track.layout.feature = require("./layout");
board.track.feature.gene = require("./feature");
board.track.data.gene = require("./data");

module.exports = exports = board;

},{"./data":27,"./feature":28,"./genome":29,"./layout":31,"tnt.board":8}],31:[function(require,module,exports){
var apijs = require ("tnt.api");

// The overlap detector used for genes
var gene_layout = function() {
    // Private vars
    var max_slots;

    // vars exposed in the API:
    var conf = {
	height   : 150,
	scale    : undefined
    };

    var conf_ro = {
	elements : []
    };

    var slot_types = {
	'expanded'   : {
	    slot_height : 30,
	    gene_height : 10,
	    show_label  : true
	},
	'collapsed' : {
	    slot_height : 10,
	    gene_height : 7,
	    show_label  : false
	}
    };
    var current_slot_type = 'expanded';

    // The returned closure / object
    var genes_layout = function (new_genes, scale) {

	// We make sure that the genes have name
	for (var i = 0; i < new_genes.length; i++) {
	    if (new_genes[i].external_name === null) {
		new_genes[i].external_name = "";
	    }
	}

	max_slots = ~~(conf.height / slot_types.expanded.slot_height) - 1;

	if (scale !== undefined) {
	    genes_layout.scale(scale);
	}

	slot_keeper(new_genes, conf_ro.elements);
	var needed_slots = collition_detector(new_genes);
	if (needed_slots > max_slots) {
	    current_slot_type = 'collapsed';
	} else {
	    current_slot_type = 'expanded';
	}

	conf_ro.elements = new_genes;
    };

    var gene_slot = function () {
	return slot_types[current_slot_type];
    };

    var collition_detector = function (genes) {
	var genes_placed = [];
	var genes_to_place = genes;
	var needed_slots = 0;
	for (var i = 0; i < genes.length; i++) {
            if (genes[i].slot > needed_slots && genes[i].slot < max_slots) {
		needed_slots = genes[i].slot
            }
	}

	for (var i = 0; i < genes_to_place.length; i++) {
            var genes_by_slot = sort_genes_by_slot(genes_placed);
	    var this_gene = genes_to_place[i];
	    if (this_gene.slot !== undefined && this_gene.slot < max_slots) {
		if (slot_has_space(this_gene, genes_by_slot[this_gene.slot])) {
		    genes_placed.push(this_gene);
		    continue;
		}
	    }
            var slot = 0;
            OUTER: while (true) {
		if (slot_has_space(this_gene, genes_by_slot[slot])) {
		    this_gene.slot = slot;
		    genes_placed.push(this_gene);
		    if (slot > needed_slots) {
			needed_slots = slot;
		    }
		    break;
		}
		slot++;
	    }
	}
	return needed_slots + 1;
    };

    var slot_has_space = function (query_gene, genes_in_this_slot) {
	if (genes_in_this_slot === undefined) {
	    return true;
	}
	for (var j = 0; j < genes_in_this_slot.length; j++) {
            var subj_gene = genes_in_this_slot[j];
	    if (query_gene.id === subj_gene.id) {
		continue;
	    }
            var y_label_end = subj_gene.display_label.length * 8 + conf.scale(subj_gene.start); // TODO: It may be better to have a fixed font size (instead of the hardcoded 16)?
            var y1  = conf.scale(subj_gene.start);
            var y2  = conf.scale(subj_gene.end) > y_label_end ? conf.scale(subj_gene.end) : y_label_end;
	    var x_label_end = query_gene.display_label.length * 8 + conf.scale(query_gene.start);
            var x1 = conf.scale(query_gene.start);
            var x2 = conf.scale(query_gene.end) > x_label_end ? conf.scale(query_gene.end) : x_label_end;
            if ( ((x1 < y1) && (x2 > y1)) ||
		 ((x1 > y1) && (x1 < y2)) ) {
		return false;
            }
	}
	return true;
    };

    var slot_keeper = function (genes, prev_genes) {
	var prev_genes_slots = genes2slots(prev_genes);

	for (var i = 0; i < genes.length; i++) {
            if (prev_genes_slots[genes[i].id] !== undefined) {
		genes[i].slot = prev_genes_slots[genes[i].id];
            }
	}
    };

    var genes2slots = function (genes_array) {
	var hash = {};
	for (var i = 0; i < genes_array.length; i++) {
            var gene = genes_array[i];
            hash[gene.id] = gene.slot;
	}
	return hash;
    }

    var sort_genes_by_slot = function (genes) {
	var slots = [];
	for (var i = 0; i < genes.length; i++) {
            if (slots[genes[i].slot] === undefined) {
		slots[genes[i].slot] = [];
            }
            slots[genes[i].slot].push(genes[i]);
	}
	return slots;
    };

    // API
    var api = apijs (genes_layout)
	.getset (conf)
	.get (conf_ro)
	.method ({
	    gene_slot : gene_slot
	});

    return genes_layout;
};

module.exports = exports = gene_layout;

},{"tnt.api":6}],32:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {};
// }
// tnt.legend = require("./src/legend.js");

module.exports = tnt_legend = require("./src/legend.js");

},{"./src/legend.js":33}],33:[function(require,module,exports){
var apijs = require ("tnt.api");
var board = require ("tnt.board");
var iterator = require("tnt.utils").iterator;

var tnt_legend = function (div) {

    d3.select(div)
	.attr("class", "tnt_framed");

    var opts = {
	row_height : 20,
	width      : 140,
	fontsize   : 12
    };

    var id = iterator(1);
    var legend_cols = [];

    var _ = function () {
	for (var i=0; i<legend_cols.length; i++) {
	    var col = legend_cols[i];
	    col.board(col.div);
	    col.board.start();
	}
    };

    var api = apijs (_)
	.getset(opts);

    api.method ('add_column', function () {
	var div_id = d3.select(div)
	    .style("display", "table")
	    .attr("id");

	var new_div = d3.select(div)
	    .append("div")
	    .attr("id", div_id + "_" + id())
	    .style("display", "table-cell");

	var new_board = board()
	    .right(2)
	    .from (1)
	    .to (2)
	    .allow_drag (false)
	    .show_frame (false)
	    .width (opts.width);

	new_board.add_row = new_board.add_track;

	legend_cols.push ({
	    'div' : new_div.node(),
	    'board' : new_board
	});

	return new_board;
    });

    api.method ('header', function (text) {
	var feature = board.track.feature();

	feature.create (function (g, xScale) {
	    var track = this;
	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", xScale(1))
		.attr("y", ~~track.height()/2)
		.attr("font-weight", "bold")
		.text(track.text());
	});

	var track = legend_track()
	    .display (feature);

	return track;
    });

    api.method ('text', function () {
	var track = legend_track()
	    .deploy (function () {
		var g = this;
		d3.select(g)
		    .append("text")
		    .attr("x", 0)
		    .attr("y", ~~(track.height() / 2) + 4)
		    .attr("fill", track.color())
		    .attr("font-size", track.fontsize())
		    .text(track.feature_text());
	    });

	apijs (track)
	    .getset ('feature_text', '');
	
	return track;
    });

    api.method ('hline', function () {
	var track = legend_track()
	    .deploy (function () {
		var g = this;
		d3.select(g)
		    .append("line")
		    .attr("x1", 0)
		    .attr("x2", track.feature_width())
		    .attr("y1", ~~(track.height()/2))
		    .attr("y2", ~~(track.height()/2))
		    .attr("stroke-width", 2)
		    .attr("stroke", track.color());
	    });

	return track;

    });

    api.method ('vline', function () {
	var track = legend_track()
	    .deploy (function () {
		var g = this;
		d3.select(g)
		    .append("line")
		    .attr("stroke", track.color())
		    .attr("stroke-width", 2)
		    .attr("x1", 5)
		    .attr("x2", 5)
		    .attr("y1", 0)
		    .attr("y2", track.height());
	    });

	return track;
    });

    api.method ('square', function () {
	var track = legend_track()
	    .deploy (function () {
		var w_h = ~~(track.height()*0.8);
		var g = this;
		d3.select(g)
		    .append("rect")
		    .attr("x", 0)
		    .attr("y", track.height() - w_h)
		    .attr("width", w_h)
		    .attr("height", w_h)
		    .attr("fill", track.color());
	    });

	return track;
    });

    api.method ('circle', function () {
	var feature = board.track.feature()
	feature.create (function (g, xScale) {
	    var track = this;
	    var rad = ~~(track.height()/2);
	    g
		.append("circle")
		.attr("cx", rad)
		.attr("cy", ~~(rad/2))
		.attr("r", rad-2)
		.attr("fill", track.color());
	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", 40)
		.attr("y", ~~(track.height()/2 + 4))
		.text(track.text());
	});

	var track = legend_track()
	    .display (feature);

	return track;
    });

    api.method ('gradient', function () {
	var feature = board.track.feature()
	feature.create (function (g, xScale) {
	    var grad_width = 100;
	    var track = this;
	    var gradient = g
		.append("linearGradient")
		.attr("x1", "0%")
		.attr("x2", "100%")
		.attr("y1", "0%")
		.attr("y2", "0%")
		.attr("id", d3.select(div).attr("id") + "_gradient");

	    gradient
		.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", track.color1())
		.attr("stop-opacity", 1);

	    gradient
		.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", track.color2())
		.attr("stop-opacity", 1);

	    var scale = d3.scale.linear()
		.domain([track.from(), track.to()])
		.range([0,grad_width]);
	    var axis = d3.svg.axis().scale(scale).tickSize(0).ticks(3);
	    var grad_g = g
		.append("g")
		.attr("transform", "translate(5,0)");

	    var axis_g = g
		.append("g")
		.attr("transform", "translate(5," + (track.height()-10) + ")")
		.call(axis);

	    grad_g
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", grad_width)
		.attr("height", ~~(track.height()-10))
		.attr("fill", "url(#" + d3.select(div).attr("id") + "_gradient)");

	    grad_g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", 110)
		.attr("y", ~~(track.height()/2))
		.text(track.text());
	});

	// the general track
	var track = legend_track()
	    .display (feature);
	track.color = undefined;
	var api = apijs(track);
	api
	    .getset ("color1", "yellow")
	    .getset ("color2", "red")
	    .getset ("from", 0)
	    .getset ("to", 100)

	return track;
    });


    api.method ('range', function () {
	var feature = board.track.feature()
	feature.create (function (g, xScale) {
	    var track = this;
	    var grad_width = 100;
	    var gradient = g
		.append("linearGradient")
		.attr("x1", "0%")
		.attr("x2", "100%")
		.attr("y1", "0%")
		.attr("y2", "0%")
		.attr("id", d3.select(div).attr("id") + "_range");
	    gradient
		.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", track.color1())
		.attr("stop-opacity", 1);
	    gradient
		.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", track.color2())
		.attr("stop-opacity", 1);

	    var scale = d3.scale.linear()
		.domain([track.from(), track.to()])
		.range([0, grad_width]);

	    var brush = d3.svg.brush()
		.x(scale)
		.extent([track.from(), track.to()])
		.on("brushstart", brushstart)
		.on("brush", brushmove)
		.on("brushend", brushend);

	    var brushg = g
		.append("g")
		.attr("transform", "translate(5,5)")
		.call (brush);

	    brushg.selectAll(".resize").append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 0)
		.attr("y2", (track.height()/2 - 2))
		.style("stroke", "black")
		.style("stroke-width", 2);

	    brushg.selectAll(".resize").append("path")
		.attr("d", "M0,0L-3,-4L3,-4L0,0")
		.attr("fill", "black");

	    brushg.selectAll ("rect")
		.classed("tnt_legend_range", true)
		.attr("height", track.height()/2 - 2)
		.attr("fill", "url(#" + d3.select(div).attr("id") + "_range)");

	    brushg
		.append("rect")
		.attr("class", "tnt_legend_range_pre")
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", track.height()/2 - 2)
		.attr("fill", track.color1());

	    brushg
		.append("rect")
		.attr("class", "tnt_legend_range_post")
		.attr("y", 0)
		.attr("height", track.height()/2 - 2)
		.attr("fill", track.color2());

	    brushstart();
	    brushmove();

	    var axis = d3.svg.axis().scale(scale).tickSize(0).ticks(3);
	    var axis_g = g
		.append("g")
		.attr("transform", "translate(5," + (track.height()-10) + ")")
		.call(axis);

	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", 115)
		.attr("y", ~~(track.height()/2 + 3))
		.text(track.text());

	    function brushstart () {
	    }
	    function brushmove () {
		console.log(brush.extent());
		brushg.selectAll (".tnt_legend_rect")
		    .attr("fill", "url(#" + d3.select(div).attr("id") + "_range)");
		brushg.selectAll (".tnt_legend_range_pre")
		    .attr("width", scale(brush.extent()[0])-1)
		brushg.selectAll (".tnt_legend_range_post")
		    .attr("x", scale(brush.extent()[1])+1)
		    .attr("width",  grad_width - scale(brush.extent()[1]));
		track.on_change().call(brush);
	    }
	    function brushend () {
		console.log(brush.extent());
	    }

	});

	var track = legend_track()
	    .display (feature);
	track.color = undefined;
	var api = apijs(track);
	api
	    .getset ("color1", "yellow")
	    .getset ("color2", "red")
	    .getset ("from", 0)
	    .getset ("to", 100)
	    .getset ("on_change", function (){});

	return track;
    });


    api.method ('empty', function (color, desc) {
	var track = board.track()
	    .height(opts.row_height)
	    .background_color("white")
	    .data(null)
	    .display(null);

	return track;
    });

    var legend_track = function () {
	var feature = board.track.feature();
	feature.create (function (g, xScale) {
	    var track = this;
	    // feature
	    var feature_g = g
		.append("g");
	    
	    track.deploy().call(feature_g.node());

	    // label
	    g
		.append("g")
		.attr("transform", "translate(" + (track.feature_width() + 5) + ", 0)")
		.append("text")
		.attr("fill", "black")
		.attr("x", 0)
		.attr("y", ~~(track.height()/2) + 4) // TODO: Don't hardcode the 4
		.attr("font-size", track.fontsize())
		.text(track.text());
	});

	var track = board.track();

	var api = apijs (track)
	    .getset ('color', 'black')
	    .getset ('text', '')
	    .getset ('height', opts.row_height)
	    .getset ('fontsize', opts.fontsize)
	    .getset ('feature_width', 40)
	    .getset ('deploy', function () {
		throw ('deploy is not defined in the legend base class');
	    });

	track
	    .height (track.height())
	    .background_color ("white")
	    .data (board.track.data()
		   .update(
		       board.track.data.retriever.sync()
			   .retriever (function () {
			       return [{}];
			   })
		       )
		  )
	    .display (feature);

	return track;
    };

    return _;
};

module.exports = exports = tnt_legend;

},{"tnt.api":6,"tnt.board":8,"tnt.utils":45}],34:[function(require,module,exports){
module.exports = tooltip = require("./src/tooltip.js");

},{"./src/tooltip.js":35}],35:[function(require,module,exports){
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

},{"tnt.api":6}],36:[function(require,module,exports){
var node = require("./src/node.js");
module.exports = exports = node;

},{"./src/node.js":37}],37:[function(require,module,exports){
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


},{"tnt.api":6,"tnt.utils":45}],38:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
module.exports = tree = require("./src/index.js");
var eventsystem = require("biojs-events");
eventsystem.mixin(tree);
//tnt.utils = require("tnt.utils");
//tnt.tooltip = require("tnt.tooltip");
//tnt.tree = require("./src/index.js");


},{"./src/index.js":40,"biojs-events":3}],39:[function(require,module,exports){
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

},{"tnt.api":6}],40:[function(require,module,exports){
var tree = require ("./tree.js");
tree.label = require("./label.js");
tree.diagonal = require("./diagonal.js");
tree.layout = require("./layout.js");
tree.node_display = require("./node_display.js");
// tree.node = require("tnt.tree.node");
// tree.parse_newick = require("tnt.newick").parse_newick;
// tree.parse_nhx = require("tnt.newick").parse_nhx;

module.exports = exports = tree;


},{"./diagonal.js":39,"./label.js":41,"./layout.js":42,"./node_display.js":43,"./tree.js":44}],41:[function(require,module,exports){
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



},{"tnt.api":6}],42:[function(require,module,exports){
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

},{"./diagonal.js":39,"tnt.api":6}],43:[function(require,module,exports){
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

},{"tnt.api":6}],44:[function(require,module,exports){
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

},{"tnt.api":6,"tnt.tree.node":36}],45:[function(require,module,exports){
module.exports = require("./src/index.js");

},{"./src/index.js":46}],46:[function(require,module,exports){
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

},{"./reduce.js":47,"./utils.js":48}],47:[function(require,module,exports){
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


},{}],48:[function(require,module,exports){

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

},{}],49:[function(require,module,exports){
var apijs = require ("tnt.api");

var ta = function () {
    "use strict";

    var no_track = true;
    var div_id;

    // Defaults
    var tree_conf = {
	tree : undefined,
	track : function () {
	    var t = tnt.track()
		.background_color("#EBF5FF")
		.data(tnt.track.data()
		      .update(tnt.track.retriever.sync()
			      .retriever (function () {
				  return  []
			      })
			     ))
		.display(tnt.track.feature.block()
			 .foreground_color("steelblue")
			 .index(function (d) {
			     return d.start;
			 })
			);

	    return t;
	},
	annotation : undefined,
	ruler : "none",
	key   : undefined
    };

    var tree_annot = function (div) {
	div_id = d3.select(div)
	    .attr("id");

	var group_div = d3.select(div)
	    .append("div")
	    .attr("class", "tnt_groupDiv");

	var tree_div = group_div
	    .append("div")
	    .attr("id", "tnt_tree_container_" + div_id)
	    .attr("class", "tnt_tree_container");

	var annot_div = group_div
	    .append("div")
	    .attr("id", "tnt_annot_container_" + div_id)
	    .attr("class", "tnt_annot_container");

	tree_conf.tree (tree_div.node());

	// tracks
	var leaves = tree_conf.tree.root().get_all_leaves();
	var tracks = [];

	var height = tree_conf.tree.label().height();

	for (var i=0; i<leaves.length; i++) {
	    // Block Track1
	    (function  (leaf) {
		tnt.track.id = function () {
		    if (tree_conf.key === undefined) {
			return  leaf.id();
		    }
		    if (typeof (tree_conf.key) === 'function') {
			return tree_conf.key (leaf);
		    }
		    return leaf.property(tree_conf.key);
		};
		var track = tree_conf.track(leaves[i])
		    .height(height);

		tracks.push (track);

	    })(leaves[i]);

	}

	// An axis track
	tnt.track.id = function () {
	    return "axis-top";
	};
	var axis_top = tnt.track()
	    .height(0)
	    .background_color("white")
	    .display(tnt.track.feature.axis()
		     .orientation("top")
		    );

	tnt.track.id = function () {
	    return "axis-bottom";
	};
	var axis = tnt.track()
	    .height(18)
	    .background_color("white")
	    .display(tnt.track.feature.axis()
		     .orientation("bottom")
		    );

	if (tree_conf.annotation) {
	    if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
		tree_conf.annotation
		    .add_track(axis_top);
	    }

	    tree_conf.annotation
		.add_track(tracks);

	    if (tree_conf.ruler === 'both' || tree_conf.ruler === "bottom") {
		tree_conf.annotation
		    .add_track(axis);
	    }

	    tree_conf.annotation(annot_div.node());
	    tree_conf.annotation.start();
	}

	api.method('update', function () {
	    tree_conf.tree.update();

	    if (tree_conf.annotation) {
		var leaves = tree_conf.tree.root().get_all_leaves();
		var new_tracks = [];

		if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
		    new_tracks.push(axis_top);
		}

		for (var i=0; i<leaves.length; i++) {
		    // We first see if we have a track for the leaf:
		    var id;
		    if (tree_conf.key === undefined) {
			id = leaves[i].id();
		    } else if (typeof (tree_conf.key) === 'function') {
			id = tree_conf.key (leaves[i]);
		    } else {
			id = leaves[i].property(tree_conf.key);
		    }
		    var curr_track = tree_conf.annotation.find_track_by_id(id);
		    //var curr_track = tree_conf.annotation.find_track_by_id(tree_conf.key===undefined ? leaves[i].id() : d3.functor(tree_conf.key) (leaves[i]))//leaves[i].property(tree_conf.key));
		    if (curr_track === undefined) {
			// New leaf -- no track for it
			(function (leaf) {
			    tnt.track.id = function () {
				if (tree_conf.key === undefined) {
				    return leaf.id();
				}
				if (typeof (tree_conf.key) === 'function') {
				    return tree_conf.key (leaf);
				}
				return leaf.property(tree_conf.key);
			    };
			    curr_track = tree_conf.track(leaves[i])
				.height(height);
			})(leaves[i]);
		    }
		    new_tracks.push(curr_track);
		}
		if (tree_conf.ruler === 'both' || tree_conf.ruler === 'bottom') {
		    new_tracks.push(axis);
		}

		tree_conf.annotation.reorder(new_tracks);
	    }
	});

	return tree_annot;
    };

    var api = tnt.utils.api (tree_annot)
	.getset (tree_conf);

    // TODO: Rewrite with the api interface
    tree_annot.track = function (new_track) {
	if (!arguments.length) {
	    return tree_conf.track;
	}

	// First time it is set
	if (no_track) {
	    tree_conf.track = new_track;
	    no_track = false;
	    return tree_annot;
	}

	// If it is reset -- apply the changes
	var tracks = tree_conf.annotation.tracks();
	// var start_index = (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') ? 1 : 0;
	// var end_index = (tree_conf.ruler === 'both' || tree_conf.ruler === 'bottom') ? 1 : 0;

	var start_index = 0;
	var n_index = 0;

	if (tree_conf.ruler === "both") {
	    start_index = 1;
	    n_index = 2;
	} else if (tree_conf.ruler === "top") {
	    start_index = 1;
	    n_index = 1;
	} else if (tree_conf.ruler === "bottom") {
	    n_index = 1;
	}

	// Reset top track -- axis
	if (start_index > 0) {
	    tracks[0].display().reset.call(tracks[0]);
	}
	// Reset bottom track -- axis
	if (n_index > start_index) {
	    var n = tracks.length - 1;
	    tracks[n].display().reset.call(tracks[n]);
	}

	for (var i=start_index; i<=(tracks.length - n_index); i++) {
	    var t = tracks[i];
	    t.display().reset.call(t);
	    var leaf;
	    tree_conf.tree.root().apply (function (node) {
		if (node.id() === t.id()) {
		    leaf = node;
		}
	    })

	    var n_track;
	    (function (leaf) {
		tnt.track.id = function () {
		    if (tree_conf.key === undefined) {
			return leaf.id();
		    }
		    if (typeof (tree_conf.key === 'function')) {
			return tree_conf.key (leaf);
		    }
		    return leaf.property(tree_conf.key);
		};
		n_track = new_track(leaf)
		    .height(tree_conf.tree.label().height());
	    })(leaf);

	    tracks[i] = n_track;
	}

	tree_conf.track = new_track;
	tree_conf.annotation.start();
    };

    return ta;
};

module.exports = exports = ta;


},{"tnt.api":6}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9mYWtlXzliMDQ0MzE0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5hcGkvc3JjL2FwaS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvYm9hcmQuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2RhdGEuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2ZlYXR1cmUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL3NyYy9sYXlvdXQuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL3RyYWNrLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9saWIvZXJyb3IuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9saWIvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9saWIvcmVxdWVzdC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi9yZXNwb25zZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi91dGlscy9kZWxheS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi91dGlscy9vbmNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvbGliL3hoci1icm93c2VyLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2Uvbm9kZV9tb2R1bGVzL3h0ZW5kL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvcGx1Z2lucy9jbGVhbnVybC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL3NyYy9yZXN0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50Lmdlbm9tZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5nZW5vbWUvc3JjL2RhdGEuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZ2Vub21lL3NyYy9mZWF0dXJlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50Lmdlbm9tZS9zcmMvZ2Vub21lLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50Lmdlbm9tZS9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZ2Vub21lL3NyYy9sYXlvdXQuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQubGVnZW5kL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmxlZ2VuZC9zcmMvbGVnZW5kLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRvb2x0aXAvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9zcmMvdG9vbHRpcC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL3NyYy9ub2RlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGFiZWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL25vZGVfZGlzcGxheS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy90cmVlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcmVkdWNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy91dGlscy5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvc3JjL3RhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25pQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaHFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9hQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9kQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsYUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0gcmVxdWlyZShcIi4vc3JjL3RhLmpzXCIpO1xufVxudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZSAoXCJiaW9qcy1ldmVudHNcIik7XG5ldmVudHN5c3RlbS5taXhpbiAodG50KTtcbnRudC51dGlscyA9IHJlcXVpcmUgKFwidG50LnV0aWxzXCIpO1xudG50LnRvb2x0aXAgPSByZXF1aXJlIChcInRudC50b29sdGlwXCIpO1xudG50LnRyZWUgPSByZXF1aXJlIChcInRudC50cmVlXCIpO1xudG50LnRyZWUubm9kZSA9IHJlcXVpcmUgKFwidG50LnRyZWUubm9kZVwiKTtcbnRudC5ib2FyZCA9IHJlcXVpcmUgKFwidG50LmJvYXJkXCIpO1xudG50LmJvYXJkLmdlbm9tZSA9IHJlcXVpcmUoXCJ0bnQuZ2Vub21lXCIpO1xudG50LmxlZ2VuZCA9IHJlcXVpcmUgKFwidG50LmxlZ2VuZFwiKTtcbiIsInZhciBldmVudHMgPSByZXF1aXJlKFwiYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmVcIik7XG5cbmV2ZW50cy5vbkFsbCA9IGZ1bmN0aW9uKGNhbGxiYWNrLGNvbnRleHQpe1xuICB0aGlzLm9uKFwiYWxsXCIsIGNhbGxiYWNrLGNvbnRleHQpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIE1peGluIHV0aWxpdHlcbmV2ZW50cy5vbGRNaXhpbiA9IGV2ZW50cy5taXhpbjtcbmV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gIGV2ZW50cy5vbGRNaXhpbihwcm90byk7XG4gIC8vIGFkZCBjdXN0b20gb25BbGxcbiAgdmFyIGV4cG9ydHMgPSBbJ29uQWxsJ107XG4gIGZvcih2YXIgaT0wOyBpIDwgZXhwb3J0cy5sZW5ndGg7aSsrKXtcbiAgICB2YXIgbmFtZSA9IGV4cG9ydHNbaV07XG4gICAgcHJvdG9bbmFtZV0gPSB0aGlzW25hbWVdO1xuICB9XG4gIHJldHVybiBwcm90bztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzO1xuIiwiLyoqXG4gKiBTdGFuZGFsb25lIGV4dHJhY3Rpb24gb2YgQmFja2JvbmUuRXZlbnRzLCBubyBleHRlcm5hbCBkZXBlbmRlbmN5IHJlcXVpcmVkLlxuICogRGVncmFkZXMgbmljZWx5IHdoZW4gQmFja29uZS91bmRlcnNjb3JlIGFyZSBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudFxuICogZ2xvYmFsIGNvbnRleHQuXG4gKlxuICogTm90ZSB0aGF0IGRvY3Mgc3VnZ2VzdCB0byB1c2UgdW5kZXJzY29yZSdzIGBfLmV4dGVuZCgpYCBtZXRob2QgdG8gYWRkIEV2ZW50c1xuICogc3VwcG9ydCB0byBzb21lIGdpdmVuIG9iamVjdC4gQSBgbWl4aW4oKWAgbWV0aG9kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBFdmVudHNcbiAqIHByb3RvdHlwZSB0byBhdm9pZCB1c2luZyB1bmRlcnNjb3JlIGZvciB0aGF0IHNvbGUgcHVycG9zZTpcbiAqXG4gKiAgICAgdmFyIG15RXZlbnRFbWl0dGVyID0gQmFja2JvbmVFdmVudHMubWl4aW4oe30pO1xuICpcbiAqIE9yIGZvciBhIGZ1bmN0aW9uIGNvbnN0cnVjdG9yOlxuICpcbiAqICAgICBmdW5jdGlvbiBNeUNvbnN0cnVjdG9yKCl7fVxuICogICAgIE15Q29uc3RydWN0b3IucHJvdG90eXBlLmZvbyA9IGZ1bmN0aW9uKCl7fVxuICogICAgIEJhY2tib25lRXZlbnRzLm1peGluKE15Q29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAqXG4gKiAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBJbmMuXG4gKiAoYykgMjAxMyBOaWNvbGFzIFBlcnJpYXVsdFxuICovXG4vKiBnbG9iYWwgZXhwb3J0czp0cnVlLCBkZWZpbmUsIG1vZHVsZSAqL1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdCA9IHRoaXMsXG4gICAgICBicmVha2VyID0ge30sXG4gICAgICBuYXRpdmVGb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcbiAgICAgIGlkQ291bnRlciA9IDA7XG5cbiAgLy8gUmV0dXJucyBhIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gbWF0Y2hpbmcgdGhlIG1pbmltYWwgQVBJIHN1YnNldCByZXF1aXJlZFxuICAvLyBieSBCYWNrYm9uZS5FdmVudHNcbiAgZnVuY3Rpb24gbWluaXNjb3JlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBrZXlzOiBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmogIT09IFwiZnVuY3Rpb25cIiB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5cygpIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSwga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGtleXNba2V5cy5sZW5ndGhdID0ga2V5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgIH0sXG5cbiAgICAgIHVuaXF1ZUlkOiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICAgICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgICAgIH0sXG5cbiAgICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbmNlOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICBmdW5jID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdmFyIF8gPSBtaW5pc2NvcmUoKSwgRXZlbnRzO1xuXG4gIC8vIEJhY2tib25lLkV2ZW50c1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBIG1vZHVsZSB0aGF0IGNhbiBiZSBtaXhlZCBpbiB0byAqYW55IG9iamVjdCogaW4gb3JkZXIgdG8gcHJvdmlkZSBpdCB3aXRoXG4gIC8vIGN1c3RvbSBldmVudHMuIFlvdSBtYXkgYmluZCB3aXRoIGBvbmAgb3IgcmVtb3ZlIHdpdGggYG9mZmAgY2FsbGJhY2tcbiAgLy8gZnVuY3Rpb25zIHRvIGFuIGV2ZW50OyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICBFdmVudHMgPSB7XG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi4gUGFzc2luZyBgXCJhbGxcImAgd2lsbCBiaW5kXG4gICAgLy8gdGhlIGNhbGxiYWNrIHRvIGFsbCBldmVudHMgZmlyZWQuXG4gICAgb246IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb24nLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8ICh0aGlzLl9ldmVudHNbbmFtZV0gPSBbXSk7XG4gICAgICBldmVudHMucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBjb250ZXh0OiBjb250ZXh0LCBjdHg6IGNvbnRleHQgfHwgdGhpc30pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gb25seSBiZSB0cmlnZ2VyZWQgYSBzaW5nbGUgdGltZS4gQWZ0ZXIgdGhlIGZpcnN0IHRpbWVcbiAgICAvLyB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgaXQgd2lsbCBiZSByZW1vdmVkLlxuICAgIG9uY2U6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb25jZScsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgb25jZSA9IF8ub25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5vZmYobmFtZSwgb25jZSk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIG9uY2UuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICByZXR1cm4gdGhpcy5vbihuYW1lLCBvbmNlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIG9uZSBvciBtYW55IGNhbGxiYWNrcy4gSWYgYGNvbnRleHRgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgdGhlIGV2ZW50LiBJZiBgbmFtZWAgaXMgbnVsbCwgcmVtb3ZlcyBhbGwgYm91bmRcbiAgICAvLyBjYWxsYmFja3MgZm9yIGFsbCBldmVudHMuXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgdmFyIHJldGFpbiwgZXYsIGV2ZW50cywgbmFtZXMsIGksIGwsIGosIGs7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhZXZlbnRzQXBpKHRoaXMsICdvZmYnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIW5hbWUgJiYgIWNhbGxiYWNrICYmICFjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHJldGFpbiA9IFtdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBjb250ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZXZlbnRzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICBldiA9IGV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgaWYgKChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrLl9jYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGV2LmNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0YWluLnB1c2goZXYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmV0YWluLmxlbmd0aCkgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gICAgLy8gcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcbiAgICAvLyAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG9cbiAgICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAndHJpZ2dlcicsIG5hbWUsIGFyZ3MpKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gdGhpcy5fZXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRlbGwgdGhpcyBvYmplY3QgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gZWl0aGVyIHNwZWNpZmljIGV2ZW50cyAuLi4gb3JcbiAgICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZGVsZXRlTGlzdGVuZXIgPSAhbmFtZSAmJiAhY2FsbGJhY2s7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBpZiAob2JqKSAobGlzdGVuZXJzID0ge30pW29iai5fbGlzdGVuZXJJZF0gPSBvYmo7XG4gICAgICBmb3IgKHZhciBpZCBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzW2lkXS5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgICBpZiAoZGVsZXRlTGlzdGVuZXIpIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbaWRdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gIH07XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5ncy5cbiAgdmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbiAgLy8gSW1wbGVtZW50IGZhbmN5IGZlYXR1cmVzIG9mIHRoZSBFdmVudHMgQVBJIHN1Y2ggYXMgbXVsdGlwbGUgZXZlbnRcbiAgLy8gbmFtZXMgYFwiY2hhbmdlIGJsdXJcImAgYW5kIGpRdWVyeS1zdHlsZSBldmVudCBtYXBzIGB7Y2hhbmdlOiBhY3Rpb259YFxuICAvLyBpbiB0ZXJtcyBvZiB0aGUgZXhpc3RpbmcgQVBJLlxuICB2YXIgZXZlbnRzQXBpID0gZnVuY3Rpb24ob2JqLCBhY3Rpb24sIG5hbWUsIHJlc3QpIHtcbiAgICBpZiAoIW5hbWUpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gSGFuZGxlIGV2ZW50IG1hcHMuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG5hbWUpIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBba2V5LCBuYW1lW2tleV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNwYWNlIHNlcGFyYXRlZCBldmVudCBuYW1lcy5cbiAgICBpZiAoZXZlbnRTcGxpdHRlci50ZXN0KG5hbWUpKSB7XG4gICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGV2ZW50U3BsaXR0ZXIpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBbbmFtZXNbaV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gQSBkaWZmaWN1bHQtdG8tYmVsaWV2ZSwgYnV0IG9wdGltaXplZCBpbnRlcm5hbCBkaXNwYXRjaCBmdW5jdGlvbiBmb3JcbiAgLy8gdHJpZ2dlcmluZyBldmVudHMuIFRyaWVzIHRvIGtlZXAgdGhlIHVzdWFsIGNhc2VzIHNwZWVkeSAobW9zdCBpbnRlcm5hbFxuICAvLyBCYWNrYm9uZSBldmVudHMgaGF2ZSAzIGFyZ3VtZW50cykuXG4gIHZhciB0cmlnZ2VyRXZlbnRzID0gZnVuY3Rpb24oZXZlbnRzLCBhcmdzKSB7XG4gICAgdmFyIGV2LCBpID0gLTEsIGwgPSBldmVudHMubGVuZ3RoLCBhMSA9IGFyZ3NbMF0sIGEyID0gYXJnc1sxXSwgYTMgPSBhcmdzWzJdO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgpOyByZXR1cm47XG4gICAgICBjYXNlIDE6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSk7IHJldHVybjtcbiAgICAgIGNhc2UgMjogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMik7IHJldHVybjtcbiAgICAgIGNhc2UgMzogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMiwgYTMpOyByZXR1cm47XG4gICAgICBkZWZhdWx0OiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5hcHBseShldi5jdHgsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuTWV0aG9kcyA9IHtsaXN0ZW5UbzogJ29uJywgbGlzdGVuVG9PbmNlOiAnb25jZSd9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAgYW5kIGBvbmNlYC4gVGVsbCAqdGhpcyogb2JqZWN0IHRvXG4gIC8vIGxpc3RlbiB0byBhbiBldmVudCBpbiBhbm90aGVyIG9iamVjdCAuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3NcbiAgLy8gbGlzdGVuaW5nIHRvLlxuICBfLmVhY2gobGlzdGVuTWV0aG9kcywgZnVuY3Rpb24oaW1wbGVtZW50YXRpb24sIG1ldGhvZCkge1xuICAgIEV2ZW50c1ttZXRob2RdID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCAodGhpcy5fbGlzdGVuZXJzID0ge30pO1xuICAgICAgdmFyIGlkID0gb2JqLl9saXN0ZW5lcklkIHx8IChvYmouX2xpc3RlbmVySWQgPSBfLnVuaXF1ZUlkKCdsJykpO1xuICAgICAgbGlzdGVuZXJzW2lkXSA9IG9iajtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIG9ialtpbXBsZW1lbnRhdGlvbl0obmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIE1peGluIHV0aWxpdHlcbiAgRXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgICB2YXIgZXhwb3J0cyA9IFsnb24nLCAnb25jZScsICdvZmYnLCAndHJpZ2dlcicsICdzdG9wTGlzdGVuaW5nJywgJ2xpc3RlblRvJyxcbiAgICAgICAgICAgICAgICAgICAnbGlzdGVuVG9PbmNlJywgJ2JpbmQnLCAndW5iaW5kJ107XG4gICAgXy5lYWNoKGV4cG9ydHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gcHJvdG87XG4gIH07XG5cbiAgLy8gRXhwb3J0IEV2ZW50cyBhcyBCYWNrYm9uZUV2ZW50cyBkZXBlbmRpbmcgb24gY3VycmVudCBjb250ZXh0XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRXZlbnRzO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gRXZlbnRzO1xuICAgIH1cbiAgICBleHBvcnRzLkJhY2tib25lRXZlbnRzID0gRXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1cbn0pKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwiLy8gaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9XG4vLyB9XG4vLyB0bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy8gdG50LnRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG4vLyB0bnQuYm9hcmQgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gYm9hcmQgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXhcIik7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgZGVmZXJDYW5jZWwgPSByZXF1aXJlIChcInRudC51dGlsc1wiKS5kZWZlcl9jYW5jZWw7XG5cbnZhciBib2FyZCA9IGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIFxuICAgIC8vLy8gUHJpdmF0ZSB2YXJzXG4gICAgdmFyIHN2ZztcbiAgICB2YXIgZGl2X2lkO1xuICAgIHZhciB0cmFja3MgPSBbXTtcbiAgICB2YXIgbWluX3dpZHRoID0gNTA7XG4gICAgdmFyIGhlaWdodCAgICA9IDA7ICAgIC8vIFRoaXMgaXMgdGhlIGdsb2JhbCBoZWlnaHQgaW5jbHVkaW5nIGFsbCB0aGUgdHJhY2tzXG4gICAgdmFyIHdpZHRoICAgICA9IDkyMDtcbiAgICB2YXIgaGVpZ2h0X29mZnNldCA9IDIwO1xuICAgIHZhciBsb2MgPSB7XG5cdHNwZWNpZXMgIDogdW5kZWZpbmVkLFxuXHRjaHIgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgZnJvbSAgICAgOiAwLFxuICAgICAgICB0byAgICAgICA6IDUwMFxuICAgIH07XG5cbiAgICAvLyBUT0RPOiBXZSBoYXZlIG5vdyBiYWNrZ3JvdW5kIGNvbG9yIGluIHRoZSB0cmFja3MuIENhbiB0aGlzIGJlIHJlbW92ZWQ/XG4gICAgLy8gSXQgbG9va3MgbGlrZSBpdCBpcyB1c2VkIGluIHRoZSB0b28td2lkZSBwYW5lIGV0YywgYnV0IGl0IG1heSBub3QgYmUgbmVlZGVkIGFueW1vcmVcbiAgICB2YXIgYmdDb2xvciAgID0gZDMucmdiKCcjRjhGQkVGJyk7IC8vI0Y4RkJFRlxuICAgIHZhciBwYW5lOyAvLyBEcmFnZ2FibGUgcGFuZVxuICAgIHZhciBzdmdfZztcbiAgICB2YXIgeFNjYWxlO1xuICAgIHZhciB6b29tRXZlbnRIYW5kbGVyID0gZDMuYmVoYXZpb3Iuem9vbSgpO1xuICAgIHZhciBsaW1pdHMgPSB7XG5cdGxlZnQgOiAwLFxuXHRyaWdodCA6IDEwMDAsXG5cdHpvb21fb3V0IDogMTAwMCxcblx0em9vbV9pbiAgOiAxMDBcbiAgICB9O1xuICAgIHZhciBjYXBfd2lkdGggPSAzO1xuICAgIHZhciBkdXIgPSA1MDA7XG4gICAgdmFyIGRyYWdfYWxsb3dlZCA9IHRydWU7XG5cbiAgICB2YXIgZXhwb3J0cyA9IHtcblx0ZWFzZSAgICAgICAgICA6IGQzLmVhc2UoXCJjdWJpYy1pbi1vdXRcIiksXG5cdGV4dGVuZF9jYW52YXMgOiB7XG5cdCAgICBsZWZ0IDogMCxcblx0ICAgIHJpZ2h0IDogMFxuXHR9LFxuXHRzaG93X2ZyYW1lIDogdHJ1ZVxuXHQvLyBsaW1pdHMgICAgICAgIDogZnVuY3Rpb24gKCkge3Rocm93IFwiVGhlIGxpbWl0cyBtZXRob2Qgc2hvdWxkIGJlIGRlZmluZWRcIn1cdFxuICAgIH07XG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgY2xvc3VyZSAvIG9iamVjdFxuICAgIHZhciB0cmFja192aXMgPSBmdW5jdGlvbihkaXYpIHtcblx0ZGl2X2lkID0gZDMuc2VsZWN0KGRpdikuYXR0cihcImlkXCIpO1xuXG5cdC8vIFRoZSBvcmlnaW5hbCBkaXYgaXMgY2xhc3NlZCB3aXRoIHRoZSB0bnQgY2xhc3Ncblx0ZDMuc2VsZWN0KGRpdilcblx0ICAgIC5jbGFzc2VkKFwidG50XCIsIHRydWUpO1xuXG5cdC8vIFRPRE86IE1vdmUgdGhlIHN0eWxpbmcgdG8gdGhlIHNjc3M/XG5cdHZhciBicm93c2VyRGl2ID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQpXG5cdCAgICAuc3R5bGUoXCJwb3NpdGlvblwiLCBcInJlbGF0aXZlXCIpXG5cdCAgICAuY2xhc3NlZChcInRudF9mcmFtZWRcIiwgZXhwb3J0cy5zaG93X2ZyYW1lID8gdHJ1ZSA6IGZhbHNlKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgKHdpZHRoICsgY2FwX3dpZHRoKjIgKyBleHBvcnRzLmV4dGVuZF9jYW52YXMucmlnaHQgKyBleHBvcnRzLmV4dGVuZF9jYW52YXMubGVmdCkgKyBcInB4XCIpXG5cblx0dmFyIGdyb3VwRGl2ID0gYnJvd3NlckRpdlxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ncm91cERpdlwiKTtcblxuXHQvLyBUaGUgU1ZHXG5cdHN2ZyA9IGdyb3VwRGl2XG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3N2Z1wiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcblx0ICAgIC5hdHRyKFwicG9pbnRlci1ldmVudHNcIiwgXCJhbGxcIik7XG5cblx0c3ZnX2cgPSBzdmdcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDIwKVwiKVxuICAgICAgICAgICAgLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ1wiKTtcblxuXHQvLyBjYXBzXG5cdHN2Z19nXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9cIiArIGRpdl9pZCArIFwiXzVwY2FwXCIpXG5cdCAgICAuYXR0cihcInhcIiwgMClcblx0ICAgIC5hdHRyKFwieVwiLCAwKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCAwKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwicmVkXCIpO1xuXHRzdmdfZ1xuXHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl8zcGNhcFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIHdpZHRoLWNhcF93aWR0aClcblx0ICAgIC5hdHRyKFwieVwiLCAwKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCAwKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwicmVkXCIpO1xuXG5cdC8vIFRoZSBab29taW5nL1Bhbm5pbmcgUGFuZVxuXHRwYW5lID0gc3ZnX2dcblx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3BhbmVcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl9wYW5lXCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuXHQgICAgLnN0eWxlKFwiZmlsbFwiLCBiZ0NvbG9yKTtcblxuXHQvLyAqKiBUT0RPOiBXb3VsZG4ndCBiZSBiZXR0ZXIgdG8gaGF2ZSB0aGVzZSBtZXNzYWdlcyBieSB0cmFjaz9cblx0Ly8gdmFyIHRvb1dpZGVfdGV4dCA9IHN2Z19nXG5cdC8vICAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQvLyAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF93aWRlT0tfdGV4dFwiKVxuXHQvLyAgICAgLmF0dHIoXCJpZFwiLCBcInRudF9cIiArIGRpdl9pZCArIFwiX3Rvb1dpZGVcIilcblx0Ly8gICAgIC5hdHRyKFwiZmlsbFwiLCBiZ0NvbG9yKVxuXHQvLyAgICAgLnRleHQoXCJSZWdpb24gdG9vIHdpZGVcIik7XG5cblx0Ly8gVE9ETzogSSBkb24ndCBrbm93IGlmIHRoaXMgaXMgdGhlIGJlc3Qgd2F5IChhbmQgcG9ydGFibGUpIHdheVxuXHQvLyBvZiBjZW50ZXJpbmcgdGhlIHRleHQgaW4gdGhlIHRleHQgYXJlYVxuXHQvLyB2YXIgYmIgPSB0b29XaWRlX3RleHRbMF1bMF0uZ2V0QkJveCgpO1xuXHQvLyB0b29XaWRlX3RleHRcblx0Ly8gICAgIC5hdHRyKFwieFwiLCB+fih3aWR0aC8yIC0gYmIud2lkdGgvMikpXG5cdC8vICAgICAuYXR0cihcInlcIiwgfn4oaGVpZ2h0LzIgLSBiYi5oZWlnaHQvMikpO1xuICAgIH07XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHRyYWNrX3Zpcylcblx0LmdldHNldCAoZXhwb3J0cylcblx0LmdldHNldCAobGltaXRzKVxuXHQuZ2V0c2V0IChsb2MpO1xuXG4gICAgYXBpLnRyYW5zZm9ybSAodHJhY2tfdmlzLmV4dGVuZF9jYW52YXMsIGZ1bmN0aW9uICh2YWwpIHtcblx0dmFyIHByZXZfdmFsID0gdHJhY2tfdmlzLmV4dGVuZF9jYW52YXMoKTtcblx0dmFsLmxlZnQgPSB2YWwubGVmdCB8fCBwcmV2X3ZhbC5sZWZ0O1xuXHR2YWwucmlnaHQgPSB2YWwucmlnaHQgfHwgcHJldl92YWwucmlnaHQ7XG5cdHJldHVybiB2YWw7XG4gICAgfSk7XG5cbiAgICAvLyB0cmFja192aXMgYWx3YXlzIHN0YXJ0cyBvbiBsb2MuZnJvbSAmIGxvYy50b1xuICAgIGFwaS5tZXRob2QgKCdzdGFydCcsIGZ1bmN0aW9uICgpIHtcblxuXHQvLyBSZXNldCB0aGUgdHJhY2tzXG5cdGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmICh0cmFja3NbaV0uZykge1xuXHRcdHRyYWNrc1tpXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3NbaV0pO1xuXHQgICAgfVxuXHQgICAgX2luaXRfdHJhY2sodHJhY2tzW2ldKTtcblx0fVxuXG5cdF9wbGFjZV90cmFja3MoKTtcblxuXHQvLyBUaGUgY29udGludWF0aW9uIGNhbGxiYWNrXG5cdHZhciBjb250ID0gZnVuY3Rpb24gKHJlc3ApIHtcblx0ICAgIGxpbWl0cy5yaWdodCA9IHJlc3A7XG5cblx0ICAgIC8vIHpvb21FdmVudEhhbmRsZXIueEV4dGVudChbbGltaXRzLmxlZnQsIGxpbWl0cy5yaWdodF0pO1xuXHQgICAgaWYgKChsb2MudG8gLSBsb2MuZnJvbSkgPCBsaW1pdHMuem9vbV9pbikge1xuXHRcdGlmICgobG9jLmZyb20gKyBsaW1pdHMuem9vbV9pbikgPiBsaW1pdHMuem9vbV9pbikge1xuXHRcdCAgICBsb2MudG8gPSBsaW1pdHMucmlnaHQ7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgbG9jLnRvID0gbG9jLmZyb20gKyBsaW1pdHMuem9vbV9pbjtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBwbG90KCk7XG5cblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0XHRfdXBkYXRlX3RyYWNrKHRyYWNrc1tpXSwgbG9jKTtcblx0ICAgIH1cblx0fTtcblxuXHQvLyBJZiBsaW1pdHMucmlnaHQgaXMgYSBmdW5jdGlvbiwgd2UgaGF2ZSB0byBjYWxsIGl0IGFzeW5jaHJvbm91c2x5IGFuZFxuXHQvLyB0aGVuIHN0YXJ0aW5nIHRoZSBwbG90IG9uY2Ugd2UgaGF2ZSBzZXQgdGhlIHJpZ2h0IGxpbWl0IChwbG90KVxuXHQvLyBJZiBub3QsIHdlIGFzc3VtZSB0aGF0IGl0IGlzIGFuIG9iamV0IHdpdGggbmV3IChtYXliZSBwYXJ0aWFsbHkgZGVmaW5lZClcblx0Ly8gZGVmaW5pdGlvbnMgb2YgdGhlIGxpbWl0cyBhbmQgd2UgY2FuIHBsb3QgZGlyZWN0bHlcblx0Ly8gVE9ETzogUmlnaHQgbm93LCBvbmx5IHJpZ2h0IGNhbiBiZSBjYWxsZWQgYXMgYW4gYXN5bmMgZnVuY3Rpb24gd2hpY2ggaXMgd2Vha1xuXHRpZiAodHlwZW9mIChsaW1pdHMucmlnaHQpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBsaW1pdHMucmlnaHQoY29udCk7XG5cdH0gZWxzZSB7XG5cdCAgICBjb250KGxpbWl0cy5yaWdodCk7XG5cdH1cblxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcblx0Zm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuXHQgICAgX3VwZGF0ZV90cmFjayAodHJhY2tzW2ldKTtcblx0fVxuXG4gICAgfSk7XG5cbiAgICB2YXIgX3VwZGF0ZV90cmFjayA9IGZ1bmN0aW9uICh0cmFjaywgd2hlcmUpIHtcblx0aWYgKHRyYWNrLmRhdGEoKSkge1xuXHQgICAgdmFyIGRhdGFfdXBkYXRlciA9IHRyYWNrLmRhdGEoKS51cGRhdGUoKTtcblx0ICAgIGRhdGFfdXBkYXRlcih7XG5cdFx0J2xvYycgOiB3aGVyZSxcblx0XHQnb25fc3VjY2VzcycgOiBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIHRyYWNrLmRpc3BsYXkoKS51cGRhdGUuY2FsbCh0cmFjaywgeFNjYWxlKTtcblx0XHR9XG5cdCAgICB9KTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgcGxvdCA9IGZ1bmN0aW9uKCkge1xuXG5cdHhTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG5cdCAgICAuZG9tYWluKFtsb2MuZnJvbSwgbG9jLnRvXSlcblx0ICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcblxuXHRpZiAoZHJhZ19hbGxvd2VkKSB7XG5cdCAgICBzdmdfZy5jYWxsKCB6b29tRXZlbnRIYW5kbGVyXG5cdFx0ICAgICAgIC54KHhTY2FsZSlcblx0XHQgICAgICAgLnNjYWxlRXh0ZW50KFsobG9jLnRvLWxvYy5mcm9tKS8obGltaXRzLnpvb21fb3V0LTEpLCAobG9jLnRvLWxvYy5mcm9tKS9saW1pdHMuem9vbV9pbl0pXG5cdFx0ICAgICAgIC5vbihcInpvb21cIiwgX21vdmUpXG5cdFx0ICAgICApO1xuXHR9XG5cbiAgICB9O1xuXG4gICAgLy8gcmlnaHQvbGVmdC96b29tIHBhbnMgb3Igem9vbXMgdGhlIHRyYWNrLiBUaGVzZSBtZXRob2RzIGFyZSBleHBvc2VkIHRvIGFsbG93IGV4dGVybmFsIGJ1dHRvbnMsIGV0YyB0byBpbnRlcmFjdCB3aXRoIHRoZSB0cmFja3MuIFRoZSBhcmd1bWVudCBpcyB0aGUgYW1vdW50IG9mIHBhbm5pbmcvem9vbWluZyAoaWUuIDEuMiBtZWFucyAyMCUgcGFubmluZykgV2l0aCBsZWZ0L3JpZ2h0IG9ubHkgcG9zaXRpdmUgbnVtYmVycyBhcmUgYWxsb3dlZC5cbiAgICBhcGkubWV0aG9kICgnbW92ZV9yaWdodCcsIGZ1bmN0aW9uIChmYWN0b3IpIHtcblx0aWYgKGZhY3RvciA+IDApIHtcblx0ICAgIF9tYW51YWxfbW92ZShmYWN0b3IsIDEpO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnbW92ZV9sZWZ0JywgZnVuY3Rpb24gKGZhY3Rvcikge1xuXHRpZiAoZmFjdG9yID4gMCkge1xuXHQgICAgX21hbnVhbF9tb3ZlKGZhY3RvciwgLTEpO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnem9vbScsIGZ1bmN0aW9uIChmYWN0b3IpIHtcblx0X21hbnVhbF9tb3ZlKGZhY3RvciwgMCk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF90cmFja19ieV9pZCcsIGZ1bmN0aW9uIChpZCkge1xuXHRmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAodHJhY2tzW2ldLmlkKCkgPT09IGlkKSB7XG5cdFx0cmV0dXJuIHRyYWNrc1tpXTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Jlb3JkZXInLCBmdW5jdGlvbiAobmV3X3RyYWNrcykge1xuXHQvLyBUT0RPOiBUaGlzIGlzIGRlZmluaW5nIGEgbmV3IGhlaWdodCwgYnV0IHRoZSBnbG9iYWwgaGVpZ2h0IGlzIHVzZWQgdG8gZGVmaW5lIHRoZSBzaXplIG9mIHNldmVyYWxcblx0Ly8gcGFydHMuIFdlIHNob3VsZCBkbyB0aGlzIGR5bmFtaWNhbGx5XG5cblx0Zm9yICh2YXIgaj0wOyBqPG5ld190cmFja3MubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdGlmICh0cmFja3NbaV0uaWQoKSA9PT0gbmV3X3RyYWNrc1tqXS5pZCgpKSB7XG5cdFx0ICAgIGZvdW5kID0gdHJ1ZTtcblx0XHQgICAgdHJhY2tzLnNwbGljZShpLDEpO1xuXHRcdCAgICBicmVhaztcblx0XHR9XG5cdCAgICB9XG5cdCAgICBpZiAoIWZvdW5kKSB7XG5cdFx0X2luaXRfdHJhY2sobmV3X3RyYWNrc1tqXSk7XG5cdFx0X3VwZGF0ZV90cmFjayhuZXdfdHJhY2tzW2pdLCB7ZnJvbSA6IGxvYy5mcm9tLCB0byA6IGxvYy50b30pO1xuXHQgICAgfVxuXHR9XG5cblx0Zm9yICh2YXIgeD0wOyB4PHRyYWNrcy5sZW5ndGg7IHgrKykge1xuXHQgICAgdHJhY2tzW3hdLmcucmVtb3ZlKCk7XG5cdH1cblxuXHR0cmFja3MgPSBuZXdfdHJhY2tzO1xuXHRfcGxhY2VfdHJhY2tzKCk7XG5cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyZW1vdmVfdHJhY2snLCBmdW5jdGlvbiAodHJhY2spIHtcblx0dHJhY2suZy5yZW1vdmUoKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfdHJhY2snLCBmdW5jdGlvbiAodHJhY2spIHtcblx0aWYgKHRyYWNrIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFjay5sZW5ndGg7IGkrKykge1xuXHRcdHRyYWNrX3Zpcy5hZGRfdHJhY2sgKHRyYWNrW2ldKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB0cmFja192aXM7XG5cdH1cblx0dHJhY2tzLnB1c2godHJhY2spO1xuXHRyZXR1cm4gdHJhY2tfdmlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgndHJhY2tzJywgZnVuY3Rpb24gKG5ld190cmFja3MpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdHJhY2tzXG5cdH1cblx0dHJhY2tzID0gbmV3X3RyYWNrcztcblx0cmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9KTtcblxuICAgIC8vIFxuICAgIGFwaS5tZXRob2QgKCd3aWR0aCcsIGZ1bmN0aW9uICh3KSB7XG5cdC8vIFRPRE86IEFsbG93IHN1ZmZpeGVzIGxpa2UgXCIxMDAwcHhcIj9cblx0Ly8gVE9ETzogVGVzdCB3cm9uZyBmb3JtYXRzXG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHdpZHRoO1xuXHR9XG5cdC8vIEF0IGxlYXN0IG1pbi13aWR0aFxuXHRpZiAodyA8IG1pbl93aWR0aCkge1xuXHQgICAgdyA9IG1pbl93aWR0aFxuXHR9XG5cblx0Ly8gV2UgYXJlIHJlc2l6aW5nXG5cdGlmIChkaXZfaWQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCkuc2VsZWN0KFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3KTtcblx0ICAgIC8vIFJlc2l6ZSB0aGUgem9vbWluZy9wYW5uaW5nIHBhbmVcblx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQpLnN0eWxlKFwid2lkdGhcIiwgKHBhcnNlSW50KHcpICsgY2FwX3dpZHRoKjIpICsgXCJweFwiKTtcblx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl9wYW5lXCIpLmF0dHIoXCJ3aWR0aFwiLCB3KTtcblxuXHQgICAgLy8gUmVwbG90XG5cdCAgICB3aWR0aCA9IHc7XG5cdCAgICBwbG90KCk7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dHJhY2tzW2ldLmcuc2VsZWN0KFwicmVjdFwiKS5hdHRyKFwid2lkdGhcIiwgdyk7XG5cdFx0dHJhY2tzW2ldLmRpc3BsYXkoKS5yZXNldC5jYWxsKHRyYWNrc1tpXSk7XG5cdFx0dHJhY2tzW2ldLmRpc3BsYXkoKS51cGRhdGUuY2FsbCh0cmFja3NbaV0seFNjYWxlKTtcblx0ICAgIH1cblx0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgd2lkdGggPSB3O1xuXHR9XG5cdFxuXHRyZXR1cm4gdHJhY2tfdmlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnYWxsb3dfZHJhZycsIGZ1bmN0aW9uKGIpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZHJhZ19hbGxvd2VkO1xuXHR9XG5cdGRyYWdfYWxsb3dlZCA9IGI7XG5cdGlmIChkcmFnX2FsbG93ZWQpIHtcblx0ICAgIC8vIFdoZW4gdGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uIHRoZSBvYmplY3QgYmVmb3JlIHN0YXJ0aW5nIHRoZSBzaW11bGF0aW9uLCB3ZSBkb24ndCBoYXZlIGRlZmluZWQgeFNjYWxlXG5cdCAgICBpZiAoeFNjYWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRzdmdfZy5jYWxsKCB6b29tRXZlbnRIYW5kbGVyLngoeFNjYWxlKVxuXHRcdFx0ICAgLy8gLnhFeHRlbnQoWzAsIGxpbWl0cy5yaWdodF0pXG5cdFx0XHQgICAuc2NhbGVFeHRlbnQoWyhsb2MudG8tbG9jLmZyb20pLyhsaW1pdHMuem9vbV9vdXQtMSksIChsb2MudG8tbG9jLmZyb20pL2xpbWl0cy56b29tX2luXSlcblx0XHRcdCAgIC5vbihcInpvb21cIiwgX21vdmUpICk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICAvLyBXZSBjcmVhdGUgYSBuZXcgZHVtbXkgc2NhbGUgaW4geCB0byBhdm9pZCBkcmFnZ2luZyB0aGUgcHJldmlvdXMgb25lXG5cdCAgICAvLyBUT0RPOiBUaGVyZSBtYXkgYmUgYSBjaGVhcGVyIHdheSBvZiBkb2luZyB0aGlzP1xuXHQgICAgem9vbUV2ZW50SGFuZGxlci54KGQzLnNjYWxlLmxpbmVhcigpKS5vbihcInpvb21cIiwgbnVsbCk7XG5cdH1cblx0cmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9KTtcblxuICAgIHZhciBfcGxhY2VfdHJhY2tzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgaCA9IDA7XG5cdGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcblx0ICAgIGlmICh0cmFjay5nLmF0dHIoXCJ0cmFuc2Zvcm1cIikpIHtcblx0XHR0cmFjay5nXG5cdFx0ICAgIC50cmFuc2l0aW9uKClcblx0XHQgICAgLmR1cmF0aW9uKGR1cilcblx0XHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGggKyBcIilcIik7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHRyYWNrLmdcblx0XHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGggKyBcIilcIik7XG5cdCAgICB9XG5cblx0ICAgIGggKz0gdHJhY2suaGVpZ2h0KCk7XG5cdH1cblxuXHQvLyBzdmdcblx0c3ZnLmF0dHIoXCJoZWlnaHRcIiwgaCArIGhlaWdodF9vZmZzZXQpO1xuXG5cdC8vIGRpdlxuXHRkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkKVxuXHQgICAgLnN0eWxlKFwiaGVpZ2h0XCIsIChoICsgMTAgKyBoZWlnaHRfb2Zmc2V0KSArIFwicHhcIik7XG5cblx0Ly8gY2Fwc1xuXHRkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfNXBjYXBcIilcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGgpXG5cdCAgICAvLyAubW92ZV90b19mcm9udCgpXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdG1vdmVfdG9fZnJvbnQodGhpcyk7XG5cdCAgICB9KVxuXHRkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfM3BjYXBcIilcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGgpXG5cdC8vLm1vdmVfdG9fZnJvbnQoKVxuXHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG5cdFx0bW92ZV90b19mcm9udCh0aGlzKTtcblx0ICAgIH0pO1xuXHRcblxuXHQvLyBwYW5lXG5cdHBhbmVcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGggKyBoZWlnaHRfb2Zmc2V0KTtcblxuXHQvLyB0b29XaWRlX3RleHQuIFRPRE86IElzIHRoaXMgc3RpbGwgbmVlZGVkP1xuXHQvLyB2YXIgdG9vV2lkZV90ZXh0ID0gZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiX3Rvb1dpZGVcIik7XG5cdC8vIHZhciBiYiA9IHRvb1dpZGVfdGV4dFswXVswXS5nZXRCQm94KCk7XG5cdC8vIHRvb1dpZGVfdGV4dFxuXHQvLyAgICAgLmF0dHIoXCJ5XCIsIH5+KGgvMikgLSBiYi5oZWlnaHQvMik7XG5cblx0cmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9XG5cbiAgICB2YXIgX2luaXRfdHJhY2sgPSBmdW5jdGlvbiAodHJhY2spIHtcblx0dHJhY2suZyA9IHN2Zy5zZWxlY3QoXCJnXCIpLnNlbGVjdChcImdcIilcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyYWNrXCIpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKSk7XG5cblx0Ly8gUmVjdCBmb3IgdGhlIGJhY2tncm91bmQgY29sb3Jcblx0dHJhY2suZ1xuXHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCAwKVxuXHQgICAgLmF0dHIoXCJ5XCIsIDApXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIHRyYWNrX3Zpcy53aWR0aCgpKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkpXG5cdCAgICAuc3R5bGUoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKTtcblxuXHRpZiAodHJhY2suZGlzcGxheSgpKSB7XG5cdCAgICB0cmFjay5kaXNwbGF5KCkuaW5pdC5jYWxsKHRyYWNrLCB3aWR0aCk7XG5cdH1cblx0XG5cdHJldHVybiB0cmFja192aXM7XG4gICAgfTtcblxuICAgIHZhciBfbWFudWFsX21vdmUgPSBmdW5jdGlvbiAoZmFjdG9yLCBkaXJlY3Rpb24pIHtcblx0dmFyIG9sZERvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcblxuXHR2YXIgc3BhbiA9IG9sZERvbWFpblsxXSAtIG9sZERvbWFpblswXTtcblx0dmFyIG9mZnNldCA9IChzcGFuICogZmFjdG9yKSAtIHNwYW47XG5cblx0dmFyIG5ld0RvbWFpbjtcblx0c3dpdGNoIChkaXJlY3Rpb24pIHtcblx0Y2FzZSAtMSA6XG5cdCAgICBuZXdEb21haW4gPSBbKH5+b2xkRG9tYWluWzBdIC0gb2Zmc2V0KSwgfn4ob2xkRG9tYWluWzFdIC0gb2Zmc2V0KV07XG5cdCAgICBicmVhaztcblx0Y2FzZSAxIDpcblx0ICAgIG5ld0RvbWFpbiA9IFsofn5vbGREb21haW5bMF0gKyBvZmZzZXQpLCB+fihvbGREb21haW5bMV0gLSBvZmZzZXQpXTtcblx0ICAgIGJyZWFrO1xuXHRjYXNlIDAgOlxuXHQgICAgbmV3RG9tYWluID0gW29sZERvbWFpblswXSAtIH5+KG9mZnNldC8yKSwgb2xkRG9tYWluWzFdICsgKH5+b2Zmc2V0LzIpXTtcblx0fVxuXG5cdHZhciBpbnRlcnBvbGF0b3IgPSBkMy5pbnRlcnBvbGF0ZU51bWJlcihvbGREb21haW5bMF0sIG5ld0RvbWFpblswXSk7XG5cdHZhciBlYXNlID0gZXhwb3J0cy5lYXNlO1xuXG5cdHZhciB4ID0gMDtcblx0ZDMudGltZXIoZnVuY3Rpb24oKSB7XG5cdCAgICB2YXIgY3Vycl9zdGFydCA9IGludGVycG9sYXRvcihlYXNlKHgpKTtcblx0ICAgIHZhciBjdXJyX2VuZDtcblx0ICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG5cdCAgICBjYXNlIC0xIDpcblx0XHRjdXJyX2VuZCA9IGN1cnJfc3RhcnQgKyBzcGFuO1xuXHRcdGJyZWFrO1xuXHQgICAgY2FzZSAxIDpcblx0XHRjdXJyX2VuZCA9IGN1cnJfc3RhcnQgKyBzcGFuO1xuXHRcdGJyZWFrO1xuXHQgICAgY2FzZSAwIDpcblx0XHRjdXJyX2VuZCA9IG9sZERvbWFpblsxXSArIG9sZERvbWFpblswXSAtIGN1cnJfc3RhcnQ7XG5cdFx0YnJlYWs7XG5cdCAgICB9XG5cblx0ICAgIHZhciBjdXJyRG9tYWluID0gW2N1cnJfc3RhcnQsIGN1cnJfZW5kXTtcblx0ICAgIHhTY2FsZS5kb21haW4oY3VyckRvbWFpbik7XG5cdCAgICBfbW92ZSh4U2NhbGUpO1xuXHQgICAgeCs9MC4wMjtcblx0ICAgIHJldHVybiB4PjE7XG5cdH0pO1xuICAgIH07XG5cblxuICAgIHZhciBfbW92ZV9jYmFrID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgY3VyckRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcblx0dHJhY2tfdmlzLmZyb20ofn5jdXJyRG9tYWluWzBdKTtcblx0dHJhY2tfdmlzLnRvKH5+Y3VyckRvbWFpblsxXSk7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcblx0ICAgIF91cGRhdGVfdHJhY2sodHJhY2ssIGxvYyk7XG5cdH1cbiAgICB9O1xuICAgIC8vIFRoZSBkZWZlcnJlZF9jYmFrIGlzIGRlZmVycmVkIGF0IGxlYXN0IHRoaXMgYW1vdW50IG9mIHRpbWUgb3IgcmUtc2NoZWR1bGVkIGlmIGRlZmVycmVkIGlzIGNhbGxlZCBiZWZvcmVcbiAgICB2YXIgX2RlZmVycmVkID0gZGVmZXJDYW5jZWwoX21vdmVfY2JhaywgMzAwKTtcblxuICAgIC8vIGFwaS5tZXRob2QoJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBcdF9tb3ZlKCk7XG4gICAgLy8gfSk7XG5cbiAgICB2YXIgX21vdmUgPSBmdW5jdGlvbiAobmV3X3hTY2FsZSkge1xuXHRpZiAobmV3X3hTY2FsZSAhPT0gdW5kZWZpbmVkICYmIGRyYWdfYWxsb3dlZCkge1xuXHQgICAgem9vbUV2ZW50SGFuZGxlci54KG5ld194U2NhbGUpO1xuXHR9XG5cblx0Ly8gU2hvdyB0aGUgcmVkIGJhcnMgYXQgdGhlIGxpbWl0c1xuXHR2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuXHRpZiAoZG9tYWluWzBdIDw9IDUpIHtcblx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl81cGNhcFwiKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgY2FwX3dpZHRoKVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oMjAwKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgMCk7XG5cdH1cblxuXHRpZiAoZG9tYWluWzFdID49IChsaW1pdHMucmlnaHQpLTUpIHtcblx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl8zcGNhcFwiKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgY2FwX3dpZHRoKVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oMjAwKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgMCk7XG5cdH1cblxuXG5cdC8vIEF2b2lkIG1vdmluZyBwYXN0IHRoZSBsaW1pdHNcblx0aWYgKGRvbWFpblswXSA8IGxpbWl0cy5sZWZ0KSB7XG5cdCAgICB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZShbem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVswXSAtIHhTY2FsZShsaW1pdHMubGVmdCkgKyB4U2NhbGUucmFuZ2UoKVswXSwgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVsxXV0pO1xuXHR9IGVsc2UgaWYgKGRvbWFpblsxXSA+IGxpbWl0cy5yaWdodCkge1xuXHQgICAgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoW3pvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKClbMF0gLSB4U2NhbGUobGltaXRzLnJpZ2h0KSArIHhTY2FsZS5yYW5nZSgpWzFdLCB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZSgpWzFdXSk7XG5cdH1cblxuXHRfZGVmZXJyZWQoKTtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRyYWNrcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRyYWNrID0gdHJhY2tzW2ldO1xuXHQgICAgdHJhY2suZGlzcGxheSgpLm1vdmUuY2FsbCh0cmFjayx4U2NhbGUpO1xuXHR9XG4gICAgfTtcblxuICAgIC8vIGFwaS5tZXRob2Qoe1xuICAgIC8vIFx0YWxsb3dfZHJhZyA6IGFwaV9hbGxvd19kcmFnLFxuICAgIC8vIFx0d2lkdGggICAgICA6IGFwaV93aWR0aCxcbiAgICAvLyBcdGFkZF90cmFjayAgOiBhcGlfYWRkX3RyYWNrLFxuICAgIC8vIFx0cmVvcmRlciAgICA6IGFwaV9yZW9yZGVyLFxuICAgIC8vIFx0em9vbSAgICAgICA6IGFwaV96b29tLFxuICAgIC8vIFx0bGVmdCAgICAgICA6IGFwaV9sZWZ0LFxuICAgIC8vIFx0cmlnaHQgICAgICA6IGFwaV9yaWdodCxcbiAgICAvLyBcdHN0YXJ0ICAgICAgOiBhcGlfc3RhcnRcbiAgICAvLyB9KTtcblxuICAgIC8vIEF1eGlsaWFyIGZ1bmN0aW9uc1xuICAgIGZ1bmN0aW9uIG1vdmVfdG9fZnJvbnQgKGVsZW0pIHtcblx0ZWxlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhY2tfdmlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYm9hcmQ7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgZW5zZW1ibFJlc3RBUEkgPSByZXF1aXJlKFwidG50LmVuc2VtYmxcIik7XG5cbi8vIHZhciBib2FyZCA9IHt9O1xuLy8gYm9hcmQudHJhY2sgPSB7fTtcblxudmFyIGRhdGEgPSBmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgXyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgLy8gR2V0dGVycyAvIFNldHRlcnNcbiAgICBhcGlqcyAoXylcblx0LmdldHNldCAoJ2xhYmVsJywgXCJcIilcblx0LmdldHNldCAoJ2VsZW1lbnRzJywgW10pXG5cdC5nZXRzZXQgKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7fSk7XG5cblxuICAgIC8vIFRoZSByZXRyaWV2ZXJzLiBUaGV5IG5lZWQgdG8gYWNjZXNzICdlbGVtZW50cydcbiAgICBkYXRhLnJldHJpZXZlciA9IHt9O1xuXG4gICAgZGF0YS5yZXRyaWV2ZXIuc3luYyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgdXBkYXRlX3RyYWNrID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIC8vIE9iamVjdCBoYXMgYSBsb2NhdGlvbiBhbmQgYSBwbHVnLWluIGRlZmluZWQgY2FsbGJhY2tcbiAgICAgICAgICAgIF8uZWxlbWVudHModXBkYXRlX3RyYWNrLnJldHJpZXZlcigpKG9iai5sb2MpKTtcbiAgICAgICAgICAgIG9iai5vbl9zdWNjZXNzKCk7XG5cdH07XG5cblx0YXBpanMgKHVwZGF0ZV90cmFjaylcblx0ICAgIC5nZXRzZXQgKCdyZXRyaWV2ZXInLCBmdW5jdGlvbiAoKSB7fSlcblxuXHRyZXR1cm4gdXBkYXRlX3RyYWNrO1xuICAgIH07XG5cbiAgICBkYXRhLnJldHJpZXZlci5hc3luYyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHVybCA9ICcnO1xuXG5cdHZhciB1cGRhdGVfdHJhY2sgPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICBkMy5qc29uKHVybCwgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuXHRcdF8uZWxlbWVudHMocmVzcCk7XG5cdFx0b2JqLm9uX3N1Y2Nlc3MoKTtcblx0ICAgIH0pOyBcblx0fTtcblxuXHRhcGlqcyAodXBkYXRlX3RyYWNrKVxuXHQgICAgLmdldHNldCAoJ3VybCcsICcnKTtcblxuXHRyZXR1cm4gdXBkYXRlX3RyYWNrO1xuICAgIH07XG5cbiAgICBkYXRhLnJldHJpZXZlci5lbnNlbWJsID0gZnVuY3Rpb24oKSB7XG4gICAgXHR2YXIgc3VjY2VzcyA9IFtmdW5jdGlvbiAoKSB7fV07XG4gICAgXHR2YXIgZW5kcG9pbnQ7XG4gICAgXHR2YXIgZVJlc3QgPSBlbnNlbWJsUmVzdEFQSSgpO1xuICAgIFx0dmFyIHVwZGF0ZV90cmFjayA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgLy8gT2JqZWN0IGhhcyBsb2MgYW5kIGEgcGx1Zy1pbiBkZWZpbmVkIGNhbGxiYWNrXG4gICAgICAgICAgICB2YXIgbG9jICAgICAgICAgPSBvYmoubG9jO1xuICAgICAgICAgICAgdmFyIHBsdWdpbl9jYmFrID0gb2JqLm9uX3N1Y2Nlc3M7XG4gICAgICAgICAgICBlUmVzdC5jYWxsKHt1cmwgICAgIDogZVJlc3QudXJsW3VwZGF0ZV90cmFjay5lbmRwb2ludCgpXShsb2MpLFxuICAgIFx0XHRcdHN1Y2Nlc3MgOiBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uZWxlbWVudHMocmVzcCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVzZXItZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxzdWNjZXNzLmxlbmd0aDsgaSsrKSB7XG4gICAgXHRcdFx0XHRzdWNjZXNzW2ldKHJlc3ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsdWctaW4gZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbl9jYmFrKCk7XG4gICAgXHRcdFx0fVxuICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgIFx0fTtcblxuICAgIFx0YXBpanModXBkYXRlX3RyYWNrKVxuICAgIFx0ICAgIC5nZXRzZXQoJ2VuZHBvaW50Jyk7XG5cbiAgICAvLyBUT0RPOiBXZSBkb24ndCBoYXZlIGEgd2F5IG9mIHJlc2V0dGluZyB0aGUgc3VjY2VzcyBhcnJheVxuICAgIC8vIFRPRE86IFNob3VsZCB0aGlzIGFsc28gYmUgaW5jbHVkZWQgaW4gdGhlIHN5bmMgcmV0cmlldmVyP1xuICAgIC8vIFN0aWxsIG5vdCBzdXJlIHRoaXMgaXMgdGhlIGJlc3Qgb3B0aW9uIHRvIHN1cHBvcnQgbW9yZSB0aGFuIG9uZSBjYWxsYmFja1xuICAgIFx0dXBkYXRlX3RyYWNrLnN1Y2Nlc3MgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0XHRyZXR1cm4gc3VjY2VzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1Y2Nlc3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlX3RyYWNrO1xuICAgIFx0fTtcblxuICAgIFx0cmV0dXJuIHVwZGF0ZV90cmFjaztcbiAgICB9O1xuXG5cbiAgICByZXR1cm4gXztcbn07XG5cblxuLy8gQSBwcmVkZWZpbmVkIHRyYWNrIGZvciBnZW5lc1xuLy8gdG50LnRyYWNrLmRhdGEuZ2VuZSA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICB2YXIgdHJhY2sgPSB0bnQudHJhY2suZGF0YSgpO1xuLy8gXHQvLyAuaW5kZXgoXCJJRFwiKTtcblxuLy8gICAgIHZhciB1cGRhdGVyID0gdG50LnRyYWNrLnJldHJpZXZlci5lbnNlbWJsKClcbi8vIFx0LmVuZHBvaW50KFwicmVnaW9uXCIpXG4vLyAgICAgLy8gVE9ETzogSWYgc3VjY2VzcyBpcyBkZWZpbmVkIGhlcmUsIG1lYW5zIHRoYXQgaXQgY2FuJ3QgYmUgdXNlci1kZWZpbmVkXG4vLyAgICAgLy8gaXMgdGhhdCBnb29kPyBlbm91Z2g/IEFQST9cbi8vICAgICAvLyBVUERBVEU6IE5vdyBzdWNjZXNzIGlzIGJhY2tlZCB1cCBieSBhbiBhcnJheS4gU3RpbGwgZG9uJ3Qga25vdyBpZiB0aGlzIGlzIHRoZSBiZXN0IG9wdGlvblxuLy8gXHQuc3VjY2VzcyhmdW5jdGlvbihnZW5lcykge1xuLy8gXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW5lcy5sZW5ndGg7IGkrKykge1xuLy8gXHRcdGlmIChnZW5lc1tpXS5zdHJhbmQgPT09IC0xKSB7ICBcbi8vIFx0XHQgICAgZ2VuZXNbaV0uZGlzcGxheV9sYWJlbCA9IFwiPFwiICsgZ2VuZXNbaV0uZXh0ZXJuYWxfbmFtZTtcbi8vIFx0XHR9IGVsc2Uge1xuLy8gXHRcdCAgICBnZW5lc1tpXS5kaXNwbGF5X2xhYmVsID0gZ2VuZXNbaV0uZXh0ZXJuYWxfbmFtZSArIFwiPlwiO1xuLy8gXHRcdH1cbi8vIFx0ICAgIH1cbi8vIFx0fSk7XG5cbi8vICAgICByZXR1cm4gdHJhY2sudXBkYXRlKHVwZGF0ZXIpO1xuLy8gfVxuXG4vLyBBIHByZWRlZmluZWQgdHJhY2sgZGlzcGxheWluZyBubyBleHRlcm5hbCBkYXRhXG4vLyBpdCBpcyB1c2VkIGZvciBsb2NhdGlvbiBhbmQgYXhpcyB0cmFja3MgZm9yIGV4YW1wbGVcbmRhdGEuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRyYWNrID0gZGF0YSgpO1xuICAgIHZhciB1cGRhdGVyID0gZGF0YS5yZXRyaWV2ZXIuc3luYygpO1xuICAgIHRyYWNrLnVwZGF0ZSh1cGRhdGVyKTtcblxuICAgIHJldHVybiB0cmFjaztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGRhdGE7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgbGF5b3V0ID0gcmVxdWlyZShcIi4vbGF5b3V0LmpzXCIpO1xuXG4vLyBGRUFUVVJFIFZJU1xuLy8gdmFyIGJvYXJkID0ge307XG4vLyBib2FyZC50cmFjayA9IHt9O1xudmFyIHRudF9mZWF0dXJlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vLy8vLyBWYXJzIGV4cG9zZWQgaW4gdGhlIEFQSVxuICAgIHZhciBleHBvcnRzID0ge1xuXHRjcmVhdGUgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcImNyZWF0ZV9lbGVtIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIGZlYXR1cmUgb2JqZWN0XCJ9LFxuXHRtb3ZlciAgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcIm1vdmVfZWxlbSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBmZWF0dXJlIG9iamVjdFwifSxcblx0dXBkYXRlciAgOiBmdW5jdGlvbiAoKSB7fSxcblx0b25fY2xpY2sgOiBmdW5jdGlvbiAoKSB7fSxcblx0b25fbW91c2VvdmVyIDogZnVuY3Rpb24gKCkge30sXG5cdGd1aWRlciAgIDogZnVuY3Rpb24gKCkge30sXG5cdGluZGV4ICAgIDogdW5kZWZpbmVkLFxuXHRsYXlvdXQgICA6IGxheW91dC5pZGVudGl0eSgpLFxuXHRmb3JlZ3JvdW5kX2NvbG9yIDogJyMwMDAnXG4gICAgfTtcblxuXG4gICAgLy8gVGhlIHJldHVybmVkIG9iamVjdFxuICAgIHZhciBmZWF0dXJlID0ge307XG5cbiAgICB2YXIgcmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dHJhY2suZy5zZWxlY3RBbGwoXCIudG50X2VsZW1cIikucmVtb3ZlKCk7XG5cdHRyYWNrLmcuc2VsZWN0QWxsKFwiLnRudF9ndWlkZXJcIikucmVtb3ZlKCk7XG4gICAgfTtcblxuICAgIHZhciBpbml0ID0gZnVuY3Rpb24gKHdpZHRoKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdGV4cG9ydHMuZ3VpZGVyLmNhbGwodHJhY2ssIHdpZHRoKTtcbiAgICB9O1xuXG4gICAgdmFyIHBsb3QgPSBmdW5jdGlvbiAobmV3X2VsZW1zLCB0cmFjaywgeFNjYWxlKSB7XG5cdG5ld19lbGVtcy5vbihcImNsaWNrXCIsIGV4cG9ydHMub25fY2xpY2spO1xuXHRuZXdfZWxlbXMub24oXCJtb3VzZW92ZXJcIiwgZXhwb3J0cy5vbl9tb3VzZW92ZXIpO1xuXHQvLyBuZXdfZWxlbSBpcyBhIGcgZWxlbWVudCB3aGVyZSB0aGUgZmVhdHVyZSBpcyBpbnNlcnRlZFxuXHRleHBvcnRzLmNyZWF0ZS5jYWxsKHRyYWNrLCBuZXdfZWxlbXMsIHhTY2FsZSk7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAoeFNjYWxlLCBmaWVsZCkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHR2YXIgc3ZnX2cgPSB0cmFjay5nO1xuXHR2YXIgbGF5b3V0ID0gZXhwb3J0cy5sYXlvdXQ7XG5cblx0dmFyIGVsZW1lbnRzID0gdHJhY2suZGF0YSgpLmVsZW1lbnRzKCk7XG5cblx0aWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGVsZW1lbnRzID0gZWxlbWVudHNbZmllbGRdO1xuXHR9XG5cblx0bGF5b3V0KGVsZW1lbnRzLCB4U2NhbGUpO1xuXHR2YXIgZGF0YV9lbGVtcyA9IGxheW91dC5lbGVtZW50cygpO1xuXG5cdHZhciB2aXNfc2VsO1xuXHR2YXIgdmlzX2VsZW1zO1xuXHRpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgdmlzX3NlbCA9IHN2Z19nLnNlbGVjdEFsbChcIi50bnRfZWxlbV9cIiArIGZpZWxkKTtcblx0fSBlbHNlIHtcblx0ICAgIHZpc19zZWwgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1cIik7XG5cdH1cblxuXHRpZiAoZXhwb3J0cy5pbmRleCkgeyAvLyBJbmRleGluZyBieSBmaWVsZFxuXHQgICAgdmlzX2VsZW1zID0gdmlzX3NlbFxuXHRcdC5kYXRhKGRhdGFfZWxlbXMsIGZ1bmN0aW9uIChkKSB7XG5cdFx0ICAgIGlmIChkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBleHBvcnRzLmluZGV4KGQpO1xuXHRcdCAgICB9XG5cdFx0fSlcblx0fSBlbHNlIHsgLy8gSW5kZXhpbmcgYnkgcG9zaXRpb24gaW4gYXJyYXlcblx0ICAgIHZpc19lbGVtcyA9IHZpc19zZWxcblx0XHQuZGF0YShkYXRhX2VsZW1zKVxuXHR9XG5cblx0ZXhwb3J0cy51cGRhdGVyLmNhbGwodHJhY2ssIHZpc19lbGVtcywgeFNjYWxlKTtcblxuXHR2YXIgbmV3X2VsZW0gPSB2aXNfZWxlbXNcblx0ICAgIC5lbnRlcigpO1xuXG5cdG5ld19lbGVtXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9lbGVtXCIpXG5cdCAgICAuY2xhc3NlZChcInRudF9lbGVtX1wiICsgZmllbGQsIGZpZWxkKVxuXHQgICAgLmNhbGwoZmVhdHVyZS5wbG90LCB0cmFjaywgeFNjYWxlKTtcblxuXHR2aXNfZWxlbXNcblx0ICAgIC5leGl0KClcblx0ICAgIC5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgdmFyIG1vdmUgPSBmdW5jdGlvbiAoeFNjYWxlLCBmaWVsZCkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHR2YXIgc3ZnX2cgPSB0cmFjay5nO1xuXHR2YXIgZWxlbXM7XG5cdC8vIFRPRE86IElzIHNlbGVjdGluZyB0aGUgZWxlbWVudHMgdG8gbW92ZSB0b28gc2xvdz9cblx0Ly8gSXQgd291bGQgYmUgbmljZSB0byBwcm9maWxlXG5cdGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBlbGVtcyA9IHN2Z19nLnNlbGVjdEFsbChcIi50bnRfZWxlbV9cIiArIGZpZWxkKTtcblx0fSBlbHNlIHtcblx0ICAgIGVsZW1zID0gc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtXCIpO1xuXHR9XG5cblx0ZXhwb3J0cy5tb3Zlci5jYWxsKHRoaXMsIGVsZW1zLCB4U2NhbGUpO1xuICAgIH07XG5cbiAgICB2YXIgbW92ZV90b19mcm9udCA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgdmFyIHRyYWNrID0gdGhpcztcblx0ICAgIHZhciBzdmdfZyA9IHRyYWNrLmc7XG5cdCAgICBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1fXCIgKyBmaWVsZCkubW92ZV90b19mcm9udCgpO1xuXHR9XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlKVxuXHQuZ2V0c2V0IChleHBvcnRzKVxuXHQubWV0aG9kICh7XG5cdCAgICByZXNldCAgOiByZXNldCxcblx0ICAgIHBsb3QgICA6IHBsb3QsXG5cdCAgICB1cGRhdGUgOiB1cGRhdGUsXG5cdCAgICBtb3ZlICAgOiBtb3ZlLFxuXHQgICAgaW5pdCAgIDogaW5pdCxcblx0ICAgIG1vdmVfdG9fZnJvbnQgOiBtb3ZlX3RvX2Zyb250XG5cdH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5jb21wb3NpdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpc3BsYXlzID0ge307XG4gICAgdmFyIGRpc3BsYXlfb3JkZXIgPSBbXTtcblxuICAgIHZhciBmZWF0dXJlcyA9IHt9O1xuXG4gICAgdmFyIHJlc2V0ID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGlzcGxheXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGRpc3BsYXlzW2ldLnJlc2V0LmNhbGwodHJhY2spO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBpbml0ID0gZnVuY3Rpb24gKHdpZHRoKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG4gXHRmb3IgKHZhciBkaXNwbGF5IGluIGRpc3BsYXlzKSB7XG5cdCAgICBpZiAoZGlzcGxheXMuaGFzT3duUHJvcGVydHkoZGlzcGxheSkpIHtcblx0XHRkaXNwbGF5c1tkaXNwbGF5XS5pbml0LmNhbGwodHJhY2ssIHdpZHRoKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKHhTY2FsZSkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGlzcGxheV9vcmRlci5sZW5ndGg7IGkrKykge1xuXHQgICAgZGlzcGxheXNbZGlzcGxheV9vcmRlcltpXV0udXBkYXRlLmNhbGwodHJhY2ssIHhTY2FsZSwgZGlzcGxheV9vcmRlcltpXSk7XG5cdCAgICBkaXNwbGF5c1tkaXNwbGF5X29yZGVyW2ldXS5tb3ZlX3RvX2Zyb250LmNhbGwodHJhY2ssIGRpc3BsYXlfb3JkZXJbaV0pO1xuXHR9XG5cdC8vIGZvciAodmFyIGRpc3BsYXkgaW4gZGlzcGxheXMpIHtcblx0Ly8gICAgIGlmIChkaXNwbGF5cy5oYXNPd25Qcm9wZXJ0eShkaXNwbGF5KSkge1xuXHQvLyBcdGRpc3BsYXlzW2Rpc3BsYXldLnVwZGF0ZS5jYWxsKHRyYWNrLCB4U2NhbGUsIGRpc3BsYXkpO1xuXHQvLyAgICAgfVxuXHQvLyB9XG4gICAgfTtcblxuICAgIHZhciBtb3ZlID0gZnVuY3Rpb24gKHhTY2FsZSkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHRmb3IgKHZhciBkaXNwbGF5IGluIGRpc3BsYXlzKSB7XG5cdCAgICBpZiAoZGlzcGxheXMuaGFzT3duUHJvcGVydHkoZGlzcGxheSkpIHtcblx0XHRkaXNwbGF5c1tkaXNwbGF5XS5tb3ZlLmNhbGwodHJhY2ssIHhTY2FsZSwgZGlzcGxheSk7XG5cdCAgICB9XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGFkZCA9IGZ1bmN0aW9uIChrZXksIGRpc3BsYXkpIHtcblx0ZGlzcGxheXNba2V5XSA9IGRpc3BsYXk7XG5cdGRpc3BsYXlfb3JkZXIucHVzaChrZXkpO1xuXHRyZXR1cm4gZmVhdHVyZXM7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlcylcblx0Lm1ldGhvZCAoe1xuXHQgICAgcmVzZXQgIDogcmVzZXQsXG5cdCAgICB1cGRhdGUgOiB1cGRhdGUsXG5cdCAgICBtb3ZlICAgOiBtb3ZlLFxuXHQgICAgaW5pdCAgIDogaW5pdCxcblx0ICAgIGFkZCAgICA6IGFkZFxuXHR9KTtcblxuXG4gICAgcmV0dXJuIGZlYXR1cmVzO1xufTtcblxudG50X2ZlYXR1cmUuc2VxdWVuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gJ0luaGVyaXQnIGZyb20gdG50LnRyYWNrLmZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICB2YXIgY29uZmlnID0ge1xuXHRmb250c2l6ZSA6IDEwLFxuXHRzZXF1ZW5jZSA6IGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5zZXF1ZW5jZVxuXHR9XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAoZmVhdHVyZSlcblx0LmdldHNldCAoY29uZmlnKTtcblxuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChuZXdfbnRzLCB4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblxuXHRuZXdfbnRzXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC5zdHlsZSgnZm9udC1zaXplJywgY29uZmlnLmZvbnRzaXplICsgXCJweFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHhTY2FsZSAoZC5wb3MpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB+fih0cmFjay5oZWlnaHQoKSAvIDIpICsgNTsgXG5cdCAgICB9KVxuXHQgICAgLnRleHQoY29uZmlnLnNlcXVlbmNlKVxuXHQgICAgLnRyYW5zaXRpb24oKVxuXHQgICAgLmR1cmF0aW9uKDUwMClcblx0ICAgIC5hdHRyKCdmaWxsJywgZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlciAoZnVuY3Rpb24gKG50cywgeFNjYWxlKSB7XG5cdG50cy5zZWxlY3QgKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHhTY2FsZShkLnBvcyk7XG5cdCAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUuYXJlYSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlLmxpbmUoKTtcbiAgICB2YXIgbGluZSA9IHRudF9mZWF0dXJlLmxpbmUoKTtcblxuICAgIHZhciBhcmVhID0gZDMuc3ZnLmFyZWEoKVxuXHQuaW50ZXJwb2xhdGUobGluZS5pbnRlcnBvbGF0ZSgpKVxuXHQudGVuc2lvbihmZWF0dXJlLnRlbnNpb24oKSk7XG5cbiAgICB2YXIgZGF0YV9wb2ludHM7XG5cbiAgICB2YXIgbGluZV9jcmVhdGUgPSBmZWF0dXJlLmNyZWF0ZSgpOyAvLyBXZSAnc2F2ZScgbGluZSBjcmVhdGlvblxuICAgIGZlYXR1cmUuY3JlYXRlIChmdW5jdGlvbiAocG9pbnRzLCB4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblxuXHRpZiAoZGF0YV9wb2ludHMgIT09IHVuZGVmaW5lZCkge1xuLy9cdCAgICAgcmV0dXJuO1xuXHQgICAgdHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpLnJlbW92ZSgpO1xuXHR9XG5cblx0bGluZV9jcmVhdGUuY2FsbCh0cmFjaywgcG9pbnRzLCB4U2NhbGUpO1xuXG5cdGFyZWFcblx0ICAgIC54KGxpbmUueCgpKVxuXHQgICAgLnkxKGxpbmUueSgpKVxuXHQgICAgLnkwKHRyYWNrLmhlaWdodCgpKTtcblxuXHRkYXRhX3BvaW50cyA9IHBvaW50cy5kYXRhKCk7XG5cdHBvaW50cy5yZW1vdmUoKTtcblxuXHR0cmFjay5nXG5cdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9hcmVhXCIpXG5cdCAgICAuY2xhc3NlZChcInRudF9lbGVtXCIsIHRydWUpXG5cdCAgICAuZGF0dW0oZGF0YV9wb2ludHMpXG5cdCAgICAuYXR0cihcImRcIiwgYXJlYSlcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBkMy5yZ2IoZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpLmJyaWdodGVyKCkpO1xuXHRcbiAgICB9KTtcblxuICAgIHZhciBsaW5lX21vdmVyID0gZmVhdHVyZS5tb3ZlcigpO1xuICAgIGZlYXR1cmUubW92ZXIgKGZ1bmN0aW9uIChwYXRoLCB4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0bGluZV9tb3Zlci5jYWxsKHRyYWNrLCBwYXRoLCB4U2NhbGUpO1xuXG5cdGFyZWEueChsaW5lLngoKSk7XG5cdHRyYWNrLmdcblx0ICAgIC5zZWxlY3QoXCIudG50X2FyZWFcIilcblx0ICAgIC5kYXR1bShkYXRhX3BvaW50cylcblx0ICAgIC5hdHRyKFwiZFwiLCBhcmVhKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xuXG59O1xuXG50bnRfZmVhdHVyZS5saW5lID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUoKTtcblxuICAgIHZhciB4ID0gZnVuY3Rpb24gKGQpIHtcblx0cmV0dXJuIGQucG9zO1xuICAgIH07XG4gICAgdmFyIHkgPSBmdW5jdGlvbiAoZCkge1xuXHRyZXR1cm4gZC52YWw7XG4gICAgfTtcbiAgICB2YXIgdGVuc2lvbiA9IDAuNztcbiAgICB2YXIgeVNjYWxlID0gZDMuc2NhbGUubGluZWFyKCk7XG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG5cdC5pbnRlcnBvbGF0ZShcImJhc2lzXCIpO1xuXG4gICAgLy8gbGluZSBnZXR0ZXIuIFRPRE86IFNldHRlcj9cbiAgICBmZWF0dXJlLmxpbmUgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBsaW5lO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnggPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB4O1xuXHR9XG5cdHggPSBjYmFrO1xuXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS55ID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4geTtcblx0fVxuXHR5ID0gY2Jhaztcblx0cmV0dXJuIGZlYXR1cmU7XG4gICAgfTtcblxuICAgIGZlYXR1cmUudGVuc2lvbiA9IGZ1bmN0aW9uICh0KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHRlbnNpb247XG5cdH1cblx0dGVuc2lvbiA9IHQ7XG5cdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICB2YXIgZGF0YV9wb2ludHM7XG5cbiAgICAvLyBGb3Igbm93LCBjcmVhdGUgaXMgYSBvbmUtb2ZmIGV2ZW50XG4gICAgLy8gVE9ETzogTWFrZSBpdCB3b3JrIHdpdGggcGFydGlhbCBwYXRocywgaWUuIGNyZWF0aW5nIGFuZCBkaXNwbGF5aW5nIG9ubHkgdGhlIHBhdGggdGhhdCBpcyBiZWluZyBkaXNwbGF5ZWRcbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKHBvaW50cywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cblx0aWYgKGRhdGFfcG9pbnRzICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIC8vIHJldHVybjtcblx0ICAgIHRyYWNrLmcuc2VsZWN0KFwicGF0aFwiKS5yZW1vdmUoKTtcblx0fVxuXG5cdGxpbmVcblx0ICAgIC50ZW5zaW9uKHRlbnNpb24pXG5cdCAgICAueChmdW5jdGlvbiAoZCkge3JldHVybiB4U2NhbGUoeChkKSl9KVxuXHQgICAgLnkoZnVuY3Rpb24gKGQpIHtyZXR1cm4gdHJhY2suaGVpZ2h0KCkgLSB5U2NhbGUoeShkKSl9KVxuXG5cdGRhdGFfcG9pbnRzID0gcG9pbnRzLmRhdGEoKTtcblx0cG9pbnRzLnJlbW92ZSgpO1xuXG5cdHlTY2FsZVxuXHQgICAgLmRvbWFpbihbMCwgMV0pXG5cdCAgICAvLyAuZG9tYWluKFswLCBkMy5tYXgoZGF0YV9wb2ludHMsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICAvLyBcdHJldHVybiB5KGQpO1xuXHQgICAgLy8gfSldKVxuXHQgICAgLnJhbmdlKFswLCB0cmFjay5oZWlnaHQoKSAtIDJdKTtcblx0XG5cdHRyYWNrLmdcblx0ICAgIC5hcHBlbmQoXCJwYXRoXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2VsZW1cIilcblx0ICAgIC5hdHRyKFwiZFwiLCBsaW5lKGRhdGFfcG9pbnRzKSlcblx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCA0KVxuXHQgICAgLnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZXIgKGZ1bmN0aW9uIChwYXRoLCB4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblxuXHRsaW5lLngoZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiB4U2NhbGUoeChkKSlcblx0fSk7XG5cdHRyYWNrLmcuc2VsZWN0KFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJkXCIsIGxpbmUoZGF0YV9wb2ludHMpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUuY29uc2VydmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGZlYXR1cmUuYXJlYVxuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUuYXJlYSgpO1xuXG4gICAgdmFyIGFyZWFfY3JlYXRlID0gZmVhdHVyZS5jcmVhdGUoKTsgLy8gV2UgJ3NhdmUnIGFyZWEgY3JlYXRpb25cbiAgICBmZWF0dXJlLmNyZWF0ZSAgKGZ1bmN0aW9uIChwb2ludHMsIHhTY2FsZSkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXG5cdGFyZWFfY3JlYXRlLmNhbGwodHJhY2ssIGQzLnNlbGVjdChwb2ludHNbMF1bMF0pLCB4U2NhbGUpXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLmVuc2VtYmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gJ0luaGVyaXQnIGZyb20gYm9hcmQudHJhY2suZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUoKTtcblxuICAgIHZhciBmb3JlZ3JvdW5kX2NvbG9yMiA9IFwiIzdGRkYwMFwiO1xuICAgIHZhciBmb3JlZ3JvdW5kX2NvbG9yMyA9IFwiIzAwQkIwMFwiO1xuXG4gICAgZmVhdHVyZS5ndWlkZXIgKGZ1bmN0aW9uICh3aWR0aCkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHR2YXIgaGVpZ2h0X29mZnNldCA9IH5+KHRyYWNrLmhlaWdodCgpIC0gKHRyYWNrLmhlaWdodCgpICAqIC44KSkgLyAyO1xuXG5cdHRyYWNrLmdcblx0ICAgIC5hcHBlbmQoXCJsaW5lXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2d1aWRlclwiKVxuXHQgICAgLmF0dHIoXCJ4MVwiLCAwKVxuXHQgICAgLmF0dHIoXCJ4MlwiLCB3aWR0aClcblx0ICAgIC5hdHRyKFwieTFcIiwgaGVpZ2h0X29mZnNldClcblx0ICAgIC5hdHRyKFwieTJcIiwgaGVpZ2h0X29mZnNldClcblx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxKTtcblxuXHR0cmFjay5nXG5cdCAgICAuYXBwZW5kKFwibGluZVwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ndWlkZXJcIilcblx0ICAgIC5hdHRyKFwieDFcIiwgMClcblx0ICAgIC5hdHRyKFwieDJcIiwgd2lkdGgpXG5cdCAgICAuYXR0cihcInkxXCIsIHRyYWNrLmhlaWdodCgpIC0gaGVpZ2h0X29mZnNldClcblx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkgLSBoZWlnaHRfb2Zmc2V0KVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpKVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cblx0dmFyIGhlaWdodF9vZmZzZXQgPSB+fih0cmFjay5oZWlnaHQoKSAtICh0cmFjay5oZWlnaHQoKSAgKiAuOCkpIC8gMjtcblxuXHRuZXdfZWxlbXNcblx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlIChkLnN0YXJ0KTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInlcIiwgaGVpZ2h0X29mZnNldClcbi8vIFx0ICAgIC5hdHRyKFwicnhcIiwgMylcbi8vIFx0ICAgIC5hdHRyKFwicnlcIiwgMylcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHRyYWNrLmhlaWdodCgpIC0gfn4oaGVpZ2h0X29mZnNldCAqIDIpKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbig1MDApXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHsgXG5cdFx0aWYgKGQudHlwZSA9PT0gJ2hpZ2gnKSB7XG5cdFx0ICAgIHJldHVybiBkMy5yZ2IoZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpO1xuXHRcdH1cblx0XHRpZiAoZC50eXBlID09PSAnbG93Jykge1xuXHRcdCAgICByZXR1cm4gZDMucmdiKGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcjIoKSk7XG5cdFx0fVxuXHRcdHJldHVybiBkMy5yZ2IoZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yMygpKTtcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS51cGRhdGVyIChmdW5jdGlvbiAoYmxvY2tzLCB4U2NhbGUpIHtcblx0YmxvY2tzXG5cdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSlcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlciAoZnVuY3Rpb24gKGJsb2NrcywgeFNjYWxlKSB7XG5cdGJsb2Nrc1xuXHQgICAgLnNlbGVjdChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG5cdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcjIgPSBmdW5jdGlvbiAoY29sKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGZvcmVncm91bmRfY29sb3IyO1xuXHR9XG5cdGZvcmVncm91bmRfY29sb3IyID0gY29sO1xuXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yMyA9IGZ1bmN0aW9uIChjb2wpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZm9yZWdyb3VuZF9jb2xvcjM7XG5cdH1cblx0Zm9yZWdyb3VuZF9jb2xvcjMgPSBjb2w7XG5cdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLnZsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdG5ld19lbGVtc1xuXHQgICAgLmFwcGVuZCAoXCJsaW5lXCIpXG5cdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0Ly8gVE9ETzogU2hvdWxkIHVzZSB0aGUgaW5kZXggdmFsdWU/XG5cdFx0cmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpXG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKVxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieTFcIiwgMClcblx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkpXG5cdCAgICAuYXR0cihcInN0cm9rZVwiLCBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlciAoZnVuY3Rpb24gKHZsaW5lcywgeFNjYWxlKSB7XG5cdHZsaW5lc1xuXHQgICAgLnNlbGVjdChcImxpbmVcIilcblx0ICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKGZlYXR1cmUuaW5kZXgoKShkKSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKTtcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG5cbn07XG5cbnRudF9mZWF0dXJlLmJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGJvYXJkLnRyYWNrLmZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICBhcGlqcyhmZWF0dXJlKVxuXHQuZ2V0c2V0KCdmcm9tJywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBkLnN0YXJ0O1xuXHR9KVxuXHQuZ2V0c2V0KCd0bycsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5lbmQ7XG5cdH0pO1xuXG4gICAgZmVhdHVyZS5jcmVhdGUoZnVuY3Rpb24gKG5ld19lbGVtcywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdG5ld19lbGVtc1xuXHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuXHRcdC8vIFRPRE86IHN0YXJ0LCBlbmQgc2hvdWxkIGJlIGFkanVzdGFibGUgdmlhIHRoZSB0cmFja3MgQVBJXG5cdFx0cmV0dXJuIHhTY2FsZShmZWF0dXJlLmZyb20oKShkLCBpKSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIDApXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG5cdFx0cmV0dXJuICh4U2NhbGUoZmVhdHVyZS50bygpKGQsIGkpKSAtIHhTY2FsZShmZWF0dXJlLmZyb20oKShkLCBpKSkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHRyYWNrLmhlaWdodCgpKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbig1MDApXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5jb2xvciA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybiBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gZC5jb2xvcjtcblx0XHR9XG5cdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUudXBkYXRlcihmdW5jdGlvbiAoZWxlbXMsIHhTY2FsZSkge1xuXHRlbGVtc1xuXHQgICAgLnNlbGVjdChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmVyKGZ1bmN0aW9uIChibG9ja3MsIHhTY2FsZSkge1xuXHRibG9ja3Ncblx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKGQuc3RhcnQpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcblxufTtcblxudG50X2ZlYXR1cmUuYXhpcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeEF4aXM7XG4gICAgdmFyIG9yaWVudGF0aW9uID0gXCJ0b3BcIjtcblxuICAgIC8vIEF4aXMgZG9lc24ndCBpbmhlcml0IGZyb20gZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0ge307XG4gICAgZmVhdHVyZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcblx0eEF4aXMgPSB1bmRlZmluZWQ7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdHRyYWNrLmcuc2VsZWN0QWxsKFwicmVjdFwiKS5yZW1vdmUoKTtcblx0dHJhY2suZy5zZWxlY3RBbGwoXCIudGlja1wiKS5yZW1vdmUoKTtcbiAgICB9O1xuICAgIGZlYXR1cmUucGxvdCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUubW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0dmFyIHN2Z19nID0gdHJhY2suZztcblx0c3ZnX2cuY2FsbCh4QXhpcyk7XG4gICAgfVxuICAgIFxuICAgIGZlYXR1cmUuaW5pdCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgZmVhdHVyZS51cGRhdGUgPSBmdW5jdGlvbiAoeFNjYWxlKSB7XG5cdC8vIENyZWF0ZSBBeGlzIGlmIGl0IGRvZXNuJ3QgZXhpc3Rcblx0aWYgKHhBeGlzID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuXHRcdC5zY2FsZSh4U2NhbGUpXG5cdFx0Lm9yaWVudChvcmllbnRhdGlvbik7XG5cdH1cblxuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHR2YXIgc3ZnX2cgPSB0cmFjay5nO1xuXHRzdmdfZy5jYWxsKHhBeGlzKTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS5vcmllbnRhdGlvbiA9IGZ1bmN0aW9uIChwb3MpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gb3JpZW50YXRpb247XG5cdH1cblx0b3JpZW50YXRpb24gPSBwb3M7XG5cdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLmxvY2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByb3c7XG5cbiAgICB2YXIgZmVhdHVyZSA9IHt9O1xuICAgIGZlYXR1cmUucmVzZXQgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBmZWF0dXJlLnBsb3QgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBmZWF0dXJlLmluaXQgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBmZWF0dXJlLm1vdmUgPSBmdW5jdGlvbih4U2NhbGUpIHtcblx0dmFyIGRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcblx0cm93LnNlbGVjdChcInRleHRcIilcblx0ICAgIC50ZXh0KFwiTG9jYXRpb246IFwiICsgfn5kb21haW5bMF0gKyBcIi1cIiArIH5+ZG9tYWluWzFdKTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS51cGRhdGUgPSBmdW5jdGlvbiAoeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdHZhciBzdmdfZyA9IHRyYWNrLmc7XG5cdHZhciBkb21haW4gPSB4U2NhbGUuZG9tYWluKCk7XG5cdGlmIChyb3cgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcm93ID0gc3ZnX2c7XG5cdCAgICByb3dcblx0XHQuYXBwZW5kKFwidGV4dFwiKVxuXHRcdC50ZXh0KFwiTG9jYXRpb246IFwiICsgfn5kb21haW5bMF0gKyBcIi1cIiArIH5+ZG9tYWluWzFdKTtcblx0fVxuICAgIH07XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRudF9mZWF0dXJlO1xuIiwidmFyIGJvYXJkID0gcmVxdWlyZSAoXCIuL2JvYXJkLmpzXCIpO1xuYm9hcmQudHJhY2sgPSByZXF1aXJlIChcIi4vdHJhY2tcIik7XG5ib2FyZC50cmFjay5kYXRhID0gcmVxdWlyZSAoXCIuL2RhdGEuanNcIik7XG5ib2FyZC50cmFjay5sYXlvdXQgPSByZXF1aXJlIChcIi4vbGF5b3V0LmpzXCIpO1xuYm9hcmQudHJhY2suZmVhdHVyZSA9IHJlcXVpcmUgKFwiLi9mZWF0dXJlLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBib2FyZDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcblxuLy8gdmFyIGJvYXJkID0ge307XG4vLyBib2FyZC50cmFjayA9IHt9O1xubGF5b3V0ID0ge307XG5cbmxheW91dC5pZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyB2YXJzIGV4cG9zZWQgaW4gdGhlIEFQSTpcbiAgICB2YXIgZWxlbWVudHM7XG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgY2xvc3VyZSAvIG9iamVjdFxuICAgIHZhciBsID0gZnVuY3Rpb24gKG5ld19lbGVtZW50cykge1xuXHRlbGVtZW50cyA9IG5ld19lbGVtZW50cztcbiAgICB9XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGwpXG5cdC5tZXRob2QgKHtcblx0ICAgIGhlaWdodCAgIDogZnVuY3Rpb24gKCkge30sXG5cdCAgICBlbGVtZW50cyA6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gZWxlbWVudHM7XG5cdCAgICB9XG5cdH0pO1xuXG4gICAgcmV0dXJuIGw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBsYXlvdXQ7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG4vL3ZhciBib2FyZCA9IHt9O1xuXG52YXIgdHJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgcmVhZF9jb25mID0ge1xuXHQvLyBVbmlxdWUgSUQgZm9yIHRoaXMgdHJhY2tcblx0aWQgOiB0cmFjay5pZCgpXG4gICAgfTtcblxuICAgIHZhciBkaXNwbGF5O1xuXG4gICAgdmFyIGNvbmYgPSB7XG5cdC8vIGZvcmVncm91bmRfY29sb3IgOiBkMy5yZ2IoJyMwMDAwMDAnKSxcblx0YmFja2dyb3VuZF9jb2xvciA6IGQzLnJnYignI0NDQ0NDQycpLFxuXHRoZWlnaHQgICAgICAgICAgIDogMjUwLFxuXHQvLyBkYXRhIGlzIHRoZSBvYmplY3QgKG5vcm1hbGx5IGEgdG50LnRyYWNrLmRhdGEgb2JqZWN0KSB1c2VkIHRvIHJldHJpZXZlIGFuZCB1cGRhdGUgZGF0YSBmb3IgdGhlIHRyYWNrXG5cdGRhdGEgICAgICAgICAgICAgOiB0cmFjay5kYXRhLmVtcHR5KClcbiAgICB9O1xuXG4gICAgLy8gVGhlIHJldHVybmVkIG9iamVjdCAvIGNsb3N1cmVcbiAgICB2YXIgXyA9IGZ1bmN0aW9uKCkge1xuICAgIH07XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKF8pXG5cdC5nZXRzZXQgKGNvbmYpXG5cdC5nZXQgKHJlYWRfY29uZik7XG5cbiAgICAvLyBUT0RPOiBUaGlzIG1lYW5zIHRoYXQgaGVpZ2h0IHNob3VsZCBiZSBkZWZpbmVkIGJlZm9yZSBkaXNwbGF5XG4gICAgLy8gd2Ugc2hvdWxkbid0IHJlbHkgb24gdGhpc1xuICAgIF8uZGlzcGxheSA9IGZ1bmN0aW9uIChuZXdfcGxvdHRlcikge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkaXNwbGF5O1xuXHR9XG5cdGRpc3BsYXkgPSBuZXdfcGxvdHRlcjtcblx0aWYgKHR5cGVvZiAoZGlzcGxheSkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIGRpc3BsYXkubGF5b3V0ICYmIGRpc3BsYXkubGF5b3V0KCkuaGVpZ2h0KGNvbmYuaGVpZ2h0KTtcdCAgICBcblx0fSBlbHNlIHtcblx0ICAgIGZvciAodmFyIGtleSBpbiBkaXNwbGF5KSB7XG5cdFx0aWYgKGRpc3BsYXkuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdCAgICBkaXNwbGF5W2tleV0ubGF5b3V0ICYmIGRpc3BsYXlba2V5XS5sYXlvdXQoKS5oZWlnaHQoY29uZi5oZWlnaHQpO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuXG5cdHJldHVybiBfO1xuICAgIH07XG5cbiAgICByZXR1cm4gXztcblxufTtcblxudHJhY2suaWQgPSBpdGVyYXRvcigxKTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJhY2s7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRudF9lbnNlbWJsID0gcmVxdWlyZShcIi4vc3JjL3Jlc3QuanNcIik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZXNwb25zZSA9IHJlcXVpcmUoJy4vcmVzcG9uc2UnKTtcblxuZnVuY3Rpb24gUmVxdWVzdEVycm9yKG1lc3NhZ2UsIHByb3BzKSB7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICBlcnIubmFtZSA9ICdSZXF1ZXN0RXJyb3InO1xuICAgIHRoaXMubmFtZSA9IGVyci5uYW1lO1xuICAgIHRoaXMubWVzc2FnZSA9IGVyci5tZXNzYWdlO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgICAgdGhpcy5zdGFjayA9IGVyci5zdGFjaztcbiAgICB9XG5cbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXNzYWdlO1xuICAgIH07XG5cbiAgICBmb3IgKHZhciBrIGluIHByb3BzKSB7XG4gICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgdGhpc1trXSA9IHByb3BzW2tdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5SZXF1ZXN0RXJyb3IucHJvdG90eXBlID0gRXJyb3IucHJvdG90eXBlO1xuXG5SZXF1ZXN0RXJyb3IuY3JlYXRlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHJlcSwgcHJvcHMpIHtcbiAgICB2YXIgZXJyID0gbmV3IFJlcXVlc3RFcnJvcihtZXNzYWdlLCBwcm9wcyk7XG4gICAgUmVzcG9uc2UuY2FsbChlcnIsIHJlcSk7XG4gICAgcmV0dXJuIGVycjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVxdWVzdEVycm9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaSxcbiAgICBjbGVhblVSTCA9IHJlcXVpcmUoJy4uL3BsdWdpbnMvY2xlYW51cmwnKSxcbiAgICBYSFIgPSByZXF1aXJlKCcuL3hocicpLFxuICAgIGRlbGF5ID0gcmVxdWlyZSgnLi91dGlscy9kZWxheScpLFxuICAgIGNyZWF0ZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpLmNyZWF0ZSxcbiAgICBSZXNwb25zZSA9IHJlcXVpcmUoJy4vcmVzcG9uc2UnKSxcbiAgICBSZXF1ZXN0ID0gcmVxdWlyZSgnLi9yZXF1ZXN0JyksXG4gICAgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQnKSxcbiAgICBvbmNlID0gcmVxdWlyZSgnLi91dGlscy9vbmNlJyk7XG5cbmZ1bmN0aW9uIGZhY3RvcnkoZGVmYXVsdHMsIHBsdWdpbnMpIHtcbiAgICBkZWZhdWx0cyA9IGRlZmF1bHRzIHx8IHt9O1xuICAgIHBsdWdpbnMgPSBwbHVnaW5zIHx8IFtdO1xuXG4gICAgZnVuY3Rpb24gaHR0cChyZXEsIGNiKSB7XG4gICAgICAgIHZhciB4aHIsIHBsdWdpbiwgZG9uZSwgaywgdGltZW91dElkO1xuXG4gICAgICAgIHJlcSA9IG5ldyBSZXF1ZXN0KGV4dGVuZChkZWZhdWx0cywgcmVxKSk7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHBsdWdpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBsdWdpbiA9IHBsdWdpbnNbaV07XG4gICAgICAgICAgICBpZiAocGx1Z2luLnByb2Nlc3NSZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgcGx1Z2luLnByb2Nlc3NSZXF1ZXN0KHJlcSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHaXZlIHRoZSBwbHVnaW5zIGEgY2hhbmNlIHRvIGNyZWF0ZSB0aGUgWEhSIG9iamVjdFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGx1Z2lucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcGx1Z2luID0gcGx1Z2luc1tpXTtcbiAgICAgICAgICAgIGlmIChwbHVnaW4uY3JlYXRlWEhSKSB7XG4gICAgICAgICAgICAgICAgeGhyID0gcGx1Z2luLmNyZWF0ZVhIUihyZXEpO1xuICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBGaXJzdCBjb21lLCBmaXJzdCBzZXJ2ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHhociA9IHhociB8fCBuZXcgWEhSKCk7XG5cbiAgICAgICAgcmVxLnhociA9IHhocjtcblxuICAgICAgICAvLyBCZWNhdXNlIFhIUiBjYW4gYmUgYW4gWE1MSHR0cFJlcXVlc3Qgb3IgYW4gWERvbWFpblJlcXVlc3QsIHdlIGFkZFxuICAgICAgICAvLyBgb25yZWFkeXN0YXRlY2hhbmdlYCwgYG9ubG9hZGAsIGFuZCBgb25lcnJvcmAgY2FsbGJhY2tzLiBXZSB1c2UgdGhlXG4gICAgICAgIC8vIGBvbmNlYCB1dGlsIHRvIG1ha2Ugc3VyZSB0aGF0IG9ubHkgb25lIGlzIGNhbGxlZCAoYW5kIGl0J3Mgb25seSBjYWxsZWRcbiAgICAgICAgLy8gb25lIHRpbWUpLlxuICAgICAgICBkb25lID0gb25jZShkZWxheShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgICAgIHhoci5vbmxvYWQgPSB4aHIub25lcnJvciA9IHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB4aHIub250aW1lb3V0ID0geGhyLm9ucHJvZ3Jlc3MgPSBudWxsO1xuICAgICAgICAgICAgdmFyIHJlcyA9IGVyciAmJiBlcnIuaXNIdHRwRXJyb3IgPyBlcnIgOiBuZXcgUmVzcG9uc2UocmVxKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBwbHVnaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGx1Z2luID0gcGx1Z2luc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAocGx1Z2luLnByb2Nlc3NSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBwbHVnaW4ucHJvY2Vzc1Jlc3BvbnNlKHJlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChyZXEub25lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXEub25lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlcS5vbmxvYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9ubG9hZChyZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgIGNiKGVyciwgcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHJlcXVlc3QgY29tcGxldGVzLCBjb250aW51ZS5cbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChyZXEudGltZWRPdXQpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKHJlcS5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgZG9uZShjcmVhdGVFcnJvcignUmVxdWVzdCBhYm9ydGVkJywgcmVxLCB7bmFtZTogJ0Fib3J0J30pKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IE1hdGguZmxvb3IoeGhyLnN0YXR1cyAvIDEwMCk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeGhyLnN0YXR1cyA9PT0gNDA0ICYmICFyZXEuZXJyb3JPbjQwNCkge1xuICAgICAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtpbmQ7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQgPSAnQ2xpZW50JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kID0gJ1NlcnZlcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQgPSAnSFRUUCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IGtpbmQgKyAnIEVycm9yOiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdUaGUgc2VydmVyIHJldHVybmVkIGEgc3RhdHVzIG9mICcgKyB4aHIuc3RhdHVzICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgZm9yIHRoZSByZXF1ZXN0IFwiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEubWV0aG9kLnRvVXBwZXJDYXNlKCkgKyAnICcgKyByZXEudXJsICsgJ1wiJztcbiAgICAgICAgICAgICAgICAgICAgZG9uZShjcmVhdGVFcnJvcihtc2csIHJlcSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBgb25sb2FkYCBpcyBvbmx5IGNhbGxlZCBvbiBzdWNjZXNzIGFuZCwgaW4gSUUsIHdpbGwgYmUgY2FsbGVkIHdpdGhvdXRcbiAgICAgICAgLy8gYHhoci5zdGF0dXNgIGhhdmluZyBiZWVuIHNldCwgc28gd2UgZG9uJ3QgY2hlY2sgaXQuXG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7IGRvbmUoKTsgfTtcblxuICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRvbmUoY3JlYXRlRXJyb3IoJ0ludGVybmFsIFhIUiBFcnJvcicsIHJlcSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIElFIHNvbWV0aW1lcyBmYWlscyBpZiB5b3UgZG9uJ3Qgc3BlY2lmeSBldmVyeSBoYW5kbGVyLlxuICAgICAgICAvLyBTZWUgaHR0cDovL3NvY2lhbC5tc2RuLm1pY3Jvc29mdC5jb20vRm9ydW1zL2llL2VuLVVTLzMwZWYzYWRkLTc2N2MtNDQzNi1iOGE5LWYxY2ExOWI0ODEyZS9pZTktcnRtLXhkb21haW5yZXF1ZXN0LWlzc3VlZC1yZXF1ZXN0cy1tYXktYWJvcnQtaWYtYWxsLWV2ZW50LWhhbmRsZXJzLW5vdC1zcGVjaWZpZWQ/Zm9ydW09aWV3ZWJkZXZlbG9wbWVudFxuICAgICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24gKCkgeyAvKiBub29wICovIH07XG4gICAgICAgIHhoci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKCkgeyAvKiBub29wICovIH07XG5cbiAgICAgICAgeGhyLm9wZW4ocmVxLm1ldGhvZCwgcmVxLnVybCk7XG5cbiAgICAgICAgaWYgKHJlcS50aW1lb3V0KSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSB1c2UgdGhlIG5vcm1hbCBYSFIgdGltZW91dCBtZWNoYW5pc20gKGB4aHIudGltZW91dGAgYW5kXG4gICAgICAgICAgICAvLyBgeGhyLm9udGltZW91dGApLCBgb25yZWFkeXN0YXRlY2hhbmdlYCB3aWxsIGJlIHRyaWdnZXJlZCBiZWZvcmVcbiAgICAgICAgICAgIC8vIGBvbnRpbWVvdXRgLiBUaGVyZSdzIG5vIHdheSB0byByZWNvZ25pemUgdGhhdCBpdCB3YXMgdHJpZ2dlcmVkIGJ5XG4gICAgICAgICAgICAvLyBhIHRpbWVvdXQsIGFuZCB3ZSdkIGJlIHVuYWJsZSB0byBkaXNwYXRjaCB0aGUgcmlnaHQgZXJyb3IuXG4gICAgICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXEudGltZWRPdXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRvbmUoY3JlYXRlRXJyb3IoJ1JlcXVlc3QgdGltZW91dCcsIHJlcSwge25hbWU6ICdUaW1lb3V0J30pKTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHt9XG4gICAgICAgICAgICB9LCByZXEudGltZW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGsgaW4gcmVxLmhlYWRlcnMpIHtcbiAgICAgICAgICAgIGlmIChyZXEuaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGssIHJlcS5oZWFkZXJzW2tdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHhoci5zZW5kKHJlcS5ib2R5KTtcblxuICAgICAgICByZXR1cm4gcmVxO1xuICAgIH1cblxuICAgIHZhciBtZXRob2QsXG4gICAgICAgIG1ldGhvZHMgPSBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdoZWFkJywgJ3BhdGNoJywgJ2RlbGV0ZSddLFxuICAgICAgICB2ZXJiID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXEsIGNiKSB7XG4gICAgICAgICAgICAgICAgcmVxID0gbmV3IFJlcXVlc3QocmVxKTtcbiAgICAgICAgICAgICAgICByZXEubWV0aG9kID0gbWV0aG9kO1xuICAgICAgICAgICAgICAgIHJldHVybiBodHRwKHJlcSwgY2IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbWV0aG9kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtZXRob2QgPSBtZXRob2RzW2ldO1xuICAgICAgICBodHRwW21ldGhvZF0gPSB2ZXJiKG1ldGhvZCk7XG4gICAgfVxuXG4gICAgaHR0cC5wbHVnaW5zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcGx1Z2lucztcbiAgICB9O1xuXG4gICAgaHR0cC5kZWZhdWx0cyA9IGZ1bmN0aW9uIChuZXdWYWx1ZXMpIHtcbiAgICAgICAgaWYgKG5ld1ZhbHVlcykge1xuICAgICAgICAgICAgcmV0dXJuIGZhY3RvcnkoZXh0ZW5kKGRlZmF1bHRzLCBuZXdWYWx1ZXMpLCBwbHVnaW5zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfTtcblxuICAgIGh0dHAudXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmV3UGx1Z2lucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgIHJldHVybiBmYWN0b3J5KGRlZmF1bHRzLCBwbHVnaW5zLmNvbmNhdChuZXdQbHVnaW5zKSk7XG4gICAgfTtcblxuICAgIGh0dHAuYmFyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgICB9O1xuXG4gICAgaHR0cC5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgICBodHRwLlJlc3BvbnNlID0gUmVzcG9uc2U7XG5cbiAgICByZXR1cm4gaHR0cDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHt9LCBbY2xlYW5VUkxdKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gUmVxdWVzdChvcHRzT3JVcmwpIHtcbiAgICB2YXIgb3B0cyA9IHR5cGVvZiBvcHRzT3JVcmwgPT09ICdzdHJpbmcnID8ge3VybDogb3B0c09yVXJsfSA6IG9wdHNPclVybCB8fCB7fTtcbiAgICB0aGlzLm1ldGhvZCA9IG9wdHMubWV0aG9kID8gb3B0cy5tZXRob2QudG9VcHBlckNhc2UoKSA6ICdHRVQnO1xuICAgIHRoaXMudXJsID0gb3B0cy51cmw7XG4gICAgdGhpcy5oZWFkZXJzID0gb3B0cy5oZWFkZXJzIHx8IHt9O1xuICAgIHRoaXMuYm9keSA9IG9wdHMuYm9keTtcbiAgICB0aGlzLnRpbWVvdXQgPSBvcHRzLnRpbWVvdXQgfHwgMDtcbiAgICB0aGlzLmVycm9yT240MDQgPSBvcHRzLmVycm9yT240MDQgIT0gbnVsbCA/IG9wdHMuZXJyb3JPbjQwNCA6IHRydWU7XG4gICAgdGhpcy5vbmxvYWQgPSBvcHRzLm9ubG9hZDtcbiAgICB0aGlzLm9uZXJyb3IgPSBvcHRzLm9uZXJyb3I7XG59XG5cblJlcXVlc3QucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmFib3J0ZWQpIHJldHVybjtcbiAgICB0aGlzLmFib3J0ZWQgPSB0cnVlO1xuICAgIHRoaXMueGhyLmFib3J0KCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5oZWFkZXIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgaztcbiAgICBmb3IgKGsgaW4gdGhpcy5oZWFkZXJzKSB7XG4gICAgICAgIGlmICh0aGlzLmhlYWRlcnMuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkgPT09IGsudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhlYWRlcnNba107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuaGVhZGVyc1trXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmhlYWRlcnNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXF1ZXN0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpO1xuXG5cbmZ1bmN0aW9uIFJlc3BvbnNlKHJlcSkge1xuICAgIHZhciBpLCBsaW5lcywgbSxcbiAgICAgICAgeGhyID0gcmVxLnhocjtcbiAgICB0aGlzLnJlcXVlc3QgPSByZXE7XG4gICAgdGhpcy54aHIgPSB4aHI7XG4gICAgdGhpcy5oZWFkZXJzID0ge307XG5cbiAgICAvLyBCcm93c2VycyBkb24ndCBsaWtlIHlvdSB0cnlpbmcgdG8gcmVhZCBYSFIgcHJvcGVydGllcyB3aGVuIHlvdSBhYm9ydCB0aGVcbiAgICAvLyByZXF1ZXN0LCBzbyB3ZSBkb24ndC5cbiAgICBpZiAocmVxLmFib3J0ZWQgfHwgcmVxLnRpbWVkT3V0KSByZXR1cm47XG5cbiAgICB0aGlzLnN0YXR1cyA9IHhoci5zdGF0dXMgfHwgMDtcbiAgICB0aGlzLnRleHQgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgIHRoaXMuYm9keSA9IHhoci5yZXNwb25zZSB8fCB4aHIucmVzcG9uc2VUZXh0O1xuICAgIHRoaXMuY29udGVudFR5cGUgPSB4aHIuY29udGVudFR5cGUgfHwgKHhoci5nZXRSZXNwb25zZUhlYWRlciAmJiB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0NvbnRlbnQtVHlwZScpKTtcblxuICAgIGlmICh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKSB7XG4gICAgICAgIGxpbmVzID0geGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKG0gPSBsaW5lc1tpXS5tYXRjaCgvXFxzKihbXlxcc10rKTpcXHMrKFteXFxzXSspLykpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzW21bMV1dID0gbVsyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNIdHRwRXJyb3IgPSB0aGlzLnN0YXR1cyA+PSA0MDA7XG59XG5cblJlc3BvbnNlLnByb3RvdHlwZS5oZWFkZXIgPSBSZXF1ZXN0LnByb3RvdHlwZS5oZWFkZXI7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXNwb25zZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gV3JhcCBhIGZ1bmN0aW9uIGluIGEgYHNldFRpbWVvdXRgIGNhbGwuIFRoaXMgaXMgdXNlZCB0byBndWFyYW50ZWUgYXN5bmNcbi8vIGJlaGF2aW9yLCB3aGljaCBjYW4gYXZvaWQgdW5leHBlY3RlZCBlcnJvcnMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSxcbiAgICAgICAgICAgIG5ld0Z1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgc2V0VGltZW91dChuZXdGdW5jLCAwKTtcbiAgICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gQSBcIm9uY2VcIiB1dGlsaXR5LlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgcmVzdWx0LCBjYWxsZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNhbGxlZCkge1xuICAgICAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gd2luZG93LlhNTEh0dHBSZXF1ZXN0O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgIHZhciB0YXJnZXQgPSB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcHJvY2Vzc1JlcXVlc3Q6IGZ1bmN0aW9uIChyZXEpIHtcbiAgICAgICAgcmVxLnVybCA9IHJlcS51cmwucmVwbGFjZSgvW14lXSsvZywgZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVVUkkocyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG4iLCJ2YXIgaHR0cCA9IHJlcXVpcmUoXCJodHRwcGxlYXNlXCIpO1xudmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG5cbnRudF9lUmVzdCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gUHJlZml4ZXMgdG8gdXNlIHRoZSBSRVNUIEFQSS5cbiAgICAvLyBUaGVzZSBhcmUgbW9kaWZpZWQgaW4gdGhlIGxvY2FsUkVTVCBzZXR0ZXJcbiAgICB2YXIgcHJlZml4ID0gXCJodHRwOi8vcmVzdC5lbnNlbWJsLm9yZ1wiO1xuICAgIHZhciBwcmVmaXhfcmVnaW9uID0gcHJlZml4ICsgXCIvb3ZlcmxhcC9yZWdpb24vXCI7XG4gICAgdmFyIHByZWZpeF9lbnNnZW5lID0gcHJlZml4ICsgXCIvbG9va3VwL2lkL1wiO1xuICAgIHZhciBwcmVmaXhfeHJlZiA9IHByZWZpeCArIFwiL3hyZWZzL3N5bWJvbC9cIjtcbiAgICB2YXIgcHJlZml4X2hvbW9sb2d1ZXMgPSBwcmVmaXggKyBcIi9ob21vbG9neS9pZC9cIjtcbiAgICB2YXIgcHJlZml4X2Nocl9pbmZvID0gcHJlZml4ICsgXCIvaW5mby9hc3NlbWJseS9cIjtcbiAgICB2YXIgcHJlZml4X2Fsbl9yZWdpb24gPSBwcmVmaXggKyBcIi9hbGlnbm1lbnQvcmVnaW9uL1wiO1xuICAgIHZhciBwcmVmaXhfZ2VuZV90cmVlID0gcHJlZml4ICsgXCIvZ2VuZXRyZWUvaWQvXCI7XG4gICAgdmFyIHByZWZpeF9hc3NlbWJseSA9IHByZWZpeCArIFwiL2luZm8vYXNzZW1ibHkvXCI7XG5cbiAgICAvLyBOdW1iZXIgb2YgY29ubmVjdGlvbnMgbWFkZSB0byB0aGUgZGF0YWJhc2VcbiAgICB2YXIgY29ubmVjdGlvbnMgPSAwO1xuXG4gICAgdmFyIGVSZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgfTtcblxuICAgIC8vIExpbWl0cyBpbXBvc2VkIGJ5IHRoZSBlbnNlbWJsIFJFU1QgQVBJXG4gICAgZVJlc3QubGltaXRzID0ge1xuXHRyZWdpb24gOiA1MDAwMDAwXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAoZVJlc3QpO1xuXG5cbiAgICAvKiogPHN0cm9uZz5sb2NhbFJFU1Q8L3N0cm9uZz4gcG9pbnRzIHRoZSBxdWVyaWVzIHRvIGEgbG9jYWwgUkVTVCBzZXJ2aWNlIHRvIGRlYnVnLlxuXHRUT0RPOiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgcmVtb3ZlZCBpbiBcInByb2R1Y3Rpb25cIlxuICAgICovXG4gICAgYXBpLm1ldGhvZCAoJ2xvY2FsUkVTVCcsIGZ1bmN0aW9uKCkge1xuXHRwcmVmaXggPSBcImh0dHA6Ly8xMjcuMC4wLjE6MzAwMFwiO1xuXHRwcmVmaXhfcmVnaW9uID0gcHJlZml4ICsgXCIvb3ZlcmxhcC9yZWdpb24vXCI7XG5cdHByZWZpeF9lbnNnZW5lID0gcHJlZml4ICsgXCIvbG9va3VwL2lkL1wiO1xuXHRwcmVmaXhfeHJlZiA9IHByZWZpeCArIFwiL3hyZWZzL3N5bWJvbC9cIjtcblx0cHJlZml4X2hvbW9sb2d1ZXMgPSBwcmVmaXggKyBcIi9ob21vbG9neS9pZC9cIjtcblxuXHRyZXR1cm4gZVJlc3Q7XG4gICAgfSk7XG5cbiAgICAvKiogPHN0cm9uZz5jYWxsPC9zdHJvbmc+IG1ha2VzIGFuIGFzeW5jaHJvbm91cyBjYWxsIHRvIHRoZSBlbnNlbWJsIFJFU1Qgc2VydmljZS5cblx0QHBhcmFtIHtPYmplY3R9IG9iamVjdCAtIEEgbGl0ZXJhbCBvYmplY3QgY29udGFpbmluZyB0aGUgZm9sbG93aW5nIGZpZWxkczpcblx0PHVsPlxuXHQ8bGk+dXJsID0+IFRoZSByZXN0IFVSTC4gVGhpcyBpcyByZXR1cm5lZCBieSB7QGxpbmsgZVJlc3QudXJsfTwvbGk+XG5cdDxsaT5zdWNjZXNzID0+IEEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFJFU1QgcXVlcnkgaXMgc3VjY2Vzc2Z1bCAoaS5lLiB0aGUgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyIGlzIGEgZGVmaW5lZCB2YWx1ZSBhbmQgbm8gZXJyb3IgaGFzIGJlZW4gcmV0dXJuZWQpPC9saT5cblx0PGxpPmVycm9yID0+IEEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFJFU1QgcXVlcnkgcmV0dXJucyBhbiBlcnJvclxuXHQ8L3VsPlxuICAgICovXG4gICAgYXBpLm1ldGhvZCAoJ2NhbGwnLCBmdW5jdGlvbiAob2JqKSB7XG5cdHZhciB1cmwgPSBvYmoudXJsO1xuXHR2YXIgb25fc3VjY2VzcyA9IG9iai5zdWNjZXNzO1xuXHR2YXIgb25fZXJyb3IgICA9IG9iai5lcnJvcjtcblx0Y29ubmVjdGlvbnMrKztcblx0aHR0cC5nZXQoe1xuXHQgICAgXCJ1cmxcIiA6IHVybFxuXHR9LCBmdW5jdGlvbiAoZXJyb3IsIHJlc3ApIHtcblx0ICAgIGlmIChyZXNwICE9PSB1bmRlZmluZWQgJiYgZXJyb3IgPT0gbnVsbCAmJiBvbl9zdWNjZXNzICE9PSB1bmRlZmluZWQpIHtcblx0XHRvbl9zdWNjZXNzKEpTT04ucGFyc2UocmVzcC5ib2R5KSk7XG5cdCAgICB9XG5cdCAgICBpZiAoZXJyb3IgIT09IG51bGwgJiYgb25fZXJyb3IgIT09IHVuZGVmaW5lZCkge1xuXHRcdG9uX2Vycm9yKGVycm9yKTtcblx0ICAgIH1cblx0fSk7XG5cdC8vIGQzLmpzb24gKHVybCwgZnVuY3Rpb24gKGVycm9yLCByZXNwKSB7XG5cdC8vICAgICBjb25uZWN0aW9ucy0tO1xuXHQvLyAgICAgaWYgKHJlc3AgIT09IHVuZGVmaW5lZCAmJiBlcnJvciA9PT0gbnVsbCAmJiBvbl9zdWNjZXNzICE9PSB1bmRlZmluZWQpIHtcblx0Ly8gXHRvbl9zdWNjZXNzKHJlc3ApO1xuXHQvLyAgICAgfVxuXHQvLyAgICAgaWYgKGVycm9yICE9PSBudWxsICYmIG9uX2Vycm9yICE9PSB1bmRlZmluZWQpIHtcblx0Ly8gXHRvbl9lcnJvcihlcnJvcik7XG5cdC8vICAgICB9XG5cdC8vIH0pO1xuICAgIH0pO1xuXG5cbiAgICBlUmVzdC51cmwgPSB7fTtcbiAgICB2YXIgdXJsX2FwaSA9IGFwaWpzIChlUmVzdC51cmwpO1xuXHQvKiogZVJlc3QudXJsLjxzdHJvbmc+cmVnaW9uPC9zdHJvbmc+IHJldHVybnMgdGhlIGVuc2VtYmwgUkVTVCB1cmwgdG8gcmV0cmlldmUgdGhlIGdlbmVzIGluY2x1ZGVkIGluIHRoZSBzcGVjaWZpZWQgcmVnaW9uXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5zcGVjaWVzIDogVGhlIHNwZWNpZXMgdGhlIHJlZ2lvbiByZWZlcnMgdG88L2xpPlxuPGxpPmNociAgICAgOiBUaGUgY2hyIChvciBzZXFfcmVnaW9uIG5hbWUpPC9saT5cbjxsaT5mcm9tICAgIDogVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZWdpb24gaW4gdGhlIGNocjwvbGk+XG48bGk+dG8gICAgICA6IFRoZSBlbmQgcG9zaXRpb24gb2YgdGhlIHJlZ2lvbiAoZnJvbSA8IHRvIGFsd2F5cyk8L2xpPlxuPC91bD5cbiAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIHVybCB0byBxdWVyeSB0aGUgRW5zZW1ibCBSRVNUIHNlcnZlci4gRm9yIGFuIGV4YW1wbGUgb2Ygb3V0cHV0IG9mIHRoZXNlIHVybHMgc2VlIHRoZSB7QGxpbmsgaHR0cDovL2JldGEucmVzdC5lbnNlbWJsLm9yZy9mZWF0dXJlL3JlZ2lvbi9ob21vX3NhcGllbnMvMTM6MzI4ODk2MTEtMzI5NzM4MDUuanNvbj9mZWF0dXJlPWdlbmV8RW5zZW1ibCBSRVNUIEFQSSBleGFtcGxlfVxuXHQgICAgQGV4YW1wbGVcbmVSZXN0LmNhbGwgKCB1cmwgICAgIDogZVJlc3QudXJsLnJlZ2lvbiAoeyBzcGVjaWVzIDogXCJob21vX3NhcGllbnNcIiwgY2hyIDogXCIxM1wiLCBmcm9tIDogMzI4ODk2MTEsIHRvIDogMzI5NzM4MDUgfSksXG4gICAgICAgICAgICAgc3VjY2VzcyA6IGNhbGxiYWNrLFxuICAgICAgICAgICAgIGVycm9yICAgOiBjYWxsYmFja1xuXHQgICApO1xuXHQgKi9cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ3JlZ2lvbicsIGZ1bmN0aW9uKG9iaikge1xuXHRyZXR1cm4gcHJlZml4X3JlZ2lvbiArXG5cdCAgICBvYmouc3BlY2llcyArXG5cdCAgICBcIi9cIiArXG5cdCAgICBvYmouY2hyICtcblx0ICAgIFwiOlwiICsgXG5cdCAgICBvYmouZnJvbSArIFxuXHQgICAgXCItXCIgKyBvYmoudG8gKyBcblx0ICAgIFwiLmpzb24/ZmVhdHVyZT1nZW5lXCI7XG4gICAgfSk7XG5cblx0LyoqIGVSZXN0LnVybC48c3Ryb25nPnNwZWNpZXNfZ2VuZTwvc3Ryb25nPiByZXR1cm5zIHRoZSBlbnNlbWJsIFJFU1QgdXJsIHRvIHJldHJpZXZlIHRoZSBlbnNlbWJsIGdlbmUgYXNzb2NpYXRlZCB3aXRoXG5cdCAgICB0aGUgZ2l2ZW4gbmFtZSBpbiB0aGUgc3BlY2lmaWVkIHNwZWNpZXMuXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5zcGVjaWVzICAgOiBUaGUgc3BlY2llcyB0aGUgcmVnaW9uIHJlZmVycyB0bzwvbGk+XG48bGk+Z2VuZV9uYW1lIDogVGhlIG5hbWUgb2YgdGhlIGdlbmU8L2xpPlxuPC91bD5cbiAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIHVybCB0byBxdWVyeSB0aGUgRW5zZW1ibCBSRVNUIHNlcnZlci4gRm9yIGFuIGV4YW1wbGUgb2Ygb3V0cHV0IG9mIHRoZXNlIHVybHMgc2VlIHRoZSB7QGxpbmsgaHR0cDovL2JldGEucmVzdC5lbnNlbWJsLm9yZy94cmVmcy9zeW1ib2wvaHVtYW4vQlJDQTIuanNvbj9vYmplY3RfdHlwZT1nZW5lfEVuc2VtYmwgUkVTVCBBUEkgZXhhbXBsZX1cblx0ICAgIEBleGFtcGxlXG5lUmVzdC5jYWxsICggdXJsICAgICA6IGVSZXN0LnVybC5zcGVjaWVzX2dlbmUgKHsgc3BlY2llcyA6IFwiaHVtYW5cIiwgZ2VuZV9uYW1lIDogXCJCUkNBMlwiIH0pLFxuICAgICAgICAgICAgIHN1Y2Nlc3MgOiBjYWxsYmFjayxcbiAgICAgICAgICAgICBlcnJvciAgIDogY2FsbGJhY2tcblx0ICAgKTtcblx0ICovXG4gICAgdXJsX2FwaS5tZXRob2QgKCd4cmVmJywgZnVuY3Rpb24gKG9iaikge1xuXHRyZXR1cm4gcHJlZml4X3hyZWYgK1xuXHQgICAgb2JqLnNwZWNpZXMgICtcblx0ICAgIFwiL1wiICtcblx0ICAgIG9iai5uYW1lICtcblx0ICAgIFwiLmpzb24/b2JqZWN0X3R5cGU9Z2VuZVwiO1xuICAgIH0pO1xuXG5cdC8qKiBlUmVzdC51cmwuPHN0cm9uZz5ob21vbG9ndWVzPC9zdHJvbmc+IHJldHVybnMgdGhlIGVuc2VtYmwgUkVTVCB1cmwgdG8gcmV0cmlldmUgdGhlIGhvbW9sb2d1ZXMgKG9ydGhvbG9ndWVzICsgcGFyYWxvZ3Vlcykgb2YgdGhlIGdpdmVuIGVuc2VtYmwgSUQuXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5pZCA6IFRoZSBFbnNlbWJsIElEIG9mIHRoZSBnZW5lPC9saT5cbjwvdWw+XG4gICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSB1cmwgdG8gcXVlcnkgdGhlIEVuc2VtYmwgUkVTVCBzZXJ2ZXIuIEZvciBhbiBleGFtcGxlIG9mIG91dHB1dCBvZiB0aGVzZSB1cmxzIHNlZSB0aGUge0BsaW5rIGh0dHA6Ly9iZXRhLnJlc3QuZW5zZW1ibC5vcmcvaG9tb2xvZ3kvaWQvRU5TRzAwMDAwMTM5NjE4Lmpzb24/Zm9ybWF0PWNvbmRlbnNlZDtzZXF1ZW5jZT1ub25lO3R5cGU9YWxsfEVuc2VtYmwgUkVTVCBBUEkgZXhhbXBsZX1cblx0ICAgIEBleGFtcGxlXG5lUmVzdC5jYWxsICggdXJsICAgICA6IGVSZXN0LnVybC5ob21vbG9ndWVzICh7IGlkIDogXCJFTlNHMDAwMDAxMzk2MThcIiB9KSxcbiAgICAgICAgICAgICBzdWNjZXNzIDogY2FsbGJhY2ssXG4gICAgICAgICAgICAgZXJyb3IgICA6IGNhbGxiYWNrXG5cdCAgICk7XG5cdCAqL1xuICAgIHVybF9hcGkubWV0aG9kICgnaG9tb2xvZ3VlcycsIGZ1bmN0aW9uKG9iaikge1xuXHRyZXR1cm4gcHJlZml4X2hvbW9sb2d1ZXMgK1xuXHQgICAgb2JqLmlkICsgXG5cdCAgICBcIi5qc29uP2Zvcm1hdD1jb25kZW5zZWQ7c2VxdWVuY2U9bm9uZTt0eXBlPWFsbFwiO1xuICAgIH0pO1xuXG5cdC8qKiBlUmVzdC51cmwuPHN0cm9uZz5nZW5lPC9zdHJvbmc+IHJldHVybnMgdGhlIGVuc2VtYmwgUkVTVCB1cmwgdG8gcmV0cmlldmUgdGhlIGVuc2VtYmwgZ2VuZSBhc3NvY2lhdGVkIHdpdGhcblx0ICAgIHRoZSBnaXZlbiBJRFxuXHQgICAgQHBhcmFtIHtvYmplY3R9IG9iaiAtIEFuIG9iamVjdCBsaXRlcmFsIHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6PGJyIC8+XG48dWw+XG48bGk+aWQgOiBUaGUgbmFtZSBvZiB0aGUgZ2VuZTwvbGk+XG48L3VsPlxuICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gLSBUaGUgdXJsIHRvIHF1ZXJ5IHRoZSBFbnNlbWJsIFJFU1Qgc2VydmVyLiBGb3IgYW4gZXhhbXBsZSBvZiBvdXRwdXQgb2YgdGhlc2UgdXJscyBzZWUgdGhlIHtAbGluayBodHRwOi8vYmV0YS5yZXN0LmVuc2VtYmwub3JnL2xvb2t1cC9FTlNHMDAwMDAxMzk2MTguanNvbj9mb3JtYXQ9ZnVsbHxFbnNlbWJsIFJFU1QgQVBJIGV4YW1wbGV9XG5cdCAgICBAZXhhbXBsZVxuZVJlc3QuY2FsbCAoIHVybCAgICAgOiBlUmVzdC51cmwuZ2VuZSAoeyBpZCA6IFwiRU5TRzAwMDAwMTM5NjE4XCIgfSksXG4gICAgICAgICAgICAgc3VjY2VzcyA6IGNhbGxiYWNrLFxuICAgICAgICAgICAgIGVycm9yICAgOiBjYWxsYmFja1xuXHQgICApO1xuXHQgKi9cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ2dlbmUnLCBmdW5jdGlvbihvYmopIHtcblx0cmV0dXJuIHByZWZpeF9lbnNnZW5lICtcblx0ICAgIG9iai5pZCArXG5cdCAgICBcIi5qc29uP2Zvcm1hdD1mdWxsXCI7XG4gICAgfSk7XG5cblx0LyoqIGVSZXN0LnVybC48c3Ryb25nPmNocl9pbmZvPC9zdHJvbmc+IHJldHVybnMgdGhlIGVuc2VtYmwgUkVTVCB1cmwgdG8gcmV0cmlldmUgdGhlIGluZm9ybWF0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgY2hyb21vc29tZSAoc2VxX3JlZ2lvbiBpbiBFbnNlbWJsIG5vbWVuY2xhdHVyZSkuXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5zcGVjaWVzIDogVGhlIHNwZWNpZXMgdGhlIGNociAob3Igc2VxX3JlZ2lvbikgYmVsb25ncyB0b1xuPGxpPmNociAgICAgOiBUaGUgbmFtZSBvZiB0aGUgY2hyIChvciBzZXFfcmVnaW9uKTwvbGk+XG48L3VsPlxuICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gLSBUaGUgdXJsIHRvIHF1ZXJ5IHRoZSBFbnNlbWJsIFJFU1Qgc2VydmVyLiBGb3IgYW4gZXhhbXBsZSBvZiBvdXRwdXQgb2YgdGhlc2UgdXJscyBzZWUgdGhlIHtAbGluayBodHRwOi8vYmV0YS5yZXN0LmVuc2VtYmwub3JnL2Fzc2VtYmx5L2luZm8vaG9tb19zYXBpZW5zLzEzLmpzb24/Zm9ybWF0PWZ1bGx8RW5zZW1ibCBSRVNUIEFQSSBleGFtcGxlfVxuXHQgICAgQGV4YW1wbGVcbmVSZXN0LmNhbGwgKCB1cmwgICAgIDogZVJlc3QudXJsLmNocl9pbmZvICh7IHNwZWNpZXMgOiBcImhvbW9fc2FwaWVuc1wiLCBjaHIgOiBcIjEzXCIgfSksXG4gICAgICAgICAgICAgc3VjY2VzcyA6IGNhbGxiYWNrLFxuICAgICAgICAgICAgIGVycm9yICAgOiBjYWxsYmFja1xuXHQgICApO1xuXHQgKi9cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ2Nocl9pbmZvJywgZnVuY3Rpb24ob2JqKSB7XG5cdHJldHVybiBwcmVmaXhfY2hyX2luZm8gK1xuXHQgICAgb2JqLnNwZWNpZXMgK1xuXHQgICAgXCIvXCIgK1xuXHQgICAgb2JqLmNociArXG5cdCAgICBcIi5qc29uP2Zvcm1hdD1mdWxsXCI7XG4gICAgfSk7XG5cblx0Ly8gVE9ETzogRm9yIG5vdywgaXQgb25seSB3b3JrcyB3aXRoIHNwZWNpZXNfc2V0IGFuZCBub3Qgc3BlY2llc19zZXRfZ3JvdXBzXG5cdC8vIFNob3VsZCBiZSBleHRlbmRlZCBmb3Igd2lkZXIgdXNlXG4gICAgdXJsX2FwaS5tZXRob2QgKCdhbG5fYmxvY2snLCBmdW5jdGlvbiAob2JqKSB7XG5cdHZhciB1cmwgPSBwcmVmaXhfYWxuX3JlZ2lvbiArIFxuXHQgICAgb2JqLnNwZWNpZXMgK1xuXHQgICAgXCIvXCIgK1xuXHQgICAgb2JqLmNociArXG5cdCAgICBcIjpcIiArXG5cdCAgICBvYmouZnJvbSArXG5cdCAgICBcIi1cIiArXG5cdCAgICBvYmoudG8gK1xuXHQgICAgXCIuanNvbj9tZXRob2Q9XCIgK1xuXHQgICAgb2JqLm1ldGhvZDtcblxuXHRmb3IgKHZhciBpPTA7IGk8b2JqLnNwZWNpZXNfc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdCAgICB1cmwgKz0gXCImc3BlY2llc19zZXQ9XCIgKyBvYmouc3BlY2llc19zZXRbaV07XG5cdH1cblxuXHRyZXR1cm4gdXJsO1xuICAgIH0pO1xuXG4gICAgdXJsX2FwaS5tZXRob2QgKCdnZW5lX3RyZWUnLCBmdW5jdGlvbiAob2JqKSB7XG5cdHJldHVybiBwcmVmaXhfZ2VuZV90cmVlICtcblx0ICAgIG9iai5pZCArIFxuXHQgICAgXCIuanNvbj9zZXF1ZW5jZT1cIiArXG5cdCAgICAoKG9iai5zZXF1ZW5jZSB8fCBvYmouYWxpZ25lZCkgPyAxIDogXCJub25lXCIpICtcblx0ICAgIChvYmouYWxpZ25lZCA/ICcmYWxpZ25lZD0xJyA6ICcnKTtcbiAgICB9KTtcblxuICAgIHVybF9hcGkubWV0aG9kKCdhc3NlbWJseScsIGZ1bmN0aW9uIChvYmopIHtcblx0cmV0dXJuIHByZWZpeF9hc3NlbWJseSArIFxuXHQgICAgb2JqLnNwZWNpZXMgK1xuXHQgICAgXCIuanNvblwiO1xuICAgIH0pO1xuXG5cbiAgICBhcGkubWV0aG9kICgnY29ubmVjdGlvbnMnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGNvbm5lY3Rpb25zO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGVSZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2VSZXN0O1xuIiwiLy8gaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9XG4vLyB9XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcblxuIiwidmFyIGJvYXJkID0gcmVxdWlyZShcInRudC5ib2FyZFwiKTtcbnZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGVuc2VtYmxSZXN0QVBJID0gcmVxdWlyZShcInRudC5lbnNlbWJsXCIpO1xuXG4vLyBBIHByZWRlZmluZWQgdHJhY2sgZm9yIGdlbmVzXG52YXIgZGF0YV9nZW5lID0gZnVuY3Rpb24gKCkge1xuLy9ib2FyZC50cmFjay5kYXRhLmdlbmUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgdHJhY2sgPSBib2FyZC50cmFjay5kYXRhKCk7XG4gICAgLy8gLmluZGV4KFwiSURcIik7XG5cbiAgICB2YXIgdXBkYXRlciA9IGJvYXJkLnRyYWNrLmRhdGEucmV0cmlldmVyLmVuc2VtYmwoKVxuICAgICAgICAuZW5kcG9pbnQoXCJyZWdpb25cIilcbiAgICAvLyBUT0RPOiBJZiBzdWNjZXNzIGlzIGRlZmluZWQgaGVyZSwgbWVhbnMgdGhhdCBpdCBjYW4ndCBiZSB1c2VyLWRlZmluZWRcbiAgICAvLyBpcyB0aGF0IGdvb2Q/IGVub3VnaD8gQVBJP1xuICAgIC8vIFVQREFURTogTm93IHN1Y2Nlc3MgaXMgYmFja2VkIHVwIGJ5IGFuIGFycmF5LiBTdGlsbCBkb24ndCBrbm93IGlmIHRoaXMgaXMgdGhlIGJlc3Qgb3B0aW9uXG4gICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGdlbmVzKSB7XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKGdlbmVzW2ldLnN0cmFuZCA9PT0gLTEpIHtcblx0XHQgICAgZ2VuZXNbaV0uZGlzcGxheV9sYWJlbCA9IFwiPFwiICsgZ2VuZXNbaV0uZXh0ZXJuYWxfbmFtZTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICBnZW5lc1tpXS5kaXNwbGF5X2xhYmVsID0gZ2VuZXNbaV0uZXh0ZXJuYWxfbmFtZSArIFwiPlwiO1xuXHRcdH1cblx0ICAgIH1cblx0fSk7XG5cbiAgICByZXR1cm4gdHJhY2sudXBkYXRlKHVwZGF0ZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBkYXRhX2dlbmU7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgbGF5b3V0ID0gcmVxdWlyZShcIi4vbGF5b3V0LmpzXCIpO1xudmFyIGJvYXJkID0gcmVxdWlyZShcInRudC5ib2FyZFwiKTtcblxudG50X2ZlYXR1cmVfZ2VuZSA9IGZ1bmN0aW9uICgpIHtcblxuICAgIC8vICdJbmhlcml0JyBmcm9tIHRudC50cmFjay5mZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSBib2FyZC50cmFjay5mZWF0dXJlKClcblx0LmxheW91dChib2FyZC50cmFjay5sYXlvdXQuZmVhdHVyZSgpKVxuXHQuaW5kZXgoZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBkLmlkO1xuXHR9KTtcblxuICAgIC8vIHZhciB0b29sdGlwID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICAgICB2YXIgdG9vbHRpcCA9IGJvYXJkLnRvb2x0aXAudGFibGUoKTtcbiAgICAvLyAgICAgdmFyIGdlbmVfdG9vbHRpcCA9IGZ1bmN0aW9uKGdlbmUpIHtcbiAgICAvLyAgICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAvLyAgICAgICAgIG9iai5oZWFkZXIgPSB7XG4gICAgLy8gICAgICAgICAgICAgbGFiZWwgOiBcIkhHTkMgU3ltYm9sXCIsXG4gICAgLy8gICAgICAgICAgICAgdmFsdWUgOiBnZW5lLmV4dGVybmFsX25hbWVcbiAgICAvLyAgICAgICAgIH07XG4gICAgLy8gICAgICAgICBvYmoucm93cyA9IFtdO1xuICAgIC8vICAgICAgICAgb2JqLnJvd3MucHVzaCgge1xuICAgIC8vICAgICAgICAgICAgIGxhYmVsIDogXCJOYW1lXCIsXG4gICAgLy8gICAgICAgICAgICAgdmFsdWUgOiBcIjxhIGhyZWY9Jyc+XCIgKyBnZW5lLklEICArIFwiPC9hPlwiXG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIG9iai5yb3dzLnB1c2goIHtcbiAgICAvLyAgICAgICAgICAgICBsYWJlbCA6IFwiR2VuZSBUeXBlXCIsXG4gICAgLy8gICAgICAgICAgICAgdmFsdWUgOiBnZW5lLmJpb3R5cGVcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICAgICAgb2JqLnJvd3MucHVzaCgge1xuICAgIC8vICAgICAgICAgICAgIGxhYmVsIDogXCJMb2NhdGlvblwiLFxuICAgIC8vICAgICAgICAgICAgIHZhbHVlIDogXCI8YSBocmVmPScnPlwiICsgZ2VuZS5zZXFfcmVnaW9uX25hbWUgKyBcIjpcIiArIGdlbmUuc3RhcnQgKyBcIi1cIiArIGdlbmUuZW5kICArIFwiPC9hPlwiXG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIG9iai5yb3dzLnB1c2goIHtcbiAgICAvLyAgICAgICAgICAgICBsYWJlbCA6IFwiU3RyYW5kXCIsXG4gICAgLy8gICAgICAgICAgICAgdmFsdWUgOiAoZ2VuZS5zdHJhbmQgPT09IDEgPyBcIkZvcndhcmRcIiA6IFwiUmV2ZXJzZVwiKVxuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgICAgICBvYmoucm93cy5wdXNoKCB7XG4gICAgLy8gICAgICAgICAgICAgbGFiZWwgOiBcIkRlc2NyaXB0aW9uXCIsXG4gICAgLy8gICAgICAgICAgICAgdmFsdWUgOiBnZW5lLmRlc2NyaXB0aW9uXG4gICAgLy8gICAgICAgICB9KTtcblxuICAgIC8vICAgICAgICAgdG9vbHRpcC5jYWxsKHRoaXMsIG9iaik7XG4gICAgLy8gICAgIH07XG5cbiAgICAvLyAgICAgcmV0dXJuIGdlbmVfdG9vbHRpcDtcbiAgICAvLyB9O1xuXG5cbiAgICBmZWF0dXJlLmNyZWF0ZShmdW5jdGlvbiAobmV3X2VsZW1zLCB4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblxuXHRuZXdfZWxlbXNcblx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKGQuc3RhcnQpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLnNsb3RfaGVpZ2h0ICogZC5zbG90O1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGZlYXR1cmUubGF5b3V0KCkuZ2VuZV9zbG90KCkuZ2VuZV9oZWlnaHQpXG5cdCAgICAuYXR0cihcImZpbGxcIiwgdHJhY2suYmFja2dyb3VuZF9jb2xvcigpKVxuXHQgICAgLnRyYW5zaXRpb24oKVxuXHQgICAgLmR1cmF0aW9uKDUwMClcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmNvbG9yID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcmV0dXJuIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBkLmNvbG9yXG5cdFx0fVxuXHQgICAgfSk7XG5cblx0bmV3X2VsZW1zXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9uYW1lXCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKGQuc3RhcnQpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zbG90X2hlaWdodCAqIGQuc2xvdCkgKyAyNTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgdHJhY2suYmFja2dyb3VuZF9jb2xvcigpKVxuXHQgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zaG93X2xhYmVsKSB7XG5cdFx0ICAgIHJldHVybiBkLmRpc3BsYXlfbGFiZWxcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJcIlxuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuc3R5bGUoXCJmb250LXdlaWdodFwiLCBcIm5vcm1hbFwiKVxuXHQgICAgLnRyYW5zaXRpb24oKVxuXHQgICAgLmR1cmF0aW9uKDUwMClcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCk7XG5cdCAgICB9KTtcdCAgICBcbiAgICB9KTtcblxuICAgIGZlYXR1cmUudXBkYXRlcihmdW5jdGlvbiAoZ2VuZXMpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0Z2VuZXNcblx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG5cdCAgICAudHJhbnNpdGlvbigpXG5cdCAgICAuZHVyYXRpb24oNTAwKVxuXHQgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIChmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLnNsb3RfaGVpZ2h0ICogZC5zbG90KTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0KTtcblxuXHRnZW5lc1xuXHQgICAgLnNlbGVjdChcInRleHRcIilcblx0ICAgIC50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbig1MDApXG5cdCAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKGZlYXR1cmUubGF5b3V0KCkuZ2VuZV9zbG90KCkuc2xvdF9oZWlnaHQgKiBkLnNsb3QpICsgMjU7XG5cdCAgICB9KVxuXHQgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zaG93X2xhYmVsKSB7XG5cdFx0ICAgIHJldHVybiBkLmRpc3BsYXlfbGFiZWw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0XHQgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmVyKGZ1bmN0aW9uIChnZW5lcywgeFNjYWxlKSB7XG5cdGdlbmVzLnNlbGVjdChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG5cdCAgICB9KTtcblxuXHRnZW5lcy5zZWxlY3QoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKGQuc3RhcnQpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIC8vIGFwaWpzIChmZWF0dXJlKVxuICAgIC8vIFx0Lm1ldGhvZCAoe1xuICAgIC8vIFx0ICAgIHRvb2x0aXAgOiB0b29sdGlwXG4gICAgLy8gXHR9KTtcblxuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfZmVhdHVyZV9nZW5lO1xuIiwidmFyIHRudF9yZXN0ID0gcmVxdWlyZShcInRudC5lbnNlbWJsXCIpO1xudmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdG50X2JvYXJkID0gcmVxdWlyZShcInRudC5ib2FyZFwiKTtcbnRudF9ib2FyZC50cmFjay5sYXlvdXQuZ2VuZSA9IHJlcXVpcmUoXCIuL2xheW91dC5qc1wiKTtcbnRudF9ib2FyZC50cmFjay5mZWF0dXJlLmdlbmUgPSByZXF1aXJlKFwiLi9mZWF0dXJlLmpzXCIpO1xuXG50bnRfYm9hcmRfZ2Vub21lID0gZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCJcblxuICAgIC8vIFByaXZhdGUgdmFyc1xuICAgIHZhciBlbnNfcmUgPSAvXkVOU1xcdytcXGQrJC87XG4gICAgdmFyIGVSZXN0ID0gdG50X3Jlc3QoKTtcbiAgICB2YXIgY2hyX2xlbmd0aDtcbiAgICBcbiAgICAvLyBWYXJzIGV4cG9zZWQgaW4gdGhlIEFQSVxuICAgIHZhciBjb25mID0ge1xuXHRnZW5lICAgICAgICAgICA6IHVuZGVmaW5lZCxcblx0eHJlZl9zZWFyY2ggICAgOiBmdW5jdGlvbiAoKSB7fSxcblx0ZW5zZ2VuZV9zZWFyY2ggOiBmdW5jdGlvbiAoKSB7fSxcblx0Y29udGV4dCAgICAgICAgOiAwXG4gICAgfTtcblxuICAgIHZhciBnZW5lO1xuICAgIHZhciBsaW1pdHMgPSB7XG4gICAgICAgIGxlZnQgOiAwLFxuXHRyaWdodCA6IHVuZGVmaW5lZCxcblx0em9vbV9vdXQgOiBlUmVzdC5saW1pdHMucmVnaW9uLFxuXHR6b29tX2luICA6IDIwMFxuICAgIH07XG5cblxuICAgIC8vIFdlIFwiaW5oZXJpdFwiIGZyb20gYm9hcmRcbiAgICB2YXIgZ2Vub21lX2Jyb3dzZXIgPSB0bnRfYm9hcmQoKTtcblxuICAgIC8vIFRoZSBsb2NhdGlvbiBhbmQgYXhpcyB0cmFja1xuICAgIHZhciBsb2NhdGlvbl90cmFjayA9IHRudF9ib2FyZC50cmFjaygpXG5cdC5oZWlnaHQoMjApXG5cdC5iYWNrZ3JvdW5kX2NvbG9yKFwid2hpdGVcIilcblx0LmRhdGEodG50X2JvYXJkLnRyYWNrLmRhdGEuZW1wdHkoKSlcblx0LmRpc3BsYXkodG50X2JvYXJkLnRyYWNrLmZlYXR1cmUubG9jYXRpb24oKSk7XG5cbiAgICB2YXIgYXhpc190cmFjayA9IHRudF9ib2FyZC50cmFjaygpXG5cdC5oZWlnaHQoMjApXG5cdC5iYWNrZ3JvdW5kX2NvbG9yKFwid2hpdGVcIilcblx0LmRhdGEodG50X2JvYXJkLnRyYWNrLmRhdGEuZW1wdHkoKSlcblx0LmRpc3BsYXkodG50X2JvYXJkLnRyYWNrLmZlYXR1cmUuYXhpcygpKTtcblxuICAgIGdlbm9tZV9icm93c2VyXG5cdC5hZGRfdHJhY2sobG9jYXRpb25fdHJhY2spXG5cdC5hZGRfdHJhY2soYXhpc190cmFjayk7XG5cbiAgICAvLyBEZWZhdWx0IGxvY2F0aW9uOlxuICAgIGdlbm9tZV9icm93c2VyXG5cdC5zcGVjaWVzKFwiaHVtYW5cIilcblx0LmNocig3KVxuXHQuZnJvbSgxMzk0MjQ5NDApXG5cdC50bygxNDE3ODQxMDApO1xuXG4gICAgLy8gV2Ugc2F2ZSB0aGUgc3RhcnQgbWV0aG9kIG9mIHRoZSAncGFyZW50JyBvYmplY3RcbiAgICBnZW5vbWVfYnJvd3Nlci5fc3RhcnQgPSBnZW5vbWVfYnJvd3Nlci5zdGFydDtcblxuICAgIC8vIFdlIGhpamFjayBwYXJlbnQncyBzdGFydCBtZXRob2RcbiAgICB2YXIgc3RhcnQgPSBmdW5jdGlvbiAod2hlcmUpIHtcblx0aWYgKHdoZXJlICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGlmICh3aGVyZS5nZW5lICE9PSB1bmRlZmluZWQpIHtcblx0XHRnZXRfZ2VuZSh3aGVyZSk7XG5cdFx0cmV0dXJuO1xuXHQgICAgfSBlbHNlIHtcblx0XHRpZiAod2hlcmUuc3BlY2llcyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHdoZXJlLnNwZWNpZXMgPSBnZW5vbWVfYnJvd3Nlci5zcGVjaWVzKCk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgZ2Vub21lX2Jyb3dzZXIuc3BlY2llcyh3aGVyZS5zcGVjaWVzKTtcblx0XHR9XG5cdFx0aWYgKHdoZXJlLmNociA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHdoZXJlLmNociA9IGdlbm9tZV9icm93c2VyLmNocigpO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIGdlbm9tZV9icm93c2VyLmNocih3aGVyZS5jaHIpO1xuXHRcdH1cblx0XHRpZiAod2hlcmUuZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHdoZXJlLmZyb20gPSBnZW5vbWVfYnJvd3Nlci5mcm9tKCk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgZ2Vub21lX2Jyb3dzZXIuZnJvbSh3aGVyZS5mcm9tKVxuXHRcdH1cblx0XHRpZiAod2hlcmUudG8gPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICB3aGVyZS50byA9IGdlbm9tZV9icm93c2VyLnRvKCk7XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgZ2Vub21lX2Jyb3dzZXIudG8od2hlcmUudG8pO1xuXHRcdH1cblx0ICAgIH1cblx0fSBlbHNlIHsgLy8gXCJ3aGVyZVwiIGlzIHVuZGVmIHNvIGxvb2sgZm9yIGdlbmUgb3IgbG9jXG5cdCAgICBpZiAoZ2Vub21lX2Jyb3dzZXIuZ2VuZSgpICE9PSB1bmRlZmluZWQpIHtcblx0XHRnZXRfZ2VuZSh7IHNwZWNpZXMgOiBnZW5vbWVfYnJvd3Nlci5zcGVjaWVzKCksXG5cdFx0XHQgICBnZW5lICAgIDogZ2Vub21lX2Jyb3dzZXIuZ2VuZSgpXG5cdFx0XHQgfSk7XG5cdFx0cmV0dXJuO1xuXHQgICAgfSBlbHNlIHtcblx0XHR3aGVyZSA9IHt9O1xuXHRcdHdoZXJlLnNwZWNpZXMgPSBnZW5vbWVfYnJvd3Nlci5zcGVjaWVzKCksXG5cdFx0d2hlcmUuY2hyICAgICA9IGdlbm9tZV9icm93c2VyLmNocigpLFxuXHRcdHdoZXJlLmZyb20gICAgPSBnZW5vbWVfYnJvd3Nlci5mcm9tKCksXG5cdFx0d2hlcmUudG8gICAgICA9IGdlbm9tZV9icm93c2VyLnRvKClcblx0ICAgIH1cblx0fVxuXG5cdGdlbm9tZV9icm93c2VyLnJpZ2h0IChmdW5jdGlvbiAoZG9uZSkge1xuXHQgICAgLy8gR2V0IHRoZSBjaHJvbW9zb21lIGxlbmd0aCBhbmQgdXNlIGl0IGFzIHRoZSAncmlnaHQnIGxpbWl0XG5cblx0ICAgIGdlbm9tZV9icm93c2VyLnpvb21faW4gKGxpbWl0cy56b29tX2luKTtcblx0ICAgIGdlbm9tZV9icm93c2VyLnpvb21fb3V0IChsaW1pdHMuem9vbV9vdXQpO1xuXG5cdCAgICBlUmVzdC5jYWxsKHt1cmwgOiBlUmVzdC51cmwuY2hyX2luZm8gKHtzcGVjaWVzIDogd2hlcmUuc3BlY2llcyxcblx0XHRcdFx0XHRcdCAgIGNociAgICAgOiB3aGVyZS5jaHJcblx0XHRcdFx0XHRcdCAgfSksXG5cdFx0XHRzdWNjZXNzIDogZnVuY3Rpb24gKHJlc3ApIHtcblx0XHRcdCAgICBkb25lKHJlc3AubGVuZ3RoKTtcblx0XHRcdH1cblx0XHQgICAgICAgfSk7XG5cdH0pO1xuXHRnZW5vbWVfYnJvd3Nlci5fc3RhcnQoKTtcbiAgICB9O1xuXG4gICAgIHZhciBob21vbG9ndWVzID0gZnVuY3Rpb24gKGVuc0dlbmUsIGNhbGxiYWNrKSAge1xuXHRlUmVzdC5jYWxsKHt1cmwgOiBlUmVzdC51cmwuaG9tb2xvZ3VlcyAoe2lkIDogZW5zR2VuZX0pLFxuXHRcdCAgICBzdWNjZXNzIDogZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0dmFyIGhvbW9sb2d1ZXMgPSByZXNwLmRhdGFbMF0uaG9tb2xvZ2llcztcblx0XHRcdGlmIChjYWxsYmFjayAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHQgICAgdmFyIGhvbW9sb2d1ZXNfb2JqID0gc3BsaXRfaG9tb2xvZ3Vlcyhob21vbG9ndWVzKVxuXHRcdFx0ICAgIGNhbGxiYWNrKGhvbW9sb2d1ZXNfb2JqKTtcblx0XHRcdH1cblx0XHQgICAgfVxuXHRcdCAgIH0pO1xuICAgIH1cblxuICAgIHZhciBpc0Vuc2VtYmxHZW5lID0gZnVuY3Rpb24odGVybSkge1xuXHRpZiAodGVybS5tYXRjaChlbnNfcmUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgZ2V0X2dlbmUgPSBmdW5jdGlvbiAod2hlcmUpIHtcblx0aWYgKGlzRW5zZW1ibEdlbmUod2hlcmUuZ2VuZSkpIHtcblx0ICAgIGdldF9lbnNHZW5lKHdoZXJlLmdlbmUpXG5cdH0gZWxzZSB7XG5cdCAgICBlUmVzdC5jYWxsKHt1cmwgOiBlUmVzdC51cmwueHJlZiAoeyBzcGVjaWVzIDogd2hlcmUuc3BlY2llcyxcblx0XHRcdFx0XHRcdG5hbWUgICAgOiB3aGVyZS5nZW5lIFxuXHRcdFx0XHRcdCAgICAgIH1cblx0XHRcdFx0XHQgICAgICksXG5cdFx0XHRzdWNjZXNzIDogZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0ICAgIHJlc3AgPSByZXNwLmZpbHRlcihmdW5jdGlvbihkKSB7XG5cdFx0XHRcdHJldHVybiAhZC5pZC5pbmRleE9mKFwiRU5TXCIpO1xuXHRcdFx0ICAgIH0pO1xuXHRcdFx0ICAgIGlmIChyZXNwWzBdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Y29uZi54cmVmX3NlYXJjaChyZXNwKTtcblx0XHRcdFx0Z2V0X2Vuc0dlbmUocmVzcFswXS5pZClcblx0XHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0XHRnZW5vbWVfYnJvd3Nlci5zdGFydCgpO1xuXHRcdFx0ICAgIH1cblx0XHRcdH1cblx0XHQgICAgICAgfVxuXHRcdCAgICAgICk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGdldF9lbnNHZW5lID0gZnVuY3Rpb24gKGlkKSB7XG5cdGVSZXN0LmNhbGwoe3VybCAgICAgOiBlUmVzdC51cmwuZ2VuZSAoe2lkIDogaWR9KSxcblx0XHQgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdGNvbmYuZW5zZ2VuZV9zZWFyY2gocmVzcCk7XG5cblx0XHRcdHZhciBleHRyYSA9IH5+KChyZXNwLmVuZCAtIHJlc3Auc3RhcnQpICogKGNvbmYuY29udGV4dC8xMDApKTtcblx0XHRcdGdlbm9tZV9icm93c2VyXG5cdFx0XHQgICAgLnNwZWNpZXMocmVzcC5zcGVjaWVzKVxuXHRcdFx0ICAgIC5jaHIocmVzcC5zZXFfcmVnaW9uX25hbWUpXG5cdFx0XHQgICAgLmZyb20ocmVzcC5zdGFydCAtIGV4dHJhKVxuXHRcdFx0ICAgIC50byhyZXNwLmVuZCArIGV4dHJhKTtcblxuXHRcdFx0Z2Vub21lX2Jyb3dzZXIuc3RhcnQoIHsgc3BlY2llcyA6IHJlc3Auc3BlY2llcyxcblx0XHRcdFx0XHQgIGNociAgICAgOiByZXNwLnNlcV9yZWdpb25fbmFtZSxcblx0XHRcdFx0XHQgIGZyb20gICAgOiByZXNwLnN0YXJ0IC0gZXh0cmEsXG5cdFx0XHRcdFx0ICB0byAgICAgIDogcmVzcC5lbmQgKyBleHRyYVxuXHRcdFx0XHRcdH0gKTtcblx0XHQgICAgfVxuXHRcdCAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgc3BsaXRfaG9tb2xvZ3VlcyA9IGZ1bmN0aW9uIChob21vbG9ndWVzKSB7XG5cdHZhciBvcnRob1BhdHQgPSAvb3J0aG9sb2cvO1xuXHR2YXIgcGFyYVBhdHQgPSAvcGFyYWxvZy87XG5cblx0dmFyIG9ydGhvbG9ndWVzID0gaG9tb2xvZ3Vlcy5maWx0ZXIoZnVuY3Rpb24oZCl7cmV0dXJuIGQudHlwZS5tYXRjaChvcnRob1BhdHQpfSk7XG5cdHZhciBwYXJhbG9ndWVzICA9IGhvbW9sb2d1ZXMuZmlsdGVyKGZ1bmN0aW9uKGQpe3JldHVybiBkLnR5cGUubWF0Y2gocGFyYVBhdHQpfSk7XG5cblx0cmV0dXJuIHsnb3J0aG9sb2d1ZXMnIDogb3J0aG9sb2d1ZXMsXG5cdFx0J3BhcmFsb2d1ZXMnICA6IHBhcmFsb2d1ZXN9O1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMoZ2Vub21lX2Jyb3dzZXIpXG5cdC5nZXRzZXQgKGNvbmYpO1xuXG4gICAgYXBpLm1ldGhvZCAoe1xuXHRzdGFydCAgICAgIDogc3RhcnQsXG5cdGhvbW9sb2d1ZXMgOiBob21vbG9ndWVzXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZ2Vub21lX2Jyb3dzZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfYm9hcmRfZ2Vub21lO1xuIiwidmFyIGJvYXJkID0gcmVxdWlyZShcInRudC5ib2FyZFwiKTtcbmJvYXJkLmdlbm9tZSA9IHJlcXVpcmUoXCIuL2dlbm9tZVwiKTtcbmJvYXJkLnRyYWNrLmxheW91dC5mZWF0dXJlID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xuYm9hcmQudHJhY2suZmVhdHVyZS5nZW5lID0gcmVxdWlyZShcIi4vZmVhdHVyZVwiKTtcbmJvYXJkLnRyYWNrLmRhdGEuZ2VuZSA9IHJlcXVpcmUoXCIuL2RhdGFcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGJvYXJkO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xuXG4vLyBUaGUgb3ZlcmxhcCBkZXRlY3RvciB1c2VkIGZvciBnZW5lc1xudmFyIGdlbmVfbGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gUHJpdmF0ZSB2YXJzXG4gICAgdmFyIG1heF9zbG90cztcblxuICAgIC8vIHZhcnMgZXhwb3NlZCBpbiB0aGUgQVBJOlxuICAgIHZhciBjb25mID0ge1xuXHRoZWlnaHQgICA6IDE1MCxcblx0c2NhbGUgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgdmFyIGNvbmZfcm8gPSB7XG5cdGVsZW1lbnRzIDogW11cbiAgICB9O1xuXG4gICAgdmFyIHNsb3RfdHlwZXMgPSB7XG5cdCdleHBhbmRlZCcgICA6IHtcblx0ICAgIHNsb3RfaGVpZ2h0IDogMzAsXG5cdCAgICBnZW5lX2hlaWdodCA6IDEwLFxuXHQgICAgc2hvd19sYWJlbCAgOiB0cnVlXG5cdH0sXG5cdCdjb2xsYXBzZWQnIDoge1xuXHQgICAgc2xvdF9oZWlnaHQgOiAxMCxcblx0ICAgIGdlbmVfaGVpZ2h0IDogNyxcblx0ICAgIHNob3dfbGFiZWwgIDogZmFsc2Vcblx0fVxuICAgIH07XG4gICAgdmFyIGN1cnJlbnRfc2xvdF90eXBlID0gJ2V4cGFuZGVkJztcblxuICAgIC8vIFRoZSByZXR1cm5lZCBjbG9zdXJlIC8gb2JqZWN0XG4gICAgdmFyIGdlbmVzX2xheW91dCA9IGZ1bmN0aW9uIChuZXdfZ2VuZXMsIHNjYWxlKSB7XG5cblx0Ly8gV2UgbWFrZSBzdXJlIHRoYXQgdGhlIGdlbmVzIGhhdmUgbmFtZVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5ld19nZW5lcy5sZW5ndGg7IGkrKykge1xuXHQgICAgaWYgKG5ld19nZW5lc1tpXS5leHRlcm5hbF9uYW1lID09PSBudWxsKSB7XG5cdFx0bmV3X2dlbmVzW2ldLmV4dGVybmFsX25hbWUgPSBcIlwiO1xuXHQgICAgfVxuXHR9XG5cblx0bWF4X3Nsb3RzID0gfn4oY29uZi5oZWlnaHQgLyBzbG90X3R5cGVzLmV4cGFuZGVkLnNsb3RfaGVpZ2h0KSAtIDE7XG5cblx0aWYgKHNjYWxlICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGdlbmVzX2xheW91dC5zY2FsZShzY2FsZSk7XG5cdH1cblxuXHRzbG90X2tlZXBlcihuZXdfZ2VuZXMsIGNvbmZfcm8uZWxlbWVudHMpO1xuXHR2YXIgbmVlZGVkX3Nsb3RzID0gY29sbGl0aW9uX2RldGVjdG9yKG5ld19nZW5lcyk7XG5cdGlmIChuZWVkZWRfc2xvdHMgPiBtYXhfc2xvdHMpIHtcblx0ICAgIGN1cnJlbnRfc2xvdF90eXBlID0gJ2NvbGxhcHNlZCc7XG5cdH0gZWxzZSB7XG5cdCAgICBjdXJyZW50X3Nsb3RfdHlwZSA9ICdleHBhbmRlZCc7XG5cdH1cblxuXHRjb25mX3JvLmVsZW1lbnRzID0gbmV3X2dlbmVzO1xuICAgIH07XG5cbiAgICB2YXIgZ2VuZV9zbG90ID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gc2xvdF90eXBlc1tjdXJyZW50X3Nsb3RfdHlwZV07XG4gICAgfTtcblxuICAgIHZhciBjb2xsaXRpb25fZGV0ZWN0b3IgPSBmdW5jdGlvbiAoZ2VuZXMpIHtcblx0dmFyIGdlbmVzX3BsYWNlZCA9IFtdO1xuXHR2YXIgZ2VuZXNfdG9fcGxhY2UgPSBnZW5lcztcblx0dmFyIG5lZWRlZF9zbG90cyA9IDA7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZ2VuZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChnZW5lc1tpXS5zbG90ID4gbmVlZGVkX3Nsb3RzICYmIGdlbmVzW2ldLnNsb3QgPCBtYXhfc2xvdHMpIHtcblx0XHRuZWVkZWRfc2xvdHMgPSBnZW5lc1tpXS5zbG90XG4gICAgICAgICAgICB9XG5cdH1cblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGdlbmVzX3RvX3BsYWNlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZ2VuZXNfYnlfc2xvdCA9IHNvcnRfZ2VuZXNfYnlfc2xvdChnZW5lc19wbGFjZWQpO1xuXHQgICAgdmFyIHRoaXNfZ2VuZSA9IGdlbmVzX3RvX3BsYWNlW2ldO1xuXHQgICAgaWYgKHRoaXNfZ2VuZS5zbG90ICE9PSB1bmRlZmluZWQgJiYgdGhpc19nZW5lLnNsb3QgPCBtYXhfc2xvdHMpIHtcblx0XHRpZiAoc2xvdF9oYXNfc3BhY2UodGhpc19nZW5lLCBnZW5lc19ieV9zbG90W3RoaXNfZ2VuZS5zbG90XSkpIHtcblx0XHQgICAgZ2VuZXNfcGxhY2VkLnB1c2godGhpc19nZW5lKTtcblx0XHQgICAgY29udGludWU7XG5cdFx0fVxuXHQgICAgfVxuICAgICAgICAgICAgdmFyIHNsb3QgPSAwO1xuICAgICAgICAgICAgT1VURVI6IHdoaWxlICh0cnVlKSB7XG5cdFx0aWYgKHNsb3RfaGFzX3NwYWNlKHRoaXNfZ2VuZSwgZ2VuZXNfYnlfc2xvdFtzbG90XSkpIHtcblx0XHQgICAgdGhpc19nZW5lLnNsb3QgPSBzbG90O1xuXHRcdCAgICBnZW5lc19wbGFjZWQucHVzaCh0aGlzX2dlbmUpO1xuXHRcdCAgICBpZiAoc2xvdCA+IG5lZWRlZF9zbG90cykge1xuXHRcdFx0bmVlZGVkX3Nsb3RzID0gc2xvdDtcblx0XHQgICAgfVxuXHRcdCAgICBicmVhaztcblx0XHR9XG5cdFx0c2xvdCsrO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiBuZWVkZWRfc2xvdHMgKyAxO1xuICAgIH07XG5cbiAgICB2YXIgc2xvdF9oYXNfc3BhY2UgPSBmdW5jdGlvbiAocXVlcnlfZ2VuZSwgZ2VuZXNfaW5fdGhpc19zbG90KSB7XG5cdGlmIChnZW5lc19pbl90aGlzX3Nsb3QgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIHRydWU7XG5cdH1cblx0Zm9yICh2YXIgaiA9IDA7IGogPCBnZW5lc19pbl90aGlzX3Nsb3QubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBzdWJqX2dlbmUgPSBnZW5lc19pbl90aGlzX3Nsb3Rbal07XG5cdCAgICBpZiAocXVlcnlfZ2VuZS5pZCA9PT0gc3Vial9nZW5lLmlkKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG4gICAgICAgICAgICB2YXIgeV9sYWJlbF9lbmQgPSBzdWJqX2dlbmUuZGlzcGxheV9sYWJlbC5sZW5ndGggKiA4ICsgY29uZi5zY2FsZShzdWJqX2dlbmUuc3RhcnQpOyAvLyBUT0RPOiBJdCBtYXkgYmUgYmV0dGVyIHRvIGhhdmUgYSBmaXhlZCBmb250IHNpemUgKGluc3RlYWQgb2YgdGhlIGhhcmRjb2RlZCAxNik/XG4gICAgICAgICAgICB2YXIgeTEgID0gY29uZi5zY2FsZShzdWJqX2dlbmUuc3RhcnQpO1xuICAgICAgICAgICAgdmFyIHkyICA9IGNvbmYuc2NhbGUoc3Vial9nZW5lLmVuZCkgPiB5X2xhYmVsX2VuZCA/IGNvbmYuc2NhbGUoc3Vial9nZW5lLmVuZCkgOiB5X2xhYmVsX2VuZDtcblx0ICAgIHZhciB4X2xhYmVsX2VuZCA9IHF1ZXJ5X2dlbmUuZGlzcGxheV9sYWJlbC5sZW5ndGggKiA4ICsgY29uZi5zY2FsZShxdWVyeV9nZW5lLnN0YXJ0KTtcbiAgICAgICAgICAgIHZhciB4MSA9IGNvbmYuc2NhbGUocXVlcnlfZ2VuZS5zdGFydCk7XG4gICAgICAgICAgICB2YXIgeDIgPSBjb25mLnNjYWxlKHF1ZXJ5X2dlbmUuZW5kKSA+IHhfbGFiZWxfZW5kID8gY29uZi5zY2FsZShxdWVyeV9nZW5lLmVuZCkgOiB4X2xhYmVsX2VuZDtcbiAgICAgICAgICAgIGlmICggKCh4MSA8IHkxKSAmJiAoeDIgPiB5MSkpIHx8XG5cdFx0ICgoeDEgPiB5MSkgJiYgKHgxIDwgeTIpKSApIHtcblx0XHRyZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cdH1cblx0cmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciBzbG90X2tlZXBlciA9IGZ1bmN0aW9uIChnZW5lcywgcHJldl9nZW5lcykge1xuXHR2YXIgcHJldl9nZW5lc19zbG90cyA9IGdlbmVzMnNsb3RzKHByZXZfZ2VuZXMpO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZ2VuZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChwcmV2X2dlbmVzX3Nsb3RzW2dlbmVzW2ldLmlkXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0Z2VuZXNbaV0uc2xvdCA9IHByZXZfZ2VuZXNfc2xvdHNbZ2VuZXNbaV0uaWRdO1xuICAgICAgICAgICAgfVxuXHR9XG4gICAgfTtcblxuICAgIHZhciBnZW5lczJzbG90cyA9IGZ1bmN0aW9uIChnZW5lc19hcnJheSkge1xuXHR2YXIgaGFzaCA9IHt9O1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGdlbmVzX2FycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZ2VuZSA9IGdlbmVzX2FycmF5W2ldO1xuICAgICAgICAgICAgaGFzaFtnZW5lLmlkXSA9IGdlbmUuc2xvdDtcblx0fVxuXHRyZXR1cm4gaGFzaDtcbiAgICB9XG5cbiAgICB2YXIgc29ydF9nZW5lc19ieV9zbG90ID0gZnVuY3Rpb24gKGdlbmVzKSB7XG5cdHZhciBzbG90cyA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGdlbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2xvdHNbZ2VuZXNbaV0uc2xvdF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdHNsb3RzW2dlbmVzW2ldLnNsb3RdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzbG90c1tnZW5lc1tpXS5zbG90XS5wdXNoKGdlbmVzW2ldKTtcblx0fVxuXHRyZXR1cm4gc2xvdHM7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAoZ2VuZXNfbGF5b3V0KVxuXHQuZ2V0c2V0IChjb25mKVxuXHQuZ2V0IChjb25mX3JvKVxuXHQubWV0aG9kICh7XG5cdCAgICBnZW5lX3Nsb3QgOiBnZW5lX3Nsb3Rcblx0fSk7XG5cbiAgICByZXR1cm4gZ2VuZXNfbGF5b3V0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZ2VuZV9sYXlvdXQ7XG4iLCIvLyBpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuLy8gICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0ge307XG4vLyB9XG4vLyB0bnQubGVnZW5kID0gcmVxdWlyZShcIi4vc3JjL2xlZ2VuZC5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB0bnRfbGVnZW5kID0gcmVxdWlyZShcIi4vc3JjL2xlZ2VuZC5qc1wiKTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcbnZhciBib2FyZCA9IHJlcXVpcmUgKFwidG50LmJvYXJkXCIpO1xudmFyIGl0ZXJhdG9yID0gcmVxdWlyZShcInRudC51dGlsc1wiKS5pdGVyYXRvcjtcblxudmFyIHRudF9sZWdlbmQgPSBmdW5jdGlvbiAoZGl2KSB7XG5cbiAgICBkMy5zZWxlY3QoZGl2KVxuXHQuYXR0cihcImNsYXNzXCIsIFwidG50X2ZyYW1lZFwiKTtcblxuICAgIHZhciBvcHRzID0ge1xuXHRyb3dfaGVpZ2h0IDogMjAsXG5cdHdpZHRoICAgICAgOiAxNDAsXG5cdGZvbnRzaXplICAgOiAxMlxuICAgIH07XG5cbiAgICB2YXIgaWQgPSBpdGVyYXRvcigxKTtcbiAgICB2YXIgbGVnZW5kX2NvbHMgPSBbXTtcblxuICAgIHZhciBfID0gZnVuY3Rpb24gKCkge1xuXHRmb3IgKHZhciBpPTA7IGk8bGVnZW5kX2NvbHMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBjb2wgPSBsZWdlbmRfY29sc1tpXTtcblx0ICAgIGNvbC5ib2FyZChjb2wuZGl2KTtcblx0ICAgIGNvbC5ib2FyZC5zdGFydCgpO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAoXylcblx0LmdldHNldChvcHRzKTtcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfY29sdW1uJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgZGl2X2lkID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJ0YWJsZVwiKVxuXHQgICAgLmF0dHIoXCJpZFwiKTtcblxuXHR2YXIgbmV3X2RpdiA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImlkXCIsIGRpdl9pZCArIFwiX1wiICsgaWQoKSlcblx0ICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJ0YWJsZS1jZWxsXCIpO1xuXG5cdHZhciBuZXdfYm9hcmQgPSBib2FyZCgpXG5cdCAgICAucmlnaHQoMilcblx0ICAgIC5mcm9tICgxKVxuXHQgICAgLnRvICgyKVxuXHQgICAgLmFsbG93X2RyYWcgKGZhbHNlKVxuXHQgICAgLnNob3dfZnJhbWUgKGZhbHNlKVxuXHQgICAgLndpZHRoIChvcHRzLndpZHRoKTtcblxuXHRuZXdfYm9hcmQuYWRkX3JvdyA9IG5ld19ib2FyZC5hZGRfdHJhY2s7XG5cblx0bGVnZW5kX2NvbHMucHVzaCAoe1xuXHQgICAgJ2RpdicgOiBuZXdfZGl2Lm5vZGUoKSxcblx0ICAgICdib2FyZCcgOiBuZXdfYm9hcmRcblx0fSk7XG5cblx0cmV0dXJuIG5ld19ib2FyZDtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdoZWFkZXInLCBmdW5jdGlvbiAodGV4dCkge1xuXHR2YXIgZmVhdHVyZSA9IGJvYXJkLnRyYWNrLmZlYXR1cmUoKTtcblxuXHRmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKGcsIHhTY2FsZSkge1xuXHQgICAgdmFyIHRyYWNrID0gdGhpcztcblx0ICAgIGdcblx0XHQuYXBwZW5kKFwidGV4dFwiKVxuXHRcdC5hdHRyKFwiZmlsbFwiLCBcImJsYWNrXCIpXG5cdFx0LmF0dHIoXCJmb250LXNpemVcIiwgdHJhY2suZm9udHNpemUoKSlcblx0XHQuYXR0cihcInhcIiwgeFNjYWxlKDEpKVxuXHRcdC5hdHRyKFwieVwiLCB+fnRyYWNrLmhlaWdodCgpLzIpXG5cdFx0LmF0dHIoXCJmb250LXdlaWdodFwiLCBcImJvbGRcIilcblx0XHQudGV4dCh0cmFjay50ZXh0KCkpO1xuXHR9KTtcblxuXHR2YXIgdHJhY2sgPSBsZWdlbmRfdHJhY2soKVxuXHQgICAgLmRpc3BsYXkgKGZlYXR1cmUpO1xuXG5cdHJldHVybiB0cmFjaztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0ZXh0JywgZnVuY3Rpb24gKCkge1xuXHR2YXIgdHJhY2sgPSBsZWdlbmRfdHJhY2soKVxuXHQgICAgLmRlcGxveSAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBnID0gdGhpcztcblx0XHRkMy5zZWxlY3QoZylcblx0XHQgICAgLmFwcGVuZChcInRleHRcIilcblx0XHQgICAgLmF0dHIoXCJ4XCIsIDApXG5cdFx0ICAgIC5hdHRyKFwieVwiLCB+fih0cmFjay5oZWlnaHQoKSAvIDIpICsgNClcblx0XHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmNvbG9yKCkpXG5cdFx0ICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIHRyYWNrLmZvbnRzaXplKCkpXG5cdFx0ICAgIC50ZXh0KHRyYWNrLmZlYXR1cmVfdGV4dCgpKTtcblx0ICAgIH0pO1xuXG5cdGFwaWpzICh0cmFjaylcblx0ICAgIC5nZXRzZXQgKCdmZWF0dXJlX3RleHQnLCAnJyk7XG5cdFxuXHRyZXR1cm4gdHJhY2s7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaGxpbmUnLCBmdW5jdGlvbiAoKSB7XG5cdHZhciB0cmFjayA9IGxlZ2VuZF90cmFjaygpXG5cdCAgICAuZGVwbG95IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGcgPSB0aGlzO1xuXHRcdGQzLnNlbGVjdChnKVxuXHRcdCAgICAuYXBwZW5kKFwibGluZVwiKVxuXHRcdCAgICAuYXR0cihcIngxXCIsIDApXG5cdFx0ICAgIC5hdHRyKFwieDJcIiwgdHJhY2suZmVhdHVyZV93aWR0aCgpKVxuXHRcdCAgICAuYXR0cihcInkxXCIsIH5+KHRyYWNrLmhlaWdodCgpLzIpKVxuXHRcdCAgICAuYXR0cihcInkyXCIsIH5+KHRyYWNrLmhlaWdodCgpLzIpKVxuXHRcdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAyKVxuXHRcdCAgICAuYXR0cihcInN0cm9rZVwiLCB0cmFjay5jb2xvcigpKTtcblx0ICAgIH0pO1xuXG5cdHJldHVybiB0cmFjaztcblxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3ZsaW5lJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgdHJhY2sgPSBsZWdlbmRfdHJhY2soKVxuXHQgICAgLmRlcGxveSAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBnID0gdGhpcztcblx0XHRkMy5zZWxlY3QoZylcblx0XHQgICAgLmFwcGVuZChcImxpbmVcIilcblx0XHQgICAgLmF0dHIoXCJzdHJva2VcIiwgdHJhY2suY29sb3IoKSlcblx0XHQgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMilcblx0XHQgICAgLmF0dHIoXCJ4MVwiLCA1KVxuXHRcdCAgICAuYXR0cihcIngyXCIsIDUpXG5cdFx0ICAgIC5hdHRyKFwieTFcIiwgMClcblx0XHQgICAgLmF0dHIoXCJ5MlwiLCB0cmFjay5oZWlnaHQoKSk7XG5cdCAgICB9KTtcblxuXHRyZXR1cm4gdHJhY2s7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnc3F1YXJlJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgdHJhY2sgPSBsZWdlbmRfdHJhY2soKVxuXHQgICAgLmRlcGxveSAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciB3X2ggPSB+fih0cmFjay5oZWlnaHQoKSowLjgpO1xuXHRcdHZhciBnID0gdGhpcztcblx0XHRkMy5zZWxlY3QoZylcblx0XHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0XHQgICAgLmF0dHIoXCJ4XCIsIDApXG5cdFx0ICAgIC5hdHRyKFwieVwiLCB0cmFjay5oZWlnaHQoKSAtIHdfaClcblx0XHQgICAgLmF0dHIoXCJ3aWR0aFwiLCB3X2gpXG5cdFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHdfaClcblx0XHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmNvbG9yKCkpO1xuXHQgICAgfSk7XG5cblx0cmV0dXJuIHRyYWNrO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2NpcmNsZScsIGZ1bmN0aW9uICgpIHtcblx0dmFyIGZlYXR1cmUgPSBib2FyZC50cmFjay5mZWF0dXJlKClcblx0ZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChnLCB4U2NhbGUpIHtcblx0ICAgIHZhciB0cmFjayA9IHRoaXM7XG5cdCAgICB2YXIgcmFkID0gfn4odHJhY2suaGVpZ2h0KCkvMik7XG5cdCAgICBnXG5cdFx0LmFwcGVuZChcImNpcmNsZVwiKVxuXHRcdC5hdHRyKFwiY3hcIiwgcmFkKVxuXHRcdC5hdHRyKFwiY3lcIiwgfn4ocmFkLzIpKVxuXHRcdC5hdHRyKFwiclwiLCByYWQtMilcblx0XHQuYXR0cihcImZpbGxcIiwgdHJhY2suY29sb3IoKSk7XG5cdCAgICBnXG5cdFx0LmFwcGVuZChcInRleHRcIilcblx0XHQuYXR0cihcImZpbGxcIiwgXCJibGFja1wiKVxuXHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIHRyYWNrLmZvbnRzaXplKCkpXG5cdFx0LmF0dHIoXCJ4XCIsIDQwKVxuXHRcdC5hdHRyKFwieVwiLCB+fih0cmFjay5oZWlnaHQoKS8yICsgNCkpXG5cdFx0LnRleHQodHJhY2sudGV4dCgpKTtcblx0fSk7XG5cblx0dmFyIHRyYWNrID0gbGVnZW5kX3RyYWNrKClcblx0ICAgIC5kaXNwbGF5IChmZWF0dXJlKTtcblxuXHRyZXR1cm4gdHJhY2s7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZ3JhZGllbnQnLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBmZWF0dXJlID0gYm9hcmQudHJhY2suZmVhdHVyZSgpXG5cdGZlYXR1cmUuY3JlYXRlIChmdW5jdGlvbiAoZywgeFNjYWxlKSB7XG5cdCAgICB2YXIgZ3JhZF93aWR0aCA9IDEwMDtcblx0ICAgIHZhciB0cmFjayA9IHRoaXM7XG5cdCAgICB2YXIgZ3JhZGllbnQgPSBnXG5cdFx0LmFwcGVuZChcImxpbmVhckdyYWRpZW50XCIpXG5cdFx0LmF0dHIoXCJ4MVwiLCBcIjAlXCIpXG5cdFx0LmF0dHIoXCJ4MlwiLCBcIjEwMCVcIilcblx0XHQuYXR0cihcInkxXCIsIFwiMCVcIilcblx0XHQuYXR0cihcInkyXCIsIFwiMCVcIilcblx0XHQuYXR0cihcImlkXCIsIGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKSArIFwiX2dyYWRpZW50XCIpO1xuXG5cdCAgICBncmFkaWVudFxuXHRcdC5hcHBlbmQoXCJzdG9wXCIpXG5cdFx0LmF0dHIoXCJvZmZzZXRcIiwgXCIwJVwiKVxuXHRcdC5hdHRyKFwic3RvcC1jb2xvclwiLCB0cmFjay5jb2xvcjEoKSlcblx0XHQuYXR0cihcInN0b3Atb3BhY2l0eVwiLCAxKTtcblxuXHQgICAgZ3JhZGllbnRcblx0XHQuYXBwZW5kKFwic3RvcFwiKVxuXHRcdC5hdHRyKFwib2Zmc2V0XCIsIFwiMTAwJVwiKVxuXHRcdC5hdHRyKFwic3RvcC1jb2xvclwiLCB0cmFjay5jb2xvcjIoKSlcblx0XHQuYXR0cihcInN0b3Atb3BhY2l0eVwiLCAxKTtcblxuXHQgICAgdmFyIHNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcblx0XHQuZG9tYWluKFt0cmFjay5mcm9tKCksIHRyYWNrLnRvKCldKVxuXHRcdC5yYW5nZShbMCxncmFkX3dpZHRoXSk7XG5cdCAgICB2YXIgYXhpcyA9IGQzLnN2Zy5heGlzKCkuc2NhbGUoc2NhbGUpLnRpY2tTaXplKDApLnRpY2tzKDMpO1xuXHQgICAgdmFyIGdyYWRfZyA9IGdcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDUsMClcIik7XG5cblx0ICAgIHZhciBheGlzX2cgPSBnXG5cdFx0LmFwcGVuZChcImdcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSg1LFwiICsgKHRyYWNrLmhlaWdodCgpLTEwKSArIFwiKVwiKVxuXHRcdC5jYWxsKGF4aXMpO1xuXG5cdCAgICBncmFkX2dcblx0XHQuYXBwZW5kKFwicmVjdFwiKVxuXHRcdC5hdHRyKFwieFwiLCAwKVxuXHRcdC5hdHRyKFwieVwiLCAwKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgZ3JhZF93aWR0aClcblx0XHQuYXR0cihcImhlaWdodFwiLCB+fih0cmFjay5oZWlnaHQoKS0xMCkpXG5cdFx0LmF0dHIoXCJmaWxsXCIsIFwidXJsKCNcIiArIGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKSArIFwiX2dyYWRpZW50KVwiKTtcblxuXHQgICAgZ3JhZF9nXG5cdFx0LmFwcGVuZChcInRleHRcIilcblx0XHQuYXR0cihcImZpbGxcIiwgXCJibGFja1wiKVxuXHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIHRyYWNrLmZvbnRzaXplKCkpXG5cdFx0LmF0dHIoXCJ4XCIsIDExMClcblx0XHQuYXR0cihcInlcIiwgfn4odHJhY2suaGVpZ2h0KCkvMikpXG5cdFx0LnRleHQodHJhY2sudGV4dCgpKTtcblx0fSk7XG5cblx0Ly8gdGhlIGdlbmVyYWwgdHJhY2tcblx0dmFyIHRyYWNrID0gbGVnZW5kX3RyYWNrKClcblx0ICAgIC5kaXNwbGF5IChmZWF0dXJlKTtcblx0dHJhY2suY29sb3IgPSB1bmRlZmluZWQ7XG5cdHZhciBhcGkgPSBhcGlqcyh0cmFjayk7XG5cdGFwaVxuXHQgICAgLmdldHNldCAoXCJjb2xvcjFcIiwgXCJ5ZWxsb3dcIilcblx0ICAgIC5nZXRzZXQgKFwiY29sb3IyXCIsIFwicmVkXCIpXG5cdCAgICAuZ2V0c2V0IChcImZyb21cIiwgMClcblx0ICAgIC5nZXRzZXQgKFwidG9cIiwgMTAwKVxuXG5cdHJldHVybiB0cmFjaztcbiAgICB9KTtcblxuXG4gICAgYXBpLm1ldGhvZCAoJ3JhbmdlJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgZmVhdHVyZSA9IGJvYXJkLnRyYWNrLmZlYXR1cmUoKVxuXHRmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKGcsIHhTY2FsZSkge1xuXHQgICAgdmFyIHRyYWNrID0gdGhpcztcblx0ICAgIHZhciBncmFkX3dpZHRoID0gMTAwO1xuXHQgICAgdmFyIGdyYWRpZW50ID0gZ1xuXHRcdC5hcHBlbmQoXCJsaW5lYXJHcmFkaWVudFwiKVxuXHRcdC5hdHRyKFwieDFcIiwgXCIwJVwiKVxuXHRcdC5hdHRyKFwieDJcIiwgXCIxMDAlXCIpXG5cdFx0LmF0dHIoXCJ5MVwiLCBcIjAlXCIpXG5cdFx0LmF0dHIoXCJ5MlwiLCBcIjAlXCIpXG5cdFx0LmF0dHIoXCJpZFwiLCBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIikgKyBcIl9yYW5nZVwiKTtcblx0ICAgIGdyYWRpZW50XG5cdFx0LmFwcGVuZChcInN0b3BcIilcblx0XHQuYXR0cihcIm9mZnNldFwiLCBcIjAlXCIpXG5cdFx0LmF0dHIoXCJzdG9wLWNvbG9yXCIsIHRyYWNrLmNvbG9yMSgpKVxuXHRcdC5hdHRyKFwic3RvcC1vcGFjaXR5XCIsIDEpO1xuXHQgICAgZ3JhZGllbnRcblx0XHQuYXBwZW5kKFwic3RvcFwiKVxuXHRcdC5hdHRyKFwib2Zmc2V0XCIsIFwiMTAwJVwiKVxuXHRcdC5hdHRyKFwic3RvcC1jb2xvclwiLCB0cmFjay5jb2xvcjIoKSlcblx0XHQuYXR0cihcInN0b3Atb3BhY2l0eVwiLCAxKTtcblxuXHQgICAgdmFyIHNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcblx0XHQuZG9tYWluKFt0cmFjay5mcm9tKCksIHRyYWNrLnRvKCldKVxuXHRcdC5yYW5nZShbMCwgZ3JhZF93aWR0aF0pO1xuXG5cdCAgICB2YXIgYnJ1c2ggPSBkMy5zdmcuYnJ1c2goKVxuXHRcdC54KHNjYWxlKVxuXHRcdC5leHRlbnQoW3RyYWNrLmZyb20oKSwgdHJhY2sudG8oKV0pXG5cdFx0Lm9uKFwiYnJ1c2hzdGFydFwiLCBicnVzaHN0YXJ0KVxuXHRcdC5vbihcImJydXNoXCIsIGJydXNobW92ZSlcblx0XHQub24oXCJicnVzaGVuZFwiLCBicnVzaGVuZCk7XG5cblx0ICAgIHZhciBicnVzaGcgPSBnXG5cdFx0LmFwcGVuZChcImdcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSg1LDUpXCIpXG5cdFx0LmNhbGwgKGJydXNoKTtcblxuXHQgICAgYnJ1c2hnLnNlbGVjdEFsbChcIi5yZXNpemVcIikuYXBwZW5kKFwibGluZVwiKVxuXHRcdC5hdHRyKFwieDFcIiwgMClcblx0XHQuYXR0cihcInkxXCIsIDApXG5cdFx0LmF0dHIoXCJ4MlwiLCAwKVxuXHRcdC5hdHRyKFwieTJcIiwgKHRyYWNrLmhlaWdodCgpLzIgLSAyKSlcblx0XHQuc3R5bGUoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAyKTtcblxuXHQgICAgYnJ1c2hnLnNlbGVjdEFsbChcIi5yZXNpemVcIikuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5hdHRyKFwiZFwiLCBcIk0wLDBMLTMsLTRMMywtNEwwLDBcIilcblx0XHQuYXR0cihcImZpbGxcIiwgXCJibGFja1wiKTtcblxuXHQgICAgYnJ1c2hnLnNlbGVjdEFsbCAoXCJyZWN0XCIpXG5cdFx0LmNsYXNzZWQoXCJ0bnRfbGVnZW5kX3JhbmdlXCIsIHRydWUpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkvMiAtIDIpXG5cdFx0LmF0dHIoXCJmaWxsXCIsIFwidXJsKCNcIiArIGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKSArIFwiX3JhbmdlKVwiKTtcblxuXHQgICAgYnJ1c2hnXG5cdFx0LmFwcGVuZChcInJlY3RcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwidG50X2xlZ2VuZF9yYW5nZV9wcmVcIilcblx0XHQuYXR0cihcInhcIiwgMClcblx0XHQuYXR0cihcInlcIiwgMClcblx0XHQuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKS8yIC0gMilcblx0XHQuYXR0cihcImZpbGxcIiwgdHJhY2suY29sb3IxKCkpO1xuXG5cdCAgICBicnVzaGdcblx0XHQuYXBwZW5kKFwicmVjdFwiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfbGVnZW5kX3JhbmdlX3Bvc3RcIilcblx0XHQuYXR0cihcInlcIiwgMClcblx0XHQuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKS8yIC0gMilcblx0XHQuYXR0cihcImZpbGxcIiwgdHJhY2suY29sb3IyKCkpO1xuXG5cdCAgICBicnVzaHN0YXJ0KCk7XG5cdCAgICBicnVzaG1vdmUoKTtcblxuXHQgICAgdmFyIGF4aXMgPSBkMy5zdmcuYXhpcygpLnNjYWxlKHNjYWxlKS50aWNrU2l6ZSgwKS50aWNrcygzKTtcblx0ICAgIHZhciBheGlzX2cgPSBnXG5cdFx0LmFwcGVuZChcImdcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSg1LFwiICsgKHRyYWNrLmhlaWdodCgpLTEwKSArIFwiKVwiKVxuXHRcdC5jYWxsKGF4aXMpO1xuXG5cdCAgICBnXG5cdFx0LmFwcGVuZChcInRleHRcIilcblx0XHQuYXR0cihcImZpbGxcIiwgXCJibGFja1wiKVxuXHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIHRyYWNrLmZvbnRzaXplKCkpXG5cdFx0LmF0dHIoXCJ4XCIsIDExNSlcblx0XHQuYXR0cihcInlcIiwgfn4odHJhY2suaGVpZ2h0KCkvMiArIDMpKVxuXHRcdC50ZXh0KHRyYWNrLnRleHQoKSk7XG5cblx0ICAgIGZ1bmN0aW9uIGJydXNoc3RhcnQgKCkge1xuXHQgICAgfVxuXHQgICAgZnVuY3Rpb24gYnJ1c2htb3ZlICgpIHtcblx0XHRjb25zb2xlLmxvZyhicnVzaC5leHRlbnQoKSk7XG5cdFx0YnJ1c2hnLnNlbGVjdEFsbCAoXCIudG50X2xlZ2VuZF9yZWN0XCIpXG5cdFx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcInVybCgjXCIgKyBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIikgKyBcIl9yYW5nZSlcIik7XG5cdFx0YnJ1c2hnLnNlbGVjdEFsbCAoXCIudG50X2xlZ2VuZF9yYW5nZV9wcmVcIilcblx0XHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBzY2FsZShicnVzaC5leHRlbnQoKVswXSktMSlcblx0XHRicnVzaGcuc2VsZWN0QWxsIChcIi50bnRfbGVnZW5kX3JhbmdlX3Bvc3RcIilcblx0XHQgICAgLmF0dHIoXCJ4XCIsIHNjYWxlKGJydXNoLmV4dGVudCgpWzFdKSsxKVxuXHRcdCAgICAuYXR0cihcIndpZHRoXCIsICBncmFkX3dpZHRoIC0gc2NhbGUoYnJ1c2guZXh0ZW50KClbMV0pKTtcblx0XHR0cmFjay5vbl9jaGFuZ2UoKS5jYWxsKGJydXNoKTtcblx0ICAgIH1cblx0ICAgIGZ1bmN0aW9uIGJydXNoZW5kICgpIHtcblx0XHRjb25zb2xlLmxvZyhicnVzaC5leHRlbnQoKSk7XG5cdCAgICB9XG5cblx0fSk7XG5cblx0dmFyIHRyYWNrID0gbGVnZW5kX3RyYWNrKClcblx0ICAgIC5kaXNwbGF5IChmZWF0dXJlKTtcblx0dHJhY2suY29sb3IgPSB1bmRlZmluZWQ7XG5cdHZhciBhcGkgPSBhcGlqcyh0cmFjayk7XG5cdGFwaVxuXHQgICAgLmdldHNldCAoXCJjb2xvcjFcIiwgXCJ5ZWxsb3dcIilcblx0ICAgIC5nZXRzZXQgKFwiY29sb3IyXCIsIFwicmVkXCIpXG5cdCAgICAuZ2V0c2V0IChcImZyb21cIiwgMClcblx0ICAgIC5nZXRzZXQgKFwidG9cIiwgMTAwKVxuXHQgICAgLmdldHNldCAoXCJvbl9jaGFuZ2VcIiwgZnVuY3Rpb24gKCl7fSk7XG5cblx0cmV0dXJuIHRyYWNrO1xuICAgIH0pO1xuXG5cbiAgICBhcGkubWV0aG9kICgnZW1wdHknLCBmdW5jdGlvbiAoY29sb3IsIGRlc2MpIHtcblx0dmFyIHRyYWNrID0gYm9hcmQudHJhY2soKVxuXHQgICAgLmhlaWdodChvcHRzLnJvd19oZWlnaHQpXG5cdCAgICAuYmFja2dyb3VuZF9jb2xvcihcIndoaXRlXCIpXG5cdCAgICAuZGF0YShudWxsKVxuXHQgICAgLmRpc3BsYXkobnVsbCk7XG5cblx0cmV0dXJuIHRyYWNrO1xuICAgIH0pO1xuXG4gICAgdmFyIGxlZ2VuZF90cmFjayA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGZlYXR1cmUgPSBib2FyZC50cmFjay5mZWF0dXJlKCk7XG5cdGZlYXR1cmUuY3JlYXRlIChmdW5jdGlvbiAoZywgeFNjYWxlKSB7XG5cdCAgICB2YXIgdHJhY2sgPSB0aGlzO1xuXHQgICAgLy8gZmVhdHVyZVxuXHQgICAgdmFyIGZlYXR1cmVfZyA9IGdcblx0XHQuYXBwZW5kKFwiZ1wiKTtcblx0ICAgIFxuXHQgICAgdHJhY2suZGVwbG95KCkuY2FsbChmZWF0dXJlX2cubm9kZSgpKTtcblxuXHQgICAgLy8gbGFiZWxcblx0ICAgIGdcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgKHRyYWNrLmZlYXR1cmVfd2lkdGgoKSArIDUpICsgXCIsIDApXCIpXG5cdFx0LmFwcGVuZChcInRleHRcIilcblx0XHQuYXR0cihcImZpbGxcIiwgXCJibGFja1wiKVxuXHRcdC5hdHRyKFwieFwiLCAwKVxuXHRcdC5hdHRyKFwieVwiLCB+fih0cmFjay5oZWlnaHQoKS8yKSArIDQpIC8vIFRPRE86IERvbid0IGhhcmRjb2RlIHRoZSA0XG5cdFx0LmF0dHIoXCJmb250LXNpemVcIiwgdHJhY2suZm9udHNpemUoKSlcblx0XHQudGV4dCh0cmFjay50ZXh0KCkpO1xuXHR9KTtcblxuXHR2YXIgdHJhY2sgPSBib2FyZC50cmFjaygpO1xuXG5cdHZhciBhcGkgPSBhcGlqcyAodHJhY2spXG5cdCAgICAuZ2V0c2V0ICgnY29sb3InLCAnYmxhY2snKVxuXHQgICAgLmdldHNldCAoJ3RleHQnLCAnJylcblx0ICAgIC5nZXRzZXQgKCdoZWlnaHQnLCBvcHRzLnJvd19oZWlnaHQpXG5cdCAgICAuZ2V0c2V0ICgnZm9udHNpemUnLCBvcHRzLmZvbnRzaXplKVxuXHQgICAgLmdldHNldCAoJ2ZlYXR1cmVfd2lkdGgnLCA0MClcblx0ICAgIC5nZXRzZXQgKCdkZXBsb3knLCBmdW5jdGlvbiAoKSB7XG5cdFx0dGhyb3cgKCdkZXBsb3kgaXMgbm90IGRlZmluZWQgaW4gdGhlIGxlZ2VuZCBiYXNlIGNsYXNzJyk7XG5cdCAgICB9KTtcblxuXHR0cmFja1xuXHQgICAgLmhlaWdodCAodHJhY2suaGVpZ2h0KCkpXG5cdCAgICAuYmFja2dyb3VuZF9jb2xvciAoXCJ3aGl0ZVwiKVxuXHQgICAgLmRhdGEgKGJvYXJkLnRyYWNrLmRhdGEoKVxuXHRcdCAgIC51cGRhdGUoXG5cdFx0ICAgICAgIGJvYXJkLnRyYWNrLmRhdGEucmV0cmlldmVyLnN5bmMoKVxuXHRcdFx0ICAgLnJldHJpZXZlciAoZnVuY3Rpb24gKCkge1xuXHRcdFx0ICAgICAgIHJldHVybiBbe31dO1xuXHRcdFx0ICAgfSlcblx0XHQgICAgICAgKVxuXHRcdCAgKVxuXHQgICAgLmRpc3BsYXkgKGZlYXR1cmUpO1xuXG5cdHJldHVybiB0cmFjaztcbiAgICB9O1xuXG4gICAgcmV0dXJuIF87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfbGVnZW5kO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB0b29sdGlwID0gcmVxdWlyZShcIi4vc3JjL3Rvb2x0aXAuanNcIik7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcblxudmFyIHRvb2x0aXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgZHJhZyA9IGQzLmJlaGF2aW9yLmRyYWcoKTtcbiAgICB2YXIgdG9vbHRpcF9kaXY7XG5cbiAgICB2YXIgY29uZiA9IHtcblx0YmFja2dyb3VuZF9jb2xvciA6IFwid2hpdGVcIixcblx0Zm9yZWdyb3VuZF9jb2xvciA6IFwiYmxhY2tcIixcblx0cG9zaXRpb24gOiBcInJpZ2h0XCIsXG5cdGFsbG93X2RyYWcgOiB0cnVlLFxuXHRzaG93X2Nsb3NlciA6IHRydWUsXG5cdGZpbGwgOiBmdW5jdGlvbiAoKSB7IHRocm93IFwiZmlsbCBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIjsgfSxcblx0d2lkdGggOiAxODAsXG5cdGlkIDogMVxuICAgIH07XG5cbiAgICB2YXIgdCA9IGZ1bmN0aW9uIChkYXRhLCBldmVudCkge1xuXHRkcmFnXG5cdCAgICAub3JpZ2luKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHt4OnBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcImxlZnRcIikpLFxuXHRcdFx0eTpwYXJzZUludChkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJ0b3BcIikpXG5cdFx0ICAgICAgIH07XG5cdCAgICB9KVxuXHQgICAgLm9uKFwiZHJhZ1wiLCBmdW5jdGlvbigpIHtcblx0XHRpZiAoY29uZi5hbGxvd19kcmFnKSB7XG5cdFx0ICAgIGQzLnNlbGVjdCh0aGlzKVxuXHRcdFx0LnN0eWxlKFwibGVmdFwiLCBkMy5ldmVudC54ICsgXCJweFwiKVxuXHRcdFx0LnN0eWxlKFwidG9wXCIsIGQzLmV2ZW50LnkgKyBcInB4XCIpO1xuXHRcdH1cblx0ICAgIH0pO1xuXG5cdC8vIFRPRE86IFdoeSBkbyB3ZSBuZWVkIHRoZSBkaXYgZWxlbWVudD9cblx0Ly8gSXQgbG9va3MgbGlrZSBpZiB3ZSBhbmNob3IgdGhlIHRvb2x0aXAgaW4gdGhlIFwiYm9keVwiXG5cdC8vIFRoZSB0b29sdGlwIGlzIG5vdCBsb2NhdGVkIGluIHRoZSByaWdodCBwbGFjZSAoYXBwZWFycyBhdCB0aGUgYm90dG9tKVxuXHQvLyBTZWUgY2xpZW50cy90b29sdGlwc190ZXN0Lmh0bWwgZm9yIGFuIGV4YW1wbGVcblx0dmFyIGNvbnRhaW5lckVsZW0gPSBzZWxlY3RBbmNlc3RvciAodGhpcywgXCJkaXZcIik7XG5cdGlmIChjb250YWluZXJFbGVtID09PSB1bmRlZmluZWQpIHtcblx0ICAgIC8vIFdlIHJlcXVpcmUgYSBkaXYgZWxlbWVudCBhdCBzb21lIHBvaW50IHRvIGFuY2hvciB0aGUgdG9vbHRpcFxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0Ly8gQ29udGFpbmVyIGVsZW1lbnQgcG9zaXRpb24gKG5lZWRlZCBmb3IgXCJyZWxhdGl2ZVwiIHBvc2l0aW9uZWQgcGFyZW50cylcblx0Ly8gaWUgaGFzIHNjcm9sbFRvcCBhbmQgc2Nyb2xsTGVmdCBvbiBkb2N1bWVudEVsZW1lbnQgaW5zdGVhZCBvZiBib2R5XG5cdC8vIHZhciBzY3JvbGxUb3AgPSAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3ApIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wO1xuXHQvLyB2YXIgc2Nyb2xsTGVmdCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQpIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdDtcblx0Ly8gdmFyIGVsZW1Qb3MgPSBjb250YWluZXJFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHQvLyB2YXIgZWxlbVRvcCA9IGVsZW1Qb3MudG9wICsgc2Nyb2xsVG9wO1xuXHQvLyB2YXIgZWxlbUxlZnQgPSBlbGVtUG9zLmxlZnQgKyBzY3JvbGxMZWZ0O1xuXHRcblx0dG9vbHRpcF9kaXYgPSBkMy5zZWxlY3QoY29udGFpbmVyRWxlbSlcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdG9vbHRpcFwiKVxuXHQgICAgLmNsYXNzZWQoXCJ0bnRfdG9vbHRpcF9hY3RpdmVcIiwgdHJ1ZSkgIC8vIFRPRE86IElzIHRoaXMgbmVlZGVkL3VzZWQ/Pz9cblx0ICAgIC5jYWxsKGRyYWcpO1xuXG5cdC8vIHByZXYgdG9vbHRpcHMgd2l0aCB0aGUgc2FtZSBoZWFkZXJcblx0ZDMuc2VsZWN0KFwiI3RudF90b29sdGlwX1wiICsgY29uZi5pZCkucmVtb3ZlKCk7XG5cblx0aWYgKChkMy5ldmVudCA9PT0gbnVsbCkgJiYgKGV2ZW50KSkge1xuXHQgICAgZDMuZXZlbnQgPSBldmVudDtcblx0fVxuXHR2YXIgZDNtb3VzZSA9IGQzLm1vdXNlKGNvbnRhaW5lckVsZW0pO1xuXHQvLyB2YXIgbW91c2UgPSBbZDMuZXZlbnQucGFnZVgsIGQzLmV2ZW50LnBhZ2VZXTtcblx0ZDMuZXZlbnQgPSBudWxsO1xuXG5cdHZhciBvZmZzZXQgPSAwO1xuXHRpZiAoY29uZi5wb3NpdGlvbiA9PT0gXCJsZWZ0XCIpIHtcblx0ICAgIG9mZnNldCA9IGNvbmYud2lkdGg7XG5cdH1cblx0XG5cdHRvb2x0aXBfZGl2LmF0dHIoXCJpZFwiLCBcInRudF90b29sdGlwX1wiICsgY29uZi5pZCk7XG5cdFxuXHQvLyBXZSBwbGFjZSB0aGUgdG9vbHRpcFxuXHR0b29sdGlwX2RpdlxuXHQvLyAuc3R5bGUoXCJsZWZ0XCIsIChtb3VzZVswXSAtIG9mZnNldCAtIGVsZW1MZWZ0KSArIFwicHhcIilcblx0Ly8gLnN0eWxlKFwidG9wXCIsIG1vdXNlWzFdIC0gZWxlbVRvcCArIFwicHhcIik7XG5cdCAgICAuc3R5bGUoXCJsZWZ0XCIsIChkM21vdXNlWzBdKSArIFwicHhcIilcblx0ICAgIC5zdHlsZShcInRvcFwiLCAoZDNtb3VzZVsxXSkgKyBcInB4XCIpO1xuXG5cdC8vIENsb3NlXG5cdGlmIChjb25mLnNob3dfY2xvc2VyKSB7XG5cdCAgICB0b29sdGlwX2Rpdi5hcHBlbmQoXCJzcGFuXCIpXG5cdFx0LnN0eWxlKFwicG9zaXRpb25cIiwgXCJhYnNvbHV0ZVwiKVxuXHRcdC5zdHlsZShcInJpZ2h0XCIsIFwiLTEwcHhcIilcblx0XHQuc3R5bGUoXCJ0b3BcIiwgXCItMTBweFwiKVxuXHRcdC5hcHBlbmQoXCJpbWdcIilcblx0XHQuYXR0cihcInNyY1wiLCB0b29sdGlwLmltYWdlcy5jbG9zZSlcblx0XHQuYXR0cihcIndpZHRoXCIsIFwiMjBweFwiKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMjBweFwiKVxuXHRcdC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgdC5jbG9zZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0Y29uZi5maWxsLmNhbGwodG9vbHRpcF9kaXYsIGRhdGEpO1xuXG5cdC8vIHJldHVybiB0aGlzIGhlcmU/XG5cdHJldHVybiB0O1xuICAgIH07XG5cbiAgICAvLyBnZXRzIHRoZSBmaXJzdCBhbmNlc3RvciBvZiBlbGVtIGhhdmluZyB0YWduYW1lIFwidHlwZVwiXG4gICAgLy8gZXhhbXBsZSA6IHZhciBteWRpdiA9IHNlbGVjdEFuY2VzdG9yKG15ZWxlbSwgXCJkaXZcIik7XG4gICAgZnVuY3Rpb24gc2VsZWN0QW5jZXN0b3IgKGVsZW0sIHR5cGUpIHtcblx0dHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0aWYgKGVsZW0ucGFyZW50Tm9kZSA9PT0gbnVsbCkge1xuXHQgICAgY29uc29sZS5sb2coXCJObyBtb3JlIHBhcmVudHNcIik7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHZhciB0YWdOYW1lID0gZWxlbS5wYXJlbnROb2RlLnRhZ05hbWU7XG5cblx0aWYgKCh0YWdOYW1lICE9PSB1bmRlZmluZWQpICYmICh0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUpKSB7XG5cdCAgICByZXR1cm4gZWxlbS5wYXJlbnROb2RlO1xuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIHNlbGVjdEFuY2VzdG9yIChlbGVtLnBhcmVudE5vZGUsIHR5cGUpO1xuXHR9XG4gICAgfVxuICAgIFxuICAgIHZhciBhcGkgPSBhcGlqcyh0KVxuXHQuZ2V0c2V0KGNvbmYpO1xuICAgIGFwaS5jaGVjaygncG9zaXRpb24nLCBmdW5jdGlvbiAodmFsKSB7XG5cdHJldHVybiAodmFsID09PSAnbGVmdCcpIHx8ICh2YWwgPT09ICdyaWdodCcpO1xuICAgIH0sIFwiT25seSAnbGVmdCcgb3IgJ3JpZ2h0JyB2YWx1ZXMgYXJlIGFsbG93ZWQgZm9yIHBvc2l0aW9uXCIpO1xuXG4gICAgYXBpLm1ldGhvZCgnY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG5cdHRvb2x0aXBfZGl2LnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLmxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlzdCB0b29sdGlwIGlzIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcbiAgICB2YXIgd2lkdGggPSAxODA7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblx0dmFyIG9ial9pbmZvX2xpc3QgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdC8vIFRvb2x0aXAgaGVhZGVyXG5cdG9ial9pbmZvX2xpc3Rcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLnRleHQob2JqLmhlYWRlcik7XG5cblx0Ly8gVG9vbHRpcCByb3dzXG5cdHZhciB0YWJsZV9yb3dzID0gb2JqX2luZm9fbGlzdC5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGRcIilcblx0ICAgIC5zdHlsZShcInRleHQtYWxpZ25cIiwgXCJjZW50ZXJcIilcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS52YWx1ZTtcblx0ICAgIH0pXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmxpbmsgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKVxuXHRcdCAgICAuY2xhc3NlZChcImxpbmtcIiwgMSlcblx0XHQgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRkLmxpbmsoZC5vYmopO1xuXHRcdFx0dC5jbG9zZS5jYWxsKHRoaXMpO1xuXHRcdCAgICB9KTtcblx0ICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0O1xufTtcblxudG9vbHRpcC50YWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyB0YWJsZSB0b29sdGlwcyBhcmUgYmFzZWQgb24gZ2VuZXJhbCB0b29sdGlwc1xuICAgIHZhciB0ID0gdG9vbHRpcCgpO1xuICAgIFxuICAgIHZhciB3aWR0aCA9IDE4MDtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gVG9vbHRpcCBoZWFkZXJcblx0b2JqX2luZm9fdGFibGVcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLmF0dHIoXCJjb2xzcGFuXCIsIDIpXG5cdCAgICAudGV4dChvYmouaGVhZGVyKTtcblxuXHQvLyBUb29sdGlwIHJvd3Ncblx0dmFyIHRhYmxlX3Jvd3MgPSBvYmpfaW5mb190YWJsZS5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS5sYWJlbDtcblx0ICAgIH0pO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0aWYgKHR5cGVvZiBvYmoucm93c1tpXS52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdCAgICBvYmoucm93c1tpXS52YWx1ZS5jYWxsKHRoaXMsIGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBvYmoucm93c1tpXS52YWx1ZTtcblx0XHR9XG5cdCAgICB9KVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5saW5rID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRkMy5zZWxlY3QodGhpcylcblx0XHQgICAgLmNsYXNzZWQoXCJsaW5rXCIsIDEpXG5cdFx0ICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0ZC5saW5rKGQub2JqKTtcblx0XHRcdHQuY2xvc2UuY2FsbCh0aGlzKTtcblx0XHQgICAgfSk7XG5cdCAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0O1xufTtcblxudG9vbHRpcC5wbGFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBwbGFpbiB0b29sdGlwcyBhcmUgYmFzZWQgb24gZ2VuZXJhbCB0b29sdGlwc1xuICAgIHZhciB0ID0gdG9vbHRpcCgpO1xuXG4gICAgdC5maWxsIChmdW5jdGlvbiAob2JqKSB7XG5cdHZhciB0b29sdGlwX2RpdiA9IHRoaXM7XG5cblx0dmFyIG9ial9pbmZvX3RhYmxlID0gdG9vbHRpcF9kaXZcblx0ICAgIC5hcHBlbmQoXCJ0YWJsZVwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudVwiKVxuXHQgICAgLmF0dHIoXCJib3JkZXJcIiwgXCJzb2xpZFwiKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgdC53aWR0aCgpICsgXCJweFwiKTtcblxuXHRvYmpfaW5mb190YWJsZVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuXHQgICAgLmFwcGVuZChcInRoXCIpXG5cdCAgICAudGV4dChvYmouaGVhZGVyKTtcblxuXHRvYmpfaW5mb190YWJsZVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmFwcGVuZChcInRkXCIpXG5cdCAgICAuc3R5bGUoXCJ0ZXh0LWFsaWduXCIsIFwiY2VudGVyXCIpXG5cdCAgICAuaHRtbChvYmouYm9keSk7XG5cbiAgICB9KTtcblxuICAgIHJldHVybiB0O1xufTtcblxuLy8gVE9ETzogVGhpcyBzaG91bGRuJ3QgYmUgZXhwb3NlZCBpbiB0aGUgQVBJLiBJdCB3b3VsZCBiZSBiZXR0ZXIgdG8gaGF2ZSBhcyBhIGxvY2FsIHZhcmlhYmxlXG4vLyBvciBhbHRlcm5hdGl2ZWx5IGhhdmUgdGhlIGltYWdlcyBzb21ld2hlcmUgZWxzZSAoYWx0aG91Z2ggdGhlIG51bWJlciBvZiBoYXJkY29kZWQgaW1hZ2VzIHNob3VsZCBiZSBsZWZ0IGF0IGEgbWluaW11bSlcbnRvb2x0aXAuaW1hZ2VzID0ge307XG50b29sdGlwLmltYWdlcy5jbG9zZSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQVFBQUFBRUFDQVlBQUFCY2NxaG1BQUFLUTJsRFExQkpRME1nY0hKdlptbHNaUUFBZU5xZFUzZFlrL2NXUHQvM1pROVdRdGp3c1pkc2dRQWlJNndJeUJCWm9oQ1NBR0dFRUJKQXhZV0lDbFlVRlJHY1NGWEVndFVLU0oySTRxQW91R2RCaW9oYWkxVmNPTzRmM0tlMWZYcnY3ZTM3MS91ODU1em4vTTU1encrQUVSSW1rZWFpYWdBNVVvVThPdGdmajA5SXhNbTlnQUlWU09BRUlCRG15OEpuQmNVQUFQQURlWGgrZExBLy9BR3Zid0FDQUhEVkxpUVN4K0gvZzdwUUpsY0FJSkVBNENJUzV3c0JrRklBeUM1VXlCUUF5QmdBc0ZPelpBb0FsQUFBYkhsOFFpSUFxZzBBN1BSSlBnVUEyS21UM0JjQTJLSWNxUWdBalFFQW1TaEhKQUpBdXdCZ1ZZRlNMQUxBd2dDZ3JFQWlMZ1RBcmdHQVdiWXlSd0tBdlFVQWRvNVlrQTlBWUFDQW1VSXN6QUFnT0FJQVF4NFR6UU1nVEFPZ01OSy80S2xmY0lXNFNBRUF3TXVWelpkTDBqTVV1SlhRR25meThPRGlJZUxDYkxGQ1lSY3BFR1lKNUNLY2w1c2pFMGpuQTB6T0RBQUFHdm5Sd2Y0NFA1RG41dVRoNW1ibmJPLzB4YUwrYS9CdklqNGg4ZC8rdkl3Q0JBQVFUcy92MmwvbDVkWURjTWNCc0hXL2E2bGJBTnBXQUdqZitWMHoyd21nV2dyUWV2bUxlVGo4UUI2ZW9WRElQQjBjQ2dzTDdTVmlvYjB3NDRzKy96UGhiK0NMZnZiOFFCNysyM3J3QUhHYVFKbXR3S09EL1hGaGJuYXVVbzdueXdSQ01XNzM1eVAreDRWLy9ZNHAwZUkwc1Z3c0ZZcnhXSW00VUNKTngzbTVVcEZFSWNtVjRoTHBmekx4SDViOUNaTjNEUUNzaGsvQVRyWUh0Y3Rzd0g3dUFRS0xEbGpTZGdCQWZ2TXRqQm9Ma1FBUVp6UXllZmNBQUpPLytZOUFLd0VBelplazR3QUF2T2dZWEtpVUYwekdDQUFBUktDQktyQkJCd3pCRkt6QURwekJIYnpBRndKaEJrUkFEQ1RBUEJCQ0J1U0FIQXFoR0paQkdWVEFPdGdFdGJBREdxQVJtdUVRdE1FeE9BM240QkpjZ2V0d0Z3WmdHSjdDR0x5R0NRUkJ5QWdUWVNFNmlCRmlqdGdpemdnWG1ZNEVJbUZJTkpLQXBDRHBpQlJSSXNYSWNxUUNxVUpxa1YxSUkvSXRjaFE1alZ4QStwRGJ5Q0F5aXZ5S3ZFY3hsSUd5VVFQVUFuVkF1YWdmR29yR29IUFJkRFFQWFlDV29tdlJHclFlUFlDMm9xZlJTK2gxZEFCOWlvNWpnTkV4RG1hTTJXRmNqSWRGWUlsWUdpYkhGbVBsV0RWV2p6VmpIVmczZGhVYndKNWg3d2drQW91QUUrd0lYb1FRd215Q2tKQkhXRXhZUTZnbDdDTzBFcm9JVndtRGhESENKeUtUcUUrMEpYb1MrY1I0WWpxeGtGaEdyQ2J1SVI0aG5pVmVKdzRUWDVOSUpBN0prdVJPQ2lFbGtESkpDMGxyU050SUxhUlRwRDdTRUdtY1RDYnJrRzNKM3VRSXNvQ3NJSmVSdDVBUGtFK1MrOG5ENUxjVU9zV0k0a3dKb2lSU3BKUVNTalZsUCtVRXBaOHlRcG1ncWxITnFaN1VDS3FJT3A5YVNXMmdkbEF2VTRlcEV6UjFtaVhObXhaRHk2UXRvOVhRbW1sbmFmZG9MK2wwdWduZGd4NUZsOUNYMG12b0Irbm42WVAwZHd3TmhnMkR4MGhpS0JsckdYc1pweGkzR1MrWlRLWUYwNWVaeUZRdzF6SWJtV2VZRDVodlZWZ3E5aXA4RlpIS0VwVTZsVmFWZnBYbnFsUlZjMVUvMVhtcUMxU3JWUStyWGxaOXBrWlZzMURqcVFuVUZxdlZxUjFWdTZrMnJzNVNkMUtQVU05Ulg2TytYLzJDK21NTnNvYUZScUNHU0tOVVk3ZkdHWTBoRnNZeVpmRllRdFp5VmdQckxHdVlUV0pic3Zuc1RIWUYreHQyTDN0TVUwTnpxbWFzWnBGbW5lWnh6UUVPeHJIZzhEblpuRXJPSWM0Tnpuc3RBeTAvTGJIV2FxMW1yWDZ0TjlwNjJyN2FZdTF5N1JidDY5cnZkWENkUUowc25mVTZiVHIzZFFtNk5ycFJ1b1c2MjNYUDZqN1RZK3Q1NlFuMXl2VU82ZDNSUi9WdDlLUDFGK3J2MXUvUkh6Y3dOQWcya0Jsc01UaGo4TXlRWStocm1HbTQwZkNFNGFnUnkyaTZrY1JvbzlGSm95ZTRKdTZIWitNMWVCYytacXh2SEdLc05ONWwzR3M4WVdKcE10dWt4S1RGNUw0cHpaUnJtbWE2MGJUVGRNek15Q3pjck5pc3lleU9PZFdjYTU1aHZ0bTgyL3lOaGFWRm5NVktpemFMeDViYWxuekxCWlpObHZlc21GWStWbmxXOVZiWHJFbldYT3NzNjIzV1YyeFFHMWViREpzNm04dTJxSzJicmNSMm0yM2ZGT0lVanluU0tmVlRidG94N1B6c0N1eWE3QWJ0T2ZaaDlpWDJiZmJQSGN3Y0VoM1dPM1E3ZkhKMGRjeDJiSEM4NjZUaE5NT3B4S25ENlZkbkcyZWhjNTN6TlJlbVM1RExFcGQybHhkVGJhZUtwMjZmZXN1VjVScnV1dEsxMC9Xam03dWIzSzNaYmRUZHpEM0ZmYXY3VFM2Ykc4bGR3ejN2UWZUdzkxamljY3pqbmFlYnA4THprT2N2WG5aZVdWNzd2UjVQczV3bW50WXdiY2pieEZ2Z3ZjdDdZRG8rUFdYNnp1a0RQc1krQXA5Nm40ZStwcjRpM3oyK0kzN1dmcGwrQi95ZSt6djZ5LzJQK0wvaGVmSVc4VTRGWUFIQkFlVUJ2WUVhZ2JNRGF3TWZCSmtFcFFjMUJZMEZ1d1l2REQ0VlFnd0pEVmtmY3BOdndCZnlHL2xqTTl4bkxKclJGY29JblJWYUcvb3d6Q1pNSHRZUmpvYlBDTjhRZm0rbStVenB6TFlJaU9CSGJJaTRIMmtabVJmNWZSUXBLaktxTHVwUnRGTjBjWFQzTE5hczVGbjdaNzJPOFkrcGpMazcyMnEyY25abnJHcHNVbXhqN0p1NGdMaXF1SUY0aC9oRjhaY1NkQk1rQ2UySjVNVFl4RDJKNDNNQzUyeWFNNXprbWxTV2RHT3U1ZHlpdVJmbTZjN0xubmM4V1RWWmtIdzRoWmdTbDdJLzVZTWdRbEF2R0UvbHAyNU5IUlB5aEp1RlQwVytvbzJpVWJHM3VFbzhrdWFkVnBYMk9OMDdmVVA2YUlaUFJuWEdNd2xQVWl0NWtSbVN1U1B6VFZaRTF0NnN6OWx4MlMwNWxKeVVuS05TRFdtV3RDdlhNTGNvdDA5bUt5dVREZVI1NW0zS0c1T0h5dmZrSS9sejg5c1ZiSVZNMGFPMFVxNVFEaFpNTDZncmVGc1lXM2k0U0wxSVd0UXozMmIrNnZrakM0SVdmTDJRc0ZDNHNMUFl1SGhaOGVBaXYwVzdGaU9MVXhkM0xqRmRVcnBrZUdudzBuM0xhTXV5bHYxUTRsaFNWZkpxZWR6eWpsS0QwcVdsUXl1Q1Z6U1ZxWlRKeTI2dTlGcTVZeFZobFdSVjcycVgxVnRXZnlvWGxWK3NjS3lvcnZpd1Jyam00bGRPWDlWODlYbHQydHJlU3JmSzdldEk2NlRyYnF6M1diK3ZTcjFxUWRYUWh2QU5yUnZ4amVVYlgyMUszblNoZW1yMWpzMjB6Y3JOQXpWaE5lMWJ6TGFzMi9LaE5xUDJlcDEvWGN0Vy9hMnJ0NzdaSnRyV3Y5MTNlL01PZ3gwVk85N3ZsT3k4dFN0NFYydTlSWDMxYnRMdWd0MlBHbUlidXIvbWZ0MjRSM2RQeFo2UGU2VjdCL1pGNyt0cWRHOXMzSysvdjdJSmJWSTJqUjVJT25EbG00QnYycHZ0bW5lMWNGb3FEc0pCNWNFbjM2WjhlK05RNktIT3c5ekR6ZCtaZjdmMUNPdEllU3ZTT3I5MXJDMmpiYUE5b2IzdjZJeWpuUjFlSFVlK3QvOSs3ekhqWTNYSE5ZOVhucUNkS0QzeCtlU0NrK09uWktlZW5VNC9QZFNaM0huM1RQeVphMTFSWGIxblE4K2VQeGQwN2t5M1gvZko4OTduajEzd3ZIRDBJdmRpMnlXM1M2MDlyajFIZm5EOTRVaXZXMi9yWmZmTDdWYzhyblQwVGVzNzBlL1RmL3Bxd05WejEvalhMbDJmZWIzdnh1d2J0MjRtM1J5NEpicjErSGIyN1JkM0N1NU0zRjE2ajNpdi9MN2EvZW9IK2cvcWY3VCtzV1hBYmVENFlNQmd6OE5aRCs4T0NZZWUvcFQvMDRmaDBrZk1SOVVqUmlPTmo1MGZIeHNOR3IzeVpNNlQ0YWV5cHhQUHluNVcvM25yYzZ2bjMvM2krMHZQV1B6WThBdjVpOCsvcm5tcDgzTHZxNm12T3Njanh4Kzh6bms5OGFiOHJjN2JmZSs0NzdyZng3MGZtU2o4UVA1UTg5SDZZOGVuMEUvM1B1ZDgvdnd2OTRUeis0QTVKUkVBQUFBR1lrdEhSQUQvQVA4QS82QzlwNU1BQUFBSmNFaFpjd0FBQ3hNQUFBc1RBUUNhbkJnQUFBQUhkRWxOUlFmZEN3TVVFZ2FOcWVYa0FBQWdBRWxFUVZSNDJ1MTllVmlVWmZmL21RMFFsV0ZuMkFWY3dJVWRBZGRjRURSTnpTVlJNeTJWeXJjMFUzdlRNbE96c3NVMUJkejNGUVFHbUkyQkFmU0hTbTVaV2ZvbStwYml2bVVLZ3B6Zkg5L09jODA4Z2t1dk92TU05N2t1cm5OWkxQT2MrM3crOStjKzk3bnZCNEFaTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmp4b3daTTJiTW1ERmpabjRUc1JDWTJoZGZmQ0ZDUkZGZFhaMm9vcUlDS2lvcVJBQUFpQ2hDUkJZZ0lTVzNTSVFpa1FoYXRHaUJBUUVCOUcrY09YTW1HOGpHVGdEejU4OFhWVlJVaUNzcUtpUUFJRDE5K3JUMHpKa3pNZ0N3QlFBWkFFZ0JRQUlBNHIrL0dGa0t6eEFBNnY3K3VnOEF0UUJRQXdEVkxWcTBxQWtJQ0tnRmdGcC9mLy83Z1lHQmRiTm56MFpHQUZacWMrZk9GWjA1YzBaU1VWRWhQWDM2dE8zWnMyZnRBYUNwcDZlbmMxeGNYRXVGUWhIbzZlbnAzNlZMbDBBM056ZUZyYTF0TXhzYm0yWVNpY1JXTEJZM1pWZ1NJUG9Sb2FhbTVpOEFxSzZxcXJwZFZWVjErOUtsU3hmKzMvLzdmNmNyS3l2UFhyaHc0WFI1ZWZsL0tpc3Jyd0hBWDM1K2ZuY0NBZ0txL2YzOWEvMzkvZS9QbXpjUEdRRUkyT2JNbVNNNmMrYU05TXlaTTdZR2c2RXBBRFR2MkxGallFeE1USHhpWW1MSDBORFFTQnNiRzBWTlRRMVVWMWZEdlh2M29LYW1CdXJxNnFDdXJnNFFrZnRpSmx3VGk4VWdFb2xBSkJLQldDd0dpVVFDTXBrTWJHeHNRQ3FWd3QyN2R5OGNQMzc4aUU2bk8zRDQ4T0d5UTRjT25RYUFQN3QyN2ZvWEFGUjM3ZHExZHNHQ0JjZ0lRQ0EyWnN3WXlkbXpaKzJLaTR1YjJkblpPUThaTXFSYi8vNzlFenQyN0JodFoyZm5lK2ZPSGJoejV3N1UxTlJBYlcwdDkzTzF0YlZ3N3R3NXVIMzdObFJXVm9KVUtvWEt5a3BvMHFRSlhMNThHZHpkM2VIU3BVdk1DOFM3dWJuQjNidDN3ZFBURTJwcmE4SFQweE9hTldzRzN0N2VJSlZLVFFoQ0twV0NyYTB0Mk5uWndaMDdkLzRvTHk4dlY2bFUycHljbkpMcTZ1cXJYYnAwdWUzbjUxZTFkZXZXKzR4U0xkQSsvUEJEMGF1dnZpcno5L2QzQklDQVhyMTZEVm0xYXRYMjMzLy8vZXFaTTJmdytQSGpXRjVlanZ2Mzc4ZXlzakpVcVZUNDZhZWY0dFNwVTdGNzkrN1l1M2R2dExPenc3Q3dNSlJLcFJnUkVZRlNxUlFqSXlOUkpwTmhWRlRVUTMxMGREVHpadkNQR3BmSXlFaVQ4UXdMQzBNN096dnMzYnMzZHUvZUhhZE9uWXB6NXN4QmxVcUZaV1ZsV0ZaV2hnY1BIc1REaHcvanp6Ly9qQ2RPbkxpK1pNbVNIZDI2ZFJzQ0FBRyt2cjZPeWNuSnN1blRwN09ha0NYWUJ4OThJQm8xYXBTTm41K2ZzNTJkWGZENDhlT24vL0RERDhmT25UdUhQLzMwRTVhWGwyTlpXUmtXRmhiaWloVXJjT2pRb1ppUWtJQlNxUlREdzhOUktwVnl5UlFiRzRzeW1Remo0K05SSnBOaHAwNmRVQ2FUWWVmT25kSEd4cVpCMzZWTEYrYk42QjgyUHNialNPTks0eHdkSFcyU0J3a0pDVGhreUJCY3NXSUZGaFlXWWxsWkdlN2Z2eDhQSHo2TUowNmN3SktTa2g5R2pSbzEzZGJXTnRqWDE5ZDV4SWdSTnUrLy96NGpBbk5aY25LeXpOZlgxOG5lM2o1a3hvd1pjeXNxS3Y0NGMrWU1Iamx5aEp2cDA5TFNNQ2twQ1dOaVlreG1kRXFDVHAwNm9ZMk5EWGJ0MmhWdGJHendoUmRlUUJzYkcrelJvd2ZhMnRwaXo1NDk2L1c5ZXZWaTNnSjlRK1BWbzBjUGsvR2w4U1p5b0h5SWlvcENxVlNLTVRFeDJLZFBIMHhOVGVXVVFYbDVPUjQvZmh3UEhUcjB4NlJKaytZMmFkSWt4TWZIeDJuWXNHRXloc2JuYU1PSEQ1ZjQrUGc0QUVEUU8rKzhNL1AwNmRPL256NTlHZzhkT29SbFpXV28wV2h3d29RSjJMVnJWNVJLcFp3Y2pJdUxRNWxNWmdKMjQrUkpTRWhBVzF0YlRFeE1SRnRiVzB4S1NtTGVpanlOSzQwempUdWZGQ2hQaUF5NmR1Mks0OGVQUjQxR2cyVmxaWGpnd0FFOGR1d1lscGVYL3o1Ky9QaVpBQkRrN2UzdDhQTExMMHNZT3AraFRaMDZWUlFmSDI4SEFGNUpTVW5KUjQ0Y09Ycm16Qms4ZlBnd2xwV1ZZWFoyTms2YU5BbnQ3ZTI1bVQ0dUxzNWtjR2xtNTRPOWI5KythR3RyaXkrKytLS0o3OSsvUCtmdDdPeVlGNUEzSGovK3VOSjQ4MG1CbEFLZkRDSWpJOUhlM2g0blRacUUyZG5aWEszZ2h4OStRSTFHYzdSNzkrN0pBT0RWc1dOSHUwbVRKckZsd2RPMm9VT0hTcnk5dlIwVkNrWGt1blhydHA4L2Y3NzIyTEZqdUgvL2ZsU3BWRGhreUJDTWlJaEFtVXlHSFR0MlJKbE14cTBSK2FDbkdhRmZ2MzRtNEI0d1lBRGEyZG5oU3krOVpPSUhEaHpJdklBOWZ6eHBuSWtjS0E4b0wvaGswS1ZMRjVPOGlvaUl3Q0ZEaG5DRncvTHljdnpoaHg5cXYvNzY2KzF1Ym02UlhsNWVqb01HRFpJeTFENEZtekpsaW1qbzBLRzJBT0RWdjMvL2NXZk9uRGwvOHVSSlBIandJQm9NQnB3NWN5WTJiZHFVbS9GcFRVL3luZ2JUZUlhdkQrd05KYytnUVlPWXR3TC9LSEtnZk9BckJNb2ZXaVpRelNBeU1oS2JObTJLTTJmT1JJUEJ3QlVMeThyS3ppY2tKSXdEQUsrQkF3ZmF2dlhXVzB3Ti9BL2dGM3Q3ZXplMXM3TnJ2V0xGaXRYbnpwMnJQWExrQ083YnR3K1hMVnVHdlhyMVFwbE1oakV4TVNheWpkWjJ4T2lQQXYzakp0SGd3WU9aRjVCL1VuSm9pQXdvajNyMTZtV1NaekV4TVNpVHliQlhyMTY0ZE9sUzNMZHZIKzdmdngrUEhEbFNPMi9ldkRXMnRyYXRQVDA5bTc3MTFsdGlodVovQm43SG9LQ2d6dnYyN1R2dzIyKy80WUVEQjFDdjErT0lFU013TEN5TTI5cDUySXhQOHI2aG1aN05rTXcvVEJuUU1xRWhSVUJiaTJGaFlUaGl4QWpVNi9WWVZsYUdodzRkd2wyN2RoMzA4L1ByN09ucDZmam1tMjh5RW5pQzliNFVBRnpqNCtPSFZsUlVWUDcwMDA5WVZsYUcyN2R2eDRDQUFHNnRUL3U5dE5YRFpuem1uNmNpNk5tenAwbS9RVVJFQkxabzBRSzNiZHVHKy9idHc0TUhEMkpKU1VsbGVIajRVQUJ3ZmVtbGwxaGQ0REhBTHdNQXhXdXZ2VGJwanovK3VIMzA2RkhjdDI4ZmZ2MzExeWlYeXpFcUtvcVRZYmEydHRpN2QrL0htdkVaeUpuL0orVHdLRVZBK1VmTGdxaW9LSlRMNWZqMTExOXpTNElEQnc3Y0hqeDQ4TDhBUURGZ3dBRFdNL0FJOEh0Tm16WnQ1cmx6NSs0ZE9uUUk5KzNiaCsrKys2N0pXcjk3OSs0bWNxeGZ2MzRtVE0xQXoveXpKQVBLTTlvOW9EenMzcjI3U1czZzNYZmY1VWlndkx6ODNyaHg0MllDZ0JjamdZZUEvK09QUDU3NysrKy8zejk0OENBV0ZCVGcyTEZqdVMwWVkvRDM2ZFBIQlB4c3JjLzg4NjROR0pNQTVTT1JBRzBaamgwN0Znc0tDbWhKY1AvTk45K2MrL2VPRmlNQnNpRkRoa2dCd1BQRER6LzhoTUN2MVdweCtQRGhYSnVtY2FHUG1qZjRhMzIybGNmODg5eEM1TmNHS0MrcFFFanR4Y09IRDBldFZrdHE0UDc0OGVNL0FRRFAvdjM3czVyQTBLRkRKUURnL3M0Nzcwei8vZmZmYXdqOGd3Y1BOdW5rbzJZZUtzQ3dHWjk1Uzl3dG9QeWtKaUxxSkJ3OGVMQXhDZFFrSnlkUEJ3RDMvdjM3Tjk3MjRjbVRKNHU5dmIyZGs1S1N4dnorKys5VkJ3OGVSSjFPaDBPSERqV1orZm5ncDVtZmRld3hiMGtkaHZ4ZEFpSUJVZ0pEaHc1Rm5VNkgrL2J0dzlMUzBxb3VYYnE4cGxBb25DZE9uTmo0dGdqZmZmZGRrYmUzdDBPSERoMzZuajE3OXZxaFE0ZXdzTEFRazVPVDZ3Vi9RN0tmZ1o5NVN5Q0JocFlEZkJKSVRrN0d3c0pDM0xkdkgrcjErdXN0Vzdic3ExQW9IQ1pNbU5DNE9nWmpZMk9idUxtNWhSODdkdXprMGFOSHNiUzBGRk5TVXRqTXo3elZLNEdVbEJRc0xTM0Z2WHYzNHU3ZHUwKzZ1TGlFUjBaR05tbE1SVDhaQVBoblpHU29mdjc1Wnl3dExjVzVjK2VhVlBzZnRlWm40R2Zla2ttZ29ab0E3UTdNblRzWFMwdExjZCsrZmZqVlYxK3BBTUMvVWV3TVRKNDhXUXdBYnRPblQ1OTkrdlJwM0x0M0w2NWF0UXB0YlcyNWZmNUhWZnNiT3JYSFBQUG05UHo4YkdoM0lDWW1CbTF0YlhIVnFsVllXbHFLcGFXbE9IcjA2RThBd0czQ2hBbldYUS93OXZadUZob2EydmZNbVRPM0R4dzRnRXFsRWwxY1hEQTZPcHJiNTdleHNYbmttcDk1NW9WQUJzWWtZSnpmMGRIUjZPTGlnams1T1ZoYVdvbzZuZTcyMy9XQVp0YmU3Qk5vTUJnT0hqMTZGRXRLU2pBbUpvWTd5dHV0V3plMHNiSGhtaXJZek0rOE5TbUJQbjM2b0kyTkRYYnIxbzA3VWh3ZEhZMGxKU1ZZVWxLQzZlbnBCd0VnMENvN0JmK1cvcTdUcDAvLzlOU3BVMWhhV29wVHAwN2xUdlhSNVIzODlsNytaUjNNTXk4a3orOFlURWhJTUxsa0pDd3NES2RPbllvbEpTVm9NQmh3OU9qUmN3SEExZXEyQnVQajQ1djQrZm5GL2ZiYmI5ZjM3OStQbVptWjNHMjhkSWtISGF4ZzRHZmVta21nZCsvZUpwZUxSRWRIWTJabUpwYVVsR0J1YnU1MUR3K1B1T2pvYU92WkZYai8vZmZGQU9DVm5wNisvZmp4NDFoY1hJeXZ2UEtLU2FjZlhlTFJ0MjlmVGpZeEVtRGVXc0JQK1V5bkNPbHlFZW9VZk9XVlY3QzR1QmdOQmdQKys5Ly8zZzRBWGxaemtVaW5UcDJhUmtkSHYzajY5T2w3ZS9mdXhSVXJWbkJYTC9PMy9JeUR4U2NCNXBrWG91Zm5NMzlya0s2cy8rNjc3N0M0dUJqVmF2Vzk0T0RnRjJOaVlvVC9Uc3JwMDZkTEFNQm4rL2J0K1VlT0hNSGk0bUpzMmJJbFJrWkdtcHp1UzB4TTVHUVNBei96MWtvQ2xOKzB5MFc3QXBHUmtkaXlaVXRPQmN5Yk55OGZBSHdtVFpvazdMTUNuVHQzYmhvZkgvL1NiNy85Vmx0YVdvcWZmdm9waG9hRzFsdjRhMGorTTgrOE5aR0E4ZlZpeGdYQjBOQlEvUFRUVDBrRjFMWnIxKzRsUWF1QUdUTm1pQUhBYS8zNjlWbUhEeDlHZzhHQVBYdjJOTG5Mei9nQ3ovb1VBUFBNVzVPbi9PWmZORXAzQy9iczJSTU5CZ01XRmhiaXJGbXpzZ0RBYTlLa1NXS2h6djUyclZxMTZuYnExS203cGFXbHVIanhZcFJLcGZXMit6THdNOTlZU2NDNFRWZ3FsZUxpeFl2UllEQ2dVcW04NitQajB5MG1Kc1pPY09DZk5tMmFDQUJjNTh5WnMrTFlzV05vTUJnd05EUVVJeUlpVE83MDY5T25EeWVMaklQRFBQUFc3Q25mcWVtTjdoU01pSWpBME5CUU5CZ01XRkJRZ09QR2pWc0JBSzZDZTl2UXlKRWpaUktKcFBVUFAvend4OTY5ZTNIOSt2WFl2bjE3azl0ODZaWGNmQVhBUFBPTndWUGVVMThBM1M3Y3ZuMTdYTDkrUFJZVkZlSG16WnYvRUl2RnJRY1BIaXlzN2tCZlg5OW1RNFlNbVhEaXhBa3NLaXA2NEtpdjhWWGVUQUV3MzFnVkFQK0tjZU1qdzBWRlJhaFNxYkJyMTY0VHZMeThoSE5HNElNUFBoQUJnR0xWcWxWWjVlWGxxTlZxVVM2WGN6My90UFZCOG9lQ1FOVlI1cGx2REo3eW5zNElkTy9lblRzajRPRGdnRnF0RmdzS0NuRDY5T2xaQUtENDE3LytKWXhsd0toUm8yUzJ0clp0Zi9ycHAyc2xKU1U0Yjk0ODdOQ2h3d1B5bjRHZmVVWUNTU2J0d2JRTTZOQ2hBODZiTnc4TEN3dHgyN1p0MTJReVdWdkJMQU82ZHUzYWRPREFnZU4rL1BGSExDd3N4REZqeHFCVUttM3dtaStoazhBL2ZWODlBMEhqamlOOS92cXVENU5LcFRobXpCZ3NMQ3pFM054YzdOU3AwN2lPSFRzMkZZcjhkMXV3WU1INjh2SnkxT2wwSnZLL1c3ZHVKaTlUNEpPQVVEeDlidkswbkNGUHowZWUvLy81UHkrMDUyZHhmTHJQVDg5bmZGUllMcGVqVHFkRHJWYUw0OGVQWHc4QWJ1Kzg4NDVsTHdObXpab2xBWUNBQXdjT25Dd3RMY1Z2di8yV3EvN1RxVDlxL2hIYW9EV1VyTFNjb2VlaUFpZmYwLytuNzIrc1pNRGlXSDg4cUNtSVRnbTJiOThldi8zMlc5VHI5Wmllbm40U0FBTGVmZmRkeTI0Tjd0YXRtNDIzdDNmc1R6LzlWRk5ZV0lpVEowODJPZmpEZjRzdmY5QXMxZk5uSkVwQ1dzNVFZWlAyYzZuTm1UejlkenI3UUQ5SHY0Yy93d2tsTGl5T1Q4ZnozenBNQjRRbVQ1Nk1lcjBlZCszYVZlUGk0aEliR3h0clkra0UwR3pZc0dGdkhUdDJEUFY2UFlhSGg1dGMrbUhNM0VKUFZyckJpQXFiZExTWk9oMzVudjQvZlQ4dGg2eWRERmdjSDg4VExvd3ZDd2tQRDBlOVhvODVPVG5ZdFd2WHR6cDI3R2p4MjRFdTc3Ly8vc3FEQncraVhxL253TTkvdzQrbER3cGZscEw4cEJtS2xqUDBJc2pJeUVoczBxUUpKaVFrWUh4OFBMNzIybXM0YU5BZ0hEdDJMSGJxMUFrVEVoTFEzdDZlZTdVNUtTTDZQVFNqMGQ5NWxMd1ZHdmlmTkk1OSt2VEIrUGg0SERWcUZBNGFOQWhIalJxRmNYRnhtSkNRZ0haMmRseE55VnJpU0orUC8wYWgwTkJRMUdxMXFGYXJjZWpRb1NzQndNVmlrVDl6NWt3UkFIaGxaV1VaU2twS2NQUG16U2lWU3JuQjRyL1NtMS9Rc1JUUG42bElsdEdNUTFjN1IwUkVZSFIwTkg3NDRZZTRkT2xTVkt2VldGQlEwT0NYUnFQQjVjdVg0OHlaTXpFMk5wYUxDODFzOVB0cG1kVFFUQ1lVL3lSeDdOaXg0MlBIVWFWUzRhSkZpM0Q2OU9rWUVSSEJrYXJRNDJqOHFuRWlRNmxVaXBzM2IwYU5Sb1B6NXMwekFJRFg1TW1UTGJNUStQSEhIMHNBSUdqLy92MW5pNHFLY1BiczJWd0JNRDQrM29TWmhaSzBORlBSNmNXb3FDaDBkM2ZIano3NkNIZnYzczFWYWZQeThuRFBuajI0ZGV0V1hMOStQYTVldlJyVDA5Tng3ZHExdUhIalJ0eTVjeWRtWjJlalNxVkNuVTZIQlFVRm1KbVppYk5uejBaL2YzL3VmZ1Q2Ty95WlRHZ2tRSitYUCtQVDgwVkdSbUpBUUFET25qMGJNekl5Nm8zamhnMGJjTTJhTmJocTFTcGN0MjRkRjhlY25CeFVxOVZjSEhmdTNJa2ZmdmdodXJtNVlWUlVWTDF4RkFvSlVMem9kR0Q3OXUxeDl1elpxTlBwTUMwdDdTd0FCRTJaTWtWaXFldC9tVmdzYm52czJMRXF2VjZQTTJiTVFLbFVhbkxsdHpIVDhiZDR6TzNwYzlFeWhRcE9ORlBGeDhmajlPblRVYVBSb0ZhclJhVlNpUnMzYnNTbFM1ZFdmL2poaDBkZmV1bWw5WjA3ZC80NFBEejg5Ylp0Mnc1dDBhSkZZa2hJeU5Dd3NMQnhuVHAxK25qQWdBRnJQL3JvbzhPcHFhbFZPM2Z1eFB6OGZOVHBkS2pUNlhEbXpKbGNFd2pOWktTWTZQTllhdHllTkk2ZE8zZkdEei84a0FOOVRrNE94YkdLNHRpcFU2ZVB3c1BEMytqUW9jUElGaTFhSklhR2hvNktpSWdZMzZsVHA0OWZmdm5sVFhQbnp2MXAxYXBWOTNidjNzMlJxbHF0eHZmZWU0OXJwNlcrRTRvamYxbGdxWEV6dmpwY0twWGlqQmt6c0tDZ0FEZHYzbHdsRm92YnhzWEZ5U3lWQUd3akl5TjdIemx5QkhVNkhRNFlNSUM3L0tOejU4NzFNckdsSmkxVm5XbHRPbjc4ZU16SXlFQ3RWb3Q3OXV6QjFOUlVuRFp0V25tblRwMCtkbkJ3NkFnQS9rVkZSYjN4SVZaVVZOUWJBUHliTjI4ZTNibHo1NW16WnMzYXYzbno1cnJjM0Z6VTZYU1lsWldGYjcvOXRzbmFsZ3FuRFJXNExNM3pDM3o4T0w3OTl0dTRaODhlMUdxMW1KbVppU3RXckxnL2RlclUvZkh4OFI4MWI5NDg1bkhpT0hYcTFOWUEwTUxKeWFsVDE2NWQ1M3o2NmFkSHRtelpnbmw1ZWFqVDZYRDM3dDA0ZHV4WWt6Z0toVXdwZmpRWmhJYUc0b0FCQTFDbjArR09IVHV3WmN1V3ZlUGk0bXd0bFFDYURoZ3dZTnozMzMrUE9wME9CdzBhWkxJRnlKZGpOQWptOXNaSmE3eUdqSTZPUmljbkoxeTRjQ0UzNDZlbnArTTc3N3l6TnpnNGVDUUFCTlRXMWxiZ1A3RGEydG9LQUdnUkhCdzhiTnEwYVVYYnQyOUhsVXFGV3EwV2x5eFpnaTR1THB5Y3BRSVhyYUg1TTVtbGVEclFRcCtUUG5kVVZCUTZPenZqa2lWTHVEaW1wYVhoVzIrOVpRZ0tDaG9LQUMzK2FSeXJxcW9NQUJBWUdocjY2c2NmZjN4ZzU4NmQzUEpnd1lJRktKZkxPUVZLNDhvblUwdkxRMUlBdEJVNGFOQWdqdGhpWTJQSHhjYkdXbVpIWU5ldVhac25KeWRQcDlkOHQyclZpdHNGb09CYld2STJCUDZvcUNoMGMzUERUWnMyb1VhandSMDdkdUJubjMxMk1Tb3FhaklBQk9CVE5BRHdqNDZPZnZPNzc3NDdwMVFxVWF2VjR1Yk5tOUhUMDVNckZGbzZDZFFIZmlwa0tSUUtycEMxZmZ0Mm5EZHYzdm13c0xDM0FhREZVNDVqWVBmdTNhZWxwNmRmeWMzTlJhMVdpeHMyYkRBaFUwc25BWW9qS1lDd3NEQnMxYW9WNm5RNjNMTm5EM2J2M24xNng0NGRtMXNrQWZqNStUbU9IVHQyZmxsWkdlcDBPb3lMaTdOb0JkQlFkVG9xS2dvVkNnVnUyN1lOMVdvMWJ0aXdBU2RObWxUcTR1TFMrZmJ0Mit2eEdWaFZWWlhCMmRtNTR3Y2ZmRkNRbFpXRldxMFdkKzNhaFg1K2ZseVYyN2l3WlV3QzVvcW5jY2VlOGVlaUFsWkVSQVQ2K3ZyaXJsMjdVSzFXNDdwMTZ6QWxKVVh2NU9RVVcxVlZaWGdXY2J4eTVjcW43dTd1M2ViT25icy9PenViSTFQakFtRkR1d1NXcWdEaTR1SlFwOU5oVGs0T0ppUWt6UGZ5OG5LMDFKMUFwL0hqeHk4cUxTM2xqZ0R6RlFDZmVjM2xDVHoxZ2QvRnhRVTNiZHFFS3BVS1Y2OWVqY25KeWJza0VrbHJmQTRtRm90YlRwdzRjV05tWmlhcTFXcmN1WE1uK3ZuNVlYaDRlTDBrWU81NGtuTGlnejg4UEJ4OWZYMXh4NDRkbUorZmo2dFdyY0xodzRkdkVvbEVMWjlISEdVeVdmRGt5Wk96OXV6Wmd4cU5CamR1M0ZpdkVpQVM0Sk9wdWVOcHJBRGtjamxYTEUxTVRGd0VBRTZXU2dET0V5ZE9YRmxTVW9KYXJSYmJ0Mjl2Y2djZ1h3RllTckNwVUJVZEhZMU5talRCOVBSMFZLbFV1SGJ0V2h3K2ZQaW1weTM1SDBQSytyMzIybXZMTEowRUhoZjg2ZW5wT0hEZ3dPVUE0UCtjNHhqNHpqdnY3TXpPemthTlJvT3BxYW5ZcEVrVHJpWkE0MjRwa3hKZkFkQWRnZTNidCtkcUowbEpTU3NBd05saUNTQWxKV1cxd1dCQXJWYUxVcW0wUVFYUTBFR1A1K1g1NEtjcTllelpzMUdqMGVDV0xWdHczTGh4dVFBUWlHWXdBUEN0andUNG5aWFVSc3VmeVo2MUorVkVmNTg2MThMQ3dob0N2Njg1NGlpVlNsdk5talZMazV1Yml4cU5CcWRQbi83QTdvQWw1cVd4QXBCS3BhalZhakUzTnhmNzlldTMycElKd0NVbEpXVjFVVkVSYWpRYURBNE9ObEVBMUxOdENVRTI3a0duL2VuRXhFUlVxOVdZa1pHQkgzNzQ0Uy8yOXZhaGFFWWpFc2pJeUVDVlNvVTdkdXhBWDE5ZnM1UEFvOEMvZmZ0MnpNdkx3N1MwTkh6cHBaZk1CbjZ5NXMyYmg2V21wdjZhbjUrUGFyVWFFeE1UVGZvdCtHY0p6SjJmeG5rcGxVb3hPRGdZTlJvTktwVks3TnUzNzJwTGJnYzJJUUJqQldCY3hUWU90cms4QlptYVJrSkRRM0hKa2lXWWw1ZUhTNWN1cmZMeDhSbUlGbUNQSWdIalpwZjZUc2s5YmM4L3JVZnhzMVR3azdWdTNYcFFWbFpXbFZxdHhrV0xGbkUzVkZIOCtDUmdMcy9mUlNFRklFZ0NJQVZBY3N0U2dzeHZTdzBQRCtkbS95MWJ0dURMTDcrOEJnQTgwVUxNVWtoQXFPRC9PNGFlNzd6enpycjgvSHpVYURUWXUzZHY3b3A2ZnR1d3BVeE90QXNnS0FVd2NlTEUxWVdGaGFoV3F6a0ZZQnhrY3l1QStxcitNcGtNTjI3Y2lMbTV1ZmpsbDE5ZXNiZTNqMEFMTXo0SmJOKytIWDE5ZmJsT1M1S3pWTk40MnNsTTRLZmZUOHVtME5CUUUvQ25wcVphSFBqSm5KeWNvdmZzMlhOZHJWWmplbm82eW1TeUJuY0Z6SjJmaEJkU0FHcTFHbk55Y29SRkFHM2F0REU1QzBEdG1CUmtjM21hd2Fqd04yREFBRlNwVkxoMTYxWjg4Y1VYbHorcUZkV2NKREJtekpobHUzZnZ4dno4L01jbWdmODFYbzhDLzdadDJ6QTNOeGRUVTFOeHdJQUJGZ2wrYWlHZU5HbFNta3FsUXJWYWpVbEpTZlcyQzF0S2Z0SlpnRFp0MmdpVEFLUlNLWWFHaHRZcnM4d1ZYSDdocWtPSERqaDU4bVRNejgvSFpjdVdWVGs1T1hWR0M3Ym5UUUxXQW40eVgxL2Y3bXExdWthbFV1SGJiNy9OeGMyNG9Hck8vT1F2VDBORFE2MUhBVkFTa2N4NTN0NzRFZ3JxVkpOS3BiaGp4dzdNeXNyQzk5NTdyOWpTRS9oaEpFQ0ZMVDRKR084U1BJbW5uK09EdjBPSERvSUVQL1ZZckZxMWFyOWFyY2F0VzdlYTNGZGhmS21JT2ZQVXVDOUZrQXBBcjllalNxVkNpVVRDTVN5L2VjWGN3U1g1MzcxN2QxU3BWTGhseXhiczBxWExwLy8wVUlxNVNHRFhybDJZbDVlSDI3WnRlNm9rOERqZ1Z5cVZ1SExsU3NHQUh4R3h1cnJhTUd6WXNNODBHZzJxVkNydStpMSt2TXc5U1ZGVFZXaG9LRW9rRWxTcFZKaWRuWTFKU1VuQ0lZRFdyVnVqVkNwOW9OQkNEL204UGEydGpPVi9VbElTNXVmbjQ1bzFhekF3TUxBZkNzZ2VSUUswdHFXNEcrOFNQRTZjNk9lSUxCc0EvektoZ0o4c0ppWm1JTDEycTNmdjNseTgrSDBWNXNwVDR3SzFWQ3JGMXExYkM1TUFKQktKeFFhWHJsdWFPWE1tNXVYbDRiSmx5MjRDUURBS3pKNDJDVmc3K1A4K2I5RzJzTER3amtxbDRpNnRvUnVaekQxSjFWZWpFcVFDeU0vUDV4UUFCWmZXV1BTUXo5dno1V3k3ZHUxdy92ejVxRlFxOGJQUFBqdnh2SHYrbnlZSnZQcnFxeHdKYk4yNkZYMTlmYm5yMktnR1EvSG5Md3Y0OGFIdmk0Nk81cTZsOHZYMXhhMWJ0d29lL0hSR0lEYzM5emUxV28yZmZQSUp0bXZYN3FITHB1ZnRLZjQwU2JWdTNScno4L014S3l0TEdBUlFVRkNBK2ZuNUpncUEzNnhpcnVBYUgxaVJTcVc0YXRVcXpNN094bG16WnUwREFCOFVxQkVKN055NUUzTnpjeCtiQlBqMzd6OE0vRGs1T2JoaXhRcnMzNysvWU1GUHNkcStmZnQralVhRGFXbHBLSlZLSHpob1phNzg1RGRaa1FJUUpBRzBhdFVLcFZMcEF4MVg5SkRQMnh2ZjlDT1R5VEFrSkFUWHJsMkwyZG5aT0czYU5CMEFlS0dBclNFU29CbU9mMkVteFlPODhjV25wSkNzRGZ4L3g4bDc0OGFOZXExV2k2dFhyOGFRa0JBVGt1UXZsNTYzcDNHZ1hhcFdyVm9KVndIUURNU1hWK1lLcnZIQkZhbFVpaHMyYk1EczdHejg5Ny8vclJjNkFUd0pDVkJOaG1aOCtyZTFnNThJWU51MmJRYWRUb2ZyMXEwek9iTkNjVEJYZnZLWHFlM2J0eGVXQXBnd1ljSnFuVTZIZVhsNURTb0EvdXVlbnBjM3ZxT09GTUN5WmNzd096c2I1OHlaVTJZTnlXMU1BanQyN0VDbFVvbGJ0bXd4SVFHcXlkQ3lqRHp0aHhQNHQyelpndG5aMmZqZGQ5L2hpeSsrdU15YTRyTm56NTZER28wR0Z5OWUvSUFDNEMrVG5yZXZUd0hRZGVtQ0lnQ0pSTUlsSGI4YWJhN2dHaDlna1VxbCtNMDMzNkJTcWNTdnYvNWFzRVhBSnlHQnRtM2JjazFRcEFpTS85MjJiVnVyQmo4VkFRc0xDMDlxTkJwY3VIQ2hpUUlnTWpSWGZ2SjNYOXExYTRjU2lVU1lCTkN5WlV1dXdGTGZPOTJldCtldmNVTkNRdkR0dDkvRzNOeGNYTDE2OVEwaGJnTStLUW40K1Bod014NDFhWkVQQ1FsQkh4OGZxd2IvMzNGcGUralFvZHNxbFFvblRwejRnQUpvcUVieXZEemhoQXJWTFZ1MkZCNEI1T2Jtb2tRaTRXWWNLcnlSdkRKWGNQa0tZUFRvMGR4YXVXWExsbjNSeW94UEFwczNiMFlmSHg5dWl6WWtKSVRiYXZMeDhjSE5temRiTmZnUkVUdDM3anp3MEtGRG1KdWJpOG5KeWZVcUFIUGxKN1dwRTE3YXRtMkxFb2tFYzNOek1UTXpFeE1URXkyZkFPajZJbU1GWUJ4Y0lvSG43V2tMMERpNHZyNittSnViaXhrWkdkaTdkKzg1UW1rRmZsSVNHRDE2OUxMdDI3ZGpUazRPYnRxMENYMThmREF3TUJDbFVpa0dCZ2FpajQ4UGJ0cTBDYk95c25ENTh1VldDLzdxNm1yRDY2Ky9QcitzckF4emMzTlJvVkJ3eTFUS0MxSUE1c3BUbXFTTUZZQWdDY0JZQVpEc3RyVGd0bXJWQ2pkdTNJZzVPVG40eVNlZkdLd3g2UnNpQVc5dmIvVHg4VUZ2Yis5R0FYNktRMDVPemw2OVhvOXIxNjdsQ3RXV05ra1JYZ1N0QUlLQ2dremtGVzBGRWdrOGIwOXJLMkw2RGgwNm9GUXF4Vm16WnRFeW9NckZ4U1VlcmRUNEpMQng0MGFNam83R2pSczNOZ3J3SXlMNit2cDJPWDc4ZUhWK2ZwN2FBQ2tBQUNBQVNVUkJWRDUrOE1FSEtKVkt1V1kxcWdGUW5wZ3JUMmtMa0phcFFVRkJ3aU1BcFZLSkVvbUVLN0FRbzFsS2NHbUxKVGc0R0VORFExR3BWR0pXVmhZT0h6NTgwVysvL2ZaNll5RUJldTdHQVA2aW9xTGVzMmZQWG43Z3dBRlVLcFhZcmwwN3JnYkNmOFc0T1NjcFk3eUVoSVNnUkNKQnBWS0pHUmtad2lJQVVnQlVaYWF0UUhNRmx6eHRzUkREdG1yVkN0UFQwMUdwVk9LR0RSc3VObS9lUEJ5dDJJZ0V0bTNiaHBtWm1iaHMyVEtyQno4aW9yT3pjOFR4NDhldjBEc0NTUDZUUXJXMC9LVExRSUtDZ29SSkFNWUtnSnBNYUkxRlN1QjVlMko0WWxoNmVjbW9VYU5RcVZSaWRuWTJqaDgvUGhVQVBCb0JDU3hadEdnUjl1L2ZmNG0xZ3g4QUZGOTg4VVZhZVhrNUtwVktIREZpQlBmU0RlTU9TY29QYytVbjFhZ0lMNEpXQUZSbGJtaU5aUzVQREV2TGdMWnQyNkpVS3NYbHk1ZWpVcW5FM2J0MzN3a0lDT2lQVm00QTRCRVZGZFhQMnNrT0VURXNMR3pBcjcvK2VrZWxVdUh5NWN0TnhwM2tQeWtBYytjbnYwWVZHQmdvWEFVUUhCeHMwbWxHRE10dlEzMWVudjQrQlpsa1Z1dldyYkZObXphb1ZDb3hOemNYMDlMU2ZtcmF0R2w3WkNaNGs4dmxIUTRlUFBoTFNVa0pLcFZLYk5PbURkY0hRZktmSmlkTHlFOWp2QVFIQnd0TEFZd2ZQMzYxUnFQQm5Kd2NUZ0h3WlphNWdrdWVtSjVrRmpGdHk1WXRNU1VsQlhOeWNqQTNOeGMvK3VpakhHdHFEMjZNQmdBQm16WnR5djcrKys5UnFWUmlTa29LMTU5Q3lwVE9SbEJlbURzLytjdlR3TUJBek1uSndkMjdkMk9mUG4yRVF3QVNpWVM3R0pUMldVbCtFOU9aeTVNQ29HVUE5VnkzYnQwYXYvcnFLOHpKeWNIOC9IeDg3NzMzMXNKemZxa2xzNmNHZnYvbHk1ZXZPMzc4T09ibDVlSENoUXV4VmF0VzNCa1ZZL2xQK1dEdXZDUjhVSjlLbXpadFVDS1JDSk1BQWdJQ0hsQUFsaEJrOHZSNUtOalVkTkdoUXdkY3VYSWxLcFZLVktsVU9HWEtsRlFBOEdPUUVoVDQvUll2WHB6Njg4OC9ZMzUrUHE1Y3VaSzdYSVBXL2pRcFdXcGVrZ0lJQ0FnUXJnS29iNjFsekhUbTh2UTVhQmxBdFFCYWMwVkdSdUtxVmF0UXFWU2lXcTFtSkNCQThKODRjUUx6OC9OeDFhcFZHQkVSd2RXa2pQT1J4dC9TOHBLMnFGdTNiaTFjQmRDaVJRdE9YaHNIMjl4QkprOU15eWNCa2wwUkVSR01CS3dJL0xRY3BiNFVHbmZLQTB2SlMrTjdHYVJTS2JabzBVSllCS0JXcXpFN08vdWhDc0JTUFA4OFBNa3VZdDZJaUFoTVQwL0huSndjVktsVU9IbnlaRVlDQXBEOWVYbDVtSjZlem9HZjhwQUtmL3o3RUN3dEwva0tJRHM3RzNmdDJpVXNBaUFGd0wrRXd0S0NUWXhMYTBJK0NZU0hoek1TRUNENHc4UERUY0JQdFNnYVo3Nzh0eFJ2ZkRrTEtRQkJFb0JFSXVIYUxVbDJFZU5hbXFlZ0UvT1MvS0txTVNNQllZS2Y4by9HazVRb1h3RlltcWZsS09XZlZTZ0FmdFhWVWp6TkJJOGlnYkN3TUVZQ0FnQi9XRmpZWTRHZlh3T3dGRTg0c1FvRlVGL1RoU1Y3Q2o0eE1BMENJd0ZoZ3AvR2p4UW9YLzVicWpkdVRoT2NBbENwVkppVmxZWCsvdjdjdFZNMHMxcHkwR2xtYUlnRWFEQ0lCTEt6c3pFL1A1K1JnSVdCbnlhZGhzRFBWd0NXNWdrbmRGVFozOThmczdLeWNPZk9uY0lpQU9QQm9BS01wUWVma1lDd3dKK2JtMnRWNE9mdlJsRytDWklBL1B6ODZtMitvSWUwVkUvSlFwK1g1QmdkemFSQkNRME5aU1JnQWVDblYyalR1TkRNU2N0T0drYytDVmlxcHhvVU5hWDUrZmtKVndIUXBTRFVEQ1NVUVhnVUNRUUZCVEVTc0NEdzAzZ0lIZnowT2Fsd1NjOGxhQVhBNzhDaWg3UjBUOGxEbjV0a0dURXpJd0hMQWo4cFRWcHUwcmp4U2NEU1BiOGoxU29WQUNNQlpnejhEWHVyVUFDK3ZyNG1Db0F2eTRUaUtabm84OVBnRUVNSEJnWnlwd2daQ1R4NzhOT3BQb283NVJkTk1qUk9mQklRaXFmbEp1V1hyNit2Y0JVQVhRcEN6VUJDR3d4R0Fnejg1dkMwaTBIUEtSZ0NlT09OTjFibjUrZmpuajE3T0FYQTc4WG12NU5PS0o2U2k1NkRCb25PREFRRUJIQWtrSmFXaGxsWldaaVhsOGRJNENtQVB5MHRqUU0veFpueWlpWVhHaGMrQ1FqTjg4K2krUHI2NHA0OWUzREhqaDJZa0pBZ0hBS2d3VEp1QmhMcW9Ed3BDYlJ2Mzk2RUJONTk5MTFHQWs4SS9wOSsrZ21WU2lXbXBhVmgrL2J0R3dYNGpWL1VTcGVCU0NRU1lSS0FqNC9QQXozWnhvTWtWRS9KUnM5ai9JSk5SZ0xQRC93MHFkQTQ4RWxBcUo1L0JzWEh4MGY0Q29CdUJ4YjY0REFTWU9CL0hwNTJOYXhLQVpCY3MzWVNJT1p1MGFJRkk0R25BSDZLSStXUnRZT2Zmd0JOMEFxQWpnUlR0WllLSE5iaVNhN1JvQkZ6RzVPQVdDeG1KUEFQd0M4V2l4OEFQOFdYNGszeHQ3YThJcnpROHd1U0FMeTl2VTBPYU5BTTJkaEl3Ti9mSDhWaU1iWnIxNDZSd0dPQXYxMjdkaWdXaTlIZjM3OVJncDl3UW1jYnZMMjloYXNBNkVnd3JkMW8wS3pOVTFMUzRGR3kwaUQ2K2ZtaFdDekdrSkFRUmdJUEFYOUlTQWlLeFdLdWpad21ENG9ueFpkUEF0Ym1DUzlFZ29Ja0FDOHZMNU4yWUJyRXhrSUNKT09vbmRQSHh3ZkZZakcyYWRPbVBoTHdiV1RnOStXRHYwMmJOaWdXaTduYUVlVU54Ykd4Z0o5d1Fubmo1ZVVsWEFYZzUrZG53bWcwZU5idWFSRHB1YW1hNitucGlXS3hHSU9DZ2pnU3lNckt3b2tUSnk1cFRBVHd6VGZmTFBueHh4ODU4QWNGQmFGWUxFWlBUMCtUM1NPS0gxLytXN3VuNXlZbFpGVUtvTEdSQUg4WjRPYm1ocDZlbnJobXpScmN2WHMzTGxteUJBY05HdlJWWXlLQU45OTg4NnV0VzdkaVJrWUdybG16QmowOVBkSE56ZTJoOHIreDVZMVZLQUJmWDErdUlHWXM0NnpkR3hjQ2phdTVDb1VDdmJ5OE9QQXZYcndZKy9YcnR4UUFmQnJaRXNCbjVNaVJTemR2M3N5UmdKZVhGeW9VQ3BQZEkzNEJzTEhrRHowM3RkTUxrZ0JJenRHQklQNWFyckdBbnc1MGVIbDVvWmVYRjY1ZHU1WURmOSsrZlpjMXR2Vy9jUjBnT1RsNUdaSEEyclZydVJnWjUwMWpJd0hDQ2VXTnA2ZW44QlVBWDg1WnE2ZkJvNlNsdGIrUGp3OEQveE9RQUJVQ3FSWkE4YVQ0V25zZUVWNnNRZ0UwVk5CaDRHL2M0R2NrVUwrdnIzQXNXQVhnNCtQREZUU3NlZkFZK0JrSlBNMDhJcnpROHd1U0FJd0xPc1lkWGZTUTF1S0pzYW56ajhEdjdlM053UDhVU0lBNlNpbXVsRWNVZDJ2TEovNVpFb1ZDSVV3Q2VGaFRCd00vTTBZQ0RYdCs4NWdnQ2NERHc0TnJCemJlMTZWQkU3cW5KS1I5ZmdiKzUwc0NsRTk4TWhDNnAzd2kzSGg0ZUFoWEFkQ2cwWllPQXo4elJnS1A5clFGNk8zdExYd0ZRSjFkdEF5Z3dSS3FwNlFqbVVack5iYlAvM3o3QkNqdWxGZDhNaENxcDd3aTNBaEtBUmpmQ215c0FQaFZYR3NGLzdwMTZ6QWpJd09YTEZtQy9mcjFZK0IvQ2lRd2N1VElaVnUyYk1ITXpFeGN0MjVkb3lBQlkwVXBGb3VGZVMyNHU3dTdWU2tBU2k2U1o3UkdZK0EzTHduUU9OQXlVK2drd0ZjQTd1N3V3aVFBc1Zoc3d0VEdneU0wVCtURkI3K25weWNEdnhsSmdKck4rQ1RBVndSQzg4YkswbW9VQUoraEdmaVpNUko0MEZPZVdZVUNNQjRjNDBFUmlxZGtvalVaRFFxZDZtUGd0d3dTb0tZekdoK3FPZkhKUUNqZWVKSVJyQUp3YzNQakRnUVpEd29EUHpOR0FnMTd5amZDalp1YkcxTUFEUHpNR2hNSldJMENNRzRISmpCUmxkTlNQYTNCcUJEREIvL2F0V3NaK0MyUUJLaFBnRThDTkk0MHJwYWVmOFlIeWVnR0tVRVJnRnF0eHV6czdBY1VnQkFHNFZIZ1g3ZHVIV1ptWnVMU3BVc1orQzJFQkVhTkdyVnM2OWF0dUdmUG5nYVZnRkJJb0w1Q3MxZ3N4dXpzYk55MWE1ZXdDTURWMWRXa0dZZy9DSmJtaVhrcCtMUUdZK0FYTmduUU9OSzQwamhiYWg0U1RxZ0p5TlhWVlpnRVlLd0FqTmRrRFB6TUdBazhQQThKTDFhbEFQakJ0eFJQak12QWI1MGtRR2RTK0NSQTQyNXArVWlmenlvVUFKK0JMUzNvZlBCVHdkTER3NE9CM3dwSmdNYlhVa21BUG8veEpNUVVnQmxtZms5UFR3WitLeUlCVDAvUEJwY0Rsa1lDZ2xjQUdvMEdjM0p5VUN3V1A1SjV6ZTFwclVXZlQ2RlFvTE96TTY1WnN3YjM3Tm1EeTVZdFkrQVhNQWxzMjdZTnM3S3ljTTJhTmVqczdNeVJBSTAzZjVmQTNMNCtKU29XaXpFbkp3ZDM3OTR0TEFKd2NYRXhPUkJrNmNGV0tCUm9aMmVIUzVZc3dUMTc5dUNLRlN2d3BaZGVTZ2YyR20raGtvRGYyTEZqMDNiczJJSFoyZG00Wk1rU3RMT3plNEFFTEhWU29vTkFMaTR1d2lRQVMxWUFmTmxQMWRZcFU2Wmdkblkycmw2OUdwT1Rrek1CSUlCQlNkQWtFUER1dSs5bTdONjlHN096czNIS2xDa211MU1OTFFlWUFuaUtDcUNoWUp2TEU4UHl3UjhURTRQWjJkbTRkZXRXZk8rOTk0N2IyTmkwWlJBU3Z0bloyYlZkdEdqUjhUMTc5bUJPVGc3R3hNU1lLRlBLQThvTGMrY25QeThGclFEb1NEQVZBaTB0eUpRRTd1N3V1R1RKRXN6TXpNU3Z2dnJxamtLaDZOY0laa2RGY25MeVlBQlFXUHV6dG1qUm90LzI3ZHZ2WkdkbjQ3ZmZmc3NkVk9PVGdLVk1Ub1FYZDNkM1lTbUFDUk1tck5acXRhaFVLaHRVQVBTUTV2TDBPWXlEM0xkdlg4ekp5Y0cxYTlkaS8vNzlWd0tBaDdXdmo1Y3VYYnJ5MTE5L3hmZmZmMytsdGRjNUFNQmo0c1NKcVZsWldaaVRrNE1KQ1FrUFRFNldscC9HQ2tDcFZHSkdSZ1ltSmlZK1ZRS1FQa3MydUg3OU9yaTR1TURGaXhkQm9WREErZlBud2N2TEM4NmRPd2ZlM3Q1bThWNWVYbkQrL0hsUUtCUlFXVmtKcnE2dWNPWEtGUmcyYkJqVTF0YkNIMy84Y1ZHbjA2MUF4QXRncFNZU2lmd1hMMTQ4TXlFaElhV2lvZ0lTRWhMZXZILy92a2drRXZrajRsbHJmR1pFdk9EZzRCRFJvMGVQbDVzMmJlcjJ5aXV2Z0Y2dkJ6YzNONmlzckFSUFQwK0x5azhQRHcrNGNPRUN1TGk0d05XclY1OVpYTVRQTXVoT1RrNXc5ZXBWY0hkM2h3c1hMbkJCTmxkd3ZiMjk0Zno1OCtEcDZRbVZsWlhnN3U0T1Y2NWNnYzZkTzRPcnF5dmN1blVMaW91TE4vLzg4ODh4MWc3K3hNVEVsRE5uemtCTlRRM1UxdFpDVWxKU3lwUXBVMmFLUkNKL2EzMzJuSndjVjYxV3V4MEF3TVBEQStMaTR1RHk1Y3ZnN3U1dVFnS1drSjhYTGx3QWQzZDN1SHIxS2pnNU9RbVRBRWdCWExwMGladHhpV0hONVFuOENvVUNMbDI2Qk03T3poQVJFUUdJQ05ldVhidDc2TkNoM1lHQmdXc2FBL2pQblRzSGMrYk1nUXNYTGpRS0VuamhoUmQwZVhsNTJ3SGdIaUpDZUhnNE9EczdtK1NucDZlbldmUFR5OHZMSkQ5ZFhGemcrdlhyd2lNQWtVakVLUUEzTnpjVEJVQXl4eHkrc3JLU2sxZXVycTV3N2RvMWlJMk5oWnFhR3ZqUGYvNnovOGFORzM5WUsvaVhMRmt5TXlrcEtlWHMyYk53L3Z4NW1EOS9QaHcrZkJqbXo1OFBGeTllaFB2MzcwUGZ2bjFUM252dlBhc2xnVXVYTHYzKzMvLys5NEJZTEliWTJGaTRkdTBhdUxxNndvVUxGOEREdzRPYnBNeVpwNlFBM056Y09BVWdFb2xBSkJJSlV3RmN2bnpaSW9ONzVjb1ZhTnUyTGNqbGNyaHo1dzRjUFhxMHVMYTJ0dFJhd1c4ODgzLzIyV2R3OXV4WmNIQndnTE5uejhKbm4zMW1vZ1NzbFFTcXE2czNHUXlHRW9sRUFpNHVMdEM2ZFd1NGN1V0tSVTVTbHk5ZkZxNENNSzRCdUxtNW1SUUNLY2ptOE1iQmRYWjJCbTl2YjBCRXFLcXFnblBuemgyUVNDUXRyQjM4Q3hZc2dJcUtDbkJ5Y29KYnQyNkJrNU1UVkZSVXdJSUZDNnllQkd4c2JMcWZQbjM2b0V3bUF3QUFiMjl2Y0haMmhzdVhMNXNzQTh5WnB3cUZBaTVldkdpaUFBUmJBNkRnR2hjQ0tjam04QjRlSG5EeDRrVk8vb2VFaEFBaXdwMDdkMjZlUFh2MlRHTUEvK25UcDhIWjJSbHUzTGdCTGk0dWNPUEdEWEIyZG9iVHAwODNDaEk0ZlBqd2Z4RHhMd0NBa0pDUWVwY0I1c3hUS2dEU0pDVTRCVUJyRlVkSFJ5NjQvRUtMT2J3eHMxNjVjZ1djbkp6QTFkVVZFQkgrL1BQUDh3QlFiWTNnUDN2MkxKdzdkdzQrLy94enFLaW80SktLU05EVjFaVWo2NHFLQ3ZqODg4ODVFckRTbWtEVm5UdDN6b3ZGWW5CeGNRRW5KeWR1R1VCSzFkeDVldW5TSlc1OEhCMGRuMWtncE04d0FibVo1Y3FWS3hhbEFJejNWNTJjbkdnSmNCTUFhcXdaL0RUekUrZ3A2UzlmdnN6OW01VEE1NTkvRGpObnpnU0ZRZ0Y5Ky9aTitic0laUzE5QWpYVjFkVTNiRzF0T2ZLaldwVkNvYkNJUEhWM2QrZDJxYTVkdThZVkFaOTJJZkNaTmdMSjVmSjZGWUM1dkxIOEp3VmdhMnRMeGFHL0FLRE9Hc0ZQc3QvSnlja0UvQ1F6S2RtTTQwTExBU0tCcEtTa0ZQcjlWa0FDZGZmdTNic2pFb2xBSnBOeHRTcFhWMWU0ZVBFaXR3d3daNTdTTHRXVksxZEFMcGNMVHdFQUFOeThlYk5lZVhYaHdnV3plWGQzZDdoNDhTTEhyQktKaElDRDFnNStrdjNVbkdVTWZ2cDNZeUVCaVVRaUVvbEVJQmFMdWVYUGxTdFh1RW5DM0hsS3lvekdUVEExQUdPcElwZkx1YVNqclVCekJ0WER3OE5rYmVYazVBUjM3dHdCc1ZnTTl2YjI5cys2S1BvOHdKK1VsSlR5My8vK0Y4NmZQLy9FNEtmT001TEZ4aVJnM0Njd2RlcFVvZGNFSkgrUE45eTVjOGRFR1YyNmRNa2k4cFRJK1ByMTZ5Q1h5NTlaSDhCelZ3QVVYSE40S2dBYXI2MXUzYm9GWXJFWTVISzVDd0RJaEE1K212ay8rK3l6ZXNGUHoyOE1mbVBQcndrUUNYejIyV2N3YTlZc3JpWWdjQ1VnbGN2bHp0WFYxWERyMWkwVEJVQUswUkx5VkpBS2dGOERNQzZ3R0FmWEhONVk1cElDT0h2MkxJaEVJbkIwZFBRQ0FEdHJBUC84K2ZOTndFOEZUMHFxaHNCUDhhSDlaMnBDSVJLWVAzKyt5ZTZBVUpXQVdDeHUwcng1YzA5RWhQLys5NzhtQ3NDUzhwVGlML2dhQU1sS2tsZm1EQzdOZ0FTSzgrZlBnMGdrZ2laTm1qUVBEZzRPc2did1U1TVBnZi9hdFdzUGdQOWh5V2VzQkl4M1N5b3FLbUQrL1BudzBVY2ZDVm9KZE92V0xWZ2tFaldwcTZ1RGMrZk9jWEVpQldBSmVXcXN3QVRaQjJCY0F6QU9ycVVvQUVycTc3Ly9Ia1FpRWRqYjI0T2ZuMS9IZS9mdUZRdDF6ZisvZ3A5cUpNWks0TnExYXlaS2dFaUFhZ0w5K3ZWTGVmLzk5d1dqQkc3ZnZyMGhPRGk0NDcxNzkwQWtFa0Y1ZWJuSkpFVzFLblBuNlpVclYwd1V3TE9xQVR4dGM1azRjZUpxdlY2UEtwVUtSU0lSZHlrSTNXeENseHlZeTlNZGEzUmx1Wk9URTI3YXRBbno4L054d1lJRiswQUFGMk1BZ04rU0pVdFNmLzMxVjlUcGRMaCsvWG9NQ2dveWlUZTltSldlbCs2WGY5dzQwZmZUejlQdmMzRnhRWkZJaEVGQlFiaCsvWHBVcTlWWVVGQ0E3Ny8vZnFwQVl1ZXYwV2dPRkJVVjRabzFhOURKeWNra0graDV6WjJuaEJlS3QwcWx3dXpzYkV4S1NyTHNHNEdNQ2NEUjBkRWt1RSthaE04anVIUVJxRXFsd2gwN2R0eFRLQlRkR2p2NHJaa0VXclpzMmVQbm4zK3UwV2cwK0s5Ly9jc2tEeXhsa3FLNEUyNGNIUjJGUlFDRmhZVVdxd0FvdU1iSkhCSVNnaXFWQ25OemMzSHMyTEVycDA2ZDJ0cVN3WC95NU1sbkRuNXJKQUVBOFBqODg4OVhIeng0RUZVcUZiWnUzZnFCdUZuaUpDVTRCVkJZV0locXRkcGlGVUI5eTRCbHk1YWhXcTNHYmR1MlhYVjBkSXl5WlBBWEZCVGdoZzBibmpuNG40UUVObXpZZ0JxTkJ2VjZ2Y1dTZ0plWFYreUpFeWV1RnhRVTRMZmZmbXV4OHI4K0JhQldxekVuSndmNzl1MHJIQUlRaVVUbzdPeGNMOE9hMnhzbnNWZ3N4djc5KzZOYXJVYVZTb1dUSmsxYUJ3Q2VRZ0EveFplU2hXWU9QZ244cjU1K0gvMSsrbnZPenM2Q0lBRUE4RnEyYk5tV1E0Y09vVnF0eG43OStwbU12NlhtSjhWWGtBUWdsOHROZ3Z5MGsvSi9UV1pLWXBySkZpMWFSSUd1YXRPbXpjc00vTlpEQXZIeDhjTk9uVHAxVDZmVDRWZGZmZlZZeXNuYytVbWZUeTZYQzRjQVVsSlNWaGNWRmFGR283Rm9CY0JQWWljbkp3d0tDa0tWU29WYXJSWTNiZHIwSDdsY0htNEo0RDkxNmhUcTlYcXpndjlKU1VDcjFXSmhZU0ZPbXpiTjdDVGc0ZUVSOWNNUFAxVHMyN2NQOC9QenNVV0xGZy9JZjNvZVMxVUE5SzROU3ljQTU0a1RKM0lFWUtrS29DRVNjSFIweE5HalI2TkdvMEdkVG9lZmYvNjVSaXdXdDdRazhGTlNtQVA4ajBNQ1lySFlva2hBSnBPMXpzbkpLVHh5NUFocU5CcE1UazYyZVBEekZZQ1RreE5xTkJvcUFxWUJnTFBGRXNENDhlTlhFZ0hZMk5nMFdHaXhGTSt2QlRnNU9lSFhYMy9OeWRpUFAvNTRCd0FFUG1md3QxaTZkR21hTWZnREF3TzV6MWZmMnRXUzRpY1dpekV3TU5DRUJLWlBuNTRHQUMyZVp4d2xFa25MVFpzMlpmejQ0NDlFNkZ4aDJsTGkxNUEzVnFaMmRuWWNBU1FtSm41bnlRVGdORzdjdUVVR2d3RzFXaTNIYVB5dFFFc0pNbjhHbzgvcDdlMk42ZW5wcU5WcXNhaW9DRC8vL1BNc0d4dWI0T2VVdEszV3JGbXo3ZVRKazFoWVdJZ2JOMjU4SlBqTkZWZjZ1dzhqZ1kwYk42Sk9wME9Ed1lCejVzelpKaGFMV3oyUE9OcmIyNGZzMnJVcjc4U0pFMWhRVUlEcDZla21iOXQ5bUlLeWxMeWt6NmxRS0ZDcjFXSldWaFltSkNRc0FnQW5pMFMvcjYrdjQ2dXZ2anEvdUxnWXRWb3R1cm01UFpDMGxxb0ErRExXMTljWFY2OWVqVnF0RmcwR0EyN1lzR0cvbjU5ZnQ2dFhyMzc2TEJMMnI3LytXdCtpUll0T0dvMm0rTVNKRTZqWDYzSGp4bzJjN0xjMDhEOHVDUVFGQlptUXdPclZxMHU4dmIwNzM3NTllLzJ6aU9OdnYvMzJlcHMyYlhxVWxwWisvK09QUDNMZzkvSHhxWGY1WktrS3dEaU9ibTV1cU5WcU1TTWpBM3YyN0RuZjA5UFQwU0lKb0V1WExzMkhEUnMydmFTa0JMVmFMWGJvME1FazZKYkd0SThpQVI4ZkgweE5UZVdVUUZGUjBlVVJJMFpNZTlwTEFnQUlHRDE2OUx2LytjOS9MaHcrZkJoMU9oMm1wNmVqbjUrZlJZUC9jVW5BejgrUFUxUUdnd0VMQ3dzdkRobzBhREk4NVZldkEwRFF2LzcxcjVsbnpweTU5djMzMzZOT3A4TVZLMWFndDdlM29NQlA4YVRQR3hvYWlscXRGbmZ1M0lsZHVuU1pIaE1UMDl4U0NhQnAzNzU5eCszZHV4ZTFXaTFHUjBjL3NPWVNHZ2w0ZUhqZ3RHblRVS3ZWb2w2dngvMzc5K091WGJzT0pDUWtqQUdBd09ycWFzTS9TZGJhMnRvS0FBam8yN2Z2eU1MQ3d0TGZmdnNOOSs3ZGl6cWREai81NUJPdUtjVFN3Zis0Sk9EcDZZa3paODdrNG5qZ3dBSGN2bjM3dnA0OWU0NEdnSUIvR3NlLy92cHJQUUFFRGhreTVJMzkrL2NmT25YcUZOSUVOSG55Wk83ekNRMzhGRDlIUjBlTWpvNUdyVmFMMjdadHcram82SEVkTzNac2Fxa0VZQnNhR3RxN3JLd01kVG9kRGhreXBONnRRRXNMK3FOSVFDNlhZOCtlUFhIMzd0MmNsRDEwNkJCcXRkcGo0OGFObSt2dDdkMEpBRnBNblRxMWRXMXRiVVZEeVRwMTZ0VFdBTkRDeThzcjlzMDMzL3prNE1HRDM1ODVjd1lQSGp5SUJRVUZtSm1aaVFNR0RPQjJUK2p2V3pyNEgwVUN4bkZNVEV6RWpJd00xT2wwV0Z4Y2pIODM1aHdlTjI3Y25NZUo0OS9FNlFFQWdRRUJBVjJuVEpteTROaXhZeitlUG4wYTkrL2Zqd1VGQlRSVFBoQkhTd2MvUHc5cEMzRElrQ0dvMVdweDQ4YU5HQkFRMEx0ang0NjJUKzFVNmRNa2dNNmRPOHNPSERqUTJtQXdITHA3OTY3dGpoMDdZUGZ1M2R6TEoraG1HdVBiYUMzTjAvbDN1akhJMGRFUmJ0eTRBUTRPRGxCVFV3TnZ2dmttOU9yVkMyUXlHVWlsVW1qYXRDblkyOXZYM0x4NTgxUnBhZW14aW9xS1U5ZXVYVHRYVTFOejU4YU5HMzg2T1RrMWw4bGtkczdPenA0dFc3WnNuWkNRRU83bzZOajY5dTNiTmpkdTNJQzdkKzlDVFUwTkdBd0dTRTFOQlpGSUJMZHUzZUwrTG4wTytseVdIai82ZkErTFkxMWRIYVNrcEVEUG5qMUJLcFdDVENZRGUzdDdremllT1hQbXQydlhycDI3ZCsvZVg0aDRYeXdXUyt6czdKcTV1TGo0QkFjSHQrelJvMGQ0czJiTkFtL2R1aVc5ZWZNbVZGVlZ3ZDI3ZHlFL1B4ODJiTmdBTmpZMkQ0MmpwY2VQOE9MZzRBQkRodzZGNGNPSHc1a3paNnBUVWxJaU8zYnNlT3JBZ1FOUDVRWnI2Vk1tZ0xwOSsvWlYzYjU5KzZKVUt2WHo5ZldGbXpkdmdxT2pvOG05QUpZYS9JWklnQVpETHBmRG9rV0xZTWVPSGRDclZ5L28xNjhmT0RzN3c2MWJ0MlFTaWFSdGx5NWQydmJ1M1J0c2JXMUJLcFdDV0N3R1JBUkVoSnFhR3FpcXFvS2JOMi9DbFN0WG9LNnVEbTdjdUFFYWpRYTBXaTM4OGNjZjRPRGdZRUtXUWdQL28wakFPSTdmZlBNTjdOaXhBeElTRWlBeE1aSGVVc1RGc1Zldlh2WEc4ZDY5ZTFCVlZRVlhybHlCeXNwS1FFUzRmUGt5NU9mblExRlJFVlJXVm9KY0x1Y3VvNmt2amtMSlA3bGNEamR1M0FCZlgxK29xNnVEUC8vODh5SWlWc2ZFeE5RZE9IREE4bTRFcXEydHJRT0Fxa3VYTGxYNCtQajQrZmo0Z0lPRHd3TTNBMWx5OEIrSEJNNmZQdzlaV1Ztd2NlTkdpSW1KZ1RadDJrQmtaQ1MwYXRVSzdPd2F2bFdzdXJvYVRwMDZCWWNQSDRhVEowL0N3WU1Ib1huejV2RG5uMzgrTW1tRkF2NG5JWUUvL3ZnRGR1L2VEV3ZYcm4yaU9ONjVjd2QrK2VVWE9ITGtDSnc4ZVJJT0h6NE1jcmtjYnQyNkpYancxNmNBZkh4OG9LNnVEaTVmdmx3QkFGVjFkWFVXZlgyOXkxdHZ2Yld5c0xBUXRWb3QydG5aTmRoNVphbHJzSVpxQXZ3MUxUMlhvNk1qaWtRaWxNdmw2T25waVowN2Q4YTR1RGdjTUdBQXhzWEZZWmN1WGRESHh3ZWRuSnk0N3pQK2VmNWFuNzlXRlVxOEhsVVRlSkk0ZW5oNFlLZE9uVEF1TGc1NzkrNk5jWEZ4R0I4ZmoyNXViaWlYeTFFa0VuRUY1c2VObzFEaVZWOFRVRlpXRmc0WU1DRFZrdHVBYVJuUXJILy8vbThYRnhkalFVRUJ4c2JHbWd5T1VBYURUd0pQa3NRUDg0K2JyRUtMRTR2ajB5OEFpc1ZpakkyTnhZS0NBdHkyYlJ0MjdOang3ZWpvNkdZV1RRRHg4ZkUyQ29VaXRxU2twTGFnb0FDVGs1TWZPQk1ndEJtTlA1TTlLb2tmNWVuNytkVjlvYy80NW9walE2QVhhcDRabndKTVRrNUduVTZIcTFldnJuVjJkbzZOaW9xeXNXZ0NtREpsaWdRQUFyS3pzMC9xOVhwY3ZIZ3hpa1FpanJHRk9yUFI0RHdxaWZuSnpFL1NSeVdydFlLZnhmSEpGQUF0RnhjdlhveHF0Um8vLy96emt3QVFNSEhpUklsRkU4Q2tTWk5FQU9BMmZmcjBEVlFINERPYjBOZTBqMHJpeC9VTi9UNXJCVCtMNDVNcEFIZDNkOVJxdFppZG5ZM0Rody9mQUFCdTQ4ZVB0L3lyZ1dOalk1djE2ZFBuRFlQQmdIcTlIbnYxNnZYQTlXQkNUL2FHa3U2ZmVtc0hQWXZqa3hVQUhSMGRzVmV2WGxoUVVJQ2JOMi9HaUlpSTF5TWpJNXVCRUt4ang0NHllM3Y3ZGxxdDlycGVyOGNGQ3hiVXV3eXdsdVJub0dkeGZKcTFFWkwvQ3hZc1FKMU9oMHVYTHIxdVkyUFROaUlpUWhpdnJudnJyYmRFQU9DNVlNR0NMTG9lakgvS3lkcXEzTXd6L3pUdlZmRHc4RUMxV28xS3BSTGZlT09OTEFEd2ZQMzExMFVnRlBQeThtcWVtSmc0c2Fpb0NQVjZQZmJ2MzkvcWxnSE1NLytzNUgvLy92MVJyOWZqNXMyYk1Tb3FhcUpDb1dnT1FyS0JBd2ZLeEdKeDY5emMzTXJDd2tKTVMwc3pXUVl3RW1DZStmcWJmMFFpRWFhbHBhRldxOFd2di82NlVpUVN0VTVLU2hMV202c25USmdnQWdEWGQ5NTVKN1d3c0JDTGlvb3dKaWFHTFFPWVovNFI4ajhtSmdZTEN3c3hJeU1EQnc4ZW5Bb0FybVBHakJHQjBDdzZPdHJPejgrdnUxYXJyU29zTE1SNTgrWUp2aW1JZWVhZmRmUFB2SG56c0tDZ0FGZXVYRm5sN3U3ZVBTd3NUSEN2clFjQWdJa1RKNG9Cd0d2Ky9QbFplcjBlaTRxSzBOL2ZuOVVDbUdlK2diVy92NzgvRmhVVllYWjJOaFgvdk1hTUdTTUdvVnBVVkZUVHNMQ3dnUVVGQmJWRlJVVTRmLzc4eDdyWG5ubm1HeFA0YTZ1eVFnQUFDbXRKUkVGVTZmS1ArZlBubzE2dng5V3JWOWNHQmdZT0RBc0xhd3BDdG43OStra0F3R2Zod29XcXdzSkNOQmdNM0YyQlFybnBobm5tbjhmTlNSMDZkRUNEd1lBNU9UbjQ1cHR2cWdEQUp5RWhRUUpDdDhqSXlLWnQyN2J0cjlGbzdoVVZGZUdYWDM3NVFDMkFGUVNaYjh5RlA3bGNqbDkrK1NYcTlYcE1TMHU3NSsvdjN6ODBOTFFwV0lPOS92cnJZZ0R3bWpWcjFrNjlYbzhHZ3dIajQrTUZjMkVvODh3LzY0cy80K1BqMFdBd1lHWm1KbzRaTTJZbkFIaU5HalZLRE5aaUVSRVJUVHc4UE9LVlN1VjFlbEI3ZTN2V0Y4QjhvOS8zdDdlM3g4ek1UTlRwZExoNDhlTHJ6czdPOGUzYnQyOEMxbVJqeDQ0VkE0RHJxRkdqNWhZVUZLREJZTUFaTTJhd2dpRHpqYjd3TjJQR0RDd3FLc0l0VzdaZ1FrTENYQUJ3SFRGaWhCaXN6Zjd1WmdwTVRVMHRMeXdzeE9MaVl1elNwUXNyQ0RMZmFBdC9YYnAwUVlQQmdFcWxFbWZNbUZFT0FJRTllL2FVZ2JXYWg0ZEhzNkNnb0w1S3BmSzJ3V0RBakl3TTdzMHRqQVNZYjB6ZzkvYjJ4b3lNREN3b0tNRGx5NWZmOXZiMjd1dm01dFlNck5uK1hncTRqUmd4WWc2OUhHTHg0c1dDZXdrRzg4ei9yeTlMV2J4NE1Sb01CdHkwYVJNbUpDVE1BUUMzVjE1NVJReldib21KaVRJQThKODdkNjZxb0tBQWk0dUxjY0tFQ1ExdURUSVNZTjZhd0MrWHkzSENoQWxZWEZ5TUdSa1ptSktTb2dJQS94NDllc2lnc1ZoWVdGZ1RKeWVuOFBYcjE1OHFMQ3pFa3BJU0hEQmdnR0RlaGNjODgvLzBYWWtEQmd6QTR1Sml6TXZMdzA4Ly9mU1VnNE5EZUx0MjdacEFZN0l4WThhSVBEdzhIQUlDQXZwbFpHUmMvL3V0c2RpNWMyZEdBc3hiTGZnN2QrNk1lcjBlTlJvTkxscTA2THFYbDFjL056YzNoK0hEaDR1Z3NkbHJyNzBtOXZEd2NJNk5qUjJibTV0YlZWeGNqRHFkRHFPam94a0pNRzkxNEtlMy9PcjFla3hOVGExcTM3NzlPRGMzTitkR3NlNS9TRDFBQWdEdUw3MzAwdlRjM055YTR1SmkxR2cwR0JFUndVaUFlYXNCZjBSRUJHbzBHdTZnendzdnZEQURBTng3OU9naGdjWnVpWW1KVWdEd0hENTgrQ2Q1ZVhuM2k0dUxVYXZWWWx4Y0hDTUI1Z1VQL3JpNE9OUnF0VmhZV0locjFxeTUzNmRQbjA4QXdMTkhqeDVTWVBaLzFxZFBIeGtBZUkwWU1XS3VVcW04VDY4VzY5Mjc5d05uQnZnZGc0d01tTGVFVzR6NUx6TnhkSFRFM3IxN1kwRkJBZXIxZWx5elpzMzlwS1NrdVFEZzFhZ3EvazlLQW9NSEQ1NlpuWjE5cjdpNEdFdExTM0g0OE9HTUJKZ1hIUGlIRHgrT3BhV2xXRkJRZ09ucDZmZDY5ZW8xazRILzhVaEEwYU5IajBtN2QrKytiVEFZc0xTMEZHZk5tb1VLaGNMazNYRFc4aFpkNXEzanJjZVVsd3FGQW1mTm1vV2xwYVdvMFdodytmTGx0Mk5qWS8vMWQxNHo4RDhHQ1VnQndMVk5temJETm03Y2VGR3YxMk5wYVNtdVc3Y09RMEpDNm4xQlpHTjd4eDd6bHZGT1EvNExUVU5DUW5EZHVuVllVbEtDT1RrNXVIRGh3b3NCQVFIREFNQ1ZyZm1md0Y1OTlWV3h1N3U3bzRlSFI1ZXZ2dnFxWEsxV1kwbEpDZXAwT2h3elpvekpGZU1OdlNXV2tRRHp6M0xHTnk3MGlVUWlIRE5tRE9wME9qUVlETGhqeHc3ODRJTVB5bDFkWGJ1NHViazVOdXF0dnYrUkJKcktaTExXRXlkT1hMdG56NTVhV2hKODk5MTM2T3ZyKzBCdGdDa0M1cC9IakcrODF2ZjE5Y1h2dnZzT1MwdExVYXZWNHVyVnEydEhqQml4VmlxVnRuWnpjMnZLd1A4LzJPalJvMFY5K3ZTeEJRQ3Y2T2pvMTllc1dYTmVvOUZnYVdrcEZoVVY0UnR2dk1FTnpxUGVHOC9JZ1BsL0FucitqRTk1NXVibWhtKzg4UVlXRlJWaGNYRXhabVptNHNLRkM4K0hob2ErL25leHo3WlJkdmc5cTdxQXU3dTdvNk9qWStSYmI3MjFQVE16ODM1UlVSSHUzYnNYYzNKeWNPVElrU2lWU2g5WUZqd3VHVEJTWUM4aWZSam9qZVcrVkNyRmtTTkhZazVPRHU3ZHV4YzFHZzJ1V2JQbS91alJvN2M3T0RoRXVybTVPZmJzMlpPdDk1KzJqUm8xU2hRYUdtb0hBRjZob2FISjMzenp6UTlLcFJLTGk0czVJbmo1NVpkTnJsdDZIREo0RkNrd2I1MmVQLzRQQXozOS81ZGZmcGtEdmw2dnh5MWJ0dURzMmJPUGg0U0VqQVFBNy9idDI5dTk4c29yYk5aL2xwYVFrQ0R4OFBCd0FJQ2dQbjM2ekVwTlRmMGpMeStQSTRLOHZEeDgrKzIzMGRYVmxhc1I4SmNIZkRKb2lCU1l0MDdQSDNkK1hsQytPRG82b3F1cks3Nzk5dHVZbDVlSGUvZnV4Y0xDUXR5K2ZUdCsrZVdYZjd6d3dndXpBQ0RJM2QzZG9XZlBucXl0OTNuM0RIaDRlRGpaMmRtMTdkKy8vL3lWSzFlZXk4bkpRWVBCZ0h2MzdzVjkrL2JoTjk5OGd3TUhEa1I3ZTN1T0RJalJHeUtGaHNpQmVXSDdoc2FaOG9EeXd0SFJFZTN0N1hIZ3dJSDR6VGZmNEw1OSs3QzB0QlIxT2gxdTNib1ZGeTVjZUs1UG56N3piVzF0MjNwNGVEajE3dDJiN2UyYnMwaVlsSlJrQXdET01wa3N1RnUzYmg4c1hMandoMTI3ZHFGT3A4UFMwbEpPcm4zeHhSYzRiTmd3ZEhOejR5NGZvVUYvWEZKZ1h0aWVEM2J5Y3JrYzNkemNjTml3WWZqRkYxK2dYcS9Idlh2M2N1ZjIxNjlmajNQbXpEbmVxVk9uRDJReVdUQUFPUGZwMDhkbTVNaVJncGI3SW1zaWdpdFhya2lQSGozYTlNS0ZDMDRoSVNGUm5UdDNIaFliRzl2SDFkWFYwY0hCQVd4c2JFQXMvcjhkbVhQbnpzRXZ2L3dDdi83NksxeTllaFZPbkRnQnQyL2ZobXZYcm9GY0xvZGJ0MjZCZzRNRDNMcDFDK1J5T2R5OGVaTjVnWG9hUndjSEI3aDU4eVk0T3p0RHMyYk5JQ1FrQkZ4Y1hLQk5tellRSEJ3TTN0N2VBQUJRVzFzTGQrL2VoYXRYcjhMVnExZHZsSmVYYTh2THkzZjk4c3N2aHp3OFBLNkhoNGYvNWVycVdydGx5eFlVT202c3NsaVJsSlFrdlhqeG91MlJJMGVhMmRqWXVFWkVSSFNQaW9ycTA3NTkrM2hYVjFmMzVzMmJnNTJkSFVpbFVoQ0x4UndwMU5iV1FtVmxKVnk0Y0FIKyt1c3Z1SEhqQmxSWFY4UHQyN2ZCeHNZRzd0Mjd4N3pBZkxObXpjRFcxaFljSFIyaGFkT21vRkFvd05QVEU2VFMveXZTMTlYVndmMzc5K0hldlh2dzExOS93YzJiTitIcTFhdVhmdnJwcDdJZmZ2aEJlL1RvMGVKNzkrNWRqWWlJK05QZDNiMWFvOUhVV2hOV3JMcGFPWGJzV05IUm8wZWxGeTlldEt1c3JHd0tBQTV0MjdidDRPbnBHUmNWRlJYcDUrZlhybm56NWg1MmRuWmdiMjhQdHJhMklKVktRU0tSZ0Znc0JwRklCQ0tSaUNNSVpzS3l1cm82UUVUdWk4QmVVMU1EZCs3Y2didDM3MEoxZFRYY3VuWHI0dG16WjM4NmR1elk0Y3JLeXYwblRwdzREZ0MzRkFyRlh3cUZvaW9zTEt4Mnc0WU5hSTB4YWpUYkZhKy8vcnJvMHFWTGtnc1hMdGljUDMvZTl2ejU4MDBBd043UjBkSFozOSsvcFZ3dUQ1VEw1ZjdCd2NHQnpzN09paVpObWpTM3NiRnBhbU5qMDFRaWtkZ3lPQW5UYW10cnErL2R1L2RYZFhYMVgzZnUzUG56MnJWckYwNmRPblg2NXMyYloyL2V2SG42N05tei83bHg0OFkxQUxqajVlVjExOHZMcTFxaFVOeHpkM2UvdjNidFdyVDIrRFRhL2NxSkV5ZUtMbHk0SUs2c3JKU0lSQ0xwdVhQbnBPZk9uWk1CZ0MwQXlBQkFDZ0NTdjc5RWpUbFdBamI4Kyt2KzMxKzFBRkFEQU5YZTN0NDFQajQrdFhWMWRiV2VucDczUFQwOTY5TFMwckN4QllnbE5jOVNVbEpFWXJGWUpCS0pSUHYzN3hlSlJDSkFSQllyNFJJQUFBREV4Y1VoSW1KZFhSMDJScUF6WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Smd4WThhTUdUTm16Q3paL2ovZXp2MEVWc0UwandBQUFBQkpSVTVFcmtKZ2dnPT0nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0b29sdGlwO1xuIiwidmFyIG5vZGUgPSByZXF1aXJlKFwiLi9zcmMvbm9kZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5vZGU7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBpdGVyYXRvciA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIikuaXRlcmF0b3I7XG5cbnZhciB0bnRfbm9kZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4vL3RudC50cmVlLm5vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobm9kZSk7XG5cbiAgICAvLyBBUElcbi8vICAgICBub2RlLm5vZGVzID0gZnVuY3Rpb24oKSB7XG4vLyBcdGlmIChjbHVzdGVyID09PSB1bmRlZmluZWQpIHtcbi8vIFx0ICAgIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXG4vLyBcdCAgICAvLyBUT0RPOiBsZW5ndGggYW5kIGNoaWxkcmVuIHNob3VsZCBiZSBleHBvc2VkIGluIHRoZSBBUElcbi8vIFx0ICAgIC8vIGkuZS4gdGhlIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gY2hhbmdlIHRoaXMgZGVmYXVsdHMgdmlhIHRoZSBBUElcbi8vIFx0ICAgIC8vIGNoaWxkcmVuIGlzIHRoZSBkZWZhdWx0cyBmb3IgcGFyc2VfbmV3aWNrLCBidXQgbWF5YmUgd2Ugc2hvdWxkIGNoYW5nZSB0aGF0XG4vLyBcdCAgICAvLyBvciBhdCBsZWFzdCBub3QgYXNzdW1lIHRoaXMgaXMgYWx3YXlzIHRoZSBjYXNlIGZvciB0aGUgZGF0YSBwcm92aWRlZFxuLy8gXHRcdC52YWx1ZShmdW5jdGlvbihkKSB7cmV0dXJuIGQubGVuZ3RofSlcbi8vIFx0XHQuY2hpbGRyZW4oZnVuY3Rpb24oZCkge3JldHVybiBkLmNoaWxkcmVufSk7XG4vLyBcdH1cbi8vIFx0bm9kZXMgPSBjbHVzdGVyLm5vZGVzKGRhdGEpO1xuLy8gXHRyZXR1cm4gbm9kZXM7XG4vLyAgICAgfTtcblxuICAgIHZhciBhcHBseV90b19kYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNiYWspIHtcblx0Y2JhayhkYXRhKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRhcHBseV90b19kYXRhKGRhdGEuY2hpbGRyZW5baV0sIGNiYWspO1xuXHQgICAgfVxuXHR9XG4gICAgfTtcblxuICAgIHZhciBjcmVhdGVfaWRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgaSA9IGl0ZXJhdG9yKDEpO1xuXHQvLyBXZSBjYW4ndCB1c2UgYXBwbHkgYmVjYXVzZSBhcHBseSBjcmVhdGVzIG5ldyB0cmVlcyBvbiBldmVyeSBub2RlXG5cdC8vIFdlIHNob3VsZCB1c2UgdGhlIGRpcmVjdCBkYXRhIGluc3RlYWRcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIGlmIChkLl9pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5faWQgPSBpKCk7XG5cdFx0Ly8gVE9ETzogTm90IHN1cmUgX2luU3ViVHJlZSBpcyBzdHJpY3RseSBuZWNlc3Nhcnlcblx0XHQvLyBkLl9pblN1YlRyZWUgPSB7cHJldjp0cnVlLCBjdXJyOnRydWV9O1xuXHQgICAgfVxuXHR9KTtcbiAgICB9O1xuXG4gICAgdmFyIGxpbmtfcGFyZW50cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG5cdGlmIChkYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIC8vIF9wYXJlbnQ/XG5cdCAgICBkYXRhLmNoaWxkcmVuW2ldLl9wYXJlbnQgPSBkYXRhO1xuXHQgICAgbGlua19wYXJlbnRzKGRhdGEuY2hpbGRyZW5baV0pO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBjb21wdXRlX3Jvb3RfZGlzdHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHQvLyBjb25zb2xlLmxvZyhkYXRhKTtcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHZhciBsO1xuXHQgICAgaWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5fcm9vdF9kaXN0ID0gMDtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGwgPSAwO1xuXHRcdGlmIChkLmJyYW5jaF9sZW5ndGgpIHtcblx0XHQgICAgbCA9IGQuYnJhbmNoX2xlbmd0aFxuXHRcdH1cblx0XHRkLl9yb290X2Rpc3QgPSBsICsgZC5fcGFyZW50Ll9yb290X2Rpc3Q7XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBkYXRhIGNhbid0IGJlIHJld3JpdHRlbiB1c2VkIHRoZSBhcGkgeWV0LiBXZSBuZWVkIGZpbmFsaXplcnNcbiAgICBub2RlLmRhdGEgPSBmdW5jdGlvbihuZXdfZGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkYXRhXG5cdH1cblx0ZGF0YSA9IG5ld19kYXRhO1xuXHRjcmVhdGVfaWRzKCk7XG5cdGxpbmtfcGFyZW50cyhkYXRhKTtcblx0Y29tcHV0ZV9yb290X2Rpc3RzKGRhdGEpO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9O1xuICAgIC8vIFdlIGJpbmQgdGhlIGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWRcbiAgICBub2RlLmRhdGEoZGF0YSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9hbGwnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pKSB7XG5cdFx0bm9kZXMucHVzaCAobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWspO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWspXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWspO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlX2J5X25hbWUnLCBmdW5jdGlvbihuYW1lKSB7XG5cdHJldHVybiBub2RlLmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLm5vZGVfbmFtZSgpID09PSBuYW1lXG5cdH0pO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3RvZ2dsZScsIGZ1bmN0aW9uKCkge1xuXHRpZiAoZGF0YSkge1xuXHQgICAgaWYgKGRhdGEuY2hpbGRyZW4pIHsgLy8gVW5jb2xsYXBzZWQgLT4gY29sbGFwc2Vcblx0XHR2YXIgaGlkZGVuID0gMDtcblx0XHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHRcdCAgICB2YXIgaGlkZGVuX2hlcmUgPSBuLm5faGlkZGVuKCkgfHwgMDtcblx0XHQgICAgaGlkZGVuICs9IChuLm5faGlkZGVuKCkgfHwgMCkgKyAxO1xuXHRcdH0pO1xuXHRcdG5vZGUubl9oaWRkZW4gKGhpZGRlbi0xKTtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW47XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH0gZWxzZSB7ICAgICAgICAgICAgIC8vIENvbGxhcHNlZCAtPiB1bmNvbGxhcHNlXG5cdFx0bm9kZS5uX2hpZGRlbigwKTtcblx0XHRkYXRhLmNoaWxkcmVuID0gZGF0YS5fY2hpbGRyZW47XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdpc19jb2xsYXBzZWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCAmJiBkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhhc19hbmNlc3RvciA9IGZ1bmN0aW9uKG4sIGFuY2VzdG9yKSB7XG5cdC8vIEl0IGlzIGJldHRlciB0byB3b3JrIGF0IHRoZSBkYXRhIGxldmVsXG5cdG4gPSBuLmRhdGEoKTtcblx0YW5jZXN0b3IgPSBhbmNlc3Rvci5kYXRhKCk7XG5cdGlmIChuLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIGZhbHNlXG5cdH1cblx0biA9IG4uX3BhcmVudFxuXHRmb3IgKDs7KSB7XG5cdCAgICBpZiAobiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgaWYgKG4gPT09IGFuY2VzdG9yKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICBuID0gbi5fcGFyZW50O1xuXHR9XG4gICAgfTtcblxuICAgIC8vIFRoaXMgaXMgdGhlIGVhc2llc3Qgd2F5IHRvIGNhbGN1bGF0ZSB0aGUgTENBIEkgY2FuIHRoaW5rIG9mLiBCdXQgaXQgaXMgdmVyeSBpbmVmZmljaWVudCB0b28uXG4gICAgLy8gSXQgaXMgd29ya2luZyBmaW5lIGJ5IG5vdywgYnV0IGluIGNhc2UgaXQgbmVlZHMgdG8gYmUgbW9yZSBwZXJmb3JtYW50IHdlIGNhbiBpbXBsZW1lbnQgdGhlIExDQVxuICAgIC8vIGFsZ29yaXRobSBleHBsYWluZWQgaGVyZTpcbiAgICAvLyBodHRwOi8vY29tbXVuaXR5LnRvcGNvZGVyLmNvbS90Yz9tb2R1bGU9U3RhdGljJmQxPXR1dG9yaWFscyZkMj1sb3dlc3RDb21tb25BbmNlc3RvclxuICAgIGFwaS5tZXRob2QgKCdsY2EnLCBmdW5jdGlvbiAobm9kZXMpIHtcblx0aWYgKG5vZGVzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgcmV0dXJuIG5vZGVzWzBdO1xuXHR9XG5cdHZhciBsY2Ffbm9kZSA9IG5vZGVzWzBdO1xuXHRmb3IgKHZhciBpID0gMTsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgbGNhX25vZGUgPSBfbGNhKGxjYV9ub2RlLCBub2Rlc1tpXSk7XG5cdH1cblx0cmV0dXJuIGxjYV9ub2RlO1xuXHQvLyByZXR1cm4gdG50X25vZGUobGNhX25vZGUpO1xuICAgIH0pO1xuXG4gICAgdmFyIF9sY2EgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcblx0aWYgKG5vZGUxLmRhdGEoKSA9PT0gbm9kZTIuZGF0YSgpKSB7XG5cdCAgICByZXR1cm4gbm9kZTE7XG5cdH1cblx0aWYgKGhhc19hbmNlc3Rvcihub2RlMSwgbm9kZTIpKSB7XG5cdCAgICByZXR1cm4gbm9kZTI7XG5cdH1cblx0cmV0dXJuIF9sY2Eobm9kZTEsIG5vZGUyLnBhcmVudCgpKTtcbiAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCgnbl9oaWRkZW4nLCBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIG5vZGUucHJvcGVydHkoJ19oaWRkZW4nKTtcblx0fVxuXHRub2RlLnByb3BlcnR5KCdfaGlkZGVuJywgdmFsKTtcblx0cmV0dXJuIG5vZGVcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX25vZGVzJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uICgpIHtcblx0dmFyIGxlYXZlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAobi5pc19sZWFmKCkpIHtcblx0XHRsZWF2ZXMucHVzaChuKTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBsZWF2ZXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgndXBzdHJlYW0nLCBmdW5jdGlvbihjYmFrKSB7XG5cdGNiYWsobm9kZSk7XG5cdHZhciBwYXJlbnQgPSBub2RlLnBhcmVudCgpO1xuXHRpZiAocGFyZW50ICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIHBhcmVudC51cHN0cmVhbShjYmFrKTtcblx0fVxuLy9cdHRudF9ub2RlKHBhcmVudCkudXBzdHJlYW0oY2Jhayk7XG4vLyBcdG5vZGUudXBzdHJlYW0obm9kZS5fcGFyZW50LCBjYmFrKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdzdWJ0cmVlJywgZnVuY3Rpb24obm9kZXMpIHtcbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXG5cdHZhciBpc19zaW5nbGV0b24gPSBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbl9jaGlsZHJlbiA9IDA7XG5cdCAgICBpZiAobm9kZV9kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bm9kZV9kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGlkID0gbm9kZV9kYXRhLmNoaWxkcmVuW2ldLl9pZDtcblx0XHRpZiAobm9kZV9jb3VudHNbaWRdID4gMCkge1xuXHRcdCAgICBuX2NoaWxkcmVuKys7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5fY2hpbGRyZW4gPT09IDE7XG5cdH07XG5cblx0dmFyIHN1YnRyZWUgPSB7fTtcblx0Y29weV9kYXRhIChkYXRhLCBzdWJ0cmVlLCBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbm9kZV9pZCA9IG5vZGVfZGF0YS5faWQ7XG5cdCAgICB2YXIgY291bnRzID0gbm9kZV9jb3VudHNbbm9kZV9pZF07XG5cblx0ICAgIGlmIChjb3VudHMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgXHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG4vLyBcdCAgICBpZiAoKG5vZGUuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkgJiYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoIDwgMikpIHtcbi8vIFx0XHRyZXR1cm4gZmFsc2U7XG4vLyBcdCAgICB9XG5cdCAgICBpZiAoKGNvdW50cyA+IDEpICYmICghaXNfc2luZ2xldG9uKG5vZGVfZGF0YSkpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICBpZiAoKGNvdW50cyA+IDApICYmIChub2RlX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0cmV0dXJuIHRudF9ub2RlKHN1YnRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAob3JpZ19kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25kaXRpb24ob3JpZ19kYXRhKSkge1xuXHQgICAgdmFyIGNvcHkgPSBjb3B5X25vZGUob3JpZ19kYXRhKTtcblx0ICAgIGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJ0cmVlLmNoaWxkcmVuID0gW107XG5cdCAgICB9XG5cdCAgICBzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YSAob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBjb3B5LCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjb3B5X25vZGUgPSBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdHZhciBjb3B5ID0ge307XG5cdC8vIGNvcHkgYWxsIHRoZSBvd24gcHJvcGVydGllcyBleGNlcHRzIGxpbmtzIHRvIG90aGVyIG5vZGVzIG9yIGRlcHRoXG5cdGZvciAodmFyIHBhcmFtIGluIG5vZGVfZGF0YSkge1xuXHQgICAgaWYgKChwYXJhbSA9PT0gXCJjaGlsZHJlblwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJfY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX3BhcmVudFwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJkZXB0aFwiKSkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgaWYgKG5vZGVfZGF0YS5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcblx0XHRjb3B5W3BhcmFtXSA9IG5vZGVfZGF0YVtwYXJhbV07XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIGNvcHk7XG4gICAgfTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIHZpc2l0cyBhbGwgdGhlIG5vZGVzXG4gICAgLy8gYSBtb3JlIHBlcmZvcm1hbnQgdmVyc2lvbiBzaG91bGQgcmV0dXJuIHRydWVcbiAgICAvLyB0aGUgZmlyc3QgdGltZSBjYmFrKG5vZGUpIGlzIHRydWVcbiAgICBhcGkubWV0aG9kICgncHJlc2VudCcsIGZ1bmN0aW9uIChjYmFrKSB7XG5cdC8vIGNiYWsgc2hvdWxkIHJldHVybiB0cnVlL2ZhbHNlXG5cdHZhciBpc190cnVlID0gZmFsc2U7XG5cdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAoY2JhayhuKSA9PT0gdHJ1ZSkge1xuXHRcdGlzX3RydWUgPSB0cnVlO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIGlzX3RydWU7XG4gICAgfSk7XG5cbiAgICAvLyBjYmFrIGlzIGNhbGxlZCB3aXRoIHR3byBub2Rlc1xuICAgIC8vIGFuZCBzaG91bGQgcmV0dXJuIGEgbmVnYXRpdmUgbnVtYmVyLCAwIG9yIGEgcG9zaXRpdmUgbnVtYmVyXG4gICAgYXBpLm1ldGhvZCAoJ3NvcnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHR2YXIgbmV3X2NoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBuZXdfY2hpbGRyZW4ucHVzaCh0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKSk7XG5cdH1cblxuXHRuZXdfY2hpbGRyZW4uc29ydChjYmFrKTtcblxuXHRkYXRhLmNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxuZXdfY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIGRhdGEuY2hpbGRyZW4ucHVzaChuZXdfY2hpbGRyZW5baV0uZGF0YSgpKTtcblx0fVxuXG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKS5zb3J0KGNiYWspO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmxhdHRlbicsIGZ1bmN0aW9uICgpIHtcblx0aWYgKG5vZGUuaXNfbGVhZigpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXHR2YXIgZGF0YSA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgbmV3cm9vdCA9IGNvcHlfbm9kZShkYXRhKTtcblx0dmFyIGxlYXZlcyA9IG5vZGUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0bmV3cm9vdC5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBuZXdyb290LmNoaWxkcmVuLnB1c2goY29weV9ub2RlKGxlYXZlc1tpXS5kYXRhKCkpKTtcblx0fVxuXG5cdHJldHVybiB0bnRfbm9kZShuZXdyb290KTtcbiAgICB9KTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIG9ubHkgJ2FwcGx5J3MgdG8gbm9uIGNvbGxhcHNlZCBub2RlcyAoaWUgLl9jaGlsZHJlbiBpcyBub3QgdmlzaXRlZClcbiAgICAvLyBXb3VsZCBpdCBiZSBiZXR0ZXIgdG8gaGF2ZSBhbiBleHRyYSBmbGFnICh0cnVlL2ZhbHNlKSB0byB2aXNpdCBhbHNvIGNvbGxhcHNlZCBub2Rlcz9cbiAgICBhcGkubWV0aG9kICgnYXBwbHknLCBmdW5jdGlvbihjYmFrKSB7XG5cdGNiYWsobm9kZSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKVxuXHRcdG4uYXBwbHkoY2Jhayk7XG5cdCAgICB9XG5cdH1cbiAgICB9KTtcblxuICAgIC8vIFRPRE86IE5vdCBzdXJlIGlmIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB2aWEgYSBjYWxsYmFjazpcbiAgICAvLyByb290LnByb3BlcnR5IChmdW5jdGlvbiAobm9kZSwgdmFsKSB7XG4gICAgLy8gICAgbm9kZS5kZWVwZXIuZmllbGQgPSB2YWxcbiAgICAvLyB9LCAnbmV3X3ZhbHVlJylcbiAgICBhcGkubWV0aG9kICgncHJvcGVydHknLCBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgaWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRyZXR1cm4gcHJvcChkYXRhKVx0XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZGF0YVtwcm9wXVxuXHR9XG5cdGlmICgodHlwZW9mIHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBwcm9wKGRhdGEsIHZhbHVlKTsgICBcblx0fVxuXHRkYXRhW3Byb3BdID0gdmFsdWU7XG5cdHJldHVybiBub2RlO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2xlYWYnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZDtcbiAgICB9KTtcblxuICAgIC8vIEl0IGxvb2tzIGxpa2UgdGhlIGNsdXN0ZXIgY2FuJ3QgYmUgdXNlZCBmb3IgYW55dGhpbmcgdXNlZnVsIGhlcmVcbiAgICAvLyBJdCBpcyBub3cgaW5jbHVkZWQgYXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHRoZSB0bnQudHJlZSgpIG1ldGhvZCBjYWxsXG4gICAgLy8gc28gSSdtIGNvbW1lbnRpbmcgdGhlIGdldHRlclxuICAgIC8vIG5vZGUuY2x1c3RlciA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFx0cmV0dXJuIGNsdXN0ZXI7XG4gICAgLy8gfTtcblxuICAgIC8vIG5vZGUuZGVwdGggPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vICAgICByZXR1cm4gbm9kZS5kZXB0aDtcbiAgICAvLyB9O1xuXG4vLyAgICAgbm9kZS5uYW1lID0gZnVuY3Rpb24gKG5vZGUpIHtcbi8vICAgICAgICAgcmV0dXJuIG5vZGUubmFtZTtcbi8vICAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lkJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2lkJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnbm9kZV9uYW1lJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnbmFtZScpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2JyYW5jaF9sZW5ndGgnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdicmFuY2hfbGVuZ3RoJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncm9vdF9kaXN0JywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX3Jvb3RfZGlzdCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2NoaWxkcmVuJywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0dmFyIGNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0fVxuXHRyZXR1cm4gY2hpbGRyZW47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIHRudF9ub2RlKGRhdGEuX3BhcmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbm9kZTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X25vZGU7XG5cbiIsIi8vIGlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fVxuLy8gfVxubW9kdWxlLmV4cG9ydHMgPSB0cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZShcImJpb2pzLWV2ZW50c1wiKTtcbmV2ZW50c3lzdGVtLm1peGluKHRyZWUpO1xuLy90bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy90bnQudG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcbi8vdG50LnRyZWUgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoJ3RudC5hcGknKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUuZGlhZ29uYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGQgPSBmdW5jdGlvbiAoZGlhZ29uYWxQYXRoKSB7XG5cdHZhciBzb3VyY2UgPSBkaWFnb25hbFBhdGguc291cmNlO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZGlhZ29uYWxQYXRoLnRhcmdldDtcbiAgICAgICAgdmFyIG1pZHBvaW50WCA9IChzb3VyY2UueCArIHRhcmdldC54KSAvIDI7XG4gICAgICAgIHZhciBtaWRwb2ludFkgPSAoc291cmNlLnkgKyB0YXJnZXQueSkgLyAyO1xuICAgICAgICB2YXIgcGF0aERhdGEgPSBbc291cmNlLCB7eDogdGFyZ2V0LngsIHk6IHNvdXJjZS55fSwgdGFyZ2V0XTtcblx0cGF0aERhdGEgPSBwYXRoRGF0YS5tYXAoZC5wcm9qZWN0aW9uKCkpO1xuXHRyZXR1cm4gZC5wYXRoKCkocGF0aERhdGEsIHJhZGlhbF9jYWxjLmNhbGwodGhpcyxwYXRoRGF0YSkpXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAoZClcblx0LmdldHNldCAoJ3Byb2plY3Rpb24nKVxuXHQuZ2V0c2V0ICgncGF0aCcpXG4gICAgXG4gICAgdmFyIGNvb3JkaW5hdGVUb0FuZ2xlID0gZnVuY3Rpb24gKGNvb3JkLCByYWRpdXMpIHtcbiAgICAgIFx0dmFyIHdob2xlQW5nbGUgPSAyICogTWF0aC5QSSxcbiAgICAgICAgcXVhcnRlckFuZ2xlID0gd2hvbGVBbmdsZSAvIDRcblx0XG4gICAgICBcdHZhciBjb29yZFF1YWQgPSBjb29yZFswXSA+PSAwID8gKGNvb3JkWzFdID49IDAgPyAxIDogMikgOiAoY29vcmRbMV0gPj0gMCA/IDQgOiAzKSxcbiAgICAgICAgY29vcmRCYXNlQW5nbGUgPSBNYXRoLmFicyhNYXRoLmFzaW4oY29vcmRbMV0gLyByYWRpdXMpKVxuXHRcbiAgICAgIFx0Ly8gU2luY2UgdGhpcyBpcyBqdXN0IGJhc2VkIG9uIHRoZSBhbmdsZSBvZiB0aGUgcmlnaHQgdHJpYW5nbGUgZm9ybWVkXG4gICAgICBcdC8vIGJ5IHRoZSBjb29yZGluYXRlIGFuZCB0aGUgb3JpZ2luLCBlYWNoIHF1YWQgd2lsbCBoYXZlIGRpZmZlcmVudCBcbiAgICAgIFx0Ly8gb2Zmc2V0c1xuICAgICAgXHR2YXIgY29vcmRBbmdsZTtcbiAgICAgIFx0c3dpdGNoIChjb29yZFF1YWQpIHtcbiAgICAgIFx0Y2FzZSAxOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdCAgICBicmVha1xuICAgICAgXHRjYXNlIDI6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlICsgY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgMzpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAyKnF1YXJ0ZXJBbmdsZSArIHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdCAgICBicmVha1xuICAgICAgXHRjYXNlIDQ6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gMypxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZVxuICAgICAgXHR9XG4gICAgICBcdHJldHVybiBjb29yZEFuZ2xlXG4gICAgfTtcblxuICAgIHZhciByYWRpYWxfY2FsYyA9IGZ1bmN0aW9uIChwYXRoRGF0YSkge1xuXHR2YXIgc3JjID0gcGF0aERhdGFbMF07XG5cdHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcblx0dmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuXHR2YXIgcmFkaXVzID0gTWF0aC5zcXJ0KHNyY1swXSpzcmNbMF0gKyBzcmNbMV0qc3JjWzFdKTtcblx0dmFyIHNyY0FuZ2xlID0gY29vcmRpbmF0ZVRvQW5nbGUoc3JjLCByYWRpdXMpO1xuXHR2YXIgbWlkQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShtaWQsIHJhZGl1cyk7XG5cdHZhciBjbG9ja3dpc2UgPSBNYXRoLmFicyhtaWRBbmdsZSAtIHNyY0FuZ2xlKSA+IE1hdGguUEkgPyBtaWRBbmdsZSA8PSBzcmNBbmdsZSA6IG1pZEFuZ2xlID4gc3JjQW5nbGU7XG5cdHJldHVybiB7XG5cdCAgICByYWRpdXMgICA6IHJhZGl1cyxcblx0ICAgIGNsb2Nrd2lzZSA6IGNsb2Nrd2lzZVxuXHR9O1xuICAgIH07XG5cbiAgICByZXR1cm4gZDtcbn07XG5cbi8vIHZlcnRpY2FsIGRpYWdvbmFsIGZvciByZWN0IGJyYW5jaGVzXG50cmVlLmRpYWdvbmFsLnZlcnRpY2FsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXRoID0gZnVuY3Rpb24ocGF0aERhdGEsIG9iaikge1xuXHR2YXIgc3JjID0gcGF0aERhdGFbMF07XG5cdHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcblx0dmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuXHR2YXIgcmFkaXVzID0gMjAwMDAwOyAvLyBOdW1iZXIgbG9uZyBlbm91Z2hcblxuXHRyZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7IFxuXHRcbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7IFxuXHRyZXR1cm4gW2QueSwgZC54XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xufTtcblxudHJlZS5kaWFnb25hbC5yYWRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG4gICAgICBcdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcbiAgICAgIFx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuICAgICAgXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSBvYmoucmFkaXVzO1xuXHR2YXIgY2xvY2t3aXNlID0gb2JqLmNsb2Nrd2lzZTtcblxuXHRpZiAoY2xvY2t3aXNlKSB7XG5cdCAgICByZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7IFxuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIFwiTVwiICsgbWlkICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBzcmMgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0O1xuXHR9XG5cbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gICAgICBcdHZhciByID0gZC55LCBhID0gKGQueCAtIDkwKSAvIDE4MCAqIE1hdGguUEk7XG4gICAgICBcdHJldHVybiBbciAqIE1hdGguY29zKGEpLCByICogTWF0aC5zaW4oYSldO1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmRpYWdvbmFsO1xuIiwidmFyIHRyZWUgPSByZXF1aXJlIChcIi4vdHJlZS5qc1wiKTtcbnRyZWUubGFiZWwgPSByZXF1aXJlKFwiLi9sYWJlbC5qc1wiKTtcbnRyZWUuZGlhZ29uYWwgPSByZXF1aXJlKFwiLi9kaWFnb25hbC5qc1wiKTtcbnRyZWUubGF5b3V0ID0gcmVxdWlyZShcIi4vbGF5b3V0LmpzXCIpO1xudHJlZS5ub2RlX2Rpc3BsYXkgPSByZXF1aXJlKFwiLi9ub2RlX2Rpc3BsYXkuanNcIik7XG4vLyB0cmVlLm5vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcbi8vIHRyZWUucGFyc2VfbmV3aWNrID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2VfbmV3aWNrO1xuLy8gdHJlZS5wYXJzZV9uaHggPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uaHg7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5sYWJlbCA9IGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgd2Ugc2hvdWxkIGJlIHJlbW92aW5nIGJ5IGRlZmF1bHQgcHJldiBsYWJlbHNcbiAgICAvLyBvciBpdCB3b3VsZCBiZSBiZXR0ZXIgdG8gaGF2ZSBhIHNlcGFyYXRlIHJlbW92ZSBtZXRob2QgY2FsbGVkIGJ5IHRoZSB2aXNcbiAgICAvLyBvbiB1cGRhdGVcbiAgICAvLyBXZSBhbHNvIGhhdmUgdGhlIHByb2JsZW0gdGhhdCB3ZSBtYXkgYmUgdHJhbnNpdGlvbmluZyBmcm9tXG4gICAgLy8gdGV4dCB0byBpbWcgbGFiZWxzIGFuZCB3ZSBuZWVkIHRvIHJlbW92ZSB0aGUgbGFiZWwgb2YgYSBkaWZmZXJlbnQgdHlwZVxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSwgbm9kZV9zaXplKSB7XG5cdGlmICh0eXBlb2YgKG5vZGUpICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyhub2RlKTtcbiAgICAgICAgfVxuXG5cdGxhYmVsLmRpc3BsYXkoKS5jYWxsKHRoaXMsIG5vZGUsIGxheW91dF90eXBlKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xhYmVsXCIpXG5cdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHZhciB0ID0gbGFiZWwudHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuXHRcdHJldHVybiBcInRyYW5zbGF0ZSAoXCIgKyAodC50cmFuc2xhdGVbMF0gKyBub2RlX3NpemUpICsgXCIgXCIgKyB0LnRyYW5zbGF0ZVsxXSArIFwiKXJvdGF0ZShcIiArIHQucm90YXRlICsgXCIpXCI7XG5cdCAgICB9KVxuXHQvLyBUT0RPOiB0aGlzIGNsaWNrIGV2ZW50IGlzIHByb2JhYmx5IG5ldmVyIGZpcmVkIHNpbmNlIHRoZXJlIGlzIGFuIG9uY2xpY2sgZXZlbnQgaW4gdGhlIG5vZGUgZyBlbGVtZW50P1xuXHQgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKXtcblx0XHRpZiAobGFiZWwub25fY2xpY2soKSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIGQzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdCAgICBsYWJlbC5vbl9jbGljaygpLmNhbGwodGhpcywgbm9kZSk7XG5cdFx0fVxuXHQgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cdC5nZXRzZXQgKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgd2lkdGggY2FsbGJhY2tcIiB9KVxuXHQuZ2V0c2V0ICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBoZWlnaHQgY2FsbGJhY2tcIiB9KVxuXHQuZ2V0c2V0ICgnZGlzcGxheScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgZGlzcGxheSBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIHRyYW5zZm9ybSBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdvbl9jbGljaycpO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuLy8gVGV4dCBiYXNlZCBsYWJlbHNcbnRyZWUubGFiZWwudGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWwgPSB0cmVlLmxhYmVsKCk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuXHQuZ2V0c2V0ICgnZm9udHNpemUnLCAxMClcblx0LmdldHNldCAoJ2NvbG9yJywgXCIjMDAwXCIpXG5cdC5nZXRzZXQgKCd0ZXh0JywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBkLmRhdGEoKS5uYW1lO1xuXHR9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBsID0gZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuXHRcdCAgICByZXR1cm4gKGQueCUzNjAgPCAxODApID8gXCJzdGFydFwiIDogXCJlbmRcIjtcblx0XHR9XG5cdFx0cmV0dXJuIFwic3RhcnRcIjtcblx0ICAgIH0pXG5cdCAgICAudGV4dChmdW5jdGlvbigpe1xuXHRcdHJldHVybiBsYWJlbC50ZXh0KCkobm9kZSlcblx0ICAgIH0pXG5cdCAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGxhYmVsLmZvbnRzaXplKCkgKyBcInB4XCIpXG5cdCAgICAuc3R5bGUoJ2ZpbGwnLCBkMy5mdW5jdG9yKGxhYmVsLmNvbG9yKCkpKG5vZGUpKTtcblxuXHRyZXR1cm4gbDtcbiAgICB9KTtcblxuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBkID0gbm9kZS5kYXRhKCk7XG5cdHZhciB0ID0ge1xuXHQgICAgdHJhbnNsYXRlIDogWzUsIDVdLFxuXHQgICAgcm90YXRlIDogMFxuXHR9O1xuXHRpZiAobGF5b3V0X3R5cGUgPT09IFwicmFkaWFsXCIpIHtcblx0ICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gLSAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5mb250c2l6ZSgpKVxuXHQgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG5cdH1cblx0cmV0dXJuIHQ7XG4gICAgfSk7XG5cblxuICAgIC8vIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyBcdHZhciBkID0gbm9kZS5kYXRhKCk7XG4gICAgLy8gXHRyZXR1cm4gXCJ0cmFuc2xhdGUoMTAgNSlyb3RhdGUoXCIgKyAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApICsgXCIpXCI7XG4gICAgLy8gfSk7XG5cbiAgICBsYWJlbC53aWR0aCAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHN2ZyA9IGQzLnNlbGVjdChcImJvZHlcIilcblx0ICAgIC5hcHBlbmQoXCJzdmdcIilcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIDApXG5cdCAgICAuc3R5bGUoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG5cblx0dmFyIHRleHQgPSBzdmdcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGxhYmVsLmZvbnRzaXplKCkgKyBcInB4XCIpXG5cdCAgICAudGV4dChsYWJlbC50ZXh0KCkobm9kZSkpO1xuXG5cdHZhciB3aWR0aCA9IHRleHQubm9kZSgpLmdldEJCb3goKS53aWR0aDtcblx0c3ZnLnJlbW92ZSgpO1xuXG5cdHJldHVybiB3aWR0aDtcbiAgICB9KTtcblxuICAgIGxhYmVsLmhlaWdodCAoZnVuY3Rpb24gKG5vZGUpIHtcblx0cmV0dXJuIGxhYmVsLmZvbnRzaXplKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBJbWFnZSBiYXNlZCBsYWJlbHNcbnRyZWUubGFiZWwuaW1nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cdC5nZXRzZXQgKCdzcmMnLCBmdW5jdGlvbiAoKSB7fSlcblxuICAgIGxhYmVsLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHRpZiAobGFiZWwuc3JjKCkobm9kZSkpIHtcblx0ICAgIHZhciBsID0gZDMuc2VsZWN0KHRoaXMpXG5cdFx0LmFwcGVuZChcImltYWdlXCIpXG5cdFx0LmF0dHIoXCJ3aWR0aFwiLCBsYWJlbC53aWR0aCgpKCkpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgbGFiZWwuaGVpZ2h0KCkoKSlcblx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgbGFiZWwuc3JjKCkobm9kZSkpO1xuXHQgICAgcmV0dXJuIGw7XG5cdH1cblx0Ly8gZmFsbGJhY2sgdGV4dCBpbiBjYXNlIHRoZSBpbWcgaXMgbm90IGZvdW5kP1xuXHRyZXR1cm4gZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLnRleHQoXCJcIik7XG4gICAgfSk7XG5cbiAgICBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHR2YXIgZCA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgdCA9IHtcblx0ICAgIHRyYW5zbGF0ZSA6IFsxMCwgKC1sYWJlbC5oZWlnaHQoKSgpIC8gMildLFxuXHQgICAgcm90YXRlIDogMFxuXHR9O1xuXHRpZiAobGF5b3V0X3R5cGUgPT09ICdyYWRpYWwnKSB7XG5cdCAgICB0LnRyYW5zbGF0ZVswXSA9IHQudHJhbnNsYXRlWzBdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwud2lkdGgoKSgpKSxcblx0ICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5oZWlnaHQoKSgpKSxcblx0ICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuXHR9XG5cblx0cmV0dXJuIHQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBMYWJlbHMgbWFkZSBvZiAyKyBzaW1wbGUgbGFiZWxzXG50cmVlLmxhYmVsLmNvbXBvc2l0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWxzID0gW107XG5cbiAgICB2YXIgbGFiZWwgPSBmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGN1cnJfeG9mZnNldCA9IDA7XG5cblx0Zm9yICh2YXIgaT0wOyBpPGxhYmVscy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIGRpc3BsYXkgPSBsYWJlbHNbaV07XG5cblx0ICAgIChmdW5jdGlvbiAob2Zmc2V0KSB7XG5cdFx0ZGlzcGxheS50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHRcdCAgICB2YXIgdHN1cGVyID0gZGlzcGxheS5fc3VwZXJfLnRyYW5zZm9ybSgpKG5vZGUsIGxheW91dF90eXBlKTtcblx0XHQgICAgdmFyIHQgPSB7XG5cdFx0XHR0cmFuc2xhdGUgOiBbb2Zmc2V0ICsgdHN1cGVyLnRyYW5zbGF0ZVswXSwgdHN1cGVyLnRyYW5zbGF0ZVsxXV0sXG5cdFx0XHRyb3RhdGUgOiB0c3VwZXIucm90YXRlXG5cdFx0ICAgIH07XG5cdFx0ICAgIHJldHVybiB0O1xuXHRcdH0pXG5cdCAgICB9KShjdXJyX3hvZmZzZXQpO1xuXG5cdCAgICBjdXJyX3hvZmZzZXQgKz0gMTA7XG5cdCAgICBjdXJyX3hvZmZzZXQgKz0gZGlzcGxheS53aWR0aCgpKG5vZGUpO1xuXG5cdCAgICBkaXNwbGF5LmNhbGwodGhpcywgbm9kZSwgbGF5b3V0X3R5cGUpO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cbiAgICBhcGkubWV0aG9kICgnYWRkX2xhYmVsJywgZnVuY3Rpb24gKGRpc3BsYXksIG5vZGUpIHtcblx0ZGlzcGxheS5fc3VwZXJfID0ge307XG5cdGFwaWpzIChkaXNwbGF5Ll9zdXBlcl8pXG5cdCAgICAuZ2V0ICgndHJhbnNmb3JtJywgZGlzcGxheS50cmFuc2Zvcm0oKSk7XG5cblx0bGFiZWxzLnB1c2goZGlzcGxheSk7XG5cdHJldHVybiBsYWJlbDtcbiAgICB9KTtcbiAgICBcbiAgICBhcGkubWV0aG9kICgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgdmFyIHRvdF93aWR0aCA9IDA7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dG90X3dpZHRoICs9IHBhcnNlSW50KGxhYmVsc1tpXS53aWR0aCgpKG5vZGUpKTtcblx0XHR0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLl9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSkudHJhbnNsYXRlWzBdKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHRvdF93aWR0aDtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgbWF4X2hlaWdodCA9IDA7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGN1cnJfaGVpZ2h0ID0gbGFiZWxzW2ldLmhlaWdodCgpKG5vZGUpO1xuXHRcdGlmICggY3Vycl9oZWlnaHQgPiBtYXhfaGVpZ2h0KSB7XG5cdFx0ICAgIG1heF9oZWlnaHQgPSBjdXJyX2hlaWdodDtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbWF4X2hlaWdodDtcblx0fVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5sYWJlbDtcblxuXG4iLCIvLyBCYXNlZCBvbiB0aGUgY29kZSBieSBLZW4taWNoaSBVZWRhIGluIGh0dHA6Ly9ibC5vY2tzLm9yZy9rdWVkYS8xMDM2Nzc2I2QzLnBoeWxvZ3JhbS5qc1xuXG52YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBkaWFnb25hbCA9IHJlcXVpcmUoXCIuL2RpYWdvbmFsLmpzXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5sYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgdmFyIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXG5cdC5zb3J0KG51bGwpXG5cdC52YWx1ZShmdW5jdGlvbiAoZCkge3JldHVybiBkLmxlbmd0aH0gKVxuXHQuc2VwYXJhdGlvbihmdW5jdGlvbiAoKSB7cmV0dXJuIDF9KTtcbiAgICBcbiAgICB2YXIgYXBpID0gYXBpanMgKGwpXG5cdC5nZXRzZXQgKCdzY2FsZScsIHRydWUpXG5cdC5nZXRzZXQgKCdtYXhfbGVhZl9sYWJlbF93aWR0aCcsIDApXG5cdC5tZXRob2QgKFwiY2x1c3RlclwiLCBjbHVzdGVyKVxuXHQubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJ5c2NhbGUgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KVxuXHQubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKCkge3Rocm93IFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIiB9KVxuXHQubWV0aG9kKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHt0aHJvdyBcIndpZHRoIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwifSlcblx0Lm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKCkge3Rocm93IFwiaGVpZ2h0IGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwifSk7XG5cbiAgICBhcGkubWV0aG9kKCdzY2FsZV9icmFuY2hfbGVuZ3RocycsIGZ1bmN0aW9uIChjdXJyKSB7XG5cdGlmIChsLnNjYWxlKCkgPT09IGZhbHNlKSB7XG5cdCAgICByZXR1cm5cblx0fVxuXG5cdHZhciBub2RlcyA9IGN1cnIubm9kZXM7XG5cdHZhciB0cmVlID0gY3Vyci50cmVlO1xuXG5cdHZhciByb290X2Rpc3RzID0gbm9kZXMubWFwIChmdW5jdGlvbiAoZCkge1xuXHQgICAgcmV0dXJuIGQuX3Jvb3RfZGlzdDtcblx0fSk7XG5cblx0dmFyIHlzY2FsZSA9IGwueXNjYWxlKHJvb3RfZGlzdHMpO1xuXHR0cmVlLmFwcGx5IChmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgbm9kZS5wcm9wZXJ0eShcInlcIiwgeXNjYWxlKG5vZGUucm9vdF9kaXN0KCkpKTtcblx0fSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbDtcbn07XG5cbnRyZWUubGF5b3V0LnZlcnRpY2FsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXlvdXQgPSB0cmVlLmxheW91dCgpO1xuICAgIC8vIEVsZW1lbnRzIGxpa2UgJ2xhYmVscycgZGVwZW5kIG9uIHRoZSBsYXlvdXQgdHlwZS4gVGhpcyBleHBvc2VzIGEgd2F5IG9mIGlkZW50aWZ5aW5nIHRoZSBsYXlvdXQgdHlwZVxuICAgIGxheW91dC50eXBlID0gXCJ2ZXJ0aWNhbFwiO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG5cdC5nZXRzZXQgKCd3aWR0aCcsIDM2MClcblx0LmdldCAoJ3RyYW5zbGF0ZV92aXMnLCBbMjAsMjBdKVxuXHQubWV0aG9kICgnZGlhZ29uYWwnLCBkaWFnb25hbC52ZXJ0aWNhbClcblx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIixcIiArIGQueCArIFwiKVwiO1xuXHR9KTtcblxuICAgIGFwaS5tZXRob2QoJ2hlaWdodCcsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICBcdHJldHVybiAocGFyYW1zLm5fbGVhdmVzICogcGFyYW1zLmxhYmVsX2hlaWdodCk7XG4gICAgfSk7IFxuXG4gICAgYXBpLm1ldGhvZCgneXNjYWxlJywgZnVuY3Rpb24gKGRpc3RzKSB7XG4gICAgXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcbiAgICBcdCAgICAuZG9tYWluKFswLCBkMy5tYXgoZGlzdHMpXSlcbiAgICBcdCAgICAucmFuZ2UoWzAsIGxheW91dC53aWR0aCgpIC0gMjAgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKV0pO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnYWRqdXN0X2NsdXN0ZXJfc2l6ZScsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICBcdHZhciBoID0gbGF5b3V0LmhlaWdodChwYXJhbXMpO1xuICAgIFx0dmFyIHcgPSBsYXlvdXQud2lkdGgoKSAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpIC0gbGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSAtIHBhcmFtcy5sYWJlbF9wYWRkaW5nO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZSAoW2gsd10pO1xuICAgIFx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG50cmVlLmxheW91dC5yYWRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSAncmFkaWFsJztcblxuICAgIHZhciBkZWZhdWx0X3dpZHRoID0gMzYwO1xuICAgIHZhciByID0gZGVmYXVsdF93aWR0aCAvIDI7XG5cbiAgICB2YXIgY29uZiA9IHtcbiAgICBcdHdpZHRoIDogMzYwXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGF5b3V0KVxuXHQuZ2V0c2V0IChjb25mKVxuXHQuZ2V0c2V0ICgndHJhbnNsYXRlX3ZpcycsIFtyLCByXSkgLy8gVE9ETzogMS4zIHNob3VsZCBiZSByZXBsYWNlZCBieSBhIHNlbnNpYmxlIHZhbHVlXG5cdC5tZXRob2QgKCd0cmFuc2Zvcm1fbm9kZScsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7XG5cdH0pXG5cdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnJhZGlhbClcblx0Lm1ldGhvZCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbmYud2lkdGggfSk7XG5cbiAgICAvLyBDaGFuZ2VzIGluIHdpZHRoIGFmZmVjdCBjaGFuZ2VzIGluIHJcbiAgICBsYXlvdXQud2lkdGgudHJhbnNmb3JtIChmdW5jdGlvbiAodmFsKSB7XG4gICAgXHRyID0gdmFsIC8gMjtcbiAgICBcdGxheW91dC5jbHVzdGVyLnNpemUoWzM2MCwgcl0pXG4gICAgXHRsYXlvdXQudHJhbnNsYXRlX3Zpcyhbciwgcl0pO1xuICAgIFx0cmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwieXNjYWxlXCIsICBmdW5jdGlvbiAoZGlzdHMpIHtcblx0cmV0dXJuIGQzLnNjYWxlLmxpbmVhcigpXG5cdCAgICAuZG9tYWluKFswLGQzLm1heChkaXN0cyldKVxuXHQgICAgLnJhbmdlKFswLCByXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kIChcImFkanVzdF9jbHVzdGVyX3NpemVcIiwgZnVuY3Rpb24gKHBhcmFtcykge1xuXHRyID0gKGxheW91dC53aWR0aCgpLzIpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSAyMDtcblx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSk7XG5cdHJldHVybiBsYXlvdXQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGF5b3V0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5sYXlvdXQ7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUubm9kZV9kaXNwbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG4gPSBmdW5jdGlvbiAobm9kZSkge1xuXHRuLmRpc3BsYXkoKS5jYWxsKHRoaXMsIG5vZGUpXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobilcblx0LmdldHNldChcInNpemVcIiwgNC41KVxuXHQuZ2V0c2V0KFwiZmlsbFwiLCBcImJsYWNrXCIpXG5cdC5nZXRzZXQoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHQuZ2V0c2V0KFwic3Ryb2tlX3dpZHRoXCIsIFwiMXB4XCIpXG5cdC5nZXRzZXQoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uICgpIHt0aHJvdyBcImRpc3BsYXkgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuY2lyY2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdCAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcblx0ICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LnNxdWFyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdHZhciBzID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG5cdGQzLnNlbGVjdCh0aGlzKVxuXHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAtc1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAtcztcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHMqMjtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBzKjI7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcblx0ICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LnRyaWFuZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwicG9seWdvblwiKVxuXHQgICAgLmF0dHIoXCJwb2ludHNcIiwgKC1zKSArIFwiLDAgXCIgKyBzICsgXCIsXCIgKyAoLXMpICsgXCIgXCIgKyBzICsgXCIsXCIgKyBzKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcblx0ICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LmNvbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgLy8gY29uZGl0aW9ucyBhcmUgb2JqZWN0cyB3aXRoXG4gICAgLy8gbmFtZSA6IGEgbmFtZSBmb3IgdGhpcyBkaXNwbGF5XG4gICAgLy8gY2FsbGJhY2s6IHRoZSBjb25kaXRpb24gdG8gYXBwbHkgKHJlY2VpdmVzIGEgdG50Lm5vZGUpXG4gICAgLy8gZGlzcGxheTogYSBub2RlX2Rpc3BsYXlcbiAgICB2YXIgY29uZHMgPSBbXTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0Zm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgY29uZCA9IGNvbmRzW2ldO1xuXHQgICAgLy8gRm9yIGVhY2ggbm9kZSwgdGhlIGZpcnN0IGNvbmRpdGlvbiBtZXQgaXMgdXNlZFxuXHQgICAgaWYgKGNvbmQuY2FsbGJhY2suY2FsbCh0aGlzLCBub2RlKSA9PT0gdHJ1ZSkge1xuXHRcdGNvbmQuZGlzcGxheS5jYWxsKHRoaXMsIG5vZGUpXG5cdFx0YnJlYWs7XG5cdCAgICB9XG5cdH1cbiAgICB9KVxuXG4gICAgdmFyIGFwaSA9IGFwaWpzKG4pO1xuXG4gICAgYXBpLm1ldGhvZChcImFkZFwiLCBmdW5jdGlvbiAobmFtZSwgY2Jhaywgbm9kZV9kaXNwbGF5KSB7XG5cdGNvbmRzLnB1c2goeyBuYW1lIDogbmFtZSxcblx0XHQgICAgIGNhbGxiYWNrIDogY2Jhayxcblx0XHQgICAgIGRpc3BsYXkgOiBub2RlX2Rpc3BsYXlcblx0XHQgICB9KTtcblx0cmV0dXJuIG47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKFwicmVzZXRcIiwgZnVuY3Rpb24gKCkge1xuXHRjb25kcyA9IFtdO1xuXHRyZXR1cm4gbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoXCJ1cGRhdGVcIiwgZnVuY3Rpb24gKG5hbWUsIGNiYWssIG5ld19kaXNwbGF5KSB7XG5cdGZvciAodmFyIGk9MDsgaTxjb25kcy5sZW5ndGg7IGkrKykge1xuXHQgICAgaWYgKGNvbmRzW2ldLm5hbWUgPT09IG5hbWUpIHtcblx0XHRjb25kc1tpXS5jYWxsYmFjayA9IGNiYWs7XG5cdFx0Y29uZHNbaV0uZGlzcGxheSA9IG5ld19kaXNwbGF5O1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiBuO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUubm9kZV9kaXNwbGF5O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdG50X3RyZWVfbm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuXG52YXIgdHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBjb25mID0ge1xuXHRkdXJhdGlvbiAgICAgICAgIDogNTAwLCAgICAgIC8vIER1cmF0aW9uIG9mIHRoZSB0cmFuc2l0aW9uc1xuXHRub2RlX2Rpc3BsYXkgICAgIDogdHJlZS5ub2RlX2Rpc3BsYXkuY2lyY2xlKCksXG5cdGxhYmVsICAgICAgICAgICAgOiB0cmVlLmxhYmVsLnRleHQoKSxcblx0bGF5b3V0ICAgICAgICAgICA6IHRyZWUubGF5b3V0LnZlcnRpY2FsKCksXG5cdG9uX2NsaWNrICAgICAgICAgOiBmdW5jdGlvbiAoKSB7fSxcblx0b25fZGJsX2NsaWNrICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuXHRvbl9tb3VzZW92ZXIgICAgIDogZnVuY3Rpb24gKCkge30sXG5cdGxpbmtfY29sb3IgICAgICAgOiAnYmxhY2snLFxuXHRpZCAgICAgICAgICAgICAgIDogXCJfaWRcIlxuICAgIH07XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBmb2N1c2VkIG5vZGVcbiAgICAvLyBUT0RPOiBXb3VsZCBpdCBiZSBiZXR0ZXIgdG8gaGF2ZSBtdWx0aXBsZSBmb2N1c2VkIG5vZGVzPyAoaWUgdXNlIGFuIGFycmF5KVxuICAgIHZhciBmb2N1c2VkX25vZGU7XG5cbiAgICAvLyBFeHRyYSBkZWxheSBpbiB0aGUgdHJhbnNpdGlvbnMgKFRPRE86IE5lZWRlZD8pXG4gICAgdmFyIGRlbGF5ID0gMDtcblxuICAgIC8vIEVhc2Ugb2YgdGhlIHRyYW5zaXRpb25zXG4gICAgdmFyIGVhc2UgPSBcImN1YmljLWluLW91dFwiO1xuXG4gICAgLy8gQnkgbm9kZSBkYXRhXG4gICAgdmFyIHNwX2NvdW50cyA9IHt9O1xuIFxuICAgIHZhciBzY2FsZSA9IGZhbHNlO1xuXG4gICAgLy8gVGhlIGlkIG9mIHRoZSB0cmVlIGNvbnRhaW5lclxuICAgIHZhciBkaXZfaWQ7XG5cbiAgICAvLyBUaGUgdHJlZSB2aXN1YWxpemF0aW9uIChzdmcpXG4gICAgdmFyIHN2ZztcbiAgICB2YXIgdmlzO1xuXG4gICAgLy8gVE9ETzogRm9yIG5vdywgY291bnRzIGFyZSBnaXZlbiBvbmx5IGZvciBsZWF2ZXNcbiAgICAvLyBidXQgaXQgbWF5IGJlIGdvb2QgdG8gYWxsb3cgY291bnRzIGZvciBpbnRlcm5hbCBub2Rlc1xuICAgIHZhciBjb3VudHMgPSB7fTtcblxuICAgIC8vIFRoZSBmdWxsIHRyZWVcbiAgICB2YXIgYmFzZSA9IHtcblx0dHJlZSA6IHVuZGVmaW5lZCxcblx0ZGF0YSA6IHVuZGVmaW5lZCxcdFxuXHRub2RlcyA6IHVuZGVmaW5lZCxcblx0bGlua3MgOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgLy8gVGhlIGN1cnIgdHJlZS4gTmVlZGVkIHRvIHJlLWNvbXB1dGUgdGhlIGxpbmtzIC8gbm9kZXMgcG9zaXRpb25zIG9mIHN1YnRyZWVzXG4gICAgdmFyIGN1cnIgPSB7XG5cdHRyZWUgOiB1bmRlZmluZWQsXG5cdGRhdGEgOiB1bmRlZmluZWQsXG5cdG5vZGVzIDogdW5kZWZpbmVkLFxuXHRsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY2JhayByZXR1cm5lZFxuICAgIHZhciB0ID0gZnVuY3Rpb24gKGRpdikge1xuXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIik7XG5cbiAgICAgICAgdmFyIHRyZWVfZGl2ID0gZDMuc2VsZWN0KGRpdilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIChjb25mLmxheW91dC53aWR0aCgpICsgIFwicHhcIikpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dyb3VwRGl2XCIpO1xuXG5cdHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3RlcjtcblxuXHR2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG5cblx0dmFyIG1heF9sZWFmX2xhYmVsX2xlbmd0aCA9IGZ1bmN0aW9uICh0cmVlKSB7XG5cdCAgICB2YXIgbWF4ID0gMDtcblx0ICAgIHZhciBsZWF2ZXMgPSB0cmVlLmdldF9hbGxfbGVhdmVzKCk7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGxhYmVsX3dpZHRoID0gY29uZi5sYWJlbC53aWR0aCgpKGxlYXZlc1tpXSkgKyBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkobGVhdmVzW2ldKTtcblx0XHRpZiAobGFiZWxfd2lkdGggPiBtYXgpIHtcblx0XHQgICAgbWF4ID0gbGFiZWxfd2lkdGg7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG1heDtcblx0fTtcblxuXHR2YXIgbWF4X2xlYWZfbm9kZV9oZWlnaHQgPSBmdW5jdGlvbiAodHJlZSkge1xuXHQgICAgdmFyIG1heCA9IDA7XG5cdCAgICB2YXIgbGVhdmVzID0gdHJlZS5nZXRfYWxsX2xlYXZlcygpO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBub2RlX3NpemUgPSBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkobGVhdmVzW2ldKTtcblx0XHRpZiAobm9kZV9zaXplID4gbWF4KSB7XG5cdFx0ICAgIG1heCA9IG5vZGVfc2l6ZTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbWF4ICogMjtcblx0fTtcblxuXHR2YXIgbWF4X2xhYmVsX2xlbmd0aCA9IG1heF9sZWFmX2xhYmVsX2xlbmd0aChjdXJyLnRyZWUpO1xuXHRjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuXHR2YXIgbWF4X25vZGVfaGVpZ2h0ID0gbWF4X2xlYWZfbm9kZV9oZWlnaHQoY3Vyci50cmVlKTtcblxuXHQvLyBDbHVzdGVyIHNpemUgaXMgdGhlIHJlc3VsdCBvZi4uLlxuXHQvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG5cdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIGhvcml6b250YWwgdHJhbnNmb3JtIG9mIHRoZSBub2Rlc1xuXHR2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcblx0ICAgIG5fbGVhdmVzIDogbl9sZWF2ZXMsXG5cdCAgICBsYWJlbF9oZWlnaHQgOiBkMy5tYXgoW2QzLmZ1bmN0b3IoY29uZi5sYWJlbC5oZWlnaHQoKSkoKSwgbWF4X25vZGVfaGVpZ2h0XSksXG5cdCAgICBsYWJlbF9wYWRkaW5nIDogMTVcblx0fTtcblxuXHRjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG5cdHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG5cdHZhciB0cmFuc2Zvcm0gPSBjb25mLmxheW91dC50cmFuc2Zvcm1fbm9kZTtcblxuXHRzdmcgPSB0cmVlX2RpdlxuXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmxheW91dC53aWR0aCgpKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgY29uZi5sYXlvdXQuaGVpZ2h0KGNsdXN0ZXJfc2l6ZV9wYXJhbXMpICsgMzApXG5cdCAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cdHZpcyA9IHN2Z1xuXHQgICAgLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfc3RfXCIgKyBkaXZfaWQpXG5cdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLFxuXHRcdCAgXCJ0cmFuc2xhdGUoXCIgK1xuXHRcdCAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdICtcblx0XHQgIFwiLFwiICtcblx0XHQgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVsxXSArXG5cdFx0ICBcIilcIik7XG5cblx0Y3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcblx0Y29uZi5sYXlvdXQuc2NhbGVfYnJhbmNoX2xlbmd0aHMoY3Vycik7XG5cdGN1cnIubGlua3MgPSBjbHVzdGVyLmxpbmtzKGN1cnIubm9kZXMpO1xuXG5cdC8vIExJTktTXG5cdHZhciBsaW5rID0gdmlzLnNlbGVjdEFsbChcInBhdGgudG50X3RyZWVfbGlua1wiKVxuXHQgICAgLmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7cmV0dXJuIGQudGFyZ2V0W2NvbmYuaWRdfSk7XG5cdFxuXHRsaW5rXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInBhdGhcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0ICAgIFx0cmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgZC50YXJnZXQuX2lkO1xuXHQgICAgfSlcblx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKGNvbmYubGlua19jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1x0ICAgIFxuXG5cdC8vIE5PREVTXG5cdHZhciBub2RlID0gdmlzLnNlbGVjdEFsbChcImcudG50X3RyZWVfbm9kZVwiKVxuXHQgICAgLmRhdGEoY3Vyci5ub2RlcywgZnVuY3Rpb24oZCkge3JldHVybiBkW2NvbmYuaWRdfSk7XG5cblx0dmFyIG5ld19ub2RlID0gbm9kZVxuXHQgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihuKSB7XG5cdFx0aWYgKG4uY2hpbGRyZW4pIHtcblx0XHQgICAgaWYgKG4uZGVwdGggPT0gMCkge1xuXHRcdFx0cmV0dXJuIFwicm9vdCB0bnRfdHJlZV9ub2RlXCJcblx0XHQgICAgfSBlbHNlIHtcblx0XHRcdHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIlxuXHRcdCAgICB9XG5cdFx0fSBlbHNlIHtcblx0XHQgICAgcmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCJcblx0XHR9XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkKSB7XG5cdFx0cmV0dXJuIFwidG50X3RyZWVfbm9kZV9cIiArIGRpdl9pZCArIFwiX1wiICsgZC5faWRcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG5cdC8vIGRpc3BsYXkgbm9kZSBzaGFwZVxuXHRuZXdfbm9kZVxuXHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG5cdFx0Y29uZi5ub2RlX2Rpc3BsYXkuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpKVxuXHQgICAgfSk7XG5cblx0Ly8gZGlzcGxheSBub2RlIGxhYmVsXG5cdG5ld19ub2RlXG5cdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0ICAgIFx0Y29uZi5sYWJlbC5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCksIGNvbmYubGF5b3V0LnR5cGUsIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKSh0bnRfdHJlZV9ub2RlKGQpKSk7XG5cdCAgICB9KTtcblxuXHRuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cblx0ICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cdH0pO1xuXG5cdG5ld19ub2RlLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgY29uZi5vbl9tb3VzZW92ZXIuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblxuXHQgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0fSk7XG5cblx0bmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgY29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblxuXHQgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0fSk7XG5cblxuXHQvLyBVcGRhdGUgcGxvdHMgYW4gdXBkYXRlZCB0cmVlXG5cdGFwaS5tZXRob2QgKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcblx0ICAgIHRyZWVfZGl2XG5cdFx0LnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyBcInB4XCIpKTtcblx0ICAgIHN2Zy5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSk7XG5cblx0ICAgIHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3Rlcjtcblx0ICAgIHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG5cdCAgICB2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cblx0ICAgIHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG5cdCAgICBjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuXHQgICAgdmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cblx0ICAgIC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG5cdCAgICAvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG5cdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXMgKHByb2JhYmx5IGJ5IHNlbGVjdGluZyBvbmUgbm9kZSBhc3N1bWluZyBhbGwgdGhlIG5vZGVzIGhhdmUgdGhlIHNhbWUgdHJhbnNmb3JtXG5cdCAgICB2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG5cdCAgICB2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcblx0XHRuX2xlYXZlcyA6IG5fbGVhdmVzLFxuXHRcdGxhYmVsX2hlaWdodCA6IGQzLm1heChbZDMuZnVuY3Rvcihjb25mLmxhYmVsLmhlaWdodCgpKSgpXSksXG5cdFx0bGFiZWxfcGFkZGluZyA6IDE1XG5cdCAgICB9O1xuXHQgICAgY29uZi5sYXlvdXQuYWRqdXN0X2NsdXN0ZXJfc2l6ZShjbHVzdGVyX3NpemVfcGFyYW1zKTtcblxuXHQgICAgc3ZnXG5cdFx0LnRyYW5zaXRpb24oKVxuXHRcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHRcdC5lYXNlKGVhc2UpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgY29uZi5sYXlvdXQuaGVpZ2h0KGNsdXN0ZXJfc2l6ZV9wYXJhbXMpICsgMzApOyAvLyBoZWlnaHQgaXMgaW4gdGhlIGxheW91dFxuXG5cdCAgICB2aXNcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIixcblx0XHQgICAgICBcInRyYW5zbGF0ZShcIiArXG5cdFx0ICAgICAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdICtcblx0XHQgICAgICBcIixcIiArXG5cdFx0ICAgICAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzFdICtcblx0XHQgICAgICBcIilcIik7XG5cdCAgICBcblx0ICAgIGN1cnIubm9kZXMgPSBjbHVzdGVyLm5vZGVzKGN1cnIuZGF0YSk7XG5cdCAgICBjb25mLmxheW91dC5zY2FsZV9icmFuY2hfbGVuZ3RocyhjdXJyKTtcblx0ICAgIGN1cnIubGlua3MgPSBjbHVzdGVyLmxpbmtzKGN1cnIubm9kZXMpO1xuXG5cdCAgICAvLyBMSU5LU1xuXHQgICAgdmFyIGxpbmsgPSB2aXMuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG5cdFx0LmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7cmV0dXJuIGQudGFyZ2V0W2NvbmYuaWRdfSk7XG5cbiAgICAgICAgICAgIC8vIE5PREVTXG5cdCAgICB2YXIgbm9kZSA9IHZpcy5zZWxlY3RBbGwoXCJnLnRudF90cmVlX25vZGVcIilcblx0XHQuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7cmV0dXJuIGRbY29uZi5pZF19KTtcblxuXHQgICAgdmFyIGV4aXRfbGluayA9IGxpbmtcblx0XHQuZXhpdCgpXG5cdFx0LnJlbW92ZSgpO1xuXG5cdCAgICBsaW5rXG5cdFx0LmVudGVyKClcblx0XHQuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9saW5rX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLnRhcmdldC5faWQ7XG5cdFx0fSlcblx0XHQuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmxpbmtfY29sb3IpKHRudF90cmVlX25vZGUoZC5zb3VyY2UpLCB0bnRfdHJlZV9ub2RlKGQudGFyZ2V0KSk7XG5cdFx0fSlcblx0XHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cdCAgICBsaW5rXG5cdCAgICBcdC50cmFuc2l0aW9uKClcblx0XHQuZWFzZShlYXNlKVxuXHQgICAgXHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0ICAgIFx0LmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcblxuXG5cdCAgICAvLyBOb2Rlc1xuXHQgICAgdmFyIG5ld19ub2RlID0gbm9kZVxuXHRcdC5lbnRlcigpXG5cdFx0LmFwcGVuZChcImdcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcblx0XHQgICAgaWYgKG4uY2hpbGRyZW4pIHtcblx0XHRcdGlmIChuLmRlcHRoID09IDApIHtcblx0XHRcdCAgICByZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIlxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdCAgICByZXR1cm4gXCJpbm5lciB0bnRfdHJlZV9ub2RlXCJcblx0XHRcdH1cblx0XHQgICAgfSBlbHNlIHtcblx0XHRcdHJldHVybiBcImxlYWYgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH1cblx0XHR9KVxuXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3RyZWVfbm9kZV9cIiArIGRpdl9pZCArIFwiX1wiICsgZC5faWQ7XG5cdFx0fSlcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuICAgXG5cdCAgICAvLyBFeGl0aW5nIG5vZGVzIGFyZSBqdXN0IHJlbW92ZWRcblx0ICAgIG5vZGVcblx0XHQuZXhpdCgpXG5cdFx0LnJlbW92ZSgpO1xuXG5cdCAgICBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Y29uZi5vbl9jbGljay5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdFx0dHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIH0pO1xuXG5cdCAgICBuZXdfbm9kZS5vbihcIm1vdXNlZW50ZXJcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRjb25mLm9uX21vdXNlb3Zlci5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdFx0dHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIH0pO1xuXG5cdCAgICBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Y29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblxuXHRcdHRyZWUudHJpZ2dlcihcIm5vZGU6ZGJsY2xpY2tcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cdCAgICB9KTtcblxuXG5cdCAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhbGwgdGhlIG5vZGVzIGFnYWluIGluIGNhc2UgdGhleSBoYXZlIGNoYW5nZWQgbGl2ZWx5IChvciB0aGUgbGF5b3V0KVxuXHQgICAgbm9kZS5zZWxlY3RBbGwoXCIqXCIpLnJlbW92ZSgpO1xuXHQgICAgbm9kZVxuXHRcdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdFx0Y29uZi5ub2RlX2Rpc3BsYXkuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpKVxuXHRcdCAgICB9KTtcblxuXHQgICAgLy8gV2UgbmVlZCB0byByZS1jcmVhdGUgYWxsIHRoZSBsYWJlbHMgYWdhaW4gaW4gY2FzZSB0aGV5IGhhdmUgY2hhbmdlZCBsaXZlbHkgKG9yIHRoZSBsYXlvdXQpXG5cdCAgICBub2RlXG5cdFx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHRcdFx0Y29uZi5sYWJlbC5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCksIGNvbmYubGF5b3V0LnR5cGUsIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKSh0bnRfdHJlZV9ub2RlKGQpKSk7XG5cdFx0ICAgIH0pO1xuXG5cdCAgICBub2RlXG5cdFx0LnRyYW5zaXRpb24oKVxuXHRcdC5lYXNlKGVhc2UpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtKTtcblxuXHR9KTtcbiAgICB9O1xuXG4gICAgLy8gQVBJXG4gICAgdmFyIGFwaSA9IGFwaWpzICh0KVxuXHQuZ2V0c2V0IChjb25mKVxuXG4gICAgLy8gVE9ETzogUmV3cml0ZSBkYXRhIHVzaW5nIGdldHNldCAvIGZpbmFsaXplcnMgJiB0cmFuc2Zvcm1zXG4gICAgYXBpLm1ldGhvZCAoJ2RhdGEnLCBmdW5jdGlvbiAoZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBiYXNlLmRhdGE7XG5cdH1cblxuXHQvLyBUaGUgb3JpZ2luYWwgZGF0YSBpcyBzdG9yZWQgYXMgdGhlIGJhc2UgYW5kIGN1cnIgZGF0YVxuXHRiYXNlLmRhdGEgPSBkO1xuXHRjdXJyLmRhdGEgPSBkO1xuXG5cdC8vIFNldCB1cCBhIG5ldyB0cmVlIGJhc2VkIG9uIHRoZSBkYXRhXG5cdHZhciBuZXd0cmVlID0gdG50X3RyZWVfbm9kZShiYXNlLmRhdGEpO1xuXG5cdHQucm9vdChuZXd0cmVlKTtcblxuXHR0cmVlLnRyaWdnZXIoXCJkYXRhOmhhc0NoYW5nZWRcIiwgYmFzZS5kYXRhKTtcblxuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIC8vIFRPRE86IFJld3JpdGUgdHJlZSB1c2luZyBnZXRzZXQgLyBmaW5hbGl6ZXJzICYgdHJhbnNmb3Jtc1xuICAgIGFwaS5tZXRob2QgKCdyb290JywgZnVuY3Rpb24gKG15VHJlZSkge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIGN1cnIudHJlZTtcbiAgICBcdH1cblxuXHQvLyBUaGUgb3JpZ2luYWwgdHJlZSBpcyBzdG9yZWQgYXMgdGhlIGJhc2UsIHByZXYgYW5kIGN1cnIgdHJlZVxuICAgIFx0YmFzZS50cmVlID0gbXlUcmVlO1xuXHRjdXJyLnRyZWUgPSBiYXNlLnRyZWU7XG4vL1x0cHJldi50cmVlID0gYmFzZS50cmVlO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnc3VidHJlZScsIGZ1bmN0aW9uIChjdXJyX25vZGVzKSB7XG5cdHZhciBzdWJ0cmVlID0gYmFzZS50cmVlLnN1YnRyZWUoY3Vycl9ub2Rlcyk7XG5cdGN1cnIuZGF0YSA9IHN1YnRyZWUuZGF0YSgpO1xuXHRjdXJyLnRyZWUgPSBzdWJ0cmVlO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZvY3VzX25vZGUnLCBmdW5jdGlvbiAobm9kZSkge1xuXHQvLyBmaW5kIFxuXHR2YXIgZm91bmRfbm9kZSA9IHQucm9vdCgpLmZpbmRfbm9kZShmdW5jdGlvbiAobikge1xuXHQgICAgcmV0dXJuIG5vZGUuaWQoKSA9PT0gbi5pZCgpO1xuXHR9KTtcblx0Zm9jdXNlZF9ub2RlID0gZm91bmRfbm9kZTtcblx0dC5zdWJ0cmVlKGZvdW5kX25vZGUuZ2V0X2FsbF9sZWF2ZXMoKSk7XG5cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaGFzX2ZvY3VzJywgZnVuY3Rpb24gKG5vZGUpIHtcblx0cmV0dXJuICgoZm9jdXNlZF9ub2RlICE9PSB1bmRlZmluZWQpICYmIChmb2N1c2VkX25vZGUuaWQoKSA9PT0gbm9kZS5pZCgpKSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncmVsZWFzZV9mb2N1cycsIGZ1bmN0aW9uICgpIHtcblx0dC5kYXRhIChiYXNlLmRhdGEpO1xuXHRmb2N1c2VkX25vZGUgPSB1bmRlZmluZWQ7XG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIvLyByZXF1aXJlKCdmcycpLnJlYWRkaXJTeW5jKF9fZGlybmFtZSArICcvJykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4vLyAgICAgaWYgKGZpbGUubWF0Y2goLy4rXFwuanMvZykgIT09IG51bGwgJiYgZmlsZSAhPT0gX19maWxlbmFtZSkge1xuLy8gXHR2YXIgbmFtZSA9IGZpbGUucmVwbGFjZSgnLmpzJywgJycpO1xuLy8gXHRtb2R1bGUuZXhwb3J0c1tuYW1lXSA9IHJlcXVpcmUoJy4vJyArIGZpbGUpO1xuLy8gICAgIH1cbi8vIH0pO1xuXG4vLyBTYW1lIGFzXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnV0aWxzLnJlZHVjZSA9IHJlcXVpcmUoXCIuL3JlZHVjZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHV0aWxzO1xuIiwidmFyIHJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc21vb3RoID0gNTtcbiAgICB2YXIgdmFsdWUgPSAndmFsJztcbiAgICB2YXIgcmVkdW5kYW50ID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPCBiKSB7XG5cdCAgICByZXR1cm4gKChiLWEpIDw9IChiICogMC4yKSk7XG5cdH1cblx0cmV0dXJuICgoYS1iKSA8PSAoYSAqIDAuMikpO1xuICAgIH07XG4gICAgdmFyIHBlcmZvcm1fcmVkdWNlID0gZnVuY3Rpb24gKGFycikge3JldHVybiBhcnI7fTtcblxuICAgIHZhciByZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmICghYXJyLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoZWQgPSBwZXJmb3JtX3Ntb290aChhcnIpO1xuXHR2YXIgcmVkdWNlZCAgPSBwZXJmb3JtX3JlZHVjZShzbW9vdGhlZCk7XG5cdHJldHVybiByZWR1Y2VkO1xuICAgIH07XG5cbiAgICB2YXIgbWVkaWFuID0gZnVuY3Rpb24gKHYsIGFycikge1xuXHRhcnIuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHQgICAgcmV0dXJuIGFbdmFsdWVdIC0gYlt2YWx1ZV07XG5cdH0pO1xuXHRpZiAoYXJyLmxlbmd0aCAlIDIpIHtcblx0ICAgIHZbdmFsdWVdID0gYXJyW35+KGFyci5sZW5ndGggLyAyKV1bdmFsdWVdO1x0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIG4gPSB+fihhcnIubGVuZ3RoIC8gMikgLSAxO1xuXHQgICAgdlt2YWx1ZV0gPSAoYXJyW25dW3ZhbHVlXSArIGFycltuKzFdW3ZhbHVlXSkgLyAyO1xuXHR9XG5cblx0cmV0dXJuIHY7XG4gICAgfTtcblxuICAgIHZhciBjbG9uZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0dmFyIHRhcmdldCA9IHt9O1xuXHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuXHQgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICB2YXIgcGVyZm9ybV9zbW9vdGggPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmIChzbW9vdGggPT09IDApIHsgLy8gbm8gc21vb3RoXG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhfYXJyID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBsb3cgPSAoaSA8IHNtb290aCkgPyAwIDogKGkgLSBzbW9vdGgpO1xuXHQgICAgdmFyIGhpZ2ggPSAoaSA+IChhcnIubGVuZ3RoIC0gc21vb3RoKSkgPyBhcnIubGVuZ3RoIDogKGkgKyBzbW9vdGgpO1xuXHQgICAgc21vb3RoX2FycltpXSA9IG1lZGlhbihjbG9uZShhcnJbaV0pLCBhcnIuc2xpY2UobG93LGhpZ2grMSkpO1xuXHR9XG5cdHJldHVybiBzbW9vdGhfYXJyO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdWNlciA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1fcmVkdWNlO1xuXHR9XG5cdHBlcmZvcm1fcmVkdWNlID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVuZGFudCA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHJlZHVuZGFudDtcblx0fVxuXHRyZWR1bmRhbnQgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdHZhbHVlID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2Uuc21vb3RoID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBzbW9vdGg7XG5cdH1cblx0c21vb3RoID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkdWNlO1xufTtcblxudmFyIGJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKVxuXHQudmFsdWUoJ3N0YXJ0Jyk7XG5cbiAgICB2YXIgdmFsdWUyID0gJ2VuZCc7XG5cbiAgICB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnb2JqZWN0JyA6IHtcbiAgICAgICAgICAgICAgICAnc3RhcnQnIDogb2JqMS5vYmplY3RbcmVkLnZhbHVlKCldLFxuICAgICAgICAgICAgICAgICdlbmQnICAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmFsdWUnICA6IG9iajJbdmFsdWUyXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7IHJldHVybiBvYmoxIH07XG5cbiAgICByZWQucmVkdWNlciggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0ge1xuXHQgICAgJ29iamVjdCcgOiBhcnJbMF0sXG5cdCAgICAndmFsdWUnICA6IGFyclswXVt2YWx1ZTJdXG5cdH07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnIudmFsdWUpKSB7XG5cdFx0Y3VyciA9IGpvaW4oY3VyciwgYXJyW2ldKTtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIub2JqZWN0KTtcblx0ICAgIGN1cnIub2JqZWN0ID0gYXJyW2ldO1xuXHQgICAgY3Vyci52YWx1ZSA9IGFycltpXS5lbmQ7XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyLm9iamVjdCk7XG5cblx0Ly8gcmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJlZHVjZS5qb2luID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gam9pbjtcblx0fVxuXHRqb2luID0gY2Jhaztcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlMiA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTI7XG5cdH1cblx0dmFsdWUyID0gZmllbGQ7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJldHVybiByZWQ7XG59O1xuXG52YXIgbGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKCk7XG5cbiAgICByZWQucmVkdWNlciAoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IGFyclswXTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGgtMTsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyW3ZhbHVlXSkpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIpO1xuXHQgICAgY3VyciA9IGFycltpXTtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIpO1xuXHRyZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlZDtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2U7XG5tb2R1bGUuZXhwb3J0cy5saW5lID0gbGluZTtcbm1vZHVsZS5leHBvcnRzLmJsb2NrID0gYmxvY2s7XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXRlcmF0b3IgOiBmdW5jdGlvbihpbml0X3ZhbCkge1xuXHR2YXIgaSA9IGluaXRfdmFsIHx8IDA7XG5cdHZhciBpdGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIGkrKztcblx0fTtcblx0cmV0dXJuIGl0ZXI7XG4gICAgfSxcblxuICAgIHNjcmlwdF9wYXRoIDogZnVuY3Rpb24gKHNjcmlwdF9uYW1lKSB7IC8vIHNjcmlwdF9uYW1lIGlzIHRoZSBmaWxlbmFtZVxuXHR2YXIgc2NyaXB0X3NjYXBlZCA9IHNjcmlwdF9uYW1lLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuXHR2YXIgc2NyaXB0X3JlID0gbmV3IFJlZ0V4cChzY3JpcHRfc2NhcGVkICsgJyQnKTtcblx0dmFyIHNjcmlwdF9yZV9zdWIgPSBuZXcgUmVnRXhwKCcoLiopJyArIHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXG5cdC8vIFRPRE86IFRoaXMgcmVxdWlyZXMgcGhhbnRvbS5qcyBvciBhIHNpbWlsYXIgaGVhZGxlc3Mgd2Via2l0IHRvIHdvcmsgKGRvY3VtZW50KVxuXHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0dmFyIHBhdGggPSBcIlwiOyAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHBhdGhcblx0aWYoc2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gc2NyaXB0cykge1xuXHRcdGlmKHNjcmlwdHNbaV0uc3JjICYmIHNjcmlwdHNbaV0uc3JjLm1hdGNoKHNjcmlwdF9yZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdHNbaV0uc3JjLnJlcGxhY2Uoc2NyaXB0X3JlX3N1YiwgJyQxJyk7XG5cdFx0fVxuICAgICAgICAgICAgfVxuXHR9XG5cdHJldHVybiBwYXRoO1xuICAgIH0sXG5cbiAgICBkZWZlcl9jYW5jZWwgOiBmdW5jdGlvbiAoY2JhaywgdGltZSkge1xuXHR2YXIgdGljaztcblxuXHR2YXIgZGVmZXJfY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgY2xlYXJUaW1lb3V0KHRpY2spO1xuXHQgICAgdGljayA9IHNldFRpbWVvdXQoY2JhaywgdGltZSk7XG5cdH07XG5cblx0cmV0dXJuIGRlZmVyX2NhbmNlbDtcbiAgICB9XG59O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xuXG52YXIgdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbm9fdHJhY2sgPSB0cnVlO1xuICAgIHZhciBkaXZfaWQ7XG5cbiAgICAvLyBEZWZhdWx0c1xuICAgIHZhciB0cmVlX2NvbmYgPSB7XG5cdHRyZWUgOiB1bmRlZmluZWQsXG5cdHRyYWNrIDogZnVuY3Rpb24gKCkge1xuXHQgICAgdmFyIHQgPSB0bnQudHJhY2soKVxuXHRcdC5iYWNrZ3JvdW5kX2NvbG9yKFwiI0VCRjVGRlwiKVxuXHRcdC5kYXRhKHRudC50cmFjay5kYXRhKClcblx0XHQgICAgICAudXBkYXRlKHRudC50cmFjay5yZXRyaWV2ZXIuc3luYygpXG5cdFx0XHQgICAgICAucmV0cmlldmVyIChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdCAgcmV0dXJuICBbXVxuXHRcdFx0ICAgICAgfSlcblx0XHRcdCAgICAgKSlcblx0XHQuZGlzcGxheSh0bnQudHJhY2suZmVhdHVyZS5ibG9jaygpXG5cdFx0XHQgLmZvcmVncm91bmRfY29sb3IoXCJzdGVlbGJsdWVcIilcblx0XHRcdCAuaW5kZXgoZnVuY3Rpb24gKGQpIHtcblx0XHRcdCAgICAgcmV0dXJuIGQuc3RhcnQ7XG5cdFx0XHQgfSlcblx0XHRcdCk7XG5cblx0ICAgIHJldHVybiB0O1xuXHR9LFxuXHRhbm5vdGF0aW9uIDogdW5kZWZpbmVkLFxuXHRydWxlciA6IFwibm9uZVwiLFxuXHRrZXkgICA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICB2YXIgdHJlZV9hbm5vdCA9IGZ1bmN0aW9uIChkaXYpIHtcblx0ZGl2X2lkID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hdHRyKFwiaWRcIik7XG5cblx0dmFyIGdyb3VwX2RpdiA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dyb3VwRGl2XCIpO1xuXG5cdHZhciB0cmVlX2RpdiA9IGdyb3VwX2RpdlxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF90cmVlX2NvbnRhaW5lcl9cIiArIGRpdl9pZClcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9jb250YWluZXJcIik7XG5cblx0dmFyIGFubm90X2RpdiA9IGdyb3VwX2RpdlxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9hbm5vdF9jb250YWluZXJfXCIgKyBkaXZfaWQpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2Fubm90X2NvbnRhaW5lclwiKTtcblxuXHR0cmVlX2NvbmYudHJlZSAodHJlZV9kaXYubm9kZSgpKTtcblxuXHQvLyB0cmFja3Ncblx0dmFyIGxlYXZlcyA9IHRyZWVfY29uZi50cmVlLnJvb3QoKS5nZXRfYWxsX2xlYXZlcygpO1xuXHR2YXIgdHJhY2tzID0gW107XG5cblx0dmFyIGhlaWdodCA9IHRyZWVfY29uZi50cmVlLmxhYmVsKCkuaGVpZ2h0KCk7XG5cblx0Zm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgLy8gQmxvY2sgVHJhY2sxXG5cdCAgICAoZnVuY3Rpb24gIChsZWFmKSB7XG5cdFx0dG50LnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuXHRcdCAgICBpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gIGxlYWYuaWQoKTtcblx0XHQgICAgfVxuXHRcdCAgICBpZiAodHlwZW9mICh0cmVlX2NvbmYua2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRyZWVfY29uZi5rZXkgKGxlYWYpO1xuXHRcdCAgICB9XG5cdFx0ICAgIHJldHVybiBsZWFmLnByb3BlcnR5KHRyZWVfY29uZi5rZXkpO1xuXHRcdH07XG5cdFx0dmFyIHRyYWNrID0gdHJlZV9jb25mLnRyYWNrKGxlYXZlc1tpXSlcblx0XHQgICAgLmhlaWdodChoZWlnaHQpO1xuXG5cdFx0dHJhY2tzLnB1c2ggKHRyYWNrKTtcblxuXHQgICAgfSkobGVhdmVzW2ldKTtcblxuXHR9XG5cblx0Ly8gQW4gYXhpcyB0cmFja1xuXHR0bnQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gXCJheGlzLXRvcFwiO1xuXHR9O1xuXHR2YXIgYXhpc190b3AgPSB0bnQudHJhY2soKVxuXHQgICAgLmhlaWdodCgwKVxuXHQgICAgLmJhY2tncm91bmRfY29sb3IoXCJ3aGl0ZVwiKVxuXHQgICAgLmRpc3BsYXkodG50LnRyYWNrLmZlYXR1cmUuYXhpcygpXG5cdFx0ICAgICAub3JpZW50YXRpb24oXCJ0b3BcIilcblx0XHQgICAgKTtcblxuXHR0bnQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gXCJheGlzLWJvdHRvbVwiO1xuXHR9O1xuXHR2YXIgYXhpcyA9IHRudC50cmFjaygpXG5cdCAgICAuaGVpZ2h0KDE4KVxuXHQgICAgLmJhY2tncm91bmRfY29sb3IoXCJ3aGl0ZVwiKVxuXHQgICAgLmRpc3BsYXkodG50LnRyYWNrLmZlYXR1cmUuYXhpcygpXG5cdFx0ICAgICAub3JpZW50YXRpb24oXCJib3R0b21cIilcblx0XHQgICAgKTtcblxuXHRpZiAodHJlZV9jb25mLmFubm90YXRpb24pIHtcblx0ICAgIGlmICh0cmVlX2NvbmYucnVsZXIgPT09ICdib3RoJyB8fCB0cmVlX2NvbmYucnVsZXIgPT09ICd0b3AnKSB7XG5cdFx0dHJlZV9jb25mLmFubm90YXRpb25cblx0XHQgICAgLmFkZF90cmFjayhheGlzX3RvcCk7XG5cdCAgICB9XG5cblx0ICAgIHRyZWVfY29uZi5hbm5vdGF0aW9uXG5cdFx0LmFkZF90cmFjayh0cmFja3MpO1xuXG5cdCAgICBpZiAodHJlZV9jb25mLnJ1bGVyID09PSAnYm90aCcgfHwgdHJlZV9jb25mLnJ1bGVyID09PSBcImJvdHRvbVwiKSB7XG5cdFx0dHJlZV9jb25mLmFubm90YXRpb25cblx0XHQgICAgLmFkZF90cmFjayhheGlzKTtcblx0ICAgIH1cblxuXHQgICAgdHJlZV9jb25mLmFubm90YXRpb24oYW5ub3RfZGl2Lm5vZGUoKSk7XG5cdCAgICB0cmVlX2NvbmYuYW5ub3RhdGlvbi5zdGFydCgpO1xuXHR9XG5cblx0YXBpLm1ldGhvZCgndXBkYXRlJywgZnVuY3Rpb24gKCkge1xuXHQgICAgdHJlZV9jb25mLnRyZWUudXBkYXRlKCk7XG5cblx0ICAgIGlmICh0cmVlX2NvbmYuYW5ub3RhdGlvbikge1xuXHRcdHZhciBsZWF2ZXMgPSB0cmVlX2NvbmYudHJlZS5yb290KCkuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0XHR2YXIgbmV3X3RyYWNrcyA9IFtdO1xuXG5cdFx0aWYgKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ3RvcCcpIHtcblx0XHQgICAgbmV3X3RyYWNrcy5wdXNoKGF4aXNfdG9wKTtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0ICAgIC8vIFdlIGZpcnN0IHNlZSBpZiB3ZSBoYXZlIGEgdHJhY2sgZm9yIHRoZSBsZWFmOlxuXHRcdCAgICB2YXIgaWQ7XG5cdFx0ICAgIGlmICh0cmVlX2NvbmYua2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGlkID0gbGVhdmVzW2ldLmlkKCk7XG5cdFx0ICAgIH0gZWxzZSBpZiAodHlwZW9mICh0cmVlX2NvbmYua2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWQgPSB0cmVlX2NvbmYua2V5IChsZWF2ZXNbaV0pO1xuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0aWQgPSBsZWF2ZXNbaV0ucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG5cdFx0ICAgIH1cblx0XHQgICAgdmFyIGN1cnJfdHJhY2sgPSB0cmVlX2NvbmYuYW5ub3RhdGlvbi5maW5kX3RyYWNrX2J5X2lkKGlkKTtcblx0XHQgICAgLy92YXIgY3Vycl90cmFjayA9IHRyZWVfY29uZi5hbm5vdGF0aW9uLmZpbmRfdHJhY2tfYnlfaWQodHJlZV9jb25mLmtleT09PXVuZGVmaW5lZCA/IGxlYXZlc1tpXS5pZCgpIDogZDMuZnVuY3Rvcih0cmVlX2NvbmYua2V5KSAobGVhdmVzW2ldKSkvL2xlYXZlc1tpXS5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KSk7XG5cdFx0ICAgIGlmIChjdXJyX3RyYWNrID09PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIE5ldyBsZWFmIC0tIG5vIHRyYWNrIGZvciBpdFxuXHRcdFx0KGZ1bmN0aW9uIChsZWFmKSB7XG5cdFx0XHQgICAgdG50LnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdCAgICByZXR1cm4gbGVhZi5pZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkpID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdCAgICByZXR1cm4gdHJlZV9jb25mLmtleSAobGVhZik7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGxlYWYucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG5cdFx0XHQgICAgfTtcblx0XHRcdCAgICBjdXJyX3RyYWNrID0gdHJlZV9jb25mLnRyYWNrKGxlYXZlc1tpXSlcblx0XHRcdFx0LmhlaWdodChoZWlnaHQpO1xuXHRcdFx0fSkobGVhdmVzW2ldKTtcblx0XHQgICAgfVxuXHRcdCAgICBuZXdfdHJhY2tzLnB1c2goY3Vycl90cmFjayk7XG5cdFx0fVxuXHRcdGlmICh0cmVlX2NvbmYucnVsZXIgPT09ICdib3RoJyB8fCB0cmVlX2NvbmYucnVsZXIgPT09ICdib3R0b20nKSB7XG5cdFx0ICAgIG5ld190cmFja3MucHVzaChheGlzKTtcblx0XHR9XG5cblx0XHR0cmVlX2NvbmYuYW5ub3RhdGlvbi5yZW9yZGVyKG5ld190cmFja3MpO1xuXHQgICAgfVxuXHR9KTtcblxuXHRyZXR1cm4gdHJlZV9hbm5vdDtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IHRudC51dGlscy5hcGkgKHRyZWVfYW5ub3QpXG5cdC5nZXRzZXQgKHRyZWVfY29uZik7XG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIHdpdGggdGhlIGFwaSBpbnRlcmZhY2VcbiAgICB0cmVlX2Fubm90LnRyYWNrID0gZnVuY3Rpb24gKG5ld190cmFjaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB0cmVlX2NvbmYudHJhY2s7XG5cdH1cblxuXHQvLyBGaXJzdCB0aW1lIGl0IGlzIHNldFxuXHRpZiAobm9fdHJhY2spIHtcblx0ICAgIHRyZWVfY29uZi50cmFjayA9IG5ld190cmFjaztcblx0ICAgIG5vX3RyYWNrID0gZmFsc2U7XG5cdCAgICByZXR1cm4gdHJlZV9hbm5vdDtcblx0fVxuXG5cdC8vIElmIGl0IGlzIHJlc2V0IC0tIGFwcGx5IHRoZSBjaGFuZ2VzXG5cdHZhciB0cmFja3MgPSB0cmVlX2NvbmYuYW5ub3RhdGlvbi50cmFja3MoKTtcblx0Ly8gdmFyIHN0YXJ0X2luZGV4ID0gKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ3RvcCcpID8gMSA6IDA7XG5cdC8vIHZhciBlbmRfaW5kZXggPSAodHJlZV9jb25mLnJ1bGVyID09PSAnYm90aCcgfHwgdHJlZV9jb25mLnJ1bGVyID09PSAnYm90dG9tJykgPyAxIDogMDtcblxuXHR2YXIgc3RhcnRfaW5kZXggPSAwO1xuXHR2YXIgbl9pbmRleCA9IDA7XG5cblx0aWYgKHRyZWVfY29uZi5ydWxlciA9PT0gXCJib3RoXCIpIHtcblx0ICAgIHN0YXJ0X2luZGV4ID0gMTtcblx0ICAgIG5faW5kZXggPSAyO1xuXHR9IGVsc2UgaWYgKHRyZWVfY29uZi5ydWxlciA9PT0gXCJ0b3BcIikge1xuXHQgICAgc3RhcnRfaW5kZXggPSAxO1xuXHQgICAgbl9pbmRleCA9IDE7XG5cdH0gZWxzZSBpZiAodHJlZV9jb25mLnJ1bGVyID09PSBcImJvdHRvbVwiKSB7XG5cdCAgICBuX2luZGV4ID0gMTtcblx0fVxuXG5cdC8vIFJlc2V0IHRvcCB0cmFjayAtLSBheGlzXG5cdGlmIChzdGFydF9pbmRleCA+IDApIHtcblx0ICAgIHRyYWNrc1swXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3NbMF0pO1xuXHR9XG5cdC8vIFJlc2V0IGJvdHRvbSB0cmFjayAtLSBheGlzXG5cdGlmIChuX2luZGV4ID4gc3RhcnRfaW5kZXgpIHtcblx0ICAgIHZhciBuID0gdHJhY2tzLmxlbmd0aCAtIDE7XG5cdCAgICB0cmFja3Nbbl0uZGlzcGxheSgpLnJlc2V0LmNhbGwodHJhY2tzW25dKTtcblx0fVxuXG5cdGZvciAodmFyIGk9c3RhcnRfaW5kZXg7IGk8PSh0cmFja3MubGVuZ3RoIC0gbl9pbmRleCk7IGkrKykge1xuXHQgICAgdmFyIHQgPSB0cmFja3NbaV07XG5cdCAgICB0LmRpc3BsYXkoKS5yZXNldC5jYWxsKHQpO1xuXHQgICAgdmFyIGxlYWY7XG5cdCAgICB0cmVlX2NvbmYudHJlZS5yb290KCkuYXBwbHkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0aWYgKG5vZGUuaWQoKSA9PT0gdC5pZCgpKSB7XG5cdFx0ICAgIGxlYWYgPSBub2RlO1xuXHRcdH1cblx0ICAgIH0pXG5cblx0ICAgIHZhciBuX3RyYWNrO1xuXHQgICAgKGZ1bmN0aW9uIChsZWFmKSB7XG5cdFx0dG50LnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuXHRcdCAgICBpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gbGVhZi5pZCgpO1xuXHRcdCAgICB9XG5cdFx0ICAgIGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkgPT09ICdmdW5jdGlvbicpKSB7XG5cdFx0XHRyZXR1cm4gdHJlZV9jb25mLmtleSAobGVhZik7XG5cdFx0ICAgIH1cblx0XHQgICAgcmV0dXJuIGxlYWYucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG5cdFx0fTtcblx0XHRuX3RyYWNrID0gbmV3X3RyYWNrKGxlYWYpXG5cdFx0ICAgIC5oZWlnaHQodHJlZV9jb25mLnRyZWUubGFiZWwoKS5oZWlnaHQoKSk7XG5cdCAgICB9KShsZWFmKTtcblxuXHQgICAgdHJhY2tzW2ldID0gbl90cmFjaztcblx0fVxuXG5cdHRyZWVfY29uZi50cmFjayA9IG5ld190cmFjaztcblx0dHJlZV9jb25mLmFubm90YXRpb24uc3RhcnQoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRhO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdGE7XG5cbiJdfQ==
