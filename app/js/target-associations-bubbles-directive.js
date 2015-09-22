
/* Directives */
angular.module('cttvDirectives')

    .directive('cttvTargetAssociationsBubbles', ['$log', 'cttvAPIservice', 'cttvUtils', "cttvConsts", function ($log, cttvAPIservice, cttvUtils, cttvConsts) {
        'use strict';
	return {
	    restrict: 'E',

	    scope: {
			"onFocus": '&onFocus',
			loadprogress : '=',
            facets : '='
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


        // scope.$watch('score', function(old, current){
        //     $log.log("score changed ");
        //     $log.log(current);
        // });



		// Data types changes
        /*
		scope.$watch(function () { return attrs.datatypes; }, function (dts) {

            dts = JSON.parse(attrs.datatypes);
            var opts = {
                target: attrs.target,
                datastructure: "tree",
                expandefo: true,
            };
            if (!_.isEmpty (dts)) {
                opts.filterbydatatype = _.keys(dts);
            }

            if (datatypesChangesCounter>0) {
                if (ga) {
                    cttvAPIservice.getAssociations (opts)
                        .then (function (resp) {
                            scope.$parent.updateFacets(resp.body.facets);
                            var data = resp.body.data;
                            if (_.isEmpty(data)) {
                                data.association_score = 0.01;
                            }
                            ga.datatypes(dts);
                            updateView(data);
                            ga.update(data);
                        },
                        cttvAPIservice.defaultErrorHandler
                    );
                } else {
                    setView();
                }
            }
            datatypesChangesCounter++;
		});
        */



        // try only watching for facet changes
        scope.$watch('facets', function (fct) {

            var opts = {
                target: attrs.target,
                datastructure: "tree",
                expandefo: true,
            };
            opts = cttvAPIservice.addFacetsOptions(fct, opts);


            if (datatypesChangesCounter>0) {
                if (ga) {
                    cttvAPIservice.getAssociations (opts)
                        .then (function (resp) {
                            $log.log("***");
                            $log.log(fct.datatypes);
                            $log.log(resp);
                            scope.$parent.updateFacets(resp.body.facets);
                            var data = resp.body.data;
                            if (_.isEmpty(data)) {
                                data.association_score = 0.01;
                            }
                            //ga.datatypes(fct.datatypes);
                            ga.datatypes( JSON.parse(attrs.datatypes) );
                            updateView(data);
                            ga.update(data);
                        },
                        cttvAPIservice.defaultErrorHandler
                    );
                } else {
                    setView();
                }
            }
            datatypesChangesCounter++;
        });





		// Highlight changes
		scope.$watch(function () { return attrs.diseaseIsSelected; }, function () {

		    if (ga && attrs.highlight) {
			var efo = JSON.parse(attrs.highlight);

			// Also put a flower in the nav bar -- TODO: Again, this is interacting with the navigation, which
			// makes it more difficult to reuse!
			var datatypes = {};
            for (var j=0; j<cttvConsts.datatypesOrder.length; j++) {
                var dkey = cttvConsts.datatypesOrder[j];
                datatypes[dkey] = _.result(_.find(efo.datatypes, function (d) {
                    return d.datatype === cttvConsts.datatypes[dkey];
                }), "association_score")||0;
            }
			// datatypes.GENETIC_ASSOCIATION = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "genetic_association"; }), "association_score")||0;
			// datatypes.SOMATIC_MUTATION = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "somatic_mutation"; }), "association_score")||0;
			// datatypes.KNOWN_DRUG = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "known_drug"; }), "association_score")||0;
			// datatypes.RNA_EXPRESSION = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
			// datatypes.AFFECTED_PATHWAY = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
			// datatypes.ANIMAL_MODEL = _.result(_.find(efo.datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;
            // datatypes.LITERATURE = _.result(_.find(efo.datatypes, function (d) { return d.literature === "literature"; }), "association_score")||0;
            var hasActiveDatatype = function (checkDatatype) {
                var datatypes = JSON.parse(attrs.datatypes);
                for (var datatype in datatypes) {
                    if (datatype === checkDatatype) {
                        return true;
                    }
                }
                return false;
            };

            var flowerData = [];
            for (var i=0; i<cttvConsts.datatypesOrder.length; i++) {
                var key = cttvConsts.datatypesOrder[i];
                flowerData.push({
                    "value": datatypes[key],
                    "label": cttvConsts.datatypesLabels[key],
                    "active": hasActiveDatatype(cttvConsts.datatypes[key])
                });
            }
			// var flowerData = [
			//     {"value":datatypes.genetic_association, "label": "Genetics", "active": hasActiveDatatype("genetic_association")},
			//     {"value":datatypes.somatic_mutation,  "label":"Somatic", "active": hasActiveDatatype("somatic_mutation")},
			//     {"value":datatypes.known_drug,  "label":"Drugs", "active": hasActiveDatatype("known_drug")},
			//     {"value":datatypes.rna_expression,  "label":"RNA", "active": hasActiveDatatype("rna_expression")},
			//     {"value":datatypes.affected_pathway,  "label":"Pathways", "active": hasActiveDatatype("affected_pathway")},
			//     {"value":datatypes.animal_model,  "label":"Models", "active": hasActiveDatatype("animal_model")},
            //     {"value":datatypes.literature, "label":"Literature", "active": hasActiveDatatype("literature")}
			// ];
            $log.log("FLOWER DATA:");
            $log.log(flowerData);
			var navFlower = flowerView()
			    .fontsize(9)
			    .diagonal(130)
			    .values(flowerData);

			// The parent_efo is needed to dis-ambiguate between same EFOs in different therapeuticAreas
			navFlower(document.getElementById("cttv_targetAssociations_flower_" + efo.efo + "_" + efo.parent_efo));

			// This is the link to the evidence page from the flower
			scope.$parent.targetDiseaseLink = "/evidence/" + attrs.target + "/" + efo.efo;

		    }
		});

		// Focus changes
		scope.$watch(function () { return attrs.focus; }, function (val) {
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
        }

		function setView () {
		    ////// Bubbles View
		    // viewport Size

		    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		    // Element Coord
		    var elemOffsetTop = elem[0].parentNode.offsetTop;

		    // BottomMargin
		    var bottomMargin = 270;

		    var diameter = viewportH - elemOffsetTop - bottomMargin;


		    var dts = JSON.parse(attrs.datatypes);
		    /*var opts = {
                target: attrs.target,
                datastructure: "tree",
                expandefo: true,
		    };
		    if (!_.isEmpty(dts)) {
                opts.filterbydatatype = _.keys(dts);
		    }
            */

            var opts = {
                target: attrs.target,
                datastructure: "tree",
                expandefo: true,
            };
            opts = cttvAPIservice.addFacetsOptions(scope.facets, opts);


		    cttvAPIservice.getAssociations (opts)
		    // api.call (url)
		    	.then (function (resp) {

                    $log.log(" -- set view stuff --");
                    $log.warn ("RESP FOR BUBBLES");
                    $log.warn(resp);

                    var data = resp.body.data;
                    if (_.isEmpty(data)) {
                        updateView ();
                        return;
                    }

    			    // Bubbles View
                    var bView = bubblesView()
                        .useFullPath(cttvUtils.browser.name !== "IE")
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
                        .names(cttvConsts);

                    updateView (data);

                    //scope.$parent.$apply();
                    ga(bView, fView, elem[0]);
                },
                cttvAPIservice.defaultErrorHandler
            );

		}

		scope.$watch(function () { return attrs.target; }, function (val) {
		    setView();
		});
	    }
	};
    }]);
