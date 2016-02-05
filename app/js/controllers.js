  /* Controllers */

    angular.module('cttvControllers', [])
    .run (['$rootScope', '$window', function ($rootScope, $window) {
        'use strict';
        $rootScope.showApiErrorMsg = false;
        $rootScope.$on("cttvApiError", function (event, data) {
            if (data.status === 403) {
                $rootScope.showApiErrorMsg = true;
            }
        });
        $rootScope.reloadPage = function () {
            $window.location.reload();
        };
    }])

    /**
     * SearchAppCtrl
     * Controller for the search/results page
     */
    .controller('SearchAppCtrl', ['$scope', '$location', '$log', 'cttvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cttvAppToAPIService, cttvAPIservice) {
        'use strict';
        $log.log('SearchCtrl()');


        $scope.search = cttvAppToAPIService.createSearchInitObject();
        $scope.filters = {
            target : {
                total : 0,
                selected: false,
                loading: false
            },
            disease : {
                total : 0,
                selected : false,
                loading: false
            }
        };

        /**
        Something like:
            {
                query:{
                    q: APP_QUERY_Q, // ""
                    page: APP_QUERY_PAGE,   // 1
                    size: APP_QUERY_SIZE    // 10
                },

                results:{}
            }
        */

        var getFiltersData = function(){

            $scope.filters.target.loading = true;
            cttvAPIservice.getSearch({
                    q: $scope.search.query.q,
                    size : 1,
                    filter : 'gene'
                }).
                then(
                    function(resp) {
                        $scope.filters.target.total = resp.body.total;
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    $scope.filters.target.loading = false;
                });

            $scope.filters.disease.loading = true;
            cttvAPIservice.getSearch({
                    q: $scope.search.query.q,
                    size : 1,
                    filter : 'efo'
                }).
                then(
                    function(resp) {
                        $scope.filters.disease.total = resp.body.total;
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    $scope.filters.disease.loading = false;
                });

        };


        $scope.getResults = function(){

            /*
            if( !$scope.filters.gene.selected && !$scope.filters.efo.selected ){
                // show no result if no filter is selected
                $log.warn("no filter selcted");
                $scope.search.results = null;
                return;
            }
            */

            // before getting new results,
            // we make sure we clear any current results (like in the case
            // of applying a filter), which also causes the spinner to show...
            $scope.search.loading = true;


            var queryobject = cttvAppToAPIService.getApiQueryObject(cttvAppToAPIService.SEARCH, $scope.search.query);
            // if one and only one of the filters is selected, apply the corresponding filter
            // cool way of mimicking a XOR operator ;)
            if( $scope.filters.target.selected != $scope.filters.disease.selected ){
                queryobject.filter = $scope.filters.target.selected ? 'target' : 'disease';
            }

            cttvAPIservice.getSearch( queryobject )
                .then(
                    function(resp) {
                        console.log("SEARCH RESULTS:");
                        console.log(resp);
                        $scope.search.results = resp.body;
                    },
                    cttvAPIservice.defaultErrorHandler
                )
                .finally(function(){
                    $scope.search.loading = false;
                });

        };


        if($location.search().q){
            // parse parameters
            $scope.search.query.q = $location.search().q || "";

            // need a way of parsing filters too...

            // and fire the search
            $scope.getResults();
            getFiltersData();
        }


    }]).



    controller('SearchResultsCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {

    }]).


    controller('MastheadCtrl', ['$scope', '$location', '$log', function ($scope, $location, $log) {
        'use strict';
        $log.log('MastheadCtrl()');
        $scope.location = $location;

    }]).

    controller('D3TestCtrl', ['$scope', '$log', function ($scope, $log) {
        $log.log("D3TestCtrl");
    }]);
