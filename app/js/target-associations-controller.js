'use strict';

/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 * It loads a list of associations for the given search
 */
    .controller('targetAssociationsCtrl', ['$scope', '$location', '$log', function ($scope, $location, $log) {
	$log.log('targetAssociationsCtrl()');
	var q = $location.path().split('/')[2];
	$scope.search = {
	    query : q
	};

	// given a target id, get the name
	var api = cttvApi();
	var url = api.url.gene({'gene_id': q});
	$log.log(url);
	api.call(url)
	    .then(function (resp) {
		$scope.search.label = resp.body.approved_symbol;
	    });
	
	$scope.nresults = 0;

	// datatypes filter
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

	// var dtopen = false;
	$scope.toggleDataTypes = function () {
	    // dtopen = !dtopen;
	    // if (dtopen) {
		console.log("toggle nav");
		$scope.toggleNavigation();
	    // }
	}
	
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

	// Therapeutic Areas Nav
	$scope.focusEFO = "cttv_source";

	$scope.tagroup = {};
	$scope.tagroup.tas = {};
	$scope.tagroup.filled = false;
	$scope.tagroup.open = true;

	
	var currentFocus = "cttv_disease";

	$scope.selectTherapeuticArea = function (efo) {
	    // Keep track of the state
	    if (!$scope.tagroup.filled) {
		$scope.tagroup.filled = true;
		for (var i=0; i<$scope.therapeuticAreas.length; i++) {
		    var therapeuticArea = $scope.therapeuticAreas[i];
		    $scope.tagroup.tas[therapeuticArea.name] = false;
		}
	    }
	    if (efo === currentFocus) {
	    	currentFocus = "cttv_disease";
	    } else {
	    	currentFocus = efo;
	    }
	    $scope.focusEFO = currentFocus;
	};

	$scope.toggleNavigation = function () {
	    for (var ta in $scope.tagroup.tas) {
		$scope.tagroup.tas[ta] = false;
	    }
	    $scope.focusEFO = "cttv_disease";
	    currentFocus = "cttv_disease";
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
