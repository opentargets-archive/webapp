

/* Services */

angular.module('cttvServices').



    factory('cttvLocationState', ['$log', '$location', '$rootScope', 'cttvConsts', function($log, $location, $rootScope, cttvConsts) {

        "use strict";

        var cttvLocationStateService = {};
        var state = {};     // state is the parsed $location.search() object
        var old_state = {}; // old_state is updated with value of state just before updating state, so it holds the previous state
        var tmp_state = {}; // tmp_state temporarily holds the state when a component calls updateStateFor: it is used to update the URL which is then parsed back into state

        // the state now has a private property _path that stores, you guessed it,
        // the path of the page to which the state refers to, as returned by the $location.path() function
        // this is used to determine whether to fire the event or not
        state._path = "";
        old_state._path = "";
        tmp_state._path = "";



        /*
         * Updates state and old_state and broadcast a message to the app
         */
        var updateState = function(new_state){
            // update the state and
            old_state = state;
            state = _.cloneDeep( new_state );
            state._path = $location.path();
            tmp_state = _.cloneDeep( new_state );
            tmp_state._path = $location.path();


            // if the URL changed, i.e. we went on a different page, then we don't broadcast the event
            // as that should be taken care by the new page. This is due to two main reasons:
            //  1. when a new page loads, it has already missed on the location change event
            //     and therefore cannot respond to it (need to manually set on load actions)
            //  2. the page we're leaving is still listening and we don't want to respond to
            //     state chagnes there... it's a location change rather than a state change
            if( state._path === old_state._path ){
                // broadcast state update event if we're on the same page
                $rootScope.$broadcast(cttvLocationStateService.STATECHANGED, _.cloneDeep(state), _.cloneDeep(old_state));
            }
        };



        /*
         * Parse a location search item string and return object representation
         * Example:
         * var bob = parseSearchItem("datatype:genetic_association,datatype:drugs")
         * // bob = {datatype:["genetic_association","drugs"]}
         */
        var parseSearchItem = function(item_string){
            var obj = {};
            item_string.split(",").forEach(function(itm){
                var tmp = itm.split(":");
                obj[tmp[0]] = obj[tmp[0]] || []; // make sure the returned value is always an array so we don't have to check every time
                obj[tmp[0]].push(tmp[1]);
            });
            return obj;
        };



        /**
         * Returns a string representation of the specified object, in a format matching the syntax:
         * Example:
         * var obj = {datatype:["drugs","literature","animals"], pathways:"sdfs"}
         * param(obj); // returns "datatype:drugs,datatype:literature,datatype:animals,pathways:sdfs"
         */
        cttvLocationStateService.param = function(obj){
            // $log.log("cttvLocationStateService.param:");
            // $log.log(obj);

            // uses jQuery.param() method
            // $httpParamSerializerJQLike should work the same... but it doesn't and returns parentheses around arrays etc
            // so we stick with jQuery for now
            if( typeof obj === "string" ) {
                // this is to handle simple cases where obj is a simple string,
                // say like in the case of &version=latest
                // it returns "latest";
                // otherwise jQuery would convert it to something like "0=l&1=a&2=t&3=e&4=s&5=t" which turns the URL into an ugly mess
                return obj;
            }
            var s = [];
            for(var i in obj){
                if(Array.isArray(obj[i])){
                    obj[i].forEach(function(a){
                        s.push(i+":"+a);
                    })
                }
                if( typeof obj[i] === "string" ) {
                    s.push(i+":"+obj[i]);
                }
            }

            return s.join(",");
            //return $.param(obj,true).replace(/=/g,":").replace(/&/g,",").replace(/\+/g," ");
        }



        /**
         * Parse the location search object strings and return a full object
         * Example:
         * var search={ ftcs:"datatype:drugs,datatype:literature,datatype:animals,pathways:sdfs" }
         * parseLocationSearch(search) // returns {ftcs:{datatype:["drugs","literature","animals"], pathways:"sdfs"}}
         */
        cttvLocationStateService.parseLocationSearch = function(search){
            //$log.log("parseLocationSearch");
            search = search || $location.search();
            var raw = {};
            // array containing the type of old facets -- TODO: can remove in future when we get rid of backward compatibilty (see comment below)
            var fc = [
                cttvConsts.DATATYPES,
                cttvConsts.PATHWAY,
                cttvConsts.DATASOURCES,
                cttvConsts.THERAPEUTIC_AREAS,
                cttvConsts.DATA_DISTRIBUTION,
                cttvConsts.TARGET,
                cttvConsts.TARGET_CLASS
            ];

            for(var i in search){
                if(search.hasOwnProperty(i)){

                    raw[i] = search[i];

                    if (typeof raw[i] === "string" && raw[i].match(/.:./)) {
                        // this is a string the new state format (e.g. "view=t:bubble,p:1") so then we parse it
                        raw[i] = parseSearchItem(search[i]);
                    }

                    // TODO:
                    // we will * REMOVE THIS * whole "if" block in the future, once old style facets URL have been "flushed" out!
                    //
                    // If any, try and convert old style facets URLs, but only if there are no new style facets
                    if (_.indexOf(fc, i) > -1) {
                        // so if this is an old style facet, check if there are any new style ones, and if not, let's try parse the old facet into new syntax
                        if(!search.fcts){
                            raw.fcts = raw.fcts || {};    // create a "fcts" objects if needed
                            raw.fcts[i] = ( typeof search[ i ] === "string" ) ? [search[i]] : search[i];    // add facets to "fcts"
                        }
                        delete raw[i];  // in any case, now delete the old style facet
                    }
                }
            }

            return raw;
        };



        /**
         * get the state object
         */
        cttvLocationStateService.getState = function(){
            //$log.log("!!!! getState()");
            return _.cloneDeep( state );
        }



        /**
         * get the state object
         */
        cttvLocationStateService.getOldState = function(){
            //$log.log("!!!! getOldState()");
            return _.cloneDeep( old_state );
        }



        /**
         * Set the temp state object to the given one (full override)
         */
        cttvLocationStateService.setState = function(so){
            //$log.log("!!!! setState()");
            tmp_state = so;
            cttvLocationStateService.updateStateURL();
        }



        /**
         * Update the state object only for the specific sub-object
         */
        cttvLocationStateService.setStateFor = function(k, so, track){
            // $log.log("setStateFor ");

            if(track==undefined){track=true;}   // track = (track || track==undefined)
            tmp_state[k] = so;

            if( !tmp_state[k] || Object.keys(tmp_state[k]).length==0 ){
                delete tmp_state[k];
            }

            if(track){
                cttvLocationStateService.updateStateURL();
            }

        }


        cttvLocationStateService.resetStateFor = function(k){
            // $log.log("resetStateFor()");
            cttvLocationStateService.setStateFor(k, {}, false);
        }


        /**
         * Updates the URL search with the current state object
         */
        cttvLocationStateService.updateStateURL = function(){
            //$log.log("!!!! updateStateURL");

            var stt = {}
            for(var i in tmp_state){
                // translate the state to the URL, but we don't want to include the _path property
                if(tmp_state.hasOwnProperty(i) && i!=="_path" ){
                    stt[i] = cttvLocationStateService.param(tmp_state[i]);
                }
            }

            $location.search(stt);
        }



        /**
         * This does absolutely nothing.
         * But call it at the beginning of your controller to sort of wake up / instantiate the service,
         * ensuring it's ready and available in your controller
         */
        cttvLocationStateService.init = function(){
            // do nothing!
        }



        // event constants: STATECHANGED to register listeners for when the state changes
        cttvLocationStateService.STATECHANGED = "cttv_app_state_change";



        // This is the main part of the service:
        // it watches for changes in the URL search, then process the search and fire an event
        // all components that need to update their state based on this will be listening
        // $rootScope.$on('$locationChangeSuccess', function(){
        $rootScope.$on('$locationChangeSuccess', function(){
            updateState( cttvLocationStateService.parseLocationSearch( $location.search() ) );
        });


        return cttvLocationStateService;



    }]);
