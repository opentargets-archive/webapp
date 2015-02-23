'use strict';


/* Services */

angular.module('cttvServices', []).




    /** 
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvAPIservice', ['$http', '$log', '$location', function($http, $log, $location) {



        /*
         * Initial configuration of the service, with API's URLs
         */
        var cttvAPI = {
            API_DEFAULT_METHOD : "GET",
            API_URL : "http://193.62.52.228/api/latest/",
            API_SEARCH_URL : "search",
            API_EVIDENCE_URL : "evidences",
            API_AUTOCOMPLETE_URL : "autocomplete",
            API_FILTERBY_URL : 'filterby',
            API_EFO_URL : 'efo',
            API_ASSOCIATION_URL : 'association',
            API_GENE_URL : 'gene',
        };

        // the request configuration object.
        // Here we set the default values, then populate the rest in the callAPI function
        /*var req = {
            withCredentials: true,
            headers: {
                'Authorization' : 'Basic Y3R0djpkajhtaXhpamswNGpwZGc='
            }
        }*/


        /* 
          App running on localhost:
          we rest some values
        */
        if( $location.host()=='127.0.0.1' || $location.host().toLowerCase()=='localhost' ){
            cttvAPI.API_URL = "http://127.0.0.1:8080/api/latest/";
            //req.withCredentials = false;
            //req.headers = {};
        }



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
            // set common stuff
            var req = {};   // this must be initialized for every call!!!
            req.method = cttvAPI.API_DEFAULT_METHOD;
            if( queryObject.params && queryObject.params.method ){
                req.method = queryObject.params.method;
                //delete queryObject.params.method;
            }
            req.url = cttvAPI.API_URL + queryObject.operation;
            if(req.method.toLowerCase() === 'get'){
                req.params = queryObject.params;
            } else if (req.method.toLowerCase() === 'post'){
                req.data = queryObject.params;
            }
            return $http(req);
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



        /**
         * Get... mmmh.... this is actually filerby()
         */
        cttvAPI.getAssociations = function(queryObject){
            $log.log("cttvAPI.getAssociations()");

            return callAPI({
                operation : cttvAPI.API_FILTERBY_URL,
                params : queryObject
            });
        }



        /**
         * Gets the info to be displayed in the serach suggestions box
         * via call to the autocomplete() API method
         */
        cttvAPI.getAutocomplete = function(queryObject){
            $log.log("cttvAPI.getAutocomplete()");

            return callAPI({
                operation : cttvAPI.API_AUTOCOMPLETE_URL,
                params : queryObject
            });
        }



        /**
         * Get disease details via API efo() method based on EFO code
         * queryObject params:
         *  - efo: the EFO code in format "EFO_xxxxxxx"
         */
        cttvAPI.getEfo = function(queryObject){
            $log.log("cttvAPI.getEfo");

            return callAPI({
                operation: cttvAPI.API_EFO_URL + "/" + queryObject.efo,
            });
        }



        /**
         * Get gene details via API gene() method based on ENSG code
         * queryObject params:
         *  - gene: the ENSG code, e.g. "ENSG00000005339"
         */
        cttvAPI.getGene = function(queryObject){
            $log.log("cttvAPI.getGene");

            return callAPI({
                operation: cttvAPI.API_GENE_URL + "/" + queryObject.gene,
            });
        }


        
        /**
         * Careful not to confuse this with the other above (which btw should be renamed for clarity)
         * This returns the association scores.
         *
         * queryObject params:
         *  - gene: ENSG id, e.g. ENSG00000107562
         *  - efo: EFO code, e.g. EFO_0002917
         */
        cttvAPI.getAssociation = function(queryObject){
            $log.log("cttvAPI.getAssociation");

            return callAPI({
                operation: cttvAPI.API_ASSOCIATION_URL,
                params: queryObject
            })
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
                    break;

                   
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


