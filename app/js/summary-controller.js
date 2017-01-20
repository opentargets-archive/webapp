/* Add to the cttv controllers module */
angular.module('cttvControllers')

    .controller("SummaryCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', '$q', function ($scope, $location, $log, cttvAPIservice, $q) {
        'use strict';

        // Parse the $location search object to determine which entities we have.
        var search = $location.search();

        // Associations + profiles -- fetching general data (shows page spinner)
        function getTargetsInfo(targets) {
            var queryObject = {
                method: 'POST',
                trackCall: true,
                params: {
                    "id": targets,
                    "size": targets.length,
                    "fields": ['ensembl_gene_id', 'drugs', 'approved_symbol', 'reactome', 'uniprot_id'],
                }
            };
            return cttvAPIservice.getTarget(queryObject);
        }

        function getAssociations(targets) {
            var associationsPromises = [];
            var step = 10000;
            // 1st get the size
            var queryObjectForSize = {
                method: 'POST',
                trackCall: true,
                params: {
                    "target": targets,
                    "facets": false,
                    "size": 0,
                    "fields": "total"
                }
            };
            return cttvAPIservice.getAssociations(queryObjectForSize)
                .then(function (resp) {
                    for (var i = 0; i < resp.body.total; i += step) {
                        // Call to the api with the targets
                        var queryObject = {
                            method: 'POST',
                            trackCall: true,
                            params: {
                                "target": targets,
                                "facets": true,
                                "from": i,
                                // "scorevalue_min": 1,
                                // 'targets_enrichment': "simple",
                                "size": step
                            }
                        };
                        if (!i) {
                            queryObject.params.targets_enrichment = 'simple';
                        }
                        associationsPromises.push(cttvAPIservice.getAssociations(queryObject));
                    }

                    return $q.all(associationsPromises)
                        .then(function (resps) {
                            // facets are the same for all of them...
                            var combined = {
                                facets: resps[0].body.facets,
                                therapeutic_areas: resps[0].body.therapeutic_areas,
                                enrichment: resps[0].body.disease_enrichment
                            };
                            var all = [];
                            for (var i = 0; i < resps.length; i++) {
                                all = _.concat(all, resps[i].body.data);
                            }
                            combined.data = all;

                            // Get all the disease Ids:
                            // var diseaseIds = [];
                            // for (var j = 0; j < scope.associations.data.length; j++) {
                            //     var assoc = scope.associations.data[j];
                            //     diseaseIds.push(assoc.disease.id);
                            // }
                            // $log.log(diseaseIds);
                            // var queryObjectMultiSearch = {
                            //     method: 'POST',
                            //     trackCall: true,
                            //     params: {
                            //         // q: diseaseIds.slice(0, 5),
                            //         q: diseaseIds,
                            //         filter: "disease",
                            //         fields: ["association_counts"]
                            //     }
                            // };
                            // cttvAPIservice.getMultiSearch(queryObjectMultiSearch)
                            //     .then(function (resp) {
                            //         $log.log(resp);
                            //     });

                            return combined;
                        });
                });

        }

        // Recognised entities:
        // targets / target
        if (search.target) {
            if (angular.isArray(search.target)) {
                // Multiple targets
                getAssociations(search.target)
                    .then(function (combined) {
                        $scope.associations = combined;
                    });

                getTargetsInfo(search.target)
                    .then(function (resp) {
                        $scope.targets = resp.body.data;
                    });
                // $scope.targets = search.target;

                // Interactions viewer plugin
                $scope.interactionsViewerPlugin = {
                    name: "interactionsViewer",
                    element: "multiple-targets-interactions-summary",
                    dependencies: {
                        "build/interactionsViewer.min.js": {
                            "format": "global"
                        },
                        "build/interactionsViewer.css": {
                            "loader": "css"
                        }
                    }
                };
                // $scope.interactionsSummaryPlugin = "multiple-targets-interactions-summary";

            } else {
                $scope.target = search.target;
            }
        }

        // diseases / disease
        if (search.disease) {
            if (angular.isArray(search.disease)) {
                $scope.diseases = search.disease;
            } else {
                $scope.disease = search.disease;
            }
        }

        // pathway
        if (search.pathway) {
            $scope.pathway = search.pathway;
            if (search["pathway-target"]) {
                if (!angular.isArray(search["pathway-target"])) {
                    $scope.pathwayTargets = [search["pathway-target"]];
                } else {
                    $scope.pathwayTargets = search["pathway-target"];
                }
            }
        }

        // drugs / drug
        $log.log("search...");
        $log.log(search);
        if (search.drug) {
            if (angular.isArray(search.drug)) {
                $scope.drugs = search.drug;
            } else {
                $scope.drug = search.drug;
            }
        }

        // TODO: Other combinations?
        // TODO: What about target lists or any other list?
        // For now we can treat a target list as a list of targets and we deal with that in the search page
    }]);
