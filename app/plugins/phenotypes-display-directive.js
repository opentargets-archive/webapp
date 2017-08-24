angular.module('plugins')
    .directive('phenotypesDisplay', ['$log', 'otUtils', function ($log, otUtils) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div><div ng-show="uniquePhenotypes.length==0">No phenotypes available</div><ul><li ng-repeat="phenotype in uniquePhenotypes">{{phenotype | otUpperCaseFirst}}</li></ul></div>',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope, elem, attrs) {
                var uniquePhenotypes = {};
                for (var i = 0; i < scope.disease.phenotypes.length; i++) {
                    uniquePhenotypes[scope.disease.phenotypes[i].label] = true;
                }
                scope.uniquePhenotypes = Object.keys(uniquePhenotypes).sort();
            }
        };
    }]);
