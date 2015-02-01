var nets = require("nets");

var cttvApi = function () {
    var prefix;
    if (this.location && this.location.hostname) {
	// browser present
	if (this.location.hostname === "127.0.0.1") {
	    prefix = "http://cttv:75djkwty4805hye@127.0.0.1:8008/api/latest/";
	} else {
	    prefix = "http://cttv:dj8mixijk04jpdg@193.62.52.228/api-docs";
	}
    } else {
	// No browser context
	prefix = "http://cttv:75djkwty4805hye@127.0.0.1:8008/api/latest/";	
    }
    var prefixFilterby = prefix + "filterby?";

    var _ = {};
    _.call = function (myurl, callback) {
	nets({
	    url : myurl
	    // headers : {
	    // 	"Authorization" : "Basic Y3R0djpkajhtaXhpamswNGpwZGc="
	    // }
	}, function (err, resp, body) {
	    if (err == null) {
		callback(resp.statusCode, JSON.parse(body));
	    }
	});
    };
    
    _.url = {};
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

	return prefixFilterby + opts.join("&");
    };

    return _;
};

module.exports = cttvApi;
