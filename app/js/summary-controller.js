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
                    "fields": ['ensembl_gene_id', 'drugs', 'approved_symbol', 'reactome', 'uniprot_id'],
                }
            };
            return cttvAPIservice.getTarget(queryObject);
        }

        function getAssociations(targets) {
            var associationsPromises = [];
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
                    for (var i = 0; i < resp.body.total; i += 1000) {
                        // Call to the api with the targets
                        var queryObject = {
                            method: 'POST',
                            trackCall: true,
                            params: {
                                "target": targets,
                                "facets": true,
                                "from": i,
                                "size": 1000
                            }
                        };
                        associationsPromises.push(cttvAPIservice.getAssociations(queryObject));
                    }

                    return $q.all(associationsPromises)
                        .then(function (resps) {
                            // facets are the same for all of them...
                            var combined = {
                                facets: resps[0].body.facets,
                                therapeutic_areas: resps[0].body.therapeutic_areas
                            };
                            var all = [];
                            for (var i = 0; i < resps.length; i++) {
                                all = _.concat(all, resps[i].body.data);
                            }
                            combined.data = all;
                            return combined;
                        });
                });

        }

        // Recognised entities:
        // targets / target
        if (search.target) {
            if (angular.isArray(search.target)) {
                getAssociations(search.target)
                    .then (function (combined) {
                        $log.log("associations response for a list of targets...");
                        $log.log(search.target);
                        $log.log(combined);
                        $scope.associations = combined;
                    });

                getTargetsInfo(search.target)
                    .then(function (resp) {
                        $log.log("resp for targets...");
                        $log.log(search.target);
                        $log.log(resp);
                        $scope.targets = resp.body.data;
                    });
                // $scope.targets = search.target;

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
