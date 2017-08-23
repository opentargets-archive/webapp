angular.module('cttvDirectives')
    .directive('resize', ['$window', function ($window) {
        'use strict';

        var w = angular.element($window);

        return {
            scope : {},
            controller: ['$scope', function ($scope) {
                this.dims = function () {
                    return {
                        'height': w[0].innerHeight,
                        'width': w[0].innerWidth
                    };
                };

                w.bind('resize', function () {
                    $scope.$apply();
                });
            }]
        };
    }]);
