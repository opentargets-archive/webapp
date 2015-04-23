'use strict';

/* Add to the cttv controllers module */
angular.module('cttvControllers')

/**
 * AssociationsCtrl
 * Controller for the target associations page
 * It loads a list of associations for the given search
 */
    .controller('targetAssociationsCtrl', ['$scope', '$location', '$log', 'cttvUtils', 'cttvAPIservice', function ($scope, $location, $log, cttvUtils, cttvAPIservice) {
	$log.log('targetAssociationsCtrl()');
	var q = $location.path().split('/')[2];
	$scope.search = {
	    query : q
	};

	// given a target id, get the name
	/*var api = cttvApi();
	var url = api.url.gene({'gene_id': q});
	$log.log(url);
	api.call(url)
	    .then(function (resp) {
		$scope.search.label = resp.body.approved_symbol;
	    });
	*/
	
    // get gene specific info 
    cttvAPIservice.getGene( {
            gene_id:q
        } ).
        then(
            function(resp) {
                $scope.search.label = resp.body.approved_symbol;
            },
            cttvAPIservice.defaultErrorHandler
        );





	$scope.nresults = 0;

	// datatypes filter
	$scope.dataTypes = [
	    {
		name: "genetic_association",
		label: "Genetics",
		labelFull: "Genetic associations",
		selected: false
	    },
	    {
		name: "somatic_mutation",
		label: "Somatic",
		labelFull: "Somatic mutations",
		selected: false
	    },
	    {
		name: "known_drug",
		label: "Drugs",
		labelFull: "Known drugs",
		selected: false
	    },
	    {
		name: "rna_expression",
		label: "RNA",
		labelFull: "RNA expression",
		selected: false
	    },
	    {      
		name: "affected_pathway",
		label: "Pathways",
		labelFull: "Affected pathways",
		selected: false
	    },
	    {
		name: "animal_model",
		label: "Models",
		labelFull: "Mouse models",
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

	$scope.toggleDataTypes = function () {
	    $scope.toggleNavigation();
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
	};

	// This method filters out redundant diseases in different therapeutic areas (redundant diseases in the same therapeutic area is filtered out in the targetAssociation component (that controls the bubble view)
	// It returns an array of the non-redundant diseases and another structure with the number of diseases per datatype
	// TODO: Split the method in two: one returning each datastructre
	$scope.nonRedundantDiseases = function (tas) {
	    var diseasesInDatatypes = {};
	    var nonRedundantDiseases = {};
	    var filtered
	    for (var i=0; i<tas.length; i++) {
		var ta = tas[i];
		for (var j=0; j<ta.children.length; j++) {
		    nonRedundantDiseases[ta.children[j].efo_code] = 1;
		    var dts = ta.children[j].datatypes;
		    for (var k=0; k<dts.length; k++) {
			if (diseasesInDatatypes[dts[k].datatype] === undefined) {
			    diseasesInDatatypes[dts[k].datatype] = 0;
			}
			diseasesInDatatypes[dts[k].datatype]++;
		    }
		}
	    }
	    return [nonRedundantDiseases, diseasesInDatatypes];
	};

	// This method sets the number of diseases supported by each datatype
	// It needs to be called only once (on load) and without any filter applied
	var allDiseases = [];
	var includedDiseases = [];
	$scope.setDiseasesInDatatypes = function () {
	    cttvAPIservice.getAssociations ({
		gene: $scope.search.query,
		datastructure: "tree"
	    })
		.then (function (resp) {
		    var data = resp.body.data;
		    var dummy = geneAssociations()
			.data(data);
		    var ass = dummy.data().children || [];

		    var auxArr = $scope.nonRedundantDiseases(ass);
		    allDiseases = _.keys(auxArr[0]);
		    $scope.checkFilteredOutDiseases();
		    var diseasesInDatatypes = auxArr[1];
		    // Get the diseases that are in non filtered datatypes and filtered datatypes
		    for (var n=0; n<$scope.dataTypes.length; n++) {
		        $scope.dataTypes[n].diseases = diseasesInDatatypes[$scope.dataTypes[n].name] || 0;
		    }
		});
	};
	$scope.setDiseasesInDatatypes();

	$scope.checkFilteredOutDiseases = function () {
	    if (_.isEmpty(includedDiseases) || _.isEmpty(allDiseases)) {
		return
	    }

	    var diff = _.difference(allDiseases, includedDiseases);
	    $scope.ndiseasesfiltered = diff.length;
	    $scope.diseasesFilteredMsg = $scope.ndiseasesfiltered ? " (" + $scope.ndiseasesfiltered + " diseases filtered)" : "";
	};

	$scope.ndiseases = 0;
	$scope.setTherapeuticAreas = function (tas) {
	    $scope.therapeuticAreas = tas;
	    var nonRedundantDiseases = $scope.nonRedundantDiseases(tas)[0];
	    $scope.ndiseases = _.keys(nonRedundantDiseases).length || 0;
	    includedDiseases = _.keys(nonRedundantDiseases);
	    $scope.checkFilteredOutDiseases();
	};
	
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
	    $scope.diseasegroupOpen = false;
	};
	
	$scope.selectedDisease = 0;
	$scope.selectDisease = function (d) {
	    $scope.highlightEFO = {efo: d.efo_code,
				   parent_efo: d._parent.efo_code,
				   datatypes: d.datatypes
				  };
	    $scope.selectedDisease++;
	    // if ($scope.selectedDisease === true) {
	    // 	$scope.selectedDisease = false;
	    // } else {
	    // 	$scope.selectedDisease = true;
	    // }
	};
	
	// Display toggle (vis / table)
	// TODO: We shouldn't change html events in the controller. This should go in the directive!
	//$scope.displaytype = "bubbles";

	$scope.visibility = {};
	$scope.setDisplay = function (displ) {
	    console.log("DISPLAY CHANGED TO " + displ);
	    //$scope.displaytype = displ;
	    switch (displ) {
	    case "bubbles" :
		// $scope.visibility.bubbles = "block";
		// $scope.visibility.table = "none";
		// $scope.visibility.tree = "none";

		$("cttv-target-associations-bubbles").css("display", "block");
		$("cttv-target-associations-table").css("display", "none");
		$("cttv-target-associations-tree").css("display", "none");
		$(".cttv-nav").css("display", "block");
		break;
	    case "table" :
		// $scope.visibility.bubbles = "none";
		// $scope.visibility.table = "block";
		// $scope.visibility.bubbles = "none";

		$("cttv-target-associations-bubbles").css("display", "none");
		$("cttv-target-associations-table").css("display","block");
		$("cttv-target-associations-tree").css("display", "none");
		$(".cttv-nav").css("display", "none");
		break;
	    case "tree" :
		// $scope.visibility.bubbles = "none";
		// $scope.visibility.table = "none";
		// $scope.visibility.tree = "block";

		$("cttv-target-associations-bubbles").css("display", "none");
		$("cttv-target-associations-table").css("display","none");
		$("cttv-target-associations-tree").css("display", "block");
		$(".cttv-nav").css("display", "none");
	    	break;
	    }
	    
	}

    }])
