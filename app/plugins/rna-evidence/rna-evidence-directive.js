/**
 * RNA evidence plugin
 */
angular.module('otPlugins')
    .directive('otRnaEvidence', ['otConfig', 'otUtils', function (otConfig, otUtils) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/rna-evidence/rna-evidence.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'       // optional external object for communication
            },
            link: function (scope) {
                scope.ext = scope.ext || {};    // object to communicate
                scope.sources = otConfig.evidence_sources.rna_expression.map(function (s) {
                    // so here s is the datasource api 'key' (i.e. lowercase 'pathway')
                    // now we need to find label and infoUrl from the otConsts.datasources object
                    var ds = otUtils.getDatasourceById(s);

                    return {
                        label: ds.label, // otDictionary[dk[0]],
                        url: ds.infoUrl // otConsts.dbs_info_url[otConsts.invert(s)]
                    };
                });
            }
        };
    }]);
