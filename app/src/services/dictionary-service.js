/* Services */

angular.module('otServices')

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    .factory('otDictionary', ['initConfig', function (initConfig) {
        'use strict';

        var dictionary = initConfig.dictionary;

        dictionary.invert = function (val) {
            var a = invLookup(dictionary, val);
            return a;
        };

        function invLookup (o, v) {
            var k = undefined;
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

        return dictionary;
    }]);
