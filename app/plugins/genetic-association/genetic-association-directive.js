/**
 * Somatic mutations plugin
 */
angular.module('otPlugins')
    .directive('otGeneticAssociation', ['otConfig', 'otUtils', function (otConfig, otUtils) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/genetic-association/genetic-association.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'       // optional external object for communication
            },
            link: function (scope) {
                // setup the ext communication object;
                // this is a little more complex than other plugins because here we have common and rare tables
                scope.ext = scope.ext || {};    // object to communicate;
                scope.ext.common = {};
                scope.ext.rare = {};

                // scope.sources = {
                //     common: otConfig.evidence_sources.genetic_association.common.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; }),
                //     rare: otConfig.evidence_sources.genetic_association.rare.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; })
                // };
                scope.sources = {
                    common: otConfig.evidence_sources.genetic_association.common.map(function (s) {
                        // so here s is the datasource api 'key' (i.e. lowercase 'pathway')
                        // now we need to find label and infoUrl from the otConsts.datasources object
                        var ds = otUtils.getDatasourceById(s);

                        return {
                            label: ds.label, // otDictionary[dk[0]],
                            url: ds.infoUrl // otConsts.dbs_info_url[otConsts.invert(s)]
                        };
                    }),
                    rare: otConfig.evidence_sources.genetic_association.rare.map(function (s) {
                        // so here s is the datasource api 'key' (i.e. lowercase 'pathway')
                        // now we need to find label and infoUrl from the otConsts.datasources object
                        var ds = otUtils.getDatasourceById(s);

                        return {
                            label: ds.label, // otDictionary[dk[0]],
                            url: ds.infoUrl // otConsts.dbs_info_url[otConsts.invert(s)]
                        };
                    })
                };

                // setup watchers to update the parent

                scope.$watchGroup([function () { return scope.ext.common.isLoading; }, function () { return scope.ext.rare.isLoading; }], function () {
                    scope.ext.isLoading = scope.ext.common.isLoading || scope.ext.rare.isLoading;
                });

                scope.$watchGroup([function () { return scope.ext.common.hasError; }, function () { return scope.ext.rare.hasError; }], function () {
                    scope.ext.hasError = scope.ext.common.hasError || scope.ext.rare.hasError;
                });

                scope.$watchGroup([function () { return scope.ext.common.data; }, function () { return scope.ext.rare.data; }], function () {
                    scope.ext.data = ((scope.ext.common.data && scope.ext.common.data.length > 0) || (scope.ext.rare.data && scope.ext.rare.data.length > 0)) ? [{}] : [];  // just a fake data object to have a length property for now
                });
            }
        };
    }]);
