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

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvFiltersService', 'cttvDictionary', 'cttvUtils', 'cttvLocationState', 'cttvLoadedLists', '$q', '$route', function ($scope, $location, $log, cttvAPIservice, cttvFiltersService, cttvDictionary, cttvUtils, cttvLocationState, cttvLoadedLists, $q, $route) {

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

    // Initialise possible targets and targetLists to filter the table
    $scope.targets = [];
    $scope.targetLists = [];

    var targetList = $location.search()["target-list"];
    // var targetList = new_state["target-list"];
    if (targetList) {
        var list = cttvLoadedLists.get(targetList);
        var targets = [];
        for (var i=0; i<list.list.length; i++) {
            var item = list.list[i];
            if (item.result.id) {
                targets.push(item.result.id);
            }
        }
        // Passing them to the disease associations table directive
        // $scope.targets = _.concat($scope.targets, targets);
        // $scope.targetLists = _.concat($scope.targetLists, list.id);
        // $log.log("targets after loading the " + list.id + " list");
        // $log.log($scope.targets);
        // $log.log("targetLists after loading the " + list.id + " list");
        // $log.log($scope.targetLists);
        // $scope.targets = targets;  // TODO: I think this is not needed, in render $scope.targets is set
        // $scope.targetList = list.id; // TODO: I think this is not needed, in render $scope.targetList is set
    }

    // TODO: should be done through the cttvLocationState?
    $scope.removeTargetLists = function () {
        $location.search("target-list", null);
        $location.search("targets", null);
        // TODO: Also remove the filter by target list feature
        // $scope.removeTargets();
        // $route.reload();
        // $window.location.reload();
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


        // Do we have targets?
        var targets;
        if (new_state.targets) {
            targets = new_state.targets.target;
        }

        // if (!_.isEqual(new_state[facetsId], old_state[facetsId]) || !new_state[facetsId]) {
        //     $scope.getFacets(new_state[facetsId],$scope.target.targetArray);
        //
        // }


        // Do we have a target list?
        // TODO: This should go into the facets service
        var targetList = new_state["target-list"];
        if (targetList) {
            var list = cttvLoadedLists.get(targetList);
            targets = [];
            for (var i=0; i<list.list.length; i++) {
                var item = list.list[i];
                if (item.result.id) {
                    targets.push(item.result.id);
                }
            }
        }

        if (targets) {
            // Passing them to the disease associations table directive
            $scope.targets = targets;
            $scope.targetLists = []; // Name of the list, but we don't know it

            // facetsPromise.then (function () {
            //     return $scope.getFacets(new_state[facetsId], $scope.targets);
            // });
        } else {
            $scope.targets = [];
            $scope.targetLists = [];
            // facetsPromise.then (function () {
            //     return $scope.getFacets(new_state[facetsId]);
            // });
        }

        // facets changed?
        var facetsPromise = $q(function (resolve) {
            resolve("");
        });
        if (!_.isEqual(new_state[facetsId], old_state[facetsId]) || !new_state[facetsId]) {
            facetsPromise.then(function () {
                return $scope.getFacets(new_state[facetsId], $scope.targets);
            });
        }

    };

    // $scope.targets = {};
    // $scope.target.targetArray = [];//turns out 2 way binding does not work that well on arrays


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
    $scope.getFacets = function (filters, targetArray) {
        // set the filters
        $scope.filters = filters;

        var opts = {
            disease: [$scope.search.query],
            outputstructure: "flat",
            facets: "true",
            size:1
        };

        // if ($scope.targets && $scope.targets.length) {
        //     opts.target = $scope.targets;
        // }

        if (targetArray && targetArray.length) {
            opts.target = targetArray;
        }

        opts = cttvAPIservice.addFacetsOptions(filters, opts);
        var queryObject = {
            method: 'POST',
            params: opts
        };

        return cttvAPIservice.getAssociations(queryObject)
        .then(function(resp) {
            // set the total?
            $scope.search.total = resp.body.total;

            if (resp.body.total) {
                //TODO Change this to POST request
                cttvFiltersService.updateFacets(resp.body.facets, undefined, resp.body.status);

                // The label of the diseases in the header
                $scope.search.label = resp.body.data[0].disease.efo_info.label;

                // The filename to download
                $scope.search.filename = cttvDictionary.EXP_DISEASE_ASSOC_LABEL + resp.body.data[0].disease.efo_info.label.split(" ").join("_");
            } else {
                // No associations for this disease. Check if there is a profile page
                var profileOpts = {
                    method: 'GET',
                    params: {
                        code: $scope.search.query
                        // TODO: include fields here once they are available in the profile endpoint
                    }
                };
                cttvAPIservice.getDisease(profileOpts)
                    .then (function (profileResp) {
                        $scope.search.label = profileResp.body.label;
                    });
            }
        }, cttvAPIservice.defaultErrorHandler);

    };

    //
    // on STATECHANGED
    // Set up a listener for the URL changes and when the search change, get new data
    //

    $scope.$on(cttvLocationState.STATECHANGED, function (evt, new_state, old_state) {
        // $log.log("locationState statechanged!");
        render(new_state, old_state); // if there are no facets, no worries, the API service will handle undefined
    });



    //
    // on PAGE LOAD
    //
    cttvUtils.clearErrors();
    $scope.filters = cttvLocationState.getState()[facetsId] || {};
    render(cttvLocationState.getState(), cttvLocationState.getOldState());

}]) ;
