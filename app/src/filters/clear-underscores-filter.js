angular.module('cttvFilters')
.filter('clearUnderscores', function () {
    'use strict';

    return function (input) {
        return input.replace(/_/g,' ');
    };
});
