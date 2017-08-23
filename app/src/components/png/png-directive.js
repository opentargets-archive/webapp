
angular.module('cttvDirectives')
    .directive('png', ['$timeout', '$uibModal', '$analytics', function ($timeout, $uibModal, $analytics) {
        'use strict';

        return {
            restrict: 'AE',
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
    }]);
