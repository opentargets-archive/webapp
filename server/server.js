var express = require("express");
var serveStatic = require('serve-static');
var request = require('request');

var app = express();
app
    .use(serveStatic(__dirname + "/../app"))
    .get(['/api/latest/:id', '/api/latest/*/:id'], function (req, res) {
	var url = "http://127.0.0.1:8080" + req.originalUrl;
	//var url = "http://beta.targetvalidation.org/" + req.originalUrl;
	request({
	    uri: url,
	    headers : req.headers
	}, function (error, response, body) {
	    if (response) {
		res.status(response.statusCode)
		    .send(JSON.parse(body));
	    } else {
		res.send(response);
	    }
	});
    })
    // .get('/api/latest/auth/:id', function (req, res) {
    // 	console.log("REQUEST TOKEN");
    // })
    .listen(8000);
console.log("Connected to 127.0.0.1:8000");
