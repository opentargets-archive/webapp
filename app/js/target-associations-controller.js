
/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 * It loads a list of associations for the given search
 */
    .controller('targetAssociationsCtrl', ['$scope', '$location', '$log', 'cttvUtils', 'cttvAPIservice', 'cttvFiltersService', 'cttvConsts', 'cttvDictionary', '$timeout', function ($scope, $location, $log, cttvUtils, cttvAPIservice, cttvFiltersService, cttvConsts, cttvDictionary, $timeout) {
        'use strict';

	$log.log('targetAssociationsCtrl()');
    cttvUtils.clearErrors();

	var q = $location.path().split('/')[2];
	$scope.search = {
	    query : q
	};

    $scope.labels = {
        therapeutic_areas : cttvDictionary.THERAPEUTIC_AREAS
    };



    // reset the filters when loading a new page
    // so we don't see the filters from the previous page...
    cttvFiltersService.reset();

    // Set filters
    cttvFiltersService.pageFacetsStack([
        //cttvFiltersService.facetTypes.SCORE,        // adds a score facet to the page
        cttvFiltersService.facetTypes.DATATYPES,
        cttvFiltersService.facetTypes.THERAPEUTIC_AREAS
    ]);

    var filters = cttvFiltersService.parseURL();

    // Set up a listener for the URL changes and
    // when the search change, get new data
    $scope.$on('$routeUpdate', function(){
        $log.log("onRouteUpdate");
        getFacets(cttvFiltersService.parseURL());
    });

    function getFacets (filters) {
        $log.log("getFacets()");
        // Set the filters
        $scope.filters = filters;

        var opts = {
            target: q,
            outputstructure: "flat",
            facets: true,
            direct: true,
            size: 1
        };
        opts = cttvAPIservice.addFacetsOptions(filters, opts);

        cttvAPIservice.getAssociations(opts)
            .then (function (resp) {
                $scope.search.total = resp.body.total;
                if (resp.body.total) {
                    $scope.search.label = resp.body.data[0].target.gene_info.symbol;

                    // set the filename
                    $scope.search.filename = cttvDictionary.EXP_TARGET_ASSOC_LABEL + resp.body.data[0].target.gene_info.symbol;

                    // Update the facets
                    $scope.updateFacets(resp.body.facets);

                }
            },
            cttvAPIservice.defaultErrorHandler);
    }

    getFacets(cttvFiltersService.parseURL());

	$scope.loading = false;


	$scope.toggleDataTypes = function () {
	    $scope.toggleNavigation();
	};


    /**
     * Parse the filters.
     * That means it takes the list of filters as specified in the URL
     */
    $scope.filter = function(filters){
        $log.log("filter()");

        $scope.filters = filters;
        $scope.score = {};
    };


    $scope.filter(filters);

    $scope.updateFacets = function (facets) {
        $log.log("**** updateFacets() ****");
        cttvFiltersService.updateFacets(facets, "unique_disease_count");
    };

    // active tab
    $scope.active = "bubbles";
    $scope.setActive = function (who) {
        $scope.active = who;
    };

}]);
