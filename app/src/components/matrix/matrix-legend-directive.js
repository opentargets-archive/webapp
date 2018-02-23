angular.module('otDirectives')
    /*
    *
    */
    .directive('otMatrixLegend', [function () {
        'use strict';
        var template = '<div class="matrix-legend matrix-legend-layout-{{layout}} clearfix">'

        // label above (v layout) or left (h layout) of legend
        +    '<span class="matrix-legend-from" ng-show="layout==\'h\'">{{labels[0] || colors[0].label}}</span>'
        // create the color swatches
        +    '<span class="matrix-legend-item clearfix" ng-repeat="item in colors">'
        +       '<span class="matrix-legend-background" ng-style="{\'background\':item.color}" ng-class="item.class"></span>'
        +       '<span class="matrix-legend-background-label matrix-legend-to" ng-hide="layout==\'h\'">{{item.label}}</span>'
        +    '</span>'

        // label below (v layout) or right (h layout) of legend
        +    '<span class="matrix-legend-to" ng-show="layout==\'h\'">{{labels[labels.length-1] || colors[colors.length-1].label}}</span>'

        + '</div>'

        // extra info
        + '<div class="matrix-legend-info"><a ng-if="legendText!=undefined" href="https://docs.targetvalidation.org/scoring.html"><span class="fa fa-question-circle"></span><span class="matrix-legend-text">{{legendText}}</span></a></div>';
        return {
            restrict: 'AE',
            template: template,
            scope: {
                labels: '=',
                colors: '=',
                legendText: '=',
                layout: '@'
            },

            controller: ['$scope', function ($scope) {
                // set the default layout
                $scope.layout = $scope.layout ? $scope.layout : 'v';
            }]

        };
    }]);
