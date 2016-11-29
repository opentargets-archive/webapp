angular.module('plugins')
    .directive('phenotypesDisplay', ['$log', 'cttvUtils', function ($log, cttvUtils) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div><ul><li ng-repeat="phenotype in disease.phenotypes">{{phenotype.label | upperCaseFirst}}</li></ul></div>',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope, element, attrs) {}
        };
    }]);
