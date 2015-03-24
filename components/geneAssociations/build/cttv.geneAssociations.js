(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = geneAssociations = require("./src/geneAssociations.js");

},{"./src/geneAssociations.js":6}],3:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":4}],6:[function(require,module,exports){
// var tooltip = require("tnt.tooltip");
// var tnt_node = require("tnt.tree.node");
var events = require("biojs-events");

var geneAssociations = function (deps) {
    var config = {
	target : "",
	diameter : 1000,
    };

    // Check that all dependencies are there
    checkDeps(deps, ["bubblesView", "flowerView", "cttvApi", "tnt.tree.node", "tnt.tooltip", "_"]);
    
    // TODO: Move to cttvApi
    // This code is duplicated several times now (controllers, directives and components)
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

    function render (div) {
	var data = config.data;
	config.root = deps["tnt.tree.node"](data);
	var taNodes = config.root.children();
	var therapeuticAreas = deps._.map(taNodes, function (node) {
	    var d = node.data();
	    var name = d.label;
	    if (d.label.length > 20) {
		name = d.label.substring(0, 18) + "...";
	    }
	    var leaves = node.get_all_leaves();
	    var diseases = deps._.map(leaves, function (n) {
		var d = n.data();
		return {
		    "name": d.label,
		    "efo": d.efo_code,
		    "score": d.association_score
		};
	    });
	    var diseasesSorted = deps._.sortBy(diseases, function (d) {
		return -d.score;
	    });
	    return {
		"name": name,
		"score": diseases.length,
		"efo": d.efo_code,
		"diseases": diseasesSorted
	    };
	});
	var therapeuticAreasSorted = deps._.sortBy(therapeuticAreas, function (a) {
	    return -a.score;
	});
	// Set up the bubbles view correctly
	deps.bubblesView
	    .data(config.root)
	    .value("association_score")
	    .key("efo_code")
	    .label("label")
	    .diameter(config.diameter);
	
	var tree = deps.bubblesView.data();

	// Tooltips
	var bubble_tooltip = function (node) {
	    // toplevel root is not shown in the bubbles view
	    if (node.parent() === undefined) {
		return;
	    }

	    var obj = {};
	    var score = node.property("association_score");
	    obj.header = node.property("label") + " (Association Score: " + score + ")";
	    var loc = "#/gene-disease?t=" + config.target + "&d=" + node.property("efo_code");
	    obj.body="<div></div><a href=" + loc + ">View details</a>";

	    var leafTooltip = deps["tnt.tooltip"].plain()
		.id(1)
		.width(180);

	    //Hijack of the fill callback
	    var tableFill = leafTooltip.fill();

	    //Pass a new fill callback that calls the original one and decorates with flowers
	    leafTooltip.fill(function (data) {
		tableFill.call(this, data);
		var datatypes = node.property("datatypes");
		var flowerData = [
		    {"value":lookDatasource(datatypes, "genetic_association").score,  "label":"Genetics"},
		    {"value":lookDatasource(datatypes, "somatic_mutation").score,  "label":"Somatic"},
		    {"value":lookDatasource(datatypes, "known_drug").score,  "label":"Drugs"},
		    {"value":lookDatasource(datatypes, "rna_expression").score,  "label":"RNA"},
		    {"value":lookDatasource(datatypes, "affected_pathway").score,  "label":"Pathways"},
		    {"value":lookDatasource(datatypes, "animal_model").score,  "label":"Models"}
		];
		deps.flowerView.values(flowerData)(this.select("div").node());
	    });
	    
	    leafTooltip.call(this, obj);
	};
	deps.bubblesView
	    .onclick (bubble_tooltip);
	//.onclick (function (d) {bView.focus(bView.node(d))})
	// Render
	deps.bubblesView(div.node());

	//return therapeuticAreasSorted;
    }

    // deps should include (bubblesView, flowerView, cttvApi, tnt.tree.node and tooltip)
    var ga = function (div) {
	var vis = d3.select(div)
	    .append("div")
	    .style("position", "relative");
	if (config.data === undefined) {
	    var api = deps.cttvApi;
	    var url = api.url.associations({
		gene: config.target,
		datastructure: "tree"
	    });
	    api.call(url)
		.then (function (resp) {
		    //var data = JSON.parse(resp).data;
		    var data = resp.body.data;
		    processData(data);
		    config.data = data;
		    render(vis);
		});
	} else {
	    render(vis);
	}
    };
    
    // process the data for bubbles display
    function processData (data) {
	var therapeuticAreas = data.children;

	for (var i=0; i<therapeuticAreas.length; i++) {
	    var tA = therapeuticAreas[i];
	    var taChildren = tA.children;
	    if (taChildren === undefined) {
		continue;
	    }
	    var newChildren = [];
	    for (var j=0; j<taChildren.length; j++) {
		var taChild = taChildren[j];
		var taLeaves = deps["tnt.tree.node"](taChild).get_all_leaves();
		for (var k=0; k<taLeaves.length; k++) {
		    newChildren.push(taLeaves[k].data());
		}
	    }
	    tA.children = newChildren;
	}
	return data;
    };
    
    ga.data = function (d) {
    	if (!arguments.length) {
    	    return config.data;
    	}
    	processData(d);
	config.data = d;
    	return this;
    }
    
    // ga.root = function (node) {
    // 	if (!arguments.length) {
    // 	    return root;
    // 	}
    // 	root = node;
    // 	return this;
    // };
	
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
	return this;
    };
    
    ga.selectTherapeuticArea = function (efo) {
	var taNode = config.root.find_node (function (node) {
	    return node.property("efo_code") == efo || node.property("name") == efo;
	});
	if (taNode.property("focused") === true) {
	    taNode.property("focused", undefined);
	    deps.bubblesView.focus(config.root);
	} else {
	    taNode.property("focused", true);
	    // release prev focused node
	    deps.bubblesView.focus().property("focused", undefined);
	    // focus the new node
	    deps.bubblesView.focus(taNode);
	}
	deps.bubblesView.select(config.root);
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
	var dNode = nodeData.find_node (function (node) {
	    return node.property("efo_code") === efo;
	});
	if (dNode.property("selected") === true) {
	    node.property("selected", undefined);
	    deps.bubblesView.select(config.root);
	} else {
	    dNode.property("selected", true);
	    deps.bubblesView.select([node]);
	}
	return this;
    }

    function checkDeps (obj, depNames) {
	var missing = [];
	for (var i=0; i<depNames.length; i++) {
	    if (typeof(obj[depNames[i]] === "undefined")) {
		missing.push(depNames[i]);
	    }
	}
	return missing;
    }
    
    return ga;
};

