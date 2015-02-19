'use strict';

/* Directives */
angular.module('cttvDirectives', [])

    // .directive('cttvTargetAssociationsTable', function () {
	
    // })

    .directive('cttvTargetAssociations', function () {

	function processData (data) {
	    var root = data;
	    var therapeuticAreas = data.children;

	    for (var i=0; i<therapeuticAreas.length; i++) {
	    	var tA = therapeuticAreas[i];
	    	var taChildren = tA.children;
		if (taChildren === undefined) {
		    continue;
		}
	    	var newChildren = [];
	    	for (var j=0; j<taChildren.length; j++) {
	    	    var taChild = taChildren[j];
	    	    var taLeaves = bubblesView().node(taChild).get_all_leaves();
	    	    for (var k=0; k<taLeaves.length; k++) {
	    		newChildren.push(taLeaves[k].data());
	    	    }
	    	}
	    	tA.children = newChildren;
	    }
	    return data;
	};

	var api = cttvApi();

	return {
	    restrict: 'EA',
	    scope: {
		displaytype : "="
	    },
	    link: function (scope, elem, attrs) {

		function lookDatasource (arr, dsName) {
		    for (var i=0; i<arr.length; i++) {
			var ds = arr[i];
			if (ds.datasource === dsName) {
			    return {
				"count": ds.evidence_count,
				"score": ds.association_score
			    };
			}
		    }
		    return {
			"count": 0,
			"score": 0
		    };
		}

		var url = api.url.associations({
		    gene: attrs.target
		})
		console.log("URL: " + url);
		api.call(url)
		    .then(function (resp) {
			resp = JSON.parse(resp.text);
			// update general information in parent scope
			scope.$parent.nresults = resp.total;
			scope.$parent.$apply();

			////// Bubbles View
			// viewport Size
			var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
			var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

			// Element Coord
			var elemOffsetTop = elem[0].parentNode.offsetTop;

			// BottomMargin
			var bottomMargin = 50;

			var diameter = viewportH - elemOffsetTop - bottomMargin;
			processData(resp.data);
			var bView = bubblesView()
			    .data(bubblesView.node(resp.data))
			    .value("association_score")
			    .key("efo_code")
			    .label("label")
			    .diameter(diameter);
			var ga = geneAssociations()
			    .target(attrs.target);
			
			// Flower for the tooltips
			// Only one flower is passed, so this means that only one tooltip can be shown at a time
			var flower = flowerView()
			    .fontsize(6)
			    .diagonal(100);

			ga(bView, elem[0].querySelector(".cttvBubbles"), flower);


			/////// TABLE VIEW
			console.log("TABLES!");
			var nodeData = bubblesView.node(resp.data);
			var leaves = nodeData.get_all_leaves();

			var newData = new Array (leaves.length);
			for (var i=0; i<newData.length; i++) {
			    var data = leaves[i].data();
			    var therapeuticArea = leaves[i].parent().property("label");

			    var row = [];
			    // Disease name
			    var geneDiseaseLoc = "/app/#/gene-disease?t=" + attrs.target + "&d=" + data.efo_code;
			    row.push("<a href=" + geneDiseaseLoc + ">" + data.label + "</a>");
			    // Therapeutic area
			    row.push(therapeuticArea || "");
			    // Association score
			    row.push(data.association_score);
			    // Genetic associations
			    row.push(lookDatasource (data.datasources, "uniprot").score +
				     lookDatasource (data.datasources, "gwas").score +
				     lookDatasource (data.datasources, "cancer_gene_census").score);
			    // Somatic mutations
			    row.push(lookDatasource (data.datasources, "eva").score);
			    // Known drugs
			    row.push(lookDatasource (data.datasources, "chembl").score);
			    row.push(lookDatasource (data.datasources, "expression_atlas").score);
			    row.push(lookDatasource (data.datasources, "reactome").score);
			    row.push(lookDatasource (data.datasources, "phenodigm").score);

			    newData[i] = row;
			}

			var table = document.createElement("table");
			table.className = "table table-stripped table-bordered";
			elem[0].querySelector(".cttvTable").appendChild(table);
			$(table).dataTable({
			    "data": newData,
			    "columns": [
				{ "title": "Disease" },
				{ "title": "Therapeutic Area" },
				{ "title": "Association score" },
				{ "title": "Genetic Associations" },
				{ "title": "Somatic Mutations" },
				{ "title": "Known Drugs" },
				{ "title": "RNA Expression" },
				{ "title": "Disrupted Pathways" },
				{ "title": "Mouse Data" }
			    ],
			    "order" : [[2, "desc"]],
			    "autoWidth": false,
			    "lengthChange": false,
			    "paging": true,
			    "searching": true,
			    "bInfo" : false,
			    "ordering": true
			} );
		    });

		scope.$watch(function () { return attrs.display }, function (newVal, oldVal) {
		    switch (newVal) {
		    case "bubbles" :
			elem[0].querySelector(".cttvTable").style.display = "none";
			elem[0].querySelector(".cttvBubbles").style.display = "block";
			break;
		    case "table" :
			elem[0].querySelector(".cttvBubbles").style.display = "none";
			elem[0].querySelector(".cttvTable").style.display = "block";
			break;
		    }
		});
	    }
	}
    })

    .directive('cttvDiseaseAssociations', function () {
	function lookDatasource (arr, dsName) {
	    for (var i=0; i<arr.length; i++) {
		var ds = arr[i];
		if (ds.datasource === dsName) {
		    return {
			"count": ds.evidence_count,
			"score": ds.association_score
		    };
		}
	    }
	    return {
		"count": 0,
		"score": 0
	    };
	}
	return {
	    restrict: 'EA',
	    scope: {},
	    link: function (scope, elem, attrs) {
		var api = cttvApi();
		var url = api.url.associations({
		    efo: attrs.target
		});
		console.log("URL: " + url);
		api.call(url)
		    .then(function (resp) {
			resp = JSON.parse(resp.text);
			console.log(resp);
			scope.$parent.nresults = resp.total;
			scope.$parent.$apply();

			console.log("DISEASE => GENE DATA:");
			var data = resp.data;
			console.log(data);
			var newData = new Array(data.length);
			//var flowers = new Array(data.length);
			var flowers = {};

			for (var i=0; i<data.length; i++) {
			    var row = [];
			    var geneLoc = "";
			    var geneDiseaseLoc = "/app/#/gene-disease?t=" + data[i].gene_id + "&d=" + attrs.target;
			    row.push("<a href=" + geneDiseaseLoc + ">" + data[i].label + "</a>");
			    // The ensembl id
			    row.push(data[i].gene_id);
			    // The association score
			    row.push(data[i].association_score);
			    // Genetic Association
			    row.push(lookDatasource(data[i].datasources, "uniprot").score +
				     lookDatasource(data[i].datasources, "gwas").score +
				     lookDatasource(data[i].datasources, "cancer_gene_census").score);
			    // Somatic Mutations
			    row.push(lookDatasource(data[i].datasources, "eva").score);
			    // Known Drugs
			    row.push(lookDatasource(data[i].datasources, "chembl").score);
			    // RNA expression
			    row.push(lookDatasource(data[i].datasources, "expression_atlas").score);
			    // Disrupted pathways
			    row.push(lookDatasource(data[i].datasources, "reactome").score);
			    // Mouse data
			    row.push(lookDatasource(data[i].datasources, "phenodigm").score);

			    // We will insert the flower here
			    row.push("");

			    var flowerData = [
			    	{"value":lookDatasource(data[i].datasources, "expression_atlas").score,  "label":"RNA"},
			    	{"value":lookDatasource(data[i].datasources, "uniprot").score +
				 lookDatasource(data[i].datasources, "gwas").score +
				 lookDatasource(data[i].datasources, "cancer_gene_census").score,  "label":"Genetics"},
			    	{"value":lookDatasource(data[i].datasources, "eva").score,  "label":"Somatic"},
			    	{"value":lookDatasource(data[i].datasources, "chembl").score,  "label":"Drugs"},
			    	{"value":lookDatasource(data[i].datasources, "reactome").score,  "label":"Pathways"},
			    	{"value":lookDatasource(data[i].datasources, "phenodigm").score,  "label":"Mouse"}
			    ];

			    var flower = flowerView()
			    	.values(flowerData)
				.fontsize(6)
			    	.diagonal(100);
			    
			    newData[i] = row;
			    flowers[data[i].gene_id] = flower;
			}
			
			$("#disease-association-table").dataTable({
			    "data" : newData,
			    "columns": [
				{ "title": "Gene" },
				{ "title": "Ensembl ID"},				    
			        { "title": "Association Score" },
			        { "title": "Genetic Association" },
			        { "title": "Somatic Mutations" },
			        { "title": "Known Drugs" },
			        { "title": "RNA Expression" },
			        { "title": "Disrupted Pathways" },
				{ "title": "Mouse Data" },
				{ "title": "Evidence breakdown", "orderable" : false }
			    ],
			    "fnCreatedRow" : function (row, data, dataIndex) {
				var div = document.createElement("div");
				$(row).children("td:last-child").append(div);
				flowers[data[1]](div);
			    },
			    "order" : [[2, "desc"]],
			    "autoWidth": false,
			    "lengthChange": false,
			    "paging": true,
			    "searching": true,
			    "bInfo": false,
			    "ordering": true
			});
		    });
	    }
	};
    })


    .directive('pmcCitationList', function () {
	var pmc = require ('biojs-vis-pmccitation');
    	return {
    	    restrict: 'EA',
    	    templateUrl: "partials/pmcCitation.html",
    	    link: function (scope, elem, attrs) {
		scope.$watch(function () { return attrs.pmids}, function (newPMIDs) {
		    var pmids = newPMIDs.split(",");
		    console.log("PMIDS TO LOOK FOR...");
		    console.log(pmids);
		    if (pmids[0]) {
			console.log("PMIDS OK..." + pmids.length);
			var terms = [];
			for (var i=0; i<pmids.length; i++) {
			    terms.push("EXT_ID:" + pmids[i]);
			}
			var query = terms.join(" OR ");
    			var config = {
    			    width: 400,
    			    loadingStatusImage: "",
    			    source: pmc.Citation.MED_SOURCE,
			    query: query,
    			    target: 'pmcCitation',
    			    displayStyle: pmc.CitationList.FULL_STYLE,
    			    elementOrder: pmc.CitationList.TITLE_FIRST
    			};
    			var instance = new pmc.CitationList(config);
    			instance.load();
		    }		    
		});
    	    }
    	};
    })

    // .directive('pmcCitationList', function () {
    // 	var app = require("biojs-vis-pmccitation");
    // 	function displayCitation (pmid, divId) {
    // 	    console.log(pmid + " - " + divId);
    // 	    var instance = new app.Citation({
    // 		target: divId,
    // 		source: app.Citation.MED_SOURCE,
    // 		citation_id: pmid,
    // 		width: 400,
    // 		proxyUrl: 'https://cors-anywhere.herokuapp.com/',
    // 		displayStyle: app.Citation.FULL_STYLE,
    // 		elementOrder: app.Citation.TITLE_FIRST,
    // 		showAbstract: false
    // 	    });
    // 	    instance.load();
    // 	}
    // 	return {
    // 	    restrict: 'EA',
    // 	    // scope: {
    // 	    // 	pmids : '='
    // 	    // },
    // 	    templateUrl: "partials/pmcCitation.html",
    // 	    link: function (scope, elem, attrs) {
    // 		console.log(attrs.pmids);
    // 		var pmids = attrs.pmids.split(",");
    // 		for (var i=0; i<pmids.length; i++) {
    // 		    var pmid = pmids[i];
    // 		    var newDiv = document.createElement("div");
    // 		    newDiv.id = elem[0].id + "_" + i;
    // 		    elem[0].appendChild(newDiv);
    // 		    displayCitation(pmid, newDiv.id);
    // 		}
    // 	    }
    // 	};
    // })

    .directive('pmcCitation', function () {
	return {
	    restrict: 'EA',
	    templateUrl: "partials/pmcCitation.html",
	    link: function (scope, elem, attrs) {
		var pmc = require ('biojs-vis-pmccitation');
		var config = {
		    source: pmc.Citation.MED_SOURCE,
		    citation_id: attrs.pmcid,
		    width: 400,
		    proxyUrl: 'https://cors-anywhere.herokuapp.com/',
		    displayStyle: pmc.Citation.FULL_STYLE,
		    elementOrder: pmc.Citation.TITLE_FIRST,
		    target : 'pmcCitation',
		    showAbstract : false
		};
		var instance = new pmc.Citation(config);
		instance.load();
	    }
	};
    })

    .directive('ebiExpressionAtlasBaselineSummary', function () {
	return {
	    restrict: 'EA',
	    templateUrl: "partials/expressionAtlas.html",
	    link: function (scope, elem, attrs) {
		var instance = new Biojs.ExpressionAtlasBaselineSummary ({
		    geneQuery : attrs.target,
		    proxyUrl : "",
		    rootContext : "http://www.ebi.ac.uk/gxa",
		    geneSetMatch : false,
		    target : "expressionAtlas"
		})
	    },
	}
    })


    .directive('cttvSearchSuggestions', function(){
    	return {
        	restrict:'EA',
        	templateUrl: 'partials/search-suggestions.html',
        	link: function(scope, elem, attrs){

        	}
        }	
    })


    /**
     * Flower graph
     */
    .directive('cttvGeneDiseaseAssociation', function(){
    	return {
    		restrict:'EA',
    		//transclude: 'true',
    		scope: {
    			associationData: '='
    		},
        	link: function(scope, elem, attrs){
        		console.log("link()");
        		console.log(scope);
        		//var flower = flowerView().values(scope.associationData);
        		//flower(elem[0]);

        		scope.render = function(data){
        			console.log("render()");
        			console.log(data);
        			if(data.length>0){
        			    var flower = flowerView()
					.values(data)
					.diagonal(200)
        			    flower(elem[0]);
        			}
        		}

    			// Watch for data changes
	            scope.$watch(
	            	'associationData', 
	            	function() {
	            		scope.render(scope.associationData);
	            		console.log("Watchout radioactive man!!");
	            	}//,
	            	//true
	            );
        	}
    	}
    })
/*
angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);
  */
