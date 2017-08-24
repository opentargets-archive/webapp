angular.module('plugins')
    .directive('drugsDisplay', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div ng-show="data.length>0">'
                    + '    <p>Source: <span ng-repeat="source in sources"><a href="{{source.url}}" target="_blank">{{source.label}}</a><span ng-if="!$last">, </span><span></p>'
                    + '    <known-drug-table target="{{target.id}}" disease="{{disease.efo}}" title="drug" data="data"></known-drug-table>'
                    + '</div>'
            // this is sort of redundant as it's also included in table directive
            // but we pull out the data and check the length from here so that we can show/hide also the source at the top
            // for consistency with the evicence page
                    + '<div ng-show="data.length==0"><p>No data available</p></div>',
            scope: {
                target: '=',
                disease: '='
            },
            link: function (scope) {
                scope.sources = otConfig.evidence_sources.known_drug.map(function (s) { return {label: otDictionary[otConsts.invert(s)], url: otConsts.dbs_info_url[otConsts.invert(s)]}; });
            }
        };
    }]);
