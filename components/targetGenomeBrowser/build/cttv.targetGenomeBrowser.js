(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
module.exports = targetGenomeBrowser = require("./src/targetGenomeBrowser.js");

},{"./src/targetGenomeBrowser.js":28}],3:[function(require,module,exports){
module.exports = genomeBrowserNav = require("./src/genomeBrowserNav.js");

},{"./src/genomeBrowserNav.js":4}],4:[function(require,module,exports){
var genome_browser_nav = function () {
    "use strict";

    var show_options = true;
    var show_title = true;
    var title = "";
    var orig = {};
    var fgColor = "#586471";
    // var chr = 0;
    var gBrowser;

    var theme = function (gB, div) {
        gBrowser = gB;
        var opts_pane = d3.select(div)
            .append ("div")
            .attr("class", "tnt_options_pane")
            .style("display", function() {
                if (show_options) {
                    return "block";
                }
                return "none";
            });

        opts_pane
            .append("span")
            .text("Human Chr: " + gB.chr());

        var left_button = opts_pane
            .append("i")
            .attr("title", "go left")
            .attr("class", "cttvGenomeBrowserIcon fa fa-arrow-circle-left fa-2x")
            .on("click", theme.left);

        var zoomIn_button = opts_pane
            .append("i")
            .attr("title", "zoom in")
            .attr("class", "cttvGenomeBrowserIcon fa fa-search-plus fa-2x")
            .on("click", theme.zoomIn);

        var zoomOut_button = opts_pane
            .append("i")
            .attr("title", "zoom out")
            .attr("class", "cttvGenomeBrowserIcon fa fa-search-minus fa-2x")
            .on("click", theme.zoomOut);

        var right_button = opts_pane
            .append("i")
            .attr("title", "go right")
            .attr("class", "cttvGenomeBrowserIcon fa fa-arrow-circle-right fa-2x")
            .on("click", theme.right);

        var origLabel = opts_pane
            .append("i")
            .attr("title", "reload location")
            .attr("class", "cttvGenomeBrowserIcon fa fa-refresh fa-lt")
            .on("click", function () {
                gBrowser.start(orig)
            });

        var browser_title = d3.select(div)
            .append("h1")
            .text(title)
            .style("color", theme.foreground_color())
            .style("display", function(){
                if (show_title) {
                    return "auto"
                } else {
                    return "none"
                }
            });

        // We set up the origin:
        if (gBrowser.gene() !== undefined) {
            orig = {
                species : gBrowser.species(),
                gene    : gBrowser.gene()
            };
        } else {
            orig = {
                species : gBrowser.species(),
                chr     : gBrowser.chr(),
                from    : gBrowser.from(),
                to      : gBrowser.to()
            }
        }

        // orig = {
        //     species : gBrowser.species(),
        //     chr     : gBrowser.chr(),
        //     from    : gBrowser.from(),
        //     to      : gBrowser.to()
        // };
    };

    //// API
    theme.left = function () {
        gBrowser.move_left(1.5);
    };

    theme.right = function () {
        gBrowser.move_right(1.5);
    };

    theme.zoomIn = function () {
        gBrowser.zoom(0.5);
    };

    theme.zoomOut = function () {
        gBrowser.zoom(1.5);
    };

    theme.show_options = function(b) {
        show_options = b;
        return theme;
    };
    theme.show_title = function(b) {
        show_title = b;
        return theme;
    };

    theme.title = function (s) {
        if (!arguments.length) {
            return title;
        }
        title = s;
        return theme;
    };

    theme.foreground_color = function (c) {
        if (!arguments.length) {
            return fgColor;
        }
        fgColor = c;
        return theme;
    };

    // theme.chr = function (c) {
    //     if (!arguments.length) {
    //         return chr;
    //     }
    //     chr = c;
    //     return this;
    // };


    return theme;
};

module.exports = exports = genome_browser_nav;

},{}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(require,module,exports){
module.exports = tnt_ensembl = require("./src/rest.js");

},{"./src/rest.js":23}],7:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   2.1.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    function lib$es6$promise$asap$$asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        lib$es6$promise$asap$$scheduleFlush();
      }
    }

    var lib$es6$promise$asap$$default = lib$es6$promise$asap$$asap;

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      var nextTick = process.nextTick;
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // setImmediate should be used instead instead
      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
        nextTick = setImmediate;
      }
      return function() {
        nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertex() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertex();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFullfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$default(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFullfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$default(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require("IrXUsu"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"IrXUsu":5}],8:[function(require,module,exports){
/*globals define */
'use strict';


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return (root.httppleasepromises = factory(root));
        });
    } else if (typeof exports === 'object') {
        module.exports = factory(root);
    } else {
        root.httppleasepromises = factory(root);
    }
}(this, function (root) { // jshint ignore:line
    return function (Promise) {
        Promise = Promise || root && root.Promise;
        if (!Promise) {
            throw new Error('No Promise implementation found.');
        }
        return {
            processRequest: function (req) {
                var resolve, reject,
                    oldOnload = req.onload,
                    oldOnerror = req.onerror,
                    promise = new Promise(function (a, b) {
                        resolve = a;
                        reject = b;
                    });
                req.onload = function (res) {
                    var result;
                    if (oldOnload) {
                        result = oldOnload.apply(this, arguments);
                    }
                    resolve(res);
                    return result;
                };
                req.onerror = function (err) {
                    var result;
                    if (oldOnerror) {
                        result = oldOnerror.apply(this, arguments);
                    }
                    reject(err);
                    return result;
                };
                req.then = function () {
                    return promise.then.apply(promise, arguments);
                };
                req['catch'] = function () {
                    return promise['catch'].apply(promise, arguments);
                };
            }
        };
    };
}));

},{}],9:[function(require,module,exports){
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

},{"./response":12}],10:[function(require,module,exports){
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

},{"../plugins/cleanurl":17,"./error":9,"./request":11,"./response":12,"./utils/delay":13,"./utils/once":14,"./xhr":15,"xtend":16}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{"./request":11}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
module.exports = window.XMLHttpRequest;

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
'use strict';

module.exports = {
    processRequest: function (req) {
        req.url = req.url.replace(/[^%]+/g, function (s) {
            return encodeURI(s);
        });
    }
};

},{}],18:[function(require,module,exports){
'use strict';

var jsonrequest = require('./jsonrequest'),
    jsonresponse = require('./jsonresponse');

module.exports = {
    processRequest: function (req) {
        jsonrequest.processRequest.call(this, req);
        jsonresponse.processRequest.call(this, req);
    },
    processResponse: function (res) {
        jsonresponse.processResponse.call(this, res);
    }
};

},{"./jsonrequest":19,"./jsonresponse":20}],19:[function(require,module,exports){
'use strict';

module.exports = {
    processRequest: function (req) {
        var
            contentType = req.header('Content-Type'),
            hasJsonContentType = contentType &&
                                 contentType.indexOf('application/json') !== -1;

        if (contentType != null && !hasJsonContentType) {
            return;
        }

        if (req.body) {
            if (!contentType) {
                req.header('Content-Type', 'application/json');
            }

            req.body = JSON.stringify(req.body);
        }
    }
};

},{}],20:[function(require,module,exports){
'use strict';

module.exports = {
    processRequest: function (req) {
        var accept = req.header('Accept');
        if (accept == null) {
            req.header('Accept', 'application/json');
        }
    },
    processResponse: function (res) {
        // Check to see if the contentype is "something/json" or
        // "something/somethingelse+json"
        if (res.contentType && /^.*\/(?:.*\+)?json(;|$)/i.test(res.contentType)) {
            var raw = typeof res.body === 'string' ? res.body : res.text;
            if (raw) {
                res.body = JSON.parse(raw);
            }
        }
    }
};

},{}],21:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":22}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
var http = require("httpplease");
var apijs = require("tnt.api");
var promises = require('httpplease-promises');
var Promise = require('es6-promise').Promise;
var json = require("httpplease/plugins/json");
http = http.use(json).use(promises(Promise));

