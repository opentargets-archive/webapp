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
        this.timeout(15000);
        page = new TargetAssociationPage();
    });

    // Describe common sections
    commonTests();

    // Table view
    // describe ('Table view', function () {
    //
    // });

    // Associations Header
    describe ('Associations header', function () {
        beforeEach(function () {
            this.timeout(7000);
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
            this.timeout(15000);
            var text;
            page.selectTable
                .then ( function () {
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

    });

    // Bubbles View
    describe ('Bubbles view', function () {
        beforeEach(function () {
            this.timeout(10000);
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
            this.timeout(10000);
            var svg = page.bubblesViewSvg;
            expect(svg.getAttribute('width')).to.eventually.be.above(10);
            expect(svg.getAttribute('height')).to.eventually.be.above(10);
        });
        describe ('legend', function () {
            it ('is present', function () {
                this.timeout(10000);
                var legend = page.bubblesViewLegend;
                expect(legend.isPresent());
            });
        });
    });
});
