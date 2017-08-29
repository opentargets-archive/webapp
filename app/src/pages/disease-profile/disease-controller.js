angular.module('otControllers')

    /*
     * DiseaseController
     * Controller for the disease page
     * It loads general information about a given disease
     */
    .controller('DiseaseController', ['$scope', '$location', 'otApi', 'otUtils', 'otConfig', function ($scope, $location, otApi, otUtils, otConfig) {
        'use strict';

        otUtils.clearErrors();

        var efo_code = $location.url().split('/')[2];
        otApi.getDisease({
            method: 'GET',
            params: {
                code: efo_code
            }
        })
            .then(function (resp) {
                var data = resp.body;
                var paths = [];
                for (var i = 0; i < data.path.length; i++) {
                    var path = [];
                    for (var j = 0; j < data.path[i].length; j++) {
                        path.push({
                            'label': data.path[i][j].label,
                            'efo': data.path[i][j].uri.split('/').pop()
                        });
                    }
                    paths.push(path);
                }

                if (data.efo_synonyms.length === 0) {
                    data.efo_synonyms.push(resp.label);
                }
                $scope.disease = {
                    'label': data.label,
                    'efo': efo_code,
                    'description': data.definition || resp.label,
                    'synonyms': _.uniq(data.efo_synonyms),
                    'paths': paths,
                    'children': data.children,
                    'title': data.label.split(' ').join('_'),
                    'phenotypes': data.phenotypes
                };

                // Extra sections -- plugins
                $scope.sections = otConfig.diseaseSections;
                for (var t = 0; t < $scope.sections.length; t++) {
                    $scope.sections[t].defaultVisibility = $scope.sections[t].visible;
                }
            });
    }]);
