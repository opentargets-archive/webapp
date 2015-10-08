var express = require("express");
var serveStatic = require('serve-static');
var request = require('request');
var zlib = require('zlib');
var path = require("path");
var url = require('url');
//var unzip = require('unzip');

var app = express();

app
    .use(serveStatic(__dirname + "/../app"))
    // .use (['/api/latest/:id', '/api/latest/*/:id'], proxy ("http://127.0.0.1:8088", {
    //     forwardPath: function (req, res) {
    //         console.log(url.parse(req.url).path);
    //         var u = "http://127.0.0.1:8088" + req.originalUrl;
    //         console.log(u);
    //         return u;
    //     }
    // }))
    .get(['/api/latest/:id', '/api/latest/*/:id'], function (req, res) {

        var url = "http://127.0.0.1:8088" + req.originalUrl;
        //var url = "http://beta.targetvalidation.org" + req.originalUrl;

        request({
            uri: url,
        }, function (error, response, body) {
            if (response) {
                var encoding = response.headers['content-encoding'];
                res.status (response.statusCode);
                if (encoding === 'gzip') {
                    // res.setHeader('Content-Encoding', 'gzip');
                    // res.setHeader('Content-Length', response.headers['content-length']);
                    // res.setHeader('vary', 'Accept-Encoding');
                    // res.setHeader('x-api-took', '0');
                    res.send(response.body);
                    //res.send(unzip.Parse(response.body));
                } else {
                    //res.setHeader('Content-type', 'application/json');
                    res.send(JSON.parse(response.body));
                }
            } else {
                res
                .send(response);
            }
        });
        // req.pipe(request(url).pipe(res));
    })
    .get(['/proxy*'], function (req, res) {
        var url = "https://beta.targetvalidation.org" + req.originalUrl;
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
        var url = "https://beta.targetvalidation.org" + req.originalUrl;
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
