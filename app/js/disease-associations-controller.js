'use strict';

/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 * It loads a list of associations for the given search
 */

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', function ($scope, $location, $log) {
    $log.log('diseaseAssociationsCtrl()');
    var q = $location.path().split('/')[2];
    $scope.search = {
	query : q
    };

    var api = cttvApi();
    var url = api.url.disease({'efo': q});
    api.call(url)
	.then (function (resp) {
	    $scope.search.label = resp.body.label;
	});
    
    $scope.nresults = 0;
    
}]);
