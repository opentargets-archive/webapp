'use strict';

/* Directives */
angular.module('cttvDirectives', [])

    .directive('cttvTargetAssociationsBubbles', function () {
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

		// Data types changes
		scope.$watch(function () { return attrs.datatypes }, function (dts) {
		    // if (ga) {
			var api = cttvApi();
			var url = api.url.associations({
			    gene: attrs.target,
			    datastructure: "tree"
			})
			api.call (url)
			    .then (function (resp) {
				var data = resp.body.data;
				scope.$parent.nresults = resp.body.total;
				ga.datatypes(JSON.parse(dts));
				ga.update(resp.body.data);
			    })
		    // }
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

		    // Sort the data based on number of children and association score of disease
		    var dataSorted = _.sortBy(data.children, function (d) {
			return d.children ? -d.children.length : 0;
		    });

		    for (var i=0; i<data.children.length; i++) {
			data.children[i].children = _.sortBy (data.children[i].children, function (d) {
			    return -d.association_score;
			});
		    }

		    // TODO: This may prevent from delivering directives as products!
		    scope.$parent.therapeuticAreas = dataSorted;

		    ga.data(data);
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

		    var api = cttvApi();
		    var url = api.url.associations({
		    	gene: attrs.target,
		    	datastructure: "tree"
		    })
		    console.log("BUBBLES URL: " + url);
		    api.call (url)
		    	.then (function (resp) {
			    var data = resp.body.data;
			    scope.$parent.nresults=resp.body.total;

			    var bView = bubblesView().breadcrumsClick(function (d) {
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
				.datatypes(JSON.parse(attrs.datatypes))

			    updateView (data);

			    scope.$parent.$apply();
			    ga(bView, fView, elem[0]);
			});
		});
	    }		    
	}
    })
