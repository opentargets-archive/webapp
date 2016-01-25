var spinner = function () {
   "use strict";
    var conf = {
        size: 50,
        stroke: 3,
        cssClass: "cttv-spinner-component",
        angle: Math.PI
    };


    var render = function (div) {

        var offset = ~~(conf.size/2);

    	var container = d3.select(div);
    	container.selectAll("*").remove();


    	var svg = container.append("svg")
    	    .attr("width", conf.size)
    	    .attr("height", conf.size)
            .attr("class", conf.cssClass)
    	    .append("g");


        var arc = d3.svg.arc()
            .innerRadius(offset - conf.stroke)
            .outerRadius(offset)
            .startAngle(0) //converting from degs to radians
            .endAngle(conf.angle)  // 180deg


        svg.append("path")
            .attr("d", arc)
            .attr("transform", "translate("+offset+","+offset+")")


    };

    render.size = function(s){
        if (!arguments.length) {
            return conf.size;
        }
        conf.size = s;
        return this;
    }

    render.stroke = function(s){
        if (!arguments.length) {
            return conf.stroke;
        }
        conf.stroke = s;
        return this;
    }

    // angle in radians (PI = 180deg)
    render.angle = function(s){
        if (!arguments.length) {
            return conf.angle;
        }
        conf.angle = s;
        return this;
    }

    return render;
};

module.exports = exports = spinner;
