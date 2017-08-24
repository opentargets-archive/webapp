angular.module('cttvDirectives')

    .directive('pathwaySummary', ['$timeout', '$http', function ($timeout, $http) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'src/components/pathway-summary/pathway-summary.html',
            scope: {
                pathway: '=',
                targets: '='
            },
            link: function (scope) {
                scope.$watch('pathway', function () {
                    if (!scope.pathway) {
                        return;
                    }

                    // TODO: width should be dynamic
                    var w = 1140;
                    var h = 700;

                    // Ask for information of the pathway in reactome:
                    $http.get('/proxy/www.reactome.org/ContentService/data/query/' + scope.pathway + '/more')
                        .then(function (resp) {
                            scope.displayName = resp.data.displayName;
                            scope.description = resp.data.summation[0].text;
                        });

                    function loadPathway () {
                        var pId = scope.pathway;
                        var pathwayDiagram = Reactome.Diagram.create({
                            'proxyPrefix': '/proxy/www.reactome.org',
                            'placeHolder': 'pathwayDiagramContainer',
                            'width': w,
                            'height': h
                        });
                        scope.flagTarget = function (target) {
                            if (scope.flagged === target) {
                                scope.flagged = undefined;
                                pathwayDiagram.resetFlaggedItems();
                            } else {
                                scope.flagged = target;
                                pathwayDiagram.flagItems(target);
                            }
                        };

                        pathwayDiagram.onDiagramLoaded(function () {
                            if (scope.targets && scope.targets.length) {
                                var target = scope.targets[0];
                            // scope.flagTarget(target);
                            }
                        });
                        pathwayDiagram.loadDiagram(pId);
                    }

                    var count = 0;
                    // Wait until the reactome seed loads the library
                    $timeout(function () {
                        var centinel = setInterval(function () {
                            count++;
                            if (count > 10) {
                                clearInterval(centinel);
                            }
                            if (Reactome) {
                                clearInterval(centinel);
                                // $log.log(Reactome);

                                // var newDiv = document.getElementById("pathwayDiagramContainer");
                                // newDiv.id = "pathwayDiagramContainer";
                                // newDiv.className += " pwp-DiagramCanvas";
                                // el[0].appendChild(newDiv);
                                loadPathway();
                            }
                        }, 500); // Check reactome is loaded every 500 ms
                    }, 0);
                });
            }
        };
    }]);
