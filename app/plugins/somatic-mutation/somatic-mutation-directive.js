/**
 * Somatic mutations plugin
 */
angular.module('otPlugins')
    .directive('otSomaticMutation', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/somatic-mutation/somatic-mutation.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'       // optional external object for communication
            },
            link: function (scope) {
                scope.ext = scope.ext || {};    // object to communicate
                scope.sources = otConfig.evidence_sources.somatic_mutation.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; });
            }
        };
    }]);
