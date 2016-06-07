angular.module('plugins')
    .directive('drugsDisplay', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'E',
            template: '<p>Source: <a href="/faq#data-provenance" target="_blank">CHEMBL</a></p>'
            + '<known-drug-table target="{{target.id}}" disease="{{disease.efo}}" title="drug"></known-drug-table>',
            scope: {
                target: '=',
                disease: '='
            }
        };
    }]);
