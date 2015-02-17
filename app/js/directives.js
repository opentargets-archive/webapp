'use strict';

/* Directives */
angular.module('cttvDirectives', [])

    .directive('cttvTargetAssociations', function () {
	// var bView = bubblesView();
	// processData aggregates evidence by EFO id
	// TODO: This function may change once we have a final version of the API. In the meantime, counts are processed here
	// function processData (data) {
	//     var d = {};
	//     var labels = {};
	//     for (var i=0; i<data.length; i++) {
	// 	// console.log(data[i]);
	// 	//var label = data[i]["biological_object.about"];
	// 	var label = data[i].biological_object.efo_info[0][0].label;
	// 	var efo = data[i].biological_object.efo_info[0][0].efo_id;
	// 	if (d[label] === undefined) {
	// 	    d[label] = 1;
	// 	    labels[label] = efo;
	// 	} else {
	// 	    d[label]++;
	// 	}
	//     }

	//     var o = {"key": "Root", children: []};
	//     for (var j in d) {
	//     	o.children.push ( {"key":j, "efo": labels[j], "values":d[j]} );
	//     }
	//     return o;
	//     //return d;
	// }

	// function processData (full_data) {
	//     var nested = d3.nest()
	//     //.key(function(d) { return d["biological_object.about"]; })
	// 	.key(function (d) {
	// 	    console.log(d.biological_object.efo_info[0][0].label);
	// 	    return d.biological_object.efo_info[0][0].label;
	// 	})
	//         .rollup(function(leaves) { return leaves.length; })
	//         .entries(full_data);
	//     var total = d3.sum(nested, function (d) {return d.values});
	//     console.log("NESTED:");
	//     console.log(nested);
	//     return {
	// 	"key": "Root",
	// 	"values": total,
	// 	"children": nested
	//     }
	// };

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
	    scope: {},
	    link: function (scope, elem, attrs) {
		// var url = api.url.filterby({
		//     gene:attrs.target,
		//     //datastructure:"simple",
		//     size:1000
		// });
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

			// Prepare the bubbles view
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
			    .diameter(diameter)
			var ga = geneAssociations()
			    .target(attrs.target);

			console.log(attrs.display);

			switch(attrs.display) {
			case "bubbles" :
			    ga(bView, elem[0]);
			    break;
			case "table" :
			    //$(
			    console.log("TABLES!");
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
			var flowers = new Array(data.length);

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

			    // Flower
			    var divId = "cttvGeneFlower" + data[i].gene_id;
			    row.push("<div id=" + divId + "></div>");
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
				.fontsize(5)
			    	.diagonal(100);
			    
			    newData[i] = row;
			    flowers[i] = {
				"id" : divId,
				"flower" : flower
			    };
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
				{ "title": "Evidence breakdown" }
			    ],
			    "autoWidth": false,
			    "lengthChange": false,
			    "paging": false,
			    "searching": false,
			    "bInfo": false,
			    "ordering": false
			});
			for (var j=0; j<flowers.length; j++) {
			    flowers[j].flower(document.getElementById(flowers[j].id));
			}
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
		var pmids = attrs.pmids.split(",");
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
