    'use strict';



    /**
     * Controller for the little search box
     */
    angular.module('cttvControllers').

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

    }]);



