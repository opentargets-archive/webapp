
/* Services */

angular.module('cttvServices')


    /** º
     * The Config service.
     * This stores global config variables for the font end
     */
    .factory('otConfig', ['cttvConsts', 'initConfig', function (cttvConsts, initConfig) {
        'use strict';

        function applyDb (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (angular.isObject(obj[prop]) && !angular.isArray(obj[prop])) {
                        applyDb(obj[prop]);
                    } else {
                        for (var i = 0; i < obj[prop].length; i++) {
                            var item = obj[prop][i];
                            if (cttvConsts.dbs[item]) {
                                obj[prop][i] = cttvConsts.dbs[item];
                            }
                        }
                    }
                }
            }
        }

        applyDb(initConfig.evidence_sources);

        return initConfig;
    }]);
