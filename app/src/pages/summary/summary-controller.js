/* Add to the cttv controllers module */
angular.module('otControllers')

    .controller('SummaryCtrl', ['$scope', '$location', 'otApi', '$q', 'otConfig', 'otUtils', 'otLoadedLists', function ($scope, $location, otApi, $q, otConfig, otUtils, otLoadedLists) {
        'use strict';

        // Parse the $location search object to determine which entities we have.
        var search = $location.search();

        // Associations + profiles -- fetching general data (shows page spinner)
        function getTargetsInfo (targets) {
            var queryObject = {
                method: 'POST',
                trackCall: true,
                params: {
                    'id': targets,
                    'size': targets.length,
                    'fields': ['ensembl_gene_id', 'drugs', 'approved_symbol', 'reactome', 'uniprot_id']
                }
            };
            return otApi.getTarget(queryObject)
                .then(function (r) {
                    return r.body.data;
                });
        }

        function getTargetsEnrichment (targets) {
            var queryObject = {
                method: 'POST',
                trackCall: true,
                params: {
                    'target': targets,
                    'pvalue': 1,
                    'from': 0,
                    'size': 10000
                }
            };
            return otApi.getTargetsEnrichment(queryObject)
                .then(function (resp) {
                    return resp.body.data;
                });
        }

        // TODO: will we need this in the future?
        // Currently not used -- we are using the /private/enrichment/targets endpoint instead
        // of collecting all the associations
        /* function getAssociations(targets) {
            var associationsPromises = [];
            var step = 10000;
            // 1st get the size
            var queryObjectForSize = {
                method: 'POST',
                trackCall: true,
                params: {
                    'target': targets,
                    'facets': 'false',
                    'size': 0,
                    'fields': 'total'
                }
            };

            return otApi.getAssociations(queryObjectForSize)
                .then(function (resp) {
                    for (var i = 0; i < resp.body.total; i += step) {
                        // Call to the api with the targets
                        var queryObject = {
                            method: 'POST',
                            trackCall: true,
                            params: {
                                'target': targets,
                                'facets': 'true',
                                'from': i,
                                'size': step
                            }
                        };
                        if (!i) {
                            queryObject.params.targets_enrichment = 'simple';
                        }
                        associationsPromises.push(otApi.getAssociations(queryObject));
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

        } */

        // Recognised entities:

        // target-list (=> expand to targets)
        if (search['target-list']) {
            var targetList = otLoadedLists.get(search['target-list']);
            var targets = [];
            for (var i = 0; i < targetList.list.length; i++) {
                var target = targetList.list[i];
                if (target.selected) {
                    targets.push(target.result.id);
                }
            }
            // a target list overwrite any other target in the url
            // search.targets = targets;

            // TODO: Unnecessary, we compress to decompress in the next step
            search.targets = otUtils.compressTargetIds(targets);
        }

        // multiple targets
        if (search.targets) {
            search.targets = otUtils.expandTargetIds(search.targets.split(','));
            $q.all([getTargetsInfo(search.targets), getTargetsEnrichment(search.targets)])
                .then(function (resps) {
                    $scope.targets = resps[0];
                    $scope.associations = resps[1];
                });

            // Set the plugins -- plugins
            $scope.sections = otConfig.summaryTargetList;
        }

        // 1 target
        if (search.target) {
            // Only one target
            $scope.target = search.target;
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
            if (search['pathway-target']) {
                if (!angular.isArray(search['pathway-target'])) {
                    $scope.pathwayTargets = [search['pathway-target']];
                } else {
                    $scope.pathwayTargets = search['pathway-target'];
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
