angular.module('otControllers')

/**
* TargetController
* Controller for the target page
* It loads information about a given target
*/
    .controller('TargetController', ['$scope', '$location', 'otAPIservice', 'otUtils', 'otConfig', 'otTEPs', function ($scope, $location, otAPIservice, otUtils, otConfig, otTEPs) {
        'use strict';

        otUtils.clearErrors();

        $scope.targetId = $location.url().split('/')[2];

        otAPIservice.getTarget({
            method: 'GET',
            params: {
                target_id: $scope.targetId
            }
        })
            .then(
                // success
                function (resp) {
                    resp = JSON.parse(resp.text);
                    $scope.target = resp;
                    $scope.target.label = resp.approved_name || resp.ensembl_external_name;
                    $scope.target.symbol = resp.approved_symbol || resp.ensembl_external_name;
                    $scope.target.id = resp.approved_id || resp.ensembl_gene_id;
                    $scope.target.name = resp.approved_name || resp.ensembl_description;
                    $scope.target.title = (resp.approved_symbol || resp.ensembl_external_name).split(' ').join('_');
                    $scope.target.description = resp.uniprot_function[0];

                    // Check if the target is a TEP (Target Enabling Package)
                    if (otTEPs[$scope.targetId]) {
                        $scope.target.tep = otTEPs[$scope.targetId].symbol;
                    }

                    // Synonyms
                    var syns = {};
                    var synonyms = resp.symbol_synonyms;
                    if (synonyms !== undefined) {
                        for (var i = 0; i < synonyms.length; i++) {
                            syns[synonyms[i]] = 1;
                        }
                    }
                    var prev_symbols = resp.previous_symbols;
                    if (prev_symbols !== undefined) {
                        for (var j = 0; j < prev_symbols.length; j++) {
                            syns[prev_symbols[j]] = 1;
                        }
                    }
                    var name_synonyms = resp.name_synonyms;
                    if (name_synonyms !== undefined) {
                        for (var k = 0; k < name_synonyms.length; k++) {
                            syns[name_synonyms[k]] = 1;
                        }
                    }
                    $scope.synonyms = _.keys(syns);

                    // Uniprot
                    // TODO: Probably not being used... make sure & clean up
                    $scope.uniprot = {
                        id: resp.uniprot_id,
                        subunits: resp.uniprot_subunit,
                        locations: resp.uniprot_subcellular_location,
                        accessions: resp.uniprot_accessions,
                        keywords: resp.uniprot_keywords
                    };

                    // Extra sections -- plugins
                    $scope.sections = otConfig.targetSections;
                    // Set default visibility values
                    for (var t = 0; t < $scope.sections.length; t++) {
                        $scope.sections[t].defaultVisibility = $scope.sections[t].visible || false;
                        $scope.sections[t].currentVisibility = $scope.sections[t].visible || false;
                    }
                },
                // error handler
                otAPIservice.defaultErrorHandler
            );
    }]);
