angular.module('cttvDirectives')
    .directive('cttvSearchSuggestions', [function () {
        'use strict';

        return {
            restrict: 'EA',
            templateUrl: 'src/components/search-suggestions/search-suggestions.html',
            replace: true,
            link: function (scope, elem, attrs) {

            }
        };
    }]);
