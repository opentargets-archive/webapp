angular.module('otDirectives')
    .directive('otCategoricalTableFilter', ['$log', function ($log) {
        return {
            restrict: 'AE',
            templateUrl: 'src/components/known-drug-table/known-drug-table.html',
            scope: {
            },
            link: function (scope, elem, attrs) {
                $log.log('linking categoricalTableFilter');
            }
        };
    }]);
