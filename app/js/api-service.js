'use strict';


/* Services */

angular.module('cttvServices').




    /** 
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvAPIservice', ['$http', '$log', '$location', '$rootScope', '$q', '$timeout', function($http, $log, $location, $rootScope, $q, $timeout) {



        /*
         * Initial configuration of the service, with API's URLs
         */
        var cttvAPI = {
            API_DEFAULT_METHOD : "GET",
            //API_URL : "http://beta.targetvalidation.org/api/latest/",
	          // API_URL : "http://193.62.52.228/api/latest/",
            API_SEARCH_URL : "search",
            API_EVIDENCE_URL : "evidences",
            API_AUTOCOMPLETE_URL : "autocomplete",
            API_FILTERBY_URL : 'filterby',
            API_EFO_URL : 'disease',
            API_ASSOCIATION_URL : 'associations', // note: these are no longer URLs, but actual API method names
            API_GENE_URL : 'gene',
            API_QUICK_SEARCH_URL : 'quickSearch',
            API_DISEASE_URL: 'disease',
        };



        var api = cttvApi()
            .prefix("/api/latest/")
            // might be doing some configuration here
            //.prefix("http://localhost:8008/api/latest/")
            .appname("cttv-web-app")
            .secret("2J23T20O31UyepRj7754pEA2osMOYfFK");


        
        var token = {

          set : function(tkn){
            clearTimeout(token._int);
            token._int = setTimeout(token._clear, 10000) // 1 min = 60000, 10 mins = 600000
            token._id = tkn;
          },

          get : function(){
            return token._id;
          },

          _id : "",

          _int : -1,

          _clear : function(){
            $log.log("clear "+token._id);
            token._id = "";
            $log.log("  '"+token._id+"'");
          }

        }



        function isSuccess(status) {
            return 200 <= status && status < 300;
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

            var deferred = $q.defer();
            var promise = deferred.promise;
            var url = api.url[queryObject.operation](queryObject.params);

            var resp = api.call(url, done);
            


            return promise;
            //return resp.then(handleSuccess, handleError);


            function done(error, response){
              resolvePromise(response);
              if (!$rootScope.$$phase) $rootScope.$apply();
            }
            
            function resolvePromise(response){
              // normalize internal statuses to 0
              var status = Math.max(response.status, 0);

              // we resolve the the promise on the whole response object,
              // so essentially we pass back the un-processed response object:
              // that means the data we're interested is in response.body.
              (isSuccess(status) ? deferred.resolve : deferred.reject)(response);

              // an alternative approach is to resolve the promise on a custom object
              // so that we don't pass back the whole raw response, but rather we make up the object
              // and choose what we want. 
              // In this example, we go for a more angular/jquery approach and send back data and status.
              // This means that we have to handle things differently in our success handler...
              
              // (isSuccess(status) ? deferred.resolve : deferred.reject)({
              //   data : response.body,
              //   status: response.status
              // });
              
                
              
            }
        }


        



        var optionsToString = function(obj){
            var s="";
            for(var i in obj){
                s+="&"+i+"="+obj[i];
            }
            // remove the leading '&' and returns
            return s.substring(1);
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
                operation : cttvAPI.API_ASSOCIATION_URL,
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
                operation: cttvAPI.API_EFO_URL, // + "/" + queryObject.efo,
                params: queryObject
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
                operation: cttvAPI.API_GENE_URL, // + "/" + queryObject.gene,
                params: queryObject
            });
        }

        /**
         * Get disease details via API disease() method based on EFO ids
         * queryObject params:
         *  - efo: the EFO code
         */
	cttvAPI.getDisease = function (queryObject) {
	    $log.log ("cttvAPI.getDisease");

	    return callAPI ({
		operation: cttvAPI.API_DISEASE_URL,
		params: queryObject
	    });
	};
	
        
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



        cttvAPI.getFilterBy = function(queryObject){
          $log.log("cttvAPI.getFilterBy");

            return callAPI({
                operation: cttvAPI.API_FILTERBY_URL, // + "/" + queryObject.gene,
                params: queryObject
            });
        }



        cttvAPI.getQuickSearch = function(queryObject){
          $log.log("cttvAPI.getQuickSearch()");

            return callAPI({
                operation : cttvAPI.API_QUICK_SEARCH_URL,
                params : queryObject
            });
        }



        cttvAPI.defaultErrorHandler = function(error){
          $log.error("----");
          $log.error(error);
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
    }]);


