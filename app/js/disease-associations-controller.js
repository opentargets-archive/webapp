

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

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvFiltersService', 'cttvDictionary', 'cttvUtils', 'cttvLocationState', 'cttvLoadedLists', '$q', function ($scope, $location, $log, cttvAPIservice, cttvFiltersService, cttvDictionary, cttvUtils, cttvLocationState, cttvLoadedLists, $q) {

    'use strict';

    $log.log('diseaseAssociationsCtrl()');

    cttvLocationState.init();   // does nothing, but ensures the cttvLocationState service is instantiated and ready



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


    $log.log("location is...");
    $log.log($location.search());
    var targetList = $location.search()["target-list"];
    // var targetList = new_state["target-list"];
    $log.log("target list is...");
    $log.log(targetList);
    if (targetList) {
        var list = cttvLoadedLists.get(targetList);
        var targets = [];
        for (var i=0; i<list.list.length; i++) {
            var item = list.list[i];
            if (item.result.id) {
                targets.push(item.result.id);
            }
        }
        $log.log(targets);
        // Passing them to the disease associations table directive
        $scope.targets = targets;
        $scope.targetList = list.id;
    }

    // TODO: should be done through the cttvLocationState?
    $scope.removeTargetList = function () {
        $location.search("target-list", null);
        // $route.reload();
        // $window.location.reload();
    };

    // reset the filters when loading a new page
    // so we don't see the filters from the previous page...
    cttvFiltersService.reset();

    // Set page filters: this defines the order in which the facets are going to be displayed
    cttvFiltersService.pageFacetsStack([
        //cttvFiltersService.facetTypes.SCORE,        // adds a score facet to the page
        cttvFiltersService.facetTypes.DATATYPES,    // adds a datatypes facet to the page
        cttvFiltersService.facetTypes.PATHWAYS      // adds a pathways facet to the page
    ]);



    // state we want to export to/from the URL
    // var stateId = "view";
    var facetsId = cttvFiltersService.stateId;



    /*
     * Renders page elements based on state from locationStateService
     */
    var render = function(new_state, old_state){

        // here we want to update facets, tabs, etc:
        // 1. first we check if the state of a particular element has changed;
        // 2. if it hasn't changed, and it's undefined (i.e. new=undefined, old=undefined),
        // then it's a page load with no state specified, so we update that element anyway with default values

        // facets changed?
        var facetsPromise = $q(function (resolve) {
            resolve("");
        });
        if( ! _.isEqual( new_state[facetsId], old_state[facetsId] ) || !new_state[facetsId] ){
            $log.log("firing facets here...");
            $log.log(new_state[facetsId]);
            facetsPromise.then(function () {
                return getFacets( new_state[facetsId] );
            });
        }

        // Do we have a target list?
        // $log.log("location is...");
        // $log.log($location.search());
        // var targetList = $location.search()["target-list"];
        var targetList = new_state["target-list"];
        $log.log("target list is...");
        $log.log(targetList);
        if (targetList) {
            var list = cttvLoadedLists.get(targetList);
            var targets = [];
            for (var i=0; i<list.list.length; i++) {
                var item = list.list[i];
                if (item.result.id) {
                    targets.push(item.result.id);
                }
            }
            $log.log(targets);
            // Passing them to the disease associations table directive
            $scope.targets = targets;
            $scope.targetList = list.id;
            facetsPromise.then (function () {
                return getFacets(new_state[facetsId]);
            });
        } else {
            $scope.targets = undefined;
            $scope.targetList = undefined;
            facetsPromise.then (function () {
                return getFacets(new_state[facetsId]);
            });
        }
    };


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
        $log.log("in facets...");
        $log.log(filters);
        // set the filters
        $scope.filters = filters;

        var opts = {
            disease: $scope.search.query,
            outputstructure: "flat",
            facets: true,
            // direct: false,
            size:1
        };

        // Restrict to a gene list
        if ($scope.targets) {
            opts.target = $scope.targets;
        }

        opts = cttvAPIservice.addFacetsOptions(filters, opts);

        return cttvAPIservice.getAssociations(opts).
        then(
            function(resp){
                $log.log("facets response...");
                $log.log(resp);
                // 1: set the facets
                // we must do this first, so we know which datatypes etc we actually have
                cttvFiltersService.updateFacets(resp.body.facets, undefined, resp.body.status);

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



    //
    // on STATECHANGED
    // Set up a listener for the URL changes and when the search change, get new data
    //



    $scope.$on(cttvLocationState.STATECHANGED, function (evt, new_state, old_state) {
        $log.log("statechanged -- ");
        $log.log(old_state);
        $log.log(new_state);
        render( new_state, old_state ); // if there are no facets, no worries, the API service will handle undefined
    });



    //
    // on PAGE LOAD
    //



    cttvUtils.clearErrors();
    $scope.filters = cttvLocationState.getState()[facetsId] || {} ;
    render( cttvLocationState.getState(), cttvLocationState.getOldState() );



}]);
