/* Bubbles directive for associations */
angular.module('otDirectives')

    .directive('otTargetAssociationsBubbles2', ['otApi', 'otUtils', '$analytics', '$q', function (otApi, otUtils, $analytics, $q) {
        'use strict';

        var whoiam = 'bubbles';
        var bottomMargin = 220;

        return {
            restrict: 'E',
            require: '?^resize',
            scope: {
                facets: '=',
                target: '@',
                active: '@'
            },
            templateUrl: 'src/components/target-associations/target-associations-bubbles.html',
            link: function (scope, elem, attrs, resizeCtrl) {
                var legendDiv = elem.children().eq(0).children().eq(0)[0];
                var bubblesContainer = document.createElement('div');
                bubblesContainer.id = 'cttvBubblesView';
                scope.element = 'cttvBubblesView';
                elem.children().eq(0)[0].insertBefore(bubblesContainer, legendDiv);

                var bView;

                // Change of dims
                // scope.$watch(function () { if (resizeCtrl) { return resizeCtrl.dims(); } }, function (val) {
                //     if (bView) {
                //         bView.diameter(val.height - bottomMargin);
                //     }
                // }, true);

                // Change of target or facets
                scope.$watchGroup(['target', 'facets', 'active'], function (vals) {
                    var target = vals[0];
                    var facets = vals[1];

                    if (scope.active !== whoiam) {
                        return;
                    }
                    var opts = {
                        target: target,
                        outputstructure: 'flat',
                        size: 1000,
                        direct: true,
                        facets: false
                    };
                    opts = otApi.addFacetsOptions(facets, opts);
                    var queryObject = {
                        method: 'GET',
                        params: opts
                    };

                    var promise = otApi.getAssociations(queryObject)
                        .then (function (resp) {
                            console.log(resp);
                            return $q(function (resolve) {
                                resolve(otApi.flat2tree(resp.body));
                            })
                        });
                    if (bView) {
                        // bView.therapeuticAreas(opts.therapeutic_area);
                        // bView.update(promise);
                    } else {
                        setView();
                        bView.data(promise);
                        // bView.therapeuticAreas(opts.therapeutic_area);
                        bView(bubblesContainer);
                    }
                });

                function setView () { // data is a promise
                    // Fire a target associations tree event for piwik to track
                    $analytics.eventTrack('targetAssociationsBubbles', {'category': 'association', 'label': 'bubbles'});

                    // var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
                    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                    // Element Coord
                    var elemOffsetTop = elem[0].parentNode.offsetTop;

                    var diameter = viewportH - elemOffsetTop - bottomMargin;

                    var colorScale = otUtils.colorScales.BLUE_0_1; // blue orig

                    bView = targetAssociationsBubbles()
                        // .target("ENSG00000157764")
                        // .target(scope.target)
                        .diameter(diameter);
                        // .linkPrefix('')
                        // .showAll(true)
                        // .colors(otUtils.colorScales.BLUE_0_1.range())
                        // // .colors(['#e7e1ef', '#dd1c77'])
                        // .useFullPath(otUtils.browser.name !== 'IE')
                        // .tooltipsOnTA(true)
                        // .showMenu(false);


                    // Setting up legend
                    scope.legendText = 'Score';
                    scope.colors = [];
                    for (var i = 0; i <= 100; i += 25) {
                        var j = i / 100;
                        // scope.labs.push(j);
                        scope.colors.push({color: colorScale(j), label: j});
                    }
                    scope.legendData = [
                        // {label:"Therapeutic Area", class:"no-data"}
                    ];
                }

                // if (otUtils.browser.name !== 'IE') {
                //     scope.toExport = function () {
                //         var svg = decorateSVG(elem.children().eq(0)[0].querySelector('svg'));
                //         return svg;
                //     };
                // }
            }
        };
    }]);
