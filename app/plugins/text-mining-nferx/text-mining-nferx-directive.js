/**
 * Somatic mutations plugin
 */
angular.module('otPlugins')
    .directive('otTextMiningNferx', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/text-mining-nferx/text-mining-nferx.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'       // optional external object for communication
            },
            link: function (scope) {
                scope.ext = scope.ext || {};    // object to communicate
                scope.ext.nferx = {};
                scope.sources = {
                    literature: [{label: otDictionary.EPMC, url: otConsts.dbs_info_url.EPMC}],
                    nferx: [{label: otDictionary.NFERX, url: otConsts.dbs_info_url.NFERX}]
                };
            }
        };
    }]);
