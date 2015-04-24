    'use strict';

    /* Controllers */

    angular.module('cttvControllers', []).






    /**
     * High level controller for the app
     */
    controller('CttvAppCtrl', ['$scope',  function ($scope) {
        
    }])



    /**
     * DiseaseCtrl
     * Controller for the disease page
     * It loads general information about a given disease
     */
    .controller ('DiseaseCtrl', ["$scope", "$location", "$log", "cttvAPIservice", function ($scope, $location, $log, cttvAPIservice) {
	$log.log("DiseaseCtrl()");
	// var cttvRestApi = cttvApi();
	var efo_code = $location.url().split("/")[2];
	// var url = cttvRestApi.url.disease({'efo' : efo_code});
	// $log.log(url);
	// cttvRestApi.call(url)
	cttvAPIservice.getDisease({
	    'efo': efo_code
	})
	    .then (function (resp) {
		resp = JSON.parse(resp.text);
        //$log.log(resp);
		//resp.path_labels.shift(); // remove cttv_disease
		//resp.path_codes.shift(); // remove cttv_disease
        
		var paths = [];
		for (var i=0; i<resp.path.length; i++) {
            resp.path[i].shift();
            var path=[];
            for(var j=0; j<resp.path[i].length; j++){
                path.push({
                    "label" : resp.path[i][j].label,
                    "efo" : resp.path[i][j].uri.split("/").pop()
                });
            }
            paths.push(path);
		}

        $log.warn(resp.path);
        $log.warn(paths);

		if (resp.efo_synonyms.length === 0) {
		    resp.efo_synonyms.push(resp.label);
		}
		$scope.disease = {
		    "label" : resp.label,
		    "efo" : efo_code,
		    "description" : resp.definition || resp.label,
		    "synonyms" : _.uniq(resp.efo_synonyms),
		    "paths" : paths
		};

		// Update bindings
		//$scope.$apply();
	    })
    }])

/**
 * TargetCtrl
 * Controller for the target page
 * It loads information about a given target
 */
    .controller ("TargetCtrl", ["$scope", "$location", "$log", "cttvAPIservice", function ($scope, $location, $log, cttvAPIservice) {
	$log.log('TargetCtrl()');
	// var cttvRestApi = cttvApi();
	var geneId = $location.url().split("/")[2];
	// var url = cttvRestApi.url.gene({'gene_id' : geneId});
	// $log.log(url);
	// cttvRestApi.call(url)
	cttvAPIservice.getGene({
	    "gene_id": geneId
	})
	    .then(function (resp) {
		resp = JSON.parse(resp.text);
		$scope.target = {
		    label : resp.approved_name || resp.ensembl_external_name,
		    symbol : resp.approved_symbol || resp.ensembl_external_name, //resp.approved_symbol || resp.approved_name || resp.ensembl_external_name,
		    id : resp.approved_id || resp.ensembl_gene_id,
		    description : resp.uniprot_function[0],
            name : resp.approved_name || resp.ensembl_description
		};

		// Synonyms
		var syns = {};
		var synonyms = resp.symbol_synonyms;
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
		var name_synonyms = resp.name_synonyms;
		if (name_synonyms !== undefined) {
		    for (var j=0; j<name_synonyms.length; j++) {
			syns[name_synonyms[j]] = 1;
		    }
		}
		$log.log(synonyms);
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
		// $scope.$apply();
	    });
    }]).

    /**
     * SearchAppCtrl
     * Controller for the search/results page
     */
    controller('SearchAppCtrl', ['$scope', '$location', '$log', 'cttvAppToAPIService', 'cttvAPIservice', function ($scope, $location, $log, cttvAppToAPIService, cttvAPIservice) {
        
        $log.log('SearchCtrl()');

        
        $scope.search = cttvAppToAPIService.createSearchInitObject();
        $scope.filters = {
            gene : {
                total : 0,
                selected: false,
                loading: false
            },
            efo : {
                total : 0,
                selected : false,
                loading: false
            }
        }

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

        var getFiltersData = function(){

            $scope.filters.gene.loading = true;
            cttvAPIservice.getSearch({
                    q: $scope.search.query.q,
                    size : 1,
                    filter : 'gene'
                }).
                then(
                    function(resp) {
                        $scope.filters.gene.total = resp.body.total;
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    $scope.filters.gene.loading = false;
                });

            $scope.filters.efo.loading = true;
            cttvAPIservice.getSearch({
                    q: $scope.search.query.q,
                    size : 1,
                    filter : 'efo'
                }).
                then(
                    function(resp) {
                        $scope.filters.efo.total = resp.body.total;
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    $scope.filters.efo.loading = false;
                });

        }



        $scope.getResults = function(){

            /*
            if( !$scope.filters.gene.selected && !$scope.filters.efo.selected ){
                // show no result if no filter is selected
                $log.warn("no filter selcted");
                $scope.search.results = null;
                return;
            }
            */
            
            // before getting new results,
            // we make sure we clear any current results (like in the case
            // of applying a filter), which also causes the spinner to show...
            $scope.search.results = {}; 
            
            
            var queryobject = cttvAppToAPIService.getApiQueryObject(cttvAppToAPIService.SEARCH, $scope.search.query);
            // if one and only one of the filters is selected, apply the corresponding filter
            // cool way of mimicking a XOR operator ;)
            if( $scope.filters.gene.selected != $scope.filters.efo.selected ){
                queryobject.filter = $scope.filters.gene.selected ? 'gene' : 'efo';
            }
            

            
            cttvAPIservice.getSearch( queryobject )
                .then(
                    function(resp) {
                        //$log.info(resp);
                        $scope.search.results = resp.body;
                        //$log.log($scope.search);
                    },
                    cttvAPIservice.defaultErrorHandler
                );

        }


        if($location.search().q){
            // parse parameters
            $scope.search.query.q = $location.search().q || "";

            // need a way of parsing filters too...

            // and fire the search
            $scope.getResults();
            getFiltersData();
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



