

/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl:
 * Controller for the target associations page.
 *
 * It loads a list of associations for the given disease (efo).
 * Any filters and facets are passed via the search part of the URL.
 * On page load, if no filters are specified, we set the default datatypes (to filter out mouse data),
 * or otherwise we just load the data.
 * Filters modify the URL search:
 * here we listen for changes to the URL and fire a new search when required.
 * Then when we get the data, we update content and facets
 */

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvFiltersService', 'cttvDictionary', 'cttvUtils', 'cttvLocationState', function ($scope, $location, $log, cttvAPIservice, cttvFiltersService, cttvDictionary, cttvUtils, cttvLocationState) {

    'use strict';

    $log.log('diseaseAssociationsCtrl()');
    cttvUtils.clearErrors();


    // ---------------------------
    //  Initialiaze
    // ---------------------------



    // configure the "search" object
    // to be exposed via scope
    $scope.search = {
        query : $location.path().split('/')[2],
        label : "",
        filename : "",
        total : "..."
    };


    // reset the filters when loading a new page
    // so we don't see the filters from the previous page...
    cttvFiltersService.reset();

    // Set page filters:
    // this defines the order in which the facets are going to be displayed
    cttvFiltersService.pageFacetsStack([
        //cttvFiltersService.facetTypes.SCORE,        // adds a score facet to the page
        cttvFiltersService.facetTypes.DATATYPES,    // adds a datatypes facet to the page
        cttvFiltersService.facetTypes.PATHWAYS      // adds a pathways facet to the page
    ]);



    /*
     * Get data to populate the table.
     *
     * @param filters: object of filtering categories, e.g. "datatypes"; each one is either a string or an array of strings
     * Example:
     * filters = {
     *      datatypes: "known_drug",
     *      pathway_type: [ "REACT_111102", "REACT_116125", "REACT_6900" ]
     * }
     * getFacets(filters);
     */
    var getFacets = function(filters){
        $log.log("getFacets()");
        var opts = {
            disease: $scope.search.query,
            outputstructure: "flat",
            facets: true,
            // direct: false,
            size:1
        };
        opts = cttvAPIservice.addFacetsOptions(filters, opts);


        cttvAPIservice.getAssociations(opts).
        then(
            function(resp){
                $log.log("Got new data...");

                // 1: set the facets
                // we must do this first, so we know which datatypes etc we actually have
                // $log.log(resp.body.status[0]);
                $log.log(resp.body);
                cttvFiltersService.updateFacets(resp.body.facets, undefined, resp.body.status);
                // cttvFiltersService.status(resp.body.status);

                // set the data
                // $scope.data = resp.body.data;
                // $scope.data.selected = {datatypes: cttvFiltersService.getSelectedFiltersRaw("datatypes")};
                $scope.filters = filters;

                // The label of the diseaes in the header
                $scope.search.label = resp.body.data[0].disease.efo_info.label;

                // The filename to download
                $scope.search.filename = cttvDictionary.EXP_DISEASE_ASSOC_LABEL + resp.body.data[0].disease.efo_info.label.split(" ").join("_");

                // set the total?
                $scope.search.total = resp.body.total; //resp.body.total;
            },
            cttvAPIservice.defaultErrorHandler
        );


    };

//      $rootScope.$on('$stateChangeStart',
//  function(event, toState, toParams, fromState, fromParams){
//      event.preventDefault();
//  })


    // Set up a listener for the URL changes and when the search change, get new data
    // $scope.$on('$routeUpdate', function(){
    /*$scope.$on('$locationChangeSuccess', function(){
        $log.log("** onRouteUpdate **");
        getFacets( cttvFiltersService.parseURL() );
    });*/



    // Set up a listener for the URL changes and when the search change, get new data
    $scope.$on(cttvLocationState.STATECHANGED, function (e, args) {
        // $log.log(e);
        // $log.log(args);
        getFacets( args.fcts ); // if there are no facets, no worries, the API service will handle undefined
    });



    // ---------------------------
    //  Flow
    // ---------------------------

    // When page first load, the above cttvLocationState.STATECHANGED is fired, but we are not ready to catch it yet
    // so we have to fire the handler manually
    getFacets( cttvLocationState.parseLocationSearch()["fcts"] || {} );





    //
    // No longer need to get unfiltered data first and all that
    // We just get the data and display it, but:
    //  1. Must set the default datatypes for this page
    //  2. Get the data and facets
    //  3. Listen for page changes

    // Option 1: get the data without caring about filtered out mouse data
    //getFacets( cttvFiltersService.parseURL() );


    // - OR -

    // Option 2: set the default filterd-out mouse data on page load, in which case we get the data on URL change
    /*if(_.keys(cttvFiltersService.parseURL()).length==0){
        // NO SEARCH

        // no search == no filters specified, so we set default filters: this will trigger a page reload
        cttvFiltersService.setSelectedFilters({datatypes: cttvFiltersService.getDefaultSelectedDatatypes()});
    } else {
        // THERE IS A SEARCH

        // make the call for data with the selected filters
        getFacets( cttvFiltersService.parseURL() );
    }*/

}]);
