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

    var key = function (o) {
	return o["biological_object.efo_info.efo_label"];
    };
    
    var conf = {
	width : 800,
	height : 300,
	format : d3.format(",d"),
	color : d3.scale.category20c(),
	flat : true,
	colorPalette : true,
	data : undefined,
	key : key,
	onclick : function () {}
    };
    target = undefined;
    
    // var diameter = elem[0].offsetWidth,
    //     format = d3.format(",d"),
    //     color = d3.scale.category20c(),
    //     isBubble = attrs.asBubble && attrs.asBubble.toLowerCase()==="true",
    //     useColorPalette = attrs.useColorPalette && attrs.useColorPalette.toLowerCase()==="true";

    // processData aggregates evidence by EFO id
    // TODO: This function may change once we have a final version of the API. In the meantime, counts are processed here
    function processData (data) {
	var d = {};
	for (var i=0; i<data.length; i++) {
	    //var efo_label = data[i]["biological_object.efo_info.efo_label"];
	    var label = conf.key(data[i]);
	    if (d[label] === undefined) {
		d[label] = 1;
	    } else {
		d[label]++;
	    }
	}

	var o = {name: "Root", children: []};
	for (var j in d) {
	    o.children.push ( {"name":j, "value":d[j]} );
	}
	return o;
    }
    
    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function getFlatData(root) {
        var leaves = [];

        function recurse(name, node) {
            if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
            else leaves.push({parentName: name || node.name, name: node.name, value: node.value});
        }

        recurse(null, root);
        return {children: leaves};
    }

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
		
        var circle = nodes.append ("circle");
        circle.attr ("r", function(d) { return d.r; });
        if (conf.flat){
            circle.style("fill", function(d) { return conf.color(conf.colorPalette ? d.name : d.parentName); });
        }
        nodes.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.name.substring(0, d.r / 3) });
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
    
    return render;
};

