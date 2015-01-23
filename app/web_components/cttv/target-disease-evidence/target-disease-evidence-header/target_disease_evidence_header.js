// var association_header = function () {

//     var minFontSize = 20;
    
//     var conf = {
// 	width : 800,
// 	height : 200,
// 	target: undefined,
// 	disease: undefined
//     };

//     var render = function (svg) {
// 	var dx = conf.width / 14;
// 	var dy = conf.height / 5;
// 	var g = d3.select(svg)
// 	    .attr("width", conf.width)
// 	    .attr("height", conf.height)
// 	    .append("g");
// 	var gTarget = g
// 	    .append("g");
// 	gTarget
// 	    .append("title")
// 	    .text(conf.target);
// 	gTarget
// 	    .append("rect")
// 	    .attr("x", dx)
// 	    .attr("y", dy)
// 	    .attr("rx", 20)
// 	    .attr("ry", 20)
// 	    .attr("width", dx*3)
// 	    .attr("height", dy*3);

// 	var gDisease = g
// 	    .append("g");
// 	gDisease
// 	    .append("title")
// 	    .text(conf.disease);
// 	gDisease
// 	    .append("rect")
// 	    .attr("x", dx*10)
// 	    .attr("y", dy)
// 	    .attr("rx", 20)
// 	    .attr("ry", 20)
// 	    .attr("width", dx*3)
// 	    .attr("height", dy*3);

// 	var line = g
// 	    .append("line")
// 	    .attr("x1", dx*4)
// 	    .attr("y1", dy*2.5)
// 	    .attr("x2", dx*10)
// 	    .attr("y2", dy*2.5);

// 	var adjustFontSize = function (maxWidth, textElem, minFontSize) {
// 	    var textBBoxWidth = textElem.node().getBBox().width;
// 	    //var textBBoxWidth = textElem.node().getComputedTextLength();

// 	    if (textBBoxWidth > maxWidth) {
// 		var currFs = textElem.style("font-size");
// 		currFs = currFs.substring(0, currFs.length-2);

// 		if (minFontSize && ((currFs - 2) < minFontSize)) {
// 		    var currText = textElem.text();
// 		    var l = currText.length;
// 		    var nC = maxWidth * l / textBBoxWidth;
// 		    var newText = currText.substring(0, nC-3) + "...";
// 		    textElem
// 			.style("font-size", minFontSize)
// 			.text(newText);
// 		    return;
// 		}
		
// 		textElem
// 		    .style("font-size", (currFs - 2) + "px");
// 		adjustFontSize(maxWidth, textElem, minFontSize);
// 	    }
// 	}
	
// 	var targetText = g
// 	    .append("text")
// 	    .attr("class", "hidden")
// 	    .attr("x", dx)
// 	    .text(conf.target);
// 	adjustFontSize(dx*3, targetText, minFontSize);
// 	var targetTextBBoxWidth = targetText.node().getBBox().width;
// 	var targetTextBBoxHeight = targetText.node().getBBox().height;
// 	targetText
// 	    .attr("y", dy*2.5 + targetTextBBoxHeight/4)
// 	    .attr("x", (dx*2.5) - targetTextBBoxWidth/2)

// 	var diseaseText = g
// 	    .append("text")
// 	    .attr("class", "hidden")
// 	    .attr("x", dx*10)
// 	    .text(conf.disease);
// 	adjustFontSize(dx*3, diseaseText, minFontSize)
// 	var targetTextBBoxWidth = diseaseText.node().getBBox().width;
// 	var diseaseTextBBoxHeight = diseaseText.node().getBBox().height;
// 	diseaseText
// 	    .attr("x", (dx*11.5) - targetTextBBoxWidth/2)
// 	    .attr("y", dy*2.5 + diseaseTextBBoxHeight/4);
//     };

//     render.target = function (t) {
// 	if (!arguments.length) {
// 	    return conf.target;
// 	}
// 	conf.target = t;
// 	return this;
//     };

//     render.disease = function (d) {
// 	if (!arguments.length) {
// 	    return conf.disease;
// 	}
// 	conf.disease = d;
// 	return this;
//     };

//     render.width = function (w) {
// 	if (!arguments.length) {
// 	    return conf.width;
// 	}
// 	conf.width = w;
// 	return this;
//     };

//     render.height = function (h) {
// 	if (!arguments.length) {
// 	    return conf.height;
// 	}
// 	conf.height = h;
// 	return this;
//     }
    
//     return render;
// };

/////////////////////////////////////////////////////////////////////////

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
};

//var ;

Polymer({
    width : "600",
    height : "200",
    data : {},
    // target : undefined,
    // disease : undefined,
    compute_coords : function () {
	this.targetName = this.data.target;
	this.diseaseName = this.data.disease;
	var dx = this.width / 14;
	var dy = this.height / 5;
	this.targetX=dx;
	this.targetY=dy;
	this.targetWidth=dx*3;
	this.targetHeight=dy*3;

	this.diseaseX=dx*10;
	this.diseaseY=dy;
	this.diseaseWidth=dx*3;
	this.diseaseHeight=dy*3;
	this.injectBoundHTML(this.data.target, this.$.targetLabel);
	this.injectBoundHTML(this.data.disease, this.$.diseaseLabel);
    
	var textElems = this.shadowRoot.querySelectorAll("text");
	for (var i=0; i<textElems.length; i++) {
	    var textElem = textElems[i];
	    adjustFontSize(dx*3, d3.select(textElem), 20);
	}

	var targetLabelElem = this.shadowRoot.getElementById("targetLabel");    
	var targetTextBBoxWidth = targetLabelElem.getBBox().width;
	var targetTextBBoxHeight = targetLabelElem.getBBox().height;
	this.targetLabelX = (dx*2.5) - targetTextBBoxWidth/2;
	this.targetLabelY = dy*2.5 + targetTextBBoxHeight/4;

	var diseaseLabelElem = this.shadowRoot.getElementById("diseaseLabel");
	var diseaseTextBBoxWidth = diseaseLabelElem.getBBox().width;
	var diseaseTextBBoxHeight = diseaseLabelElem.getBBox().height;
	this.diseaseLabelX = (dx*11.5) - diseaseTextBBoxWidth/2;
	this.diseaseLabelY = dy*2.5 + diseaseTextBBoxHeight/4;
    },
    go : function () {
	this.compute_coords();
	// var target = this.target;
	// var disease = this.disease;
	// var svg = this.shadowRoot.querySelector("svg");
	// var ah = association_header()
	    // .target (target)
	    // .disease (disease)
	    // .width (this.width)
	    // .height (this.height);
	// ah(svg);
    },
    dataChanged : function () {
	console.log("DATA CHANGED: ");
	console.log(this.data);
	this.go();
    }
});
