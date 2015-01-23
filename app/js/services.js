'use strict';


/* Services */

angular.module('cttvServices', []).




    /** 
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvAPIservice', ['$http', '$log', function($http, $log) {



        /*
         * Initial configuration of the service, with API's URLs
         */
        var cttvAPI = {
            API_DEFAULT_METHOD : "get",
            API_URL : "http://193.62.52.228/api/latest/", //http://127.0.0.1:8008/api/latest/",
            API_SEARCH_URL : "search",
            API_EVIDENCE_URL : "evidences",
            API_AUTOCOMPLETE_URL : "autocomplete",
        };



        /*
         * Private function to actually call the API
         * queryObject:
         *  - method: ['GET' | 'POST']
         *  - operation: 'search' | 'evidence' | ...
         *  - params: Object with:
         *              - q: query string
         *              - from: number to start from
         *              - size: number of results
         */
        var callAPI = function(queryObject){

            return $http(
                {
                    method: queryObject.method || cttvAPI.API_DEFAULT_METHOD,
                    url: cttvAPI.API_URL + queryObject.operation,
                    params: queryObject.params
                }
            );
        }



        /**
         * Get a full search.
         * Returns a promise object with methods then(), success(), error()
         *
         * Examples:
         *
         * cttvAPI.getSearch({q:'braf'}).success(function(data) {
         *      $scope.search.results = data;
         *      console.log(data);
         *  });
         *
         *
         * cttvAPIservice.getSearch({q:val}).then(function(response){
         *      return response.data.data;
         *  });
         *
         */
        cttvAPI.getSearch = function(queryObject){
            $log.log("cttvAPI.getSearch()");

            return callAPI({
                operation : cttvAPI.API_SEARCH_URL,
                params : queryObject
            });
        }



        /**
         * Search for evidence using the evidence() API function.
         * Returns a promise object with methods then(), success(), error()
         */
        cttvAPI.getEvidence = function(queryObject){
            $log.log("cttvAPI.getEvidence()");

            return callAPI({
                operation : cttvAPI.API_EVIDENCE_URL,
                params : queryObject
            });
        }



        cttvAPI.getAutocomplete = function(queryObject){
            $log.log("cttvAPI.getAutocomplete()");

            return callAPI({
                operation : cttvAPI.API_AUTOCOMPLETE_URL,
                params : queryObject
            });
        }



        return cttvAPI;
    }]).






    /**
     * A service to handle search in the app.
     * This talks to the API service
     */
    factory('cttvAppToAPIService', ['$http', '$log', function($http, $log) {
        
        
        var APP_QUERY_Q = "",
            APP_QUERY_PAGE = 1,
            APP_QUERY_SIZE = 10;


        var cttvSearchService = {
            SEARCH: "search",
            EVIDENCE: 'evidence'
        };



        cttvSearchService.createSearchInitObject = function(){
            return {
                query:{
                    q: APP_QUERY_Q,
                    page: APP_QUERY_PAGE,
                    size: APP_QUERY_SIZE
                },

                results:{}
            };
        }



        cttvSearchService.getApiQueryObject = function(type, queryObject){
            var qo = {
                size: queryObject.size,
                from: (queryObject.page - 1) * queryObject.size
            }

            switch (type){
                case this.SEARCH:
                    qo.q = queryObject.q.title || queryObject.q
                    break;

                case this.EVIDENCE:
                    qo.gene = queryObject.q.title || queryObject.q;
                    qo.datastructure = 'simple';
                    break
            }

            return qo;
        }



        cttvSearchService.getSearch = function(){

        }


        /*
        var parseQueryParameters = function(qry){
            // set the query text
            $scope.search.query.q = qry.q || "";
            
            // set the query size (i.e. results per page)
            //$scope.search.query.size = APP_QUERY_SIZE;
            //if(qry.size){
            //    $scope.search.query.size = parseInt(qry.size);
            //}

            // set the query page
            //$scope.search.query.page = APP_QUERY_PAGE;
            //if(qry.page){
            //    $scope.search.query.page = parseInt(qry.page);
            //}
        }
        */



        /*
        var queryToUrlString = function(){
            return 'q=' + ($scope.search.query.q.title || $scope.search.query.q);
            // for now we don't want to set pagination via full URL
            // as this is causing some scope problems. If needed, we'll think about it
            //+ '&size=' + $scope.search.query.size 
            //+ '&page=' + $scope.search.query.page;
        }
        */


        return cttvSearchService;
    }]).






    /**
     * A dummy service
     */
    factory('notify', ['$window', function(win) {
        var msgs = [];
        return function(msg) {
            msgs.push(msg);
            if (msgs.length == 3) {
                win.alert(msgs.join("\n"));
                msgs = [];
            }
        };
    }]);


