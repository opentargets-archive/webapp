'use strict';

/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 * It loads a list of associations for the given search
 */
    .controller('AssociationsCtrl', ['$scope', '$location', '$log', function ($scope, $location, $log) {
	$log.log('AssociationsCtrl()');
	$scope.search = {
	    query : $location.search().q,
	    label : $location.search().label
	};
	$scope.nresults = 0;
	$scope.focusEFO = "cttv_source";

	var currentFocus = "cttv_disease";
	var navopen = true;
	// $scope.dataTypes = [
	//     {
	// 	name: "genetic_association",
	// 	selected: true
	//     },
	//     {
	// 	name: "somatic_mutations",
	// 	selected: true
	//     },
	//     {
	// 	name: "known_drugs",
	// 	selected: true
	//     },
	//     {
	// 	name: "rna_expression",
	// 	selected: true
	//     },
	//     {
	// 	name: "affected_pathways",
	// 	selected: true
	//     },
	//     {
	// 	name: "animal_models",
	// 	selected: false
	//     }
	// ]
	$scope.currentDataTypes = ["genetic_associations","somatic_mutations","known_drugs", "rna_expression", "affected_pathways"];
	$scope.dataTypes = ["genetic_associations","somatic_mutations","known_drugs", "rna_expression", "affected_pathways", "animal_models"];

	$scope.filterDataType = function (dataType) {
	    console.log(dataType + " datatype filter clicked");
	}
	
	$scope.selectTherapeuticArea = function (efo) {
	    if (efo === currentFocus) {
		currentFocus = "cttv_disease";
	    } else {
		currentFocus = efo;
	    }
	    $scope.focusEFO = currentFocus;
	};

	$scope.selectNavigation = function () {
	    navopen = !navopen;
	    if (navopen) {
		$scope.focusEFO = currentFocus;
	    } else {
		$scope.focusEFO = "cttv_disease";
	    }
	};

	$scope.selectDisease = function (efo) {
	    $scope.highlightEFO = efo;
	};
	
	// Display toggle (vis / table)
	$scope.displaytype = "bubbles";
	$scope.setDisplay = function (displ) {
	    console.log("DISPLAY CHANGED TO " + displ);
	    //$scope.displaytype = displ;
	    switch (displ) {
	    case "bubbles" :
		$("cttv-target-associations-bubbles").css("display", "block");
		$("cttv-target-associations-table").css("display", "none");
		$("cttv-target-associations-tree").css("display", "none");
		$(".cttv-facet").css("display", "block");
		break;
	    case "table" :
		$("cttv-target-associations-bubbles").css("display", "none");
		$("cttv-target-associations-table").css("display","block");
		$("cttv-target-associations-tree").css("display", "none");
		$(".cttv-facet").css("display", "none");
		break;
	    case "tree" :
		$("cttv-target-associations-bubbles").css("display", "none");
		$("cttv-target-associations-table").css("display","none");
		$("cttv-target-associations-tree").css("display", "block");
		$(".cttv-facet").css("display", "none");
	    	break;
	    }
	    
	}

    }])
