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
    var prefixAutocomplete = "autocomplete?";

    var credentials = {
	token : "",
	appname : "",
	secret : ""
    };

    var getToken = function () {
	var tokenUrl = _.url.requestToken(credentials);
	console.log("TOKEN URL: " + tokenUrl);
		return jsonHttp.get({
		    "url": tokenUrl
		})
    }
    
    var _ = {};
    _.call = function (myurl, callback) {
		// No auth
		if ((!credentials.token) && (!credentials.appname) && (!credentials.secret)) {
		    console.log("    CttvApi running in non-authentication mode");
		    return jsonHttp.get({
			"url" : myurl
		    }, callback);
		}
		if (!credentials.token) {
		    console.log("No credential token, requesting one...");

		    return getToken()
			.then(function (resp) {
			    console.log("   ======>> Got a new token: " + resp.body.token);
			    //credentials.token = resp.body.token;
			    var headers = {
				"Auth-token": resp.body.token
			    }
			    var myPromise = jsonHttp.get ({
					"url": myurl,
					"headers": headers
			    }, callback).catch(function (err) {
				console.log(err);
			    });
			    return myPromise;

			});
		} else {
		    console.log("Current token is: " + credentials.token);
		    return jsonHttp.get({
				"url" : myurl,
				"headers": {
				    "Auth-token": credentials.token
				}
		    }, callback).catch(function (err) {
			// Logic to deal with expired tokens
			console.log("     --- Received an api error -- Possibly the token has expired, so I'll request a new one");
			console.log(err);
			credentials.token = "";
			return _.call(myurl, callback);
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

    // getter / setter for REST api prefix (TODO: Call it domain?)
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
		/*
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
		if (obj.filter != null) {
		    opts.push("filter=" + obj.filter);
		}
		return prefix + prefixSearch + opts.join ("&");
		*/
		return prefix + prefixSearch + parseUrlParams(obj);
    };

    _.url.associations = function (obj) {
		/*
		var opts = [];
		if (obj.gene != null) {
		    opts.push("gene=" + obj.gene);
		}
		if (obj.efo != null) {
		    opts.push("efo=" + obj.efo);
		}
		if (obj.datastructure != null) {
		    opts.push("datastructure=" + obj.datastructure);
		}

		return prefix + prefixAssociations + opts.join("&");
		*/
		return prefix + prefixAssociations + parseUrlParams(obj);
    };


    _.url.filterby = function (obj) {
		/*
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
		// TODO: this is taken care of in the parseUrlParams() function
		if (obj.datasource != null) {
		    opts.push("datasource=" + obj.datasource);
		}
		if (obj.fields != null) {
		    opts.push("fields=" + obj.fields);
		}
		return prefix + prefixFilterby + opts.join("&");
		*/

		return prefix + prefixFilterby + parseUrlParams(obj);
    };


    _.url.requestToken = function (obj) {
		return prefix + prefixToken + "appname=" + obj.appname + "&secret=" + obj.secret;
    };

    _.url.autocomplete = function (obj) {
		/*
		var opts = [];
		if (obj.size != null) {
		    opts.push("size=" + obj.size);
		}
		if (obj.q != null) {
		    opts.push("q=" + obj.q);
		}
		return prefix + prefixAutocomplete + opts.join ("&");
		*/
		return prefix + prefixAutocomplete + parseUrlParams(obj);
    };

    /**
     * This takes a params object and returns the params concatenated in a string.
     * If a parameter is an array, it adds each item, all with hte same key.
     * Example:
     *   obj = {q:'braf',size:20,filters:['id','pvalue']};
     *   console.log( parseUrlParams(obj) );
     *   // prints "q=braf&size=20&filters=id&filters=pvalue"
     */
    var parseUrlParams = function(obj){
    	var opts = [];
		for(var i in obj){
			if( obj.hasOwnProperty(i)){
				if(obj[i].constructor === Array){
					opts.push(i+"="+(obj[i].join("&"+i+"=")));
				} else {
					opts.push(i+"="+obj[i]);
				}
			}
		}
		return opts.join("&");
    }


    return _;
};

module.exports = cttvApi;
