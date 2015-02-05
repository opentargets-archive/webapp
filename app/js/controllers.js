    'use strict';

    /* Controllers */

    angular.module('cttvControllers', ['cttvServices']).






    /**
     * High level controller for the app
     */
    controller('CttvAppCtrl', ['$scope',  function ($scope) {
        
    }]). 


    /**
       * GeneDiseaseCtrl
       * Controller for the Gene <-> Disease page
       * It loads the evidence for the given target <-> disease pair
    */
    controller('GeneDiseaseCtrl', ['$scope', '$location', '$log', 'cttvAPIservice', function ($scope, $location, $log, cttvAPIservice) {
        $log.log('GeneDiseaseCtrl()');

        $scope.search = {
    	   // target : $location.search().t,
    	   // disease : $location.search().d,
           info : {},
           genetic_associations : {},
        };

        $scope.getInfo = function(){
            console.log("getInfo for "+$scope.search.target + " & " + $scope.search.disease);

            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:"http://identifiers.org/efo/"+$scope.search.disease.substring(4)
                } ).
                success(function(data, status) {
                    $scope.search.info = data.data[0];
                    console.log(data);
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }



        $scope.getEvidence = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:"http://identifiers.org/efo/"+$scope.search.disease.substring(4)
                } ).
                success(function(data, status) {
                    $scope.search.genetic_associations = data.data;
                    console.log(data);
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }



        if($location.search().t && $location.search().d){
            // parse parameters
            $scope.search.target = $location.search().t;
            $scope.search.disease = $location.search().d;

            // need a way of parsing filters too...

            // and fire the info search
            $scope.getInfo();

            // then try get some data
            $scope.getEvidence();
        }

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






    /**
     * Controller for the little search box
     */
    controller('SearchBoxCtrl', ['$scope', '$location', '$window', '$document', '$element', 'cttvAPIservice', function ($scope, $location, $window, $document, $element, cttvAPIservice) {
        
        var APP_SEARCH_URL = "search";
        var APP_EVIDENCE_URL = "evidence";
        var APP_AUTOCOMPLETE_URL = "autocomplete"
        
        $scope.search = {
            query: {
                text: ""
            },
            results:{

            }
        }

        
        $scope.hasFocus = true;

        
        var dismissClickHandler = function (evt) {
            if ($element !== evt.target) {
                //resetMatches();
                //scope.$digest();
                console.log("close ??");
                $scope.hasFocus = true;
                $scope.search.results = {};
                $scope.$apply();
            }
        };

        $document.bind('click', dismissClickHandler);

        $scope.$on('$destroy', function(){
            $document.unbind('click', dismissClickHandler);
        });
        
        $element.bind('click', function(evt){
            console.log('keep open?');
            evt.stopPropagation();
        });
        

        /**
         * Get suggestions for typeahead
         */
        $scope.getSuggestions = function(query){

            if(query.length>1){
                // fire the typeahead search
                cttvAPIservice.getAutocomplete({q:$scope.search.query.text, size:3}).
                    success(function(data, status) {
                        $scope.search.results = data.data;
                        console.log(data.data);
                    }).
                    error(function(data, status) {
                        console.log(status);
                    });
            }else{
                $scope.search.results = {};
            }
        }


        /**
         * Checks if the current search has got any results.
         * Returns TRUE / FALSE.
         */
        $scope.hasResults=function(){
            return Object.keys($scope.search.results).length>0;
        }

        $scope.test=function(e){
            console.log(e);
        }

        $scope.isVisible = function(){
            var v = $scope.hasFocus && $scope.hasResults() && $scope.search.query.text.length>1;
            console.log("isVisible() "+v);
            return v;
        }

        


        var setLocation=function(url){
            console.log(url);
            if($location.url() != url){
                $location.url(url);
            }
        }


        $scope.linkTo =function(s){
            console.log(s.label+" ("+s.type+") "+s.q);

            // show search results page, nice and easy...

            // so, where do we want to go then?
            // parse the options:
            if( s.type.toLowerCase()=="genedata" ){
                console.log("   genedata");
                $location.url("target-associations");
            } else if ( s.type.toLowerCase()=="efo" ){
                console.log("   efo");  
                $location.url("disease-associations");
            }
            console.log($location);
            $location.search( 'q=' + s.q + "&label="+s.label);
            
            $scope.search.query.text = "";
        }



        /**
         * Sets a new search via the URL
         */
        $scope.setSearch = function(){

            // show search results page, nice and easy...
            if($location.url() != APP_SEARCH_URL){
                $location.url(APP_SEARCH_URL);
            }
            $location.search( 'q=' + $scope.search.query.text);

            
            // reset the query field:
            // the search result page should probably still show this, the problem is that the scope of this search box is separate
            // so if we then go to the gene, or association page, this would still show the original query...
            // So, for now we RESET the field, then I'll think about it.
            $scope.search.query.text = "";  
        }

    }]).






    controller('SearchResultsCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
        
    }]).



    controller('D3TestCtrl', ['$scope', '$log', function ($scope, $log) {
        $log.log("D3TestCtrl");
    }])



