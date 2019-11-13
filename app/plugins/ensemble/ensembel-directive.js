/**
 * Text mining plugin
 */
angular.module('otPlugins')
    .directive('otEnsemble', ['otConfig', 'otUtils', '$sce', function (otConfig, otUtils, $sce) {
        'use strict';
        return {
            restrict: 'E',
            templateUrl: 'plugins/ensemble/ensemble.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'       // optional external object for communication
            },
            link: function (scope) {
                scope.ext = scope.ext || {};
                scope.ext.ensemble_url = $sce.trustAsResourceUrl(
                    'https://uswest.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=' + scope.target.ensembl_gene_id
                )
            }
        };
    }]);
