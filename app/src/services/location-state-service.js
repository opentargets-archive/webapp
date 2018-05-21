/* Services */

angular.module('otServices')


    .factory('otLocationState', ['$location', '$rootScope', 'otConsts', function ($location, $rootScope, otConsts) {
        'use strict';

        var otLocationStateService = {};
        var state = {};     // state is the parsed $location.search() object
        var old_state = {}; // old_state is updated with value of state just before updating state, so it holds the previous state
        var tmp_state = {}; // tmp_state temporarily holds the state when a component calls updateStateFor: it is used to update the URL which is then parsed back into state

        // the state now has a private property _path that stores, you guessed it,
        // the path of the page to which the state refers to, as returned by the $location.path() function
        // this is used to determine whether to fire the event or not
        state._path = '';
        old_state._path = '';
        tmp_state._path = '';


        /*
         * Updates state and old_state and broadcast a message to the app
         */
        var updateState = function (new_state) {
            // update the state and
            old_state = state;
            state = _.cloneDeep(new_state);
            state._path = $location.path();
            tmp_state = _.cloneDeep(new_state);
            tmp_state._path = $location.path();


            // if the URL changed, i.e. we went on a different page, then we don't broadcast the event
            // as that should be taken care by the new page. This is due to two main reasons:
            //  1. when a new page loads, it has already missed on the location change event
            //     and therefore cannot respond to it (need to manually set on load actions)
            //  2. the page we're leaving is still listening and we don't want to respond to
            //     state chagnes there... it's a location change rather than a state change
            if (state._path === old_state._path) {
                // broadcast state update event if we're on the same page
                $rootScope.$broadcast(otLocationStateService.STATECHANGED, _.cloneDeep(state), _.cloneDeep(old_state));
            }
        };


        /*
         * Parse a location search item string and return object representation
         */
        var parseSearchItem = function (str) {
            // Note:
            // Parsing a search item needs to be backwards compatible with the more verbose form A
            // but also support the concise form B.
            //
            // A: "datatype:genetic_association,datatype:drugs,datasources:chembl"
            // B: "datatype:genetic_association;drugs,datasources:chembl"
            //
            // ie.   A uses list_id_separator = ':'  lists_separator = ',' (but list_ids can reoccur)
            // while B uses list_separator = ';'  list_id_separator = ':'  lists_separator = ','
            var keyValueStrs = str.split(',');
            var keys = [];
            var listStrs = {};
            keyValueStrs.forEach(function (keyValueStr) {
                // keyValueStr could be of form 'datatype:genetic_association' or 'datatype:genetic_association;drugs'
                var kv = keyValueStr.split(':');
                var key = kv[0];
                var value = kv[1];

                // key could already have occurred in listStrs
                if (!(key in listStrs)) {
                    listStrs[key] = [];
                }

                // value could be a string or a ;-separated array of strings
                value.split(';').forEach(function (el) {
                    listStrs[key].push(el);
                });
            });
            return listStrs;
        };


        /**
         * Returns a string representation of the specified object.
         */
        otLocationStateService.param = function (entity) {
            // Note:
            // Serializing entities will change to the format B described in parseSearchItem.
            // ie. using list separator = ';'  list id separator = ':'  lists separator = ','
            //
            // Example:
            // var obj = {datatype:["drugs","literature","animals"], pathways:"sdfs"}
            // B: 'datatype:drugs;literature;animals,pathways:sdfs'
            // (not the previously used) A: 'datatype:drugs,datatype:literature,datatype:animals,pathways:sdfs'
            if (typeof entity === 'string') {
                return entity;
            }
            if (typeof entity === 'number') {
                return entity;
            }
            var strList = [];

            for (var key in entity) {
                if (Array.isArray(entity[key]) && (entity[key].length > 0)) {
                    strList.push(key + ':' + entity[key].join(';'));
                }
                if ((typeof entity[key] === 'string') || (typeof entity[key] === 'number')) {
                    strList.push(key + ':' + entity[key]);
                }
            }

            return strList.join(',');
        };


        /**
         * Parse the location search object strings and return a full object
         * Example:
         * var search={ ftcs:"datatype:drugs,datatype:literature,datatype:animals,pathways:sdfs" }
         * parseLocationSearch(search) // returns {ftcs:{datatype:["drugs","literature","animals"], pathways:"sdfs"}}
         */
        otLocationStateService.parseLocationSearch = function (search) {
            search = search || $location.search();
            var raw = {};
            // array containing the type of old facets -- TODO: can remove in future when we get rid of backward compatibilty (see comment below)
            var fc = [
                otConsts.DATATYPES,
                otConsts.PATHWAY,
                otConsts.DATASOURCES,
                otConsts.THERAPEUTIC_AREAS,
                otConsts.DATA_DISTRIBUTION,
                otConsts.TARGET,
                otConsts.TARGET_CLASS
            ];

            for (var i in search) {
                if (search.hasOwnProperty(i)) {
                    raw[i] = search[i];

                    if (typeof raw[i] === 'string' && raw[i].match(/.:./)) {
                        // this is a string the new state format (e.g. "view=t:bubble,p:1") so then we parse it
                        raw[i] = parseSearchItem(search[i]);
                    }

                    // TODO:
                    // we will * REMOVE THIS * whole "if" block in the future, once old style facets URL have been "flushed" out!
                    //
                    // If any, try and convert old style facets URLs, but only if there are no new style facets
                    if (_.indexOf(fc, i) > -1) {
                        // so if this is an old style facet, check if there are any new style ones, and if not, let's try parse the old facet into new syntax
                        if (!search.fcts) {
                            raw.fcts = raw.fcts || {};    // create a "fcts" objects if needed
                            raw.fcts[i] = (typeof search[i] === 'string') ? [search[i]] : search[i];    // add facets to "fcts"
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
        otLocationStateService.getState = function () {
            return _.cloneDeep(state);
        };


        /**
         * get the state object
         */
        otLocationStateService.getOldState = function () {
            return _.cloneDeep(old_state);
        };


        /**
         * Set the temp state object to the given one (full override)
         */
        otLocationStateService.setState = function (so) {
            tmp_state = so;
            otLocationStateService.updateStateURL();
        };


        /**
         * Update the state object only for the specific sub-object
         */
        otLocationStateService.setStateFor = function (k, so, track) {
            if (track === undefined) { track = true; }   // track = (track || track==undefined)
            tmp_state[k] = so;

            if (!tmp_state[k] || Object.keys(tmp_state[k]).length === 0) {
                delete tmp_state[k];
            }

            if (track) {
                otLocationStateService.updateStateURL();
            }
        };


        otLocationStateService.resetStateFor = function (k) {
            otLocationStateService.setStateFor(k, {}, false);
        };


        /**
         * Updates the URL search with the current state object
         */
        otLocationStateService.updateStateURL = function () {
            var stt = {};
            for (var i in tmp_state) {
                // translate the state to the URL, but we don't want to include the _path property
                if (tmp_state.hasOwnProperty(i) && i !== '_path') {
                    stt[i] = otLocationStateService.param(tmp_state[i]);
                }
            }

            $location.search(stt);
        };


        /**
         * This does absolutely nothing.
         * But call it at the beginning of your controller to sort of wake up / instantiate the service,
         * ensuring it's ready and available in your controller
         */
        otLocationStateService.init = function () {
            // do nothing!
        };


        // event constants: STATECHANGED to register listeners for when the state changes
        otLocationStateService.STATECHANGED = 'cttv_app_state_change';


        // This is the main part of the service:
        // it watches for changes in the URL search, then process the search and fire an event
        // all components that need to update their state based on this will be listening
        $rootScope.$on('$locationChangeSuccess', function () {
            updateState(otLocationStateService.parseLocationSearch($location.search()));
            ga('send', 'pageview', $location.path());
        });


        return otLocationStateService;
    }]);
