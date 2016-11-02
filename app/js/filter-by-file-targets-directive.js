/* Directives */
angular.module('cttvDirectives')

/**
 * Options for configuration are:
 * Example:
 *   <cttv-filter-by-file-targets> </cttv-filter-by-file-targets>
 *
 */
    .directive('cttvFilterByFileTargets', ['$log','cttvAPIservice', 'cttvFiltersService','$q',function($log, cttvAPIservice, cttvFiltersService, $q){
        'use strict';

        return {
            scope: {
                diseaseName: '=',
                target: '=',
                filters: '=',
                getfacets: '=',
                search: '='
            },

            templateUrl: 'partials/filter-by-file-targets.html',
            link: function(scope, elem, attrs){
                //$log.log("cttvFilterByFileTargets:linkFunction: scope", scope);
                //$log.log("cttvFilterByFileTargets:linkFunction: elem", elem);

                scope.initFilterByFile =function(){

                    scope.target = [];

                    scope.fileName = "";

                    scope.targetNameArray = [];//this one holds targetnames as they are read from the file
                    scope.targetIdArray = [];
                    scope.targetNameIdDict = [];//this has all the targetNames, id-s that were found or "", and labels tht were found for these ids

                    scope.excludedTargetArray = [];//this has all the targets for whits no id could be found, even with fuzzy search
                    scope.fuzzyTargetArray = [];//these are the ones for which we found id-s but for targetName that did not exactly match
                    scope.targetIdArrayWithoutFuzzies = [];

                    scope.totalNamesCollapsed = true;
                    scope.excludedTargetsCollapsed = true;
                    scope.fuzzyTargetsCollapsed = true;
                    scope.filterByFileCollapsed = false; //this should be open by default

                    scope.fuzziesIncludedInSearch = true;
                };

                scope.initFilterByFile();

                scope.uploadedFile = function (element) {

                    scope.$apply(function ($scope) {
                        scope.files = element.files;

                    });

                    scope.addFile();
                };



                scope.removeTargets = function(){
                    var theElement = document.getElementById("myFileInput");

                    theElement.value = null;
                    scope.initFilterByFile();
                    scope.getfacets(scope.filters, scope.target);

                };

                scope.addFile = function () {
                    scope.validateFile(scope.files[0]);
                };

                scope.validateFile = function (file) {
                    scope.fileName = file.name;

                    var reader = new FileReader();
                    reader.onloadend = function (evt) {
                        //do something with file content here
                        var myFileContent = evt.target.result;
                        scope.targetNameArray = myFileContent.replace(/(\r\n|\n|\r|,)/gm, '\n').split('\n');
                        scope.targetNameArray = scope.targetNameArray.filter(function(e){ return e.trim();}); //get rid of empty strings

                        getTargetIds();
                    };
                    reader.readAsText(file);
                };

                var getTargetIds = function() {
                    var promise = $q(function (resolve) {
                        resolve("");
                    });

                    scope.targetNameArray.forEach(function (targetName){
                        promise = promise.then(function() {
                            return getTargetId(targetName);
                        });
                    });

                    promise.then(function (res) {
                        //$log.log("PROMISE");
                        scope.target = scope.targetIdArray;
                        scope.excludedTargetArray = scope.targetNameIdDict.filter(function(e){return !e.id;});
                        scope.fuzzyTargetArray = scope.targetNameIdDict.filter(function(e){return e.name.toLowerCase().localeCompare(e.label.toLowerCase()) !== 0 && e.id.toLowerCase().localeCompare(e.name.toLowerCase()) !== 0;});
                        scope.targetIdArrayWithoutFuzzies = scope.targetNameIdDict.map(function (e) {
                            if (e.id && (e.name.localeCompare(e.label) == 0 || e.id.localeCompare(e.name) == 0)){ //has label and not fuzzy or has name and id and they are the same (for case when name is ENS code already)
                                return e.id;
                            }

                        });
                        scope.targetIdArrayWithoutFuzzies = scope.targetIdArrayWithoutFuzzies.filter(function(e){return e;});//this step will filter out undefined

                        //$log.log("123:targetNameIdDict", $scope.targetNameIdDict);
                        //$log.log("123:excludedTargetArray", $scope.excludedTargetArray);
                        //$log.log("123:fuzzyTargetArray", $scope.fuzzyTargetArray);
                        //$log.log("123:targetNameArray", $scope.targetNameArray);
                        //$log.log("123:targetIdArrayWithoutFuzzies", $scope.targetIdArrayWithoutFuzzies);
                        scope.getfacets(scope.filters, scope.target);
                    });

                };

                scope.fuzzyToggle = function(){

                    scope.fuzziesIncludedInSearch = !scope.fuzziesIncludedInSearch;
                    if( scope.fuzziesIncludedInSearch){
                        scope.target = scope.targetIdArray;
                    }
                    else {
                        scope.target = scope.targetIdArrayWithoutFuzzies;
                    }
                }


                var getTargetId = function (targetName) {

                    if (typeof targetName != "string") {
                        scope.targetIdArray.push('');
                        scope.targetNameIdDict.push ({
                            id:'' ,
                            label:targetName,
                            name:targetName
                        });
                    }

                    var opts = {
                        q:targetName,
                        fields:['approved_symbol'],
                        'size':1
                    };

                    var queryObject = {
                        method: "GET",
                        params: opts
                    };

                    return cttvAPIservice.getSearch(queryObject)
                        .then (function (resp) {
                        //$log.log("getSearch:resp.body.data",resp.body.data);
                        if (resp.body.data.length > 0) {
                            //$log.log("resp.body.data[0].id=", resp.body.data[0].id);
                            //$log.log("resp.body.data[0].data.approved_symbol=", resp.body.data[0].data.approved_symbol);
                            //TODO:Here compare label with targetNAme to see if it is a fuzzy search result
                            scope.targetIdArray.push(resp.body.data[0].id);
                            scope.targetNameIdDict.push({ id: resp.body.data[0].id, label:resp.body.data[0].data.approved_symbol, name:targetName});
                        } else {
                            scope.targetIdArray.push('');
                            scope.targetNameIdDict.push({ id:'' , label:targetName, name:targetName});
                        }
                    });
                };


            }

        };
    }])

