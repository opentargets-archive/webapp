

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

            /*filters.forEach(function(collection){
                var f = collection.getSelectedFilters();
                if(f.length>0){
                    selected.push( new FilterCollection(collection.key, collection.label, f) );
                    //for(var i=0; i<f.length; i++){
                    //    active.push(f[i].facet+"="+f[i].key);
                    //}
                }
                selectedCount += f.length;
            });*/

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
            // var f = collection.getSelectedFilters();
            // if(f.length>0){
            //     selected.push( new FilterCollection(collection.key, collection.label, f) );
            // }
            // selectedCount += f.length;

            // loop thorugh all the collection we'got from the parsing of the facets returned by API
            // 1. now we loop through all the filters of each collection
            $log.log("** ** "+collection.key);
            $log.log(collection);
            collection.filters.forEach(function(fs){
                // 2. if at any point a filter is selected
                if(fs.selected){
                    // we check there is a collection (if not we cretate it) and then add the filter to it...
                    getCollectionForSelected(collection.key, collection.label).addFilter(fs);
                    selectedCount++;
                }
                // 3. if a filter has sub filters, we check those too
                if(fs.collection!=null && (fs.collection instanceof FilterCollection)){
                    // loop again...
                    parseCollectionSelected(fs.collection);
                }
            });
        }



        /*
         * Returns true if a filter with the given key is selected
         */
        var isSelected=function(collection, key){
            // var sel = ($location.search()[collection] && ( $location.search()[collection]===key || $location.search()[collection].indexOf(key)>=0 )) || false;
            // if( sel ){
            //     $log.log("isSelected( "+collection+", "+key+" ) : "+sel);
            // }
            // return sel;
            return ($location.search()[collection] && ( $location.search()[collection]===key || $location.search()[collection].indexOf(key)>=0 )) || false;
        };



        var getSelectedFilters = function(facet){
            var f = selected.filter(function(obj){
                        return obj.key===facet;
                    })[0] || {filters:[]};
            $log.log("getSelectedFilters: "+facet);
            $log.log(f);

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
                var f = new Filter(element)
                collection.addFilter(f);    // add filter to the collection
                // but do we want to add the filter to the selected ones as well? if needed?
                // is here the best place? mmmh....
            });
            return collection;
        };



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
                if( this.selected ){
                    // select this filter (i.e. add it to the URL)
                    cttvFiltersService.addFilter(this.facet, this.key);
                    // deselect any subfilters
                    // if(this.collection!=null){
                    //     this.collection.selectAll(false);
                    // }

                }else{
                    cttvFiltersService.removeFilter(this.facet, this.key);
                }
                return this.selected;
            };

            /*
             * Triggers the selected property to the specified value and DOES NOT update the URL
             */
            Filter.prototype.setSelected=function(b){
                if(this.enabled){
                    this.selected = b;
                    // addToSelected(this.key, this.collection.key, b);
                    // updateSelected();
                    // if(b){
                    //     cttvFiltersService.addFilter(this.facet, this.key);
                    // }else{
                    //     cttvFiltersService.removeFilter(this.facet, this.key);
                    // }
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

            FilterCollection.prototype.addFilter = function(filter){
                //if(filter.collection==undefined){
                //    filter.collection = {key:this.key, label:this.label}
                //}
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
                if(b===true){
                    // Case: SELECT ALL
                    // we pass an array of filters to the addFilter method
                    cttvFiltersService.addFilter(
                        this.key,
                        this.filters.map(function(filter){
                            filter.setSelected(true);   // we're setting the selection here for a more responsive UI feel (else have to wait for API response)
                            return filter.key;
                        })
                    );
                }else{
                    // Case: DESELECT ALL
                    // remove the whole collection from the URL
                    cttvFiltersService.removeFilter(this.key, null);
                }
            };

            // Perhaps we will need these sort of functions if we change facets implementation
            // when user has to click "apply filters" explicitly

            FilterCollection.prototype.getSelectedFilters = function(){
                return this.filters.filter(function(obj){
                    var sub = false;
                    if(obj.collection ){
                        if( obj.collection.getSelectedFilters != undefined){
                            // sub = obj.collection.getSelectedFilters().length > 0;
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
         * Adds a filter to the URL
         *
         * @param {string} facet the facet to be added, or to which to append
         * @param {string | array} bucket they key of the filter (or array of keys) to be added
         */
        cttvFiltersService.addFilter = function(facet,bucket){
            $log.log("addFilter( "+facet+", "+bucket+" )");

            // if the facet already exists, we have to append to it
            // var f = cttvFiltersService.parseURL()[facet];   // this is always an array
            var f = getSelectedFilters(facet);

            if( f ){
                if(typeof bucket === "string"){
                    bucket = [bucket];
                }
                bucket = _.union(f, bucket);
            }
            // then just update search URL
            $location.search(facet,bucket);

        };



        /**
         * Very similar, remove the specified filter from the URL search
         *
         * @param {string} facet the facet to be added, or to which to append
         * @param {string | array} bucket they key of the filter (or array of keys) to be added
         */
        cttvFiltersService.removeFilter = function(facet,bucket){
            $log.log("removeFilter( "+facet+", "+bucket+" )");

            // var f = cttvFiltersService.parseURL()[facet];   // this is always an array
            var f = getSelectedFilters(facet);

            if( f ){
                // if the facet exists, check if it's a string or an array, and remove as appropriate
                if(bucket!==null){
                    // bucket is most likely going to be a String
                    // so in order to support _.difference we make it into an array
                    if(typeof bucket === "string"){
                        bucket = [bucket];
                    }
                    bucket = _.difference( f, bucket );
                    if(bucket.length===0){
                        bucket=null;
                    }
                }
                // if the bucket is null, we delete the whole facet (e.g. all datatypes) from the URL
                $location.search(facet,bucket);
            }
        };



        /**
         * Sets the serach of the URL to the specified filters
         */
        cttvFiltersService.setSelectedFilters = function(searchObject){
            var search = $location.search();
            for(var i in search){
                $location.search(i,null);
            }
            for(var j in searchObject){
                $location.search(j, searchObject[j]);
            }
        };



        cttvFiltersService.addCollection = function(obj){
            filters.push( parseCollection(obj) );
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
            // var raw = {};
            // for(var collection in facetsdata){
            //     var f=facetsdata[collection].getSelectedFiltersRaw();
            //     if(f.length>0){
            //         raw[facetsdata[collection].key] = f;
            //     }
            // };
            // return raw;

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
            selected.forEach(function(collection){
                cttvFiltersService.removeFilter(collection.key, null);
            });
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
            countsToUse = countsToUse || "unique_target_count";
            $log.log("cttvFiltersService.updateFacets()");
            // take facets and update the facets,
            // then set selections based on user options
            $log.log(facets);


            // reset the filters
            filters.length=0;


            // If the page has a list of specified facets, we use that
            // if not, we just go through all the facets returned by the API
            var orderedFacets = pageFacetsStack;
            if(!orderedFacets.length){
                orderedFacets = Object.keys(facets);
            }

            orderedFacets.forEach(function(collection){
                if (facets.hasOwnProperty(collection)) {
                    try{
                        cttvFiltersService.addCollection( parseFacetData(collection, facets[collection], countsToUse) );
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



        return cttvFiltersService;
    }]);
