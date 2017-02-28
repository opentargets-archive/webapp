
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
                    // newDiv.className = "accordionCell";
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
    * size: size of the spinner icon; 18 is default
    * stroke: thickness of the "ring" default is 2
    */
    .directive('cttvProgressSpinner', [function(){
        'use strict';

        return {
            restrict: 'EA',
            template: '<span></span>',
            link: function(scope, elem, attrs){
                var size = attrs.size || 18;
                var stroke = attrs.stroke || 2;
                var sp = spinner()
                    .size(size)
                    .stroke(stroke);
                sp(elem[0]);
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
    .directive ('cttvMatrixLegend', ['$log', function ($log) {
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
        + '<div class="matrix-legend-info"><a ng-if="legendText!=undefined" href="/faq#score"><span class="fa fa-question-circle"></span><span class="matrix-legend-text">{{legendText}}</span></a></div>'
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
    }])


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
                                "method": "GET",
                                "params" : {
                                    gene: scope.target  // TODO: should be TARGET in API!!!
                                }
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
                                        // $log.log(i +" : "+ labelScale(i));
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
                    // $log.log("onresize( "+evt.target.innerWidth+" x "+evt.target.innerHeight+" )");
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
                    // $log.log("scope.ok()");
                    // $log.log(scope.onOk);
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
                    // $log.log(scope.scroll);
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
                if (scope.inFormat === 'canvas') {
                    scope.exportPNG = function () {
                        var canvas = scope.$parent.toExport();
                    }
                    return;
                }
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
                            // track in piwik
                            if (scope.track) {
                                $analytics.eventTrack('export', {"category":scope.track, "label": scope.currScale})
                            }

                            // TODO: Set max_size to 2100000
                            var pngExporter = tnt.utils.png()
                                .filename(scope.filename || "image.png")
                                .scale_factor(scope.currScale)
                                .stylesheets(['components-OpenTargetsWebapp.min.css'])
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


    .directive ('cttvBetaRibbon', ['$log', '$location', function ($log, $location) {
        'use strict';
        return {
            restrict: 'E',
            scope: {},
            template: '<div ng-show="display" id="cttv-beta-ribbon" class="cttv-beta-ribbon">{{host}}</div>',
            link: function (scope, el, attrs) {
                var host = $location.host();
                scope.host = host.split('.')[0];
                if (host === 'www.targetvalidation.org' || host === 'targetvalidation.org') {
                    scope.display = false;
                } else {
                    scope.display = true;
                }
            }
        }
    }])



    /*
     * The notifications bell thingy in the navigation bar
     */
    .directive('mastheadNotificationsMenu', [ function () {
        'use strict';

        return {
            restrict: 'EA',
            scope: {},

            template : ''
                        + '<div ng-cloak class="notification" ng-show="notificationsLeft" ng-controller="NotifyCtrl">'
                        + '     <div class="counter" ng-bind-html="notificationsLeft"></div>'
                        + '     <i ng-click="notify()" class="fa fa-bell" aria-hidden="true"></i>'
                        + '</div>',

            link: function(scope, element, attrs) {}
        };
    }])



    /*
     * Navigation menu with hamburger option
     */
    .directive('mastheadNavigationMenu', ['cttvConfig', '$log', function (cttvConfig, $log) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                isHamburger: '=?'     // show as hamburger [true | false]
            },

            template : ''
                        + '<ul class="masthead-navigation">'

                        + '    <!-- regular inline menu -->'
                        + '    <li ng-repeat="item in nav" ng-if="!isHamburger && item.label">'
                        + '        <div ng-if="item.menu==undefined">'
                        + '            <a href="{{item.href}}">{{item.label}}</a>'
                        + '        </div>'
                        + '        <div uib-dropdown on-toggle="toggled(open)" ng-if="item.menu!=undefined">'
                        + '             <a href uib-dropdown-toggle>{{item.label}} <span class="fa fa-angle-down"></span></a>'
                        + '             <ul class="uib-dropdown-menu" uib-dropdown-menu>'
                        + '                 <li ng-repeat="subitem in item.menu"><a ng-if="subitem.target" target={{subitem.target}} href="{{subitem.href}}">{{subitem.label}}</a><a ng-if="!subitem.target" href="{{subitem.href}}">{{subitem.label}}</a></li>'
                        + '             </ul>'
                        + '        </div>'
                        + '    </li>'

                        + '    <!-- hamburger menu -->'
                        + '    <li ng-if="isHamburger">'
                        + '        <div uib-dropdown on-toggle="toggled(open)">'
                        + '             <a href uib-dropdown-toggle><span class="fa fa-bars fa-lg"></span></a>'
                        + '             <ul class="uib-dropdown-menu ot-dropdown-hamburger" uib-dropdown-menu>'
                        + '                 <li ng-repeat="item in navhmb" ng-if="item.label">'
                        + '                     <a href="{{item.href}}">{{item.label}}</a>'
                        + '                 </li>'
                        + '             </ul>'
                        + '        </div>'
                        + '    </li>'

                        +'</ul>',



            link: function(scope, element, attrs) {
                scope.dumps_link = cttvConfig.dumps_link;
                scope.nav = cttvConfig.mastheadNavigationMenu;
                scope.navhmb = [];

                // if the menu is a hamburger, we flatten the tree to display all in one list
                if(scope.isHamburger){

                    cttvConfig.mastheadNavigationMenu.forEach(function(i){
                        if(i.menu){
                            i.menu.forEach(function(j){
                                scope.navhmb.push( {label: i.label+": "+j.label, href: j.href} );
                            })
                        } else {
                            scope.navhmb.push(i);
                        }
                    })
                }

                // this can be triggered when toggling a dropdown
                /*scope.toggled = function(open) {
                    //$log.log('Dropdown is now: ', open);
                };*/

                // this must be defined here I suppose? some bootstrap thingy that's called automatically...
                // UPDATE: actually, it seems to work even without, so commenting out for now
                /*scope.toggleDropdown = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    //scope.status.isopen = !scope.status.isopen;
                };*/

            }
        };
    }])



    .directive('cttvFacebookFeed', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {},
            template :   '<div class="fb-page"'
                        +'    data-href="https://www.facebook.com/OpenTargets/"'
                        +'    data-tabs="timeline"'
                        +'    data-small-header="true"'
                        +'    data-adapt-container-width="true"'
                        +'    data-hide-cover="false"'
                        +'    data-show-facepile="false"'
                        +'    height="400">'
                        +'    <blockquote cite="https://www.facebook.com/OpenTargets/" class="fb-xfbml-parse-ignore"><a href="https://www.facebook.com/OpenTargets/">Open Targets</a></blockquote>'
                        +'</div>',
            link: function(scope, element, attrs) {
                try{
                    FB.XFBML.parse();
                }catch(e){
                    $log.warn("Cannot load Facebook feed");
                }
            }
        };
    }])



    .directive('cttvTwitterFeed', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {},
            template : '<a class="twitter-timeline"'
                        +'data-lang="en"'
                        +'data-theme="light"'
                        +'href="https://twitter.com/targetvalidate"'
                        //+'data-tweet-limit="3"'
                        +'data-height="400px"'
                        +'data-chrome="noborders noheader nofooter"'
                        +'>Tweets by targetvalidate</a>',
            link: function(scope, element, attrs) {
                try{
                    twttr.widgets.load();
                }catch(e){
                    $log.warn("Cannot load Twitter feed - possibly missing twttr.widgets script");
                }
            }
        };
    }])



    .directive('cttvBlogFeed', ['$log', '$http', function ($log, $http) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {},
            template :   '<div class="hp-blog-feed">'
                        //+'    <p>{{feed.title}}</p><p>{{feed.description}}</p>'
                        +'    <div class="hp-blog-feed-post" ng-repeat="post in feed.item">'
                        +'        <h5 class="hp-blog-feed-post-header"><a href="{{post.link}}">'
                        +'            {{post.title}}'
                        +'        </a></h5>'
                        +'        <div class="clearfix text-lowlight">'
                        +'            <p class="pull-left">By {{post.creator.toString()}}</p>'           // author
                        //+'            <p class="pull-right">{{post.pubDate.toLocaleDateString("en-GB")}}</p>' // date
                        +'            <p class="pull-right">{{post.pubDate.getDate()}} {{post.pubDate.getMonth() | monthToString}} {{post.pubDate.getFullYear()}}</p>' // date
                        +'        </div>'
                        +'        <div ng-bind-html="post.description | stripTags | ellipseText:130"></div>'                            // long description
                        +'        <div class="text-lowlight text-small" ng-if="post.category"><span class="fa fa-tags"></span> {{post.category.join(", ")}}</div>'   // tags
                        +'    </div>'
                        +'</div>',
            link: function(scope, element, attrs) {
                $http.get('/proxy/blog.opentargets.org/rss/')
                //$http.get('rss.xml')    // JUST FOR TESTING and DEVELOPING LOCALLY WITHOUT THE PROXY
                    .then(function successCallback(response) {

                        var x2js = new X2JS();
                        var feed = x2js.xml_str2json(response.data);
                        // $log.log(feed);

                        // The feed should be already ordered by date, but it seems sometimes it isn't,
                        // so for now we sort it; maybe in the future we won't need to... will ask Eliseo about blog pub dates
                        // 1. parse the pub dates to unix timestamp
                        feed.rss.channel.item.forEach(function(i){
                            i.pubDate = new Date(i.pubDate);
                        });
                        // 2. sort item array by timestamp
                        feed.rss.channel.item.sort(function (a, b) {
                            return b.pubDate.getTime() - a.pubDate.getTime();
                        });


                        scope.feed = feed.rss.channel;

                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        $log.log(response);
                    });

            }
        };
    }])



    /**
     * The searchbox with search suggestions
     */
    .directive('otSearchBox', [function () {
        'use strict';

        return {
            restrict: 'EA',
            scope: {},
            templateUrl : 'partials/search-box.html',
            link: function(scope, element, attrs) {

            }
        };
    }])



    /**
     * Directive for the footer
     * This is mostly so the footer loads like the other page content and not before it.
     */
    .directive('otFooter', [function () {
        'use strict';

        return {
            restrict: 'EA',
            scope: {},
            templateUrl : 'partials/footer.html',
            link: function(scope, element, attrs) {}
        };
    }])
