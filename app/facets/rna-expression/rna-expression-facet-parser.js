angular.module('otFacets')
    .factory('rnaExpressionFacetParser', ['otFilterTypes', function (otFilterTypes) {
        var parse = function (facetName, apiData, facetsGlobal, countsKey, options) {
            /**
     * Create an array of boolean filters (each of which provides the needed
     * state and methods for a checkbox)
     */
            var tissueFilters;
            var anatomicalSystemFilters = [];
            var organFilters = [];
            var rnaLevel = 0;
            var rnaLevelHasChanged = false;
            var rnaLevelKey = 'rna_expression_level';
            var rnaTissueKey = 'rna_expression_tissue';
            var histogramData;

            var getExistingFilter = function (key, flatFilters) {
                var match = flatFilters.filter(function (filter) {
                    return filter.key === key;
                });
                return match.length > 0 ? match[0] : null;
            };

            /**
     * constructFilters
     * Parse the API data and recursively build a nested filter structure.
     */
            var constructTissueFilters = function () {
                tissueFilters = apiData[rnaTissueKey].buckets.map(function (bucket) {
                    var filter = new otFilterTypes.NestedBooleanFilter({
                        key: bucket.key,
                        label: bucket.key,
                        count: bucket[countsKey].value,
                        enabled: true,
                        checked: false,
                        children: null,
                        facetName: rnaTissueKey
                    }, facetsGlobal);


                    var tissue = bucket.data;

                    if (tissue) {
                        // Fix label
                        filter.label = tissue.label;

                        // Update anatomical systems
                        tissue.anatomical_systems.forEach(function (anatomical_system) {
                            // get (and create if necessary)
                            var as_filter = getExistingFilter(anatomical_system, anatomicalSystemFilters);
                            if (!as_filter) {
                                as_filter = constructAnatomicalSystemFilter(anatomical_system);
                            }

                            // add as parent to tissue filter
                            filter.addParent(as_filter);

                            // add tissue filter as child
                            as_filter.children.push(filter);
                        });

                        // Update organs
                        tissue.organs.forEach(function (organ) {
                            // get (and create if necessary)
                            var organ_filter = getExistingFilter(organ, organFilters);
                            if (!organ_filter) {
                                organ_filter = constructOrganFilter(organ);
                            }

                            // add as parent to tissue filter
                            filter.addParent(organ_filter);

                            // add tissue filter as child
                            organ_filter.children.push(filter);
                        });
                    }

                    return filter;
                });

                // Note: organ/anatomical systems do not have counts (not sent by api currently)
                //       so set to 1 for now

                // Sort organ/anatomical systems alphabetically
                var labelComparer = function (a, b) {
                    if (a.label < b.label) { return -1; } else if (a.label > b.label) { return 1; } else { return 0; }
                };
                anatomicalSystemFilters.sort(labelComparer);
                organFilters.sort(labelComparer);
            };

            var constructAnatomicalSystemFilter = function (anatomicalSystem) {
                // create
                var filter = new otFilterTypes.NestedBooleanFilter({
                    key: anatomicalSystem,
                    label: anatomicalSystem,
                    count: 1,
                    enabled: true,
                    checked: false,
                    children: [],
                    facetName: rnaTissueKey,
                    hideCount: true,
                    shouldToggleChildren: true
                }, facetsGlobal);

                // store with other anatomical system filters
                anatomicalSystemFilters.push(filter);

                return filter;
            };

            var constructOrganFilter = function (organ) {
                // create
                var filter = new otFilterTypes.NestedBooleanFilter({
                    key: organ,
                    label: organ,
                    count: 1,
                    enabled: true,
                    checked: false,
                    children: [],
                    facetName: rnaTissueKey,
                    hideCount: true,
                    shouldToggleChildren: true
                }, facetsGlobal);

                // store with other anatomical system filters
                organFilters.push(filter);

                return filter;
            };

            /**
     * Toggle method for all filters
     */
            var setAllChecked = function (value) {
                // update state
                tissueFilters.forEach(function (filter) {
                    filter.setChecked(value);
                });
                // global update
                facetsGlobal.update();
            };

            var constructHistogram = function () {
                // ignores -1, 0 buckets
                histogramData = apiData[rnaLevelKey].buckets
                    .filter(function (bucket) {
                        return bucket.key > 0;
                    })
                    .map(function (bucket) {
                        return {
                            key: bucket.key,
                            value: bucket[countsKey].value
                        };
                    });
            };

            /**
     * Serialize this facet for the url state.
     * @param {object} urlObj - The URL object. This object can be mutated and must
     *                          then be returned.
     */
            var serialize = function (urlObj) {
                // tissues to serialize
                var tissueList = tissueFilters.filter(function (filter) {
                    return filter.checked;
                }).map(function (filter) {
                    return filter.key;
                });

                // special cases
                var shouldDeselectAllTissues = (tissueList.length > 0) &&
                                     (rnaLevel === 0) && rnaLevelHasChanged;
                var shouldSetLevelToOne = (tissueList.length > 0) &&
                                (rnaLevel === 0) && !rnaLevelHasChanged;
                if (shouldDeselectAllTissues) {
                    // tissues - pass
                    // level
                    if (rnaLevel > 0) {
                        urlObj[rnaLevelKey] = rnaLevel;
                    }
                } else if (shouldSetLevelToOne) {
                    // tissues
                    urlObj[rnaTissueKey] = tissueList;
                    // level
                    urlObj[rnaLevelKey] = 1;
                } else {
                    // tissues
                    urlObj[rnaTissueKey] = tissueList;
                    // level
                    if (rnaLevel > 0) {
                        urlObj[rnaLevelKey] = rnaLevel;
                    }
                }

                // reset
                rnaLevelHasChanged = false;

                return urlObj;
            };

            /**
     * Initialize
     */
            var init = function () {
                // setup the tissue filters from the api data (structure)
                constructTissueFilters();

                // build the structure required for the histogram rendering
                constructHistogram();

                // load the url state (update checked statuses etc.)
                deserialize(facetsGlobal.getUrlObject());
            };

            /**
     * Check if a boolean filter is checked according to the URL object.
     * Note that the key is an number, but the urlObj may be a string (
     * ie. 6 vs '6')
     * @param {object} urlObj - Object representation of the URL
     * @param {string} key - Key of the filter to check
     */
            var filterIsChecked = function (urlObj, key) {
                return (urlObj &&
                urlObj[rnaTissueKey] &&
                (urlObj[rnaTissueKey] === ('' + key) ||
                 urlObj[rnaTissueKey].indexOf('' + key) >= 0));
            };

            /**
     * setLevel
     * Set the level of the RNA expression filter.
     * @param {number} value
     */
            var setLevel = function (value) {
                rnaLevel = value;
                rnaLevelHasChanged = true;
                facetsGlobal.update();
            };

            /**
     * Deserialize the url state and update the facet state.
     * @param {object} urlObj - The URL object
     */
            var deserialize = function (urlObj) {
                // tissues
                tissueFilters.forEach(function (filter) {
                    filter.setChecked(filterIsChecked(urlObj, filter.key));
                });
                // level
                if (urlObj && urlObj[rnaLevelKey]) {
                    rnaLevel = +urlObj[rnaLevelKey];
                } else {
                    rnaLevel = 0;
                }
            };

            init();

            // Return the Facet object
            return {
                filters: tissueFilters,
                anatomicalSystemFilters: anatomicalSystemFilters,
                organFilters: organFilters,
                hierarchy: organFilters,
                groupTissuesBy: 'organs',
                level: rnaLevel,
                histogramData: histogramData,
                min: 1,
                max: 10,
                serialize: serialize,
                deserialize: deserialize,
                setAllChecked: setAllChecked,
                setLevel: setLevel,
                options: options
            };
        };

        return {
            parse: parse
        };
    }]);
