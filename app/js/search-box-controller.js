'use strict';



/**
 * Controller for the little search box
 */
angular.module('cttvControllers').

controller('SearchBoxCtrl', ['$scope', '$log', '$location', '$window', '$document', '$element', 'cttvAPIservice', '$timeout', function ($scope, $log, $location, $window, $document, $element, cttvAPIservice, $timeout) {
        
        var APP_SEARCH_URL = "search";
        var APP_EVIDENCE_URL = "evidence";
        var APP_AUTOCOMPLETE_URL = "autocomplete"
        
        $scope.search = {
            query: {
                text: ""
            },
            results:{

            },
            progress: false
        }

        
        $scope.hasFocus = true;

        
        // 
        // initialize the handling of clicks outside the panel to close the suggestions panel itself
        //

        /*
         * Set the search results to nothing to hide the suggestion panel:
         * this is achieved by attaching this handler to clicks anywhere in the page document
         * (see below to make more sense of it)
         */
        var dismissClickHandler = function (evt) {
            if ($element !== evt.target) {
                $scope.hasFocus = true;
                $scope.search.results = {};
                $scope.$apply();
                $document.unbind('click', dismissClickHandler);
            }
        };

        // remove the click handler when the contrller/scope is destroyed
        // (this won't happen since the search box is there on every page)
        $scope.$on('$destroy', function(){
            $document.unbind('click', dismissClickHandler);
        });
        
        // We want clicks on the actual panel to, say, click thrugh,
        // and not bubble up to the document and close the panel,
        // so we stop propagation
        $element.bind('click', function(evt){
            evt.stopPropagation();
        });
        


        /**
         * Get suggestions for typeahead
         * @param {String} query 
         * @returns {Object} promise object with success() or error(), or null
         */
        $scope.getSuggestions = function(query){

            //clear the data here, so the box disappears or the content is cleared...
            $scope.search.results = {};
            
            if(query.length>1){
                $scope.search.progress = true;  // flag for search in progress
                $document.bind('click', dismissClickHandler);
                
                // fire the typeahead search
                return cttvAPIservice.getAutocomplete({q:$scope.search.query.text, size:3}).
                    then(
                        function(resp){
                            $scope.search.results = resp.data.data;  // store the results
                            //$scope.search.progress = false;     // flag for search in progress
                        }, 
                        function(resp){
                            $log.log(resp);
                        }
                    ).
                    finally(function(){
                        $scope.search.progress = false;
                    });
                    /*success(function(data, status) {
                        $scope.search.results = data.data;  // store the results
                        $scope.search.progress = false;     // flag for search in progress
                    }).
                    error(function(data, status) {
                        $log.log(status);
                        $scope.search.progress = false;
                    });*/
            }else{
                $scope.search.progress = false;
            }

            return null;
        }



        /**
         * Checks if the current search has got any results.
         * @returns {boolean} true if the panel currently has results.
         */
        $scope.hasResults=function(){
            return Object.keys($scope.search.results).length>0;
        }



        /**
         * Checks if the suggestions panel should be visible based on focus, number of results and length of the query;
         * @returns {boolean} true if the panel is (supposed to) be visible
         */
        $scope.isVisible = function(){
            var v = $scope.hasFocus && $scope.hasResults() && $scope.search.query.text.length>1;
            return v;
        }

        

        /*
         * Set the URL to specified string. 
         * This is used internally to implement a href (link)
         * @param {String} url
         */
        var setLocation=function(url){
            if($location.url() != url){
                $location.url(url);
            }
        }



        /**
         * Public method to link to association page for either a gene or a disease
         * @param {Object} s - config objects:
         *  - type {String} : either "genedata" or "efo", determins which page we link to
         *  - q {String} : the query for the actual gene or disease
         *  - label {String} : this will be deprecated in the future; 
         *                     it sets the query label for the landing page, but it will be no longer needed
         *                     since that is now returned by the API.
         */
        $scope.linkTo =function(s){
            // parse the options:
            if( s.type.toLowerCase()=="genedata" ){
                $location.url("target-associations");
            } else if ( s.type.toLowerCase()=="efo" ){
                $location.url("disease-associations");
            }
            // set the page URL
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



