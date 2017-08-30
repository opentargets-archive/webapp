angular.module('otPlugins')
    .directive('drugsDisplay', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/drugs/drugs-display.html',
            scope: {
                target: '=',
                disease: '='
            },
            link: function (scope) {
                scope.sources = otConfig.evidence_sources.known_drug.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; });
            }
        };
    }]);
