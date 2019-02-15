angular.module('otFacets')
    .factory('datatypeFacetParser', ['otFilterTypes', 'otConsts', 'otUtils', function (otFilterTypes, otConsts, otUtils) {
        var parse = function (facetName, apiData, facetsGlobal, countsKey, options) {
            var datatypeFilters = [];
            var datasourceFilters = [];
            var nestedFilters;
            var summary = [''];

            /**
             * constructFilters
             * Parse the API data and recursively build a nested filter structure.
             * @param {object} data - The API data
             */
            var constructFilters = function (data, datatypeFilters, datasourceFilters) {

                // iterate all the datatypes (regardless of whether in api response)
                return otConsts.datatypesOrder.map(function (datatypeName) {
                    // datatypeKey;
                    var dt = otConsts.datatypes[datatypeName];
                    // grab the data bucket
                    var bucket = data.buckets.filter(function (b) {
                        return b && (b.key) && (b.key === dt.id);
                    })[0] || null;

                    // create a new filter (based on the data)
                    var filter = new otFilterTypes.NestedBooleanFilter({
                        key: dt.id,
                        label: otUtils.getDatatypeById(dt.id).label || '', // otDictionary[datatypeKey.toUpperCase()] || '',
                        count: (bucket) ? bucket[countsKey].value : 0,
                        enabled: (bucket !== null),
                        checked: false,
                        children: null,
                        showExpanded: dt.showExpanded,
                        facetName: facetName
                    }, facetsGlobal);
                    var children = null;
                    if (bucket && bucket.datasource) {
                        children = constructDatasourceFilters(dt.id, bucket.datasource, parent, datasourceFilters);
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
                        // label: otDictionary[otConsts.invert(bucket.key)] || bucket.key,
                        label: otUtils.getDatasourceById(bucket.key).label || bucket.key,
                        count: bucket[countsKey].value,
                        enabled: (bucket !== null),
                        checked: false,
                        children: null,
                        customLabelStylingClass: otUtils.getDatasourceById(bucket.key).customLabelStylingClass,
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
                urlObj[facetName] = urlObj[facetName] || datatypeFilters.filter(function (filter) {
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
                summary[0] = getSummary();
            };

            var getSummary = function () {
                // generate a summary string for the facet
                var countDatatype = datatypeFilters.filter(function (f) {
                    return f.checked;
                }).length;
                var countDatasource = datasourceFilters.filter(function (f) {
                    return f.checked;
                }).length;
                var count = countDatatype + countDatasource;
                return count ? count + ' checked' : '';
            };

            init();

            // Return the Facet object
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
