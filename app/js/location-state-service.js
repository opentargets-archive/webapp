

/* Services */

angular.module('cttvServices').



    factory('cttvLocationState', ['$log', '$location', '$rootScope', function($log, $location, $rootScope) {


        var cttvLocationStateService = {};
        var state = {};     // this should be the parsed $location.search() object
        var old_state = {};  // TODO: not sure we'll actually need this



        var updateState = function(new_state){
            $log.log("[event] cttvLocationState." + cttvLocationStateService.STATECHANGED);
            old_state = state;
            state = new_state;
            $rootScope.$broadcast(cttvLocationStateService.STATECHANGED, state, old_state);
        }



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
        }



        /**
         * Returns a string representation of the specified object, in a format matching the syntax:
         * Example:
         * var obj = {datatype:["drugs","literature","animals"], pathways:"sdfs"}
         * param(obj); // returns "datatype:drugs,datatype:literature,datatype:animals,pathways:sdfs"
         */
        cttvLocationStateService.param = function(obj){
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
            return $.param(obj,true).replace(/=/g,":").replace(/&/g,",");
        }



        /**
         * Parse the location search object strings and return a full object
         * Example:
         * var search={ ftcs:"datatype:drugs,datatype:literature,datatype:animals,pathways:sdfs" }
         * parseLocationSearch(search) // returns {ftcs:{datatype:["drugs","literature","animals"], pathways:"sdfs"}}
         */
        cttvLocationStateService.parseLocationSearch = function(search){

            search = search || $location.search();
            var raw = {};

            for(var i in search){
                if(search.hasOwnProperty(i)){
                    raw[ i ] = search[i];

                    if( typeof raw[ i ] === "string" ) {

                        // if this is a string the new state format (e.g. "view=t:bubble,p:1", then we parse it)
                        if( raw[ i ].match(/.:./) ){
                            raw[i] = parseSearchItem(search[i]);
                        }
                        // but if it's only just a plain string we keep it as it is, ideally
                        else {

                        }

                    }
                }
            }

            return raw;
        }



        /**
         * get the state object
         */
        cttvLocationStateService.getState = function(){
            return state;
        }



        /**
         * get the state object
         */
        cttvLocationStateService.getOldState = function(){
            return old_state;
        }



        /**
         * Set the state object to the given one (full override)
         */
        cttvLocationStateService.setState = function(so){
            state = so;
            cttvLocationStateService.updateStateURL();
        }



        /**
         * Update the state object only for the specific sub-object
         */
        cttvLocationStateService.setStateFor = function(k, so, track){
            $log.log("setStateFor "+k);
            if(track==undefined){track=true;}
            state[k] = so;
            if( !state[k] || Object.keys(state[k]).length==0 ){
                delete state[k];
            }

            if(track){
                cttvLocationStateService.updateStateURL();
            }

        }


        cttvLocationStateService.resetStateFor = function(k){
            cttvLocationStateService.setStateFor(k, {}, false)
        }


        /**
         * Updates the URL search with the current state object
         */
        cttvLocationStateService.updateStateURL = function(){

            var stt = {}
            for(var i in state){
                if(state.hasOwnProperty(i)){
                    stt[i] = cttvLocationStateService.param(state[i]);
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
        $rootScope.$on('$locationChangeSuccess', function(){

            updateState( cttvLocationStateService.parseLocationSearch( $location.search() ) );

        });


        return cttvLocationStateService;



    }]);





