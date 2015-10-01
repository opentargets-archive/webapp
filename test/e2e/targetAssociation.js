var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

// Test common sections
var commonTests = require("./common.js");


// Target Associations Page
var TargetAssociationPage = require("./Pages/TargetAssociationPage.js");
describe ('cttv target association page', function () {
    beforeEach(function () {
        this.timeout(5000);
        page = new TargetAssociationPage();
    });

    // Describe common sections
    commonTests();

    // Associations Header
    describe ('Associations header', function () {
        beforeEach(function () {
            header = page.header;
            // browser.waitForAngular();
        });
        it("exists", function () {
            expect(header.isPresent()).to.eventually.equal(true);
        });
        it ("has the correct message", function () {
            expect(header.getText()).to.eventually.contain("Diseases associated with BRAF");
        });
        it ("has the same number of associated disease as in the table", function () {
            page.selectTable;

            var text;
            // Wait for the number of diseases to update
            header.getText()
                .then(function (val) {
                    text = val;
                    return val;
                })
                .then(function (val) {
                    return page.tableHeader;
                })
                .then (function (tableHeader) {
                    return tableHeader.getText();
                })
                .then (function (tableVal) {
                    var nInHeader = text.split("\n")[1].split(" ")[1];
                    var nInTable = tableVal.split(" ")[5];
                    expect(nInHeader).to.be.equal(nInTable);
                });
        });

    });

    // Bubbles View
    describe ('bubbles view', function () {
        beforeEach(function () {
            bubbles = page.bubblesView;
        });
        it('the container exists', function () {
            expect(bubbles.isPresent()).to.eventually.equal(true);
        });
        it('the container renders a svg', function () {
            var svg = page.bubblesViewSvg;
            expect(svg.isPresent()).to.eventually.equal(true);
        });
        it('has dimensions', function () {
            var svg = page.bubblesViewSvg;
            expect(svg.getAttribute('width')).to.eventually.be.above(10);
            expect(svg.getAttribute('height')).to.eventually.be.above(10);
        });
        describe ('legend', function () {
            it ('is present', function () {
                var legend = page.bubblesViewLegend;
                expect(legend.isPresent());
            });
        });
    });
});
