angular.module('otFacets')
    .directive('datatype1Facet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/datatype1/datatype1-facet.html',
            link: function (scope, elem) {
                // scope.bob = function(){
                //     console.log('Hi Bob!');
                //     console.log(scope.facet);
                // }
            }
        };
    }]);
