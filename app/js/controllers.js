    'use strict';

    /* Controllers */

    angular.module('cttvControllers', ['cttvServices']).






    /**
     * High level controller for the app
     */
    controller('CttvAppCtrl', ['$scope',  function ($scope) {
        
    }]). 



    /**
       * GeneDiseaseCtrl
       * Controller for the Gene <-> Disease page
       * It loads the evidence for the given target <-> disease pair
    */
    controller('GeneDiseaseCtrl', ['$scope', '$location', '$log', 'cttvAPIservice', function ($scope, $location, $log, cttvAPIservice) {
        $log.log('GeneDiseaseCtrl()');

        $scope.search = {
            // target : $location.search().t,
            // disease : $location.search().d,
            info : {
                data : {},
                efo_path : []
            },
            genetic_associations : {},
            rna_expression:[],
            test:[],
            categories:[]   // use this for sections of the accordion and flower petals
        };


        $scope.getInfo = function(){
            console.log("getInfo for "+$scope.search.target + " & " + $scope.search.disease);

            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease, //"http://identifiers.org/efo/"+$scope.search.disease.substring(4),
                    size:1
                } ).
                success(function(data, status) {
                    $scope.search.info.data = data.data[0];
                    console.log("info on association:");
                    console.log(data.data[0]);  
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }



        // TODO:
        // make the proper call to the API
        $scope.getEvidence = function(){
            /*
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:"http://identifiers.org/efo/"+$scope.search.disease.substring(4)
                } ).
                success(function(data, status) {
                    $scope.search.genetic_associations = data.data;
                    console.log(data);
                }).
                error(function(data, status) {
                    $log.error(status);
                });
            */
        }



        // TODO:
        // make the proper call, process the info and store it to the correct var (not 'test')
        // which means this will return the promise object which wraps the setting of test...
        $scope.getFlowerData = function(){
            console.log("getFlowerData()");
            $scope.search.test = [
                {"value":9,  "label":"RNA"},
                {"value":6,  "label":"Genetics"},
                {"value":2,  "label":"Somatic"},
                {"value":4,  "label":"Drugs"},
                {"value":7,  "label":"Pathways"},
                {"value":5,  "label":"Mouse data"}
            ];
        }



        $scope.getRnaExpressionData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1000
                } ).
                success(function(data, status) {
                    $scope.search.rna_expression = data.data;
                    initTableRNA();
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }



        var initTableDrugs = function(){

            // Drug overview
            $('#drugs-table-1').dataTable( {
                "data": [[
                            "Marketed drug", 
                            "Small molecule", 
                            "Adrenergic receptor alpha-1 antagonist<br><span class='badge'>8</span> Publications", 
                            "Drug negative modulator", 
                            "C CARDIOVASCULAR SYSTEM, C01 CARDIAC THERAPY, C02 ANTIHYPERTENSIVES"
                        ]],
                "columns": [
                    { "title": "Phase" },
                    { "title": "Type" },
                    { "title": "Mechanism of action" },
                    { "title": "Activity" },
                    { "title": "ATC Classes" }
                ],
                "autoWidth": false,
                "lengthChange": false,
                "paging": false,
                "searching": false,
                "bInfo" : false,
                "ordering": false
            } ); 


            // Target overview 
            $('#drugs-table-2').dataTable( {
                "data": [[
                            "Adrenergic receptor alpha-1", 
                            "Heteropolymeric protein complex", 
                            "ADRA1B, ADRA1D, ADRA1A"
                        ]],
                "columns": [
                    { "title": "Target name" },
                    { "title": "Target context" },
                    { "title": "Protein complex members" }
                ],
                "autoWidth": false,
                "lengthChange": false,
                "paging": false,
                "searching": false,
                "bInfo" : false,
                "ordering": false
            } ); 
        }



        $scope.getDrugData = function(){
            initTableDrugs();
        }

        /*
         * Takes the data object returned by the API and formats it to an array of arrays 
         * to be displayed by the RNA-expression dataTable widget.
         */
        var formatRnaDataToArray = function(data){
            var newdata = new Array(data.length);
            console.log(data[0]);
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];
                    // comparison
                    row.push(data[i].evidence.experiment_specific.comparison_name);
                    // activity
                    row.push(data[i].biological_subject.properties.activity.split("/").pop().split("_").join(" "));
                    // Tissue
                    //row.push(data[i].biological_object.properties.biosamples.join(", ")); // is an array
                    // fold change
                    row.push(data[i].evidence.experiment_specific.log2_fold_change);
                    // p-value
                    row.push(data[i].evidence.association_score.pvalue.value);
                    // provenance
                    //row.push(data[i].evidence.urls.linkouts.reduce(function(p,c,a,i){return p.nice_name+", "+c.nice_name}));
                    row.push("<a href='"+data[i].evidence.urls.linkouts[1].url+"' target='blank'>Gene expression details <i class='fa fa-external-link'></i></a>");
                    // experiment overview
                    row.push("<a href='"+data[i].evidence.urls.linkouts[0].url+"' target='blank'>Experiment overview and raw data <i class='fa fa-external-link'></i></a>");
                    // publications
                    // row.push(data[i].evidence.date_asserted);
                    row.push("Estrogen receptor prevents p53-dependent apoptosis in breast cancer. Bailey ST, Shin H, Westerling T, Liu XS, Brown M. , Europe PMC 23077249"); // mock publications info

                newdata[i] = row;
            }

            return newdata;
        }



        var initTableRNA = function(){

            $('#rna-expression-table').dataTable( {
                "data": formatRnaDataToArray($scope.search.rna_expression), //[["non-small cell lung cancer", "decreased transcript level", "lung", "-1.07", "1.08e-17", "GPR65 expression details", "Transription profiling by array of human non-small cell lng cancer tissue", "bla bla bla"]],
                "columns": [
                    { "title": "Comparison" },
                    { "title": "Activity" },
                    //{ "title": "Tissue" },
                    { "title": "log2 fold change" },
                    { "title": "p-value" },
                    { "title": "Provenance" },
                    { "title": "Experiment overview" },
                    { "title": "Publications" }
                ],
                "ordering" : true,
                "autoWidth": false
            } ); 
        }

        if($location.search().t && $location.search().d){
            // parse parameters
            $scope.search.target = $location.search().t;
            $scope.search.disease = $location.search().d;

            $scope.$watch("search.info.data", function(newValue, oldValue) {
                //if ($scope.name.length > 0) {
                //    $scope.greeting = "Greetings " + $scope.name;
                //}
                console.log("newValue");
                console.log(oldValue);
                console.log(newValue);
                if($scope.search.info.data.biological_object){
                    if($scope.search.info.data.biological_object.efo_info[0][0].path){
                        $scope.search.info.efo_path = $scope.search.info.data.biological_object.efo_info[0][0].path;
                    }
                }
            });

            // will need a way of parsing filters too...
            // $scope.parseFilters() ...

            // and fire the info search
            $scope.getInfo();

            // get the data for the flower graph
            $scope.getFlowerData();

            // then try get some data
            $scope.getRnaExpressionData();
            setTimeout($scope.getDrugData, 1000);
            // populate the tables
            // RNA-expression table
            //$('#rna-expression-table').ready(initTableRNA);
            //setTimeout(initTableRNA, 1000); //I confess, this is a dirty hack to wait for the DOM... temporary though :)

        }

    }])

