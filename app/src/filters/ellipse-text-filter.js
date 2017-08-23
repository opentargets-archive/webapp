angular.module('cttvFilters')
.filter('ellipseText', function() {
    'use strict';

    return function(text, length) {
        return  text.length>length ? text.substring(0,length)+'&hellip;' : text;
    };
});
