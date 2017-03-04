/* Add to the cttv controllers module */
angular.module('cttvControllers')

    .controller("SummaryCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', '$q', 'cttvConfig', 'cttvUtils', function ($scope, $location, $log, cttvAPIservice, $q, cttvConfig, cttvUtils) {
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
            return cttvAPIservice.getTarget(queryObject)
                .then (function (r) {
                    return r.body.data;
                });
        }

        function getTargetsEnrichment(targets) {
            var queryObject = {
                method: 'GET',
                trackCall: true,
                params: {
                    "target": targets,
                    "pvalue": 1,
                    "size": 10000
                }
            };
            return cttvAPIservice.getTargetsEnrichment(queryObject)
                .then(function (resp) {
                    return resp.body.data;
                })
        }

        // Currently not used -- we are using the /private/enrichment/targets endpoint instead
        // of collecting all the associations
        function getAssociations(targets) {
            var associationsPromises = [];
            var step = 10000;
            // 1st get the size
            var queryObjectForSize = {
                method: 'POST',
                trackCall: true,
                params: {
                    "target": targets,
                    "facets": "false",
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
                                "facets": "true",
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
                            return combined;
                        });
                });

        }

        // Recognised entities:
        // targets / target
        if (!angular.isArray(search.target)) {
            // search.target = expandTargetIds(search.target);
            search.target = cttvUtils.expandTargetIds(search.target.split(','));
        }
        if (search.target) {
            if (angular.isArray(search.target)) {
                // Multiple targets
                // $q.all([getTargetsInfo(search.target), getAssociations(search.target)])
                $q.all([getTargetsInfo(search.target), getTargetsEnrichment(search.target)])
                    .then (function (resps) {
                        $scope.targets = resps[0];
                        $scope.associations = resps[1];
                    });
                // $scope.targets = search.target;

                // Set the plugins -- plugins
                $scope.sections = cttvConfig.summaryTargetList;

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
