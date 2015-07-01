'use strict';


/* Filters services */

angular.module('cttvServices').



    /**
     *
     */
    factory('cttvFiltersService', ['$log', '$location', 'cttvDictionary', 'cttvConsts', 'cttvAPIservice', 'cttvUtils', function($log, $location, cttvDictionary, cttvConsts, cttvAPIservice, cttvUtils) {


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


        // this holds all the FilterCollections (from parsed facets from the API)
        // mapped by facet key for easier operations
        var facetsdata = {};


        // array of user selected options, aka "Your filters"
        // these are (could be? should be?) FilterCollections i think...
        var selected = [];


        // keeps the count of all selected filters
        // controllers will watch this value through the getSelected() function
        var selectedCount = 0;



        var active = [];



        // This holds the list of facets we want to show for the current page.
        // The order in the array determins the display in the UI.
        var pageFacetsStack = [];



        // goes thorugh all the filters and
        // updates the "summary" of selected options, as well as the count
        var updateSelected = function(){
            selected.length=0;  // reset the length, not whole object
            selectedCount = 0;  // other controllers are $watch-ing this...
            //active.length = 0;
            // $log.log("updateSelected");
            // $log.log(facetsdata);
            //for(var collection in facetsdata){
            filters.forEach(function(collection){
                var f = collection.getSelectedFilters();
                if(f.length>0){
                    selected.push( new FilterCollection(collection.key, collection.label, f) );
                    //for(var i=0; i<f.length; i++){
                    //    active.push(f[i].facet+"="+f[i].key);
                    //}
                }
                selectedCount += f.length;
            });
        }



        // returns true if a filter with the given key is selected
        var isSelected=function(collection, key){
            return $location.search()[collection] && ( $location.search()[collection]===key || $location.search()[collection].indexOf(key)>=0 )
        }


        var getSelectedFilters = function(facet){
            var f = selected.filter(function(obj){
                        return obj.key===facet;
                    })[0] || {filters:[]};

            return f.filters.map(function(obj){
                        return obj.key;
                    });
        }



        /*
         * Private Filter class
         * o:Object - optional config object
         */
        function Filter(o){
            this.facet = o.facet || "";
            this.key = o.key || "";
            this.label = o.label || "";
            this.count = o.count || 0;
            this.enabled = this.count>0 && (o.enabled==undefined ? true : o.enabled);
            this.selected = o.selected==undefined ? false : o.selected;

            /// HACK:
            // this is a temporary HACK!
            // once the API returns the elasticsearch aggregations like we want, this won't be needed
            // if( this.selected==true ){
            //     lastSelection = this.key;
            // }
        }

            Filter.prototype.toggle = function(){
                this.setSelected(!this.selected);
                if( this.selected ){
                    cttvFiltersService.addFilter(this.facet, this.key);
                }else{
                    cttvFiltersService.removeFilter(this.facet, this.key);
                }
                return this.selected;
            }

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
            }



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
                this.filters.push(filter);
            }

            /**
             * Function to select and clear all the filters in the collection
             */
            FilterCollection.prototype.selectAll = function(b){
                if(b==true){
                    // Case: SELECT ALL
                    // we pass an array of filters to the addFilter method
                    cttvFiltersService.addFilter(
                        this.key,
                        this.filters.map(function(filter){
                            filter.setSelected(true);   // we're setting the selection here for a more responsive UI feel (else have to wait for API response)
                            return filter.key
                        })
                    );
                }else{
                    // Case: DESELECT ALL
                    // remove the whole collection from the URL
                    cttvFiltersService.removeFilter(this.key, null);
                }
            }

            // Perhaps we will need these sort of functions if we change facets implementation
            // when user has to click "apply filters" explicitly

            FilterCollection.prototype.getSelectedFilters = function(){
                return this.filters.filter(function(obj){
                    return obj.selected;
                });
            }
//
            //FilterCollection.prototype.getSelectedFiltersRaw = function(){
            //    return this.getSelectedFilters().map(function(obj){
            //        return obj.key+"";
            //    });
            //}
//
            //FilterCollection.prototype.removeAllFilters = function(b){
            //    this.filters.length=0;
            //}

            // HACK:
            // this is a temporary HACK!
            // once the API returns the elasticsearch aggregations like we want, this won't be needed
            // FilterCollection.prototype.containsFilter = function(key){
            //     return this.filters.some(function(filter){
            //         return filter.key === key;
            //     });
            // }



        // ---------------------------------
        //  The actual service
        // ---------------------------------



        var cttvFiltersService = {};



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
         * @param facets - array of facets keys, e.g. "datatypes"
         */
        cttvFiltersService.pageFacetsStack = function(facets){
            if(!facets){
                return pageFacetsStack;
            }
            pageFacetsStack.length = 0;
            facets.forEach(function(facet){
                pageFacetsStack.push(facet);
            });
        }



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
                    if(bucket.length==0){
                        bucket=null;
                    }
                }
                // if the bucket is null, we delete the whole facet (e.g. all datatypes) from the URL
                $location.search(facet,bucket);
            }
        };



        // Sets the serach of the URL to the specified filters
        cttvFiltersService.setSelectedFilters = function(searchObject){
            var search = $location.search();
            for(var i in search){
                $location.search(i,null);
            }
            for(var i in searchObject){
                $location.search(i, searchObject[i]);
            }
        };



        cttvFiltersService.addCollection = function(obj){

            // let's see if there are any selected filters for this collection
            // i.e. if any are in the URL of the page
            //var selection = $location.search()[obj.key] || [];
            //if( typeof selection === 'string'){
            //    // if the selection for this collection is only one item, that will be a string
            //    // so we make it into an array and then handles everything as an array
            //    selection = [selection];
            //}


            var collection = new FilterCollection(obj.key, obj.label);
            obj.filters.forEach(function(element){
                //element.selected = selection.indexOf(element.key)>=0;
                collection.addFilter(new Filter(element));
            });


            filters.push(collection);
        }



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
            selected.forEach(function(collection){
                cttvFiltersService.removeFilter(collection.key, null);
            });
        }



        /**
         * Remove all existing filters from the list.
         * Reference to the filters array remains intact
         */
        cttvFiltersService.resetFilters = function(){
            $log.log("resetFilters()");
            facetsdata = {};
            updateSelected();
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
        }



        var setSelectedFilters = function(flt){

        }



        /**
         * This should be called when we first get data, which is unfiltered
         */
        cttvFiltersService.initFilters = function(facets){
            $log.log("initFilters()");

            cttvFiltersService.resetFilters();

            if(facets){
                // set the filters based on supplied data, probably from the API...

            } else {
                // set the defalut filters, which at the moment are datatypes
                cttvFiltersService.addCollection({
                    key: cttvDictionary.DATATYPES.toLowerCase(),
                    label: cttvDictionary.DATATYPES,
                    filters: datatypes.map( function(obj){
                        obj.label = cttvDictionary[obj.key.toUpperCase()] || "";
                        return obj;
                    })
                });

            }

        };



        // Takes API data for a facet (i.e. a collection of filters) and returns the config object to create that collection
        var parseFacetData = function(collection, data){

            var config={
                key: collection,
                label: cttvDictionary[collection.toUpperCase()] || collection,
            };

            if(collection === cttvConsts.DATATYPES){
                // we have datatypes, which is a little complicated
                // because we have DEFAULT options (i.e. filtering out mouse data)
                // these should go into the "selected filters" (although the user hasn't selected them)

                config.filters = datatypes.map( function(obj){
                    var conf = {};
                    var dtb = data.buckets.filter(function(o){return o.key===obj.key})[0] || {unique_target_count:{}};
                    conf.key = obj.key;
                    conf.label = cttvDictionary[obj.key.toUpperCase()] || "";
                    conf.count = dtb.unique_target_count.value; //dtb.doc_count;
                    conf.enabled = dtb.key != undefined; // it's actually coming from the API and not {}
                    conf.selected = isSelected(collection, obj.key) && conf.count>0; // || (obj.selected && (dtb.key != undefined)); //conf.enabled;
                    conf.facet = collection;
                    return conf;
                });/*.filter( function(obj){
                    // Use a filter function to keep only those returned by the API??
                    return obj.count>0;
                });*/
            } else {
                config.filters = data.buckets.map(function(obj){
                    var conf = {};
                    conf.key = obj.key;
                    conf.label = obj.label;
                    conf.count = obj.unique_target_count.value;
                    conf.selected = isSelected(collection, obj.key);
                    conf.facet = collection;
                    return conf;
                });
            }
            return config;
        }



        /**
         * Parse the facets object from the API
         */
        cttvFiltersService.initFacets=function(facets){
            $log.debug("initFacets()");
            // $log.debug(facets);

            // loop thorugh the facets
            // we probably don't want to do anything with datatypes I guess...
            // resetFacets();
            //  this.resetFilters();

            // 1: parse the filters
            for (var collection in facets) {
                if (facets.hasOwnProperty(collection)) {
                    cttvFiltersService.addCollection( parseFacetData(collection, facets[collection]) );
                }
            }

            // 2: parse/init user selections and defaluts
            updateSelected();
        }



        /**
         *
         */
        cttvFiltersService.updateFacets = function(facets){
            $log.log("cttvFiltersService.updateFacets()");
            // take facets and update the facets,
            // then set selections based on user options
            $log.log(facets);


            // reset the filters
            filters.length=0;


            // If the page has a list of specified facets, we use that
            // if not, we just go through all the facets returned by the API
            var orderedFacets = pageFacetsStack;
            if(orderedFacets.length==0){
                orderedFacets = Object.keys(facets);
            };


            orderedFacets.forEach(function(collection){
                if (facets.hasOwnProperty(collection)) {
                    try{
                        cttvFiltersService.addCollection( parseFacetData(collection, facets[collection]) );
                    } catch(e){
                        $log.log("Error while updating facets: "+e);
                    }
                }
            });

            // update the filters state?
            updateSelected();
        }



        /**
         * Does exactly what it says on the tin.
         */
        cttvFiltersService.getSelectedCount = function(){
            return selectedCount;
        }



        cttvFiltersService.getDefaultSelectedDatatypes = function(){
            return datatypes.filter(function(value){
                                return value.selected;
                            }).map(function(obj){
                                return obj.key;
                            });
        }



        return cttvFiltersService;
    }]);


