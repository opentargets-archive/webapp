angular.module('cttvDirectives')
    .directive('targetListUpload', ['cttvAPIservice', 'cttvLoadedLists', 'cttvConfig', function (cttvAPIservice, cttvLoadedLists, cttvConfig) {
        'use strict';

        return {
            restrict: 'E',
            scope: {
                list: '='
            },
            templateUrl: 'src/components/batch-search/target-list-upload.html',
            link: function (scope, elem) {

            // Current limit of targets (just to show the limit in the sub header)
                scope.targetListLimit = cttvConfig.targetListLimit;

                // Show all previous lists
                scope.lists = cttvLoadedLists.getAll();

                scope.useThisList = function (listId) {
                    scope.list = cttvLoadedLists.get(listId);
                };
                scope.removeThisList = function (listId) {
                    scope.lists = cttvLoadedLists.remove(listId);
                };

                // Show the latest loaded list by default:
                scope.list = scope.lists[scope.lists.length - 1];

                // Loads the sample list
                scope.loadExample = function () {
                    var exampleTargets = ['PTGS2', 'PTGS1', 'AC026248.1', 'TSPAN14', 'SPRED2', 'CDC37', 'UBAC2', 'IL27', 'ADO', 'NKX2-3', 'TYK2', 'GPR35', 'MAP3K8', 'SLC39A11', 'PTGER4', 'PARK7', 'GPR183', 'RORC', 'NXPE1', 'KLF3', 'HLA-DQB1', 'BANK1', 'CUL2', 'NR5A2', 'IPMK', 'IFNG', 'CLCN2', 'ALOX5', 'RGS14', 'AQP8', 'LITAF', 'TUBD1', 'KRAS', 'ADCY3', 'RNF186', 'ZGPAT', 'LSP1', 'CSF2RB', 'ERAP2', 'VDR', 'CCL7', 'TNFSF15', 'ANKRD55', 'GABRG3', 'GABRG2', 'GABRG1', 'SP140', 'ITGA4', 'PDGFB', 'RIT1', 'NOD2', 'CARD9', 'ATG16L1', 'IL23R', 'ICAM1', 'ITGAL'];
                    searchTargets('sampleList', exampleTargets);
                };

                scope.loadPastedList = function () {
                    if (!scope.pastedListName) {
                        scope.noNameForPastedList = true;
                    } else {
                        scope.noNameForPastedList = false;
                    }

                    if (!scope.pastedList) {
                        scope.noPastedList = true;
                    } else {
                        scope.noPastedList = false;
                        var targets = scope.pastedList.replace(/(\r\n|\n|\r|,)/gm, '\n').split('\n');
                        if (targets.length) {
                            searchTargets(scope.pastedListName, targets);
                        }
                    }

                };

                // In searches we store the searched term (target in the list) with its search promise
                scope.uploadFile = function () {
                    var file = elem[0].getElementsByTagName('input')[0].files[0];
                    var reader = new FileReader();
                    reader.onloadend = function (e) {
                        var fileContent = e.target.result;
                        var targets = fileContent.replace(/(\r\n|\n|\r|,)/gm, '\n').split('\n');
                        targets = targets.filter(function (t) {
                            if (t) {return true;}
                            else {return false;}
                        });
                        searchTargets(file.name, targets);
                    };
                    reader.readAsText(file);
                };

                function searchTargets (name, targets) {
                    var opts = {
                        q: targets,
                        filter: 'target',
                        fields: 'approved_symbol'
                    };

                    var queryObject = {
                        method: 'POST',
                        params: opts
                    };

                    return cttvAPIservice.getBestHitSearch(queryObject)
                        .then(function (resp) {
                            var listName = cttvLoadedLists.parseBestHitSearch(name, resp.body);

                            // Show all previous lists
                            scope.lists = cttvLoadedLists.getAll();
                            scope.list = cttvLoadedLists.get(listName);
                        // if (!scope.storeList) {
                        //     cttvLoadedLists.remove(listName);
                        // }
                        });

                }
            }
        };
    }]);
