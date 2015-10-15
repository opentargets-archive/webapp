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
    // commonTests(); // TODO: comment back once ready

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


    // Target info box
    describe ('overview', function(){
        beforeEach(function () {
            this.timeout(10000);
            overview = page.overview;
            overviewItems = page.overviewItems;
        });

        it ("exists", function () {
            this.timeout(10000);
            expect(overview.isPresent()).to.eventually.equal(true);
        });

        it ("has items", function () {
            this.timeout(10000);
            expect(overviewItems.getText().count()).to.eventually.equal(2);
        });

        it ("has target info", function(){
            this.timeout(10000);
            expect( overviewItems.first().element(by.tagName('h5')).getText() ).to.eventually.not.be.empty;
        });

        it ("has disease info", function(){
            this.timeout(10000);
            expect( overviewItems.last().element(by.tagName('h5')).getText() ).to.eventually.not.be.empty;
        });
    });





});

