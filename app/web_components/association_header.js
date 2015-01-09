var association_header = function () {

    var minFontSize = 20;
    
    var conf = {
	width : 800,
	height : 200,
	target: undefined,
	disease: undefined
    };

    var render = function (svg) {
	var dx = conf.width / 14;
	var dy = conf.height / 5;
	var g = d3.select(svg)
	    .attr("width", conf.width)
	    .attr("height", conf.height)
	    .append("g");
	var sq1 = g
	    .append("rect")
	    .attr("x", dx)
	    .attr("y", dy)
	    .attr("rx", 20)
	    .attr("ry", 20)
	    .attr("width", dx*3)
	    .attr("height", dy*3);

	var sq2 = g
	    .append("rect")
	    .attr("x", dx*10)
	    .attr("y", dy)
	    .attr("rx", 20)
	    .attr("ry", 20)
	    .attr("width", dx*3)
	    .attr("height", dy*3)

	var line = g
	    .append("line")
	    .attr("x1", dx*4)
	    .attr("y1", dy*2.5)
	    .attr("x2", dx*10)
	    .attr("y2", dy*2.5)
	    .style("stroke-width", "2px")
	    .style("stroke", "#aaa");

	var adjustFontSize = function (maxWidth, textElem, minFontSize) {
	    var textBBoxWidth = textElem.node().getBBox().width;
	    //var textBBoxWidth = textElem.node().getComputedTextLength();

	    if (textBBoxWidth > maxWidth) {
		var currFs = textElem.style("font-size");
		currFs = currFs.substring(0, currFs.length-2);

		if (minFontSize && ((currFs - 2) < minFontSize)) {
		    var currText = textElem.text();
		    var l = currText.length;
		    var nC = maxWidth * l / textBBoxWidth;
		    var newText = currText.substring(0, nC-3) + "...";
		    textElem
			.style("font-size", minFontSize)
			.text(newText);
		    return;
		}
		
		textElem
		    .style("font-size", (currFs - 2) + "px");
		adjustFontSize(maxWidth, textElem, minFontSize);
	    }
	}
	
	var targetText = g
	    .append("text")
	    .attr("class", "hidden")
	    .attr("x", dx)
	    .text(conf.target);
	adjustFontSize(dx*3, targetText, minFontSize);
	var targetTextBBoxWidth = targetText.node().getBBox().width;
	var targetTextBBoxHeight = targetText.node().getBBox().height;
	targetText
	    .attr("y", dy*2.5 + targetTextBBoxHeight/4)
	    .attr("x", (dx*2.5) - targetTextBBoxWidth/2)

	var diseaseText = g
	    .append("text")
	    .attr("class", "hidden")
	    .attr("x", dx*10)
	    .text(conf.disease);
	adjustFontSize(dx*3, diseaseText, minFontSize)
	var targetTextBBoxWidth = diseaseText.node().getBBox().width;
	var diseaseTextBBoxHeight = diseaseText.node().getBBox().height;
	diseaseText
	    .attr("x", (dx*11.5) - targetTextBBoxWidth/2)
	    .attr("y", dy*2.5 + diseaseTextBBoxHeight/4);
    };

    render.target = function (t) {
	if (!arguments.length) {
	    return conf.target;
	}
	conf.target = t;
	return this;
    };

    render.disease = function (d) {
	if (!arguments.length) {
	    return conf.disease;
	}
	conf.disease = d;
	return this;
    };

    render.width = function (w) {
	if (!arguments.length) {
	    return conf.width;
	}
	conf.width = w;
	return this;
    };

    render.height = function (h) {
	if (!arguments.length) {
	    return conf.height;
	}
	conf.height = h;
	return this;
    }
    
    return render;
};

Polymer({
    width : "600",
    height : "200",
    target : "MyTarget",
    disease : "MyDisease",
    ready : function () {
	var target = this.target;
	var disease = this.disease;
	var svg = this.shadowRoot.querySelector("svg");
	var ah = association_header()
	    .target (target)
	    .disease (disease)
	    .width (this.width)
	    .height (this.height);
	ah(svg);
    }
});
