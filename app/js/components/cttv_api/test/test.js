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
	    describe ("evidenceAll", function () {
		it("exists", function () {
		    assert.isDefined(cttvApiUrl.evidenceAll);
		});
		it ("returns the correct url for genes", function () {
		    var evidenceUrl = cttvApiUrl.evidenceAll({gene : data.gene});
		    assert.strictEqual(evidenceUrl, "http://193.62.52.228/api/latest/evidences?gene=ENSG00000157764");
		});
		it ("returns the correct url mixed values", function () {
		    var evidenceUrl = cttvApiUrl.evidenceAll({gene:data.gene, efo:data.efo, datastructure:"simple"});
		    assert.strictEqual(evidenceUrl, "http://193.62.52.228/api/latest/evidences?efo=EFO_0000621&gene=ENSG00000157764&datastructure=simple");
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
	    it ("retrieves data from the server", function (done) {
		var url = myCttvApi.url.evidenceAll({gene:data.gene, size:10});
		myCttvApi.call(url, function (status, resp) {
		    assert.isDefined(resp);
		    assert.isObject(resp);
		    assert.isNumber(status);
		    assert.equal(status, 200);
		    done();
		})
	    });
	});

    });
});
