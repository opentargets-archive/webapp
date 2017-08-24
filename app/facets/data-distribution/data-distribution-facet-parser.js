angular.module('facets')

    .factory('dataDistributionFacetParser', ['$log', 'otDictionary', 'cttvConsts', function ($log, otDictionary, cttvConsts) {
        'use strict';


        var parser = {};

        /**
         * Parse function
         * Every FacetParser *must* expose a parse().
         * The function essentially maps and returns the filters (values) for a specific collection
         * (i.e. a facet, like the datatype facet or score distribution facet).
         *
         * Parser function must take the following parameters:
         *     collection [String] the type/id of facet, e.g. "datatype"
         *     data [Object] the data object for this facet (from the API)
         *     countsToUse [String] e.g. "unique_disease_count"
         *     options [Object] this contains "heading" and "open" options
         *     isSelected [Function] this is the FiltersService.isSelected(). The problem is we cannot reference the FiltersService here (circular dependency)
         *
         * It returns an Array of filters.
         */
        parser.parse = function (config, data, countsToUse, options, isSelected) {
            // array of filters
            /* config.filters = data.buckets.map(function (obj) {
                    var conf = {};
                    conf.key = obj.key;
                    conf.label = obj.label;
                    conf.count = obj[countsToUse].value;
                    conf.selected = isSelected(collection, obj.key);
                    conf.facet = collection;
                    conf.collection = null;
                    if (obj.target_class) {
                        conf.collection = {
                            filters: parser.parse(cttvConsts.TARGET_CLASS, obj.target_class, countsToUse, undefined, isSelected)
                        }
                    }
                    return conf;
                });

            return config;*/

            // TODO:
            // this is not gonna work now!
            // NEED TO CHANGE all facets to return a config object rathen than just the list of filters...
            var search = cttvFiltersService.parseURL();
            search.score_min = search.score_min || [cttvConsts.defaults.SCORE_MIN.toFixed(2)];
            search.score_max = search.score_max || [cttvConsts.defaults.SCORE_MAX.toFixed(2)];
            search.score_str = search.score_str || [cttvConsts.defaults.STRINGENCY];

            // set the 3 filters for the score: min, max, stringency
            config.filters = [
                {
                    facet: 'score_min',
                    label: 'min',
                    key: search.score_min[0],
                    selected: true
                },
                {
                    facet: 'score_max',
                    label: 'max',
                    key: search.score_max[0],
                    selected: true
                },
                {
                    facet: 'score_str',
                    label: 'stringency',
                    key: search.score_str[0],
                    selected: true
                }
            ];


            // score facet is different than the default checkbox lists
            // so we need to overwrite the getSelected method
            config.getSelectedFilters = function () {
                // at the moment just return all these as selected, later on we might want to flag it after user changes default value perhaps?
                return this.filters;
            };

            config.data = {
                buckets: (function () { var a = []; for (var i in data.buckets) { a.push({label: Number(i), value: data.buckets[i].value}); } return a; })()
                    .sort(function (a, b) {
                        if (a.label < b.label) { return -1; }
                        if (a.label > b.label) { return 1; }
                        return 0;
                    })
                    // min : 0,
                    // max : 1
            };

            return config;
        };

        return parser;
    }]);

