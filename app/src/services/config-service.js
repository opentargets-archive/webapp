/* Services */

angular.module('otServices')


    /**
     * The Config service.
     * This stores global config variables for the font end
     */
    .factory('otConfig', ['otConsts', 'initConfig', function (otConsts, initConfig) {
        'use strict';

        function applyDb (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (angular.isObject(obj[prop]) && !angular.isArray(obj[prop])) {
                        applyDb(obj[prop]);
                    } else {
                        for (var i = 0; i < obj[prop].length; i++) {
                            var item = obj[prop][i];
                            if (otConsts.datasources[item]) {
                                obj[prop][i] = otConsts.datasources[item].id;
                            }
                        }
                    }
                }
            }
        }

        applyDb(initConfig.general.evidence_sources);

        return initConfig.general;
    }]);
