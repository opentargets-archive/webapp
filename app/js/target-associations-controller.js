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
	$scope.dataTypes = [
	    {
		name: "genetic_association",
		label: "Genetics",
		selected: true
	    },
	    {
		name: "somatic_mutation",
		label: "Somatic",
		selected: true
	    },
	    {
		name: "known_drugs",
		label: "Drugs",
		selected: true
	    },
	    {
		name: "rna_expression",
		label: "RNA",
		selected: true
	    },
	    {
		name: "affected_pathways",
		label: "Pathways",
		selected: true
	    },
	    {
		name: "animal_models",
		label: "Models",
		selected: false
	    }
	]
	var currentDataTypes = {};
	for (var i=0; i<$scope.dataTypes.length; i++) {
	    if ($scope.dataTypes[i].selected) {
		var name = $scope.dataTypes[i].name;
		var label = $scope.dataTypes[i].label;
		currentDataTypes[name] = label;
	    }
	}
	$scope.currentDataTypes = currentDataTypes;

	$scope.filterDataType = function (dataType) {
	    var currentDataTypes = {};
	    for (var i=0; i<$scope.dataTypes.length; i++) {
		if ($scope.dataTypes[i].name === dataType.name) {
		    $scope.dataTypes[i].selected = $scope.dataTypes[i].selected === false ? true : false;
		}
		if ($scope.dataTypes[i].selected) {
		    var name = $scope.dataTypes[i].name
		    var label = $scope.dataTypes[i].label;
		    currentDataTypes[name] = label;
		}
	    }
	    $scope.currentDataTypes=currentDataTypes;
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
