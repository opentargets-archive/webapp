//var nets = require("nets");
var httpplease = require("httpplease");
var promises = require('httpplease-promises');
var Promise = require('es6-promise').Promise
http = httpplease.use(promises(Promise));

var cttvApi = function () {
    // This was needed when authentication was included in the elasticsearch api
    // var prefix;
    // if (this.location && this.location.hostname) {
    // 	// browser present
    // 	if (this.location.hostname === "127.0.0.1") {
    // 	    prefix = "http://cttv:75djkwty4805hye@127.0.0.1:8008/api/latest/";
    // 	} else {
    // 	    prefix = "http://cttv:dj8mixijk04jpdg@193.62.52.228/api/latest/";
    // 	}
    // } else {
    // 	// No browser context
    // 	prefix = "http://cttv:75djkwty4805hye@127.0.0.1:8008/api/latest/";	
    // }
    var prefix = "http://193.62.52.228/api/latest/";
    var prefixFilterby = prefix + "filterby?";
    var prefixAssociations = prefix + "association?"
    var prefixSearch = prefix + "search?";

    var _ = {};
    _.call = function (myurl) {
	return http.get({
	    "url" : myurl
	});
    };
    // _.call = function (myurl, callback) {
    // 	http.get({
    // 	    url: myurl
    // 	}, function (err, resp) {
    // 	    if (err == null) {
    // 		callback (resp.status, JSON.parse(resp.body));
    // 	    }
    // 	});
    // };
    
    _.url = {};
    _.url.search = function (obj) {
	var opts = [];
	if (obj.from != null) {
	    opts.push("from=" + obj.from);
	}
	if (obj.size != null) {
	    opts.push("size=" + obj.size);
	}
	if (obj.q != null) {
	    opts.push("q=" + obj.size);
	}
	if (obj.format != null) {
	    opts.push("format=" + obj.format);
	}
	return prefixSearch + opts.join ("&");
    };
    _.url.associations = function (obj) {
	var opts = [];
	if (obj.gene != null) {
	    opts.push("gene=" + obj.gene);
	} else if (obj.efo != null) {
	    opts.push("efo=" + obj.efo);
	}

	return prefixAssociations + opts.join("&");
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

	return prefixFilterby + opts.join("&");
    };

    return _;
};

module.exports = cttvApi;
