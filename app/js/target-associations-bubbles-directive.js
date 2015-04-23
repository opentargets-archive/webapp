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
		var datatypesChangesCounter = 0;
		
		// Data types changes
		scope.$watch(function () { return attrs.datatypes }, function (dts) {
		    var dts = JSON.parse(attrs.datatypes);
		    if (datatypesChangesCounter>0) {
			if (ga) {
			    cttvAPIservice.getAssociations ({
				gene: attrs.target,
				datastructure: "tree",
				filterbydatatype: _.keys(dts)
			    })
				.then (function (resp) {
				    var data = resp.body.data;
				    scope.$parent.nresults = resp.body.total || 0;
				    ga.datatypes(dts);
				    updateView(data);
				    if (data) {
					ga.update(data);
				    }
				})
			} else {
		    	    setView();
			}
		    }
		    datatypesChangesCounter++;
		});

		// Highlight changes
		scope.$watch(function () { return attrs.diseaseIsSelected }, function () {
		    if (ga && attrs.highlight) {
			var efo = JSON.parse(attrs.highlight);

			// Also put a flower in the nav bar -- TODO: Again, this is interacting with the navigation, which
			// makes it more difficult to reuse!
			var datatypes = {};
			datatypes.genetic_association = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "genetic_association" }), "association_score")||0;
			datatypes.somatic_mutation = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "somatic_mutation" }), "association_score")||0;
			datatypes.known_drug = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "known_drug" }), "association_score")||0;
			datatypes.rna_expression = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "rna_expression" }), "association_score")||0;
			datatypes.affected_pathway = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "affected_pathway" }), "association_score")||0;
			datatypes.animal_model = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "animal_model" }), "association_score")||0;
			var hasActiveDatatype = function (checkDatatype) {
			    var datatypes = JSON.parse(attrs.datatypes);
			    for (var datatype in datatypes) {
				if (datatype === checkDatatype) {
				    return true;
				}
			    }
			    return false;
			};
			var flowerData = [
			    {"value": datatypes.genetic_association, "label": "Genetics", "active": hasActiveDatatype("genetic_association")},
			    {"value":datatypes.somatic_mutation,  "label":"Somatic", "active": hasActiveDatatype("somatic_mutation")},
			    {"value":datatypes.known_drug,  "label":"Drugs", "active": hasActiveDatatype("known_drug")},
			    {"value":datatypes.rna_expression,  "label":"RNA", "active": hasActiveDatatype("rna_expression")},
			    {"value":datatypes.affected_pathway,  "label":"Pathways", "active": hasActiveDatatype("affected_pathway")},
			    {"value":datatypes.animal_model,  "label":"Models", "active": hasActiveDatatype("animal_model")}
			];
			var navFlower = flowerView()
			    .fontsize(9)
			    .diagonal(130)
			    .values(flowerData);

			// The parent_efo is needed to dis-ambiguate between same EFOs in different therapeuticAreas
			navFlower(document.getElementById("cttv_targetAssociations_flower_" + efo.efo + "_" + efo.parent_efo));

			// This is the link to the evidence page from the flower
			scope.$parent.targetDiseaseLink = "#/evidence/" + attrs.target + "/" + efo.efo;

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
		    if (data) {
			ga.data(data);
			scope.$parent.setTherapeuticAreas(ga.data().children || []);
		    } else {
			scope.$parent.setTherapeuticAreas([]);
		    }
		};

		function setView () {
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
			    if (_.isEmpty(data)) {
				return 
			    }
			    // Bubbles View
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

				updateView (data);

			    //scope.$parent.$apply();
			    ga(bView, fView, elem[0]);
			});

		};

		scope.$watch(function () {return attrs.target}, function (val) {
		    setView();
		});
	    }
	}
    }]);
