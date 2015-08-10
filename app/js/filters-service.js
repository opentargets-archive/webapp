

/* Filters services */

angular.module('cttvServices').



    /**
     *
     */
    factory('cttvFiltersService', ['$log', '$location', 'cttvDictionary', 'cttvConsts', 'cttvAPIservice', 'cttvUtils', function($log, $location, cttvDictionary, cttvConsts, cttvAPIservice, cttvUtils) {

        "use strict";

        // set the default datatypes:
        // only animal models are filtered out (deselected) by default
        var datatypes = [
            {key: cttvConsts.datatypes.GENETIC_ASSOCIATION, selected:true},
            {key: cttvConsts.datatypes.SOMATIC_MUTATION, selected:true},
            {key: cttvConsts.datatypes.KNOWN_DRUG, selected:true},
            {key: cttvConsts.datatypes.RNA_EXPRESSION, selected:true},
            {key: cttvConsts.datatypes.AFFECTED_PATHWAY, selected:true},
            {key: cttvConsts.datatypes.ANIMAL_MODEL, selected:false}
        ];


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
        var filtersData = {}



        // ----------------------------------
        //  Private methods
        // ----------------------------------



        /*
         * goes thorugh all the filters and
         * updates the "summary" of selected options, as well as the count
         */
        var updateSelected = function(){
            selected.length=0;  // reset the length, not whole object
            selectedCount = 0;  // other controllers are $watch-ing this...

            filters.forEach(function(collection){
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
        var getCollectionForSelected = function(key, label){
            var c = selected.filter(function(obj){return obj.key == key;})[0];
            $log.log("getCollectionForSelected( "+key+", "+label+" ) :: "+c);
            if(c==undefined){
                c = new FilterCollection(key, label);
                selected.push(c);
            }
            return c;
        }



        /*
         * Parses the filters in a collection and adds them to the "selected" array as required.
         * If filters contain sub-filters, these are parsed recursively
         */
        var parseCollectionSelected = function(collection){

            // loop thorugh all the collection's 'filters
            collection.filters.forEach(function(fs){

                // if this has subfilters and *some* of them are selected, we deselect the 'parent' (i.e. current filter)
                // then parse parent (if selected) and all the children.
                // So here we update the selected state based on subfilters if needed
                if(fs.collection!=null && fs.collection.getSelectedFilters().length>0){
                    if(fs.collection.getSelectedFilters().length < fs.collection.filters.length){
                        fs.selected = false;
                    } else {
                        fs.selected = true;
                    }
                }

                if ( fs.selected ){
                    // we check there is a collection (if not we cretate it) and then add the filter to it...
                    getCollectionForSelected(collection.key, collection.label).addFilter(fs);
                    selectedCount++;
                }

                if(fs.collection!=null && (fs.collection instanceof FilterCollection) ){
                    parseCollectionSelected(fs.collection);
                }

            });
        }



        /*
         * Returns true if a filter with the given key is selected
         */
        var isSelected=function(collection, key){
            return ($location.search()[collection] && ( $location.search()[collection]===key || $location.search()[collection].indexOf(key)>=0 )) || false;
        };



        /*
         * Returns an array of the selcted filters for the specified facet (key)
         */
        var getSelectedFilters = function(facetKey){
            var f = selected.filter(function(obj){
                        return obj.key===facetKey;
                    })[0] || {filters:[]};

            return f.filters.map(function(obj){
                        return obj.key;
                    });
        };



        /*
         * Takes API data for a facet (i.e. a collection of filters) and returns the config object to create that collection
         */
        var parseFacetData = function(collection, data, countsToUse){
            var config={
                key: collection,    // this is the type, really...
                label: cttvDictionary[collection.toUpperCase()] || collection,
            };

            if(collection === cttvConsts.DATATYPES){
                // we have datatypes, which is a little complicated
                // because we have DEFAULT options (i.e. filtering out mouse data)
                // these should go into the "selected filters" (although the user hasn't selected them)

                config.filters = datatypes.map( function(obj){
                    var conf = {};
                    var def = {};
                    def[countsToUse] = {};
                    var dtb = data.buckets.filter(function(o){return o.key===obj.key;})[0] || def;
                    conf.key = obj.key;
                    conf.label = cttvDictionary[obj.key.toUpperCase()] || "";
                    conf.count = dtb[countsToUse].value; //dtb.doc_count;
                    conf.enabled = dtb.key !== undefined; // it's actually coming from the API and not {}
                    conf.selected = isSelected(collection, obj.key); // && conf.count>0;    // do we want to show disabled items (with count==0) as selected or not?
                    conf.facet = collection;
                    conf.collection = null; //new FilterCollection("","");
                    if(dtb.datasources){
                        conf.collection = parseCollection( parseFacetData(cttvConsts.DATASOURCES, dtb.datasources, countsToUse) );
                    }
                    return conf;
                });/*.filter( function(obj){
                    // Use a filter function to keep only those returned by the API??
                    return obj.count>0;
                });*/
            } else if (collection === cttvConsts.PATHWAY_TYPES){
                config.filters = data.buckets.map(function(obj){
                    var conf = {};
                    conf.key = obj.key;
                    conf.label = obj.label;
                    conf.count = obj[countsToUse].value;
                    conf.selected = isSelected(collection, obj.key);
                    conf.facet = collection;
                    conf.collection = null;
                    if(obj.pathway){
                        conf.collection = parseCollection( parseFacetData(cttvConsts.PATHWAY_TYPES, obj.pathway, countsToUse) );
                    }
                    return conf;
                });
            } else if (collection === cttvConsts.DATASOURCES){
                config.filters = data.buckets.map(function(obj){
                    var conf = {};
                    conf.key = obj.key;
                    conf.label = obj.key;
                    conf.count = obj[countsToUse].value;
                    conf.selected = isSelected(collection, obj.key);
                    conf.facet = collection;
                    conf.collection = null;
                    return conf;
                });
            }

            return config;
        };



        /*
         * Parse the config object to create a collection,
         * creates it and populates it with the specified filters
         */
        var parseCollection = function(obj){
            var collection = new FilterCollection(obj.key, obj.label);
            obj.filters.forEach(function(element){
                //element.selected = selection.indexOf(element.key)>=0;
                var f = getFilter(element);    //new Filter(element)
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
        var updateLocationSearch = function(){
            var raw = {};
            selected.forEach(function(collection){
                raw[collection.key] = collection.filters.map(function(obj){return obj.key;});
            })
            $location.search(raw);
        }



        /*
         * Calls in sequence updateSelected() and updateLocationSearch()
         */
        var update = function(){
            updateSelected();
            updateLocationSearch();
        }



        /*
         * Builds a collection from the specified config object and addes it to the filters[] array
         */
        var addCollection = function(obj){
            filters.push( parseCollection(obj) );
        };



        /*
         * Get the specified filter from the object data based on facet (collection) and key passed as an object.
         * f is essentially a config object
         */
        var getFilter = function(f){
            if(!filtersData[f.facet]){
                filtersData[f.facet] = {}
            }
            if(!filtersData[f.facet][f.key]){
                filtersData[f.facet][f.key] = new Filter(f);
            }
            return filtersData[f.facet][f.key];
        }



        // ----------------------------------
        //  Private classes
        // ----------------------------------



        /*
         * Private Filter class for a generic filter
         * o:Object - optional config object
         */
        function Filter(o){
            this.facet = o.facet || ""; // the collection key, e.g. "datatype" or "pathway"
            this.key = o.key || "";     // the filter id, e.g. "rna_expression" or "react_15518"
            this.label = o.label || ""; // the label to display
            this.count = o.count || 0;  // the count to display
            this.enabled = this.count>0 && (o.enabled==undefined ? true : o.enabled);
            this.selected = o.selected==undefined ? false : o.selected;
            // the value associated with this
            this.value = o.value || undefined;
            // trying to have nested filters?
            this.collection = o.collection || null;
        }

            /*
             * Toggles the state selected-deselected and updates the URL accordingly (which triggers an update)
             */
            Filter.prototype.toggle = function(){
                this.setSelected(!this.selected);
                update();
                return this.selected;
            };

            /*
             * Triggers the selected property to the specified value and DOES NOT update the URL
             */
            Filter.prototype.setSelected=function(b){
                if(this.enabled){
                    // flag the changed state
                    //this.changed = (b!=this.selected);
                    this.selected = b;
                }
                return this.selected;
            };



        /**
         * Private FilterCollection class
         * Aka "buckets" in ElasticSearch terms.
         * key:String - is the id of the filter collection
         * label:String - the label/name to display for this collection
         * filters:Array - array of Filters
         */
        function FilterCollection(key, label, filters){
            this.key = key || "";
            this.label = label || "";
            this.filters = filters || [];
        }

            /**
             * Add the specified filter (instance of Filter class) to this collection
             */
            FilterCollection.prototype.addFilter = function(filter){
                // we should check the filter doesn't already exist...
                if( this.filters.filter(function(f){ return f.key===filter.key}).length==0 ){
                    this.filters.push(filter);
                }
            };

            /**
             * Function to select and clear all the filters in the collection
             */
            FilterCollection.prototype.selectAll = function(b){
                $log.log(b);
                this.filters.forEach(function(f){
                    f.setSelected(b);
                    if(!b && f.collection!=null){
                        f.collection.selectAll(b);
                    }
                });
                update();
            };

            /**
             * Returns an array of the filters in this collection that are selected
             */
            FilterCollection.prototype.getSelectedFilters = function(){
                return this.filters.filter(function(obj){
                    var sub = false;
                    if(obj.collection ){
                        if( obj.collection.getSelectedFilters != undefined){
                            sub = (obj.collection.filters.length == obj.collection.getSelectedFilters().length);
                        }
                    }
                    return obj.selected || sub;
                });
            };



        // ---------------------------------
        //  Public service
        // ---------------------------------



        var cttvFiltersService = {};



        /**
         * List of constants for the types of facets we support.
         * These are passed to the pageFacetsStack() function to define the facets for the given page
         */
        cttvFiltersService.facetTypes = {
            DATATYPES: 'datatypes',
            PATHWAYS: 'pathway_type',
            SCORE: 'score'
        };



        /**
         * Set the facets to be shown on the current page.
         * The order in which they're added is also the order
         * in which they'll appear in the UI.
         *
         * @param facets - array of facets keys, e.g. ["datatypes","pathway_types"]
         */
        cttvFiltersService.pageFacetsStack = function(facets){
            if(!facets){
                return pageFacetsStack;
            }
            pageFacetsStack.length = 0;
            facets.forEach(function(facet){
                pageFacetsStack.push(facet);
            });
        };



        /**
         * Returns facetsdata object as an array to be used for display
         */
        cttvFiltersService.getFilters = function(){
            return filters;
        };



        /**
         * Returns the user-selected options
         */
        cttvFiltersService.getSelectedFilters = function(){
            return selected;
        };



        /**
         * Gets a list of selected filters for API call usage.
         * Return: object containing arrays of string for each facet category
         * Example:
         * {
         *    datatype: ["known_drug", "rna_expression"]
         * }
         */
        cttvFiltersService.getSelectedFiltersRaw = function(facet){
            // TODO: ok so this first part was also kinda hacked together quickly
            // and ideally we can clean up a few more functions here...
            if(facet){
                return getSelectedFilters(facet);
            }
            var raw = {};
            for(var i in $location.search()){
                raw[i] = $location.search()[i];
                if(typeof raw[i] === "string"){
                    raw[i] = [raw[i]];
                }
            }
            return raw;
        };



        /**
         * Removes ALL selections
         */
        cttvFiltersService.deselectAll = function(){
            // TODO: this could be changed so that removeFilter() takes an array as first parameter
            // selected.forEach(function(collection){
            //     cttvFiltersService.removeFilter(collection.key, null);
            // });
            selected.length=0;
            updateLocationSearch();
        };



        /**
         * Parses the search of the URL
         * and returns an API-friendly config object with the filter options
         */
        cttvFiltersService.parseURL = function(){
            // datatypes=genetic_association&datatypes=known_drug&datatypes=rna_expression
            var raw = {};
            var search = $location.search();

            for(var i in search){
                if(search.hasOwnProperty(i)){
                    //var j = cttvAPIservice.facets[i.toUpperCase()];
                    raw[ i ] = search[i];
                    if(typeof raw[ i ] === "string"){
                        raw[i] = [raw[i]];
                    }
                }
            }
            return raw;
        };



        /**
         *  This is the main method that parse facets data and sets them up
         */
        cttvFiltersService.updateFacets = function(facets, countsToUse){
            $log.log("cttvFiltersService.updateFacets()");

            countsToUse = countsToUse || cttvConsts.UNIQUE_TARGET_COUNT; // "unique_target_count";
            // reset the filters
            filters.length = 0;
            selected.length = 0;
            selectedCount = 0;


            // If the page has a list of specified facets, we use that
            // if not, we just go through all the facets returned by the API
            var orderedFacets = pageFacetsStack;
            if(!orderedFacets.length){
                orderedFacets = Object.keys(facets);
            }

            orderedFacets.forEach(function(collection){
                if (facets.hasOwnProperty(collection)) {
                    try{
                        addCollection( parseFacetData(collection, facets[collection], countsToUse) );
                    } catch(e){
                        $log.log("Error while updating facets: "+e);
                    }
                }
            });

            // update the filters state?
            updateSelected();
        };



        /**
         * Does exactly what it says on the tin.
         */
        cttvFiltersService.getSelectedCount = function(){
            return selectedCount;
        };



        cttvFiltersService.getDefaultSelectedDatatypes = function(){
            return datatypes.filter(function(value){
                                return value.selected;
                            }).map(function(obj){
                                return obj.key;
                            });
        }



        /**
         * Resets the filters, selected filters, page facets and counts.
         * You may want to call this at the beginning of your page controller,
         * before setting the pageFacetsStack, so that while your page loads
         * users wont' see facets from the previous page (remember, this is a service
         * and it maintains its state through pages)
         */
        cttvFiltersService.reset = function(){
            filters.length = 0;
            selected.length = 0;
            selectedCount = 0;
            pageFacetsStack.length = 0;
        }



        return cttvFiltersService;



    }]);
