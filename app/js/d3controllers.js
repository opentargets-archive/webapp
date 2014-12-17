'use strict';

/* Controllers */

angular.module('chartApp', ['d3']).

controller("SalesController", ['$scope', 'd3Service', function($scope, d3Service) {
    console.log("SalesController");
  $scope.salesData = [
    {hour: 1,sales: 54},
    {hour: 2,sales: 66},
    {hour: 3,sales: 77},
    {hour: 4,sales: 70},
    {hour: 5,sales: 60},
    {hour: 6,sales: 63},
    {hour: 7,sales: 55},
    {hour: 8,sales: 47},
    {hour: 9,sales: 55}
  ];
}]).

directive('linearChart', ['d3Service', function(d3Service){
   return{
      restrict:'EA',
        template:"<svg width='850' height='200'></svg>",
        link: function(scope, elem, attrs){

            console.log("chart directive");
           var salesDataToPlot=scope[attrs.chartData];
           var padding = 20;
           var pathClass="path";
           var xScale, yScale, xAxisGen, yAxisGen, lineFun;

           var rawSvg=elem.find('svg');
           var svg = d3.select(rawSvg[0]);

           function setChartParameters(){

               xScale = d3.scale.linear()
                   .domain([salesDataToPlot[0].hour, salesDataToPlot[salesDataToPlot.length-1].hour])
                   .range([padding + 5, rawSvg.attr("width") - padding]);

               yScale = d3.scale.linear()
                   .domain([0, d3.max(salesDataToPlot, function (d) {
                       return d.sales;
                   })])
                   .range([rawSvg.attr("height") - padding, 0]);

               xAxisGen = d3.svg.axis()
                   .scale(xScale)
                   .orient("bottom")
                   .ticks(salesDataToPlot.length - 1);

               yAxisGen = d3.svg.axis()
                   .scale(yScale)
                   .orient("left")
                   .ticks(5);

               lineFun = d3.svg.line()
                   .x(function (d) {
                       return xScale(d.hour);
                   })
                   .y(function (d) {
                       return yScale(d.sales);
                   })
                   .interpolate("basis");
           }
         
         function drawLineChart() {

               setChartParameters();

               svg.append("svg:g")
                   .attr("class", "x axis")
                   .attr("transform", "translate(0,180)")
                   .call(xAxisGen);

               svg.append("svg:g")
                   .attr("class", "y axis")
                   .attr("transform", "translate(20,0)")
                   .call(yAxisGen);

               svg.append("svg:path")
                   .attr({
                       d: lineFun(salesDataToPlot),
                       "stroke": "blue",
                       "stroke-width": 2,
                       "fill": "none",
                       "class": pathClass
                   });
           }

           drawLineChart();

       }
   };
}]);





angular.module('bubbleGraphApp',['d3']).


controller("BubbleCtrl", ['$scope', 'd3Service', function($scope, d3Service) {
    console.log("bubbleController");
    

    $scope.data = {
      "name": "flare",
      "children": [
      {"name": "EFO_0000574", "size": 1},
      {"name": "EFO_0000621", "size": 2},
      {"name": "Rasopathy", "size": 3},
      {"name": "Carcinoma of colon", "size": 3},
      {"name": "Cardio-facio-cutaneous syndrome", "size": 1},
      {"name": "Adenocarcinoma of lung", "size": 5},
      {"name": "EFO_0000574", "size": 2},
      {"name": "Non-small cell lung cancer", "size": 2},
      {"name": "latent tuberculosis", "size": 1}
     ]};


}]).



directive("bubbleGraph", ['d3Service', function(d3Service){
    return {
        restrict:'EA',
        //template:"<svg width='850' height='200'></svg>",
        link: function(scope, elem, attrs){
            console.log("--- bubbleGraph ---");
            console.log(scope);
            console.log(elem);
            console.log(attrs);

            var diameter = 600, //elem[0].offsetWidth,
                format = d3.format(",d"),
                color = d3.scale.category20c();

            var bubble = d3.layout.pack()
                .sort(null)
                .size([diameter, diameter])
                .padding(1.5);

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", diameter)
                .attr("height", diameter)
                .attr("class", "bubble");

            // Returns a flattened hierarchy containing all leaf nodes under the root.
            function classes(root) {
              var classes = [];

              function recurse(name, node) {
                if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
                else classes.push({packageName: node.name, className: node.name, value: node.size});
              }

              recurse(null, root);
              return {children: classes};
            }



            /*
             * Render valid JSON data
             */ 
            scope.render = function(data) {
                var node = svg.selectAll(".node")
                    //console.log(node);
                    .data(bubble.nodes(classes(data))//root))
                    //.data(bubble.nodes(data)
                    .filter(function(d) { return !d.children; }))
                    .enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

                node.append("title")
                    .text(function(d) { return d.className + ": " + format(d.value); });

                node.append("circle")
                    .attr("r", function(d) { return d.r; })
                    .style("fill", function(d) { return color(d.packageName); });

                node.append("text")
                    .attr("dy", ".3em")
                    .style("text-anchor", "middle")
                    .text(function(d) { return d.className.substring(0, d.r / 3); });
            }

            // Watch for data changes
            scope.$watch(function() {
              return scope.data;
            }, function() {
              scope.render(scope.data);
            });

            //scope.render(scope.data);
            d3.select(self.frameElement).style("height", diameter + "px");

        }
    };
}]);



