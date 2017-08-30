angular.module('otDirectives')

    /**
    * Flower graph
    */
    .directive('otGeneDiseaseAssociation', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                associationData: '='
            },
            link: function (scope, elem) {
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
                    }
                );
            }
        };
    }]);
