'use strict';

/* Directives */
angular.module('cttvDirectives', [])

    .directive('cttvTargetAssociationsTable', function () {
	return {
	    restrict: 'E',
	    scope: {},
	    link: function (scope, elem, attrs) {
		scope.$watch(function () { return attrs.target }, function (val) {
		    var api = cttvApi();
		    var tableUrl = api.url.associations({
			gene: attrs.target,
			datastructure: "flat"
		    });
		    api.call(tableUrl)
			.then(function (resp) {
			    resp = JSON.parse(resp.text);
			    console.log("RESP FOR TABLES (IN DIRECTIVE): ");
			    console.log(resp);
			    var newData = [];
			    var flowers = {};
			    for (var i=0; i<resp.data.length; i++) {
				var data = resp.data[i];
				if (data.efo_code === "cttv_disease") {
				    continue;
				}
				var datatypes = {};
				datatypes.genetic_association = _.result(_.find(data.datatypes, function (d) { return d.datatype === "genetic_association" }), "association_score")||0;
				datatypes.somatic_mutation = _.result(_.find(data.datatypes, function (d) { return d.datatype === "somatic_mutation" }), "association_score")||0;
				datatypes.known_drug = _.result(_.find(data.datatypes, function (d) { return d.datatype === "known_drug" }), "association_score")||0;
				datatypes.rna_expression = _.result(_.find(data.datatypes, function (d) { return d.datatype === "rna_expression" }), "association_score")||0;
				datatypes.affected_pathway = _.result(_.find(data.datatypes, function (d) { return d.datatype === "affected_pathway" }), "association_score")||0;
				datatypes.animal_model = _.result(_.find(data.datatypes, function (d) { return d.datatype === "animal_model" }), "association_score")||0;
				var row = [];
				// Disease name
				var geneDiseaseLoc = "#/gene-disease?t=" + attrs.target + "&d=" + data.efo_code;
				row.push("<a href=" + geneDiseaseLoc + ">" + data.label + "</a>");
				// EFO (hidden)
				row.push(data.efo_code);
				// Therapeutic area
				row.push(data.therapeutic_area || "");
				// Association score
				row.push(data.association_score);
				// Genetic association
				row.push(datatypes.genetic_association);
				// Somatic mutation
				row.push(datatypes.somatic_mutation);
				// Known drug
				row.push(datatypes.known_drug);
				// Expression atlas
				row.push(datatypes.rna_expression);
				// Affected pathway
				row.push(datatypes.affected_pathway);
				// Animal model
				row.push(datatypes.animal_model);
				// flower (placeholder)
				row.push("");
				var flowerData = [
				    {"value":datatypes.genetic_association,  "label":"Genetics"},
				    {"value":datatypes.somatic_mutation,  "label":"Somatic"},
				    {"value":datatypes.known_drug,  "label":"Drugs"},
				    {"value":datatypes.rna_expression,  "label":"RNA"},
				    {"value":datatypes.affected_pathway,  "label":"Pathways"},
				    {"value":datatypes.animal_model,  "label":"Models"}
				];
				var flower = flowerView()
			            .values(flowerData)
			            .fontsize(6)
			            .diagonal(100);
				flowers[data.efo_code] = flower;
				newData.push(row);
			    }
			    var table = document.createElement("table");
			    table.className = "table table-stripped table-bordered";
			    elem[0].appendChild(table);
			    $(table).dataTable({
				"data": newData,
				"columns": [
				    { "title": "Disease" },
				    { "title": "EFO"},
				    { "title": "Therapeutic area" },
				    { "title": "Association score" },
				    { "title": "Genetic associations" },
				    { "title": "Somatic mutations" },
				    { "title": "Known drugs" },
				    { "title": "RNA expression" },
				    { "title": "Affected pathways" },
				    { "title": "Animal models" },
				    { "title": "Association score breakdown", "orderable" : false }
				],
				"columnDefs" : [
				    {
					"targets" : [1],
					"visible" : false
				    }
				],
				"fnCreatedRow" : function (row, data, dataIndex) {
				    var div = document.createElement("div");
				    $(row).children("td:last-child").append(div);
				    flowers[data[1]](div);
				},
				"order" : [[3, "desc"]],
				"autoWidth": false,
				"lengthChange": false,
				"paging": true,
				"searching": true,
				"bInfo" : false,
				"ordering": true
			    });
			});
		});
	    }
	}
    })

    .directive('cttvTargetAssociationsBubbles', function () {
	return {
	    restrict: 'E',
	    scope: {
		"onFocus": '&onFocus',
		"onLoad": '&onLoad'
	    },
	    link: function (scope, elem, attrs) {
		// event receiver on focus
		addEventListener('bubblesViewFocus', function (e) {
		    // TODO: This is effectively clicking in the nav bar
		    $("#cttv_targetAssociations_navBar_" + attrs.focus).click();
		}, true);
		var ga;
		scope.$watch(function () { return attrs.focus }, function (val) {
		    if (val === "None") {
			return;
		    }

		    if (ga) {
			ga.selectTherapeuticArea(val);
		    }
		});
		scope.$watch(function () {return attrs.target}, function (val) {
		    ////// Bubbles View
		    // viewport Size
		    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
		    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

		    // Element Coord
		    var elemOffsetTop = elem[0].parentNode.offsetTop;

		    // BottomMargin
		    var bottomMargin = 50;

		    var diameter = viewportH - elemOffsetTop - bottomMargin;

		    var api = cttvApi();
		    var url = api.url.associations({
		    	gene: attrs.target,
		    	datastructure: "tree"
		    })
		    console.log("BUBBLES URL: " + url);
		    api.call (url)
		    	.then (function (resp) {
			    scope.$parent.nresults=resp.body.total;
		    	    var data = resp.body.data;

			    var bView = bubblesView().breadcrumsClick(function (d) {
				    var focusEvent = new CustomEvent("bubblesViewFocus", {
				        "detail" : d
				    });
				    this.dispatchEvent(focusEvent);
			    });

			    var fView = flowerView()
				.fontsize(6)
				.diagonal(100);
			    
			    ga = geneAssociations()
				.data(data)
				.target(attrs.target)
				.diameter(diameter);
			    // Sort the data based on number of children and association score of disease
			    var dataSorted = _.sortBy(data.children, function (d) {
				return d.children ? -d.children.length : 0;
			    });

			    for (var i=0; i<data.children.length; i++) {
				data.children[i].children = _.sortBy (data.children[i].children, function (d) {
				    return -d.association_score;
				});
			    }
			    scope.$parent.therapeuticAreas = dataSorted;
			    ga(bView, fView, elem[0]);
			    scope.$parent.$apply();
			});
		});
	    }		    
	}
    })
    .directive('cttvTargetAssociationsTree', function () {
	return {
	    restrict: 'E',
	    scope: {},
	    link: function (scope, elem, attrs) {
		scope.$watch(function () {return attrs.target}, function (val) {
		    ////// Tree view
		    // viewport Size
		    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
		    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

		    // Element Coord
		    var elemOffsetTop = elem[0].parentNode.offsetTop;

		    // BottomMargin
		    var bottomMargin = 50;

		    var diameter = viewportH - elemOffsetTop - bottomMargin;
		    console.log("DIAMETER FOR TREE: " + diameter);

		    var api = cttvApi();
		    var url = api.url.associations({
			gene: attrs.target,
			datastructure: "tree"
		    })
		    console.log("TREE URL: " + url);
		    api.call(url)
			.then (function (resp) {
			    var data = resp.body.data;
			    var fView = flowerView()
				.fontsize(6)
				.diagonal(100);

			    var gat = geneAssociationsTree()
				.data(data)
				.diameter(900)
				.target(attrs.target);
			    gat(fView, elem[0]);
			});

		});
	    }
	}
    })

    .directive('cttvDiseaseAssociations', function () {
	return {
	    restrict: 'E',
	    scope: {},
	    link: function (scope, elem, attrs) {
		var api = cttvApi();
		var url = api.url.associations({
		    efo: attrs.target
		});
		api.call(url)
		    .then(function (resp) {
			scope.$parent.nresults = resp.body.total;
			scope.$parent.$apply();

			var data = resp.body.data;
			var newData = new Array(data.length);
			//var flowers = new Array(data.length);
			var flowers = {};

			for (var i=0; i<data.length; i++) {
			    var datatypes = {};
			    datatypes.genetic_association = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "genetic_association" }), "association_score")||0;
			    datatypes.somatic_mutation = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "somatic_mutation" }), "association_score")||0;
			    datatypes.known_drug = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "known_drug" }), "association_score")||0;
			    datatypes.rna_expression = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "rna_expression" }), "association_score")||0;
			    datatypes.affected_pathway = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "affected_pathway" }), "association_score")||0;
			    datatypes.animal_model = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "animal_model" }), "association_score")||0;
			    var row = [];
			    var geneLoc = "";
			    var geneDiseaseLoc = "#/gene-disease?t=" + data[i].gene_id + "&d=" + attrs.target;
			    row.push("<a href=" + geneDiseaseLoc + ">" + data[i].label + "</a>");
			    // Ensembl ID
			    row.push(data[i].gene_id);
			    // The association score
			    row.push(data[i].association_score);
			    // Genetic Association
			    row.push(datatypes.genetic_association);
			    // Somatic Mutations
			    row.push(datatypes.somatic_mutation);
			    // Known Drugs
			    row.push(datatypes.known_drug);
			    // RNA expression
			    row.push(datatypes.rna_expression);
			    // Affected pathways
			    row.push(datatypes.affected_pathway);
			    // Animal models
			    row.push(datatypes.animal_model);
			    
			    // We will insert the flower here
			    row.push("");

			    var flowerData = [
			    	{"value":datatypes.genetic_association,  "label":"Genetics"},
			    	{"value":datatypes.somatic_mutation,  "label":"Somatic"},
			    	{"value":datatypes.known_drug,  "label":"Drugs"},
			    	{"value":datatypes.rna_expression,  "label":"RNA"},
			    	{"value":datatypes.affected_pathway,  "label":"Pathways"},
			    	{"value":datatypes.animal_model,  "label":"Models"}
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
			        { "title": "Association score" },
			        { "title": "Genetic association" },
			        { "title": "Somatic mutations" },
			        { "title": "Known drugs" },
			        { "title": "RNA expression" },
			        { "title": "Affected pathways" },
				{ "title": "Animal models" },
				{ "title": "Association score breakdown", "orderable" : false }
			    ],
			    "columnDefs" : [
			    	{
			    	    "targets" : [1],
			    	    "visible" : false
			    	}
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
    	    restrict: 'E',
    	    templateUrl: "partials/pmcCitation.html",
    	    link: function (scope, elem, attrs) {
		scope.$watch(function () { return attrs.pmids}, function (newPMIDs) {
		    var pmids = newPMIDs.split(",");
		    if (pmids[0]) {
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
	    restrict: 'E',
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

    .directive('cttvTargetGenomeBrowser', function () {
	return {
	    restrict: 'E',
	    link: function (scope, elem, attrs) {
		var w = elem[0].parentNode.offsetWidth - 40;
		scope.$watch(function () {return attrs.target }, function (target) {
		    if (target === "") {
			return;
		    }
		    var newDiv = document.createElement("div");
		    newDiv.id = "cttvTargetGenomeBrowser";
		    elem[0].appendChild(newDiv);

		    var gB = tnt.board.genome()
			.species("human")
			.gene(attrs.target)
			.context(20)
			.width(w);
		    var theme = targetGenomeBrowser({
			"tnt.tooltip" : tnt.tooltip
		    })
			.chr(scope.chr);
		    theme(gB, document.getElementById("cttvTargetGenomeBrowser"), cttvApi());
		});
	    }
	};
    })

    .directive('ebiExpressionAtlasBaselineSummary', function () {
	return {
	    restrict: 'E',
	    link: function (scope, elem, attrs) {
		scope.$watch(function () { return attrs.target }, function (target) {
		    if (target === "") {
			return;
		    }
		    var newDiv = document.createElement("div");
		    newDiv.id = "cttvExpressionAtlas";
		    newDiv.className = "accordionCell";
		    elem[0].appendChild(newDiv);

		    var instance = new Biojs.AtlasHeatmap ({
			params:'geneQuery=' + target + "&species=homo%20sapiens",
			isMultiExperiment: false,
			target : "cttvExpressionAtlas"
		    })
		});
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
        		//var flower = flowerView().values(scope.associationData);
        		//flower(elem[0]);

        		scope.render = function(data){
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
