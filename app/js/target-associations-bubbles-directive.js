'use strict';

/* Directives */
angular.module('cttvDirectives')

    .directive('cttvNavRecompile', function($compile, $parse) {
	return {
	    scope: true, // required to be able to clear watchers safely
	    compile: function(el) {
		var template = getElementAsHtml(el);
		return function link(scope, $el, attrs) {
		    var stopWatching = scope.$parent.$watch(attrs.kcdRecompile, function(_new, _old) {
			var useBoolean = attrs.hasOwnProperty('useBoolean');
			if ((useBoolean && (!_new || _new === 'false')) || (!useBoolean && (!_new || _new === _old))) {
			    return;
			}
			// reset kcdRecompile to false if we're using a boolean
			if (useBoolean) {
			    $parse(attrs.kcdRecompile).assign(scope.$parent, false);
			}
			
			// recompile
			var newEl = $compile(template)(scope.$parent);
			$el.replaceWith(newEl);
			
			// Destroy old scope, reassign new scope
			stopWatching();
			scope.$destroy();
		    });
		};
	    }
	};

	function getElementAsHtml(el) {
	    return angular.element('<a></a>').append(el.clone()).html();
	}
    })
    
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
				var data = resp.body.data;
				scope.$parent.nresults = resp.body.total;
				ga.datatypes(dts);
				ga.update(resp.body.data);
			    })
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

		    // var api = cttvApi()
		    // 	.prefix("/api/latest/");

		    // var url = api.url.associations({
		    // 	gene: attrs.target,
		    // 	datastructure: "tree"
		    // })
		    // $log.log("BUBBLES URL: " + url);

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

			    updateView (data);

			    //scope.$parent.$apply();
			    ga(bView, fView, elem[0]);
			});
		});
	    }
	}
    }]);
