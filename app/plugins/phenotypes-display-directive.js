angular.module('plugins')
    .directive('phenotypesDisplay', ['$log', 'cttvUtils', function ($log, cttvUtils) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div><div ng-show="disease.phenotypes.length==0">No phenotypes available</div><ul><li ng-repeat="phenotype in disease.phenotypes">{{phenotype.label | upperCaseFirst}}</li></ul></div>',
            scope: {
                disease: '=',
                width: '='
            }
        };
    }]);
