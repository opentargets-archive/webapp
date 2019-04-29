angular.module('otPlugins')
    .directive('otTargetPathways', ['$http', '$q', function ($http, $q) {
        'use strict';

        // Container for the spinner
        var spDiv;

        return {
            restrict: 'E',
            templateUrl: 'plugins/pathways/target-pathways.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element) {
                var w = scope.width - 30;
                var h = 700;
                var currentPathwayId;
                var pathwayDiagram;

                // Set the spinner
                spDiv = document.createElement('div');
                var sp = spinner()
                    .size(30)
                    .stroke(3);
                element[0].appendChild(spDiv);
                sp(spDiv);


                // Load all the pathways first:
                function loadPathways () {
                    var pathways = scope.target.reactome;
                    var reactomePathways = [];

                    // Get the new identifiers
                    var promises = [];

                    if (!pathways.length) {
                        scope.noPathways = true;
                    }

                    pathways.forEach(function (pathway) {
                        // new Reactome API
                        var p = $http.get('https://reactome.org/ContentService/data/query/' + pathway.id);
                        promises.push(p);
                    });
                    $q
                        .all(promises)
                        .then(function (vals) {
                            vals.forEach(function (val) {
                                if (val.data) {
                                    reactomePathways.push({
                                        'id': val.data.stId,
                                        'name': val.data.displayName
                                    });
                                }
                            });
                            // Remove the spinner
                            spDiv.parentNode.removeChild(spDiv);

                            scope.pathways = reactomePathways;
                            if (scope.pathways[0]) {
                                scope.setPathwayViewer(scope.pathways[0]);
                            }
                        });
                }

                scope.setPathwayViewer = function (pathway) {
                    var pId = pathway.id;
                    if (!pathwayDiagram) {
                        pathwayDiagram = Reactome.Diagram.create({
                            'proxyPrefix': 'https://www.reactome.org',
                            'placeHolder': 'pathwayDiagramContainer',
                            'width': w,
                            'height': h
                        });
                        pathwayDiagram.onDiagramLoaded(function (pathwayId) {
                            pathwayDiagram.flagItems(scope.target.symbol);
                        });
                    }
                    if (pId !== currentPathwayId) {
                        currentPathwayId = pId;
                        scope.pathway = pathway;
                        pathwayDiagram.loadDiagram(pId);
                    }
                };

                var count = 0;
                // Wait until the reactome seed loads the library
                var centinel = setInterval(function () {
                    count++;
                    if (count > 10) {
                        clearInterval(centinel);
                    }
                    if (Reactome) {
                        clearInterval(centinel);

                        var newDiv = document.createElement('div');
                        newDiv.id = 'pathwayDiagramContainer';
                        newDiv.className += ' pwp-DiagramCanvas';
                        element[0].appendChild(newDiv);

                        loadPathways();
                    }
                }, 500); // Check reactome is loaded every 500 ms
            }
        };
    }]);
