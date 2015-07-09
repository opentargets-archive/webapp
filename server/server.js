var express = require("express");
var serveStatic = require('serve-static');
var request = require('request');
var path = require("path");

var app = express();
app
    .use(serveStatic(__dirname + "/../app"))
    .get(['/api/latest/:id', '/api/latest/*/:id'], function (req, res) {
        var url = "http://127.0.0.1:8008" + req.originalUrl;
        // var url = "http://beta.targetvalidation.org/" + req.originalUrl;
        request({
            uri: url,
            headers : req.headers
        }, function (error, response, body) {
            if (response) {
                res
                    .status(response.statusCode)
                    .send(JSON.parse(body));
                    //.send(body);
            } else {
                res.send(response);
            }
        });
        //req.pipe(request(url).pipe(res));
    })
    .get(['/proxy*'], function (req, res) {
        var url = "http://127.0.0.1:8080" + req.originalUrl;
        // console.log (url);
        // request ({
        //     uri: url,
        //     //encoding: null,
        //     headers: req.headers
        // }, function (error, response, body) {
        //     console.log("//");
        //     console.log(body);
        //     if (response) {
        //         console.log("status code:");
        //         console.log(response.statusCode);
        //         res
        //             .set(response.headers)
        //             .status(response.statusCode)
        //             .send(JSON.parse(body));
        //             //.send(body);
        //     } else {
        //         res.send(response);
        //     }
        // });
        req.pipe(request(url)).pipe(res);
    })
    .post(['/proxy*'], function (req, res) {
        var url = "http://127.0.0.1:8080" + req.originalUrl;
        req.pipe(request(url)).pipe(res);
    })
    // .get('/api/latest/auth/:id', function (req, res) {
    // 	console.log("REQUEST TOKEN");
    // })

    // Enable HTML5Mode
    .all('/*', function(req, res) {
        // Just send the index.html for other files to support HTML5Mode
        res.sendFile(path.normalize(__dirname + '/../app/index.html'));
    })
    .listen(8000);
console.log("Connected to 127.0.0.1:8000");
