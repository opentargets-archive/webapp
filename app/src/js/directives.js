
/* Directives */
angular.module('cttvDirectives')


    .directive('logSession', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                cttvAPIservice.logSession();
            }
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
        var colorScale10 = cttvUtils.colorScales.BLUE_1_10;

        var labelScale = d3.scale.ordinal()
            .domain([1,2,3])
            .range(['Low', 'Medium', 'High']);

        var labelScale10 = function (v) {
            if (v < 4) {
                return 'Low';
            }
            if (v < 7) {
                return 'Medium';
            }
            return 'High';
        };

        var getColorStyleString = function(value, scale, label){
            var span='';

            if(value===0){
                span = '<span class=\'value-0\' title=\'Not expressed\'>'+value+'</span>';
            } else if(value>0){
                var c = scale(value);
                var l = label(value);
                span = '<span style=\'color: '+c+'; background: '+c+';\' title=\'Expression: '+l+'\'>'+value+'</span>';
            } else {
                span = '<span class=\'no-data\' title=\'No data\'></span>'; // quick hack: where there's no data, don't put anything so the sorting works better
            }


            return span;
        };

        var cols = [
            'Tissue',
            'Protein',
            'RNA',
            ''
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
                                'method': 'GET',
                                'params' : {
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
                                            row.push( getColorStyleString(data[tissue].protein.level, colorScale, labelScale) );
                                            row.push( getColorStyleString(data[tissue].rna.level, colorScale10, labelScale10) );
                                            row.push('');
                                            newData.push(row);

                                        }

                                        // -----------------------
                                        // Initialize table etc
                                        // -----------------------

                                        // table itself
                                        var table = elem.children().eq(0)[0];
                                        var dtable = $(table).dataTable(cttvUtils.setTableToolsParams({
                                            'data' : newData,
                                            'columns': (function(){
                                                var a=[];
                                                for(var i=0; i<cols.length; i++){
                                                    a.push({ 'title': '<div><span title=\''+cols[i]+'\'>'+cols[i]+'</span></div>' });
                                                }
                                                return a;
                                            })(),
                                            'columnDefs' : [
                                                { 'orderSequence': [ 'desc', 'asc'], 'targets': '_all' }
                                            ],
                                            'order' : [[0, 'asc']],
                                            'autoWidth': false,
                                            'ordering': true,
                                            'lengthMenu': [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
                                            'pageLength': 50
                                        }, scope.filename ));


                                        // legend stuff
                                        scope.colors = [];
                                        for(var i=1; i<=3; i++){
                                            scope.colors.push( {color:colorScale(i), label:labelScale(i)} );
                                        // $log.log(i +" : "+ labelScale(i));
                                        }

                                        scope.legendData = [
                                            {label:'No data', class:'no-data'},
                                            {label:'Not expressed', class:'value-0'}
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
            template: '<div style=\'width:100%; height:0; margin:0; padding:0; overflow:hidden; visibility:hidden; z-index:-1\'>'
                     +'    <iframe style=\'width:100%; height:0; border:0; visibility:visible; margin:0\' />'
                     //+"    <iframe style='width:0; height:100%; border:0; visibility:visible; margin:0' />"
                     +'</div>',

            link: function (scope, elem, attrs) {
                var iframe = elem[0].children[0].children[0].contentWindow || elem[0].children[0].children[0];

                iframe.onresize = function(evt){
                    // $log.log("onresize( "+evt.target.innerWidth+" x "+evt.target.innerHeight+" )");
                    if(scope.onresize){
                        scope.onresize({w:evt.target.innerWidth, h:evt.target.innerHeight});
                    }
                };
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
                    };
                    return;
                }
                $timeout(function () {
                    scope.exportable = ((scope.$parent.toExport !== undefined) && (typeof scope.$parent.toExport === 'function'));
                }, 0);
                scope.currScale = 1;
                scope.exportPNG = function () {
                    var container = scope.$parent.toExport();
                    if (container.nodeName === 'CANVAS') {
                        var canvas = container;
                        var img = canvas.toDataURL('image/png');
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
                            size: 'sm',
                            scope: scope
                        });
                        scope.export = function () {
                            // track in piwik
                            if (scope.track) {
                                $analytics.eventTrack('export', {'category':scope.track, 'label': scope.currScale});
                            }

                            // TODO: Set max_size to 2100000
                            var pngExporter = tnt.utils.png()
                                .filename(scope.filename || 'image.png')
                                .scale_factor(scope.currScale)
                                .stylesheets(['components-OpenTargetsWebapp.min.css'])
                                .limit({
                                    limit: 2100000,
                                    onError: function () {
                                        $uibModal.open({
                                            animation: true,
                                            //template: "<div class='modal-header'>Image too large</div><div class=modal-body>The image you are trying to export is too large. Reduce the number of elements and try again.</div><div class=modal-footer><button class='btn btn-primary' type=button onclick='angular.element(this).scope().$dismiss()'>OK</button></div>",
                                            template: '<cttv-modal header=\'Image too large\' has-ok=\'true\'>The image you are trying to export is too large. Reduce the number of elements or scale factor and try again.</cttv-modal>',
                                            size:'sm',
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



