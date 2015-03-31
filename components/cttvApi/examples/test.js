var api = cttvApi()
    .prefix("http://localhost:8008/api/latest/")
//.token("eyJhbGciOiJIUzI1NiIsImV4cCI6MTQyNjYwNzYwNiwiaWF0IjoxNDI2NjA3MDA2fQ.IkNUNm4venI2NmxZTlQwL2JhN0lGSVcrRVA1MEo1aTJSVVk2RUxId3hjNTkzYmpNeElKZmp4V1VCRERXVkg4UW0rQ3dwVTN1QmsrWVR2Wmt0bUJHMmNEc2RWaVBWRVNWS3NxQXhpQzdqL1dBPSI.-A3hcnrY250eRbtY6YeX6yhLB6rtIUPwPQ-5dpx6n60")
    .appname("cttv-web-app")
    .secret("2J23T20O31UyepRj7754pEA2osMOYfFK");

var url = api.url.filterby({
    gene:"ENSG00000157764",
    //      datastructure:"simple",
    size:1000
});

console.log("Accessing filterby in url: " + url);

api.call(url)
    .then(function (resp) {
        console.log("RESP:");
        console.log(resp.body);
	console.log("MY TOKEN IS.... " + api.token());
    });

// api.call(anotherurl)
//     .then(f





// old
// api.call("http://beta.targetvalidation.org/api/latest/association?datastructure=tree")
//     .then(function (resp) {
// 	resp = JSON.parse(resp.text);
// 	console.log("NEW RESP:");
// 	console.log(resp);
//     })
     
