angular.module('otPlugins')
    .directive('drugsDisplay', ['otConfig', 'otConsts', 'otDictionary', function (otConfig, otConsts, otDictionary) {
        'use strict';

        return {
            restrict: 'E',
            // template: '<div ng-show="data.length>0">'
            //         + '    <p>Source: <span ng-repeat="source in sources"><a href="{{source.url}}" target="_blank">{{source.label}}</a><span ng-if="!$last">, </span><span></p>'
            //         + '    <ot-known-drug-table target="{{target.id}}" disease="{{disease.efo}}" title="drug" data="data"></ot-known-drug-table>'
            //         + '</div>'
            //         + '<div ng-show="data.length==0"><p>No data available</p></div>',
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