/**
 * DiseaseCtrl
 * Controller for the disease page
 * It loads general information about a given disease
 */
    .controller ('DiseaseCtrl', ["$scope", "$location", "$log", function ($scope, $location, $log) {
	$log.log("DiseaseCtrl()");
	var cttvRestApi = cttvApi();
	var efo_code = $location.url().split("/")[2];
	var url = cttvRestApi.url.disease({'efo' : efo_code});
	console.log(url);
	cttvRestApi.call(url)
	    .then (function (resp) {
		resp = JSON.parse(resp.text);
		resp.path_labels.shift(); // remove cttv_disease
		resp.path_codes.shift(); // remove cttv_disease
		var path = [];
		for (var i=0; i<resp.path_labels.length; i++) {
		    path.push({
			"label" : resp.path_labels[i],
			"efo" : resp.path_codes[i]
		    });
		}
		$scope.disease = {
		    "label" : resp.label,
		    "efo" : efo_code,
		    "description" : resp.definition,
		    "synonyms" : _.uniq(resp.efo_synonyms),
		    "path" : path
		};

		// Update bindings
		$scope.$apply();
	    })
    }])

/**
 * TargetCtrl
 * Controller for the target page
 * It loads information about a given target
 */
    .controller ("TargetCtrl", ["$scope", "$location", "$log", function ($scope, $location, $log) {
	$log.log('TargetCtrl()');
	var cttvRestApi = cttvApi();
	var geneId = $location.url().split("/")[2];
	var url = cttvRestApi.url.gene({'gene_id' : geneId});
	console.log(url);

	cttvRestApi.call(url)
	    .then(function (resp) {
		resp = JSON.parse(resp.text);
		$scope.target = {
		    label : resp.approved_name || resp.ensembl_external_name,
		    id : resp.approved_id || resp.ensembl_gene_id,
		    description : resp.uniprot_function[0]
		};

		// Synonyms
		var syns = {};
		var synonyms = resp.synonyms;
		if (synonyms !== undefined) {
		    for (var i=0; i<synonyms.length; i++) {
			syns[synonyms[i]] = 1;
		    }
		}
		var prev_symbols = resp.previous_symbols;
		if (prev_symbols !== undefined) {
		    for (var j=0; j<prev_symbols.length; j++) {
			syns[prev_symbols[j]] = 1;
		    }
		}
		console.log(synonyms);
		$scope.synonyms = _.keys(syns);

		// Uniprot
		$scope.uniprot = {
		    id : resp.uniprot_id,
		    subunits : resp.uniprot_subunit,
		    locations : resp.uniprot_subcellular_location,
		    accessions : resp.uniprot_accessions,
		    keywords : resp.uniprot_keywords
		}

		// Ensembl
		var isHuman = resp.ensembl_gene_id.substring(0,4) === "ENSG";
		$scope.ensembl = {
		    id : resp.ensembl_gene_id,
		    description : resp.ensembl_description,
		    isHuman : isHuman,
		    chr : resp.chromosome,
		    start : resp.gene_start,
		    end : resp.gene_end
		};
		
		// GO terms
		var goterms = _.filter(resp.dbxrefs, function (t) {return t.match(/^GO:/)});
		var cleanGoterms = _.map(goterms, function (t) {return t.substring(3, t.length)});
		var uniqGoterms = _.uniq(cleanGoterms);
		$scope.goterms = uniqGoterms;

		// Expression Atlas
		$scope.toggleBaselineExpression = function () {
		    $scope.eaTarget = resp.ensembl_gene_id;
		};
		$scope.toggleGenomeLocation = function () {
		    $scope.chr = resp.chromosome,
		    $scope.genomeBrowserGene = resp.ensembl_gene_id;
		}

		// Bibliography
		var bibliography = _.filter(resp.dbxrefs, function (t) {return t.match(/^PubMed/)});
		var cleanBibliography = _.map(bibliography, function (t) {return t.substring(7, t.length)});
		var bibliographyStr = cleanBibliography.join (",");
		$scope.pmids = bibliographyStr;
		$scope.pmidsLinks = (_.map(cleanBibliography,function (p) {return "EXT_ID:" + p})).join(" OR ");

		// Update the bindings
		$scope.$apply();
	    });
    }]).

    /**
     * AssociationsCtrl
     * Controller for the target associations page
     * It loads a list of associations for the given search
     */
    // controller('AssociationsCtrl', ['$scope', '$location', '$log', 'cttvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cttvAppToAPIService, cttvAPIservice) {
    controller ("AssociationsCtrl", ['$scope', '$location', '$log', function ($scope, $location, $log) {
        $log.log('AssociationsCtrl()');
        $scope.search = {
    	    query : $location.search().q,
    	    label : $location.search().label
        };
        $scope.nresults = 0;
        // $scope.search = cttvAppToAPIService.createSearchInitObject();

	// Display toggle (bubbles / table)
	$scope.displaytype = "bubbles";
	$scope.setDisplay = function (displ) {
	    $scope.displaytype = displ;
	}
    }]).

    /**
     * SearchAppCtrl
     * Controller for the search/results page
     */
    controller('SearchAppCtrl', ['$scope', '$location', '$log', 'cttvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cttvAppToAPIService, cttvAPIservice) {
        
        $log.log('SearchCtrl()');

        
        $scope.search = cttvAppToAPIService.createSearchInitObject();

        /**
        Something like:
            {
                query:{
                    q: APP_QUERY_Q, // ""
                    page: APP_QUERY_PAGE,   // 1
                    size: APP_QUERY_SIZE    // 10
                },

                results:{}
            }
        */

        $scope.test=function(){
            console.log("test");
        }

        $scope.getResults = function(){
	    console.log("SEARCH URL: ");
	    console.log(cttvAppToAPIService.getApiQueryObject(cttvAppToAPIService.SEARCH, $scope.search.query));
            return cttvAPIservice.getSearch( cttvAppToAPIService.getApiQueryObject(cttvAppToAPIService.SEARCH, $scope.search.query) ).
                success(function(data, status) {
                    $scope.search.results = data;
                }).
                error(function(data, status) {
                    $log.error(status);
                });
        }


        if($location.search().q){
            // parse parameters
            $scope.search.query.q = $location.search().q || "";

            // need a way of parsing filters too...

            // and fire the search
            $scope.getResults();
        }


    }]).



    controller('SearchResultsCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
        
    }]).


    controller('MastheadCtrl', ['$scope', '$location', '$log', function ($scope, $location, $log) {
        
        $log.log('MastheadCtrl()');
        $scope.location = $location;

    }]).

    controller('D3TestCtrl', ['$scope', '$log', function ($scope, $log) {
        $log.log("D3TestCtrl");
    }])



