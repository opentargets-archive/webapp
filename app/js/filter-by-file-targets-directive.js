/* Directives */
angular.module('cttvDirectives')

/**
 * Options for configuration are:
 * Example:
 *   <cttv-filter-by-file-targets> </cttv-filter-by-file-targets>
 *
 */
    .directive('cttvFilterByFileTargets', ['$log','cttvAPIservice', 'cttvFiltersService','$q', '$analytics', function($log, cttvAPIservice, cttvFiltersService, $q, $analytics){
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

                scope.maxFileSize = 20000;

                var multiSearchChunkSize = 200;

                scope.initFilterByFile =function(){
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
                        scope.addFile();
                    });

                };



                scope.removeTargets = function(){
                    var theElement = document.getElementById("myFileInput");

                    theElement.value = null;
                    scope.target = [];
                    scope.initFilterByFile();
                    scope.getfacets(scope.filters, scope.target);
                };

                scope.addFile = function () {
                    scope.validateFile(scope.files[0]);
                };

                scope.validateFile = function (file) {
                    scope.fileTooBig = false;
                    scope.wrongFileExtension = false;

                    scope.fileName = file.name;
                    if (file.size > scope.maxFileSize) {
                        scope.fileTooBig = true;
                        return;
                    }
                    var extension = file.name.split('.').pop();
                    if (_.indexOf(['txt', 'csv'], extension) === -1) {
                        scope.wrongFileExtension = true;
                        return;
                    }
                    var targetNameArrayTemp = [];
                    var reader = new FileReader();

                    reader.onloadend = function (evt) {
                        //do something with file content here
                        var myFileContent = evt.target.result;
                        targetNameArrayTemp = myFileContent.replace(/(\r\n|\n|\r|,)/gm, '\n').split('\n');
                        targetNameArrayTemp = targetNameArrayTemp.filter(function(e){ return e.trim();}); //get rid of empty strings
                        targetNameArrayTemp = targetNameArrayTemp.map(function(value){return value.toLowerCase()});

                        scope.targetNameArray = uniqueArrayFast(targetNameArrayTemp);
                        scope.targetIdArray = new Array(scope.targetNameArray.length);
                        scope.targetNameIdDict = new Array(scope.targetNameArray.length);

                        // analytics event
                        $analytics.eventTrack('filterByTargetList', {"category": "filterByTargetList", "label": ("loaded " + scope.targetNameArray.length + " targets")})

                        //$log.log("UNIQUE NAMES:" + scope.targetNameArray );
                        //Choose either Async or Consecutive version for testing
                        //getBestHitTargetsIdsAsync(scope.targetNameArray);
                        getBestHitTargetsIdsConsecutive(scope.targetNameArray);
                    };
                    reader.readAsText(file);
                };

                var uniqueArrayFast = function(a) {
                    var o = {}, i, l = a.length, r = [];
                    for(i=0; i<l;i+=1) o[a[i]] = a[i];
                    for(i in o) r.push(o[i]);
                    return r;
                };

                scope.fuzzyToggle = function(){
                    scope.fuzziesIncludedInSearch = !scope.fuzziesIncludedInSearch;
                    if( scope.fuzziesIncludedInSearch){
                        scope.target = uniqueArrayFast(scope.targetIdArray);
                    }
                    else {
                        scope.target = uniqueArrayFast(scope.targetIdArrayWithoutFuzzies);
                    }
                }

                var getBestHitTargetsIdsAsync = function(targetNameArray){
                    var promisesArray = [];
                    for (var i = 0; i < targetNameArray.length; i += multiSearchChunkSize) {
                        promisesArray.push(getBestHitTargetsIdsChunk(targetNameArray.slice(i, i + multiSearchChunkSize), i))
                    }
                    $q.all(promisesArray).then(updateAllArrays);
                }

                var getBestHitTargetsIdsConsecutive = function(targetNameArray){

                    var promise = $q(function (resolve, reject) {
                        resolve("");
                    });

                    var promises = [];
                    for (var i = 0; i < targetNameArray.length; i += multiSearchChunkSize) {
                        promises.push({
                            from: i,
                            total: multiSearchChunkSize
                        });

                    }

                    promises.forEach(function (p) {
                        promise = promise.then(function () {
                            return getBestHitTargetsIdsChunk(targetNameArray.slice(p.from, p.from + p.total), p.from);
                        });
                    });

                    //got all pieces - glue it all together
                    promise.then(function(res){
                        updateAllArrays();
                    });
                }


                //this is a 200 long slice of the original targetNameArray
                var getBestHitTargetsIdsChunk = function (targetNameArray, from){
                    var opts = {
                        q:targetNameArray,
                        filter:'target',
                        fields:'approved_symbol'
                    };

                    var queryObject = {
                        method: "POST",
                        params: opts
                    };

                    //$log.log("getBestHitTargetsIdsChunk:targetNameArray[0]",targetNameArray[0]);
                    // $log.log("getBestHitTargetsIdsChunk:from",from);

                    return cttvAPIservice.getBestHitSearch(queryObject)
                        .then (function (resp) {

                        if (resp.body.data.length > 0) {
                            for(var i=0;i<resp.body.data.length;i++) {

                                if(resp.body.data[i].data) {

                                    scope.targetIdArray[i+from] = resp.body.data[i].id;
                                    scope.targetNameIdDict[i+from] = {
                                        id: resp.body.data[i].id,
                                        label: resp.body.data[i].data.approved_symbol,
                                        name: resp.body.data[i].q
                                    };
                                }
                                else{
                                    scope.targetNameIdDict[i+from] = { id:'' , label:resp.body.data[i].q, name:resp.body.data[i].q};
                                }
                            }
                        }

                        //$log.log("getBestHitTargetsIdsChunk:scope.targetIdArray",scope.targetIdArray);
                        //$log.log("getBestHitTargetsIdsChunk:scope.targetNameIdDict",scope.targetNameIdDict);

                    });
                }

                var updateAllArrays = function () {
                    scope.targetIdArray = scope.targetIdArray.filter(function(e){return !e.id;});
                    scope.target = uniqueArrayFast(scope.targetIdArray);
                    scope.excludedTargetArray = scope.targetNameIdDict.filter(function(e){return !e.id;});
                    scope.fuzzyTargetArray = scope.targetNameIdDict.filter(function(e){return e.name.toLowerCase().localeCompare(e.label.toLowerCase()) !== 0 && e.id.toLowerCase().localeCompare(e.name.toLowerCase()) !== 0;});
                    scope.targetIdArrayWithoutFuzzies = scope.targetNameIdDict.map(function (e) {
                        if (e.id && (e.name.toLowerCase().localeCompare(e.label.toLowerCase()) == 0 || e.id.toLowerCase().localeCompare(e.name.toLowerCase()) == 0)){ //has label and not fuzzy or has name and id and they are the same (for case when name is ENS code already)
                            return e.id;
                        }
                    });
                    scope.targetIdArrayWithoutFuzzies = scope.targetIdArrayWithoutFuzzies.filter(function(e){return e;});//this step will filter out undefined

                    //$log.log("123:targetNameIdDict", scope.targetNameIdDict);
                    //$log.log("123:excludedTargetArray", scope.excludedTargetArray);
                    //$log.log("123:fuzzyTargetArray", scope.fuzzyTargetArray);
                    //$log.log("123:targetNameArray", scope.targetNameArray);
                    //$log.log("123:targetIdArrayWithoutFuzzies", scope.targetIdArrayWithoutFuzzies);

                    scope.getfacets(scope.filters, scope.target);
                }

            }

        };
    }])
