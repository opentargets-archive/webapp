/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl:
 * Controller for the target associations page.
 *
 * It loads a list of associations for the given disease (efo).
 * Any filters and facets are passed via the search part of the URL.
 * On page load, if no filters are specified, we set the default datatypes (to filter out mouse data),
 * or otherwise we just load the data.
 * Filters modify the URL search:
 * here we listen for changes to the URL and fire a new search when required.
 * Then when we get the data, we update content and facets
 */

    .controller("diseaseAssociationsCtrl",
        ['$rootScope','$scope', '$location', '$log', '$q', 'cttvAPIservice', 'cttvFiltersService',
                                                            'cttvDictionary', 'cttvUtils', 'cttvLocationState',
        function ($rootScope, $scope, $location, $log, $q, cttvAPIservice, cttvFiltersService,
                                                            cttvDictionary, cttvUtils, cttvLocationState) {

        'use strict';

        $log.log('diseaseAssociationsCtrl()');

        cttvLocationState.init();   // does nothing, but ensures the cttvLocationState service is instantiated and ready


        // ---------------------------
        //  Initialiaze
        // ---------------------------


        // configure the "search" object
        // to be exposed via scope
        $scope.search = {
            query: $location.path().split('/')[2],
            label: "",
            filename: "",
            total: "..."
        };

        //$scope.targetArray = ['ENSG00000113448','ENSG00000168229'];

        $scope.targetArray = []; //this one is used when we are done fetching all the target IDs

        $scope.targetNameArray = [];
        $scope.targetIdArray = [];

        $scope.excludedTargetList = [];

        // reset the filters when loading a new page
        // so we don't see the filters from the previous page...
        cttvFiltersService.reset();

        // Set page filters: this defines the order in which the facets are going to be displayed
        cttvFiltersService.pageFacetsStack([
            //cttvFiltersService.facetTypes.SCORE,        // adds a score facet to the page
            cttvFiltersService.facetTypes.DATATYPES,    // adds a datatypes facet to the page
            cttvFiltersService.facetTypes.PATHWAYS      // adds a pathways facet to the page
        ]);


        // state we want to export to/from the URL
        // var stateId = "view";
        var facetsId = cttvFiltersService.stateId;


        /*
         * Renders page elements based on state from locationStateService
         */
        var render = function (new_state, old_state) {

            // here we want to update facets, tabs, etc:
            // 1. first we check if the state of a particular element has changed;
            // 2. if it hasn't changed, and it's undefined (i.e. new=undefined, old=undefined),
            // then it's a page load with no state specified, so we update that element anyway with default values

            // facets changed?
            if (!_.isEqual(new_state[facetsId], old_state[facetsId]) || !new_state[facetsId]) {
                getFacets(new_state[facetsId]);
            }

        }


        /*
         * Get data to populate the table.
         *
         * @param filters: object of filtering categories, e.g. "datatypes"; each one is either a string or an array of strings
         * Example:
         * filters = {
         *      datatypes: "known_drug",
         *      pathway_type: [ "REACT_111102", "REACT_116125", "REACT_6900" ]
         * }
         * getFacets(filters);
         */
        var getFacets = function (filters) {

            // set the filters
            $scope.filters = filters;

            var opts = {
                disease: $scope.search.query,
                target: $scope.targetArray,
                outputstructure: "flat",
                facets: true,
                // direct: false,
                size:1
            };
            opts = cttvAPIservice.addFacetsOptions(filters, opts);

            console.log("getFacets():opts=", opts);
            cttvAPIservice.getAssociations(opts).
                then(
                function (resp) {
                    console.log("getAssociations():resp=",resp)
                    // 1: set the facets
                    // we must do this first, so we know which datatypes etc we actually have
                    //TODO Change this to POST request
                    cttvFiltersService.updateFacets(resp.body.facets, undefined, resp.body.status);


                    // The label of the diseases in the header
                    $scope.search.label = resp.body.data[0].disease.efo_info.label;

                    // The filename to download
                    $scope.search.filename = cttvDictionary.EXP_DISEASE_ASSOC_LABEL + resp.body.data[0].disease.efo_info.label.split(" ").join("_");

                    // set the total?
                    $scope.search.total = resp.body.total; //resp.body.total;
                    $scope.excludedTargetList = resp.body.excluded_target_list;
                    console.log("DAC: $scope.excludedTargetList",  $scope.excludedTargetList);
                },
                cttvAPIservice.defaultErrorHandler
            );


        };


        //
        // on STATECHANGED
        // Set up a listener for the URL changes and when the search change, get new data
        //


        $scope.$on(cttvLocationState.STATECHANGED, function (evt, new_state, old_state) {
            render(new_state, old_state); // if there are no facets, no worries, the API service will handle undefined
        });


        //
        // on PAGE LOAD
        //


        cttvUtils.clearErrors();
        $scope.filters = cttvLocationState.getState()[facetsId] || {};
        render(cttvLocationState.getState(), cttvLocationState.getOldState());

        $scope.uploadedFile = function (element) {
            console.log("ELEMENT=", element);
            $scope.$apply(function ($scope) {
                $scope.files = element.files;
                console.log("scope.files = ", $scope.files);

            });

            $scope.addFile();
        }

        $scope.removeTargets = function(){
            var theElement = document.getElementById("myFileInput");
            console.log("ELEMENT1=", theElement);
            theElement.value = null;
            $scope.targetArray = [];
            console.log("removeTargets:$scope.files=", $scope.files );
            $scope.files = [];
            console.log("removeTargets:$scope.files=", $scope.files );
            getFacets($scope.filters);
        }

        $scope.addFile = function () {
            console.log("addFile()");
            console.log("addFile: scope.files = ", $scope.files);
            $scope.validateFile($scope.files[0]);
            /*UploadService.uploadfile($scope.files,
             function q( msg ) // success
             {
             console.log('uploaded');
             },
             function( msg ) // error
             {
             console.log('error');
             });*/
        }
        $scope.validateFile = function (file) {
            console.log("validateFile: file", file);
            console.log(file.name);
            console.log(file.size);
            var reader = new FileReader();

            reader.onloadend = function (evt) {
                console.log("loaded!!! evt.target.result", evt.target.result);
                //do something with file content here
                var myFileContent = evt.target.result;
                var myFileContent1 = myFileContent.replace(/\r\n/g, '\n');
                //$scope.targetArray = myFileContent1.replace(/\r/g, '\n').split('\n');
                $scope.targetNameArray = myFileContent1.replace(/\r/g, '\n').split('\n');
                //getFacets($scope.filters);
                console.log("targetNameArray=", $scope.targetNameArray);
                //$scope.targetIdArray = $scope.targetNameArray.map(getTargetId);
                getTargetIds();
                console.log("targetIdArray =" , $scope.targetIdArray);

                //Next we need to update the targetArray
            };

            //var blob = file.slice(0, file.size - 1);
            reader.readAsText(file);

        };

        var getTargetIds = function(){
            console.log("getTargetIds")

            var promise = $q(function (resolve, reject) {
                resolve("");
            });

            $scope.targetNameArray.forEach(function (targetName){
               console.log("doing forEach");
                promise = promise.then(function (){
                   return getTargetId(targetName);
               }) ;
            });

            promise.then(function (res) {
                console.log("targetIdArray =" , $scope.targetIdArray);
                $scope.targetArray = $scope.targetIdArray;
                getFacets($scope.filters);
            });



        }

        var getTargetId = function (targetName) {
            console.log("getTargetId()");

            if (targetName.startsWith("ENSG")){
                $scope.targetIdArray.push(targetName);
            }
            else if(typeof targetName != "string"){
                $scope.targetIdArray.push('');
            }

            var opts = {q:targetName,
                fields:['approved_symbol'],
                'size':1}

            return cttvAPIservice.getSearch(opts).
                then(
                function (resp) {
                    console.log("getSearch:resp.body.data",resp.body.data);
                    if (resp.body.data.length > 0) {
                        console.log("resp.body.data[0].id=", resp.body.data[0].id);
                        $scope.targetIdArray.push(resp.body.data[0].id);
                    }
                    else{
                        $scope.targetIdArray.push('');
                    }
                });


        };


        //var getTargetId = function (targetName) {
        //
        //    if (targetName.startsWith("ENSG")){
        //        return targetName;
        //    }
        //    else if(typeof targetName != "string"){
        //        return ''
        //    }
        //
        //    var opts = {q:targetName,
        //        fields:['approved_symbol'],
        //        'size':1}
        //
        //    cttvAPIservice.getSearch(opts).
        //        then(
        //        function (resp) {
        //            console.log("getSearch:resp.body.data",resp.body.data);
        //            if (resp.body.data.length > 0) {
        //                console.log("resp.body.data[0].id=", resp.body.data[0].id);
        //                return resp.body.data[0].id;
        //            }
        //            else{
        //                return '';
        //            }
        //        },
        //        cttvAPIservice.defaultErrorHandler
        //    );
        //
        //
        //};



    }]);
