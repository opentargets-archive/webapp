Polymer({
    height : "800",
    width : "800",
    target : "",
    targetChanged : function () {
	var _ = this;
	var shadowRoot = _.shadowRoot;
	d3.json("http://193.62.52.228/api/latest/evidences?gene="+_.target+"&datastructure=simple&size=1000&format=json", function (err, data) {
	    _.geneName = data.data[0]["biological_subject.gene_info.gene_name"];
	    _.nResults = data.size;
	    _.took = data.took / 1000;

	    var div = shadowRoot.getElementById("bubblesDiv");
	    var bView = bubblesView()
		.onclick(function (d) {
		    window.location.href="/app/#/associations?t=" + target + "&d=" + d.name;
		})
		.data(data.data)
		.height(_.height)
		.width(_.width);
	    bView(div);
	});
    },
});

