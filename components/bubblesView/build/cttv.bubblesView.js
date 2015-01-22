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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3Mvd2ViYXBwL2NvbXBvbmVudHMvYnViYmxlc1ZpZXcvZmFrZV85NTA4YzBmYS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy93ZWJhcHAvY29tcG9uZW50cy9idWJibGVzVmlldy9zcmMvYnViYmxlc1ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsIi8vIGlmICh0eXBlb2YgYnViYmxlc1ZpZXcgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IGJ1YmJsZXNWaWV3ID0ge31cbi8vIH1cbi8vIGJ1YmJsZXNWaWV3LmJ1YmJsZXNWaWV3ID0gcmVxdWlyZShcIi4vc3JjL2J1YmJsZXNWaWV3LmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBidWJibGVzVmlldyA9IHJlcXVpcmUoXCIuL3NyYy9idWJibGVzVmlldy5qc1wiKTtcbiIsInZhciBidWJibGVzVmlldyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBrZXkgPSBmdW5jdGlvbiAobykge1xuXHRyZXR1cm4gb1tcImJpb2xvZ2ljYWxfb2JqZWN0LmVmb19pbmZvLmVmb19sYWJlbFwiXTtcbiAgICB9O1xuICAgIFxuICAgIHZhciBjb25mID0ge1xuXHR3aWR0aCA6IDgwMCxcblx0aGVpZ2h0IDogMzAwLFxuXHRmb3JtYXQgOiBkMy5mb3JtYXQoXCIsZFwiKSxcblx0Y29sb3IgOiBkMy5zY2FsZS5jYXRlZ29yeTIwYygpLFxuXHRmbGF0IDogdHJ1ZSxcblx0Y29sb3JQYWxldHRlIDogdHJ1ZSxcblx0ZGF0YSA6IHVuZGVmaW5lZCxcblx0a2V5IDoga2V5LFxuXHRvbmNsaWNrIDogZnVuY3Rpb24gKCkge31cbiAgICB9O1xuICAgIHRhcmdldCA9IHVuZGVmaW5lZDtcbiAgICBcbiAgICAvLyB2YXIgZGlhbWV0ZXIgPSBlbGVtWzBdLm9mZnNldFdpZHRoLFxuICAgIC8vICAgICBmb3JtYXQgPSBkMy5mb3JtYXQoXCIsZFwiKSxcbiAgICAvLyAgICAgY29sb3IgPSBkMy5zY2FsZS5jYXRlZ29yeTIwYygpLFxuICAgIC8vICAgICBpc0J1YmJsZSA9IGF0dHJzLmFzQnViYmxlICYmIGF0dHJzLmFzQnViYmxlLnRvTG93ZXJDYXNlKCk9PT1cInRydWVcIixcbiAgICAvLyAgICAgdXNlQ29sb3JQYWxldHRlID0gYXR0cnMudXNlQ29sb3JQYWxldHRlICYmIGF0dHJzLnVzZUNvbG9yUGFsZXR0ZS50b0xvd2VyQ2FzZSgpPT09XCJ0cnVlXCI7XG5cbiAgICAvLyBwcm9jZXNzRGF0YSBhZ2dyZWdhdGVzIGV2aWRlbmNlIGJ5IEVGTyBpZFxuICAgIC8vIFRPRE86IFRoaXMgZnVuY3Rpb24gbWF5IGNoYW5nZSBvbmNlIHdlIGhhdmUgYSBmaW5hbCB2ZXJzaW9uIG9mIHRoZSBBUEkuIEluIHRoZSBtZWFudGltZSwgY291bnRzIGFyZSBwcm9jZXNzZWQgaGVyZVxuICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhIChkYXRhKSB7XG5cdHZhciBkID0ge307XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvL3ZhciBlZm9fbGFiZWwgPSBkYXRhW2ldW1wiYmlvbG9naWNhbF9vYmplY3QuZWZvX2luZm8uZWZvX2xhYmVsXCJdO1xuXHQgICAgdmFyIGxhYmVsID0gY29uZi5rZXkoZGF0YVtpXSk7XG5cdCAgICBpZiAoZFtsYWJlbF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdGRbbGFiZWxdID0gMTtcblx0ICAgIH0gZWxzZSB7XG5cdFx0ZFtsYWJlbF0rKztcblx0ICAgIH1cblx0fVxuXG5cdHZhciBvID0ge25hbWU6IFwiUm9vdFwiLCBjaGlsZHJlbjogW119O1xuXHRmb3IgKHZhciBqIGluIGQpIHtcblx0ICAgIG8uY2hpbGRyZW4ucHVzaCAoIHtcIm5hbWVcIjpqLCBcInZhbHVlXCI6ZFtqXX0gKTtcblx0fVxuXHRyZXR1cm4gbztcbiAgICB9XG4gICAgXG4gICAgLy8gUmV0dXJucyBhIGZsYXR0ZW5lZCBoaWVyYXJjaHkgY29udGFpbmluZyBhbGwgbGVhZiBub2RlcyB1bmRlciB0aGUgcm9vdC5cbiAgICBmdW5jdGlvbiBnZXRGbGF0RGF0YShyb290KSB7XG4gICAgICAgIHZhciBsZWF2ZXMgPSBbXTtcblxuICAgICAgICBmdW5jdGlvbiByZWN1cnNlKG5hbWUsIG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSBub2RlLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHsgcmVjdXJzZShub2RlLm5hbWUsIGNoaWxkKTsgfSk7XG4gICAgICAgICAgICBlbHNlIGxlYXZlcy5wdXNoKHtwYXJlbnROYW1lOiBuYW1lIHx8IG5vZGUubmFtZSwgbmFtZTogbm9kZS5uYW1lLCB2YWx1ZTogbm9kZS52YWx1ZX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjdXJzZShudWxsLCByb290KTtcbiAgICAgICAgcmV0dXJuIHtjaGlsZHJlbjogbGVhdmVzfTtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIFJlbmRlciB2YWxpZCBKU09OIGRhdGFcbiAgICAgKi8gXG4gICAgdmFyIHJlbmRlciA9IGZ1bmN0aW9uKGRpdikge1xuXHR2YXIgc3ZnID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJzdmdcIilcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZi53aWR0aClcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYuaGVpZ2h0KTtcblxuXHR2YXIgcGFjayA9IGQzLmxheW91dC5wYWNrKClcbiAgICAgICAgICAgIC5zb3J0KG51bGwpXG4gICAgICAgICAgICAuc2l6ZShbY29uZi53aWR0aCwgY29uZi5oZWlnaHRdKVxuICAgICAgICAgICAgLnBhZGRpbmcoMS41KTtcblxuXHR2YXIgZGF0YSA9IHByb2Nlc3NEYXRhKGNvbmYuZGF0YSk7XG5cdFxuICAgICAgICAvLyByZW1vdmUgYWxsIHByZXZpb3VzIGl0ZW1zIGJlZm9yZSByZW5kZXJcblx0Ly8gVE9ETzogTm90IG5lZWRlZCB3aXRob3V0IHVwZGF0ZXMhXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoJyonKS5yZW1vdmUoKTtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgcGFzcyBhbnkgZGF0YSwgcmV0dXJuIG91dCBvZiB0aGUgZWxlbWVudFxuICAgICAgICBpZiAoIWRhdGEpIHJldHVybjtcblx0dmFyIG5vZGVzID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpXG4gICAgICAgICAgICAuZGF0YShcbiAgICAgICAgICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZi5mbGF0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYWNrLm5vZGVzKGdldEZsYXREYXRhKGRhdGEpKS5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gIWQuY2hpbGRyZW47IH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhY2subm9kZXMoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KClcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jaGlsZHJlbiA/IFwibm9kZVwiIDogXCJsZWFmIG5vZGVcIjsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC54ICsgXCIsXCIgKyBkLnkgKyBcIilcIjsgfSk7XG5cdG5vZGVzXG5cdCAgICAub24oXCJjbGlja1wiLCBjb25mLm9uY2xpY2spO1xuXG4gICAgICAgIG5vZGVzLmFwcGVuZChcInRpdGxlXCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWUgKyBcIjogXCIgKyBjb25mLmZvcm1hdChkLnZhbHVlKTsgfSk7XG5cblx0Ly8gbm9kZXMgPSBub2Rlcy5hcHBlbmQoXCJzdmc6YVwiKVxuXHQvLyAgICAgLmF0dHIoXCJ4bGluazpocmVmXCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuIFwiL2FwcC8jL2Fzc29jaWF0aW9ucz90PVwiICsgdGFyZ2V0ICsgXCImZD1cIiArIGQubmFtZTt9KTtcblx0XHRcbiAgICAgICAgdmFyIGNpcmNsZSA9IG5vZGVzLmFwcGVuZCAoXCJjaXJjbGVcIik7XG4gICAgICAgIGNpcmNsZS5hdHRyIChcInJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yOyB9KTtcbiAgICAgICAgaWYgKGNvbmYuZmxhdCl7XG4gICAgICAgICAgICBjaXJjbGUuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGNvbmYuY29sb3IoY29uZi5jb2xvclBhbGV0dGUgPyBkLm5hbWUgOiBkLnBhcmVudE5hbWUpOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBub2Rlcy5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjNlbVwiKVxuICAgICAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubmFtZS5zdWJzdHJpbmcoMCwgZC5yIC8gMykgfSk7XG4gICAgfTtcblxuICAgIHJlbmRlci5kYXRhID0gZnVuY3Rpb24gKG5ld0RhdGEpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gY29uZi5kYXRhO1xuXHR9XG5cdC8vdGFyZ2V0ID0gbmV3RGF0YS5kYXRhWzBdW1wiYmlvbG9naWNhbF9zdWJqZWN0LmdlbmVfaW5mby5nZW5lX25hbWVcIl07XG5cdGNvbmYuZGF0YSA9IG5ld0RhdGE7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZW5kZXIub25jbGljayA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYub25jbGljaztcblx0fVxuXHRjb25mLm9uY2xpY2sgPSBjYmFrO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFxuICAgIHJlbmRlci5rZXkgPSBmdW5jdGlvbiAoaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBjb25mLmtleTtcblx0fVxuXHRjb25mLmtleSA9IGs7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmVuZGVyLmhlaWdodCA9IGZ1bmN0aW9uIChoKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYuaGVpZ2h0O1xuXHR9XG5cdGNvbmYuaGVpZ2h0ID0gaDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJlbmRlci53aWR0aCA9IGZ1bmN0aW9uICh3KSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGNvbmYud2lkdGg7XG5cdH1cblx0Y29uZi53aWR0aCA9IHc7XG5cdHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHJlbmRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnViYmxlc1ZpZXc7XG4iXX0=
