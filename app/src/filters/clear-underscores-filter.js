angular.module('cttvFilters')
    .filter('otClearUnderscores', function () {
        'use strict';

        return function (input) {
            return input.replace(/_/g,' ');
        };
    });
