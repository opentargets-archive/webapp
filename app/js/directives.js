
/* Directives */
angular.module('cttvDirectives', [])


    /*
    *
    */
    .directive('cttvTargetGenomeBrowser', ['cttvAPIservice', function (cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                var efo = attrs.efo;
                var w = (attrs.width || elem[0].parentNode.offsetWidth) - 40;
                scope.$watch(function () {return attrs.target; }, function (target) {
                    if (target === "") {
                        return;
                    }
                    var newDiv = document.createElement("div");
                    newDiv.id = "cttvTargetGenomeBrowser";
                    newDiv.className = "accordionCell";
                    elem[0].appendChild(newDiv);

                    var gB = tnt.board.genome()
                        .species("human")
                        .gene(attrs.target)
                        .context(20)
                        .width(w);

                    //gB.rest().proxyUrl("/ensembl");
                    //gB.rest().proxyUrl("/api/latest/ensembl")
                    gB.rest().prefix("/proxy/rest.ensembl.org").protocol("").domain("");
                    var theme = targetGenomeBrowser()
                        .efo(efo)
                        .cttvRestApi(cttvAPIservice.getSelf());
                    theme(gB, document.getElementById("cttvTargetGenomeBrowser"));
                });
            }
        };
    }])

    .directive('logSession', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                cttvAPIservice.logSession();
            }
        };
    }])

    /*
    *
    */
    .directive('cttvSearchSuggestions', [function(){
        'use strict';

        return {
            restrict:'EA',
            templateUrl: 'partials/search-suggestions.html',
            replace: true,
            link: function(scope, elem, attrs){

            }
        };
    }])



    /**
    * Flower graph
    */
    .directive('cttvGeneDiseaseAssociation', [function(){
        'use strict';

        return {
            restrict:'EA',
            //transclude: 'true',
            scope: {
                associationData: '='
            },
            link: function(scope, elem, attrs){
                //var flower = flowerView().values(scope.associationData);
                //flower(elem[0]);

                scope.render = function(data){
                    if(data.length>0){
                        var flower = flowerView()
                            .values(data)
                            .diagonal(200);
                        flower(elem[0]);
                    }
                };

                // Watch for data changes
                scope.$watch(
                    'associationData',
                    function() {
                        scope.render(scope.associationData);
                    }//,
                    //true
                );
            }
        };
    }])



    /*
    * A simple progress spinner using a fontawesome icon
    * Options:
    * size: size of the spinner icon; values 1-6; 1 is default
    */
    .directive('cttvProgressSpinner', [function(){
        'use strict';

        return {
            restrict: 'EA',
            //template: '<span class="fa-spin cttv-progress-spinner-svg-container"><svg width="100%" height="100%" viewBox="0 70 140 70" preserveAspectRatio="xMaxYMax"><path fill="#666666" d="M70,10c33.1,0,60,26,60,60h10c0-39-31.3-70-70-70S0,31,0,70h10C10,36,36.9,10,70,10z"/></span></div>',
            template: '<span></span>',
            link: function(scope, elem, attrs){
                var size = attrs.size || 18;
                var stroke = attrs.stroke || 2;
                var sp = spinner()
                    .size(size)
                    .stroke(stroke);
                sp(elem[0]);
                // if(attrs.size){
                //     elem.children(".cttv-progress-spinner-svg-container").css("width", attrs.size);
                //     elem.children(".cttv-progress-spinner-svg-container").css("height", attrs.size);
                // }
            }
        };
    }])



    /*
    * This creates a light-box style div with a spinner.
    * The spinner is automatically visible when there are *any* pending requests
    * Options:
    * size: as per cttvProgressSpinner; Default is 3.
    */
    .directive('cttvPageProgressSpinner', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
        'use strict';

        return {
            restrict: 'EA',
            //template: '<div class="page-progress-spinner" ng-show="isloading"><span cttv-progress-spinner class="text-lowlight fa-{{size}}x"></span></div>',
            template: '<div class="page-progress-spinner" ng-show="isloading"><span cttv-progress-spinner size="50" stroke="3" class="text-lowlight"></span></div>',
            scope: {
                size: '@'
            },
            link: function(scope, elem, attrs){
                // scope.size = scope.size ? scope.size : '120px';
                // console.log(scope.size);

                scope.$watch(function(){return cttvAPIservice.activeRequests;}, function(newValue,oldValue){
                    scope.isloading = newValue>0;
                });
            }
        };
    }])



    /*
    *  Esssentially just a wrapper for the table tag, defined in hte template
    */
    .directive('cttvMatrixTable', [function(){
        'use strict';

        return {
            restrict: 'EA',
            template: '<table class="table matrix-table"></table>',
            replace: true,
            link: function(scope, elem, attrs){
                /*
                var colorScale = d3.scale.linear()
                .domain([0,1])
                .range(["#e9f3f8", "#2383BA"]);

                var getColorStyleString = function(value){
                return "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+value+"'>"+value+"</span>";
                }

                elem.on('$destroy', function() {
                // remove objects from memory as required
                });
                */
            }
        };
    }])



    /*
    *
    */
    .directive ('cttvMatrixLegend', function () {
        'use strict';
        var template = '<div class="matrix-legend matrix-legend-layout-{{layout}} clearfix">'

        // label above (v layout) or left (h layout) of legend
        +    '<span class="matrix-legend-from" ng-show="layout==\'h\'">{{labels[0] || colors[0].label}}</span>'

        // create the color swatches
        +    '<span class="matrix-legend-item clearfix" ng-repeat="item in colors">'
        +       '<span class="matrix-legend-background" ng-style="{\'background\':item.color}" ng-class="item.class"></span>'
        +       '<span class="matrix-legend-background-label matrix-legend-to" ng-hide="layout==\'h\'">{{item.label}}</span>'
        +    '</span>'

        // label below (v layout) or right (h layout) of legend
        +    '<span class="matrix-legend-to" ng-show="layout==\'h\'">{{labels[labels.length-1] || colors[colors.length-1].label}}</span>'

        + '</div>'

        // extra info
        + '<div class="matrix-legend-info"><a ng-if="legendText!=undefined" href="/faq#association-score"><span class="fa fa-question-circle"></span><span class="matrix-legend-text">{{legendText}}</span></a></div>'
        ;
        return {
            restrict: 'EA',
            template: template,
            scope: {
                labels: '=',
                colors: '=',
                legendText: '=',
                layout: '@'
            },

            controller: ['$scope', function($scope){
                // set the default layout
                $scope.layout = $scope.layout ? $scope.layout : 'v';
            }]

        };
    })


    /**
    *
    * Options for configuration are:
    *   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
    *   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
    *
    * Example:
    *   <cttv-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></cttv-disease-associations>
    *
    *   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
    *   This is useful in conjunction with a spinner where you can have ng-show="loading"
    */
    .directive('cttvHpaTissueExpression', ['$log', 'cttvAPIservice', 'cttvUtils', function ($log, cttvAPIservice, cttvUtils) {
        'use strict';

        var colorScale = cttvUtils.colorScales.BLUE_1_3; //blue orig

        var labelScale = d3.scale.ordinal()
            .domain([1,2,3])
            .range(["Low", "Medium", "High"]);

        var getColorStyleString = function(value){
            var span="";

            if(value===0){
                span = "<span class='value-0' title='Not expressed'>"+value+"</span>";
            } else if(value>0){
                var c = colorScale(value);
                var l = labelScale(value);
                span = "<span style='color: "+c+"; background: "+c+";' title='Expression: "+l+"'>"+value+"</span>";
            } else {
                span = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, don't put anything so the sorting works better
            }


            return span;
        };

        var cols = [
            "Tissue",
            "Protein",
            "RNA",
            ""
        ];

        return {

            restrict: 'EA',

            scope: {
                target : '=',
                //loadprogress : '=',
                filename : '@'
            },

            template: '<cttv-matrix-table></cttv-matrix-table>'
            +'<cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
            +'<cttv-matrix-legend colors="colors" layout="h"></cttv-matrix-legend>',

            link: function (scope, elem, attrs) {

                // set the load progress flag to true before starting the API call
                //scope.loadprogress = true;

                // Watch for data changes
                scope.$watch(
                    'target',
                    function() {

                        // move cttvAPIservice.getExpression ({ in here
                        // ......

                        if( scope.target ){

                            cttvAPIservice.getExpression ({
                                gene: scope.target  // TODO: should be TARGET in API!!!
                            })
                            .then(

                                // success
                                function (resp) {

                                    // set hte load progress flag to false once we get the results
                                    //scope.loadprogress = false;

                                    var data = resp.body.data[scope.target].tissues;
                                    var newData = [];

                                    for (var tissue in data) {
                                        var row = [];
                                        row.push( tissue );
                                        row.push( getColorStyleString(data[tissue].protein.level) );
                                        row.push( getColorStyleString(data[tissue].rna.level) );
                                        row.push("");
                                        newData.push(row);

                                    }

                                    // -----------------------
                                    // Initialize table etc
                                    // -----------------------

                                    // table itself
                                    var table = elem.children().eq(0)[0];
                                    var dtable = $(table).dataTable(cttvUtils.setTableToolsParams({
                                        "data" : newData,
                                        "columns": (function(){
                                            var a=[];
                                            for(var i=0; i<cols.length; i++){
                                                a.push({ "title": "<div><span title='"+cols[i]+"'>"+cols[i]+"</span></div>" });
                                            }
                                            return a;
                                        })(),
                                        "columnDefs" : [
                                            { "orderSequence": [ "desc", "asc"], "targets": "_all" }
                                        ],
                                        "order" : [[0, "asc"]],
                                        "autoWidth": false,
                                        "ordering": true,
                                        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                                        "pageLength": 50
                                    }, scope.filename ));


                                    // legend stuff
                                    scope.colors = [];
                                    for(var i=1; i<=3; i++){
                                        scope.colors.push( {color:colorScale(i), label:labelScale(i)} );
                                        $log.log(i +" : "+ labelScale(i));
                                    }

                                    scope.legendData = [
                                        {label:"No data", class:"no-data"},
                                        {label:"Not expressed", class:"value-0"}
                                    ];


                                },

                                // error
                                cttvAPIservice.defaultErrorHandler
                            );
                        }
                    }

                ); // end watch

            } // end link
        }; // end return
    }])



    /**
    * Top level container for all the facets.
    * This contains accordion etc
    */
    .directive('cttvFacets', ['$log', 'cttvAPIservice', 'cttvFiltersService' , function ($log, cttvAPIservice, cttvFiltersService) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {},

            templateUrl: 'partials/facets.html',

            link: function (scope, elem, attrs) {
                //scope.dataDistribution =
                scope.filters = cttvFiltersService.getFilters();
                scope.selectedFilters = cttvFiltersService.getSelectedFilters();
                scope.deselectAll = cttvFiltersService.deselectAll;
                //scope.respStatus = 1; //cttvFiltersService.status(); // TODO: handle response status
                //scope.updateFilter = function(id){
                //    cttvFiltersService.getFilter(id).toggle();
                //}
            },

        };

    }])



    /**
     * The default "select all / clear all" controls for facets
     * @param facet the facet (i.e. instance of FilterCollection from the FilterService) we are rendering, e.g. datatypes, pathways, score , etc...
     */
    .directive('cttvDefaultFacetControls', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='
            },

            template: '<div class="cttv-facets-controls">'
                      + '    <span ng-click="facet.selectAll(false)">Clear all <i class="fa fa-times"></i></span>'
                      + '    <span ng-click="facet.selectAll(true)">Select all <i class="fa fa-check"></i></span>'
                      + '</div>',

            link: function (scope, elem, attrs) {},
        };
    }])

    /**
    * The therapeutic areas facet
    */
    .directive('cttvTherapeuticAreasFacet', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                facet: '=',
                partial: '@'
            },
            template: '<div cttv-default-facet-controls facet="facet"></div>'
                + '<div>'
                + '   <cttv-checkbox-facet bucket="ta" partial={{partial}} ng-repeat="ta in facet.filters">'
                + '{{ta}}   </cttv-checkbox-facet>'
                + '</div>',

            link: function (scope, elem, attrs) {
            },
        };
    }])

    /**
     * The Datatypes facet
     */
    .directive('cttvDatatypesFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '=',
                partial: '@'
            },

            // template: '<div cttv-default-facet-contols facet="facet"></div>'
            //          +'<div cttv-checkbox-facet bucket="bucket" ng-repeat="bucket in facet.filters"></div>',
            template: '<div cttv-default-facet-controls facet="facet"></div>'
                     +'<div ng-init="isCollapsed=true&&(!datatype.collection.isLastClicked())" ng-repeat="datatype in facet.filters" >' // track by datatype.key" >'
                     +'    <cttv-parent-checkbox-facet bucket="datatype" collapsed="isCollapsed" partial="{{partial}}"></cttv-parent-checkbox-facet>'
                     +'    <div uib-collapse="isCollapsed" style="padding-left:20px">'
                     //+'        <div></div>'
                     +'        <div cttv-checkbox-facet bucket="bucket" ng-repeat="bucket in datatype.collection.filters" partial="{{partial}}"></div>'
                     +'    </div>'
                     +'</div>',

            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * The Datatypes facet
     */
    .directive('cttvPathwaysFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '=',
                partial: '@'
            },


            template: '<div cttv-default-facet-controls facet="facet"></div>'
                     +'<div ng-init="isCollapsed=true&&(!pathway.collection.isLastClicked())" ng-repeat="pathway in facet.filters">' // TODO: try "isCollapsed=true&&(!facet.isLastClicked())"
                     +'    <cttv-parent-checkbox-facet bucket="pathway" collapsed="isCollapsed" partial="{{partial}}"></cttv-parent-checkbox-facet>'
                     +'    <div uib-collapse="isCollapsed" style="padding-left:20px">'
                     //+'          <div cttv-default-facet-contols facet="pathway.collection"></div>'
                     +'        <div cttv-checkbox-facet multiline="true" bucket="bucket" ng-repeat="bucket in pathway.collection.filters" partial="{{partial}}"></div>'
                     +'    </div>'
                     +'</div>',


            link: function (scope, elem, attrs) {},
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



    .directive('cttvSizeListener', ['$log', 'cttvUtils', function ($log, cttvUtils) {
        'use strict';

        return {
            restrict: 'EA',

            scope: {
                onresize : '=?'
            },

            //template: '<iframe style="width:100%; height:100%; visibility:hidden"></iframe>',
            template: "<div style='width:100%; height:0; margin:0; padding:0; overflow:hidden; visibility:hidden; z-index:-1'>"
                     +"    <iframe style='width:100%; height:0; border:0; visibility:visible; margin:0' />"
                     //+"    <iframe style='width:0; height:100%; border:0; visibility:visible; margin:0' />"
                     +"</div>",

            link: function (scope, elem, attrs) {
                var iframe = elem[0].children[0].children[0].contentWindow || elem[0].children[0].children[0];

                iframe.onresize = function(evt){
                    $log.log("onresize( "+evt.target.innerWidth+" x "+evt.target.innerHeight+" )");
                    if(scope.onresize){
                        scope.onresize({w:evt.target.innerWidth, h:evt.target.innerHeight});
                    }
                }
            }
        }
    }])



    /**
     * A generic slider
     */
    .directive('cttvSlider', ['$log', 'cttvUtils', function ($log, cttvUtils) {
        //'use strict';

        return {

            restrict: 'EA',

            scope: {
                min: '@?',
                max: '@?',
                value: '=?',    // optional initial position, or min if nothing specified
                config: '=?'    // optional configuration:
                                // tick: Number
                                // ticks: Number
                                // snap: Boolean
                                // mode: String ["linear" | "ordinal"]
                                // values: Array
                                // labels: Array
            },

            //template: '<cttv-size-listener onresize="resize"></cttv-size-listener>',

            /*
            link: function (scope, elem, attrs) {

                // set up dimentions
                var margin = {top: 0, right: 10, bottom: 10, left: 10},
                    width = (scope.config.width || elem[0].offsetWidth) - margin.left - margin.right,   // initialize width to the div width
                    height = 30 - margin.bottom - margin.top;

                var config = scope.config || {}


                var tick = config.tick;
                var ticks = config.ticks || (scope.max-scope.min)/tick;
                var snap = config.snap || false;

                scope.value = scope.value || scope.min;


                var x = d3.scale.linear()
                    .domain([scope.min, scope.max])
                    .range([0, width])
                    .clamp(true);

                var brush = d3.svg.brush()
                    .x(x)
                    .extent([0, 0])
                    .on("brush", onBrush);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(ticks)
                    //.tickFormat(function(d) { return d + "°"; })
                    .tickSize(0)
                    .tickPadding(12);

                var svg = d3.select(elem.eq(0)[0]).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height / 2 + ")")
                    .call(xAxis)
                    .select(".domain")
                    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "halo");

                    svg.attr("viewBox", "0 0 " + width + " " + height)
                    .attr("perserveAspectRatio", "xMinYMin");
                    //.call(scope.resize);


                var slider = svg.append("g")
                    .attr("class", "slider")
                    .call(brush);

                slider.selectAll(".extent,.resize")
                    .remove();

                var handle = slider.append("circle")
                    .attr("class", "handle")
                    .attr("transform", "translate(0," + height / 2 + ")")
                    .attr("r", 9);

                // init: move slider to initial position
                slider
                    .call(brush.event)
                    //.transition() // gratuitous intro!
                    //.duration(750)
                    .call(brush.extent([scope.value, scope.value]))
                    .call(brush.event);

                // attach event after initial animation is triggered (hack, I confess)
                brush.on("brushend", function(){ scope.$apply(onBrushEnd) });

                function onBrush() {
                    var value = brush.extent()[0];

                    if (d3.event.sourceEvent) { // not a programmatic event
                        value = x.invert(d3.mouse(this)[0]);
                        if(snap){
                            value = cttvUtils.roundToNearest( value, tick );
                        }
                        brush.extent([value, value]);
                    }

                    // move the handle
                    handle.attr("cx", x(value));
                }

                function onBrushEnd() {
                    // update the scope value when finishing brushing
                    if (d3.event.sourceEvent) { // not a programmatic event
                        scope.value = brush.extent()[0];
                    }
                }

                scope.resize=function(dim){
                    $log.log(dim.w);
                    width = dim.w - margin.left - margin.right,   // initialize width to the div width

                    x.domain([scope.min, scope.max])
                    .range([0, width]);

                    svg.attr("width", width + margin.left + margin.right);

                }

            },*/

            link: function (scope, elem, attrs) {
                $log.log("value: "+scope.value);

                scope.$watch('value', function(n, o){
                    //$log.log("value: "+scope.value+" / "+n);
                    if(n!=undefined && o==undefined){

                        // set up dimentions
                        var margin = {top: 0, right: 10, bottom: 10, left: 10},
                            width = (scope.config.width || elem[0].offsetWidth) - margin.left - margin.right,   // initialize width to the div width
                            height = 35 - margin.bottom - margin.top;

                        // check the configuration
                        var config = scope.config || {}

                        var mode = config.mode || "linear";
                        var ticks = config.ticks || config.values.length || 10;
                        var tick = config.tick || 1;
                        var snap = config.snap || false;
                        var values = config.values || [ (scope.min || 0), (scope.max || 1) ];
                        var labels = config.labels;

                        scope.value = scope.value || scope.min;

                        // the scale/mapping of actual values that the slider is returning
                        var v = d3.scale.linear()
                            .domain(values.map(function(item, i){ return i; }))
                            .range(values.map(function(item){ return item; }))
                            .clamp(true);

                        // the scale of the slider, 0 to 1 and 0 to width
                        var x = d3.scale.linear()
                            .domain([0, (ticks-1)])
                            .range([0, width])
                            .clamp(true);

                        var brush = d3.svg.brush()
                            .x(x)
                            .extent([0, 0])
                            .on("brush", onBrush);


                        var xAxis = d3.svg.axis()
                            .scale(x)
                            .orient("bottom")
                            .ticks(ticks)
                            .tickFormat(function(d) {
                                //return d+"\""; // config.labels[d] || ;
                                return labels[d];
                             })
                            .tickSize(0)
                            .tickPadding(12);


                        var svg = d3.select(elem.eq(0)[0]).append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        svg.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height / 2 + ")")
                            .call(xAxis)
                            .select(".domain")
                            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                            .attr("class", "halo");

                        var slider = svg.append("g")
                            .attr("class", "slider")
                            .call(brush);

                        slider.selectAll(".extent,.resize")
                            .remove();

                        var handle = slider.append("circle")
                            .attr("class", "handle")
                            .attr("transform", "translate(0," + height / 2 + ")")
                            .attr("r", 7);

                        // init: move slider to initial position
                        slider
                            .call(brush.event)
                            .call(brush.extent([v.invert(scope.value), v.invert(scope.value)]))
                            .call(brush.event);

                        // attach event after initial animation is triggered (hack, I confess)
                        brush.on("brushend", function(){ scope.$apply(onBrushEnd) });

                        var onBrush = function() {
                            var value = brush.extent()[0];

                            if (d3.event.sourceEvent) { // not a programmatic event
                                value = x.invert(d3.mouse(this)[0]);
                                if(snap){
                                    value = cttvUtils.roundToNearest( value, tick );
                                }
                                brush.extent([value, value]);
                            }

                            // move the handle
                            handle.attr("cx", x(value));
                        }

                        var onBrushEnd = function() {
                            // update the scope value when finishing brushing
                            if (d3.event.sourceEvent) { // not a programmatic event
                                scope.value = v( brush.extent()[0] );
                            }
                        }

                    }
                });



                /*scope.resize=function(dim){
                    $log.log(dim.w);
                    width = dim.w - margin.left - margin.right,   // initialize width to the div width

                    x.domain([scope.min, scope.max])
                    .range([0, width]);

                    svg.attr("width", width + margin.left + margin.right);

                }*/

            },
        };
    }])

    /**
     * A directive for plain Checkbox facets.
     * @param bucket the instance of Filter object from the FilterService; this is likely in an ng-repeat thing like ng-repeat="bucket in filters"
     */
    .directive('cttvCheckboxFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                bucket: '=',
                partial: '@',    // optional 'OK' status
                multiline: '@?'  // optional multiline option
            },

            template: '<div class="checkbox cttv-facet-checkbox clearfix">'
                     +'    <label ng-class="(!bucket.enabled ? \'disabled\' : \'\') +\' \'+ (multiline?\'cttv-facet-checkbox-label-multiline\':\'cttv-facet-checkbox-label\')" title="{{bucket.label}}">'
                     +'        <input type="checkbox"'
                     +'            ng-value="{{bucket.id}}"'
                     +'            ng-checked="bucket.selected"'
                     +'            ng-disabled="!bucket.enabled"'
                     +'            ng-click="bucket.toggle()" >'
                     +'<span>{{bucket.label | upperCaseFirst | clearUnderscores}}</span>'
                     +'<span ng-if="multiline" class="text-lowlight cttv-facet-count" title="{{bucket.count | metricPrefix:0}}{{partial==1 ? \' or more\' : \'\'}}">({{bucket.count | metricPrefix:0}}<span ng-if="partial==1">+</span>)</span>'
                     +'</label>'
                     +'<span ng-if="!multiline" class="text-lowlight cttv-facet-count" title="{{bucket.count | metricPrefix:0}}{{partial==1 ? \' or more\' : \'\'}}">({{bucket.count | metricPrefix:0}}<span ng-if="partial==1">+</span>)</span>'
                     +'</div>',

            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * A directive for plain Checkbox facets.
     * @param bucket the instance of Filter object from the FilterService; this is likely in an ng-repeat thing like ng-repeat="bucket in filters"
     */
    .directive('cttvParentCheckboxFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                bucket: '=',
                collapsed: '=',
                partial: '@'
            },

            template: '<div>'
                     +'    <div class="checkbox cttv-facet-checkbox clearfix">'
                     // +'        <span style="width:12px" class="text-lowlight pull-right">'
                     // +'            <i class="fa" ng-class="{\'fa-caret-right\': collapsed, \'fa-caret-down\': !collapsed}" ng-click="collapsed = !collapsed" style="cursor:pointer; padding:0px 4px;" ng-show="bucket.enabled"></i>'
                     // +'        </span>'
                     +'        <span style="width:auto">'
                     +'            <label ng-class="(!bucket.enabled) ? \'disabled\' : \'\'" class="cttv-facet-checkbox-label" title="{{bucket.label}}">'
                     +'                <input type="checkbox"'
                     +'                    cttv-ui-indeterminate="{{bucket.collection.getSelectedFilters().length>0 && (bucket.collection.filters.length > bucket.collection.getSelectedFilters().length)}}"'
                     +'                    value="{{bucket.id}}"'
                     +'                    ng-checked="bucket.selected || (bucket.collection.filters.length>0 && bucket.collection.filters.length == bucket.collection.getSelectedFilters().length)"'
                     +'                    ng-disabled="!bucket.enabled || bucket.collection.getSelectedFilters().length>0"'
                     +'                    ng-click="bucket.toggle()" >'
                     +'                {{bucket.label}}'
                     +'            </label>'
                     +'            <span class="text-lowlight cttv-facet-count pull-left" title="{{bucket.count | metricPrefix:0}}{{partial==1 ? \' or more\' : \'\'}}">({{bucket.count | metricPrefix:0}}<span ng-if="partial==1">+</span>)</span>'
                     +'        </span>'
                     +'        <span style="width:12px" class="text-lowlight pull-right">'
                     +'            <i class="fa" ng-class="{\'fa-caret-right\': collapsed, \'fa-caret-down\': !collapsed}" ng-click="collapsed = !collapsed" style="cursor:pointer; padding:0px 4px;" ng-show="bucket.enabled"></i>'
                     +'        </span>'
                     +'    </div>'
                     +'</div>',

            link: function (scope, elem, attrs) {},
        };
    }])



    /**
    * A directive for Checkbox facet with nested facets.

    .directive('cttvMultiCheckboxFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                //bucket: '='
            },

            template: '',

            link: function (scope, elem, attrs) {},
        };
    }])
    */


    /**
    * A directive for Checkbox facet with nested facets.
    */
    .directive('cttvUiIndeterminate', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            link: function (scope, elem, attrs) {
                if (!attrs.type || attrs.type.toLowerCase() !== 'checkbox') {
                    return angular.noop;
                }

                scope.$watch(attrs.cttvUiIndeterminate, function(newVal) {
                    elem[0].indeterminate = !!newVal;
                });
            }
        };
    }])



    .directive('cttvModal', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',
            transclude: true,
            scope: {
                header: "@",        // the text to be displayed in the header
                hasClose: '=?',      // show the round close button top right corner [true | false]
                hasOk: '=?',         // show ok button [true | false]
                hasCancel: '=?',     // show cancel button [true | false]
                okLabel: '@?',       // text of the OK button [ String ]
                cancelLabel: '@?',   // text of the Cancel button [ String ]
                onOk: "&",          // OK callback [ function ]
                onCancel: "&"       // cancel callback [function ]
            },
            template: // the close button
                      '<div class="modal-close-btn" ng-if="hasClose" ng-click="dismiss()">'
                     +'    <span class="fa fa-circle"></span><span class="fa fa-times"></span>'
                     +'</div>'
                     // the header
                     +'<div ng-if="header" class="modal-header"><h4>{{header}}</h4></div>'
                     // the body:
                     // the modal-body-content tag is only so it can be selected and replaced easily
                     +'<div class="modal-body"><modal-body-content></modal-body-content></div>'
                     // the footer
                     +'<div ng-if="hasOk || hasCancel" class="modal-footer">'
                     +'    <button ng-if="hasCancel" class="btn btn-warning" type=button ng-click="dismiss()">{{cancelLabel}}</button>'
                     +'    <button ng-if="hasOk" class="btn btn-primary" type=button ng-click="ok()">{{okLabel}}</button>'
                     +'</div>',

            link: function (scope, elem, attrs, ctrl, transclude) {

                transclude(scope.$parent, function(clone, scope) {
                    elem.find('modal-body-content').replaceWith(clone);
                });

                scope.okLabel = scope.okLabel || "OK";
                scope.cancelLabel = scope.cancelLabel || "Cancel";

                scope.dismiss = function(){
                    // $log.log("scope.dismiss()");
                    if(scope.onCancel){
                        scope.onCancel();
                    }
                    elem.scope().$dismiss();
                }
                scope.ok = function(){
                    $log.log("scope.ok()");
                    $log.log(scope.onOk);
                    if(scope.onOk){
                        scope.onOk();
                    }
                    elem.scope().$close();
                }
            }

        };
    }])



    /**
     * This directive exposes the page scroll, so it can, for example,
     * be used to create nav bars that become sticky as the user scrolls the page
     * @param scroll-position - the name of the variable to hold the scroll amount
     * Example:
     *  <div sticky-scroller scroll-position="scroll" ng-class="scroll>80 ? 'fixed' : ''">
     *      Hello
     *  </div>
     */
    .directive('stickyScroller', ['$log', '$window', function ($log, $window) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                scroll: '=scrollPosition',
            },
            link: function(scope, element, attrs) {
                var windowEl = angular.element($window);
                var handler = function() {
                    scope.scroll = windowEl[0].scrollY;
                    $log.log(scope.scroll);
                };
                windowEl.on('scroll', scope.$apply.bind(scope, handler));
                handler();
            }
        };
    }])

    .directive('resize', ['$window', function ($window) {
        'use strict';

        var w = angular.element($window);

        return {
            scope : {},
            controller: ['$scope', function ($scope) {
                this.dims = function () {
                    return {
                        'height': w[0].innerHeight,
                        'width': w[0].innerWidth
                    };
                };

                w.bind('resize', function () {
                    $scope.$apply();
                });
            }]
        };
    }])

    .directive('png', ['$timeout', '$uibModal', '$analytics', '$log', function ($timeout, $uibModal, $analytics, $log) {
        'use strict';

        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                filename:'@',
                track: '@'
            },
            replace: false,
            template: '<div ng-show="exportable" class="clearfix"><div class="pull-right"><a class="btn btn-default buttons-csv buttons-html5" ng-click="exportPNG()"><span class="fa fa-picture-o" title="Download as PNG"></span></a></div></div>',
            link: function (scope, element, attrs) {
                $timeout(function () {
                    scope.exportable = ((scope.$parent.toExport !== undefined) && (typeof scope.$parent.toExport === "function"));
                }, 0);
                scope.currScale = 1;
                scope.exportPNG = function () {
                    var container = scope.$parent.toExport();
                    if (container.nodeName === "CANVAS") {
                        var canvas = container;
                        var img = canvas.toDataURL("image/png");
                        var a = document.createElement('a');
                        a.download = scope.filename;
                        a.href = img;
                        document.body.appendChild(a);
                        a.click();

                    } else {
                        // We assume it is an SVG
                        var svg = container;

                        // Show a modal with the scale of the png
                        var modal = $uibModal.open({
                            animation: true,
                            //template: "<div class=modal-header>PNG scale factor</div><div class='modal-body modal-body-center'><span class=png-scale-factor-selection><input type=radio name=pngScale value=1 checked ng-model='$parent.currScale'> 1x</span><span class=png-scale-factor-selection><input type=radio name=pngScale value=2 ng-model='$parent.currScale'> 2x</span><span class=png-scale-factor-selection><input type=radio name=pngScale value=3 ng-model='$parent.currScale'> 3x</span></div><div class=modal-footer><button class='btn btn-primary' type=button ng-click='export(this)' onclick='angular.element(this).scope().$dismiss()'>OK</button></div>",
                            template: '<cttv-modal header="Download as PNG" on-ok="export()" has-ok="true" ok-label="Download" has-cancel="true">'
                                          +'<div class="modal-body-center">'
                                              +'<p>Select scale factor for the image</p>'
                                              +'<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="1" ng-model="$parent.currScale"> 1x</span>'
                                              +'<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="2" ng-model="$parent.currScale"> 2x</span>'
                                              +'<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="3" ng-model="$parent.currScale"> 3x</span>'
                                          +'</div>'
                                      +'</cttv-modal>',
                            size: "sm",
                            scope: scope
                        });
                        scope.export = function () {
                            $log.log("exporting...");
                            // track in piwik
                            if (scope.track) {
                                $analytics.eventTrack('export', {"category":scope.track, "label": scope.currScale})
                            }

                            // TODO: Set max_size to 2100000
                            var pngExporter = tnt.utils.png()
                                .filename(scope.filename || "image.png")
                                .scale_factor(scope.currScale)
                                .stylesheets(['components-cttvWebapp.min.css'])
                                .limit({
                                    limit: 2100000,
                                    onError: function () {
                                        $uibModal.open({
                                            animation: true,
                                            //template: "<div class='modal-header'>Image too large</div><div class=modal-body>The image you are trying to export is too large. Reduce the number of elements and try again.</div><div class=modal-footer><button class='btn btn-primary' type=button onclick='angular.element(this).scope().$dismiss()'>OK</button></div>",
                                            template: "<cttv-modal header='Image too large' has-ok='true'>The image you are trying to export is too large. Reduce the number of elements or scale factor and try again.</cttv-modal>",
                                            size:"sm",
                                        });
                                    }
                                });

                            pngExporter(d3.select(svg));
                        };
                    }
                };
            }
        };
    }])

    .directive('cttvHelpIcon', [function () {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                href: '@'
            },
            template : '<a href="{{href}}"><span class="fa fa-question-circle"></span></a>',
            link: function(scope, element, attrs) {}
        };
    }])


    .directive('mastheadNavigationMenu', ['cttvConfig', function (cttvConfig) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                // href: '@',
            },
            /*template :    '<ul class="masthead-navigation">'
                        +     '<li>'
                        +         '<span dropdown on-toggle="toggled(open)">'
                        +             '<a href dropdown-toggle>About <span class="fa fa-angle-down"></span></a>'
                        +             '<ul class="dropdown-menu" dropdown-menu>'
                        +                  '<li><a href="//www.opentargets.org/">Open Targets</a></li>'
                        +                  '<li><a href="/about">Target Validation Platform</a></li>'
                        +             '</ul>'
                        +          '</span>'
                        +     '</li>'

                        +     '<li dropdown on-toggle="toggled(open)"><a href dropdown-toggle>Help <span class="fa fa-angle-down"></span></a>'
                        +         '<ul class="dropdown-menu" dropdown-menu>'
                        +              '<li><a href="/faq">FAQs</a></li>'
                        +              '<li><a href="&#x6D;&#x61;&#x69;&#x6C;&#x74;&#x6F;&#x3A;&#x73;&#x75;&#x70;&#x70;&#x6F;&#x72;&#x74;&#x40;&#x74;&#x61;&#x72;&#x67;&#x65;&#x74;&#x76;&#x61;&#x6C;&#x69;&#x64;&#x61;&#x74;&#x69;&#x6F;&#x6E;&#x2E;&#x6F;&#x72;&#x67;&#x3F;&#x53;&#x75;&#x62;&#x6A;&#x65;&#x63;&#x74;&#x3D;&#x54;&#x61;&#x72;&#x67;&#x65;&#x74;&#x25;&#x32;&#x30;&#x56;&#x61;&#x6C;&#x69;&#x64;&#x61;&#x74;&#x69;&#x6F;&#x6E;&#x25;&#x32;&#x30;&#x50;&#x6C;&#x61;&#x74;&#x66;&#x6F;&#x72;&#x6D;&#x25;&#x32;&#x30;&#x2D;&#x25;&#x32;&#x30;&#x68;&#x65;&#x6C;&#x70;&#x25;&#x32;&#x30;&#x72;&#x65;&#x71;&#x75;&#x65;&#x73;&#x74;">support<span class="fa fa-at"></span>targetvalidation.org</a></li>'
                        // +              '<li><a href="/documentation/components">Docs</a></li>' // not ready yet
                        +         '</ul>'
                        +     '</li>'

                        +     '<li><a href="/documentation/api">API</a></li>' // must force target to link outside of Angular routing
                        +     '<li><a href="{{dumps_link}}">Downloads</a></li>'
                        +     '<li><a href="//blog.opentargets.org/">Blog</a></li>'
                        //+     '<li><a href="/documentation/components">Docs</a></li>'
                        + '</ul>',*/

            template : '<ul class="masthead-navigation">'
                        +    '<li ng-repeat="item in nav" ng-if="item.label">'

                        +        '<div ng-if="item.menu==undefined">'
                        +             '<a href="{{item.href}}">{{item.label}}</a>'
                        +        '</div>'

                        +        '<div uib-dropdown on-toggle="toggled(open)" ng-if="item.menu!=undefined">'
                        +             '<a href uib-dropdown-toggle>{{item.label}} <span class="fa fa-angle-down"></span></a>'
                        +             '<ul class="uib-dropdown-menu" uib-dropdown-menu>'
                        +                  '<li ng-repeat="subitem in item.menu"><a href="{{subitem.href}}">{{subitem.label}}</a></li>'
                        +             '</ul>'
                        +        '</div>'

                        +    '</li>'
                        +'</ul>',
            link: function(scope, element, attrs) {
                scope.dumps_link = cttvConfig.dumps_link;
                scope.nav = cttvConfig.mastheadNavigationMenu;

                scope.toggled = function(open) {
                    //$log.log('Dropdown is now: ', open);
                };

                /* this must be defined here I suppose; some bootstrap thingy that's called automatically */
                scope.toggleDropdown = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    //scope.status.isopen = !scope.status.isopen;
                };

            }
        };
    }])
