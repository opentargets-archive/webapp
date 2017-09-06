angular.module('facets')
.directive('therapeuticAreaFacet', ['$log', function ($log) {
    return {
        restrict: 'E',
        scope: {
            facet: '='
        },
        templateUrl: 'facets/therapeutic-area/therapeutic-area-facet.html',
    };
}]);