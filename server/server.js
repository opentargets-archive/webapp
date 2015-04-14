var express = require("express");
var serveStatic = require('serve-static');
var request = require('request');

var app = express();
app
    .use(serveStatic(__dirname + "/../app"))
    .get('/api/latest/:id', function (req, res) {
	//var url = "http://127.0.0.1:8008" + req.originalUrl;
	var url = "http://beta.targetvalidation.org/" + req.originalUrl;
	console.log("API CALL: " + url);
	request(url, function (error, response, body) {
	    res.send(JSON.parse(body));
	});
    })
    .listen(9572);
console.log("Connected to 127.0.0.1:8000");
