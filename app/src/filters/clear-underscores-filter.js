angular.module('otFilters')
    .filter('otClearUnderscores', function () {
        'use strict';

        return function (input) {
            return input.replace(/_/g, ' ');
        };
    });
