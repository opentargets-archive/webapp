    'use strict';

    /* Controllers */

    angular.module('cttvControllers', ['cttvServices']).






    /**
     * High level controller for the app
     */
    controller('CttvAppCtrl', ['$scope',  function ($scope) {
        
    }]). 



    /**
     * AssociationsCtrl
     * Controller for the associations page
     * It loads a list of associations for the given search
     */
    // controller('AssociationsCtrl', ['$scope', '$location', '$log', 'cttvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cttvAppToAPIService, cttvAPIservice) {
    controller ("AssociationsCtrl", ['$scope', '$location', '$log', function ($scope, $location, $log) {
        $log.log('AssociationsCtrl()');
        $scope.search = {
    	query : $location.search().q,
    	label : $location.search().label
        };
        $scope.took = 0;
        $scope.nresults = 0;
        // $scope.search = cttvAppToAPIService.createSearchInitObject();

        /*
         * NOTE: this is a temporary function. It will change when we have the final API call for this
         * In the meantime we process and count results here
         */
        // var processData = function(data){
        //     console.log("processData() "+data.data.length);
        //     var d = {};
        //     for(var i=0; i<data.data.length; i++){
        //         if( d[data.data[i]["biological_object.efo_info.efo_label"]] == undefined ){
        //             d[data.data[i]["biological_object.efo_info.efo_label"]] = 1;
        //         } else {
        //             d[data.data[i]["biological_object.efo_info.efo_label"]]++;
        //         }
        //     }
            
        //     var dj = { "name": $scope.search.label, "children":[] };
        //     for(var i in d){
        //         dj.children.push( {"name": i, "value": d[i]} );
        //     }


        //     return dj;
        // }



        /*
         * Exposed method to be called by the pagination
         */
        // $scope.getResults = function(){
        //     return cttvAPIservice.getEvidence( cttvAppToAPIService.getApiQueryObject(cttvAppToAPIService.EVIDENCE, $scope.search.query) ).
        //         success(function(data, status) {
        //             // process and count the data and then show the bubbles...
        //             $scope.search.results = data;
        //             $scope.d3data = processData(data);
        //         }).
        //         error(function(data, status) {
        //             $log.error("ERROR "+status);
        //         });
        // }

        // if($location.search().q){
        //     // parse parameters
        //     $scope.search.query.q = $location.search().q || "";

        //     // for the bubble chart:
        //     $scope.search.query.size=1000; // get all the results we can in one request
        //     $scope.search.label = $location.search().label || "";
            
        //     // and fire the search
        //     $scope.getResults();
        // }
        
    }]).






    /**
     * SearchAppCtrl
     * Controller for the search/results page
     */
    controller('SearchAppCtrl', ['$scope', '$location', '$log', 'cttvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cttvAppToAPIService, cttvAPIservice) {
        
        $log.log('SearchCtrl()');

        
        $scope.search = cttvAppToAPIService.createSearchInitObject();

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

        $scope.test=function(){
            console.log("test");
        }

        $scope.getResults = function(){
            return cttvAPIservice.getSearch( cttvAppToAPIService.getApiQueryObject(cttvAppToAPIService.SEARCH, $scope.search.query) ).
                success(function(data, status) {
                    $scope.search.results = data;
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }


        if($location.search().q){
            // parse parameters
            $scope.search.query.q = $location.search().q || "";

            // need a way of parsing filters too...

            // and fire the search
            $scope.getResults();
        }


    }]).



    controller('SearchResultsCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
        
    }]).


    controller('MastheadCtrl', ['$scope', '$location', '$log', function ($scope, $location, $log) {
        
        $log.log('MastheadCtrl()');
        $scope.location = $location;

    }]).

    controller('D3TestCtrl', ['$scope', '$log', function ($scope, $log) {
        $log.log("D3TestCtrl");
    }])



