/**
 * Affected pathway plugin
 */
angular.module('otPlugins')
    .directive('otAffectedPathway', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/affected-pathway/affected-pathway.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'       // optional external object for communication
            },
            link: function (scope) {
                scope.ext = scope.ext || {};    // object to communicate
                scope.sources = otConfig.evidence_sources.pathway.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; });
            }
        };
    }]);
