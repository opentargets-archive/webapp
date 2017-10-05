/**
 * Animal model plugin
 */
angular.module('otPlugins')
    .directive('otAnimalModel', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/animal-model/animal-model.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'       // optional external object for communication
            },
            link: function (scope) {
                scope.ext = scope.ext || {};    // object to communicate
                scope.sources = otConfig.evidence_sources.animal_model.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; });
            }
        };
    }]);
