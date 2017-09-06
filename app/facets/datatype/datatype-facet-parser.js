angular.module('otFacets')
    .factory('datatypeFacetParser', ['otFilterTypes', 'otDictionary', 'cttvConsts', function (otFilterTypes, otDictionary, cttvConsts) {
        var parse = function (facetName, apiData, facetsGlobal, countsKey, options) {
            var datatypeFilters = [];
            var datasourceFilters = [];
            var nestedFilters;
            var allDatatypes = [
                cttvConsts.datatypes.GENETIC_ASSOCIATION,
                cttvConsts.datatypes.SOMATIC_MUTATION,
                cttvConsts.datatypes.KNOWN_DRUG,
                cttvConsts.datatypes.AFFECTED_PATHWAY,
                cttvConsts.datatypes.RNA_EXPRESSION,
                cttvConsts.datatypes.LITERATURE,
                cttvConsts.datatypes.ANIMAL_MODEL
            ];

            /**
     * constructFilters
     * Parse the API data and recursively build a nested filter structure.
     * @param {object} data - The API data
     */
            var constructFilters = function (data, datatypeFilters, datasourceFilters) {
                // iterate all the datatypes (regardless of whether in api response)
                return allDatatypes.map(function (datatypeKey) {
                    // grab the data bucket
                    var bucket = data.buckets.filter(function (b) {
                        return b && (b.key) && (b.key === datatypeKey);
                    })[0] || null;

                    // create a new filter (based on the data)
                    var filter = new otFilterTypes.NestedBooleanFilter({
                        key: datatypeKey,
                        label: otDictionary[datatypeKey.toUpperCase()] || '',
                        count: (bucket) ? bucket[countsKey].value : 0,
                        enabled: (bucket !== null),
                        checked: false,
                        children: null,
                        facetName: facetName
                    }, facetsGlobal);

                    var children = null;
                    if (bucket && bucket.datasource) {
                        children = constructDatasourceFilters(datatypeKey, bucket.datasource, parent, datasourceFilters);
                    }
                    filter.children = children;

                    // add to the flat list
                    datatypeFilters.push(filter);

                    // return the created filter
                    return filter;
                });
            };

            var constructDatasourceFilters = function (datatypeKey, data, parent, datasourceFilters) {
                return data.buckets.map(function (bucket) {
                    var filter = new otFilterTypes.NestedBooleanFilter({
                        key: bucket.key,
                        label: otDictionary[cttvConsts.invert(bucket.key)] || bucket.key,
                        count: bucket[countsKey].value,
                        enabled: (bucket !== null),
                        checked: false,
                        children: null,
                        facetName: facetName
                    }, facetsGlobal);

                    // add to the flat list
                    datasourceFilters.push(filter);

                    // return the created filter
                    return filter;
                });
            };

            /**
     * Toggle method for all filters
     */
            var setAllChecked = function (value) {
                // update state
                nestedFilters.forEach(function (filter) {
                    filter.setChecked(value);
                });
                // global update
                facetsGlobal.update();
            };

            /**
     * Serialize this facet for the url state.
     * @param {object} urlObj - The URL object. This object can be mutated and must
     *                          then be returned.
     */
            var serialize = function (urlObj) {
                // datatype
                urlObj[facetName] = datatypeFilters.filter(function (filter) {
                    return filter.checked;
                }).map(function (filter) {
                    return filter.key;
                });
                // datasource
                urlObj.datasources = datasourceFilters.filter(function (filter) {
                    return filter.checked;
                }).map(function (filter) {
                    return filter.key;
                });
                return urlObj;
            };

            /**
     * Initialize
     */
            var init = function () {
                // setup the nested filters from the api data (structure)
                nestedFilters = constructFilters(apiData[facetName], datatypeFilters, datasourceFilters);

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
            var filterIsChecked = function (urlObj, facetName, key) {
                // TODO: need to check if datatype or source and use in place of facetName
                return (urlObj &&
                urlObj[facetName] &&
                (urlObj[facetName] === ('' + key) ||
                 urlObj[facetName].indexOf('' + key) >= 0));
            };

            /**
     * Deserialize the url state and update the facet state.
     * @param {object} urlObj - The URL object
     */
            var deserialize = function (urlObj) {
                // datatype
                datatypeFilters.forEach(function (filter) {
                    filter.setChecked(filterIsChecked(urlObj, 'datatype', filter.key));
                });
                // datasource
                datasourceFilters.forEach(function (filter) {
                    filter.setChecked(filterIsChecked(urlObj, 'datasources', filter.key));
                });
            };

            init();

            // Return the Facet object
            return {
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
