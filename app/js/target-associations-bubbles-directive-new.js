/* Bubbles directive for associations */
angular.module('cttvDirectives')

    .directive('cttvTargetAssociationsBubbles', ['$log', 'cttvAPIservice', 'cttvUtils', 'cttvConsts', function ($log, cttvAPIservice, cttvUtils, cttvConsts) {
        'use strict';

        var whoiam = "bubbles";
        var bottomMargin = 220;
        var bView;

        return {
            restrict: 'E',
            require: '?^resize',
            scope: {
                facets : '=',
                target : '@',
                active : '@'
            },

            template: '<cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
            +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend>',


            link: function (scope, elem, attrs, resizeCtrl) {
                var bubblesContainer = elem.children().eq(0).children().eq(0)[0];

                var bView;
                var nav;

                // Change of dims
                scope.$watch(function () {if (resizeCtrl) {return resizeCtrl.dims();}}, function (val) {
                    if (bView) {
                        bView.diameter(val.height - bottomMargin);
                    }
                }, true);

                // Change of target or facets
                scope.$watchGroup(["target", "facets", "active"], function (vals) {
                    var target = vals[0];
                    var facets = vals[1];
                    var act = vals[2];

                    if (scope.active !== whoiam) {
                        return;
                    }
                    var opts = {
                        target: target,
                        outputstructure: "flat",
                        size: 1000,
                        direct: true,
                        facets: false
                    };
                    opts = cttvAPIservice.addFacetsOptions(facets, opts);

                    if (bView) {
                        bView.therapeuticAreas(opts.therapeutic_area);
                        bView.update(cttvAPIservice.getAssociations(opts));
                    } else {
                        setView();
                        bView.data(cttvAPIservice.getAssociations(opts));
                        bView.therapeuticAreas(opts.therapeutic_area);
                        bView(bubblesContainer);
                    }
                });
                // scope.$watch("target", function (val) {
                //     console.log("    TARGET UPDATED!!");
        		//     setView();
        		// });

                // scope.$watch("facets", function (fct) {
                //     console.log("    FACETS UPDATED!");
                //     console.log(fct);
                //     var opts = {
                //         target: attrs.target,
                //         outputstructure: "flat",
                //         size: 1000,
                //         direct: true,
                //         facets: false
                //     };
                //     opts = cttvAPIservice.addFacetsOptions(fct, opts);
                //     if (bView) {
                //         bView.update(cttvAPIservice.getAssociations(opts));
                //     } else {
                //         setView();
                //     }
                // });

                function setView (data) { // data is a promise
                    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
                    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                    // Element Coord
        		    var elemOffsetTop = elem[0].parentNode.offsetTop;

                    var diameter = viewportH - elemOffsetTop - bottomMargin;

                    var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

                    bView = targetAssociations()
                        // .target("ENSG00000157764")
                        .target(scope.target)
                        .diameter(diameter)
                        .linkPrefix("")
                        .showAll(true)
                        .colors(cttvUtils.colorScales.BLUE_0_1.range())
                        // .colors(['#e7e1ef', '#dd1c77'])
                        .useFullPath(cttvUtils.browser.name !== "IE")
                        .tooltipsOnTA(true)
                        .showMenu(false);


                    // Setting up legend
                    scope.legendText = "Score";
                    scope.colors = [];
                    for(var i=0; i<=100; i+=25){
                        var j=i/100;
                        //scope.labs.push(j);
                        scope.colors.push( {color:colorScale(j), label:j} );
                    }
                    scope.legendData = [
                        //{label:"Therapeutic Area", class:"no-data"}
                    ];

                }
            }
        };
    }]);
