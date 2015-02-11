'use strict';

/* Directives */
angular.module('cttvDirectives', [])

    .directive('cttvTargetAssociations', function () {
	// var bView = bubblesView();
	// processData aggregates evidence by EFO id
	// TODO: This function may change once we have a final version of the API. In the meantime, counts are processed here
	function processData (data) {
	    var d = {};
	    var labels = {};
	    for (var i=0; i<data.length; i++) {
		console.log(data[i]);
		//var label = data[i]["biological_object.about"];
		var label = data[i].biological_object.efo_info[0][0].label;
		var efo = data[i].biological_object.efo_info[0][0].efo_id;
		if (d[label] === undefined) {
		    d[label] = 1;
		    labels[label] = efo;
		} else {
		    d[label]++;
		}
	    }

	    var o = {"key": "Root", children: []};
	    for (var j in d) {
	    	o.children.push ( {"key":j, "efo": labels[j], "values":d[j]} );
	    }
	    console.log("PROCESSED:");
	    console.log(o);

	    return o;
	    //return d;
	}

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
	
	return {
	    restrict: 'EA',
	    scope: {},
	    link: function (scope, elem, attrs) {
		var api = cttvApi();
		var url = api.url.filterby({
		    gene:attrs.target,
		    //datastructure:"simple",
		    size:1000
		});
		console.log("URL: " + url);
		api.call(url, function (status, resp) {
		    scope.$parent.took = resp.took;
		    scope.$parent.nresults = resp.size;
		    scope.$parent.$apply();
		    console.log("RESP:");
		    console.log(resp);
		    // viewport Size
		    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
		    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

		    // Element Coord
		    var elemOffsetTop = elem[0].parentNode.offsetTop;

		    // BottomMargin
		    var bottomMargin = 50;

		    var diameter = viewportH - elemOffsetTop - bottomMargin;
		    
		    var bView = bubblesView()
			.data(bubblesView.node(processData(resp.data)))
			.value("values")
			.key("key")
			.diameter(diameter)
		    var ga = geneAssociations();
		    ga(bView, elem[0]);
		});		
	    }
	}
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
        				var flower = flowerView().values(data);
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
