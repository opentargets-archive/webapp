angular.module('otDirectives')
    .directive('otPng', ['$timeout', '$uibModal', '$analytics', function ($timeout, $uibModal, $analytics) {
        'use strict';

        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                filename: '@',
                track: '@'
            },
            replace: false,
            template: '<div ng-show="exportable" class="clearfix"><div class="pull-right"><a class="btn btn-default buttons-csv buttons-html5" ng-click="exportPNG()"><span class="fa fa-picture-o" title="Download as PNG"></span></a></div></div>',
            link: function (scope) {
                if (scope.inFormat === 'canvas') {
                    scope.exportPNG = function () {
                        scope.$parent.toExport();
                    };
                    return;
                }
                $timeout(function () {
                    scope.exportable = ((scope.$parent.toExport !== undefined) && (typeof scope.$parent.toExport === 'function'));
                }, 0);
                scope.currScale = 1;
                scope.exportPNG = function () {
                    var container = scope.$parent.toExport();
                    var subSvg = d3.select(container).select('svg');
                    var subCanvas = d3.select(container).select('canvas');
                    if (container.nodeName === 'CANVAS') {
                        var canvas = container;
                        var img = canvas.toDataURL('image/png');
                        var a = document.createElement('a');
                        a.download = scope.filename;
                        a.href = img;
                        document.body.appendChild(a);
                        a.click();
                    } else if (!subCanvas.empty() && !subSvg.empty()) {
                        // container has an svg and a canvas
                        var pngExporter = tnt.utils.png()
                            .filename(scope.filename || 'image.png')
                            .scale_factor(scope.currScale)
                            .stylesheets(['components-OpenTargetsWebapp.min.css'])
                            .callback(function (originalPng) {
                                var width = container.offsetWidth * scope.currScale;
                                var height = width;
                                var hasDrawnCanvas = false;
                                var hasDrawnSvg = false;

                                // construct combined canvas and context
                                function onBothLoad () {
                                    var combinedPng = combinedCanvas.toDataURL('image/png');
                                    var a = document.createElement('a');
                                    a.download = scope.filename || 'image.png';
                                    a.href = combinedPng;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }
                                function onLoadSvg () {
                                    originalImg.width = width;
                                    originalImg.height = height;
                                    context.drawImage(originalImg, 0, 0, width, height);
                                    hasDrawnSvg = true;

                                    if (hasDrawnCanvas && hasDrawnSvg) {
                                        onBothLoad();
                                    }
                                }
                                function onLoadCanvas () {
                                    canvasImg.width = width;
                                    canvasImg.height = height;
                                    context.drawImage(canvasImg, 0, 0, width, height);
                                    hasDrawnCanvas = true;

                                    if (hasDrawnCanvas && hasDrawnSvg) {
                                        onBothLoad();
                                    }
                                }

                                var combinedCanvas = document.createElement('canvas');
                                combinedCanvas.width = width;
                                combinedCanvas.height = height;
                                var context = combinedCanvas.getContext('2d');

                                var canvas = subCanvas.node();
                                var canvasPng = canvas.toDataURL('image/png');
                                var canvasImg = new Image();
                                canvasImg.onload = onLoadCanvas;
                                canvasImg.src = canvasPng;

                                var originalImg = new Image();
                                originalImg.onload = onLoadSvg;
                                originalImg.src = originalPng;
                            });

                        pngExporter(subSvg);
                    } else {
                        // We assume it is an SVG
                        var svg = container;

                        // Show a modal with the scale of the png
                        $uibModal.open({
                            animation: true,
                            // template: "<div class=modal-header>PNG scale factor</div><div class='modal-body modal-body-center'><span class=png-scale-factor-selection><input type=radio name=pngScale value=1 checked ng-model='$parent.currScale'> 1x</span><span class=png-scale-factor-selection><input type=radio name=pngScale value=2 ng-model='$parent.currScale'> 2x</span><span class=png-scale-factor-selection><input type=radio name=pngScale value=3 ng-model='$parent.currScale'> 3x</span></div><div class=modal-footer><button class='btn btn-primary' type=button ng-click='export(this)' onclick='angular.element(this).scope().$dismiss()'>OK</button></div>",
                            template: '<ot-modal header="Download as PNG" on-ok="export()" has-ok="true" ok-label="Download" has-cancel="true">'
                                          + '<div class="modal-body-center">'
                                              + '<p>Select scale factor for the image</p>'
                                              + '<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="1" ng-model="$parent.currScale"> 1x</span>'
                                              + '<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="2" ng-model="$parent.currScale"> 2x</span>'
                                              + '<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="3" ng-model="$parent.currScale"> 3x</span>'
                                          + '</div>'
                                      + '</ot-modal>',
                            size: 'sm',
                            scope: scope
                        });
                        scope.export = function () {
                            // track in piwik
                            if (scope.track) {
                                $analytics.eventTrack('export', {'category': scope.track, 'label': scope.currScale});
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
                                            // template: "<div class='modal-header'>Image too large</div><div class=modal-body>The image you are trying to export is too large. Reduce the number of elements and try again.</div><div class=modal-footer><button class='btn btn-primary' type=button onclick='angular.element(this).scope().$dismiss()'>OK</button></div>",
                                            template: '<ot-modal header=\'Image too large\' has-ok=\'true\'>The image you are trying to export is too large. Reduce the number of elements or scale factor and try again.</ot-modal>',
                                            size: 'sm'
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
