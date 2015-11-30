
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
                    //gB.rest().proxyUrl("/api/latest/ensembl");
                    gB.rest().proxyUrl("/proxy/rest.ensembl.org");
                    var theme = targetGenomeBrowser()
                        .efo(efo);
                    theme(gB, cttvAPIservice.getSelf(), document.getElementById("cttvTargetGenomeBrowser"));
                });
            }
        };
    }])

    .directive('cttvTargetGeneTree', [function () {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                var w = 1140; // !!
                scope.$watch (function () { return attrs.target; }, function (target) {
                    if (target === "") {
                        return;
                    }
                    var newDiv = document.createElement("div");
                    newDiv.id = "cttvTargetGeneTree";
                    elem[0].appendChild(newDiv);

                    var gt = targetGeneTree()
                        .id(target)
                        .width(1100)
                        .proxy("/proxy/rest.ensembl.org");
                    gt(newDiv);
                });
            }
        };
    }])

    .directive('reactomePathwayViewer', [function () {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {

                var w = 900;
                var h = 500;
                var currentPathwayId;
                var count = 0;
                // We need to wait until reactome seed is loaded
                var centinel = setInterval (function () {
                    count++;
                    if (count > 10) {
                        clearInterval(centinel);
                    }
                    if (Reactome) {
                        clearInterval(centinel);
                        console.log(Reactome);

                        var newDiv = document.createElement("div");
                        newDiv.id = "pathwayDiagramContainer";
                        newDiv.className += " pwp-DiagramCanvas";
                        elem[0].appendChild(newDiv);

                        var pathwayDiagram;

                        scope.$watch (function () { return attrs.pathway; }, function () {
                            var pathway = attrs.pathway;
                            //var subpathway = attrs.subpathway;
                            var target = attrs.target;
                            if (pathway === "") {
                                return;
                            }
                            if (!pathwayDiagram) {
                                pathwayDiagram = Reactome.Diagram.create ({
                                    "proxyPrefix" : "/proxy/www.reactome.org",
                                    "placeHolder": "pathwayDiagramContainer",
                                    "width": 1100,
                                    "height": 700,
                                });
                                pathwayDiagram.onDiagramLoaded(function (pathwayId) {
                                    pathwayDiagram.flagItems(target);
                                });
                            }
                            if (pathway !== currentPathwayId) {
                                currentPathwayId = pathway;
                                pathwayDiagram.loadDiagram(pathway);
                            }
                        });
                    }
                },500);
            }
        };
    }])

    /*
    *
    */
    .directive('ebiExpressionAtlasBaselineSummary', ['cttvAPIservice', function (cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                scope.$watch(function () { return attrs.target; }, function (target) {
                    if (target === "") {
                        return;
                    }
                    var newDiv = document.createElement("div");
                    newDiv.id = "cttvExpressionAtlas";
                    newDiv.className = "accordionCell";
                    elem[0].appendChild(newDiv);

                    // cttvAPIservice.getToken().then(function (resp) {
                    //     console.warn(resp.body);
                    //     var token = resp.body.token;
                    // var instance = new Biojs.AtlasHeatmap ({
                    //     gxaBaseUrl: '/api/latest/proxy/generic/',
                    //     //gxaBaseUrl : '/gxa',
                    //     params:'geneQuery=' + target + "&species=homo%20sapiens",
                    //     isMultiExperiment: true,
                    //     target : "cttvExpressionAtlas"
                    // });

                    // });

                    var atlasHeatmapBuilder = window.exposed;
                    atlasHeatmapBuilder({
                        proxyPrefix: "/proxy",
                        //gxaBaseUrl: '/proxy/www.ebi.ac.uk/gxa/',
                        params: 'geneQuery=' + target + "&species=homo%20sapiens",
                        isMultiExperiment: true,
                        target: "cttvExpressionAtlas"
                    });


                    // var instance = AtlasHeatmapModule.build ({
                    //     gxaBaseUrl: '/proxy/www.ebi.ac.uk/gxa',
                    //     //gxaBaseUrl : '/gxa',
                    //     params:'geneQuery=' + target + "&species=homo%20sapiens",
                    //     isMultiExperiment: true,
                    //     target : "cttvExpressionAtlas"
                    // });
                });
            },
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
            template: '<i class="fa fa-circle-o-notch fa-spin"></i>',
            //template: '<div class="fa-spin" style="width:30px; height: 30px;"><svg width="100%" height="100%" viewBox="0 70 140 70" preserveAspectRatio="xMaxYMax"><path fill="#666666" d="M70,10c33.1,0,60,26,60,60h10c0-39-31.3-70-70-70S0,31,0,70h10C10,36,36.9,10,70,10z"/></svg></div>',
            link: function(scope, elem, attrs){
                if(attrs.size){
                    elem.addClass("fa-"+attrs.size+"x");
                }
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
            template: '<div class="page-progress-spinner" ng-show="isloading"><span cttv-progress-spinner size=3 class="text-lowlight"></span></div>',
            scope: {
                size: '@'
            },
            link: function(scope, elem, attrs){
                scope.size = scope.size ? scope.size : '3';

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

        var colorScale = d3.scale.linear()
            .domain([1,3])
            .range(["#CBDCEA", "#005299"]); // blue orig

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
    .directive('cttvDefaultFacetContols', ['$log' , function ($log) {
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
            template: '<div cttv-default-facet-contols facet="facet"></div>'
                     +'<div ng-init="isCollapsed=true&&(!datatype.collection.isLastClicked())" ng-repeat="datatype in facet.filters">'
                     +'    <cttv-parent-checkbox-facet bucket="datatype" collapsed="isCollapsed" partial="{{partial}}"></cttv-parent-checkbox-facet>'
                     +'    <div collapse="isCollapsed" style="padding-left:20px">'
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


            template: '<div cttv-default-facet-contols facet="facet"></div>'
                     +'<div ng-init="isCollapsed=true&&(!pathway.collection.isLastClicked())" ng-repeat="pathway in facet.filters">' // TODO: try "isCollapsed=true&&(!facet.isLastClicked())"
                     +'    <cttv-parent-checkbox-facet bucket="pathway" collapsed="isCollapsed" partial="{{partial}}"></cttv-parent-checkbox-facet>'
                     +'    <div collapse="isCollapsed" style="padding-left:20px">'
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
            template: '<div>'
                     +'    <span class="fa fa-circle" style="position:absolute; top:-12px; right:-12px; color:#000; font-size:24px;"></span>'
                     +'    <span class="fa fa-times"  style="position:absolute; top:-8px; right:-8px; color:#FFF; font-size:16px"></span>'
                     +'</div>'
                     +'<div>Hello content</div>',
            link: function (scope, elem, attrs) {

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
