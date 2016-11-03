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

.controller ("diseaseAssociationsCtrl", ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvFiltersService', 'cttvDictionary', 'cttvUtils', 'cttvLocationState', 'cttvLoadedLists', '$q', function ($scope, $location, $log, cttvAPIservice, cttvFiltersService, cttvDictionary, cttvUtils, cttvLocationState, cttvLoadedLists, $q) {

    'use strict';

    //$log.log('diseaseAssociationsCtrl()');

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

    // Initialise possible targets and targetLists to filter the table
    $scope.targets = [];
    $scope.targetLists = [];

    var targetList = $location.search()["target-list"];
    // var targetList = new_state["target-list"];
    if (targetList) {
        var list = cttvLoadedLists.get(targetList);
        var targets = [];
        for (var i=0; i<list.list.length; i++) {
            var item = list.list[i];
            if (item.result.id) {
                targets.push(item.result.id);
            }
        }
        // Passing them to the disease associations table directive
        // $scope.targets = _.concat($scope.targets, targets);
        // $scope.targetLists = _.concat($scope.targetLists, list.id);
        // $log.log("targets after loading the " + list.id + " list");
        // $log.log($scope.targets);
        // $log.log("targetLists after loading the " + list.id + " list");
        // $log.log($scope.targetLists);
        // $scope.targets = targets;  // TODO: I think this is not needed, in render $scope.targets is set
        // $scope.targetList = list.id; // TODO: I think this is not needed, in render $scope.targetList is set
    }

    // TODO: should be done through the cttvLocationState?
    $scope.removeTargetLists = function () {
        $location.search("target-list", null);
        $location.search("target", null);
        // TODO: Also remove the filter by target list feature
        $scope.removeTargets();
        // $route.reload();
        // $window.location.reload();
    };

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
        var facetsPromise = $q(function (resolve) {
            resolve("");
        });
        if( ! _.isEqual( new_state[facetsId], old_state[facetsId] ) || !new_state[facetsId] ){
            facetsPromise.then(function () {
                return getFacets (new_state[facetsId]);
            });
        }

        // Do we have targets?
        var targets;
        if (new_state.targets) {
            targets = new_state.targets.target;
        }
        // if (targets && !angular.isArray(targets)) {
        //     targets = [targets];
        // }

        // Do we have a target list?
        // TODO: This should go into the facets service
        var targetList = new_state["target-list"];
        if (targetList) {
            var list = cttvLoadedLists.get(targetList);
            targets = [];
            for (var i=0; i<list.list.length; i++) {
                var item = list.list[i];
                if (item.result.id) {
                    targets.push(item.result.id);
                }
            }
        }

        if (targets) {
            // Passing them to the disease associations table directive
            $scope.targets = targets;
            $scope.targetList = "a list of targets";

            facetsPromise.then (function () {
                return getFacets(new_state[facetsId]);
            });
        } else {
            $scope.targets = [];
            $scope.targetList = [];
            facetsPromise.then (function () {
                return getFacets(new_state[facetsId]);
            });
        }
    };

    var initFilterByFile =function(){
        $scope.fileName = "";

        $scope.targetArray = []; //this one is used when we are done fetching all the target IDs

        $scope.targetNameArray = [];//this one holds targetnames as they are read from the file
        $scope.targetIdArray = [];
        $scope.targetNameIdDict = [];//this has all the targetNames, id-s that were found or "", and labels tht were found for these ids

        $scope.excludedTargetArray = [];//this has all the targets for whits no id could be found, even with fuzzy search
        $scope.fuzzyTargetArray = [];//these are the ones for which we found id-s but for targetName that did not exactly match
        $scope.targetIdArrayWithoutFuzzies = [];

        $scope.totalNamesCollapsed = true;
        $scope.excludedTargetsCollapsed = true;
        $scope.fuzzyTargetsCollapsed = true;
        $scope.filterByFileCollapsed = false; //this should be open by default

        $scope.fuzziesIncludedInSearch = true;

    };

    initFilterByFile();

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
            disease: [$scope.search.query],
            outputstructure: "flat",
            facets: true,
            size:1
        };

        if ($scope.targets && $scope.targets.length) {
            opts.target = $scope.targets;
        }

        opts = cttvAPIservice.addFacetsOptions(filters, opts);
        var queryObject = {
            method: 'POST',
            params: opts
        };

        return cttvAPIservice.getAssociations(queryObject)
        .then(function(resp) {
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

        }, cttvAPIservice.defaultErrorHandler);

    };



    //
    // on STATECHANGED
    // Set up a listener for the URL changes and when the search change, get new data
    //

    $scope.$on(cttvLocationState.STATECHANGED, function (evt, new_state, old_state) {
        // $log.log("locationState statechanged!");
        render(new_state, old_state); // if there are no facets, no worries, the API service will handle undefined
    });



    //
    // on PAGE LOAD
    //
    cttvUtils.clearErrors();
    $scope.filters = cttvLocationState.getState()[facetsId] || {};
    render(cttvLocationState.getState(), cttvLocationState.getOldState());

    $scope.uploadedFile = function (element) {
        $scope.$apply(function ($scope) {
            $scope.files = element.files;
        });

        $scope.addFile();
    };

    $scope.removeTargets = function(){
        var theElement = document.getElementById("myFileInput");
        $scope.targetLists.pop(); // We assume that the target list in this filter is the last one (the other one is populated first). Maybe we should be more explicit
        // $scope.targets = [];
        cttvLocationState.setStateFor("targets", {});
        theElement.value = null;
        initFilterByFile();
        getFacets($scope.filters);
    };

    $scope.addFile = function () {
        $scope.validateFile($scope.files[0]);
    };

    $scope.validateFile = function (file) {
        $scope.targetLists = _.concat($scope.TargetLists, file.name);
        $scope.fileName = file.name;
        var reader = new FileReader();
        reader.onloadend = function (evt) {
            //do something with file content here
            var myFileContent = evt.target.result;
            $scope.targetNameArray = myFileContent.replace(/(\r\n|\n|\r|,)/gm, '\n').split('\n');
            $scope.targetNameArray = $scope.targetNameArray.filter(function(e){ return e.trim();}); //get rid of empty strings

            getTargetIds();
        };
        reader.readAsText(file);
    };

    var getTargetIds = function() {
        var promise = $q(function (resolve) {
            resolve("");
        });

        $scope.targetNameArray.forEach(function (targetName){
            promise = promise.then(function() {
               return getTargetId(targetName);
           });
        });

        promise.then(function (res) {
            // $scope.targets = .concat($scope.targets, $scope.targetIdArray);
            $scope.targetArray = $scope.targetIdArray;
            $scope.excludedTargetArray = $scope.targetNameIdDict.filter(function(e){return !e.id;});
            $scope.fuzzyTargetArray = $scope.targetNameIdDict.filter(function(e){return e.name.toLowerCase().localeCompare(e.label.toLowerCase()) !== 0 && e.id.toLowerCase().localeCompare(e.name.toLowerCase()) !== 0;});
            $scope.targetIdArrayWithoutFuzzies = $scope.targetNameIdDict.map(function (e) {
                 if (e.id && (e.name.localeCompare(e.label) == 0 || e.id.localeCompare(e.name) == 0)){ //has label and not fuzzy or has name and id and they are the same (for case when name is ENS code already)
                     return e.id;
                 }

            });
            $scope.targetIdArrayWithoutFuzzies = $scope.targetIdArrayWithoutFuzzies.filter(function(e){return e;});//this step will filter out undefined

            getFacets($scope.filters);
        });

    };

    $scope.fuzzyToggle = function(){
        //$log.log("fuzzyToggle");

        $scope.fuzziesIncludedInSearch = !$scope.fuzziesIncludedInSearch;
        if( $scope.fuzziesIncludedInSearch){
            $scope.targetArray = $scope.targetIdArray;

        }
        else {
            $scope.targetArray = $scope.targetIdArrayWithoutFuzzies;
        }
    }


    var getTargetId = function (targetName) {

        if (typeof targetName != "string") {
            $scope.targetIdArray.push('');
            $scope.targetNameIdDict.push ({
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
                    $scope.targetIdArray.push(resp.body.data[0].id);
                    $scope.targetNameIdDict.push({ id: resp.body.data[0].id, label:resp.body.data[0].data.approved_symbol, name:targetName});
                } else {
                    $scope.targetIdArray.push('');
                    $scope.targetNameIdDict.push({ id:'' , label:targetName, name:targetName});
                }
            });
    };

}]) ;
