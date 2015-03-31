'use strict';

angular.module('cttvFilters', [])
    .filter('split', function () {
	return function(input, splitChar, splitIndex) {
	    // do some bounds checking here to ensure it has that index
	    return input.split(splitChar)[splitIndex];
	}
    })
    .filter('clearUnderscores', function () {
	return function (input) {
	    return input.replace(/_/g,' '); 
	}
    })
    .filter('upperCaseFirst', function () {
	return function (input) {
	    return input.charAt(0).toUpperCase() + input.slice(1);
	}
    })

