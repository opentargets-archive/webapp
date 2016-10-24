angular.module('plugins')
    .directive('targetPathways', ['$log', '$http', '$q', function ($log, $http, $q) {
        'use strict';


        return {
            restrict: 'E',
            templateUrl: 'plugins/pathways.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                var w = scope.width - 30;
                var h = 700;
                var currentPathwayId;
                var pathwayDiagram;

                // Load all the pathways first:
                function loadPathways () {
                    var pathways = scope.target.reactome;
                    // $log.log(pathways);
                    var reactomePathways = [];

                    // Get the new identifiers
                    var promises = [];
                    var pathwayArr = [];
                    for (var i=0; i<pathways.length; i++) {
                    // for (var pathway in pathways) {
                        var pathway = pathways[i].id;
                        var p = $http.get("/proxy/www.reactome.org/ReactomeRESTfulAPI/RESTfulWS/queryById/DatabaseObject/" + pathway + "/stableIdentifier");
                        promises.push(p);
                        // pathwayArr.push(pathways[pathway]["pathway name"]);
                        pathwayArr.push(pathways[i].value["pathway name"]);
                    }
                    $q
                        .all(promises)
                        .then(function (vals) {
                            for (var i=0; i<vals.length; i++) {
                                var val = vals[i].data;
                                if (val) {
                                    var idRaw = val.split("\t")[1];
                                    var id = idRaw.split('.')[0];
                                    reactomePathways.push({
                                        "id": id,
                                        "name" : pathwayArr[i]
                                    });
                                }
                            }
                            scope.pathways = reactomePathways;
                            if (scope.pathways[0]) {
                                scope.setPathwayViewer(scope.pathways[0]);
                            }
                        });
                }

                scope.setPathwayViewer = function (pathway) {
                    var pId = pathway.id;
                    if (!pathwayDiagram) {
                        pathwayDiagram = Reactome.Diagram.create ({
                            "proxyPrefix" : "/proxy/www.reactome.org",
                            "placeHolder": "pathwayDiagramContainer",
                            "width": w,
                            "height": h,
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
                var centinel = setInterval (function () {
                    count++;
                    if (count > 10) {
                        clearInterval(centinel);
                    }
                    if (Reactome) {
                        clearInterval(centinel);
                        // $log.log(Reactome);

                        var newDiv = document.createElement("div");
                        newDiv.id = "pathwayDiagramContainer";
                        newDiv.className += " pwp-DiagramCanvas";
                        element[0].appendChild(newDiv);

                        loadPathways();
                    }
                }, 500); // Check reactome is loaded every 500 ms
            }
        };
    }]);
