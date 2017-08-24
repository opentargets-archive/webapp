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

    .controller('diseaseAssociationsCtrl', ['$scope', '$location', '$q', 'otAPIservice', 'cttvFiltersService', 'otDictionary', 'otUtils', 'otLocationState', 'otConfig', function ($scope, $location, $q, otAPIservice, cttvFiltersService, otDictionary, otUtils, otLocationState, otConfig) {
        'use strict';

        otLocationState.init();   // does nothing, but ensures the otLocationState service is instantiated and ready


        // ---------------------------
        //  Initialiaze
        // ---------------------------


        // configure the "search" object
        // to be exposed via scope
        $scope.search = {
            query: $location.path().split('/')[2],
            label: '',
            filename: '',
            total: '...'
        };

        // Initialise possible targets and targetLists to filter the table
        $scope.targets = [];
        $scope.targetLists = [];

        // TODO: should be done through the otLocationState?
        $scope.removeTargetLists = function () {
            $location.search('targets', null);
            // TODO: Also remove the filter by target list feature
            // $scope.removeTargets();
            // $route.reload();
            // $window.location.reload();
        };

        // reset the filters when loading a new page
        // so we don't see the filters from the previous page...
        cttvFiltersService.reset();

        // Set page filters: this defines the order in which the facets are going to be displayed
        // as per config JSON
        cttvFiltersService.pageFacetsStack(otConfig.diseaseAssociationsFacets.facets);


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
                targets = otUtils.expandTargetIds(new_state.targets.split(','));
            }

            if (targets) {
                // Passing them to the disease associations table directive
                $scope.targets = targets;
            } else {
                $scope.targets = [];
            }

            // facets changed?
            var facetsPromise = $q(function (resolve) {
                resolve('');
            });
            if (!_.isEqual(new_state[facetsId], old_state[facetsId]) || !new_state[facetsId]) {
                facetsPromise.then(function () {
                    return $scope.getFacets(new_state[facetsId], $scope.targets);
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
        $scope.getFacets = function (filters, targetArray) {
            // set the filters
            $scope.filters = filters;

            var opts = {
                disease: [$scope.search.query],
                outputstructure: 'flat',
                facets: 'true',
                size: 1
            };

            if (targetArray && targetArray.length) {
                opts.target = targetArray;
            }

            opts = otAPIservice.addFacetsOptions(filters, opts);
            var queryObject = {
                method: 'POST',
                params: opts
            };

            return otAPIservice.getAssociations(queryObject)
                .then(function (resp) {
                    // set the total?
                    $scope.search.total = resp.body.total;

                    if (resp.body.total) {
                        // TODO Change this to POST request
                        cttvFiltersService.updateFacets(resp.body.facets, otConfig.diseaseAssociationsFacets.count);

                        // The label of the diseases in the header
                        $scope.search.label = resp.body.data[0].disease.efo_info.label;

                        // The filename to download
                        $scope.search.filename = otDictionary.EXP_DISEASE_ASSOC_LABEL + resp.body.data[0].disease.efo_info.label.split(' ').join('_');
                    } else {
                        // No associations for this disease. Check if there is a profile page
                        var profileOpts = {
                            method: 'GET',
                            params: {
                                code: $scope.search.query
                                // TODO: include fields here once they are available in the profile endpoint
                            }
                        };
                        otAPIservice.getDisease(profileOpts)
                            .then(function (profileResp) {
                                $scope.search.label = profileResp.body.label;
                            });
                    }
                }, otAPIservice.defaultErrorHandler);
        };

        //
        // on STATECHANGED
        // Set up a listener for the URL changes and when the search change, get new data
        //

        $scope.$on(otLocationState.STATECHANGED, function (evt, new_state, old_state) {
            render(new_state, old_state); // if there are no facets, no worries, the API service will handle undefined
        });


        //
        // on PAGE LOAD
        //
        otUtils.clearErrors();
        $scope.filters = otLocationState.getState()[facetsId] || {};
        render(otLocationState.getState(), otLocationState.getOldState());
    }]);