module.exports = geneAssociations;

},{"biojs-events":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL2Zha2VfNDJjZTU5MGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvZ2VuZUFzc29jaWF0aW9ucy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvZ2VuZUFzc29jaWF0aW9ucy9ub2RlX21vZHVsZXMvYmlvanMtZXZlbnRzL25vZGVfbW9kdWxlcy9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5lQXNzb2NpYXRpb25zL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL2dlbmVBc3NvY2lhdGlvbnMvc3JjL2dlbmVBc3NvY2lhdGlvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsIi8vIGlmICh0eXBlb2YgYnViYmxlc1ZpZXcgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3ID0ge31cbi8vIH1cbi8vIGJ1YmJsZXNWaWV3LmJ1YmJsZXNWaWV3ID0gcmVxdWlyZShcIi4vc3JjL2J1YmJsZXNWaWV3LmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBnZW5lQXNzb2NpYXRpb25zID0gcmVxdWlyZShcIi4vc3JjL2dlbmVBc3NvY2lhdGlvbnMuanNcIik7XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZShcImJhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lXCIpO1xuXG5ldmVudHMub25BbGwgPSBmdW5jdGlvbihjYWxsYmFjayxjb250ZXh0KXtcbiAgdGhpcy5vbihcImFsbFwiLCBjYWxsYmFjayxjb250ZXh0KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBNaXhpbiB1dGlsaXR5XG5ldmVudHMub2xkTWl4aW4gPSBldmVudHMubWl4aW47XG5ldmVudHMubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICBldmVudHMub2xkTWl4aW4ocHJvdG8pO1xuICAvLyBhZGQgY3VzdG9tIG9uQWxsXG4gIHZhciBleHBvcnRzID0gWydvbkFsbCddO1xuICBmb3IodmFyIGk9MDsgaSA8IGV4cG9ydHMubGVuZ3RoO2krKyl7XG4gICAgdmFyIG5hbWUgPSBleHBvcnRzW2ldO1xuICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgfVxuICByZXR1cm4gcHJvdG87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50cztcbiIsIi8qKlxuICogU3RhbmRhbG9uZSBleHRyYWN0aW9uIG9mIEJhY2tib25lLkV2ZW50cywgbm8gZXh0ZXJuYWwgZGVwZW5kZW5jeSByZXF1aXJlZC5cbiAqIERlZ3JhZGVzIG5pY2VseSB3aGVuIEJhY2tvbmUvdW5kZXJzY29yZSBhcmUgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnRcbiAqIGdsb2JhbCBjb250ZXh0LlxuICpcbiAqIE5vdGUgdGhhdCBkb2NzIHN1Z2dlc3QgdG8gdXNlIHVuZGVyc2NvcmUncyBgXy5leHRlbmQoKWAgbWV0aG9kIHRvIGFkZCBFdmVudHNcbiAqIHN1cHBvcnQgdG8gc29tZSBnaXZlbiBvYmplY3QuIEEgYG1peGluKClgIG1ldGhvZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRXZlbnRzXG4gKiBwcm90b3R5cGUgdG8gYXZvaWQgdXNpbmcgdW5kZXJzY29yZSBmb3IgdGhhdCBzb2xlIHB1cnBvc2U6XG4gKlxuICogICAgIHZhciBteUV2ZW50RW1pdHRlciA9IEJhY2tib25lRXZlbnRzLm1peGluKHt9KTtcbiAqXG4gKiBPciBmb3IgYSBmdW5jdGlvbiBjb25zdHJ1Y3RvcjpcbiAqXG4gKiAgICAgZnVuY3Rpb24gTXlDb25zdHJ1Y3Rvcigpe31cbiAqICAgICBNeUNvbnN0cnVjdG9yLnByb3RvdHlwZS5mb28gPSBmdW5jdGlvbigpe31cbiAqICAgICBCYWNrYm9uZUV2ZW50cy5taXhpbihNeUNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gKlxuICogKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuICogKGMpIDIwMTMgTmljb2xhcyBQZXJyaWF1bHRcbiAqL1xuLyogZ2xvYmFsIGV4cG9ydHM6dHJ1ZSwgZGVmaW5lLCBtb2R1bGUgKi9cbihmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3QgPSB0aGlzLFxuICAgICAgbmF0aXZlRm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLFxuICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBpZENvdW50ZXIgPSAwO1xuXG4gIC8vIFJldHVybnMgYSBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIG1hdGNoaW5nIHRoZSBtaW5pbWFsIEFQSSBzdWJzZXQgcmVxdWlyZWRcbiAgLy8gYnkgQmFja2JvbmUuRXZlbnRzXG4gIGZ1bmN0aW9uIG1pbmlzY29yZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAga2V5czogT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2Ygb2JqICE9PSBcImZ1bmN0aW9uXCIgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleXMoKSBjYWxsZWQgb24gYSBub24tb2JqZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXksIGtleXMgPSBbXTtcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBrZXlzW2tleXMubGVuZ3RoXSA9IGtleTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgICB9LFxuXG4gICAgICB1bmlxdWVJZDogZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICAgICAgfSxcblxuICAgICAgaGFzOiBmdW5jdGlvbihvYmosIGtleSkge1xuICAgICAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gICAgICB9LFxuXG4gICAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhcyhvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgb25jZTogZnVuY3Rpb24oZnVuYykge1xuICAgICAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgZnVuYyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHZhciBfID0gbWluaXNjb3JlKCksIEV2ZW50cztcblxuICAvLyBCYWNrYm9uZS5FdmVudHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQSBtb2R1bGUgdGhhdCBjYW4gYmUgbWl4ZWQgaW4gdG8gKmFueSBvYmplY3QqIGluIG9yZGVyIHRvIHByb3ZpZGUgaXQgd2l0aFxuICAvLyBjdXN0b20gZXZlbnRzLiBZb3UgbWF5IGJpbmQgd2l0aCBgb25gIG9yIHJlbW92ZSB3aXRoIGBvZmZgIGNhbGxiYWNrXG4gIC8vIGZ1bmN0aW9ucyB0byBhbiBldmVudDsgYHRyaWdnZXJgLWluZyBhbiBldmVudCBmaXJlcyBhbGwgY2FsbGJhY2tzIGluXG4gIC8vIHN1Y2Nlc3Npb24uXG4gIC8vXG4gIC8vICAgICB2YXIgb2JqZWN0ID0ge307XG4gIC8vICAgICBfLmV4dGVuZChvYmplY3QsIEJhY2tib25lLkV2ZW50cyk7XG4gIC8vICAgICBvYmplY3Qub24oJ2V4cGFuZCcsIGZ1bmN0aW9uKCl7IGFsZXJ0KCdleHBhbmRlZCcpOyB9KTtcbiAgLy8gICAgIG9iamVjdC50cmlnZ2VyKCdleHBhbmQnKTtcbiAgLy9cbiAgRXZlbnRzID0ge1xuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uIFBhc3NpbmcgYFwiYWxsXCJgIHdpbGwgYmluZFxuICAgIC8vIHRoZSBjYWxsYmFjayB0byBhbGwgZXZlbnRzIGZpcmVkLlxuICAgIG9uOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSB8fCAodGhpcy5fZXZlbnRzW25hbWVdID0gW10pO1xuICAgICAgZXZlbnRzLnB1c2goe2NhbGxiYWNrOiBjYWxsYmFjaywgY29udGV4dDogY29udGV4dCwgY3R4OiBjb250ZXh0IHx8IHRoaXN9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIG9ubHkgYmUgdHJpZ2dlcmVkIGEgc2luZ2xlIHRpbWUuIEFmdGVyIHRoZSBmaXJzdCB0aW1lXG4gICAgLy8gdGhlIGNhbGxiYWNrIGlzIGludm9rZWQsIGl0IHdpbGwgYmUgcmVtb3ZlZC5cbiAgICBvbmNlOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uY2UnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIG9uY2UgPSBfLm9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub2ZmKG5hbWUsIG9uY2UpO1xuICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBvbmNlLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgcmV0dXJuIHRoaXMub24obmFtZSwgb25jZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSBvbmUgb3IgbWFueSBjYWxsYmFja3MuIElmIGBjb250ZXh0YCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyB3aXRoIHRoYXQgZnVuY3Rpb24uIElmIGBjYWxsYmFja2AgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3MgZm9yIHRoZSBldmVudC4gSWYgYG5hbWVgIGlzIG51bGwsIHJlbW92ZXMgYWxsIGJvdW5kXG4gICAgLy8gY2FsbGJhY2tzIGZvciBhbGwgZXZlbnRzLlxuICAgIG9mZjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXRhaW4sIGV2LCBldmVudHMsIG5hbWVzLCBpLCBsLCBqLCBrO1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIWV2ZW50c0FwaSh0aGlzLCAnb2ZmJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkpIHJldHVybiB0aGlzO1xuICAgICAgaWYgKCFuYW1lICYmICFjYWxsYmFjayAmJiAhY29udGV4dCkge1xuICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIG5hbWVzID0gbmFtZSA/IFtuYW1lXSA6IF8ua2V5cyh0aGlzLl9ldmVudHMpO1xuICAgICAgZm9yIChpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGlmIChldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0pIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSByZXRhaW4gPSBbXTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sgfHwgY29udGV4dCkge1xuICAgICAgICAgICAgZm9yIChqID0gMCwgayA9IGV2ZW50cy5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgZXYgPSBldmVudHNbal07XG4gICAgICAgICAgICAgIGlmICgoY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjay5fY2FsbGJhY2spIHx8XG4gICAgICAgICAgICAgICAgICAoY29udGV4dCAmJiBjb250ZXh0ICE9PSBldi5jb250ZXh0KSkge1xuICAgICAgICAgICAgICAgIHJldGFpbi5wdXNoKGV2KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXJldGFpbi5sZW5ndGgpIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRyaWdnZXIgb25lIG9yIG1hbnkgZXZlbnRzLCBmaXJpbmcgYWxsIGJvdW5kIGNhbGxiYWNrcy4gQ2FsbGJhY2tzIGFyZVxuICAgIC8vIHBhc3NlZCB0aGUgc2FtZSBhcmd1bWVudHMgYXMgYHRyaWdnZXJgIGlzLCBhcGFydCBmcm9tIHRoZSBldmVudCBuYW1lXG4gICAgLy8gKHVubGVzcyB5b3UncmUgbGlzdGVuaW5nIG9uIGBcImFsbFwiYCwgd2hpY2ggd2lsbCBjYXVzZSB5b3VyIGNhbGxiYWNrIHRvXG4gICAgLy8gcmVjZWl2ZSB0aGUgdHJ1ZSBuYW1lIG9mIHRoZSBldmVudCBhcyB0aGUgZmlyc3QgYXJndW1lbnQpLlxuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ3RyaWdnZXInLCBuYW1lLCBhcmdzKSkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgdmFyIGFsbEV2ZW50cyA9IHRoaXMuX2V2ZW50cy5hbGw7XG4gICAgICBpZiAoZXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGV2ZW50cywgYXJncyk7XG4gICAgICBpZiAoYWxsRXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGFsbEV2ZW50cywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUZWxsIHRoaXMgb2JqZWN0IHRvIHN0b3AgbGlzdGVuaW5nIHRvIGVpdGhlciBzcGVjaWZpYyBldmVudHMgLi4uIG9yXG4gICAgLy8gdG8gZXZlcnkgb2JqZWN0IGl0J3MgY3VycmVudGx5IGxpc3RlbmluZyB0by5cbiAgICBzdG9wTGlzdGVuaW5nOiBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzO1xuICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGRlbGV0ZUxpc3RlbmVyID0gIW5hbWUgJiYgIWNhbGxiYWNrO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgaWYgKG9iaikgKGxpc3RlbmVycyA9IHt9KVtvYmouX2xpc3RlbmVySWRdID0gb2JqO1xuICAgICAgZm9yICh2YXIgaWQgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgIGxpc3RlbmVyc1tpZF0ub2ZmKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgICAgaWYgKGRlbGV0ZUxpc3RlbmVyKSBkZWxldGUgdGhpcy5fbGlzdGVuZXJzW2lkXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICB9O1xuXG4gIC8vIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHNwbGl0IGV2ZW50IHN0cmluZ3MuXG4gIHZhciBldmVudFNwbGl0dGVyID0gL1xccysvO1xuXG4gIC8vIEltcGxlbWVudCBmYW5jeSBmZWF0dXJlcyBvZiB0aGUgRXZlbnRzIEFQSSBzdWNoIGFzIG11bHRpcGxlIGV2ZW50XG4gIC8vIG5hbWVzIGBcImNoYW5nZSBibHVyXCJgIGFuZCBqUXVlcnktc3R5bGUgZXZlbnQgbWFwcyBge2NoYW5nZTogYWN0aW9ufWBcbiAgLy8gaW4gdGVybXMgb2YgdGhlIGV4aXN0aW5nIEFQSS5cbiAgdmFyIGV2ZW50c0FwaSA9IGZ1bmN0aW9uKG9iaiwgYWN0aW9uLCBuYW1lLCByZXN0KSB7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIEhhbmRsZSBldmVudCBtYXBzLlxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW2tleSwgbmFtZVtrZXldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBzcGFjZSBzZXBhcmF0ZWQgZXZlbnQgbmFtZXMuXG4gICAgaWYgKGV2ZW50U3BsaXR0ZXIudGVzdChuYW1lKSkge1xuICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChldmVudFNwbGl0dGVyKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW25hbWVzW2ldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIEEgZGlmZmljdWx0LXRvLWJlbGlldmUsIGJ1dCBvcHRpbWl6ZWQgaW50ZXJuYWwgZGlzcGF0Y2ggZnVuY3Rpb24gZm9yXG4gIC8vIHRyaWdnZXJpbmcgZXZlbnRzLiBUcmllcyB0byBrZWVwIHRoZSB1c3VhbCBjYXNlcyBzcGVlZHkgKG1vc3QgaW50ZXJuYWxcbiAgLy8gQmFja2JvbmUgZXZlbnRzIGhhdmUgMyBhcmd1bWVudHMpLlxuICB2YXIgdHJpZ2dlckV2ZW50cyA9IGZ1bmN0aW9uKGV2ZW50cywgYXJncykge1xuICAgIHZhciBldiwgaSA9IC0xLCBsID0gZXZlbnRzLmxlbmd0aCwgYTEgPSBhcmdzWzBdLCBhMiA9IGFyZ3NbMV0sIGEzID0gYXJnc1syXTtcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4KTsgcmV0dXJuO1xuICAgICAgY2FzZSAxOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEpOyByZXR1cm47XG4gICAgICBjYXNlIDI6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIpOyByZXR1cm47XG4gICAgICBjYXNlIDM6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIsIGEzKTsgcmV0dXJuO1xuICAgICAgZGVmYXVsdDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suYXBwbHkoZXYuY3R4LCBhcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpc3Rlbk1ldGhvZHMgPSB7bGlzdGVuVG86ICdvbicsIGxpc3RlblRvT25jZTogJ29uY2UnfTtcblxuICAvLyBJbnZlcnNpb24tb2YtY29udHJvbCB2ZXJzaW9ucyBvZiBgb25gIGFuZCBgb25jZWAuIFRlbGwgKnRoaXMqIG9iamVjdCB0b1xuICAvLyBsaXN0ZW4gdG8gYW4gZXZlbnQgaW4gYW5vdGhlciBvYmplY3QgLi4uIGtlZXBpbmcgdHJhY2sgb2Ygd2hhdCBpdCdzXG4gIC8vIGxpc3RlbmluZyB0by5cbiAgXy5lYWNoKGxpc3Rlbk1ldGhvZHMsIGZ1bmN0aW9uKGltcGxlbWVudGF0aW9uLCBtZXRob2QpIHtcbiAgICBFdmVudHNbbWV0aG9kXSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMgfHwgKHRoaXMuX2xpc3RlbmVycyA9IHt9KTtcbiAgICAgIHZhciBpZCA9IG9iai5fbGlzdGVuZXJJZCB8fCAob2JqLl9saXN0ZW5lcklkID0gXy51bmlxdWVJZCgnbCcpKTtcbiAgICAgIGxpc3RlbmVyc1tpZF0gPSBvYmo7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBvYmpbaW1wbGVtZW50YXRpb25dKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBFdmVudHMuYmluZCAgID0gRXZlbnRzLm9uO1xuICBFdmVudHMudW5iaW5kID0gRXZlbnRzLm9mZjtcblxuICAvLyBNaXhpbiB1dGlsaXR5XG4gIEV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gICAgdmFyIGV4cG9ydHMgPSBbJ29uJywgJ29uY2UnLCAnb2ZmJywgJ3RyaWdnZXInLCAnc3RvcExpc3RlbmluZycsICdsaXN0ZW5UbycsXG4gICAgICAgICAgICAgICAgICAgJ2xpc3RlblRvT25jZScsICdiaW5kJywgJ3VuYmluZCddO1xuICAgIF8uZWFjaChleHBvcnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBwcm90b1tuYW1lXSA9IHRoaXNbbmFtZV07XG4gICAgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9O1xuXG4gIC8vIEV4cG9ydCBFdmVudHMgYXMgQmFja2JvbmVFdmVudHMgZGVwZW5kaW5nIG9uIGN1cnJlbnQgY29udGV4dFxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7XG4gICAgfVxuICAgIGV4cG9ydHMuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRXZlbnRzO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1cbn0pKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lJyk7XG4iLCIvLyB2YXIgdG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcbi8vIHZhciB0bnRfbm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoXCJiaW9qcy1ldmVudHNcIik7XG5cbnZhciBnZW5lQXNzb2NpYXRpb25zID0gZnVuY3Rpb24gKGRlcHMpIHtcbiAgICB2YXIgY29uZmlnID0ge1xuXHR0YXJnZXQgOiBcIlwiLFxuXHRkaWFtZXRlciA6IDEwMDAsXG4gICAgfTtcblxuICAgIC8vIENoZWNrIHRoYXQgYWxsIGRlcGVuZGVuY2llcyBhcmUgdGhlcmVcbiAgICBjaGVja0RlcHMoZGVwcywgW1wiYnViYmxlc1ZpZXdcIiwgXCJmbG93ZXJWaWV3XCIsIFwiY3R0dkFwaVwiLCBcInRudC50cmVlLm5vZGVcIiwgXCJ0bnQudG9vbHRpcFwiLCBcIl9cIl0pO1xuICAgIFxuICAgIC8vIFRPRE86IE1vdmUgdG8gY3R0dkFwaVxuICAgIC8vIFRoaXMgY29kZSBpcyBkdXBsaWNhdGVkIHNldmVyYWwgdGltZXMgbm93IChjb250cm9sbGVycywgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cylcbiAgICBmdW5jdGlvbiBsb29rRGF0YXNvdXJjZSAoYXJyLCBkc05hbWUpIHtcbiAgICBcdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBcdCAgICB2YXIgZHMgPSBhcnJbaV07XG4gICAgXHQgICAgaWYgKGRzLmRhdGF0eXBlID09PSBkc05hbWUpIHtcbiAgICBcdFx0cmV0dXJuIHtcbiAgICBcdFx0ICAgIFwiY291bnRcIjogZHMuZXZpZGVuY2VfY291bnQsXG4gICAgXHRcdCAgICBcInNjb3JlXCI6IGRzLmFzc29jaWF0aW9uX3Njb3JlXG4gICAgXHRcdH07XG4gICAgXHQgICAgfVxuICAgIFx0fVxuICAgIFx0cmV0dXJuIHtcbiAgICBcdCAgICBcImNvdW50XCI6IDAsXG4gICAgXHQgICAgXCJzY29yZVwiOiAwXG4gICAgXHR9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbmRlciAoZGl2KSB7XG5cdHZhciBkYXRhID0gY29uZmlnLmRhdGE7XG5cdGNvbmZpZy5yb290ID0gZGVwc1tcInRudC50cmVlLm5vZGVcIl0oZGF0YSk7XG5cdHZhciB0YU5vZGVzID0gY29uZmlnLnJvb3QuY2hpbGRyZW4oKTtcblx0dmFyIHRoZXJhcGV1dGljQXJlYXMgPSBkZXBzLl8ubWFwKHRhTm9kZXMsIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgZCA9IG5vZGUuZGF0YSgpO1xuXHQgICAgdmFyIG5hbWUgPSBkLmxhYmVsO1xuXHQgICAgaWYgKGQubGFiZWwubGVuZ3RoID4gMjApIHtcblx0XHRuYW1lID0gZC5sYWJlbC5zdWJzdHJpbmcoMCwgMTgpICsgXCIuLi5cIjtcblx0ICAgIH1cblx0ICAgIHZhciBsZWF2ZXMgPSBub2RlLmdldF9hbGxfbGVhdmVzKCk7XG5cdCAgICB2YXIgZGlzZWFzZXMgPSBkZXBzLl8ubWFwKGxlYXZlcywgZnVuY3Rpb24gKG4pIHtcblx0XHR2YXIgZCA9IG4uZGF0YSgpO1xuXHRcdHJldHVybiB7XG5cdFx0ICAgIFwibmFtZVwiOiBkLmxhYmVsLFxuXHRcdCAgICBcImVmb1wiOiBkLmVmb19jb2RlLFxuXHRcdCAgICBcInNjb3JlXCI6IGQuYXNzb2NpYXRpb25fc2NvcmVcblx0XHR9O1xuXHQgICAgfSk7XG5cdCAgICB2YXIgZGlzZWFzZXNTb3J0ZWQgPSBkZXBzLl8uc29ydEJ5KGRpc2Vhc2VzLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAtZC5zY29yZTtcblx0ICAgIH0pO1xuXHQgICAgcmV0dXJuIHtcblx0XHRcIm5hbWVcIjogbmFtZSxcblx0XHRcInNjb3JlXCI6IGRpc2Vhc2VzLmxlbmd0aCxcblx0XHRcImVmb1wiOiBkLmVmb19jb2RlLFxuXHRcdFwiZGlzZWFzZXNcIjogZGlzZWFzZXNTb3J0ZWRcblx0ICAgIH07XG5cdH0pO1xuXHR2YXIgdGhlcmFwZXV0aWNBcmVhc1NvcnRlZCA9IGRlcHMuXy5zb3J0QnkodGhlcmFwZXV0aWNBcmVhcywgZnVuY3Rpb24gKGEpIHtcblx0ICAgIHJldHVybiAtYS5zY29yZTtcblx0fSk7XG5cdC8vIFNldCB1cCB0aGUgYnViYmxlcyB2aWV3IGNvcnJlY3RseVxuXHRkZXBzLmJ1YmJsZXNWaWV3XG5cdCAgICAuZGF0YShjb25maWcucm9vdClcblx0ICAgIC52YWx1ZShcImFzc29jaWF0aW9uX3Njb3JlXCIpXG5cdCAgICAua2V5KFwiZWZvX2NvZGVcIilcblx0ICAgIC5sYWJlbChcImxhYmVsXCIpXG5cdCAgICAuZGlhbWV0ZXIoY29uZmlnLmRpYW1ldGVyKTtcblx0XG5cdHZhciB0cmVlID0gZGVwcy5idWJibGVzVmlldy5kYXRhKCk7XG5cblx0Ly8gVG9vbHRpcHNcblx0dmFyIGJ1YmJsZV90b29sdGlwID0gZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIC8vIHRvcGxldmVsIHJvb3QgaXMgbm90IHNob3duIGluIHRoZSBidWJibGVzIHZpZXdcblx0ICAgIGlmIChub2RlLnBhcmVudCgpID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIHZhciBvYmogPSB7fTtcblx0ICAgIHZhciBzY29yZSA9IG5vZGUucHJvcGVydHkoXCJhc3NvY2lhdGlvbl9zY29yZVwiKTtcblx0ICAgIG9iai5oZWFkZXIgPSBub2RlLnByb3BlcnR5KFwibGFiZWxcIikgKyBcIiAoQXNzb2NpYXRpb24gU2NvcmU6IFwiICsgc2NvcmUgKyBcIilcIjtcblx0ICAgIHZhciBsb2MgPSBcIiMvZ2VuZS1kaXNlYXNlP3Q9XCIgKyBjb25maWcudGFyZ2V0ICsgXCImZD1cIiArIG5vZGUucHJvcGVydHkoXCJlZm9fY29kZVwiKTtcblx0ICAgIG9iai5ib2R5PVwiPGRpdj48L2Rpdj48YSBocmVmPVwiICsgbG9jICsgXCI+VmlldyBkZXRhaWxzPC9hPlwiO1xuXG5cdCAgICB2YXIgbGVhZlRvb2x0aXAgPSBkZXBzW1widG50LnRvb2x0aXBcIl0ucGxhaW4oKVxuXHRcdC5pZCgxKVxuXHRcdC53aWR0aCgxODApO1xuXG5cdCAgICAvL0hpamFjayBvZiB0aGUgZmlsbCBjYWxsYmFja1xuXHQgICAgdmFyIHRhYmxlRmlsbCA9IGxlYWZUb29sdGlwLmZpbGwoKTtcblxuXHQgICAgLy9QYXNzIGEgbmV3IGZpbGwgY2FsbGJhY2sgdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgb25lIGFuZCBkZWNvcmF0ZXMgd2l0aCBmbG93ZXJzXG5cdCAgICBsZWFmVG9vbHRpcC5maWxsKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0dGFibGVGaWxsLmNhbGwodGhpcywgZGF0YSk7XG5cdFx0dmFyIGRhdGF0eXBlcyA9IG5vZGUucHJvcGVydHkoXCJkYXRhdHlwZXNcIik7XG5cdFx0dmFyIGZsb3dlckRhdGEgPSBbXG5cdFx0ICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcImdlbmV0aWNfYXNzb2NpYXRpb25cIikuc2NvcmUsICBcImxhYmVsXCI6XCJHZW5ldGljc1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwic29tYXRpY19tdXRhdGlvblwiKS5zY29yZSwgIFwibGFiZWxcIjpcIlNvbWF0aWNcIn0sXG5cdFx0ICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcImtub3duX2RydWdcIikuc2NvcmUsICBcImxhYmVsXCI6XCJEcnVnc1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwicm5hX2V4cHJlc3Npb25cIikuc2NvcmUsICBcImxhYmVsXCI6XCJSTkFcIn0sXG5cdFx0ICAgIHtcInZhbHVlXCI6bG9va0RhdGFzb3VyY2UoZGF0YXR5cGVzLCBcImFmZmVjdGVkX3BhdGh3YXlcIikuc2NvcmUsICBcImxhYmVsXCI6XCJQYXRod2F5c1wifSxcblx0XHQgICAge1widmFsdWVcIjpsb29rRGF0YXNvdXJjZShkYXRhdHlwZXMsIFwiYW5pbWFsX21vZGVsXCIpLnNjb3JlLCAgXCJsYWJlbFwiOlwiTW9kZWxzXCJ9XG5cdFx0XTtcblx0XHRkZXBzLmZsb3dlclZpZXcudmFsdWVzKGZsb3dlckRhdGEpKHRoaXMuc2VsZWN0KFwiZGl2XCIpLm5vZGUoKSk7XG5cdCAgICB9KTtcblx0ICAgIFxuXHQgICAgbGVhZlRvb2x0aXAuY2FsbCh0aGlzLCBvYmopO1xuXHR9O1xuXHRkZXBzLmJ1YmJsZXNWaWV3XG5cdCAgICAub25jbGljayAoYnViYmxlX3Rvb2x0aXApO1xuXHQvLy5vbmNsaWNrIChmdW5jdGlvbiAoZCkge2JWaWV3LmZvY3VzKGJWaWV3Lm5vZGUoZCkpfSlcblx0Ly8gUmVuZGVyXG5cdGRlcHMuYnViYmxlc1ZpZXcoZGl2Lm5vZGUoKSk7XG5cblx0Ly9yZXR1cm4gdGhlcmFwZXV0aWNBcmVhc1NvcnRlZDtcbiAgICB9XG5cbiAgICAvLyBkZXBzIHNob3VsZCBpbmNsdWRlIChidWJibGVzVmlldywgZmxvd2VyVmlldywgY3R0dkFwaSwgdG50LnRyZWUubm9kZSBhbmQgdG9vbHRpcClcbiAgICB2YXIgZ2EgPSBmdW5jdGlvbiAoZGl2KSB7XG5cdHZhciB2aXMgPSBkMy5zZWxlY3QoZGl2KVxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLnN0eWxlKFwicG9zaXRpb25cIiwgXCJyZWxhdGl2ZVwiKTtcblx0aWYgKGNvbmZpZy5kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHZhciBhcGkgPSBkZXBzLmN0dHZBcGk7XG5cdCAgICB2YXIgdXJsID0gYXBpLnVybC5hc3NvY2lhdGlvbnMoe1xuXHRcdGdlbmU6IGNvbmZpZy50YXJnZXQsXG5cdFx0ZGF0YXN0cnVjdHVyZTogXCJ0cmVlXCJcblx0ICAgIH0pO1xuXHQgICAgYXBpLmNhbGwodXJsKVxuXHRcdC50aGVuIChmdW5jdGlvbiAocmVzcCkge1xuXHRcdCAgICAvL3ZhciBkYXRhID0gSlNPTi5wYXJzZShyZXNwKS5kYXRhO1xuXHRcdCAgICB2YXIgZGF0YSA9IHJlc3AuYm9keS5kYXRhO1xuXHRcdCAgICBwcm9jZXNzRGF0YShkYXRhKTtcblx0XHQgICAgY29uZmlnLmRhdGEgPSBkYXRhO1xuXHRcdCAgICByZW5kZXIodmlzKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0ICAgIHJlbmRlcih2aXMpO1xuXHR9XG4gICAgfTtcbiAgICBcbiAgICAvLyBwcm9jZXNzIHRoZSBkYXRhIGZvciBidWJibGVzIGRpc3BsYXlcbiAgICBmdW5jdGlvbiBwcm9jZXNzRGF0YSAoZGF0YSkge1xuXHR2YXIgdGhlcmFwZXV0aWNBcmVhcyA9IGRhdGEuY2hpbGRyZW47XG5cblx0Zm9yICh2YXIgaT0wOyBpPHRoZXJhcGV1dGljQXJlYXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0QSA9IHRoZXJhcGV1dGljQXJlYXNbaV07XG5cdCAgICB2YXIgdGFDaGlsZHJlbiA9IHRBLmNoaWxkcmVuO1xuXHQgICAgaWYgKHRhQ2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgdmFyIG5ld0NoaWxkcmVuID0gW107XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8dGFDaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdHZhciB0YUNoaWxkID0gdGFDaGlsZHJlbltqXTtcblx0XHR2YXIgdGFMZWF2ZXMgPSBkZXBzW1widG50LnRyZWUubm9kZVwiXSh0YUNoaWxkKS5nZXRfYWxsX2xlYXZlcygpO1xuXHRcdGZvciAodmFyIGs9MDsgazx0YUxlYXZlcy5sZW5ndGg7IGsrKykge1xuXHRcdCAgICBuZXdDaGlsZHJlbi5wdXNoKHRhTGVhdmVzW2tdLmRhdGEoKSk7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgdEEuY2hpbGRyZW4gPSBuZXdDaGlsZHJlbjtcblx0fVxuXHRyZXR1cm4gZGF0YTtcbiAgICB9O1xuICAgIFxuICAgIGdhLmRhdGEgPSBmdW5jdGlvbiAoZCkge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIGNvbmZpZy5kYXRhO1xuICAgIFx0fVxuICAgIFx0cHJvY2Vzc0RhdGEoZCk7XG5cdGNvbmZpZy5kYXRhID0gZDtcbiAgICBcdHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvLyBnYS5yb290ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIC8vIFx0ICAgIHJldHVybiByb290O1xuICAgIC8vIFx0fVxuICAgIC8vIFx0cm9vdCA9IG5vZGU7XG4gICAgLy8gXHRyZXR1cm4gdGhpcztcbiAgICAvLyB9O1xuXHRcbiAgICBnYS50YXJnZXQgPSBmdW5jdGlvbiAodCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25maWcudGFyZ2V0O1xuXHR9XG5cdGNvbmZpZy50YXJnZXQgPSB0O1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgZ2EuZGlhbWV0ZXIgPSBmdW5jdGlvbiAoZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25maWcuZGlhbWV0ZXI7XG5cdH1cblx0Y29uZmlnLmRpYW1ldGVyID0gZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICBnYS5zZWxlY3RUaGVyYXBldXRpY0FyZWEgPSBmdW5jdGlvbiAoZWZvKSB7XG5cdHZhciB0YU5vZGUgPSBjb25maWcucm9vdC5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eShcImVmb19jb2RlXCIpID09IGVmbyB8fCBub2RlLnByb3BlcnR5KFwibmFtZVwiKSA9PSBlZm87XG5cdH0pO1xuXHRpZiAodGFOb2RlLnByb3BlcnR5KFwiZm9jdXNlZFwiKSA9PT0gdHJ1ZSkge1xuXHQgICAgdGFOb2RlLnByb3BlcnR5KFwiZm9jdXNlZFwiLCB1bmRlZmluZWQpO1xuXHQgICAgZGVwcy5idWJibGVzVmlldy5mb2N1cyhjb25maWcucm9vdCk7XG5cdH0gZWxzZSB7XG5cdCAgICB0YU5vZGUucHJvcGVydHkoXCJmb2N1c2VkXCIsIHRydWUpO1xuXHQgICAgLy8gcmVsZWFzZSBwcmV2IGZvY3VzZWQgbm9kZVxuXHQgICAgZGVwcy5idWJibGVzVmlldy5mb2N1cygpLnByb3BlcnR5KFwiZm9jdXNlZFwiLCB1bmRlZmluZWQpO1xuXHQgICAgLy8gZm9jdXMgdGhlIG5ldyBub2RlXG5cdCAgICBkZXBzLmJ1YmJsZXNWaWV3LmZvY3VzKHRhTm9kZSk7XG5cdH1cblx0ZGVwcy5idWJibGVzVmlldy5zZWxlY3QoY29uZmlnLnJvb3QpO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgZ2Euc2VsZWN0RGlzZWFzZSA9IGZ1bmN0aW9uIChlZm8pIHtcblx0Ly8gVGhpcyBjb2RlIGlzIGZvciBkaXNlYXNlcyB3aXRoIG11bHRpcGxlIHBhcmVudHNcblx0Ly8gdmFyIG5vZGVzID0gbm9kZURhdGEuZmluZF9hbGwoZnVuY3Rpb24gKG5vZGUpIHtcblx0Ly8gIHJldHVybiBub2RlLnByb3BlcnR5KFwiZWZvX2NvZGVcIikgPT09IGVmbztcblx0Ly8gfSk7XG5cdC8vIHZhciBsY2E7XG5cdC8vIGlmIChub2Rlcy5sZW5ndGggPiAxKSB7XG5cdC8vICBsY2EgPSB0cmVlLmxjYShub2Rlcyk7XG5cdC8vIH0gZWxzZSB7XG5cdC8vICBsY2EgPSBub2Rlc1swXS5wYXJlbnQoKTtcblx0Ly8gfVxuXHR2YXIgZE5vZGUgPSBub2RlRGF0YS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eShcImVmb19jb2RlXCIpID09PSBlZm87XG5cdH0pO1xuXHRpZiAoZE5vZGUucHJvcGVydHkoXCJzZWxlY3RlZFwiKSA9PT0gdHJ1ZSkge1xuXHQgICAgbm9kZS5wcm9wZXJ0eShcInNlbGVjdGVkXCIsIHVuZGVmaW5lZCk7XG5cdCAgICBkZXBzLmJ1YmJsZXNWaWV3LnNlbGVjdChjb25maWcucm9vdCk7XG5cdH0gZWxzZSB7XG5cdCAgICBkTm9kZS5wcm9wZXJ0eShcInNlbGVjdGVkXCIsIHRydWUpO1xuXHQgICAgZGVwcy5idWJibGVzVmlldy5zZWxlY3QoW25vZGVdKTtcblx0fVxuXHRyZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0RlcHMgKG9iaiwgZGVwTmFtZXMpIHtcblx0dmFyIG1pc3NpbmcgPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGRlcE5hbWVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAodHlwZW9mKG9ialtkZXBOYW1lc1tpXV0gPT09IFwidW5kZWZpbmVkXCIpKSB7XG5cdFx0bWlzc2luZy5wdXNoKGRlcE5hbWVzW2ldKTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gbWlzc2luZztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGdhO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lQXNzb2NpYXRpb25zO1xuIl19
