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
                console.log('LOADING PATHWAYS INFORMATION...');
                var w = scope.width;
                var h = 700;
                var currentPathwayId;
                var pathwayDiagram;

                // Load all the pathways first:
                function loadPathways () {
                    var pathways = scope.target.reactome;
                    var reactomePathways = [];

                    // Get the new identifiers
                    var promises = [];
                    var pathwayArr = [];
                    for (var pathway in pathways) {
                        var p = $http.get("/proxy/www.reactome.org/ReactomeRESTfulAPI/RESTfulWS/queryById/DatabaseObject/" + pathway + "/stableIdentifier");
                        promises.push(p);
                        pathwayArr.push(pathways[pathway]["pathway name"]);
                    }
                    $q
                        .all(promises)
                        .then(function (vals) {
                            console.log(vals);
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
                    console.log("SET PATHWAY VIEWER");
                    var pId = pathway.id;
                    if (!pathwayDiagram) {
                        console.log("CREATE A REACTOME DIAGRAM");
                        pathwayDiagram = Reactome.Diagram.create ({
                            "proxyPrefix" : "/proxy/www.reactome.org",
                            "placeHolder": "pathwayDiagramContainer",
                            "width": w,
                            "height": h,
                        });
                        console.log("Ok");
                        pathwayDiagram.onDiagramLoaded(function (pathwayId) {
                            console.log("Flagging items");
                            pathwayDiagram.flagItems(scope.target.symbol);
                        });
                    }
                    if (pId !== currentPathwayId) {
                        console.log("LOADING A DIAGRAM");
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
                        console.log(Reactome);

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
