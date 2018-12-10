/**
 * Affected pathway plugin
 */
angular.module('otPlugins')
    .directive('otAffectedPathway', ['otConfig', 'otUtils', function (otConfig, otUtils) {
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
                // setup the ext communication object;
                // this is a little more complex than other plugins because here now we have pathways and system biology
                scope.ext = scope.ext || {};    // object to communicate;
                scope.ext.pathway = {};
                scope.ext.sysbio = {};

                scope.sources = {};
                Object.keys(otConfig.evidence_sources.pathway).forEach(function (p) {
                    scope.sources[p] = otConfig.evidence_sources.pathway[p].map(function (s) {
                        // so here s is the datasource api 'key' (i.e. lowercase 'pathway')
                        // now we need to find label and infoUrl from the otConsts.datasources object
                        var ds = otUtils.getDatasourceById(s);

                        return {
                            label: ds.label,
                            url: ds.infoUrl
                        };
                    });
                });


                // setup watchers to update the parent

                scope.$watchGroup([function () { return scope.ext.pathway.isLoading; }, function () { return scope.ext.sysbio.isLoading; }], function () {
                    scope.ext.isLoading = scope.ext.pathway.isLoading || scope.ext.sysbio.isLoading;
                });

                scope.$watchGroup([function () { return scope.ext.pathway.hasError; }, function () { return scope.ext.sysbio.hasError; }], function () {
                    scope.ext.hasError = scope.ext.pathway.hasError || scope.ext.sysbio.hasError;
                });

                scope.$watchGroup([function () { return scope.ext.pathway.data; }, function () { return scope.ext.sysbio.data; }], function (newdata, olddata) {
                    if (newdata[0] && newdata[1]) {
                        scope.ext.data = (newdata[0].length > 0 || newdata[1].length > 0) ? [{}] : [];  // just a fake data object to have a length property for now
                    }
                });
            }
        };
    }]);
