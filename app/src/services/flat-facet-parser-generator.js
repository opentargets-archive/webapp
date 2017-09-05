angular.module('facets')
    .factory('flatFacetParserGenerator', ['$log', 'cttvFilterTypesService', function ($log, cttvFilterTypesService) {
        var generate = function (useKeyAsLabel) {
            /**
     * Parse function.
     * 
     * Each FacetParser service MUST expose a parse function. This function
     * parses an apiData object (for the specific facetName), and should
     * return a Facet object.
     * 
     * Facet objects contain the state and methods for the associated directive,
     * and are therefore quite flexible (so that the directives can be flexible).
     * However, the service responsible will expect all Facet objects to expose
     * serialize and deserialize methods, which are used to map the state to or
     * from the url object.
     * 
     * @param {string} facetName - The name of the facet (eg. rna_expression_level)
     * @param {object} apiData - The data object for this facet (from the API)
     * @param {object} facetsGlobal - A global object (exposing methods for eg. updating all facets)
     */
            var parse = function (facetName, apiData, facetsGlobal, countsKey, options) {
                /**
       * Create an array of boolean filters (each of which provides the needed
       * state and methods for a checkbox)
       */
                var filters = apiData[facetName].buckets.map(function (bucket) {
                    return new cttvFilterTypesService.BooleanFilter({
                        key: bucket.key,
                        label: useKeyAsLabel ? bucket.key : bucket.label,
                        count: bucket[countsKey].value,
                        // TODO: Fix enabled, checked
                        enabled: true,
                        checked: false
                    }, facetsGlobal);
                });

                /**
       * Toggle method for all filters
       */
                var setAllChecked = function (value) {
                    // update state
                    filters.forEach(function (filter) {
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
                    urlObj[facetName] = filters.filter(function (filter) {
                        return filter.checked;
                    }).map(function (filter) {
                        return filter.key;
                    });
                    return urlObj;
                };

                /**
       * Check if a boolean filter is checked according to the URL object.
       * @param {object} urlObj - Object representation of the URL
       * @param {string} key - Key of the filter to check
       */
                var filterIsChecked = function (urlObj, key) {
                    return (urlObj &&
                urlObj[facetName] &&
                (urlObj[facetName] === key ||
                 urlObj[facetName].indexOf(key) >= 0));
                };

                /**
       * Deserialize the url state and update the facet state.
       * @param {object} urlObj - The URL object
       */
                var deserialize = function (urlObj) {
                    filters.forEach(function (filter) {
                        filter.checked = filterIsChecked(urlObj, filter.key);
                    });
                };

                // Load the url state to update checked status etc.
                deserialize(facetsGlobal.getUrlObject());

                // Return the Facet object
                return {
                    filters: filters,
                    setAllChecked: setAllChecked,
                    serialize: serialize,
                    deserialize: deserialize,
                    options: options
                };
            };

            return {
                parse: parse
            };
        };

        return {
            generate: generate
        };
    }]);
