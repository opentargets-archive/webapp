angular.module('cttvFilters')
    .filter('otMonthToString', function() {
        'use strict';

        return function(mi) {
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return  months[mi] || '';
        };
    });
