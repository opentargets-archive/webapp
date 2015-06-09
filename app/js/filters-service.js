'use strict';


/* Filters services */

angular.module('cttvServices').



    /**
     *
     */
    factory('cttvFiltersService', ['$log', '$location', 'cttvDictionary', 'cttvConsts', function($log, $location, cttvDictionary, cttvConsts) {

        // set the default datatypes:
        // only animal models are filtered out (deselected) by default
        var datatypes = [
            {id: cttvConsts.datatypes.GENETIC_ASSOCIATION, selected:true},
            {id: cttvConsts.datatypes.SOMATIC_MUTATION, selected:true},
            {id: cttvConsts.datatypes.KNOWN_DRUG, selected:true},
            {id: cttvConsts.datatypes.RNA_EXPRESSION, selected:true},
            {id: cttvConsts.datatypes.AFFECTED_PATHWAY, selected:true},
            {id: cttvConsts.datatypes.ANIMAL_MODEL, selected:false}
        ];

        // filters:
        // array of FilterCollections
        // we bind to this object, so must take to only reset its content and NOT replace the whole object
        var filters = [];

        // it would be great to hold the filters state for the pages we visit
        // however we should probably also be able to share this via URL
        // which would be a more flexible and robust approach...
        var pages = {};



        /*
         * Private Filter class
         * o:Object - optional config object
         */
        function Filter(o){
            this.id = o.id || "";
            this.label = o.label || "";
            this.count = o.count || 0;
            this.enabled = o.enabled==undefined ? true : o.enabled;
            this.selected = o.selected==undefined ? false : o.selected;
        }

            Filter.prototype.toggle = function(){
                $log.log("toggle "+cttvFiltersService.hasChanged);
                this.setSelected(!this.selected);
            }

            Filter.prototype.setSelected=function(b){
                if(this.enabled){
                    this.selected = b;
                    cttvFiltersService.hasChanged++;
                }
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
                this.filters.push(filter);
            }

            FilterCollection.prototype.getSelectedFilters = function(){
                return this.filters.filter(function(obj){
                    return obj.selected;
                });
            }

            FilterCollection.prototype.getSelectedFiltersRaw = function(){
                return this.getSelectedFilters().map(function(obj){
                    return obj.id+"";
                });
            }

            FilterCollection.prototype.selectAll = function(b){
                if(b==true || b==false){
                    this.filters.forEach(function(f){
                        f.setSelected(b);
                    });
                }
            }




        /**
         * The actual service
         */
        var cttvFiltersService = {};

        cttvFiltersService.hasChanged = 0;

        cttvFiltersService.addFilter = function(){};



        cttvFiltersService.addCollection = function(obj){
            var collection = new FilterCollection(obj.key, obj.label);
            obj.filters.forEach(function(element){
                $log.log(element);
                collection.addFilter(new Filter(element));
            });
            if(collection.key===cttvConsts.DATATYPES){
                filters.unshift(collection);
            } else {
                filters.push(collection);
            }

        }



        cttvFiltersService.getFilter = function(id){
            var f = null;
            for(var i=0; i<filters.length; i++){
                if(filters[i].id===id){
                    f=filters[i];
                }
            }
            return f;
        };



        // returns array of collections
        cttvFiltersService.getFilters = function(){
            return filters;

            // TODO:
            // this should also be divided by types/categories:
            // filters[
            //    datatypes:[], // {type:string, label:string, filters:array}
            //    terapeautic areas: [],
            //    pathways : []
            //    etc...
            // ]
        };



        /**
         * Remove all existing filters from the list.
         * Reference to the filters array remains intact
         */
        cttvFiltersService.resetFilters = function(){
            $log.log("resetFilters()");
            // simply resetting the array to [] will cause errors as Angular will no longer watch the new object
            // so we use set the length, thus remove every element in the array
            filters.length = 0;
        };



        /**
         * Gets a list of selected filters for API call usage.
         * Return: object containing arrays of string for each facet category
         * Example:
         * {
         *    datatype: ["known_drug", "rna_expression"]
         * }
         */
        cttvFiltersService.getSelectedFiltersRaw = function(){
            var raw = {};
            filters.forEach(function(collection){
                var f=collection.getSelectedFiltersRaw();
                if(f.length>0){
                    raw[collection.key] = f;
                }

            });
            return raw;
        };



        cttvFiltersService.setFilters = function(states){};



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
                        obj.label = cttvDictionary[obj.id.toUpperCase()] || "";
                        return obj;
                    })
                });

            }

        };



        var resetFacets = function(){
            $log.log("resetFacets");
            filters.splice(1, filters.length-1);
            $log.log(filters);
        }


        /**
         * Parse the facets object from the API
         */
        cttvFiltersService.parseFacets=function(facets){
            $log.debug("parseFacets()");
            $log.debug(facets);

            // loop thorugh the facets
            // we probably don't want to do anything with datatypes I guess...
            // resetFacets();
            this.resetFilters();


            for (var collection in facets) {
                if (facets.hasOwnProperty(collection)) {

                    var config={
                        key: collection,
                        label: cttvDictionary[collection.toUpperCase()] || collection,
                    };

                    if(collection === cttvConsts.DATATYPES){
                        config.filters = datatypes.map( function(obj){
                            var conf = {};
                            var dtb = facets[collection].buckets.filter(function(o){return o.key===obj.id})[0] || {};
                            conf.id = obj.id;
                            conf.label = cttvDictionary[obj.id.toUpperCase()] || "";
                            conf.enabled = dtb.key != undefined; // it's actually coming from the API and not {}
                            conf.selected = obj.selected && conf.enabled;
                            conf.count = dtb.doc_count;
                            return conf;
                        });
                    } else {
                        config.filters = facets[collection].buckets.map(function(obj){
                            var conf = {};
                            conf.id = obj.key;
                            conf.label = obj.label;
                            conf.count = obj.doc_count;
                            return conf;
                        });
                    }
                    cttvFiltersService.addCollection(config);
                }
            }
        }

        cttvFiltersService.initFilters();


        return cttvFiltersService;
    }]);


