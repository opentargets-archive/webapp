/* Add to the ot controllers module */
angular.module('otControllers')

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

    .controller('DiseaseAssociationsController', ['$scope', '$location', '$q', 'otApi', 'otFacetsState', 'otDictionary', 'otUtils', 'otLocationState', 'otConfig', 'otConsts', function ($scope, $location, $q, otApi, otFacetsState, otDictionary, otUtils, otLocationState, otConfig, otConsts) {
        'use strict';

        otLocationState.init();   // does nothing, but ensures the otLocationState service is instantiated and ready

        // ---------------------------
        //  Initialiaze
        // ---------------------------


        // the scope view is essentially the state
        $scope.view = {
            t: ['table']    // t = the selected tab
        };

        // state we want to export to/from the URL
        var stateId = 'view';
        var facetsId = otFacetsState.stateId;
        var facetData;
        var defaultPrioritizationDatatypes = [
            otConsts.datatypes.GENETIC_ASSOCIATION.id,
            otConsts.datatypes.SOMATIC_MUTATION.id,
            otConsts.datatypes.KNOWN_DRUG.id,
            otConsts.datatypes.AFFECTED_PATHWAY.id
        ];


        // configure the 'search' object
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

        /*
         * The view is essentially the state for the page;
         * filters are autonomous and do their own business
         */
        var setView = function (obj) {
            // should work also for obj==undefined at page load
            // or if navigating back through browser history

            // define defaults as needed
            obj = obj || {};
            obj.t = obj.t || ['table'];

            // update the scope; only the tab is needed at the moment
            $scope.view.t = obj.t;
            setPageFacets(obj.t[0]);
        };

        // page facets are actually per 'view' and not strictly per page
        var setPageFacets = function (v) {
            var facetsNames = '';
            v = v || 'table';
            if (v === 'table') {
                facetsNames = otConfig.diseaseAssociationsFacets.facets;
            } else if (v === 'priority') {
                facetsNames = otConfig.diseasePrioritizationFacets.facets;

                // if no datatypes specified, then we need to set defaults for the 'Show' facet
                // This is likely NOT the best place nor
                // most elegant way to do this, but will do for now, so
                // set the datatypes here
                var currentfacets = otLocationState.getState()[facetsId];

                if (!currentfacets) {
                    currentfacets = {};
                }
                if (!currentfacets.datatype || currentfacets.datatype.length === 0) {
                    currentfacets.datatype = defaultPrioritizationDatatypes;
                    otLocationState.setStateFor(facetsId, currentfacets, true);
                }
            }

            otFacetsState.setPageFacetNamesFromConfig(facetsNames);
        };


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

            // view changed?
            if (! _.isEqual(new_state[stateId], old_state[stateId]) || !new_state[stateId]) {
                setView(new_state[stateId]);
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

            // if view changed, but facets didn't, then try resetting from current data
            // yes this could be refactored somewhere above here, but it's clear to understand the case here
            if (
                (! _.isEqual(new_state[stateId], old_state[stateId]) || !new_state[stateId])
                && !(!_.isEqual(new_state[facetsId], old_state[facetsId]) || !new_state[facetsId])
            ) {
                otFacetsState.updatePageFacetsFromApiData(facetData, otConfig.diseaseAssociationsFacets.count);
            }
        };


        /*
         * Get data to populate the table.
         *
         * @param filters: object of filtering categories, e.g. 'datatypes'; each one is either a string or an array of strings
         * Example:
         * filters = {
         *      datatypes: 'known_drug',
         *      pathway_type: [ 'REACT_111102', 'REACT_116125', 'REACT_6900' ]
         * }
         * getFacets(filters);
         */
        var getFacets = function (filters, targetArray) {
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

            opts = otApi.addFacetsOptions(filters, opts);
            var queryObject = {
                method: 'POST',
                params: opts
            };

            return otApi.getAssociations(queryObject)
                .then(function (resp) {
                    // set the total?
                    $scope.search.total = resp.body.total;

                    if (resp.body.total) {
                        // TODO Change this to POST request
                        facetData = resp.body.facets;
                        otFacetsState.updatePageFacetsFromApiData(facetData, otConfig.diseaseAssociationsFacets.count);

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
                        otApi.getDisease(profileOpts)
                            .then(function (profileResp) {
                                $scope.search.label = profileResp.body.label;
                            });
                    }
                }, otApi.defaultErrorHandler);
        };
        $scope.getFacets = getFacets;

        /*
         * Update function passes the current view (state) to the URL
         * Also the current status for excluding cancers is updated
         */
        function update () {
            otLocationState.setStateFor(stateId, $scope.view);
        }


        /*
         * Called from the tables in the HTML, this sets the active tab id.
         * Valid tabs are: 'bubbles', 'table', 'tree'.
         */
        $scope.setActiveTab = function (tab) {
            $scope.view.t[0] = tab;
            update();
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
        setPageFacets();
        $scope.filters = otLocationState.getState()[facetsId] || {};
        render(otLocationState.getState(), otLocationState.getOldState());
    }]);
