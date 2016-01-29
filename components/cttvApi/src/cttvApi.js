var http = require("httpplease");
var promises = require('httpplease-promises');
var Promise = require('es6-promise').Promise;
var json = require("httpplease/plugins/json");
jsonHttp = http.use(json).use(promises(Promise));
http = http.use(promises(Promise));

var cttvApi = function () {

    var credentials = {
        token : "",
        appname : "",
        secret : ""
    };

    var onError = function (err) {
        console.log(err);
    };

    var getToken = function () {
        var tokenUrl = _.url.requestToken(credentials);
        //console.log("TOKEN URL: " + tokenUrl);
        return jsonHttp.get({
            "url": tokenUrl
        });
    };

    var _ = {};
    _.call = function (myurl, callback, data) {
        // No auth
        if ((!credentials.token) && (!credentials.appname) && (!credentials.secret)) {
            console.log("    CttvApi running in non-authentication mode");
            if (data){ // post
                return jsonHttp.post({
                    "url": myurl,
                    "body": data
                });
            }
            return jsonHttp.get({
                "url" : myurl
            }, callback);
        }
        if (!credentials.token) {
            //		    console.log("No credential token, requesting one...");

            return getToken()
                .then(function (resp) {
                    //console.log("   ======>> Got a new token: " + resp.body.token);
                    //credentials.token = resp.body.token;
                    var headers = {
                        "Auth-token": resp.body.token
                    };
                    var myPromise;
                    if (data) { // post
                        myPromise = jsonHttp.post ({
                            "url": myurl,
                            "headers": headers,
                            "body": data
                        });
                    } else { // get
                        myPromise = jsonHttp.get ({
                            "url": myurl,
                            "headers": headers
                        }, callback).catch(onError);

                    }
                    return myPromise;

                });
        } else {
            //		    console.log("Current token is: " + credentials.token);
            return jsonHttp.get({
                "url" : myurl,
                "headers": {
                    "Auth-token": credentials.token
                }
            }, callback).catch(function (err) {
                // Logic to deal with expired tokens
                // console.log("     --- Received an api error -- Possibly the token has expired, so I'll request a new one");
                onError(err);
                credentials.token = "";
                return _.call(myurl, callback, data);
            });
        }
    };

    _.onError = function (cbak) {
        if (!arguments.length) {
            return onError;
        }
        onError = cbak;
        return this;
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

    // prefixes
    var prefix = "https://www.targetvalidation.org/api/latest/";
    var prefixFilterby = "public/evidence/filterby?";
    var prefixAssociations = "public/association/filterby?";
    var prefixSearch = "public/search?";
    var prefixGene = "private/target/";
    var prefixDisease = "private/disease/"; // updated from "efo" to "disease"
    var prefixToken = "public/auth/request_token?";
    var prefixAutocomplete = "private/autocomplete?";
    var prefixQuickSearch = "private/quicksearch?";
    var prefixExpression = "private/expression?";
    var prefixProxy = "proxy/generic/";
    var prefixTarget = "private/target/"; // this replaces prefixGene

    _.url.gene = function (obj) {
        return prefix + prefixGene + obj.gene_id;
    };

    _.url.target = function (obj) {
        return prefix + prefixTarget + obj.target_id;
    };

    _.url.disease = function (obj) {
        return prefix + prefixDisease + obj.code;
    };

    _.url.search = function (obj) {
        return prefix + prefixSearch + parseUrlParams(obj);
    };

    _.url.associations = function (obj) {
        return prefix + prefixAssociations + parseUrlParams(obj);
    };


    _.url.filterby = function (obj) {
        return prefix + prefixFilterby + parseUrlParams(obj);
    };


    _.url.requestToken = function (obj) {
        return prefix + prefixToken + "appname=" + obj.appname + "&secret=" + obj.secret;
    };

    _.url.autocomplete = function (obj) {
        return prefix + prefixAutocomplete + parseUrlParams(obj);
    };

    _.url.quickSearch = function (obj) {
        return prefix + prefixQuickSearch + parseUrlParams(obj);
    };

    _.url.expression = function (obj) {
        return prefix + prefixExpression + parseUrlParams(obj);
    };

    _.url.proxy = function (obj) {
        return prefix + prefixProxy + obj.url;
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
    };


    return _;
};

module.exports = cttvApi;
