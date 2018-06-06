/* Services */

angular.module('otServices')

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    .factory('otDefinitions', ['initConfig', function (initConfig) {
        'use strict';

        return initConfig.definitions;
    }]);
