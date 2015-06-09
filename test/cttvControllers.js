describe ("Ctrls: cttvControllers", function () {
    "use strict";
    beforeEach (module('cttvControllers'));

    describe ('SearchAppCtrl', function () {
	var scope;
	var ctrl;
	beforeEach (inject(function ($rootScope, $controller) {
	    scope = $rootScope.$new();
	    ctrl = function () {
		return $controller('SearchAppCtrl', {'$scope' : scope});
	    }
	}));
	// it ('creates the search object', function () {
	//     var search = scope.search;
	//     assert.isDefined(search);
	//     assert.isObject(search);
	//     // query
	//     assert.isDefined(search.query);
	//     assert.isObject(search.query);
	//     // results
	//     assert.isDefined(search.results);
	//     assert.isObject(search.results);
	//     assert.equal(Object.keys(search.results).length, 0);
	// });
	// it ('has the getResults method', function () {
	//     var getResults = scope.getResults;
	//     assert.isDefined(getResults);
	//     assert.isFunction(getResults);
	// })
    });
});
