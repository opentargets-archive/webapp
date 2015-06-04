'use strict';

/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 * It loads a list of associations for the given search
 */

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvFiltersService', function ($scope, $location, $log, cttvAPIservice, cttvFiltersService) {
    $log.log('diseaseAssociationsCtrl()');
    var q = $location.path().split('/')[2];
    $scope.search = {
        query : q
    };


    // var api = cttvApi();
    // var url = api.url.disease({'efo': q});
    // api.call(url)
	// .then (function (resp) {
	//     $scope.search.label = resp.body.label;
	// });

    $scope.colorScale = d3.scale.linear()
    .domain([0,1])
    .range(["#ffffff", "#08519c"]);

    // get disease specific info with the efo() method
    cttvAPIservice.getDisease( {
            efo:$scope.search.query
        } ).
        then(
            function(resp) {
                $scope.search.label = resp.body.label;
                $scope.search.filename = resp.body.label.split(" ").join("_");
            },
            cttvAPIservice.defaultErrorHandler
        );

    $scope.nresults = "0";
    //$scope.loading = false;


    // start testing filters...
    //cttvFiltersService.initFilters();

    $log.log(cttvFiltersService.getFilters());
    //$scope.cttvFiltersService = cttvFiltersService;

}]);
