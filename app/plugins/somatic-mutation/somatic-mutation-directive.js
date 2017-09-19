angular.module('otPlugins')
    .directive('otSomaticMutation', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/somatic-mutation/somatic-mutation.html',
            // template: '<div>Hello there</div>',
            scope: {
                target: '=',
                disease: '='
            },
            link: function (scope) {
                scope.is_loading = true;
                scope.has_errors = false;
                scope.data = {};
                scope.sources = otConfig.evidence_sources.somatic_mutation.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; });
            }
        };
    }]);
