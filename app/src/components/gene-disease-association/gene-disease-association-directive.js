angular.module('cttvDirectives')

    /**
    * Flower graph
    */
    .directive('cttvGeneDiseaseAssociation', [function () {
        'use strict';

        return {
            restrict: 'AE',
            // transclude: 'true',
            scope: {
                associationData: '='
            },
            link: function (scope, elem) {
                // var flower = flowerView().values(scope.associationData);
                // flower(elem[0]);

                scope.render = function (data) {
                    if (data.length > 0) {
                        var flower = flowerView()
                            .values(data)
                            .diagonal(200);
                        flower(elem[0]);
                    }
                };

                // Watch for data changes
                scope.$watch(
                    'associationData',
                    function () {
                        scope.render(scope.associationData);
                    }// ,
                    // true
                );
            }
        };
    }]);
