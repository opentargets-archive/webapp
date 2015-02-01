var assert = require("chai").assert;
var cttv_api = require("../index.js");

var data = {
    gene : "ENSG00000157764",
    geneName : "BRAF",
    efo : "EFO_0000621",
};

describe('CTTV api', function () {
    var myCttvApi = cttv_api();
    it ("retrieves a cttv api object", function () {
	assert.isDefined(myCttvApi);
    });
    describe ("API", function () {
	describe ("URL", function () {
	    var cttvApiUrl = myCttvApi.url;
	    it ("exists", function () {
		assert.isDefined (cttvApiUrl);
	    });
	    describe ("filterby", function () {
		it("exists", function () {
		    assert.isDefined(cttvApiUrl.filterby);
		});
		it ("returns the correct url for genes", function () {
		    var filterby = cttvApiUrl.filterby({gene : data.gene});
		    //assert.strictEqual(filterby, "http://193.62.52.228/api/latest/filterby?gene=ENSG00000157764");
		    assert.strictEqual(filterby, "http://cttv:75djkwty4805hye@127.0.0.1:8008/api/latest/filterby?gene=ENSG00000157764");
		});
		it ("returns the correct url mixed values", function () {
		    var filterbyUrl = cttvApiUrl.filterby({gene:data.gene, efo:data.efo, datastructure:"simple"});
		    //assert.strictEqual(filterbyUrl, "http://193.62.52.228/api/latest/filterby?efo=EFO_0000621&gene=ENSG00000157764&datastructure=simple");
		    assert.strictEqual(filterbyUrl, "http://cttv:75djkwty4805hye@127.0.0.1:8008/api/latest/filterby?efo=EFO_0000621&gene=ENSG00000157764&datastructure=simple");
		});
	    });
	});

	describe ("call", function () {
	    it ("exists", function () {
		assert.isDefined (myCttvApi.call);
	    });
	    it ("is a function", function () {
		assert.isFunction (myCttvApi.call);
	    });
	    it ("receives a response from the server", function (done) {
		var url = myCttvApi.url.filterby({gene:data.gene, size:10});
		myCttvApi.call(url, function (status, resp) {
		    assert.isDefined(resp);
		    assert.isObject(resp);
		    assert.isNumber(status);
		    assert.equal(status, 200);
		    done();
		})
	    });
	    it ("receives data from the server", function (done) {
		var url = myCttvApi.url.filterby({gene:data.gene, size:10});
		myCttvApi.call(url, function (status, resp) {
		    assert.isDefined(resp);
		    assert.isObject(resp);
		    assert.isDefined(resp.took);
		    assert.isDefined(resp.size);
		    assert.operator(resp.size, '<=', 10);
		    assert.isDefined(resp.data);
		    assert.isArray(resp.data);
		    done();
		});
	    });
	});

    });
});
