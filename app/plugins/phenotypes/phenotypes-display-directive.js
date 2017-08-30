angular.module('otPlugins')
    .directive('otPhenotypesDisplay', [function () {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/phenotypes/phenotypes-display.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope) {
                var uniquePhenotypes = {};
                for (var i = 0; i < scope.disease.phenotypes.length; i++) {
                    uniquePhenotypes[scope.disease.phenotypes[i].label] = true;
                }
                scope.uniquePhenotypes = Object.keys(uniquePhenotypes).sort();
            }
        };
    }]);
