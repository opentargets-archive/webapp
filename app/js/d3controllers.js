'use strict';

/* Controllers */





angular.module('bubbleGraphApp',['d3']).



/**
 * BubbleGraph directive
 */
directive("circlePackGraph", ['d3Service', function(d3Service){
    return {
        restrict:'EA',
        link: function(scope, elem, attrs){

            var diameter = elem[0].offsetWidth,
                format = d3.format(",d"),
                color = d3.scale.category20c(),
                isBubble = attrs.asBubble && attrs.asBubble.toLowerCase()==="true",
                useColorPalette = attrs.useColorPalette && attrs.useColorPalette.toLowerCase()==="true";

            var pack = d3.layout.pack()
                .sort(null)
                .size([diameter, diameter])
                .padding(1.5);

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", diameter)
                .attr("height", diameter)
                .attr("class", "bubble");



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
            scope.render = function(data) {

              // remove all previous items before render
              svg.selectAll('*').remove();

              // If we don't pass any data, return out of the element
              if (!data) return;

              var node = svg.datum(data).selectAll(".node")
                  //.data(pack.nodes((attrs.asBubble&&attrs.asBubble.toLowerCase()==="true" ? getFlatData(data) : data))//root))
                  .data(
                    function(){
                      if(isBubble){
                        return pack.nodes(getFlatData(data)).filter(function(d) { return !d.children; })
                      }else{
                        return pack.nodes
                    }
                    }()
                  )
                  .enter().append("g")
                  .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
                  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

              node.append("title")
                  .text(function(d) { return d.name + ": " + format(d.value); });

              var circle = node.append("circle");
                  circle.attr("r", function(d) { return d.r; });
                  if(isBubble){
                    circle.style("fill", function(d) { return color(useColorPalette ? d.name : d.parentName); });
                  }
              node.append("text")
                  .attr("dy", ".3em")
                  .style("text-anchor", "middle")
                  .text(function(d) { return d.name.substring(0, d.r / 3); });
            }


            // Watch for data changes
            scope.$watch(function() {
              return scope[attrs.data];
            }, function() {
              scope.render(scope[attrs.data]);
            });

            
            d3.select(self.frameElement).style("height", diameter + "px");

        }
    };
}]);



