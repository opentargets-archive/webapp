angular.module('plugins')
    .directive('drugsDisplay', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div ng-show="data.length>0">'
                    + '    <p>Source: <a href="/faq#data-provenance" target="_blank">CHEMBL</a></p>'
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
            link: function(scope, element, attrs) {
                // don't actually need to declare this here but it makes it clearer I guess....
                // this is the data fetched by the drug table directive and passed out to the scope here
                // sot it's available within the drugs display directive
                scope.data;
            }
        };
    }]);
