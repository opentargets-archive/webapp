angular.module('facets')
.factory('nestedFacetParserGenerator', ['$log', 'cttvFilterTypesService', function($log, cttvFilterTypesService) {
  
  var generate = function (accessor) {
    var parse = function (facetName, apiData, facetsGlobal, countsKey, options) {

      var flatFilters = [];
      var nestedFilters;

      /**
       * getExistingFilter
       * Check if a filter with a specific key has already been created
       * and, if so, retrieve it.
       * @param {string} key - The key of the filter to search for
       * @param {array} flatFilters - The (flat) array of filters to look in
       */
      var getExistingFilter = function (key, flatFilters) {
        var match = flatFilters.filter(function (filter) {
          return filter.key === key;
        });
        return match.length > 0 ? match[0] : null;
      };

      /**
       * constructFilters
       * Parse the API data and recursively build a nested filter structure.
       * @param {object} data - The API data
       * @param {array} flatFilters - The (flat) array of filters (mutated by function)
       * @param {object} parent - The parent (or null) of the current level of filters.
       * 
       * Nested filters such as target-class can have common children.
       * For example, "Kinase" appears under "Enzyme" and under
       * "Other cytosolic protein". For this reason, when constructing
       * the filters from the apiData, the strategy is to keep a flat
       * list of filters, which the nested filters reference.
       */
      var constructFilters = function (data, flatFilters, parent) {
        // iterate the buckets, checking for existance in the flat list
        // and constructing a new Filter if there is none
        return data.buckets.map(function (bucket) {
          // get the existing filter, if it exists
          var filter = getExistingFilter(bucket.key, flatFilters);
          // if there is no existing filter, create one
          if (!filter) {
            filter = new cttvFilterTypesService.NestedBooleanFilter({
              key: bucket.key,
              label: bucket.label,
              count: bucket[countsKey].value,
              enabled: true,
              checked: false,
              children: null,
              facetName: facetName,
            }, facetsGlobal);
            // add to the flat list
            flatFilters.push(filter);
          }
          // track the parent (if any)
          if (parent) {
            filter.addParent(parent);
          }
          // construct the filter's children
          var children = null;
          if (bucket[accessor]) {
            children = constructFilters(bucket[accessor], flatFilters, filter);
          }
          filter.children = children;
          // return the created/updated filter
          return filter;
        });
      }

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
        urlObj[facetName] = flatFilters.filter(function (filter) {
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
        nestedFilters = constructFilters(apiData[facetName], flatFilters, null);

        // load the url state (update checked statuses etc.)
        deserialize(facetsGlobal.getUrlObject());
      }

        /**
       * Check if a boolean filter is checked according to the URL object.
       * Note that the key is an number, but the urlObj may be a string (
       * ie. 6 vs '6')
       * @param {object} urlObj - Object representation of the URL
       * @param {string} key - Key of the filter to check
       */
      var filterIsChecked = function (urlObj, key) {
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
        nestedFilters.forEach(function (filter) {
          filter.setChecked(filterIsChecked(urlObj, filter.key));
          if (filter.children) {
            filter.children.forEach(function (childFilter) {
              childFilter.setChecked(filterIsChecked(urlObj, childFilter.key));
            });
          }
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
    }

    return {
      parse: parse
    };
  }
  
  return {
    generate: generate
  }

}]);
