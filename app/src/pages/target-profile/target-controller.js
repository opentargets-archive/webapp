angular.module('otControllers')

/**
* TargetController
* Controller for the target page
* It loads information about a given target
*/
    .controller('TargetController', ['$scope', '$location', 'otApi', 'otUtils', 'otConfig', 'otTeps', 'otDictionary', 'otLocationState', '$anchorScroll', '$timeout', '$http', function ($scope, $location, otApi, otUtils, otConfig, otTeps, otDictionary, otLocationState, $anchorScroll, $timeout, $http) {
        'use strict';

        otUtils.clearErrors();

        $scope.targetId = $location.url().split('/')[2];

        var render = function (new_state) {
            var view = new_state.view || {};
            var sec = view.sec;
            if (sec && sec[0]) {
                var i = $scope.sections.findIndex(function (s) {
                    return s.config.id === sec[0];
                });
                if (i >= 0) {
                    $scope.sections[i].defaultVisibility = true;
                    $scope.sections[i].currentVisibility = true;

                    // wrapping the call in a timeout allows for accordion elements to have rendered; as opposed to $anchorScroll($scope.sections[i].name);
                    $timeout(function () {
                        $anchorScroll($scope.sections[i].config.id);
                    }, 0);
                }
            }
        };

        otApi.getTarget({
            method: 'GET',
            params: {
                target_id: $scope.targetId
            },
            error: function () {
                $scope.notFound = true;
            }
        })
            .then(
                // success
                function (resp) {
                    var target = resp.body;
                    $scope.target = target;
                    $scope.target.label = target.approved_name || target.ensembl_external_name;
                    $scope.target.symbol = target.approved_symbol || target.ensembl_external_name;
                    $scope.target.id = target.approved_id || target.ensembl_gene_id;
                    $scope.target.name = target.approved_name || target.ensembl_description;
                    $scope.target.title = (target.approved_symbol || target.ensembl_external_name).split(' ').join('_');
                    // $scope.target.description = target.uniprot_function[0];

                    // try to replace the pubmed ids with links
                    function makePmidLink (match, offset, string) {
                        var id = match.substring(7);
                        return 'PMID:<a href="https://europepmc.org/abstract/med/' + id + '" target="_blank">' + id + '</a>';
                    }
                    if (target.uniprot_function && target.uniprot_function[0]) {
                        $scope.target.description = target.uniprot_function[0].replace(/Pubmed:\d+/ig, makePmidLink);
                    } else {
                        $scope.target.description = otDictionary.NO_DESCRIPTION;
                    }


                    // Check if the target is a TEP (Target Enabling Package)
                    if (otTeps[$scope.targetId]) {
                        $scope.target.tep = otTeps[$scope.targetId];
                    }

                    // Synonyms
                    var syns = {};
                    var synonyms = target.symbol_synonyms;
                    if (synonyms !== undefined) {
                        for (var i = 0; i < synonyms.length; i++) {
                            syns[synonyms[i]] = 1;
                        }
                    }
                    var prev_symbols = target.previous_symbols;
                    if (prev_symbols !== undefined) {
                        for (var j = 0; j < prev_symbols.length; j++) {
                            syns[prev_symbols[j]] = 1;
                        }
                    }
                    var name_synonyms = target.name_synonyms;
                    if (name_synonyms !== undefined) {
                        for (var k = 0; k < name_synonyms.length; k++) {
                            syns[name_synonyms[k]] = 1;
                        }
                    }
                    $scope.synonyms = _.keys(syns);

                    // Uniprot
                    // TODO: Probably not being used... make sure & clean up
                    $scope.uniprot = {
                        id: target.uniprot_id,
                        subunits: target.uniprot_subunit,
                        locations: target.uniprot_subcellular_location,
                        keywords: target.uniprot_keywords
                    };

                    // Extra sections -- plugins
                    $scope.sections = otConfig.targetSections;
                    // Set default visibility values
                    for (var t = 0; t < $scope.sections.length; t++) {
                        $scope.sections[t].defaultVisibility = $scope.sections[t].visible || false;
                        $scope.sections[t].currentVisibility = $scope.sections[t].visible || false;
                        $scope.sections[t].ext = {};
                    }
                    render(otLocationState.getState(), otLocationState.getOldState());

                    // now check for CRISPR score data
                    return $http.get('https://api.cellmodelpassports.sanger.ac.uk/score_search/' + $scope.target.symbol);
                }
            )
            .then(
                function (resp) {
                    try {
                        if (resp.data.genes && resp.data.genes.count > 0
                            && resp.data.genes.hits[0].symbol.toUpperCase() === $scope.target.symbol.toUpperCase()) {
                            $scope.target.crispr = resp.data.genes.hits[0].id;
                        }
                    } catch (e) {
                        // something went wrong with the CRISPR API response
                    }
                }
            );
    }]);
