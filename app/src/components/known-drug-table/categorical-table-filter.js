angular.module('otFilters')
    .filter('otCategoricalTableFilter', ['$log', function ($log) {
        return function (data, countryCriteria) {
            $log.log('inside filter');
            return (data || []).filter(function (item) {
                return countryCriteria.indexOf(item.phase) !== -1;
            });
        };
    }]);
