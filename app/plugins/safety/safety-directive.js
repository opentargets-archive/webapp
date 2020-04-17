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
                        tox21: !scope.target.safety.experimental_toxicity ? undefined : scope.target.safety.experimental_toxicity.filter(function (t) {
                            return t.data_source.toLowerCase() === 'tox21';
                        }),
                        etox: !scope.target.safety.experimental_toxicity ? undefined : scope.target.safety.experimental_toxicity.filter(function (t) {
                            return t.data_source.toLowerCase() === 'etox';
                        })
                    };
                } else {
                    scope.data = {};
                }
            }
        };
    }]);
