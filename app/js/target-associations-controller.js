
/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 * It loads a list of associations for the given search
 */
    .controller('targetAssociationsCtrl', ['$scope', '$location', '$log', 'cttvUtils', 'cttvAPIservice', 'cttvFiltersService', 'cttvConsts', 'cttvDictionary', '$timeout', function ($scope, $location, $log, cttvUtils, cttvAPIservice, cttvFiltersService, cttvConsts, cttvDictionary, $timeout) {
        'use strict';

	$log.log('targetAssociationsCtrl()');
    cttvUtils.clearErrors();

	var q = $location.path().split('/')[2];
	$scope.search = {
	    query : q
	};

    $scope.labels = {
        therapeutic_areas : cttvDictionary.THERAPEUTIC_AREAS
    };



    // reset the filters when loading a new page
    // so we don't see the filters from the previous page...
    cttvFiltersService.reset();

    // Set filters
    cttvFiltersService.pageFacetsStack([
        //cttvFiltersService.facetTypes.SCORE,        // adds a score facet to the page
        cttvFiltersService.facetTypes.DATATYPES,
        cttvFiltersService.facetTypes.THERAPEUTIC_AREAS
    ]);

    var filters = cttvFiltersService.parseURL();
    // var opts = cttvAPIservice.addFacetsOptions(filters, {});
    // cttvAPIservice.addFacetsOptions(filters, {});



    // Set up a listener for the URL changes and
    // when the search change, get new data
    $scope.$on('$routeUpdate', function(){
        $log.log("onRouteUpdate");
        //$scope.filterDataTypes (cttvFiltersService.parseURL());
        getFacets(cttvFiltersService.parseURL());
    });

    function getFacets (filters) {
        $log.log("getFacets()");
        // Set the filters
        $scope.filters = filters;

        var opts = {
            target: q,
            outputstructure: "flat",
            facets: true,
            direct: true,
            size: 1
        };
        opts = cttvAPIservice.addFacetsOptions(filters, opts);

        cttvAPIservice.getAssociations(opts)
            .then (function (resp) {
                // set the label
                $scope.search.label = resp.body.data[0].target.gene_info.symbol;

                // set the filename
                $scope.search.filename = cttvDictionary.EXP_TARGET_ASSOC_LABEL + resp.body.data[0].target.gene_info.symbol;

                // Set the total number of diseases
                $scope.n = {};
                $scope.n.diseases = resp.body.total;

                // Update the facets
                // var tas = resp.body.therapeutic_areas;
                // var taFacets = {};
                // taFacets.buckets = [];
                // for (var i=0; i<tas.length; i++) {
                //     taFacets.buckets.push({
                //         unique_disease_count: {value: 1},
                //         disease: tas[i].disease
                //     });
                // }
                // resp.body.facets.therapeutic_areas = taFacets;

                //resp.body.facets.therapeutic_areas = resp.body.therapeutic_areas;
                $scope.updateFacets(resp.body.facets);
            },
            cttvAPIservice.defaultErrorHandler);
    }


    // get gene specific info
    // cttvAPIservice.getTarget( {
    //         target_id:q
    //     } ).
    //     then(
    //         function(resp) {
    //             $scope.search.label = resp.body.approved_symbol;
    //             $scope.search.filename = cttvDictionary.EXP_TARGET_ASSOC_LABEL + resp.body.approved_symbol.split(" ").join("_");
    //         },
    //         cttvAPIservice.defaultErrorHandler
    //     );


    getFacets(cttvFiltersService.parseURL());

	$scope.loading = false;


	$scope.toggleDataTypes = function () {
	    $scope.toggleNavigation();
	};


    /**
     * Parse the filters.
     * That means it takes the list of filters as specified in the URL
     */
    $scope.filter = function(filters){
        $log.log("filter()");

        $scope.filters = filters;

        // we parse for datatypes regardless of whether there are any,
        // since the function there takes care of that case
        // parseDataTypes( filters );

        $scope.score = {};
    };

    /*
    $scope.filterDataTypes = function (filters) {
        var currDatatypes = {};
        //if (!Object.keys(filters).length) {
        if( !filters[cttvConsts.DATATYPES] ){
            for (var k=0; k<$scope.dataTypes.length; k++) {
                currDatatypes[$scope.dataTypes[k].name] = $scope.dataTypes[k].label;
            }
        } else {
            var filterDatatypes = filters[cttvConsts.DATATYPES];
            for (var i=0; i<filterDatatypes.length; i++) {
                var dt = filterDatatypes[i];
                for (var j=0; j<$scope.dataTypes.length; j++) {
                    var thisDT = $scope.dataTypes[j];
                    if (thisDT.name === dt) {
                        currDatatypes[thisDT.name] = thisDT.label;
                        break;
                    }
                }
            }
        }
        $scope.currentDataTypes = currDatatypes;
    };*/


    /*
     * Private function; creates hash object for selected datatypes (or all) with corresponding labels for flower graph
     */
    // var parseDataTypes = function (filters) {
    //     var currDatatypes = {};
    //
    //     var filterDatatypes = filters[cttvConsts.DATATYPES] || cttvConsts.datatypesOrder.map(function(d){
    //         return cttvConsts.datatypes[d];
    //     });
    //     filterDatatypes.forEach(function(dt){
    //         currDatatypes[dt] = cttvConsts.datatypesLabels[dt.toUpperCase()];   // TODO: these labels should be in some sort of "aggregates", but at hte moment living in the consts service
    //     });
    //
    //     $scope.currentDataTypes = currDatatypes;
    // };


    //$scope.filterDataTypes(filters);
    $scope.filter(filters);

    $scope.updateFacets = function (facets) {
        $log.log("**** updateFacets() ****");
        cttvFiltersService.updateFacets(facets, "unique_disease_count");
    };

    // active tab
    $scope.active = "bubbles";
    $scope.setActive = function (who) {
        $scope.active = who;
    };

    /*
    // trying to comment this out as it doesn't seem to be used
	$scope.filterDataType = function (dataType) {
	    var currentDataTypes = {};
	    for (var i=0; i<$scope.dataTypes.length; i++) {
		if ($scope.dataTypes[i].name === dataType.name) {
		    $scope.dataTypes[i].selected = $scope.dataTypes[i].selected === false ? true : false;
		}
		if ($scope.dataTypes[i].selected) {
		    var name = $scope.dataTypes[i].name;
		    var label = $scope.dataTypes[i].label;
		    currentDataTypes[name] = label;
		}
	    }
	    $scope.currentDataTypes=currentDataTypes;
	};*/


	// This method filters out redundant diseases in different therapeutic areas (redundant diseases in the same therapeutic area is filtered out in the targetAssociation component (that controls the bubble view)
	// It returns an array of the non-redundant diseases and another structure with the number of diseases per datatype
	// TODO: Split the method in two: one returning each datastructre
	// $scope.nonRedundantDiseases = function (tas) {
	//     var diseasesInDatatypes = {};
	//     var nonRedundantDiseases = {};
	//     var filtered;
	//     for (var i=0; i<tas.length; i++) {
	// 	var ta = tas[i];
	// 	for (var j=0; j<ta.children.length; j++) {
	// 	    nonRedundantDiseases[ta.children[j].disease.id] = 1;
	// 	    var dts = ta.children[j].datatypes;
	// 	    for (var k=0; k<dts.length; k++) {
	// 		if (diseasesInDatatypes[dts[k].datatype] === undefined) {
	// 		    diseasesInDatatypes[dts[k].datatype] = 0;
	// 		}
	// 		diseasesInDatatypes[dts[k].datatype]++;
	// 	    }
	// 	}
	//     }
	//     return [nonRedundantDiseases, diseasesInDatatypes];
	// };


	// This method sets the number of diseases supported by each datatype
	// It needs to be called only once (on load) and without any filter applied
	// var allDiseases = [];
	// var includedDiseases = [];
	// $scope.setDiseasesInDatatypes = function () {
    //     cttvAPIservice.getAssociations ({
    //         target: $scope.search.query,
    //         outputstructure: "flat",
	//     })
    // 		.then (function (resp) {
    //             cttvFiltersService.updateFacets(resp.body.facets, "unique_disease_count");
    //
    // 		    // var data = resp.body.data;
    // 		    // var dummy = geneAssociations()
    //             //     .data(data);
    //             //
    // 		    // var ass = dummy.data().children || [];
    //             // console.log(ass);
    //             //
    // 		    // var auxArr = $scope.nonRedundantDiseases(ass);
    // 		    // allDiseases = _.keys(auxArr[0]);
    //             // console.log(allDiseases);
    // 		    // $scope.checkFilteredOutDiseases();
    //
    // 		    //var diseasesInDatatypes = auxArr[1];
    //
    // 		    // TODO: For now we are avoiding to show the number of diseases per datatype because this will cause inconsistencies
    // 		    // with filtered out datatypes in the bubbles view. We will have to rethink this
    // 		    // Get the diseases that are in all datatypes
    // 		    // for (var n=0; n<$scope.dataTypes.length; n++) {
    // 		        //$scope.dataTypes[n].diseases = diseasesInDatatypes[$scope.dataTypes[n].name] || 0;
    // 		    // }
    // 		},
    //         cttvAPIservice.defaultErrorHandler
    //     );
	// };
	//$scope.setDiseasesInDatatypes();

	// $scope.checkFilteredOutDiseases = function () {
	//     // if (_.isEmpty(includedDiseases) || _.isEmpty(allDiseases)) {
	//     // 	return
	//     // }
	//     var diff = _.difference(allDiseases, includedDiseases);
	//     $scope.ndiseasesfiltered = diff.length;
	//     $scope.diseasesFilteredMsg = $scope.ndiseasesfiltered ? " (" + $scope.ndiseasesfiltered + " diseases filtered out)" : "";
	// };

	// $scope.setTherapeuticAreas = function (tas) {
    //     $scope.bubblesUpdating = true;
    //     $timeout(function () {
    //         $scope.bubblesUpdating = false;
    //         $scope.therapeuticAreas = tas;
    //     }, 1000);
    //
	//     // var nonRedundantDiseases = $scope.nonRedundantDiseases(tas)[0];
	//     // $scope.ndiseases = _.keys(nonRedundantDiseases).length || 0;
	//     // includedDiseases = _.keys(nonRedundantDiseases);
	//     // $scope.checkFilteredOutDiseases();
	// };

    $scope.n = {};
    $scope.n.diseases = "..."; // this should be a number, but initialize to ... for better user feedback
    // $interval (function () {
    //     console.log($scope.loading);
    // }, 100);
    // $scope.setTotalDiseases = function (diseases) {
    //     $scope.ndiseases = diseases.length;
    // };

	// Therapeutic Areas Nav
	// $scope.focusEFO = "cttv_source";

	// $scope.tagroup = {};
	// $scope.tagroup.tas = {};
	// $scope.tagroup.filled = false;
	// $scope.tagroup.open = true;
    //
	// var currentFocus = "cttv_disease";

    // $scope.selectTherapeuticArea = function (efo) {
    //     // Keep track of the state
    //     if (!$scope.tagroup.filled) {
    //         $scope.tagroup.filled = true;
    //         for (var i=0; i<$scope.therapeuticAreas.length; i++) {
    //             var therapeuticArea = $scope.therapeuticAreas[i];
    //             $scope.tagroup.tas[therapeuticArea.name] = false;
    //         }
    //     }
    //     if (efo === currentFocus) {
    //         currentFocus = "cttv_disease";
    //     } else {
    //         currentFocus = efo;
    //     }
    //     $scope.focusEFO = currentFocus;
    // };

    // $scope.bubblesSelected = function () {
    //     $(".cttv-nav").show();
    // };
    //
    // $scope.treeSelected = function () {
    //     $(".cttv-nav").show();
    // };
    //
    // $scope.tableSelected = function () {
    //     $(".cttv-nav").hide();
    // }

    // $scope.toggleNavigation = function () {
    //     for (var ta in $scope.tagroup.tas) {
    //         $scope.tagroup.tas[ta] = false;
    //     }
    //     $scope.focusEFO = "cttv_disease";
    //     currentFocus = "cttv_disease";
    //     $scope.diseasegroupOpen = false;
    // };
    //
    // $scope.selectedDisease = 0;
    // $scope.selectDisease = function (d) {
    //     $scope.highlightEFO = {efo: d.disease.id,
    //         parent_efo: d._parent.disease.id,
    //         datatypes: d.datatypes
    //     };
    //     $scope.selectedDisease++;
    //     // if ($scope.selectedDisease === true) {
    //     // 	$scope.selectedDisease = false;
    //     // } else {
    //     // 	$scope.selectedDisease = true;
    //     // }
    // };

}]);
