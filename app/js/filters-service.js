

/* Filters services */

angular.module('cttvServices').



    /**
     *
     */
    factory('cttvFiltersService', ['$log', '$location', 'cttvDictionary', 'cttvConsts', 'cttvAPIservice', 'cttvUtils', 'cttvLocationState', '$analytics', function($log, $location, cttvDictionary, cttvConsts, cttvAPIservice, cttvUtils, cttvLocationState, $analytics) {

        "use strict";

        // set the default datatypes:
        // only animal models are filtered out (deselected) by default
        var datatypes = [
            {key: cttvConsts.datatypes.GENETIC_ASSOCIATION, selected:true},
            {key: cttvConsts.datatypes.SOMATIC_MUTATION, selected:true},
            {key: cttvConsts.datatypes.KNOWN_DRUG, selected:true},
            {key: cttvConsts.datatypes.AFFECTED_PATHWAY, selected:true},
            {key: cttvConsts.datatypes.RNA_EXPRESSION, selected:true},
            {key: cttvConsts.datatypes.LITERATURE, selected:true},
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
        var filtersData = {};


        var status = []; // 1 == OK, 0 == not ok



        var lastClicked;



        // ----------------------------------
        //  Private methods
        // ----------------------------------



        /*
         * goes thorugh all the filters and
         * updates the "summary" of selected options, as well as the count
         */
        var updateSelected = function(){
            $log.log("updateSelected");
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
            if(c==undefined){
                c = new FilterCollection({key: key, label: label});
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
                    }
                    // NOTE [ luca, 06.sept.2016 ]
                    // removing this, which essentially sets the parent as selected if all its children are selected;
                    // while this would not be incorrect, it causes
                    //  1. the API call to be for the parent as well as all the children and
                    //  2. if there is only 1 child, then when we deselect it, the parent will remain/switch/become selected
                    /*else {
                        fs.selected = true;
                    }*/
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
            // return ($location.search()[collection] && ( $location.search()[collection]===key || $location.search()[collection].indexOf(key)>=0 )) || false;
            var fcts = cttvLocationState.getState()[ cttvFiltersService.stateId ];
            return (fcts && fcts[collection] && ( fcts[collection]===key || fcts[collection].indexOf(key)>=0 ))|| false;
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
            $log.log("parseFacetData "+collection);
            var config={
                key: collection,    // this is the type, really...
                label: cttvDictionary[collection.toUpperCase()] || collection,  // set default label based on what the API has returned for this
                isPartial: Math.min(1, (status.indexOf(collection)+1))
            };

            if(collection === cttvConsts.DATATYPES){
                // we have datatypes, which is a little complicated
                // because we have DEFAULT options (i.e. filtering out mouse data)
                // these should go into the "selected filters" (although the user hasn't selected them)
                config.label = cttvDictionary.DATA_TYPES;
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
                    if(dtb.datasource){
                        conf.collection = parseCollection( parseFacetData(cttvConsts.DATASOURCES, dtb.datasource, countsToUse) );
                    }

                    return conf;
                });/*.filter( function(obj){
                    // Use a filter function to keep only those returned by the API??
                    return obj.count>0;
                });*/
            } else if (collection === cttvConsts.PATHWAY){
                config.label = cttvDictionary.PATHWAY;
                // pathways
                config.filters = data.buckets.map(function(obj){
                    var conf = {};
                    conf.key = obj.key;
                    conf.label = obj.label;
                    conf.count = obj[countsToUse].value;
                    conf.selected = isSelected(collection, obj.key);
                    conf.facet = collection;
                    conf.collection = null;
                    if(obj.pathway){
                        conf.collection = parseCollection( parseFacetData(cttvConsts.PATHWAY, obj.pathway, countsToUse) );
                    }
                    return conf;
                });
            } else if (collection === cttvConsts.DATASOURCES){
                // datasources (in datatype subfacets)
                config.filters = data.buckets.map(function(obj){
                    var conf = {};
                    conf.key = obj.key;
                    //conf.label = obj.key;
                    conf.label = cttvDictionary[ cttvConsts.invert(obj.key) ] || obj.key;
                    conf.count = obj[countsToUse].value;
                    conf.selected = isSelected(collection, obj.key);
                    conf.facet = collection;
                    conf.collection = null;
                    return conf;
                });
            } else if (collection === cttvConsts.THERAPEUTIC_AREAS) {
                // therapeutic area facet
                config.filters = data.buckets.map(function (obj) {
                    var conf = {};
                    conf.key = obj.key;
                    conf.label = obj.label;
                    conf.count = obj[countsToUse].value;
                    conf.facet = collection;
                    conf.collection = null;
                    conf.selected = isSelected(collection, obj.key);
                    return conf;
                });
            } else if (collection === cttvConsts.DATA_DISTRIBUTION){
                // score (data_distribution)
                config.label= cttvDictionary.SCORE;
                var search = cttvFiltersService.parseURL();
                    search.score_min = search.score_min || [cttvConsts.defaults.SCORE_MIN.toFixed(2)];
                    search.score_max = search.score_max || [cttvConsts.defaults.SCORE_MAX.toFixed(2)];
                    search.score_str = search.score_str || [cttvConsts.defaults.STRINGENCY];

                // set the 3 filters for the score: min, max, stringency
                config.filters = [
                    {
                        facet : "score_min",
                        label : "min",
                        key : search.score_min[0],
                        selected : true
                    },
                    {
                        facet : "score_max",
                        label : "max",
                        key : search.score_max[0],
                        selected : true
                    },
                    {
                        facet : "score_str",
                        label : "stringency",
                        key : search.score_str[0],
                        selected : true
                    }
                ];


                // score facet is different than the default checkbox lists
                // so we need to overwrite the getSelected method
                config.getSelectedFilters = function(){
                    // at the moment just return all these as selected, later on we might want to flag it after user changes default value perhaps?
                    return this.filters;
                }

                config.data = {
                    buckets : (function(){var a=[]; for(var i in data.buckets){a.push({label:Number(i), value:data.buckets[i].value})} return a;})()
                                .sort(function(a,b){
                                    if(a.label<b.label){return -1}
                                    if(a.label>b.label){return 1}
                                    return 0
                                }),
                    //min : 0,
                    //max : 1
                }
            }

            return config;
        };



        /*
         * Parse the config object to create a collection,
         * creates it and populates it with the specified filters
         */
        var parseCollection = function(obj){
            var collection = new FilterCollection(obj);
            collection.filters=[]; // overwrite the filters so we can add them in properly
            obj.filters.forEach(function(element){

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
            $log.log("updateLocationSearch");
            var raw = {};
            selected.forEach(function(collection){
                //raw[collection.key] = collection.filters.map(function(obj){return obj.key;});
                collection.filters.forEach(function(obj){
                    raw[obj.facet] = raw[obj.facet] || [];
                    raw[obj.facet].push( obj.key )
                })
            })
            // $location.search(raw);
            cttvLocationState.setStateFor( cttvFiltersService.stateId , raw );
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
                lastClicked = this.toString() || undefined;
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

            Filter.prototype.toString=function(){
                return this.facet+":"+this.key;
            }


        /**
         * Private FilterCollection class
         * Aka "buckets" in ElasticSearch terms.
         * key:String - is the id of the filter collection
         * label:String - the label/name to display for this collection
         * filters:Array - array of Filters
         */
        function FilterCollection(config){
            this.key = config.key || "";
            this.label = config.label || "";
            this.filters = config.filters || [];
            this.data = config.data || undefined;
            this.isPartial = config.isPartial || 0;
            if(config.addFilter){
                this.addFilter = config.addFilter;
            }
            if(config.selectAll){
                this.selectAll = config.selectAll;
            }
            if(config.getSelectedFilters){
                this.getSelectedFilters = config.getSelectedFilters;
            }
            if(config.update){
                this.update = config.update;
            }
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


            FilterCollection.prototype.update = function(){
                update();
            }


            FilterCollection.prototype.isLastClicked = function(){
                return this.filters.some(function(f){
                    return f.toString() == lastClicked;
                });
            }



        // ---------------------------------
        //  Public service
        // ---------------------------------



        var cttvFiltersService = {};



        /**
         * List of constants for the types of facets we support.
         * These are passed to the pageFacetsStack() function to define the facets for the given page
         * Each constant represents the corresponding 'key' in the facets as returned by the ElasticSearch API
         */
        cttvFiltersService.facetTypes = {
            DATATYPES: cttvConsts.DATATYPES,        // 'datatypes'
            PATHWAYS: cttvConsts.PATHWAY,     // 'pathway_type'
            SCORE: cttvConsts.DATA_DISTRIBUTION,    // 'data_distribution'
            THERAPEUTIC_AREAS: cttvConsts.THERAPEUTIC_AREAS // disease
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

        // TODO:
        // this also seems to be redundant ???
        // cttvFiltersService.getSelectedFiltersRaw = function(facet){
        //     // TODO: ok so this first part was also kinda hacked together quickly
        //     // and ideally we can clean up a few more functions here...
        //     $log.log("*** getSelectedFiltersRaw");
        //     if(facet){
        //         return getSelectedFilters(facet);
        //     }
//
        //     return cttvLocationState.getState() || {};
        // };



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
        // TODO:
        // this should be deprecated now, right?
        //cttvFiltersService.parseURL = function(){
//
        //    $log.log(">> >>>>>>>>>>>>>>>> >> >>>>>>>>>>>>>>>>>>> >>");
        //    // datatypes=genetic_association&datatypes=known_drug&datatypes=rna_expression
//
        //    var raw = {};
        //    var search = $location.search();
//
        //    for(var i in search){
        //        if(search.hasOwnProperty(i)){
        //            raw[ i ] = search[i];
        //            if(typeof raw[ i ] === "string"){
        //                raw[i] = [raw[i]];
        //            }
        //        }
        //    }
        //    return raw;
        //};



        cttvFiltersService.stateId = "fcts";



        /**
         * This is the main method that parse facets data and sets them up
         * @param facets [Object] the facet object return by the API
         * @param countsToUse [String] the count to be used for display: "unique_target_count" or "unique_disease_count"
         * @param status [Array] this contains ["ok"] if all facets were computed correctly by the API. In case of errors, it contains the list of facets reporting incorrect values, e.g. ["partial-facet-datatypes"]
         */
        cttvFiltersService.updateFacets = function(facets, countsToUse, status){
            $log.log("updateFacets");
            // if there are no facets, return
            if(!facets){
                return;
            }

            // set the count to use
            countsToUse = countsToUse || cttvConsts.UNIQUE_TARGET_COUNT; // "unique_target_count";

            // set the status
            cttvFiltersService.status(status);

            // reset the filters
            for (var key in filtersData){
                if (filtersData.hasOwnProperty(key)){
                    delete filtersData[key];
                }
            }
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

            console.log(selected);
            // Track events in piwik
            for (var i=0; i<selected.length; i++) {
                var facetCollection = selected[i];
                var collectionLabel = facetCollection.key;
                for (var j=0; j<facetCollection.filters.length; j++) {
                    var facetLabel = facetCollection.filters[j].key;
                    // console.log(" -- tracking: " + collectionLabel + " - " + facetLabel);
                    $analytics.eventTrack('collectionLabel', {"category": "associationFacet", "label": facetLabel});
                }
            }
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
            for (var key in filtersData){
                if (filtersData.hasOwnProperty(key)){
                    delete filtersData[key];
                }
            }
            filters.length = 0;
            selected.length = 0;
            selectedCount = 0;
            pageFacetsStack.length = 0;
        }


        cttvFiltersService.update = function(){
            update();
        }


        /**
         * Example status:
         * "status": ["ok"]
         * "status": ["partial-facet-datatypes"]
         * "status": ["partial-facet-datatypes", "partial-facet-pathway"]
         */
        cttvFiltersService.status = function(stt){
            if(stt){
                //status = stt; //(stt==cttvConsts.OK.toLowerCase()) ? 1 : 0;
                if(stt[0] == cttvConsts.OK.toLowerCase()){
                    status = [stt[0]];
                } else {
                    status = stt.map(function(item){
                        return item.substring(14);
                    })
                }

            }
            return status;
        }


        return cttvFiltersService;



    }]);
