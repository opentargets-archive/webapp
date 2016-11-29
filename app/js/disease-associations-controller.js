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

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', '$q', 'cttvAPIservice', 'cttvFiltersService', 'cttvDictionary', 'cttvUtils', 'cttvLocationState', function ($scope, $location, $log, $q, cttvAPIservice, cttvFiltersService, cttvDictionary, cttvUtils, cttvLocationState) {

    'use strict';

    //$log.log('diseaseAssociationsCtrl()');

    cttvLocationState.init();   // does nothing, but ensures the cttvLocationState service is instantiated and ready



    // ---------------------------
    //  Initialiaze
    // ---------------------------



    // configure the "search" object
    // to be exposed via scope
    $scope.search = {
        query: $location.path().split('/')[2],
        label: "",
        filename: "",
        total: "..."
    };


    // reset the filters when loading a new page
    // so we don't see the filters from the previous page...
    cttvFiltersService.reset();

    // Set page filters: this defines the order in which the facets are going to be displayed
    cttvFiltersService.pageFacetsStack([
        //cttvFiltersService.facetTypes.SCORE,        // adds a score facet to the page
        cttvFiltersService.facetTypes.DATATYPES,      // adds a datatypes facet to the page
        cttvFiltersService.facetTypes.PATHWAYS,       // adds a pathways facet to the page
        cttvFiltersService.facetTypes.TARGET_CLASS    // adds a target class facet
    ]);



    // state we want to export to/from the URL
    // var stateId = "view";
    var facetsId = cttvFiltersService.stateId;
    /*
     * Renders page elements based on state from locationStateService
     */
    var render = function (new_state, old_state) {

        // here we want to update facets, tabs, etc:
        // 1. first we check if the state of a particular element has changed;
        // 2. if it hasn't changed, and it's undefined (i.e. new=undefined, old=undefined),
        // then it's a page load with no state specified, so we update that element anyway with default values

        // facets changed?
        if (!_.isEqual(new_state[facetsId], old_state[facetsId]) || !new_state[facetsId]) {
            $scope.getFacets(new_state[facetsId],$scope.target.targetArray);
        }

    };

    $scope.target = {};
    $scope.target.targetArray = [];//turns out 2 way binding does not work that well on arrays

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
    $scope.getFacets = function (filters,targetArray) {

        // set the filters
        $scope.filters = filters;

        var opts = {
            disease: [$scope.search.query],
            outputstructure: "flat",
            facets: true,
            size:1
        };

        if (targetArray && targetArray.length) {
            opts.target = targetArray;
        }

        opts = cttvAPIservice.addFacetsOptions(filters, opts);
        var queryObject = {
            method: 'POST',
            params: opts
        };

        cttvAPIservice.getAssociations(queryObject)
        .then(function(resp) {
            //$log.log("disease-associations-controller:getAssociations:resp", resp);
            // 1: set the facets
            // we must do this first, so we know which datatypes etc we actually have
            //TODO Change this to POST request
            cttvFiltersService.updateFacets(resp.body.facets, undefined, resp.body.status);


            // The label of the diseases in the header
            $scope.search.label = resp.body.data[0].disease.efo_info.label;

            // The filename to download
            $scope.search.filename = cttvDictionary.EXP_DISEASE_ASSOC_LABEL + resp.body.data[0].disease.efo_info.label.split(" ").join("_");

            // set the total?
            $scope.search.total = resp.body.total; //resp.body.total;

        }, cttvAPIservice.defaultErrorHandler);


    };



    //
    // on STATECHANGED
    // Set up a listener for the URL changes and when the search change, get new data
    //

    $scope.$on(cttvLocationState.STATECHANGED, function (evt, new_state, old_state) {
        render(new_state, old_state); // if there are no facets, no worries, the API service will handle undefined
    });



    //
    // on PAGE LOAD
    //

    cttvUtils.clearErrors();
    $scope.filters = cttvLocationState.getState()[facetsId] || {};
    render(cttvLocationState.getState(), cttvLocationState.getOldState());


}]) ;
