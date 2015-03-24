var http = require("httpplease");
var promises = require('httpplease-promises');
var Promise = require('es6-promise').Promise;
var json = require("httpplease/plugins/json");
jsonHttp = http.use(json).use(promises(Promise));
http = http.use(promises(Promise));

var cttvApi = function () {
    // prefixes
    var prefix = "http://beta.targetvalidation.org/api/latest/";
    var prefixFilterby = "filterby?";
    var prefixAssociations = "association?";
    var prefixSearch = "search?";
    var prefixGene = "gene/";
    var prefixDisease = "efo/";
    var prefixToken = "auth/request_token?";

    var credentials = {
	token : "",
	appname : "",
	secret : ""
    };

    var _ = {};
    _.call = function (myurl) {
	console.log("CREDENTIALS TOKEN IS: " + credentials.token);
	if (!credentials.token) {
	    var tokenUrl = _.url.requestToken(credentials);
	    return http.get({
		"url": tokenUrl
	    }).then (function (resp) {
		console.log("GOT A NEW TOKEN: " + resp.body);
		credentials.token = resp.body.replace(/"/g, "");
	    }).then (function () {
		return jsonHttp.get({
		    "url": myurl,
		    "headers": {
			//"withCredentials": true,
			//"X-Auth-Token": credentials.token
			//"auth-token": credentials.token
			"X-Auth-token": "eyJhbGciOiJIUzI1NiIsImV4cCI6MTQyNjYxMjEyOSwiaWF0IjoxNDI2NjExNTI5fQ.IlcwVmN0VmprdFJQZE9iRE5UTGhVWlJVeGc3YU9VaEFKU0t0bnVuMmU2VTcyK0dhbkx5eVNJZnZ0MVVhVmljSCtIOHQ2NkpvMVFvMGQ2TjNEbEVhN0gwazRvTitoR0dQUWxQeE9pVFkweXFnPSI.iaa6E8u4Xx2IrSpuWqJnWjUc9jnrEinM_R0Uj6f34xY"
		    }
		});
	    });
		//return _.call(myurl)
		// return jsonHttp.get({
		//      "url": myurl,
		//      "headers": {
		// 	 "X-Auth-token": credentials.token
		//      }
		// });
	} else {
	    return jsonHttp.get({
		"url" : myurl,
		"headers": {
		    "X-Auth-token": credentials.token
		}
	    });
	}
    };
    
    // Credentials API
    _.appname = function (name) {
	if (!arguments.length) {
	    return credentials.appname;
	}
	credentials.appname = name;
	return this;
    };

    _.secret = function (sec) {
	if (!arguments.length) {
	    return credentials.secret;
	}
	credentials.secret = sec;
	return this;
    };
    
    _.token = function (tok) {
	if (!arguments.length) {
	    return credentials.token;
	}
	credentials.token = tok;
	return this;
    };

    // getter / setter for REST api prefix
    _.prefix = function (dom) {
	if (!arguments.length) {
	    return prefix;
	}
	prefix = dom;
	return this;
    };
    
    // URL object
    _.url = {};
    _.url.gene = function (obj) {
	return prefix + prefixGene + obj.gene_id;
    };
    _.url.disease = function (obj) {
	return prefix + prefixDisease + obj.efo;
    };
    _.url.search = function (obj) {
	var opts = [];
	if (obj.from != null) {
	    opts.push("from=" + obj.from);
	}
	if (obj.size != null) {
	    opts.push("size=" + obj.size);
	}
	if (obj.q != null) {
	    opts.push("q=" + obj.q);
	}
	if (obj.format != null) {
	    opts.push("format=" + obj.format);
	}
	return prefix + prefixSearch + opts.join ("&");
    };
    _.url.associations = function (obj) {
	var opts = [];
	if (obj.gene != null) {
	    opts.push("gene=" + obj.gene);
	} else if (obj.efo != null) {
	    opts.push("efo=" + obj.efo);
	}
	if (obj.datastructure != null) {
	    opts.push("datastructure=" + obj.datastructure);
	}

	return prefix + prefixAssociations + opts.join("&");
    };
    _.url.filterby = function (obj) {
	var opts = [];
	if (obj.efo != null) {
	    opts.push("efo=" + obj.efo);
	}
	if (obj.gene != null) {
	    opts.push("gene=" + obj.gene);
	}
	if (obj.eco != null) {
	    opts.push("eco=" + obj.eco);
	}
	if (obj.size != null) {
	    opts.push("size=" + obj.size);
	}
	if (obj.from != null) {
	    opts.push("from=" + obj.from);
	}
	if (obj.datastructure != null) {
	    opts.push("datastructure=" + obj.datastructure);
	}
	// TODO: Since we know in advance the possible names of the datasources we can add a check here
	// Taking into account that we may have more than one!
	if (obj.datasource != null) {
	    opts.push("datasource=" + obj.datasource);
	}
	if (obj.fields != null) {
	    opts.push("fields=" + obj.fields);
	}

	return prefix + prefixFilterby + opts.join("&");
    };
    _.url.requestToken = function (obj) {
	return prefix + prefixToken + "appname=" + obj.appname + "&secret=" + obj.secret;
    };

    return _;
};

module.exports = cttvApi;
