angular.module('facets')
.directive('cttvHistogramSliderFacetPrimitive', ['$log', 'cttvUtils', function ($log, cttvUtils) {
  
  /**
   * Render the histogram
   * @param {*} histogramData 
   * @param {*} svg 
   * @param {*} width 
   * @param {*} height 
   */
  var render = function (scope, svg, width, height) {
    var margins = {top: 20, right: 10, bottom: 20, left: 10};
    var histogramWidth = width - margins.left - margins.right;
    var histogramHeight = height - margins.top - margins.bottom;
    
    // width/height
    svg.attr('width', width)
       .attr('height', height);

    // scales
    var x = d3.scale.ordinal()
                    .domain(_.range(1, 11))
                    .rangeBands([0, histogramWidth], 0.2)
    var y = d3.scale.linear()
                    .domain([0, d3.max(scope.data, function (d) { return d.value; })])
                    .range([histogramHeight, 0])

    // container group
    var g = svg.select('g.histogram-container');
    if (g.empty()) {
      g = svg.append('g')
               .classed('histogram-container', true)
    }
    g.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

    // x-axis
    var xAxis = d3.svg.axis()
                      .scale(x)
                      .orient("bottom")
                      .tickSize(0)
                      .tickPadding(8)
    var gAxis = svg.select('g.x-axis')
    if (gAxis.empty()) {
      gAxis = svg.append('g')
                   .classed('x-axis', true)
    }
    gAxis.attr('transform', 'translate(' + margins.left + ',' + (margins.top + histogramHeight) + ')')
         .call(xAxis);

    // helper function
    var selectBasedOn = function (g, minValue) {
      if (minValue === 0) {
        g.selectAll('rect')
          .classed('selected', false)
          .classed('deselected', true);
      } else {
        g.selectAll('rect')
           .classed('selected', function (d) {return d.key >= minValue;})
           .classed('deselected', function (d) {return d.key < minValue;});
      }
    }

    // ensure histogram data is sorted by key
    scope.data.sort(function (a, b) {
      return d3.ascending(a.key, b.key);
    });

    // histogram rectangles
    var bar = g.selectAll('rect')
                 .data(scope.data)
    bar.enter()
         .append('rect')
           .attr('x', function (d) {return x(d.key);})
           .attr('y', function (d) {return y(d.value);})
           .attr('width', x.rangeBand())
           .attr('height', function (d) {return y(0) - y(d.value);})
           .on('mouseover', function (d) {
             // base colouring on current element's key
             selectBasedOn(g, d.key);
           })
           .on('mouseout', function (d) {
             // base colouring on level
             selectBasedOn(g, scope.level);
           })
           .on('click', function (d) {
             scope.setLevel(d.key);
             // Note: Need to trigger a digest cycle here
             scope.$apply();
             selectBasedOn(g, d.key);
           });
    
    // set selection state
    selectBasedOn(g, scope.level);
  }

  
  return {
    restrict: 'E',
    scope: {
      data: '=',
      min: '=',
      max: '=',
      level: '=',
      setLevel: '='
      // controls: '@'
    },
    templateUrl: 'facets/primitives/histogram-slider-facet-primitive.html',
    link: function (scope, elem, attrs) {
      var ngSvg = elem.find('svg')[0];
      var svg = d3.select(ngSvg);
      
      // TODO: set width based on parent width
      var width = 200;
      // var width = ngSvg.offsetWidth;
      var height = 120;

      render(scope, svg, width, height);

      // ensure a re-render occurs on level/data change
      scope.$watchGroup(['level', 'data'], function () {
        render(scope, svg, width, height);
      });
    }
  };
}])


        //     // declare vars
        //     var data, margin, width, height, barWidth, tick;

        //     var init = function(){
        //         data = scope.data;

        //         margin = {top: 20, right: 10, bottom: 20, left: 10},
        //         width = elem[0].childNodes[0].offsetWidth - margin.left - margin.right, // initialize to the full div width
        //         height = 80 - margin.top - margin.bottom,
        //         barWidth = width / data.length;

        //         tick = 1/data.length;



        //         var x = d3.scale.linear()
        //             .domain([0, 1])
        //             .range([0, width]);
        //             //.ticks(data.length);

        //         var y = d3.scale.linear()
        //             .domain([0, d3.max( data, function(d){return d.value;} )])
        //             .range([height, 0]);

        //         var xAxis = d3.svg.axis()
        //             .scale(x)
        //             .orient("bottom")
        //             .tickSize(0)
        //             .tickPadding(8)
        //             .ticks(data.length);

        //         var svg = d3.select(elem.children().eq(0)[0]).append("svg")
        //             .attr("width", width + margin.left + margin.right)
        //             .attr("height", height + margin.top + margin.bottom)
        //             .append("g")
        //             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //         var bar = svg.selectAll(".bar")
        //             .data(data)
        //             .enter().append("g")
        //             .attr("class", "bar")
        //             .attr("transform", function(d,i) { return "translate(" + x( i/data.length ) + "," + y(d.value) + ")"; });

        //         bar.append("rect")
        //             .attr("x", 1)
        //             .attr("width", barWidth - 1)
        //             .attr("class", function(d){ return (d.label>=scope.min && d.label<scope.max) ? "selected" : "deselected" })
        //             .attr("height", function(d) { return height - y(d.value); });

        //         bar.append("text")
        //             .attr("x", barWidth / 2)
        //             .attr("y", -13)
        //             .attr("dy", ".75em")
        //             .attr("text-anchor", "middle")
        //             .attr("class", function(d){ return (d.label>=scope.min && d.label<scope.max) ? "selected" : "deselected" })
        //             .text(function(d) { return d.value; });

        //         svg.append("g")
        //             .attr("class", "x axis")
        //             .attr("transform", "translate(0," + height + ")")
        //             .call(xAxis);

        //         var update = function(o){
        //             scope.min = o.min;
        //             scope.max = o.max;
        //         }


        //         if(scope.controls.toLowerCase()==="true"){

        //             var mybrush = d3.svg.brush()
        //                 .x(x)
        //                 .extent([scope.min, scope.max])
        //                 .on("brush", function(){ scope.$apply(onBrush) })
        //                 .on("brushend", onBrushEnd);

        //             // brush graphics
        //             var gBrush = svg.append("g")
        //                 .attr("class", "brush")
        //                 .call(mybrush);

        //             gBrush.selectAll(".resize").append("circle")
        //                 .attr("class", "handle")
        //                 .attr("transform", "translate(0," + height/2 + ")")
        //                 .attr("r", 4);

        //             gBrush.selectAll("rect")
        //                 .attr("height", height);

        //             var onBrushEnd = function(){
        //                 d3.select(this).call(mybrush.extent([scope.min, scope.max]));
        //             }

        //             var onBrush = function(){
        //                 var extent0 = mybrush.extent();
        //                 update( {
        //                     min: cttvUtils.roundToNearest(extent0[0], tick).toFixed(2), // extent0[0].toFixed(2),
        //                     max: cttvUtils.roundToNearest(extent0[1], tick).toFixed(2),// extent0[1].toFixed(2)
        //                 } );
        //                 //mybrush.extent(scope.min, scope.max);
        //             }

        //         }
        //     }

        //     scope.$watch('data',function(d){
        //         // $log.log("************");
        //         // $log.log(scope.data);
        //         // $log.log(scope.min);
        //         // $log.log(scope.max);
        //         if(d){
        //             init();
        //         }
//         //     })
//         }
//     };
// }])