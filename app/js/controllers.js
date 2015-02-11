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
            info : {
                data : {},
                efo_path : []
            },
            genetic_associations : {},
            rna_expression: [],
            //test : [2,4,4,3,4,7],
            test: [],
        };

        //$scope.test = [];

        $scope.getInfo = function(){
            console.log("getInfo for "+$scope.search.target + " & " + $scope.search.disease);

            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease, //"http://identifiers.org/efo/"+$scope.search.disease.substring(4),
                    size:1
                } ).
                success(function(data, status) {
                    $scope.search.info.data = data.data[0];
                    console.log("info on association:");
                    console.log(data.data[0]);  
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }



        // TODO:
        // make the proper call to the API
        $scope.getEvidence = function(){
            /*
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
            */
        }



        // TODO:
        // make the proper call, process the info and store it to the correct var (not 'test')
        // which means this will return the promise object which wraps the setting of test...
        $scope.getFlowerData = function(){
            console.log("getFlowerData()");
            $scope.search.test = [
                {"value":6, "label":"Hello"},
                {"value":3, "label":"There"},
                {"value":5, "label":"World!"},
                {"value":7, "label":"World!"},
                {"value":4, "label":"World!"},
                {"value":2, "label":"World!"}
            ];
        }



        $scope.getRnaExpressionData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease/*,
                    size: 1000*/
                } ).
                success(function(data, status) {
                    $scope.search.rna_expression = data.data;
                    initTableRNA();
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }



        /*
         * Takes the data object returned by the API and formats it to an array of arrays 
         * to be displayed by the RNA-expression dataTable widget.
         */
        var formatRnaDataToArray = function(data){
            var newdata = new Array(data.length);
            console.log(data[0]);
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];
                    // comparison
                    row.push(data[i].evidence.experiment_specific.comparison_name);
                    // activity
                    row.push(data[i].biological_subject.properties.activity.split("/").pop().split("_").join(" "));
                    // Tissue
                    //row.push(data[i].biological_object.properties.biosamples.join(", ")); // is an array
                    // fold change
                    row.push(data[i].evidence.experiment_specific.log2_fold_change);
                    // p-value
                    row.push(data[i].evidence.association_score.pvalue.value);
                    // provenance
                    //row.push(data[i].evidence.urls.linkouts.reduce(function(p,c,a,i){return p.nice_name+", "+c.nice_name}));
                    row.push("<a href='"+data[i].evidence.urls.linkouts[1].url+"' target='blank'>Gene expression details <i class='fa fa-external-link'></i></a>");
                    // experiment overview
                    row.push("<a href='"+data[i].evidence.urls.linkouts[0].url+"' target='blank'>Experiment overview and raw data <i class='fa fa-external-link'></i></a>");
                    // publications
                    // row.push(data[i].evidence.date_asserted);
                    row.push("Estrogen receptor prevents p53-dependent apoptosis in breast cancer. Bailey ST, Shin H, Westerling T, Liu XS, Brown M. , Europe PMC 23077249"); // mock publications info

                newdata[i] = row;
            }

            return newdata;
        }



        var initTableRNA = function(){
            console.log("> dataTables:");
            console.log($('#rna-expression-table'));

            // make the call

            $('#rna-expression-table').dataTable( {
                "data": formatRnaDataToArray($scope.search.rna_expression), //[["non-small cell lung cancer", "decreased transcript level", "lung", "-1.07", "1.08e-17", "GPR65 expression details", "Transription profiling by array of human non-small cell lng cancer tissue", "bla bla bla"]],
                "columns": [
                    { "title": "Comparison" },
                    { "title": "Activity" },
                    //{ "title": "Tissue" },
                    { "title": "log2 fold change" },
                    { "title": "p-value" },
                    { "title": "Provenance" },
                    { "title": "Experiment overview" },
                    { "title": "Publications" }
                ],
                "ordering" : true,
                "autoWidth": false
            } ); 
        }

        if($location.search().t && $location.search().d){
            // parse parameters
            $scope.search.target = $location.search().t;
            $scope.search.disease = $location.search().d;

            $scope.$watch("search.info.data", function(newValue, oldValue) {
                //if ($scope.name.length > 0) {
                //    $scope.greeting = "Greetings " + $scope.name;
                //}
                console.log("newValue");
                console.log(oldValue);
                console.log(newValue);
                if($scope.search.info.data.biological_object.efo_info[0][0].path){
                    $scope.search.info.efo_path = $scope.search.info.data.biological_object.efo_info[0][0].path;
                }
            });

            // will need a way of parsing filters too...
            // $scope.parseFilters() ...

            // and fire the info search
            $scope.getInfo();

            // get the data for the flower graph
            $scope.getFlowerData();

            // then try get some data
            $scope.getRnaExpressionData();

            // populate the tables
            // RNA-expression table
            //$('#rna-expression-table').ready(initTableRNA);
            //setTimeout(initTableRNA, 1000); //I confess, this is a dirty hack to wait for the DOM... temporary though :)

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