module.exports = bubblesView;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvYXBwL2pzL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9hcHAvanMvY29tcG9uZW50cy9idWJibGVzVmlldy9mYWtlX2E2NTdjZjcwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3dlYmFwcC9hcHAvanMvY29tcG9uZW50cy9idWJibGVzVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvYXBwL2pzL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvc3JjL2J1YmJsZXNWaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCIvLyBpZiAodHlwZW9mIGJ1YmJsZXNWaWV3ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldyA9IHt9XG4vLyB9XG4vLyBidWJibGVzVmlldy5idWJibGVzVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9idWJibGVzVmlldy5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXcgPSByZXF1aXJlKFwiLi9zcmMvYnViYmxlc1ZpZXcuanNcIik7XG4iLCJ2YXIgYnViYmxlc1ZpZXcgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIga2V5ID0gZnVuY3Rpb24gKG8pIHtcblx0cmV0dXJuIG9bXCJiaW9sb2dpY2FsX29iamVjdC5lZm9faW5mby5lZm9fbGFiZWxcIl07XG4gICAgfTtcbiAgICBcbiAgICB2YXIgY29uZiA9IHtcblx0d2lkdGggOiA4MDAsXG5cdGhlaWdodCA6IDMwMCxcblx0Zm9ybWF0IDogZDMuZm9ybWF0KFwiLGRcIiksXG5cdGNvbG9yIDogZDMuc2NhbGUuY2F0ZWdvcnkyMGMoKSxcblx0ZmxhdCA6IHRydWUsXG5cdGNvbG9yUGFsZXR0ZSA6IHRydWUsXG5cdGRhdGEgOiB1bmRlZmluZWQsXG5cdGtleSA6IGtleSxcblx0b25jbGljayA6IGZ1bmN0aW9uICgpIHt9XG4gICAgfTtcbiAgICB0YXJnZXQgPSB1bmRlZmluZWQ7XG4gICAgXG4gICAgLy8gdmFyIGRpYW1ldGVyID0gZWxlbVswXS5vZmZzZXRXaWR0aCxcbiAgICAvLyAgICAgZm9ybWF0ID0gZDMuZm9ybWF0KFwiLGRcIiksXG4gICAgLy8gICAgIGNvbG9yID0gZDMuc2NhbGUuY2F0ZWdvcnkyMGMoKSxcbiAgICAvLyAgICAgaXNCdWJibGUgPSBhdHRycy5hc0J1YmJsZSAmJiBhdHRycy5hc0J1YmJsZS50b0xvd2VyQ2FzZSgpPT09XCJ0cnVlXCIsXG4gICAgLy8gICAgIHVzZUNvbG9yUGFsZXR0ZSA9IGF0dHJzLnVzZUNvbG9yUGFsZXR0ZSAmJiBhdHRycy51c2VDb2xvclBhbGV0dGUudG9Mb3dlckNhc2UoKT09PVwidHJ1ZVwiO1xuXG4gICAgLy8gcHJvY2Vzc0RhdGEgYWdncmVnYXRlcyBldmlkZW5jZSBieSBFRk8gaWRcbiAgICAvLyBUT0RPOiBUaGlzIGZ1bmN0aW9uIG1heSBjaGFuZ2Ugb25jZSB3ZSBoYXZlIGEgZmluYWwgdmVyc2lvbiBvZiB0aGUgQVBJLiBJbiB0aGUgbWVhbnRpbWUsIGNvdW50cyBhcmUgcHJvY2Vzc2VkIGhlcmVcbiAgICBmdW5jdGlvbiBwcm9jZXNzRGF0YSAoZGF0YSkge1xuXHR2YXIgZCA9IHt9O1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xuXHQgICAgLy92YXIgZWZvX2xhYmVsID0gZGF0YVtpXVtcImJpb2xvZ2ljYWxfb2JqZWN0LmVmb19pbmZvLmVmb19sYWJlbFwiXTtcblx0ICAgIHZhciBsYWJlbCA9IGNvbmYua2V5KGRhdGFbaV0pO1xuXHQgICAgaWYgKGRbbGFiZWxdID09PSB1bmRlZmluZWQpIHtcblx0XHRkW2xhYmVsXSA9IDE7XG5cdCAgICB9IGVsc2Uge1xuXHRcdGRbbGFiZWxdKys7XG5cdCAgICB9XG5cdH1cblxuXHR2YXIgbyA9IHtuYW1lOiBcIlJvb3RcIiwgY2hpbGRyZW46IFtdfTtcblx0Zm9yICh2YXIgaiBpbiBkKSB7XG5cdCAgICBvLmNoaWxkcmVuLnB1c2ggKCB7XCJuYW1lXCI6aiwgXCJ2YWx1ZVwiOmRbal19ICk7XG5cdH1cblx0cmV0dXJuIG87XG4gICAgfVxuICAgIFxuICAgIC8vIFJldHVybnMgYSBmbGF0dGVuZWQgaGllcmFyY2h5IGNvbnRhaW5pbmcgYWxsIGxlYWYgbm9kZXMgdW5kZXIgdGhlIHJvb3QuXG4gICAgZnVuY3Rpb24gZ2V0RmxhdERhdGEocm9vdCkge1xuICAgICAgICB2YXIgbGVhdmVzID0gW107XG5cbiAgICAgICAgZnVuY3Rpb24gcmVjdXJzZShuYW1lLCBub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7IHJlY3Vyc2Uobm9kZS5uYW1lLCBjaGlsZCk7IH0pO1xuICAgICAgICAgICAgZWxzZSBsZWF2ZXMucHVzaCh7cGFyZW50TmFtZTogbmFtZSB8fCBub2RlLm5hbWUsIG5hbWU6IG5vZGUubmFtZSwgdmFsdWU6IG5vZGUudmFsdWV9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlY3Vyc2UobnVsbCwgcm9vdCk7XG4gICAgICAgIHJldHVybiB7Y2hpbGRyZW46IGxlYXZlc307XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBSZW5kZXIgdmFsaWQgSlNPTiBkYXRhXG4gICAgICovIFxuICAgIHZhciByZW5kZXIgPSBmdW5jdGlvbihkaXYpIHtcblx0dmFyIHN2ZyA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYud2lkdGgpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmhlaWdodCk7XG5cblx0dmFyIHBhY2sgPSBkMy5sYXlvdXQucGFjaygpXG4gICAgICAgICAgICAuc29ydChudWxsKVxuICAgICAgICAgICAgLnNpemUoW2NvbmYud2lkdGgsIGNvbmYuaGVpZ2h0XSlcbiAgICAgICAgICAgIC5wYWRkaW5nKDEuNSk7XG5cblx0dmFyIGRhdGEgPSBwcm9jZXNzRGF0YShjb25mLmRhdGEpO1xuXHRcbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBwcmV2aW91cyBpdGVtcyBiZWZvcmUgcmVuZGVyXG5cdC8vIFRPRE86IE5vdCBuZWVkZWQgd2l0aG91dCB1cGRhdGVzIVxuICAgICAgICBzdmcuc2VsZWN0QWxsKCcqJykucmVtb3ZlKCk7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IHBhc3MgYW55IGRhdGEsIHJldHVybiBvdXQgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgaWYgKCFkYXRhKSByZXR1cm47XG5cdHZhciBub2RlcyA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxuICAgICAgICAgICAgLmRhdGEoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmYuZmxhdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFjay5ub2RlcyhnZXRGbGF0RGF0YShkYXRhKSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHsgcmV0dXJuICFkLmNoaWxkcmVuOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYWNrLm5vZGVzKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSgpXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY2hpbGRyZW4gPyBcIm5vZGVcIiA6IFwibGVhZiBub2RlXCI7IH0pXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7IH0pO1xuXHRub2Rlc1xuXHQgICAgLm9uKFwiY2xpY2tcIiwgY29uZi5vbmNsaWNrKTtcblxuICAgICAgICBub2Rlcy5hcHBlbmQoXCJ0aXRsZVwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lICsgXCI6IFwiICsgY29uZi5mb3JtYXQoZC52YWx1ZSk7IH0pO1xuXG5cdC8vIG5vZGVzID0gbm9kZXMuYXBwZW5kKFwic3ZnOmFcIilcblx0Ly8gICAgIC5hdHRyKFwieGxpbms6aHJlZlwiLCBmdW5jdGlvbiAoZCkge3JldHVybiBcIi9hcHAvIy9hc3NvY2lhdGlvbnM/dD1cIiArIHRhcmdldCArIFwiJmQ9XCIgKyBkLm5hbWU7fSk7XG5cdFx0XG4gICAgICAgIHZhciBjaXJjbGUgPSBub2Rlcy5hcHBlbmQgKFwiY2lyY2xlXCIpO1xuICAgICAgICBjaXJjbGUuYXR0ciAoXCJyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucjsgfSk7XG4gICAgICAgIGlmIChjb25mLmZsYXQpe1xuICAgICAgICAgICAgY2lyY2xlLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBjb25mLmNvbG9yKGNvbmYuY29sb3JQYWxldHRlID8gZC5uYW1lIDogZC5wYXJlbnROYW1lKTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZXMuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zZW1cIilcbiAgICAgICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWUuc3Vic3RyaW5nKDAsIGQuciAvIDMpIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXIuZGF0YSA9IGZ1bmN0aW9uIChuZXdEYXRhKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYuZGF0YTtcblx0fVxuXHQvL3RhcmdldCA9IG5ld0RhdGEuZGF0YVswXVtcImJpb2xvZ2ljYWxfc3ViamVjdC5nZW5lX2luZm8uZ2VuZV9uYW1lXCJdO1xuXHRjb25mLmRhdGEgPSBuZXdEYXRhO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmVuZGVyLm9uY2xpY2sgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLm9uY2xpY2s7XG5cdH1cblx0Y29uZi5vbmNsaWNrID0gY2Jhaztcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZW5kZXIua2V5ID0gZnVuY3Rpb24gKGspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5rZXk7XG5cdH1cblx0Y29uZi5rZXkgPSBrO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHJlbmRlci5oZWlnaHQgPSBmdW5jdGlvbiAoaCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLmhlaWdodDtcblx0fVxuXHRjb25mLmhlaWdodCA9IGg7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIud2lkdGggPSBmdW5jdGlvbiAodykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLndpZHRoO1xuXHR9XG5cdGNvbmYud2lkdGggPSB3O1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHJldHVybiByZW5kZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3O1xuIl19
