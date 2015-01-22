var XMLHttpRequest = require ("xmlhttprequest").XMLHttpRequest;

var cttvApi = function () {
    // Prefixes
    var prefix = "http://193.62.52.228/api/latest/";
    //var prefix = "http://127.0.0.1:8008/api/latest/";
    var prefix_filterby = prefix + "filterby?";

    var _ = {};
    // callback should be function (error, success) {}
    _.call = function (url, callback) {
	var xhr = new XMLHttpRequest;
	xhr.onreadystatechange = function () {
	    if (this.readyState === 4) {
		callback (this.status, JSON.parse(this.responseText));
	    }
	}
	xhr.open ("GET", url);
	xhr.send();
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

	return prefix_filterby + opts.join("&");
    };

    return _;
};

module.exports = cttvApi;
