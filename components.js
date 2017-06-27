if (typeof tnt === "undefined") {
    module.exports = tnt = {};
}
tnt.board = require("tnt.genome");
tnt.utils = require("tnt.utils");
tnt.tooltip = require("tnt.tooltip");
//tnt.ensembl = require("tnt.ensembl");
tnt.rest = require("tnt.rest");

var targetGenomeBrowser = require("cttv.genome");
// var bubblesView = require("cttv.bubblesView");
// var geneAssociations = require("cttv.targetAssociations");
var targetAssociations = require("cttv.targetAssociationsBubbles"); // new bubbles view
var geneAssociationsTree = require("cttv.targetAssociationsTree");
var flowerView = require("cttv.flowerView");



var diseaseGraph = require("cttv.diseaseGraph");
var targetGeneTree = require("cttv.targetGeneTree");

// TODO: check if we need this after D3v4 merge
// var cttvDiseaseRelations = require("viz_diseases");

// var targetListBubbles = require("cttv.expansionView");
var cttvApi = require("cttv.api");

var spinner = require("cttv.spinner");