

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

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvFiltersService', 'cttvDictionary', function ($scope, $location, $log, cttvAPIservice, cttvFiltersService, cttvDictionary) {

    'use strict';

    $log.log('diseaseAssociationsCtrl()');



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
     * getData(filters);
     */
    var getData = function(filters){
        $log.log("getData()");
        var opts = {
            disease: $scope.search.query,
            datastructure: "flat",
        };
        opts = cttvAPIservice.addFacetsOptions(filters, opts);

        // TEST:
        //cttvFiltersService.updateFacets(JSON.parse('{"data_distribution": {"buckets": {"0.0": {"value": 803},"0.2": {"value": 8},"0.4": {"value": 5},"0.8": {"value": 234},"0.6": {"value": 2}}}}'));



        cttvAPIservice.getAssociations(opts).
        then(
            function(resp){
                $log.log("Got new data...");

                // 1: set the facets
                // we must do this first, so we know which datatypes etc we actually have
                $log.log(resp.body.status[0]);
                $log.log(resp.body);
                cttvFiltersService.updateFacets(resp.body.facets, undefined, resp.body.status);
                // cttvFiltersService.status(resp.body.status);

                // set the data
                $scope.data = resp.body.data;
                $scope.data.selected = {datatypes: cttvFiltersService.getSelectedFiltersRaw("datatypes")};

                // set the total?
                $scope.search.total = resp.body.data.length; //resp.body.total;
            },
            cttvAPIservice.defaultErrorHandler
        );


    };



    // Set up a listener for the URL changes and
    // when the search change, get new data
    $scope.$on('$routeUpdate', function(){
        $log.log("onRouteUpdate");
        getData( cttvFiltersService.parseURL() );
    });



    // ---------------------------
    //  Flow
    // ---------------------------



    // First off, get disease specific info to populate the top of the page
    // This is independent of other data, so we just fire that here
    cttvAPIservice.getDisease( {
            code:$scope.search.query
        } ).
        then(
            function(resp) {
                $scope.search.label = resp.body.label;
                $scope.search.filename = cttvDictionary.EXP_DISEASE_ASSOC_LABEL + resp.body.label.split(" ").join("_");
            },
            cttvAPIservice.defaultErrorHandler
        );



    //
    // Then onto the data
    // No longer need to get unfiltered data first and all that
    // We just get the data and display it, but:
    //  1. Must set the default datatypes for this page
    //  2. Get the data and facets
    //  3. Listen for page changes

    // Option 1: get the data without caring about filtered out mouse data
    getData( cttvFiltersService.parseURL() );

    // - OR -

    // Option 2: set the default filterd-out mouse data on page load, in which case we get the data on URL change
    /*if(_.keys(cttvFiltersService.parseURL()).length==0){
        // NO SEARCH

        // no search == no filters specified, so we set default filters: this will trigger a page reload
        cttvFiltersService.setSelectedFilters({datatypes: cttvFiltersService.getDefaultSelectedDatatypes()});
    } else {
        // THERE IS A SEARCH

        // make the call for data with the selected filters
        getData( cttvFiltersService.parseURL() );
    }*/



}]);
