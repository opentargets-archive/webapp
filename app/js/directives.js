'use strict';

/* Directives */
angular.module('cttvDirectives', [])

    .directive('cttvTargetAssociationsTable', ['$log', 'cttvAPIservice', 'clearUnderscoresFilter', 'upperCaseFirstFilter', 'cttvUtils', function ($log, cttvAPIservice, clearUnderscores, upperCaseFirst, cttvUtils) {

		var hasDatatype = function (myDatatype, datatypes) {
		    for (var i=0; i<datatypes.length; i++) {
			var datatype = upperCaseFirst(clearUnderscores(datatypes[i]));
			if (datatype === myDatatype) {
			    return true;
			}
		    }
		    return false;
		}


		return {

		    restrict: 'E',

		    scope: {
			    	loadprogress : '=',
			    	filename = '@'
			},

	    	link: function (scope, elem, attrs) {

				var updateTable = function (table, datatypes) {

					scope.loadprogress = true;

				    var dts = JSON.parse(attrs.datatypes);
				    var opts = {
						gene: attrs.target,
						datastructure: "flat",
				    };
				    if (!_.isEmpty(dts)) {
						opts.filterbydatatype = _.keys(dts);
				    }

				    return cttvAPIservice.getAssociations (opts)
						.then(function (resp) {
						    //resp = JSON.parse(resp.text);
						    scope.loadprogress = false;
						    resp = resp.body;
						    $log.log("RESP FOR TABLES (IN DIRECTIVE): ");
						    $log.log(resp);
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
								var geneDiseaseLoc = "#/evidence/" + attrs.target + "/" + data.efo_code;
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
								var keysDatatypes = _.keys(dts);
								var flowerData = [
								    {"value":datatypes.genetic_association, "label":"Genetics", "active": hasDatatype("Genetic association", keysDatatypes)},
								    {"value":datatypes.somatic_mutation, "label":"Somatic", "active": hasDatatype("Somatic mutation", keysDatatypes)},
								    {"value":datatypes.known_drug, "label":"Drugs", "active": hasDatatype("Known drug", keysDatatypes)},
								    {"value":datatypes.rna_expression, "label":"RNA", "active": hasDatatype("Rna expression", keysDatatypes)},
								    {"value":datatypes.affected_pathway, "label":"Pathways", "active": hasDatatype("Affected pathway", keysDatatypes)},
								    {"value":datatypes.animal_model, "label":"Models", "active": hasDatatype("Animal model", keysDatatypes)}
								];
								// console.log(flowerData);
								var flower = flowerView()
							            .values(flowerData)
							            .fontsize(6)
							            .diagonal(100);
								flowers[data.efo_code] = flower;
								newData.push(row);
						    }

						    dtable = $(table).DataTable( cttvUtils.setTableToolsParams({
								"data": newData,
								"columns": [
								    { "title": "Disease" },
								    { "title": "EFO"},
								    { "title": "Therapeutic area" },
								    { "title": "Association score" },
								    { "title": "Genetic association" },
								    { "title": "Somatic mutation" },
								    { "title": "Known drug" },
								    { "title": "Rna expression" },
								    { "title": "Affected pathway" },
								    { "title": "Animal model" },
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
								//"lengthChange": false,
								//"paging": true,
								//"searching": true,
								//"bInfo" : false,
								"ordering": true
						    }, scope.filename ));

					});

				};

				var table = document.createElement("table");
				var dtable; // defined when called DataTable
				table.className = "table table-stripped table-bordered";
				var firstRendered = false;

				// TODO: This is firing a second time the table creation. Make sure only one table is created at a time
				scope.$watch(function () { return attrs.datatypes }, function (dts) {
				    // The table has not rendered first yet
				    if (!firstRendered) {
					return;
				    }
				    dts = JSON.parse(dts);

				    elem[0].innerHTML = "";
				    var table = document.createElement("table");
				    table.className = "table table-stripped table-bordered";
				    elem[0].appendChild(table);

				    updateTable(table, dts)
					.then(function () {
					    dtable.columns().eq(0).each (function (i) {
						var column = dtable.column(i);
						if (i>3 && i<10) { // first headers are "Disease", "EFO", "Therapeutic area", "Association score" and last one is "Association score breakdown"
						    if (hasDatatype(column.header().innerText, _.keys(dts))) {
							column.visible(true);
						    } else {
						    	column.visible(false);
						    }
						}
					    });
					});

				    // Hide the columns that are filtered out
				});

				scope.$watch(function () { return attrs.target }, function (val) {
				    elem[0].appendChild(table);
				    updateTable(table, JSON.parse(attrs.datatypes))
					.then(function () {
					    // dtable.columns().eq(0).each (function (i) {
					    // 	var column = dtable.column(i);				
					    // });
					    firstRendered = true;
					});
				});

	    	} // end link
		}; // end return
    }])



    .directive('cttvTargetAssociationsTree', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
	var gat;
	return {
	    restrict: 'E',
	    scope: {},
	    link: function (scope, elem, attrs) {

		var datatypesChangesCounter = 0;
		scope.$watch(function () { return attrs.datatypes }, function (dts) {
		    dts = JSON.parse(dts);
		    if (datatypesChangesCounter>0) {
			if (!gat) {
			    setTreeView();
			    return;
			}
			var opts = {
			    gene: attrs.target,
			    datastructure: "tree",
			};
			if (!_.isEmpty(dts)) {
			    opts.filterbydatatype = _.keys(dts);
			}
			cttvAPIservice.getAssociations (opts)
			    .then (function (resp) {
				var data = resp.body.data;
				if (data) {
				    gat
					.data(data)
					.datatypes(dts)
					.update();
				}
			    });
		    }
		    datatypesChangesCounter++;
		});

		var setTreeView = function () {
		    ////// Tree view
		    // viewport Size
		    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
		    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

		    // Element Coord
		    var elemOffsetTop = elem[0].parentNode.offsetTop;

		    // BottomMargin
		    var bottomMargin = 50;

		    // TODO: This is not being used at the moment. We are fixing the size of the tree to 900px (see below)
		    var diameter = viewportH - elemOffsetTop - bottomMargin;
		    $log.log("DIAMETER FOR TREE: " + diameter);

		    var dts = JSON.parse(attrs.datatypes);
		    var opts = {
			gene: attrs.target,
			datastructure: "tree"
		    }
		    if (!_.isEmpty(dts)) {
			opts.filterbydatatype = _.keys(dts)
		    }
		    cttvAPIservice.getAssociations (opts)
			.then (function (resp) {
			    var data = resp.body.data;
			    if (_.isEmpty(data)) {
				return;
			    }
			    var fView = flowerView()
				.fontsize(9)
				.diagonal(100);

			    gat = geneAssociationsTree()
				.data(data)
				.datatypes(dts)
				.diameter(900)
				.target(attrs.target);
			    gat(fView, elem[0]);
			});
		};
		
		scope.$watch(function () { return attrs.target }, function (val) {
		    setTreeView();
		});
	    }
	}
    }])
	


	/**
	 * 
	 * Options for configuration are:
	 *   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
	 *   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
	 *
	 * Example:
	 *   <cttv-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></cttv-disease-associations>
	 *
	 *   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
	 *   This is useful in conjunction with a spinner where you can have ng-show="loading"
	 */
    .directive('cttvDiseaseAssociations', ['$log', 'cttvAPIservice', 'cttvUtils', function ($log, cttvAPIservice, cttvUtils) {
		return {
		    
		    restrict: 'E',
		    
		    scope: {
		    	loadprogress : '=',
		    	filename : '@'
		    },
		    
		    link: function (scope, elem, attrs) {
			
				// set the load progress flag to true before starting the API call
				scope.loadprogress = true;

				cttvAPIservice.getAssociations ({
				    efo: attrs.target
				})		
				    .then(function (resp) {
					
						// set hte load progress flag to false once we get the results
						scope.loadprogress = false;

						scope.$parent.nresults = resp.body.total;
						//scope.$parent.$apply();

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
						    var geneDiseaseLoc = "#/evidence/" + data[i].gene_id + "/" + attrs.target;
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
						
						$("#disease-association-table").dataTable(cttvUtils.setTableToolsParams({
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
						    //"lengthChange": false,
						    //"paging": true,
						    //"searching": true,
						    //"bInfo": false,
						    "ordering": true
						}, scope.filename ));

				    });
			} // end link
		}; // end return
    }])


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
    			    width: 800,
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

		    var api = cttvApi()
            .prefix("/api/latest/")
            .appname("cttv-web-app")
            .secret("2J23T20O31UyepRj7754pEA2osMOYfFK");
		    
		    var gB = tnt.board.genome()
			.species("human")
			.gene(attrs.target)
			.context(20)
			.width(w);
		    var theme = targetGenomeBrowser()
			.chr(scope.chr);
		    theme(gB, api, document.getElementById("cttvTargetGenomeBrowser"));
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
			gxaBaseUrl: 'https://www.ebi.ac.uk/gxa',
			params:'geneQuery=' + target + "&species=homo%20sapiens",
			isMultiExperiment: true,
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
        	replace: true,
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



    .directive('cttvProgressSpinner', function(){
    	return {
    		restrict: 'EA',
    		template: '<i class="fa fa-circle-o-notch fa-spin"></i>',
    		link: function(scope, elem, attrs){
    			
    			if(attrs.size){
    				elem.addClass("fa-"+attrs.size+"x");
    			}
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
