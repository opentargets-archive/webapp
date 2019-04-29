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
                scope.ext.crispr = {};
                scope.ext.activetab = 0;

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

                scope.$watchGroup(
                    [
                        function () { return scope.ext.pathway.isLoading; },
                        function () { return scope.ext.sysbio.isLoading; },
                        function () { return scope.ext.crispr.isLoading; }
                    ],
                    function () {
                        scope.ext.isLoading = scope.ext.pathway.isLoading || scope.ext.sysbio.isLoading || scope.ext.crispr.isLoading;
                    }
                );

                scope.$watchGroup(
                    [
                        function () { return scope.ext.pathway.hasError; },
                        function () { return scope.ext.sysbio.hasError; },
                        function () { return scope.ext.crispr.hasError; }
                    ],
                    function () {
                        scope.ext.hasError = scope.ext.pathway.hasError || scope.ext.sysbio.hasError || scope.ext.crispr.hasError;
                    }
                );

                scope.$watchGroup(
                    [
                        function () { return scope.ext.pathway.data; },
                        function () { return scope.ext.sysbio.data; },
                        function () { return scope.ext.crispr.data; }
                    ],
                    function (newdata, olddata) {
                        if (newdata[0] && newdata[1] && newdata[2]) {
                            scope.ext.data = (newdata[0].length > 0 || newdata[1].length > 0 || newdata[2].length > 0) ? [{}] : [];  // just a fake data object to have a length property for now
                            for (var i = newdata.length - 1; i >= 0; i--) {
                                if (newdata[i].length > 0) {
                                    scope.ext.activetab = i;    // find first tab with data
                                }
                            }
                        }
                    }
                );
            }
        };
    }]);
