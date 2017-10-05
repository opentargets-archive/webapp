'use strict';


/**
 * Controller for the little search box
 */
angular.module('otControllers')

    .controller('SearchBoxController', ['$scope', '$location', '$window', '$document', '$element', 'otApi', 'otConsts', '$q', 'otUtils', 'otLoadedLists', function ($scope, $location, $window, $document, $element, otApi, otConsts, $q, otUtils, otLoadedLists) {
        var APP_SEARCH_URL = 'search';
        var APP_EVIDENCE_URL = 'evidence';
        var APP_AUTOCOMPLETE_URL = 'autocomplete';

        $scope.search = {
            query: {
                text: ''
            },
            results: {

            },
            progress: false
        };


        $scope.hasFocus = true;


        //
        // initialize the handling of clicks outside the panel to close the suggestions panel itself
        //

        /*
         * Set the search results to nothing to hide the suggestion panel:
         * this is achieved by attaching this handler to clicks anywhere in the page document
         * (see below to make more sense of it)
         */
        var dismissClickHandler = function (evt) {
            if ($element !== evt.target) {
                $scope.hasFocus = true;
                $scope.search.results = {};
                $scope.$apply();
                $document.unbind('click', dismissClickHandler);
            }
        };

        // remove the click handler when the contrller/scope is destroyed
        // (this won't happen since the search box is there on every page)
        $scope.$on('$destroy', function () {
            $document.unbind('click', dismissClickHandler);
        });

        // We want clicks on the actual panel to, say, click thrugh,
        // and not bubble up to the document and close the panel,
        // so we stop propagation
        $element.bind('click', function (evt) {
            evt.stopPropagation();
        });


        /**
         * Get suggestions for typeahead
         * @param {String} query
         * @returns {Object} promise object with success() or error(), or null
         */
        /*
         * To avoid having the problem of slower api calls coming *after* quicker ones launched after we just make sure the order is respected
         * TODO: It may be better to discard the previous one
         */
        var searchPromise = $q(function (res, rej) {
            res();
        });
        $scope.getSuggestions = function (query) {
            // clear the data here, so the box disappears or the content is cleared...
            $scope.search.results = {};

            if (query.length > 1) {
                $scope.search.progress = true;  // flag for search in progress
                $document.bind('click', dismissClickHandler);

                // fire the typeahead search
                return searchPromise.then(function () {
                    return otApi.getQuickSearch(
                        {
                            params: {
                                q: $scope.search.query.text,
                                size: 3
                            },
                            trackCall: false,
                            method: 'GET'
                        })
                        .then(
                            function (resp) {
                                // $log.info(resp);
                                $scope.search.results = parseResponseData(resp.body.data);  // store the results
                                var besthit = $scope.search.results.besthit;
                                if (besthit) {
                                    otUtils.addMatchedBy(besthit);
                                }
                            }, otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            $scope.search.progress = false;
                        });
                });
            } else {
                $scope.search.progress = false;
            }

            return null;
        };


        /**
         * Checks if the current search has got any results.
         * @returns {boolean} true if the panel currently has results.
         */
        $scope.hasResults = function () {
            return Object.keys($scope.search.results).length > 0;
        };


        /**
         * Checks if the suggestions panel should be visible based on focus, number of results and length of the query;
         * @returns {boolean} true if the panel is (supposed to) be visible
         */
        $scope.isVisible = function () {
            var v = $scope.hasFocus && $scope.hasResults() && $scope.search.query.text.length > 1;
            return v;
        };


        /*
         * Set the URL to specified string.
         * This is used internally to implement a href (link)
         * @param {String} url
         */
        var setLocation = function (url) {
            if ($location.url() !== url) {
                $location.url(url);
            }
        };


        /*
         * Execute some pre-processing of the data
         */
        var parseResponseData = function (data) {
            if (!data.disease) {
                data.disease = [];
            }
            if (!data.target) {
                data.target = [];
            }
            if (!data.besthit) {
                data.besthit = null;
            }
            // check the EFOs path and remove excess data
            data.disease.forEach(function (efo) {
                // first we don't want that "CTTV Root" thingy at the beginning, if it's there
                if (efo.data.efo_path_labels[0][0] === otConsts.CTTV_ROOT_NAME && efo.data.efo_path_labels[0].length === efo.data.efo_path_codes[0].length) {
                    efo.data.efo_path_labels[0] = efo.data.efo_path_labels[0].slice(1);
                    efo.data.efo_path_codes[0] = efo.data.efo_path_codes[0].slice(1);
                }

                // then we only want to show the last 3 elements (labels and codes)
                // we store it as a new array
                efo.data.efo_path = efo.data.efo_path_labels[0].map(function (v, i) {
                    return {label: v, code: efo.data.efo_path_codes[0][i]};
                }).slice(-3); // the slicing at the end is not optimal, but safe :P
            });

            return data;
        };


        /**
         * Public method to link to association page for either a gene or a disease
         * @param {Object} s - config objects:
         *  - type {String} : either "target" or "disease", determins which page we link to
         *  - q {String} : the query for the actual gene or disease
         *  - label {String} : this will be deprecated in the future;
         *                     it sets the query label for the landing page, but it will be no longer needed
         *                     since that is now returned by the API.
         */
        $scope.linkTo = function (s) {
            // parse the options:
            if (s.type.toLowerCase() === 'target') {
                $location.url('/target/' + s.q + '/associations');
            } else if (s.type.toLowerCase() === 'disease') {
                $location.url('/disease/' + s.q + '/associations');
            }

            $scope.search.query.text = '';
        };


        /**
         * Sets a new search via the URL
         */
        $scope.setSearch = function () {
            // show search results page, nice and easy...
            if ($location.url() !== APP_SEARCH_URL) {
                $location.url(APP_SEARCH_URL);
            }
            $location.search('src=q:' + $scope.search.query.text);


            // reset the query field:
            // the search result page should probably still show this, the problem is that the scope of this search box is separate
            // so if we then go to the gene, or association page, this would still show the original query...
            // So, for now we RESET the field, then I'll think about it.
            $scope.search.query.text = '';
        };

        // See if there is any loaded list
        $scope.loadedLists = otLoadedLists.getAll().length;

        /**
         * NOTE: This is only to be called by the homepage only
         * @params id: the id of the element to scroll to (remember to add hash #)
         * @params p: extra padding to be added
         */
        $scope.onFocusHandler = function (id, p, mobileonly) {
            if (mobileonly && $window.innerWidth > 768) {
                return;
            }
            var sb = $(id);
            if (sb) {
                $window.scrollTo(0, sb.offset().top - p);
            }
        };
    }]);
