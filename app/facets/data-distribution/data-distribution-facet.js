angular.module('facets')

    //
    // NOTE: THIS IS CURRENTLY *** NOT WORKING! ***
    //

    /**
     * The Data Distribution facets, aka the HISTOGRAM
     * TODO: this will have to be revisited at some point
     */
    .directive('dataDistributionFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '=',
                partial: '@'
            },

            templateUrl: 'directives/generic-nested-facetcollection.html',

            link: function (scope, elem, attrs) {}
        };
    }])



    .directive('cttvScorePresets', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                preset : '='
            },


            template: '<div class="container-fluid well well-sm">'
                    + '    <div class="row" ng-show="preset==-1">'
                    + '         <div class="col-sm-12" style="padding-left:30px;"><input type="radio" name="preset" ng-model="preset" value="-1"><span class="label" style="display:inline">custom<span></div>'
                    + '    </div>'
                    + '    <div class="row">'
                    + '        <div class="col-sm-3" style="text-align: center"><input type="radio" ng-model="preset" value="0"><span class="label">none<span></div>'
                    + '        <div class="col-sm-3" style="text-align: center"><input type="radio" ng-model="preset" value="1"><span class="label">low<span></div>'
                    + '        <div class="col-sm-3" style="text-align: center"><input type="radio" ng-model="preset" value="2"><span class="label">mid<span></div>'
                    + '        <div class="col-sm-3" style="text-align: center"><input type="radio" ng-model="preset" value="3"><span class="label">high<span></div>'
                    + '    </div>'
                    + '</div>',


            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * The Score facet
     */
    .directive('cttvScoreFacet', ['$log' , function ($log) {
        'use strict';

        var score_presets= [
            {stringency: 1, min:0.0, max:1.0},
            {stringency: 1, min:0.2, max:1.0},
            {stringency: 3, min:0.6, max:1.0},
            {stringency: 5, min:0.8, max:1.0}
        ];

        return {

            restrict: 'EA',

            scope: {
                facet: '=',
            },


            template: '<div>'
                     +'    <div class="clearfix"><cttv-help-icon href="/faq#association-score" class="pull-right"/></div>'
                     +'    <cttv-score-presets preset="preset"></cttv-score-presets>'
                     +'    <h6>Data distribution</h6>'
                     +'    <cttv-score-histogram data="facet.data.buckets" min="facet.filters[0].key" max="facet.filters[1].key" controls="false"></cttv-score-histogram>'
                    // +'    <div class="clearfix"><span class="pull-left small">Min: {{facet.filters[0].key}}</span><span class="pull-right small">Max: {{facet.filters[1].key}}</span></div>'
                    // +'    <div>'
                    // +'        <span class="small">Stringency:</span>'
                     //+'        <cttv-slider min=1 max=10 config="{snap:true, values:[0.5, 1, 3, 5], labels:[\'min\', \'default\',\'high\',\'max\']}" value="facet.filters[2].key" ></cttv-slider>'
                    // +'        <cttv-slider config="{snap:true, values:[0.5, 1, 3, 5], labels:[\'min\', \'|\',\'|\',\'max\']}" value="facet.filters[2].key" ></cttv-slider>'
                    // +'    <cttv-slider config="{snap:true, values:[0,1,2,3], labels:[\'min\', \'|\',\'|\',\'max\']}" value="preset" ></cttv-slider>'

                    // +'    </div>'
                    // +'    <div><button type="button" class="btn btn-primary btn-xs" ng-click="facet.update()">Apply</button></div>'
                     +'</div>',


            link: function (scope, elem, attrs) {


                // work out the preset to use and pass that to the slider
                // TODO: work out a custom option if the user messes up with the URL directly...
                scope.preset = -1; // set to -1 (custom) to start with...
                var init = scope.$watch('facet.filters', function(val, old){
                    // $log.log("facet ready?" + scope.preset);
                    // $log.log(scope.facet.filters);
                    if( scope.facet.filters[0] && scope.facet.filters[1] && scope.facet.filters[2] ){
                        score_presets.forEach(function(item, i){
                            // $log.log(i+" "+item.min+"=="+scope.facet.filters[0].key +" : "+ (item.min==scope.facet.filters[0].key) );
                            // $log.log(i+" "+item.max+"=="+scope.facet.filters[1].key +" : "+ (item.max==scope.facet.filters[1].key) );
                            // $log.log(i+" "+item.stringency+"=="+scope.facet.filters[2].key +" : "+ (item.stringency==scope.facet.filters[2].key) );
                            if( item.min==scope.facet.filters[0].key &&
                                item.max==scope.facet.filters[1].key &&
                                item.stringency==scope.facet.filters[2].key ){
                                scope.preset = i;
                            }
                        });
                        // $log.log("Preset: "+scope.preset);
                        init(); // remove the watch after first initialization...
                    }
                });

                //scope.$watch('facet.filters[2].key', function(val, old){
                scope.$watch('preset', function(val, old){
                    if( old!==undefined && old!=val){
                        // set the stringency
                        scope.facet.filters[2].key = score_presets[val].stringency.toFixed(0);
                        // set the min
                        scope.facet.filters[0].key = score_presets[val].min.toFixed(1);
                        // set the max
                        scope.facet.filters[1].key = score_presets[val].max.toFixed(1);
                        // fire the update
                        scope.facet.update();
                    }
                });

            },
        };
    }])



    /**
     * The score histogram
     */
    .directive('cttvScoreHistogram', ['$log', 'cttvUtils', function ($log, cttvUtils) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                data: '=',
                min: '=?',
                max: '=?',
                controls: '@'
            },


            template: '<div>'
                     +'</div>',


            link: function (scope, elem, attrs) {
                // $log.log(scope.data);
                // $log.log(scope.min);
                // $log.log(scope.max);

                // declare vars
                var data, margin, width, height, barWidth, tick;

                var init = function(){
                    data = scope.data;

                    margin = {top: 20, right: 10, bottom: 20, left: 10},
                    width = elem[0].childNodes[0].offsetWidth - margin.left - margin.right, // initialize to the full div width
                    height = 80 - margin.top - margin.bottom,
                    barWidth = width / data.length;

                    tick = 1/data.length;



                    var x = d3.scale.linear()
                        .domain([0, 1])
                        .range([0, width]);
                        //.ticks(data.length);

                    var y = d3.scale.linear()
                        .domain([0, d3.max( data, function(d){return d.value;} )])
                        .range([height, 0]);

                    var xAxis = d3.svg.axis()
                        .scale(x)
                        .orient("bottom")
                        .tickSize(0)
                        .tickPadding(8)
                        .ticks(data.length);

                    var svg = d3.select(elem.children().eq(0)[0]).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    var bar = svg.selectAll(".bar")
                        .data(data)
                        .enter().append("g")
                        .attr("class", "bar")
                        .attr("transform", function(d,i) { return "translate(" + x( i/data.length ) + "," + y(d.value) + ")"; });

                    bar.append("rect")
                        .attr("x", 1)
                        .attr("width", barWidth - 1)
                        .attr("class", function(d){ return (d.label>=scope.min && d.label<scope.max) ? "selected" : "deselected" })
                        .attr("height", function(d) { return height - y(d.value); });

                    bar.append("text")
                        .attr("x", barWidth / 2)
                        .attr("y", -13)
                        .attr("dy", ".75em")
                        .attr("text-anchor", "middle")
                        .attr("class", function(d){ return (d.label>=scope.min && d.label<scope.max) ? "selected" : "deselected" })
                        .text(function(d) { return d.value; });

                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis);

                    var update = function(o){
                        scope.min = o.min;
                        scope.max = o.max;
                    }


                    if(scope.controls.toLowerCase()==="true"){

                        var mybrush = d3.svg.brush()
                            .x(x)
                            .extent([scope.min, scope.max])
                            .on("brush", function(){ scope.$apply(onBrush) })
                            .on("brushend", onBrushEnd);

                        // brush graphics
                        var gBrush = svg.append("g")
                            .attr("class", "brush")
                            .call(mybrush);

                        gBrush.selectAll(".resize").append("circle")
                            .attr("class", "handle")
                            .attr("transform", "translate(0," + height/2 + ")")
                            .attr("r", 4);

                        gBrush.selectAll("rect")
                            .attr("height", height);

                        var onBrushEnd = function(){
                            d3.select(this).call(mybrush.extent([scope.min, scope.max]));
                        }

                        var onBrush = function(){
                            var extent0 = mybrush.extent();
                            update( {
                                min: cttvUtils.roundToNearest(extent0[0], tick).toFixed(2), // extent0[0].toFixed(2),
                                max: cttvUtils.roundToNearest(extent0[1], tick).toFixed(2),// extent0[1].toFixed(2)
                            } );
                            //mybrush.extent(scope.min, scope.max);
                        }

                    }
                }

                scope.$watch('data',function(d){
                    // $log.log("************");
                    // $log.log(scope.data);
                    // $log.log(scope.min);
                    // $log.log(scope.max);
                    if(d){
                        init();
                    }
                })
            },
        };
    }])





;