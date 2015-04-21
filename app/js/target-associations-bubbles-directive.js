'use strict';

/* Directives */
angular.module('cttvDirectives')

    .directive('cttvTargetAssociationsBubbles', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
	return {
	    restrict: 'E',
	    scope: {
		"onFocus": '&onFocus'
	    },
	    link: function (scope, elem, attrs) {
		// event receiver on focus
		addEventListener('bubblesViewFocus', function (e) {
		    // TODO: This is effectively clicking in the nav bar
		    // This prevents delivering the directive as stand-alone
		    $("#cttv_targetAssociations_navBar_" + attrs.focus).click();
		}, true);

		var ga;
		var nav;

		// Data types changes
		scope.$watch(function () { return attrs.datatypes }, function (dts) {
		    var dts = JSON.parse(attrs.datatypes);
		    if (ga) {
		    // var api = cttvApi();
		    // 	var url = api.url.associations({
		    // 	    gene: attrs.target,
		    // 	    datastructure: "tree"
		    // 	});
		    // 	api.call (url)
			cttvAPIservice.getAssociations ({
			    gene: attrs.target,
			    datastructure: "tree",
			    filterbydatatype: _.keys(dts)
			})
			    .then (function (resp) {
				//var data = resp.body.data;
				scope.$parent.nresults = resp.body.total;
				ga.datatypes(dts);
				updateView(resp.body.data || []);
				ga.update(resp.body.data);
			    })
		    }
		});

		// Highlight changes
		scope.$watch(function () { return attrs.diseaseIsSelected }, function () {
		    if (ga && attrs.highlight) {
			var efo = JSON.parse(attrs.highlight);

			console.log("HIGHLIGHTING EFO IN DIRECTIVE " + efo);
			ga.selectDisease(efo);

			// Also put a flower in the Directive -- TODO: Again, this is interacting with the navigation, which
			// makes it more difficult to reuse!
			var datatypes = {};
			datatypes.genetic_association = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "genetic_association" }), "association_score")||0;
			datatypes.somatic_mutation = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "somatic_mutation" }), "association_score")||0;
			datatypes.known_drug = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "known_drug" }), "association_score")||0;
			datatypes.rna_expression = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "rna_expression" }), "association_score")||0;
			datatypes.affected_pathway = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "affected_pathway" }), "association_score")||0;
			datatypes.animal_model = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "animal_model" }), "association_score")||0;
			var flowerData = [
			    {"value": datatypes.genetic_association, "label": "Genetics"},
			    {"value":datatypes.somatic_mutation,  "label":"Somatic"},
			    {"value":datatypes.known_drug,  "label":"Drugs"},
			    {"value":datatypes.rna_expression,  "label":"RNA"},
			    {"value":datatypes.affected_pathway,  "label":"Pathways"},
			    {"value":datatypes.animal_model,  "label":"Models"}
			];
			var navFlower = flowerView()
			    .fontsize(9)
			    .diagonal(130)
			    .values(flowerData);
			navFlower(document.getElementById("cttv_targetAssociations_flower_" + efo.efo));
			//$("#cttv_targetAssociations_flower_" + efo.efo).html("<p>I'm a flower<p>")
		    }
		});
		
		// Focus changes
		scope.$watch(function () { return attrs.focus }, function (val) {
		    if (val === "None") {
			return;
		    }

		    if (ga) {
			ga.selectTherapeuticArea(val);
		    }
		});

		function updateView (data) {
		    // TODO: This may prevent from delivering directives as products!
		    ga.data(data);
		    scope.$parent.therapeuticAreas = ga.data().children;
		};

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

		    var dts = JSON.parse(attrs.datatypes);
		    cttvAPIservice.getAssociations ({
			gene: attrs.target,
			datastructure: "tree",
			filterbydatatype: _.keys(dts)
		    })
		    // api.call (url)
		    	.then (function (resp) {
			    var data = resp.body.data;
			    scope.$parent.nresults=resp.body.total;

			    var bView = bubblesView()
				.maxVal(1)
				.breadcrumsClick(function (d) {
				    var focusEvent = new CustomEvent("bubblesViewFocus", {
					"detail" : d
				    });
				    this.dispatchEvent(focusEvent);
				});

			    var fView = flowerView()
				.fontsize (10)
				.diagonal (180);

			    // setup view
			    ga = geneAssociations()
				.target (attrs.target)
				.diameter (diameter)
				.datatypes(dts)
			    
			    updateView (data || []);

			    //scope.$parent.$apply();
			    ga(bView, fView, elem[0]);
			});
		});
	    }
	}
    }]);
