(function () {
    //var prefix = "http://beta.targetvalidation.org";
    var prefix = "http://127.0.0.1:8080";
    // jQuery.ajax(prefix + "/api/latest/filterby?gene=ENSG00000157764&size=1000&auth_token=eyJhbGciOiJIUzI1NiIsImV4cCI6MTQyNjY4MjI4MiwiaWF0IjoxNDI2NjgxNjgyfQ.ImREK3k3VjExbDYyZGk3QkVwUWJqc0cyZXJ6ODZMMDNPbkczT2dnOUVZNElsNFNjYlBXaU8yb2NTKzJ5L09HZzAvZjhnZW4rNEdNYUZ3QXc4TGwwcEgxUXVQWk85Y2ZzZ2dMRnhyU1N5dURZPSI.xKLz6gEM4pyYgFR5G5lRSZOSkuEsIho6UgSbps_I0KU",{
    jQuery.ajax(prefix + "/api/latest/filterby?gene=ENSG00000157764&size=1000", {
    	method : "GET",
    	beforeSend : function (xhr) {
	    xhr.setRequestHeader("Content-Type", "text/plain");
    	    xhr.setRequestHeader("Authorization", "eyJhbGciOiJIUzI1NiIsImV4cCI6MTQyNjY5MzMwNywiaWF0IjoxNDI2NjkyNzA3fQ.Im5kTFJiSFBuRFB1RjV6cUFyUkRmSW54Nkc3L01Db2JRVXhTbWFOV2RpQmVHNUNqT1h3UndLYy82eWFMZ01XenRZS3BPYTR5djRKamhTN2xhUGttREkxYXpqUTBDYU5DWkdpUm9WMHJ2RUhvPSI.RbByG_EWXJ2sx0pokxAhYrT8A8UIsNa3gKmLkLcH-h4")
    	},
	
	"complete" : function (resp, x) {
	    console.log(x);
	    console.log(resp);
	}
    })
})();
