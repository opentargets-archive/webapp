var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

// Test common sections
var commonTests = require("./common.js");

// Evidence Page Object
var EvidencePage = require("./Pages/EvidencePage.js");
describe ('cttv target - disease evidence page', function () {
    beforeEach(function () {
        page = new EvidencePage();
    });

    // Describe common sections
    commonTests();

    // Flower
    describe ('flower', function () {
        beforeEach(function () {
            flower = page.flower;
        });
        it ("exists", function () {
            this.timeout(10000);
            expect(flower.isPresent()).to.eventually.equal(true);
        });
        it ("has labels in all the petals", function () {
            this.timeout(10000);
            var labels = page.flowerLabels;
            //var petals = page.flowerPetals;

            labels.filter (function (label) {
                return label.getText()
                    .then (function (text) {
                        return text !== "";
                    });
            })
            .then (function (nonEmptyLabels) { // An array
                expect(nonEmptyLabels.length).to.equal(7);
                //expect(petals.count()).to.eventually.equal(nonEmptyLabels.length);
            });

        });
    });

});