tnt_eRest = function() {

    // Prefixes to use the REST API.
    // These are modified in the localREST setter
    var prefix = "https://rest.ensembl.org";
    var prefix_region = prefix + "/overlap/region/";
    var prefix_ensgene = prefix + "/lookup/id/";
    var prefix_xref = prefix + "/xrefs/symbol/";
    var prefix_homologues = prefix + "/homology/id/";
    var prefix_chr_info = prefix + "/info/assembly/";
    var prefix_aln_region = prefix + "/alignment/region/";
    var prefix_gene_tree = prefix + "/genetree/id/";
    var prefix_assembly = prefix + "/info/assembly/";
    var prefix_sequence = prefix + "/sequence/region/";
    var prefix_variation = prefix + "/variation/";

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
    api.method ('call', function (myurl, data) {
	if (data) {
	    return http.post({
		"url": myurl,
		"body" : data
	    })
	}
	return http.get({
	    "url": myurl
	});
    });
    // api.method ('call', function (obj) {
    // 	var url = obj.url;
    // 	var on_success = obj.success;
    // 	var on_error   = obj.error;
    // 	connections++;
    // 	http.get({
    // 	    "url" : url
    // 	}, function (error, resp) {
    // 	    if (resp !== undefined && error == null && on_success !== undefined) {
    // 		on_success(JSON.parse(resp.body));
    // 	    }
    // 	    if (error !== null && on_error !== undefined) {
    // 		on_error(error);
    // 	    }
    // 	});
    // });


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
         var features = obj.features || ["gene"];
         var feature_options = features.map (function (d) {
             return "feature=" + d;
         });
         var feature_options_url = feature_options.join("&");
         return prefix_region +
         obj.species +
         "/" +
         obj.chr +
         ":" +
         obj.from +
         "-" + obj.to +
         //".json?feature=gene";
         ".json?" + feature_options_url;
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
<li>expand : if transcripts should be included in the response (default to 0)</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/lookup/ENSG00000139618.json?format=full|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.gene ({ id : "ENSG00000139618" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('gene', function(obj) {
	var url = prefix_ensgene + obj.id + ".json?format=full";
	if (obj.expand && obj.expand === 1) {
	    url = url + "&expand=1";
	}
	return url;
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

    url_api.method ('sequence', function (obj) {
	return prefix_sequence +
	    obj.species +
	    '/' +
	    obj.chr +
	    ':' +
	    obj.from +
	    '..' +
	    obj.to +
	    '?content-type=application/json';
    });

    url_api.method ('variation', function (obj) {
	// For now, only post requests are included
	return prefix_variation +
	    obj.species;
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

},{"es6-promise":7,"httpplease":10,"httpplease-promises":8,"httpplease/plugins/json":18,"tnt.api":21}],24:[function(require,module,exports){
module.exports = tooltip = require("./src/tooltip.js");

},{"./src/tooltip.js":27}],25:[function(require,module,exports){
module.exports=require(21)
},{"./src/api.js":26}],26:[function(require,module,exports){
module.exports=require(22)
},{}],27:[function(require,module,exports){
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

},{"tnt.api":25}],28:[function(require,module,exports){
var ensembl_rest_api = require("tnt.ensembl");
var nav = require("cttv.genomeBrowserNav");
var browser_tooltips = require("./tooltips.js");

var cttv_genome_browser = function() {
    "use strict";

    var navTheme = nav()
        .show_options(true);

    var show_links   = true;
    var chr = 0;

    // gwas
    var rest = ensembl_rest_api();
    var gwas_data = [];
    var gwas_extent = [];

    // div_ids to display different elements
    // They have to be set dynamically because the IDs contain the div_id of the main element containing the plug-in
    var div_id;

    var fgColor = "#586471";

    var gBrowser;

    var gBrowserTheme = function(gB, cttvRestApi, div) {
	// Set the different #ids for the html elements (needs to be lively because they depend on the div_id)
	set_div_id(div);
	gBrowser = gB;

    // Navigation
	navTheme (gB, div);

    // tooltips
    var tooltips = browser_tooltips()
        .cttvRestApi (cttvRestApi);


    // Transcript data
    var transcript_data = tnt.board.track.data.genome.transcript();
    transcript_data.update().success(function (transcripts) {
        var newGenes = {};
        for (var i=0; i<transcripts.length; i++) {
            var t = transcripts[i];
            var mygene = t.gene.external_name
            if (gB.gene() === t.gene.id) {
                newGenes[t.external_name] = t;
                continue;
            } else if (newGenes[mygene] === undefined) {
                t.exons = [{
                    start : t.gene.start,
                    end : t.gene.end,
                    offset : 0,
                    isGene : true
                }];
                t.start = t.gene.start;
                t.end = t.gene.end;
                t.introns = [];
                t.display_label = t.gene.strand === 1 ? (mygene + ">") : ("<" + mygene);
                t.isGene = true;
                newGenes[mygene] = t;
            }
        }
        var elems = [];
        for (var elem in newGenes) {
            if (newGenes.hasOwnProperty(elem)) {
                elems.push(newGenes[elem]);
            }
        }
        return elems;
    });

    // Aux track for label
    var transcript_label_track = tnt.board.track()
    .label ("Genes / Transcripts")
    .height(20)
    .background_color ("#EEEFFF")
    .display(tnt.board.track.feature.block())
    .data(tnt.board.track.data()
        .update(tnt.board.track.data.retriever.sync()
            .retriever (function () {
                return [];
            })
        )
    );

    // TRACKS!
    // Gwas track
    var gwas_updater = tnt.board.track.data.retriever.sync()
        .retriever (function () {
        return gwas_data;
        });
    var gwas_display = tnt.board.track.feature.pin()
        .domain([0.3,1.2])
        .foreground_color("#3e8bad")
        //.on_click (gwas_tooltip);
    var gwas_guider = gwas_display.guider();
    gwas_display.guider (function (width) {
        var track = this;
        var p0_offset = 16.11;
        var p05_offset = 43.88

        // pvalue 0
        track.g
        .append("line")
        .attr("x1", 0)
        .attr("y1", p0_offset)
        //.attr("y1", y_offset)
        .attr("x2", width)
            .attr("y2", p0_offset)
        //.attr("y2", y_offset)
        .attr("stroke", "lightgrey");
        track.g
        .append("text")
        .attr("x", width - 50)
        .attr("y", p0_offset + 10)
        .attr("font-size", 10)
        .attr("fill", "lightgrey")
        .text("pvalue 0");

        // pvalue 0.5
        // track.g
        // 	.append("line")
        // 	.attr("x1", 0)
        // 	.attr("y1", p05_offset)
        // 	.attr("x2", width)
        // 	.attr("y2", p05_offset)
        // 	.attr("stroke", "lightgrey")
        // track.g
        // 	.append("text")
        // 	.attr("x", width - 50)
        // 	.attr("y", p05_offset + 10)
        // 	.attr("font-size", 10)
        // 	.attr("fill", "lightgrey")
        // 	.text("pvalue 0.5");

        // continue with rest of guider
        gwas_guider.call(track, width);

    });

    var gwas_track = tnt.board.track()
        .label("GWAS snps")
	    .height(60)
	    .background_color("white")
	    .display(gwas_display)
	    .data (tnt.board.track.data()
		   .update( gwas_updater )
		  );

    // Transcript / Gene track
    var transcript_track = tnt.board.track()
        .height(300)
        .background_color("#EEEFFF")
        .display(tnt.board.track.feature.genome.transcript()
            .foreground_color (function (t) {
                if (t.isGene) {
                    return "#005588";
                }
                return "red";
            })
            .on_click (tooltips.gene)
        )
        .data(transcript_data);

    // Sequence track
    var sequence_track = tnt.board.track()
        .label ("sequence")
        .height(30)
        .background_color("white")
        .display(tnt.board.track.feature.genome.sequence())
        .data(tnt.board.track.data.genome.sequence()
            .limit(150)
        );


	gBrowser(div);
	gBrowser
        //.add_track(gene_track)
        .add_track(gwas_track)
        .add_track(sequence_track)
        .add_track(transcript_label_track)
        .add_track(transcript_track);

    var url = cttvRestApi.url.filterby({
        gene : gB.gene(),
        datasource : "gwas",
        size : 1000,
        fields : [
            "biological_object.efo_info", // disease
            "evidence.evidence_chain"
        ]
    });
    cttvRestApi.call(url)
    .then (function (resp) {
        console.log(resp.body);
        var snps = {};
        // for (var i=0; i<resp.body.data.length; i++) {
        //     var this_snp = resp.body.data[i].evidence;
        //     var this_disease = resp.body.data[i].biological_object;
        //     var snp_name = this_snp.evidence_chain[0].biological_object.about[0].split("/").pop();
        //     if (snps[snp_name] === undefined) {
        //         snps[snp_name] = {};
        //         snps[snp_name].study = [];
        //         snps[snp_name].name = snp_name;
        //     }
        //     snps[snp_name].study.push ({
        //         "pmid"   :  this_snp.evidence_chain[1].evidence.provenance_type.literature.pubmed_refs[0].split("/").pop(),
        //         "pvalue" : this_snp.evidence_chain[1].evidence.association_score.pvalue.value.toExponential(),
        //         "name"   : this_snp.evidence_chain[0].biological_object.about[0].split("/").pop(),
        //         "efo"    : this_disease.efo_info[0][0].efo_id,
        //         "efo_label" : this_disease.efo_info[0][0].label
        //     });
        // }
        var snp_names = Object.keys(snps);

        var min = function (arr) {
            var m;
            for (var i=0; i<arr.length; i++) {
                if (m === undefined) {
                    m = +arr[i].pvalue;
                } else {
                    if (m > +arr[i].pvalue) {
                        m = arr[i].pvalue;
                    }
                }
            }
            return m;
        };

        var var_url = rest.url.variation ({
            species : "human"
        });

        rest.call(var_url, {
            "ids" : snp_names
        })
        .then (function (resp) {
            var min_pos, max_pos;
            gwas_data = [];
            for (var snp_name in resp.body) {
                if (resp.body.hasOwnProperty(snp_name)) {
                    var snp = resp.body[snp_name];
                    var info = snps[snp_name];
                    info.pos = snp.mappings[0].start;
                    info.val = 1 - min(info["study"]);
                    gwas_data.push(info)
                }
            }
            gwas_extent = d3.extent(gwas_data, function (d) {
                return d.pos
            });

            gB.start();
        });
    });


	// The GeneInfo Panel
	d3.select(div).select(".tnt_groupDiv")
	    .append("div")
	    .attr("class", "ePeek_gene_info")
	    .attr("id", "tnt_" + div_id + "_gene_info") // Both needed?
	    .style("width", gBrowser.width() + "px");

	// Links div
	var links_pane = d3.select(div)
	    .append("div")
	    .attr("class", "tnt_links_pane")
	    .style("display", function() {if (show_links) {return "block"} else {return "none"}});

	// ensembl
	links_pane
	    .append("span")
	    .text("Open in Ensembl");
	var ensemblLoc = links_pane
	    .append("i")
	    .attr("title", "open region in ensembl")
	    .attr("class", "cttvGenomeBrowserIcon fa fa-external-link fa-2x")
	    .on("click", function() {var link = buildEnsemblLink(); window.open(link, "_blank")});

    };

///*********************////
/// RENDERING FUNCTIONS ////
///*********************////
    // API


    gBrowserTheme.chr = function (c) {
	if (!arguments.length) {
	    return chr;
	}
	chr = c;
	return this;
    };

    gBrowserTheme.show_links = function(b) {
	show_links = b;
	return gBrowserTheme;
    };

    gBrowserTheme.foreground_color = function (c) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = c;
	return gBrowserTheme;
    };


    var set_div_id = function(div) {
	div_id = d3.select(div).attr("id");
    };


    ///*********************////
    /// UTILITY METHODS     ////
    ///*********************////
    // Private methods
    var buildEnsemblLink = function() {
	var url = "http://www.ensembl.org/" + gBrowser.species() + "/Location/View?r=" + gBrowser.chr() + "%3A" + gBrowser.from() + "-" + gBrowser.to();
	return url;
    };


    // Public methods


    /** <strong>buildEnsemblGeneLink</strong> returns the Ensembl url pointing to the gene summary of the given gene
	@param {String} gene The Ensembl gene id. Should be a valid ID of the form ENSGXXXXXXXXX"
	@returns {String} The Ensembl URL for the given gene
    */
    var buildEnsemblGeneLink = function(ensID) {
	//"http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000139618"
	var url = "http://www.ensembl.org/" + gBrowser.species() + "/Gene/Summary?g=" + ensID;
	return url;
    };

    return gBrowserTheme;
};

module.exports = exports = cttv_genome_browser;

},{"./tooltips.js":29,"cttv.genomeBrowserNav":3,"tnt.ensembl":6}],29:[function(require,module,exports){

var tnt_tooltip = require("tnt.tooltip");

var tooltips = function () {

    var cttvRestApi;

    var m = {};

    // Tooltip on genes
    m.gene = function (gene) {

        // Gene tooltip data
        var tooltip_obj = function (ensemblData, cttvData) {
            console.log(ensemblData);
            var obj = {};
            obj.header = ensemblData.gene.external_name + " (" + ensemblData.gene.id + ")";
            obj.rows = [];

            // Associations and target links maybe
            var associationsValue;
            var targetValue;
            if (cttvData && cttvData.data && cttvData.data.length > 0) {
                associationsValue = "<a href='#/target/" + ensemblData.id + "/associations'>" + (cttvData.data.length - 1) + " disease associations</a> ";
                targetValue = "<a href='#/target/" + ensemblData.id + "'>View CTTV profile</a>";
            }

            obj.rows.push ({
                "label" : "Gene",
                "value" : ""
            });
            obj.rows.push( {
                "label" : "Biotype",
                "value" : ensemblData.gene.biotype
            });
            obj.rows.push({
                "label" : "Location",
                "value" : "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Location/View?db=core;g=" + ensemblData.id + "'>" + ensemblData.gene.seq_region_name + ":" + ensemblData.gene.start + "-" + ensemblData.gene.end + "</a>"
            });
            if (associationsValue !== undefined) {
                obj.rows.push({
                    "label" : "Associations",
                    "value" : associationsValue
                });
            }
            if (targetValue !== undefined) {
                obj.rows.push({
                    "label" : "CTTV Profile",
                    "value" : targetValue
                });
            }
            obj.rows.push( {
                "label" : "Description",
                "value" : ensemblData.gene.description
            });

            if (!ensemblData.isGene) {
                obj.rows.push({
                    "label" : "Transcript",
                    "value" : ""
                });

                obj.rows.push({
                    "label" : "Name",
                    "value" : ensemblData.transcript.external_name
                });

                obj.rows.push({
                    "label" : "ID",
                    "value" : "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=" + ensemblData.id + "'>" + ensemblData.id + "</a>"
                });

                obj.rows.push({
                    "label" : "biotype",
                    "value" : ensemblData.transcript.biotype
                });
            }

            return obj;
        };


        var t = tnt_tooltip.table()
        .id(1);
        var event = d3.event;
        var elem = this;

        var s = tnt_tooltip.plain()
        .id(1);

        var url = cttvRestApi.url.associations ({
            "gene" : gene.gene.id,
            "datastructure" : "flat"
        });
        cttvRestApi.call(url)
        .catch (function (x) {
            var obj = tooltip_obj(gene);
            t.call(elem, obj, event);
        })
        .then(function (resp) {
            var obj = tooltip_obj (gene, resp.body);
            t.call(elem, obj, event);
        });
        s.call(elem, {
            header : gene.gene.external_name + " (" + gene.gene.id + ")",
            body : "<i class='fa fa-spinner fa-2x fa-spin'></i>"
        });

    };

    m.cttvRestApi = function (api) {
        if (!arguments.length) {
            return cttvRestApi;
        }
        cttvRestApi = api;
        return this;
    };

    return m;
};

module.exports = exports = tooltips;

},{"tnt.tooltip":24}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL2Zha2VfYTRiNWM4N2EuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy9jdHR2Lmdlbm9tZUJyb3dzZXJOYXYvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9ub2RlX21vZHVsZXMvY3R0di5nZW5vbWVCcm93c2VyTmF2L3NyYy9nZW5vbWVCcm93c2VyTmF2LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2VzNi1wcm9taXNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlLXByb21pc2VzL2h0dHBwbGVhc2UtcHJvbWlzZXMuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvbGliL2Vycm9yLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9saWIvcmVxdWVzdC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9saWIvcmVzcG9uc2UuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvbGliL3V0aWxzL2RlbGF5LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi91dGlscy9vbmNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi94aHItYnJvd3Nlci5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9ub2RlX21vZHVsZXMveHRlbmQvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvcGx1Z2lucy9jbGVhbnVybC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9wbHVnaW5zL2pzb24uanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvcGx1Z2lucy9qc29ucmVxdWVzdC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9wbHVnaW5zL2pzb25yZXNwb25zZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy90YXJnZXRHZW5vbWVCcm93c2VyL25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL3NyYy9yZXN0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL3NyYy90b29sdGlwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9jb21wb25lbnRzL3RhcmdldEdlbm9tZUJyb3dzZXIvc3JjL3RhcmdldEdlbm9tZUJyb3dzZXIuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvdGFyZ2V0R2Vub21lQnJvd3Nlci9zcmMvdG9vbHRpcHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UUE7QUFDQTs7Ozs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRhcmdldEdlbm9tZUJyb3dzZXIgPSByZXF1aXJlKFwiLi9zcmMvdGFyZ2V0R2Vub21lQnJvd3Nlci5qc1wiKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZ2Vub21lQnJvd3Nlck5hdiA9IHJlcXVpcmUoXCIuL3NyYy9nZW5vbWVCcm93c2VyTmF2LmpzXCIpO1xuIiwidmFyIGdlbm9tZV9icm93c2VyX25hdiA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBzaG93X29wdGlvbnMgPSB0cnVlO1xuICAgIHZhciBzaG93X3RpdGxlID0gdHJ1ZTtcbiAgICB2YXIgdGl0bGUgPSBcIlwiO1xuICAgIHZhciBvcmlnID0ge307XG4gICAgdmFyIGZnQ29sb3IgPSBcIiM1ODY0NzFcIjtcbiAgICAvLyB2YXIgY2hyID0gMDtcbiAgICB2YXIgZ0Jyb3dzZXI7XG5cbiAgICB2YXIgdGhlbWUgPSBmdW5jdGlvbiAoZ0IsIGRpdikge1xuICAgICAgICBnQnJvd3NlciA9IGdCO1xuICAgICAgICB2YXIgb3B0c19wYW5lID0gZDMuc2VsZWN0KGRpdilcbiAgICAgICAgICAgIC5hcHBlbmQgKFwiZGl2XCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X29wdGlvbnNfcGFuZVwiKVxuICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvd19vcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBcIm5vbmVcIjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIG9wdHNfcGFuZVxuICAgICAgICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgICAgIC50ZXh0KFwiSHVtYW4gQ2hyOiBcIiArIGdCLmNocigpKTtcblxuICAgICAgICB2YXIgbGVmdF9idXR0b24gPSBvcHRzX3BhbmVcbiAgICAgICAgICAgIC5hcHBlbmQoXCJpXCIpXG4gICAgICAgICAgICAuYXR0cihcInRpdGxlXCIsIFwiZ28gbGVmdFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1hcnJvdy1jaXJjbGUtbGVmdCBmYS0yeFwiKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgdGhlbWUubGVmdCk7XG5cbiAgICAgICAgdmFyIHpvb21Jbl9idXR0b24gPSBvcHRzX3BhbmVcbiAgICAgICAgICAgIC5hcHBlbmQoXCJpXCIpXG4gICAgICAgICAgICAuYXR0cihcInRpdGxlXCIsIFwiem9vbSBpblwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1zZWFyY2gtcGx1cyBmYS0yeFwiKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgdGhlbWUuem9vbUluKTtcblxuICAgICAgICB2YXIgem9vbU91dF9idXR0b24gPSBvcHRzX3BhbmVcbiAgICAgICAgICAgIC5hcHBlbmQoXCJpXCIpXG4gICAgICAgICAgICAuYXR0cihcInRpdGxlXCIsIFwiem9vbSBvdXRcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtc2VhcmNoLW1pbnVzIGZhLTJ4XCIpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCB0aGVtZS56b29tT3V0KTtcblxuICAgICAgICB2YXIgcmlnaHRfYnV0dG9uID0gb3B0c19wYW5lXG4gICAgICAgICAgICAuYXBwZW5kKFwiaVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0aXRsZVwiLCBcImdvIHJpZ2h0XCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLWFycm93LWNpcmNsZS1yaWdodCBmYS0yeFwiKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgdGhlbWUucmlnaHQpO1xuXG4gICAgICAgIHZhciBvcmlnTGFiZWwgPSBvcHRzX3BhbmVcbiAgICAgICAgICAgIC5hcHBlbmQoXCJpXCIpXG4gICAgICAgICAgICAuYXR0cihcInRpdGxlXCIsIFwicmVsb2FkIGxvY2F0aW9uXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLXJlZnJlc2ggZmEtbHRcIilcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBnQnJvd3Nlci5zdGFydChvcmlnKVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGJyb3dzZXJfdGl0bGUgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmFwcGVuZChcImgxXCIpXG4gICAgICAgICAgICAudGV4dCh0aXRsZSlcbiAgICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIHRoZW1lLmZvcmVncm91bmRfY29sb3IoKSlcbiAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBpZiAoc2hvd190aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJhdXRvXCJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJub25lXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBXZSBzZXQgdXAgdGhlIG9yaWdpbjpcbiAgICAgICAgaWYgKGdCcm93c2VyLmdlbmUoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvcmlnID0ge1xuICAgICAgICAgICAgICAgIHNwZWNpZXMgOiBnQnJvd3Nlci5zcGVjaWVzKCksXG4gICAgICAgICAgICAgICAgZ2VuZSAgICA6IGdCcm93c2VyLmdlbmUoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9yaWcgPSB7XG4gICAgICAgICAgICAgICAgc3BlY2llcyA6IGdCcm93c2VyLnNwZWNpZXMoKSxcbiAgICAgICAgICAgICAgICBjaHIgICAgIDogZ0Jyb3dzZXIuY2hyKCksXG4gICAgICAgICAgICAgICAgZnJvbSAgICA6IGdCcm93c2VyLmZyb20oKSxcbiAgICAgICAgICAgICAgICB0byAgICAgIDogZ0Jyb3dzZXIudG8oKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb3JpZyA9IHtcbiAgICAgICAgLy8gICAgIHNwZWNpZXMgOiBnQnJvd3Nlci5zcGVjaWVzKCksXG4gICAgICAgIC8vICAgICBjaHIgICAgIDogZ0Jyb3dzZXIuY2hyKCksXG4gICAgICAgIC8vICAgICBmcm9tICAgIDogZ0Jyb3dzZXIuZnJvbSgpLFxuICAgICAgICAvLyAgICAgdG8gICAgICA6IGdCcm93c2VyLnRvKClcbiAgICAgICAgLy8gfTtcbiAgICB9O1xuXG4gICAgLy8vLyBBUElcbiAgICB0aGVtZS5sZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBnQnJvd3Nlci5tb3ZlX2xlZnQoMS41KTtcbiAgICB9O1xuXG4gICAgdGhlbWUucmlnaHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGdCcm93c2VyLm1vdmVfcmlnaHQoMS41KTtcbiAgICB9O1xuXG4gICAgdGhlbWUuem9vbUluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBnQnJvd3Nlci56b29tKDAuNSk7XG4gICAgfTtcblxuICAgIHRoZW1lLnpvb21PdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGdCcm93c2VyLnpvb20oMS41KTtcbiAgICB9O1xuXG4gICAgdGhlbWUuc2hvd19vcHRpb25zID0gZnVuY3Rpb24oYikge1xuICAgICAgICBzaG93X29wdGlvbnMgPSBiO1xuICAgICAgICByZXR1cm4gdGhlbWU7XG4gICAgfTtcbiAgICB0aGVtZS5zaG93X3RpdGxlID0gZnVuY3Rpb24oYikge1xuICAgICAgICBzaG93X3RpdGxlID0gYjtcbiAgICAgICAgcmV0dXJuIHRoZW1lO1xuICAgIH07XG5cbiAgICB0aGVtZS50aXRsZSA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRpdGxlO1xuICAgICAgICB9XG4gICAgICAgIHRpdGxlID0gcztcbiAgICAgICAgcmV0dXJuIHRoZW1lO1xuICAgIH07XG5cbiAgICB0aGVtZS5mb3JlZ3JvdW5kX2NvbG9yID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmdDb2xvcjtcbiAgICAgICAgfVxuICAgICAgICBmZ0NvbG9yID0gYztcbiAgICAgICAgcmV0dXJuIHRoZW1lO1xuICAgIH07XG5cbiAgICAvLyB0aGVtZS5jaHIgPSBmdW5jdGlvbiAoYykge1xuICAgIC8vICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBjaHI7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgY2hyID0gYztcbiAgICAvLyAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gfTtcblxuXG4gICAgcmV0dXJuIHRoZW1lO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZ2Vub21lX2Jyb3dzZXJfbmF2O1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRudF9lbnNlbWJsID0gcmVxdWlyZShcIi4vc3JjL3Jlc3QuanNcIik7XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8qIVxuICogQG92ZXJ2aWV3IGVzNi1wcm9taXNlIC0gYSB0aW55IGltcGxlbWVudGF0aW9uIG9mIFByb21pc2VzL0ErLlxuICogQGNvcHlyaWdodCBDb3B5cmlnaHQgKGMpIDIwMTQgWWVodWRhIEthdHosIFRvbSBEYWxlLCBTdGVmYW4gUGVubmVyIGFuZCBjb250cmlidXRvcnMgKENvbnZlcnNpb24gdG8gRVM2IEFQSSBieSBKYWtlIEFyY2hpYmFsZClcbiAqIEBsaWNlbnNlICAgTGljZW5zZWQgdW5kZXIgTUlUIGxpY2Vuc2VcbiAqICAgICAgICAgICAgU2VlIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9qYWtlYXJjaGliYWxkL2VzNi1wcm9taXNlL21hc3Rlci9MSUNFTlNFXG4gKiBAdmVyc2lvbiAgIDIuMS4xXG4gKi9cblxuKGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkb2JqZWN0T3JGdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgfHwgKHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNNYXliZVRoZW5hYmxlKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheTtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheSA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkdG9TdHJpbmcgPSB7fS50b1N0cmluZztcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dDtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbl0gPSBjYWxsYmFjaztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICsgMV0gPSBhcmc7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICs9IDI7XG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9PT0gMikge1xuICAgICAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2goKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB1bmRlZmluZWQ7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgfHwge307XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiB7fS50b1N0cmluZy5jYWxsKHByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXSc7XG5cbiAgICAvLyB0ZXN0IGZvciB3ZWIgd29ya2VyIGJ1dCBub3QgaW4gSUUxMFxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNXb3JrZXIgPSB0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCc7XG5cbiAgICAvLyBub2RlXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU5leHRUaWNrKCkge1xuICAgICAgdmFyIG5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICAgIC8vIG5vZGUgdmVyc2lvbiAwLjEwLnggZGlzcGxheXMgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdoZW4gbmV4dFRpY2sgaXMgdXNlZCByZWN1cnNpdmVseVxuICAgICAgLy8gc2V0SW1tZWRpYXRlIHNob3VsZCBiZSB1c2VkIGluc3RlYWQgaW5zdGVhZFxuICAgICAgdmFyIHZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb25zLm5vZGUubWF0Y2goL14oPzooXFxkKylcXC4pPyg/OihcXGQrKVxcLik/KFxcKnxcXGQrKSQvKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZlcnNpb24pICYmIHZlcnNpb25bMV0gPT09ICcwJyAmJiB2ZXJzaW9uWzJdID09PSAnMTAnKSB7XG4gICAgICAgIG5leHRUaWNrID0gc2V0SW1tZWRpYXRlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBuZXh0VGljayhsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyB2ZXJ0eFxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VWZXJ0eFRpbWVyKCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkdmVydHhOZXh0KGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgdmFyIG9ic2VydmVyID0gbmV3IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcihsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBub2RlLmRhdGEgPSAoaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDIpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyB3ZWIgd29ya2VyXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU1lc3NhZ2VDaGFubmVsKCkge1xuICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoLCAxKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZSA9IG5ldyBBcnJheSgxMDAwKTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2goKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW47IGkrPTIpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2ldO1xuICAgICAgICB2YXIgYXJnID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV07XG5cbiAgICAgICAgY2FsbGJhY2soYXJnKTtcblxuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpKzFdID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnRleCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciByID0gcmVxdWlyZTtcbiAgICAgICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dCA9IHZlcnR4LnJ1bk9uTG9vcCB8fCB2ZXJ0eC5ydW5PbkNvbnRleHQ7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlVmVydHhUaW1lcigpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaDtcbiAgICAvLyBEZWNpZGUgd2hhdCBhc3luYyBtZXRob2QgdG8gdXNlIHRvIHRyaWdnZXJpbmcgcHJvY2Vzc2luZyBvZiBxdWV1ZWQgY2FsbGJhY2tzOlxuICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VOZXh0VGljaygpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNXb3JrZXIpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU1lc3NhZ2VDaGFubmVsKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydGV4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKCkge31cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICAgPSB2b2lkIDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCA9IDE7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICA9IDI7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxsZmlsbG1lbnQoKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcihcIllvdSBjYW5ub3QgcmVzb2x2ZSBhIHByb21pc2Ugd2l0aCBpdHNlbGZcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS4nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRnZXRUaGVuKHByb21pc2UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW47XG4gICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yID0gZXJyb3I7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUsIHRoZW4pIHtcbiAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdChmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICAgIHZhciBzZWFsZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGVycm9yID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB0aGVuYWJsZSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgaWYgKHRoZW5hYmxlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuXG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0sICdTZXR0bGU6ICcgKyAocHJvbWlzZS5fbGFiZWwgfHwgJyB1bmtub3duIHByb21pc2UnKSk7XG5cbiAgICAgICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlKSB7XG4gICAgICBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUodGhlbmFibGUsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSkge1xuICAgICAgaWYgKG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IgPT09IHByb21pc2UuY29uc3RydWN0b3IpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdGhlbiA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4obWF5YmVUaGVuYWJsZSk7XG5cbiAgICAgICAgaWYgKHRoZW4gPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih0aGVuKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsbGZpbGxtZW50KCkpO1xuICAgICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fb25lcnJvcikge1xuICAgICAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuXG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSByZWFzb247XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRkZWZhdWx0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgICAgIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgICAgIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xuXG4gICAgICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGRlZmF1bHQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgICAgdmFyIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKSB7XG4gICAgICB0aGlzLmVycm9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHZhciBoYXNDYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICAgICAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgICAgIHZhbHVlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IpIHtcbiAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIC8vIG5vb3BcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgZW51bWVyYXRvci5faW5zdGFuY2VDb25zdHJ1Y3RvciA9IENvbnN0cnVjdG9yO1xuICAgICAgZW51bWVyYXRvci5wcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoZW51bWVyYXRvci5fdmFsaWRhdGVJbnB1dChpbnB1dCkpIHtcbiAgICAgICAgZW51bWVyYXRvci5faW5wdXQgICAgID0gaW5wdXQ7XG4gICAgICAgIGVudW1lcmF0b3IubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIGVudW1lcmF0b3IuX2luaXQoKTtcblxuICAgICAgICBpZiAoZW51bWVyYXRvci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKGVudW1lcmF0b3IucHJvbWlzZSwgZW51bWVyYXRvci5fcmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLmxlbmd0aCA9IGVudW1lcmF0b3IubGVuZ3RoIHx8IDA7XG4gICAgICAgICAgZW51bWVyYXRvci5fZW51bWVyYXRlKCk7XG4gICAgICAgICAgaWYgKGVudW1lcmF0b3IuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChlbnVtZXJhdG9yLnByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QoZW51bWVyYXRvci5wcm9taXNlLCBlbnVtZXJhdG9yLl92YWxpZGF0aW9uRXJyb3IoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0ZUlucHV0ID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkoaW5wdXQpO1xuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3ZhbGlkYXRpb25FcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fcmVzdWx0ID0gbmV3IEFycmF5KHRoaXMubGVuZ3RoKTtcbiAgICB9O1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3I7XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2VudW1lcmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gICAgICB2YXIgbGVuZ3RoICA9IGVudW1lcmF0b3IubGVuZ3RoO1xuICAgICAgdmFyIHByb21pc2UgPSBlbnVtZXJhdG9yLnByb21pc2U7XG4gICAgICB2YXIgaW5wdXQgICA9IGVudW1lcmF0b3IuX2lucHV0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgcHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24oZW50cnksIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcbiAgICAgIHZhciBjID0gZW51bWVyYXRvci5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNNYXliZVRoZW5hYmxlKGVudHJ5KSkge1xuICAgICAgICBpZiAoZW50cnkuY29uc3RydWN0b3IgPT09IGMgJiYgZW50cnkuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgICAgZW50cnkuX29uZXJyb3IgPSBudWxsO1xuICAgICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChlbnRyeS5fc3RhdGUsIGksIGVudHJ5Ll9yZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVudW1lcmF0b3IuX3dpbGxTZXR0bGVBdChjLnJlc29sdmUoZW50cnkpLCBpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nLS07XG4gICAgICAgIGVudW1lcmF0b3IuX3Jlc3VsdFtpXSA9IGVudHJ5O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3NldHRsZWRBdCA9IGZ1bmN0aW9uKHN0YXRlLCBpLCB2YWx1ZSkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuICAgICAgdmFyIHByb21pc2UgPSBlbnVtZXJhdG9yLnByb21pc2U7XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICBlbnVtZXJhdG9yLl9yZW1haW5pbmctLTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLl9yZXN1bHRbaV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZW51bWVyYXRvci5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgZW51bWVyYXRvci5fcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbihwcm9taXNlLCBpKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwcm9taXNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQsIGksIHZhbHVlKTtcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQsIGksIHJlYXNvbik7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsKGVudHJpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQodGhpcywgZW50cmllcykucHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2UoZW50cmllcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoIWxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShlbnRyaWVzKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcblxuICAgICAgZnVuY3Rpb24gb25GdWxmaWxsbWVudCh2YWx1ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25SZWplY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgcHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShDb25zdHJ1Y3Rvci5yZXNvbHZlKGVudHJpZXNbaV0pLCB1bmRlZmluZWQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkcmFjZTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlKG9iamVjdCkge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSBDb25zdHJ1Y3Rvcikge1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgb2JqZWN0KTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJHJlc29sdmU7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRyZWplY3QocmVhc29uKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0O1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRjb3VudGVyID0gMDtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc1Jlc29sdmVyKCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc05ldygpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gY29uc3RydWN0ICdQcm9taXNlJzogUGxlYXNlIHVzZSB0aGUgJ25ldycgb3BlcmF0b3IsIHRoaXMgb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2U7XG4gICAgLyoqXG4gICAgICBQcm9taXNlIG9iamVjdHMgcmVwcmVzZW50IHRoZSBldmVudHVhbCByZXN1bHQgb2YgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gVGhlXG4gICAgICBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLCB3aGljaFxuICAgICAgcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2XigJlzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgICAgIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBUZXJtaW5vbG9neVxuICAgICAgLS0tLS0tLS0tLS1cblxuICAgICAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgICAgIC0gYHRoZW5hYmxlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gdGhhdCBkZWZpbmVzIGEgYHRoZW5gIG1ldGhvZC5cbiAgICAgIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgICAgIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAgICAgLSBgcmVhc29uYCBpcyBhIHZhbHVlIHRoYXQgaW5kaWNhdGVzIHdoeSBhIHByb21pc2Ugd2FzIHJlamVjdGVkLlxuICAgICAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICAgICAgUHJvbWlzZXMgdGhhdCBhcmUgZnVsZmlsbGVkIGhhdmUgYSBmdWxmaWxsbWVudCB2YWx1ZSBhbmQgYXJlIGluIHRoZSBmdWxmaWxsZWRcbiAgICAgIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgICAgIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gICAgICBQcm9taXNlcyBjYW4gYWxzbyBiZSBzYWlkIHRvICpyZXNvbHZlKiBhIHZhbHVlLiAgSWYgdGhpcyB2YWx1ZSBpcyBhbHNvIGFcbiAgICAgIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgICAgIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICAgICAgaXRzZWxmIHJlamVjdCwgYW5kIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2lsbFxuICAgICAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICAgICAgQmFzaWMgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgYGBganNcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIG9uIHN1Y2Nlc3NcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAgICAgLy8gb24gZmFpbHVyZVxuICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgICAgIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICAgICAgYGBganNcbiAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgICAgIGdldEpTT04oJy9jb21tZW50cycpXG4gICAgICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICAgICAgdmFsdWVzWzFdIC8vID0+IGNvbW1lbnRzSlNPTlxuXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAY2xhc3MgUHJvbWlzZVxuICAgICAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMuX2lkID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGNvdW50ZXIrKztcbiAgICAgIHRoaXMuX3N0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fcmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgICAgIGlmICghbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHJlc29sdmVyKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc1Jlc29sdmVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UpKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzTmV3KCk7XG4gICAgICAgIH1cblxuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZSh0aGlzLCByZXNvbHZlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuYWxsID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnJhY2UgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnJlc29sdmUgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnJlamVjdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkZGVmYXVsdDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHBhcmVudC5fc3RhdGU7XG5cbiAgICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQgJiYgIW9uRnVsZmlsbG1lbnQgfHwgc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICYmICFvblJlamVjdGlvbikge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkID0gbmV3IHRoaXMuY29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBwYXJlbnQuX3Jlc3VsdDtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHNbc3RhdGUgLSAxXTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkZGVmYXVsdChmdW5jdGlvbigpe1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcmVzdWx0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgfSxcblxuICAgIC8qKlxuICAgICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgICAgYXMgdGhlIGNhdGNoIGJsb2NrIG9mIGEgdHJ5L2NhdGNoIHN0YXRlbWVudC5cblxuICAgICAgYGBganNcbiAgICAgIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHN5bmNocm9ub3VzXG4gICAgICB0cnkge1xuICAgICAgICBmaW5kQXV0aG9yKCk7XG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfVxuXG4gICAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgICBmaW5kQXV0aG9yKCkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgY2F0Y2hcbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0aW9uXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkcG9seWZpbGwoKSB7XG4gICAgICB2YXIgbG9jYWw7XG5cbiAgICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gZ2xvYmFsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgUCA9IGxvY2FsLlByb21pc2U7XG5cbiAgICAgIGlmIChQICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSkgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbG9jYWwuUHJvbWlzZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0O1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlID0ge1xuICAgICAgJ1Byb21pc2UnOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCxcbiAgICAgICdwb2x5ZmlsbCc6IGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdFxuICAgIH07XG5cbiAgICAvKiBnbG9iYWwgZGVmaW5lOnRydWUgbW9kdWxlOnRydWUgd2luZG93OiB0cnVlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZTsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVbJ2V4cG9ydHMnXSkge1xuICAgICAgbW9kdWxlWydleHBvcnRzJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzWydFUzZQcm9taXNlJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdCgpO1xufSkuY2FsbCh0aGlzKTtcblxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIklyWFVzdVwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLypnbG9iYWxzIGRlZmluZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAocm9vdC5odHRwcGxlYXNlcHJvbWlzZXMgPSBmYWN0b3J5KHJvb3QpKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJvb3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuaHR0cHBsZWFzZXByb21pc2VzID0gZmFjdG9yeShyb290KTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uIChyb290KSB7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgIHJldHVybiBmdW5jdGlvbiAoUHJvbWlzZSkge1xuICAgICAgICBQcm9taXNlID0gUHJvbWlzZSB8fCByb290ICYmIHJvb3QuUHJvbWlzZTtcbiAgICAgICAgaWYgKCFQcm9taXNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFByb21pc2UgaW1wbGVtZW50YXRpb24gZm91bmQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByb2Nlc3NSZXF1ZXN0OiBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc29sdmUsIHJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgb2xkT25sb2FkID0gcmVxLm9ubG9hZCxcbiAgICAgICAgICAgICAgICAgICAgb2xkT25lcnJvciA9IHJlcS5vbmVycm9yLFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUgPSBhO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0ID0gYjtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVxLm9ubG9hZCA9IGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZE9ubG9hZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gb2xkT25sb2FkLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRPbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBvbGRPbmVycm9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXEudGhlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbi5hcHBseShwcm9taXNlLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVxWydjYXRjaCddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZVsnY2F0Y2gnXS5hcHBseShwcm9taXNlLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbn0pKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJlc3BvbnNlID0gcmVxdWlyZSgnLi9yZXNwb25zZScpO1xuXG5mdW5jdGlvbiBSZXF1ZXN0RXJyb3IobWVzc2FnZSwgcHJvcHMpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIGVyci5uYW1lID0gJ1JlcXVlc3RFcnJvcic7XG4gICAgdGhpcy5uYW1lID0gZXJyLm5hbWU7XG4gICAgdGhpcy5tZXNzYWdlID0gZXJyLm1lc3NhZ2U7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgICB0aGlzLnN0YWNrID0gZXJyLnN0YWNrO1xuICAgIH1cblxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2U7XG4gICAgfTtcblxuICAgIGZvciAodmFyIGsgaW4gcHJvcHMpIHtcbiAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICB0aGlzW2tdID0gcHJvcHNba107XG4gICAgICAgIH1cbiAgICB9XG59XG5cblJlcXVlc3RFcnJvci5wcm90b3R5cGUgPSBFcnJvci5wcm90b3R5cGU7XG5cblJlcXVlc3RFcnJvci5jcmVhdGUgPSBmdW5jdGlvbiAobWVzc2FnZSwgcmVxLCBwcm9wcykge1xuICAgIHZhciBlcnIgPSBuZXcgUmVxdWVzdEVycm9yKG1lc3NhZ2UsIHByb3BzKTtcbiAgICBSZXNwb25zZS5jYWxsKGVyciwgcmVxKTtcbiAgICByZXR1cm4gZXJyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZXF1ZXN0RXJyb3I7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpLFxuICAgIGNsZWFuVVJMID0gcmVxdWlyZSgnLi4vcGx1Z2lucy9jbGVhbnVybCcpLFxuICAgIFhIUiA9IHJlcXVpcmUoJy4veGhyJyksXG4gICAgZGVsYXkgPSByZXF1aXJlKCcuL3V0aWxzL2RlbGF5JyksXG4gICAgY3JlYXRlRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJykuY3JlYXRlLFxuICAgIFJlc3BvbnNlID0gcmVxdWlyZSgnLi9yZXNwb25zZScpLFxuICAgIFJlcXVlc3QgPSByZXF1aXJlKCcuL3JlcXVlc3QnKSxcbiAgICBleHRlbmQgPSByZXF1aXJlKCd4dGVuZCcpLFxuICAgIG9uY2UgPSByZXF1aXJlKCcuL3V0aWxzL29uY2UnKTtcblxuZnVuY3Rpb24gZmFjdG9yeShkZWZhdWx0cywgcGx1Z2lucykge1xuICAgIGRlZmF1bHRzID0gZGVmYXVsdHMgfHwge307XG4gICAgcGx1Z2lucyA9IHBsdWdpbnMgfHwgW107XG5cbiAgICBmdW5jdGlvbiBodHRwKHJlcSwgY2IpIHtcbiAgICAgICAgdmFyIHhociwgcGx1Z2luLCBkb25lLCBrLCB0aW1lb3V0SWQ7XG5cbiAgICAgICAgcmVxID0gbmV3IFJlcXVlc3QoZXh0ZW5kKGRlZmF1bHRzLCByZXEpKTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGx1Z2lucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcGx1Z2luID0gcGx1Z2luc1tpXTtcbiAgICAgICAgICAgIGlmIChwbHVnaW4ucHJvY2Vzc1JlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICBwbHVnaW4ucHJvY2Vzc1JlcXVlc3QocmVxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdpdmUgdGhlIHBsdWdpbnMgYSBjaGFuY2UgdG8gY3JlYXRlIHRoZSBYSFIgb2JqZWN0XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwbHVnaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwbHVnaW4gPSBwbHVnaW5zW2ldO1xuICAgICAgICAgICAgaWYgKHBsdWdpbi5jcmVhdGVYSFIpIHtcbiAgICAgICAgICAgICAgICB4aHIgPSBwbHVnaW4uY3JlYXRlWEhSKHJlcSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7IC8vIEZpcnN0IGNvbWUsIGZpcnN0IHNlcnZlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgeGhyID0geGhyIHx8IG5ldyBYSFIoKTtcblxuICAgICAgICByZXEueGhyID0geGhyO1xuXG4gICAgICAgIC8vIEJlY2F1c2UgWEhSIGNhbiBiZSBhbiBYTUxIdHRwUmVxdWVzdCBvciBhbiBYRG9tYWluUmVxdWVzdCwgd2UgYWRkXG4gICAgICAgIC8vIGBvbnJlYWR5c3RhdGVjaGFuZ2VgLCBgb25sb2FkYCwgYW5kIGBvbmVycm9yYCBjYWxsYmFja3MuIFdlIHVzZSB0aGVcbiAgICAgICAgLy8gYG9uY2VgIHV0aWwgdG8gbWFrZSBzdXJlIHRoYXQgb25seSBvbmUgaXMgY2FsbGVkIChhbmQgaXQncyBvbmx5IGNhbGxlZFxuICAgICAgICAvLyBvbmUgdGltZSkuXG4gICAgICAgIGRvbmUgPSBvbmNlKGRlbGF5KGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICAgICAgeGhyLm9ubG9hZCA9IHhoci5vbmVycm9yID0geGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHhoci5vbnRpbWVvdXQgPSB4aHIub25wcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICB2YXIgcmVzID0gZXJyICYmIGVyci5pc0h0dHBFcnJvciA/IGVyciA6IG5ldyBSZXNwb25zZShyZXEpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHBsdWdpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwbHVnaW4gPSBwbHVnaW5zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW4ucHJvY2Vzc1Jlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsdWdpbi5wcm9jZXNzUmVzcG9uc2UocmVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlcS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAocmVxLm9ubG9hZCkge1xuICAgICAgICAgICAgICAgICAgICByZXEub25sb2FkKHJlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgY2IoZXJyLCByZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgcmVxdWVzdCBjb21wbGV0ZXMsIGNvbnRpbnVlLlxuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHJlcS50aW1lZE91dCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAocmVxLmFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBkb25lKGNyZWF0ZUVycm9yKCdSZXF1ZXN0IGFib3J0ZWQnLCByZXEsIHtuYW1lOiAnQWJvcnQnfSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gTWF0aC5mbG9vcih4aHIuc3RhdHVzIC8gMTAwKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh4aHIuc3RhdHVzID09PSA0MDQgJiYgIXJlcS5lcnJvck9uNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2luZDtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZCA9ICdDbGllbnQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQgPSAnU2VydmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZCA9ICdIVFRQJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0ga2luZCArICcgRXJyb3I6ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1RoZSBzZXJ2ZXIgcmV0dXJuZWQgYSBzdGF0dXMgb2YgJyArIHhoci5zdGF0dXMgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyBmb3IgdGhlIHJlcXVlc3QgXCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5tZXRob2QudG9VcHBlckNhc2UoKSArICcgJyArIHJlcS51cmwgKyAnXCInO1xuICAgICAgICAgICAgICAgICAgICBkb25lKGNyZWF0ZUVycm9yKG1zZywgcmVxKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGBvbmxvYWRgIGlzIG9ubHkgY2FsbGVkIG9uIHN1Y2Nlc3MgYW5kLCBpbiBJRSwgd2lsbCBiZSBjYWxsZWQgd2l0aG91dFxuICAgICAgICAvLyBgeGhyLnN0YXR1c2AgaGF2aW5nIGJlZW4gc2V0LCBzbyB3ZSBkb24ndCBjaGVjayBpdC5cbiAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHsgZG9uZSgpOyB9O1xuXG4gICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZG9uZShjcmVhdGVFcnJvcignSW50ZXJuYWwgWEhSIEVycm9yJywgcmVxKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSUUgc29tZXRpbWVzIGZhaWxzIGlmIHlvdSBkb24ndCBzcGVjaWZ5IGV2ZXJ5IGhhbmRsZXIuXG4gICAgICAgIC8vIFNlZSBodHRwOi8vc29jaWFsLm1zZG4ubWljcm9zb2Z0LmNvbS9Gb3J1bXMvaWUvZW4tVVMvMzBlZjNhZGQtNzY3Yy00NDM2LWI4YTktZjFjYTE5YjQ4MTJlL2llOS1ydG0teGRvbWFpbnJlcXVlc3QtaXNzdWVkLXJlcXVlc3RzLW1heS1hYm9ydC1pZi1hbGwtZXZlbnQtaGFuZGxlcnMtbm90LXNwZWNpZmllZD9mb3J1bT1pZXdlYmRldmVsb3BtZW50XG4gICAgICAgIHhoci5vbnRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7IC8qIG5vb3AgKi8gfTtcbiAgICAgICAgeGhyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7IC8qIG5vb3AgKi8gfTtcblxuICAgICAgICB4aHIub3BlbihyZXEubWV0aG9kLCByZXEudXJsKTtcblxuICAgICAgICBpZiAocmVxLnRpbWVvdXQpIHtcbiAgICAgICAgICAgIC8vIElmIHdlIHVzZSB0aGUgbm9ybWFsIFhIUiB0aW1lb3V0IG1lY2hhbmlzbSAoYHhoci50aW1lb3V0YCBhbmRcbiAgICAgICAgICAgIC8vIGB4aHIub250aW1lb3V0YCksIGBvbnJlYWR5c3RhdGVjaGFuZ2VgIHdpbGwgYmUgdHJpZ2dlcmVkIGJlZm9yZVxuICAgICAgICAgICAgLy8gYG9udGltZW91dGAuIFRoZXJlJ3Mgbm8gd2F5IHRvIHJlY29nbml6ZSB0aGF0IGl0IHdhcyB0cmlnZ2VyZWQgYnlcbiAgICAgICAgICAgIC8vIGEgdGltZW91dCwgYW5kIHdlJ2QgYmUgdW5hYmxlIHRvIGRpc3BhdGNoIHRoZSByaWdodCBlcnJvci5cbiAgICAgICAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlcS50aW1lZE91dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZG9uZShjcmVhdGVFcnJvcignUmVxdWVzdCB0aW1lb3V0JywgcmVxLCB7bmFtZTogJ1RpbWVvdXQnfSkpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge31cbiAgICAgICAgICAgIH0sIHJlcS50aW1lb3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoayBpbiByZXEuaGVhZGVycykge1xuICAgICAgICAgICAgaWYgKHJlcS5oZWFkZXJzLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoaywgcmVxLmhlYWRlcnNba10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgeGhyLnNlbmQocmVxLmJvZHkpO1xuXG4gICAgICAgIHJldHVybiByZXE7XG4gICAgfVxuXG4gICAgdmFyIG1ldGhvZCxcbiAgICAgICAgbWV0aG9kcyA9IFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2hlYWQnLCAncGF0Y2gnLCAnZGVsZXRlJ10sXG4gICAgICAgIHZlcmIgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHJlcSwgY2IpIHtcbiAgICAgICAgICAgICAgICByZXEgPSBuZXcgUmVxdWVzdChyZXEpO1xuICAgICAgICAgICAgICAgIHJlcS5tZXRob2QgPSBtZXRob2Q7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAocmVxLCBjYik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIGZvciAoaSA9IDA7IGkgPCBtZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1ldGhvZCA9IG1ldGhvZHNbaV07XG4gICAgICAgIGh0dHBbbWV0aG9kXSA9IHZlcmIobWV0aG9kKTtcbiAgICB9XG5cbiAgICBodHRwLnBsdWdpbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgIH07XG5cbiAgICBodHRwLmRlZmF1bHRzID0gZnVuY3Rpb24gKG5ld1ZhbHVlcykge1xuICAgICAgICBpZiAobmV3VmFsdWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yeShleHRlbmQoZGVmYXVsdHMsIG5ld1ZhbHVlcyksIHBsdWdpbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9O1xuXG4gICAgaHR0cC51c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuZXdQbHVnaW5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgICAgcmV0dXJuIGZhY3RvcnkoZGVmYXVsdHMsIHBsdWdpbnMuY29uY2F0KG5ld1BsdWdpbnMpKTtcbiAgICB9O1xuXG4gICAgaHR0cC5iYXJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZmFjdG9yeSgpO1xuICAgIH07XG5cbiAgICBodHRwLlJlcXVlc3QgPSBSZXF1ZXN0O1xuICAgIGh0dHAuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICAgIHJldHVybiBodHRwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkoe30sIFtjbGVhblVSTF0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBSZXF1ZXN0KG9wdHNPclVybCkge1xuICAgIHZhciBvcHRzID0gdHlwZW9mIG9wdHNPclVybCA9PT0gJ3N0cmluZycgPyB7dXJsOiBvcHRzT3JVcmx9IDogb3B0c09yVXJsIHx8IHt9O1xuICAgIHRoaXMubWV0aG9kID0gb3B0cy5tZXRob2QgPyBvcHRzLm1ldGhvZC50b1VwcGVyQ2FzZSgpIDogJ0dFVCc7XG4gICAgdGhpcy51cmwgPSBvcHRzLnVybDtcbiAgICB0aGlzLmhlYWRlcnMgPSBvcHRzLmhlYWRlcnMgfHwge307XG4gICAgdGhpcy5ib2R5ID0gb3B0cy5ib2R5O1xuICAgIHRoaXMudGltZW91dCA9IG9wdHMudGltZW91dCB8fCAwO1xuICAgIHRoaXMuZXJyb3JPbjQwNCA9IG9wdHMuZXJyb3JPbjQwNCAhPSBudWxsID8gb3B0cy5lcnJvck9uNDA0IDogdHJ1ZTtcbiAgICB0aGlzLm9ubG9hZCA9IG9wdHMub25sb2FkO1xuICAgIHRoaXMub25lcnJvciA9IG9wdHMub25lcnJvcjtcbn1cblxuUmVxdWVzdC5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuYWJvcnRlZCkgcmV0dXJuO1xuICAgIHRoaXMuYWJvcnRlZCA9IHRydWU7XG4gICAgdGhpcy54aHIuYWJvcnQoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblJlcXVlc3QucHJvdG90eXBlLmhlYWRlciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBrO1xuICAgIGZvciAoayBpbiB0aGlzLmhlYWRlcnMpIHtcbiAgICAgICAgaWYgKHRoaXMuaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgaWYgKG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gay50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGVhZGVyc1trXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5oZWFkZXJzW2tdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuaGVhZGVyc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3Q7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZXF1ZXN0ID0gcmVxdWlyZSgnLi9yZXF1ZXN0Jyk7XG5cblxuZnVuY3Rpb24gUmVzcG9uc2UocmVxKSB7XG4gICAgdmFyIGksIGxpbmVzLCBtLFxuICAgICAgICB4aHIgPSByZXEueGhyO1xuICAgIHRoaXMucmVxdWVzdCA9IHJlcTtcbiAgICB0aGlzLnhociA9IHhocjtcbiAgICB0aGlzLmhlYWRlcnMgPSB7fTtcblxuICAgIC8vIEJyb3dzZXJzIGRvbid0IGxpa2UgeW91IHRyeWluZyB0byByZWFkIFhIUiBwcm9wZXJ0aWVzIHdoZW4geW91IGFib3J0IHRoZVxuICAgIC8vIHJlcXVlc3QsIHNvIHdlIGRvbid0LlxuICAgIGlmIChyZXEuYWJvcnRlZCB8fCByZXEudGltZWRPdXQpIHJldHVybjtcblxuICAgIHRoaXMuc3RhdHVzID0geGhyLnN0YXR1cyB8fCAwO1xuICAgIHRoaXMudGV4dCA9IHhoci5yZXNwb25zZVRleHQ7XG4gICAgdGhpcy5ib2R5ID0geGhyLnJlc3BvbnNlIHx8IHhoci5yZXNwb25zZVRleHQ7XG4gICAgdGhpcy5jb250ZW50VHlwZSA9IHhoci5jb250ZW50VHlwZSB8fCAoeGhyLmdldFJlc3BvbnNlSGVhZGVyICYmIHhoci5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1UeXBlJykpO1xuXG4gICAgaWYgKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMpIHtcbiAgICAgICAgbGluZXMgPSB4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkuc3BsaXQoJ1xcbicpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgobSA9IGxpbmVzW2ldLm1hdGNoKC9cXHMqKFteXFxzXSspOlxccysoW15cXHNdKykvKSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWRlcnNbbVsxXV0gPSBtWzJdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5pc0h0dHBFcnJvciA9IHRoaXMuc3RhdHVzID49IDQwMDtcbn1cblxuUmVzcG9uc2UucHJvdG90eXBlLmhlYWRlciA9IFJlcXVlc3QucHJvdG90eXBlLmhlYWRlcjtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3BvbnNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBXcmFwIGEgZnVuY3Rpb24gaW4gYSBgc2V0VGltZW91dGAgY2FsbC4gVGhpcyBpcyB1c2VkIHRvIGd1YXJhbnRlZSBhc3luY1xuLy8gYmVoYXZpb3IsIHdoaWNoIGNhbiBhdm9pZCB1bmV4cGVjdGVkIGVycm9ycy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXJcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApLFxuICAgICAgICAgICAgbmV3RnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBzZXRUaW1lb3V0KG5ld0Z1bmMsIDApO1xuICAgIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBBIFwib25jZVwiIHV0aWxpdHkuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciByZXN1bHQsIGNhbGxlZCA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY2FsbGVkKSB7XG4gICAgICAgICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzdWx0ID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgdmFyIHRhcmdldCA9IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwcm9jZXNzUmVxdWVzdDogZnVuY3Rpb24gKHJlcSkge1xuICAgICAgICByZXEudXJsID0gcmVxLnVybC5yZXBsYWNlKC9bXiVdKy9nLCBmdW5jdGlvbiAocykge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZVVSSShzKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGpzb25yZXF1ZXN0ID0gcmVxdWlyZSgnLi9qc29ucmVxdWVzdCcpLFxuICAgIGpzb25yZXNwb25zZSA9IHJlcXVpcmUoJy4vanNvbnJlc3BvbnNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHByb2Nlc3NSZXF1ZXN0OiBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIGpzb25yZXF1ZXN0LnByb2Nlc3NSZXF1ZXN0LmNhbGwodGhpcywgcmVxKTtcbiAgICAgICAganNvbnJlc3BvbnNlLnByb2Nlc3NSZXF1ZXN0LmNhbGwodGhpcywgcmVxKTtcbiAgICB9LFxuICAgIHByb2Nlc3NSZXNwb25zZTogZnVuY3Rpb24gKHJlcykge1xuICAgICAgICBqc29ucmVzcG9uc2UucHJvY2Vzc1Jlc3BvbnNlLmNhbGwodGhpcywgcmVzKTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwcm9jZXNzUmVxdWVzdDogZnVuY3Rpb24gKHJlcSkge1xuICAgICAgICB2YXJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlID0gcmVxLmhlYWRlcignQ29udGVudC1UeXBlJyksXG4gICAgICAgICAgICBoYXNKc29uQ29udGVudFR5cGUgPSBjb250ZW50VHlwZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGUuaW5kZXhPZignYXBwbGljYXRpb24vanNvbicpICE9PSAtMTtcblxuICAgICAgICBpZiAoY29udGVudFR5cGUgIT0gbnVsbCAmJiAhaGFzSnNvbkNvbnRlbnRUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVxLmJvZHkpIHtcbiAgICAgICAgICAgIGlmICghY29udGVudFR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXEuaGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXEuYm9keSA9IEpTT04uc3RyaW5naWZ5KHJlcS5ib2R5KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHByb2Nlc3NSZXF1ZXN0OiBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIHZhciBhY2NlcHQgPSByZXEuaGVhZGVyKCdBY2NlcHQnKTtcbiAgICAgICAgaWYgKGFjY2VwdCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXEuaGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBwcm9jZXNzUmVzcG9uc2U6IGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBjb250ZW50eXBlIGlzIFwic29tZXRoaW5nL2pzb25cIiBvclxuICAgICAgICAvLyBcInNvbWV0aGluZy9zb21ldGhpbmdlbHNlK2pzb25cIlxuICAgICAgICBpZiAocmVzLmNvbnRlbnRUeXBlICYmIC9eLipcXC8oPzouKlxcKyk/anNvbig7fCQpL2kudGVzdChyZXMuY29udGVudFR5cGUpKSB7XG4gICAgICAgICAgICB2YXIgcmF3ID0gdHlwZW9mIHJlcy5ib2R5ID09PSAnc3RyaW5nJyA/IHJlcy5ib2R5IDogcmVzLnRleHQ7XG4gICAgICAgICAgICBpZiAocmF3KSB7XG4gICAgICAgICAgICAgICAgcmVzLmJvZHkgPSBKU09OLnBhcnNlKHJhdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvYXBpLmpzXCIpO1xuIiwidmFyIGFwaSA9IGZ1bmN0aW9uICh3aG8pIHtcblxuICAgIHZhciBfbWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG0gPSBbXTtcblxuXHRtLmFkZF9iYXRjaCA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgIG0udW5zaGlmdChvYmopO1xuXHR9O1xuXG5cdG0udXBkYXRlID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdG1baV1bcF0gPSB2YWx1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdG0uYWRkID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGlmIChtLnVwZGF0ZSAobWV0aG9kLCB2YWx1ZSkgKSB7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciByZWcgPSB7fTtcblx0XHRyZWdbbWV0aG9kXSA9IHZhbHVlO1xuXHRcdG0uYWRkX2JhdGNoIChyZWcpO1xuXHQgICAgfVxuXHR9O1xuXG5cdG0uZ2V0ID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0cmV0dXJuIG1baV1bcF07XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH07XG5cblx0cmV0dXJuIG07XG4gICAgfTtcblxuICAgIHZhciBtZXRob2RzICAgID0gX21ldGhvZHMoKTtcbiAgICB2YXIgYXBpID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBhcGkuY2hlY2sgPSBmdW5jdGlvbiAobWV0aG9kLCBjaGVjaywgbXNnKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS5jaGVjayhtZXRob2RbaV0sIGNoZWNrLCBtc2cpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0uY2hlY2soY2hlY2ssIG1zZyk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChtZXRob2QsIGNiYWspIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLnRyYW5zZm9ybSAobWV0aG9kW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC50cmFuc2Zvcm0gKGNiYWspO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0udHJhbnNmb3JtKGNiYWspO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHZhciBhdHRhY2hfbWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCwgb3B0cykge1xuXHR2YXIgY2hlY2tzID0gW107XG5cdHZhciB0cmFuc2Zvcm1zID0gW107XG5cblx0dmFyIGdldHRlciA9IG9wdHMub25fZ2V0dGVyIHx8IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBtZXRob2RzLmdldChtZXRob2QpO1xuXHR9O1xuXG5cdHZhciBzZXR0ZXIgPSBvcHRzLm9uX3NldHRlciB8fCBmdW5jdGlvbiAoeCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYW5zZm9ybXMubGVuZ3RoOyBpKyspIHtcblx0XHR4ID0gdHJhbnNmb3Jtc1tpXSh4KTtcblx0ICAgIH1cblxuXHQgICAgZm9yICh2YXIgaj0wOyBqPGNoZWNrcy5sZW5ndGg7IGorKykge1xuXHRcdGlmICghY2hlY2tzW2pdLmNoZWNrKHgpKSB7XG5cdFx0ICAgIHZhciBtc2cgPSBjaGVja3Nbal0ubXNnIHx8IFxuXHRcdFx0KFwiVmFsdWUgXCIgKyB4ICsgXCIgZG9lc24ndCBzZWVtIHRvIGJlIHZhbGlkIGZvciB0aGlzIG1ldGhvZFwiKTtcblx0XHQgICAgdGhyb3cgKG1zZyk7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgbWV0aG9kcy5hZGQobWV0aG9kLCB4KTtcblx0fTtcblxuXHR2YXIgbmV3X21ldGhvZCA9IGZ1bmN0aW9uIChuZXdfdmFsKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gZ2V0dGVyKCk7XG5cdCAgICB9XG5cdCAgICBzZXR0ZXIobmV3X3ZhbCk7XG5cdCAgICByZXR1cm4gd2hvOyAvLyBSZXR1cm4gdGhpcz9cblx0fTtcblx0bmV3X21ldGhvZC5jaGVjayA9IGZ1bmN0aW9uIChjYmFrLCBtc2cpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBjaGVja3M7XG5cdCAgICB9XG5cdCAgICBjaGVja3MucHVzaCAoe2NoZWNrIDogY2Jhayxcblx0XHRcdCAgbXNnICAgOiBtc2d9KTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXHRuZXdfbWV0aG9kLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gdHJhbnNmb3Jtcztcblx0ICAgIH1cblx0ICAgIHRyYW5zZm9ybXMucHVzaChjYmFrKTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHdob1ttZXRob2RdID0gbmV3X21ldGhvZDtcbiAgICB9O1xuXG4gICAgdmFyIGdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgb3B0cykge1xuXHRpZiAodHlwZW9mIChwYXJhbSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtZXRob2RzLmFkZF9iYXRjaCAocGFyYW0pO1xuXHQgICAgZm9yICh2YXIgcCBpbiBwYXJhbSkge1xuXHRcdGF0dGFjaF9tZXRob2QgKHAsIG9wdHMpO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgbWV0aG9kcy5hZGQgKHBhcmFtLCBvcHRzLmRlZmF1bHRfdmFsdWUpO1xuXHQgICAgYXR0YWNoX21ldGhvZCAocGFyYW0sIG9wdHMpO1xuXHR9XG4gICAgfTtcblxuICAgIGFwaS5nZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmfSk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLmdldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9zZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgZ2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBzZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fc2V0dGVyIDogb25fc2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5zZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fZ2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIHNldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgZ2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX2dldHRlciA6IG9uX2dldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kID0gZnVuY3Rpb24gKG5hbWUsIGNiYWspIHtcblx0aWYgKHR5cGVvZiAobmFtZSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBmb3IgKHZhciBwIGluIG5hbWUpIHtcblx0XHR3aG9bcF0gPSBuYW1lW3BdO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgd2hvW25hbWVdID0gY2Jhaztcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXBpO1xuICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYXBpOyIsInZhciBodHRwID0gcmVxdWlyZShcImh0dHBwbGVhc2VcIik7XG52YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBwcm9taXNlcyA9IHJlcXVpcmUoJ2h0dHBwbGVhc2UtcHJvbWlzZXMnKTtcbnZhciBQcm9taXNlID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xudmFyIGpzb24gPSByZXF1aXJlKFwiaHR0cHBsZWFzZS9wbHVnaW5zL2pzb25cIik7XG5odHRwID0gaHR0cC51c2UoanNvbikudXNlKHByb21pc2VzKFByb21pc2UpKTtcblxudG50X2VSZXN0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBQcmVmaXhlcyB0byB1c2UgdGhlIFJFU1QgQVBJLlxuICAgIC8vIFRoZXNlIGFyZSBtb2RpZmllZCBpbiB0aGUgbG9jYWxSRVNUIHNldHRlclxuICAgIHZhciBwcmVmaXggPSBcImh0dHBzOi8vcmVzdC5lbnNlbWJsLm9yZ1wiO1xuICAgIHZhciBwcmVmaXhfcmVnaW9uID0gcHJlZml4ICsgXCIvb3ZlcmxhcC9yZWdpb24vXCI7XG4gICAgdmFyIHByZWZpeF9lbnNnZW5lID0gcHJlZml4ICsgXCIvbG9va3VwL2lkL1wiO1xuICAgIHZhciBwcmVmaXhfeHJlZiA9IHByZWZpeCArIFwiL3hyZWZzL3N5bWJvbC9cIjtcbiAgICB2YXIgcHJlZml4X2hvbW9sb2d1ZXMgPSBwcmVmaXggKyBcIi9ob21vbG9neS9pZC9cIjtcbiAgICB2YXIgcHJlZml4X2Nocl9pbmZvID0gcHJlZml4ICsgXCIvaW5mby9hc3NlbWJseS9cIjtcbiAgICB2YXIgcHJlZml4X2Fsbl9yZWdpb24gPSBwcmVmaXggKyBcIi9hbGlnbm1lbnQvcmVnaW9uL1wiO1xuICAgIHZhciBwcmVmaXhfZ2VuZV90cmVlID0gcHJlZml4ICsgXCIvZ2VuZXRyZWUvaWQvXCI7XG4gICAgdmFyIHByZWZpeF9hc3NlbWJseSA9IHByZWZpeCArIFwiL2luZm8vYXNzZW1ibHkvXCI7XG4gICAgdmFyIHByZWZpeF9zZXF1ZW5jZSA9IHByZWZpeCArIFwiL3NlcXVlbmNlL3JlZ2lvbi9cIjtcbiAgICB2YXIgcHJlZml4X3ZhcmlhdGlvbiA9IHByZWZpeCArIFwiL3ZhcmlhdGlvbi9cIjtcblxuICAgIC8vIE51bWJlciBvZiBjb25uZWN0aW9ucyBtYWRlIHRvIHRoZSBkYXRhYmFzZVxuICAgIHZhciBjb25uZWN0aW9ucyA9IDA7XG5cbiAgICB2YXIgZVJlc3QgPSBmdW5jdGlvbigpIHtcbiAgICB9O1xuXG4gICAgLy8gTGltaXRzIGltcG9zZWQgYnkgdGhlIGVuc2VtYmwgUkVTVCBBUElcbiAgICBlUmVzdC5saW1pdHMgPSB7XG4gICAgICAgIHJlZ2lvbiA6IDUwMDAwMDBcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChlUmVzdCk7XG5cbiAgICAvKiogPHN0cm9uZz5sb2NhbFJFU1Q8L3N0cm9uZz4gcG9pbnRzIHRoZSBxdWVyaWVzIHRvIGEgbG9jYWwgUkVTVCBzZXJ2aWNlIHRvIGRlYnVnLlxuXHRUT0RPOiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgcmVtb3ZlZCBpbiBcInByb2R1Y3Rpb25cIlxuICAgICovXG4gICAgYXBpLm1ldGhvZCAoJ2xvY2FsUkVTVCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcmVmaXggPSBcImh0dHA6Ly8xMjcuMC4wLjE6MzAwMFwiO1xuICAgICAgICBwcmVmaXhfcmVnaW9uID0gcHJlZml4ICsgXCIvb3ZlcmxhcC9yZWdpb24vXCI7XG4gICAgICAgIHByZWZpeF9lbnNnZW5lID0gcHJlZml4ICsgXCIvbG9va3VwL2lkL1wiO1xuICAgICAgICBwcmVmaXhfeHJlZiA9IHByZWZpeCArIFwiL3hyZWZzL3N5bWJvbC9cIjtcbiAgICAgICAgcHJlZml4X2hvbW9sb2d1ZXMgPSBwcmVmaXggKyBcIi9ob21vbG9neS9pZC9cIjtcblxuICAgICAgICByZXR1cm4gZVJlc3Q7XG4gICAgfSk7XG5cbiAgICAvKiogPHN0cm9uZz5jYWxsPC9zdHJvbmc+IG1ha2VzIGFuIGFzeW5jaHJvbm91cyBjYWxsIHRvIHRoZSBlbnNlbWJsIFJFU1Qgc2VydmljZS5cblx0QHBhcmFtIHtPYmplY3R9IG9iamVjdCAtIEEgbGl0ZXJhbCBvYmplY3QgY29udGFpbmluZyB0aGUgZm9sbG93aW5nIGZpZWxkczpcblx0PHVsPlxuXHQ8bGk+dXJsID0+IFRoZSByZXN0IFVSTC4gVGhpcyBpcyByZXR1cm5lZCBieSB7QGxpbmsgZVJlc3QudXJsfTwvbGk+XG5cdDxsaT5zdWNjZXNzID0+IEEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFJFU1QgcXVlcnkgaXMgc3VjY2Vzc2Z1bCAoaS5lLiB0aGUgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyIGlzIGEgZGVmaW5lZCB2YWx1ZSBhbmQgbm8gZXJyb3IgaGFzIGJlZW4gcmV0dXJuZWQpPC9saT5cblx0PGxpPmVycm9yID0+IEEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFJFU1QgcXVlcnkgcmV0dXJucyBhbiBlcnJvclxuXHQ8L3VsPlxuICAgICovXG4gICAgYXBpLm1ldGhvZCAoJ2NhbGwnLCBmdW5jdGlvbiAobXl1cmwsIGRhdGEpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIHJldHVybiBodHRwLnBvc3Qoe1xuXHRcdFwidXJsXCI6IG15dXJsLFxuXHRcdFwiYm9keVwiIDogZGF0YVxuXHQgICAgfSlcblx0fVxuXHRyZXR1cm4gaHR0cC5nZXQoe1xuXHQgICAgXCJ1cmxcIjogbXl1cmxcblx0fSk7XG4gICAgfSk7XG4gICAgLy8gYXBpLm1ldGhvZCAoJ2NhbGwnLCBmdW5jdGlvbiAob2JqKSB7XG4gICAgLy8gXHR2YXIgdXJsID0gb2JqLnVybDtcbiAgICAvLyBcdHZhciBvbl9zdWNjZXNzID0gb2JqLnN1Y2Nlc3M7XG4gICAgLy8gXHR2YXIgb25fZXJyb3IgICA9IG9iai5lcnJvcjtcbiAgICAvLyBcdGNvbm5lY3Rpb25zKys7XG4gICAgLy8gXHRodHRwLmdldCh7XG4gICAgLy8gXHQgICAgXCJ1cmxcIiA6IHVybFxuICAgIC8vIFx0fSwgZnVuY3Rpb24gKGVycm9yLCByZXNwKSB7XG4gICAgLy8gXHQgICAgaWYgKHJlc3AgIT09IHVuZGVmaW5lZCAmJiBlcnJvciA9PSBudWxsICYmIG9uX3N1Y2Nlc3MgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFx0XHRvbl9zdWNjZXNzKEpTT04ucGFyc2UocmVzcC5ib2R5KSk7XG4gICAgLy8gXHQgICAgfVxuICAgIC8vIFx0ICAgIGlmIChlcnJvciAhPT0gbnVsbCAmJiBvbl9lcnJvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gXHRcdG9uX2Vycm9yKGVycm9yKTtcbiAgICAvLyBcdCAgICB9XG4gICAgLy8gXHR9KTtcbiAgICAvLyB9KTtcblxuXG4gICAgZVJlc3QudXJsID0ge307XG4gICAgdmFyIHVybF9hcGkgPSBhcGlqcyAoZVJlc3QudXJsKTtcblx0LyoqIGVSZXN0LnVybC48c3Ryb25nPnJlZ2lvbjwvc3Ryb25nPiByZXR1cm5zIHRoZSBlbnNlbWJsIFJFU1QgdXJsIHRvIHJldHJpZXZlIHRoZSBnZW5lcyBpbmNsdWRlZCBpbiB0aGUgc3BlY2lmaWVkIHJlZ2lvblxuXHQgICAgQHBhcmFtIHtvYmplY3R9IG9iaiAtIEFuIG9iamVjdCBsaXRlcmFsIHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6PGJyIC8+XG48dWw+XG48bGk+c3BlY2llcyA6IFRoZSBzcGVjaWVzIHRoZSByZWdpb24gcmVmZXJzIHRvPC9saT5cbjxsaT5jaHIgICAgIDogVGhlIGNociAob3Igc2VxX3JlZ2lvbiBuYW1lKTwvbGk+XG48bGk+ZnJvbSAgICA6IFRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgcmVnaW9uIGluIHRoZSBjaHI8L2xpPlxuPGxpPnRvICAgICAgOiBUaGUgZW5kIHBvc2l0aW9uIG9mIHRoZSByZWdpb24gKGZyb20gPCB0byBhbHdheXMpPC9saT5cbjwvdWw+XG4gICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSB1cmwgdG8gcXVlcnkgdGhlIEVuc2VtYmwgUkVTVCBzZXJ2ZXIuIEZvciBhbiBleGFtcGxlIG9mIG91dHB1dCBvZiB0aGVzZSB1cmxzIHNlZSB0aGUge0BsaW5rIGh0dHA6Ly9iZXRhLnJlc3QuZW5zZW1ibC5vcmcvZmVhdHVyZS9yZWdpb24vaG9tb19zYXBpZW5zLzEzOjMyODg5NjExLTMyOTczODA1Lmpzb24/ZmVhdHVyZT1nZW5lfEVuc2VtYmwgUkVTVCBBUEkgZXhhbXBsZX1cblx0ICAgIEBleGFtcGxlXG5lUmVzdC5jYWxsICggdXJsICAgICA6IGVSZXN0LnVybC5yZWdpb24gKHsgc3BlY2llcyA6IFwiaG9tb19zYXBpZW5zXCIsIGNociA6IFwiMTNcIiwgZnJvbSA6IDMyODg5NjExLCB0byA6IDMyOTczODA1IH0pLFxuICAgICAgICAgICAgIHN1Y2Nlc3MgOiBjYWxsYmFjayxcbiAgICAgICAgICAgICBlcnJvciAgIDogY2FsbGJhY2tcblx0ICAgKTtcblx0ICovXG4gICAgIHVybF9hcGkubWV0aG9kICgncmVnaW9uJywgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICB2YXIgZmVhdHVyZXMgPSBvYmouZmVhdHVyZXMgfHwgW1wiZ2VuZVwiXTtcbiAgICAgICAgIHZhciBmZWF0dXJlX29wdGlvbnMgPSBmZWF0dXJlcy5tYXAgKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgcmV0dXJuIFwiZmVhdHVyZT1cIiArIGQ7XG4gICAgICAgICB9KTtcbiAgICAgICAgIHZhciBmZWF0dXJlX29wdGlvbnNfdXJsID0gZmVhdHVyZV9vcHRpb25zLmpvaW4oXCImXCIpO1xuICAgICAgICAgcmV0dXJuIHByZWZpeF9yZWdpb24gK1xuICAgICAgICAgb2JqLnNwZWNpZXMgK1xuICAgICAgICAgXCIvXCIgK1xuICAgICAgICAgb2JqLmNociArXG4gICAgICAgICBcIjpcIiArXG4gICAgICAgICBvYmouZnJvbSArXG4gICAgICAgICBcIi1cIiArIG9iai50byArXG4gICAgICAgICAvL1wiLmpzb24/ZmVhdHVyZT1nZW5lXCI7XG4gICAgICAgICBcIi5qc29uP1wiICsgZmVhdHVyZV9vcHRpb25zX3VybDtcbiAgICAgfSk7XG5cblx0LyoqIGVSZXN0LnVybC48c3Ryb25nPnNwZWNpZXNfZ2VuZTwvc3Ryb25nPiByZXR1cm5zIHRoZSBlbnNlbWJsIFJFU1QgdXJsIHRvIHJldHJpZXZlIHRoZSBlbnNlbWJsIGdlbmUgYXNzb2NpYXRlZCB3aXRoXG5cdCAgICB0aGUgZ2l2ZW4gbmFtZSBpbiB0aGUgc3BlY2lmaWVkIHNwZWNpZXMuXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5zcGVjaWVzICAgOiBUaGUgc3BlY2llcyB0aGUgcmVnaW9uIHJlZmVycyB0bzwvbGk+XG48bGk+Z2VuZV9uYW1lIDogVGhlIG5hbWUgb2YgdGhlIGdlbmU8L2xpPlxuPC91bD5cbiAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIHVybCB0byBxdWVyeSB0aGUgRW5zZW1ibCBSRVNUIHNlcnZlci4gRm9yIGFuIGV4YW1wbGUgb2Ygb3V0cHV0IG9mIHRoZXNlIHVybHMgc2VlIHRoZSB7QGxpbmsgaHR0cDovL2JldGEucmVzdC5lbnNlbWJsLm9yZy94cmVmcy9zeW1ib2wvaHVtYW4vQlJDQTIuanNvbj9vYmplY3RfdHlwZT1nZW5lfEVuc2VtYmwgUkVTVCBBUEkgZXhhbXBsZX1cblx0ICAgIEBleGFtcGxlXG5lUmVzdC5jYWxsICggdXJsICAgICA6IGVSZXN0LnVybC5zcGVjaWVzX2dlbmUgKHsgc3BlY2llcyA6IFwiaHVtYW5cIiwgZ2VuZV9uYW1lIDogXCJCUkNBMlwiIH0pLFxuICAgICAgICAgICAgIHN1Y2Nlc3MgOiBjYWxsYmFjayxcbiAgICAgICAgICAgICBlcnJvciAgIDogY2FsbGJhY2tcblx0ICAgKTtcblx0ICovXG4gICAgdXJsX2FwaS5tZXRob2QgKCd4cmVmJywgZnVuY3Rpb24gKG9iaikge1xuXHRyZXR1cm4gcHJlZml4X3hyZWYgK1xuXHQgICAgb2JqLnNwZWNpZXMgICtcblx0ICAgIFwiL1wiICtcblx0ICAgIG9iai5uYW1lICtcblx0ICAgIFwiLmpzb24/b2JqZWN0X3R5cGU9Z2VuZVwiO1xuICAgIH0pO1xuXG5cdC8qKiBlUmVzdC51cmwuPHN0cm9uZz5ob21vbG9ndWVzPC9zdHJvbmc+IHJldHVybnMgdGhlIGVuc2VtYmwgUkVTVCB1cmwgdG8gcmV0cmlldmUgdGhlIGhvbW9sb2d1ZXMgKG9ydGhvbG9ndWVzICsgcGFyYWxvZ3Vlcykgb2YgdGhlIGdpdmVuIGVuc2VtYmwgSUQuXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5pZCA6IFRoZSBFbnNlbWJsIElEIG9mIHRoZSBnZW5lPC9saT5cbjwvdWw+XG4gICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSB1cmwgdG8gcXVlcnkgdGhlIEVuc2VtYmwgUkVTVCBzZXJ2ZXIuIEZvciBhbiBleGFtcGxlIG9mIG91dHB1dCBvZiB0aGVzZSB1cmxzIHNlZSB0aGUge0BsaW5rIGh0dHA6Ly9iZXRhLnJlc3QuZW5zZW1ibC5vcmcvaG9tb2xvZ3kvaWQvRU5TRzAwMDAwMTM5NjE4Lmpzb24/Zm9ybWF0PWNvbmRlbnNlZDtzZXF1ZW5jZT1ub25lO3R5cGU9YWxsfEVuc2VtYmwgUkVTVCBBUEkgZXhhbXBsZX1cblx0ICAgIEBleGFtcGxlXG5lUmVzdC5jYWxsICggdXJsICAgICA6IGVSZXN0LnVybC5ob21vbG9ndWVzICh7IGlkIDogXCJFTlNHMDAwMDAxMzk2MThcIiB9KSxcbiAgICAgICAgICAgICBzdWNjZXNzIDogY2FsbGJhY2ssXG4gICAgICAgICAgICAgZXJyb3IgICA6IGNhbGxiYWNrXG5cdCAgICk7XG5cdCAqL1xuICAgIHVybF9hcGkubWV0aG9kICgnaG9tb2xvZ3VlcycsIGZ1bmN0aW9uKG9iaikge1xuXHRyZXR1cm4gcHJlZml4X2hvbW9sb2d1ZXMgK1xuXHQgICAgb2JqLmlkICtcblx0ICAgIFwiLmpzb24/Zm9ybWF0PWNvbmRlbnNlZDtzZXF1ZW5jZT1ub25lO3R5cGU9YWxsXCI7XG4gICAgfSk7XG5cblx0LyoqIGVSZXN0LnVybC48c3Ryb25nPmdlbmU8L3N0cm9uZz4gcmV0dXJucyB0aGUgZW5zZW1ibCBSRVNUIHVybCB0byByZXRyaWV2ZSB0aGUgZW5zZW1ibCBnZW5lIGFzc29jaWF0ZWQgd2l0aFxuXHQgICAgdGhlIGdpdmVuIElEXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5pZCA6IFRoZSBuYW1lIG9mIHRoZSBnZW5lPC9saT5cbjxsaT5leHBhbmQgOiBpZiB0cmFuc2NyaXB0cyBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHJlc3BvbnNlIChkZWZhdWx0IHRvIDApPC9saT5cbjwvdWw+XG4gICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSB1cmwgdG8gcXVlcnkgdGhlIEVuc2VtYmwgUkVTVCBzZXJ2ZXIuIEZvciBhbiBleGFtcGxlIG9mIG91dHB1dCBvZiB0aGVzZSB1cmxzIHNlZSB0aGUge0BsaW5rIGh0dHA6Ly9iZXRhLnJlc3QuZW5zZW1ibC5vcmcvbG9va3VwL0VOU0cwMDAwMDEzOTYxOC5qc29uP2Zvcm1hdD1mdWxsfEVuc2VtYmwgUkVTVCBBUEkgZXhhbXBsZX1cblx0ICAgIEBleGFtcGxlXG5lUmVzdC5jYWxsICggdXJsICAgICA6IGVSZXN0LnVybC5nZW5lICh7IGlkIDogXCJFTlNHMDAwMDAxMzk2MThcIiB9KSxcbiAgICAgICAgICAgICBzdWNjZXNzIDogY2FsbGJhY2ssXG4gICAgICAgICAgICAgZXJyb3IgICA6IGNhbGxiYWNrXG5cdCAgICk7XG5cdCAqL1xuICAgIHVybF9hcGkubWV0aG9kICgnZ2VuZScsIGZ1bmN0aW9uKG9iaikge1xuXHR2YXIgdXJsID0gcHJlZml4X2Vuc2dlbmUgKyBvYmouaWQgKyBcIi5qc29uP2Zvcm1hdD1mdWxsXCI7XG5cdGlmIChvYmouZXhwYW5kICYmIG9iai5leHBhbmQgPT09IDEpIHtcblx0ICAgIHVybCA9IHVybCArIFwiJmV4cGFuZD0xXCI7XG5cdH1cblx0cmV0dXJuIHVybDtcbiAgICB9KTtcblxuXHQvKiogZVJlc3QudXJsLjxzdHJvbmc+Y2hyX2luZm88L3N0cm9uZz4gcmV0dXJucyB0aGUgZW5zZW1ibCBSRVNUIHVybCB0byByZXRyaWV2ZSB0aGUgaW5mb3JtYXRpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBjaHJvbW9zb21lIChzZXFfcmVnaW9uIGluIEVuc2VtYmwgbm9tZW5jbGF0dXJlKS5cblx0ICAgIEBwYXJhbSB7b2JqZWN0fSBvYmogLSBBbiBvYmplY3QgbGl0ZXJhbCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOjxiciAvPlxuPHVsPlxuPGxpPnNwZWNpZXMgOiBUaGUgc3BlY2llcyB0aGUgY2hyIChvciBzZXFfcmVnaW9uKSBiZWxvbmdzIHRvXG48bGk+Y2hyICAgICA6IFRoZSBuYW1lIG9mIHRoZSBjaHIgKG9yIHNlcV9yZWdpb24pPC9saT5cbjwvdWw+XG4gICAgICAgICAgICBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSB1cmwgdG8gcXVlcnkgdGhlIEVuc2VtYmwgUkVTVCBzZXJ2ZXIuIEZvciBhbiBleGFtcGxlIG9mIG91dHB1dCBvZiB0aGVzZSB1cmxzIHNlZSB0aGUge0BsaW5rIGh0dHA6Ly9iZXRhLnJlc3QuZW5zZW1ibC5vcmcvYXNzZW1ibHkvaW5mby9ob21vX3NhcGllbnMvMTMuanNvbj9mb3JtYXQ9ZnVsbHxFbnNlbWJsIFJFU1QgQVBJIGV4YW1wbGV9XG5cdCAgICBAZXhhbXBsZVxuZVJlc3QuY2FsbCAoIHVybCAgICAgOiBlUmVzdC51cmwuY2hyX2luZm8gKHsgc3BlY2llcyA6IFwiaG9tb19zYXBpZW5zXCIsIGNociA6IFwiMTNcIiB9KSxcbiAgICAgICAgICAgICBzdWNjZXNzIDogY2FsbGJhY2ssXG4gICAgICAgICAgICAgZXJyb3IgICA6IGNhbGxiYWNrXG5cdCAgICk7XG5cdCAqL1xuICAgIHVybF9hcGkubWV0aG9kICgnY2hyX2luZm8nLCBmdW5jdGlvbihvYmopIHtcblx0cmV0dXJuIHByZWZpeF9jaHJfaW5mbyArXG5cdCAgICBvYmouc3BlY2llcyArXG5cdCAgICBcIi9cIiArXG5cdCAgICBvYmouY2hyICtcblx0ICAgIFwiLmpzb24/Zm9ybWF0PWZ1bGxcIjtcbiAgICB9KTtcblxuXHQvLyBUT0RPOiBGb3Igbm93LCBpdCBvbmx5IHdvcmtzIHdpdGggc3BlY2llc19zZXQgYW5kIG5vdCBzcGVjaWVzX3NldF9ncm91cHNcblx0Ly8gU2hvdWxkIGJlIGV4dGVuZGVkIGZvciB3aWRlciB1c2VcbiAgICB1cmxfYXBpLm1ldGhvZCAoJ2Fsbl9ibG9jaycsIGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHVybCA9IHByZWZpeF9hbG5fcmVnaW9uICtcblx0ICAgIG9iai5zcGVjaWVzICtcblx0ICAgIFwiL1wiICtcblx0ICAgIG9iai5jaHIgK1xuXHQgICAgXCI6XCIgK1xuXHQgICAgb2JqLmZyb20gK1xuXHQgICAgXCItXCIgK1xuXHQgICAgb2JqLnRvICtcblx0ICAgIFwiLmpzb24/bWV0aG9kPVwiICtcblx0ICAgIG9iai5tZXRob2Q7XG5cblx0Zm9yICh2YXIgaT0wOyBpPG9iai5zcGVjaWVzX3NldC5sZW5ndGg7IGkrKykge1xuXHQgICAgdXJsICs9IFwiJnNwZWNpZXNfc2V0PVwiICsgb2JqLnNwZWNpZXNfc2V0W2ldO1xuXHR9XG5cblx0cmV0dXJuIHVybDtcbiAgICB9KTtcblxuICAgIHVybF9hcGkubWV0aG9kICgnc2VxdWVuY2UnLCBmdW5jdGlvbiAob2JqKSB7XG5cdHJldHVybiBwcmVmaXhfc2VxdWVuY2UgK1xuXHQgICAgb2JqLnNwZWNpZXMgK1xuXHQgICAgJy8nICtcblx0ICAgIG9iai5jaHIgK1xuXHQgICAgJzonICtcblx0ICAgIG9iai5mcm9tICtcblx0ICAgICcuLicgK1xuXHQgICAgb2JqLnRvICtcblx0ICAgICc/Y29udGVudC10eXBlPWFwcGxpY2F0aW9uL2pzb24nO1xuICAgIH0pO1xuXG4gICAgdXJsX2FwaS5tZXRob2QgKCd2YXJpYXRpb24nLCBmdW5jdGlvbiAob2JqKSB7XG5cdC8vIEZvciBub3csIG9ubHkgcG9zdCByZXF1ZXN0cyBhcmUgaW5jbHVkZWRcblx0cmV0dXJuIHByZWZpeF92YXJpYXRpb24gK1xuXHQgICAgb2JqLnNwZWNpZXM7XG4gICAgfSk7XG5cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ2dlbmVfdHJlZScsIGZ1bmN0aW9uIChvYmopIHtcblx0cmV0dXJuIHByZWZpeF9nZW5lX3RyZWUgK1xuXHQgICAgb2JqLmlkICtcblx0ICAgIFwiLmpzb24/c2VxdWVuY2U9XCIgK1xuXHQgICAgKChvYmouc2VxdWVuY2UgfHwgb2JqLmFsaWduZWQpID8gMSA6IFwibm9uZVwiKSArXG5cdCAgICAob2JqLmFsaWduZWQgPyAnJmFsaWduZWQ9MScgOiAnJyk7XG4gICAgfSk7XG5cbiAgICB1cmxfYXBpLm1ldGhvZCgnYXNzZW1ibHknLCBmdW5jdGlvbiAob2JqKSB7XG5cdHJldHVybiBwcmVmaXhfYXNzZW1ibHkgK1xuXHQgICAgb2JqLnNwZWNpZXMgK1xuXHQgICAgXCIuanNvblwiO1xuICAgIH0pO1xuXG5cbiAgICBhcGkubWV0aG9kICgnY29ubmVjdGlvbnMnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGNvbm5lY3Rpb25zO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGVSZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2VSZXN0O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB0b29sdGlwID0gcmVxdWlyZShcIi4vc3JjL3Rvb2x0aXAuanNcIik7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcblxudmFyIHRvb2x0aXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgZHJhZyA9IGQzLmJlaGF2aW9yLmRyYWcoKTtcbiAgICB2YXIgdG9vbHRpcF9kaXY7XG5cbiAgICB2YXIgY29uZiA9IHtcblx0YmFja2dyb3VuZF9jb2xvciA6IFwid2hpdGVcIixcblx0Zm9yZWdyb3VuZF9jb2xvciA6IFwiYmxhY2tcIixcblx0cG9zaXRpb24gOiBcInJpZ2h0XCIsXG5cdGFsbG93X2RyYWcgOiB0cnVlLFxuXHRzaG93X2Nsb3NlciA6IHRydWUsXG5cdGZpbGwgOiBmdW5jdGlvbiAoKSB7IHRocm93IFwiZmlsbCBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIjsgfSxcblx0d2lkdGggOiAxODAsXG5cdGlkIDogMVxuICAgIH07XG5cbiAgICB2YXIgdCA9IGZ1bmN0aW9uIChkYXRhLCBldmVudCkge1xuXHRkcmFnXG5cdCAgICAub3JpZ2luKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHt4OnBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcImxlZnRcIikpLFxuXHRcdFx0eTpwYXJzZUludChkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJ0b3BcIikpXG5cdFx0ICAgICAgIH07XG5cdCAgICB9KVxuXHQgICAgLm9uKFwiZHJhZ1wiLCBmdW5jdGlvbigpIHtcblx0XHRpZiAoY29uZi5hbGxvd19kcmFnKSB7XG5cdFx0ICAgIGQzLnNlbGVjdCh0aGlzKVxuXHRcdFx0LnN0eWxlKFwibGVmdFwiLCBkMy5ldmVudC54ICsgXCJweFwiKVxuXHRcdFx0LnN0eWxlKFwidG9wXCIsIGQzLmV2ZW50LnkgKyBcInB4XCIpO1xuXHRcdH1cblx0ICAgIH0pO1xuXG5cdC8vIFRPRE86IFdoeSBkbyB3ZSBuZWVkIHRoZSBkaXYgZWxlbWVudD9cblx0Ly8gSXQgbG9va3MgbGlrZSBpZiB3ZSBhbmNob3IgdGhlIHRvb2x0aXAgaW4gdGhlIFwiYm9keVwiXG5cdC8vIFRoZSB0b29sdGlwIGlzIG5vdCBsb2NhdGVkIGluIHRoZSByaWdodCBwbGFjZSAoYXBwZWFycyBhdCB0aGUgYm90dG9tKVxuXHQvLyBTZWUgY2xpZW50cy90b29sdGlwc190ZXN0Lmh0bWwgZm9yIGFuIGV4YW1wbGVcblx0dmFyIGNvbnRhaW5lckVsZW0gPSBzZWxlY3RBbmNlc3RvciAodGhpcywgXCJkaXZcIik7XG5cdGlmIChjb250YWluZXJFbGVtID09PSB1bmRlZmluZWQpIHtcblx0ICAgIC8vIFdlIHJlcXVpcmUgYSBkaXYgZWxlbWVudCBhdCBzb21lIHBvaW50IHRvIGFuY2hvciB0aGUgdG9vbHRpcFxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dG9vbHRpcF9kaXYgPSBkMy5zZWxlY3QoY29udGFpbmVyRWxlbSlcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdG9vbHRpcFwiKVxuXHQgICAgLmNsYXNzZWQoXCJ0bnRfdG9vbHRpcF9hY3RpdmVcIiwgdHJ1ZSkgIC8vIFRPRE86IElzIHRoaXMgbmVlZGVkL3VzZWQ/Pz9cblx0ICAgIC5jYWxsKGRyYWcpO1xuXG5cdC8vIHByZXYgdG9vbHRpcHMgd2l0aCB0aGUgc2FtZSBoZWFkZXJcblx0ZDMuc2VsZWN0KFwiI3RudF90b29sdGlwX1wiICsgY29uZi5pZCkucmVtb3ZlKCk7XG5cblx0aWYgKChkMy5ldmVudCA9PT0gbnVsbCkgJiYgKGV2ZW50KSkge1xuXHQgICAgZDMuZXZlbnQgPSBldmVudDtcblx0fVxuXHR2YXIgZDNtb3VzZSA9IGQzLm1vdXNlKGNvbnRhaW5lckVsZW0pO1xuXHRkMy5ldmVudCA9IG51bGw7XG5cblx0dmFyIG9mZnNldCA9IDA7XG5cdGlmIChjb25mLnBvc2l0aW9uID09PSBcImxlZnRcIikge1xuXHQgICAgb2Zmc2V0ID0gY29uZi53aWR0aDtcblx0fVxuXHRcblx0dG9vbHRpcF9kaXYuYXR0cihcImlkXCIsIFwidG50X3Rvb2x0aXBfXCIgKyBjb25mLmlkKTtcblx0XG5cdC8vIFdlIHBsYWNlIHRoZSB0b29sdGlwXG5cdHRvb2x0aXBfZGl2XG5cdCAgICAuc3R5bGUoXCJsZWZ0XCIsIChkM21vdXNlWzBdKSArIFwicHhcIilcblx0ICAgIC5zdHlsZShcInRvcFwiLCAoZDNtb3VzZVsxXSkgKyBcInB4XCIpO1xuXG5cdC8vIENsb3NlXG5cdGlmIChjb25mLnNob3dfY2xvc2VyKSB7XG5cdCAgICB0b29sdGlwX2Rpdi5hcHBlbmQoXCJzcGFuXCIpXG5cdFx0LnN0eWxlKFwicG9zaXRpb25cIiwgXCJhYnNvbHV0ZVwiKVxuXHRcdC5zdHlsZShcInJpZ2h0XCIsIFwiLTEwcHhcIilcblx0XHQuc3R5bGUoXCJ0b3BcIiwgXCItMTBweFwiKVxuXHRcdC5hcHBlbmQoXCJpbWdcIilcblx0XHQuYXR0cihcInNyY1wiLCB0b29sdGlwLmltYWdlcy5jbG9zZSlcblx0XHQuYXR0cihcIndpZHRoXCIsIFwiMjBweFwiKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMjBweFwiKVxuXHRcdC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgdC5jbG9zZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0Y29uZi5maWxsLmNhbGwodG9vbHRpcF9kaXYsIGRhdGEpO1xuXG5cdC8vIHJldHVybiB0aGlzIGhlcmU/XG5cdHJldHVybiB0O1xuICAgIH07XG5cbiAgICAvLyBnZXRzIHRoZSBmaXJzdCBhbmNlc3RvciBvZiBlbGVtIGhhdmluZyB0YWduYW1lIFwidHlwZVwiXG4gICAgLy8gZXhhbXBsZSA6IHZhciBteWRpdiA9IHNlbGVjdEFuY2VzdG9yKG15ZWxlbSwgXCJkaXZcIik7XG4gICAgZnVuY3Rpb24gc2VsZWN0QW5jZXN0b3IgKGVsZW0sIHR5cGUpIHtcblx0dHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0aWYgKGVsZW0ucGFyZW50Tm9kZSA9PT0gbnVsbCkge1xuXHQgICAgY29uc29sZS5sb2coXCJObyBtb3JlIHBhcmVudHNcIik7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHZhciB0YWdOYW1lID0gZWxlbS5wYXJlbnROb2RlLnRhZ05hbWU7XG5cblx0aWYgKCh0YWdOYW1lICE9PSB1bmRlZmluZWQpICYmICh0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUpKSB7XG5cdCAgICByZXR1cm4gZWxlbS5wYXJlbnROb2RlO1xuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIHNlbGVjdEFuY2VzdG9yIChlbGVtLnBhcmVudE5vZGUsIHR5cGUpO1xuXHR9XG4gICAgfVxuICAgIFxuICAgIHZhciBhcGkgPSBhcGlqcyh0KVxuXHQuZ2V0c2V0KGNvbmYpO1xuICAgIGFwaS5jaGVjaygncG9zaXRpb24nLCBmdW5jdGlvbiAodmFsKSB7XG5cdHJldHVybiAodmFsID09PSAnbGVmdCcpIHx8ICh2YWwgPT09ICdyaWdodCcpO1xuICAgIH0sIFwiT25seSAnbGVmdCcgb3IgJ3JpZ2h0JyB2YWx1ZXMgYXJlIGFsbG93ZWQgZm9yIHBvc2l0aW9uXCIpO1xuXG4gICAgYXBpLm1ldGhvZCgnY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG5cdHRvb2x0aXBfZGl2LnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLmxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlzdCB0b29sdGlwIGlzIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcbiAgICB2YXIgd2lkdGggPSAxODA7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblx0dmFyIG9ial9pbmZvX2xpc3QgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdC8vIFRvb2x0aXAgaGVhZGVyXG5cdG9ial9pbmZvX2xpc3Rcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLnRleHQob2JqLmhlYWRlcik7XG5cblx0Ly8gVG9vbHRpcCByb3dzXG5cdHZhciB0YWJsZV9yb3dzID0gb2JqX2luZm9fbGlzdC5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGRcIilcblx0ICAgIC5zdHlsZShcInRleHQtYWxpZ25cIiwgXCJjZW50ZXJcIilcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS52YWx1ZTtcblx0ICAgIH0pXG5cdCAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkLmxpbmsgPT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICByZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKVxuXHRcdCAgICAuY2xhc3NlZChcImxpbmtcIiwgMSlcblx0XHQgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRkLmxpbmsoZC5vYmopO1xuXHRcdFx0dC5jbG9zZS5jYWxsKHRoaXMpO1xuXHRcdCAgICB9KTtcblx0ICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0O1xufTtcblxudG9vbHRpcC50YWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyB0YWJsZSB0b29sdGlwcyBhcmUgYmFzZWQgb24gZ2VuZXJhbCB0b29sdGlwc1xuICAgIHZhciB0ID0gdG9vbHRpcCgpO1xuICAgIFxuICAgIHZhciB3aWR0aCA9IDE4MDtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gVG9vbHRpcCBoZWFkZXJcblx0b2JqX2luZm9fdGFibGVcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLmF0dHIoXCJjb2xzcGFuXCIsIDIpXG5cdCAgICAudGV4dChvYmouaGVhZGVyKTtcblxuXHQvLyBUb29sdGlwIHJvd3Ncblx0dmFyIHRhYmxlX3Jvd3MgPSBvYmpfaW5mb190YWJsZS5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC5hdHRyKFwiY29sc3BhblwiLCBmdW5jdGlvbiAoZCwgaSkge1xuXHRcdGlmIChkLnZhbHVlID09PSBcIlwiKSB7XG5cdFx0ICAgIHJldHVybiAyO1xuXHRcdH1cblx0XHRyZXR1cm4gMTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQudmFsdWUgPT09IFwiXCIpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3ptZW51X2lubmVyX2hlYWRlclwiO1xuXHRcdH1cblx0XHRyZXR1cm4gXCJ0bnRfem1lbnVfY2VsbFwiO1xuXHQgICAgfSlcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS5sYWJlbDtcblx0ICAgIH0pO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0aWYgKHR5cGVvZiBvYmoucm93c1tpXS52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdCAgICBvYmoucm93c1tpXS52YWx1ZS5jYWxsKHRoaXMsIGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBvYmoucm93c1tpXS52YWx1ZTtcblx0XHR9XG5cdCAgICB9KVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC52YWx1ZSA9PT0gXCJcIikge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcykucmVtb3ZlKCk7XG5cdFx0fVxuXHQgICAgfSlcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQubGluayA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIC5jbGFzc2VkKFwibGlua1wiLCAxKVxuXHRcdCAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdGQubGluayhkLm9iaik7XG5cdFx0XHR0LmNsb3NlLmNhbGwodGhpcyk7XG5cdFx0ICAgIH0pO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAucGxhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcGxhaW4gdG9vbHRpcHMgYXJlIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0b2JqX2luZm9fdGFibGVcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9oZWFkZXJcIilcblx0ICAgIC5hcHBlbmQoXCJ0aFwiKVxuXHQgICAgLnRleHQob2JqLmhlYWRlcik7XG5cblx0b2JqX2luZm9fdGFibGVcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIilcblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLnN0eWxlKFwidGV4dC1hbGlnblwiLCBcImNlbnRlclwiKVxuXHQgICAgLmh0bWwob2JqLmJvZHkpO1xuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbi8vIFRPRE86IFRoaXMgc2hvdWxkbid0IGJlIGV4cG9zZWQgaW4gdGhlIEFQSS4gSXQgd291bGQgYmUgYmV0dGVyIHRvIGhhdmUgYXMgYSBsb2NhbCB2YXJpYWJsZVxuLy8gb3IgYWx0ZXJuYXRpdmVseSBoYXZlIHRoZSBpbWFnZXMgc29tZXdoZXJlIGVsc2UgKGFsdGhvdWdoIHRoZSBudW1iZXIgb2YgaGFyZGNvZGVkIGltYWdlcyBzaG91bGQgYmUgbGVmdCBhdCBhIG1pbmltdW0pXG50b29sdGlwLmltYWdlcyA9IHt9O1xudG9vbHRpcC5pbWFnZXMuY2xvc2UgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFRQUFBQUVBQ0FZQUFBQmNjcWhtQUFBS1EybERRMUJKUTBNZ2NISnZabWxzWlFBQWVOcWRVM2RZay9jV1B0LzNaUTlXUXRqd3NaZHNnUUFpSTZ3SXlCQlpvaENTQUdHRUVCSkF4WVdJQ2xZVUZSR2NTRlhFZ3RVS1NKMkk0cUFvdUdkQmlvaGFpMVZjT080ZjNLZTFmWHJ2N2UzNzEvdTg1NXpuL001NXp3K0FFUklta2VhaWFnQTVVb1U4T3RnZmowOUl4TW05Z0FJVlNPQUVJQkRteThKbkJjVUFBUEFEZVhoK2RMQS8vQUd2YndBQ0FIRFZMaVFTeCtIL2c3cFFKbGNBSUpFQTRDSVM1d3NCa0ZJQXlDNVV5QlFBeUJnQXNGT3paQW9BbEFBQWJIbDhRaUlBcWcwQTdQUkpQZ1VBMkttVDNCY0EyS0ljcVFnQWpRRUFtU2hISkFKQXV3QmdWWUZTTEFMQXdnQ2dyRUFpTGdUQXJnR0FXYll5UndLQXZRVUFkbzVZa0E5QVlBQ0FtVUlzekFBZ09BSUFReDRUelFNZ1RBT2dNTksvNEtsZmNJVzRTQUVBd011VnpaZEwwak1VdUpYUUduZnk4T0RpSWVMQ2JMRkNZUmNwRUdZSjVDS2NsNXNqRTBqbkEwek9EQUFBR3ZuUndmNDRQNURuNXVUaDVtYm5iTy8weGFMK2EvQnZJajRoOGQvK3ZJd0NCQUFRVHMvdjJsL2w1ZFlEY01jQnNIVy9hNmxiQU5wV0FHamYrVjB6MndtZ1dnclFldm1MZVRqOFFCNmVvVkRJUEIwY0Nnc0w3U1Zpb2IwdzQ0cysvelBoYitDTGZ2YjhRQjcrMjNyd0FIR2FRSm10d0tPRC9YRmhibmF1VW83bnl3UkNNVzczNXlQK3g0Vi8vWTRwMGVJMHNWd3NGWXJ4V0ltNFVDSk54M201VXBGRUljbVY0aExwZnpMeEg1YjlDWk4zRFFDc2hrL0FUcllIdGN0c3dIN3VBUUtMRGxqU2RnQkFmdk10akJvTGtRQVFaelF5ZWZjQUFKTy8rWTlBS3dFQXpaZWs0d0FBdk9nWVhLaVVGMHpHQ0FBQVJLQ0JLckJCQnd6QkZLekFEcHpCSGJ6QUZ3SmhCa1JBRENUQVBCQkNCdVNBSEFxaEdKWkJHVlRBT3RnRXRiQURHcUFSbXVFUXRNRXhPQTNuNEJKY2dldHdGd1pnR0o3Q0dMeUdDUVJCeUFnVFlTRTZpQkZpanRnaXpnZ1htWTRFSW1GSU5KS0FwQ0RwaUJSUklzWEljcVFDcVVKcWtWMUlJL0l0Y2hRNWpWeEErcERieUNBeWl2eUt2RWN4bElHeVVRUFVBblZBdWFnZkdvckdvSFBSZERRUFhZQ1dvbXZSR3JRZVBZQzJvcWZSUytoMWRBQjlpbzVqZ05FeERtYU0yV0ZjaklkRllJbFlHaWJIRm1QbFdEVldqelZqSFZnM2RoVWJ3SjVoN3dna0FvdUFFK3dJWG9RUXdteUNrSkJIV0V4WVE2Z2w3Q08wRXJvSVZ3bURoREhDSnlLVHFFKzBKWG9TK2NSNFlqcXhrRmhHckNidUlSNGhuaVZlSnc0VFg1TklKQTdKa3VST0NpRWxrREpKQzBsclNOdElMYVJUcEQ3U0VHbWNUQ2Jya0czSjN1UUlzb0NzSUplUnQ1QVBrRStTKzhuRDVMY1VPc1dJNGt3Sm9pUlNwSlFTU2pWbFArVUVwWjh5UXBtZ3FsSE5xWjdVQ0txSU9wOWFTVzJnZGxBdlU0ZXBFelIxbWlYTm14WkR5NlF0bzlYUW1tbG5hZmRvTCtsMHVnbmRneDVGbDlDWDBtdm9CK25uNllQMGR3d05oZzJEeDBoaUtCbHJHWHNacHhpM0dTK1pUS1lGMDVlWnlGUXcxeklibVdlWUQ1aHZWVmdxOWlwOEZaSEtFcFU2bFZhVmZwWG5xbFJWYzFVLzFYbXFDMVNyVlErclhsWjlwa1pWczFEanFRblVGcXZWcVIxVnU2azJyczVTZDFLUFVNOVJYNk8rWC8yQyttTU5zb2FGUnFDR1NLTlVZN2ZHR1kwaEZzWXlaZkZZUXRaeVZnUHJMR3VZVFdKYnN2bnNUSFlGK3h0MkwzdE1VME56cW1hc1pwRm1uZVp4elFFT3hySGc4RG5abkVyT0ljNE56bnN0QXkwL0xiSFdhcTFtclg2dE45cDYycjdhWXUxeTdSYnQ2OXJ2ZFhDZFFKMHNuZlU2YlRyM2RRbTZOcnBSdW9XNjIzWFA2ajdUWSt0NTZRbjF5dlVPNmQzUlIvVnQ5S1AxRitydjF1L1JIemN3TkFnMmtCbHNNVGhqOE15UVkraHJtR200MGZDRTRhZ1J5Mmk2a2NSb285RkpveWU0SnU2SForTTFlQmMrWnF4dkhHS3NOTjVsM0dzOFlXSnBNdHVreEtURjVMNHB6WlJybW1hNjBiVFRkTXpNeUN6Y3JOaXN5ZXlPT2RXY2E1NWh2dG04Mi95TmhhVkZuTVZLaXphTHg1YmFsbnpMQlpaTmx2ZXNtRlkrVm5sVzlWYlhyRW5XWE9zczYyM1dWMnhRRzFlYkRKczZtOHUycUsyYnJjUjJtMjNmRk9JVWp5blNLZlZUYnRveDdQenNDdXlhN0FidE9mWmg5aVgyYmZiUEhjd2NFaDNXTzNRN2ZISjBkY3gyYkhDODY2VGhOTU9weEtuRDZWZG5HMmVoYzUzek5SZW1TNURMRXBkMmx4ZFRiYWVLcDI2ZmVzdVY1UnJ1dXRLMTAvV2ptN3ViM0szWmJkVGR6RDNGZmF2N1RTNmJHOGxkd3ozdlFmVHc5MWppY2N6am5hZWJwOEx6a09jdlhuWmVXVjc3dlI1UHM1d21udFl3YmNqYnhGdmd2Y3Q3WURvK1BXWDZ6dWtEUHNZK0FwOTZuNGUrcHI0aTN6MitJMzdXZnBsK0IveWUrenY2eS8yUCtML2hlZklXOFU0RllBSEJBZVVCdllFYWdiTURhd01mQkprRXBRYzFCWTBGdXdZdkRENFZRZ3dKRFZrZmNwTnZ3QmZ5Ry9sak05eG5MSnJSRmNvSW5SVmFHL293ekNaTUh0WVJqb2JQQ044UWZtK20rVXpwekxZSWlPQkhiSWk0SDJrWm1SZjVmUlFwS2pLcUx1cFJ0Rk4wY1hUM0xOYXM1Rm43WjcyTzhZK3BqTGs3MjJxMmNuWm5yR3BzVW14ajdKdTRnTGlxdUlGNGgvaEY4WmNTZEJNa0NlMko1TVRZeEQySjQzTUM1MnlhTTV6a21sU1dkR091NWR5aXVSZm02YzdMbm5jOFdUVlprSHc0aFpnU2w3SS81WU1nUWxBdkdFL2xwMjVOSFJQeWhKdUZUMFcrb28yaVViRzN1RW84a3VhZFZwWDJPTjA3ZlVQNmFJWlBSblhHTXdsUFVpdDVrUm1TdVNQelRWWkUxdDZzejlseDJTMDVsSnlVbktOU0RXbVd0Q3ZYTUxjb3QwOW1LeXVURGVSNTVtM0tHNU9IeXZma0kvbHo4OXNWYklWTTBhTzBVcTVRRGhaTUw2Z3JlRnNZVzNpNFNMMUlXdFF6MzJiKzZ2a2pDNElXZkwyUXNGQzRzTFBZdUhoWjhlQWl2MFc3RmlPTFV4ZDNMakZkVXJwa2VHbncwbjNMYU11eWx2MVE0bGhTVmZKcWVkenlqbEtEMHFXbFF5dUNWelNWcVpUSnkyNnU5RnE1WXhWaGxXUlY3MnFYMVZ0V2Z5b1hsVitzY0t5b3J2aXdScmptNGxkT1g5Vjg5WGx0MnRyZVNyZks3ZXRJNjZUcmJxejNXYit2U3IxcVFkWFFodkFOclJ2eGplVWJYMjFLM25TaGVtcjFqczIwemNyTkF6VmhOZTFiekxhczIvS2hOcVAyZXAxL1hjdFcvYTJydDc3Wkp0cld2OTEzZS9NT2d4MFZPOTd2bE95OHRTdDRWMnU5UlgzMWJ0THVndDJQR21JYnVyL21mdDI0UjNkUHhaNlBlNlY3Qi9aRjcrdHFkRzlzM0srL3Y3SUpiVkkyalI1SU9uRGxtNEJ2MnB2dG1uZTFjRm9xRHNKQjVjRW4zNlo4ZStOUTZLSE93OXpEemQrWmY3ZjFDT3RJZVN2U09yOTFyQzJqYmFBOW9iM3Y2SXlqblIxZUhVZSt0LzkrN3pIalkzWEhOWTlYbnFDZEtEM3grZVNDaytPblpLZWVuVTQvUGRTWjNIbjNUUHlaYTExUlhiMW5ROCtlUHhkMDdreTNYL2ZKODk3bmoxM3d2SEQwSXZkaTJ5VzNTNjA5cmoxSGZuRDk0VWl2VzIvclpmZkw3VmM4cm5UMFRlczcwZS9UZi9wcXdOVnoxL2pYTGwyZmViM3Z4dXdidDI0bTNSeTRKYnIxK0hiMjdSZDNDdTVNM0YxNmozaXYvTDdhL2VvSCtnL3FmN1Qrc1dYQWJlRDRZTUJnejhOWkQrOE9DWWVlL3BULzA0Zmgwa2ZNUjlValJpT05qNTBmSHhzTkdyM3laTTZUNGFleXB4UFB5bjVXLzNucmM2dm4zLzNpKzB2UFdQelk4QXY1aTgrL3JubXA4M0x2cTZtdk9zY2p4eCs4em5rOThhYjhyYzdiZmUrNDc3cmZ4NzBmbVNqOFFQNVE4OUg2WThlbjBFLzNQdWQ4L3Z3djk0VHorNEE1SlJFQUFBQUdZa3RIUkFEL0FQOEEvNkM5cDVNQUFBQUpjRWhaY3dBQUN4TUFBQXNUQVFDYW5CZ0FBQUFIZEVsTlJRZmRDd01VRWdhTnFlWGtBQUFnQUVsRVFWUjQydTE5ZVZpVVpmZi9tUTBRbFdGbjJBVmN3SVVkQWRkY0VEUk56U1ZSTXkyVnlyYzBVM3ZUTWxPenNzVTFCZHozRlFRR21JMkJBZlNIU201Wldmb20rcGJpdm1VS2dwemZIOS9PYzgwOGdrdXZPdk1NOTdrdXJuTlpMUE9jKzN3KzkrYys5N252QjRBWk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqeG93Wk0yYk1tREZqWm40VHNSQ1kyaGRmZkNGQ1JGRmRYWjJvb3FJQ0tpb3FSQUFBaUNoQ1JCWWdJU1czU0lRaWtRaGF0R2lCQVFFQjlHK2NPWE1tRzhqR1RnRHo1ODhYVlZSVWlDc3FLaVFBSUQxOStyVDB6Smt6TWdDd0JRQVpBRWdCUUFJQTRyKy9HRmtLenhBQTZ2Nyt1ZzhBdFFCUUF3RFZMVnEwcUFrSUNLZ0ZnRnAvZi8vN2dZR0JkYk5uejBaR0FGWnFjK2ZPRlowNWMwWlNVVkVoUFgzNnRPM1pzMmZ0QWFDcHA2ZW5jMXhjWEV1RlFoSG82ZW5wMzZWTGwwQTNOemVGcmExdE14c2JtMllTaWNSV0xCWTNaVmdTSVBvUm9hYW01aThBcUs2cXFycGRWVlYxKzlLbFN4ZiszLy83ZjZjckt5dlBYcmh3NFhSNWVmbC9LaXNycndIQVgzNStmbmNDQWdLcS9mMzlhLzM5L2UvUG16Y1BHUUVJMk9iTW1TTTZjK2FNOU15Wk03WUdnNkVwQURUdjJMRmpZRXhNVEh4aVltTEgwTkRRU0JzYkcwVk5UUTFVVjFmRHZYdjNvS2FtQnVycTZxQ3VyZzRRa2Z0aUpsd1RpOFVnRW9sQUpCS0JXQ3dHaVVRQ01wa01iR3hzUUNxVnd0MjdkeThjUDM3OGlFNm5PM0Q0OE9HeVE0Y09uUWFBUDd0Mjdmb1hBRlIzN2RxMWRzR0NCY2dJUUNBMlpzd1l5ZG16WisyS2k0dWIyZG5aT1E4Wk1xUmIvLzc5RXp0MjdCaHRaMmZuZStmT0hiaHo1dzdVMU5SQWJXMHQ5M08xdGJWdzd0dzV1SDM3TmxSV1ZvSlVLb1hLeWtwbzBxUUpYTDU4R2R6ZDNlSFNwVXZNQzhTN3VibkIzYnQzd2RQVEUycHJhOEhUMHhPYU5Xc0czdDdlSUpWS1RRaENLcFdDcmEwdDJOblp3WjA3ZC80b0x5OHZWNmxVMnB5Y25KTHE2dXFyWGJwMHVlM241MWUxZGV2Vys0eFNMZEErL1BCRDBhdXZ2aXJ6OS9kM0JJQ0FYcjE2RFZtMWF0WDIzMy8vL2VxWk0yZncrUEhqV0Y1ZWp2djM3OGV5c2pKVXFWVDQ2YWVmNHRTcFU3Rjc5KzdZdTNkdnRMT3p3N0N3TUpSS3BSZ1JFWUZTcVJRakl5TlJKcE5oVkZUVVEzMTBkRFR6WnZDUEdwZkl5RWlUOFF3TEMwTTdPenZzM2JzM2R1L2VIYWRPbllwejVzeEJsVXFGWldWbFdGWldoZ2NQSHNURGh3L2p6ei8vakNkT25MaStaTW1TSGQyNmRSc0NBQUcrdnI2T3ljbkpzdW5UcDdPYWtDWFlCeDk4SUJvMWFwU05uNStmczUyZFhmRDQ4ZU9uLy9EREQ4Zk9uVHVIUC8zMEU1YVhsMk5aV1JrV0ZoYmlpaFVyY09qUW9aaVFrSUJTcVJURHc4TlJLcFZ5eVJRYkc0c3ltUXpqNCtOUkpwTmhwMDZkVUNhVFllZk9uZEhHeHFaQjM2VkxGK2JONkI4MlBzYmpTT05LNHh3ZEhXMlNCd2tKQ1Roa3lCQmNzV0lGRmhZV1lsbFpHZTdmdng4UEh6Nk1KMDZjd0pLU2toOUdqUm8xM2RiV050algxOWQ1eElnUk51Ky8vejRqQW5OWmNuS3l6TmZYMThuZTNqNWt4b3daY3lzcUt2NDRjK1lNSGpseWhKdnAwOUxTTUNrcENXTmlZa3htZEVxQ1RwMDZvWTJORFhidDJoVnRiR3p3aFJkZVFCc2JHK3pSb3dmYTJ0cGl6NTQ5Ni9XOWV2VmkzZ0o5UStQVm8wY1BrL0dsOFNaeW9IeUlpb3BDcVZTS01URXgyS2RQSDB4TlRlV1VRWGw1T1I0L2Zod1BIVHIweDZSSmsrWTJhZElreE1mSHgybllzR0V5aHNibmFNT0hENWY0K1BnNEFFRFFPKys4TS9QMDZkTy9uejU5R2c4ZE9vUmxaV1dvMFdod3dvUUoyTFZyVjVSS3Bad2NqSXVMUTVsTVpnSjI0K1JKU0VoQVcxdGJURXhNUkZ0YlcweEtTbUxlaWp5Tks0MHpqVHVmRkNoUGlBeTZkdTJLNDhlUFI0MUdnMlZsWlhqZ3dBRThkdXdZbHBlWC96NSsvUGlaQUJEazdlM3Q4UExMTDBzWU9wK2hUWjA2VlJRZkgyOEhBRjVKU1VuSlI0NGNPWHJtekJrOGZQZ3dscFdWWVhaMk5rNmFOQW50N2UyNW1UNHVMczVrY0dsbTU0TzliOSsrYUd0cml5KysrS0tKNzkrL1ArZnQ3T3lZRjVBM0hqLyt1Tko0ODBtQmxBS2ZEQ0lqSTlIZTNoNG5UWnFFMmRuWlhLM2doeDkrUUkxR2M3Ujc5KzdKQU9EVnNXTkh1MG1USnJGbHdkTzJvVU9IU3J5OXZSMFZDa1hrdW5YcnRwOC9mNzcyMkxGanVILy9mbFNwVkRoa3lCQ01pSWhBbVV5R0hUdDJSSmxNeHEwUithQ25HYUZmdjM0bTRCNHdZQURhMmRuaFN5KzlaT0lIRGh6SXZJQTlmenhwbklrY0tBOG9ML2hrMEtWTEY1Tzhpb2lJd0NGRGhuQ0Z3L0x5Y3Z6aGh4OXF2Lzc2NisxdWJtNlJYbDVlam9NR0RaSXkxRDRGbXpKbGltam8wS0cyQU9EVnYzLy9jV2ZPbkRsLzh1UkpQSGp3SUJvTUJwdzVjeVkyYmRxVW0vRnBUVS95bmdiVGVJYXZEK3dOSmMrZ1FZT1l0d0wvS0hLZ2ZPQXJCTW9mV2laUXpTQXlNaEtiTm0yS00yZk9SSVBCd0JVTHk4ckt6aWNrSkl3REFLK0JBd2ZhdnZYV1cwd04vQS9nRjN0N2V6ZTFzN05ydldMRml0WG56cDJyUFhMa0NPN2J0dytYTFZ1R3ZYcjFRcGxNaGpFeE1TYXlqZFoyeE9pUEF2M2pKdEhnd1lPWkY1Qi9VbkpvaUF3b2ozcjE2bVdTWnpFeE1TaVR5YkJYcjE2NGRPbFMzTGR2SCs3ZnZ4K1BIRGxTTzIvZXZEVzJ0cmF0UFQwOW03NzExbHRpaHVaL0JuN0hvS0NnenZ2MjdUdncyMisvNFlFREIxQ3YxK09JRVNNd0xDeU0yOXA1Mkl4UDhyNmhtWjdOa013L1RCblFNcUVoUlVCYmkyRmhZVGhpeEFqVTYvVllWbGFHaHc0ZHdsMjdkaDMwOC9QcjdPbnA2ZmptbTI4eUVuaUM5YjRVQUZ6ajQrT0hWbFJVVlA3MDAwOVlWbGFHMjdkdng0Q0FBRzZ0VC91OXROWERabnptbjZjaTZObXpwMG0vUVVSRUJMWm8wUUszYmR1RysvYnR3NE1IRDJKSlNVbGxlSGo0VUFCd2ZlbWxsMWhkNERIQUx3TUF4V3V2dlRicGp6Lyt1SDMwNkZIY3QyOGZmdjMxMXlpWHl6RXFLb3FUWWJhMnR0aTdkKy9IbXZFWnlKbi9KK1R3S0VWQStVZkxncWlvS0pUTDVmajExMTl6UzRJREJ3N2NIang0OEw4QVFERmd3QURXTS9BSThIdE5telp0NXJsejUrNGRPblFJOSszYmgrKysrNjdKV3I5NzkrNG1jcXhmdjM0bVRNMUF6L3l6SkFQS005bzlvRHpzM3IyN1NXM2czWGZmNVVpZ3ZMejgzcmh4NDJZQ2dCY2pnWWVBLytPUFA1NzcrKysvM3o5NDhDQVdGQlRnMkxGanVTMFlZL0QzNmRQSEJQeHNyYy84ODY0TkdKTUE1U09SQUcwWmpoMDdGZ3NLQ21oSmNQL05OOStjKy9lT0ZpTUJzaUZEaGtnQndQUEREei84aE1DdjFXcHgrUERoWEp1bWNhR1BtamY0YTMyMmxjZjg4OXhDNU5jR0tDK3BRRWp0eGNPSEQwZXRWa3RxNFA3NDhlTS9BUURQL3YzN3M1ckEwS0ZESlFEZy9zNDc3MHovL2ZmZmF3ajhnd2NQTnVua28yWWVLc0N3R1o5NVM5d3RvUHlrSmlMcUpCdzhlTEF4Q2RRa0p5ZFBCd0QzL3YzN045NzI0Y21USjR1OXZiMmRrNUtTeHZ6KysrOVZCdzhlUkoxT2gwT0hEaldaK2ZuZ3A1bWZkZXd4YjBrZGh2eGRBaUlCVWdKRGh3NUZuVTZIKy9idHc5TFMwcW91WGJxOHBsQW9uQ2RPbk5qNHRnamZmZmRka2JlM3QwT0hEaDM2bmoxNzl2cWhRNGV3c0xBUWs1T1Q2d1YvUTdLZmdaOTVTeUNCaHBZRGZCSklUazdHd3NKQzNMZHZIK3IxK3VzdFc3YnNxMUFvSENaTW1OQzRPZ1pqWTJPYnVMbTVoUjg3ZHV6azBhTkhzYlMwRkZOU1V0ak16N3pWSzRHVWxCUXNMUzNGdlh2MzR1N2R1MCs2dUxpRVIwWkdObWxNUlQ4WkFQaG5aR1NvZnY3NVp5d3RMY1c1YytlYVZQc2Z0ZVpuNEdmZWtrbWdvWm9BN1E3TW5Uc1hTMHRMY2QrK2ZmalZWMStwQU1DL1Vld01USjQ4V1F3QWJ0T25UNTk5K3ZScDNMdDNMNjVhdFFwdGJXMjVmZjVIVmZzYk9yWEhQUFBtOVB6OGJHaDNJQ1ltQm0xdGJYSFZxbFZZV2xxS3BhV2xPSHIwNkU4QXdHM0NoQW5XWFEvdzl2WnVGaG9hMnZmTW1UTzNEeHc0Z0VxbEVsMWNYREE2T3ByYjU3ZXhzWG5rbXA5NTVvVkFCc1lrWUp6ZjBkSFI2T0xpZ2prNU9WaGFXb282bmU3MjMvV0FadGJlN0JOb01CZ09IajE2RkV0S1NqQW1Kb1k3eXR1dFd6ZTBzYkhobWlyWXpNKzhOU21CUG4zNm9JMk5EWGJyMW8wN1Vod2RIWTBsSlNWWVVsS0M2ZW5wQndFZzBDbzdCZitXL3E3VHAwLy85TlNwVTFoYVdvcFRwMDdsVHZYUjVSMzg5bDcrWlIzTU15OGt6KzhZVEVoSU1MbGtKQ3dzREtkT25Zb2xKU1ZvTUJodzlPalJjd0hBMWVxMkJ1UGo0NXY0K2ZuRi9mYmJiOWYzNzkrUG1abVozRzI4ZElrSEhheGc0R2ZlbWttZ2QrL2VKcGVMUkVkSFkyWm1KcGFVbEdCdWJ1NTFEdytQdU9qb2FPdlpGWGovL2ZmRkFPQ1ZucDYrL2ZqeDQxaGNYSXl2dlBLS1NhY2ZYZUxSdDI5ZlRqWXhFbURlV3NCUCtVeW5DT2x5RWVvVWZPV1ZWN0M0dUJnTkJnUCsrOS8vM2c0QVhsWnprVWluVHAyYVJrZEh2M2o2OU9sN2UvZnV4UlVyVm5CWEwvTzMvSXlEeFNjQjVwa1hvdWZuTTM5cmtLNnMvKzY3NzdDNHVCalZhdlc5NE9EZ0YyTmlZb1QvVHNycDA2ZExBTUJuKy9idCtVZU9ITUhpNG1KczJiSWxSa1pHbXB6dVMweE01R1FTQXovejFrb0NsTisweTBXN0FwR1JrZGl5WlV0T0JjeWJOeThmQUh3bVRab2s3TE1DblR0M2Job2ZILy9TYjcvOVZsdGFXb3FmZnZvcGhvYUcxbHY0YTBqK004KzhOWkdBOGZWaXhnWEIwTkJRL1BUVFQwa0YxTFpyMSs0bFFhdUFHVE5taUFIQWEvMzY5Vm1IRHg5R2c4R0FQWHYyTkxuTHovZ0N6L29VQVBQTVc1T24vT1pmTkVwM0MvYnMyUk1OQmdNV0ZoYmlyRm16c2dEQWE5S2tTV0toenY1MnJWcTE2bmJxMUttN3BhV2x1SGp4WXBSS3BmVzIrekx3TTk5WVNjQzRUVmdxbGVMaXhZdlJZRENnVXFtODYrUGoweTBtSnNaT2NPQ2ZObTJhQ0FCYzU4eVpzK0xZc1dOb01CZ3dORFFVSXlJaVRPNzA2OU9uRHllTGpJUERQUFBXN0NuZnFlbU43aFNNaUlqQTBOQlFOQmdNV0ZCUWdPUEdqVnNCQUs2Q2U5dlF5SkVqWlJLSnBQVVBQL3p3eDk2OWUzSDkrdlhZdm4xN2s5dDg2WlhjZkFYQVBQT053VlBlVTE4QTNTN2N2bjE3WEw5K1BSWVZGZUhtelp2L0VJdkZyUWNQSGl5czdrQmZYOTltUTRZTW1YRGl4QWtzS2lwNjRLaXY4VlhlVEFFdzMxZ1ZBUCtLY2VNancwVkZSYWhTcWJCcjE2NFR2THk4aEhORzRJTVBQaEFCZ0dMVnFsVlo1ZVhscU5WcVVTNlhjejMvdFBWQjhvZUNRTlZSNXBsdkRKN3luczRJZE8vZW5Uc2o0T0RnZ0ZxdEZnc0tDbkQ2OU9sWkFLRDQxNy8rSll4bHdLaFJvMlMydHJadGYvcnBwMnNsSlNVNGI5NDg3TkNod3dQeW40R2ZlVVlDU1NidHdiUU02TkNoQTg2Yk53OExDd3R4MjdadDEyUXlXVnZCTEFPNmR1M2FkT0RBZ2VOKy9QRkhMQ3dzeERGanhxQlVLbTN3bWkraGs4QS9mVjg5QTBIamppTjkvdnF1RDVOS3BUaG16QmdzTEN6RTNOeGM3TlNwMDdpT0hUczJGWXI4ZDF1d1lNSDY4dkp5MU9sMEp2Sy9XN2R1Smk5VDRKT0FVRHg5YnZLMG5DRlB6MGVlLy8vNVB5KzA1MmR4ZkxyUFQ4OW5mRlJZTHBlalRxZERyVmFMNDhlUFh3OEFidSs4ODQ1bEx3Tm16Wm9sQVlDQUF3Y09uQ3d0TGNWdnYvMldxLzdUcVQ5cS9oSGFvRFdVckxTY29lZWlBaWZmMC8rbjcyK3NaTURpV0g4OHFDbUlUZ20yYjk4ZXYvMzJXOVRyOVppZW5uNFNBQUxlZmZkZHkyNE43dGF0bTQyM3QzZnNUei85VkZOWVdJaVRKMDgyT2ZqRGY0c3ZmOUFzMWZObkpFcENXczVRWVpQMmM2bk5tVHo5ZHpyN1FEOUh2NGMvd3drbExpeU9UOGZ6M3pwTUI0UW1UNTZNZXIwZWQrM2FWZVBpNGhJYkd4dHJZK2tFMEd6WXNHRnZIVHQyRFBWNlBZYUhoNXRjK21ITTNFSlBWcnJCaUFxYmRMU1pPaDM1bnY0L2ZUOHRoNnlkREZnY0g4OFRMb3d2Q3drUEQwZTlYbzg1T1RuWXRXdlh0enAyN0dqeDI0RXU3Ny8vL3NxREJ3K2lYcS9ud005L3c0K2xEd3BmbHBMOHBCbUtsalAwSXNqSXlFaHMwcVFKSmlRa1lIeDhQTDcyMm1zNGFOQWdIRHQyTEhicTFBa1RFaExRM3Q2ZWU3VTVLU0w2UFRTajBkOTVsTHdWR3ZpZk5JNTkrdlRCK1BoNEhEVnFGQTRhTkFoSGpScUZjWEZ4bUpDUWdIWjJkbHhOeVZyaVNKK1AvMGFoME5CUTFHcTFxRmFyY2VqUW9Tc0J3TVZpa1Q5ejVrd1JBSGhsWldVWlNrcEtjUFBtelNpVlNybkI0ci9TbTEvUXNSVFBuNmxJbHRHTVExYzdSMFJFWUhSME5INzQ0WWU0ZE9sU1ZLdlZXRkJRME9DWFJxUEI1Y3VYNDh5Wk16RTJOcGFMQzgxczlQdHBtZFRRVENZVS95Ung3Tml4NDJQSFVhVlM0YUpGaTNENjlPa1lFUkhCa2FyUTQyajhxbkVpUTZsVWlwczNiMGFOUm9QejVzMHpBSURYNU1tVExiTVErUEhISDBzQUlHai8vdjFuaTRxS2NQYnMyVndCTUQ0KzNvU1poWkswTkZQUjZjV29xQ2gwZDNmSGp6NzZDSGZ2M3MxVmFmUHk4bkRQbmoyNGRldFdYTDkrUGE1ZXZSclQwOU54N2RxMXVISGpSdHk1Y3lkbVoyZWpTcVZDblU2SEJRVUZtSm1aaWJObnowWi9mMy91ZmdUNk8veVpUR2drUUorWFArUFQ4MFZHUm1KQVFBRE9uajBiTXpJeTZvM2poZzBiY00yYU5iaHExU3BjdDI0ZEY4ZWNuQnhVcTlWY0hIZnUzSWtmZnZnaHVybTVZVlJVVkwxeEZBb0pVTHpvZEdENzl1MXg5dXpacU5QcE1DMHQ3U3dBQkUyWk1rVmlxZXQvbVZnc2JudnMyTEVxdlY2UE0yYk1RS2xVYW5MbHR6SFQ4YmQ0ek8zcGM5RXloUXBPTkZQRng4Zmo5T25UVWFQUm9GYXJSYVZTaVJzM2JzU2xTNWRXZi9qaGgwZGZldW1sOVowN2QvNDRQRHo4OWJadDJ3NXQwYUpGWWtoSXlOQ3dzTEJ4blRwMStuakFnQUZyUC9yb284T3BxYWxWTzNmdXhQejhmTlRwZEtqVDZYRG16SmxjRXdqTlpLU1k2UE5ZYXR5ZU5JNmRPM2ZHRHovOGtBTjlUazRPeGJHSzR0aXBVNmVQd3NQRDMralFvY1BJRmkxYUpJYUdobzZLaUlnWTM2bFRwNDlmZnZubFRYUG56djFwMWFwVjkzYnYzczJScWxxdHh2ZmVlNDlycDZXK0U0b2pmMWxncVhFenZqcGNLcFhpakJrenNLQ2dBRGR2M2x3bEZvdmJ4c1hGeVN5VkFHd2pJeU43SHpseUJIVTZIUTRZTUlDNy9LTno1ODcxTXJHbEppMVZuV2x0T243OGVNekl5RUN0Vm90Nzl1ekIxTlJVbkRadFdubW5UcDArZG5CdzZBZ0Eva1ZGUmIzeElWWlVWTlFiQVB5Yk4yOGUzYmx6NTVtelpzM2F2M256NXJyYzNGelU2WFNZbFpXRmI3Lzl0c25hbGdxbkRSVzRMTTN6QzN6OE9MNzk5dHU0Wjg4ZTFHcTFtSm1aaVN0V3JMZy9kZXJVL2ZIeDhSODFiOTQ4NW5IaU9IWHExTllBME1MSnlhbFQxNjVkNTN6NjZhZEh0bXpaZ25sNWVhalQ2WEQzN3QwNGR1eFlremdLaFV3cGZqUVpoSWFHNG9BQkExQ24wK0dPSFR1d1pjdVd2ZVBpNG13dGxRQ2FEaGd3WU56MzMzK1BPcDBPQncwYVpMSUZ5SmRqTkFqbTlzWkphN3lHakk2T1JpY25KMXk0Y0NFMzQ2ZW5wK003Nzd5ek56ZzRlQ1FBQk5UVzFsYmdQN0RhMnRvS0FHZ1JIQnc4Yk5xMGFVWGJ0MjlIbFVxRldxMFdseXhaZ2k0dUxweWNwUUlYcmFINU01bWxlRHJRUXArVFBuZFVWQlE2T3p2amtpVkx1RGltcGFYaFcyKzlaUWdLQ2hvS0FDMythUnlycXFvTUFCQVlHaHI2NnNjZmYzeGc1ODZkM1BKZ3dZSUZLSmZMT1FWSzQ4b25VMHZMUTFJQXRCVTRhTkFnanRoaVkyUEh4Y2JHV21aSFlOZXVYWnNuSnlkUHA5ZDh0MnJWaXRzRm9PQmJXdkkyQlA2b3FDaDBjM1BEVFpzMm9VYWp3UjA3ZHVCbm4zMTJNU29xYWpJQUJPQlROQUR3ajQ2T2Z2Tzc3NzQ3cDFRcVVhdlY0dWJObTlIVDA1TXJGRm82Q2RRSGZpcGtLUlFLcnBDMWZmdDJuRGR2M3Ztd3NMQzNBYURGVTQ1allQZnUzYWVscDZkZnljM05SYTFXaXhzMmJEQWhVMHNuQVlvaktZQ3dzREJzMWFvVjZuUTYzTE5uRDNidjNuMTZ4NDRkbTFza0FmajUrVG1PSFR0MmZsbFpHZXAwT295TGk3Tm9CZEJRZFRvcUtnb1ZDZ1Z1MjdZTjFXbzFidGl3QVNkTm1sVHE0dUxTK2ZidDIrdnhHVmhWVlpYQjJkbTU0d2NmZkZDUWxaV0ZXcTBXZCszYWhYNStmbHlWMjdpd1pVd0M1b3FuY2NlZThlZWlBbFpFUkFUNit2cmlybDI3VUsxVzQ3cDE2ekFsSlVYdjVPUVVXMVZWWlhnV2NieHk1Y3FuN3U3dTNlYk9uYnMvT3p1YkkxUGpBbUZEdXdTV3FnRGk0dUpRcDlOaFRrNE9KaVFrelBmeThuSzAxSjFBcC9Ianh5OHFMUzNsamdEekZRQ2ZlYzNsQ1R6MWdkL0Z4UVUzYmRxRUtwVUtWNjllamNuSnlic2tFa2xyZkE0bUZvdGJUcHc0Y1dObVppYXExV3JjdVhNbit2bjVZWGg0ZUwwa1lPNTRrbkxpZ3o4OFBCeDlmWDF4eDQ0ZG1KK2ZqNnRXcmNMaHc0ZHZFb2xFTFo5SEhHVXlXZkRreVpPejl1elpneHFOQmpkdTNGaXZFaUFTNEpPcHVlTnByQURrY2psWExFMU1URndFQUU2V1NnRE9FeWRPWEZsU1VvSmFyUmJidDI5dmNnY2dYd0ZZU3JDcFVCVWRIWTFObWpUQjlQUjBWS2xVdUhidFdodytmUGltcHkzNUgwUEsrcjMyMm12TExKMEVIaGY4NmVucE9IRGd3T1VBNFArYzR4ajR6anZ2N016T3prYU5Sb09wcWFuWXBFa1RyaVpBNDI0cGt4SmZBZEFkZ2UzYnQrZHFKMGxKU1NzQXdObGlDU0FsSldXMXdXQkFyVmFMVXFtMFFRWFEwRUdQNStYNTRLY3E5ZXpaczFHajBlQ1dMVnR3M0xoeHVRQVFpR1l3QVBDdGp3VDRuWlhVUnN1ZnlaNjFKK1ZFZjU4NjE4TEN3aG9DdjY4NTRpaVZTbHZObWpWTGs1dWJpeHFOQnFkUG4vN0E3b0FsNXFXeEFwQktwYWpWYWpFM054Zjc5ZXUzMnBJSndDVWxKV1YxVVZFUmFqUWFEQTRPTmxFQTFMTnRDVUUyN2tHbi9lbkV4RVJVcTlXWWtaR0JIMzc0NFMvMjl2YWhhRVlqRXNqSXlFQ1ZTb1U3ZHV4QVgxOWZzNVBBbzhDL2ZmdDJ6TXZMdzdTME5IenBwWmZNQm42eTVzMmJoNldtcHY2YW41K1BhclVhRXhNVFRmb3QrR2NKekoyZnhua3BsVW94T0RnWU5Sb05LcFZLN051MzcycExiZ2MySVFCakJXQmN4VFlPdHJrOEJabWFSa0pEUTNISmtpV1lsNWVIUzVjdXJmTHg4Um1JRm1DUElnSGpacGY2VHNrOWJjOC9yVWZ4czFUd2s3VnUzWHBRVmxaV2xWcXR4a1dMRm5FM1ZGSDgrQ1JnTHMvZlJTRUZJRWdDSUFWQWNzdFNnc3h2U3cwUEQrZG0veTFidHVETEw3KzhCZ0E4MFVMTVVraEFxT0QvTzRhZTc3enp6cnI4L0h6VWFEVFl1M2R2N29wNmZ0dXdwVXhPdEFzZ0tBVXdjZUxFMVlXRmhhaFdxemtGWUJ4a2N5dUErcXIrTXBrTU4yN2NpTG01dWZqbGwxOWVzYmUzajBBTE16NEpiTisrSFgxOWZibE9TNUt6Vk5ONDJzbE00S2ZmVDh1bTBOQlFFL0NucHFaYUhQakpuSnljb3ZmczJYTmRyVlpqZW5vNnltU3lCbmNGekoyZmhCZFNBR3ExR25OeWNvUkZBRzNhdERFNUMwRHRtQlJrYzNtYXdhandOMkRBQUZTcFZMaDE2MVo4OGNVWGx6K3FGZFdjSkRCbXpKaGx1M2Z2eHZ6OC9NY21nZjgxWG84Qy83WnQyekEzTnhkVFUxTnh3SUFCRmdsK2FpR2VOR2xTbWtxbFFyVmFqVWxKU2ZXMkMxdEtmdEpaZ0RadDJnaVRBS1JTS1lhR2h0WXJzOHdWWEg3aHFrT0hEamg1OG1UTXo4L0haY3VXVlRrNU9YVkdDN2JuVFFMV0FuNHlYMS9mN21xMXVrYWxVdUhiYjcvTnhjMjRvR3JPL09RdlQwTkRRNjFIQVZBU2tjeDUzdDc0RWdycVZKTktwYmhqeHc3TXlzckM5OTU3cjlqU0UvaGhKRUNGTFQ0SkdPOFNQSW1ubitPRHYwT0hEb0lFUC9WWXJGcTFhcjlhcmNhdFc3ZWEzRmRoZkttSU9mUFV1QzlGa0FwQXI5ZWpTcVZDaVVUQ01TeS9lY1hjd1NYNTM3MTdkMVNwVkxobHl4YnMwcVhMcC8vMFVJcTVTR0RYcmwyWWw1ZUgyN1p0ZTZvazhEamdWeXFWdUhMbFNzR0FIeEd4dXJyYU1HellzTTgwR2cycVZDcnUraTErdk13OVNWRlRWV2hvS0Vva0VsU3BWSmlkblkxSlNVbkNJWURXclZ1alZDcDlvTkJDRC9tOFBhMnRqT1YvVWxJUzV1Zm40NW8xYXpBd01MQWZDc2dlUlFLMHRxVzRHKzhTUEU2YzZPZUlMQnNBL3pLaGdKOHNKaVptSUwxMnEzZnYzbHk4K0gwVjVzcFQ0d0sxVkNyRjFxMWJDNU1BSkJLSnhRYVhybHVhT1hNbTV1WGw0YkpseTI0Q1FEQUt6SjQyQ1ZnNytQOCtiOUcyc0xEd2prcWw0aTZ0b1J1WnpEMUoxVmVqRXFRQ3lNL1A1eFFBQlpmV1dQU1F6OXZ6NVd5N2R1MXcvdno1cUZRcThiUFBQanZ4dkh2K255WUp2UHJxcXh3SmJOMjZGWDE5ZmJucjJLZ0dRL0huTHd2NDhhSHZpNDZPNXE2bDh2WDF4YTFidHdvZS9IUkdJRGMzOXplMVdvMmZmUElKdG12WDdxSExwdWZ0S2Y0MFNiVnUzUnJ6OC9NeEt5dExHQVJRVUZDQStmbjVKZ3FBMzZ4aXJ1QWFIMWlSU3FXNGF0VXF6TTdPeGxtelp1MERBQjhVcUJFSjdOeTVFM056Y3grYkJQajM3ejhNL0RrNU9iaGl4UXJzMzcrL1lNRlBzZHErZmZ0K2pVYURhV2xwS0pWS0h6aG9aYTc4NURkWmtRSVFKQUcwYXRVS3BWTHBBeDFYOUpEUDJ4dmY5Q09UeVRBa0pBVFhybDJMMmRuWk9HM2FOQjBBZUtHQXJTRVNvQm1PZjJFbXhZTzg4Y1ducEpDc0RmeC94OGw3NDhhTmVxMVdpNnRYcjhhUWtCQVRrdVF2bDU2M3AzR2dYYXBXclZvSlZ3SFFETVNYVitZS3J2SEJGYWxVaWhzMmJNRHM3R3o4OTcvL3JSYzZBVHdKQ1ZCTmhtWjgrcmUxZzU4SVlOdTJiUWFkVG9mcjFxMHpPYk5DY1RCWGZ2S1hxZTNidHhlV0FwZ3dZY0pxblU2SGVYbDVEU29BL3V1ZW5wYzN2cU9PRk1DeVpjc3dPenNiNTh5WlUyWU55VzFNQWp0MjdFQ2xVb2xidG13eElRR3F5ZEN5akR6dGh4UDR0MnpaZ3RuWjJmamRkOS9oaXkrK3VNeWE0ck5uejU2REdvMEdGeTllL0lBQzRDK1RucmV2VHdIUWRlbUNJZ0NKUk1JbEhiOGFiYTdnR2g5Z2tVcWwrTTAzMzZCU3FjU3Z2LzVhc0VYQUp5R0J0bTNiY2sxUXBBaU0vOTIyYlZ1ckJqOFZBUXNMQzA5cU5CcGN1SENoaVFJZ01qUlhmdkozWDlxMWE0Y1NpVVNZQk5DeVpVdXV3RkxmTzkyZXQrZXZjVU5DUXZEdHQ5L0czTnhjWEwxNjlRMGhiZ00rS1FuNCtQaHdNeDQxYVpFUENRbEJIeDhmcXdiLzMzRnBlK2pRb2RzcWxRb25UcHo0Z0FKb3FFYnl2RHpoaEFyVkxWdTJGQjRCNU9ibW9rUWk0V1ljS3J5UnZESlhjUGtLWVBUbzBkeGF1V1hMbG4zUnlveFBBcHMzYjBZZkh4OXVpellrSklUYmF2THg4Y0hObXpkYk5mZ1JFVHQzN2p6dzBLRkRtSnViaThuSnlmVXFBSFBsSjdXcEUxN2F0bTJMRW9rRWMzTnpNVE16RXhNVEV5MmZBT2o2SW1NRllCeGNJb0huN1drTDBEaTR2cjYrbUp1Yml4a1pHZGk3ZCs4NVFta0ZmbElTR0QxNjlMTHQyN2RqVGs0T2J0cTBDWDE4ZkRBd01CQ2xVaWtHQmdhaWo0OFBidHEwQ2JPeXNuRDU4dVZXQy83cTZtckQ2NisvUHIrc3JBeHpjM05Sb1ZCd3kxVEtDMUlBNXNwVG1xU01GWUFnQ2NCWUFaRHN0clRndG1yVkNqZHUzSWc1T1RuNHlTZWZHS3d4NlJzaUFXOXZiL1R4OFVGdmIrOUdBWDZLUTA1T3psNjlYbzlyMTY3bEN0V1dOa2tSWGdTdEFJS0Nna3prRlcwRkVnazhiMDlySzJMNkRoMDZvRlFxeFZtelp0RXlvTXJGeFNVZXJkVDRKTEJ4NDBhTWpvN0dqUnMzTmdyd0l5TDYrdnAyT1g3OGVIVitmcDdhQUNrQUFDQUFTVVJCVkQ1KzhNRUhLSlZLdVdZMXFnRlFucGdyVDJrTGtKYXBRVUZCd2lNQXBWS0pFb21FSzdBUW8xbEtjR21MSlRnNEdFTkRRMUdwVkdKV1ZoWU9IejU4MFcrLy9mWjZZeUVCZXU3R0FQNmlvcUxlczJmUFhuN2d3QUZVS3BYWXJsMDdyZ2JDZjhXNE9TY3BZN3lFaElTZ1JDSkJwVktKR1JrWndpSUFVZ0JVWmFhdFFITUZsenh0c1JERHRtclZDdFBUMDFHcFZPS0dEUnN1Tm0vZVBCeXQySWdFdG0zYmhwbVptYmhzMlRLckJ6OGlvck96YzhUeDQ4ZXYwRHNDU1A2VFFyVzAvS1RMUUlLQ2dvUkpBTVlLZ0pwTWFJMUZTdUI1ZTJKNFlsaDZlY21vVWFOUXFWUmlkblkyamg4L1BoVUFQQm9CQ1N4WnRHZ1I5dS9mZjRtMWd4OEFGRjk4OFVWYWVYazVLcFZLSERGaUJQZlNEZU1PU2NvUGMrVW4xYWdJTDRKV0FGUmxibWlOWlM1UERFdkxnTFp0MjZKVUtzWGx5NWVqVXFuRTNidDMzd2tJQ09pUFZtNEE0QkVWRmRYUDJza09FVEVzTEd6QXI3Lytla2VsVXVIeTVjdE54cDNrUHlrQWMrY252MFlWR0Jnb1hBVVFIQnhzMG1sR0RNdHZRMzFlbnY0K0JabGtWdXZXcmJGTm16YW9WQ294TnpjWDA5TFNmbXJhdEdsN1pDWjRrOHZsSFE0ZVBQaExTVWtKS3BWS2JOT21EZGNIUWZLZkppZEx5RTlqdkFRSEJ3dExBWXdmUDM2MVJxUEJuSndjVGdId1paYTVna3VlbUo1a0ZqRnR5NVl0TVNVbEJYTnljakEzTnhjLyt1aWpIR3RxRDI2TUJnQUJtelp0eXY3KysrOVJxVlJpU2tvSzE1OUN5cFRPUmxCZW1Ecy8rY3ZUd01CQXpNbkp3ZDI3ZDJPZlBuMkVRd0FTaVlTN0dKVDJXVWwrRTlPWnk1TUNvR1VBOVZ5M2J0MGF2L3JxSzh6SnljSDgvSHg4NzczMzFzSnpmcWtsczZjR2Z2L2x5NWV2TzM3OE9PYmw1ZUhDaFF1eFZhdFczQmtWWS9sUCtXRHV2Q1I4VUo5S216WnRVQ0tSQ0pNQUFnSUNIbEFBbGhCazh2UjVLTmpVZE5HaFF3ZGN1WElsS3BWS1ZLbFVPR1hLbEZRQThHT1FFaFQ0L1JZdlhwejY4ODgvWTM1K1BxNWN1Wks3WElQVy9qUXBXV3Bla2dJSUNBZ1FyZ0tvYjYxbHpIVG04dlE1YUJsQXRRQmFjMFZHUnVLcVZhdFFxVlNpV3ExbUpDQkE4Sjg0Y1FMejgvTngxYXBWR0JFUndkV2tqUE9SeHQvUzhwSzJxRnUzYmkxY0JkQ2lSUXRPWGhzSDI5eEJKazlNeXljQmtsMFJFUkdNQkt3SS9MUWNwYjRVR25mS0EwdkpTK043R2FSU0tiWm8wVUpZQktCV3F6RTdPL3VoQ3NCU1BQODhQTWt1WXQ2SWlBaE1UMC9Ibkp3Y1ZLbFVPSG55WkVZQ0FwRDllWGw1bUo2ZXpvR2Y4cEFLZi96N0VDd3RML2tLSURzN0czZnQyaVVzQWlBRndMK0V3dEtDVFl4TGEwSStDWVNIaHpNU0VDRDR3OFBEVGNCUHRTZ2FaNzc4dHhSdmZEa0xLUUJCRW9CRUl1SGFMVWwyRWVOYW1xZWdFL09TL0tLcU1TTUJZWUtmOG8vR2s1UW9Yd0ZZbXFmbEtPV2ZWU2dBZnRYVlVqek5CSThpZ2JDd01FWUNBZ0IvV0ZqWVk0R2ZYd093RkU4NHNRb0ZVRi9UaFNWN0NqNHhNQTBDSXdGaGdwL0dqeFFvWC81YnFqZHVUaE9jQWxDcFZKaVZsWVgrL3Y3Y3RWTTBzMXB5MEdsbWFJZ0VhRENJQkxLenN6RS9QNStSZ0lXQm55YWRoc0RQVndDVzVna25kRlRaMzk4ZnM3S3ljT2ZPbmNJaUFPUEJvQUtNcFFlZmtZQ3d3SitibTJ0VjRPZnZSbEcrQ1pJQS9Qejg2bTIrb0llMFZFL0pRcCtYNUJnZHphUkJDUTBOWlNSZ0FlQ25WMmpUdU5ETVNjdE9Ha2MrQ1ZpcXB4b1VOYVg1K2ZrSlZ3SFFwU0RVRENTVVFYZ1VDUVFGQlRFU3NDRHcwM2dJSGZ6ME9hbHdTYzhsYUFYQTc4Q2loN1IwVDhsRG41dGtHVEV6SXdITEFqOHBUVnB1MHJqeFNjRFNQYjhqMVNvVkFDTUJaZ3o4RFh1clVBQyt2cjRtQ29Bdnk0VGlLWm5vODlQZ0VFTUhCZ1p5cHdnWkNUeDc4Tk9wUG9vNzVSZE5NalJPZkJJUWlxZmxKdVdYcjYrdmNCVUFYUXBDelVCQ0d3eEdBZ3o4NXZDMGkwSFBLUmdDZU9PTk4xYm41K2ZqbmoxN09BWEE3OFhtdjVOT0tKNlNpNTZEQm9uT0RBUUVCSEFra0phV2hsbFpXWmlYbDhkSTRDbUFQeTB0alFNL3habnlpaVlYR2hjK0NRak44OCtpK1ByNjRwNDllM0RIamgyWWtKQWdIQUtnd1RKdUJoTHFvRHdwQ2JSdjM5NkVCTjU5OTExR0FrOEkvcDkrK2dtVlNpV21wYVZoKy9idEd3WDRqVi9VU3BlQlNDUVNZUktBajQvUEF6M1p4b01rVkUvSlJzOWovSUpOUmdMUEQvdzBxZEE0OEVsQXFKNS9Cc1hIeDBmNENvQnVCeGI2NERBU1lPQi9IcDUyTmF4S0FaQmNzM1lTSU9adTBhSUZJNEduQUg2S0krV1J0WU9mZndCTjBBcUFqZ1JUdFpZS0hOYmlTYTdSb0JGekc1T0FXQ3htSlBBUHdDOFdpeDhBUDhXWDRrM3h0N2E4SXJ6UTh3dVNBTHk5dlUwT2FOQU0yZGhJd04vZkg4VmlNYlpyMTQ2UndHT0F2MTI3ZGlnV2k5SGYzNzlSZ3A5d1FtY2J2TDI5aGFzQTZFZ3dyZDFvMEt6TlUxTFM0Rkd5MGlENitmbWhXQ3pHa0pBUVJnSVBBWDlJU0FpS3hXS3VqWndtRDRvbnhaZFBBdGJtQ1M5RWdvSWtBQzh2TDVOMllCckV4a0lDSk9Pb25kUEh4d2ZGWWpHMmFkT21QaEx3YldUZzkrV0R2MDJiTmlnV2k3bmFFZVVOeGJHeGdKOXdRbm5qNWVVbFhBWGc1K2Rud21nMGVOYnVhUkRwdWFtYTYrbnBpV0t4R0lPQ2dqZ1N5TXJLd29rVEp5NXBUQVR3elRmZkxQbnh4eDg1OEFjRkJhRllMRVpQVDArVDNTT0tIMS8rVzd1bjV5WWxaRlVLb0xHUkFIOFo0T2JtaHA2ZW5yaG16UnJjdlhzM0xsbXlCQWNOR3ZSVll5S0FOOTk4ODZ1dFc3ZGlSa1lHcmxtekJqMDlQZEhOemUyaDhyK3g1WTFWS0FCZlgxK3VJR1lzNDZ6ZEd4Y0NqYXU1Q29VQ3ZieThPUEF2WHJ3WSsvWHJ0eFFBZkJyWkVzQm41TWlSU3pkdjNzeVJnSmVYRnlvVUNwUGRJMzRCc0xIa0R6MDN0ZE1Ma2dCSXp0R0JJUDVhcnJHQW53NTBlSGw1b1plWEY2NWR1NVlEZjkrK2ZaYzF0dlcvY1IwZ09UbDVHWkhBMnJWcnVSZ1o1MDFqSXdIQ0NlV05wNmVuOEJVQVg4NVpxNmZCbzZTbHRiK1BqdzhEL3hPUUFCVUNxUlpBOGFUNFduc2VFVjZzUWdFMFZOQmg0Ry9jNEdja1VMK3ZyM0FzV0FYZzQrUERGVFNzZWZBWStCa0pQTTA4SXJ6UTh3dVNBSXdMT3NZZFhmU1ExdUtKc2Fuemo4RHY3ZTNOd1A4VVNJQTZTaW11bEVjVWQydkxKLzVaRW9WQ0lVd0NlRmhUQndNL00wWUNEWHQrODVnZ0NjRER3NE5yQnpiZTE2VkJFN3FuSktSOWZnYis1MHNDbEU5OE1oQzZwM3dpM0hoNGVBaFhBZENnMFpZT0F6OHpSZ0tQOXJRRjZPM3RMWHdGUUoxZHRBeWd3UktxcDZRam1VWnJOYmJQLzN6N0JDanVsRmQ4TWhDcXA3d2kzQWhLQVJqZkNteXNBUGhWWEdzRi83cDE2ekFqSXdPWExGbUMvZnIxWStCL0NpUXdjdVRJWlZ1MmJNSE16RXhjdDI1ZG95QUJZMFVwRm91RmVTMjR1N3U3VlNrQVNpNlNaN1JHWStBM0x3blFPTkF5VStna3dGY0E3dTd1d2lRQXNWaHN3dFRHZ3lNMFQrVEZCNytucHljRHZ4bEpnSnJOK0NUQVZ3UkM4OGJLMG1vVUFKK2hHZmlaTVJKNDBGT2VXWVVDTUI0YzQwRVJpcWRrb2pVWkRRcWQ2bVBndHd3U29LWXpHaCtxT2ZISlFDamVlSklSckFKd2MzUGpEZ1FaRHdvRFB6TkdBZzE3eWpmQ2padWJHMU1BRFB6TUdoTUpXSTBDTUc0SEpqQlJsZE5TUGEzQnFCRERCLy9hdFdzWitDMlFCS2hQZ0U4Q05JNDBycGFlZjhZSHllZ0dLVUVSZ0ZxdHh1enM3QWNVZ0JBRzRWSGdYN2R1SFdabVp1TFNwVXNaK0MyRUJFYU5HclZzNjlhdHVHZlBuZ2FWZ0ZCSW9MNUNzMWdzeHV6c2JOeTFhNWV3Q01EVjFkV2tHWWcvQ0pibWlYa3ArTFFHWStBWE5nblFPTks0MGpoYmFoNFNUcWdKeU5YVlZaZ0VZS3dBak5ka0RQek1HQWs4UEE4SkwxYWxBUGpCdHhSUGpNdkFiNTBrUUdkUytDUkE0MjVwK1VpZnp5b1VBSitCTFMzb2ZQQlR3ZExEdzRPQjN3cEpnTWJYVWttQVBvL3hKTVFVZ0JsbWZrOVBUd1orS3lJQlQwL1BCcGNEbGtZQ2dsY0FHbzBHYzNKeVVDd1dQNUo1emUxcHJVV2ZUNkZRb0xPek02NVpzd2IzN05tRHk1WXRZK0FYTUFsczI3WU5zN0t5Y00yYU5lanM3TXlSQUkwM2Y1ZkEzTDQrSlNvV2l6RW5Kd2QzNzk0dExBSndjWEV4T1JCazZjRldLQlJvWjJlSFM1WXN3VDE3OXVDS0ZTdndwWmRlU2dmMkdtK2hrb0RmMkxGajAzYnMySUhaMmRtNFpNa1N0TE96ZTRBRUxIVlNvb05BTGk0dXdpUUFTMVlBZk5sUDFkWXBVNlpnZG5ZMnJsNjlHcE9Ua3pNQklJQkJTZEFrRVBEdXUrOW03TjY5RzdPenMzSEtsQ2ttdTFNTkxRZVlBbmlLQ3FDaFlKdkxFOFB5d1I4VEU0UFoyZG00ZGV0V2ZPKzk5NDdiMk5pMFpSQVN2dG5aMmJWZHRHalI4VDE3OW1CT1RnN0d4TVNZS0ZQS0E4b0xjK2NuUHk4RnJRRG9TREFWQWkwdHlKUUU3dTd1dUdUSkVzek16TVN2dnZycWprS2g2TmNJWmtkRmNuTHlZQUJRV1B1enRtalJvdC8yN2R2dlpHZG40N2ZmZnNzZFZPT1RnS1ZNVG9RWGQzZDNZU21BQ1JNbXJOWnF0YWhVS2h0VUFQU1E1dkwwT1l5RDNMZHZYOHpKeWNHMWE5ZGkvLzc5VndLQWg3V3ZqNWN1WGJyeTExOS94ZmZmZjMrbHRkYzVBTUJqNHNTSnFWbFpXWmlUazRNSkNRa1BURTZXbHAvR0NrQ3BWR0pHUmdZbUppWStWUUtRUGtzMnVINzlPcmk0dU1ERml4ZEJvVkRBK2ZQbndjdkxDODZkT3dmZTN0NW04VjVlWG5EKy9IbFFLQlJRV1ZrSnJxNnVjT1hLRlJnMmJCalUxdGJDSDMvOGNWR24wNjFBeEF0Z3BTWVNpZndYTDE0OE15RWhJYVdpb2dJU0VoTGV2SC8vdmtna0V2a2o0bGxyZkdaRXZPRGc0QkRSbzBlUGw1czJiZXIyeWl1dmdGNnZCemMzTjZpc3JBUlBUMCtMeWs4UER3KzRjT0VDdUxpNHdOV3JWNTlaWE1UUE11aE9UazV3OWVwVmNIZDNod3NYTG5CQk5sZHd2YjI5NGZ6NTgrRHA2UW1WbFpYZzd1NE9WNjVjZ2M2ZE80T3JxeXZjdW5VTGlvdUxOLy84ODg4eDFnNyt4TVRFbERObnprQk5UUTNVMXRaQ1VsSlN5cFFwVTJhS1JDSi9hMzMybkp3Y1Y2MVd1eDBBd01QREErTGk0dUR5NWN2Zzd1NXVRZ0tXa0o4WExsd0FkM2QzdUhyMUtqZzVPUW1UQUVnQlhMcDBpWnR4aVdITjVRbjhDb1VDTGwyNkJNN096aEFSRVFHSUNOZXVYYnQ3Nk5DaDNZR0JnV3NhQS9qUG5Uc0hjK2JNZ1FzWExqUUtFbmpoaFJkMGVYbDUyd0hnSGlKQ2VIZzRPRHM3bStTbnA2ZW5XZlBUeTh2TEpEOWRYRnpnK3ZYcndpTUFrVWpFS1FBM056Y1RCVUF5eHh5K3NyS1NrMWV1cnE1dzdkbzFpSTJOaFpxYUd2alBmLzZ6LzhhTkczOVlLL2lYTEZreU15a3BLZVhzMmJOdy92eDVtRDkvUGh3K2ZCam16NThQRnk5ZWhQdjM3MFBmdm4xVDNudnZQYXNsZ1V1WEx2MyszLy8rOTRCWUxJYlkyRmk0ZHUwYXVMcTZ3b1VMRjhERHc0T2JwTXlacDZRQTNOemNPQVVnRW9sQUpCSUpVd0Zjdm56WklvTjc1Y29WYU51Mkxjamxjcmh6NXc0Y1BYcTB1TGEydHRSYXdXODg4My8yMldkdzl1eFpjSEJ3Z0xObno4Sm5uMzFtb2dTc2xRU3FxNnMzR1F5R0VvbEVBaTR1THRDNmRXdTRjdVdLUlU1U2x5OWZGcTRDTUs0QnVMbTVtUlFDS2NqbThNYkJkWFoyQm05dmIwQkVxS3FxZ25QbnpoMlFTQ1F0ckIzOEN4WXNnSXFLQ25CeWNvSmJ0MjZCazVNVFZGUlV3SUlGQzZ5ZUJHeHNiTHFmUG4zNm9Fd21Bd0FBYjI5dmNIWjJoc3VYTDVzc0E4eVpwd3FGQWk1ZXZHaWlBQVJiQTZEZ0doY0NLY2ptOEI0ZUhuRHg0a1ZPL29lRWhBQWl3cDA3ZDI2ZVBYdjJUR01BLytuVHA4SFoyUmx1M0xnQkxpNHVjT1BHRFhCMmRvYlRwMDgzQ2hJNGZQandmeER4THdDQWtKQ1FlcGNCNXN4VEtnRFNKQ1U0QlVCckZVZEhSeTY0L0VLTE9id3hzMTY1Y2dXY25KekExZFVWRUJIKy9QUFA4d0JRYlkzZ1AzdjJMSnc3ZHc0Ky8veHpxS2lvNEpLS1NORFYxWlVqNjRxS0N2ajg4ODg1RXJEU21rRFZuVHQzem92RlluQnhjUUVuSnlkdUdVQksxZHg1ZXVuU0pXNThIQjBkbjFrZ3BNOHdBYm1aNWNxVkt4YWxBSXozVjUyY25HZ0pjQk1BYXF3Wi9EVHpFK2dwNlM5ZnZzejltNVRBNTU5L0RqTm56Z1NGUWdGOSsvWk4rYnNJWlMxOUFqWFYxZFUzYkcxdE9mS2pXcFZDb2JDSVBIVjNkK2QycWE1ZHU4WVZBWjkySWZDWk5nTEo1Zko2RllDNXZMSDhKd1ZnYTJ0THhhRy9BS0RPR3NGUHN0L0p5Y2tFL0NRektkbU00MExMQVNLQnBLU2tGUHI5VmtBQ2RmZnUzYnNqRW9sQUpwTnh0U3BYVjFlNGVQRWl0d3d3WjU3U0x0V1ZLMWRBTHBjTFR3RUFBTnk4ZWJOZWVYWGh3Z1d6ZVhkM2Q3aDQ4U0xIckJLSmhJQ0QxZzUra3YzVW5HVU1mdnAzWXlFQmlVUWlFb2xFSUJhTHVlWFBsU3RYdUVuQzNIbEt5b3pHVFRBMUFHT3BJcGZMdWFTanJVQnpCdFhEdzhOa2JlWGs1QVIzN3R3QnNWZ005dmIyOXMrNktQbzh3SitVbEpUeTMvLytGODZmUC8vRTRLZk9NNUxGeGlSZzNDY3dkZXBVb2RjRUpIK1BOOXk1YzhkRUdWMjZkTWtpOHBUSStQcjE2eUNYeTU5Wkg4QnpWd0FVWEhONEtnQWFyNjF1M2JvRllyRVk1SEs1Q3dESWhBNSttdmsvKyt5emVzRlB6MjhNZm1QUHJ3a1FDWHoyMldjd2E5WXNyaVlnY0NVZ2xjdmx6dFhWMVhEcjFpMFRCVUFLMFJMeVZKQUtnRjhETUM2d0dBZlhITjVZNXBJQ09IdjJMSWhFSW5CMGRQUUNBRHRyQVAvOCtmTk53RThGVDBxcWhzQlA4YUg5WjJwQ0lSS1lQMysreWU2QVVKV0FXQ3h1MHJ4NWMwOUVoUC8rOTc4bUNzQ1M4cFRpTC9nYUFNbEtrbGZtREM3TmdBU0s4K2ZQZzBna2dpWk5talFQRGc0T3NnYndVNU1QZ2YvYXRXc1BnUDloeVdlc0JJeDNTeW9xS21EKy9QbncwVWNmQ1ZvSmRPdldMVmdrRWpXcHE2dURjK2ZPY1hFaUJXQUplV3Fzd0FUWkIyQmNBekFPcnFVb0FFcnE3Ny8vSGtRaUVkamIyNE9mbjEvSGUvZnVGUXQxemYrL2dwOXFKTVpLNE5xMWF5WktnRWlBYWdMOSt2VkxlZi85OXdXakJHN2Z2cjBoT0RpNDQ3MTc5MEFrRWtGNWVibkpKRVcxS25QbjZaVXJWMHdVd0xPcUFUeHRjNWs0Y2VKcXZWNlBLcFVLUlNJUmR5a0kzV3hDbHh5WXk5TWRhM1JsdVpPVEUyN2F0QW56OC9OeHdZSUYrMEFBRjJNQWdOK1NKVXRTZi8zMVY5VHBkTGgrL1hvTUNnb3lpVGU5bUpXZWwrNlhmOXc0MGZmVHo5UHZjM0Z4UVpGSWhFRkJRYmgrL1hwVXE5VllVRkNBNzcvL2ZxcEFZdWV2MFdnT0ZCVVY0Wm8xYTlESnlja2tIK2g1eloybmhCZUt0MHFsd3V6c2JFeEtTckxzRzRHTUNjRFIwZEVrdUUrYWhNOGp1SFFScUVxbHdoMDdkdHhUS0JUZEdqdjRyWmtFV3JaczJlUG5uMyt1MFdnMCtLOS8vY3NrRHl4bGtxSzRFMjRjSFIyRlJRQ0ZoWVVXcXdBb3VNYkpIQklTZ2lxVkNuTnpjM0hzMkxFcnAwNmQydHFTd1gveTVNbG5EbjVySkFFQThQajg4ODlYSHp4NEVGVXFGYlp1M2ZxQnVGbmlKQ1U0QlZCWVdJaHF0ZHBpRlVCOXk0Qmx5NWFoV3EzR2JkdTJYWFYwZEl5eVpQQVhGQlRnaGcwYm5qbjRuNFFFTm16WWdCcU5CdlY2dmNXU2dKZVhWK3lKRXlldUZ4UVU0TGZmZm11eDhyOCtCYUJXcXpFbkp3Zjc5dTBySEFJUWlVVG83T3hjTDhPYTJ4c25zVmdzeHY3OSs2TmFyVWFWU29XVEprMWFCd0NlUWdBL3haZVNoV1lPUGduOHI1NStILzErK252T3pzNkNJQUVBOEZxMmJObVdRNGNPb1ZxdHhuNzkrcG1NdjZYbUo4VlhrQVFnbDh0Tmd2eTBrL0ovVFdaS1lwckpGaTFhUklHdWF0T216Y3NNL05aREF2SHg4Y05PblRwMVQ2ZlQ0VmRmZmZWWXlzbmMrVW1mVHk2WEM0Y0FVbEpTVmhjVkZhRkdvN0ZvQmNCUFlpY25Kd3dLQ2tLVlNvVmFyUlkzYmRyMEg3bGNIbTRKNEQ5MTZoVHE5WHF6Z3Y5SlNVQ3IxV0poWVNGT216Yk43Q1RnNGVFUjljTVBQMVRzMjdjUDgvUHpzVVdMRmcvSWYzb2VTMVVBOUs0TlN5Y0E1NGtUSjNJRVlLa0tvQ0VTY0hSMHhOR2pSNk5HbzBHZFRvZWZmLzY1Uml3V3Q3UWs4Rk5TbUFQOGowTUNZckhZb2toQUpwTzF6c25KS1R4eTVBaHFOQnBNVGs2MmVQRHpGWUNUa3hOcU5Cb3FBcVlCZ0xQRkVzRDQ4ZU5YRWdIWTJOZzBXR2l4Rk0rdkJUZzVPZUhYWDMvTnlkaVBQLzU0QndBRVBtZnd0MWk2ZEdtYU1mZ0RBd081ejFmZjJ0V1M0aWNXaXpFd01OQ0VCS1pQbjU0R0FDMmVaeHdsRWtuTFRaczJaZno0NDQ5RTZGeGgybExpMTVBM1ZxWjJkblljQVNRbUpuNW55UVRnTkc3Y3VFVUdnd0cxV2kzSGFQeXRRRXNKTW44R284L3A3ZTJONmVucHFOVnFzYWlvQ0QvLy9QTXNHeHViNE9lVXRLM1dyRm16N2VUSmsxaFlXSWdiTjI1OEpQak5GVmY2dXc4amdZMGJONkpPcDBPRHdZQno1c3paSmhhTFd6MlBPTnJiMjRmczJyVXI3OFNKRTFoUVVJRHA2ZWttYjl0OW1JS3lsTHlrejZsUUtGQ3IxV0pXVmhZbUpDUXNBZ0FuaTBTL3I2K3Y0NnV2dmpxL3VMZ1l0Vm90dXJtNVBaQzBscW9BK0RMVzE5Y1hWNjllalZxdEZnMEdBMjdZc0dHL241OWZ0NnRYcjM3NkxCTDJyNy8rV3QraVJZdE9HbzJtK01TSkU2alg2M0hqeG8yYzdMYzA4RDh1Q1FRRkJabVF3T3JWcTB1OHZiMDczNzU5ZS8yemlPTnZ2LzMyZXBzMmJYcVVscForLytPUFAzTGc5L0h4cVhmNVpLa0t3RGlPYm01dXFOVnFNU01qQTN2MjdEbmYwOVBUMFNJSm9FdVhMczJIRFJzMnZhU2tCTFZhTFhibzBNRWs2SmJHdEk4aUFSOGZIMHhOVGVXVVFGRlIwZVVSSTBaTWU5cExBZ0FJR0QxNjlMdi8rYzkvTGh3K2ZCaDFPaDJtcDZlam41K2ZSWVAvY1VuQXo4K1BVMVFHZ3dFTEN3c3ZEaG8wYURJODVWZXZBMERRdi83MXI1bG56cHk1OXYzMzM2Tk9wOE1WSzFhZ3Q3ZTNvTUJQOGFUUEd4b2FpbHF0Rm5mdTNJbGR1blNaSGhNVDA5eFNDYUJwMzc1OXgrM2R1eGUxV2kxR1IwYy9zT1lTR2dsNGVIamd0R25UVUt2Vm9sNnZ4LzM3OStPdVhic09KQ1FrakFHQXdPcnFhc00vU2RiYTJ0b0tBQWpvMjdmdnlNTEN3dExmZnZzTjkrN2RpenFkRGovNTVCT3VLY1RTd2YrNEpPRHA2WWt6Wjg3azRuamd3QUhjdm4zN3ZwNDllNDRHZ0lCL0dzZS8vdnByUFFBRURoa3k1STM5Ky9jZk9uWHFGTklFTkhueVpPN3pDUTM4RkQ5SFIwZU1qbzVHclZhTDI3WnR3K2pvNkhFZE8zWnNhcWtFWUJzYUd0cTdyS3dNZFRvZERoa3lwTjZ0UUVzTCtxTklRQzZYWTgrZVBYSDM3dDJjbEQxMDZCQnF0ZHBqNDhhTm0rdnQ3ZDBKQUZwTW5UcTFkVzF0YlVWRHlUcDE2dFRXQU5EQ3k4c3I5czAzMy96azRNR0QzNTg1Y3dZUEhqeUlCUVVGbUptWmlRTUdET0IyVCtqdld6cjRIMFVDeG5GTVRFekVqSXdNMU9sMFdGeGNqSDgzNWh3ZU4yN2NuTWVKNDkvRTZRRUFnUUVCQVYyblRKbXk0Tml4WXorZVBuMGE5Ky9mandVRkJUUlRQaEJIU3djL1B3OXBDM0RJa0NHbzFXcHg0OGFOR0JBUTBMdGp4NDYyVCsxVTZkTWtnTTZkTzhzT0hEalEybUF3SExwNzk2N3RqaDA3WVBmdTNkekxKK2htR3VQYmFDM04wL2wzdWpISTBkRVJidHk0QVE0T0RsQlRVd052dnZrbTlPclZDMlF5R1VpbFVtamF0Q25ZMjl2WDNMeDU4MVJwYWVteGlvcUtVOWV1WFR0WFUxTno1OGFORzM4Nk9UazFsOGxrZHM3T3pwNHRXN1pzblpDUUVPN282Tmo2OXUzYk5qZHUzSUM3ZCs5Q1RVME5HQXdHU0UxTkJaRklCTGR1M2VMK0xuME8rbHlXSGovNmZBK0xZMTFkSGFTa3BFRFBuajFCS3BXQ1RDWURlM3Q3a3ppZU9YUG10MnZYcnAyN2QrL2VYNGg0WHl3V1MrenM3SnE1dUxqNEJBY0h0K3pSbzBkNHMyYk5BbS9kdWlXOWVmTW1WRlZWd2QyN2R5RS9QeDgyYk5nQU5qWTJENDJqcGNlUDhPTGc0QUJEaHc2RjRjT0h3NWt6WjZwVFVsSWlPM2JzZU9yQWdRTlA1UVpyNlZNbWdMcDkrL1pWM2I1OSs2SlVLdlh6OWZXRm16ZHZncU9qbzhtOUFKWWEvSVpJZ0FaRExwZkRva1dMWU1lT0hkQ3JWeS9vMTY4Zk9Eczd3NjFidDJRU2lhUnRseTVkMnZidTNSdHNiVzFCS3BXQ1dDd0dSQVJFaEpxYUdxaXFxb0tiTjIvQ2xTdFhvSzZ1RG03Y3VBRWFqUWEwV2kzODhjY2Y0T0RnWUVLV1FnUC9vMGpBT0k3ZmZQTU43Tml4QXhJU0VpQXhNWkhlVXNURnNWZXZYdlhHOGQ2OWUxQlZWUVZYcmx5QnlzcEtRRVM0ZlBreTVPZm5RMUZSRVZSV1ZvSmNMdWN1bzZrdmprTEpQN2xjRGpkdTNBQmZYMStvcTZ1RFAvLzg4eUlpVnNmRXhOUWRPSERBOG00RXFxMnRyUU9BcWt1WExsWDQrUGo0K2ZqNGdJT0R3d00zQTFseThCK0hCTTZmUHc5WldWbXdjZU5HaUltSmdUWnQya0JrWkNTMGF0VUs3T3dhdmxXc3Vyb2FUcDA2QlljUEg0YVRKMC9Dd1lNSG9Ybno1dkRubjM4K01tbUZBdjRuSVlFLy92Z0RkdS9lRFd2WHJuMmlPTjY1Y3dkKytlVVhPSExrQ0p3OGVSSU9IejRNY3JrY2J0MjZKWGp3MTZjQWZIeDhvSzZ1RGk1ZnZsd0JBRlYxZFhVV2ZYMjl5MXR2dmJXeXNMQVF0Vm90MnRuWk5kaDVaYWxyc0lacUF2dzFMVDJYbzZNamlrUWlsTXZsNk9ucGlaMDdkOGE0dURnY01HQUF4c1hGWVpjdVhkREh4d2Vkbkp5NDd6UCtlZjVhbjc5V0ZVcThIbFVUZUpJNGVuaDRZS2RPblRBdUxnNTc5KzZOY1hGeEdCOGZqMjV1YmlpWHkxRWtFbkVGNXNlTm8xRGlWVjhUVUZaV0ZnNFlNQ0RWa3R1QWFSblFySC8vL204WEZ4ZGpRVUVCeHNiR21neU9VQWFEVHdKUGtzUVA4NCtickVLTEU0dmoweThBaXNWaWpJMk54WUtDQXR5MmJSdDI3Tmp4N2VqbzZHWVdUUUR4OGZFMkNvVWl0cVNrcExhZ29BQ1RrNU1mT0JNZ3RCbU5QNU05S29rZjVlbjcrZFY5b2MvNDVvcGpRNkFYYXA0Wm53Sk1UazVHblU2SHExZXZyblYyZG82TmlvcXlzV2dDbURKbGlnUUFBckt6czAvcTlYcGN2SGd4aWtRaWpyR0ZPclBSNER3cWlmbkp6RS9TUnlXcnRZS2Z4ZkhKRkFBdEZ4Y3ZYb3hxdFJvLy8venprd0FRTUhIaVJJbEZFOENrU1pORUFPQTJmZnIwRFZRSDRET2IwTmUwajByaXgvVU4vVDVyQlQrTDQ1TXBBSGQzZDlScXRaaWRuWTNEaHcvZkFBQnU0OGVQdC95cmdXTmpZNXYxNmRQbkRZUEJnSHE5SG52MTZ2WEE5V0JDVC9hR2t1NmZlbXNIUFl2amt4VUFIUjBkc1ZldlhsaFFVSUNiTjIvR2lJaUkxeU1qSTV1QkVLeGp4NDR5ZTN2N2RscXQ5cnBlcjhjRkN4YlV1d3l3bHVSbm9HZHhmSnExRVpML0N4WXNRSjFPaDB1WExyMXVZMlBUTmlJaVFoaXZybnZycmJkRUFPQzVZTUdDTExvZWpIL0t5ZHFxM013ei96VHZWZkR3OEVDMVdvMUtwUkxmZU9PTkxBRHdmUDMxMTBVZ0ZQUHk4bXFlbUpnNHNhaW9DUFY2UGZidjM5L3FsZ0hNTS8rczVILy8vdjFScjlmajVzMmJNU29xYXFKQ29XZ09RcktCQXdmS3hHSng2OXpjM01yQ3drSk1TMHN6V1FZd0VtQ2UrZnFiZjBRaUVhYWxwYUZXcThXdnYvNjZVaVFTdFU1S1NoTFdtNnNuVEpnZ0FnRFhkOTU1SjdXd3NCQ0xpb293SmlhR0xRT1laLzRSOGo4bUpnWUxDd3N4SXlNREJ3OGVuQW9Bcm1QR2pCR0IwQ3c2T3RyT3o4K3Z1MWFyclNvc0xNUjU4K1lKdmltSWVlYWZkZlBQdkhuenNLQ2dBRmV1WEZubDd1N2VQU3dzVEhDdnJRY0FnSWtUSjRvQndHdisvUGxaZXIwZWk0cUswTi9mbjlVQ21HZStnYlcvdjc4L0ZoVVZZWFoyTmhYL3ZNYU1HU01Hb1ZwVVZGVFRzTEN3Z1FVRkJiVkZSVVU0Zi83OHg3clhubm5tR3hQNGE2dXlRZ0FBQ210SlJFRlU2ZktQK2ZQbm8xNnZ4OVdyVjljR0JnWU9EQXNMYXdwQ3RuNzkra2tBd0dmaHdvV3F3c0pDTkJnTTNGMkJRcm5waG5ubW44Zk5TUjA2ZEVDRHdZQTVPVG40NXB0dnFnREFKeUVoUVFKQ3Q4akl5S1p0MjdidHI5Rm83aFVWRmVHWFgzNzVRQzJBRlFTWmI4eUZQN2xjamw5KytTWHE5WHBNUzB1NzUrL3YzejgwTkxRcFdJTzkvdnJyWWdEd21qVnIxazY5WG84R2d3SGo0K01GYzJFbzg4dy82NHMvNCtQajBXQXdZR1ptSm80Wk0yWW5BSGlOR2pWS0ROWmlFUkVSVFR3OFBPS1ZTdVYxZWxCN2UzdldGOEI4bzkvM3Q3ZTN4OHpNVE5UcGRMaDQ4ZUxyenM3TzhlM2J0MjhDMW1Sang0NFZBNERycUZHajVoWVVGS0RCWU1BWk0yYXdnaUR6amI3d04yUEdEQ3dxS3NJdFc3WmdRa0xDWEFCd0hURmloQmlzemY3dVpncE1UVTB0THl3c3hPTGlZdXpTcFFzckNETGZhQXQvWGJwMFFZUEJnRXFsRW1mTW1GRU9BSUU5ZS9hVWdiV2FoNGRIczZDZ29MNUtwZksyd1dEQWpJd003czB0akFTWWIwemc5L2IyeG95TURDd29LTURseTVmZjl2YjI3dXZtNXRZTXJObitYZ3E0alJneFlnNjlIR0x4NHNXQ2V3a0c4OHovcnk5TFdieDRNUm9NQnR5MGFSTW1KQ1RNQVFDM1YxNTVSUXpXYm9tSmlUSUE4Sjg3ZDY2cW9LQUFpNHVMY2NLRUNRMXVEVElTWU42YXdDK1h5M0hDaEFsWVhGeU1HUmtabUpLU29nSUEveDQ5ZXNpZ3NWaFlXRmdUSnllbjhQWHIxNThxTEN6RWtwSVNIREJnZ0dEZWhjYzg4Ly8wWFlrREJnekE0dUppek12THcwOC8vZlNVZzRORGVMdDI3WnBBWTdJeFk4YUlQRHc4SEFJQ0F2cGxaR1JjLy91dHNkaTVjMmRHQXN4YkxmZzdkKzZNZXIwZU5Sb05MbHEwNkxxWGwxYy9OemMzaCtIRGg0dWdzZGxycjcwbTl2RHdjSTZOalIyYm01dGJWVnhjakRxZERxT2pveGtKTUc5MTRLZTMvT3IxZWt4TlRhMXEzNzc5T0RjM04rZEdzZTUvU0QxQUFnRHVMNzMwMHZUYzNOeWE0dUppMUdnMEdCRVJ3VWlBZWFzQmYwUkVCR28wR3U2Z3p3c3Z2REFEQU54NzlPZ2hnY1p1aVltSlVnRHdIRDU4K0NkNWVYbjNpNHVMVWF2VllseGNIQ01CNWdVUC9yaTRPTlJxdFZoWVdJaHIxcXk1MzZkUG4wOEF3TE5Iang1U1lQWi8xcWRQSHhrQWVJMFlNV0t1VXFtOFQ2OFc2OTI3OXdObkJ2Z2RnNHdNbUxlRVc0ejVMek54ZEhURTNyMTdZMEZCQWVyMWVseXpaczM5cEtTa3VRRGcxYWdxL2s5S0FvTUhENTZabloxOXI3aTRHRXRMUzNINDhPR01CSmdYSFBpSER4K09wYVdsV0ZCUWdPbnA2ZmQ2OWVvMWs0SC84VWhBMGFOSGowbTdkKysrYlRBWXNMUzBGR2ZObW9VS2hjTGszWERXOGhaZDVxM2pyY2VVbHdxRkFtZk5tb1dscGFXbzBXaHcrZkxsdDJOalkvLzFkMTR6OEQ4R0NVZ0J3TFZObXpiRE5tN2NlRkd2MTJOcGFTbXVXN2NPUTBKQzZuMUJaR043eHg3emx2Rk9RLzRMVFVOQ1FuRGR1blZZVWxLQ09UazV1SERod29zQkFRSERBTUNWcmZtZndGNTk5Vld4dTd1N280ZUhSNWV2dnZxcVhLMVdZMGxKQ2VwME9od3pab3pKRmVNTnZTV1drUUR6ejNMR055NzBpVVFpSERObURPcDBPalFZRExoanh3Nzg0SU1QeWwxZFhidTR1Yms1TnVxdHZ2K1JCSnJLWkxMV0V5ZE9YTHRuejU1YVdoSjg5OTEzNk92ciswQnRnQ2tDNXAvSGpHKzgxdmYxOWNYdnZ2c09TMHRMVWF2VjR1clZxMnRIakJpeFZpcVZ0blp6YzJ2S3dQOC8yT2pSbzBWOSt2U3hCUUN2Nk9qbzE5ZXNXWE5lbzlGZ2FXa3BGaFVWNFJ0dnZNRU56cVBlRzgvSWdQbC9BbnIrakU5NTV1Ym1obSs4OFFZV0ZSVmhjWEV4Wm1abTRzS0ZDOCtIaG9hKy9uZXh6N1pSZHZnOXE3cUF1N3U3bzZPalkrUmJiNzIxUFRNejgzNVJVUkh1M2JzWGMzSnljT1RJa1NpVlNoOVlGand1R1RCU1lDOGlmUmpvamVXK1ZDckZrU05IWWs1T0R1N2R1eGMxR2cydVdiUG0vdWpSbzdjN09EaEV1cm01T2ZiczJaT3Q5NSsyalJvMVNoUWFHbW9IQUY2aG9hSEozM3p6elE5S3BSS0xpNHM1SW5qNTVaZE5ybHQ2SERKNEZDa3diNTJlUC80UEF6MzkvNWRmZnBrRHZsNnZ4eTFidHVEczJiT1BoNFNFakFRQTcvYnQyOXU5OHNvcmJOWi9scGFRa0NEeDhQQndBSUNnUG4zNnpFcE5UZjBqTHkrUEk0Szh2RHg4KysyMzBkWFZsYXNSOEpjSGZESm9pQlNZdDA3UEgzZCtYbEMrT0RvNm9xdXJLNzc5OXR1WWw1ZUhlL2Z1eGNMQ1F0eStmVHQrK2VXWGY3end3Z3V6QUNESTNkM2RvV2ZQbnF5dDkzbjNESGg0ZURqWjJkbTE3ZCsvLy95VksxZWV5OG5KUVlQQmdIdjM3c1Y5Ky9iaE45OThnd01IRGtSN2UzdU9ESWpSR3lLRmhzaUJlV0g3aHNhWjhvRHl3dEhSRWUzdDdYSGd3SUg0elRmZjRMNTkrN0MwdEJSMU9oMXUzYm9WRnk1Y2VLNVBuejd6YlcxdDIzcDRlRGoxN3QyYjdlMmJzMGlZbEpSa0F3RE9NcGtzdUZ1M2JoOHNYTGp3aDEyN2RxRk9wOFBTMGxKT3JuM3h4UmM0Yk5nd2RITno0eTRmb1VGL1hGSmdYdGllRDNieWNya2MzZHpjY05pd1lmakZGMStnWHEvSHZYdjNjdWYyMTY5ZmozUG16RG5lcVZPbkQyUXlXVEFBT1BmcDA4ZG01TWlSZ3BiN0ltc2lnaXRYcmtpUEhqM2E5TUtGQzA0aElTRlJuVHQzSGhZYkc5dkgxZFhWMGNIQkFXeHNiRUFzL3I4ZG1YUG56c0V2di93Q3YvNzZLMXk5ZWhWT25EZ0J0Mi9maG12WHJvRmNMb2RidDI2Qmc0TUQzTHAxQytSeU9keThlWk41Z1hvYVJ3Y0hCN2g1OHlZNE96dERzMmJOSUNRa0JGeGNYS0JObXpZUUhCd00zdDdlQUFCUVcxc0xkKy9laGF0WHI4TFZxMWR2bEplWGE4dkx5M2Y5OHNzdmh6dzhQSzZIaDRmLzVlcnFXcnRseXhZVU9tNnNzbGlSbEpRa3ZYanhvdTJSSTBlYTJkall1RVpFUkhTUGlvcnEwNzU5KzNoWFYxZjM1czJiZzUyZEhVaWxVaENMeFJ3cDFOYldRbVZsSlZ5NGNBSCsrdXN2dUhIakJsUlhWOFB0MjdmQnhzWUc3dDI3eDd6QWZMTm16Y0RXMWhZY0hSMmhhZE9tb0ZBb3dOUFRFNlRTL3l2UzE5WFZ3ZjM3OStIZXZYdncxMTkvd2MyYk4rSHExYXVYZnZycHA3SWZmdmhCZS9UbzBlSjc5KzVkallpSStOUGQzYjFhbzlIVVdoTldyTHBhT1hic1dOSFJvMGVsRnk5ZXRLdXNyR3dLQUE1dDI3YnQ0T25wR1JjVkZSWHA1K2ZYcm5uejVoNTJkblpnYjI4UHRyYTJJSlZLUVNLUmdGZ3NCcEZJQkNLUmlDTUlac0t5dXJvNlFFVHVpOEJlVTFNRGQrN2NnYnQzNzBKMWRUWGN1blhyNHRtelozODZkdXpZNGNyS3l2MG5UcHc0RGdDM0ZBckZYd3FGb2lvc0xLeDJ3NFlOYUkweGFqVGJGYSsvL3JybzBxVkxrZ3NYTHRpY1AzL2U5dno1ODAwQXdON1IwZEhaMzkrL3BWd3VENVRMNWY3QndjR0J6czdPaWlaTm1qUzNzYkZwYW1OajAxUWlrZGd5T0FuVGFtdHJxKy9kdS9kWGRYWDFYM2Z1M1BuejJyVnJGMDZkT25YNjVzMmJaMi9ldkhuNjdObXovN2x4NDhZMUFMamo1ZVYxMTh2THExcWhVTnh6ZDNlL3YzYnRXclQyK0RUYS9jcUpFeWVLTGx5NElLNnNySlNJUkNMcHVYUG5wT2ZPblpNQmdDMEF5QUJBQ2dDU3Y3OUVqVGxXQWpiOCsrdiszMSsxQUZBREFOWGUzdDQxUGo0K3RYVjFkYldlbnA3M1BUMDk2OUxTMHJDeEJZZ2xOYzlTVWxKRVlyRllKQktKUlB2Mzd4ZUpSQ0pBUkJZcjRSSUFBQURFeGNVaEltSmRYUjAyUnFBelk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekpneFk4YU1HVE5tekN6Wi9qL2V6djBFVnNFMGp3QUFBQUJKUlU1RXJrSmdnZz09JztcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG9vbHRpcDtcbiIsInZhciBlbnNlbWJsX3Jlc3RfYXBpID0gcmVxdWlyZShcInRudC5lbnNlbWJsXCIpO1xudmFyIG5hdiA9IHJlcXVpcmUoXCJjdHR2Lmdlbm9tZUJyb3dzZXJOYXZcIik7XG52YXIgYnJvd3Nlcl90b29sdGlwcyA9IHJlcXVpcmUoXCIuL3Rvb2x0aXBzLmpzXCIpO1xuXG52YXIgY3R0dl9nZW5vbWVfYnJvd3NlciA9IGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5hdlRoZW1lID0gbmF2KClcbiAgICAgICAgLnNob3dfb3B0aW9ucyh0cnVlKTtcblxuICAgIHZhciBzaG93X2xpbmtzICAgPSB0cnVlO1xuICAgIHZhciBjaHIgPSAwO1xuXG4gICAgLy8gZ3dhc1xuICAgIHZhciByZXN0ID0gZW5zZW1ibF9yZXN0X2FwaSgpO1xuICAgIHZhciBnd2FzX2RhdGEgPSBbXTtcbiAgICB2YXIgZ3dhc19leHRlbnQgPSBbXTtcblxuICAgIC8vIGRpdl9pZHMgdG8gZGlzcGxheSBkaWZmZXJlbnQgZWxlbWVudHNcbiAgICAvLyBUaGV5IGhhdmUgdG8gYmUgc2V0IGR5bmFtaWNhbGx5IGJlY2F1c2UgdGhlIElEcyBjb250YWluIHRoZSBkaXZfaWQgb2YgdGhlIG1haW4gZWxlbWVudCBjb250YWluaW5nIHRoZSBwbHVnLWluXG4gICAgdmFyIGRpdl9pZDtcblxuICAgIHZhciBmZ0NvbG9yID0gXCIjNTg2NDcxXCI7XG5cbiAgICB2YXIgZ0Jyb3dzZXI7XG5cbiAgICB2YXIgZ0Jyb3dzZXJUaGVtZSA9IGZ1bmN0aW9uKGdCLCBjdHR2UmVzdEFwaSwgZGl2KSB7XG5cdC8vIFNldCB0aGUgZGlmZmVyZW50ICNpZHMgZm9yIHRoZSBodG1sIGVsZW1lbnRzIChuZWVkcyB0byBiZSBsaXZlbHkgYmVjYXVzZSB0aGV5IGRlcGVuZCBvbiB0aGUgZGl2X2lkKVxuXHRzZXRfZGl2X2lkKGRpdik7XG5cdGdCcm93c2VyID0gZ0I7XG5cbiAgICAvLyBOYXZpZ2F0aW9uXG5cdG5hdlRoZW1lIChnQiwgZGl2KTtcblxuICAgIC8vIHRvb2x0aXBzXG4gICAgdmFyIHRvb2x0aXBzID0gYnJvd3Nlcl90b29sdGlwcygpXG4gICAgICAgIC5jdHR2UmVzdEFwaSAoY3R0dlJlc3RBcGkpO1xuXG5cbiAgICAvLyBUcmFuc2NyaXB0IGRhdGFcbiAgICB2YXIgdHJhbnNjcmlwdF9kYXRhID0gdG50LmJvYXJkLnRyYWNrLmRhdGEuZ2Vub21lLnRyYW5zY3JpcHQoKTtcbiAgICB0cmFuc2NyaXB0X2RhdGEudXBkYXRlKCkuc3VjY2VzcyhmdW5jdGlvbiAodHJhbnNjcmlwdHMpIHtcbiAgICAgICAgdmFyIG5ld0dlbmVzID0ge307XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0cmFuc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHQgPSB0cmFuc2NyaXB0c1tpXTtcbiAgICAgICAgICAgIHZhciBteWdlbmUgPSB0LmdlbmUuZXh0ZXJuYWxfbmFtZVxuICAgICAgICAgICAgaWYgKGdCLmdlbmUoKSA9PT0gdC5nZW5lLmlkKSB7XG4gICAgICAgICAgICAgICAgbmV3R2VuZXNbdC5leHRlcm5hbF9uYW1lXSA9IHQ7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5ld0dlbmVzW215Z2VuZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHQuZXhvbnMgPSBbe1xuICAgICAgICAgICAgICAgICAgICBzdGFydCA6IHQuZ2VuZS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgZW5kIDogdC5nZW5lLmVuZCxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0IDogMCxcbiAgICAgICAgICAgICAgICAgICAgaXNHZW5lIDogdHJ1ZVxuICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgICAgIHQuc3RhcnQgPSB0LmdlbmUuc3RhcnQ7XG4gICAgICAgICAgICAgICAgdC5lbmQgPSB0LmdlbmUuZW5kO1xuICAgICAgICAgICAgICAgIHQuaW50cm9ucyA9IFtdO1xuICAgICAgICAgICAgICAgIHQuZGlzcGxheV9sYWJlbCA9IHQuZ2VuZS5zdHJhbmQgPT09IDEgPyAobXlnZW5lICsgXCI+XCIpIDogKFwiPFwiICsgbXlnZW5lKTtcbiAgICAgICAgICAgICAgICB0LmlzR2VuZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgbmV3R2VuZXNbbXlnZW5lXSA9IHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsZW1zID0gW107XG4gICAgICAgIGZvciAodmFyIGVsZW0gaW4gbmV3R2VuZXMpIHtcbiAgICAgICAgICAgIGlmIChuZXdHZW5lcy5oYXNPd25Qcm9wZXJ0eShlbGVtKSkge1xuICAgICAgICAgICAgICAgIGVsZW1zLnB1c2gobmV3R2VuZXNbZWxlbV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtcztcbiAgICB9KTtcblxuICAgIC8vIEF1eCB0cmFjayBmb3IgbGFiZWxcbiAgICB2YXIgdHJhbnNjcmlwdF9sYWJlbF90cmFjayA9IHRudC5ib2FyZC50cmFjaygpXG4gICAgLmxhYmVsIChcIkdlbmVzIC8gVHJhbnNjcmlwdHNcIilcbiAgICAuaGVpZ2h0KDIwKVxuICAgIC5iYWNrZ3JvdW5kX2NvbG9yIChcIiNFRUVGRkZcIilcbiAgICAuZGlzcGxheSh0bnQuYm9hcmQudHJhY2suZmVhdHVyZS5ibG9jaygpKVxuICAgIC5kYXRhKHRudC5ib2FyZC50cmFjay5kYXRhKClcbiAgICAgICAgLnVwZGF0ZSh0bnQuYm9hcmQudHJhY2suZGF0YS5yZXRyaWV2ZXIuc3luYygpXG4gICAgICAgICAgICAucmV0cmlldmVyIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICk7XG5cbiAgICAvLyBUUkFDS1MhXG4gICAgLy8gR3dhcyB0cmFja1xuICAgIHZhciBnd2FzX3VwZGF0ZXIgPSB0bnQuYm9hcmQudHJhY2suZGF0YS5yZXRyaWV2ZXIuc3luYygpXG4gICAgICAgIC5yZXRyaWV2ZXIgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGd3YXNfZGF0YTtcbiAgICAgICAgfSk7XG4gICAgdmFyIGd3YXNfZGlzcGxheSA9IHRudC5ib2FyZC50cmFjay5mZWF0dXJlLnBpbigpXG4gICAgICAgIC5kb21haW4oWzAuMywxLjJdKVxuICAgICAgICAuZm9yZWdyb3VuZF9jb2xvcihcIiMzZThiYWRcIilcbiAgICAgICAgLy8ub25fY2xpY2sgKGd3YXNfdG9vbHRpcCk7XG4gICAgdmFyIGd3YXNfZ3VpZGVyID0gZ3dhc19kaXNwbGF5Lmd1aWRlcigpO1xuICAgIGd3YXNfZGlzcGxheS5ndWlkZXIgKGZ1bmN0aW9uICh3aWR0aCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgcDBfb2Zmc2V0ID0gMTYuMTE7XG4gICAgICAgIHZhciBwMDVfb2Zmc2V0ID0gNDMuODhcblxuICAgICAgICAvLyBwdmFsdWUgMFxuICAgICAgICB0cmFjay5nXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwieDFcIiwgMClcbiAgICAgICAgLmF0dHIoXCJ5MVwiLCBwMF9vZmZzZXQpXG4gICAgICAgIC8vLmF0dHIoXCJ5MVwiLCB5X29mZnNldClcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCB3aWR0aClcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgcDBfb2Zmc2V0KVxuICAgICAgICAvLy5hdHRyKFwieTJcIiwgeV9vZmZzZXQpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwibGlnaHRncmV5XCIpO1xuICAgICAgICB0cmFjay5nXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCB3aWR0aCAtIDUwKVxuICAgICAgICAuYXR0cihcInlcIiwgcDBfb2Zmc2V0ICsgMTApXG4gICAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIDEwKVxuICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJsaWdodGdyZXlcIilcbiAgICAgICAgLnRleHQoXCJwdmFsdWUgMFwiKTtcblxuICAgICAgICAvLyBwdmFsdWUgMC41XG4gICAgICAgIC8vIHRyYWNrLmdcbiAgICAgICAgLy8gXHQuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAvLyBcdC5hdHRyKFwieDFcIiwgMClcbiAgICAgICAgLy8gXHQuYXR0cihcInkxXCIsIHAwNV9vZmZzZXQpXG4gICAgICAgIC8vIFx0LmF0dHIoXCJ4MlwiLCB3aWR0aClcbiAgICAgICAgLy8gXHQuYXR0cihcInkyXCIsIHAwNV9vZmZzZXQpXG4gICAgICAgIC8vIFx0LmF0dHIoXCJzdHJva2VcIiwgXCJsaWdodGdyZXlcIilcbiAgICAgICAgLy8gdHJhY2suZ1xuICAgICAgICAvLyBcdC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC8vIFx0LmF0dHIoXCJ4XCIsIHdpZHRoIC0gNTApXG4gICAgICAgIC8vIFx0LmF0dHIoXCJ5XCIsIHAwNV9vZmZzZXQgKyAxMClcbiAgICAgICAgLy8gXHQuYXR0cihcImZvbnQtc2l6ZVwiLCAxMClcbiAgICAgICAgLy8gXHQuYXR0cihcImZpbGxcIiwgXCJsaWdodGdyZXlcIilcbiAgICAgICAgLy8gXHQudGV4dChcInB2YWx1ZSAwLjVcIik7XG5cbiAgICAgICAgLy8gY29udGludWUgd2l0aCByZXN0IG9mIGd1aWRlclxuICAgICAgICBnd2FzX2d1aWRlci5jYWxsKHRyYWNrLCB3aWR0aCk7XG5cbiAgICB9KTtcblxuICAgIHZhciBnd2FzX3RyYWNrID0gdG50LmJvYXJkLnRyYWNrKClcbiAgICAgICAgLmxhYmVsKFwiR1dBUyBzbnBzXCIpXG5cdCAgICAuaGVpZ2h0KDYwKVxuXHQgICAgLmJhY2tncm91bmRfY29sb3IoXCJ3aGl0ZVwiKVxuXHQgICAgLmRpc3BsYXkoZ3dhc19kaXNwbGF5KVxuXHQgICAgLmRhdGEgKHRudC5ib2FyZC50cmFjay5kYXRhKClcblx0XHQgICAudXBkYXRlKCBnd2FzX3VwZGF0ZXIgKVxuXHRcdCAgKTtcblxuICAgIC8vIFRyYW5zY3JpcHQgLyBHZW5lIHRyYWNrXG4gICAgdmFyIHRyYW5zY3JpcHRfdHJhY2sgPSB0bnQuYm9hcmQudHJhY2soKVxuICAgICAgICAuaGVpZ2h0KDMwMClcbiAgICAgICAgLmJhY2tncm91bmRfY29sb3IoXCIjRUVFRkZGXCIpXG4gICAgICAgIC5kaXNwbGF5KHRudC5ib2FyZC50cmFjay5mZWF0dXJlLmdlbm9tZS50cmFuc2NyaXB0KClcbiAgICAgICAgICAgIC5mb3JlZ3JvdW5kX2NvbG9yIChmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgIGlmICh0LmlzR2VuZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCIjMDA1NTg4XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBcInJlZFwiO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbl9jbGljayAodG9vbHRpcHMuZ2VuZSlcbiAgICAgICAgKVxuICAgICAgICAuZGF0YSh0cmFuc2NyaXB0X2RhdGEpO1xuXG4gICAgLy8gU2VxdWVuY2UgdHJhY2tcbiAgICB2YXIgc2VxdWVuY2VfdHJhY2sgPSB0bnQuYm9hcmQudHJhY2soKVxuICAgICAgICAubGFiZWwgKFwic2VxdWVuY2VcIilcbiAgICAgICAgLmhlaWdodCgzMClcbiAgICAgICAgLmJhY2tncm91bmRfY29sb3IoXCJ3aGl0ZVwiKVxuICAgICAgICAuZGlzcGxheSh0bnQuYm9hcmQudHJhY2suZmVhdHVyZS5nZW5vbWUuc2VxdWVuY2UoKSlcbiAgICAgICAgLmRhdGEodG50LmJvYXJkLnRyYWNrLmRhdGEuZ2Vub21lLnNlcXVlbmNlKClcbiAgICAgICAgICAgIC5saW1pdCgxNTApXG4gICAgICAgICk7XG5cblxuXHRnQnJvd3NlcihkaXYpO1xuXHRnQnJvd3NlclxuICAgICAgICAvLy5hZGRfdHJhY2soZ2VuZV90cmFjaylcbiAgICAgICAgLmFkZF90cmFjayhnd2FzX3RyYWNrKVxuICAgICAgICAuYWRkX3RyYWNrKHNlcXVlbmNlX3RyYWNrKVxuICAgICAgICAuYWRkX3RyYWNrKHRyYW5zY3JpcHRfbGFiZWxfdHJhY2spXG4gICAgICAgIC5hZGRfdHJhY2sodHJhbnNjcmlwdF90cmFjayk7XG5cbiAgICB2YXIgdXJsID0gY3R0dlJlc3RBcGkudXJsLmZpbHRlcmJ5KHtcbiAgICAgICAgZ2VuZSA6IGdCLmdlbmUoKSxcbiAgICAgICAgZGF0YXNvdXJjZSA6IFwiZ3dhc1wiLFxuICAgICAgICBzaXplIDogMTAwMCxcbiAgICAgICAgZmllbGRzIDogW1xuICAgICAgICAgICAgXCJiaW9sb2dpY2FsX29iamVjdC5lZm9faW5mb1wiLCAvLyBkaXNlYXNlXG4gICAgICAgICAgICBcImV2aWRlbmNlLmV2aWRlbmNlX2NoYWluXCJcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIGN0dHZSZXN0QXBpLmNhbGwodXJsKVxuICAgIC50aGVuIChmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwLmJvZHkpO1xuICAgICAgICB2YXIgc25wcyA9IHt9O1xuICAgICAgICAvLyBmb3IgKHZhciBpPTA7IGk8cmVzcC5ib2R5LmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gICAgIHZhciB0aGlzX3NucCA9IHJlc3AuYm9keS5kYXRhW2ldLmV2aWRlbmNlO1xuICAgICAgICAvLyAgICAgdmFyIHRoaXNfZGlzZWFzZSA9IHJlc3AuYm9keS5kYXRhW2ldLmJpb2xvZ2ljYWxfb2JqZWN0O1xuICAgICAgICAvLyAgICAgdmFyIHNucF9uYW1lID0gdGhpc19zbnAuZXZpZGVuY2VfY2hhaW5bMF0uYmlvbG9naWNhbF9vYmplY3QuYWJvdXRbMF0uc3BsaXQoXCIvXCIpLnBvcCgpO1xuICAgICAgICAvLyAgICAgaWYgKHNucHNbc25wX25hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gICAgICAgICBzbnBzW3NucF9uYW1lXSA9IHt9O1xuICAgICAgICAvLyAgICAgICAgIHNucHNbc25wX25hbWVdLnN0dWR5ID0gW107XG4gICAgICAgIC8vICAgICAgICAgc25wc1tzbnBfbmFtZV0ubmFtZSA9IHNucF9uYW1lO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgc25wc1tzbnBfbmFtZV0uc3R1ZHkucHVzaCAoe1xuICAgICAgICAvLyAgICAgICAgIFwicG1pZFwiICAgOiAgdGhpc19zbnAuZXZpZGVuY2VfY2hhaW5bMV0uZXZpZGVuY2UucHJvdmVuYW5jZV90eXBlLmxpdGVyYXR1cmUucHVibWVkX3JlZnNbMF0uc3BsaXQoXCIvXCIpLnBvcCgpLFxuICAgICAgICAvLyAgICAgICAgIFwicHZhbHVlXCIgOiB0aGlzX3NucC5ldmlkZW5jZV9jaGFpblsxXS5ldmlkZW5jZS5hc3NvY2lhdGlvbl9zY29yZS5wdmFsdWUudmFsdWUudG9FeHBvbmVudGlhbCgpLFxuICAgICAgICAvLyAgICAgICAgIFwibmFtZVwiICAgOiB0aGlzX3NucC5ldmlkZW5jZV9jaGFpblswXS5iaW9sb2dpY2FsX29iamVjdC5hYm91dFswXS5zcGxpdChcIi9cIikucG9wKCksXG4gICAgICAgIC8vICAgICAgICAgXCJlZm9cIiAgICA6IHRoaXNfZGlzZWFzZS5lZm9faW5mb1swXVswXS5lZm9faWQsXG4gICAgICAgIC8vICAgICAgICAgXCJlZm9fbGFiZWxcIiA6IHRoaXNfZGlzZWFzZS5lZm9faW5mb1swXVswXS5sYWJlbFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgdmFyIHNucF9uYW1lcyA9IE9iamVjdC5rZXlzKHNucHMpO1xuXG4gICAgICAgIHZhciBtaW4gPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICB2YXIgbTtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG0gPSArYXJyW2ldLnB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAobSA+ICthcnJbaV0ucHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtID0gYXJyW2ldLnB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB2YXJfdXJsID0gcmVzdC51cmwudmFyaWF0aW9uICh7XG4gICAgICAgICAgICBzcGVjaWVzIDogXCJodW1hblwiXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3QuY2FsbCh2YXJfdXJsLCB7XG4gICAgICAgICAgICBcImlkc1wiIDogc25wX25hbWVzXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuIChmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgdmFyIG1pbl9wb3MsIG1heF9wb3M7XG4gICAgICAgICAgICBnd2FzX2RhdGEgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIHNucF9uYW1lIGluIHJlc3AuYm9keSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwLmJvZHkuaGFzT3duUHJvcGVydHkoc25wX25hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzbnAgPSByZXNwLmJvZHlbc25wX25hbWVdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHNucHNbc25wX25hbWVdO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLnBvcyA9IHNucC5tYXBwaW5nc1swXS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgaW5mby52YWwgPSAxIC0gbWluKGluZm9bXCJzdHVkeVwiXSk7XG4gICAgICAgICAgICAgICAgICAgIGd3YXNfZGF0YS5wdXNoKGluZm8pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3dhc19leHRlbnQgPSBkMy5leHRlbnQoZ3dhc19kYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnBvc1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGdCLnN0YXJ0KCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cblx0Ly8gVGhlIEdlbmVJbmZvIFBhbmVsXG5cdGQzLnNlbGVjdChkaXYpLnNlbGVjdChcIi50bnRfZ3JvdXBEaXZcIilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJlUGVla19nZW5lX2luZm9cIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl9nZW5lX2luZm9cIikgLy8gQm90aCBuZWVkZWQ/XG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCBnQnJvd3Nlci53aWR0aCgpICsgXCJweFwiKTtcblxuXHQvLyBMaW5rcyBkaXZcblx0dmFyIGxpbmtzX3BhbmUgPSBkMy5zZWxlY3QoZGl2KVxuXHQgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9saW5rc19wYW5lXCIpXG5cdCAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKCkge2lmIChzaG93X2xpbmtzKSB7cmV0dXJuIFwiYmxvY2tcIn0gZWxzZSB7cmV0dXJuIFwibm9uZVwifX0pO1xuXG5cdC8vIGVuc2VtYmxcblx0bGlua3NfcGFuZVxuXHQgICAgLmFwcGVuZChcInNwYW5cIilcblx0ICAgIC50ZXh0KFwiT3BlbiBpbiBFbnNlbWJsXCIpO1xuXHR2YXIgZW5zZW1ibExvYyA9IGxpbmtzX3BhbmVcblx0ICAgIC5hcHBlbmQoXCJpXCIpXG5cdCAgICAuYXR0cihcInRpdGxlXCIsIFwib3BlbiByZWdpb24gaW4gZW5zZW1ibFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1leHRlcm5hbC1saW5rIGZhLTJ4XCIpXG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHt2YXIgbGluayA9IGJ1aWxkRW5zZW1ibExpbmsoKTsgd2luZG93Lm9wZW4obGluaywgXCJfYmxhbmtcIil9KTtcblxuICAgIH07XG5cbi8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbi8vLyBSRU5ERVJJTkcgRlVOQ1RJT05TIC8vLy9cbi8vLyoqKioqKioqKioqKioqKioqKioqKi8vLy9cbiAgICAvLyBBUElcblxuXG4gICAgZ0Jyb3dzZXJUaGVtZS5jaHIgPSBmdW5jdGlvbiAoYykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjaHI7XG5cdH1cblx0Y2hyID0gYztcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGdCcm93c2VyVGhlbWUuc2hvd19saW5rcyA9IGZ1bmN0aW9uKGIpIHtcblx0c2hvd19saW5rcyA9IGI7XG5cdHJldHVybiBnQnJvd3NlclRoZW1lO1xuICAgIH07XG5cbiAgICBnQnJvd3NlclRoZW1lLmZvcmVncm91bmRfY29sb3IgPSBmdW5jdGlvbiAoYykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBmZ0NvbG9yO1xuXHR9XG5cdGZnQ29sb3IgPSBjO1xuXHRyZXR1cm4gZ0Jyb3dzZXJUaGVtZTtcbiAgICB9O1xuXG5cbiAgICB2YXIgc2V0X2Rpdl9pZCA9IGZ1bmN0aW9uKGRpdikge1xuXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIik7XG4gICAgfTtcblxuXG4gICAgLy8vKioqKioqKioqKioqKioqKioqKioqLy8vL1xuICAgIC8vLyBVVElMSVRZIE1FVEhPRFMgICAgIC8vLy9cbiAgICAvLy8qKioqKioqKioqKioqKioqKioqKiovLy8vXG4gICAgLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgdmFyIGJ1aWxkRW5zZW1ibExpbmsgPSBmdW5jdGlvbigpIHtcblx0dmFyIHVybCA9IFwiaHR0cDovL3d3dy5lbnNlbWJsLm9yZy9cIiArIGdCcm93c2VyLnNwZWNpZXMoKSArIFwiL0xvY2F0aW9uL1ZpZXc/cj1cIiArIGdCcm93c2VyLmNocigpICsgXCIlM0FcIiArIGdCcm93c2VyLmZyb20oKSArIFwiLVwiICsgZ0Jyb3dzZXIudG8oKTtcblx0cmV0dXJuIHVybDtcbiAgICB9O1xuXG5cbiAgICAvLyBQdWJsaWMgbWV0aG9kc1xuXG5cbiAgICAvKiogPHN0cm9uZz5idWlsZEVuc2VtYmxHZW5lTGluazwvc3Ryb25nPiByZXR1cm5zIHRoZSBFbnNlbWJsIHVybCBwb2ludGluZyB0byB0aGUgZ2VuZSBzdW1tYXJ5IG9mIHRoZSBnaXZlbiBnZW5lXG5cdEBwYXJhbSB7U3RyaW5nfSBnZW5lIFRoZSBFbnNlbWJsIGdlbmUgaWQuIFNob3VsZCBiZSBhIHZhbGlkIElEIG9mIHRoZSBmb3JtIEVOU0dYWFhYWFhYWFhcIlxuXHRAcmV0dXJucyB7U3RyaW5nfSBUaGUgRW5zZW1ibCBVUkwgZm9yIHRoZSBnaXZlbiBnZW5lXG4gICAgKi9cbiAgICB2YXIgYnVpbGRFbnNlbWJsR2VuZUxpbmsgPSBmdW5jdGlvbihlbnNJRCkge1xuXHQvL1wiaHR0cDovL3d3dy5lbnNlbWJsLm9yZy9Ib21vX3NhcGllbnMvR2VuZS9TdW1tYXJ5P2c9RU5TRzAwMDAwMTM5NjE4XCJcblx0dmFyIHVybCA9IFwiaHR0cDovL3d3dy5lbnNlbWJsLm9yZy9cIiArIGdCcm93c2VyLnNwZWNpZXMoKSArIFwiL0dlbmUvU3VtbWFyeT9nPVwiICsgZW5zSUQ7XG5cdHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIHJldHVybiBnQnJvd3NlclRoZW1lO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gY3R0dl9nZW5vbWVfYnJvd3NlcjtcbiIsIlxudmFyIHRudF90b29sdGlwID0gcmVxdWlyZShcInRudC50b29sdGlwXCIpO1xuXG52YXIgdG9vbHRpcHMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY3R0dlJlc3RBcGk7XG5cbiAgICB2YXIgbSA9IHt9O1xuXG4gICAgLy8gVG9vbHRpcCBvbiBnZW5lc1xuICAgIG0uZ2VuZSA9IGZ1bmN0aW9uIChnZW5lKSB7XG5cbiAgICAgICAgLy8gR2VuZSB0b29sdGlwIGRhdGFcbiAgICAgICAgdmFyIHRvb2x0aXBfb2JqID0gZnVuY3Rpb24gKGVuc2VtYmxEYXRhLCBjdHR2RGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZW5zZW1ibERhdGEpO1xuICAgICAgICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAgICAgICAgb2JqLmhlYWRlciA9IGVuc2VtYmxEYXRhLmdlbmUuZXh0ZXJuYWxfbmFtZSArIFwiIChcIiArIGVuc2VtYmxEYXRhLmdlbmUuaWQgKyBcIilcIjtcbiAgICAgICAgICAgIG9iai5yb3dzID0gW107XG5cbiAgICAgICAgICAgIC8vIEFzc29jaWF0aW9ucyBhbmQgdGFyZ2V0IGxpbmtzIG1heWJlXG4gICAgICAgICAgICB2YXIgYXNzb2NpYXRpb25zVmFsdWU7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0VmFsdWU7XG4gICAgICAgICAgICBpZiAoY3R0dkRhdGEgJiYgY3R0dkRhdGEuZGF0YSAmJiBjdHR2RGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBhc3NvY2lhdGlvbnNWYWx1ZSA9IFwiPGEgaHJlZj0nIy90YXJnZXQvXCIgKyBlbnNlbWJsRGF0YS5pZCArIFwiL2Fzc29jaWF0aW9ucyc+XCIgKyAoY3R0dkRhdGEuZGF0YS5sZW5ndGggLSAxKSArIFwiIGRpc2Vhc2UgYXNzb2NpYXRpb25zPC9hPiBcIjtcbiAgICAgICAgICAgICAgICB0YXJnZXRWYWx1ZSA9IFwiPGEgaHJlZj0nIy90YXJnZXQvXCIgKyBlbnNlbWJsRGF0YS5pZCArIFwiJz5WaWV3IENUVFYgcHJvZmlsZTwvYT5cIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqLnJvd3MucHVzaCAoe1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiR2VuZVwiLFxuICAgICAgICAgICAgICAgIFwidmFsdWVcIiA6IFwiXCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgb2JqLnJvd3MucHVzaCgge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQmlvdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwidmFsdWVcIiA6IGVuc2VtYmxEYXRhLmdlbmUuYmlvdHlwZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvYmoucm93cy5wdXNoKHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkxvY2F0aW9uXCIsXG4gICAgICAgICAgICAgICAgXCJ2YWx1ZVwiIDogXCI8YSB0YXJnZXQ9J19ibGFuaycgaHJlZj0naHR0cDovL3d3dy5lbnNlbWJsLm9yZy9Ib21vX3NhcGllbnMvTG9jYXRpb24vVmlldz9kYj1jb3JlO2c9XCIgKyBlbnNlbWJsRGF0YS5pZCArIFwiJz5cIiArIGVuc2VtYmxEYXRhLmdlbmUuc2VxX3JlZ2lvbl9uYW1lICsgXCI6XCIgKyBlbnNlbWJsRGF0YS5nZW5lLnN0YXJ0ICsgXCItXCIgKyBlbnNlbWJsRGF0YS5nZW5lLmVuZCArIFwiPC9hPlwiXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChhc3NvY2lhdGlvbnNWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgb2JqLnJvd3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQXNzb2NpYXRpb25zXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIiA6IGFzc29jaWF0aW9uc1ZhbHVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGFyZ2V0VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG9iai5yb3dzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNUVFYgUHJvZmlsZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCIgOiB0YXJnZXRWYWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqLnJvd3MucHVzaCgge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiRGVzY3JpcHRpb25cIixcbiAgICAgICAgICAgICAgICBcInZhbHVlXCIgOiBlbnNlbWJsRGF0YS5nZW5lLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFlbnNlbWJsRGF0YS5pc0dlbmUpIHtcbiAgICAgICAgICAgICAgICBvYmoucm93cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJUcmFuc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIiA6IFwiXCJcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIG9iai5yb3dzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIk5hbWVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiIDogZW5zZW1ibERhdGEudHJhbnNjcmlwdC5leHRlcm5hbF9uYW1lXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBvYmoucm93cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJJRFwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCIgOiBcIjxhIHRhcmdldD0nX2JsYW5rJyBocmVmPSdodHRwOi8vd3d3LmVuc2VtYmwub3JnL0hvbW9fc2FwaWVucy9UcmFuc2NyaXB0L1N1bW1hcnk/ZGI9Y29yZTt0PVwiICsgZW5zZW1ibERhdGEuaWQgKyBcIic+XCIgKyBlbnNlbWJsRGF0YS5pZCArIFwiPC9hPlwiXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBvYmoucm93cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJiaW90eXBlXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIiA6IGVuc2VtYmxEYXRhLnRyYW5zY3JpcHQuYmlvdHlwZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgdmFyIHQgPSB0bnRfdG9vbHRpcC50YWJsZSgpXG4gICAgICAgIC5pZCgxKTtcbiAgICAgICAgdmFyIGV2ZW50ID0gZDMuZXZlbnQ7XG4gICAgICAgIHZhciBlbGVtID0gdGhpcztcblxuICAgICAgICB2YXIgcyA9IHRudF90b29sdGlwLnBsYWluKClcbiAgICAgICAgLmlkKDEpO1xuXG4gICAgICAgIHZhciB1cmwgPSBjdHR2UmVzdEFwaS51cmwuYXNzb2NpYXRpb25zICh7XG4gICAgICAgICAgICBcImdlbmVcIiA6IGdlbmUuZ2VuZS5pZCxcbiAgICAgICAgICAgIFwiZGF0YXN0cnVjdHVyZVwiIDogXCJmbGF0XCJcbiAgICAgICAgfSk7XG4gICAgICAgIGN0dHZSZXN0QXBpLmNhbGwodXJsKVxuICAgICAgICAuY2F0Y2ggKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICB2YXIgb2JqID0gdG9vbHRpcF9vYmooZ2VuZSk7XG4gICAgICAgICAgICB0LmNhbGwoZWxlbSwgb2JqLCBldmVudCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0gdG9vbHRpcF9vYmogKGdlbmUsIHJlc3AuYm9keSk7XG4gICAgICAgICAgICB0LmNhbGwoZWxlbSwgb2JqLCBldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzLmNhbGwoZWxlbSwge1xuICAgICAgICAgICAgaGVhZGVyIDogZ2VuZS5nZW5lLmV4dGVybmFsX25hbWUgKyBcIiAoXCIgKyBnZW5lLmdlbmUuaWQgKyBcIilcIixcbiAgICAgICAgICAgIGJvZHkgOiBcIjxpIGNsYXNzPSdmYSBmYS1zcGlubmVyIGZhLTJ4IGZhLXNwaW4nPjwvaT5cIlxuICAgICAgICB9KTtcblxuICAgIH07XG5cbiAgICBtLmN0dHZSZXN0QXBpID0gZnVuY3Rpb24gKGFwaSkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdHR2UmVzdEFwaTtcbiAgICAgICAgfVxuICAgICAgICBjdHR2UmVzdEFwaSA9IGFwaTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiBtO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG9vbHRpcHM7XG4iXX0=
