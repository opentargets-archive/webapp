

// var api = cttvApi();
// api.call (api.url.associations({
// 	gene: "ENSG00000157764",
// 	datastructure: "tree"
// }))
//     .then (function (resp) {
var theme = geneAssociationsTree()
//.data(resp.body.data);
    .target("ENSG00000157764")
    .cttvApi(cttvApi())
    .diameter(1200)
theme(flowerView(), document.getElementById("mydiv"));
// });
    
