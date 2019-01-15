angular.module('otFacets')
    .factory('tractabilityFacetParser', ['otFilterTypes', function (otFilterTypes) {
        /**
         * The main parse method exposed by the service
         * @param {String} facetName
         * @param {Object} apiData
         * @param {Object} facetsGlobal
         * @param {String} countsKey
         * @param {Object} options
         */
        var parse = function (facetName, apiData, facetsGlobal, countsKey, options) {
            // The API returns tractability facets as a flat list (i.e. not nested).
            // Every bucket key is prepened with 'smallmolecule' or 'antibody':
            // we use this to create and populate a nested filters structure.

            var tractabilityFilters = [];   // processed filters as returned by API
            var nestedFilters;              // processed nested filters
            var summary = [''];

            // Define main tractability categories.
            var tractabilityCategories = [
                {
                    label: 'small molecule',
                    key: 'smallmolecule'
                },
                {
                    label: 'antibody',
                    key: 'antibody'
                }
            ];

            // Define sub categories labels, mapped to buckets keys
            var categoriesLabels = {
                smallmolecule_clinical_precedence: 'Clinical precedence',
                smallmolecule_discovery_precedence: 'Discovery precedence',
                smallmolecule_predicted_tractable: 'Predicted tractable',
                antibody_clinical_precedence: 'Clinical precedence',
                antibody_predicted_tractable_med_low_confidence: 'Predicted tractable (mid-low confidence)',
                antibody_predicted_tractable_high_confidence: 'Predicted tractable (high confidence)'
            };


            /**
             * constructFilters
             * Parse the API data and recursively build a nested filter structure.
             * @param {object} data - The API data
             */
            var constructFilters = function (data, tractabilityFilters) {
                return tractabilityCategories.map(function (tc) {
                    // filter filters by category
                    var tcfilters = data.buckets.filter(function (f) {
                        return f.key.split('_')[0] === tc.key;
                    });

                    // create filter for this top category
                    var filter = new otFilterTypes.NestedBooleanFilter({
                        key: tc.key,
                        label: tc.label,
                        count: tcfilters.length,
                        hideCount: true,
                        enabled: tcfilters.length > 0,
                        checked: false,
                        shouldToggleChildren: true,
                        facetName: facetName,
                        children: tcfilters.map(function (tb) {
                            return new otFilterTypes.NestedBooleanFilter({
                                key: tb.key,
                                label: categoriesLabels[tb.key] || tb.key.split('_').slice(1).join(' '),
                                count: tb[countsKey].value,
                                enabled: (tb !== null),
                                checked: false,
                                children: null,
                                facetName: facetName
                            }, facetsGlobal);
                        })
                    }, facetsGlobal);

                    // store all the children filters to tractabilityFilters array
                    filter.children.forEach(function (f) { tractabilityFilters.push(f); });

                    // return the created filter
                    return filter;
                });
            };


            /**
             * Check if a boolean filter is checked according to the URL object.
             * Note that the key is an number, but the urlObj may be a string (
             * ie. 6 vs '6')
             * @param {object} urlObj - Object representation of the URL
             * @param {string} key - Key of the filter to check
             */
            var filterIsChecked = function (urlObj, facetName, key) {
                return (urlObj &&
                urlObj[facetName] &&
                (urlObj[facetName] === ('' + key) ||
                 urlObj[facetName].indexOf('' + key) >= 0));
            };


            /**
             * Serialize this facet for the url state.
             * @param {object} urlObj - The URL object. This object can be mutated and must
             *                          then be returned.
             */
            var serialize = function (urlObj) {
                urlObj[facetName] = urlObj[facetName] || tractabilityFilters.filter(function (filter) {
                    return filter.checked;
                }).map(function (filter) {
                    return filter.key;
                });
                return urlObj;
            };


            /**
             * Deserialize the url state and update the facet state.
             * @param {object} urlObj - The URL object
             */
            var deserialize = function (urlObj) {
                // update all tractability filters first
                tractabilityFilters.forEach(function (filter) {
                    filter.setChecked(filterIsChecked(urlObj, 'tractability', filter.key));
                });

                // then the two top categories 'smallmolecule' and 'antibody' based on children (tractability filters)
                nestedFilters.forEach(function (f) {
                    f.checked = (f.children.length !== 0) && (f.children.filter(function (c) {
                        return c.checked;
                    }).length === f.children.length);
                });

                summary[0] = getSummary();
            };


            /**
             * Generate a summary string for the facet
             */
            var getSummary = function () {
                var countTractability = tractabilityFilters.filter(function (f) {
                    return f.checked;
                }).length;

                return countTractability ? countTractability + ' checked' : '';
            };


            /**
             * Initialize
             */
            var init = function () {
                // setup the nested filters from the api data (structure)
                nestedFilters = constructFilters(apiData[facetName], tractabilityFilters);

                // load the url state (update checked statuses etc.)
                // note: this seems to be invoked already on facets load,
                // so commenting back in the line below would cause for it to be fired twice
                // deserialize(facetsGlobal.getUrlObject());
            };


            /**
             * Toggle method for all filters
             */
            var setAllChecked = function (value) {
                // update state
                tractabilityFilters.forEach(function (filter) {
                    filter.setChecked(value);
                });
                // global update
                facetsGlobal.update();
            };


            init();


            // Return the Facet parser object
            return {
                summary: summary,
                filters: nestedFilters,
                serialize: serialize,
                deserialize: deserialize,
                setAllChecked: setAllChecked,
                options: options
            };
        };

        return {
            parse: parse
        };
    }]);
