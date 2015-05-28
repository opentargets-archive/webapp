(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
module.exports = targetGenomeBrowser = require("./src/genomeBrowserNav.js");

},{"./src/genomeBrowserNav.js":3}],3:[function(require,module,exports){
var genome_browser_nav = function () {
    "use strict";

    var show_options = true;
    var show_title = true;
    var title = "";
    var orig = {};
    var theme = function (gB, div) {
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
            .text("Human Chr " + "XX");

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
                gB.start(orig)
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


        // The Browser div
        // We set up the origin:
        //
        if (gB.gene() !== undefined) {
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


    };

    //// API
    theme.left = function () {
        gB.move_left(1.5);
    };

    theme.right = function () {
        gB.move_right(1.5);
    };

    theme.zoomIn = function () {
        gB.zoom(0.5);
    }

    theme.zoomOut = function () {
        gB.zoom(1.5);
    }

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



    return theme;
};

module.exports = exports = genome_browser_nav;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5vbWVCcm93c2VyTmF2L25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5vbWVCcm93c2VyTmF2L2Zha2VfYjVhMWE2YTAuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvZ2Vub21lQnJvd3Nlck5hdi9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9nZW5vbWVCcm93c2VyTmF2L3NyYy9nZW5vbWVCcm93c2VyTmF2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRhcmdldEdlbm9tZUJyb3dzZXIgPSByZXF1aXJlKFwiLi9zcmMvZ2Vub21lQnJvd3Nlck5hdi5qc1wiKTtcbiIsInZhciBnZW5vbWVfYnJvd3Nlcl9uYXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgc2hvd19vcHRpb25zID0gdHJ1ZTtcbiAgICB2YXIgc2hvd190aXRsZSA9IHRydWU7XG4gICAgdmFyIHRpdGxlID0gXCJcIjtcbiAgICB2YXIgb3JpZyA9IHt9O1xuICAgIHZhciB0aGVtZSA9IGZ1bmN0aW9uIChnQiwgZGl2KSB7XG4gICAgICAgIHZhciBvcHRzX3BhbmUgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmFwcGVuZCAoXCJkaXZcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfb3B0aW9uc19wYW5lXCIpXG4gICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzaG93X29wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibm9uZVwiO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgb3B0c19wYW5lXG4gICAgICAgICAgICAuYXBwZW5kKFwic3BhblwiKVxuICAgICAgICAgICAgLnRleHQoXCJIdW1hbiBDaHIgXCIgKyBcIlhYXCIpO1xuXG4gICAgICAgIHZhciBsZWZ0X2J1dHRvbiA9IG9wdHNfcGFuZVxuICAgICAgICAgICAgLmFwcGVuZChcImlcIilcbiAgICAgICAgICAgIC5hdHRyKFwidGl0bGVcIiwgXCJnbyBsZWZ0XCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLWFycm93LWNpcmNsZS1sZWZ0IGZhLTJ4XCIpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCB0aGVtZS5sZWZ0KTtcblxuICAgICAgICB2YXIgem9vbUluX2J1dHRvbiA9IG9wdHNfcGFuZVxuICAgICAgICAgICAgLmFwcGVuZChcImlcIilcbiAgICAgICAgICAgIC5hdHRyKFwidGl0bGVcIiwgXCJ6b29tIGluXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY3R0dkdlbm9tZUJyb3dzZXJJY29uIGZhIGZhLXNlYXJjaC1wbHVzIGZhLTJ4XCIpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCB0aGVtZS56b29tSW4pO1xuXG4gICAgICAgIHZhciB6b29tT3V0X2J1dHRvbiA9IG9wdHNfcGFuZVxuICAgICAgICAgICAgLmFwcGVuZChcImlcIilcbiAgICAgICAgICAgIC5hdHRyKFwidGl0bGVcIiwgXCJ6b29tIG91dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImN0dHZHZW5vbWVCcm93c2VySWNvbiBmYSBmYS1zZWFyY2gtbWludXMgZmEtMnhcIilcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIHRoZW1lLnpvb21PdXQpO1xuXG4gICAgICAgIHZhciByaWdodF9idXR0b24gPSBvcHRzX3BhbmVcbiAgICAgICAgICAgIC5hcHBlbmQoXCJpXCIpXG4gICAgICAgICAgICAuYXR0cihcInRpdGxlXCIsIFwiZ28gcmlnaHRcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtYXJyb3ctY2lyY2xlLXJpZ2h0IGZhLTJ4XCIpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCB0aGVtZS5yaWdodCk7XG5cbiAgICAgICAgdmFyIG9yaWdMYWJlbCA9IG9wdHNfcGFuZVxuICAgICAgICAgICAgLmFwcGVuZChcImlcIilcbiAgICAgICAgICAgIC5hdHRyKFwidGl0bGVcIiwgXCJyZWxvYWQgbG9jYXRpb25cIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjdHR2R2Vub21lQnJvd3Nlckljb24gZmEgZmEtcmVmcmVzaCBmYS1sdFwiKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGdCLnN0YXJ0KG9yaWcpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB2YXIgYnJvd3Nlcl90aXRsZSA9IGQzLnNlbGVjdChkaXYpXG4gICAgICAgICAgICAuYXBwZW5kKFwiaDFcIilcbiAgICAgICAgICAgIC50ZXh0KHRpdGxlKVxuICAgICAgICAgICAgLnN0eWxlKFwiY29sb3JcIiwgdGhlbWUuZm9yZWdyb3VuZF9jb2xvcigpKVxuICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGlmIChzaG93X3RpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcImF1dG9cIlxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm5vbmVcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgLy8gVGhlIEJyb3dzZXIgZGl2XG4gICAgICAgIC8vIFdlIHNldCB1cCB0aGUgb3JpZ2luOlxuICAgICAgICAvL1xuICAgICAgICBpZiAoZ0IuZ2VuZSgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG9yaWcgPSB7XG4gICAgICAgICAgICAgICAgc3BlY2llcyA6IGdCcm93c2VyLnNwZWNpZXMoKSxcbiAgICAgICAgICAgICAgICBnZW5lICAgIDogZ0Jyb3dzZXIuZ2VuZSgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZyA9IHtcbiAgICAgICAgICAgICAgICBzcGVjaWVzIDogZ0Jyb3dzZXIuc3BlY2llcygpLFxuICAgICAgICAgICAgICAgIGNociAgICAgOiBnQnJvd3Nlci5jaHIoKSxcbiAgICAgICAgICAgICAgICBmcm9tICAgIDogZ0Jyb3dzZXIuZnJvbSgpLFxuICAgICAgICAgICAgICAgIHRvICAgICAgOiBnQnJvd3Nlci50bygpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgfTtcblxuICAgIC8vLy8gQVBJXG4gICAgdGhlbWUubGVmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZ0IubW92ZV9sZWZ0KDEuNSk7XG4gICAgfTtcblxuICAgIHRoZW1lLnJpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBnQi5tb3ZlX3JpZ2h0KDEuNSk7XG4gICAgfTtcblxuICAgIHRoZW1lLnpvb21JbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZ0Iuem9vbSgwLjUpO1xuICAgIH1cblxuICAgIHRoZW1lLnpvb21PdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGdCLnpvb20oMS41KTtcbiAgICB9XG5cbiAgICB0aGVtZS5zaG93X29wdGlvbnMgPSBmdW5jdGlvbihiKSB7XG4gICAgICAgIHNob3dfb3B0aW9ucyA9IGI7XG4gICAgICAgIHJldHVybiB0aGVtZTtcbiAgICB9O1xuICAgIHRoZW1lLnNob3dfdGl0bGUgPSBmdW5jdGlvbihiKSB7XG4gICAgICAgIHNob3dfdGl0bGUgPSBiO1xuICAgICAgICByZXR1cm4gdGhlbWU7XG4gICAgfTtcbiAgICAgICAgXG4gICAgdGhlbWUudGl0bGUgPSBmdW5jdGlvbiAocykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aXRsZTtcbiAgICAgICAgfVxuICAgICAgICB0aXRsZSA9IHM7XG4gICAgICAgIHJldHVybiB0aGVtZTtcbiAgICB9O1xuXG4gICAgdGhlbWUuZm9yZWdyb3VuZF9jb2xvciA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZnQ29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgZmdDb2xvciA9IGM7XG4gICAgICAgIHJldHVybiB0aGVtZTtcbiAgICB9O1xuXG5cblxuICAgIHJldHVybiB0aGVtZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGdlbm9tZV9icm93c2VyX25hdjtcbiJdfQ==
