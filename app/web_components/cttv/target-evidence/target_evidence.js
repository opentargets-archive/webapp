Polymer({
    height : "800",
    width : "800",
    target : "",
    targetChanged : function () {
	var _ = this;
	var shadowRoot = _.shadowRoot;
	var api = cttvApi();
	var url = api.url.filterby({
	    gene:_.target,
	    datastructure:"simple",
	    size:1000
	});
	console.log(url);
	api.call(url, function (status, resp) {
	    _.geneName = resp.data[0]["biological_subject.gene_info.gene_name"];

	    var div = shadowRoot.getElementById("bubblesDiv");
	    var bView = bubblesView()
		.onclick(function (d) {
		    window.location.href="/app/#/associations?t=" + target + "&d=" + d.name;
		})
		.data(resp.data)
		.height(_.height)
		.width(_.width);
	    bView(div);
	});
    },
});

