
/* Filters services */

angular.module('cttvServices')


    /**
     *
     */
    .factory('cttvFiltersService', ['$log', '$location', 'otDictionary', 'cttvConsts', 'otAPIservice', 'otUtils', 'otLocationState', '$analytics', '$injector', 'otConfig', function ($log, $location, otDictionary, cttvConsts, otAPIservice, otUtils, otLocationState, $analytics, $injector, otConfig) {
        'use strict';


        // array of FilterCollections
        // the items actually just point to the FilterCollections in facetsdata
        // this is purely to keep an ordered list (based on some rules, like datatypes firts)
        // for display purposes only
        // I know.... perhaps it's a little overkilling it....
        var filters = [];


        // array of user selected options, aka "Your filters"
        // these are (could be? should be?) FilterCollections i think...
        var selected = [];


        // keeps the count of all selected filters
        // controllers will watch this value through the getSelected() function
        var selectedCount = 0;


        // This holds the list of facets we want to show for the current page.
        // The order in the array determins the display in the UI.
        var pageFacetsStack = [];


        // Back here again :(
        // this stores all the filters organized by facet type. That's it.
        // So that we can reference the same filter from several places like in the case of pathways
        var filtersData = {};


        var status = []; // 1 == OK, 0 == not ok


        var lastClicked;


        // PARSERS
        // load and link the parser service for each facet
        var parsers = {};
        for (var i in otConfig.facets) {
            parsers[otConfig.facets[i].key] = $injector.get(_.camelCase(otConfig.facets[i].element) + 'Parser');
        }


        // ----------------------------------
        //  Private methods
        // ----------------------------------


        /*
         * goes thorugh all the filters and
         * updates the "summary" of selected options, as well as the count
         */
        var updateSelected = function () {
            selected.length = 0;  // reset the length, not whole object
            selectedCount = 0;  // other controllers are $watch-ing this...

            filters.forEach(function (collection) {
                // loop thorugh all the collection we'got from the parsing of the facets returned by API
                parseCollectionSelected(collection);
            });
        };


        /*
         * Looks up a collection in the "selected" array.
         * If found, it returns that collection.
         * If not found, a new collection is created (with specified key and label),
         * added to the created array and then returned.
         */
        var getCollectionForSelected = function (key, label) {
            var c = selected.filter(function (obj) { return obj.key == key; })[0];
            if (c == undefined) {
                c = new FilterCollection({key: key, label: label});
                selected.push(c);
            }
            return c;
        };


        /*
         * Parses the filters in a collection and adds them to the "selected" array as required.
         * If filters contain sub-filters, these are parsed recursively
         */
        var parseCollectionSelected = function (collection) {
            // loop thorugh all the collection's 'filters
            collection.filters.forEach(function (fs) {
                // if this has subfilters and *some* of them are selected, we deselect the 'parent' (i.e. current filter)
                // then parse parent (if selected) and all the children.
                // So here we update the selected state based on subfilters if needed
                if (fs.collection != null && fs.collection.getSelectedFilters().length > 0) {
                    if (fs.collection.getSelectedFilters().length < fs.collection.filters.length) {
                        fs.selected = false;
                    }
                    // NOTE [ luca, 06.sept.2016 ]
                    // removing this, which essentially sets the parent as selected if all its children are selected;
                    // while this would not be incorrect, it causes
                    //  1. the API call to be for the parent as well as all the children and
                    //  2. if there is only 1 child, then when we deselect it, the parent will remain/switch/become selected
                    /* else {
                        fs.selected = true;
                    }*/
                }


                if (fs.selected) {
                    // we check there is a collection (if not we cretate it) and then add the filter to it...
                    getCollectionForSelected(collection.key, collection.label).addFilter(fs);
                    selectedCount++;
                }

                if (fs.collection != null && (fs.collection instanceof FilterCollection)) {
                    parseCollectionSelected(fs.collection);
                }
            });
        };


        /*
         * Returns true if a filter with the given key is selected
         */
        var isSelected = function (collection, key) {
            var fcts = otLocationState.getState()[cttvFiltersService.stateId];
            key = '' + key; // target class is numerical key which confuses indexOf below.
            return (fcts && fcts[collection] && (fcts[collection] == key || fcts[collection].indexOf(key) >= 0)) || false;
        };


        /*
         * Returns an array of the selcted filters for the specified facet (key)
         */
        var getSelectedFilters = function (facetKey) {
            var f = selected.filter(function (obj) {
                return obj.key === facetKey;
            })[0] || {filters: []};

            return f.filters.map(function (obj) {
                return obj.key;
            });
        };


        /*
         * Takes API data for a facet (i.e. a collection of filters) and returns the config object to create that collection
         */
        var parseFacetData = function (collection, data, countsToUse, options) {
            // 1. default options:
            // mostly things for the collection container, like label, whether it's open or closed to start with
            options = options || {};
            options.open = options.open === false ? false : true;
            options.heading = options.heading || otDictionary[collection.toUpperCase()] || collection;

            var config = {
                key: collection,    // this is the type, really...
                options: options
            };


            // 2. parse data:
            // the parse function for each parser is defined in the corresponding facet/plugin
            try {
                config = parsers[collection].parse(config, data, countsToUse, isSelected);
            } catch (e) {
                $log.warn('Facet parser error for ' + collection);
                $log.warn(e);
            }

            return config;
        };


        /*
         * Parse the config object to create a collection,
         * creates it and populates it with the specified filters
         */
        var parseCollection = function (obj) {
            var collection = new FilterCollection(obj);
            collection.filters = []; // overwrite the filters so we can add them in properly
            obj.filters.forEach(function (element) {
                var f = getFilter(element);    // new Filter(element)
                collection.addFilter(f);    // add filter to the collection
                // but do we want to add the filter to the selected ones as well? if needed?
                // is here the best place? mmmh....
            });

            return collection;
        };


        /*
         * Updates the search part of the URL (i.e. after ?), resetting it completely.
         * It loops through the selected[] array and updates the URL accordingly.
         */
        var updateLocationSearch = function () {
            // $log.log("updateLocationSearch");
            var raw = {};
            selected.forEach(function (collection) {
                collection.filters.forEach(function (obj) {
                    raw[obj.facet] = raw[obj.facet] || [];
                    raw[obj.facet].push(obj.key);
                });
            });
            otLocationState.setStateFor(cttvFiltersService.stateId, raw);
        };


        /*
         * Calls in sequence updateSelected() and updateLocationSearch()
         */
        var update = function () {
            updateSelected();
            updateLocationSearch();
        };


        /*
         * Builds a collection from the specified config object and addes it to the filters[] array
         */
        var addCollection = function (obj) {
            filters.push(parseCollection(obj));
        };


        /*
         * Get the specified filter from the object data based on facet (collection) and key passed as an object.
         * f is essentially a config object
         */
        var getFilter = function (f) {
            if (!filtersData[f.facet]) {
                filtersData[f.facet] = {};
            }
            if (!filtersData[f.facet][f.key]) {
                filtersData[f.facet][f.key] = new Filter(f);
            }
            return filtersData[f.facet][f.key];
        };


        // ----------------------------------
        //  Private classes
        // ----------------------------------


        /*
         * Private Filter class for a generic filter
         * o:Object - optional config object
         */
        function Filter (o) {
            this.facet = o.facet || ''; // the collection key, e.g. "datatype" or "pathway"
            this.key = o.key || '';     // the filter id, e.g. "rna_expression" or "react_15518"
            this.label = o.label || ''; // the label to display
            this.count = o.count || 0;  // the count to display
            this.enabled = this.count > 0 && (o.enabled == undefined ? true : o.enabled);
            this.selected = o.selected == undefined ? false : o.selected;
            this.value = o.value || undefined;  // the value associated with this
            // has nested filters?
            // TODO: the problem here is that we couple the Filter class to the parseCollection() method here...
            this.collection = o.collection ? parseCollection(o.collection) : null;
        }

        /*
             * Toggles the state selected-deselected and updates the URL accordingly (which triggers an update)
             */
        Filter.prototype.toggle = function () {
            this.setSelected(!this.selected);
            update();
            lastClicked = this.toString() || undefined;
            return this.selected;
        };

        /*
             * Triggers the selected property to the specified value and DOES NOT update the URL
             */
        Filter.prototype.setSelected = function (b) {
            if (this.enabled) {
                this.selected = b;
            }
            return this.selected;
        };

        Filter.prototype.toString = function () {
            return this.facet + ':' + this.key;
        };


        /**
         * Private FilterCollection class
         * Aka "buckets" in ElasticSearch terms.
         * key:String - is the id of the filter collection
         * label:String - the label/name to display for this collection
         * filters:Array - array of Filters
         */
        function FilterCollection (config) {
            this.key = config.key || '';
            this.label = config.label || '';
            this.filters = config.filters || [];
            this.data = config.data || undefined;
            this.options = config.options || {}; // or {} ???
            this.open = config.open;
            if (config.addFilter) {
                this.addFilter = config.addFilter;
            }
            if (config.selectAll) {
                this.selectAll = config.selectAll;
            }
            if (config.getSelectedFilters) {
                this.getSelectedFilters = config.getSelectedFilters;
            }
            if (config.update) {
                this.update = config.update;
            }
        }

        /**
             * Add the specified filter (instance of Filter class) to this collection
             */
        FilterCollection.prototype.addFilter = function (filter) {
            // we should check the filter doesn't already exist...
            if (this.filters.filter(function (f) { return f.key === filter.key; }).length == 0) {
                this.filters.push(filter);
            }
        };

        /**
             * Function to select and clear all the filters in the collection
             */
        FilterCollection.prototype.selectAll = function (b) {
            this.filters.forEach(function (f) {
                f.setSelected(b);
                if (!b && f.collection != null) {
                    f.collection.selectAll(b);
                }
            });
            update();
        };

        /**
             * Returns an array of the filters in this collection that are selected
             */
        FilterCollection.prototype.getSelectedFilters = function () {
            return this.filters.filter(function (obj) {
                var sub = false;
                if (obj.collection) {
                    if (obj.collection.getSelectedFilters != undefined) {
                        sub = (obj.collection.filters.length == obj.collection.getSelectedFilters().length);
                    }
                }
                return obj.selected || sub;
            });
        };


        FilterCollection.prototype.update = function () {
            update();
        };


        FilterCollection.prototype.isLastClicked = function () {
            return this.filters.some(function (f) {
                return f.toString() == lastClicked;
            });
        };


        // ---------------------------------
        //  Public service
        // ---------------------------------


        var cttvFiltersService = {};


        /**
         * Set the facets to be shown on the current page.
         * The order in which they're added is also the order
         * in which they'll appear in the UI.
         *
         * @param facets - array of facets keys, e.g. ["datatypes","pathway_types"]
         */
        cttvFiltersService.pageFacetsStack = function (facets) {
            if (!facets) {
                return pageFacetsStack;
            }
            pageFacetsStack.length = 0;
            facets.forEach(function (facet) {
                pageFacetsStack.push(facet);
            });
        };


        /**
         * Returns facetsdata object as an array to be used for display
         */
        cttvFiltersService.getFilters = function () {
            return filters;
        };


        /**
         * Returns the user-selected options
         */
        cttvFiltersService.getSelectedFilters = function () {
            return selected;
        };


        /**
         * Removes ALL selections
         */
        cttvFiltersService.deselectAll = function () {
            // TODO: this could be changed so that removeFilter() takes an array as first parameter
            // selected.forEach(function(collection){
            //     cttvFiltersService.removeFilter(collection.key, null);
            // });
            selected.length = 0;
            updateLocationSearch();
        };


        cttvFiltersService.stateId = 'fcts';


        /**
         * This is the main method that parse facets data and sets them up
         * @param facets [Object] the facet object return by the API
         * @param countsToUse [String] the count to be used for display: "unique_target_count" or "unique_disease_count"
         * NOTE: i quite like passing the countsToUse directly here, so I'll leave it like this for now. This is however now set in the config file
         */
        cttvFiltersService.updateFacets = function (facets, countsToUse) {
            $log.log('updateFacets');
            // if there are no facets, return
            if (!facets) {
                return;
            }

            // set the count to use
            countsToUse = countsToUse || cttvConsts.UNIQUE_TARGET_COUNT; // "unique_target_count";

            // reset the filters
            for (var key in filtersData) {
                if (filtersData.hasOwnProperty(key)) {
                    delete filtersData[key];
                }
            }
            filters.length = 0;
            selected.length = 0;
            selectedCount = 0;


            // The page must specify a list of specified facets:
            // we always need facets to be EXPLICITLY DEFINED, we can't just take whatever comes from the API,
            // as we don't necessarily know how to parse that raw info
            var orderedFacets = pageFacetsStack;


            orderedFacets.forEach(function (collection) {
                // if (facets.hasOwnProperty(collection.type)) {
                if (facets.hasOwnProperty(otConfig.facets[collection.type].key)) {
                    try {
                        // default options from facet definition can be overriden with info in pageFacetStack for the page
                        var opts = {};
                        for (var i in otConfig.facets[collection.type].options) {
                            opts[i] = (collection.options && collection.options[i] != undefined) ? collection.options[i] : otConfig.facets[collection.type].options[i];
                        }
                        opts.element = otConfig.facets[collection.type].element;

                        addCollection(
                            parseFacetData(
                                otConfig.facets[collection.type].key,
                                facets[otConfig.facets[collection.type].key],    // facets[collection.type],
                                countsToUse,
                                opts // collection.options
                            )
                        );
                    } catch (e) {
                        $log.warn('Error while updating facets: ' + collection.type);
                        $log.warn(e);
                    }
                }
            });

            // update the filters state?
            updateSelected();

            // Track events in piwik
            for (var i = 0; i < selected.length; i++) {
                var facetCollection = selected[i];
                var collectionLabel = facetCollection.key;
                for (var j = 0; j < facetCollection.filters.length; j++) {
                    var facetLabel = facetCollection.filters[j].key;
                    // $log.log(" -- tracking: " + collectionLabel + " - " + facetLabel);
                    $analytics.eventTrack('collectionLabel', {'category': 'associationFacet', 'label': facetLabel});
                }
            }
        };


        /**
         * Does exactly what it says on the tin.
         */
        cttvFiltersService.getSelectedCount = function () {
            return selectedCount;
        };


        /**
         * Resets the filters, selected filters, page facets and counts.
         * You may want to call this at the beginning of your page controller,
         * before setting the pageFacetsStack, so that while your page loads
         * users wont' see facets from the previous page (remember, this is a service
         * and it maintains its state through pages)
         */
        cttvFiltersService.reset = function () {
            for (var key in filtersData) {
                if (filtersData.hasOwnProperty(key)) {
                    delete filtersData[key];
                }
            }
            filters.length = 0;
            selected.length = 0;
            selectedCount = 0;
            pageFacetsStack.length = 0;
        };


        cttvFiltersService.update = function () {
            update();
        };


        /**
         * Export the isSelected function
         */
        cttvFiltersService.isSelected = isSelected;


        return cttvFiltersService;
    }]);
