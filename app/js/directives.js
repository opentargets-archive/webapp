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

		// function lookDatasource (arr, dsName) {
		    // for (var i=0; i<arr.length; i++) {
		    // 	var ds = arr[i];
		    // 	if (ds.datasource === dsName) {
		    // 	    return {
		    // 		"count": ds.evidence_count,
		    // 		"score": ds.association_score
		    // 	    };
		    // 	}
		    // }
		    // return {
		    // 	"count": 0,
		    // 	"score": 0
		    // };
		// }

		var url = api.url.associations({
		    gene: attrs.target,
		    datastructure : "tree"
		})
		console.log("URL: " + url);
		api.call(url)
		    .then(function (resp) {
			resp = JSON.parse(resp.text);
			// update general information in parent scope
			scope.$parent.nresults = resp.total;
			scope.$parent.$apply(); // <- Is there any other $apply in the $parent below??

			// Filter
			// Therapeutic areas accordion
			var nodeData = bubblesView.node(resp.data);
			var taNodes = nodeData.children();
			var therapeuticAreas = _.map(taNodes, function (node) {
			    var d = node.data();
			    var name = d.label;
			    if (d.label.length > 20) {
				name = d.label.substring(0, 18) + "...";
			    }
			    var leaves = bubblesView.node(d).get_all_leaves();
			    var diseases = _.map(leaves, function (n) {
				var d = n.data();
				return {
				    "name" : d.label,
				    "efo"  : d.efo_code,
				    "score" :d.association_score
				};
			    });
			    var diseasesSorted = _.sortBy(diseases, function (d) {
				return -d.score;
			    });
			    return {
				"name": name,
				"score": diseases.length,
				"efo": d.efo_code,
				"diseases" : diseasesSorted
			    };
			});
			var therapeuticAreasSorted = _.sortBy(therapeuticAreas, function (a) {
			    return -a.score;
			});
			scope.$parent.therapeuticAreas = therapeuticAreasSorted;
			// scope.$parent.selectRoot = function () {
			//     bView.focus(nodeData);
			//     bView.select(nodeData);
			// };
			scope.$parent.selectTherapeuticArea = function (efo) {
			    var taNode = nodeData.find_node(function (node) {
				return node.property("efo_code") === efo;
			    });
			    if (taNode.property("focused") === true) {
				taNode.property("focused", undefined);
				bView.focus(nodeData);
			    } else {
				taNode.property("focused", true);
				bView.focus(taNode);
			    }
			    bView.select(nodeData);
			};
			scope.$parent.selectDisease = function (efo) {
			    // var nodes = nodeData.find_all(function (node) {
			    // 	return node.property("efo_code") === efo;
			    // });
			    // var lca;
			    // if (nodes.length > 1) {
			    // 	lca = tree.lca(nodes);
			    // } else {
			    // 	lca = nodes[0].parent();
			    // }
			    var node = nodeData.find_node(function (n) {
				return n.property("efo_code") === efo;
			    });
			    // bView.focus(lca);
			    if (node.property("selected") === true) {
				node.property("selected", undefined);
				bView.select(nodeData);
			    } else {
				console.log("SEL");
				//console.log(node.data());
				node.property("selected", true);
				bView.select([node]);
				console.log(node.data());
			    }
			};
			

			// Update the parent scope (needed in the directive)
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
			var leaves = nodeData.get_all_leaves();

			var newData = new Array (leaves.length);
			var flowers = {};
			for (var i=0; i<newData.length; i++) {
			    var data = leaves[i].data();
			    var datatypes = {};
			    datatypes.genetic_association = _.result(_.find(data.datatypes, function (d) { return d.datatype === "genetic_association" }), "association_score")||0;
			    datatypes.somatic_mutation = _.result(_.find(data.datatypes, function (d) { return d.datatype === "somatic_mutation" }), "association_score")||0;
			    datatypes.known_drug = _.result(_.find(data.datatypes, function (d) { return d.datatype === "known_drug" }), "association_score")||0;
			    datatypes.rna_expression = _.result(_.find(data.datatypes, function (d) { return d.datatype === "rna_expression" }), "association_score")||0;
			    datatypes.affected_pathway = _.result(_.find(data.datatypes, function (d) { return d.datatype === "affected_pathway" }), "association_score")||0;
			    datatypes.animal_model = _.result(_.find(data.datatypes, function (d) { return d.datatype === "animal_model" }), "association_score")||0;
			    var therapeuticArea = leaves[i].parent().property("label");

			    var row = [];
			    // Disease name
			    var geneDiseaseLoc = "/app/#/gene-disease?t=" + attrs.target + "&d=" + data.efo_code;
			    row.push("<a href=" + geneDiseaseLoc + ">" + data.label + "</a>");
			    // EFO (hidden)
			    row.push(data.efo_code);
			    // Therapeutic area
			    row.push(therapeuticArea || "");
			    // Association score
			    row.push(data.association_score);
			    // Genetic associations
			    //row.push(lookDatasource (data.datatypes, "genetic_association"));
			    row.push(datatypes.genetic_association);
			    // Somatic mutations
			    //row.push(lookDatasource (data.datatypes, "somatic_mutation"));
			    row.push(datatypes.somatic_mutation);

			    // Known drugs
			    //row.push(lookDatasource (data.datatypes, "known_drug"));
			    row.push(datatypes.known_drug);
			    // Expression atlas
			    //row.push(lookDatasource (data.datatypes, "rna_expression"));
			    row.push(datatypes.rna_expression);
			    // Reactome / Affected Pathways
			    //row.push(lookDatasource (data.datatypes, "affected_pathway"));
			    row.push(datatypes.affected_pathway);
			    // Animal models
			    //row.push(lookDatasource (data.datatypes, "animal_model"));
			    row.push(datatypes.animal_model);
			    // flower placeholder
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
			    
			    newData[i] = row;
			}
			
			var table = document.createElement("table");
			table.className = "table table-stripped table-bordered";
			elem[0].querySelector(".cttvTable").appendChild(table);
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

		scope.$watch(function () { return attrs.display }, function (newVal, oldVal) {
		    switch (newVal) {
		    case "bubbles" :
			elem[0].querySelector(".cttvTable").style.display = "none";
			elem[0].querySelector(".cttvBubbles").style.display = "block";
			document.querySelector(".cttv-facet").style.display = "block";
			break;
		    case "table" :
			elem[0].querySelector(".cttvBubbles").style.display = "none";
			elem[0].querySelector(".cttvTable").style.display = "block";
			document.querySelector(".cttv-facet").style.display = "none";
			break;
		    }
		});
	    }
	}
    })

    .directive('cttvDiseaseAssociations', function () {
	// function lookDatasource (arr, dsName) {
	//     for (var i=0; i<arr.length; i++) {
	// 	var ds = arr[i];
	// 	if (ds.datasource === dsName) {
	// 	    return {
	// 		"count": ds.evidence_count,
	// 		"score": ds.association_score
	// 	    };
	// 	}
	//     }
	//     return {
	// 	"count": 0,
	// 	"score": 0
	//     };
	// }
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

			var data = resp.data;
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
			    var geneDiseaseLoc = "/app/#/gene-disease?t=" + data[i].gene_id + "&d=" + attrs.target;
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
    	    restrict: 'EA',
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
			getBaseUrl: "http://www.ebi.ac.uk/gxa",
			params:'geneQuery=' + target,
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
