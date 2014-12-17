'use strict';

/* Controllers */

angular.module('cttvControllers', ['cttvServices']).






/**
 * High level controller for the app
 */
controller('CttvAppCtrl', ['$scope',  function ($scope) {
    
}]). 






/**
 * EvidencesCtrl
 * Controller for the evidences page
 * It loads a list of evidences for the given search
 */
controller('EvidencesCtrl', ['$scope', '$location', '$log', 'cctvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cctvAppToAPIService, cttvAPIservice) {
    
    $log.log('EvidencesCtrl()');

    
    $scope.search = cctvAppToAPIService.cerateSearchInitObject();


    
    /*
     * NOTE: this is a temporary function. It will change when we have the final API call for this
     * In the meantime we process and count results here
     */
    var processData = function(data){
        console.log("processData() "+data.data.length);
        //var d = { "name": "N/A", "children":[] };
        var d = {};
        for(var i=0; i<data.data.length; i++){
            if( d[data.data[i]["biological_object.efo_info.efo_label"]] == undefined ){
                d[data.data[i]["biological_object.efo_info.efo_label"]] = 1;
            } else {
                d[data.data[i]["biological_object.efo_info.efo_label"]]++;
            }
        }
        
        var dj = { "name": "N/A", "children":[] };
        for(var i in d){
            dj.children.push( {"name": i, "size": d[i]} );
        }

        console.log(dj); //JSON.stringify(d));

        return dj;
    }



    /*
     * Exposed method to be called by the pagination
     */
    $scope.getResults = function(){
        return cttvAPIservice.getEvidences( cctvAppToAPIService.getApiQueryObject(cctvAppToAPIService.EVIDENCES, $scope.search.query) ).
            success(function(data, status) {
                $scope.search.results = data;

                // process and count the data and then show the bubbles...
                $scope.data = processData(data);
                //$scope.render();

            }).
            error(function(data, status) {
                $log.error("ERROR "+status);
            });
    }

    if($location.search().q){
        // parse parameters
        $scope.search.query.q = $location.search().q || "";

        // for the bubble chart:
        $scope.search.query.size=1000; // get all the results we can in one request
        $scope.search.label = $location.search().label || "";
        
        // and fire the search
        $scope.getResults();
    }
    
}]).






/**
 * SearchAppCtrl
 * Controller for the search/results page
 */
controller('SearchAppCtrl', ['$scope', '$location', '$log', 'cctvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cctvAppToAPIService, cttvAPIservice) {
    
    $log.log('SearchCtrl()');

    
    $scope.search = cctvAppToAPIService.cerateSearchInitObject();

    $scope.getResults = function(){
        return cttvAPIservice.getSearch( cctvAppToAPIService.getApiQueryObject(cctvAppToAPIService.SEARCH, $scope.search.query) ).
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

        // and fire the search
        $scope.getResults();
    }


}]).






/**
 * Controller for the little search box
 */
controller('SearchBoxCtrl', ['$scope', '$location', 'cttvAPIservice', function ($scope, $location, cttvAPIservice) {
    
    var APP_SEARCH_URL = "search";
    $scope.query = "";



    /**
     * Get suggestions for typeahead.
     * This needs to take a value directly, not via scope, otherwise the typeahead is one char behind
     */
    $scope.getSuggestions = function(val) {
        return cttvAPIservice.getSearch({q:val}).then(function(response){
                return response.data.data;
            });
    };



    /**
     * Sets a new search via the URL
     */
    $scope.setSearch = function(){
        if($location.url() != APP_SEARCH_URL){
            $location.url(APP_SEARCH_URL);
        }
        $location.search( 'q=' + ($scope.query.title || $scope.query) );

        $scope.query = "";  // reset the query field
    }

}]).






controller('SearchResultsCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
    
}]).



controller('D3TestCtrl', ['$scope', '$log', function ($scope, $log) {
    $log.log("D3TestCtrl");
}])



