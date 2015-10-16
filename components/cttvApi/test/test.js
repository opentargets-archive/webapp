var assert = require("chai").assert;
var cttv_api = require("../index.js");

var data = {
    gene : "ENSG00000157764",
    geneName : "BRAF",
    efo : "EFO_0000621",
};

describe.skip('CTTV api', function () {
    var myCttvApi = cttv_api()
	.prefix ("http://127.0.0.1:8008/api/latest")
	.appname ("cttv-web-app")
	.secret ("2J23T20O31UyepRj7754pEA2osMOYfFK");
    it ("retrieves a cttv api object", function () {
	assert.isDefined(myCttvApi);
    });
    describe ("API", function () {
	describe ("URL", function () {
	    var cttvApiUrl = myCttvApi.url;
	    it ("exists", function () {
		assert.isDefined (cttvApiUrl);
	    });
	    describe ("requestToken", function () {
		it ("exists", function () {
		    assert.isDefined(cttvApiUrl.requestToken);
		});
		////// DON'T COMMIT AND PUSH THIS TEST!
		it ("retrieves a token", function (done) {
		    myCttvApi.prefix ("http://127.0.0.1:8008/api/latest/");
		    var url = myCttvApi.url.requestToken({
			appname: "cttv-web-app",
			secret: "2J23T20O31UyepRj7754pEA2osMOYfFK"
		    });
		    myCttvApi.call(url)
			.then (function (resp) {
			    assert.isDefined(resp);
			    assert.isObject(resp.body);
			    assert.isDefined(resp.body.token);
			})
		    done();
		})
	    });
	    describe ("search", function () {
		it ("exists", function () {
		    assert.isDefined (cttvApiUrl.search);
		});
		it ("retrieves search results for a gene", function (done) {
		    var url = cttvApiUrl.search({q: data.gene});
		    console.log(url);
		    myCttvApi.call(url)
			.then(function (resp) {
			    resp = JSON.parse(resp.text);
			    assert.isDefined(resp);
			    assert.isObject(resp);
			    assert.isDefined(resp.took);
			    assert.isDefined(resp.size);
			    assert.operator(resp.size, '<=', 10);
			    assert.operator(resp.size, '>', 0);
			    done();
			});
		});
	    });
	    describe ("gene", function () {
		it ("exists", function () {
		    assert.isDefined (cttvApiUrl.gene);
		});
		it ("retrieves information for a gene", function (done) {
		    var url = cttvApiUrl.gene({"gene_id" : data.gene});
		    myCttvApi.call(url)
			.then(function (resp) {
			    resp = JSON.parse(resp.text);
			    assert.isDefined(resp);
			    assert.isObject(resp);
			    assert.isDefined(resp.biotype);
			    assert.equal(resp.biotype, "protein_coding");
			    done();
			});
		});
	    });
	    describe ("association", function () {
		it ("exists", function () {
		    assert.isDefined (cttvApiUrl.associations);
		});
		it ("retrieves associations for a gene", function (done) {
		    var url = cttvApiUrl.associations({gene: data.gene, datastructure: "tree"});
		    myCttvApi.call(url)
			.then(function (resp) {
			    resp = JSON.parse(resp.text);
			    assert.isDefined(resp);
			    assert.isObject(resp);
			    assert.isDefined(resp.total);
			    assert.operator(resp.total, '>', 0);
			    assert.isDefined(resp.data);
			    done();
			});
		});
		it ("parses the response to json automatically", function (done) {
		    var url = cttvApiUrl.associations({gene: data.gene, datastructure: "tree"});
		    myCttvApi.call(url)
			.then(function (resp) {
			    assert.isDefined(resp.body);
			    assert.isObject(resp.body);
			    assert.isDefined(resp.body.data);
			    assert.isObject(resp.body.data);
			    done();
			});
		});
		it ("retrieves associations for a disease", function (done) {
		    var url = cttvApiUrl.associations({efo: data.efo, datastructure: "flat"});
		    myCttvApi.call(url)
			.then(function (resp) {
			    resp = JSON.parse(resp.text);
			    assert.isDefined(resp);
			    assert.isObject(resp);
			    assert.isDefined(resp.total);
			    assert.operator(resp.total, '>', 0);
			    assert.isDefined(resp.data);
			    done();
			});
		});
	    });
	    describe ("filterby", function () {
		it("exists", function () {
		    assert.isDefined(cttvApiUrl.filterby);
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
		myCttvApi.call(url)
		    .then(function (resp) {
			assert.isDefined(resp);
			assert.isObject(resp);
			done();
		    })
	    });
	    it ("receives data from the server", function (done) {
		var url = myCttvApi.url.filterby({gene:data.gene, size:10});
		myCttvApi.call(url)
		    .then(function (resp) {
			resp = JSON.parse(resp.text);
			assert.isDefined(resp);
			assert.isObject(resp);
			assert.isDefined(resp.took);
			assert.isDefined(resp.size);
			assert.operator(resp.size, '<=', 10);
			assert.isDefined(resp.data);
			assert.isArray(resp.data);
			done();
		    })
	    });
	});

	describe ("prefix", function () {
	    it ("exists", function () {
		assert.isDefined (myCttvApi.prefix);
	    });
	    it ("is a function", function () {
		assert.isFunction (myCttvApi.prefix);
	    });
	    it ("sets the prefixes for endpoints", function () {
		var prefix = 'http://127.0.0.1:8008/';
		myCttvApi.prefix(prefix);
		var url = myCttvApi.url.search({q: data.gene});
		assert.match(url, /^http:\/\/127.0.0.1:8008\//);
	    });
	});

    });
});
