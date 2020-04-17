angular.module('otPlugins')
    .directive('otSafety', [function () {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: '/plugins/safety/safety.html',
            scope: {
                target: '='
            },
            link: function (scope, elem, attrs) {
                scope.hasSafetyData = scope.target.safety ? true : false;
                if (scope.target.safety) {
                    scope.data = {
                        adverse_effects: scope.target.safety.adverse_effects,
                        risk_info: scope.target.safety.safety_risk_info,
                        tox21: scope.target.safety.experimental_toxicity ? scope.target.safety.experimental_toxicity.filter(function (t) {
                            return t.data_source.toLowerCase() === 'tox21';
                        }) : null,
                        etox: scope.target.safety.experimental_toxicity ? scope.target.safety.experimental_toxicity.filter(function (t) {
                            return t.data_source.toLowerCase() === 'etox';
                        }) : null
                    };

                    // some of the data arrays could be empty,
                    // so for convenience we do our length check here:
                    scope.hasData = {
                        adverse_effects: scope.data.adverse_effects && scope.data.adverse_effects.length > 0,
                        risk_info: scope.data.risk_info && scope.data.risk_info.length > 0,
                        tox21: scope.data.tox21 && scope.data.tox21.length > 0,
                        etox: scope.data.etox && scope.data.etox.length > 0
                    }
                } else {
                    scope.data = {};
                }
            }
        };
    }]);
