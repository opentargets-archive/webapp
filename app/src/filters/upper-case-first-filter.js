angular.module('cttvFilters')
.filter('upperCaseFirst', function () {
    'use strict';

    return function (input) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    };
});
