/* Services */

angular.module('otServices')


    /**
     * The API services, with methods to call the ElasticSearch API
     */
    .factory('otConsts', ['initConfig', function (initConfig) {
        'use strict';
        var consts = initConfig.consts;

        // do we add datatypes and datasources here?
        consts.datatypes = initConfig.datatypes;
        consts.datasources = initConfig.datasources;

        consts.invert = function (val) {
            var a = invLookup(consts, val);
            return a;
        };

        function invLookup (o, v) {
            var k;
            for (var i in o) {
                if (o.hasOwnProperty(i)) {
                    if (o[i] === v) {
                        k = i;
                        return k;
                    }
                    if (typeof o[i] === 'object') {
                        k = invLookup(o[i], v);
                        if (k) { return k; }
                    }
                }
            }
            return k;
        }


        return consts;
    }]);
