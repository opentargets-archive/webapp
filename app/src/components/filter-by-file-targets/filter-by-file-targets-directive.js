/* Directives */
angular.module('cttvDirectives')

/**
 * Options for configuration are:
 * Example:
 *   <cttv-filter-by-file-targets> </cttv-filter-by-file-targets>
 *
 */
    .directive('cttvFilterByFileTargets', ['$log', 'cttvAPIservice', '$q', '$analytics', 'cttvLoadedLists', '$location', 'cttvUtils', function ($log, cttvAPIservice, $q, $analytics, cttvLoadedLists, $location, cttvUtils) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                diseaseName: '=',
                targets: '=',
                filters: '=',
                getfacets: '=',
                search: '='
            },

            templateUrl: 'src/components/filter-by-file-targets/filter-by-file-targets.html',
            link: function (scope) {
                // $log.log("cttvFilterByFileTargets:linkFunction: scope", scope);
                // $log.log("cttvFilterByFileTargets:linkFunction: elem", elem);

                scope.maxFileSize = 20000;

                var multiSearchChunkSize = 200;

                scope.lists = cttvLoadedLists.getAll();

                scope.useList = function (list) {

                    scope.targetNameIdDict = [];
                    scope.targetIdArray = [];
                    scope.targetNameArray = [];


                    for (var i = 0; i < list.list.length; i++) {
                        $log.log(list.list[i]);
                        if (list.list[i].selected) {
                            scope.targetNameArray.push(list.list[i].result.approved_symbol);
                            scope.targetIdArray.push(list.list[i].result.id);
                            scope.targetNameIdDict.push({
                                id: list.list[i].result.id,
                                label: list.list[i].result.approved_symbol,
                                name: list.list[i].query
                            });
                        }
                    }

                    // for (var i = 0; i < list.list.length; i++) {
                    //     if (list.list[i].result.selected) {
                    //         scope.targetIdArray[i] = list.list[i].result.id;
                    //         scope.targetNameIdDict[i] = {
                    //             id: list.list[i].result.id,
                    //             label: list.list[i].result.data.approved_symbol,
                    //             name: list.list[i].query
                    //         };
                    //     }
                    //     else {
                    //         scope.targetNameIdDict[i] = {
                    //             id: '',
                    //             label: list.list[i].q,
                    //             name: list.list[i].q
                    //         };
                    //     }
                    // }

                    updateAllArrays();

                };

                scope.initFilterByFile = function () {
                    scope.fileName = '';

                    // $log.log("scope targets is...");
                    // $log.log(scope.targets);
                    scope.targetNameArray = scope.targets;
                    // scope.targetNameArray = [];//this one holds targetnames as they are read from the file
                    scope.targetIdArray = [];
                    scope.targetNameIdDict = [];// this has all the targetNames, id-s that were found or "", and labels tht were found for these ids

                    scope.excludedTargetArray = [];// this has all the targets for whits no id could be found, even with fuzzy search
                    scope.fuzzyTargetArray = [];// these are the ones for which we found id-s but for targetName that did not exactly match
                    scope.targetIdArrayWithoutFuzzies = [];

                    scope.totalNamesCollapsed = true;
                    scope.excludedTargetsCollapsed = true;
                    scope.fuzzyTargetsCollapsed = true;
                    scope.filterByFileCollapsed = false; // this should be open by default

                    scope.fuzziesIncludedInSearch = true;
                };

                scope.initFilterByFile();

                scope.uploadedFile = function (element) {
                    scope.$apply(function ($scope) {
                        scope.files = element.files;
                        scope.addFile();
                    });

                };

                scope.removeTargets = function () {
                    var theElement = document.getElementById('myFileInput');

                    $location.search('targets', null);
                    scope.targets = [];
                    scope.initFilterByFile();
                    //
                    //
                    // theElement.value = null;
                    // scope.targets = [];
                    // scope.initFilterByFile();
                    // scope.getfacets(scope.filters, scope.targets);
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
                        // do something with file content here
                        var myFileContent = evt.target.result;
                        targetNameArrayTemp = myFileContent.replace(/(\r\n|\n|\r|,)/gm, '\n').split('\n');
                        targetNameArrayTemp = targetNameArrayTemp.filter(function (e) { return e.trim();}); // get rid of empty strings
                        targetNameArrayTemp = targetNameArrayTemp.map(function (value) {return value.toLowerCase();});

                        scope.targetNameArray = uniqueArrayFast(targetNameArrayTemp);
                        scope.targetIdArray = new Array(scope.targetNameArray.length);
                        scope.targetNameIdDict = new Array(scope.targetNameArray.length);

                        // analytics event
                        $analytics.eventTrack('filterByTargetList', {'category': 'filterByTargetList', 'label': ('loaded ' + scope.targetNameArray.length + ' targets')});

                        // $log.log("UNIQUE NAMES:" + scope.targetNameArray );
                        // Choose either Async or Consecutive version for testing
                        // getBestHitTargetsIdsAsync(scope.targetNameArray);
                        getBestHitTargetsIdsConsecutive(scope.targetNameArray);
                    };
                    reader.readAsText(file);
                };

                var uniqueArrayFast = function (a) {
                    var o = {}, i, l = a.length, r = [];
                    for (i = 0; i < l; i += 1) {o[a[i]] = a[i];}
                    for (i in o) {r.push(o[i]);}
                    return r;
                };

                scope.fuzzyToggle = function () {
                    scope.fuzziesIncludedInSearch = !scope.fuzziesIncludedInSearch;
                    if (scope.fuzziesIncludedInSearch) {
                        scope.targets = uniqueArrayFast(scope.targetIdArray);
                    }
                    else {
                        scope.targets = uniqueArrayFast(scope.targetIdArrayWithoutFuzzies);
                    }
                };

                // var getBestHitTargetsIdsAsync = function(targetNameArray){
                //     var promisesArray = [];
                //     for (var i = 0; i < targetNameArray.length; i += multiSearchChunkSize) {
                //         promisesArray.push(getBestHitTargetsIdsChunk(targetNameArray.slice(i, i + multiSearchChunkSize), i))
                //     }
                //     $q.all(promisesArray).then(updateAllArrays);
                // };

                var getBestHitTargetsIdsConsecutive = function (targetNameArray) {

                    var promise = $q(function (resolve, reject) {
                        resolve('');
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

                    // got all pieces - glue it all together
                    promise.then(function (res) {
                        updateAllArrays();
                    });
                };


                // this is a 200 long slice of the original targetNameArray
                var getBestHitTargetsIdsChunk = function (targetNameArray, from) {
                    var opts = {
                        q: targetNameArray,
                        filter: 'target',
                        fields: 'approved_symbol'
                    };

                    var queryObject = {
                        method: 'POST',
                        params: opts
                    };

                    // $log.log("getBestHitTargetsIdsChunk:targetNameArray[0]",targetNameArray[0]);
                    // $log.log("getBestHitTargetsIdsChunk:from",from);

                    return cttvAPIservice.getBestHitSearch(queryObject)
                        .then(function (resp) {
                            if (resp.body.data.length) {

                                var listName = cttvLoadedLists.parseBestHitSearch(scope.fileName, resp.body);
                                scope.list = cttvLoadedLists.get(listName);

                                for (var i = 0; i < resp.body.data.length; i++) {
                                    if (resp.body.data[i].data) {
                                        scope.targetIdArray[i + from] = resp.body.data[i].id;
                                        scope.targetNameIdDict[i + from] = {
                                            id: resp.body.data[i].id,
                                            label: resp.body.data[i].data.approved_symbol,
                                            name: resp.body.data[i].q
                                        };
                                    }
                                    else {
                                        scope.targetNameIdDict[i + from] = {
                                            id: '',
                                            label: resp.body.data[i].q,
                                            name: resp.body.data[i].q
                                        };
                                    }
                                }
                            }
                        });
                };

                var updateAllArrays = function () {
                    scope.targetIdArray = scope.targetIdArray.filter(function (e) {
                        return !e.id;
                    });
                    scope.targets = uniqueArrayFast(scope.targetIdArray);
                    scope.excludedTargetArray = scope.targetNameIdDict.filter(function (e) {
                        return !e.id;
                    });
                    scope.fuzzyTargetArray = scope.targetNameIdDict.filter(function (e) {
                        return e.name.toLowerCase().localeCompare(e.label.toLowerCase()) !== 0 && e.id.toLowerCase().localeCompare(e.name.toLowerCase()) !== 0;
                    });
                    scope.targetIdArrayWithoutFuzzies = scope.targetNameIdDict.map(function (e) {
                        if (e.id && (e.name.toLowerCase().localeCompare(e.label.toLowerCase()) == 0 || e.id.toLowerCase().localeCompare(e.name.toLowerCase()) == 0)) { // has label and not fuzzy or has name and id and they are the same (for case when name is ENS code already)
                            return e.id;
                        }
                    });
                    scope.targetIdArrayWithoutFuzzies = scope.targetIdArrayWithoutFuzzies.filter(function (e) {
                        return e;
                    });// this step will filter out undefined

                    // Update the url with the targets in the list
                    var compressedTargets = cttvUtils.compressTargetIds(scope.targets);
                    $location.search('targets=' + compressedTargets.join(','));

                    // scope.getfacets(scope.filters, scope.targets);
                };

            }

        };
    }]);
