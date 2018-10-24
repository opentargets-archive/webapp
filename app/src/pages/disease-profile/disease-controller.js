angular.module('otControllers')

    /*
     * DiseaseController
     * Controller for the disease page
     * It loads general information about a given disease
     */
    .controller('DiseaseController', ['$scope', '$location', 'otApi', 'otUtils', 'otConfig', 'otLocationState', '$anchorScroll', '$timeout', function ($scope, $location, otApi, otUtils, otConfig, otLocationState, $anchorScroll, $timeout) {
        'use strict';

        otUtils.clearErrors();

        var efo_code = $location.url().split('/')[2];
        $scope.diseaseId = efo_code;

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

        otApi.getDisease({
            method: 'GET',
            params: {
                code: efo_code
            }
            // TODO: Ideally we should be using this,
            // but the response for unknown diseases is currently "null"
            // https://github.com/opentargets/rest_api/issues/126
            // error: function() {
            //     $scope.notFound = true;
            // }
        })
            .then(function (resp) {
                var data = resp.body;
                if (!data) {
                    $scope.notFound = true;
                } else {
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
                        $scope.sections[t].currentVisibility = $scope.sections[t].visible;
                    }
                    render(otLocationState.getState(), otLocationState.getOldState());
                }
            });

    }]);
