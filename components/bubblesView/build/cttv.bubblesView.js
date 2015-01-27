(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
// if (typeof bubblesView === "undefined") {
//     module.exports = bubblesView = {}
// }
// bubblesView.bubblesView = require("./src/bubblesView.js");
module.exports = bubblesView = require("./src/bubblesView.js");

},{"./src/bubblesView.js":3}],3:[function(require,module,exports){
var bubblesView = function () {
    "use strict";
    
    var conf = {
	width : 800,
	height : 300,
	format : d3.format(",d"),
	color : d3.scale.category20c(),
	flat : true,
	colorPalette : true,
	data : undefined,
	key : "value",
	onclick : function () {}
    };

    var focusNode; // undef by default
    var circle;
    
    // var diameter = elem[0].offsetWidth,
    //     format = d3.format(",d"),
    //     color = d3.scale.category20c(),
    //     isBubble = attrs.asBubble && attrs.asBubble.toLowerCase()==="true",
    //     useColorPalette = attrs.useColorPalette && attrs.useColorPalette.toLowerCase()==="true";


    /*
     * Render valid JSON data
     */ 
    var render = function(div) {
	var svg = d3.select(div)
	    .append("svg")
	    .attr("width", conf.width)
            .attr("height", conf.height);

	var pack = d3.layout.pack()
            .sort(null)
            .size([conf.width, conf.height])
            .padding(1.5);

	var data = processData(conf.data);
	focusNode = data;
	
        // remove all previous items before render
	// TODO: Not needed without updates!
        svg.selectAll('*').remove();
        // If we don't pass any data, return out of the element
        if (!data) return;
	var nodes = svg.selectAll(".node")
            .data(
                function(){
                    if (conf.flat){
                        return pack.nodes(getFlatData(data)).filter(function(d) { return !d.children; });
                    } else {
                        return pack.nodes(data);
                    }
                }()
            )
            .enter().append("g")
            .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	nodes
	    .on("click", conf.onclick);

        nodes.append("title")
            .text(function(d) { return d.name + ": " + conf.format(d.value); });

	// nodes = nodes.append("svg:a")
	//     .attr("xlink:href", function (d) {return "/app/#/associations?t=" + target + "&d=" + d.name;});
	
        circle = nodes.append ("circle");
        circle.attr ("r", function(d) { return d.r; });
        if (conf.flat){
            circle.style("fill", function(d) { return conf.color(conf.colorPalette ? d.name : d.parentName); });
        }
        nodes.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.name.substring(0, d.r / 3); });

	focusTo([data.x, data.y, data.r*2]);
    };

    ////////////////////////
    // Auxiliar functions
    ////////////////////////
    function processData (data) {
	return {name: "Root", children: data};
    }
    
    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function getFlatData(root) {
        var leaves = [];

        function recurse(name, node) {
            if (node.children) node.children.forEach (function(child) {
		recurse(node.name, child);
	    });
            else leaves.push({parentName: name || node.name, name: node.name, value: node.value});
        }

        recurse(null, root);
        return {children: leaves};
    };
    
    function focusTo (v) {
	console.log("V:");
	console.log(v);
	var k = conf.height / v[2];
	var view = v;
	var node = d3.selectAll("circle, text");
	node.attr("transform", function(d) { console.log(d); return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
	circle.attr("r", function(d) { return d.r * k; });
    }

    //////////
    // API
    //////////
    render.focus = function (node) {
	var focus = node;
	var transition = d3.transition()
	    .duration (700)
	    .tween ("zoom", function () {
		var i = d3.interpolateZoom (view, [focus.x, focus.y, focus.r*2]);
		return function (t) {
		    focusTo(i(t));
		};
	    });
    };
    
    render.data = function (newData) {
	if (!arguments.length) {
	    return conf.data;
	}
	//target = newData.data[0]["biological_subject.gene_info.gene_name"];
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
    
    render.key = function (k) {
	if (!arguments.length) {
	    return conf.key;
	}
	conf.key = k;
	return this;
    };
    
    render.height = function (h) {
	if (!arguments.length) {
	    return conf.height;
	}
	conf.height = h;
	return this;
    };

    render.width = function (w) {
	if (!arguments.length) {
	    return conf.width;
	}
	conf.width = w;
	return this;
    };

    render.flat = function (bool) {
	if (!arguments.length) {
	    return conf.flat;
	}
	conf.flat = bool;
	return this;
    };
    
    return render;
};

module.exports = bubblesView;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvZmFrZV9hYTM2NjQ4Ny5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9zcmMvYnViYmxlc1ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsIi8vIGlmICh0eXBlb2YgYnViYmxlc1ZpZXcgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3ID0ge31cbi8vIH1cbi8vIGJ1YmJsZXNWaWV3LmJ1YmJsZXNWaWV3ID0gcmVxdWlyZShcIi4vc3JjL2J1YmJsZXNWaWV3LmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9idWJibGVzVmlldy5qc1wiKTtcbiIsInZhciBidWJibGVzVmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBcbiAgICB2YXIgY29uZiA9IHtcblx0d2lkdGggOiA4MDAsXG5cdGhlaWdodCA6IDMwMCxcblx0Zm9ybWF0IDogZDMuZm9ybWF0KFwiLGRcIiksXG5cdGNvbG9yIDogZDMuc2NhbGUuY2F0ZWdvcnkyMGMoKSxcblx0ZmxhdCA6IHRydWUsXG5cdGNvbG9yUGFsZXR0ZSA6IHRydWUsXG5cdGRhdGEgOiB1bmRlZmluZWQsXG5cdGtleSA6IFwidmFsdWVcIixcblx0b25jbGljayA6IGZ1bmN0aW9uICgpIHt9XG4gICAgfTtcblxuICAgIHZhciBmb2N1c05vZGU7IC8vIHVuZGVmIGJ5IGRlZmF1bHRcbiAgICB2YXIgY2lyY2xlO1xuICAgIFxuICAgIC8vIHZhciBkaWFtZXRlciA9IGVsZW1bMF0ub2Zmc2V0V2lkdGgsXG4gICAgLy8gICAgIGZvcm1hdCA9IGQzLmZvcm1hdChcIixkXCIpLFxuICAgIC8vICAgICBjb2xvciA9IGQzLnNjYWxlLmNhdGVnb3J5MjBjKCksXG4gICAgLy8gICAgIGlzQnViYmxlID0gYXR0cnMuYXNCdWJibGUgJiYgYXR0cnMuYXNCdWJibGUudG9Mb3dlckNhc2UoKT09PVwidHJ1ZVwiLFxuICAgIC8vICAgICB1c2VDb2xvclBhbGV0dGUgPSBhdHRycy51c2VDb2xvclBhbGV0dGUgJiYgYXR0cnMudXNlQ29sb3JQYWxldHRlLnRvTG93ZXJDYXNlKCk9PT1cInRydWVcIjtcblxuXG4gICAgLypcbiAgICAgKiBSZW5kZXIgdmFsaWQgSlNPTiBkYXRhXG4gICAgICovIFxuICAgIHZhciByZW5kZXIgPSBmdW5jdGlvbihkaXYpIHtcblx0dmFyIHN2ZyA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYud2lkdGgpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmhlaWdodCk7XG5cblx0dmFyIHBhY2sgPSBkMy5sYXlvdXQucGFjaygpXG4gICAgICAgICAgICAuc29ydChudWxsKVxuICAgICAgICAgICAgLnNpemUoW2NvbmYud2lkdGgsIGNvbmYuaGVpZ2h0XSlcbiAgICAgICAgICAgIC5wYWRkaW5nKDEuNSk7XG5cblx0dmFyIGRhdGEgPSBwcm9jZXNzRGF0YShjb25mLmRhdGEpO1xuXHRmb2N1c05vZGUgPSBkYXRhO1xuXHRcbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBwcmV2aW91cyBpdGVtcyBiZWZvcmUgcmVuZGVyXG5cdC8vIFRPRE86IE5vdCBuZWVkZWQgd2l0aG91dCB1cGRhdGVzIVxuICAgICAgICBzdmcuc2VsZWN0QWxsKCcqJykucmVtb3ZlKCk7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IHBhc3MgYW55IGRhdGEsIHJldHVybiBvdXQgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgaWYgKCFkYXRhKSByZXR1cm47XG5cdHZhciBub2RlcyA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxuICAgICAgICAgICAgLmRhdGEoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmYuZmxhdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFjay5ub2RlcyhnZXRGbGF0RGF0YShkYXRhKSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHsgcmV0dXJuICFkLmNoaWxkcmVuOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYWNrLm5vZGVzKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSgpXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY2hpbGRyZW4gPyBcIm5vZGVcIiA6IFwibGVhZiBub2RlXCI7IH0pXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7IH0pO1xuXHRub2Rlc1xuXHQgICAgLm9uKFwiY2xpY2tcIiwgY29uZi5vbmNsaWNrKTtcblxuICAgICAgICBub2Rlcy5hcHBlbmQoXCJ0aXRsZVwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lICsgXCI6IFwiICsgY29uZi5mb3JtYXQoZC52YWx1ZSk7IH0pO1xuXG5cdC8vIG5vZGVzID0gbm9kZXMuYXBwZW5kKFwic3ZnOmFcIilcblx0Ly8gICAgIC5hdHRyKFwieGxpbms6aHJlZlwiLCBmdW5jdGlvbiAoZCkge3JldHVybiBcIi9hcHAvIy9hc3NvY2lhdGlvbnM/dD1cIiArIHRhcmdldCArIFwiJmQ9XCIgKyBkLm5hbWU7fSk7XG5cdFxuICAgICAgICBjaXJjbGUgPSBub2Rlcy5hcHBlbmQgKFwiY2lyY2xlXCIpO1xuICAgICAgICBjaXJjbGUuYXR0ciAoXCJyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucjsgfSk7XG4gICAgICAgIGlmIChjb25mLmZsYXQpe1xuICAgICAgICAgICAgY2lyY2xlLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBjb25mLmNvbG9yKGNvbmYuY29sb3JQYWxldHRlID8gZC5uYW1lIDogZC5wYXJlbnROYW1lKTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZXMuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zZW1cIilcbiAgICAgICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWUuc3Vic3RyaW5nKDAsIGQuciAvIDMpOyB9KTtcblxuXHRmb2N1c1RvKFtkYXRhLngsIGRhdGEueSwgZGF0YS5yKjJdKTtcbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQXV4aWxpYXIgZnVuY3Rpb25zXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0RhdGEgKGRhdGEpIHtcblx0cmV0dXJuIHtuYW1lOiBcIlJvb3RcIiwgY2hpbGRyZW46IGRhdGF9O1xuICAgIH1cbiAgICBcbiAgICAvLyBSZXR1cm5zIGEgZmxhdHRlbmVkIGhpZXJhcmNoeSBjb250YWluaW5nIGFsbCBsZWFmIG5vZGVzIHVuZGVyIHRoZSByb290LlxuICAgIGZ1bmN0aW9uIGdldEZsYXREYXRhKHJvb3QpIHtcbiAgICAgICAgdmFyIGxlYXZlcyA9IFtdO1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlY3Vyc2UobmFtZSwgbm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCAoZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRyZWN1cnNlKG5vZGUubmFtZSwgY2hpbGQpO1xuXHQgICAgfSk7XG4gICAgICAgICAgICBlbHNlIGxlYXZlcy5wdXNoKHtwYXJlbnROYW1lOiBuYW1lIHx8IG5vZGUubmFtZSwgbmFtZTogbm9kZS5uYW1lLCB2YWx1ZTogbm9kZS52YWx1ZX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjdXJzZShudWxsLCByb290KTtcbiAgICAgICAgcmV0dXJuIHtjaGlsZHJlbjogbGVhdmVzfTtcbiAgICB9O1xuICAgIFxuICAgIGZ1bmN0aW9uIGZvY3VzVG8gKHYpIHtcblx0Y29uc29sZS5sb2coXCJWOlwiKTtcblx0Y29uc29sZS5sb2codik7XG5cdHZhciBrID0gY29uZi5oZWlnaHQgLyB2WzJdO1xuXHR2YXIgdmlldyA9IHY7XG5cdHZhciBub2RlID0gZDMuc2VsZWN0QWxsKFwiY2lyY2xlLCB0ZXh0XCIpO1xuXHRub2RlLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyBjb25zb2xlLmxvZyhkKTsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgKGQueCAtIHZbMF0pICogayArIFwiLFwiICsgKGQueSAtIHZbMV0pICogayArIFwiKVwiOyB9KTtcblx0Y2lyY2xlLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuciAqIGs7IH0pO1xuICAgIH1cblxuICAgIC8vLy8vLy8vLy9cbiAgICAvLyBBUElcbiAgICAvLy8vLy8vLy8vXG4gICAgcmVuZGVyLmZvY3VzID0gZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIGZvY3VzID0gbm9kZTtcblx0dmFyIHRyYW5zaXRpb24gPSBkMy50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbiAoNzAwKVxuXHQgICAgLnR3ZWVuIChcInpvb21cIiwgZnVuY3Rpb24gKCkge1xuXHRcdHZhciBpID0gZDMuaW50ZXJwb2xhdGVab29tICh2aWV3LCBbZm9jdXMueCwgZm9jdXMueSwgZm9jdXMucioyXSk7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uICh0KSB7XG5cdFx0ICAgIGZvY3VzVG8oaSh0KSk7XG5cdFx0fTtcblx0ICAgIH0pO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLmRhdGEgPSBmdW5jdGlvbiAobmV3RGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLmRhdGE7XG5cdH1cblx0Ly90YXJnZXQgPSBuZXdEYXRhLmRhdGFbMF1bXCJiaW9sb2dpY2FsX3N1YmplY3QuZ2VuZV9pbmZvLmdlbmVfbmFtZVwiXTtcblx0Y29uZi5kYXRhID0gbmV3RGF0YTtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5vbmNsaWNrID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5vbmNsaWNrO1xuXHR9XG5cdGNvbmYub25jbGljayA9IGNiYWs7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLmtleSA9IGZ1bmN0aW9uIChrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYua2V5O1xuXHR9XG5cdGNvbmYua2V5ID0gaztcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZW5kZXIuaGVpZ2h0ID0gZnVuY3Rpb24gKGgpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5oZWlnaHQ7XG5cdH1cblx0Y29uZi5oZWlnaHQgPSBoO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLndpZHRoID0gZnVuY3Rpb24gKHcpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi53aWR0aDtcblx0fVxuXHRjb25mLndpZHRoID0gdztcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci5mbGF0ID0gZnVuY3Rpb24gKGJvb2wpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5mbGF0O1xuXHR9XG5cdGNvbmYuZmxhdCA9IGJvb2w7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHJlbmRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXc7XG4iXX0=
