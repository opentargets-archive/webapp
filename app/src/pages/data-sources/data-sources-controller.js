angular.module('cttvControllers')

/**
 * data-sources controller
 * Controller for the data sources used in the webapp
 * It loads the config file to know which definitions to show
 */
    .controller('DataSourcesCtrl', ['$scope', 'cttvConfig', function ($scope, cttvConfig) {
        'use strict';

        function applyDataSources (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (angular.isObject(obj[prop]) && !angular.isArray(obj[prop])) {
                        applyDataSources(obj[prop]);
                    } else {
                        for (var i=0; i<obj[prop].length; i++) {
                            $scope[obj[prop][i]] = true;
                        }
                    }
                }
            }
        }

        applyDataSources(cttvConfig.evidence_sources);
    }]);
