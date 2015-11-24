if (typeof tnt === "undefined") {
    module.exports = tnt = {};
}
tnt.board = require("tnt.genome");
tnt.utils = require("tnt.utils");
tnt.tooltip = require("tnt.tooltip");
tnt.ensembl = require("tnt.ensembl");

var targetGenomeBrowser = require("cttv.targetGenomeBrowser");
var bubblesView = require("cttv.bubblesView");
var geneAssociations = require("cttv.targetAssociations");
var geneAssociationsTree = require("cttv.targetAssociationsTree");
var flowerView = require("cttv.flowerView");
var diseaseGraph = require("cttv.diseaseGraph");
var targetGeneTree = require("cttv.targetGeneTree");
var cttvApi = require("cttv.api");
