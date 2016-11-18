
/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 */
.controller('targetAssociationsCtrl', ['$scope', '$location', '$log', 'cttvUtils', 'cttvAPIservice', 'cttvFiltersService', 'cttvConsts', 'cttvDictionary', '$timeout', 'cttvLocationState', function ($scope, $location, $log, cttvUtils, cttvAPIservice, cttvFiltersService, cttvConsts, cttvDictionary, $timeout, cttvLocationState) {
    'use strict';

	// $log.log('targetAssociationsCtrl()');



    cttvLocationState.init();   // does nothing, but ensures the cttvLocationState service is instantiated and ready



    // Initial setup


    // scope vars
	$scope.search = {
	    query : ""
	};

    $scope.labels = {
        therapeutic_areas : cttvDictionary.THERAPEUTIC_AREAS
    };

    $scope.n = {
        diseases : "...", // this should be a number, but initialize to "..." for better user feedback
    };

    // the scope view is essentially the state
    $scope.view = {
        t : ["bubbles"],    // t = the selected tab
        //tp: [1]
    };

    $scope.loading = false;



    // filters

    // reset the filters when loading a new page so we don't see the filters from the previous page...
    cttvFiltersService.reset();

    // select facets to show
    cttvFiltersService.pageFacetsStack([
        //cttvFiltersService.facetTypes.SCORE,        // adds a score facet to the page
        cttvFiltersService.facetTypes.DATATYPES,
        cttvFiltersService.facetTypes.THERAPEUTIC_AREAS
    ]);



    // state we want to export to/from the URL
    var stateId = "view";
    var facetsId = cttvFiltersService.stateId;



    /*
     * The view is essentially the state for the page;
     * filters are autonomous and do their own business
     */
    var setView = function(obj){

        // should work also for obj==undefined at page load
        // or if navigating back through browser history

        // define defaults as needed
        obj = obj || {};
        obj.t = obj.t || ["bubbles"];

        // update the scope; only the tab is needed at the moment
        $scope.view.t = obj.t;

    }



    /*
     * Takes object from locationStateService, initialize the page/component state and fire a query which then updates the screen
     */
    var render = function(new_state, old_state){

        // here we want to update facets, tabs, etc:
        // 1. first we check if the state of a particular element has changed;
        // 2. if it hasn't changed, and it's undefined (new=undefined, old=undefined),
        // then it's a page load with no state specified, so we update that element anyway with default values

        // facets changed?
        if( ! _.isEqual( new_state[facetsId], old_state[facetsId] ) || !new_state[facetsId] ){
            getFacets( new_state[facetsId] );
        }

        // view changed?
        if( ! _.isEqual( new_state[stateId], old_state[stateId] ) || !new_state[stateId] ){
            setView( new_state[stateId] );
        }

    }



    /*
     * Get facets data as well general page info data (e.g. count, labels etc)
     */
    function getFacets (filters) {

        // Set the filters
        $scope.filters = filters;

        var opts = {
            target: $scope.search.query,
            outputstructure: "flat",
            facets: true,
            direct: true,
            size: 1
        };
        opts = cttvAPIservice.addFacetsOptions(filters, opts);
        var queryObject = {
            method: "GET",
            params: opts
        };

        cttvAPIservice.getAssociations(queryObject)
            .then (function (resp) {
                $scope.search.total = resp.body.total;
                if (resp.body.total) {
                    $scope.search.label = resp.body.data[0].target.gene_info.symbol;

                    // set the filename
                    $scope.search.filename = cttvDictionary.EXP_TARGET_ASSOC_LABEL + resp.body.data[0].target.gene_info.symbol;

                    // Set the total number of diseases
                    $scope.n.diseases = resp.body.total;

                    // Update the facets
                    cttvFiltersService.updateFacets(resp.body.facets, cttvConsts.UNIQUE_DISEASE_COUNT );
                    //$scope.updateFacets(resp.body.facets);
                }
            },
            cttvAPIservice.defaultErrorHandler);
    }



    /*
     * Update function passes the current view (state) to the URL
     */
    function update(){
        cttvLocationState.setStateFor(stateId, $scope.view);
    }



    /**
     * Called from the tables in the HTML, this sets the active tab id.
     * Valid tabs are: "bubbles", "table", "tree"
     */
    $scope.setActiveTab = function (tab) {
        $scope.view.t[0] = tab;
        update();
    }



    //
    // on STATECHANGED
    // Set up a listener for the URL changes and when the search change, get new data
    //



    $scope.$on(cttvLocationState.STATECHANGED, function (evt, new_state, old_state) {
        render( new_state, old_state ); // args is the same as getState()
    });



    //
    // on PAGE LOAD
    //



    cttvUtils.clearErrors();
    $scope.search.query = $location.path().split('/')[2];
    $scope.filters = cttvLocationState.getState()[facetsId] || {} ;

    render( cttvLocationState.getState(), cttvLocationState.getOldState() );



}]);
