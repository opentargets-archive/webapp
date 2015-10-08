var Page = require("./Page.js");

var EvidencePage = function () {
    Page.call(this);
    browser.get("/evidence/ENSG00000169194/EFO_0000270"); // asthma + IL33
};

EvidencePage.prototype = Object.create(Page.prototype, {
    // Flower
    flowerContainer: {
        get: function () {
            return element(by.tagName("cttv-gene-disease-association"));
        }
    },
    flower: {
        get: function () {
            var flower = this.flowerContainer.element(by.tagName("svg"));
            this.waitForLoad(flower);
            return flower;
        }
    },
    flowerPetals: {
        get: function () {
            var petals = this.flower.all(by.css("path .petal"));
            return petals;
        }
    },
    flowerLabels: {
        get: function () {
            var labels = this.flower.all(by.tagName("text"));
            return labels;
        }
    }
});

module.exports = EvidencePage;
